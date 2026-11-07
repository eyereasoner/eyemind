// Search certificates: what settles a negation or a collection.
//
// A negation holds when its goal has no solution, and a collection lists
// every solution; no step can show either. A search certificate can. For each
// call the search behind the boundary made, it lists every answer, in search
// order: searched(Call, Answers). For each predicate that forward rules derive
// and the search consulted, it lists every derived fact: derived(Pattern,
// Facts). A table is checked by expanding its call one level against the
// program, as a search would, with every inner call answered by the table of
// that call, so no table vouches for itself and a wrong one shows as a
// disagreement. A listing is checked by its facts' own steps, which show each
// was derived, and by closure: under the listed facts no forward rule derives
// a fact of that predicate the listing leaves out. Nothing is searched for.
//
// The order of derived facts cannot be checked this way, so a collection or
// a once/1 whose answers rest on a listing stays an obligation, and so does a
// boundary whose search reaches rule templates or inspection.
import { PRIMITIVE_KEYS, primitive } from './builtins.js';
import { freshClause, text, variant } from './common.js';
import { INSPECTION_KEYS } from './inspection.js';
import {
  Env, EyemindError, Struct, Var, copyResolved, deref, flattenConjunction, freshTerm, identity, isCallable, isGround, isTerm, key,
  listFromItems, unify, variables,
} from './terms.js';

// A search the certificate cannot vouch for: its boundary stays an obligation.
export class Unsettled extends Error {}

// What one expansion relied on: the tables it read, the listings it read and
// the tables whose answer order it needed.
export class Reliance {
  constructor(ordered = false) {
    this.tables = new Set();
    this.listings = new Set();
    this.ordered = new Set();
    this.inner = ordered ? 1 : 0;
  }
}

// Whether term is an instance of pattern, whose variables are its own.
function instanceOf(term, pattern) {
  const env = new Env();
  return unify(pattern, term, env) && variant(copyResolved(term, env)) === variant(term);
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

// Settles boundaries against a source of certificate statements:
// answers(call) gives the answers listed for a call, or null; facts(goalKey)
// the facts listed for a predicate forward rules derive, or null; and
// supported(fact) whether the proof has a step for a listed fact. Tables and
// listings are checked once, however many boundaries rest on them.
export class Settler {
  constructor(program, source) {
    this.program = program;
    this.source = source;
    this.derivedKeys = forwardKeys(program);
    this.tables = new Map();
    this.listings = new Map();
    this.serial = 0;
  }

  // The outcome for one negation or collection: status 'settled',
  // 'unsettled' or 'failed', the failures as [detail, term] pairs, whether the
  // only failure is the boundary's own result, and the tables and listings it
  // rests on.
  settle(boundary) {
    const collecting = isTerm(boundary, 'findall', 3);
    const goal = collecting ? boundary.args[1] : boundary.args[0];
    const root = new Reliance(collecting);
    const outcome = { status: 'settled', failures: [], boundaryOnly: false, tables: [], listings: [] };
    let found = [];
    try {
      const env = new Env();
      const copied = freshTerm(collecting ? new Struct('-', [boundary.args[0], goal]) : goal, `root${++this.serial}`);
      const [template, searched] = collecting ? copied.args : [null, copied];
      for (const _ of this.solve(searched, env, root)) { // eslint-disable-line no-unused-vars
        found.push(collecting ? freshTerm(copyResolved(template, env), `item${++this.serial}`) : null);
        if (!collecting) break;
      }
    } catch (error) {
      if (error instanceof Unsettled) return { ...outcome, status: 'unsettled' };
      if (!(error instanceof EyemindError)) throw error;
      outcome.failures.push([`search certificate leads to an error: ${error.message}`, boundary]);
      found = null;
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
    const circular = this.circularity(tables);
    if (circular !== null) {
      outcome.failures.push([`search certificate is circular at ${text(circular.call)}`, circular.call]);
    }
    if (outcome.failures.length || outcome.failed) return { ...outcome, status: 'failed' };
    if (unsettled || [...ordered].some((item) => !this.exact(item))) return { ...outcome, status: 'unsettled' };
    if (!collecting && found.length) {
      outcome.failures.push([`absence contradicted by its search: ${text(boundary)}`, boundary]);
      return { ...outcome, status: 'failed', boundaryOnly: true };
    }
    // A collection's list is the search's, renamed apart, bound perhaps by
    // later goals. A step shows its goal as the whole solution left it, so a
    // goal a later goal instantiated may no longer be the goal searched: a
    // list that disagrees is left to the evidence rather than refuted.
    if (collecting && !instanceOf(boundary.args[2], listFromItems(found))) return { ...outcome, status: 'unsettled' };
    return outcome;
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
      // A negation's unbound variables stand for any value, as anonymous
      // ones do; a reasoner would not have run one with a named variable.
      const once = goalKey === 'once/1';
      if (once) reliance.inner++;
      const inner = this.solve(goal.args[0], env, reliance);
      const first = inner.next();
      if (once) reliance.inner--;
      if (once && !first.done) yield;
      inner.return();
      env.undo(mark);
      if (!once && first.done) yield;
    } else if (goalKey === 'findall/3') {
      const items = [];
      reliance.inner++;
      for (const _ of this.solve(goal.args[1], env, reliance)) { // eslint-disable-line no-unused-vars
        items.push(freshTerm(copyResolved(goal.args[0], env), `collection${++this.serial}`));
      }
      reliance.inner--;
      env.undo(mark);
      if (unify(goal.args[2], listFromItems(items), env)) yield;
    } else if (PRIMITIVE_KEYS.has(goalKey)) {
      for (const _ of primitive(goal, env)) { // eslint-disable-line no-unused-vars
        yield;
        env.undo(mark);
      }
    } else if (INSPECTION_KEYS.has(goalKey)) {
      throw new Unsettled();
    } else if (!this.derivedKeys.has(goalKey) &&
               (this.program.groups.get(goalKey) || []).every((clause) => !clause.body.length && clause.parentId === null)) {
      // Facts alone are scanned where they stand, with no table needed.
      yield* this.expand(goal, env, reliance);
    } else {
      const call = copyResolved(goal, env);
      const callKey = variant(call);
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
        if (unify(call, fact, env)) yield;
        env.undo(mark);
      }
    }
    for (const clause of this.program.groups.get(goalKey) || []) {
      // A derived rule instance answers only through the run that made it.
      if (clause.parentId !== null) throw new Unsettled();
      const [head, body] = freshClause(clause, `clause${++this.serial}`);
      if (unify(call, head, env)) yield* this.solveAll(body, 0, env, reliance);
      env.undo(mark);
    }
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
      while (i < found.length && i < listed.length && variant(found[i]) === variant(listed[i])) i++;
      if (i < found.length && i < listed.length) {
        entry.failure = `the search of ${text(entry.call)} answers ${text(found[i])} where its table lists ${text(listed[i])}`;
      } else if (i < found.length) {
        entry.failure = `the table of ${text(entry.call)} leaves out the answer ${text(found[i])}`;
      } else if (i < listed.length) {
        entry.failure = `the table of ${text(entry.call)} lists ${text(listed[i])}, which its search does not answer`;
      }
    } catch (error) {
      if (error instanceof Unsettled) entry.unsettled = true;
      else if (error instanceof EyemindError) entry.failure = `the search of ${text(entry.call)} leads to an error: ${error.message}`;
      else {
        // Checked again once whatever interrupted it is dealt with.
        entry.checked = false;
        throw error;
      }
    }
    return entry;
  }

  // A listing holds when each fact has a step and no forward rule derives,
  // under the listed facts, a fact of that relation it leaves out.
  checkListing(goalKey) {
    const entry = this.listings.get(goalKey);
    if (entry.checked) return entry;
    entry.checked = true;
    entry.reliance = new Reliance();
    const listed = new Set();
    try {
      for (const fact of entry.facts) {
        if (!isCallable(fact) || key(fact) !== goalKey) {
          entry.failure = `derived facts of ${goalKey} list ${text(fact)}`;
          entry.subject = fact;
          return entry;
        }
        // A pattern an inspection derived is not a fact closure can compare.
        if (!isGround(fact)) throw new Unsettled();
        if (!this.source.supported(fact)) {
          entry.failure = `derived fact without a step: ${text(fact)}`;
          entry.subject = fact;
          return entry;
        }
        listed.add(identity(fact));
      }
      for (const rule of this.program.forward) {
        if (!rule.plainHeads.some((head) => isCallable(head) && key(head) === goalKey)) continue;
        if (rule.parentId !== null || rule.templates.length || rule.captures !== null) throw new Unsettled();
        const missing = this.closes(rule, goalKey, listed, entry.reliance);
        if (missing !== null) {
          entry.failure = `derived facts of ${goalKey} leave out ${text(missing)}, which clause ${rule.id} derives`;
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
        if (!isGround(conclusion)) throw new Unsettled();
        const conclusionId = identity(conclusion);
        if (!listed.has(conclusionId) && !this.program.groundFactKeys.has(conclusionId)) return conclusion;
      }
      env.undo(mark);
    }
    return null;
  }

  // The first table found on a cycle of tables, or null: a search that met
  // its own call again would never have finished.
  circularity(tables) {
    const state = new Map();
    for (const start of tables) {
      if (state.has(start)) continue;
      const stack = [[start, [...this.tables.get(start).reliance.tables], 0]];
      state.set(start, 'open');
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top[2] >= top[1].length) {
          state.set(top[0], 'done');
          stack.pop();
          continue;
        }
        const next = top[1][top[2]++];
        if (state.get(next) === 'open') return this.tables.get(next);
        if (state.has(next)) continue;
        state.set(next, 'open');
        const entry = this.tables.get(next);
        stack.push([next, entry.reliance ? [...entry.reliance.tables] : [], 0]);
      }
    }
    return null;
  }

  // Whether a table's answers keep the order a search finds them in: none of
  // them, through any table it rests on, came from a listing.
  exact(callKey) {
    const memo = this.exactness ??= new Map();
    if (memo.has(callKey)) return memo.get(callKey);
    // Finish each dependency before caching its parent. Reversing discovery
    // order is insufficient when two branches share a dependency.
    const frame = (item) => [item, [...this.tables.get(item).reliance.tables], 0];
    const stack = [frame(callKey)];
    while (stack.length) {
      const top = stack[stack.length - 1];
      if (top[2] < top[1].length) {
        const next = top[1][top[2]++];
        if (!memo.has(next)) stack.push(frame(next));
        continue;
      }
      const reliance = this.tables.get(top[0]).reliance;
      memo.set(top[0], !reliance.listings.size && top[1].every((item) => memo.get(item)));
      stack.pop();
    }
    return memo.get(callKey);
  }
}
