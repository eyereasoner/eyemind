// SPARQL 1.2 RL compiled to eyemind: reading and analyzing rule sets, the
// compiler, expressions and aggregates, proofs, the SRL examples and
// the W3C SPARQL 1.2 RL test suite in .cache/w3c/sparql-rl.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkProof, loadText, run } from '../src/index.js';
import { statementSources } from '../src/lang.js';
import { write } from '../src/writer.js';
import { parseRdf, rdfFormat, writeRdf } from '../src/rdf.js';
import { SrlError, compileSrl, parseRuleSet, readRuleSet, reasonSrl, srlContextFromProof } from '../src/srl.js';
import { loadInputs, writeProof } from '../src/formats.js';
import { assert, command } from './helpers.js';
import { runSparqlRl } from './w3c.js';

export const tests = {};
const test = (name, fn) => {
  tests[name] = fn;
};
const toQuads = (data = []) => data.flatMap(([text, name]) => parseRdf(text, { format: rdfFormat(name) ?? 'turtle', scope: name }).quads);
// A run with its inference graph as Turtle.
const srl = (text, options = {}) => {
  const r = reasonSrl(text, { ...options, data: toQuads(options.data) });
  return { ...r, turtle: writeRdf(r.quads, { prefixes: r.prefixes }) };
};
const P = 'PREFIX : <http://example/>\nPREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n';
const reason = (text, options) => srl(P + text, options).turtle.replace(/^PREFIX[^\n]*\n\n?/gm, '');
const derived = (text, options) => reason(text, options).split('\n').filter(Boolean);
// The value a rule gives ?v, as Turtle.
const value = (expr, where = '') => {
  const lines = derived(`RULE { :r :v ?v } WHERE { ${where} SET(?v := ${expr}) }`);
  return lines.length ? lines[0].replace(/^:r :v (.*) \.$/, '$1') : null;
};
const checked = (text, options) => {
  const r = srl(P + text, { ...options, proof: true });
  const report = checkProof(loadText(r.program, 'compiled.js'), r.result.proof);
  assert.equal(report.valid, true);
  return r;
};

// Reading rule sets and data.
test('parser: collection nodes never capture explicit blank-node labels, even later ones', () => {
  const rs = parseRuleSet(`${P}DATA { :s :items (_:b1 _:b2) . _:b1 :p :first . _:b2 :p :second . }`);
  const head = rs.data.find((t) => t.p.value === 'http://example/items').o;
  assert.notEqual(head.value, 'b1');
  assert.notEqual(head.value, 'b2');
  const first = rs.data.filter((t) => t.p.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first');
  assert.equal(first.length, 2);
  assert.deepEqual(first.map((t) => t.o.value), ['b1', 'b2']);
  assert.ok(first.every((t) => !['b1', 'b2'].includes(t.s.value)));
});

test('parser: data blocks, rules and prefixes', () => {
  const rs = parseRuleSet(`${P}DATA { :a :b 1.50 } RULE { ?x :q ?y } WHERE { ?x :p ?y }`);
  assert.equal(rs.data.length, 1);
  assert.equal(rs.data[0].o.lexical, '1.50');
  assert.equal(rs.rules.length, 1);
  assert.equal(rs.prefixes[''], 'http://example/');
});
test('parser: large DATA blocks do not use the host function argument stack', () => {
  const rs = parseRuleSet(`${P}DATA { :s :p (${' :v'.repeat(70000)} ) }`);
  assert.equal(rs.data.length, 140001);
});
test('compiler: the native program states what running the compiled text states', () => {
  const show = (p) => p.sources.map((s) => `${s.kind} ${s.line} ${write(s.head)} :- ${s.body.map((g) => write(g)).join(', ')}`).join('\n');
  const data = toQuads([[`${P}:b :p 2, -0.0e0, 123456789012345678901234567890, "x"@en--rtl, <<( :a :p _:c )>> .`, 'data.ttl']]);
  for (const text of [
    `DATA { :a :p 1.5, 99999999999999999999 } RULE { ?x :ok "\\u2028\\"" } WHERE { ?x :p ?y FILTER(?y > 1) NOT { ?x :q _:z } }`,
    'RULE { ?x :q ?y . ?y :r <<( ?x :p 7 )>> } WHERE { ?x :p ?y }',
    'RULE { :a :b _:n } WHERE { ?s :t ?q }',
    'RULE { ?s ?p ?o } WHERE { ?o ?p ?s . ?p :x 1 } RULE { ?s ?q 1 } WHERE { ?s :t ?q } RULE { } WHERE { ?s :t ?q } RULE { :a :b :c } WHERE { }',
  ]) {
    const compiled = compileSrl(P + text, { data });
    assert.equal(show(compiled.nativeProgram), show(loadText(compiled.program, 'compiled.js')), text);
  }
  assert.equal(statementSources('fact(p(1))\nconst x = 1'), null);
  assert.equal(statementSources('// two\nfact(p(_, _))', 4)[0].line, 5);
});

test('parser: the grammar is SPARQL 1.2 RL', () => {
  assert.throws(() => parseRuleSet(`${P}RULE { ?x :q ?y } WHERE { ?x :p ?y BIND(1 AS ?z) }`), /BIND is not part of the SPARQL 1.2 RL grammar/);
  assert.throws(() => parseRuleSet(`${P}IF { ?x :p ?y } THEN { ?x :q ?y }`), /Expected PREFIX, BASE, VERSION, IMPORTS, DATA, or RULE/);
});
test('analysis: unbound variables and unstratified rule sets are rejected', () => {
  assert.throws(() => readRuleSet(`${P}RULE { ?x :q ?z } WHERE { ?x :p ?y }`), /unbound head variable \?z/);
  assert.throws(() => readRuleSet(`${P}RULE { ?s :p "a" } WHERE { ?s :d "" NOT { ?s :p "a" } }`), /Stratification condition violated/);
  assert.throws(() => readRuleSet(`${P}RULE { [] :q 1 } WHERE { ?s :q ?o }`), SrlError);
});
test('imports: a resolver supplies imported rule sets, each once', () => {
  const files = {
    'http://example/a.srl': `${P}IMPORTS <b.srl>\nDATA { :x :p 1 }`,
    'http://example/b.srl': `${P}IMPORTS <a.srl>\nRULE { ?s :q ?o } WHERE { ?s :p ?o }`,
  };
  const r = srl(files['http://example/a.srl'], { base: 'http://example/a.srl', resolve: (iri) => files[iri] ?? null });
  assert.match(r.turtle, /:x :q 1 \./);
  assert.throws(() => compileSrl(`${P}IMPORTS <b.srl>`, { base: 'http://example/a.srl' }), /no import resolver/);
});

// Compiling.
test('compiler: triples are rdf/3, the graphs base/3 and inf/3', () => {
  const { program } = compileSrl(`${P}DATA { :a :p 1 } RULE { ?x :q ?y } WHERE { ?x :p ?y }`, { data: toQuads([[`${P}:b :p 2 .`, 'data.ttl']]) });
  assert.match(program, /^facts_from\(\{ text: "rdf\(iri\('http:\/\/example\/b'\), iri\('http:\/\/example\/p'\), 2\)\\nbase\(/m);
  assert.match(program, /^fact\(rdf\(iri\("http:\/\/example\/a"\), iri\("http:\/\/example\/p"\), 1\), inf\(/m);
  assert.match(program, /^implies\(\[rdf\(X, iri\("http:\/\/example\/p"\), Y\)\], \[rdf\(X, iri\("http:\/\/example\/q"\), Y\), inf\(X, iri\("http:\/\/example\/q"\), Y\)\]\)$/m);
  assert.match(program, /^query\(inf\(S, P, O\)\)$/m);
});
test('compiler: NOT becomes not/1 of a helper over the bound variables', () => {
  const { program } = compileSrl(`${P}RULE { ?x :ok 1 } WHERE { ?x :p ?y NOT { ?x :q ?z } }`);
  assert.match(program, /^implied_by\(srl_not_1_1\((X\w*)\), rdf\(\1, iri\("http:\/\/example\/q"\), Z\)\)$/m);
  assert.match(program, /\[rdf\(X, iri\("http:\/\/example\/p"\), Y\), not\(srl_not_1_1\(X\)\)\]/);
});
test('compiler: only the functions a program uses are defined', () => {
  const { program } = compileSrl(`${P}RULE { :r :v ?v } WHERE { SET(?v := 1 + 2) }`);
  assert.match(program, /implied_by\(srl_add\(/);
  assert.doesNotMatch(program, /srl_concat/);
});
test('compiler: an unknown function is an error expression, with a warning', () => {
  const { warnings } = compileSrl(`${P}RULE { :r :v ?v } WHERE { SET(?v := :f(1)) }`);
  assert.match(warnings[0], /the function <http:\/\/example\/f> is not known/);
  assert.deepEqual(derived('RULE { :r :v ?v } WHERE { SET(?v := :f(1)) }'), []);
});
test('NOW is one timestamp throughout the rule set, with fresh contexts for executions', () => {
  const before = Date.now();
  const text = `${P}DATA { :a :p :x, :y } RULE { ?n :at ?a ; :again ?b } WHERE { :a :p ?n SET(?a := NOW()) SET(?b := NOW()) } RULE { :other :at ?t } WHERE { SET(?t := NOW()) }`;
  const r = srl(text, { proof: true });
  const times = r.quads.filter((q) => q[1].args[0] !== 'http://example/p').map((q) => q[2].args[0]);
  assert.equal(times.length, 5);
  assert.equal(new Set(times).size, 1);
  assert.ok(Date.parse(times[0]) >= before && Date.parse(times[0]) <= Date.now());
  assert.notEqual(compileSrl(text).context.seed, r.context.seed);
});
test('UUID and STRUUID have distinct values per solution, site, rule and execution', () => {
  const text = `${P}DATA { :a :p :x, :y } RULE { ?n :iri ?u ; :text ?s ; :other ?v } WHERE { :a :p ?n SET(?u := UUID()) SET(?s := STRUUID()) SET(?v := UUID()) } RULE { :r :iri ?u } WHERE { SET(?u := UUID()) }`;
  const r = srl(text, { proof: true });
  const ids = r.quads.filter((q) => q[1].args[0] !== 'http://example/p').map((q) => {
    assert.equal(q[2].name, q[1].args[0] === 'http://example/text' ? 'literal' : 'iri');
    return q[2].args[0].replace(/^urn:uuid:/, '');
  });
  assert.equal(ids.length, 7);
  assert.equal(new Set(ids).size, 7);
  assert.ok(ids.every((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)));
  assert.notEqual(srl(text).turtle, r.turtle);
  assert.equal(srl(text, { context: r.context }).turtle, r.turtle);
});
test('UUID functions in GROUP see only its keys and local solution variables', () => {
  const text = 'DATA { :a :p 1 . :b :q 2, 3 } RULE { :r :count ?n } WHERE { :a :p ?outer GROUP { :b :q ?v FILTER(UUID() != UUID()) } [ ?n := COUNT(*) ] }';
  assert.ok(derived(text).includes(':r :count 2 .'));
  const keyed = 'DATA { :a :p 1 . :b :q :x, :y } RULE { ?v :count ?n } WHERE { :a :p ?outer GROUP BY ?v { :b :q ?v FILTER(STRUUID() != STRUUID()) } [ ?n := COUNT(*) ] }';
  assert.equal(derived(keyed).filter((line) => line.includes(':count 1')).length, 2);
});
test('saved SRL execution proofs replay their context and reject forged computations', () => {
  const text = `${P}RULE { :r :time ?t ; :id ?u ; :sum ?n } WHERE { SET(?t := NOW()) SET(?u := UUID()) SET(?n := 0.1 + 0.2) }`;
  const loaded = loadInputs([[text, 'run.srl']]);
  const r = srl(text, { context: loaded.compiled.context, proof: true });
  const proof = writeProof(loaded, r.result);
  const replay = compileSrl(text, { context: srlContextFromProof(proof) });
  assert.ok(checkProof(loadText(replay.program), proof).valid);
  const forged = r.result.proof.replaceAll('0.3', '0.4');
  assert.ok(!checkProof(loadText(replay.program), forged).valid);
  const forgedId = r.result.proof.replaceAll(/urn:uuid:[0-9a-f-]+/g, 'urn:uuid:00000000-0000-4000-8000-000000000000');
  assert.ok(!checkProof(loadText(replay.program), forgedId).valid);
  const dir = mkdtempSync(join(tmpdir(), 'eyemind-srl-clock-'));
  const source = join(dir, 'run.srl');
  const saved = join(dir, 'proof.srl');
  writeFileSync(source, text);
  writeFileSync(saved, proof);
  const check = command(['--check-proof', saved, source]);
  assert.equal(check.code, 0, check.stderr);
  assert.match(check.stdout, /verdict\('checked_with_obligations'\)/);
  assert.throws(() => compileSrl(text, { context: { now: '2026-02-30T00:00:00.000Z', seed: '0'.repeat(64) } }), /execution context/);
});
test('compiler: wrong arities are errors', () => {
  assert.throws(() => compileSrl(`${P}RULE { :r :v ?v } WHERE { SET(?v := STRLEN("a", "b")) }`), /STRLEN takes 1 arguments, not 2/);
});

// Reasoning.
test('the result is the inference graph: DATA triples and conclusions', () => {
  const out = reason('DATA { :a :p 1 } RULE { ?x :q ?y } WHERE { ?x :p ?y }', { data: [[`${P}:b :p 2 .`, 'd.ttl']] });
  assert.deepEqual(out.split('\n').filter(Boolean).sort(), [':a :p 1 .', ':a :q 1 .', ':b :q 2 .']);
});
test('all: the base graph is written too', () => {
  const r = srl(`${P}RULE { ?x :q ?y } WHERE { ?x :p ?y }`, { data: [[`${P}:b :p 2 .`, 'd.ttl']], all: true });
  assert.match(r.turtle, /:b :p 2 \.\n:b :q 2 \./);
});
test('WHERE DATA and NOT DATA read only the base graph', () => {
  const data = [[`${P}:s :p :o .`, 'd.ttl']];
  assert.deepEqual(derived('DATA { :t :p :o } RULE { ?x :seen 1 } WHERE DATA { ?x :p :o }', { data }), [':t :p :o .', ':s :seen 1 .']);
  assert.deepEqual(derived('DATA { :t :p :o } RULE { ?x :new 1 } WHERE { ?x :p :o NOT DATA { ?x :p ?any } }', { data }), [':t :p :o .', ':t :new 1 .']);
});
test('recursion runs to a fixpoint', () => {
  assert.equal(derived('DATA { :a :e :b . :b :e :c . :c :e :a } RULE { ?x :r ?y } WHERE { ?x :e ?y } RULE { ?x :r ?z } WHERE { ?x :r ?y . ?y :e ?z }').length, 12);
});
test('stratified negation waits for what it inspects', () => {
  const out = derived('DATA { :a :d 1 } RULE { :x :q 1 } WHERE { NOT { ?a :level 1 } } RULE { :x :level 1 } WHERE { :a :d 1 }');
  assert.deepEqual(out, [':a :d 1 .', ':x :level 1 .']);
});
test('head blank nodes: one per solution and rule', () => {
  const out = derived('DATA { :s :p :o1 , :o2 } RULE { [] :q "r" } WHERE { ?s :p ?o } RULE { [] :q "r" } WHERE { ?s :p ?o }');
  assert.equal(new Set(out.filter((l) => l.includes(':q')).map((l) => l.split(' ')[0])).size, 4);
});
test('body blank nodes are variables', () => {
  assert.deepEqual(derived('DATA { :s :p :o } RULE { :x :q ?o } WHERE { [] :p ?o }'), [':s :p :o .', ':x :q :o .']);
});
test('property paths: sequences and inverses', () => {
  const out = derived('DATA { :a :p :b . :b :q :c } RULE { ?x :pq ?y . ?y :back ?x } WHERE { ?x :p/:q ?y } RULE { ?y :inv ?x } WHERE { ?y ^:p ?x }');
  assert.ok(out.includes(':a :pq :c .') && out.includes(':b :inv :a .'));
});
test('a head triple with a non-IRI predicate is not concluded', () => {
  // :a :r 1 is concluded and read again, so 1 is seen too.
  const out = derived('DATA { :a :p "x" . :a :q :r } RULE { :a ?y 1 . :a :seen ?y } WHERE { :a ?k ?y }');
  assert.deepEqual(out.sort(), [':a :p "x" .', ':a :q :r .', ':a :r 1 .', ':a :seen "x" .', ':a :seen 1 .', ':a :seen :r .']);
});
test('triple terms and reifiers in patterns and heads', () => {
  const out = derived('DATA { :a :b :c ~:r {| :w 9 |} } RULE { ?r :about <<( ?s :b ?o )>> } WHERE { ?r rdf:reifies <<( ?s :b ?o )>> ; :w 9 }');
  assert.ok(out.includes(':r :about <<( :a :b :c )>> .'));
});

// Expressions.
test('arithmetic keeps SPARQL numeric types', () => {
  assert.equal(value('1 + 2'), '3');
  assert.equal(value('7 / 2'), '3.5');
  assert.equal(value('2.5 * 2'), '5.0');
  assert.equal(value('1.5e0 + 1'), '"2.5"^^xsd:double');
  assert.equal(value('-(2.5)'), '-2.5');
  assert.equal(value('123456789012345678901234567890 + 1'), '123456789012345678901234567891');
  assert.equal(value('xsd:decimal(1.0e22)'), '10000000000000000000000.0');
});
test('decimals preserve exact values through arithmetic, comparisons, casts and rounding', () => {
  const cases = [
    ['0.1 + 0.2', '0.3'], ['0.3 - 0.1', '0.2'], ['0.1 * 0.2', '0.02'],
    ['9007199254740993.1 + 0.2', '9007199254740993.3'],
    ['9007199254740993.1 > 9007199254740993.0', 'true'],
    ['0.1 + 0.2 = 0.3', 'true'], ['1 / 8', '0.125'],
    ['1 / 3', '0.3333333333333333333333333333333333'],
    ['2 / 3', '0.6666666666666666666666666666666667'],
    ['xsd:decimal("9007199254740993.100")', '9007199254740993.1'],
    ['xsd:integer(9007199254740993.9)', '9007199254740993'],
    ['xsd:boolean(0.0000000000000000000000000000000001)', 'true'],
    ['ABS(-9007199254740993.1)', '9007199254740993.1'],
    ['FLOOR(-9007199254740993.1)', '-9007199254740994.0'],
    ['CEIL(9007199254740993.1)', '9007199254740994.0'],
    ['ROUND(9007199254740993.5)', '9007199254740994.0'],
    ['ROUND(-9007199254740993.5)', '-9007199254740993.0'],
    ['0.1e0 + 0.2', '"0.30000000000000004"^^xsd:double'],
    ['xsd:decimal("1e2")', null],
    ['" 0.1 "^^xsd:decimal + 0.2', '0.3'],
    ['" 001 "^^xsd:integer + 0.2', '1.2'],
    ['xsd:decimal(" 0.2 ")', '0.2'],
    [`1 / ${2n ** 100n}`, '0.0000000000000000000000000000007888609052210118054117285652827862296732064351090230047702789306640625'],
  ];
  for (const [expr, expected] of cases) assert.equal(value(expr), expected, expr);
  checked('RULE { :r :v ?v } WHERE { SET(?v := 9007199254740993.1 + 0.2) }');
});
test('decimal SUM, MIN and MAX compare exact values', () => {
  const out = reason('DATA { :a :n 0.1, 0.2, 9007199254740993.1, 9007199254740993.2 } RULE { :r :sum ?s ; :min ?lo ; :max ?hi } WHERE { GROUP { :a :n ?v } [ ?s := SUM(?v), ?lo := MIN(?v), ?hi := MAX(?v) ] }');
  assert.match(out, /:r :sum 18014398509481986.6/);
  assert.match(out, /:r :min 0.1/);
  assert.match(out, /:r :max 9007199254740993.2/);
});
test('errors drop a solution: decimal division by zero, wrong types', () => {
  assert.equal(value('1 / 0'), null);
  assert.equal(value('"a" + 1'), null);
  assert.equal(value('1.0 / 0.0'), null);
  assert.deepEqual(derived('DATA { :a :n 0 , 2 } RULE { :r :ok ?n } WHERE { :a :n ?n FILTER(1 / ?n) }'), [':a :n 0 .', ':a :n 2 .', ':r :ok 2 .']);
});
test('binary64 doubles preserve infinities, NaN, signed zero and rounding', () => {
  const cases = [
    ['1.0e300 * 1.0e300', '"INF"^^xsd:double'],
    ['1.0e300 / 1.0e-300', '"INF"^^xsd:double'],
    ['1e0 / 0e0', '"INF"^^xsd:double'],
    ['-1e0 / 0e0', '"-INF"^^xsd:double'],
    ['0e0 / 0e0', '"NaN"^^xsd:double'],
    ['1e0 / -0e0', '"-INF"^^xsd:double'],
    ['xsd:double("1e400")', '"INF"^^xsd:double'],
    ['xsd:double("NaN") = xsd:double("NaN")', 'false'],
    ['xsd:double("NaN") != 1', 'true'],
    ['xsd:double("NaN") <= 1', 'false'],
    ['xsd:boolean(xsd:double("NaN"))', 'false'],
    ['xsd:boolean(xsd:double("INF"))', 'true'],
    ['xsd:integer(xsd:double("INF"))', null],
    ['xsd:decimal(xsd:double("INF"))', null],
    ['1.7976931348623157e308 + 0e0', '1.7976931348623157e+308'],
  ];
  for (const [expr, expected] of cases) assert.equal(value(expr), expected, expr);
  const r = checked('RULE { :r :v ?v } WHERE { SET(?v := 1e0 / 0e0) }');
  assert.ok(!checkProof(loadText(r.program), r.result.proof.replaceAll("'INF'", "'-INF'")).valid);
});
test('float64 primitive results are independently re-decided by C5', () => {
  const program = loadText("query(float64('div', float(1), float(0), R))");
  const result = run(program, { proof: true });
  assert.ok(checkProof(program, result.proof, { allowTrusted: false }).valid);
  const forged = result.proof.replaceAll("'INF'", "'-INF'");
  assert.ok(checkProof(program, forged).failures.some((f) => f.condition === 'C5'));
});
test('comparison: numbers by value, strings by code point', () => {
  assert.equal(value('1 = 1.0'), 'true');
  assert.equal(value('sameTerm(1, 1.0)'), 'false');
  assert.equal(value('"a" < "b"'), 'true');
  assert.equal(value('"a" = "b"'), 'false');
  assert.equal(value(':x = :y'), 'false');
  assert.equal(value('"2026-01-02"^^xsd:date > "2025-12-31"^^xsd:date'), 'true');
  assert.equal(value('"a" < 1'), null);
});
test('logic: && and || absorb an error when the other side decides', () => {
  assert.equal(value('(1/0 = 1) || true'), 'true');
  assert.equal(value('false && (1/0 = 1)'), 'false');
  assert.equal(value('(1/0 = 1) || false'), null);
  assert.equal(value('!true'), 'false');
});
test('IN, NOT IN and IF', () => {
  assert.equal(value('7 IN (1, 7.0)'), 'true');
  assert.equal(value('7 NOT IN (1, 2)'), 'true');
  assert.equal(value('IF(1 < 2, "yes", 1/0)'), '"yes"');
  assert.equal(value('IF(1/0, "yes", "no")'), null);
});
test('string functions keep language tags', () => {
  assert.equal(value('UCASE("chat"@fr)'), '"CHAT"@fr');
  assert.equal(value('STRLEN("Ἀριστοτέλης")'), '11');
  assert.equal(value('SUBSTR("Hello World", 7)'), '"World"');
  assert.equal(value('SUBSTR("Hello", 2, 3)'), '"ell"');
  assert.equal(value('STRBEFORE("a-b-c", "-")'), '"a"');
  assert.equal(value('STRAFTER("a-b-c", "-")'), '"b-c"');
  assert.equal(value('STRAFTER("abc", "x")'), '""');
  assert.equal(value('CONTAINS("Hello", "ell")'), 'true');
  assert.equal(value('STRSTARTS("Hello", "He")'), 'true');
  assert.equal(value('STRENDS("Hello", "lo")'), 'true');
  assert.equal(value('CONCAT("a"@en, "b"@en)'), '"ab"@en');
  assert.equal(value('CONCAT("a"@en, "b")'), '"ab"');
  assert.equal(value('REPLACE("banana", "a", "o")'), '"bonono"');
  assert.equal(value('REGEX("Hello", "^hello", "i")'), 'true');
  assert.equal(value('ENCODE_FOR_URI("Los Angeles é")'), '"Los%20Angeles%20%C3%A9"');
  assert.equal(value('LANGMATCHES(LANG("x"@en-GB), "en")'), 'true');
});
test('term functions', () => {
  assert.equal(value('STR(:a)'), '"http://example/a"');
  assert.equal(value('DATATYPE(2.5)'), 'xsd:decimal');
  assert.equal(value('IRI("http://example/z")'), ':z');
  assert.equal(value('STRDT("7", xsd:integer)'), '7');
  assert.equal(value('STRLANG("hi", "EN")'), '"hi"@en');
  assert.equal(value('isIRI(:a)'), 'true');
  assert.equal(value('isNUMERIC("1")'), 'false');
  assert.equal(value('SUBJECT(TRIPLE(:a, :b, 3))'), ':a');
  assert.match(value('BNODE()'), /^_:b\d+$/);
});
test('numeric functions and casts', () => {
  assert.equal(value('ROUND(-2.5)'), '-2.0');
  assert.equal(value('CEIL(2.1)'), '3.0');
  assert.equal(value('ABS(-3)'), '3');
  assert.equal(value('xsd:integer(16.0934)'), '16');
  assert.equal(value('xsd:integer("42")'), '42');
  assert.equal(value('xsd:integer("4.2")'), null);
  assert.equal(value('xsd:boolean(0)'), 'false');
  assert.equal(value('xsd:string(12)'), '"12"');
});
test('date and time functions', () => {
  const t = '"2026-11-10T13:45:30.5-05:30"^^xsd:dateTime';
  assert.equal(value(`YEAR(${t})`), '2026');
  assert.equal(value(`HOURS(${t})`), '13');
  assert.equal(value(`SECONDS(${t})`), '30.5');
  assert.equal(value(`TZ(${t})`), '"-05:30"');
  assert.equal(value(`TIMEZONE(${t})`), '"-PT5H30M"^^xsd:dayTimeDuration');
});

// Aggregates.
test('GROUP BY: a group per key, with COUNT, DISTINCT, SUM, MIN and MAX', () => {
  const out = derived(`DATA { :p1 :q 3 , 4.5 . :p2 :q 2 . :p1 :t "b", "a" }
RULE { ?p :n ?n ; :sum ?s ; :min ?mi ; :max ?ma } WHERE { GROUP BY ?p { ?p :q ?x } [ ?n := COUNT(*), ?s := SUM(?x), ?mi := MIN(?x), ?ma := MAX(?x) ] }
RULE { ?p :tags ?n ; :first ?f } WHERE { GROUP BY ?p { ?p :t ?t } [ ?n := COUNT(DISTINCT ?t), ?f := MIN(?t) ] }`);
  for (const line of [':p1 :n 2 .', ':p1 :sum 7.5 .', ':p1 :min 3 .', ':p1 :max 4.5 .', ':p2 :sum 2 .', ':p1 :tags 2 .', ':p1 :first "a" .']) {
    assert.ok(out.includes(line), line);
  }
});
test('GROUP: without BY one group even when empty; with BY none', () => {
  assert.ok(derived('RULE { :r :n ?n ; :s ?s } WHERE { GROUP { ?x :none ?y } [ ?n := COUNT(*), ?s := SUM(?y) ] }').includes(':r :n 0 .'));
  assert.deepEqual(derived('RULE { :r :n ?n } WHERE { GROUP BY ?x { ?x :none ?y } [ ?n := COUNT(*) ] }'), []);
  assert.deepEqual(derived('RULE { :r :m ?m } WHERE { GROUP { ?x :none ?y } [ ?m := MIN(?y) ] }'), []);
});
test('GROUP: only keys correlate the group with the solution', () => {
  const out = derived('DATA { :a :c 1 . :b :c 1 . :a :e :v1 , :v2 } RULE { ?c :all ?n } WHERE { ?c :c 1 GROUP { ?c :e ?v } [ ?n := COUNT(?v) ] }');
  assert.ok(out.includes(':a :all 2 .') && out.includes(':b :all 2 .'));
});

// Proofs.
test('proofs: the compiled program proves its conclusions, checked', () => {
  checked('DATA { :a :p :b . :b :p :c } RULE { ?x :anc ?y } WHERE { ?x :p ?y } RULE { ?x :anc ?z } WHERE { ?x :p ?y . ?y :anc ?z }');
  checked('DATA { :s :p :o } RULE { [] :q ?o } WHERE { ?s :p ?o }');
  checked('DATA { :a :n 2 } RULE { :a :m ?m } WHERE { :a :n ?n NOT { :a :skip 1 } SET(?m := ?n * 2) FILTER(?m > 1) }');
});
test('proofs: a forged conclusion is not checked', () => {
  const r = srl(`${P}DATA { :a :p :b } RULE { ?x :q ?y } WHERE { ?x :p ?y }`, { proof: true });
  const forged = r.result.proof.replaceAll("iri('http://example/b')", "iri('http://example/z')");
  assert.notEqual(forged, r.result.proof);
  assert.equal(checkProof(loadText(r.program, 'compiled.js'), forged).valid, false);
});

test('the eyemind options act on the compiled rule set', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'eyemind-srl-'));
  const proof = join(tmp, 'proof.srl');
  writeFileSync(proof, command(['--proof', 'examples/family-srl.srl']).stdout);
  const check = command(['--check-proof', proof, 'examples/family-srl.srl']);
  assert.equal(check.code, 0);
  assert.match(check.stdout, /verdict\('checked'\)/);
  assert.match(command(['--program', 'examples/distances-srl.srl', 'examples/data/distances-srl.ttl']).stdout, /^\/\/ Generated by eyemind from examples\/distances-srl.srl/);
  assert.match(command(['--all', 'examples/distances-srl.srl', 'examples/data/distances-srl.ttl']).stdout, /:ghent-bruges :distanceMiles 30 \./);
  assert.match(command(['--to', 'n-triples', 'examples/socrates-srl.srl']).stdout, /^<http:\/\/example.org\/socrates#Socrates> <http:\/\/www.w3.org\/1999\/02\/22-rdf-syntax-ns#type>/m);
  const bad = command(['examples/family-srl.srl', 'examples/socrates-n3.n3']);
  assert.equal(bad.code, 1);
  assert.match(bad.stderr, /a SPARQL 1.2 RL run takes one .srl rule set/);
});

// The W3C SPARQL 1.2 RL test suite, one test per section.
for (const [section, run] of Object.entries(runSparqlRl())) tests[`W3C SPARQL 1.2 RL ${section}`] = run;
