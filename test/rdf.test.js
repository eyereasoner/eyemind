// RDF 1.2 read into eyemind terms and written back: the W3C test suites of
// N-Triples, N-Quads, Turtle and TriG, and the term mapping.
import { Struct, write } from '../src/index.js';
import { DEFAULT_GRAPH, parseRdf, rdfDocument, rdfFormat, writeRdf } from '../src/rdf.js';
import { assert } from './helpers.js';
import { RDF_MANIFESTS, W3C_BASE, manifestCases, runCase, isomorphic } from './w3c.js';

const terms = (text, format = 'turtle') => parseRdf(text, { format, scope: 'd' }).quads.map((q) => q.map((t) => (t === DEFAULT_GRAPH ? t : write(t))));

export const tests = {
  'language tags and language datatypes are validated in default and named RDF graphs'() {
    const body = (object) => `<http://e/s> <http://e/p> ${object} .`;
    const objects = ['"Hello"@cantbethislong', '"Hello"@en-123456789',
      '"Hello"^^<http://www.w3.org/1999/02/22-rdf-syntax-ns#langString>',
      '"Hello"^^<http://www.w3.org/1999/02/22-rdf-syntax-ns#dirLangString>'];
    for (const format of ['turtle', 'trig', 'n-triples', 'n-quads']) {
      for (const object of objects) assert.throws(() => parseRdf(body(object), { format }), /language tag/);
      assert.equal(parseRdf(body('"Hello"@en-GB'), { format }).quads.length, 1);
      assert.equal(parseRdf(body('"Hello"@ar--rtl'), { format }).quads.length, 1);
    }
    for (const object of objects) assert.throws(() => parseRdf(`<http://e/g> { ${body(object)} }`, { format: 'trig' }), /language tag/);
    assert.throws(() => parseRdf('PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n' +
      body('"Hello"^^rdf:langString')), /requires a language tag/);
    assert.equal(parseRdf(body('"Hello"^^<urn:datatype>')).quads.length, 1);
  },

  'turtle maps to iri, bnode, literal and integer terms'() {
    const quads = terms('PREFIX : <http://e/>\n:s :p 42, 007, 1.50, "x"@en-GB, "y"@ar--rtl, true, _:b .');
    assert.deepEqual(quads.map((q) => q[2]), [
      '42', "literal('007', datatype('http://www.w3.org/2001/XMLSchema#integer'))",
      "literal('1.50', datatype('http://www.w3.org/2001/XMLSchema#decimal'))", "literal('x', lang('en-gb'))",
      "literal('y', lang('ar', 'rtl'))", "literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean'))",
      "bnode('d', 'b')",
    ]);
    assert.deepEqual(quads[0].slice(0, 2), ["iri('http://e/s')", "iri('http://e/p')"]);
    assert.equal(quads[0][3], DEFAULT_GRAPH);
  },

  'reified triples, annotations and named graphs'() {
    const quads = terms('PREFIX : <http://e/>\n:G { :s :p :o ~ :r {| :w 9 |} . << :a :b :c >> :q :z }', 'trig');
    assert.ok(quads.every((q) => q[3] === "iri('http://e/G')"));
    assert.ok(quads.some((q) => q[0] === "iri('http://e/r')" && q[2] === "triple(iri('http://e/s'), iri('http://e/p'), iri('http://e/o'))"));
    assert.ok(quads.some((q) => q[1] === "iri('http://e/w')" && q[2] === '9'));
    assert.equal(quads.filter((q) => q[1] === "iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies')").length, 2);
  },

  'N3 is not Turtle'() {
    for (const text of ['PREFIX : <http://e/>\n{ :a :b :c } :p :z .', 'PREFIX : <http://e/>\n:a = :b .', ':s :p :o .',
      'PREFIX : <http://e/>\n:x .', 'PREFIX : <http://e/>\n:s :p ?x .', 'PREFIX : <http://e/>\n:s :p "a\\zb" .']) {
      assert.throws(() => parseRdf(text), /turtle:/, text);
    }
  },

  'formats follow file extensions'() {
    assert.deepEqual(['a.ttl', 'b.trig', 'c.nt', 'd.nq', 'e.js'].map(rdfFormat), ['turtle', 'trig', 'n-triples', 'n-quads', null]);
  },

  'writing and reading again gives the same dataset'() {
    const text = 'PREFIX : <http://e/>\n:s :p 1, "x"@en, <<( :a :b :c )>> .\n:G { _:b :p 2.5 }\n';
    const { quads, prefixes } = parseRdf(text, { format: 'trig' });
    for (const format of ['trig', 'n-quads']) {
      const again = parseRdf(writeRdf(quads, { format, prefixes }), { format }).quads;
      assert.ok(isomorphic(quads, again), format);
    }
    assert.match(writeRdf(quads, { prefixes }), /^PREFIX : <http:\/\/e\/>\n\n:s :p 1 \./);
  },

  'a document of rdf/4 terms for facts_from'() {
    const { quads } = parseRdf('<http://e/s> <http://e/p> "o" .', { format: 'n-triples' });
    assert.equal(rdfDocument(quads), "rdf(iri('http://e/s'), iri('http://e/p'), literal('o', datatype('http://www.w3.org/2001/XMLSchema#string')), 'default_graph')");
    assert.ok(quads[0][0] instanceof Struct);
  },
};

// Each W3C manifest is one test, its failures listed.
for (const manifest of RDF_MANIFESTS) {
  tests[`W3C ${manifest.slice(W3C_BASE.length)}`] = () => {
    const failures = [];
    const cases = manifestCases(manifest);
    for (const c of cases) {
      try {
        runCase(c);
      } catch (error) {
        failures.push(`${c.name}: ${error.message.split('\n')[0]}`);
      }
    }
    assert.ok(cases.length > 0, 'no cases');
    assert.deepEqual(failures, []);
  };
}
