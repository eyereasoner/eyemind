// The certificate of a proof: every answer of a call, and every derived fact.
//
// For each call a question's search makes, a call table lists every answer,
// in search order: called(Call, Answers). For each relation that forward
// rules derive and the search consulted, a listing lists every derived fact:
// derived(Pattern, Facts). A table is checked by expanding its call one level
// against the program, as a search would, with every inner call answered by
// the table of that call, so no table vouches for itself and a wrong one shows
// as a disagreement. A listing is checked by closure: under the listed facts
// no forward rule derives a fact of that relation the listing leaves out; its
// facts' own firings are replayed separately. Nothing is searched for.
//
// The order of derived facts cannot be checked this way, so a collection or
// a once/1 whose answers rest on a listing cannot be established.
import { PRIMITIVE_KEYS, primitive } from './builtins.js';
import { freshClause, sameVariant, text, variant } from './common.js';
import { INSPECTION_KEYS } from './inspection.js';
import { Lettering, write } from './writer.js';
import {
  Env, EyemindError, Struct, Var, copyResolved, deref, flattenConjunction, freshTerm, identity, isCallable, isGround, key,
  isGroundButAnonymous, listFromItems, sortCollected, unify, variables,
} from './terms.js';

// Terms as a failure message shows them, variables lettered A, B, ... across
// them all.
function shown(...terms) {
  const lettering = new Lettering(true);
  return terms.map((term) => write(term, null, lettering));
}

// A search the certificate cannot establish.
export class Unsettled extends Error {}

// What one expansion relied on: the tables it read, the listings it read,
// the tables whose answer order it needed, and whether it read the source
// rule catalogue or a derived pattern, the only sources of the variables a
// derived pattern keeps.
export class Reliance {
  constructor(ordered = false) {
    this.tables = new Set();
    this.listings = new Set();
    this.ordered = new Set();
    this.inner = ordered ? 1 : 0;
    this.inspected = false;
  }
}

// How a listing identifies a fact: a ground fact by identity, a derived
// pattern up to the renaming of its variables (Section 6.3).
function listedKey(fact) {
  return isGround(fact) ? identity(fact) : `pattern ${variant(fact)}`;
}

// Whether the generators of a rule appended by a template fire as ordinary
// rules: no restricted guard, whose firings depend on the order of rule
// applications, and no witnesses, which the derived rule would share.
export function plainGenerators(program, clause) {
  return clause.scopeIds.every((id) => {
    const generator = program.byId.get(id);
    return !generator || (generator.guard === null && !generator.witnessNames.length);
  });
}

// The name and arity of every relation a forward rule concludes.
export function forwardKeys(program) {
  const keys = new Set();
  for (const clause of program.forward) {
    for (const head of clause.plainHeads) {
      if (isCallable(head) && head !== 'true' && head !== 'false') keys.add(key(head));
    }
  }
  return keys;
}

// Answers calls from a source of certificate statements: answers(call)
// gives the answers listed for a call, or null; facts(goalKey) the facts
// listed for a relation forward rules derive, or null. Calls and answers are
// compared up to renaming that keeps anonymous variables anonymous, since a
// named unbound variable makes a negation an error. Tables and listings are
// checked once, however many calls rest on them.
export class Settler {
  constructor(program, source) {
    this.program = program;
    this.source = source;
    this.derivedKeys = forwardKeys(program);
    this.tables = new Map();
    this.listings = new Map();
    this.serial = 0;
    this.variant = (term) => variant(term, true);
  }

  // Every answer of a call, as its search finds them with the bindings it
  // has when it runs; inner calls come only from the certificate. The
  // outcome: status 'settled', 'unsettled' or 'failed', the failures as
  // [detail, term] pairs, the answers, the tables and listings consulted,
  // and whether the search read inspected rules or derived patterns.
  answers(call) {
    const root = new Reliance();
    const outcome = { status: 'settled', failures: [], tables: [], listings: [], inspected: false };
    const found = [];
    try {
      const env = new Env();
      const copied = freshTerm(call, `root${++this.serial}`);
      for (const _ of this.solve(copied, env, root)) { // eslint-disable-line no-unused-vars
        found.push(freshTerm(copyResolved(copied, env), `item${++this.serial}`));
      }
    } catch (error) {
      if (error instanceof Unsettled) return { ...outcome, status: 'unsettled' };
      if (!(error instanceof EyemindError)) throw error;
      outcome.failures.push([`the search of ${shown(call)} leads to an error: ${error.message}`, call]);
    }
    let unsettled = false;
    const tables = new Set();
    const listings = new Set();
    const ordered = new Set(root.ordered);
    const pendingTables = [...root.tables];
    const pendingListings = [];
    while (pendingTables.length || pendingListings.length) {
      const fromTable = pendingTables.length > 0;
      const entryKey = fromTable ? pendingTables.pop() : pendingListings.pop();
      const seen = fromTable ? tables : listings;
      if (seen.has(entryKey)) continue;
      seen.add(entryKey);
      const entry = fromTable ? this.checkTable(entryKey) : this.checkListing(entryKey);
      if (entry.unsettled) unsettled = true;
      if (fromTable && entry.reliance.inspected) outcome.inspected = true;
      if (entry.failure !== null) {
        // A table or listing that fails is reported for the first boundary
        // resting on it; later ones fail with it, without repeating it.
        if (!entry.reported) outcome.failures.push([entry.failure, entry.subject]);
        entry.reported = true;
        outcome.failed = true;
      }
      pendingTables.push(...entry.reliance.tables);
      pendingListings.push(...entry.reliance.listings);
      for (const item of entry.reliance.ordered) ordered.add(item);
    }
    outcome.tables = [...tables];
    outcome.listings = [...listings];
    const circular = this.checkDependencies(tables);
    if (circular !== null) {
      outcome.failures.push([`the call tables are circular at ${shown(circular.call)}`, circular.call]);
    }
    if (root.inspected) outcome.inspected = true;
    if (outcome.failures.length || outcome.failed) return { ...outcome, status: 'failed' };
    if (unsettled || [...ordered].some((item) => !this.exactness.get(item))) return { ...outcome, status: 'unsettled' };
    return { ...outcome, answers: found };
  }

  // Each solution of a goal, its bindings made in env and undone before the
  // next one, as a search finds them; inner calls are answered by tables.
  * solve(goal, env, reliance) {
    goal = deref(goal, env);
    if (goal instanceof Var) throw new EyemindError('a called variable must be bound');
    if (!isCallable(goal)) throw new EyemindError(`expected a callable goal, got ${text(goal)}`);
    const goalKey = key(goal);
    const mark = env.mark();
    if (goalKey === 'and/2') {
      for (const _ of this.solve(goal.args[0], env, reliance)) yield* this.solve(goal.args[1], env, reliance); // eslint-disable-line no-unused-vars
    } else if (goalKey === 'or/2') {
      yield* this.solve(goal.args[0], env, reliance);
      yield* this.solve(goal.args[1], env, reliance);
    } else if (goalKey === 'call/1') {
      yield* this.solve(goal.args[0], env, reliance);
    } else if (goalKey === 'once/1' || goalKey === 'not/1') {
      const once = goalKey === 'once/1';
      if (!once && !isGroundButAnonymous(goal.args[0], env)) {
        throw new EyemindError('negation has an unbound named variable');
      }
      if (once) reliance.inner++;
      const inner = this.solve(goal.args[0], env, reliance);
      const first = inner.next();
      if (once) reliance.inner--;
      if (once && !first.done) yield;
      inner.return();
      env.undo(mark);
      if (!once && first.done) yield;
    } else if (goalKey === 'findall/3' || goalKey === 'findall_sorted/3') {
      const sorting = goalKey === 'findall_sorted/3';
      const items = [];
      // A sorted collection relies on the order of its tables only when an
      // item has variables, which can make items equal up to their variables.
      const inner = sorting ? new Reliance() : reliance;
      if (!sorting) reliance.inner++;
      for (const _ of this.solve(goal.args[1], env, inner)) { // eslint-disable-line no-unused-vars
        items.push(freshTerm(copyResolved(goal.args[0], env), `collection${++this.serial}`));
      }
      if (sorting) {
        for (const item of inner.tables) reliance.tables.add(item);
        for (const item of inner.listings) reliance.listings.add(item);
        for (const item of inner.ordered) reliance.ordered.add(item);
        if (!items.every((item) => isGround(item))) for (const item of inner.tables) reliance.ordered.add(item);
      } else {
        reliance.inner--;
      }
      env.undo(mark);
      if (unify(goal.args[2], listFromItems(sorting ? sortCollected(items) : items), env)) yield;
    } else if (PRIMITIVE_KEYS.has(goalKey)) {
      // Relative names of unbound variables are not preserved by alpha
      // renaming of a table. A name-dependent comparison needs more evidence.
      if (goalKey === 'compare/3' &&
          (!isGround(goal.args[1], env) || !isGround(goal.args[2], env))) throw new Unsettled();
      for (const _ of primitive(goal, env)) { // eslint-disable-line no-unused-vars
        yield;
        env.undo(mark);
      }
    } else if (INSPECTION_KEYS.has(goalKey)) {
      // The catalogue of source rules, in source order, each renamed apart:
      // its variables are scoped pattern variables (Section 6.3).
      reliance.inspected = true;
      for (const source of this.program.inspections.get(goalKey) || []) {
        if (unify(goal, freshTerm(source.term, `inspect${++this.serial}`), env)) yield;
        env.undo(mark);
      }
    } else if (!this.derivedKeys.has(goalKey) &&
               (this.program.groups.get(goalKey) || []).every((clause) => !clause.body.length && clause.parentId === null)) {
      // Facts alone are scanned where they stand, with no table needed.
      yield* this.expand(goal, env, reliance);
    } else {
      const call = copyResolved(goal, env);
      const callKey = this.variant(call);
      let entry = this.tables.get(callKey);
      if (entry === undefined) {
        const answers = this.source.answers(call);
        if (answers === null) throw new Unsettled();
        entry = { call, answers, checked: false, failure: null, subject: call, unsettled: false, reported: false, reliance: null };
        this.tables.set(callKey, entry);
      }
      reliance.tables.add(callKey);
      if (reliance.inner) reliance.ordered.add(callKey);
      for (const answer of entry.answers) {
        if (unify(goal, freshTerm(answer, `answer${++this.serial}`), env)) yield;
        env.undo(mark);
      }
    }
    env.undo(mark);
  }

  // A call expanded one level, as a search would: the derived facts of its
  // relation in the order derived, then the program's facts and backward
  // rules in clause order, each rule's body solved in its place.
  * expand(call, env, reliance) {
    const goalKey = key(call);
    const mark = env.mark();
    if (this.derivedKeys.has(goalKey)) {
      const facts = this.listing(goalKey);
      reliance.listings.add(goalKey);
      for (const fact of facts) {
        // A derived pattern is freshened at every use.
        if (!isGround(fact)) reliance.inspected = true;
        if (unify(call, isGround(fact) ? fact : freshTerm(fact, `pattern${++this.serial}`), env)) yield;
        env.undo(mark);
      }
    }
    const clauses = this.program.hasTemplates ? this.program.groups.get(goalKey) || []
      : this.program.candidates(call, env, goalKey);
    for (const clause of clauses) {
      if (clause.parentId !== null) {
        yield* this.instances(clause, call, env, reliance);
        continue;
      }
      const [head, body] = freshClause(clause, `clause${++this.serial}`);
      if (unify(call, head, env)) yield* this.solveAll(body, 0, env, reliance);
      env.undo(mark);
    }
  }

  // A backward rule appended by a template answers through its instances:
  // one for each solution of its generator's body with captures not met
  // before, in the order the generator found them, each searching only the
  // template's body. The generator ran with none of the caller's bindings,
  // so its body is solved before the head meets the call. Its order is the
  // order of the run only when it consults no derived facts or tables.
  * instances(clause, call, env, reliance) {
    // Without its generator in the program, a rule has no instances.
    if (!clause.scopeIds.every((id) => this.program.byId.has(id))) return;
    if (!plainGenerators(this.program, clause)) throw new Unsettled();
    const mark = env.mark();
    const [head, body, names] = freshClause(clause, `clause${++this.serial}`);
    const captures = listFromItems(clause.captures.map((name) => names.get(name) ?? new Var(name)));
    const generator = new Reliance();
    const seen = new Set();
    for (const _ of this.solveAll(body.slice(0, clause.prefixLength), 0, env, generator)) { // eslint-disable-line no-unused-vars
      if (generator.tables.size || generator.listings.size) throw new Unsettled();
      const values = copyResolved(captures, env);
      if (!isGround(values)) throw new Unsettled();
      const id = identity(values);
      if (seen.has(id)) continue;
      seen.add(id);
      const inner = env.mark();
      if (unify(call, head, env)) yield* this.solveAll(body.slice(clause.prefixLength), 0, env, reliance);
      env.undo(inner);
    }
    if (generator.tables.size || generator.listings.size) throw new Unsettled();
    env.undo(mark);
  }

  * solveAll(goals, index, env, reliance) {
    if (index === goals.length) {
      yield;
      return;
    }
    for (const _ of this.solve(goals[index], env, reliance)) yield* this.solveAll(goals, index + 1, env, reliance); // eslint-disable-line no-unused-vars
  }

  listing(goalKey) {
    let entry = this.listings.get(goalKey);
    if (entry === undefined) {
      const facts = this.source.facts(goalKey);
      if (facts === null) throw new Unsettled();
      entry = { facts, checked: false, failure: null, subject: null, unsettled: false, reported: false, reliance: null };
      this.listings.set(goalKey, entry);
    }
    return entry.facts;
  }

  // A table holds when expanding its call gives exactly its answers, in order.
  checkTable(callKey) {
    const entry = this.tables.get(callKey);
    if (entry.checked) return entry;
    entry.checked = true;
    entry.reliance = new Reliance();
    try {
      const call = freshTerm(entry.call, `table${++this.serial}`);
      const env = new Env();
      const found = [];
      for (const _ of this.expand(call, env, entry.reliance)) found.push(copyResolved(call, env)); // eslint-disable-line no-unused-vars
      const listed = entry.answers;
      let i = 0;
      while (i < found.length && i < listed.length && sameVariant(found[i], listed[i], true)) i++;
      if (i < found.length && i < listed.length) {
        const [call, answer, listing] = shown(entry.call, found[i], listed[i]);
        entry.failure = `the search of ${call} answers ${answer} where its table lists ${listing}`;
      } else if (i < found.length) {
        const [call, answer] = shown(entry.call, found[i]);
        entry.failure = `the table of ${call} leaves out the answer ${answer}`;
      } else if (i < listed.length) {
        const [call, listing] = shown(entry.call, listed[i]);
        entry.failure = `the table of ${call} lists ${listing}, which its search does not answer`;
      }
    } catch (error) {
      if (error instanceof Unsettled) entry.unsettled = true;
      else if (error instanceof EyemindError) entry.failure = `the search of ${shown(entry.call)} leads to an error: ${error.message}`;
      else {
        // Checked again once whatever interrupted it is dealt with.
        entry.checked = false;
        throw error;
      }
    }
    return entry;
  }

  // A listing holds when its facts are of its relation and no forward rule
  // derives, under the listed facts, a fact of that relation it leaves out.
  checkListing(goalKey) {
    const entry = this.listings.get(goalKey);
    if (entry.checked) return entry;
    entry.checked = true;
    entry.reliance = new Reliance();
    const listed = new Set();
    try {
      for (const fact of entry.facts) {
        if (!isCallable(fact) || key(fact) !== goalKey) {
          entry.failure = `derived facts of ${goalKey} list ${shown(fact)}`;
          entry.subject = fact;
          return entry;
        }
        // Only a program that inspects source rules derives patterns.
        if (!isGround(fact) && !this.program.inspectionEnabled) {
          entry.failure = `derived facts of ${goalKey} list ${shown(fact)}, which is not ground`;
          entry.subject = fact;
          return entry;
        }
        listed.add(listedKey(fact));
      }
      for (const rule of this.program.forward) {
        if (!rule.plainHeads.some((head) => isCallable(head) && key(head) === goalKey)) continue;
        // Without its generator in the program, an appended rule never fires.
        if (!rule.scopeIds.every((id) => this.program.byId.has(id))) continue;
        if (!plainGenerators(this.program, rule)) throw new Unsettled();
        // A rule appended by a template fires once for each instance, so as a
        // rule over facts it is its full body. Witnesses that depend on a
        // captured context are not recomputed here.
        if ((rule.parentId === null && rule.captures !== null) ||
            ((rule.parentId !== null || rule.templates.length) && rule.witnessNames.length)) throw new Unsettled();
        const missing = this.closes(rule, goalKey, listed, entry.reliance);
        if (missing !== null) {
          entry.failure = `derived facts of ${goalKey} leave out ${shown(missing)}, which clause ${rule.id} derives`;
          entry.subject = missing;
          return entry;
        }
      }
    } catch (error) {
      if (error instanceof Unsettled) entry.unsettled = true;
      else if (error instanceof EyemindError) entry.failure = `the closure of ${goalKey} leads to an error: ${error.message}`;
      else {
        entry.checked = false;
        throw error;
      }
    }
    return entry;
  }

  // The first conclusion of rule with key goalKey, its witnesses made as a
  // forward round makes them, that is neither listed nor a ground fact of the
  // program; null when there is none.
  closes(rule, goalKey, listed, reliance) {
    const [head, body, names] = freshClause(rule, `closure${++this.serial}`);
    const witnesses = new Set(rule.witnessNames.map((name) => names.get(name).name));
    const heads = flattenConjunction(head).filter((item) => isCallable(item) && key(item) === goalKey);
    const env = new Env();
    for (const _ of this.solveAll(body, 0, env, reliance)) { // eslint-disable-line no-unused-vars
      const mark = env.mark();
      if (witnesses.size) {
        const values = [];
        for (const variable of variables(head).values()) {
          if (witnesses.has(variable.name)) continue;
          const value = copyResolved(variable, env);
          if (!isGround(value)) throw new Unsettled();
          values.push(value);
        }
        const firing = listFromItems(values);
        for (const name of rule.witnessNames) {
          unify(names.get(name), new Struct('skolem', [BigInt(rule.id), name, firing]), env);
        }
      }
      for (const item of heads) {
        const conclusion = copyResolved(item, env);
        // Only a program that inspects source rules derives patterns; whether
        // a listed pattern's variables came from an inspection, rather than
        // standing for a Skolem term, its replay decides.
        if (!isGround(conclusion) && !this.program.inspectionEnabled) throw new Unsettled();
        const conclusionId = listedKey(conclusion);
        if (!listed.has(conclusionId) && !(isGround(conclusion) && this.program.groundFactKeys.has(conclusionId))) return conclusion;
      }
      env.undo(mark);
    }
    return null;
  }

  // Check the table dependency graph once: detect a cycle, or cache in
  // dependency order which tables have certified answer order: those
  // independent of forward listings, and those with one distinct answer.
  checkDependencies(tables) {
    const exact = this.exactness ??= new Map();
    const open = new Set();
    const frame = (item) => [item, [...this.tables.get(item).reliance.tables], 0];
    for (const start of tables) {
      if (exact.has(start)) continue;
      const stack = [frame(start)];
      open.add(start);
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top[2] >= top[1].length) {
          const entry = this.tables.get(top[0]);
          // A table with at most one distinct answer has that order however
          // the facts it rests on were published.
          exact.set(top[0], (!entry.reliance.listings.size && top[1].every((item) => exact.get(item))) ||
            new Set(entry.answers.map((answer) => variant(answer, true))).size <= 1);
          open.delete(top[0]);
          stack.pop();
          continue;
        }
        const next = top[1][top[2]++];
        if (open.has(next)) return this.tables.get(next);
        if (exact.has(next)) continue;
        open.add(next);
        stack.push(frame(next));
      }
    }
    return null;
  }
}
