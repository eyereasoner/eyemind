// RDF 1.2 read into eyemind terms and written back. The test runner evaluates
// the complete W3C manifests separately when it writes the EARL reports.
import { Struct, write } from '../src/index.js';
import { DEFAULT_GRAPH, parseRdf, rdfDocument, rdfFormat, writeRdf } from '../src/rdf.js';
import { assert } from './helpers.js';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isomorphic, manifestCases, MIRROR, RDF_MANIFESTS, W3C_BASE } from './w3c.js';

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

  'relative IRIs may start with = or -, which are not N3 operators in Turtle'() {
    assert.deepEqual(terms('BASE <http://e/>\n<=a> <-b> <=c> .')[0].slice(0, 3), ["iri('http://e/=a')", "iri('http://e/-b')", "iri('http://e/=c')"]);
  },

  'N3 is not Turtle'() {
    for (const text of ['PREFIX : <http://e/>\n{ :a :b :c } :p :z .', 'PREFIX : <http://e/>\n:a = :b .', ':s :p :o .',
      'PREFIX : <http://e/>\n:x .', 'PREFIX : <http://e/>\n:s :p ?x .', 'PREFIX : <http://e/>\n:s :p "a\\zb" .']) {
      assert.throws(() => parseRdf(text), /turtle:/, text);
    }
  },

  'formats follow file extensions'() {
    assert.deepEqual(['a.ttl', 'b.trig', 'c.nt', 'd.nq', 'e.rdf', 'f.jsonld', 'g.js'].map(rdfFormat),
      ['turtle', 'trig', 'n-triples', 'n-quads', 'rdf-xml', 'json-ld', null]);
  },

  'every W3C evaluation result is written in each RDF format and read back the same, or refused'() {
    const refusals = { turtle: /no named graphs/, 'n-triples': /no named graphs/, 'rdf-xml': /no named graphs|U\+0000|triple term as a subject/, 'json-ld': /no triple terms/ };
    let written = 0;
    for (const manifest of RDF_MANIFESTS) for (const c of manifestCases(manifest)) {
      if (!/Eval/.test(c.type) || /Negative/.test(c.type) || !c.result) continue;
      const path = join(MIRROR, c.result.slice(W3C_BASE.length));
      if (!existsSync(path)) continue;
      const quads = parseRdf(readFileSync(path, 'utf8'), { format: rdfFormat(c.result), base: c.result, scope: 'a' }).quads;
      for (const format of ['turtle', 'trig', 'n-triples', 'n-quads', 'rdf-xml', 'json-ld']) {
        let text;
        try {
          text = writeRdf(quads, { format });
        } catch (error) {
          assert.match(error.message, refusals[format] ?? /^$/, `${format} ${c.id}`);
          continue;
        }
        // JSON-LD keeps a base direction only with its rdfDirection option.
        const plain = (qs) => format !== 'json-ld' ? qs : qs.map((q) => q.map((t) => (t instanceof Struct && t.name === 'literal' && t.args[1]?.name === 'lang'
          ? new Struct('literal', [t.args[0], new Struct('lang', [t.args[1].args[0]])]) : t)));
        assert.ok(isomorphic(plain(quads), parseRdf(text, { format, base: c.result, scope: 'b' }).quads), `${format} ${c.id}`);
        written++;
      }
    }
    assert.ok(written > 1000 || written === 0, `${written} datasets written`);
  },

  'TriG reads a subject IRI with # before a graph, and IRIs keep characters beyond U+FFFF'() {
    assert.equal(terms('<http://e/a#x> a <http://e/b> .\n<http://e/g> { <http://e/a> a <http://e/b> . }', 'trig').length, 2);
    assert.equal(terms('<http://e/\u{10000}> <http://e/p> <http://e/o> .', 'n-triples')[0][0], "iri('http://e/\u{10000}')");
  },

  'RDF/XML writes control characters as references, in XML 1.1, and JSON-LD 1.2 contexts are read'() {
    const quads = parseRdf('<http://e/s> <http://e/p> "a\\u0001b" .', { format: 'n-triples', scope: 'd' }).quads;
    const xml = writeRdf(quads, { format: 'rdf-xml' });
    assert.match(xml, /^<\?xml version="1\.1"[\s\S]*a&#x1;b/);
    assert.ok(isomorphic(quads, parseRdf(xml, { format: 'rdf-xml', scope: 'e' }).quads));
    assert.throws(() => writeRdf(parseRdf('<http://e/s> <http://e/p> "x" <http://e/g> .', { format: 'n-quads' }).quads, { format: 'turtle' }), /turtle has no named graphs/);
    assert.equal(parseRdf('{"@context": {"@version": 1.2, "@vocab": "http://e/"}, "@id": "http://e/a", "p": "x"}', { format: 'json-ld' }).quads.length, 1);
    assert.throws(() => parseRdf('{"@context": {"@version": 1.2}}', { format: 'json-ld', processingMode: 'json-ld-1.0' }), /processing mode conflict/);
  },

  'N-Triples and N-Quads keep an IRI as written, Turtle resolves it'() {
    const text = '<http://e/a/./b/../c> <http://e/p> <http://e/o> .';
    assert.equal(terms(text, 'n-triples')[0][0], "iri('http://e/a/./b/../c')");
    assert.equal(terms(text, 'n-quads')[0][0], "iri('http://e/a/./b/../c')");
    assert.equal(terms(text)[0][0], "iri('http://e/a/c')");
  },

  'RDF/XML gives the same terms, with typed, language and XML literals, lists and reification'() {
    const quads = terms(`<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:e="http://e/" xml:base="http://e/">
      <e:Thing rdf:about="s" e:name="S" xml:lang="EN-gb">
        <e:age rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">42</e:age>
        <e:note rdf:parseType="Literal"><b xmlns="http://w/">x</b></e:note>
        <e:items rdf:parseType="Collection"><rdf:Description rdf:about="i"/></e:items>
        <e:knows rdf:ID="r" rdf:nodeID="n1"/>
      </e:Thing></rdf:RDF>`, 'rdf-xml');
    const has = (p, o) => assert.ok(quads.some((q) => q[1] === `iri('http://e/${p}')` && q[2] === o), `${p} ${o}`);
    has('name', "literal('S', lang('en-gb'))");
    has('age', '42');
    has('note', `literal('<b xmlns="http://w/">x</b>', datatype('http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral'))`);
    has('knows', "bnode('d', 'n1')");
    assert.ok(quads.some((q) => q[0] === "iri('http://e/#r')" && q[2] === "iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#Statement')"));
    assert.ok(quads.some((q) => q[1] === "iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#first')" && q[2] === "iri('http://e/i')"));
    assert.throws(() => parseRdf('<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:li/></rdf:RDF>', { format: 'rdf-xml' }),
      /rdf-xml: rdf:li cannot name a node element/);
  },

  'JSON-LD reads local contexts through the loader and reports errors by their code'() {
    const loadDocument = (url) => ({ document: '{"@context": {"@vocab": "http://e/", "knows": {"@type": "@id"}}}', documentUrl: url });
    const quads = parseRdf('{"@context": "ctx.jsonld", "@id": "http://e/a", "knows": "http://e/b", "name": "A"}',
      { format: 'json-ld', base: 'http://e/doc', scope: 'd', loadDocument }).quads.map((q) => q.slice(0, 3).map((t) => write(t)));
    assert.deepEqual(quads.sort(), [["iri('http://e/a')", "iri('http://e/knows')", "iri('http://e/b')"],
      ["iri('http://e/a')", "iri('http://e/name')", "literal('A', datatype('http://www.w3.org/2001/XMLSchema#string'))"]]);
    assert.throws(() => parseRdf('{"@context": "remote.jsonld"}', { format: 'json-ld', base: 'http://e/doc' }), /loading remote context failed/);
    assert.throws(() => parseRdf('{"@context": {"@id": "x"}}', { format: 'json-ld' }), /keyword redefinition/);
  },

  'writing and reading again gives the same dataset'() {
    const text = 'PREFIX : <http://e/>\n:s :p 1, "x"@en, <<( :a :b :c )>> .\n:G { _:b :p 2.5 }\n';
    const { quads, prefixes } = parseRdf(text, { format: 'trig' });
    for (const format of ['trig', 'n-quads']) {
      const again = parseRdf(writeRdf(quads, { format, prefixes }), { format }).quads;
      assert.ok(isomorphic(quads, again), format);
    }
    assert.match(writeRdf(quads.filter((q) => q[3] === DEFAULT_GRAPH), { prefixes }), /^PREFIX : <http:\/\/e\/>\n\n:s :p 1 \./);
  },

  'a graph of more lines than a call takes arguments is written'() {
    const p = new Struct('iri', ['http://e/p']);
    const quads = Array.from({ length: 300000 }, (_, i) => [new Struct('iri', [`http://e/s${i}`]), p, BigInt(i), DEFAULT_GRAPH]);
    const lines = writeRdf(quads, { prefixes: { '': 'http://e/' } }).split('\n');
    assert.equal(lines.length, 300003);
    assert.equal(lines[300001], ':s299999 :p 299999 .');
  },

  'a document of rdf/4 terms for facts_from'() {
    const { quads } = parseRdf('<http://e/s> <http://e/p> "o" .', { format: 'n-triples' });
    assert.equal(rdfDocument(quads), "rdf(iri('http://e/s'), iri('http://e/p'), literal('o', datatype('http://www.w3.org/2001/XMLSchema#string')), 'default_graph')");
    assert.ok(quads[0][0] instanceof Struct);
  },
};
