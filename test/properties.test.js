// Generated tests: properties that must hold for every input, checked on
// inputs made by a seeded generator rather than written by hand.
//
// - A forged proof never certifies a claim that does not hold: saved example
//   proofs are mutated at random, and whatever the checker accepts as checked
//   claims only what the program entails. A proof checked with obligations
//   may claim more only by changing or adding an obligation, which its report
//   lists and a strict check, trusting no obligation, rejects.
//   Each forged proof is also checked without the checker's fast path for
//   flat clauses, and both must give the same report.
// - Reasoning agrees with an independent naive fixpoint on random stratified
//   programs, forward and backward, and every proof of it checks; leaving out
//   a clause no derivation cites, or stating the clauses in another order,
//   does not change the fixpoint.
// - A random program that classic stratification rejects but chain
//   stratification accepts has a stable model as its result, the same
//   whatever the order of its rules or of rule applications, every proof of
//   it checks, and a forged one certifies nothing else.
// - Random programs with restricted rules derive what a direct reading of
//   the specification derives, and every proof of them checks.
// - Every term reads back from its canonical text as itself.
// - The document reader returns terms or raises an EyemindError on any text,
//   and never runs any of it.
//
// Each property runs a fixed number of seeded cases, so a run is repeatable
// and a failure names the seed that reproduces it. EYEMIND_PROPERTY_SCALE
// multiplies the number of cases for a deeper search.
import { readFileSync } from 'node:fs';
import { EyemindError, Program, Struct, Var, checkProof, publicReport, readGoal, readNativeProof, readProofTerms, readTerm, readTerms, run, write, writeNativeProof } from '../src/index.js';
import { shortcuts } from '../src/proof.js';
import { apply } from '../src/arith.js';
import { compareText, identity } from '../src/terms.js';
import { artifactPath, loadExample, readManifest, sourceFiles } from '../tools/corpus.js';
import { assert, program, throwsMatching } from './helpers.js';

const SCALE = Math.max(1, Number(process.env.EYEMIND_PROPERTY_SCALE) || 1);

// A small, fast, seeded generator (mulberry32).
function random(seed) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const below = (n) => Math.floor(next() * n);
  return { next, below, pick: (items) => items[below(items.length)], chance: (p) => next() < p };
}

// Run fn for each seed, naming the seed in any failure.
function forSeeds(count, fn) {
  for (let seed = 1; seed <= count * SCALE; seed++) {
    try {
      fn(random(seed), seed);
    } catch (error) {
      error.message = `seed ${seed}: ${error.message}`;
      throw error;
    }
  }
}

// --- Terms --------------------------------------------------------------

const ATOMS = ['a', '', 'a b', "it's", 'say "hi"', 'back\\slash', 'line\nbreak', 'tab\there', '\u0000', '\u2028',
  '\ud800', '\udc00', '\ue000', '\uffff', 'é', '😀', '\u0001\u0000a\u0001',
  '[]', 'and', 'or', 'struct', 'class', 'VAR_X', '_', 'X', '-1', '1.0', 'true', 'null'];
const NAMES = ['f', 'g', 'and', 'or', 'struct', 'class', 'a b', 'x$', '', 'é', '[]', '.', 'step', 'VAR_f'];
const VARIABLES = ['X', 'Y', '_0', 'X#1', 'VAR_X', 'é', 'a b', 'class', '_', 'X_1'];
const NUMBERS = [0n, 1n, -1n, 9007199254740993n, -(10n ** 40n), 0.5, -0.0, 0.0, 1e22, 1e-5, 5e-324, -1.75, 2.0];

function randomTerm(r, depth = 0) {
  const leaf = depth > 3 || r.chance(0.35);
  if (leaf) {
    const kind = r.below(3);
    if (kind === 0) return r.pick(ATOMS);
    if (kind === 1) return r.pick(NUMBERS);
    return new Var(r.pick(VARIABLES));
  }
  if (r.chance(0.3)) {
    const items = Array.from({ length: r.below(4) }, () => randomTerm(r, depth + 1));
    let tail = r.chance(0.25) ? new Var(r.pick(VARIABLES)) : '[]';
    for (let i = items.length - 1; i >= 0; i--) tail = new Struct('.', [items[i], tail]);
    return tail;
  }
  const arity = 1 + r.below(3);
  return new Struct(r.pick(NAMES), Array.from({ length: arity }, () => randomTerm(r, depth + 1)));
}

// Structural identity: the same kinds of term, names, numbers and shape.
function same(a, b) {
  if (a instanceof Var || b instanceof Var) return a instanceof Var && b instanceof Var && a.name === b.name;
  if (a instanceof Struct || b instanceof Struct) {
    return a instanceof Struct && b instanceof Struct && a.name === b.name && a.args.length === b.args.length &&
      a.args.every((arg, i) => same(arg, b.args[i]));
  }
  return typeof a === typeof b && Object.is(a, b);
}

// The variables of a term renamed in order of first appearance, so that two
// variants of one term have the same text.
function variant(term) {
  const names = new Map();
  const rename = (t) => {
    if (t instanceof Var) {
      if (!names.has(t.name)) names.set(t.name, new Var(`V${names.size}`));
      return names.get(t.name);
    }
    return t instanceof Struct ? new Struct(t.name, t.args.map(rename)) : t;
  };
  return write(rename(term));
}

// --- Proof mutation ------------------------------------------------------

// Every position in a term where a subterm can be replaced, as [path, subterm].
function positions(term, path = []) {
  const found = [[path, term]];
  if (term instanceof Struct) term.args.forEach((arg, i) => found.push(...positions(arg, [...path, i])));
  return found;
}

function replaceAt(term, path, replacement) {
  if (!path.length) return replacement;
  const [i, ...rest] = path;
  const args = term.args.slice();
  args[i] = replaceAt(args[i], rest, replacement);
  return new Struct(term.name, args);
}

function atomic(term) {
  return !(term instanceof Struct) || term.args.length === 0;
}

// One random change to one term of a proof document: a constant or variable
// swapped for another from the document, a number moved by one, a clause
// cited by another number, a list item dropped or repeated, two arguments
// swapped, or a compound swapped for another from the document, such as a
// step's goal among its own uses or one Skolem term for another. Returns null
// when the chosen change does not apply.
function mutateTerm(r, term, pool, compounds) {
  const spots = positions(term);
  const [path, at] = r.pick(spots);
  switch (r.below(7)) {
    case 6:
      return at instanceof Struct && path.length ? replaceAt(term, path, r.pick(compounds)) : null;
    case 0:
      return atomic(at) ? replaceAt(term, path, r.pick(pool)) : null;
    case 1:
      if (typeof at === 'bigint') return replaceAt(term, path, at + (r.chance(0.5) ? 1n : -1n));
      if (typeof at === 'number') return replaceAt(term, path, at + 1);
      return null;
    case 2:
      if (at instanceof Struct && at.name === 'clause' && at.args.length === 1 && typeof at.args[0] === 'bigint') {
        return replaceAt(term, path, new Struct('clause', [at.args[0] + BigInt(1 + r.below(3)) * (r.chance(0.5) ? 1n : -1n)]));
      }
      return atomic(at) ? replaceAt(term, path, new Var('Forged')) : null;
    case 3:
      // Drop the head of a list.
      return at instanceof Struct && at.name === '.' && at.args.length === 2 ? replaceAt(term, path, at.args[1]) : null;
    case 4:
      // Repeat the head of a list.
      return at instanceof Struct && at.name === '.' && at.args.length === 2
        ? replaceAt(term, path, new Struct('.', [at.args[0], at])) : null;
    default:
      if (at instanceof Struct && at.args.length >= 2) {
        const i = r.below(at.args.length);
        const j = r.below(at.args.length);
        if (i === j) return null;
        const args = at.args.slice();
        [args[i], args[j]] = [args[j], args[i]];
        return replaceAt(term, path, new Struct(at.name, args));
      }
      return null;
  }
}

// Every occurrence of one subterm replaced by another.
function replaceEverywhere(term, from, to) {
  if (same(term, from)) return to;
  return term instanceof Struct ? new Struct(term.name, term.args.map((arg) => replaceEverywhere(arg, from, to))) : term;
}

function mutateDocument(r, terms, pool, compounds, results) {
  const changed = terms.slice();
  const i = r.below(changed.length);
  if (r.chance(0.25)) {
    // A consistent forgery: one value replaced throughout the claims and
    // steps, as someone editing a proof by hand would do. The clause displays
    // are left as they are, since the checker reads clauses from the source.
    // Often a computed value or a witness, the values a forger most wants changed.
    const from = results.length && r.chance(0.3) ? r.pick(results)
      : r.chance(0.5) && compounds.length ? r.pick(compounds) : r.pick(pool);
    let to = r.chance(0.5) && compounds.length ? r.pick(compounds) : r.pick(pool);
    // A number is most plausibly forged as its neighbour, such as a sum off by one.
    if (typeof from === 'bigint' && r.chance(0.6)) to = from + 1n;
    if (typeof from === 'number' && r.chance(0.6)) to = from + 1;
    if (same(from, to)) return null;
    return changed.map((term) => (isRecord(term, 'clause', 2) ? term : replaceEverywhere(term, from, to)));
  }
  if (r.chance(0.1)) {
    // Drop or repeat a whole line.
    if (r.chance(0.5)) changed.splice(i, 1);
    else changed.splice(i, 0, changed[i]);
    return changed;
  }
  for (let tries = 0; tries < 8; tries++) {
    const mutated = mutateTerm(r, changed[i], pool, compounds);
    if (mutated !== null) {
      changed[i] = mutated;
      return changed;
    }
  }
  return null;
}

const isRecord = (term, name, arity) => term instanceof Struct && term.name === name && term.args.length === arity;

// Whether a statement of a proof document is a claim: not a step, a clause
// display or a statement of its search certificate.
const isClaim = (term) => !['step/4', 'clause/2', 'searched/2', 'derived/2', 'called/2']
  .some((goalKey) => isRecord(term, goalKey.split('/')[0], Number(goalKey.split('/')[1])));

// The obligations of a proof document: the goals of its steps justified as
// an absence or a collection, which the checker trusts rather than proves.
const obligations = (terms) => new Set(terms.filter((term) => isRecord(term, 'step', 4) &&
  (term.args[1] === 'absent' || term.args[1] === 'collected')).map((term) => variant(term.args[0])));

// An example ready to forge: its saved proof, what that valid proof already
// establishes (its claims and the goals of its steps), and the values to
// forge with.
function forgeable(entry, text) {
  const terms = readProofTerms(text).map(([term]) => term);
  const established = new Set();
  for (const term of terms) {
    if (isRecord(term, 'step', 4)) established.add(variant(term.args[0]));
    else if (isClaim(term)) established.add(variant(term));
  }
  const subterms = terms.flatMap((term) => positions(term).map(([, t]) => t));
  const pool = [...new Set(subterms.filter(atomic))];
  const compounds = subterms.filter((t) => !atomic(t) && t.name !== '.');
  // The values a forger most wants changed: those the primitive steps
  // compute, as is(Value, Expression), and the Skolem terms of the witnesses.
  const results = [
    ...terms.filter((term) => isRecord(term, 'step', 4) && term.args[1] === 'builtin' &&
      isRecord(term.args[0], 'is', 2)).map((term) => term.args[0].args[0]),
    ...subterms.filter((t) => isRecord(t, 'skolem', 3)),
  ];
  const claims = new Set(terms.filter(isClaim).map(variant));
  return { entry, program: loadExample(entry), terms, established, claims, pool, compounds, results, trusted: obligations(terms), oracle: new Map() };
}

// The report checkProof gives with and without the fast path for flat
// clauses, which must agree.
function checkBothWays(program, document) {
  const fast = checkProof(program, document);
  shortcuts.flatResolution = false;
  try {
    assert.deepEqual(publicReport(checkProof(program, document)), publicReport(fast), `flat and general resolution disagree\n${document}`);
  } finally {
    shortcuts.flatResolution = true;
  }
  return fast;
}

// Forge the saved proof of an example count times: whatever the checker
// accepts must claim only what the program entails, or have forged an
// obligation that a strict check then rejects.
function forgeExample(entry, text, count) {
  const example = forgeable(entry, text);
  const seen = new Set();
  let tried = 0;
  let rejected = 0;
  forSeeds(count, (r) => {
    const terms = mutateDocument(r, example.terms, example.pool, example.compounds, example.results);
    if (terms === null) return;
    const document = `${terms.map((term) => write(term)).join('\n')}\n`;
    // Different seeds can make the same forgery. Check each distinct
    // document in both checker modes once, retaining all mutation trials.
    if (seen.has(document)) return;
    seen.add(document);
    tried++;
    let report;
    try {
      report = checkBothWays(example.program, document);
    } catch (error) {
      // A checker error is a rejection too, but it must be one of eyemind's.
      if (error instanceof assert.AssertionError) throw error;
      assert.ok(error instanceof EyemindError, `${error.stack}\n${document}`);
      rejected++;
      return;
    }
    if (!report.valid) {
      rejected++;
      return;
    }
    // Checked with no obligation, the claims are every answer of the
    // original questions, so none of the saved proof's answers is missing.
    const claimed = new Set(terms.filter(isClaim).map(variant));
    if (!report.trusted.length && !claimed.has(variant('false'))) {
      const missing = [...example.claims].find((claim) => !claimed.has(claim));
      assert.ok(missing === undefined, `a forged proof without ${missing} was checked\n${document}`);
    }
    const unentailed = terms.filter((term) => isClaim(term) && !entailed(example, term));
    if (!unentailed.length) return;
    const forged = `a forged proof was accepted for ${write(unentailed[0])}, which does not hold`;
    assert.ok(report.trusted.some(({ kind, conclusion }) => kind === 'call_fidelity' &&
      unentailed.some((claim) => write(claim) === conclusion)) ||
      [...obligations(terms)].some((goal) => !example.trusted.has(goal)),
      `${forged}, with no forged obligation\n${document}`);
    assert.ok(!checkProof(example.program, document, { allowTrusted: false }).valid,
      `${forged}, even strictly\n${document}`);
  });
  // Most changes must be caught, or the property is not being exercised.
  assert.ok(tried > 0 && rejected / tried >= 0.5, `${rejected} of ${tried} forged proofs rejected`);
}

// A claim the original proof did not establish must still be one the
// program entails, which the reasoner answers here as the test's oracle.
// Repeated claims share that answer only within this fixed source program.
function entailed(example, claim) {
  const wanted = variant(claim);
  if (example.established.has(wanted)) return true;
  if (example.oracle.has(wanted)) return example.oracle.get(wanted);
  let holds = false;
  try {
    const answers = run(example.program, { goal: write(claim) }).answers;
    holds = answers.some((answer) => variant(readTerm(answer)) === wanted);
  } catch { /* An unsuccessful oracle call establishes no claim. */ }
  example.oracle.set(wanted, holds);
  return holds;
}

// --- Random programs -----------------------------------------------------

const CONSTANTS = ['a', 'b', 'c', 'd'];
const RULE_VARIABLES = ['X', 'Y', 'Z'];

// A random stratified program: base relations e0 and e1, forward relations
// f0 and f1 whose rules may be recursive and may negate base relations, and
// backward relations b0 and b1, each defined only over relations below it,
// which may negate base and forward relations.
function randomProgram(r) {
  const arity = { e0: 2, e1: 1, f0: 2, f1: 1, b0: 2, b1: 1 };
  const facts = [];
  for (const name of ['e0', 'e1']) {
    for (let i = 0; i < 2 + r.below(6); i++) {
      facts.push([name, Array.from({ length: arity[name] }, () => r.pick(CONSTANTS))]);
    }
  }
  const rules = [];
  const atom = (name) => [name, Array.from({ length: arity[name] }, () => r.chance(0.85) ? r.pick(RULE_VARIABLES) : r.pick(CONSTANTS))];
  const rule = (head, positive, negatable, kind) => {
    for (let tries = 0; tries < 20; tries++) {
      const body = Array.from({ length: 1 + r.below(3) }, () => atom(r.pick(positive)));
      const bound = new Set(body.flatMap(([, args]) => args.filter((arg) => RULE_VARIABLES.includes(arg))));
      const headAtom = [head, Array.from({ length: arity[head] }, () => r.chance(0.9) && bound.size ? r.pick([...bound]) : r.pick(CONSTANTS))];
      const negated = [];
      if (negatable.length && r.chance(0.4)) {
        const [name, args] = atom(r.pick(negatable));
        if (args.every((arg) => !RULE_VARIABLES.includes(arg) || bound.has(arg))) negated.push([name, args]);
      }
      if (headAtom[1].every((arg) => !RULE_VARIABLES.includes(arg) || bound.has(arg))) {
        return { kind, head: headAtom, body, negated };
      }
    }
    return null;
  };
  for (let i = 0; i < 2 + r.below(4); i++) {
    const made = rule(r.pick(['f0', 'f1']), ['e0', 'e1', 'f0', 'f1'], ['e0', 'e1'], 'implies');
    if (made) rules.push(made);
  }
  for (const [head, below] of [['b0', ['e0', 'e1', 'f0', 'f1']], ['b1', ['e0', 'e1', 'f0', 'f1', 'b0']]]) {
    for (let i = 0; i < 1 + r.below(2); i++) {
      const made = rule(head, below, ['e0', 'e1', 'f0', 'f1'], 'implied_by');
      if (made) rules.push(made);
    }
  }
  return { facts, rules, arity };
}

const argText = (arg) => (RULE_VARIABLES.includes(arg) ? arg : `'${arg}'`);
const atomText = ([name, args]) => `${name}(${args.map(argText).join(', ')})`;

function programText({ facts, rules }) {
  const lines = facts.map((fact) => `fact(${atomText(fact)})`);
  for (const { kind, head, body, negated } of rules) {
    const goals = [...body.map(atomText), ...negated.map((goal) => `not(${atomText(goal)})`)];
    lines.push(kind === 'implies' ? `implies([${goals.join(', ')}], ${atomText(head)})`
      : `implied_by(${atomText(head)}, [${goals.join(', ')}])`);
  }
  return `${lines.join('\n')}\n`;
}

// The model of a random program by naive evaluation: the forward relations
// to a fixpoint, then each backward relation in turn.
function naiveModel({ facts, rules }) {
  const model = new Map(['e0', 'e1', 'f0', 'f1', 'b0', 'b1'].map((name) => [name, new Set()]));
  for (const [name, args] of facts) model.get(name).add(args.join(' '));
  const holds = (name, args) => model.get(name).has(args.join(' '));
  const solutions = (body, binding = {}) => {
    if (!body.length) return [binding];
    const [[name, args], ...rest] = body;
    const found = [];
    for (const tuple of model.get(name)) {
      const values = tuple.split(' ');
      const next = { ...binding };
      if (args.every((arg, i) => {
        if (!RULE_VARIABLES.includes(arg)) return arg === values[i];
        if (next[arg] === undefined) next[arg] = values[i];
        return next[arg] === values[i];
      })) found.push(...solutions(rest, next));
    }
    return found;
  };
  const fire = (rule) => {
    let added = false;
    for (const binding of solutions(rule.body)) {
      const ground = (args) => args.map((arg) => (RULE_VARIABLES.includes(arg) ? binding[arg] : arg));
      if (rule.negated.some(([name, args]) => holds(name, ground(args)))) continue;
      const key = ground(rule.head[1]).join(' ');
      if (!model.get(rule.head[0]).has(key)) {
        model.get(rule.head[0]).add(key);
        added = true;
      }
    }
    return added;
  };
  const forward = rules.filter((rule) => rule.kind === 'implies');
  while (forward.map(fire).some(Boolean));
  for (const name of ['b0', 'b1']) for (const rule of rules.filter((item) => item.head[0] === name)) fire(rule);
  return model;
}

// The circular proof a forger would write for an atom that only a cycle of
// rule instances supports: ground instances of forward rules without
// negation whose heads the program does not entail, each body atom a source
// fact or the head of another instance, as for f1(a) from f1(X) <- f1(X).
// Returns null when the program has no such atom.
function circularProof({ facts, rules }, model) {
  const sourceFacts = facts.map(([name, args]) => `${name} ${args.join(' ')}`);
  const isFact = (key) => sourceFacts.includes(key);
  const entailedKey = (key) => model.get(key.split(' ')[0]).has(key.split(' ').slice(1).join(' '));
  let instances = [];
  rules.forEach((rule, index) => {
    if (rule.kind !== 'implies' || rule.negated.length) return;
    const variables = [...new Set(rule.body.flatMap(([, args]) => args.filter((arg) => RULE_VARIABLES.includes(arg))))];
    const assignments = variables.reduce((all, variable) =>
      all.flatMap((binding) => CONSTANTS.map((value) => ({ ...binding, [variable]: value }))), [{}]);
    for (const binding of assignments) {
      const ground = ([name, args]) => [name, args.map((arg) => binding[arg] ?? arg)];
      const head = ground(rule.head);
      const body = rule.body.map(ground);
      const key = ([name, args]) => `${name} ${args.join(' ')}`;
      if (entailedKey(key(head))) continue;
      if (!body.every((atom) => (atom[0].startsWith('e') ? isFact(key(atom)) : !entailedKey(key(atom))))) continue;
      instances.push({ clause: facts.length + index + 1, binding, head, body, key });
    }
  });
  // Keep the instances whose rule-derived body atoms are heads of others.
  for (;;) {
    const heads = new Set(instances.map((item) => item.key(item.head)));
    const kept = instances.filter((item) => item.body.every((atom) => atom[0].startsWith('e') || heads.has(item.key(atom))));
    if (kept.length === instances.length) break;
    instances = kept;
  }
  if (!instances.length) return null;
  const quoted = ([name, args]) => `${name}(${args.map((arg) => `'${arg}'`).join(', ')})`;
  const steps = new Map();
  for (const item of instances) {
    const goal = quoted(item.head);
    if (steps.has(goal)) continue;
    const bindings = Object.entries(item.binding).map(([name, value]) => `${name}: '${value}'`).join(', ');
    steps.set(goal, `step(${goal}, clause(${item.clause}), {${bindings}}, [${item.body.map(quoted).join(', ')}])`);
    for (const atom of item.body.filter((body) => body[0].startsWith('e'))) {
      const index = facts.findIndex(([name, args]) => name === atom[0] && args.join(' ') === atom[1].join(' '));
      steps.set(quoted(atom), `step(${quoted(atom)}, clause(${index + 1}), {}, [])`);
    }
  }
  return `${quoted(instances[0].head)}\n${[...steps.values()].join('\n')}\n`;
}

// --- Chain-stratified programs ------------------------------------------

const NODES = ['a', 'b', 'c'];
const PREDICATES = ['p', 'q', 'r', 'type', 'spo'];
const CLASSES = ['k', 'l'];

// A random program over one ternary relation t with a rule that has a
// variable in every position of its head, so that classic stratification
// fails as soon as a rule has a negation: t(P, spo, Q), t(X, P, Y) gives
// t(X, Q, Y). Negation rules, plain rules and contradictions on spo facts
// are drawn at random; so are the facts. Each rule is a list of positive
// goals, negated goals and a head, or a contradiction's goals.
function randomChainProgram(r) {
  const term = (kind) => (kind === 'node' ? r.pick(NODES) : kind === 'pred' ? r.pick(PREDICATES) : r.pick(CLASSES));
  const facts = [];
  for (let i = 0; i < 3 + r.below(5); i++) {
    facts.push(r.chance(0.3) ? [r.pick(PREDICATES), 'spo', r.pick(PREDICATES)]
      : r.chance(0.3) ? [term('node'), 'type', term('class')] : [term('node'), term('pred'), term('node')]);
  }
  const rules = [{ positive: [['P', 'spo', 'Q'], ['X', 'P', 'Y']], negated: [], head: ['X', 'Q', 'Y'] }];
  if (r.chance(0.5)) rules.push({ positive: [['P', 'spo', 'Q'], ['Q', 'spo', 'R']], negated: [], head: ['P', 'spo', 'R'] });
  for (let i = 0; i < 1 + r.below(2); i++) {
    const negated = r.chance(0.5) ? ['Y', 'type', term('class')] : ['X', term('pred'), 'Y'];
    rules.push({ positive: [['X', term('pred'), 'Y']], negated: [negated], head: ['X', term('pred'), 'Y'] });
  }
  for (let i = 0; i < r.below(3); i++) {
    rules.push({ positive: [['X', term('pred'), 'Y']], negated: [], head: r.chance(0.5) ? ['Y', 'type', term('class')] : ['X', term('pred'), 'Y'] });
  }
  for (let i = 0; i < r.below(4); i++) {
    rules.push({ positive: [[term('pred'), 'spo', r.chance(0.7) ? term('pred') : 'spo']], negated: [], head: null });
  }
  return { facts, rules };
}

const isChainVariable = (arg) => /^[A-Z]$/.test(arg);
const chainAtom = (args) => `t(${args.map((arg) => (isChainVariable(arg) ? arg : `'${arg}'`)).join(', ')})`;

function chainProgramLines({ facts, rules }) {
  return [
    ...facts.map((fact) => `fact(${chainAtom(fact)})`),
    ...rules.map(({ positive, negated, head }) => {
      const goals = [...positive.map(chainAtom), ...negated.map((goal) => `not(${chainAtom(goal)})`)];
      return head === null ? `contradiction(${goals.join(', ')})` : `implies([${goals.join(', ')}], ${chainAtom(head)})`;
    }),
  ];
}

// Whether a set of t facts, as 'x y z' keys, is a stable model of the rules
// over the facts: the least fixpoint of the rules with every negation decided
// by the set itself, and no contradiction holds in it.
function isStableModel({ facts, rules }, model) {
  const holds = (set, args) => set.has(args.join(' '));
  const solutions = (set, goals, binding = {}) => {
    if (!goals.length) return [binding];
    const [first, ...rest] = goals;
    const found = [];
    for (const key of set) {
      const values = key.split(' ');
      const next = { ...binding };
      if (first.every((arg, i) => (isChainVariable(arg) ? (next[arg] ??= values[i]) === values[i] : arg === values[i]))) {
        found.push(...solutions(set, rest, next));
      }
    }
    return found;
  };
  const ground = (args, binding) => args.map((arg) => (isChainVariable(arg) ? binding[arg] : arg));
  const least = new Set(facts.map((fact) => fact.join(' ')));
  for (let changed = true; changed;) {
    changed = false;
    for (const rule of rules) {
      for (const binding of solutions(least, rule.positive)) {
        if (rule.negated.some((goal) => holds(model, ground(goal, binding)))) continue;
        if (rule.head === null) return false;
        const key = ground(rule.head, binding).join(' ');
        if (!least.has(key)) {
          least.add(key);
          changed = true;
        }
      }
    }
  }
  return least.size === model.size && [...least].every((key) => model.has(key));
}

// The facts a chase of a chain program ends with when each step applies a
// rule instance picked at random among those whose positive goals hold and
// whose negated goals are absent just then, whatever its rank; null when a
// contradiction's goals come to hold.
function randomChase({ facts, rules }, r) {
  const set = new Set(facts.map((fact) => fact.join(' ')));
  const solutions = (goals, binding = {}) => {
    if (!goals.length) return [binding];
    const [first, ...rest] = goals;
    const found = [];
    for (const key of set) {
      const values = key.split(' ');
      const next = { ...binding };
      if (first.every((arg, i) => (isChainVariable(arg) ? (next[arg] ??= values[i]) === values[i] : arg === values[i]))) {
        found.push(...solutions(rest, next));
      }
    }
    return found;
  };
  for (;;) {
    const applicable = [];
    for (const rule of rules) {
      for (const binding of solutions(rule.positive)) {
        const ground = (args) => args.map((arg) => (isChainVariable(arg) ? binding[arg] : arg));
        if (rule.negated.some((goal) => set.has(ground(goal).join(' ')))) continue;
        if (rule.head === null) return null;
        const key = ground(rule.head).join(' ');
        if (!set.has(key)) applicable.push(key);
      }
    }
    if (!applicable.length) return set;
    set.add(r.pick(applicable));
  }
}

// --- Restricted rules ---------------------------------------------------

// A random program with restricted rules: facts of e/2 and f/1, plain rules
// deriving g/2 and h/1, and restricted rules whose heads have the witness W.
function randomRestrictedProgram(r) {
  const arity = { e: 2, f: 1, g: 2, h: 1 };
  const facts = [];
  for (let i = 0; i < 2 + r.below(4); i++) facts.push(r.chance(0.5) ? ['e', [r.pick(NODES), r.pick(NODES)]] : ['f', [r.pick(NODES)]]);
  const atom = (name, vars) => [name, Array.from({ length: arity[name] }, () => r.pick(vars))];
  const rules = [];
  for (let i = 0; i < r.below(3); i++) {
    const body = [atom(r.pick(['e', 'f', 'g', 'h']), ['X', 'Y'])];
    if (r.chance(0.4)) body.push(atom(r.pick(['e', 'f', 'g', 'h']), ['X', 'Y']));
    const bound = [...new Set(body.flatMap(([, args]) => args))];
    rules.push({ restricted: false, body, heads: [atom(r.pick(['g', 'h']), bound)] });
  }
  for (let i = 0; i < 1 + r.below(2); i++) {
    const body = [atom(r.pick(['e', 'f', 'g', 'h']), ['X', 'Y'])];
    const x = body[0][1][0];
    const heads = r.pick([[['g', [x, 'W']]], [['g', [x, 'W']], ['h', ['W']]], [['h', ['W']]], [['g', ['W', x]]]]);
    rules.splice(r.below(rules.length + 1), 0, { restricted: true, body, heads });
  }
  return { facts, rules };
}

const restrictedAtom = ([name, args]) => `${name}(${args.map((arg) => (isChainVariable(arg) ? arg : `'${arg}'`)).join(', ')})`;

function restrictedLines({ facts, rules }) {
  return [
    ...facts.map((fact) => `fact(${restrictedAtom(fact)})`),
    ...rules.map(({ restricted, body, heads }) =>
      `${restricted ? 'restricted' : 'implies'}([${body.map(restrictedAtom).join(', ')}], [${heads.map(restrictedAtom).join(', ')}])`),
  ];
}

// Whether firing restricted rule a can satisfy the heads of restricted rule
// b: a's heads match all of b's heads that hold its witness W, with the
// variables of each rule its own.
function restrainsNaive(a, b) {
  const piece = b.heads.filter(([, args]) => args.includes('W'));
  const match = (goals, binding) => {
    if (!goals.length) return true;
    const [[name, args], ...rest] = goals;
    for (const [headName, headArgs] of a.heads) {
      if (headName !== name) continue;
      const next = { ...binding };
      const resolve = (term) => { while (next[term] !== undefined) term = next[term]; return term; };
      const ok = args.every((arg, i) => {
        const x = resolve(`b:${arg}`);
        const y = resolve(`a:${headArgs[i]}`);
        if (x === y) return true;
        next[x] = y;
        return true;
      });
      if (ok && match(rest, next)) return true;
    }
    return false;
  };
  return piece.length > 0 && match(piece, {});
}

// The derived facts of a restricted program as SPEC Sections 7.2 and 8.2
// define them, worked out directly: rounds of the plain rules until one adds
// nothing, then a round of the restricted rules, each searching the state as
// it was before its own firings and firing only where nothing but its own
// witness satisfies its heads; again until a round of each adds nothing. The
// restricted rules run in restraint order, clause order breaking ties and
// cycles. Values are canonical texts; a witness is skolem(N, 'W', Frontier).
// null when a witness is unneeded at the end, undefined when more than 40
// facts are derived, as when witnesses keep making witnesses.
function naiveRestricted({ facts, rules }) {
  const known = new Map();
  for (const [name, args] of facts) known.set(write(new Struct(name, args)), [name, args]);
  const derived = [];
  const solutions = (goals, binding = {}) => {
    if (!goals.length) return [binding];
    const [[name, args], ...rest] = goals;
    const found = [];
    for (const [factName, values] of known.values()) {
      if (factName !== name) continue;
      const next = { ...binding };
      if (args.every((arg, i) => (isChainVariable(arg) ? write(next[arg] ??= values[i]) === write(values[i]) : arg === values[i]))) {
        found.push(...solutions(rest, next));
      }
    }
    return found;
  };
  const add = (name, args) => {
    const text = write(new Struct(name, args));
    if (known.has(text)) return false;
    known.set(text, [name, args]);
    derived.push(text);
    return true;
  };
  const indexed = rules.map((rule, index) => ({ rule, index }));
  const plain = indexed.filter(({ rule }) => !rule.restricted);
  const pending = indexed.filter(({ rule }) => rule.restricted);
  const ordered = [];
  while (pending.length) {
    const ready = pending.findIndex(({ rule }) => pending.every((other) => other.rule === rule || !restrainsNaive(other.rule, rule)));
    ordered.push(...pending.splice(ready < 0 ? 0 : ready, 1));
  }
  const fired = [];
  const round = (restricted) => {
    let changed = false;
    (restricted ? ordered : plain).forEach(({ rule, index }) => {
      const id = facts.length + index + 1;
      const firings = [];
      for (const binding of solutions(rule.body)) {
        if (restricted) {
          const frontier = [];
          for (const [, args] of rule.heads) for (const arg of args) if (arg !== 'W' && !frontier.includes(arg)) frontier.push(arg);
          const witness = new Struct('skolem', [BigInt(id), 'W', frontier.reduceRight((tail, arg) => new Struct('.', [binding[arg], tail]), '[]')]);
          const others = solutions(rule.heads.map(([name, args]) => [name, args.map((arg) => (arg === 'W' ? 'W' : arg))]), { ...binding });
          if (others.some((found) => write(found.W) !== write(witness))) continue;
          firings.push({ ...binding, W: witness });
          fired.push([rule, { ...binding }, witness]);
        } else firings.push(binding);
      }
      for (const binding of firings) {
        for (const [name, args] of rule.heads) if (add(name, args.map((arg) => (isChainVariable(arg) ? binding[arg] : arg)))) changed = true;
      }
    });
    return changed;
  };
  for (let changed = true, lean = false; changed || !lean;) {
    lean = !changed;
    changed = round(lean);
    if (derived.length > 40) return undefined;
  }
  for (const [rule, binding, witness] of fired) {
    if (solutions(rule.heads, binding).some((found) => write(found.W) !== write(witness))) return null;
  }
  return derived;
}

// --- Documents -----------------------------------------------------------

const HOSTILE = ['globalThis.__eyemindRan = 1', 'process.exit(3)', '(() => { globalThis.__eyemindRan = 1 })()',
  '`${globalThis.__eyemindRan = 1}`', 'f(globalThis.__eyemindRan = 1)', 'new Function("globalThis.__eyemindRan = 1")()',
  'f(a)(b)', 'import("node:fs")', 'f(...g)', '/x/.exec("x")', 'f(0x10)', 'f(1_000)', 'f(NaN)', 'f(this)'];

function mutateText(r, text) {
  const chars = Array.from(text);
  const pieces = ['(', ')', '[', ']', '{', '}', ',', ':', "'", '"', '\\', '.', '...', '-', '+', '`', '$', '\n', ';',
    '//', '/*', '*/', 'n', 'e', '0', 'x', ' ', '\u00a0', '\u2028', '\ud800', 'struct', 'VAR_'];
  for (let k = 0; k < 1 + r.below(3); k++) {
    const i = r.below(chars.length + 1);
    if (r.chance(0.5) && chars.length) chars.splice(Math.min(i, chars.length - 1), 1);
    else chars.splice(i, 0, r.pick(pieces));
  }
  return chars.join('');
}

export const tests = {
  'C10 rejects locally valid answers that the original finite call never returns'() {
    forSeeds(120, (r) => {
      const values = [1, 2, 3];
      for (let i = values.length - 1; i > 0; i--) {
        const j = r.below(i + 1);
        [values[i], values[j]] = [values[j], values[i]];
      }
      if (r.chance(0.5)) values.push(r.pick(values));
      const early = r.chance(0.5);
      const first = values[0];
      const wrong = r.pick(values.filter((value) => value !== first));
      const body = early ? `[not_unify(X, ${first}), p(X)]` : 'once(p(X))';
      const source = `fact(${values.map((value) => `p(${value})`).join(', ')})\n` +
        `implied_by(q(X), ${body})\nquery(q(X))`;
      const loaded = program(source);
      const result = run(loaded, { proof: true });
      assert.deepEqual(result.answers, early ? [] : [`q(${first})`]);
      assert.ok(checkBothWays(loaded, result.proof).valid);
      const uses = early ? `not_unify(${wrong}, ${first}), p(${wrong})` : `once(p(${wrong}))`;
      const support = early ? `step(not_unify(${wrong}, ${first}), 'builtin', {}, [])`
        : `step(once(p(${wrong})), 'control', {}, [p(${wrong})])`;
      const local = `q(${wrong})\nstep(q(${wrong}), clause(${values.length + 1}), {}, [${uses}])\n${support}\n`;
      assert.ok(checkProof(loaded, local).valid, local);
      const document = `${local}called(q(A), [${early ? '' : `q(${first})`}])\n`;
      const report = checkBothWays(loaded, document);
      assert.equal(report.valid, false, document);
      // The claim is no answer, and under once/1 the actual answer is omitted.
      assert.deepEqual(report.failures.map(({ condition }) => condition), early ? ['C10'] : ['C10', 'C10']);
      // A second original question may return the same claim. Missing its
      // table leaves an obligation; the first question alone cannot refute it.
      const overlapping = program(`${source}\nquery(q(${wrong}))`);
      const actual = early ? '' : `q(${first})\nstep(q(${first}), clause(${values.length + 1}), {}, [once(p(${first}))])\n` +
        `step(once(p(${first})), 'control', {}, [p(${first})])\n`;
      const incomplete = checkBothWays(overlapping, `${actual}${document}`);
      assert.ok(incomplete.valid);
      assert.equal(incomplete.trusted[0].kind, 'call_fidelity');
      assert.equal(checkProof(overlapping, `${actual}${document}`, { allowTrusted: false }).valid, false);
      const alternate = early ? values.filter((value) => value === wrong) : [wrong];
      const completed = `${actual}${document}called(q(${wrong}), [${alternate.map((value) => `q(${value})`).join(', ')}])\n`;
      assert.ok(checkProof(overlapping, completed, { allowTrusted: false }).valid, completed);
    });
  },

  'source-grounded witness contexts survive adversarial Skolem-shaped input data'() {
    forSeeds(150, (r) => {
      const hops = r.below(5);
      const id = hops + 2;
      let context = `skolem(${id}, '${r.pick(['W', 'X', 'Bogus'])}', [])`;
      for (let i = 0, depth = r.below(4); i < depth; i++) {
        context = r.chance(0.5) ? `box(${context})` : `[${context}, '${r.pick(['a', 'b'])}']`;
      }
      const lines = [`fact(p0(${context}))`];
      for (let i = 0; i < hops; i++) {
        lines.push(r.chance(0.5) ? `implies(p${i}(X), p${i + 1}(X))` : `implied_by(p${i + 1}(X), p${i}(X))`);
      }
      lines.push(`implies(p${hops}(X), q(X, W))`);
      const source = program(lines.join('\n'));
      const document = run(source, { proof: true }).proof;
      const expected = `skolem(${id}, 'W', [${context}])`;
      assert.ok(document.includes(expected), document);
      assert.ok(checkBothWays(source, document).valid);
      const forged = document.replaceAll(expected, `skolem(${id}, 'W', [])`);
      const report = checkBothWays(source, forged);
      assert.equal(report.valid, false, forged);
      assert.ok(report.failures.some(({ condition }) => condition === 'C8'), JSON.stringify(report.failures));
      assert.ok(!report.failures.some(({ condition }) => condition === 'C1'), JSON.stringify(report.failures));
      assert.equal(checkProof(source, forged, { allowTrusted: false }).valid, false);
    });
  },

  'inspection agrees with independently constructed source rule patterns'() {
    forSeeds(100, (r) => {
      const generated = randomProgram(r);
      const source = program(programText(generated) + `
implies(implies(B, H), forward_rule(B, H))
implies(implied_by(H, B), backward_rule(H, B))`);
      for (const [kind, predicate] of [['implies', 'forward_rule'], ['implied_by', 'backward_rule']]) {
        const expected = generated.rules.filter((rule) => rule.kind === kind).map(({ head, body, negated }) => {
          const goals = [...body.map(atomText), ...negated.map((goal) => `not(${atomText(goal)})`)];
          const premise = readGoal(`[${goals.join(', ')}]`);
          const conclusion = readTerm(atomText(head));
          return variant(new Struct(predicate, kind === 'implies' ? [premise, conclusion] : [conclusion, premise]));
        });
        const goal = `${predicate}(X, Y)`;
        const result = run(source, { goal, proof: true });
        assert.deepEqual([...new Set(result.answers.map((answer) => variant(readTerm(answer))))].sort(),
          [...new Set(expected)].sort(), programText(generated));
        assert.ok(checkProof(source, result.proof, { goals: [goal] }).valid);
      }
    });
  },

  'inline templates with captured contexts agree with a naive fixpoint'() {
    forSeeds(100, (r) => {
      const generated = randomProgram(r);
      const lines = generated.facts.map((fact) => `fact(${atomText(fact)})`);
      for (const { kind, head, body, negated } of generated.rules) {
        const goals = [...body.map(atomText), ...negated.map((goal) => `not(${atomText(goal)})`)];
        const template = kind === 'implies' ? `implies([${goals.join(', ')}], ${atomText(head)})`
          : `implied_by(${atomText(head)}, [${goals.join(', ')}])`;
        lines.push(`implies(e1(X), ${template})`);
      }
      const source = lines.join('\n');
      const loaded = program(source);
      // Independently interpret each generator as an extra premise of the
      // original rule. The oracle knows nothing about compiled rule instances.
      const model = naiveModel({ ...generated, rules: generated.rules.map((rule) => ({
        ...rule, body: [['e1', ['X']], ...rule.body],
      })) });
      for (const [name, tuples] of model) {
        const goal = `${name}(${Array.from({ length: generated.arity[name] }, (_, i) => `V${i}`).join(', ')})`;
        const result = run(loaded, { goal, proof: true });
        const expected = [...tuples].map((tuple) => write(new Struct(name, tuple.split(' ')))).sort();
        assert.deepEqual([...new Set(result.answers)].sort(), expected, `${goal}\n${source}`);
        const report = checkProof(loaded, result.proof, { goals: [readTerm(goal)] });
        assert.ok(report.valid, `${goal}: ${JSON.stringify(report.failures)}\n${source}`);
      }
    });
  },

  'derived rule collections and negations agree with an independent finite model'() {
    forSeeds(120, (r) => {
      const contexts = ['a', 'b', 'c'].filter(() => r.chance(0.6));
      const rows = [];
      for (const context of ['a', 'b', 'c']) for (const value of ['x', 'y', 'z']) {
        if (r.chance(0.5)) rows.push([context, value]);
      }
      const once = r.chance(0.5);
      const backward = r.chance(0.5);
      const selected = once ? contexts.slice(0, 1) : contexts;
      let expected = selected.flatMap((context) => rows.filter(([c]) => c === context).map(([, value]) => value));
      if (!backward) expected = [...new Set(expected)];
      const list = `[${expected.map((value) => `'${value}'`).join(', ')}]`;
      const template = backward ? 'implied_by(item(X), row(C, X))' : 'implies(row(C, X), item(X))';
      const source = [
        ...contexts.map((context) => `fact(enabled('${context}'))`),
        ...rows.map(([context, value]) => `fact(row('${context}', '${value}'))`),
        `implies(${once ? 'once(enabled(C))' : 'enabled(C)'}, ${template})`,
        'implies(findall(X, item(X), L), gathered(L))',
        'query(gathered(L))',
        "query(not(item('x')))",
        'query(item(X))',
      ].join('\n');
      const loaded = program(source);
      const result = run(loaded, { proof: true });
      assert.ok(result.answers.includes(`gathered(${list})`), source);
      assert.equal(result.answers.includes("not(item('x'))"), !expected.includes('x'), source);
      assert.deepEqual(result.answers.filter((answer) => answer.startsWith('item(')).sort(),
        [...new Set(expected)].map((value) => `item('${value}')`).sort(), source);
      assert.doesNotMatch(result.proof, /activated\(/);
      if (expected.length) {
        const forged = result.proof.replaceAll(list, '[]');
        const report = checkProof(loaded, forged);
        assert.ok(!report.valid && report.failures.some((failure) => failure.condition === 'C6'),
          `${JSON.stringify(report.failures)}\n${source}\n${forged}`);
      }
    });
  },

  'reasoning, clause removal and statement order agree with a naive fixpoint'() {
    let left = 0;
    let complete = 0;
    forSeeds(150, (r) => {
      const generated = randomProgram(r);
      const source = programText(generated);
      const model = naiveModel(generated);
      const loaded = program(source);
      const goals = Object.keys(generated.arity).map((name) =>
        `${name}(${Array.from({ length: generated.arity[name] }, (_, i) => `V${i}`).join(', ')})`);
      const answers = (model) => [...model].flatMap(([name, tuples]) =>
        [...tuples].map((tuple) => write(new Struct(name, tuple.split(' '))))).sort();
      const expected = answers(model);
      const result = run(loaded, { goals, proof: true });
      assert.deepEqual([...new Set(result.answers)].sort(), expected, source);
      const plain = run(loaded, { goals });
      assert.deepEqual([...new Set(plain.answers)].sort(), expected, source);
      assert.deepEqual(plain.stats, result.stats, source);
      const report = checkProof(loaded, result.proof, { goals });
      assert.ok(report.valid, `${JSON.stringify(report.failures)}\n${source}`);
      // A strict check establishes that the claims are every answer, which
      // the naive model confirms; leaving any claim out must then fail C10.
      if (checkProof(loaded, result.proof, { goals, allowTrusted: false }).valid) {
        assert.deepEqual([...new Set(report.answers)].sort(), expected, source);
        const lines = result.proof.split('\n');
        const end = lines.indexOf('');
        if (end > 1) {
          const dropped = 1 + r.below(end - 1);
          const fewer = [...lines.slice(0, dropped), ...lines.slice(dropped + 1)].join('\n');
          const omitted = checkProof(loaded, fewer, { goals });
          assert.ok(omitted.failures.some(({ condition, detail }) => condition === 'C10' && /omits an answer/.test(detail)),
            `leaving out ${lines[dropped]} was not caught\n${source}`);
          complete++;
        }
      }
      const cited = new Set(result.clausesUsed);
      const consulted = new Set(result.clausesBehindBoundaries);
      // Clauses are numbered as programText states them: the facts, then the rules.
      for (const clause of loaded.clauses) {
        if (cited.has(clause.id) || consulted.has(clause.id)) continue;
        const index = clause.id - 1;
        const without = index < generated.facts.length
          ? { ...generated, facts: generated.facts.filter((_, i) => i !== index) }
          : { ...generated, rules: generated.rules.filter((_, i) => i !== index - generated.facts.length) };
        const detail = `leaving out uncited clause ${clause.id}\n${source}`;
        assert.deepEqual(answers(naiveModel(without)), expected, detail);
        const after = run(new Program(loaded.sources, clause.id), { goals });
        assert.deepEqual([...new Set(after.answers)].sort(), expected, detail);
        assert.equal(after.haltCode, result.haltCode, detail);
        left++;
      }
      const lines = source.trim().split('\n');
      for (let i = lines.length - 1; i > 0; i--) {
        const j = r.below(i + 1);
        [lines[i], lines[j]] = [lines[j], lines[i]];
      }
      const shuffled = `${lines.join('\n')}\n`;
      const reordered = run(program(shuffled), { goals });
      assert.deepEqual([...new Set(reordered.answers)].sort(), expected, `${source}\nreordered:\n${shuffled}`);
      assert.equal(reordered.haltCode, result.haltCode, source);
    });
    assert.ok(left >= 50, `only ${left} uncited clauses left out`);
    assert.ok(complete >= 50, `only ${complete} proofs had their answers shown complete`);
  },

  'forward rules computing with bound inputs agree with a naive fixpoint and their answers check as complete'() {
    let complete = 0;
    forSeeds(60, (r) => {
      const start = [0, 1, 2, 3, 4].filter(() => r.chance(0.4));
      if (!start.length) start.push(r.below(5));
      const limit = 2 + r.below(6);
      const step = 1 + r.below(3);
      const gaps = r.chance(0.7);
      const holes = gaps && r.chance(0.7);
      const lines = [`fact(${start.map((k) => `n(${k})`).join(', ')})`,
        `implies([n(X), lt(X, ${limit}), is(Y, add(X, ${step}))], n(Y))`];
      if (gaps) lines.push('implies([n(X), n(Y), lt(X, Y), is(Z, sub(Y, X))], gap(Z))');
      if (holes) lines.push('implies([gap(Z), not(n(Z))], hole(Z))');
      const source = `${lines.join('\n')}\n`;
      // The model, computed directly.
      const n = new Set(start);
      for (let changed = true; changed;) {
        changed = false;
        for (const x of [...n]) {
          if (x < limit && !n.has(x + step)) {
            n.add(x + step);
            changed = true;
          }
        }
      }
      const gap = new Set();
      if (gaps) for (const x of n) for (const y of n) if (x < y) gap.add(y - x);
      const expected = [...[...n].filter((k) => !start.includes(k)).map((k) => `n(${k})`),
        ...[...gap].map((k) => `gap(${k})`), ...(holes ? [...gap].filter((k) => !n.has(k)).map((k) => `hole(${k})`) : [])].sort();
      const loaded = program(source);
      const result = run(loaded, { proof: true });
      assert.deepEqual([...result.answers].sort(), expected, source);
      const report = checkProof(loaded, result.proof, { allowTrusted: false });
      assert.ok(report.valid, `${JSON.stringify(report.failures)}\n${source}`);
      // Leaving out any one claim must fail C10.
      const proofLines = result.proof.split('\n');
      const end = proofLines.indexOf('');
      if (end > 1) {
        const dropped = 1 + r.below(end - 1);
        const fewer = [...proofLines.slice(0, dropped), ...proofLines.slice(dropped + 1)].join('\n');
        assert.ok(checkProof(loaded, fewer).failures.some(({ condition }) => condition === 'C10'),
          `leaving out ${proofLines[dropped]} was not caught\n${source}`);
        complete++;
      }
    });
    assert.ok(complete >= 30, `only ${complete} programs had answers to leave out`);
  },

  'a chain-stratified program has one stable model, whatever the order of rule applications, and only its proof checks'() {
    let layered = 0;
    let rejected = 0;
    let compared = 0;
    let forgeries = 0;
    forSeeds(150, (r) => {
      const generated = randomChainProgram(r);
      const lines = chainProgramLines(generated);
      const source = `${lines.join('\n')}\n`;
      let loaded;
      try {
        loaded = program(source);
      } catch (error) {
        assert.match(error.message, /unstratified/, source);
        rejected++;
        return;
      }
      if (loaded.layered) layered++;
      const result = run(loaded, { proof: true });
      const report = checkProof(loaded, result.proof);
      assert.ok(report.valid, `${JSON.stringify(report.failures)}\n${source}`);
      const derived = [...new Set(result.answers)].sort();
      if (result.haltCode !== 65) {
        const model = new Set(generated.facts.map((fact) => fact.join(' ')));
        for (const answer of derived) model.add(readTerm(answer).args.join(' '));
        assert.ok(isStableModel(generated, model), `not a stable model: ${derived.join(' ')}\n${source}`);
        // It is the only stable model a chase reaches: the checker accepts
        // any supported, closed set of facts consistent with its negations,
        // so another one would be a proof of something eyemind does not
        // conclude.
        for (let trial = 0; trial < 10 && loaded.layered; trial++) {
          const other = randomChase(generated, r);
          if (other === null || !isStableModel(generated, other)) continue;
          compared++;
          assert.deepEqual([...other].sort(), [...model].sort(), `another stable model\n${source}`);
        }
        // A proof with one value replaced throughout checks only when its
        // claims still hold.
        for (const [from, to] of NODES.flatMap((x) => NODES.filter((y) => y !== x).map((y) => [x, y]))) {
          const forged = result.proof.replaceAll(`'${from}'`, `'${to}'`);
          if (forged === result.proof || !loaded.layered) continue;
          forgeries++;
          let report = null;
          try {
            report = checkProof(loaded, forged);
          } catch (error) {
            assert.ok(error instanceof EyemindError, `${error.stack}\n${forged}`);
          }
          if (report !== null && report.valid) {
            for (const [claim] of readProofTerms(forged)) {
              if (claim instanceof Struct && claim.name === 't') assert.ok(model.has(claim.args.join(' ')), `a forged proof was accepted for ${write(claim)}\n${source}\n${forged}`);
            }
          }
        }
      }
      // The rules in another order run another chase, which must reach the
      // same result.
      const shuffled = [...lines];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = r.below(i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const reordered = run(program(`${shuffled.join('\n')}\n`));
      assert.equal(reordered.haltCode, result.haltCode, `${source}\nreordered:\n${shuffled.join('\n')}`);
      if (result.haltCode !== 65) {
        assert.deepEqual([...new Set(reordered.answers)].sort(), derived, `${source}\nreordered:\n${shuffled.join('\n')}`);
      }
    });
    assert.ok(layered >= 15 && rejected >= 15, `${layered} chain-stratified and ${rejected} rejected programs`);
    assert.ok(compared >= 50 && forgeries >= 5, `${compared} chases compared and ${forgeries} proofs forged`);
  },

  'restricted rules agree with a direct reading of the specification, and their proofs check'() {
    let blocked = 0;
    let unneeded = 0;
    let forgeries = 0;
    forSeeds(150, (r) => {
      const generated = randomRestrictedProgram(r);
      const source = `${restrictedLines(generated).join('\n')}\n`;
      const loaded = program(source);
      const expected = naiveRestricted(generated);
      if (expected === undefined) return;
      if (expected === null) {
        throwsMatching(() => run(loaded), /depends on the order of rule applications/);
        unneeded++;
        return;
      }
      const result = run(loaded, { proof: true });
      assert.deepEqual([...result.answers].sort(), [...expected].sort(), source);
      const report = checkProof(loaded, result.proof);
      assert.ok(report.valid, `${JSON.stringify(report.failures)}\n${source}`);
      // Another order could make other witnesses, so no proof with one is
      // checked without obligations.
      if (expected.some((text) => text.includes('skolem('))) {
        assert.ok(!checkProof(loaded, result.proof, { allowTrusted: false }).valid, `a restricted witness was checked strictly\n${source}`);
      }
      // A proof with one value replaced throughout certifies nothing else,
      // unless on an obligation a strict check rejects.
      const [from, to] = [r.pick(NODES), r.pick(NODES)];
      const forged = result.proof.replaceAll(`'${from}'`, `'${to}'`);
      if (forged !== result.proof) {
        forgeries++;
        let forgedReport = null;
        try {
          forgedReport = checkProof(loaded, forged);
        } catch (error) {
          assert.ok(error instanceof EyemindError, `${error.stack}\n${forged}`);
        }
        if (forgedReport !== null && forgedReport.valid) {
          const known = new Set([...expected, ...generated.facts.map((fact) => write(new Struct(fact[0], fact[1])))]);
          const unentailed = readProofTerms(forged).map(([term]) => term).filter((term) => isClaim(term) && !known.has(write(term)));
          if (unentailed.length) {
            assert.ok(!checkProof(loaded, forged, { allowTrusted: false }).valid,
              `a forged proof was accepted for ${write(unentailed[0])}, even strictly\n${source}\n${forged}`);
          }
        }
      }
      // Count the restricted rules whose premise holds but which made no
      // witness, so that blocking is known to be exercised.
      const open = generated.rules.map((rule, index) => ({ rule, id: generated.facts.length + index + 1 }))
        .filter(({ rule }) => rule.restricted);
      for (const { rule, id } of open) {
        if (expected.some((text) => text.includes(`skolem(${id}, `))) continue;
        const holds = run(loaded, { goal: rule.body.map(restrictedAtom).join(', ') }).answers.length > 0;
        if (holds) blocked++;
      }
    });
    assert.ok(blocked >= 20 && forgeries >= 20, `only ${blocked} restricted rules were blocked, ${forgeries} proofs forged`);
    // Most programs must have an order-independent result for the
    // comparison to say much.
    assert.ok(unneeded < 15 * SCALE, `${unneeded} programs made an unneeded witness`);
  },

  'a circular proof of an atom only a cycle supports is rejected'() {
    let forged = 0;
    forSeeds(400, (r) => {
      const generated = randomProgram(r);
      const document = circularProof(generated, naiveModel(generated));
      if (document === null) return;
      forged++;
      const report = checkProof(program(programText(generated)), document);
      assert.ok(!report.valid, `a circular proof was accepted\n${programText(generated)}\n${document}`);
      assert.ok(report.failures.some((failure) => failure.condition === 'C2'),
        `${JSON.stringify(report.failures)}\n${programText(generated)}\n${document}`);
    });
    assert.ok(forged >= 20, `only ${forged} programs had an atom only a cycle supports`);
  },

  'every term reads back from its canonical text as itself'() {
    const keys = new Map();
    forSeeds(1500, (r) => {
      const term = randomTerm(r);
      const text = write(term);
      const back = readTerm(text);
      assert.ok(same(back, term), `${text} read back as ${write(back)}`);
      assert.equal(write(back), text);
      const key = identity(term);
      assert.equal(identity(back), key);
      if (keys.has(key)) assert.equal(keys.get(key), text, 'distinct terms share an identity key');
      keys.set(key, text);
    });
  },

  'native proof records preserve generated terms in both N3 and SRL'() {
    forSeeds(250, (r) => {
      const term = randomTerm(r);
      const text = write(term);
      for (const format of ['n3', 'srl']) {
        const back = readNativeProof(writeNativeProof(text, { format }));
        assert.equal(back.length, 1);
        assert.ok(same(back[0], readTerm(text)), `${format}: ${text}`);
      }
    });
  },

  'text order agrees with a code point array comparison'() {
    forSeeds(1500, (r) => {
      const left = Array.from({ length: r.below(5) }, () => r.pick(ATOMS)).join('');
      const right = Array.from({ length: r.below(5) }, () => r.pick(ATOMS)).join('');
      const a = Array.from(left, (ch) => ch.codePointAt(0));
      const b = Array.from(right, (ch) => ch.codePointAt(0));
      let expected = Math.sign(a.length - b.length);
      for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] !== b[i]) {
          expected = Math.sign(a[i] - b[i]);
          break;
        }
      }
      assert.equal(compareText(left, right), expected, `${write(left)} vs ${write(right)}`);
    });
  },

  'integer division recovers floats from their exact rational values'() {
    forSeeds(1500, (r) => {
      const biased = r.below(2047);
      const high = (r.below(2) << 31) | (biased << 20) | r.below(1 << 20);
      const low = r.below(2 ** 32);
      const bits = new DataView(new ArrayBuffer(8));
      bits.setUint32(0, high);
      bits.setUint32(4, low);
      const expected = bits.getFloat64(0);
      let numerator = (BigInt(high & 0xfffff) << 32n) | BigInt(low);
      if (biased !== 0) numerator += 1n << 52n;
      if (numerator === 0n) return;
      if (high < 0) numerator = -numerator;
      const exponent = biased === 0 ? -1074 : biased - 1075;
      let denominator = 1n;
      if (exponent < 0) denominator <<= BigInt(-exponent);
      else numerator <<= BigInt(exponent);
      const factor = BigInt(1 + r.below(1000));
      const actual = apply('div', [numerator * factor, denominator * factor]);
      assert.ok(Object.is(actual, expected), `${numerator}/${denominator}: ${actual} vs ${expected}`);
    });
  },

  'the reader gives terms or an EyemindError and never runs the text'() {
    delete globalThis.__eyemindRan;
    const seeds = [...HOSTILE, ...Array.from({ length: 40 }, (_, i) => write(randomTerm(random(10000 + i))))];
    forSeeds(2000, (r) => {
      const text = mutateText(r, r.chance(0.3) ? r.pick(HOSTILE) : r.pick(seeds));
      try {
        readTerms(text);
      } catch (error) {
        assert.ok(error instanceof EyemindError, `${JSON.stringify(text)}: ${error.stack}`);
      }
      assert.equal(globalThis.__eyemindRan, undefined, `${JSON.stringify(text)} ran`);
    });
    for (const text of HOSTILE) {
      assert.throws(() => readTerms(text), EyemindError, text);
    }
    // A call of a plain name is data, whatever the name means in JavaScript.
    assert.equal(write(readTerm('eval("globalThis.__eyemindRan = 1")')), "eval('globalThis.__eyemindRan = 1')");
    assert.equal(globalThis.__eyemindRan, undefined);
  },
};

// One forgery test per example, so that a failure names it. Clause removal
// and reordering use the small generated programs and their independent model.
// Proofs over 200 KB are too slow to forge many times.
for (const entry of readManifest()) {
  const path = artifactPath('proof', entry);
  const saved = readFileSync(path, 'utf8');
  // Choose the workload by certificate size, independently of its encoding.
  // Native RDF displays must not reduce the forgery coverage of an example.
  const text = /\.(n3|srl)$/.test(path) ? readProofTerms(saved).map(([term]) => write(term)).join('\n') : saved;
  if (text.length <= 200000) {
    const count = text.length <= 12000 ? 30 : text.length <= 40000 ? 15 : text.length <= 100000 ? 8 : 4;
    tests[`a forged proof of examples/${sourceFiles(entry)[0]} never certifies what the program does not entail`] =
      () => forgeExample(entry, text, count);
  }
}
