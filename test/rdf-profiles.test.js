import { assert, cli, errorOf } from './helpers.js';
import { checkProof, loadText, readTerm, run, write } from '../src/index.js';
import { loadInputs } from '../src/formats.js';
import { parseRdf } from '../src/rdf.js';

const P = `@prefix : <urn:ex:>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix owl: <http://www.w3.org/2002/07/owl#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix sh: <http://www.w3.org/ns/shacl#>.
@prefix skos: <http://www.w3.org/2004/02/skos/core#>.
@prefix qudt: <http://qudt.org/schema/qudt/>.
@prefix unit: <http://qudt.org/vocab/unit/>.
@prefix qconv: <https://eyereasoner.github.io/eyemind/qudt#>.
@prefix cdt: <https://w3id.org/cdt/>.
`;
const SH = 'http://www.w3.org/ns/shacl#';
const QC = 'https://eyereasoner.github.io/eyemind/qudt#';
const Q = 'http://qudt.org/schema/qudt/';
const key = (q) => q.map((t) => write(t)).join(' ');
function evaluate(data, profiles = { shacl: true }, proof = false) {
  const loaded = loadInputs([[P + data, 'input.ttl']], null, profiles);
  const result = run(loaded.program, { proof, maxInferences: 1000000 });
  return { loaded, result, quads: result.answers.map((a) => readTerm(a).args) };
}
function includes(quads, expected) {
  const keys = new Set(quads.map(key));
  for (const q of parseRdf(P + expected).quads) assert.ok(keys.has(key(q)), key(q));
}
const conforming = (quads) => quads.find(([, p]) => p.args?.[0] === SH + 'conforms')?.[2].args[0] === 'true';
const components = (quads) => quads.filter(([, p]) => p.args?.[0] === SH + 'sourceConstraintComponent').map(([, , o]) => o.args[0].slice(SH.length));
const numbers = (quads) => quads.filter(([, p]) => p.args?.[0] === Q + 'numericValue').map(([, , o]) => Number(typeof o === 'bigint' ? o : o.args[0]));

export const tests = {
  'QUDT, SKOS and SHACL compile standalone, check their proofs and reject a removed claim'() {
    for (const [profile, data] of [
      ['qudt', ':obs :speed "36 km/h"^^cdt:speed.'],
      ['skos', ':a skos:broader :b.'],
      ['shacl', ':Shape sh:targetNode :alice; sh:property [sh:path :name; sh:minCount 1].'],
    ]) {
      const { loaded, result } = evaluate(data, { [profile]: true }, true);
      assert.equal(checkProof(loadText(loaded.text), result.proof).valid, true, profile);
      const forged = result.proof.replace('\n' + result.answers[0] + '\n', '\n');
      assert.notEqual(forged, result.proof);
      assert.equal(checkProof(loaded.program, forged).valid, false, profile);
      assert.doesNotMatch(loaded.text, /\bimport\s/);
    }
  },

  'OWL datatypes compare exact values and detect invalid integer range membership'() {
    const { quads } = evaluate(':p a owl:FunctionalProperty; rdfs:range xsd:byte. :x :p "129"^^xsd:integer. ' +
      ':left :value "01"^^xsd:integer. :right :value "1.0"^^xsd:decimal. ' +
      ':a owl:sameAs :b; :flag true. :b :flag "1"^^xsd:boolean.', { owl2rl: true });
    assert.ok(quads.some(([, p, o]) => p.args?.[0].endsWith('/entailment#rule') && o.args[0] === 'dt-not-type'));
    includes(quads, ':left :value "1.0"^^xsd:decimal. :right :value "01"^^xsd:integer.');
    const different = evaluate(':set a owl:AllDifferent; owl:distinctMembers (:a :b).', { owl2rl: true }).quads;
    includes(different, ':a owl:differentFrom :b. :b owl:differentFrom :a.');
  },

  'SKOS keeps broader and closeMatch non-transitive while closing their documented relations'() {
    const { quads } = evaluate(':a skos:broader :b; skos:closeMatch :d; skos:prefLabel "A"@en; skos:definition "A note". ' +
      ':b skos:broader :c. :d skos:closeMatch :e. :a skos:exactMatch :x. :x skos:exactMatch :y. :list skos:memberList (:a :b).', { skos: true });
    includes(quads, ':a skos:broaderTransitive :c; skos:exactMatch :y; rdfs:label "A"@en; skos:note "A note". ' +
      ':c skos:narrowerTransitive :a. :list skos:member :a, :b; a skos:OrderedCollection, skos:Collection.');
    for (const triple of [':a skos:broader :c.', ':a skos:closeMatch :e.', ':a skos:inScheme :b.']) {
      const expected = key(parseRdf(P + triple).quads[0]); assert.ok(!quads.some((q) => key(q) === expected), triple);
    }
    const cycle = evaluate(':list skos:memberList :cell. :cell rdf:first :a; rdf:rest :cell.', { skos: true }).quads;
    assert.ok(!cycle.some(([s, p]) => s.args?.[0] === 'urn:ex:list' && p.args?.[0].endsWith('#member')));
  },

  'QUDT handles affine conversion, CDT lexical parsing, unknown units and dimension contracts'() {
    const { quads } = evaluate(':a :speed "3.6e1 km/h"^^cdt:speed. :b :temperature [a qudt:QuantityValue; qudt:numericValue 32; qudt:unit unit:DEG_F].', { qudt: true });
    const values = numbers(quads).sort((a, b) => a - b);
    assert.equal(values.length, 2); assert.equal(values[0], 10); assert.ok(Math.abs(values[1] - 273.15) < 1e-10);
    includes(quads, ':a qconv:normalizedCdtLiteral "10.0 m/s"^^cdt:speed.');
    const invalid = evaluate(':length qconv:normalizationProfile qconv:LengthProfile. ' +
      ':a :length [a qudt:QuantityValue; qudt:numericValue 2; qudt:unit unit:SEC]. ' +
      ':b :length "2 s"^^cdt:length. :c :speed "3 pizzas"^^cdt:speed. :d :speed "NaN km/h"^^cdt:speed.', { qudt: true });
    assert.equal(invalid.quads.length, 0);
  },

  'QUDT uses input metadata and logarithmic conventions without recursively normalizing results'() {
    const { quads } = evaluate(':cubits qudt:symbol "cb"; qudt:hasDimensionVector <http://qudt.org/vocab/dimensionvector/A0E0L1I0M0H0T0D0>; qudt:conversionMultiplier 2.0; qudt:conversionOffset 1.0. ' +
      ':a :length "1 cb"^^cdt:length. :b :ratio "20 dB"^^cdt:dimensionless.', { qudt: true });
    assert.deepEqual(numbers(quads).sort((a, b) => a - b), [4, 100]);
    assert.equal(quads.filter(([, p]) => p.args?.[0] === QC + 'normalizedQuantity').length, 2);
    const legacy = evaluate(':a :length "100 cm"^^<http://w3id.org/lindt/custom_datatypes#length>.', { qudt: true }).quads;
    includes(legacy, ':a qconv:normalizedCdtLiteral "1.0 m"^^cdt:length.');
  },

  'QUDT and SKOS or OWL composition resolves reverse local unit alignments'() {
    for (const [profile, predicate] of [['skos', 'skos:exactMatch'], ['owl2rl', 'owl:sameAs']]) {
      const data = `unit:KiloM-PER-HR ${predicate} :local. :local qudt:symbol "localSpeed". :a :speed "36 localSpeed"^^cdt:speed.`;
      assert.equal(evaluate(data, { qudt: true }).quads.length, 0);
      assert.ok(numbers(evaluate(data, { qudt: true, [profile]: true }).quads).includes(10));
    }
  },

  'SHACL count constraints inspect distinct completed path values, including missing and duplicate inputs'() {
    const shape = ':Shape sh:targetNode :alice; sh:property [sh:path :name; sh:minCount 1; sh:maxCount 1; sh:datatype xsd:string].';
    assert.equal(conforming(evaluate(shape + ':alice :name "Alice". :alice :name "Alice".').quads), true);
    const missing = evaluate(shape).quads;
    assert.equal(conforming(missing), false); assert.deepEqual(components(missing), ['MinCountConstraintComponent']);
    assert.equal(conforming(evaluate(shape + ':alice :name "Alice", "A".').quads), false);
    assert.equal(conforming(evaluate(shape + ':alice :name :resource.').quads), false);
    assert.equal(conforming(evaluate('').quads), true);
  },

  'SHACL datatype validity covers integer facets, booleans and Gregorian dates'() {
    for (const [datatype, value, expected] of [
      ['xsd:byte', '"127"^^xsd:byte', true], ['xsd:byte', '"128"^^xsd:byte', false],
      ['xsd:boolean', '"false"^^xsd:boolean', true], ['xsd:boolean', '"yes"^^xsd:boolean', false],
      ['xsd:date', '"2024-02-29"^^xsd:date', true], ['xsd:date', '"2023-02-29"^^xsd:date', false],
      ['xsd:date', '" 2024-02-29 "^^xsd:date', true], ['xsd:date', '"0000-02-29"^^xsd:date', true],
      ['xsd:date', '"-0000-02-29"^^xsd:date', false],
      ['xsd:dateTimeStamp', '"2024-02-29T12:00:00Z"^^xsd:dateTimeStamp', true],
      ['xsd:dateTimeStamp', '"2024-02-29T12:00:00"^^xsd:dateTimeStamp', false],
      ['xsd:dateTime', '"2024-02-29T24:00:00.000Z"^^xsd:dateTime', true],
      ['xsd:dateTime', '"2024-02-29T24:00:00.001Z"^^xsd:dateTime', false],
      ['xsd:time', '"12:00:00.12345678901234567890+14:01"^^xsd:time', false],
      ['xsd:double', '"+NaN"^^xsd:double', false],
      ['xsd:base64Binary', '"AB=="^^xsd:base64Binary', false],
    ]) assert.equal(conforming(evaluate(`:S sh:targetNode ${value}; sh:datatype ${datatype}.`).quads), expected, value);
  },

  'SHACL validates XML literal content including attributes, references and markup'() {
    const examples = ['text<a x="&quot; >"/><!--ok--><?test data?><![CDATA[<x>&]]>tail',
      '<p:a p:x="&#x1F600;" xmlns:p="urn:test"><p:b/></p:a>', '<a>&</a>', '<a attr=unquoted/>',
      '<a><![CDATA[missing</a>', '<a>&undeclared;</a>', '<a>&#0;</a>', '<a><!--a--b--></a>',
      '<a x="1" x="2"/>', '<p:a/>', '<a xmlns:p="urn:x" xmlns:q="urn:x" p:n="1" q:n="2"/>'];
    for (const [i, xml] of examples.entries()) {
      const { quads } = evaluate(`:S sh:targetNode :a; sh:property [sh:path :p; sh:datatype rdf:XMLLiteral].
        :a :p ${JSON.stringify(xml)}^^rdf:XMLLiteral.`, { shacl: true }, true);
      assert.equal(conforming(quads), i < 2, xml);
    }
  },

  'SHACL compiles nested node, not, and, or and xone shapes with actual conformance dependencies'() {
    const definition = ':Adult sh:property [sh:path :age; sh:minCount 1; sh:minInclusive 18]. ' +
      ':Named sh:property [sh:path :name; sh:minCount 1]. :alice :age 20; :name "Alice".';
    for (const [constraint, expected] of [['sh:node :Adult', true], ['sh:not :Adult', false], ['sh:and (:Adult :Named)', true],
      ['sh:or (:Missing :Adult)', true], ['sh:xone (:Adult :Named)', false], ['sh:xone (:Adult :Adult)', false], ['sh:or ()', false]]) {
      assert.equal(conforming(evaluate(definition + `:Missing sh:class :Absent. :S sh:targetNode :alice; ${constraint}.`).quads), expected, constraint);
    }
  },

  'SHACL paths deduplicate alternatives and terminate on cycles for inverse and repeated paths'() {
    const graph = ':a :p :b; :q :b. :b :p :a; :name "B".';
    for (const [path, count] of [
      ['[sh:alternativePath (:p :q)]', 1], ['[sh:zeroOrMorePath :p]', 2], ['[sh:oneOrMorePath :p]', 2],
      ['[sh:zeroOrOnePath :p]', 2], ['(:p :name)', 1], ['[sh:inversePath :p]', 1],
    ]) assert.equal(conforming(evaluate(graph + `:S sh:targetNode :a; sh:property [sh:path ${path}; sh:minCount ${count}; sh:maxCount ${count}].`).quads), true, path);
  },

  'SHACL qualified counts, disjoint siblings and repeated logical members are evaluated separately'() {
    const data = ':a :child :b, :c. :b a :Boy. :c a :Boy, :Girl. ' +
      ':B sh:class :Boy. :G sh:class :Girl. :S sh:targetNode :a; sh:property ' +
      '[sh:path :child; sh:qualifiedValueShape :B; sh:qualifiedMinCount 1; sh:qualifiedMaxCount 1; sh:qualifiedValueShapesDisjoint true], ' +
      '[sh:path :child; sh:qualifiedValueShape :G; sh:qualifiedMinCount 1].';
    assert.equal(conforming(evaluate(data).quads), true);
    assert.equal(conforming(evaluate(data.replace('sh:qualifiedValueShapesDisjoint true', 'sh:qualifiedValueShapesDisjoint false')).quads), false);
  },

  'SHACL reports retain focus, source shape, path, value, severity and supplied messages'() {
    const { quads } = evaluate(':alice :age 17. :P sh:path :age; sh:minInclusive 18; sh:severity sh:Warning; sh:message "Too young"@en. :S sh:targetNode :alice; sh:property :P.');
    assert.equal(conforming(quads), false);
    assert.deepEqual(components(quads), ['MinInclusiveConstraintComponent']);
    const result = quads.find(([, p]) => p.args?.[0] === SH + 'result')?.[2];
    const details = quads.filter(([s]) => write(s) === write(result));
    for (const expected of ['sh:focusNode :alice', 'sh:sourceShape :P', 'sh:resultPath :age', 'sh:value 17', 'sh:resultSeverity sh:Warning', 'sh:resultMessage "Too young"@en']) {
      const [, p, o] = parseRdf(P + ':result ' + expected + '.').quads[0];
      assert.ok(details.some(([, p1, o1]) => write(p1) === write(p) && write(o1) === write(o)), expected);
    }
  },

  'SHACL closed, set, language, string and pair constraints inspect the selected value sets'() {
    for (const [constraint, data, expected] of [
      ['sh:in ("a" "b")', ':a :p "a".', true], ['sh:hasValue "b"', ':a :p "a".', false],
      ['sh:languageIn ("en")', ':a :p "colour"@en-GB.', true],
      ['sh:uniqueLang true', ':a :p "a"@en, "b"@en.', false],
      ['sh:minLength 2; sh:maxLength 3; sh:pattern "^[A-Z]+$"; sh:flags "i"', ':a :p "ab".', true],
      ['sh:equals :q', ':a :p 1; :q 1, 2.', false], ['sh:disjoint :q', ':a :p 1; :q 2.', true],
      ['sh:lessThan :q', ':a :p 1, 2; :q 3, 4.', true], ['sh:lessThan :q', ':a :p 1, 2; :q 2.', false],
    ]) assert.equal(conforming(evaluate(`${data} :S sh:targetNode :a; sh:property [sh:path :p; ${constraint}].`).quads), expected, constraint);
    const closed = ':a a :Person; :name "Alice"; :extra 2. :S sh:targetNode :a; sh:closed true; sh:ignoredProperties (rdf:type); sh:property [sh:path :name].';
    assert.deepEqual(components(evaluate(closed).quads), ['ClosedConstraintComponent']);
    assert.equal(conforming(evaluate(closed.replace('; :extra 2', '')).quads), true);
  },

  'SHACL validates normalized quantities after QUDT closure and inference cannot read validation reports'() {
    const data = ':obs :speed "36 km/h"^^cdt:speed. :S sh:targetNode :obs; sh:property ' +
      '[sh:path (qconv:normalizedQuantity qudt:numericValue); sh:minCount 1; sh:maxInclusive 10].';
    assert.equal(conforming(evaluate(data, { shacl: true, qudt: true }, true).quads), true);
    const missing = evaluate(data, { shacl: true }).quads;
    assert.equal(conforming(missing), false);
    const path = missing.find(([, p]) => p.args?.[0] === SH + 'resultPath')[2];
    assert.ok(missing.some(([s, p]) => write(s) === write(path) && p.args?.[0].endsWith('#first')));
  },

  'SHACL preserves separate constraint parameters and exact fractional time bounds'() {
    const classes = evaluate(':S sh:targetNode :a; sh:class :A, :B.').quads;
    assert.deepEqual(components(classes), ['ClassConstraintComponent', 'ClassConstraintComponent']);
    const languages = evaluate(':S sh:targetNode :a; sh:property [sh:path :p; sh:uniqueLang true]. :a :p "a"@en, "b"@en, "a"@fr, "b"@fr.').quads;
    assert.equal(components(languages).length, 2);
    for (const [value, bound, expected] of [
      ['2024-01-01T00:00:00.12345678901234567891Z', '2024-01-01T00:00:00.12345678901234567890Z', true],
      ['2024-01-01T01:00:00+01:00', '2024-01-01T00:00:00Z', false],
    ]) assert.equal(conforming(evaluate(`:S sh:targetNode "${value}"^^xsd:dateTime; sh:minExclusive "${bound}"^^xsd:dateTime.`).quads), expected);
    assert.equal(conforming(evaluate(':S sh:targetNode true; sh:minInclusive false.').quads), false);
  },

  'SHACL regex flag translation respects classes and extended whitespace'() {
    for (const [pattern, flags, value, expected] of [
      ['^[.]$', 's', 'x', false], ['^a.b$', 's', 'a\\nb', true],
      ['^ a # b $', 'x', 'a#b', true], ['^[a-z]+$', 'i', 'AbC', true],
    ]) assert.equal(conforming(evaluate(`:S sh:targetNode "${value}"; sh:pattern "${pattern}"; sh:flags "${flags}".`).quads), expected, pattern);
    for (const flags of ['m', 'q']) assert.match(errorOf(() => evaluate(`:S sh:targetNode :a; sh:pattern "a"; sh:flags "${flags}".`)), /--shacl:/);
    assert.match(errorOf(() => evaluate(':S sh:targetNode :a; sh:pattern "\\\\u0041"; sh:flags "i".')), /ASCII/);
  },

  'SHACL rejects malformed, recursive and unsupported shapes instead of declaring conformance'() {
    for (const data of [':S sh:targetNode :a; sh:node :S.', ':S sh:targetNode :a; sh:sparql [sh:select "SELECT * WHERE {}"].',
      ':S sh:targetNode :a; sh:property [sh:path :p; sh:minCount -1].', ':S sh:targetNode :a; sh:or :list. :list rdf:first :S; rdf:rest :list.']) {
      assert.match(errorOf(() => evaluate(data)), /--shacl:/);
    }
    assert.equal(conforming(evaluate(':S sh:targetNode :a; sh:deactivated true; sh:class :Missing.').quads), true);
    for (const flag of ['--qudt', '--skos', '--shacl']) {
      assert.match(cli([flag, '--stream-messages'], '').stderr, /needs an RDF Message Log/);
      assert.match(cli([flag, 'examples/socrates.js']).stderr, /an output contract states only query/);
    }
  },

  'all four RDF profiles compose while graph boundaries and validation reports stay isolated'() {
    const data = ':obs :speed "36 km/h"^^cdt:speed. :S sh:targetNode :obs; sh:property ' +
      '[sh:path (qconv:normalizedQuantity qudt:numericValue); sh:minCount 1; sh:maxInclusive 10]. ' +
      'sh:ValidationReport rdfs:subClassOf :ReportLeak. :Leak sh:targetClass :ReportLeak; sh:class :Impossible.';
    assert.equal(conforming(evaluate(data, { owl2rl: true, qudt: true, skos: true, shacl: true }, true).quads), true);
    const loaded = loadInputs([[P + ':data { :a :p 1. } :shapes { :S sh:targetNode :a; sh:property [sh:path :p; sh:minCount 1]. }', 'input.trig']], null, { shacl: true });
    const quads = run(loaded.program).answers.map((a) => readTerm(a).args);
    const reports = quads.filter(([, p]) => p.args?.[0] === SH + 'conforms');
    assert.equal(reports.length, 2);
    assert.equal(reports.find(([, , , g]) => g.args[0] === 'urn:ex:shapes')[2].args[0], 'false');
    assert.equal(reports.find(([, , , g]) => g.args[0] === 'urn:ex:data')[2].args[0], 'true');
  },
};
