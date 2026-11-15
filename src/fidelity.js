// The check of a proof: the answers of the original questions, from call
// tables checked against the source program, are exactly the claims, and
// every derived fact those answers rest on replays the firing its steps
// record. These searches start from the original calls, before any final
// substitution, so they see the bindings a run saw.
import { PRIMITIVE_KEYS, primitive } from './builtins.js';
import { Settler, plainGenerators } from './closure.js';
import { freshClause, isInstance, sameVariant, text, variant } from './common.js';
import { goalTerm } from './goals.js';
import {
  Env, EyemindError, Struct, conjunction, copyResolved, deref, flattenConjunction, freshTerm, isCallable,
  isGround, isTerm, key, listFromItems, unify, variables,
} from './terms.js';
import { Lettering, write } from './writer.js';

const instance = (goal, pattern) => isInstance(goal, pattern, 'callQuestion');

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

// A function telling whether a derived fact is the conclusion of a firing
// that a search makes, replaying in source order the firing its step
// records. Each goal runs with the bindings of that point of the search, so
// a test of whether a variable is bound sees what the search saw. Primitives
// run; other goals are answered by the call tables, through Settler.answers,
// which refuses an order resting on a listing. A call whose search consults
// derived facts follows its use's step instead, never in a cycle, so derived
// facts support each other only through steps. A use is compared with what
// its goal can still become, since steps show goals after the whole
// solution's bindings. stepOf(goal) gives the recorded justification and
// uses of a goal, or nothing; used collects the tables and listings the
// replays consult.
export function replayer(program, settler, stepOf, used) {
  const confirmed = new Map();
  const active = new Set();
  // The steps a firing's replay followed, each as [replayed, recorded]: once
  // the whole firing has replayed, each must be its step up to renaming.
  let followed = [];
  const exactly = ([replayed, recorded], env) => variant(copyResolved(replayed, env)) === variant(recorded);
  let serial = 0;
  const fresh = (term) => freshTerm(term, `replay${++serial}`);
  // An answer's variables are pattern variables only when its search read
  // the inspected rules or a derived pattern.
  const answer = (outcome, item) => freshTerm(item, `${outcome.inspected ? 'inspect' : 'replay'}${++serial}`);
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
  // A step's bindings name distinct variables of its clause, each with a
  // value that agrees with what the replay gave it; they bind nothing.
  function bound(step, names, env) {
    const pairs = step.bindings.map((pair) => (pair instanceof Struct ? pair.args : pair));
    if (new Set(pairs.map(([name]) => name)).size !== pairs.length) return false;
    const values = fresh(new Struct('bindings', pairs.map(([, value]) => value))).args;
    const mark = env.mark();
    const agrees = pairs.every(([name], i) => typeof name === 'string' && names.has(name) && unify(names.get(name), values[i], env));
    env.undo(mark);
    return agrees;
  }
  // A goal answered by the call tables with the bindings it has: true when
  // an answer agrees with the use; null when its search consults derived
  // facts, whose support only steps show.
  function answered(goal, use, env) {
    const outcome = settler.answers(copyResolved(goal, env));
    if (outcome.status === 'unsettled' || (outcome.status === 'settled' && outcome.listings.length)) return null;
    for (const item of outcome.tables) used.tables.add(item);
    if (outcome.status !== 'settled') return false;
    // The answer that is the use, up to renaming, is the one the firing
    // took; failing that, the first that can still become it.
    const target = variant(use);
    for (const exact of [true, false]) {
      for (const item of outcome.answers) {
        const mark = env.mark();
        if (unify(goal, answer(outcome, item), env) && compatible(goal, use, env) &&
            (!exact || variant(copyResolved(goal, env)) === target)) return true;
        env.undo(mark);
      }
    }
    return false;
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
    if (['once/1', 'not/1', 'findall/3', 'findall_sorted/3'].includes(goalKey)) {
      const outcome = settler.answers(copyResolved(goal, env));
      for (const item of outcome.tables) used.tables.add(item);
      for (const item of outcome.listings) used.listings.add(item);
      if (outcome.status !== 'settled' || !outcome.answers.length) return false;
      return unify(goal, answer(outcome, outcome.answers[0]), env) && compatible(goal, use, env);
    }
    const decided = answered(goal, use, env);
    if (decided !== null) return decided;
    if (goalKey === 'call/1' || goalKey === 'or/2') {
      const step = stepOf(use);
      if (!step || step.by !== 'control' || step.bindings.length) return false;
      const used = step.uses.map((item) => text(item));
      const sides = goalKey === 'call/1' ? [0] : [0, 1];
      const side = sides.find((i) => {
        const parts = flattenConjunction(use.args[i]);
        return parts.length === used.length && parts.every((part, j) => text(part) === used[j]);
      });
      if (side === undefined) return false;
      const parts = flattenConjunction(goal.args[side]);
      followed.push([new Struct('step', [goal, ...parts]), new Struct('step', [use, ...step.uses])]);
      return yield all(parts, step.uses, env);
    }
    const step = stepOf(use);
    if (!step || !isTerm(step.by, 'clause', 1)) return false;
    const clause = program.byId.get(Number(step.by.args[0]));
    if (!supportedRule(clause)) return false;
    if (clause.forward) return (yield fact(use)) && unify(goal, freshTerm(use, `pattern${++serial}`), env);
    const [head, body, names] = freshClause(clause, `replay${++serial}`);
    if (!body.length) return unify(goal, head, env) && bound(step, names, env) && compatible(goal, use, env);
    const id = text(use);
    if (active.has(id)) return false;
    active.add(id);
    // A generator ran before any caller: its premises replay before the head
    // meets the call.
    const prefix = clause.prefixLength;
    const solved = step.uses.length === body.length && (yield all(body.slice(0, prefix), step.uses.slice(0, prefix), env)) &&
      unify(goal, head, env) && (yield all(body.slice(prefix), step.uses.slice(prefix), env)) && bound(step, names, env) &&
      compatible(goal, use, env);
    if (solved) followed.push([new Struct('step', [head, ...body]), new Struct('step', [use, ...step.uses])]);
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
      const outer = followed;
      followed = [];
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
      holds = holds && bound(step, names, env);
      // The firing is its step up to renaming: the fact is an instance of one
      // of the rule's heads and the uses its body, variables shared as they
      // are. A derived pattern keeps only variables an inspection supplied:
      // the run binds any other head variable a firing leaves unbound to a
      // Skolem term.
      const recorded = new Struct('step', [goal, ...step.uses]);
      holds = holds && flattenConjunction(head).some((item) => {
        if (!isCallable(item)) return false;
        const conclusion = copyResolved(item, env);
        return [...variables(conclusion).keys()].every((name) => /#(?:inspect|pattern)\d+(?:#|$)/.test(name)) &&
          exactly([new Struct('step', [item, ...body]), recorded], env);
      }) && followed.every((pair) => exactly(pair, env));
      followed = outer;
      active.delete(id);
    }
    confirmed.set(id, holds);
    return holds;
  }
  return (goal) => finish(fact(goal));
}

// Check the claims against the original questions, adding failures to fail.
// Each question's answers come from its certificate; every derived fact they
// rest on must replay; each claim must be an answer and each answer claimed.
// A halted run stopped before its fixpoint, so its claims are each replayed
// instead, which shows that they follow but not that they are every answer.
// Returns the tables and listings the check consulted.
export function checkAnswers(program, claims, goals, certificate, stepOf, fail) {
  const settler = new Settler(program, {
    answers: (call) => certificate.calls.get(variant(call, true)) ?? null,
    facts: (goalKey) => certificate.listings.get(goalKey) ?? null,
  });
  const used = { tables: new Set(), listings: new Set() };
  const replays = replayer(program, settler, stepOf, used);
  if (claims.includes('false')) {
    for (const claim of claims) {
      if (!replays(claim)) fail.add(`the claim does not replay a recorded firing: ${text(claim)}`, claim);
    }
    return used;
  }
  const outcomes = callQuestions(program, goals, claims).map((question) => {
    const outcome = settler.answers(question);
    for (const item of outcome.tables) used.tables.add(item);
    for (const item of outcome.listings) used.listings.add(item);
    for (const [detail, term] of outcome.failures) fail.add(detail, term);
    if (outcome.status === 'unsettled') {
      fail.add(`the certificate cannot establish the answers of ${text(question)}`, question);
    } else if (outcome.status === 'settled') {
      for (const goalKey of outcome.listings) {
        for (const fact of settler.listings.get(goalKey)?.facts || []) {
          if (!replays(fact)) {
            fail.add(`the derived fact does not replay a recorded firing: ${text(fact)}`, fact);
            outcome.status = 'failed';
          }
        }
      }
    }
    return { question, ...outcome };
  });
  for (const claim of claims) {
    const matching = outcomes.filter(({ question }) => instance(claim, question));
    if (!matching.length) fail.add(`the claim answers no question: ${text(claim)}`, claim);
    else if (matching.every(({ status }) => status === 'settled') &&
             !matching.some(({ answers }) => answers.some((answer) => sameVariant(answer, claim)))) {
      fail.add(`the question does not return this answer: ${text(claim)}`, claim);
    }
  }
  // When the conclusions are the derived facts, a question's answers that are
  // not derived (source facts, backward answers) are no conclusions, so only
  // its listed facts are.
  const derivedOnly = !(goals || []).length && !program.forward.some((clause) => clause.heads.includes('true'));
  const claimed = new Set(claims.map((claim) => variant(claim)));
  for (const { question, status, answers } of outcomes) {
    if (status !== 'settled') continue;
    const required = derivedOnly
      ? (settler.listings.get(key(question))?.facts || []).filter((fact) => instance(fact, question))
      : answers;
    for (const answer of required) {
      if (!claimed.has(variant(answer))) {
        fail.add(`the proof omits an answer of ${text(question)}: ${write(answer, null, new Lettering())}`, answer);
      }
    }
  }
  return used;
}
