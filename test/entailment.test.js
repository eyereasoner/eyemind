import { checkProof, loadText, run } from '../src/index.js';
import { loadInputs, writeConclusions } from '../src/formats.js';
import { parseRdf } from '../src/rdf.js';
import { write } from '../src/writer.js';
import { assert, cli } from './helpers.js';

const PREFIX = `@prefix : <https://example.org/>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix owl: <http://www.w3.org/2002/07/owl#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix ent: <https://eyereasoner.github.io/eyemind/entailment#>.
`;
const key = (q) => q.map((term) => write(term)).join(' ');
function conclusions(data, owlRl = true) {
  const loaded = loadInputs([[PREFIX + data, 'input.ttl']], null, { rdfs: !owlRl, owlRl });
  const result = run(loaded.program);
  return parseRdf(writeConclusions(loaded, result, { format: 'turtle' })).quads;
}
function includes(actual, expected) {
  const keys = new Set(actual.map(key));
  for (const q of parseRdf(PREFIX + expected).quads) assert.ok(keys.has(key(q)), key(q));
}
const conflicts = (quads) => quads.filter(([, p]) => p.args?.[0]?.endsWith('/entailment#rule')).map(([, , value]) => value.args[0]);

export const tests = {
  'RDFS: class and property hierarchies, domain, range and container membership'() {
    const out = conclusions(`:A rdfs:subClassOf :B. :B rdfs:subClassOf :C.
      :p rdfs:subPropertyOf :q. :q rdfs:subPropertyOf :r; rdfs:domain :A; rdfs:range :B.
      :x :p :y. :member a rdfs:ContainerMembershipProperty. :x :member :z.`, false);
    includes(out, `:x a :A, :B, :C. :y a :B, :C. :x :r :y; rdfs:member :z.
      :A rdfs:subClassOf :C. :p rdfs:domain :C; rdfs:range :C.`);
  },

  'OWL-RL: equality substitution, equivalent and inverse properties, symmetric and transitive properties'() {
    const out = conclusions(`:p a owl:TransitiveProperty, owl:SymmetricProperty; owl:equivalentProperty :q; owl:inverseOf :inverse.
      :x :p :y. :y :p :z. :x owl:sameAs :alias.
      :A owl:equivalentClass :B. :x a :A.`);
    includes(out, `:alias :p :z; :q :z; a :B. :z :inverse :alias. :z :p :x.`);
  },

  'OWL-RL: arbitrary property chains, intersections, unions, enumerations and value restrictions'() {
    const out = conclusions(`:ancestor owl:propertyChainAxiom (:parent :parent :parent).
      :a :parent :b. :b :parent :c. :c :parent :d.
      :AB owl:intersectionOf (:A :B). :Either owl:unionOf (:A :B). :Chosen owl:oneOf (:a :b).
      :a a :A, :B. :c a :AB.
      :HasParent owl:onProperty :parent; owl:someValuesFrom owl:Thing.
      :AllB owl:onProperty :parent; owl:allValuesFrom :B. :a a :AllB.
      :Fixed owl:onProperty :badge; owl:hasValue :gold. :a a :Fixed. :b :badge :gold.`);
    includes(out, `:a :ancestor :d; a :AB, :Either, :Chosen, :HasParent; :badge :gold.
      :b a :B, :Fixed. :c a :A, :B.`);
  },

  'OWL-RL: functional properties, keys and maximum cardinalities infer equality'() {
    const out = conclusions(`:id a owl:InverseFunctionalProperty. :x :id :same. :y :id :same.
      :p a owl:FunctionalProperty. :s :p :u, :v.
      :Person owl:hasKey (:code :country). :alice a :Person; :code "1"; :country :be.
      :alias a :Person; :code "1"; :country :be. :other a :Person; :code "1"; :country :nl.
      :Max owl:onProperty :q; owl:maxCardinality " +01 "^^xsd:nonNegativeInteger. :s a :Max; :q :m, :n.
      :Qualified owl:onProperty :q; owl:onClass :A; owl:maxQualifiedCardinality 1.
      :t a :Qualified; :q :i, :j, :k. :i a :A. :j a :A.`);
    includes(out, `:x owl:sameAs :y. :u owl:sameAs :v. :alice owl:sameAs :alias.
      :m owl:sameAs :n. :i owl:sameAs :j.`);
    const keys = new Set(out.map(key));
    for (const q of parseRdf(PREFIX + ':alice owl:sameAs :other. :i owl:sameAs :k.').quads) assert.ok(!keys.has(key(q)));
    // A tail shared with another key cannot bypass the declared key's class.
    const tail = conclusions(`:C owl:hasKey :head. :D owl:hasKey :tail.
      :head rdf:first :p; rdf:rest :tail. :tail rdf:first :q; rdf:rest rdf:nil.
      :x a :C; :p :shared; :q :same. :y a :C; :p :different; :q :same.`);
    assert.ok(!new Set(tail.map(key)).has(key(parseRdf(PREFIX + ':x owl:sameAs :y.').quads[0])));
  },

  'OWL-RL: contradictions are reported together, with rule names and focus nodes'() {
    const out = conclusions(`:A owl:disjointWith :B; owl:complementOf :C. :x a :A, :B, :C, owl:Nothing.
      :p a owl:IrreflexiveProperty, owl:AsymmetricProperty. :x :p :x.
      :x owl:sameAs :y; owl:differentFrom :y.
      :p owl:propertyDisjointWith :q. :x :q :x.
      :negative owl:sourceIndividual :x; owl:assertionProperty :q; owl:targetIndividual :x.
      :Zero owl:maxCardinality " -0 "^^xsd:nonNegativeInteger; owl:onProperty :q. :x a :Zero.
      :QualifiedZero owl:maxQualifiedCardinality 0; owl:onClass :B; owl:onProperty :q. :x a :QualifiedZero.
      :classes a owl:AllDisjointClasses; owl:members (:A :B).
      :properties a owl:AllDisjointProperties; owl:members (:p :q).
      :different a owl:AllDifferent; owl:distinctMembers (:x :y).`);
    const rules = new Set(conflicts(out));
    for (const rule of ['cax-dw', 'cls-com', 'cls-nothing2', 'prp-irp', 'prp-asyp', 'eq-diff1',
      'prp-pdw', 'prp-npa1', 'cls-maxc1', 'cls-maxqc1', 'cax-adc', 'prp-adp', 'eq-diff3']) assert.ok(rules.has(rule), rule);
    assert.ok(out.some(([, p, o]) => p.args[0].endsWith('/entailment#focus') && o.args?.[0] === 'https://example.org/x'));
  },

  'OWL-RL: cyclic lists terminate, incomplete chains do not fire and missing facts do not create conflicts'() {
    const out = conclusions(`:p owl:propertyChainAxiom :cycle. :cycle rdf:first :q; rdf:rest :cycle.
      :A owl:intersectionOf :cycle. :x :q :y. :C owl:disjointWith :D. :x a :C.`);
    assert.equal(conflicts(out).length, 0);
    assert.ok(!out.some(([, p]) => p.args?.[0] === 'https://example.org/p'));
    assert.ok(!out.some(([s, p, o]) => s.args?.[0] === 'https://example.org/x' && p.args?.[0].endsWith('#type') && o.args?.[0] === 'https://example.org/A'));
  },

  'entailment: switches are explicit, input files merge and named graphs stay separate'() {
    const data = PREFIX + ':A rdfs:subClassOf :B. :x a :A.';
    assert.equal(loadInputs([[data, 'input.ttl']]).kind, 'js');
    const result = cli(['--rdfs'], data);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /:x a :B/);
    assert.equal(cli(['--rdfs', '--owl-rl'], data).stdout, cli(['--owl-rl'], data).stdout);
    const merged = loadInputs([[PREFIX + ':A rdfs:subClassOf :B.', 'schema.ttl'], [PREFIX + ':x a :A.', 'data.ttl']], null, { rdfs: true });
    assert.match(writeConclusions(merged, run(merged.program), { format: 'turtle' }), /:x a :B/);
    const named = loadInputs([[PREFIX + ':g1 { :A rdfs:subClassOf :B. } :g2 { :x a :A. } :g3 { :A rdfs:subClassOf :B. :x a :A. }', 'named.trig']], null, { owlRl: true });
    const namedQuads = parseRdf(writeConclusions(named, run(named.program), { format: 'trig' }), { format: 'trig' }).quads;
    const inferredTypes = namedQuads.filter(([s, p, o]) => s.args?.[0] === 'https://example.org/x' && p.args?.[0].endsWith('#type') && o.args?.[0] === 'https://example.org/B');
    assert.deepEqual(inferredTypes.map((q) => q[3].args[0]), ['https://example.org/g3']);
    assert.match(cli(['--rdfs', '--odrl'], data).stderr, /cannot be combined/);
    assert.match(cli(['--rdfs', 'examples/socrates.js']).stderr, /take RDF inputs/);
    assert.match(cli(['--owl-rl', '--stream-messages'], data).stderr, /cannot be combined/);
  },

  'entailment: compiled JavaScript is standalone, --all includes input and proofs reject missing claims'() {
    for (const flag of ['--rdfs', '--owl-rl']) {
      const input = PREFIX + ':A rdfs:subClassOf :B. :x a :A. :B owl:disjointWith :C. :x a :C.';
      const compiled = cli([flag, '--program'], input);
      assert.equal(compiled.code, 0, compiled.stderr);
      const program = loadText(compiled.stdout);
      const result = run(program, { proof: true });
      assert.equal(checkProof(program, result.proof).valid, true);
      const forged = result.proof.replace('\n' + result.answers[0] + '\n', '\n');
      assert.notEqual(forged, result.proof);
      assert.equal(checkProof(program, forged).valid, false);
      const all = cli([flag, '--all'], input);
      assert.equal(all.code, 0, all.stderr);
      includes(parseRdf(all.stdout).quads, ':x a :A, :B.');
      assert.equal(cli([flag, '--prove-and-check'], input).code, 0);
    }
  },
};
