// W3C SHACL 1.2 manifests, including every processor family at the root.
// Report comparison follows the suite's full-compliance rules: top-level
// results, retained messages, expanded paths and a multiset of results.
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { run, readTerm, write } from '../src/index.js';
import { parseRdf } from '../src/rdf.js';
import { properListItems } from '../src/terms.js';
import { compileRdfLogic } from '../src/rdf-logic.js';
import { cachePaths } from '../tools/test-cache.js';

export const SHACL_BASE = 'https://w3c.github.io/data-shapes/shacl12-test-suite/tests/';
export const SHACL_PATH = 'shacl12-test-suite/tests';
// eyemind targets SHACL Core and node expressions; scoring and EARL cover only these groups.
export const SHACL_GROUPS = ['core', 'node-expr'];
const MF = 'http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#';
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const SH = 'http://www.w3.org/ns/shacl#';
const SHT = 'http://www.w3.org/ns/shacl-test#';
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#';
const uri = (term) => term?.name === 'iri' ? term.args[0] : null;
const same = (a, b) => write(a) === write(b);

export function shaclResource(url, mirror = cachePaths().shacl) {
  if (!url.startsWith(SHACL_BASE)) throw new Error(`SHACL resource outside the cached suite: ${url}`);
  const path = resolve(mirror, decodeURIComponent(url.slice(SHACL_BASE.length).replace(/#.*$/, '')));
  if (!path.startsWith(resolve(mirror) + sep)) throw new Error(`SHACL resource escapes the cache: ${url}`);
  return path;
}

function graph(quads) {
  const index = new Map();
  for (const [s, p, o] of quads) {
    const key = write(s);
    if (!index.has(key)) index.set(key, new Map());
    const properties = index.get(key);
    if (!properties.has(uri(p))) properties.set(uri(p), []);
    if (!properties.get(uri(p)).some((t) => same(t, o))) properties.get(uri(p)).push(o);
  }
  const objects = (s, p) => index.get(write(s))?.get(p) ?? [];
  const one = (s, p) => {
    const values = objects(s, p);
    if (values.length !== 1) throw new Error(`${write(s)} needs one <${p}>, found ${values.length}`);
    return values[0];
  };
  const list = (head) => {
    const items = [], seen = new Set();
    for (let at = head; uri(at) !== RDF + 'nil'; at = one(at, RDF + 'rest')) {
      if (seen.has(write(at))) throw new Error(`cyclic manifest list at ${write(at)}`);
      seen.add(write(at)); items.push(one(at, RDF + 'first'));
    }
    return items;
  };
  const properties = (s) => [...(index.get(write(s)) ?? new Map())].map(([p, objects]) => [p, objects]);
  return { objects, one, list, properties };
}

export function shaclCases({ mirror = cachePaths().shacl } = {}) {
  const cases = [], visited = new Set(), ids = new Set();
  const walk = (manifest) => {
    if (visited.has(manifest)) return;
    visited.add(manifest);
    const { quads } = parseRdf(readFileSync(shaclResource(manifest, mirror), 'utf8'), { base: manifest, scope: manifest });
    const g = graph(quads);
    for (const [, p, o] of quads) if (uri(p) === MF + 'include') {
      for (const item of uri(o) && uri(o) !== RDF + 'nil' ? [o] : g.list(o)) walk(uri(item));
    }
    for (const [, p, o] of quads) if (uri(p) === MF + 'entries') for (const entry of g.list(o)) {
      const id = uri(entry);
      if (!id || ids.has(id)) throw new Error(`invalid or duplicate SHACL test ID: ${write(entry)}`);
      ids.add(id);
      const action = g.one(entry, MF + 'action');
      const data = g.objects(action, SHT + 'dataGraph').map(uri);
      const shapes = g.objects(action, SHT + 'shapesGraph').map(uri);
      const type = g.objects(entry, RDF + 'type').map(uri).find((t) => t?.startsWith(SHT));
      cases.push({ id, actionNode: action, name: g.objects(entry, MF + 'name')[0]?.args[0] ?? g.objects(entry, RDFS + 'label')[0]?.args[0] ?? id,
        manifest, group: manifest.slice(SHACL_BASE.length).split('/')[0], type: type?.slice(SHT.length) ?? 'unknown',
        requires: g.objects(entry, MF + 'requires').map(uri), status: uri(g.objects(entry, MF + 'status')[0]),
        data, shapes, expected: g.one(entry, MF + 'result') });
    }
  };
  walk(SHACL_BASE + 'manifest.ttl');
  return cases;
}

const FIELDS = ['focusNode', 'resultSeverity', 'sourceConstraintComponent', 'sourceShape', 'value'];
const PATHS = ['inversePath', 'alternativePath', 'zeroOrMorePath', 'oneOrMorePath', 'zeroOrOnePath'];

// Paths compare by structure, independently for every occurrence. Focus nodes,
// values and source shapes retain their input blank-node identity. A report's
// generated result IDs are irrelevant, but duplicate result nodes still count.
export function compareShaclReports(actual, expected, expectedRoot) {
  const a = graph(actual), e = graph(expected);
  const roots = actual.filter(([, p, o]) => uri(p) === RDF + 'type' && uri(o) === SH + 'ValidationReport').map(([s]) => s);
  if (roots.length !== 1) return { ok: false, booleanOk: false, message: `expected one validation report, found ${roots.length}` };
  const bool = (g, root) => {
    const value = g.one(root, SH + 'conforms');
    if (value.name !== 'literal' || value.args[1]?.args[0] !== 'http://www.w3.org/2001/XMLSchema#boolean' ||
        !['true', 'false', '1', '0'].includes(value.args[0])) throw new Error('invalid sh:conforms value');
    return ['true', '1'].includes(value.args[0]);
  };
  const wantedBoolean = bool(e, expectedRoot);
  const messages = new Set(e.objects(expectedRoot, SH + 'result').flatMap((r) => e.objects(r, SH + 'resultMessage')).map((t) => write(t)));
  const path = (g, term, seen = new Set()) => {
    if (uri(term)) return write(term);
    if (seen.has(write(term))) throw new Error('cyclic result path');
    const next = new Set(seen).add(write(term));
    if (g.objects(term, RDF + 'first').length) return ['sequence', ...g.list(term).map((p) => path(g, p, next))];
    const ops = PATHS.filter((p) => g.objects(term, SH + p).length);
    if (ops.length !== 1) throw new Error('invalid result path');
    const child = g.one(term, SH + ops[0]);
    return ops[0] === 'alternativePath' ? [ops[0], ...g.list(child).map((p) => path(g, p, next))] : [ops[0], path(g, child, next)];
  };
  // A sourceConstraint is a deep copy: blank nodes compare by their triples.
  const copy = (g, term, seen = new Set()) => {
    if (term?.name !== 'bnode') return write(term);
    if (seen.has(write(term))) throw new Error('cyclic source constraint');
    const next = new Set(seen).add(write(term));
    return g.properties(term).map(([p, objects]) => [p, objects.map((o) => copy(g, o, next)).sort()]).sort();
  };
  const report = (g, root) => {
    if (!g.objects(root, RDF + 'type').some((t) => uri(t) === SH + 'ValidationReport')) throw new Error('missing ValidationReport type');
    return g.objects(root, SH + 'result').map((r) => {
      if (!g.objects(r, RDF + 'type').some((t) => uri(t) === SH + 'ValidationResult')) throw new Error('missing ValidationResult type');
      const fields = Object.fromEntries(FIELDS.map((p) => [p, g.objects(r, SH + p).map((t) => write(t)).sort()]));
      fields.resultPath = g.objects(r, SH + 'resultPath').map((p) => JSON.stringify(path(g, p))).sort();
      fields.sourceConstraint = g.objects(r, SH + 'sourceConstraint').map((t) => JSON.stringify(copy(g, t))).sort();
      fields.resultMessage = g.objects(r, SH + 'resultMessage').map((t) => write(t)).filter((m) => messages.has(m)).sort();
      return JSON.stringify(fields);
    }).sort();
  };
  const wanted = report(e, expectedRoot);
  let got, booleanOk = false;
  try { booleanOk = bool(a, roots[0]) === wantedBoolean; got = report(a, roots[0]); }
  catch (error) { return { ok: false, booleanOk, message: `invalid validation report: ${error.message}` }; }
  const ok = booleanOk && JSON.stringify(wanted) === JSON.stringify(got);
  return { ok, booleanOk, message: ok ? 'passed (complete report)' :
    `${booleanOk ? 'conforms matches; ' : 'conforms differs; '}validation report differs\nexpected: ${JSON.stringify(wanted)}\nactual: ${JSON.stringify(got)}` };
}

// A node expression test evaluates sht:nodeExpr in its own file, with an
// optional focus node and scope, and compares the output nodes or failure.
function runNodeExpression(c, read) {
  const manifest = read(c.manifest), g = graph(manifest.quads);
  const expression = g.one(c.actionNode, SHT + 'nodeExpr');
  const focus = g.objects(c.actionNode, SHT + 'focusNode')[0];
  const scope = manifest.quads.filter(([s, p]) => same(s, c.actionNode) && uri(p)?.startsWith(SHT + 'scope-'))
    .map(([, p, o]) => [uri(p).slice(SHT.length + 'scope-'.length), o]);
  const unordered = g.objects(c.actionNode, SHT + 'ignoreOrder').some((t) => t.args?.[0] === 'true');
  let answers;
  try {
    const loaded = compileRdfLogic({ ...manifest }, { profiles: ['shacl'], source: c.id, evaluate: { expression, focus, scope } });
    answers = run(loaded.program, { maxInferences: 250000, maxIterations: 1000 }).answers.map((a) => readTerm(a).args[0]);
  } catch (error) {
    const unsupported = /unsupported|not supported/.test(error.message);
    return { ok: false, unsupported, message: error.message };
  }
  if (answers.length !== 1) return { ok: false, message: `expected one evaluation result, found ${answers.length}` };
  const [result] = answers, failed = result.name !== 'nodes';
  if (uri(c.expected) === SHT + 'Failure') return { ok: failed, message: failed ? 'passed (expected evaluation failure)' : `expected a failure, got ${write(result)}` };
  if (failed) return { ok: false, message: 'evaluation failed, but output nodes were expected' };
  const order = (list) => unordered ? [...list].sort() : list;
  const got = order(properListItems(result.args[0]).map((t) => write(t))), wanted = order(g.list(c.expected).map((t) => write(t)));
  const ok = JSON.stringify(got) === JSON.stringify(wanted);
  return { ok, message: ok ? 'passed (output nodes)' : `output nodes differ\nexpected: ${wanted.join(' ')}\nactual: ${got.join(' ')}` };
}

export function runShaclCase(c, { mirror = cachePaths().shacl } = {}) {
  const documents = new Map();
  const read = (url) => {
    if (!documents.has(url)) documents.set(url, parseRdf(readFileSync(shaclResource(url, mirror), 'utf8'), { base: url, scope: url }));
    return documents.get(url);
  };
  if (c.type === 'EvalNodeExpr') return runNodeExpression(c, read);
  // These processors have distinct contracts. Refusing an unimplemented
  // processor never counts as passing one of its expected-failure cases.
  if (c.type !== 'Validate') return { ok: null, unsupported: true, message: `unsupported SHACL processor test: ${c.type}` };
  const requirements = c.requires.filter((r) => r !== SHT + 'Core' && r !== SHT + 'NodeExpr');
  if (requirements.length) return { ok: null, unsupported: true, message: `unsupported SHACL processor requirements: ${requirements.join(', ')}` };
  const manifest = read(c.manifest);
  if (c.data.length !== 1 || c.shapes.length !== 1 || !c.data[0] || !c.shapes[0]) throw new Error(`${c.id}: needs one data graph and one shapes graph`);
  const data = read(c.data[0]), shapes = read(c.shapes[0]);
  // The suite states a non-default conformance-disallow set in the expected report.
  const disallows = manifest.quads.filter(([s, p]) => same(s, c.expected) && uri(p) === SH + 'conformanceDisallows').map(([, , o]) => uri(o));
  let actual;
  try {
    const loaded = compileRdfLogic({ ...data, shapes: shapes.quads }, { profiles: ['shacl'], source: c.id, disallows: disallows.length ? disallows : undefined });
    actual = run(loaded.program, { maxInferences: 250000, maxIterations: 1000 }).answers.map((a) => readTerm(a).args);
  } catch (error) {
    const unsupported = /unsupported|not supported/.test(error.message);
    const failure = uri(c.expected) === SHT + 'Failure' && !unsupported && error.name === 'EyemindError' && /--shacl:/.test(error.message);
    return { ok: failure, unsupported, message: failure ? 'passed (expected validation failure)' : error.message };
  }
  if (uri(c.expected) === SHT + 'Failure') return { ok: false, message: 'expected a validation failure, but validation returned a report' };
  return compareShaclReports(actual, manifest.quads, c.expected);
}

export const scoredShaclCases = (options = {}) => shaclCases(options).filter((c) => SHACL_GROUPS.includes(c.group));

export function scoreShaclCase(c, options) {
  const started = performance.now();
  let result;
  try { result = runShaclCase(c, options); }
  catch (error) { result = { ok: false, message: `test harness: ${error.message}` }; }
  return { ...result, seconds: (performance.now() - started) / 1000 };
}

export function runShaclManifest(options = {}) {
  return scoredShaclCases(options).map((c) => ({ case: c, ...scoreShaclCase(c, options) }));
}
