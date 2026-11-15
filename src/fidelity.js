// C10: answers of the original questions, checked from source call tables:
// each claim is an answer, and each answer is claimed. Unlike logical steps,
// these searches start before a final substitution.
import { PRIMITIVE_KEYS, primitive } from './builtins.js';
import { Settler, plainGenerators } from './closure.js';
import { stepIdOf } from './proof.js';
import { freshClause, sameVariant, text, variant } from './common.js';
import { goalTerm } from './goals.js';
import { INSPECTION_KEYS } from './inspection.js';
import {
  Env, EyemindError, Struct, conjunction, copyResolved, deref, flattenConjunction, freshTerm, identity, isCallable,
  isGround, isTerm, key, listFromItems, unify, variables,
} from './terms.js';
import { Lettering, write } from './writer.js';

function instance(goal, pattern) {
  const renamed = freshTerm(pattern, 'callQuestion');
  const env = new Env();
  return unify(renamed, goal, env) && text(copyResolved(renamed, env)) === text(goal);
}

// The original questions of Section 8.6, without specializing them to claims.
// A halted run answers none of them.
export function callQuestions(program, goals, claims) {
  if (claims.includes('false')) return [];
  let questions = (goals || []).map(goalTerm);
  if (!questions.length) {
    questions = program.forward.filter((clause) => clause.heads.includes('true'))
      .map((clause) => conjunction(clause.body));
    if (!questions.length) questions = program.forward.flatMap((clause) => clause.plainHeads)
      .filter((head) => head !== 'true' && head !== 'false');
  }
  const seen = new Set();
  return questions.filter((question) => {
    const id = variant(question, true);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// Whether each fact of these listings is the conclusion of a firing that a
// search makes, replaying in source order the derivation its steps record.
// Primitives run on the bindings of that point of the search, so a test of
// whether a variable is bound sees what the search saw. A relation call
// follows its use's own step, which C2 keeps acyclic; a listed use is
// replayed in turn. once/1, not/1 and findall/3 are decided by the call
// tables, through Settler.answers, which refuses an order resting on a
// listing. A use is compared with what its goal can still become, since steps
// show goals after the whole solution's bindings. stepOf(goal) gives the
// recorded justification and uses of a goal, or nothing.
export function replayed(program, settler, listingKeys, stepOf) {
  const confirmed = new Map();
  const active = new Set();
  let serial = 0;
  const fresh = (term) => freshTerm(term, `replay${++serial}`);
  // A rule appended by a template replays as its full body, generator first.
  // Witnesses that depend on a captured context are not recomputed here.
  const supportedRule = (clause) => clause && clause.guard === null &&
    clause.scopeIds.every((id) => program.byId.has(id)) && plainGenerators(program, clause) &&
    (clause.parentId !== null || clause.captures === null) &&
    !((clause.parentId !== null || clause.templates.length) && clause.witnessNames.length);
  function compatible(goal, use, env) {
    // Trial unification must not undo compression of existing bindings.
    goal = copyResolved(goal, env);
    const mark = env.mark();
    const agrees = unify(goal, fresh(use), env);
    env.undo(mark);
    return agrees;
  }
  // Keep deep recorded derivations off the host stack.
  function finish(start) {
    const pending = [start];
    let value;
    while (pending.length) {
      const next = pending[pending.length - 1].next(value);
      if (next.done) {
        value = next.value;
        pending.pop();
      } else {
        pending.push(next.value);
        value = undefined;
      }
    }
    return value;
  }
  function* all(goals, uses, env) {
    if (goals.length !== uses.length) return false;
    for (let i = 0; i < goals.length; i++) if (!(yield one(goals[i], uses[i], env))) return false;
    return true;
  }
  function* one(goal, use, env) {
    goal = deref(goal, env);
    if (!isCallable(goal) || !isCallable(use)) return false;
    const goalKey = key(goal);
    if (goalKey !== key(use)) return false;
    if (goalKey === 'call/1' || goalKey === 'or/2') {
      const step = stepOf(use);
      if (!step || step.by !== 'control') return false;
      const used = step.uses.map((item) => text(item));
      const sides = goalKey === 'call/1' ? [0] : [0, 1];
      const side = sides.find((i) => {
        const parts = flattenConjunction(use.args[i]);
        return parts.length === used.length && parts.every((part, j) => text(part) === used[j]);
      });
      return side !== undefined && (yield all(flattenConjunction(goal.args[side]), step.uses, env));
    }
    if (['once/1', 'not/1', 'findall/3', 'findall_sorted/3'].includes(goalKey)) {
      const outcome = settler.answers(copyResolved(goal, env));
      if (outcome.status !== 'settled' || !outcome.answers.length) return false;
      return unify(goal, fresh(outcome.answers[0]), env) && compatible(goal, use, env);
    }
    if (PRIMITIVE_KEYS.has(goalKey)) {
      // A comparison of variables orders them by name, which renaming changes.
      if (goalKey === 'compare/3' && (!isGround(goal.args[1], env) || !isGround(goal.args[2], env))) return false;
      try {
        for (const _ of primitive(goal, env)) { // eslint-disable-line no-unused-vars
          if (compatible(goal, use, env)) return true;
        }
      } catch (error) {
        if (!(error instanceof EyemindError)) throw error;
      }
      return false;
    }
    if (INSPECTION_KEYS.has(goalKey)) {
      // An inspection reads the source rule its step cites, renamed apart.
      const step = stepOf(use);
      const source = step && isTerm(step.by, 'source', 1) ? program.inspectedById.get(Number(step.by.args[0])) : null;
      return Boolean(source) && unify(goal, freshTerm(source.term, `inspect${++serial}`), env) && compatible(goal, use, env);
    }
    const step = stepOf(use);
    if (!step) {
      // A use without a step is an instance of a source fact.
      for (const clause of program.groups.get(goalKey) || []) {
        if (clause.body.length || clause.forward || clause.parentId !== null) continue;
        const mark = env.mark();
        const [head] = freshClause(clause, `replay${++serial}`);
        if (unify(goal, head, env) && compatible(goal, use, env)) return true;
        env.undo(mark);
      }
      return false;
    }
    if (!isTerm(step.by, 'clause', 1)) return false;
    const clause = program.byId.get(Number(step.by.args[0]));
    if (!supportedRule(clause)) return false;
    if (clause.forward) return (yield fact(use)) && unify(goal, freshTerm(use, `pattern${++serial}`), env);
    const [head, body] = freshClause(clause, `replay${++serial}`);
    if (!body.length) return unify(goal, head, env) && compatible(goal, use, env);
    const id = text(use);
    if (active.has(id)) return false;
    active.add(id);
    // A generator ran before any caller: its premises replay before the head
    // meets the call.
    const prefix = clause.prefixLength;
    const solved = step.uses.length === body.length && (yield all(body.slice(0, prefix), step.uses.slice(0, prefix), env)) &&
      unify(goal, head, env) && (yield all(body.slice(prefix), step.uses.slice(prefix), env)) && compatible(goal, use, env);
    active.delete(id);
    return solved;
  }
  // A listed fact: a firing of the forward rule its step cites.
  function* fact(goal) {
    const id = text(goal);
    if (confirmed.has(id)) return confirmed.get(id);
    if (active.has(id)) return false;
    const step = stepOf(goal);
    const clause = step && isTerm(step.by, 'clause', 1) ? program.byId.get(Number(step.by.args[0])) : null;
    let holds = false;
    if (supportedRule(clause) && clause.forward) {
      active.add(id);
      const [head, body, names] = freshClause(clause, `replay${++serial}`);
      const env = new Env();
      holds = yield all(body, step.uses, env);
      if (holds && clause.witnessNames.length) {
        // Each witness is the Skolem term of this firing (Section 8.2).
        const witnesses = new Set(clause.witnessNames.map((name) => names.get(name).name));
        const values = [];
        for (const variable of variables(head).values()) {
          if (witnesses.has(variable.name)) continue;
          const value = copyResolved(variable, env);
          if (!isGround(value)) holds = false;
          values.push(value);
        }
        for (const name of clause.witnessNames) {
          unify(names.get(name), new Struct('skolem', [BigInt(clause.id), name, listFromItems(values)]), env);
        }
      }
      // A derived pattern is identified up to the renaming of its variables,
      // and keeps only variables an inspection supplied: the run binds any
      // other head variable a firing leaves unbound to a Skolem term.
      const same = isGround(goal) ? (item) => identity(item) === identity(goal) : (item) => variant(item) === variant(goal);
      holds = holds && flattenConjunction(head).some((item) => {
        if (!isCallable(item)) return false;
        const conclusion = copyResolved(item, env);
        return [...variables(conclusion).keys()].every((name) => /#(?:inspect|pattern)\d+$/.test(name)) && same(conclusion);
      });
      active.delete(id);
    }
    confirmed.set(id, holds);
    return holds;
  }
  return listingKeys.every((goalKey) => (settler.listings.get(goalKey)?.facts || []).every((goal) => finish(fact(goal))));
}

// Both directions of C10: each claim is an answer of an original question,
// and each answer of a certified question is claimed. When the conclusions
// are the derived facts, a question's answers that are not derived (source
// facts, backward answers) are no conclusions, so only its listed facts are.
export function checkCalls(program, claims, goals, certificate, steps, spellings, fail, allowTrusted, name) {
  const settler = new Settler(program, {
    answers: (call) => certificate.calls.get(variant(call, true)) ?? null,
    facts: (goalKey) => certificate.listings.get(goalKey) ?? null,
    supported: (fact) => steps.has(stepIdOf(steps, spellings, fact)),
  }, true);
  if (claims.includes('false')) return { settler, outcomes: [], unresolved: [], covered: 0 };
  const stepOf = (goal) => steps.get(stepIdOf(steps, spellings, goal));
  const outcomes = callQuestions(program, goals, claims).map((question) => {
    const outcome = settler.answers(question);
    if (outcome.status === 'settled' && !replayed(program, settler, outcome.listings, stepOf)) {
      return { question, ...outcome, status: 'unsupported' };
    }
    return { question, ...outcome };
  });
  const unresolved = [];
  let covered = 0;
  for (const claim of claims) {
    const matching = outcomes.filter(({ question }) => instance(claim, question));
    let detail = null;
    if (matching.some(({ status }) => status === 'failed')) detail = 'the original call has an invalid search certificate';
    else if (!matching.some(({ status, answers }) => status === 'settled' &&
      answers.some((answer) => sameVariant(answer, claim)))) {
      if (matching.length && matching.every(({ status }) => status === 'settled')) {
        detail = 'the original call does not return this answer';
      } else {
        unresolved.push([{ kind: 'call_fidelity', reason: 'original_call', conclusion: name(claim) }, claim]);
        if (!allowTrusted) fail.add('C10', `call fidelity remains unproved: ${name(claim)}`, claim);
        continue;
      }
    }
    covered++;
    if (detail !== null) fail.add('C10', `${detail}: ${text(claim)}`, claim);
  }
  const derivedOnly = !(goals || []).length && !program.forward.some((clause) => clause.heads.includes('true'));
  const claimed = new Set(claims.map((claim) => variant(claim)));
  for (const { question, status, answers } of outcomes) {
    if (status === 'failed') {
      // A claim of this question already failed with its certificate.
      if (!claims.some((claim) => instance(claim, question))) {
        fail.add('C10', `the original call has an invalid search certificate: ${text(question)}`, question);
      }
      covered++;
      continue;
    }
    if (status !== 'settled') {
      unresolved.push([{ kind: 'call_fidelity', reason: 'all_answers', conclusion: text(question) }, question]);
      if (!allowTrusted) fail.add('C10', `answer completeness remains unproved: ${text(question)}`, question);
      continue;
    }
    const required = derivedOnly
      ? (settler.listings.get(key(question))?.facts || []).filter((fact) => instance(fact, question))
      : answers;
    covered++;
    for (const answer of required) {
      if (!claimed.has(variant(answer))) {
        fail.add('C10', `the proof omits an answer of the original call: ${write(answer, null, new Lettering())}`, answer);
      }
    }
  }
  return { settler, outcomes, unresolved, covered };
}
