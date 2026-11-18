// The OWL 2 RL subsuite of MobiBench (W. Van Woensel), taken from the OWL 2
// RDF-based test cases: each positive entailment must be in the closure under
// some mapping of its blank nodes, and each inconsistency must be reported as
// an ent:Conflict.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { run } from '../src/index.js';
import { parseRdf } from '../src/rdf.js';
import { compileRdfLogic } from '../src/rdf-logic.js';
import { write } from '../src/writer.js';
import { cachePaths } from '../tools/test-cache.js';

export const MOBIBENCH_ARCHIVE = 'web/res/owl/conf/testsuite-owl2-rdfbased.zip';
export const MOBIBENCH_SUBSUITE = 'testsuite-owl2-rdfbased/subsuites/owl2rl';
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const CONFLICT = 'https://eyereasoner.github.io/eyemind/entailment#Conflict';
const KINDS = { POSITIVE_ENTAILMENT: 'positive', INCONSISTENCY: 'inconsistency' };

const decode = (text) => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

// The cases of the subsuite: a directory per case, with its metadata, its
// premise and conclusion graphs or, for an inconsistency, its graph.
export function mobibenchCases({ mirror = cachePaths().mobibench } = {}) {
  const suite = join(mirror, MOBIBENCH_SUBSUITE), cases = [];
  for (const id of readdirSync(suite).sort()) {
    const file = (suffix) => join(suite, id, `${id}.${suffix}`);
    if (!existsSync(file('metadata.properties'))) continue;
    const metadata = Object.fromEntries([...readFileSync(file('metadata.properties'), 'utf8')
      .matchAll(/<entry key="([^"]+)">([\s\S]*?)<\/entry>/g)].map(([, key, value]) => [key, decode(value)]));
    const kind = KINDS[metadata['testcase.type']];
    if (!kind) continue;
    const premise = kind === 'positive' ? file('premisegraph.ttl') : file('graph.ttl');
    const conclusion = kind === 'positive' ? file('conclusiongraph.ttl') : null;
    if (!existsSync(premise) || (conclusion && !existsSync(conclusion))) throw new Error(`${id}: missing MobiBench graph`);
    cases.push({ id, kind, name: (metadata['testcase.description'] ?? id).replace(/\s+/g, ' ').trim(), premise, conclusion });
  }
  return cases;
}

// Throws when eyemind --owl2rl does not conclude what the case requires.
export function runMobibenchCase(c) {
  const base = `https://mobibench.example/${c.id}/`;
  const quads = parseRdf(readFileSync(c.premise, 'utf8'), { scope: 'premise', base }).quads;
  const loaded = compileRdfLogic({ quads, prefixes: {} }, { profiles: ['owl2rl'], source: c.id });
  const result = run(loaded.program, { maxDepth: 1_000_000, maxIterations: 100_000, maxInferences: 1_000_000_000 });
  const closure = [...quads.map(([s, p, o]) => [s, p, o]),
    ...result.conclusions.filter((t) => t.name === 'result_rdf').map((t) => t.args.slice(0, 3))];
  if (c.kind === 'inconsistency') {
    if (!closure.some(([, p, o]) => p.args?.[0] === RDF_TYPE && o.args?.[0] === CONFLICT)) throw new Error('no conflict reported');
    return;
  }
  const expected = parseRdf(readFileSync(c.conclusion, 'utf8'), { scope: 'conclusion', base }).quads.map(([s, p, o]) => [s, p, o]);
  const missing = uncovered(closure, expected);
  if (missing) throw new Error(`conclusion not entailed: ${missing}`);
}

// The first expected triple the closure lacks, or null when it holds the whole
// conclusion under some mapping of the conclusion's blank nodes.
export function uncovered(closure, expected) {
  const text = (t) => t.map((term) => write(term)).join(' ');
  const actual = new Set(closure.map(text));
  const blank = (term) => term?.name === 'bnode';
  const ground = expected.filter((t) => !t.some(blank)), open = expected.filter((t) => t.some(blank));
  const absent = ground.find((t) => !actual.has(text(t)));
  if (absent) return text(absent);
  if (!open.length) return null;
  const labels = [...new Set(open.flatMap((t) => t.filter(blank).map((term) => write(term))))];
  const candidates = [...new Set(closure.flatMap((t) => t.map((term) => write(term))))];
  const mapping = new Map();
  const mapped = (t) => t.map((term) => blank(term) ? mapping.get(write(term)) : write(term)).join(' ');
  const match = (i) => {
    if (i === labels.length) return open.every((t) => actual.has(mapped(t)));
    for (const candidate of candidates) {
      mapping.set(labels[i], candidate);
      if (match(i + 1)) return true;
    }
    mapping.delete(labels[i]);
    return false;
  };
  return match(0) ? null : text(open[0]);
}
