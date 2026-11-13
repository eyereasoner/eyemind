// Notation3 compiled to eyemind: the parser, the compiler and its built-ins,
// the writer, and the N3 documents in examples/.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { cpus, tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkProof, loadText, run } from '../src/index.js';
import { answersToN3, compileN3, reasonN3 } from '../src/n3.js';
import { parseN3 } from '../src/n3-parser.js';
import { readDocuments } from '../src/n3-documents.js';
import { loadInputs, writeConclusions } from '../src/formats.js';
import { nodeIO } from '../src/node.js';
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

test('direct N3 clauses preserve the generated program and its proof', () => {
  for (const text of [
    ':a :p :b. { ?x :p ?y } => { ?x :q ?y; :r ?y }. { ?x :q ?y } => { ?y :q ?x }.',
    '{ } => { :a :p 1, 1.0, -0.0, 9007199254740993 }. { ?math :p ?VAR_a } => { ?VAR_a :q ?math }.',
    '{ :a :p :b } => { }. :a :p :b. { :a :p :b } => { :a :q :b }.',
  ]) {
    const loaded = loadInputs([[`${P}${text}`, 'input.n3']]);
    assert.ok(loaded.compiled.nativeProgram);
    const generated = loadText(loaded.text);
    assert.deepEqual(loaded.program.sources, generated.sources);
    const direct = run(loaded.program, { proof: true });
    const ordinary = run(generated, { proof: true });
    assert.equal(direct.proof, ordinary.proof);
    assert.ok(checkProof(generated, direct.proof).valid);
    assert.ok(!checkProof(generated, direct.proof.replaceAll("iri('http://example.org/#a')", "iri('http://example.org/#invented')")).valid);
  }
});

test('native N3 output avoids ground answer text and preserves universal answer names', () => {
  const loaded = loadInputs([[`${P}:a :p :b. { ?s :p ?o } => { ?s :q ?o }.`, 'input.n3']]);
  const result = run(loaded.program);
  const text = writeConclusions(loaded, { answers: result.answers }, { format: 'n3' });
  Object.defineProperty(result, 'answers', { get() { throw new Error('ground N3 output requested canonical answer text'); } });
  assert.equal(writeConclusions(loaded, result, { format: 'n3' }), text);
  assert.match(text, /:a :q :b/);
  const universal = loadInputs([[`${P}{ } => { @forAll :x. :x :p :o }. { ?s :p :o } log:query { ?s :q :o }.`, 'input.n3']]);
  const answer = run(universal.program);
  assert.equal(writeConclusions(universal, answer, { format: 'n3' }), answersToN3(universal.compiled.doc, answer.answers).n3);
});

test('N3 constructs outside ordinary triple rules retain the full compiler', () => {
  for (const text of [
    ':a :p rdf:nil.',
    ':a :p :b. { ?x :p ?y } => { ?x :q _:w }.',
    ':a :p :b. { ?x ?p ?y } => { ?x :q ?y }.',
    ':a :p :b. { :a :p :b } => { @forAll :x. :x :q :b }.',
    ':a :p :b. { :a :p :b } <= { :a :q :b }.',
  ]) {
    const loaded = loadInputs([[`${P}${text}`, 'input.n3']]);
    assert.equal(loaded.compiled.nativeProgram, null);
    assert.deepEqual(run(loaded.program).answers, run(loadText(loaded.text)).answers);
  }
});

test('TriG joins N3 as named graph formulas without leaking triples or blank nodes', () => {
  const loaded = loadInputs([
    [`${P}:outside :p :z . :one { :a :p :b . _:x :left :a } :two { :b :p :c }`, 'first.trig'],
    [`${P}:one { :b :p :d . _:x :right :b }`, 'second.trig'],
    [`${P}@prefix graph: <https://eyereasoner.github.io/eyemind/graph#> .
      { ?g graph:content ?data . ?data log:includes { ?s :p ?m . ?m :p ?o } }
        => { ?g graph:content { ?s :q ?o } } .
      { ?s :p ?o } => { ?s :defaultCopy ?o } .
      { ?g graph:content ?data . ?data log:includes { ?x :left :a ; :right :b } }
        => { :result :is :leaked } .`, 'rules.n3'],
  ]);
  const result = run(loaded.program, { proof: true });
  assert.equal(result.answers.length, 2);
  const text = writeConclusions(loaded, result, { format: 'n3' });
  assert.match(text, /:one graph:content \{ :a :q :d \} \./);
  assert.match(text, /:outside :defaultCopy :z \./);
  assert.doesNotMatch(text, /:leaked|:q :c|:a :defaultCopy/);
  assert.ok(checkProof(loaded.program, result.proof).valid);
  const forged = result.proof.replaceAll("iri('http://example.org/#one')", "iri('http://example.org/#two')");
  assert.notEqual(forged, result.proof);
  assert.ok(!checkProof(loaded.program, forged).valid);
});

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

test('parser: @forAll and @forSome bind IRIs in every position, nested formulas included', () => {
  const { triples } = parseN3(`${P}@forAll :x, <http://example.org/#p>. @forSome :y. :x :p :y. :y :says { :x :p :y }. :a :says { @forSome :x. :x :p :b }.`);
  assert.deepEqual([triples[0].s.t, triples[0].p.t, triples[0].o.t], ['var', 'var', 'bnode']);
  const inner = triples[1].o.triples[0];
  assert.deepEqual([inner.s, inner.o], [triples[0].s, triples[0].o]);
  // The inner declaration shadows the outer universal.
  const shadowed = triples[2].o.triples[0].s;
  assert.equal(shadowed.t, 'bnode');
  assert.equal(shadowed.scope, triples[2].o.scope);
  // A declared name stays apart from the ?variables the document writes.
  const named = parseN3(`${P}@forAll :x. :x :p ?x.`).triples[0];
  assert.notEqual(named.s.v, named.o.v);
});
test('parser: quantifiers precede statements, @forAll before @forSome, each IRI once', () => {
  for (const [bad, message] of [
    ['@forSome :y. @forAll :x. :x :loves :y.', /@forAll must precede @forSome/],
    [':a :p :b. @forAll :x.', /@forAll must precede the first statement/],
    [':a :p { :a :p :b. @forSome :x. }.', /@forSome must precede the first statement/],
    ['@forAll ?x.', /@forAll declares IRIs, as in @forAll :x; found '\?x'/],
    ['@forSome _:x.', /found '_:x'/],
    ['@forAll :x. @forSome :x.', /already quantified in this formula/],
    ['@forAll :x. @forAll :x.', /already quantified/],
    ['@forAll .', /found '\.'/],
    ['@forAll :x', /expected '\.'/],
  ]) assert.throws(() => parseN3(`${P}${bad}`), message, bad);
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
test('@forAll facts hold of every individual, with a witness of each for @forSome', () => {
  const text = `${P}@forAll :x. @forSome :y. :x :p :o. :x :hasMother :y. :y a :Mother.
    { :s :p :o } => { :s :is :instance }.
    { :bob :hasMother ?m. ?m a :Mother } => { :bob :mother ?m }.
    { :liz :hasMother ?m } => { :liz :mother ?m }.`;
  const out = checkedReason(text);
  assert.match(out, /:s :is :instance \./);
  assert.match(out, /:bob :mother _:b0 \.\n:liz :mother _:b1 \./);
  // Liz's mother is no witness of Bob's.
  const r = reasonN3(text, { proof: true });
  const program = loadText(r.program, 'compiled.js');
  const forged = r.result.proof.replaceAll("['y', iri('http://example.org/#liz')]", "['y', iri('http://example.org/#bob')]");
  assert.notEqual(forged, r.result.proof);
  assert.equal(checkProof(program, forged).valid, false);
});
test('a document @forSome is one individual, in rules and quoted formulas alike', () => {
  const shared = checkedReason(`${P}@forSome :y. {} => { @forAll :x. :x :loves :y }.
    { :bob :loves ?b } => { :bob :beloved ?b }. { :liz :loves ?b } => { :liz :beloved ?b }.`);
  assert.match(shared, /:bob :beloved _:b0 \.\n:liz :beloved _:b0 \./);
  const quoted = `{ :s :p { ?x :b :c }. ?x a :Unicorn } => { :x :y :z }.`;
  assert.match(checkedReason(`${P}@forSome :w. :s :p { :w :b :c }. :w a :Unicorn. ${quoted}`), /:x :y :z/);
  // A blank node label written inside the formula is local to it.
  assert.doesNotMatch(reason(`${P}:s :p { _:w :b :c }. _:w a :Unicorn. ${quoted}`), /:x :y :z/);
});
test('an existential in the scope of @forAll rule variables is a witness of each firing', () => {
  const out = checkedReason(`${P}@forAll :x. @forSome :y. { :x a :Human } => { :x :hasMother :y }. :a a :Human. :b a :Human.`);
  assert.match(out, /:a :hasMother _:b0 \.\n:b :hasMother _:b1 \./);
});
test('a conclusion with its own @forAll states backward rules with witnesses of the firing', () => {
  const text = `${P}:one :q :two.
    { ?a :q ?b } => { @forAll :x. @forSome :z. :x :p :z. :z :from ?a. ?a :done true }.
    { :k :p ?z. ?z :from ?a } => { :k :got (?z ?a) }. { :j :p ?z } => { :j :got ?z }.`;
  assert.match(compileN3(text).program, /^implied_by\(rdf\(X, iri\("http:\/\/example.org\/#p"\), bnode\('n3', \["z\.\d+", X, A\]\)\), rdf\(A, /m);
  const out = checkedReason(text);
  assert.match(out, /:one :done true \./);
  assert.match(out, /:k :got \(_:b0 :one\) \.\n:j :got _:b1 \./);
});
test('quoted formulas match as sets, up to a one-to-one renaming of their own variables', () => {
  const out = checkedReason(`${P}:bob :says { :a :p :b. :c :d :e }.
    :ann :says { _:x :p :a. _:y :p :a }. :cy :says { @forAll :x. :x :likes :pasta }. :dee :says { _:x :likes :pasta }.
    { :bob :says { :c :d :e. :a :p :b } } => { :r :order :ok }.
    { :bob :says { :a :p :b } } => { :r :subset :wrong }.
    { :ann :says { _:u :p :a. _:v :p :a } } => { :r :renamed :ok }.
    { :ann :says { _:z :p :a. _:z :p :a } } => { :r :collapsed :wrong }.
    { :cy :says { @forAll :r. :r :likes :pasta } } => { :r :universal :ok }.
    { :cy :says { @forSome :e. :e :likes :pasta } } => { :r :kind :wrong }.
    { ?s :says { _:z :likes :pasta } } => { ?s :saysSomeoneLikesPasta true }.
    { :dee :says { ?w :likes :pasta } } => { :r :leaked ?w }.
    :g1 :is { _:x :knows :p. :p :says { _:x a :Genius } }.
    { :g1 :is { _:y :knows :p. :p :says { _:x a :Genius } } } => { :r :isomorphic :ok }.
    { :g1 :is { _:y :knows :p. :p :says { _:x a _:z } } } => { :r :g3 :wrong }.`);
  for (const ok of ['order', 'renamed', 'universal', 'isomorphic']) assert.match(out, new RegExp(`:r :${ok} :ok \\.`));
  assert.match(out, /:dee :saysSomeoneLikesPasta true \./);
  assert.doesNotMatch(out, /:wrong|:leaked|:cy :saysSomeone|:bob :saysSomeone/);
});
test('log:includes never instantiates the universals of its subject', () => {
  const out = checkedReason(`${P}{ { @forAll :x. :x :p :o } log:includes { :s :p :o } } => { :r :instantiated :wrong }.
    { { @forAll :x. :x :p :o } log:includes { @forAll :y. :y :p :o } } => { :r :universal :ok }.
    { { :s :p :o. :a :b :c } log:includes { :a :b :c } } => { :r :subgraph :ok }.`);
  assert.match(out, /:r :universal :ok \.\n:r :subgraph :ok \./);
  assert.doesNotMatch(out, /:wrong/);
});
test('a ?variable of a fact is a universal of the document, inside quoted formulas too', () => {
  const out = checkedReason(`${P}?x :says { ?x :is :wise }. ?x :loves _:y.
    { :tom :says ?g } => { :tom :said ?g }.
    { :bob :loves ?b. :liz :loves ?c } => { :r :loved (?b ?c) }.`);
  assert.match(out, /:tom :said \{ :tom :is :wise \} \./);
  // Everybody loves somebody: a witness of each.
  assert.match(out, /:r :loved \(_:b0 _:b1\) \./);
});
test('a rule whose conclusion is a variable asserts the formula its premise binds', () => {
  const text = `${P}:bob :says { :alice :likes :pizza, :pasta }. { :bob :says ?x } => ?x.
    { ?x :likes :pasta } => { ?x :likes :spaghetti }.`;
  assert.match(checkedReason(text), /:alice :likes :pizza \.\n:alice :likes :pasta \.\n:alice :likes :spaghetti \./);
  const r = reasonN3(text, { proof: true });
  const forged = r.result.proof.replaceAll("iri('http://example.org/#pizza')", "iri('http://example.org/#pie')");
  assert.notEqual(forged, r.result.proof);
  assert.equal(checkProof(loadText(r.program, 'compiled.js'), forged).valid, false);
});
test('a rule with blank nodes in its conclusion makes values only where none are known', () => {
  const text = `${P}:jo a :Human. :jo :father :bob. :ann a :Human.
    { ?x a :Human } => { ?x :father _:1. _:1 a :Man }.
    { ?x :father ?y } => { ?y a :Man }.
    { ?x :father ?y } => { ?y :eq ?y }.
    { ?x :father ?y1. ?x :father ?y2. [] log:notIncludes { ?y1 :eq ?y2 } } => { ?y1 :nef ?y2 }.`;
  assert.match(compileN3(text).program, /^restricted\(rdf\(X, /m);
  const out = checkedReason(text);
  assert.match(out, /:ann :father _:b0 \./);
  assert.doesNotMatch(out, /:jo :father|:nef/);
  // A father invented for Jo is refuted by Bob.
  const r = reasonN3(text, { proof: true });
  const program = loadText(r.program, 'compiled.js');
  const forged = r.result.proof.replaceAll("iri('http://example.org/#ann')", "iri('http://example.org/#jo')");
  assert.notEqual(forged, r.result.proof);
  assert.equal(checkProof(program, forged).valid, false);
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
  assert.match(out, /:r :is \(6\.0 42\.0e0\) \./);
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
    { (42 1) list:length "2"^^xsd:double } => { :r :is :wrong }.
    { (42 1) list:length "2"^^xsd:float } => { :r :is :wrong }.
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
test('numeric datatypes stay distinct in triple matching and log equality', () => {
  const out = checkedReason(`${P}:decimal :value 42.0. :double :value 42e0. :float :value "42"^^xsd:float.
    { :decimal :value "42"^^xsd:double } => { :r :is :wrong }.
    { :decimal :value "42"^^xsd:float } => { :r :is :wrong }.
    { :double :value "42"^^xsd:float } => { :r :is :wrong }.
    { 1e0 log:equalTo "1"^^xsd:float } => { :r :is :wrong }.
    { :double :value "42.0"^^xsd:double. 1e0 log:notEqualTo "1"^^xsd:float.
      "42"^^xsd:float math:equalTo 42.0 } => { :r :is :ok }.
    { :double :value ?d. :float :value ?f } => { :r :values (?d ?f) }.`);
  assert.match(out, /:r :is :ok \./);
  assert.match(out, /:r :values \(42\.0e0 "42"\^\^<http:\/\/www.w3.org\/2001\/XMLSchema#float>\) \./);
  assert.doesNotMatch(out, /:wrong/);
});
test('decimal sums add coefficients before rounding the result', () => {
  const out = checkedReason(`${P}{ (0.1 0.2) math:sum ?sum. ?sum log:equalTo 0.3.
      (0.1 -0.1 0.2) math:sum 0.2. (1 2 3) math:sum 6.
      (0.00000001 0.00000002) math:sum 0.00000003.
      (0.1e0 0.2e0) math:sum ?binary. ?binary math:greaterThan 0.3 }
    => { :r :is ?sum }.`);
  assert.match(out, /:r :is 0\.3 \./);
});
test('RDF list patterns match a collection and its tail', () => {
  const out = checkedReason(`${P}(1 2) :p :o.
    { ?l rdf:first 1; rdf:rest ?tail; :p :o.
      ?tail rdf:first 2; rdf:rest rdf:nil } => { :r :is :ok }.
    { ?l rdf:first 1; rdf:rest rdf:nil; :p :o } => { :r :is :wrong }.`);
  assert.match(out, /:r :is :ok \./);
  assert.doesNotMatch(out, /:wrong/);
});
test('scoped calls accept formulas supplied as data and RDF collections', () => {
  const out = checkedReason(`${P}:a :p 1. :b :p 2. :a :q 1. :b :q 2.
    :collect :value (_:value { ?x :p _:value } _:all).
    :every :value [ rdf:first { ?x :p ?n }; rdf:rest [ rdf:first { ?x :q ?n }; rdf:rest rdf:nil ] ].
    :bad :value ({ ?x :p ?n } { ?x :missing ?n }).
    { :collect :value ?call. ?call log:collectAllIn ?scope } => { :r :collected true }.
    { :every :value ?call. ?call log:forAllIn ?scope } => { :r :every true }.
    { :bad :value ?call. ?call log:forAllIn ?scope } => { :r :is :wrong }.`);
  assert.match(out, /:r :collected true \./);
  assert.match(out, /:r :every true \./);
  assert.doesNotMatch(out, /:wrong/);
});
test('an unbound scope remains universal in a derived rule', () => {
  for (const premise of ['?scope log:notIncludes { :missing :p :o }',
    '(_:value { :missing :p _:value } _:all) log:collectAllIn ?scope',
    '({ :missing :p :o } { :missing :q :o }) log:forAllIn ?scope']) {
    const out = checkedReason(`${P}{ ${premise} } => {
      :data :value { :a :p :b }.
      { :data :value ?scope } => { :r :is :ok } }.`);
    assert.match(out, /:r :is :ok \./);
    assert.match(out, /:data :value \?scope/);
  }
});
test('a backward scoped call keeps the formula supplied by its caller', () => {
  const out = checkedReason(`${P}{ :check :scope ?scope } <= { ?scope log:notIncludes { :a :p :b } }.
    { :check :scope { :a :q :b } } => { :r :is :ok }.
    { :check :scope { :a :p :b } } => { :r :is :wrong }.`);
  assert.match(out, /:r :is :ok \./);
  assert.doesNotMatch(out, /:wrong/);
});
test('patterns read from RDF lists accept literal braces', () => {
  const out = checkedReason(`${P}:data :value [ rdf:first "{{tar{{target}}get}}";
      rdf:rest [ rdf:first "{{target}}"; rdf:rest [ rdf:first "{over}"; rdf:rest rdf:nil ] ] ].
    { :data :value ?args. ?args string:replace ?value } => { :r :is ?value }.`);
  assert.match(out, /:r :is "\{\{tar\{over\}get\}\}" \./);
});
test('a derived fuse fires only when its premise holds and its head is false', () => {
  for (const [value, sum, expected] of [['false', 2, true], ['true', 2, false], ['false', 3, false]]) {
    const r = reasonN3(`${P}:data :value ${value}.
      { :data :value ?value } => { { (1 1) math:sum ${sum} } => ?value }.`, { proof: true });
    assert.equal(r.contradiction, expected);
    assert.equal(checkProof(loadText(r.program, 'compiled.js'), r.result.proof).valid, true);
  }
  assert.equal(reasonN3(`${P}{} => { {} => false }.`, { proof: true }).contradiction, true);
});
test('HTTP documents are read before reasoning and fragment reads share a fetch', () => {
  const calls = [];
  const readDocument = (iri) => { calls.push(iri); return `${P}:a :p :b.`; };
  const r = reasonN3(`${P}:doc :source <https://example.org/data#one>.
    { :doc :source ?url. ?url log:semantics ?f. ?f log:includes { :a :p :b }.
      <https://example.org/data#two> log:content ?text } => { :r :is :ok }.`, { readDocument, proof: true });
  assert.match(r.n3, /:r :is :ok \./);
  assert.deepEqual(calls, ['https://example.org/data']);
  assert.equal(checkProof(loadText(r.program, 'compiled.js'), r.result.proof).valid, true);
  const docs = readDocuments(['https://example.org/missing'], null, () => { throw new Error('HTTP 404'); });
  assert.match(docs.get('https://example.org/missing').error, /HTTP 404/);
});
test('the input loader passes its HTTP reader to the N3 compiler', () => {
  const calls = [];
  const loaded = loadInputs([[`${P}{ <https://example.org/text> log:content ?text } => { :r :is ?text }.`, 'input.n3']], {
    readDocument: (iri) => { calls.push(iri); return 'Hello, world!\n'; },
  });
  assert.deepEqual(calls, ['https://example.org/text']);
  assert.match(loaded.text, /fact\(n3_content\(iri\("https:\/\/example.org\/text"\), "Hello, world!\\n"\)\)/);
});
test('saved document fixtures supply text and errors without a network fallback', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'eyemind-n3-documents-'));
  const fixture = join(tmp, 'documents.json');
  writeFileSync(fixture, JSON.stringify({
    'https://example.org/text': { text: 'cached text' },
    'https://example.org/missing': { error: 'HTTP 404' },
  }));
  const previous = process.env.EYEMIND_N3_DOCUMENTS;
  process.env.EYEMIND_N3_DOCUMENTS = fixture;
  try {
    assert.equal(nodeIO.readDocument('https://example.org/text#part'), 'cached text');
    assert.throws(() => nodeIO.readDocument('https://example.org/missing'), /HTTP 404/);
    assert.throws(() => nodeIO.readDocument('https://example.org/unsaved'), /no saved N3 document/);
  } finally {
    if (previous === undefined) delete process.env.EYEMIND_N3_DOCUMENTS;
    else process.env.EYEMIND_N3_DOCUMENTS = previous;
  }
  writeFileSync(join(tmp, 'success-cached.n3'), `@prefix : <http://example.org/>.
    { <https://example.org/text> log:content "cached text" } => { :result :has :success-cached }.
    {} => { :test :contains :success-cached }.`);
  const scored = spawnSync(process.execPath, ['tools/notation3tests.js', '--json', '--documents', fixture, tmp], { cwd: ROOT, encoding: 'utf8' });
  assert.ifError(scored.error);
  assert.equal(scored.status, 0, scored.stderr);
  assert.deepEqual(JSON.parse(scored.stdout).tally, { ok: 1 });
});
test('log:dtlit constructs and checks floating datatypes without losing their kind', () => {
  const out = checkedReason(`${P}{ ("1.0" xsd:double) log:dtlit 1e0.
      ("2.0" xsd:float) log:dtlit "2"^^xsd:float.
      ("3" xsd:decimal) log:dtlit 3.0.
      ("4" xsd:double) log:dtlit ?number } => { :r :is :ok; :number ?number }.
    { ("2.0" xsd:double) log:dtlit "2"^^xsd:float } => { :r :is :wrong }.`);
  assert.match(out, /:r :is :ok \./);
  assert.match(out, /:r :number 4\.0e0 \./);
  assert.doesNotMatch(out, /:wrong/);
});
test('the Notation3 scorer recognizes an inference fuse after partial output', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'eyemind-n3-score-'));
  const document = '@prefix : <http://example.org/>. {} => { :test :contains :crash-late. {} => false }.';
  writeFileSync(join(tmp, 'crash-late.n3'), document);
  writeFileSync(join(tmp, 'success-late.n3'), document.replaceAll('crash-late', 'success-late'));
  const halted = command([join(tmp, 'crash-late.n3')]);
  assert.equal(halted.code, 65, halted.stderr);
  assert.match(halted.stdout, /:test :contains :crash-late/);
  const scored = spawnSync(process.execPath, ['tools/notation3tests.js', '--json', '--progress', tmp], { cwd: ROOT, encoding: 'utf8' });
  assert.ifError(scored.error);
  assert.equal(scored.status, 0, scored.stderr);
  const result = JSON.parse(scored.stdout);
  assert.equal(scored.stderr, 'Running 2 Notation3 cases through the eyemind command.\n');
  assert.deepEqual(result.tally, { ok: 1, incomplete: 1 });
  assert.match(result.failures[0], /success-late/);
});
test('the Notation3 scorer reuses processes and a compile cache without sharing case facts', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'eyemind-n3-workers-'));
  const log = join(tmp, 'workers.jsonl');
  const preload = join(tmp, 'record.cjs');
  writeFileSync(preload, `const fs = require('node:fs');
    if (['eyemind.js', 'notation3-worker.js'].includes(require('node:path').basename(process.argv[1]))) {
      fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ pid: process.pid,
        cache: process.env.NODE_COMPILE_CACHE, present: fs.existsSync(process.env.NODE_COMPILE_CACHE) }) + '\\n');
    }`);
  for (let i = 0; i < 3; i++) {
    writeFileSync(join(tmp, `a-success-${i}.n3`), `@prefix : <http://example.org/>.
      {} => { :test :contains :success-seed. :result :has :success-seed, :fail-clean }.`);
    writeFileSync(join(tmp, `b-fail-${i}.n3`), '@prefix : <http://example.org/>. {} => { :test :contains :fail-clean }.');
  }
  const env = { ...process.env, NODE_OPTIONS: [process.env.NODE_OPTIONS, `--require=${JSON.stringify(preload)}`].filter(Boolean).join(' ') };
  delete env.NODE_COMPILE_CACHE;
  const score = () => {
    writeFileSync(log, '');
    const result = spawnSync(process.execPath, ['tools/notation3tests.js', '--json', tmp], { cwd: ROOT, env, encoding: 'utf8' });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout).tally, { ok: 6 });
    return readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  };
  const workers = score();
  assert.equal(new Set(workers.map((w) => w.pid)).size, Math.min(3, cpus().length));
  assert.equal(new Set(workers.map((w) => w.cache)).size, 1);
  assert.ok(workers.every((w) => w.cache && w.present));
  assert.ok(!existsSync(workers[0].cache), 'the scorer must remove its temporary cache');
  const cache = join(tmp, 'caller-cache');
  mkdirSync(cache);
  env.NODE_COMPILE_CACHE = cache;
  assert.ok(score().every((w) => w.cache === cache));
  assert.ok(existsSync(cache), 'a cache supplied by the caller must remain');
});
test('the Notation3 scorer replaces timed-out workers and finishes later cases', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'eyemind-n3-timeout-'));
  for (let i = 0; i < 3; i++) {
    writeFileSync(join(tmp, `crash-loop-${i}.n3`), `@prefix : <http://example.org/>.
      :a :value 0. { :a :value ?n. (?n 1) math:sum ?next } => { :a :value ?next }.`);
    writeFileSync(join(tmp, `success-after-${i}.n3`), `@prefix : <http://example.org/>.
      {} => { :test :contains :success-after. :result :has :success-after }.`);
  }
  const result = spawnSync(process.execPath, ['tools/notation3tests.js', '--json', '--timeout', '1', tmp], {
    cwd: ROOT, encoding: 'utf8', timeout: 15000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  const scored = JSON.parse(result.stdout);
  assert.equal(scored.total, 6);
  assert.deepEqual(scored.tally, { ok: 6 });
});
test('every compiled run has a checking proof', () => {
  const r = reasonN3(`${P}:a :p 2. { ?x :p ?n. (?n 3) math:sum ?m. ?m math:negation ?k. ?j math:negation ?k.
    ("%s" ?m) string:format ?s. ?S log:notIncludes { ?x :q ?m } } => { ?x :r (?m ?s ?j) }.`, { proof: true });
  assert.match(r.n3, /:a :r \(5 "5" 5\) \./);
  const report = checkProof(loadText(r.program, 'compiled.js'), r.result.proof);
  assert.equal(report.valid, true);
});

test('the eyemind options act on the compiled N3 program', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'eyemind-n3-'));
  const socrates = 'examples/socrates-n3.n3';
  const proof = command(['--proof', socrates]);
  assert.equal(proof.code, 0, proof.stderr);
  assert.match(proof.stdout, /pe:conclusion \{ :Socrates a :Mortal \}/);
  writeFileSync(join(tmp, 'proof.n3'), proof.stdout);
  const checked = command(['--check-proof', join(tmp, 'proof.n3'), socrates]);
  assert.equal(checked.code, 0, checked.stderr);
  assert.match(checked.stdout, /^verdict\('checked'\)$/m);
  writeFileSync(join(tmp, 'forged.n3'), proof.stdout.replace('pe:rule 3', 'pe:rule 1'));
  assert.equal(command(['--check-proof', join(tmp, 'forged.n3'), socrates]).code, 2);
  assert.equal(JSON.parse(command(['-c', '--json', socrates]).stdout).valid, true);
  // Answers to a goal are eyemind terms, or N3 with --to n3.
  const goal = ['--goal', "rdf(S, iri('http://example.org/family#ancestor'), O)", 'examples/family-recursion-n3.n3'];
  assert.match(command(goal).stdout, /^rdf\(iri\('http:\/\/example.org\/family#bob'\)/m);
  assert.match(command(['--to', 'n3', ...goal]).stdout, /:bob :ancestor :dan \./);
  assert.match(command(['--program', socrates]).stdout, /^\/\/ Generated by eyemind from examples\/socrates-n3.n3, Notation3\./);
  assert.match(command(['--to', 'turtle', socrates]).stdout, /:Socrates a :Mortal \./);
});
