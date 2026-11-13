// Compiled N3 examples keep their domain constraints and checkable witnesses.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkProof, readNativeProof, run, write, writeNativeProof } from '../src/index.js';
import { loadInputs } from '../src/formats.js';
import { ROOT, assert } from './helpers.js';

function programFrom(name, extra = '') {
  const path = join(ROOT, 'examples', `${name}-n3.n3`);
  return loadInputs([[`${readFileSync(path, 'utf8')}\n${extra}`, path]]).program;
}

export const tests = {
  'an additional hold blocks the remaining paid order'() {
    const program = programFrom('scoped-negation', ':order1 :hold :review .');
    assert.deepEqual(run(program).answers, [
      "rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#hold'), iri('https://example.org/orders#addressCheck'))",
    ]);
  },

  'a new route to Nantes fires a French cities integrity fuse'() {
    const program = programFrom('french-cities', ':tours :oneway :nantes .');
    const result = run(program);
    assert.equal(result.haltCode, 65);
    assert.ok(result.answers.includes("'false'"));
  },

  // The restricted rule's guard names the witness too, so C1 rejects the
  // renamed guard as C8 rejects the renamed witness.
  'a forged delivery witness is rejected'() {
    const program = programFrom('witnesses');
    const saved = readFileSync(join(ROOT, 'examples/proof/witnesses-n3.n3'), 'utf8');
    const certificate = readNativeProof(saved).map((term) => write(term)).join('\n');
    const altered = certificate.replace(/(skolem\([0-9]+, )'Bdelivery'/g, "$1'invented'");
    assert.notEqual(altered, certificate);
    const forged = writeNativeProof(altered);
    const report = checkProof(program, forged);
    assert.ok(!report.valid);
    assert.ok(report.failures.some(({ condition }) => condition === 'C1' || condition === 'C8'));
  },
};
