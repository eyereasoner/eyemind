// C10: answers of the original questions, checked from source call tables.
// Unlike logical steps, these searches start before a final substitution.
import { PRIMITIVE_KEYS } from './builtins.js';
import { Settler } from './closure.js';
import { text, variant } from './common.js';
import { goalTerm } from './goals.js';
import { INSPECTION_KEYS } from './inspection.js';
import {
  Env, conjunction, copyResolved, freshTerm, isAnonymous, isCallable, isGround, isTerm, key, unify, variables,
} from './terms.js';

function instance(goal, pattern) {
  const renamed = freshTerm(pattern, 'callQuestion');
  const env = new Env();
  return unify(renamed, goal, env) && text(copyResolved(renamed, env)) === text(goal);
}

// The original questions of Section 8.6, without specializing them to claims.
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
    if (seen.has(id) || !claims.some((claim) => instance(claim, question))) return false;
    seen.add(id);
    return true;
  });
}

// C9's support plus closure establishes the least ground positive model,
// and with negations the one stable model of a stratified or
// chain-stratified program: a negation whose named variables earlier goals
// bind is decided by the listed facts alone. For forward rules that observe
// bindings or order, and for restricted rules, whose guard another order of
// firings could decide otherwise, a final listing alone does not establish
// which firings occurred. Refuse that stronger promise.
export function positiveListings(program, listings) {
  const pending = [...listings];
  const seen = new Set();
  function bound(goal, grounded, negated = false) {
    if (goal === 'true') return grounded;
    if (isTerm(goal, 'and', 2) || isTerm(goal, 'or', 2)) {
      const left = bound(goal.args[0], grounded, negated);
      if (left === null) return null;
      const right = bound(goal.args[1], goal.name === 'and' ? left : grounded, negated);
      if (right === null) return null;
      return goal.name === 'and' ? right
        : new Set([...left].filter((name) => right.has(name)));
    }
    if (isTerm(goal, 'not', 1)) {
      if (negated) return null;
      for (const [name, variable] of variables(goal)) {
        if (!isAnonymous(variable) && !grounded.has(name)) return null;
      }
      return bound(goal.args[0], grounded, true) === null ? null : grounded;
    }
    if (!isCallable(goal)) return null;
    const goalKey = key(goal);
    if (PRIMITIVE_KEYS.has(goalKey) || INSPECTION_KEYS.has(goalKey) ||
        ['not/1', 'findall/3', 'once/1', 'call/1'].includes(goalKey)) return null;
    pending.push(goalKey);
    return new Set([...grounded, ...variables(goal).keys()]);
  }
  while (pending.length) {
    const goalKey = pending.pop();
    if (seen.has(goalKey)) continue;
    seen.add(goalKey);
    const clauses = [...(program.groups.get(goalKey) || []), ...program.forward.filter((clause) =>
      clause.plainHeads.some((head) => isCallable(head) && key(head) === goalKey))];
    for (const clause of clauses) {
      if (clause.parentId !== null || clause.templates.length || clause.captures !== null || clause.guard !== null) return false;
      if (!clause.forward && !clause.body.length) {
        if (!isGround(clause.head)) return false;
        continue;
      }
      let grounded = new Set();
      for (const goal of clause.body) {
        grounded = bound(goal, grounded);
        if (grounded === null) return false;
      }
      const witnesses = new Set(clause.forward ? clause.witnessNames : []);
      for (const name of variables(clause.head).keys()) {
        if (!grounded.has(name) && !witnesses.has(name)) return false;
      }
    }
  }
  return true;
}

export function checkCalls(program, claims, goals, certificate, steps, spellings, fail, allowTrusted, name) {
  const settler = new Settler(program, {
    answers: (call) => certificate.calls.get(variant(call, true)) ?? null,
    facts: (goalKey) => certificate.listings.get(goalKey) ?? null,
    supported: (fact) => steps.has(spellings.spell(fact)),
  }, true);
  if (claims.includes('false')) return { settler, outcomes: [], unresolved: [], covered: 0 };
  const outcomes = callQuestions(program, goals, claims).map((question) => {
    const outcome = settler.answers(question);
    if (outcome.status === 'settled' && !positiveListings(program, outcome.listings)) {
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
      answers.some((answer) => variant(answer) === variant(claim)))) {
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
  return { settler, outcomes, unresolved, covered };
}
