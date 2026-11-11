// EARL reports describe the outcomes of actual manifest cases, never the
// acceptance of input alone (negative syntax tests must be rejected).
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { earlReport } from '../tools/earl.js';
import { parseRdf } from '../src/rdf.js';
import { write } from '../src/index.js';
import { manifestCases, RDF_MANIFESTS, sparqlRlCases } from './w3c.js';
import { ROOT, assert } from './helpers.js';

const EARL = 'http://www.w3.org/ns/earl#';
const quads = (text) => parseRdf(text, { format: 'turtle' }).quads;
const values = (data, predicate) => data.filter((q) => q[1].args[0] === predicate).map((q) => q[2]);

export const tests = {
  'EARL distinguishes passed, failed and untested cases and preserves diagnostic text'() {
    const cases = [
      { case: { id: 'urn:case:pass', name: 'negative syntax accepted as a passing rejection', manifest: 'urn:manifest' }, ok: true },
      { case: { id: 'urn:case:fail', name: 'failure' }, ok: false, message: 'wrong "answer"\npath \\ broken' },
      { case: { id: 'urn:case:unrun', name: 'not run' } },
    ];
    const report = earlReport(cases, { title: 'A test report', version: '1.2.3', date: '2026-11-11T00:00:00.000Z' });
    const data = quads(report);
    assert.deepEqual(values(data, `${EARL}test`).map((t) => t.args[0]), cases.map((r) => r.case.id));
    assert.deepEqual(values(data, `${EARL}outcome`).map((t) => t.args[0]), ['passed', 'failed', 'untested'].map((s) => `${EARL}${s}`));
    assert.deepEqual(values(data, `${EARL}info`).map((t) => t.args[0]), ['passed', cases[1].message, 'not run']);
    assert.ok(values(data, `${EARL}mode`).every((t) => t.args[0] === `${EARL}automatic`));
    assert.deepEqual(values(data, 'http://usefulinc.com/ns/doap#revision').map((t) => t.args[0]), ['1.2.3']);
    const assertions = data.filter((q) => q[1].args[0].endsWith('#type') && q[2].args?.[0] === `${EARL}Assertion`);
    assert.equal(assertions.length, cases.length);
    assert.equal(new Set(assertions.map((q) => write(q[0]))).size, cases.length);
  },

  'even a filtered npm test invocation regenerates both complete W3C EARL reports'() {
    const result = spawnSync(process.execPath, [join(ROOT, 'test/run.js'), 'unit', '-k', 'earl-no-matching-test'], {
      cwd: ROOT, encoding: 'utf8', timeout: 30000,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 1, 'the selected unit test does not exist');
    assert.match(result.stdout, /Wrote reports\/w3c-rdf-earl\.ttl and reports\/w3c-sparql-rl-earl\.ttl/);
    for (const [name, cases] of [
      ['w3c-rdf-earl.ttl', RDF_MANIFESTS.flatMap(manifestCases)],
      ['w3c-sparql-rl-earl.ttl', sparqlRlCases()],
    ]) {
      const data = quads(readFileSync(join(ROOT, 'reports', name), 'utf8'));
      assert.deepEqual(values(data, `${EARL}test`).map((t) => t.args[0]), cases.map((c) => c.id));
      assert.equal(values(data, `${EARL}outcome`).length, cases.length);
      assert.ok(values(data, `${EARL}outcome`).every((t) => t.args[0] === `${EARL}passed`));
    }
  },
};
