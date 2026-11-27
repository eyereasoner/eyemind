// Proof documents: rendering, and checking them against the source program.
//
// A proof document is JavaScript source, one expression per line: first the
// claims, then one step(Goal, By, Bindings, Uses) per recorded inference a
// derived fact rests on, then the certificate: derived(Pattern, Facts)
// listings of derived facts and called(Call, Answers) tables of every answer
// of a call. The document reader parses it as data; it never executes it.
//
// Checking answers the original questions from the certificate, each table
// checked against the source program, and replays every derived fact the
// answers rest on from its recorded firing (fidelity.js). It never asks the
// solver to find a missing derivation, and every step, table and listing must
// be used by the check.
import { text, variant } from './common.js';
import { checkAnswers } from './fidelity.js';
import { Program } from './program.js';
import {
  Env, EyemindError, Struct, Var, flattenConjunction, isCallable, isGround, isTerm, key, keyArity, keyName, listFromItems,
  properListItems, variables,
} from './terms.js';
import { readTerms } from './reader.js';
import { Lettering, quote, write, writeNotingVariables } from './writer.js';

// Several goals or conclusions are displayed as an array, as a program
// states them; a single one as itself.
function goalsDisplay(goals) {
  return goals.length === 1 ? goals[0] : listFromItems(goals);
}

function templateDisplay(term) {
  if (!(term instanceof Struct)) return term;
  const name = term.args.length === 2 && term.name === 'forward' ? 'implies'
    : term.args.length === 2 && term.name === 'backward' ? 'implied_by' : term.name;
  return new Struct(name, term.args.map(templateDisplay));
}

// A clause as the program states it.
export function clauseDisplay(clause) {
  if (clause.forward) {
    // A query or a contradiction is displayed as the statement that wrote it.
    if (clause.head === 'true') return new Struct('query', clause.body);
    if (clause.head === 'false') return new Struct('contradiction', clause.body);
    const heads = flattenConjunction(clause.originalHead ?? clause.head);
    return new Struct(clause.restricted ? 'restricted' : 'implies', [goalsDisplay(clause.statedBody ?? clause.body), goalsDisplay(clause.templates.length ? heads.map(templateDisplay) : heads)]);
  }
  if (clause.body.length) return new Struct('implied_by', [clause.head, goalsDisplay(clause.body)]);
  return new Struct('fact', [clause.head]);
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

// The most general goal of a name and arity, as a listing of derived facts
// names its relation.
function relationPattern(goalKey) {
  const arity = keyArity(goalKey);
  if (!arity) return keyName(goalKey);
  return new Struct(keyName(goalKey), Array.from({ length: arity }, (_, i) => new Var(`_relation${i}`)));
}

// The proof document of a run's claims, opened by heading, the comment that
// says what the claims are. certificate holds the listings, as [Key, Nodes]
// with the nodes of each listed derived fact, the call tables, as
// [Call, Answers], and followed, the goals whose steps its replays follow:
// the steps the proof holds. firings holds the nodes of further claims to
// replay, those of a halted run. With checkable, also what checkRendered() needs to check it
// without reading the document back: the document and that, as a pair.
// Comments are ignored when it is read.
export function renderProof(program, claims, certificate, firings = [], checkable = false, heading = null) {
  const spellings = new Spellings();
  const steps = new Map();
  const seen = new Set();
  const pending = [...certificate.listings.flatMap(([, nodes]) => nodes), ...firings].reverse();
  while (pending.length) {
    const node = pending.pop();
    const nodeId = spellings.spell(node.goal);
    if (steps.has(nodeId) || seen.has(node)) continue;
    seen.add(node);
    for (let i = node.children.length - 1; i >= 0; i--) pending.push(node.children[i]);
    if (!certificate.followed.has(text(node.goal))) continue;
    // A derived pattern another step already shows, up to the renaming of its
    // variables, needs no second step.
    if (!isGround(node.goal) &&
        [...steps.values()].some((step) => !isGround(step.goal) && variant(step.goal) === variant(node.goal))) continue;
    steps.set(nodeId, node);
  }
  // Variables are named A, B, ... in the order the document first shows
  // them, the claims written first, as in the run's conclusions.
  const lettering = new Lettering();
  const lines = heading === null ? [] : [heading];
  for (const claim of claims) lines.push(spellings.lettered(claim, lettering));
  if (steps.size) {
    lines.push('', '// Steps: each derived fact and what it rests on: the clause or control that',
      '// justifies it, the bindings and the goals it uses.');
  }
  for (const node of steps.values()) {
    const uses = `[${node.children.map((child) => spellings.lettered(child.goal, lettering)).join(', ')}]`;
    lines.push(`step(${spellings.lettered(node.goal, lettering)}, ${text(node.by)}, ` +
               `${bindingsText(node.bindings, lettering)}, ${uses})`);
  }
  const read = { calls: new Map(), callTerms: new Map(), listings: new Map() };
  if (certificate.tables.length || certificate.listings.length) {
    lines.push('', '// Certificate: the derived facts and every answer of each call the questions make.');
  }
  for (const [goalKey, nodes] of certificate.listings) {
    const facts = nodes.map((node) => node.goal);
    lines.push(spellings.lettered(new Struct('derived', [relationPattern(goalKey), listFromItems(facts)]), lettering));
    read.listings.set(goalKey, facts);
  }
  // Call tables keep the distinction between named and anonymous variables,
  // because a named unbound variable makes a negation an error.
  const callNames = new Lettering(true);
  for (const [call, answers] of certificate.tables) {
    lines.push(spellings.lettered(new Struct('called', [call, listFromItems(answers)]), callNames));
    read.calls.set(variant(call, true), answers);
    read.callTerms.set(variant(call, true), call);
  }
  const document = `${lines.join('\n')}\n`;
  if (!checkable) return document;
  // The steps as reading the document would give them: bindings as '='/2
  // pairs, uses as goals. Their variables keep the run's names, which the
  // document only spells differently, so the check comes out the same; what a
  // report shows of a term is spelled as the document spells it.
  const readSteps = new Map();
  for (const [nodeId, node] of steps) {
    readSteps.set(nodeId, {
      goal: node.goal,
      by: node.by,
      bindings: node.bindings.map(([name, value]) => new Struct('=', [name, value])),
      uses: node.children.map((child) => child.goal),
    });
  }
  return [document, [[...claims], readSteps, spellings, (term) => spellings.lettered(term, lettering), read]];
}

class Failures {
  constructor(name = text) {
    this.items = [];
    this.name = name;
  }

  add(detail, term = null) {
    // The term itself stays out of JSON but is kept for the term report.
    this.items.push([detail, term]);
  }
}

// Check a proof document against the program that produced it. goals names
// the goals the proof answers when they were asked from outside the program.
export function checkProof(program, document, { goals = null } = {}) {
  if (!(program instanceof Program)) throw new EyemindError('checkProof() needs a Program; load one first');
  const fail = new Failures();
  const spellings = new Spellings();
  const [claims, steps, certificate] = readDocument(document, fail, spellings);
  return check(program, claims, steps, certificate, goals, fail, spellings, text);
}

// The parts of a proof document, for reading a checked proof: its claims,
// its steps by goal, the step of a goal, and its certificate.
export function readProof(document) {
  const fail = new Failures();
  const spellings = new Spellings();
  const [claims, steps, certificate] = readDocument(document, fail, spellings);
  if (fail.items.length) throw new EyemindError(fail.items[0][0]);
  return { claims, certificate, stepOf: (goal) => steps.get(stepIdOf(steps, spellings, goal)) };
}

// Check a proof as renderProof(..., true) gave it: the report checkProof()
// gives for its document, without reading the document back. A reasoner
// checks its own proofs this way; their text is covered by the tests that
// what is written reads back as the same terms.
export function checkRendered(program, checkable, goals = null) {
  const [claims, steps, spellings, name, certificate] = checkable;
  return check(program, claims, steps, certificate, goals, new Failures(name), spellings, name);
}

// The step of a goal: by its spelling, or for a derived pattern up to the
// renaming of its variables (Section 6.3), since a listing may spell a
// pattern's variables differently from the step that derives it.
const patternSteps = new WeakMap();
export function stepIdOf(steps, spellings, goal) {
  const stepId = spellings.spell(goal);
  if (steps.has(stepId) || isGround(goal)) return stepId;
  let index = patternSteps.get(steps);
  if (index === undefined) {
    index = new Map();
    for (const [id, step] of steps) if (!isGround(step.goal) && !index.has(variant(step.goal))) index.set(variant(step.goal), id);
    patternSteps.set(steps, index);
  }
  return index.get(variant(goal)) ?? stepId;
}

function check(program, claims, steps, certificate, goals, fail, spellings, name) {
  const usedSteps = new Set();
  const stepOf = (goal) => {
    const stepId = stepIdOf(steps, spellings, goal);
    const step = steps.get(stepId);
    if (step) usedSteps.add(stepId);
    return step;
  };
  const used = checkAnswers(program, claims, goals, certificate, stepOf, fail);
  // Nothing in a proof goes unchecked.
  for (const [stepId, step] of steps) {
    if (!usedSteps.has(stepId)) fail.add(`the check does not use the step of ${stepId}`, step.goal);
  }
  for (const [goalKey] of certificate.listings) {
    if (!used.listings.has(goalKey)) fail.add(`the check does not use the derived facts of ${goalKey}`);
  }
  for (const [callKey, call] of certificate.callTerms) {
    if (!used.tables.has(callKey)) fail.add(`the check does not use the call table of ${text(call)}`, call);
  }
  return {
    valid: !fail.items.length,
    claims: claims.length,
    steps: steps.size,
    answers: claims.map((claim) => name(claim)),
    halted: claims.includes('false'),
    failures: fail.items.map(([detail, term]) => (term === null ? { detail } : { detail, subject: fail.name(term) })),
    // Terms behind the records, for the term report.
    failureTerms: fail.items.map(([, term]) => term),
  };
}

// Split a document into claims, steps keyed by the goal's text, and the
// statements of its certificate. Every statement that is no step, listing or
// call table is a claim.
function readDocument(document, fail, spellings) {
  const claims = [];
  const steps = new Map();
  const certificate = { calls: new Map(), callTerms: new Map(), listings: new Map() };
  const empty = new Env();
  try {
    for (const [term] of readTerms(document)) {
      // A writer names a proof's variables itself; the checker's own names,
      // which mark where a variable came from, are not for a document to use.
      if ([...variables(term).keys()].some((name) => name.includes('#'))) {
        fail.add('a proof names its variables A, B, ... or _0, _1, ..., never with #', term);
        continue;
      }
      if (isTerm(term, 'derived', 2) || isTerm(term, 'called', 2)) {
        readCertificate(term, certificate, fail, empty);
        continue;
      }
      if (!isTerm(term, 'step', 4)) {
        claims.push(term);
        continue;
      }
      const [goal, by, bindingList, useList] = term.args;
      const bindings = properListItems(bindingList, empty);
      const uses = properListItems(useList, empty);
      if (bindings === null || uses === null || !bindings.every((pair) => isTerm(pair, '=', 2))) {
        fail.add('step bindings must be an object and uses an array', goal);
        continue;
      }
      const goalId = spellings.spell(goal);
      if (steps.has(goalId)) {
        fail.add(`duplicate step for ${goalId}`, goal);
        continue;
      }
      steps.set(goalId, { goal, by, bindings, uses });
    }
  } catch (error) {
    if (!(error instanceof EyemindError)) throw error;
    fail.add(error.message);
  }
  return [claims, steps, certificate];
}

// A certificate statement: called/2, listing every answer of its call, or
// derived/2, listing every fact forward rules derived for the relation of
// its pattern.
function readCertificate(term, certificate, fail, empty) {
  const [subject, list] = term.args;
  const items = properListItems(list, empty);
  const table = term.name === 'called';
  // A listing names its relation by the name applied to distinct variables.
  const pattern = table || typeof subject === 'string' || (subject instanceof Struct &&
    subject.args.every((arg, i) => arg instanceof Var && subject.args.findIndex((other) => other instanceof Var && other.name === arg.name) === i));
  if (!isCallable(subject) || items === null || !pattern) {
    fail.add(table ? 'a call table must be called(Goal, Answers) with an array of answers'
      : 'a listing must be derived(Pattern, Facts) with an array of facts', subject);
    return;
  }
  const entryKey = table ? variant(subject, true) : key(subject);
  const entries = table ? certificate.calls : certificate.listings;
  if (entries.has(entryKey)) {
    fail.add(`duplicate ${table ? 'call table' : 'listing'} for ${table ? text(subject) : entryKey}`, subject);
    return;
  }
  entries.set(entryKey, items);
  if (table) certificate.callTerms.set(entryKey, subject);
}

function verdict(report) {
  return report.valid ? 'checked' : new Struct('failed', [BigInt(report.failures.length)]);
}

// The report as JavaScript source: the claims, any failures, and the verdict.
// Explain a successful check only after the whole procedure has passed.
export function checkReport(report) {
  const heading = !report.valid ? '// Unverified claims: proof checking failed.'
    : report.halted ? '// Checked claims: these follow from the input program, which halted.'
    : !report.answers.length ? '// No answers: the original questions have none.'
    : '// Checked answers: these follow from the input program and are every answer of its questions.';
  const lines = [heading, ...report.answers, ''];
  if (report.failures.length) {
    lines.push('// Failures: what the check could not establish.');
    for (const { detail } of report.failures) lines.push(text(new Struct('failure', [detail])));
    lines.push('');
  }
  if (report.valid) {
    lines.push('// Proof check (SPEC 11.2-11.6):');
    if (report.halted) {
      lines.push("// Halted proof: every claim, including 'false', replays its recorded firing.",
        '// Answer completeness is not established for a halted proof.');
    } else {
      lines.push('// Questions: every claim is an answer, and every required answer is claimed.');
    }
    lines.push('// Call tables: every consulted table matches its one-level expansion against the program.',
      '// Derived listings: every consulted listing is closed under the forward rules.',
      '// Replay: every required firing replays from no bindings; primitives, controls and',
      '// Skolem witnesses are checked at the bindings where they run.',
      '// Evidence: every recorded step, call table and listing is used by the check.');
  } else {
    lines.push('// Proof check (SPEC 11): failed; no claim is certified by this report.');
  }
  lines.push('');
  lines.push(text(new Struct('verdict', [verdict(report)])));
  return `${lines.join('\n')}\n`;
}

export function verdictText(report) {
  return `${text(new Struct('verdict', [verdict(report)]))}\n`;
}

// The report without its term-valued internals, ready for JSON.
export function publicReport(report) {
  const { failureTerms, ...rest } = report; // eslint-disable-line no-unused-vars
  return rest;
}
