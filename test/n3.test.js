// Notation3 compiled to eyemind: the parser, the compiler and its built-ins,
// the writer, and the documents and examples of test/n3.
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkProof, loadText } from '../src/index.js';
import { compileN3, reasonN3 } from '../src/n3.js';
import { parseN3 } from '../src/n3-parser.js';
import { eyemindToN3 } from '../src/n3-writer.js';
import { ROOT, assert, command } from './helpers.js';

export const tests = {};
const test = (name, fn) => {
  tests[name] = fn;
};
const reason = (text, options) => reasonN3(text, options).n3;
const checkedReason = (text) => {
  const r = reasonN3(text, { proof: true });
  assert.equal(checkProof(loadText(r.program, 'compiled.js'), r.result.proof).valid, true);
  return r.n3;
};
const P = '@prefix : <http://example.org/#>.\n';

// Parsing.
test('parser: prefixes, a, literals, numbers and lists', () => {
  const { triples } = parseN3(`${P}:s a :C; :p "x"@en, "1"^^<http://www.w3.org/2001/XMLSchema#integer>, 2.5, (1 :o), true.`);
  assert.equal(triples.length, 6);
  assert.equal(triples[0].p.v, 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  assert.deepEqual(triples[1].o, { t: 'literal', v: 'x', lang: 'en', dir: null, dt: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString' });
  assert.deepEqual(triples[2].o, { t: 'int', v: 1n });
  assert.deepEqual(triples[3].o, { t: 'float', v: 2.5 });
  assert.equal(triples[4].o.t, 'list');
  assert.equal(triples[5].o.dt, 'http://www.w3.org/2001/XMLSchema#boolean');
});
test('parser: integers beyond 2^53 stay exact', () => {
  const { triples } = parseN3(`${P}:s :p 123456789012345678901234567890.`);
  assert.equal(triples[0].o.v, 123456789012345678901234567890n);
});
test('parser: paths, inverse verbs and blank-node property lists', () => {
  const { triples } = parseN3(`${P}:a!:p :q :b. :c is :r of :d. [ :x 1 ] :y 2.`);
  assert.equal(triples.length, 5);
  assert.equal(triples[2].s.v, 'http://example.org/#d');
});
test('parser: syntax errors name their line', () => {
  assert.throws(() => parseN3(`${P}\n:s :p .`), /line 3/);
  assert.throws(() => parseN3('nope:s :p :o.'), /undeclared prefix 'nope:'/);
});

// Compiling.
test('compiler: IRIs are iri(Text) and rules are eyemind rules', () => {
  const { program } = compileN3(`${P}:a :p :b. { ?x :p ?y } => { ?y :q ?x }.`);
  assert.match(program, /^fact\(rdf\(iri\("http:\/\/example.org\/#a"\), iri\("http:\/\/example.org\/#p"\), iri\("http:\/\/example.org\/#b"\)\)\)$/m);
  assert.match(program, /^implies\(rdf\(X, iri\("http:\/\/example.org\/#p"\), Y\), rdf\(Y, iri\("http:\/\/example.org\/#q"\), X\)\)$/m);
});
test('compiler: an unsupported built-in is an error that says why', () => {
  assert.throws(() => compileN3(`${P}{ "" time:localTime ?t } => { :t :is ?t }.`), /time:localTime is not supported: eyemind has no clock/);
});
test('compiler: a constant pattern drops escapes Unicode mode forbids', () => {
  const { program } = compileN3(`${P}{ ?s :p ?t. ?t string:matches "a\\\\:b\\\\.c" } => { ?s :ok true }.`);
  assert.match(program, /n3_string_matches\([^,]+, literal\("a:b\\\\.c"/);
  const braces = compileN3(`${P}{ ?s :p ?t. ?t string:matches "{{x}}\\\\p{L}{2}" } => { ?s :ok true }.`).program;
  assert.match(braces, /literal\("\\\\{\\\\{x\\\\}\\\\}\\\\p\{L\}\{2\}"/);
});
test('compiler: only the built-ins a program uses are defined', () => {
  const { program } = compileN3(`${P}{ (1 2) math:sum ?s } => { :t :is ?s }.`);
  assert.match(program, /n3_math_sum/);
  assert.doesNotMatch(program, /n3_string_format/);
});

// Reasoning.
test('forward rules report only what they derive', () => {
  assert.equal(reason(`${P}:a :p :b. { ?x :p ?y } => { ?x :q ?y. ?x :p ?y }.`), '@prefix : <http://example.org/#> .\n\n:a :q :b .\n');
});
test('--all mode reports the given triples too', () => {
  assert.match(reason(`${P}:a :p :b. { ?x :p ?y } => { ?x :q ?y }.`, { mode: 'all' }), /:a :p :b \.\n:a :q :b \./);
});
test('backward rules answer forward premises', () => {
  const out = reason(`${P}:a :n 3. { ?x :double ?y } <= { ?x :n ?n. (?n 2) math:product ?y }. { :a :double ?d } => { :a :twice ?d }.`);
  assert.match(out, /:a :twice 6 \./);
});
test('log:query selects the output', () => {
  const out = reason(`${P}:a :p :b. { ?x :p ?y } => { ?x :q ?y }. { ?x :q ?y } log:query { ?y :back ?x }.`);
  assert.equal(out, '@prefix : <http://example.org/#> .\n\n:b :back :a .\n');
});
test('a conclusion blank node is one node per firing', () => {
  const out = reason(`${P}:a a :P. :b a :P. { ?x a :P } => { ?x :m _:m }.`);
  assert.match(out, /:a :m _:b0 \.\n:b :m _:b1 \./);
});
test('scoped negation and collection', () => {
  const out = reason(`${P}:a :v 1. :b :v 2. :b :bad true.
    { ?x :v ?n. ?S log:notIncludes { ?x :bad true } } => { ?x :ok true }.
    { (?n { ?x :v ?n } ?all) log:collectAllIn ?S } => { :all :are ?all }.`);
  assert.match(out, /:a :ok true \./);
  assert.doesNotMatch(out, /:b :ok/);
  assert.match(out, /:all :are \(1 2\) \./);
});
test('log:forAllIn', () => {
  const out = reason(`${P}:a :p 1. :b :p 2. :a :q 1. :b :q 2.
    { ({ ?x :p ?n } { ?x :q ?n }) log:forAllIn ?S } => { :check :is :done }.`);
  assert.match(out, /:check :is :done \./);
});
test('negating a pattern a rule may conclude is unstratified', () => {
  assert.throws(() => reasonN3(`${P}:a :p 1. { ?x :p 1. ?S log:notIncludes { ?x :q 1 } } => { ?x :q 1 }.`), /unstratified/);
});
test('built-ins wait for the triples that bind their inputs', () => {
  const out = reason(`${P}:a :n 1. :b :n 2. { ?x log:notEqualTo ?y. ?x :n ?i. ?y :n ?j } => { ?x :differs ?y }.`);
  assert.match(out, /:a :differs :b \./);
});
test('math, string and list built-ins', () => {
  const out = reason(`${P}{ (7 2) math:quotient ?q. (6 3) math:quotient ?r. (7 2) math:remainder ?m. (-7 2) math:integerQuotient ?i.
      ("ab" "cd") string:concatenation ?c. ("%s=%.2f" "x" 3.14159) string:format ?f. "Hello" string:length ?l.
      (3 1 2 1) list:sort ?s. (1 2 3) list:last ?z. ((1) (2 3)) list:append ?ap }
    => { :r :is (?q ?r ?m ?i ?c ?f ?l ?s ?z ?ap) }.`);
  assert.match(out, /:r :is \(3\.5 2 1 -3 "abcd" "x=3\.14" 5 \(1 2 3\) 3 \(1 2 3\)\) \./);
});
test('regular-expression built-ins', () => {
  const out = reason(`${P}{ "a:b" string:matches "a\\\\:b". "abc" string:notMatches "^b".
      ("2026-11" "([0-9]+)-([0-9]+)" "$2/$1") string:replace ?r. ("id=42;" "id=([0-9]+)") string:scrape ?g }
    => { :r :is (?r ?g) }.`);
  assert.match(out, /:r :is \("11\/2026" "42"\) \./);
});
test('digests, skolem IRIs, Unicode case and formula conjunction', () => {
  const out = reason(`${P}{ "abc" crypto:sha256 ?h. "abc" crypto:md5 ?m.
      (:a 1) log:skolem ?k1. (:a 1) log:skolem ?k2. (:a 2) log:skolem ?k3.
      "Élan" string:equalIgnoringCase "éLAN". "straße" string:upperCase ?u.
      ({ :a :b :c } { :d :e :f. :a :b :c }) log:conjunction ?f.
      ?f log:equalTo { :d :e :f. :a :b :c }.
      "<http://e/s> <http://e/p> 1." log:parsedAsN3 { <http://e/s> <http://e/p> 1 } }
    => { :r :is (?h ?m ?u); :same ?k1, ?k2; :other ?k3 }.`);
  assert.match(out, /"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" "900150983cd24fb0d6963f7d28e17f72" "STRASSE"/);
  const same = [...out.matchAll(/:same (<[^>]+>)/g)].map((m) => m[1]);
  const other = /:other (<[^>]+>)/.exec(out)[1];
  assert.equal(same.length, 1);
  assert.match(same[0], /^<https:\/\/eyereasoner.github.io\/.well-known\/genid\/[0-9a-f]{64}>$/);
  assert.notEqual(same[0], other);
});
test('documents a program names are read before compiling', () => {
  const dir = mkdtempSync(join(tmpdir(), 'eyemind-n3-'));
  writeFileSync(join(dir, 'hello.n3'), '@prefix : <http://example.org/#>.\n:Hello a :World.\n');
  writeFileSync(join(dir, 'broken.n3'), ':Hello a\n');
  const url = (name) => pathToFileURL(join(dir, name)).href;
  const text = `${P}{ <${url('hello.n3')}> log:semantics ?f. ?f log:includes { :Hello a ?c }.
      <${url('hello.n3')}> log:content ?t. <${url('broken.n3')}> log:semanticsOrError ?e.
      <${url('missing.n3')}> log:semanticsOrError ?m }
    => { :r :is (?c ?t ?e ?m) }.`;
  const readFile = (path) => readFileSync(path, 'utf8');
  const out = reasonN3(text, { readFile }).n3;
  assert.match(out, /:r :is \(:World """@prefix : <http:\/\/example.org\/#>.\n:Hello a :World.\n""" /);
  assert.match(out, /"error\(parse_error,N3 syntax, line \d+: [^"]*\)" "error\(dereference_failed,file:[^"]*missing.n3\)"\) \./);
  // Without a file system, the built-ins have nothing to read.
  assert.equal(reasonN3(text).n3, '');
});
test('comparisons with infinity, formula equality up to renaming, and rdf:nil as a list', () => {
  const out = reason(`${P}:t :v rdf:nil.
    { "INF"^^xsd:float math:greaterThan 42. 42 math:greaterThan "-INF"^^xsd:double.
      { _:x :b :c. :d :e :f } log:equalTo { :d :e :f. _:y :b :c }.
      :t :v ?l. ?l list:length 0 } => { :r :is :ok }.
    { { :a :b :c. :d :e :f } log:notEqualTo { :d :e :f. :a :b :c } } => { :r :is :wrong }.
    { ?x math:greaterThan "INF"^^xsd:float } => { :r :is :unbound }.`);
  assert.match(out, /:r :is :ok \./);
  assert.doesNotMatch(out, /:wrong|:unbound/);
});
test('a built-in waits for a later built-in that binds its input', () => {
  const out = reason(`${P}{ (?x 1) math:sum ?y. ?x math:greaterThan 3. ?x math:cos ?c. (2 4) list:iterate (?i ?x) } => { :r :is (?x ?y) }.
    { ?z math:greaterThan -0.5. ?z math:cos ?w. ?z math:lessThan 0.5. (1) list:iterate (?j ?w) } => { :s :is ?z }.`);
  assert.match(out, /:r :is \(4 5\) \./);
  assert.match(out, /:s :is 0\.0 \./);
});
test('a built-in with nothing to compute holds, and its variables stay universal', () => {
  const out = reason(`${P}{ ?x math:sin ?y } => { { ?x math:sin 0.0 } => { :r :is ?x } }.`);
  assert.match(out, /\{ \?x <http:\/\/www.w3.org\/2000\/10\/swap\/math#sin> 0\.0 \} => \{ :r :is \?x \} \./);
  assert.match(out, /:r :is 0\.0 \./);
});
test('string:charAt and string:setCharAt count from 0', () => {
  const out = reason(`${P}{ ("abc" 1) string:charAt ?c. ("abc" 5) string:charAt ?d. ("abc" 1 "X") string:setCharAt ?s.
      ("abc" 9 "X") string:setCharAt ?t } => { :r :is (?c ?d ?s ?t) }.`);
  assert.match(out, /:r :is \("b" "" "aXc" "abc"\) \./);
});
test('numbers keep their kind: integers stay exact', () => {
  const out = reason(`${P}{ (9007199254740993 1) math:sum ?s. (2 0.5) math:product ?p } => { :r :is (?s ?p) }.`);
  assert.match(out, /:r :is \(9007199254740994 1\.0\) \./);
});
test('list:append compares bound numeric elements by value and preserves generated terms', () => {
  const out = checkedReason(`${P}{ ((6.0) (42e0)) list:append (6 42e0).
      ((6.0) (42e0)) list:append ?values } => { :r :is ?values }.`);
  assert.match(out, /:r :is \(6\.0 42\.0\) \./);
  assert.equal(reason(`${P}{ ((6.0) (42e0)) list:append (6 43) } => { :r :is :wrong }.`), '');
  assert.equal(reason(`${P}{ (("6") (42)) list:append (6 42) } => { :r :is :wrong }.`), '');
});
test('list:append reads numeric results and inputs written as RDF lists', () => {
  const out = checkedReason(`${P}:out :list [ rdf:first 6; rdf:rest [ rdf:first 42e0; rdf:rest rdf:nil ] ].
    :in :list [ rdf:first (6.0); rdf:rest [ rdf:first (42e0); rdf:rest rdf:nil ] ].
    { :out :list ?out. :in :list ?in. ?in list:append ?out } => { :r :is :ok }.`);
  assert.match(out, /:r :is :ok \./);
});
test('list:append still enumerates every split of a supplied result', () => {
  const out = checkedReason(`${P}{ (?left ?right) list:append (1 2) } => { :r :is (?left ?right) }.`);
  assert.match(out, /:r :is \(\(\) \(1 2\)\) \./);
  assert.match(out, /:r :is \(\(1\) \(2\)\) \./);
  assert.match(out, /:r :is \(\(1 2\) \(\)\) \./);
});
test('list:length requires an integer result, including for an empty list', () => {
  const out = checkedReason(`${P}{ () list:length 0. (42 1) list:length "2"^^xsd:integer.
      (42 1) list:length "2"^^xsd:int } => { :r :is :ok }.
    { (42 1) list:length "2"^^xsd:decimal } => { :r :is :wrong }.
    { () list:length 0.0 } => { :r :is :wrong }.`);
  assert.match(out, /:r :is :ok \./);
  assert.doesNotMatch(out, /:wrong/);
});
test('log:dtlit extracts and checks the datatype of language strings', () => {
  const out = checkedReason(`${P}{ ("pain" rdf:langString) log:dtlit "pain"@en.
      (?text ?type) log:dtlit "pain"@fr.
      (?direction ?dirType) log:dtlit "text"@ar--rtl } => { :r :is (?text ?type); :direction (?direction ?dirType) }.
    { ("pain" xsd:string) log:dtlit "pain"@en } => { :r :is :wrong }.
    { ("bread" rdf:langString) log:dtlit "pain"@en } => { :r :is :wrong }.`);
  assert.match(out, /:r :is \("pain" <http:\/\/www.w3.org\/1999\/02\/22-rdf-syntax-ns#langString>\) \./);
  assert.match(out, /:r :direction \("text" <http:\/\/www.w3.org\/1999\/02\/22-rdf-syntax-ns#dirLangString>\) \./);
  assert.doesNotMatch(out, /:wrong/);
});
test('log:uri rejects characters forbidden in IRIs before writing an answer', () => {
  for (const text of ['p>. <a> <b> <c> <d> <e> <', 'a b', 'a\\b', 'a\n', 'a"b', 'a{b', 'a|b', 'a^b', 'a`b']) {
    assert.equal(reason(`${P}{ ?uri log:uri ${JSON.stringify(text)} } => { :r :is ?uri }.`), '', text);
  }
  assert.match(checkedReason(`${P}{ ?uri log:uri "https://example.org/caf\u00e9?x=1#p" } => { :r :is ?uri }.`),
    /:r :is <https:\/\/example.org\/caf\u00e9\?x=1#p> \./);
});
test('string:replace decodes escapes from both a bound list and a written replacement', () => {
  const replacement = JSON.stringify('\\$\\\\');
  const out = checkedReason(`${P}:input :value ("abcd" "b" ${replacement}).
    { :input :value ?args. ?args string:replace ?result } => { :r :bound ?result }.
    { ("abcd" "b" ${replacement}) string:replace ?result } => { :r :written ?result }.
    { ("id=42" "([0-9]+)" "[$1]") string:replace ?result } => { :r :capture ?result }.`);
  assert.match(out, /:r :bound "a\$\\\\cd" \./);
  assert.match(out, /:r :written "a\$\\\\cd" \./);
  assert.match(out, /:r :capture "id=\[42\]" \./);
});
test('log:implies and log:impliedBy match source rules without solving their premises', () => {
  const out = checkedReason(`${P}{ :missing :p :v } => { :a :q :b }.
    { :a :r :b } <= { :a :q :b }.
    { ?body log:implies { :a :q :b } } => { :r :forward ?body }.
    { { :a :r :b } log:impliedBy ?body } => { :r :backward ?body }.
    { ?body log:implies { :a :absent :b } } => { :r :is :wrong }.`);
  assert.match(out, /:r :forward \{ :missing :p :v \} \./);
  assert.match(out, /:r :backward \{ :a :q :b \} \./);
  assert.doesNotMatch(out, /:wrong|\n:a :q :b/);
});
test('a rule can match itself and rules generated during reasoning', () => {
  const out = checkedReason(`${P}:on :is true.
    { ?body log:implies ?head } => { :r :source true }.
    { :on :is true } => { { :a :q :b } => { :a :generated :b } }.
    { ?body log:implies { :a :generated :b } } => { :r :generated ?body }.`);
  assert.match(out, /:r :source true \./);
  assert.match(out, /:r :generated \{ :a :q :b \} \./);
});
test('queries and backward premises can match source rules', () => {
  const rule = '{ :missing :p :v } => { :a :q :b }.';
  const query = checkedReason(`${P}${rule}
    { ?body log:implies { :a :q :b } } log:query { :r :found ?body }.`);
  assert.match(query, /:r :found \{ :missing :p :v \} \./);
  const backward = checkedReason(`${P}${rule}
    { :r :matched ?body } <= { ?body log:implies { :a :q :b } }.
    { :r :matched ?body } log:query { :r :found ?body }.`);
  assert.match(backward, /:r :found \{ :missing :p :v \} \./);
});
test('rule patterns preserve variables shared between premise and conclusion', () => {
  const out = checkedReason(`${P}{ ?x :p ?y } => { ?y :q ?x }.
    { { ?a :p ?b } log:implies { ?b :q ?a } } => { :r :is :ok }.
    { { ?a :p ?b } log:implies { ?a :q ?b } } => { :r :is :wrong }.`);
  assert.match(out, /:r :is :ok \./);
  assert.doesNotMatch(out, /:wrong/);
});
test('a general triple query does not expose source rule descriptions', () => {
  const out = checkedReason(`${P}:a :p :b. { :a :p :b } => { :a :q :b }.
    { ?s ?p ?o } log:query { ?s ?p ?o }.`);
  assert.equal(out, '@prefix : <http://example.org/#> .\n\n:a :q :b .\n:a :p :b .\n');
});
test('a forged matched rule is rejected against the compiled source', () => {
  const r = reasonN3(`${P}{ :missing :p :v } => { :a :q :b }.
    { ?body log:implies { :a :q :b } } => { :r :found ?body }.`, { proof: true });
  const forged = r.result.proof.replaceAll('http://example.org/#missing', 'http://example.org/#invented');
  assert.notEqual(forged, r.result.proof);
  assert.equal(checkProof(loadText(r.program, 'compiled.js'), forged).valid, false);
});
test('a derived rule is applied and reported', () => {
  const out = reason(`${P}:on :is true. :a a :M. { :on :is true } => { { ?x a :M } => { ?x :ok true } }.`);
  assert.match(out, /\{ \?x a :M \} => \{ \?x :ok true \} \./);
  assert.match(out, /:a :ok true \./);
});
test('log:outputString writes strings in subject order', () => {
  assert.equal(reason(`${P}:b log:outputString "2\\n". { } => { :a log:outputString "1\\n" }.`), '1\n2\n');
});
test('an inference fuse reports a contradiction', () => {
  assert.equal(reasonN3(`${P}:a :p :b. { :a :p :b } => false.`).contradiction, true);
});
test('every compiled run has a checking proof', () => {
  const r = reasonN3(`${P}:a :p 2. { ?x :p ?n. (?n 3) math:sum ?m. ?m math:negation ?k. ?j math:negation ?k.
    ("%s" ?m) string:format ?s. ?S log:notIncludes { ?x :q ?m } } => { ?x :r (?m ?s ?j) }.`, { proof: true });
  assert.match(r.n3, /:a :r \(5 "5" 5\) \./);
  const report = checkProof(loadText(r.program, 'compiled.js'), r.result.proof);
  assert.equal(report.valid, true);
});

// The examples of test/n3 through the eyemind command, against their
// saved outputs.
const dir = join(ROOT, 'test/n3');
for (const file of readdirSync(dir).filter((f) => f.endsWith('.n3')).sort()) {
  const name = basename(file, '.n3');
  test(`example ${name}`, () => {
    const outputs = readdirSync(join(dir, 'output')).filter((f) => f.startsWith(`${name}.`));
    assert.equal(outputs.length, 1, `test/n3/output needs one saved output for ${name}`);
    const r = command([`test/n3/${file}`]);
    assert.equal(r.stdout, readFileSync(join(dir, 'output', outputs[0]), 'utf8'));
    assert.equal(r.code, name === 'fuse' ? 65 : 0, r.stderr);
  });
}

test('the eyemind options act on the compiled N3 program', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'eyemind-n3-'));
  const socrates = 'test/n3/socrates.n3';
  const proof = command(['--proof', socrates]);
  assert.equal(proof.code, 0, proof.stderr);
  assert.match(proof.stdout, /^step\(rdf\(iri\('http:\/\/example.org\/socrates#Socrates'\)/m);
  writeFileSync(join(tmp, 'proof.js'), proof.stdout);
  const checked = command(['--check-proof', join(tmp, 'proof.js'), socrates]);
  assert.equal(checked.code, 0, checked.stderr);
  assert.match(checked.stdout, /^verdict\('checked'\)$/m);
  writeFileSync(join(tmp, 'forged.js'), proof.stdout.replace(/clause\(1\), \{/, 'clause(2), {'));
  assert.equal(command(['--check-proof', join(tmp, 'forged.js'), socrates]).code, 2);
  assert.equal(JSON.parse(command(['-c', '--json', socrates]).stdout).valid, true);
  // Answers to a goal are eyemind terms, or N3 with --to n3.
  const goal = ['--goal', "rdf(S, iri('http://example.org/family#ancestor'), O)", 'test/n3/family.n3'];
  assert.match(command(goal).stdout, /^rdf\(iri\('http:\/\/example.org\/family#bob'\)/m);
  assert.match(command(['--to', 'n3', ...goal]).stdout, /:bob :ancestor :dan \./);
  assert.match(command(['--program', socrates]).stdout, /^\/\/ Generated by eyemind from test\/n3\/socrates.n3, Notation3\./);
  assert.match(command(['--to', 'turtle', socrates]).stdout, /:Socrates a :Mortal \./);
});
