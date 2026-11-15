// Compiled N3 examples keep their domain constraints and checkable witnesses.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkProof, run } from '../src/index.js';
import { loadInputs } from '../src/formats.js';
import { ROOT, assert } from './helpers.js';

function programFrom(name, extra = '') {
  const path = join(ROOT, 'examples', `${name}-n3.n3`);
  return loadInputs([[`${readFileSync(path, 'utf8')}\n${extra}`, path]]).program;
}

function strictly(name, extra = '') {
  const program = programFrom(name, extra);
  const result = run(program, { proof: true });
  assert.ok(checkProof(program, result.proof).valid);
  return result.conclusions;
}

const relation = (triples, predicate) => triples.filter((triple) => triple.args[1].args[0] === predicate);
const iri = (term) => {
  assert.equal(term.name, 'iri');
  return term.args[0];
};
const generated = (term) => assert.match(iri(term), /^https:\/\/eyereasoner.github.io\/\.well-known\/genid\/[0-9a-f]{64}$/);

export const tests = {
  'Skolem delivery IRIs stay shared and stable when another order is supplied'() {
    const ns = 'https://example.org/delivery#';
    const original = relation(strictly('witnesses'), `${ns}delivery`);
    const triples = strictly('witnesses', ':order3 :status :paid .');
    const links = relation(triples, `${ns}delivery`);
    assert.equal(links.length, 3);
    assert.equal(new Set(links.map((link) => iri(link.args[2]))).size, 3);
    for (const link of links) {
      generated(link.args[2]);
      assert.ok(triples.some((triple) => iri(triple.args[0]) === iri(link.args[2]) &&
        iri(triple.args[1]) === `${ns}status` && iri(triple.args[2]) === `${ns}ready`));
    }
    assert.deepEqual(links.slice(0, 2).map((link) => iri(link.args[2])), original.map((link) => iri(link.args[2])));
  },

  'Skolem mothers keep their classifications and reciprocal child links'() {
    const ns = 'http://example.org/people#';
    const triples = strictly('existential');
    const mothers = relation(triples, `${ns}mother`);
    assert.equal(mothers.length, 2);
    assert.notEqual(iri(mothers[0].args[2]), iri(mothers[1].args[2]));
    for (const mother of mothers) {
      generated(mother.args[2]);
      assert.ok(triples.some((triple) => iri(triple.args[0]) === iri(mother.args[2]) &&
        iri(triple.args[1]) === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' && iri(triple.args[2]) === `${ns}Woman`));
      assert.ok(triples.some((triple) => iri(triple.args[0]) === iri(mother.args[2]) &&
        iri(triple.args[1]) === `${ns}hasChild` && iri(triple.args[2]) === iri(mother.args[0])));
    }
    const explicit = relation(strictly('explicit-existential-rule'), 'http://example.org/hasMother');
    assert.equal(explicit.length, 2);
    assert.deepEqual(explicit.map((link) => iri(link.args[0])), ['http://example.org/tom', 'http://example.org/ann']);
    assert.notEqual(iri(explicit[0].args[2]), iri(explicit[1].args[2]));
    explicit.forEach((link) => generated(link.args[2]));
  },

  'Skolem fathers reuse supplied links and expose two distinct known fathers'() {
    const ns = 'http://example.org/';
    const triples = strictly('restricted-chase');
    const fathers = relation(triples, `${ns}father`);
    assert.equal(fathers.length, 2);
    assert.equal(iri(fathers.find((triple) => iri(triple.args[0]) === `${ns}jo`).args[2]), `${ns}bob`);
    generated(fathers.find((triple) => iri(triple.args[0]) === `${ns}ann`).args[2]);
    assert.equal(relation(triples, `${ns}nef`).length, 0);
    const supplied = strictly('restricted-chase', ':ann :knownFather :alice .');
    assert.deepEqual(relation(supplied, `${ns}father`).map((triple) => iri(triple.args[2])), [`${ns}bob`, `${ns}alice`]);
    assert.ok(!supplied.some((triple) => triple.args.some((term) => iri(term).includes('/.well-known/genid/'))));
    const two = relation(strictly('restricted-chase', ':jo :knownFather :carl .'), `${ns}nef`);
    assert.deepEqual(new Set(two.map((triple) => `${iri(triple.args[0])} ${iri(triple.args[2])}`)),
      new Set([`${ns}bob ${ns}carl`, `${ns}carl ${ns}bob`]));
  },

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

  'a forged delivery Skolem IRI is rejected by recomputing its construction'() {
    const program = programFrom('witnesses');
    const certificate = readFileSync(join(ROOT, 'examples/proof/witnesses-n3.js'), 'utf8');
    const delivery = iri(run(program).conclusions[0].args[2]);
    const altered = certificate.replaceAll(delivery, 'https://example.org/invented');
    assert.notEqual(altered, certificate);
    assert.ok(!checkProof(program, altered).valid);
  },
};
