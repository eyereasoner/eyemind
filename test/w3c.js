// The W3C test suites of the formats eyemind reads: RDF, and SPARQL 1.2 RL.
//
// The W3C RDF test suites eyemind reads RDF by: N-Triples, N-Quads, Turtle
// and TriG, in RDF 1.1 and 1.2, from .cache/w3c/rdf-tests.
//
// A syntax test parses its action, which must succeed or, for a negative
// test, fail; an evaluation test parses its action and its result, and the
// two datasets must be the same up to the renaming of blank nodes.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { Struct, loadText, write } from '../src/index.js';
import { DEFAULT_GRAPH, parseRdf, rdfFormat } from '../src/rdf.js';
import { compileRuleSet, parseRuleSet, readRuleSet, reasonSrl } from '../src/srl.js';
import { cachePaths } from '../tools/test-cache.js';

export const W3C_BASE = 'https://w3c.github.io/rdf-tests/';
export const MIRROR = cachePaths().rdf;

export const RDF_MANIFESTS = [
  'rdf/rdf11/rdf-n-triples/manifest.ttl',
  'rdf/rdf12/rdf-n-triples/syntax/manifest.ttl',
  'rdf/rdf11/rdf-n-quads/manifest.ttl',
  'rdf/rdf12/rdf-n-quads/syntax/manifest.ttl',
  'rdf/rdf11/rdf-turtle/manifest.ttl',
  'rdf/rdf12/rdf-turtle/eval/manifest.ttl',
  'rdf/rdf12/rdf-turtle/syntax/manifest.ttl',
  'rdf/rdf11/rdf-trig/manifest.ttl',
  'rdf/rdf12/rdf-trig/eval/manifest.ttl',
  'rdf/rdf12/rdf-trig/syntax/manifest.ttl',
].map((path) => W3C_BASE + path);

const MF = 'http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#';
const RDFT = 'http://www.w3.org/ns/rdftest#';
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';

const local = (url) => join(MIRROR, ...url.slice(W3C_BASE.length).replace(/#.*$/, '').split('/'));
const read = (url) => readFileSync(local(url), 'utf8');

// The cases of a manifest, in its entry order.
export function manifestCases(manifest, { mirror = MIRROR } = {}) {
  const path = join(mirror, ...manifest.slice(W3C_BASE.length).replace(/#.*$/, '').split('/'));
  const { quads } = parseRdf(readFileSync(path, 'utf8'), { format: 'turtle', base: manifest });
  const index = new Map();
  for (const [s, p, o] of quads) {
    const k = `${write(s)} ${p.args[0]}`;
    if (!index.has(k)) index.set(k, []);
    index.get(k).push(o);
  }
  const objects = (s, p) => index.get(`${write(s)} ${p}`) ?? [];
  const list = (head) => {
    const items = [];
    for (let node = head; node && !(node.name === 'iri' && node.args[0] === `${RDF}nil`); node = objects(node, `${RDF}rest`)[0]) {
      items.push(objects(node, `${RDF}first`)[0]);
    }
    return items;
  };
  const entries = quads.filter((q) => q[1].args[0] === `${MF}entries`).flatMap((q) => list(q[2]));
  return entries.map((entry) => {
    const types = objects(entry, `${RDF}type`).map((t) => t.args[0]);
    const type = types.find((t) => t.startsWith(RDFT))?.slice(RDFT.length) ?? 'unknown';
    const name = objects(entry, `${MF}name`)[0]?.args[0] ?? entry.args[0];
    return {
      id: entry.args[0], name, type, manifest,
      action: objects(entry, `${MF}action`)[0]?.args[0],
      result: objects(entry, `${MF}result`)[0]?.args[0],
    };
  });
}

// The format a test's type names, as its file extension may not.
function formatOf(type, url) {
  for (const [prefix, format] of [['TestNTriples', 'n-triples'], ['TestNQuads', 'n-quads'], ['TestTurtle', 'turtle'], ['TestTrig', 'trig']]) {
    if (type.startsWith(prefix)) return format;
  }
  return rdfFormat(url);
}

const parseUrl = (url, format) => parseRdf(read(url), { format, base: url, scope: url }).quads;

// Run one case; throws when it fails.
export function runCase(c) {
  const format = formatOf(c.type, c.action);
  if (/NegativeSyntax|NegativeEval/.test(c.type)) {
    let accepted = true;
    try {
      parseUrl(c.action, format);
    } catch {
      accepted = false;
    }
    if (accepted) throw new Error('accepted, but the test expects a syntax error');
  } else if (/PositiveSyntax/.test(c.type)) {
    parseUrl(c.action, format);
  } else if (/Eval/.test(c.type)) {
    const actual = parseUrl(c.action, format);
    const expected = parseUrl(c.result, rdfFormat(c.result));
    if (!isomorphic(actual, expected)) {
      const show = (qs) => qs.map((q) => q.map((t) => (t === DEFAULT_GRAPH ? '' : write(t))).join(' ')).sort().join('\n');
      throw new Error(`the dataset differs from the expected one\nexpected:\n${show(expected)}\nactual:\n${show(actual)}`);
    }
  } else {
    throw new Error(`unsupported test type ${c.type}`);
  }
}

// Whether two datasets are the same up to the renaming of blank nodes: the
// quads without blank nodes as sets, the others by backtracking.
export function isomorphic(a, b) {
  const blank = (t) => t instanceof Struct && (t.name === 'bnode' || t.name === 'skolem');
  const hasBlank = (t) => blank(t) || (t instanceof Struct && t.name === 'triple' && t.args.some(hasBlank));
  const keyOf = (q) => q.map((t) => (t === DEFAULT_GRAPH ? '' : write(t))).join(' ');
  const ground = (qs) => [...new Set(qs.filter((q) => !q.some(hasBlank)).map(keyOf))].sort();
  const [ga, gb] = [ground(a), ground(b)];
  if (ga.length !== gb.length || ga.some((k, i) => k !== gb[i])) return false;
  const dedupe = (qs) => [...new Map(qs.filter((q) => q.some(hasBlank)).map((q) => [keyOf(q), q])).values()];
  const actual = dedupe(a);
  const expected = dedupe(b);
  if (actual.length !== expected.length) return false;
  const used = new Array(actual.length).fill(false);
  const unify = (x, y, map) => {
    if (blank(x) || blank(y)) {
      if (!(blank(x) && blank(y))) return null;
      const [kx, ky] = [`x${write(x)}`, `y${write(y)}`];
      if (map.has(kx)) return map.get(kx) === ky ? map : null;
      if (map.has(ky)) return null;
      return new Map(map).set(kx, ky).set(ky, kx);
    }
    if (x instanceof Struct && y instanceof Struct && x.name === 'triple' && y.name === 'triple') {
      let m = map;
      for (let i = 0; i < 3 && m; i++) m = unify(x.args[i], y.args[i], m);
      return m;
    }
    return (x === DEFAULT_GRAPH ? x : write(x)) === (y === DEFAULT_GRAPH ? y : write(y)) ? map : null;
  };
  const match = (i, map) => {
    if (i === expected.length) return true;
    for (let j = 0; j < actual.length; j++) {
      if (used[j]) continue;
      let m = map;
      for (let k = 0; k < 4 && m; k++) m = unify(expected[i][k], actual[j][k], m);
      if (!m) continue;
      used[j] = true;
      if (match(i + 1, m)) return true;
      used[j] = false;
    }
    return false;
  };
  return match(0, new Map());
}

// Every case of the given manifests: { case, ok, message }.
export function runManifests(manifests = RDF_MANIFESTS) {
  const results = [];
  for (const manifest of manifests) {
    for (const c of manifestCases(manifest)) {
      try {
        runCase(c);
        results.push({ case: c, ok: true, message: 'passed' });
      } catch (error) {
        results.push({ case: c, ok: false, message: error?.message ?? String(error) });
      }
    }
  }
  return results;
}

// The W3C SPARQL 1.2 RL test suite, from .cache/w3c/sparql-rl.
// Syntax tests parse a rule set; well-formedness and stratification tests
// also analyze and compile it, and a stratification test loads the compiled
// program, which eyemind stratifies itself; evaluation tests reason over a
// rule set and its data and compare the inference graph with the expected
// one, numeric literals by value.
export const SRL_BASE = 'https://w3c.github.io/data-shapes/shacl12-test-suite/tests/sparql-rl/';
const SRL_MIRROR = cachePaths().srl;
const SRLT = 'http://www.w3.org/ns/sparql-rl-tests#';
const srlRead = (url) => readFileSync(join(SRL_MIRROR, ...url.slice(SRL_BASE.length).replace(/#.*$/, '').split('/')), 'utf8');

export function sparqlRlCases({ mirror = SRL_MIRROR } = {}) {
  const root = `${SRL_BASE}manifest-sparql-rl.ttl`;
  const graph = (url) => {
    const path = join(mirror, ...url.slice(SRL_BASE.length).replace(/#.*$/, '').split('/'));
    const { quads } = parseRdf(readFileSync(path, 'utf8'), { format: 'turtle', base: url });
    const index = new Map();
    for (const [s, p, o] of quads) {
      const k = `${write(s)} ${p.args[0]}`;
      if (!index.has(k)) index.set(k, []);
      index.get(k).push(o);
    }
    const objects = (s, p) => index.get(`${write(s)} ${p}`) ?? [];
    const list = (head) => {
      const items = [];
      for (let node = head; node && !(node.name === 'iri' && node.args[0] === `${RDF}nil`); node = objects(node, `${RDF}rest`)[0]) {
        items.push(objects(node, `${RDF}first`)[0]);
      }
      return items;
    };
    return { quads, objects, list };
  };
  const top = graph(root);
  const includes = top.quads.filter((q) => q[1].args[0] === `${MF}include`).flatMap((q) => top.list(q[2])).map((t) => t.args[0]);
  const cases = [];
  for (const manifest of includes) {
    const g = graph(manifest);
    const section = manifest.split('/').slice(-2, -1)[0];
    const entries = g.quads.filter((q) => q[1].args[0] === `${MF}entries`).flatMap((q) => g.list(q[2]));
    for (const entry of entries) {
      const type = g.objects(entry, `${RDF}type`).map((t) => t.args[0]).find((t) => t.startsWith(SRLT));
      if (!type) continue;
      const action = g.objects(entry, `${MF}action`)[0];
      const c = { section, manifest, id: entry.args[0], name: g.objects(entry, `${MF}name`)[0]?.args[0] ?? entry.args[0], type: type.slice(SRLT.length) };
      if (c.type === 'RulesEvalTest') {
        c.ruleset = g.objects(action, `${SRLT}ruleset`)[0].args[0];
        c.data = g.objects(action, `${SRLT}data`).map((t) => t.args[0]);
        c.result = g.objects(entry, `${MF}result`)[0].args[0];
      } else c.action = action.args[0];
      cases.push(c);
    }
  }
  return cases;
}

export function runSparqlRlCase(c) {
  if (c.type === 'RulesEvalTest') {
    const data = c.data.flatMap((url) => parseRdf(srlRead(url), { format: 'turtle', base: url, scope: url }).quads);
    const expected = parseRdf(srlRead(c.result), { format: 'turtle', base: c.result, scope: 'expected' }).quads.map(byValue);
    const actual = reasonSrl(srlRead(c.ruleset), { base: c.ruleset, filename: c.ruleset, data }).quads.map(byValue);
    if (!isomorphic(actual, expected)) {
      const show = (qs) => qs.map((q) => q.slice(0, 3).map((t) => write(t)).join(' ')).sort().join('\n') || '(empty)';
      throw new Error(`the inference graph differs\nexpected:\n${show(expected)}\nactual:\n${show(actual)}`);
    }
    return;
  }
  const source = srlRead(c.action);
  const options = { base: c.action, filename: c.action };
  const attempt = c.type.includes('Syntax')
    ? () => parseRuleSet(source, options)
    : () => {
      const stratification = c.type.includes('Stratification');
      const { program } = compileRuleSet(readRuleSet(source, { ...options, checkStratification: stratification }));
      if (stratification) loadText(program, 'compiled.js');
    };
  if (/Positive|Eval/.test(c.type)) attempt();
  else {
    let accepted = true;
    try {
      attempt();
    } catch {
      accepted = false;
    }
    if (accepted) throw new Error('accepted, but the test expects the rule set to be rejected');
  }
}

// A numeric literal compared by value: 5.0 and 5.00 are one decimal.
const NUMERIC = /^http:\/\/www\.w3\.org\/2001\/XMLSchema#(integer|decimal|double|float)$/;
function byValue(quad) {
  return quad.map((t) => {
    if (!(t instanceof Struct) || t.name !== 'literal' || !(t.args[1] instanceof Struct) || t.args[1].name !== 'datatype') return t;
    const m = NUMERIC.exec(t.args[1].args[0]);
    if (!m) return t;
    if (m[1] === 'integer' && /^[+-]?\d+$/.test(t.args[0])) return BigInt(t.args[0]);
    const n = Number(t.args[0]);
    return Number.isNaN(n) ? t : new Struct('literal', [String(n), t.args[1]]);
  });
}

// One test function per section of the suite.
export function runSparqlRl() {
  const sections = {};
  for (const c of sparqlRlCases()) (sections[c.section] ??= []).push(c);
  return Object.fromEntries(Object.entries(sections).map(([section, cases]) => [section, () => {
    const failures = [];
    for (const c of cases) {
      try {
        runSparqlRlCase(c);
      } catch (error) {
        failures.push(`${c.name}: ${error.message.split('\n')[0]}`);
      }
    }
    assert.deepEqual(failures, []);
    assert.ok(cases.length > 0);
  }]));
}
