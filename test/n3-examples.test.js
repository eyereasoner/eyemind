// Compiled N3 examples keep their domain constraints and checkable witnesses.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkProof, loadText, run } from '../src/index.js';
import { ROOT, assert } from './helpers.js';

const source = (name) => readFileSync(join(ROOT, 'examples', `${name}.js`), 'utf8');

export const tests = {
  'an additional hold blocks the remaining paid order'() {
    const program = loadText(`${source('n3-scoped-negation')}
fact(rdf(iri('https://example.org/orders#order1'), iri('https://example.org/orders#hold'), iri('https://example.org/orders#review')))
`);
    assert.deepEqual(run(program).answers, [
      "rdf(iri('https://example.org/orders#order2'), iri('https://example.org/orders#hold'), iri('https://example.org/orders#addressCheck'))",
    ]);
  },

  'a new route to Nantes fires a French cities integrity fuse'() {
    const program = loadText(`${source('n3-french-cities')}
fact(rdf(iri('https://example.org/french-cities#tours'), iri('https://example.org/french-cities#oneway'), iri('https://example.org/french-cities#nantes')))
`);
    const result = run(program);
    assert.equal(result.haltCode, 65);
    assert.ok(result.answers.includes("'false'"));
  },

  'a forged delivery witness is rejected by C8'() {
    const program = loadText(source('n3-witnesses'));
    const saved = readFileSync(join(ROOT, 'examples/proof/n3-witnesses.js'), 'utf8');
    const forged = saved.replaceAll("'Bdelivery'", "'invented'");
    const report = checkProof(program, forged);
    assert.ok(!report.valid);
    assert.ok(report.failures.some(({ condition }) => condition === 'C8'));
  },
};
