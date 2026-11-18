// The benchmark is deterministic, compares conclusions rather than spellings,
// and times any command adapter, so another implementation can run it.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EYEMIND, agreement, conclusions, measure, parseArgs } from '../bench/run.js';
import { workloads, writeWorkloads } from '../bench/workloads.js';
import { assert, throwsMatching } from './helpers.js';

const P = '@prefix : <https://example.org/bench#> .\n@prefix sh: <http://www.w3.org/ns/shacl#> .\n@prefix owl: <http://www.w3.org/2002/07/owl#> .\n@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n';
const nt = (lines) => lines.map((l) => l + ' .').join('\n') + '\n';

export const tests = {
  'benchmark workloads are deterministic and cover the four RDF logic profiles'() {
    const [a, b] = [workloads(), workloads()];
    assert.deepEqual(a, b);
    assert.equal(new Set(a.map((w) => w.id)).size, a.length);
    for (const profile of ['owl2rl', 'skos', 'qudt', 'shacl']) assert.ok(a.some((w) => w.profiles.includes(profile)), profile);
  },

  'benchmark arguments need values, known references and positive counts'() {
    assert.equal(parseArgs([]).adapters[0].command, EYEMIND);
    assert.equal(parseArgs(['--adapter', 'a=x', '--adapter', 'b=y']).reference, 'a');
    throwsMatching(() => parseArgs(['--adapter', 'nameless']), /NAME=COMMAND/);
    throwsMatching(() => parseArgs(['--reference', 'other']), /names no adapter/);
    throwsMatching(() => parseArgs(['--iterations', '0']), /positive integer/);
    throwsMatching(() => parseArgs(['--timeout']), /needs a value/);
  },

  'benchmark comparisons ignore input, blank nodes, vocabulary axioms and reflexive triples'() {
    const input = [P + ':a :p :b . :C rdfs:subClassOf :D .'];
    const one = conclusions(nt(['<https://example.org/bench#a> <https://example.org/bench#p> <https://example.org/bench#b>',
      '<https://example.org/bench#a> <https://example.org/bench#q> <https://example.org/bench#b>',
      '<https://example.org/bench#C> <http://www.w3.org/2000/01/rdf-schema#subClassOf> <https://example.org/bench#C>',
      '<https://example.org/bench#a> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2000/01/rdf-schema#Resource>',
      '<http://www.w3.org/2002/07/owl#Thing> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#Class>',
      '_:x <https://example.org/bench#q> <https://example.org/bench#b>']), input);
    assert.deepEqual([...one.domain], ["iri('https://example.org/bench#a') iri('https://example.org/bench#q') iri('https://example.org/bench#b')"]);
    const other = conclusions(nt(['<https://example.org/bench#b> <https://example.org/bench#q> <https://example.org/bench#a>']), input);
    assert.deepEqual(agreement(one, other, false), { kind: 'triples', common: 0, onlyReference: 1, onlyOther: 1 });
  },

  'benchmark SHACL comparisons count each violated component per focus node'() {
    const SH = 'http://www.w3.org/ns/shacl#';
    const report = (results) => nt(results.flatMap(([r, f, c]) => [`_:${r} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <${SH}ValidationResult>`,
      `_:${r} <${SH}focusNode> <https://example.org/bench#${f}>`, `_:${r} <${SH}sourceConstraintComponent> <${SH}${c}ConstraintComponent>`]));
    const a = conclusions(report([['r1', 'p1', 'MinCount'], ['r2', 'p1', 'Class']]), [P]);
    const b = conclusions(report([['s1', 'p1', 'Class'], ['s2', 'p2', 'Class']]), [P]);
    assert.equal(a.results, 2);
    assert.deepEqual(agreement(a, b, true), { kind: 'violations', common: 1, onlyReference: 1, onlyOther: 1 });
  },

  'benchmark runs time a command adapter and read its conclusions'() {
    const dir = mkdtempSync(join(tmpdir(), 'eyemind-bench-'));
    try {
      const [workload] = workloads().filter((w) => w.id === 'shacl-persons-100');
      writeWorkloads(dir, [workload]);
      assert.deepEqual(JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')).map((w) => w.id), ['shacl-persons-100']);
      const result = measure({ name: 'eyemind', command: EYEMIND }, workload, join(dir, workload.id), { iterations: 1, timeout: 120 });
      assert.ok(result.ms > 0);
      assert.equal(result.results, 40);
      assert.equal(result.violations.size, 40);
      const failing = measure({ name: 'broken', command: 'exit 3' }, workload, join(dir, workload.id), { iterations: 1, timeout: 120 });
      assert.match(failing.error, /exit 3/);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  },
};
