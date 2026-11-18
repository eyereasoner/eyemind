// The MobiBench runner decides entailment by containment under a mapping of
// the conclusion's blank nodes, and an inconsistency by a reported conflict.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseRdf } from '../src/rdf.js';
import { MOBIBENCH_SUBSUITE, mobibenchCases, runMobibenchCase, uncovered } from './mobibench.js';
import { assert, throwsMatching } from './helpers.js';

const triples = (text) => parseRdf(text, { scope: 'test' }).quads.map(([s, p, o]) => [s, p, o]);

function mirror(cases) {
  const root = mkdtempSync(join(tmpdir(), 'eyemind-mobibench-test-'));
  for (const [id, type, files] of cases) {
    const dir = join(root, MOBIBENCH_SUBSUITE, id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${id}.metadata.properties`), `<entry key="testcase.type">${type}</entry><entry key="testcase.description">${id}</entry>`);
    for (const [suffix, text] of Object.entries(files)) writeFileSync(join(dir, `${id}.${suffix}`), text);
  }
  return root;
}

export const tests = {
  'MobiBench containment maps blank nodes of the conclusion consistently'() {
    const closure = triples('<urn:a> <urn:p> <urn:b>. <urn:b> <urn:q> <urn:c>.');
    assert.equal(uncovered(closure, triples('_:x <urn:p> _:y. _:y <urn:q> <urn:c>.')), null);
    assert.ok(uncovered(closure, triples('_:x <urn:p> _:y. _:x <urn:q> <urn:c>.')));
    assert.match(uncovered(closure, triples('<urn:a> <urn:q> <urn:c>.')), /urn:q/);
  },

  'MobiBench cases run through OWL 2 RL, and a missing entailment or conflict fails'() {
    const root = mirror([
      ['entailed', 'POSITIVE_ENTAILMENT', { 'premisegraph.ttl': '<urn:x> a <urn:A>. <urn:A> <http://www.w3.org/2000/01/rdf-schema#subClassOf> <urn:B>.',
        'conclusiongraph.ttl': '<urn:x> a <urn:B>.' }],
      ['unentailed', 'POSITIVE_ENTAILMENT', { 'premisegraph.ttl': '<urn:x> a <urn:A>.', 'conclusiongraph.ttl': '<urn:x> a <urn:B>.' }],
      ['conflict', 'INCONSISTENCY', { 'graph.ttl': '<urn:x> <http://www.w3.org/2002/07/owl#sameAs> <urn:y>; <http://www.w3.org/2002/07/owl#differentFrom> <urn:y>.' }],
      ['consistent', 'INCONSISTENCY', { 'graph.ttl': '<urn:x> a <urn:A>.' }],
      ['other', 'NEGATIVE_ENTAILMENT', {}],
    ]);
    try {
      const cases = Object.fromEntries(mobibenchCases({ mirror: root }).map((c) => [c.id, c]));
      assert.deepEqual(Object.keys(cases).sort(), ['conflict', 'consistent', 'entailed', 'unentailed']);
      runMobibenchCase(cases.entailed);
      runMobibenchCase(cases.conflict);
      throwsMatching(() => runMobibenchCase(cases.unentailed), /conclusion not entailed/);
      throwsMatching(() => runMobibenchCase(cases.consistent), /no conflict reported/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  },
};
