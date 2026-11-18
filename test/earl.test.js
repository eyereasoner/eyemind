// EARL reports describe the outcomes of actual manifest cases, never the
// acceptance of input alone (negative syntax tests must be rejected).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { earlReport } from '../tools/earl.js';
import { parseRdf } from '../src/rdf.js';
import { write } from '../src/index.js';
import { manifestCases, RDF_MANIFESTS, sparqlRlCases } from './w3c.js';
import { scoredShaclCases } from './shacl.js';
import { assert } from './helpers.js';

const EARL = 'http://www.w3.org/ns/earl#';
const quads = (text) => parseRdf(text, { format: 'turtle' }).quads;
const values = (data, predicate) => data.filter((q) => q[1].args[0] === predicate).map((q) => q[2]);

// Check the reports this invocation wrote against the complete manifests.
// The runner calls this after the W3C sweep, including on filtered runs.
export function checkCompleteEarlReports(directory) {
  for (const [name, cases] of [
    ['w3c-rdf-earl.ttl', RDF_MANIFESTS.flatMap(manifestCases)],
    ['w3c-sparql-rl-earl.ttl', sparqlRlCases()],
    ['w3c-shacl-earl.ttl', scoredShaclCases()],
  ]) {
    const data = quads(readFileSync(join(directory, name), 'utf8'));
    assert.deepEqual(values(data, `${EARL}test`).map((t) => t.args[0]), cases.map((c) => c.id), name);
    assert.equal(values(data, `${EARL}outcome`).length, cases.length, name);
  }
}

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

};
