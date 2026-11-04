// Proof documents: rendering, and checking C1-C8 against the source program.
//
// A proof document is JavaScript source, one expression per line: first the
// claims, then clause(N, Display) for every source clause the proof cites,
// written as the program states it (fact(...), implies(...) or
// implied_by(...)), then one step(Goal, By, Bindings, Uses) per inference. The
// document reader parses it as data; it never executes it.
//
// Verification follows recorded uses; it never asks the solver to find a
// missing derivation. Only pure primitives are independently recomputed.
import { PRIMITIVE_KEYS, primitive } from './builtins.js';
import { freshClause, text } from './common.js';
import { goalTerm } from './goals.js';
import { INSPECTION_KEYS, isInspection } from './inspection.js';
import { CONTROL_KEYS, Program } from './program.js';
import { readTerms } from './reader.js';
import { isActivation } from './templates.js';
import {
  Env, EyemindError, Struct, Var, conjunction, copyResolved, deref, flattenConjunction, freshTerm,
  isCallable, isGround, isTerm, key, listFromItems, properListItems, unify, variables,
} from './terms.js';
import { Lettering, letterName, quote, write, writeNotingVariables } from './writer.js';

// Several goals or conclusions are displayed as an array, as a program
// states them; a single one as itself.
function goalsDisplay(goals) {
  return goals.length === 1 ? goals[0] : listFromItems(goals);
}

// A clause as the program states it.
export function clauseDisplay(clause) {
  if (clause.forward) {
    // A query or a contradiction is displayed as the statement that wrote it.
    if (clause.head === 'true') return new Struct('query', clause.body);
    if (clause.head === 'false') return new Struct('contradiction', clause.body);
    return new Struct('implies', [goalsDisplay(clause.body), goalsDisplay(clause.heads)]);
  }
  if (clause.body.length) return new Struct('implied_by', [clause.head, goalsDisplay(clause.body)]);
  return new Struct('fact', [clause.head]);
}

function sameValue(a, b) {
  // Identical means the same canonical text: 0.0 and -0.0 differ.
  return typeof a === 'number' ? Object.is(a, b) : a === b;
}

// Whether term, read through env, is exactly target, variables included.
function resolvesTo(term, env, target) {
  const pending = [term, target];
  while (pending.length) {
    const expected = pending.pop();
    let actual = pending.pop();
    if (actual instanceof Var) actual = deref(actual, env);
    if (actual instanceof Struct) {
      if (!(expected instanceof Struct) || actual.name !== expected.name || actual.args.length !== expected.args.length) {
        return false;
      }
      for (let i = actual.args.length - 1; i >= 0; i--) pending.push(actual.args[i], expected.args[i]);
    } else if (actual instanceof Var) {
      if (!(expected instanceof Var) || actual.name !== expected.name) return false;
    } else if (expected instanceof Struct || expected instanceof Var || typeof actual !== typeof expected ||
               !sameValue(actual, expected)) {
      return false;
    }
  }
  return true;
}

// Whether goal is an instance of pattern: a copy of pattern renamed with
// suffix matches goal without binding any variable of goal.
function isInstance(goal, pattern, suffix) {
  const renamed = freshTerm(pattern, suffix);
  const env = new Env();
  return unify(renamed, goal, env) && resolvesTo(renamed, env, goal);
}

// The canonical text of terms, written once per term object. A proof names
// most goals several times, as a step and as a use, and the checks look each
// up more than once; the text is the same every time.
class Spellings {
  constructor() {
    this.memo = new Map();
  }

  entry(term) {
    if (!(term instanceof Struct)) {
      const [spelling, hasVariables] = writeNotingVariables(term);
      return [term, spelling, hasVariables];
    }
    let entry = this.memo.get(term);
    if (entry === undefined) {
      entry = [term, ...writeNotingVariables(term)];
      this.memo.set(term, entry);
    }
    return entry;
  }

  spell(term) {
    return this.entry(term)[1];
  }

  // The text of a term with its variables named by the lettering.
  lettered(term, lettering) {
    const [, spelling, hasVariables] = this.entry(term);
    return hasVariables ? write(term, null, lettering) : spelling;
  }
}

const PLAIN_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;

function bindingsText(bindings, lettering) {
  const parts = bindings.map(([name, value]) => {
    const label = PLAIN_KEY.test(name) ? name : quote(name);
    return `${label}: ${write(value, null, lettering)}`;
  });
  return `{${parts.join(', ')}}`;
}

// The proof document of a run's claims and their derivations. With
// checkable, also what checkRendered() needs to check it without reading the
// document back: the document and that, as a pair.
export function renderProof(program, claims, roots, checkable = false) {
  const spellings = new Spellings();
  const steps = new Map();
  const cited = new Set();
  const pending = [...roots].reverse();
  while (pending.length) {
    const node = pending.pop();
    const nodeId = spellings.spell(node.goal);
    if (steps.has(nodeId)) continue;
    steps.set(nodeId, node);
    if (node.by instanceof Struct) cited.add(Number(node.by.args[0]));
    for (let i = node.children.length - 1; i >= 0; i--) pending.push(node.children[i]);
  }
  // Variables are named A, B, ... in the order the document first shows
  // them, the claims written first, as in the run's conclusions.
  const lettering = new Lettering();
  const lines = claims.map((claim) => spellings.lettered(claim, lettering));
  lines.push('');
  for (const clauseId of [...cited].sort((a, b) => a - b)) {
    lines.push(text(new Struct('clause', [BigInt(clauseId), clauseDisplay(program.byId.get(clauseId))])));
  }
  lines.push('');
  for (const node of steps.values()) {
    const uses = `[${node.children.map((child) => spellings.lettered(child.goal, lettering)).join(', ')}]`;
    lines.push(`step(${spellings.lettered(node.goal, lettering)}, ${text(node.by)}, ` +
               `${bindingsText(node.bindings, lettering)}, ${uses})`);
  }
  const document = `${lines.join('\n')}\n`;
  if (!checkable) return document;
  // The steps as reading the document would give them: bindings as '='/2
  // pairs, uses as goals. Their variables keep the run's names, which the
  // document only spells differently, so the checks come out the same; what a
  // report shows of a term is spelled as the document spells it.
  const read = new Map();
  for (const [nodeId, node] of steps) {
    read.set(nodeId, {
      goal: node.goal,
      by: node.by,
      bindings: node.bindings.map(([name, value]) => new Struct('=', [name, value])),
      uses: node.children.map((child) => child.goal),
    });
  }
  return [document, [[...claims], read, spellings, (term) => spellings.lettered(term, lettering)]];
}

class Failures {
  constructor(name = text) {
    this.items = [];
    this.name = name;
  }

  add(condition, detail, term = null) {
    const record = { condition, detail };
    if (term !== null) record.conclusion = this.name(term);
    // The term itself stays out of JSON but is kept for the term report.
    this.items.push([record, term]);
  }
}

// Check a proof document against the program that produced it. goals names
// the goals the proof answers when they were asked from outside the program.
// allowTrusted false rejects any trusted boundary.
export function checkProof(program, document, { goals = null, allowTrusted = true } = {}) {
  if (!(program instanceof Program)) throw new EyemindError('checkProof() needs a Program; load one first');
  const fail = new Failures();
  const spellings = new Spellings();
  const [claims, steps] = readDocument(program, document, fail, spellings);
  return check(program, claims, steps, goals, allowTrusted, fail, spellings, text);
}

// Check a proof as renderProof(..., true) gave it: the report checkProof()
// gives for its document, without reading the document back. A reasoner
// checks its own proofs this way; their text is covered by the tests that
// what is written reads back as the same terms.
export function checkRendered(program, checkable, goals = null, allowTrusted = true) {
  const [claims, steps, spellings, name] = checkable;
  return check(program, claims, steps, goals, allowTrusted, new Failures(name), spellings, name);
}

function check(program, claims, steps, goals, allowTrusted, fail, spellings, name) {
  for (const claim of claims) {
    if (!flattenConjunction(claim).every((part) => steps.has(spellings.spell(part)))) {
      fail.add('C4', `unjustified claim ${text(claim)}`, claim);
    }
  }
  const tally = checkSteps(program, steps, allowTrusted, fail, spellings, name);
  const confronted = checkBoundaries(program, steps, tally.boundaries, fail);
  checkRelevance(program, claims, steps, goals || [], fail, spellings);
  checkWellFounded(steps, fail, spellings);
  let uses = 0;
  for (const step of steps.values()) uses += step.uses.length;
  const failed = (condition) => fail.items.filter(([record]) => record.condition === condition).length;
  const conditions = [
    { id: 'C1', name: 'resolution', covered: tally.verified, failed: failed('C1') },
    { id: 'C2', name: 'well_founded', covered: steps.size, failed: failed('C2') },
    { id: 'C3', name: 'justification', covered: steps.size, failed: failed('C3') },
    { id: 'C4', name: 'coverage', covered: claims.length + uses, failed: failed('C4') },
    { id: 'C5', name: 're_decision', covered: tally.redecided + tally.composed, failed: failed('C5') },
    { id: 'C6', name: 'boundary_consistency', covered: confronted, failed: failed('C6') },
    { id: 'C7', name: 'relevance', covered: claims.length + steps.size, failed: failed('C7') },
    { id: 'C8', name: 'witness_integrity', covered: tally.witnessed, failed: failed('C8') },
  ];
  return {
    valid: !fail.items.length,
    steps: steps.size,
    claims: claims.length,
    answers: claims.map((claim) => name(claim)),
    verified: tally.verified,
    redecided: tally.redecided,
    composed: tally.composed,
    uses,
    trusted: tally.trusted.map(([record]) => record),
    failures: fail.items.map(([record]) => record),
    conditions,
    // Terms behind the records, for the term report.
    failureTerms: fail.items.map(([, term]) => term),
    trustedTerms: tally.trusted.map(([, term]) => term),
  };
}

// The verdict allowTrusted false would give, from a report without it.
// Without failures, a strict check differs only in failing C5 once for each
// trusted boundary, in step order, so it needs no second reading of the
// document. A report with failures returns null: check again instead.
export function strict(report) {
  if (report.failures.length) return null;
  const failures = report.trusted.map((record) => ({
    condition: 'C5', detail: `trusted boundary forbidden: ${record.kind}`, conclusion: record.conclusion,
  }));
  const conditions = report.conditions.map((condition) => (
    condition.id === 'C5' ? { ...condition, failed: failures.length } : { ...condition }));
  return { ...report, valid: !failures.length, failures, conditions, failureTerms: [...report.trustedTerms] };
}

// C3: split a document into claims and steps keyed by the goal's text.
// clause/2 records are compared with the source.
function readDocument(program, document, fail, spellings) {
  const claims = [];
  const steps = new Map();
  const empty = new Env();
  try {
    for (const [term] of readTerms(document)) {
      if (isTerm(term, 'clause', 2)) {
        // These display records are not authority: the source program is.
        const clause = clauseNamed(program, term.args[0]);
        if (clause === null || !resolvesTo(term.args[1], empty, clauseDisplay(clause))) {
          fail.add('C1', 'clause display differs from source', term);
        }
        continue;
      }
      if (!isTerm(term, 'step', 4)) {
        claims.push(term);
        continue;
      }
      const [goal, by, bindingList, useList] = term.args;
      const bindings = properListItems(bindingList, empty);
      const uses = properListItems(useList, empty);
      if (bindings === null || uses === null) {
        fail.add('C3', 'step bindings must be an object and uses an array', goal);
        continue;
      }
      const goalId = spellings.spell(goal);
      if (steps.has(goalId)) {
        fail.add('C3', `duplicate justification for ${goalId}`, goal);
        continue;
      }
      steps.set(goalId, { goal, by, bindings, uses });
    }
  } catch (error) {
    if (!(error instanceof EyemindError)) throw error;
    fail.add('C3', error.message);
  }
  return [claims, steps];
}

function clauseNamed(program, id) {
  if (typeof id !== 'bigint' || id < 1n || id > BigInt(program.maxClauseId)) return null;
  return program.byId.get(Number(id)) ?? null;
}

const BUILTIN_BY = 'builtin';
const CONTROL_BY = 'control';

// C4, C1, C3 and C5 for each step: every use is justified, and the step is an
// instance of the clause it cites, a recomputed primitive, a control composed
// of its uses, or a trusted boundary the later checks confront.
function checkSteps(program, steps, allowTrusted, fail, spellings, name) {
  const tally = { verified: 0, redecided: 0, composed: 0, witnessed: 0, boundaries: [], trusted: [] };

  function covered(goal) {
    if (isTerm(goal, 'and', 2)) return flattenConjunction(goal).every(covered);
    if (steps.has(spellings.spell(goal))) return true;
    // Source facts are available as leaves, including universal facts.
    if (!isCallable(goal)) return false;
    return (program.groups.get(key(goal)) || [])
      .some((clause) => !clause.body.length && isInstance(goal, clause.head, 'given'));
  }

  for (const step of steps.values()) {
    const { goal, by, bindings, uses } = step;
    for (const use of uses) {
      if (!covered(use)) fail.add('C4', `unjustified use ${text(use)}`, goal);
    }
    if (isTerm(by, 'clause', 1)) {
      if (checkResolution(program, step, fail, tally)) tally.verified++;
    } else if (isTerm(by, 'source', 1)) {
      const clause = clauseNamed(program, by.args[0]);
      const inspected = clause === null ? null : program.inspectedById.get(clause.id);
      if (!inspected || bindings.length || uses.length || !isInspection(goal) ||
          !isInstance(goal, inspected.term, 'inspection')) {
        fail.add('C1', `not an instance of inspectable source rule ${text(by.args[0])}: ${text(goal)}`, goal);
      } else tally.verified++;
    } else if (by === BUILTIN_BY) {
      if (bindings.length || uses.length || !isCallable(goal) || !PRIMITIVE_KEYS.has(key(goal))) {
        fail.add('C3', 'invalid builtin justification', goal);
        continue;
      }
      let agrees = false;
      try {
        for (const env of primitive(goal, new Env())) {
          if (resolvesTo(goal, env, goal)) {
            agrees = true;
            break;
          }
        }
      } catch (error) {
        // A primitive that cannot be recomputed does not pass C5.
        if (!(error instanceof EyemindError)) throw error;
      }
      if (!agrees) fail.add('C5', `primitive disagrees: ${text(goal)}`, goal);
      else tally.redecided++;
    } else if (by === CONTROL_BY) {
      let candidates = [];
      if (isTerm(goal, 'call', 1) || isTerm(goal, 'once', 1)) candidates = [goal.args[0]];
      else if (isTerm(goal, 'or', 2)) candidates = [...goal.args];
      const composes = (candidate) => {
        const parts = flattenConjunction(candidate);
        return parts.length === uses.length && parts.every((part, i) => spellings.spell(part) === spellings.spell(uses[i]));
      };
      if (bindings.length || !candidates.some(composes)) {
        fail.add('C5', `control step does not follow from its uses: ${text(goal)}`, goal);
      } else {
        tally.composed++;
      }
    } else if ((by === 'absent' && isTerm(goal, 'not', 1)) || (by === 'collected' && isTerm(goal, 'findall', 3))) {
      if (bindings.length || uses.length) fail.add('C3', 'trusted boundaries cannot have bindings or uses', goal);
      tally.boundaries.push(goal);
      tally.trusted.push([{ kind: by, conclusion: name(goal) }, goal]);
      if (!allowTrusted) fail.add('C5', `trusted boundary forbidden: ${by}`, goal);
    } else {
      fail.add('C3', `unknown justification ${text(by)}`, goal);
    }
  }
  return tally;
}

const isConstant = (term) => typeof term === 'string' || typeof term === 'bigint' || typeof term === 'number';

// Shortcuts the checker may take; tests turn them off to compare with the
// general path.
export const shortcuts = { flatResolution: true };

// Check a ground instance of a flat backward clause by substitution. null
// delegates structured arguments, proof variables and forward heads to the
// general unifier. Flat ground steps need neither renamed terms nor a
// substitution trail: source variables can be matched directly.
function flatResolution(clause, goal, bindings, uses) {
  if (clause.forward) return null;
  const values = new Map();
  for (const binding of bindings) {
    if (!isTerm(binding, '=', 2) || typeof binding.args[0] !== 'string' || values.has(binding.args[0])) return false;
    if (!isConstant(binding.args[1])) return null;
    values.set(binding.args[0], binding.args[1]);
  }
  const declared = new Set(values.keys());
  const names = new Set();
  if (clause.body.length !== uses.length) return false;
  const patterns = [clause.head, ...clause.body];
  const targets = [goal, ...uses];
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const target = targets[i];
    if (pattern instanceof Var || target instanceof Var) return null;
    if (pattern instanceof Struct && target instanceof Struct) {
      if (pattern.name !== target.name || pattern.args.length !== target.args.length) return false;
      for (let j = 0; j < pattern.args.length; j++) {
        let expected = pattern.args[j];
        const actual = target.args[j];
        if (expected instanceof Struct || actual instanceof Struct || actual instanceof Var) return null;
        if (expected instanceof Var) {
          names.add(expected.name);
          if (!values.has(expected.name)) {
            values.set(expected.name, actual);
            continue;
          }
          expected = values.get(expected.name);
        }
        if (typeof expected !== typeof actual || !sameValue(expected, actual)) return false;
      }
    } else if (pattern instanceof Struct || target instanceof Struct || typeof pattern !== typeof target ||
               !sameValue(pattern, target)) {
      return false;
    }
  }
  for (const name of declared) if (!names.has(name)) return false;
  return true;
}

// C1: a clause step names a source clause, its bindings name distinct
// variables of that clause, and under them one of the clause's heads is the
// step's goal and its body is exactly the step's uses. C8 is checked under
// the same substitution.
function checkResolution(program, step, fail, tally) {
  const { goal, by, bindings, uses } = step;
  const clauseId = by.args[0];
  const clause = clauseNamed(program, clauseId);
  if (clause === null) {
    fail.add('C1', `unknown clause ${text(by)}`, goal);
    return false;
  }
  const flat = shortcuts.flatResolution ? flatResolution(clause, goal, bindings, uses) : null;
  if (flat !== null) {
    if (!flat) fail.add('C1', `not an instance of source clause ${clauseId}: ${text(goal)}`, goal);
    return flat;
  }
  const [head, body, names] = freshClause(clause, `check${clauseId}`);
  const env = new Env();
  const seen = new Set();
  let valid = true;
  for (const binding of bindings) {
    if (!isTerm(binding, '=', 2) || typeof binding.args[0] !== 'string' || !names.has(binding.args[0]) ||
        seen.has(binding.args[0])) {
      valid = false;
      break;
    }
    seen.add(binding.args[0]);
    if (!unify(names.get(binding.args[0]), binding.args[1], env)) valid = false;
  }
  const heads = clause.forward ? flattenConjunction(head) : [head];
  let resolution = false;
  let witnesses = null;
  for (const candidate of heads) {
    const mark = env.mark();
    let matches = unify(candidate, goal, env) && body.length === uses.length;
    for (let i = 0; matches && i < body.length; i++) {
      if (!unify(body[i], uses[i], env)) matches = false;
    }
    if (matches && resolvesTo(candidate, env, goal) && body.every((item, i) => resolvesTo(item, env, uses[i]))) {
      resolution = true;
      // Any head the step can be an instance of decides; a verified witness wins.
      const found = clause.forward ? checkWitnesses(clause, head, names, env) : null;
      if (found !== null && witnesses !== true) witnesses = found;
    }
    env.undo(mark);
  }
  if (!valid || !resolution) {
    fail.add('C1', `not an instance of source clause ${clauseId}: ${text(goal)}`, goal);
    return false;
  }
  if (witnesses === false) fail.add('C8', `not the witness of this firing of clause ${clauseId}: ${text(goal)}`, goal);
  else if (witnesses === true) tally.witnessed++;
  return true;
}

// C8: under a step's substitution, each witness of a forward rule is the
// Skolem term of this firing, skolem(Rule, Variable, Arguments), where
// Arguments are the ground values of the conclusions' other variables, in
// order of first occurrence, leaving out those that hold a witness of this
// firing: the term the reasoner makes (Section 7.2). Returns null when the
// rule has no witnesses, else whether they all hold; head is the rule's
// renamed conclusions and names maps its variables to their renamed ones.
function checkWitnesses(clause, head, names, env) {
  const witnessed = clause.witnessNames;
  if (!witnessed.length) return null;
  // An existential firing needs bound inspection values. A generic rule
  // pattern cannot silently share one witness across all its instances.
  if (!isGround(copyResolved(head, env))) return false;
  let firing = null;
  for (const name of witnessed) {
    const value = copyResolved(names.get(name), env);
    if (!isTerm(value, 'skolem', 3) || value.args[0] !== BigInt(clause.id) || !witnessName(value.args[1], name)) return false;
    if (firing === null) firing = value.args[2];
    else if (text(value.args[2]) !== text(firing)) return false;
  }
  const ofThisFiring = (term) => {
    const pending = [term];
    while (pending.length) {
      const item = pending.pop();
      if (!(item instanceof Struct)) continue;
      if (item.name === 'skolem' && item.args.length === 3 && item.args[0] === BigInt(clause.id) &&
          text(item.args[2]) === text(firing)) return true;
      pending.push(...item.args);
    }
    return false;
  };
  // Recover captures from the source clause and substitution, independently
  // of the proposed witness, including captures the head does not mention.
  const expected = clause.captures === null ? [] : [listFromItems(
    clause.captures.map((name) => copyResolved(names.get(name), env)),
  )];
  for (const variable of variables(head).values()) {
    const value = copyResolved(variable, env);
    if (isGround(value) && !ofThisFiring(value)) expected.push(value);
  }
  return text(listFromItems(expected)) === text(firing);
}

// The name a witness of variable name carries: the name itself, or with a
// number when a value of the firing brought in a variable of the same name.
function witnessName(written, name) {
  if (typeof written !== 'string' || !written.startsWith(name)) return false;
  return written === name || /^[0-9]+$/.test(written.slice(name.length));
}

// C6: a trusted boundary cannot be proved, but evidence at hand can refute
// it. An absence fails when a source fact, a step of this certificate or a
// recomputed primitive is a solution; a collection fails when such a solution
// is missing from its list. Returns how many boundaries the evidence could
// speak for.
function checkBoundaries(program, steps, boundaries, fail) {
  const stepGoals = new Map();
  for (const step of steps.values()) {
    if (isCallable(step.goal)) {
      const goalKey = key(step.goal);
      if (!stepGoals.has(goalKey)) stepGoals.set(goalKey, []);
      stepGoals.get(goalKey).push(step.goal);
    }
  }
  let serial = 0;
  let confronted = 0;
  const nextSerial = () => ++serial;

  // Each solution of a simple goal that the evidence shows, or null when the
  // evidence cannot speak for the goal.
  function evidence(goal) {
    if (!isCallable(goal)) return null;
    const goalKey = key(goal);
    if (PRIMITIVE_KEYS.has(goalKey)) {
      if (!isGround(goal)) return null;
      try {
        for (const _ of primitive(goal, new Env())) return [goal]; // eslint-disable-line no-unused-vars
      } catch (error) {
        if (!(error instanceof EyemindError)) throw error;
        return null;
      }
      return [];
    }
    if (CONTROL_KEYS.has(goalKey)) return null;
    if (INSPECTION_KEYS.has(goalKey)) {
      return program.inspections.get(goalKey).map((entry) => freshTerm(entry.term, `evidence${nextSerial()}`));
    }
    const facts = (program.groups.get(goalKey) || [])
      .filter((clause) => !clause.body.length && !clause.forward)
      .map((clause) => freshTerm(clause.head, `evidence${nextSerial()}`));
    return [...facts, ...(stepGoals.get(goalKey) || []).map((item) => freshTerm(item, `evidence${nextSerial()}`))];
  }

  for (const boundary of boundaries) {
    if (isTerm(boundary, 'not', 1)) {
      const parts = flattenConjunction(boundary.args[0]);
      // Without a join, only a single goal or a ground conjunction is decided.
      if (parts.length > 1 && !isGround(boundary.args[0])) continue;
      const shown = parts.map(evidence);
      if (shown.some((items) => items === null)) continue;
      confronted++;
      const solved = parts.every((part, i) => shown[i].some((item) => unify(freshTerm(part, `absent${nextSerial()}`), item, new Env())));
      if (solved) fail.add('C6', `absence contradicted by evidence: ${text(boundary)}`, boundary);
    } else {
      const items = properListItems(boundary.args[2], new Env());
      if (items === null) {
        fail.add('C6', `collected result is not a proper list: ${text(boundary)}`, boundary);
        continue;
      }
      const parts = flattenConjunction(boundary.args[1]);
      const shown = parts.length === 1 ? evidence(parts[0]) : null;
      if (shown === null) continue;
      confronted++;
      for (const item of shown) {
        const names = new Map();
        const number = nextSerial();
        const pattern = freshTerm(boundary.args[0], `collect${number}`, names);
        const goal = freshTerm(parts[0], `collect${number}`, names);
        const env = new Env();
        if (!unify(goal, item, env)) continue;
        const answer = copyResolved(pattern, env);
        const listed = items.some((element) => unify(answer, freshTerm(element, `listed${nextSerial()}`), new Env()));
        if (!listed) {
          fail.add('C6', `collection misses ${text(answer)}: ${text(boundary)}`, boundary);
          break;
        }
      }
    }
  }
  return confronted;
}

// C7: the certificate answers the question that was asked and carries nothing
// beside it. A claim is an instance of a goal asked from outside, of a
// query() goal or, for printed conclusions, of a forward head.
function checkRelevance(program, claims, steps, goals, fail, spellings) {
  let serial = 0;
  const instanceOf = (claim, question) => isInstance(claim, question, `asked${++serial}`);
  const asked = goals.map(goalTerm);
  const halted = claims.some((claim) => claim === 'false');
  const questions = [];
  if (asked.length && !halted) {
    questions.push(...asked);
  } else {
    for (const clause of program.forward) {
      if (clause.heads.some((head) => head === 'true')) {
        if (!halted && clause.body.length) questions.push(conjunction(clause.body));
      }
      for (const head of clause.heads) if (head !== 'true' && !isActivation(head)) questions.push(head);
    }
  }
  for (const claim of claims) {
    if (!questions.some((question) => instanceOf(claim, question))) fail.add('C7', `claim answers no goal: ${text(claim)}`, claim);
  }
  const reached = new Set();
  const reach = [];
  for (const claim of claims) for (const part of flattenConjunction(claim)) reach.push(spellings.spell(part));
  while (reach.length) {
    const stepId = reach.pop();
    if (reached.has(stepId) || !steps.has(stepId)) continue;
    reached.add(stepId);
    for (const use of steps.get(stepId).uses) {
      for (const part of flattenConjunction(use)) reach.push(spellings.spell(part));
    }
  }
  for (const [stepId, step] of steps) {
    if (!reached.has(stepId)) fail.add('C7', `step serves no claim: ${stepId}`, step.goal);
  }
}

// C2: no step depends on itself, walked iteratively.
function checkWellFounded(steps, fail, spellings) {
  const visiting = new Set();
  const visited = new Set();
  function supports(stepId) {
    const used = [];
    const step = steps.get(stepId);
    for (const use of step ? step.uses : []) {
      for (const part of flattenConjunction(use)) {
        const partId = spellings.spell(part);
        if (steps.has(partId)) used.push(partId);
      }
    }
    return used;
  }
  for (const start of steps.keys()) {
    if (visited.has(start)) continue;
    visiting.add(start);
    const stack = [[start, supports(start), 0]];
    while (stack.length) {
      const top = stack[stack.length - 1];
      if (top[2] >= top[1].length) {
        visiting.delete(top[0]);
        visited.add(top[0]);
        stack.pop();
        continue;
      }
      const following = top[1][top[2]];
      top[2]++;
      if (visiting.has(following)) {
        fail.add('C2', `cyclic derivation at ${following}`, steps.get(following).goal);
        continue;
      }
      if (visited.has(following)) continue;
      visiting.add(following);
      stack.push([following, supports(following), 0]);
    }
  }
}

function verdict(report) {
  if (!report.valid) return new Struct('failed', [BigInt(report.failures.length)]);
  return report.trusted.length ? 'checked_with_obligations' : 'checked';
}

// Rename a report fact's variables A, B, C, ... in order of appearance.
function lettered(term) {
  const names = new Map();
  function visit(t) {
    if (t instanceof Var) {
      if (!names.has(t.name)) names.set(t.name, new Var(letterName(names.size)));
      return names.get(t.name);
    }
    if (t instanceof Struct) return new Struct(t.name, t.args.map(visit));
    return t;
  }
  return visit(term);
}

// The report as JavaScript source, one fact per line, every condition included.
export function checkReport(report) {
  const facts = [];
  for (const condition of report.conditions) {
    const outcome = condition.failed ? new Struct('failed', [BigInt(condition.failed)]) : 'ok';
    facts.push(new Struct('condition', [condition.id, condition.name, outcome, BigInt(condition.covered)]));
  }
  report.failures.forEach((record, i) => {
    const term = report.failureTerms[i];
    const subject = term !== null ? term : (record.conclusion ?? 'proof_document');
    facts.push(new Struct('failure', [record.condition, subject, record.detail]));
  });
  report.trusted.forEach((record, i) => {
    const term = report.trustedTerms[i];
    facts.push(new Struct('obligation', [record.kind, record.reason ?? 'theory_scoped', term !== null ? term : record.conclusion]));
  });
  for (const [name, count] of [['steps', report.steps], ['verified', report.verified], ['recomputed', report.redecided],
    ['composed', report.composed], ['trusted', report.trusted.length], ['claims', report.claims]]) {
    facts.push(new Struct(name, [BigInt(count)]));
  }
  facts.push(new Struct('verdict', [verdict(report)]));
  const heading = !report.valid ? '// Unverified claims: proof checking failed.'
    : !report.answers.length ? '// No answers claimed; this check establishes no conclusions.'
    : report.trusted.length ? '// Answers checked subject to the obligations below.'
    : '// Checked answers: these follow from the input program.';
  const lines = [heading, ...report.answers, '',
    '// C1-C8: resolution, acyclicity, justification, coverage,',
    '// re-decision, boundary consistency, relevance and witness integrity.'];
  let previous = null;
  for (const fact of facts) {
    if (fact.name === 'failure' && previous !== 'failure') {
      lines.push('', '// Failures: the claims above have not passed every check.');
    }
    if (fact.name === 'obligation' && previous !== 'obligation') {
      lines.push('', '// Obligations: absence and collection completeness are taken on trust.');
    }
    if (fact.name === 'steps') lines.push('', '// Proof statistics: recorded steps and how they were checked.');
    if (fact.name === 'verdict') lines.push('', '// This verdict applies to the claims above; it does not establish completeness.');
    lines.push(text(lettered(fact)));
    previous = fact.name;
  }
  return `${lines.join('\n')}\n`;
}

export function verdictText(report) {
  return `${text(new Struct('verdict', [verdict(report)]))}\n`;
}

// The report without its term-valued internals, ready for JSON.
export function publicReport(report) {
  const { failureTerms, trustedTerms, ...rest } = report; // eslint-disable-line no-unused-vars
  return rest;
}
