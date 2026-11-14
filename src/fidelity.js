// C10: answers of the original questions, checked from source call tables:
// each claim is an answer, and each answer is claimed. Unlike logical steps,
// these searches start before a final substitution.
import { PRIMITIVE_KEYS } from './builtins.js';
import { Settler } from './closure.js';
import { text, variant } from './common.js';
import { goalTerm } from './goals.js';
import { INSPECTION_KEYS } from './inspection.js';
import {
  Env, Struct, Var, conjunction, copyResolved, freshTerm, isAnonymous, isCallable, isGround, isTerm, key, listFromItems, unify, variables,
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

// Primitives that compute their outputs from ground inputs, in each mode an
// argument's positions of the inputs, then of the outputs. With its inputs
// ground such a call has exactly the solutions whose ground instances hold,
// re-decided as C5 re-decides them, so a search finds what C5 accepts.
// number_chars/2 re-decides by reading its characters, so only that mode.
const MODES = new Map([
  ['is/2', [[[1], [0]]]],
  ['compare/3', [[[1, 2], [0]]]],
  ['atom_chars/2', [[[0], [1]], [[1], [0]]]],
  ['atom_codes/2', [[[0], [1]], [[1], [0]]]],
  ['number_chars/2', [[[1], [0]]]],
  ['atom_length/2', [[[0], [1]]]],
  ['atom_lower/2', [[[0], [1]]]],
  ['atom_upper/2', [[[0], [1]]]],
  ['atom_concat/3', [[[0, 1], [2]], [[2], [0, 1]]]],
  ['regex_find/3', [[[0, 1], [2]]]],
  ['digest/3', [[[0, 1], [2]]]],
  ['term_text/2', [[[0], [1]]]],
  ['float64/4', [[[0, 1, 2], [3]]]],
]);

// The variables of a head's arguments that a call in mode grounds.
function inputs(head, mode) {
  const names = new Set();
  if (head instanceof Struct) {
    head.args.forEach((arg, i) => {
      if (mode[i] === 'g') for (const name of variables(arg).keys()) names.add(name);
    });
  }
  return names;
}

// How often each variable occurs in term, by name.
function occurrences(term, counts = new Map()) {
  const pending = [term];
  while (pending.length) {
    const item = pending.pop();
    if (item instanceof Struct) pending.push(...item.args);
    else if (item instanceof Var) counts.set(item.name, (counts.get(item.name) || 0) + 1);
  }
  return counts;
}

// C9's support plus closure establishes the least ground model, and with
// negations the one stable model of a stratified or chain-stratified
// program, when a search of each rule body in source order finds exactly the
// ground instances that hold: then the steps that support a listed fact,
// re-decided on their ground instances, show a firing a search makes. That
// holds when no goal observes bindings: each primitive runs with its inputs
// ground, each negation with its named variables ground, and once/1 and
// findall/3 bind nothing other goals use. A backward rule is analyzed for
// each mode it is called in, the head arguments a call grounds being ground
// on entry, and must ground the rest of its head. A relation with a
// nonground source fact grounds nothing. Rules that observe bindings or
// order, templates, and restricted rules, whose guard another order of
// firings could decide otherwise, leave which firings occurred
// unestablished: refuse that promise.
export function positiveListings(program, listings) {
  // Calls, by relation and mode, found to answer with nonground terms; the
  // analysis starts again whenever it finds another, assuming fewer grounded.
  const loose = new Set();
  for (;;) {
    const result = groundedListings(program, listings, loose);
    if (result !== 'again') return result;
  }
}

function groundedListings(program, listings, loose) {
  // A listed relation and the forward rules concluding it, or a called
  // relation and its mode: 'g' for each argument ground at the call, else 'f'.
  const pending = listings.map((goalKey) => [goalKey, null]);
  const seen = new Set();
  // Whether every source fact of a relation is ground once a call in this
  // mode has unified it: only then does the call ground its arguments.
  const groundsFacts = (goalKey, mode) => !loose.has(`${goalKey} ${mode}`) &&
    (program.groups.get(goalKey) || []).every((clause) => clause.body.length ||
      [...variables(clause.head).keys()].every((name) => inputs(clause.head, mode).has(name)));
  let outside = null;
  // The variables of goal used elsewhere in the clause, other than in goal.
  const shared = (goal) => {
    const inside = occurrences(goal);
    return [...variables(goal)].filter(([name, variable]) => !isAnonymous(variable) && outside.get(name) > inside.get(name))
      .map(([name]) => name);
  };
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
    if (isTerm(goal, 'call', 1)) return bound(goal.args[0], grounded, negated);
    // A first answer or a collection binds nothing it shares, so which answer
    // came first, or which bindings a later goal makes, cannot matter.
    if (isTerm(goal, 'once', 1)) {
      const inner = bound(goal.args[0], grounded, negated);
      return inner === null || shared(goal).some((name) => !grounded.has(name)) ? null : grounded;
    }
    if (isTerm(goal, 'findall', 3)) {
      const inner = bound(goal.args[1], grounded, negated);
      const collected = new Struct('-', [goal.args[0], goal.args[1]]);
      if (inner === null || shared(collected).some((name) => !grounded.has(name))) return null;
      const items = [...variables(goal.args[0]).keys()].every((name) => inner.has(name));
      return items ? new Set([...grounded, ...variables(goal.args[2]).keys()]) : grounded;
    }
    if (!isCallable(goal)) return null;
    const goalKey = key(goal);
    if (INSPECTION_KEYS.has(goalKey)) return null;
    if (PRIMITIVE_KEYS.has(goalKey)) {
      const free = (term) => [...variables(term).keys()].filter((name) => !grounded.has(name));
      const args = goal instanceof Struct ? goal.args : [];
      if (args.every((arg) => !free(arg).length)) return grounded;
      if (goalKey === 'unify/2') {
        // Unification is pure; a ground side grounds the other.
        const [left, right] = args;
        if (!free(left).length || !free(right).length) return new Set([...grounded, ...variables(goal).keys()]);
        return grounded;
      }
      const modes = MODES.get(goalKey) || [];
      if (!modes.some(([inputs]) => inputs.every((i) => !free(args[i]).length))) return null;
      return new Set([...grounded, ...variables(goal).keys()]);
    }
    const args = goal instanceof Struct ? goal.args : [];
    const mode = args.map((arg) => ([...variables(arg).keys()].every((name) => grounded.has(name)) ? 'g' : 'f')).join('');
    pending.push([goalKey, mode]);
    return groundsFacts(goalKey, mode) ? new Set([...grounded, ...variables(goal).keys()]) : grounded;
  }
  while (pending.length) {
    const [goalKey, mode] = pending.pop();
    const clauses = [];
    if (!seen.has(goalKey)) {
      seen.add(goalKey);
      clauses.push(...(program.groups.get(goalKey) || []).filter((clause) => !clause.body.length),
        ...program.forward.filter((clause) => clause.plainHeads.some((head) => isCallable(head) && key(head) === goalKey)));
    }
    if (mode !== null && !seen.has(`${goalKey} ${mode}`)) {
      seen.add(`${goalKey} ${mode}`);
      clauses.push(...(program.groups.get(goalKey) || []).filter((clause) => clause.body.length));
    }
    for (const clause of clauses) {
      if (clause.parentId !== null || clause.templates.length || clause.captures !== null || clause.guard !== null) return false;
      if (!clause.forward && !clause.body.length) continue;
      outside = occurrences(new Struct('-', [clause.head, listFromItems(clause.body)]));
      let grounded = clause.forward ? new Set() : inputs(clause.head, mode);
      for (const goal of clause.body) {
        grounded = bound(goal, grounded);
        if (grounded === null) return false;
      }
      // A call in a mode whose facts stay nonground grounds nothing, so its
      // rules need not ground their heads either.
      if (!clause.forward && !groundsFacts(goalKey, mode)) continue;
      const witnesses = new Set(clause.forward ? clause.witnessNames : []);
      for (const name of variables(clause.head).keys()) {
        if (grounded.has(name) || witnesses.has(name)) continue;
        if (clause.forward) return false;
        loose.add(`${goalKey} ${mode}`);
        return 'again';
      }
    }
  }
  return true;
}

// Both directions of C10: each claim is an answer of an original question,
// and each answer of a certified question is claimed. When the conclusions
// are the derived facts, a question's answers that are not derived (source
// facts, backward answers) are no conclusions, so only its listed facts are.
// A proof with a primitive only within host-math tolerance (C5) supports no
// listing for C10: its derived facts need not be what a search here finds.
export function checkCalls(program, claims, goals, certificate, steps, spellings, fail, allowTrusted, name, inexact = false) {
  const settler = new Settler(program, {
    answers: (call) => certificate.calls.get(variant(call, true)) ?? null,
    facts: (goalKey) => certificate.listings.get(goalKey) ?? null,
    supported: (fact) => steps.has(spellings.spell(fact)),
  }, true);
  if (claims.includes('false')) return { settler, outcomes: [], unresolved: [], covered: 0 };
  const outcomes = callQuestions(program, goals, claims).map((question) => {
    const outcome = settler.answers(question);
    if (outcome.status === 'settled' && ((inexact && outcome.listings.length) || !positiveListings(program, outcome.listings))) {
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
