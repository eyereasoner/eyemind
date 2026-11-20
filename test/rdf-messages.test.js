// RDF Messages, following the living draft and its message-level cases:
// https://w3c-cg.github.io/rsp/spec/messages-tests (22 October 2026).
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { checkProof, run, write } from '../src/index.js';
import { loadInputs, writeConclusions } from '../src/formats.js';
import { parseRdf } from '../src/rdf.js';
import { parseN3 } from '../src/n3-parser.js';
import { isRdfMessageLog, MESSAGE_NS, parseRdfMessages, RdfMessageReader } from '../src/messages.js';
import { messageReasoner, shaclIn, shaclOut } from '../src/rdf-logic.js';
import { Program } from '../src/program.js';
import { Specializer, generalize } from '../src/specialize.js';
import { Struct, Var, identity } from '../src/terms.js';
import { loadText } from '../src/lang.js';
import { ROOT, assert, cli, command } from './helpers.js';

const P = 'PREFIX : <http://example.org/>\n';
const V = 'VERSION "1.2-messages"\n';
const A = '<http://example.org/a> <http://example.org/value> 1 .\n';
const NT = '<http://example.org/a> <http://example.org/value> "1" .\n';
const RULES = `@prefix : <http://example.org/>.
  @prefix m: <${MESSAGE_NS}>.
  { ?e m:payloadGraph ?p. ?p log:nameOf ?data. ?data log:includes { ?s :value ?v } }
    => { ?e :value ?v }.
  { ?e m:payloadKind m:empty } => { ?e :heartbeat true }.
  { ?e m:payloadGraph ?p. ?p log:nameOf ?data.
    ?data log:includes { ?s :first :yes; :second :yes } } => { :result :is :joined }.`;
const parse = (text, options) => parseRdfMessages(text, options).messages;
const counts = (text, options) => parse(text, options).map((m) => m.quads.length);

export const tests = {
  'message boundaries and empty messages match the draft cases in all four RDF syntaxes'() {
    for (const format of ['turtle', 'trig', 'n-triples', 'n-quads']) {
      const data = format.startsWith('n-') ? NT : A;
      for (const [body, expected] of [
        [data, [1]], [data + 'MESSAGE\n' + data, [1, 1]],
        ['MESSAGE\n' + data, [0, 1]], [data + 'MESSAGE\nMESSAGE\n' + data, [1, 0, 1]],
        [data + 'MESSAGE\n', [1]], [data + 'MESSAGE\nMESSAGE\nMESSAGE\n', [1, 0, 0]],
        ['', []], ['MESSAGE\n', [0]], ['MESSAGE\nMESSAGE\n', [0, 0]],
        [data + 'MESSAGE\n# tail\n', [1]],
      ]) assert.deepEqual(counts(V + body, { format }), expected, `${format}: ${body}`);
    }
    assert.deepEqual(counts('@version "1.2-messages" .\n' + A + '@message # boundary\n.\n' + A), [1, 1]);
    assert.deepEqual(counts('version "1.2-messages"\n' + A + 'message\n' + A), [1, 1]);
  },

  'blank node labels stay distinct between messages and keep their exact spelling within one'() {
    const messages = parse(V + P + '_:a-b :p _:a_b .\nMESSAGE\n_:a-b :p _:a_b .\n');
    const nodes = messages.flatMap((m) => [m.quads[0][0], m.quads[0][2]]).map((t) => write(t));
    assert.equal(new Set(nodes).size, 4);
    assert.equal(messages[0].quads[0][0].args[1], 'a-b');
    assert.equal(messages[0].quads[0][2].args[1], 'a_b');
  },

  'prefix and base changes affect only subsequent messages'() {
    const text = V + 'BASE <http://one/>\nPREFIX : <terms/>\n:s :p <value> .\nMESSAGE\n' +
      'BASE <http://two/>\nPREFIX : <terms/>\n:s :p <value> .\nMESSAGE\n:s :p <value> .';
    const messages = parse(text);
    assert.deepEqual(messages.map((m) => m.quads[0][0].args[0]), ['http://one/terms/s', 'http://two/terms/s', 'http://two/terms/s']);
    assert.deepEqual(messages.map((m) => m.quads[0][2].args[0]), ['http://one/value', 'http://two/value', 'http://two/value']);
    assert.deepEqual(counts(V + A + 'MESSAGE\nPREFIX : <http://tail/>\n'), [1]);
  },

  'named and default graphs remain inside their own message dataset'() {
    const messages = parse(V + P + ':a :value 1. :g { :b :value 2. :c :value 3 } MESSAGE\n:a :value 4.');
    assert.deepEqual(messages.map((m) => m.quads.length), [3, 1]);
    assert.deepEqual(messages[0].quads.map((q) => q[3] === 'default_graph' ? q[3] : q[3].args[0]),
      ['default_graph', 'http://example.org/g', 'http://example.org/g']);
    assert.deepEqual(counts(V + NT.replace(' .', ' <http://example.org/g> .') + 'MESSAGE\n' + NT, { format: 'n-quads' }), [1, 1]);
  },

  'incremental parsing accepts boundaries split at every character without splitting literals or IRIs'() {
    const text = V + P + ':a :text """line\nMESSAGE\n@message .\nVERSION "1.2-messages"\nend""";\n' +
      ':quote "\\\"MESSAGE\\\""; :claim <<( :s :p :o )>>; :iri <http://example.org/MESSAGE>.\n' +
      'MESSAGE\n# MESSAGE\n:a :value 2.\n@message # comment\n.\n';
    const messages = [];
    const reader = new RdfMessageReader({ onMessage: (m) => messages.push(m) });
    for (const c of text) reader.write(c);
    reader.finish();
    assert.deepEqual(messages.map((m) => m.quads.length), [4, 1]);
    assert.ok(isRdfMessageLog(text));
    assert.ok(!isRdfMessageLog(P + ':a :text """\nVERSION "1.2-messages"\nMESSAGE\n""".'));
    const literal = parseRdf(P + ':a :text """\nVERSION "1.2-messages"\nMESSAGE\n""".');
    assert.equal(literal.quads.length, 1);
    assert.equal(literal.quads[0][2].args[0], '\nVERSION "1.2-messages"\nMESSAGE\n');
    assert.deepEqual(messages.map((m) => m.quads.map((q) => q.map((t) => write(t)))),
      parse(text).map((m) => m.quads.map((q) => q.map((t) => write(t)))));
  },

  'message version labels retain their underlying RDF syntax restrictions'() {
    for (const version of ['1.1', '1.2-basic', '1.2']) {
      assert.deepEqual(counts(`VERSION "${version}-messages"\n${NT}`), [1]);
    }
    for (const version of ['1.1', '1.2-basic']) {
      assert.throws(() => parse(`VERSION "${version}-messages"\n${P}:a :p <<( :s :p :o )>> .`), /triple terms require/);
    }
    assert.throws(() => parse('VERSION "9.0-messages"\n'), /unsupported.*version/);
    assert.throws(() => parse('VERSION "1.2"\nMESSAGE\n'), /unsupported|needs a VERSION/);
    assert.throws(() => parse(V + P + ':a :p ?v.'), /variable|not allowed|unexpected/i);
    assert.throws(() => parse(V + P + '{ :a :p :b } => { :a :q :b }.'), /not allowed|no rules|graph|unexpected/i);
    assert.throws(() => parse(V + NT, { format: 'json-ld' }), /do not support/);
    assert.throws(() => parseRdf(V + NT), /parseRdfMessages/);
  },

  'misplaced delimiters and malformed payloads are rejected instead of flattening the log'() {
    for (const text of [V + P + ':g { MESSAGE\n}', V + P + ':g { :a :p :b. MESSAGE\n}',
      V + P + ':a :p (MESSAGE).', V + P + ':a :p :b\nMESSAGE\n', V + A + '@message\n']) {
      assert.throws(() => parse(text), /MESSAGE|message|statement/);
    }
    assert.throws(() => parse(V + NT + '@message .\n', { format: 'n-triples' }), /@message is not allowed/);
    assert.throws(() => parse(V + NT + 'message\n', { format: 'n-triples' }), /case-sensitive/);
    assert.throws(() => parse(V + NT.trim() + ' MESSAGE\n', { format: 'n-triples' }), /own line/);
    assert.throws(() => parse(V + 'MESSAGE ' + NT, { format: 'n-triples' }), /own line/);
    assert.throws(() => parse(V + NT + 'MESSAGE\nPREFIX : <http://example/>\n:a :p :b.', { format: 'n-triples' }), /not allowed/);
  },

  'replay preserves contexts and produces a checkable proof that rejects a substituted message'() {
    const text = V + P + '_:r :value 21.\nMESSAGE\nMESSAGE\n_:r :value 29.\n';
    const loaded = loadInputs([[RULES, 'rules.n3'], [text, 'messages.trig']]);
    const result = run(loaded.program, { proof: true });
    assert.equal(result.answers.length, 3);
    const output = writeConclusions(loaded, result, { format: 'n3' });
    assert.match(output, /#message1> :value 21/);
    assert.match(output, /#message2> :heartbeat true/);
    assert.match(output, /#message3> :value 29/);
    assert.doesNotMatch(output, /:joined/);
    assert.ok(checkProof(loaded.program, result.proof).valid);
    const forged = result.proof.replaceAll('#message1', '#message3');
    assert.notEqual(forged, result.proof);
    assert.ok(!checkProof(loaded.program, forged).valid);
  },

  'replayed named graphs can be inspected without asserting their contents in the outer graph'() {
    const rules = `@prefix : <http://example.org/>. @prefix m: <${MESSAGE_NS}>.
      { ?e m:payloadGraph ?p. ?p log:nameOf ?data.
        ?data log:includes { :g log:nameOf ?graph }.
        ?graph log:includes { ?s :value ?v } } => { ?e :nestedValue ?v }.
      { ?s :value ?v } => { :result :is :leaked }.`;
    const loaded = loadInputs([[rules, 'rules.n3'], [V + P + ':g { :a :value 1 }\nMESSAGE\n:g { :a :value 2 }', 'data.trig']]);
    const result = run(loaded.program, { proof: true });
    assert.equal(result.answers.length, 2);
    assert.ok(!result.answers.some((a) => a.includes('leaked')));
    assert.ok(checkProof(loaded.program, result.proof).valid);
  },

  'replay loads ordinary JavaScript facts and rejects an incompatible SRL base graph'() {
    const js = `query(rdf(S, iri('${MESSAGE_NS}offset'), N, 'default_graph'))`;
    const loaded = loadInputs([[js, 'rules.js'], [V + A + 'MESSAGE\n' + A, 'data.trig']]);
    assert.equal(run(loaded.program).answers.length, 2);
    assert.throws(() => loadInputs([['PREFIX : <http://example/> RULE { ?s :q ?o } WHERE { ?s :p ?o }', 'rules.srl'],
      [V + A, 'data.trig']]), /replay needs N3 or JavaScript/);
  },

  'streaming files and stdin uses the same replay vocabulary and never combines payload facts'() {
    const tmp = mkdtempSync(join(tmpdir(), 'eyemind-messages-'));
    const rules = join(tmp, 'rules.n3');
    const data = join(tmp, 'data.trig');
    const text = V + P + ':a :first :yes; :value 1.\nMESSAGE\nMESSAGE\n:a :second :yes; :value 2.\nMESSAGE\n';
    writeFileSync(rules, RULES + `
      { ?e m:payloadGraph ?p. ?p log:nameOf ?data. ?data log:includes { :a :first :yes } }
        => { :state :first :yes }.
      { ?e m:payloadGraph ?p. ?p log:nameOf ?data. ?data log:includes { :a :second :yes }. :state :first :yes }
        => { :result :is :joined }.`);
    writeFileSync(data, text);
    const args = ['--stream-messages', rules, data];
    const local = command(args);
    assert.equal(local.code, 0, local.stderr);
    assert.deepEqual(local, cli(args));
    assert.match(local.stdout, /#message1> :value 1/);
    assert.match(local.stdout, /#message2> :heartbeat true/);
    assert.match(local.stdout, /#message3> :value 2/);
    assert.doesNotMatch(local.stdout, /:joined/);
    assert.match(cli([rules, data]).stdout, /:joined/);
    const stdin = command(['--stream-messages', rules, '-'], text);
    assert.equal(stdin.code, 0, stdin.stderr);
    assert.match(stdin.stdout, /:value 1/);
    assert.match(stdin.stdout, /:value 2/);
    const twice = command(['--stream-messages', rules, data, data]);
    assert.equal(twice.code, 0, twice.stderr);
    assert.match(twice.stdout, /data.trig%231#message1/);
    assert.match(twice.stdout, /data.trig%232#message1/);
  },

  'a streaming inference fuse stops before reading or validating later payloads'() {
    const tmp = mkdtempSync(join(tmpdir(), 'eyemind-message-halt-'));
    const rules = join(tmp, 'rules.n3');
    writeFileSync(rules, RULES + '{ ?e :value 1 } => false.');
    const result = command(['--stream-messages', rules, '-'], V + A + 'MESSAGE\nthis is invalid RDF');
    assert.equal(result.code, 65, result.stderr);
    assert.match(result.stdout, /:value 1/);
    assert.equal(result.stderr, '');
  },

  'streamed RDF and N3 output keep blank nodes distinct without rewriting literal text'() {
    const tmp = mkdtempSync(join(tmpdir(), 'eyemind-message-blanks-'));
    const rules = join(tmp, 'rules.n3');
    writeFileSync(rules, `@prefix : <http://example.org/>. @prefix m: <${MESSAGE_NS}>.
      { ?e m:payloadGraph ?p. ?p log:nameOf ?data. ?data log:includes { ?s :value ?v } }
        => { ?s :copied ?v; :label "_:b0" }.`);
    const text = V + P + '_:same :value 1.\nMESSAGE\n_:same :value 2.\nMESSAGE\n';
    for (const format of ['n3', 'turtle', 'n-triples']) {
      const result = command(['--stream-messages', '--to', format, rules, '-'], text);
      assert.equal(result.code, 0, result.stderr);
      assert.equal((result.stdout.match(/"_:b0"/g) ?? []).length, 2);
      const nodes = format === 'n3' ? parseN3(result.stdout).triples.map((t) => t.s.v)
        : parseRdf(result.stdout, { format }).quads.map((q) => write(q[0]));
      assert.equal(new Set(nodes).size, 2);
    }
  },

  'streaming rejects proof modes and missing logs before starting a run'() {
    for (const mode of ['--proof', '--prove-and-check', '--program', '--unused']) {
      const result = cli(['--stream-messages', mode, 'missing.n3']);
      assert.equal(result.code, 1);
      assert.match(result.stderr, /cannot be combined/);
    }
    const noLog = command(['--stream-messages', 'examples/family-n3.n3']);
    assert.equal(noLog.code, 1);
    assert.match(noLog.stderr, /needs an RDF Message Log/);
  },

  'a long message stream does not retain earlier payload terms in parser caches'() {
    const source = `import { RdfMessageReader } from './src/messages.js';
      let count = 0;
      const reader = new RdfMessageReader({ format: 'n-triples', onMessage: () => { count++; } });
      reader.write('VERSION "1.2-messages"\\n');
      global.gc();
      const before = process.memoryUsage().heapUsed;
      for (let i = 0; i < 50000; i++) {
        reader.write('<urn:subject:' + i + '> <urn:predicate> "value' + i + '" .\\nMESSAGE\\n');
      }
      reader.finish();
      global.gc();
      console.log(JSON.stringify({ count, growth: process.memoryUsage().heapUsed - before }));`;
    const result = spawnSync(process.execPath, ['--max-old-space-size=128', '--expose-gc', '--input-type=module', '-e', source], {
      cwd: ROOT, encoding: 'utf8', timeout: 30000,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    const { count, growth } = JSON.parse(result.stdout);
    assert.equal(count, 50000);
    assert.ok(growth < 16 * 1024 * 1024, `earlier payloads retained ${growth} bytes`);
  },

  async 'HTTP streaming emits a completed message before the response ends and decodes split UTF-8'() {
    const tmp = mkdtempSync(join(tmpdir(), 'eyemind-messages-http-'));
    const rules = join(tmp, 'rules.n3');
    writeFileSync(rules, RULES);
    let sentTail = false;
    let beforeEnd = false;
    let response;
    const server = createServer((req, res) => {
      response = res;
      res.writeHead(200, { 'content-type': 'application/trig' });
      const first = Buffer.from(V + P + ':a :value "مرحبا".\nMESSAGE\n');
      const at = first.indexOf(Buffer.from('مرحبا')) + 1;
      res.write(first.subarray(0, at));
      setTimeout(() => res.write(first.subarray(at)), 10);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/messages.trig?stream=1`;
    const child = spawn(process.execPath, [join(ROOT, 'bin/eyemind.js'), '--stream-messages', rules, url]);
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => { response?.end(); child.kill('SIGKILL'); }, 15000);
    try {
      child.stdout.on('data', (data) => {
        stdout += data;
        if (!sentTail && stdout.includes('مرحبا')) {
          beforeEnd = !response.writableEnded;
          sentTail = true;
          response.end(':a :value 2.\nMESSAGE\n');
        }
      });
      child.stderr.on('data', (data) => { stderr += data; });
      const code = await new Promise((resolve, reject) => { child.once('exit', resolve); child.once('error', reject); });
      assert.equal(code, 0, stderr);
      assert.ok(sentTail, 'the first result must be emitted before the rest of the HTTP input is supplied');
      assert.ok(beforeEnd);
      assert.match(stdout, /مرحبا/);
      assert.match(stdout, /:value 2/);
    } finally {
      clearTimeout(timer);
      response?.end();
      child.kill();
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
  },

  'RDF logic profiles stream messages with rules specialized once per message shape'() {
    const args = ['--owl2rl', '--stream-messages', 'examples/observations-owl2rl.ttl', 'examples/observations-owl2rl.js', 'examples/data/observations-owl2rl.trig'];
    const saved = readFileSync(join(ROOT, 'examples/output/observations-owl2rl.ttl'), 'utf8');
    // Node reads the log incrementally; the same rules give the same triples.
    const streamed = command([...args, '--stats']);
    assert.equal(streamed.code, 0, streamed.stderr);
    assert.equal(streamed.stdout, saved);
    const stats = streamed.stderr.trim().split('\n').map((line) => JSON.parse(line));
    assert.equal(stats.length, 20);
    assert.ok(stats.every((line) => line.specialized));
    assert.match(saved, /ex:obs20 a sosa:Observation/);
    assert.match(saved, /ex:sensor5 a sosa:Sensor/);
    // The output contract asks for seven triples of each message.
    assert.equal(saved.split('\n').filter((line) => line.startsWith('ex:')).length, 140);
    assert.doesNotMatch(saved, /rdfs:Resource|owl#sameAs|debugOnly/);
    // Without the contract, each message adds RDFS and equality triples, but
    // never the ontology's own consequences.
    const all = cli(args.filter((arg) => !arg.endsWith('.js')));
    assert.equal(all.code, 0, all.stderr);
    assert.match(all.stdout, /ex:obs1 a rdfs:Resource/);
    assert.doesNotMatch(all.stdout, /sosa:Observation a rdfs:Class/);
    // The specialized program is ordinary Logic Script, printed once for the
    // one shape all twenty messages share.
    const printed = cli([...args, '--program']);
    assert.equal(printed.code, 0, printed.stderr);
    assert.equal(printed.stdout.match(/^\/\/ The rules specialized/gm).length, 1);
    assert.match(printed.stdout, /^fact\(old_rdf\(/m);
    const program = loadText(printed.stdout);
    assert.ok(program.forward.length > 0);
    assert.match(cli(['--owl2rl', '--stream-messages', '--to', 'n3', ...args.slice(2)]).stderr, /writes turtle, trig/);
  },

  'an output contract keeps only the rules that can contribute to what it asks for'() {
    const files = ['examples/observations-owl2rl.ttl', 'examples/data/observations-owl2rl.trig'];
    const tmp = mkdtempSync(join(tmpdir(), 'eyemind-contract-'));
    const contract = join(tmp, 'contract.js');
    writeFileSync(contract, `const sosa = (name) => iri('http://www.w3.org/ns/sosa/' + name);
      query(rdf(O, sosa('madeBySensor'), S));
      query(rdf(S, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), sosa('Sensor')));`);
    const rules = (extra) => cli(['--owl2rl', '--stream-messages', '--program', files[0], ...extra, files[1]]).stdout.match(/^implies\(/gm).length;
    // Triples with IRI values need a handful of rules; literal values keep
    // OWL 2 RL's datatype rules, as equal literals are owl:sameAs.
    assert.ok(rules([contract]) < 30);
    assert.ok(rules(['examples/observations-owl2rl.js']) < rules([]));
    const ran = cli(['--owl2rl', '--stream-messages', files[0], contract, files[1]]);
    assert.equal(ran.code, 0, ran.stderr);
    assert.equal(ran.stdout.split('\n').filter((line) => line.startsWith('ex:')).length, 40);
    // A whole run answers the contract's queries, with a checked proof.
    const data = join(tmp, 'data.ttl');
    writeFileSync(data, '<https://example.org/shape-planning#o> <https://example.org/shape-planning#observedBy> <https://example.org/shape-planning#s> .');
    const checked = cli(['--owl2rl', '-c', files[0], contract, data]);
    assert.equal(checked.code, 0, checked.stderr);
    assert.match(checked.stdout, /verdict\('checked'\)/);
    assert.equal((checked.stdout.match(/^result_rdf\(/gm) ?? []).length, 2);
    writeFileSync(contract, 'query(rdf(S, P, O), rdf(O, P, S));');
    assert.match(cli(['--owl2rl', files[0], contract, data]).stderr, /an output contract states only query/);
  },

  'SHACL input and output shapes specialize the rules before the first message and project its triples'() {
    const name = 'shape-planning-owl2rl';
    const [ontology, shapesIn, shapesOut, log] = ['.ttl', '-shacl-in.ttl', '-shacl-out.ttl'].map((end) => `examples/${name}${end}`)
      .concat(`examples/data/${name}.trig`);
    const ran = cli(['--owl2rl', '--stream-messages', '--stats', '--shacl-in', shapesIn, '--shacl-out', shapesOut, ontology, log]);
    assert.equal(ran.code, 0, ran.stderr);
    assert.equal(ran.stdout, readFileSync(join(ROOT, `examples/output/${name}.ttl`), 'utf8'));
    // The closed input shape drops each debug note; every message conforms
    // and uses the program made for the shape.
    const stats = ran.stderr.trim().split('\n').map((line) => JSON.parse(line));
    assert.equal(stats.length, 20);
    assert.ok(stats.every((line) => line.specialized && line.conforms && line.dropped === 1));
    const triples = (text) => text.split('\n').filter((line) => line.startsWith('ex:')).sort();
    // The same triples as the Logic Script contract of the same example.
    const contract = cli(['--owl2rl', '--stream-messages', 'examples/observations-owl2rl.ttl', 'examples/observations-owl2rl.js', log]);
    assert.deepEqual(triples(ran.stdout), triples(contract.stdout));
    // The program for the shape is printed once, before any message has
    // been seen to have it.
    const printed = cli(['--owl2rl', '--stream-messages', '--program', '--shacl-in', shapesIn, ontology, log]);
    assert.equal(printed.stdout.match(/^\/\/ The rules specialized/gm).length, 1);
    // An open shape keeps the debug note; a message with it does not
    // conform and gets rules of its own shape, with the same triples.
    const tmp = mkdtempSync(join(tmpdir(), 'eyemind-shacl-'));
    const open = join(tmp, 'open.ttl');
    writeFileSync(open, readFileSync(join(ROOT, shapesIn), 'utf8').replace('sh:closed true ;', ''));
    const loose = cli(['--owl2rl', '--stream-messages', '--stats', '--shacl-in', open, '--shacl-out', shapesOut, ontology, log]);
    assert.deepEqual(triples(loose.stdout), triples(ran.stdout));
    assert.ok(loose.stderr.trim().split('\n').map((line) => JSON.parse(line)).every((line) => line.specialized && !line.conforms && line.dropped === 0));
    // Output shapes also project a whole run, whose proof checks.
    const data = join(tmp, 'data.ttl');
    writeFileSync(data, '<https://example.org/shape-planning#o> <https://example.org/shape-planning#observedBy> <https://example.org/shape-planning#s> .');
    const checked = cli(['--owl2rl', '-c', '--shacl-out', shapesOut, ontology, data]);
    assert.equal(checked.code, 0, checked.stderr);
    assert.match(checked.stdout, /verdict\('checked'\)/);
    assert.equal((checked.stdout.match(/^result_rdf\(/gm) ?? []).length, 3);
    assert.match(cli(['--owl2rl', '--shacl-in', shapesIn, ontology, data]).stderr, /--shacl-in describes RDF Messages and needs --stream-messages/);
    assert.match(cli(['--shacl-out', shapesOut, data]).stderr, /need an RDF logic profile/);
    writeFileSync(open, '@prefix sh: <http://www.w3.org/ns/shacl#> . <http://example.org/S> a sh:NodeShape .');
    assert.match(cli(['--owl2rl', '--shacl-out', open, ontology, data]).stderr, /the SHACL shapes describe no triples/);
  },

  'SHACL shapes read as triple patterns'() {
    const shapes = (text) => parseRdf(`@prefix sh: <http://www.w3.org/ns/shacl#> . @prefix : <http://example.org/> .
      @prefix xsd: <http://www.w3.org/2001/XMLSchema#> . ${text}`).quads;
    const read = (text) => shaclIn(shapes(text), 'shapes.ttl');
    const written = (text) => read(text).patterns.map((pattern) => write(pattern).replace(/VAR_[A-Za-z0-9_]+/g, '_')).sort();
    const iri = (name) => `iri('http://example.org/${name}')`;
    // Focus nodes are IRIs or blank nodes unless their shape says which.
    assert.deepEqual(written(':S sh:property [ sh:path :p ; sh:datatype xsd:decimal ] .'), [
      `rdf(bnode(_, _), ${iri('p')}, literal(_, datatype('http://www.w3.org/2001/XMLSchema#decimal')), 'default_graph')`,
      `rdf(iri(_), ${iri('p')}, literal(_, datatype('http://www.w3.org/2001/XMLSchema#decimal')), 'default_graph')`]);
    // An inverse path swaps the ends; rdf:type keeps its classes.
    assert.deepEqual(written(`:S sh:nodeKind sh:IRI ; sh:property [ sh:path [ sh:inversePath :p ] ; sh:nodeKind sh:BlankNode ],
      [ sh:path <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ; sh:in ( :A :B ) ] .`), [
      `rdf(bnode(_, _), ${iri('p')}, iri(_), 'default_graph')`,
      `rdf(iri(_), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), ${iri('A')}, 'default_graph')`,
      `rdf(iri(_), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), ${iri('B')}, 'default_graph')`]);
    // Other paths describe triples of each of their predicates.
    assert.deepEqual(written(':S sh:nodeKind sh:IRI ; sh:property [ sh:path ( :p [ sh:alternativePath ( :q [ sh:zeroOrMorePath :r ] ) ] ) ; sh:class :C ] .'),
      ['p', 'q', 'r'].map((p) => `rdf(iri(_), ${iri(p)}, _, 'default_graph')`));
    // Only closed shapes say which properties a kept triple has.
    assert.equal(read(':S sh:property [ sh:path :p ] .').allowed, null);
    assert.deepEqual([...read(':S sh:closed true ; sh:ignoredProperties ( :q ) ; sh:property [ sh:path :p ] .').allowed].sort(),
      ['http://example.org/p', 'http://example.org/q']);
    // Output shapes ask for their values in any graph.
    assert.deepEqual(shaclOut(shapes(':S sh:property [ sh:path :p ; sh:hasValue :v ] .'), 'out.ttl').map((p) => write(p).replace(/VAR_[A-Za-z0-9_]+/g, '_')),
      [`rdf(_, ${iri('p')}, ${iri('v')}, _)`]);
    assert.throws(() => read(':S sh:property [ sh:path [ sh:unknownPath :p ] ] .'), /a SHACL path is a predicate/);
  },

  'specialized message runs conclude what whole runs conclude, or run whole'() {
    const ex = (name) => new Struct('iri', [`https://example.org/x#${name}`]);
    const rdf = (name) => new Struct('iri', [`http://www.w3.org/1999/02/22-rdf-syntax-ns#${name}`]);
    const rdfs = (name) => new Struct('iri', [`http://www.w3.org/2000/01/rdf-schema#${name}`]);
    const owl = (name) => new Struct('iri', [`http://www.w3.org/2002/07/owl#${name}`]);
    const t = (s, p, o) => [s, p, o, 'default_graph'];
    const background = [t(ex('p'), rdfs('subPropertyOf'), ex('q')), t(ex('q'), rdfs('domain'), ex('C')),
      t(ex('C'), rdfs('subClassOf'), ex('D')), t(ex('f'), rdf('type'), owl('FunctionalProperty')), t(ex('a'), ex('f'), ex('b'))];
    const reasoner = messageReasoner({ quads: background, prefixes: {} }, { profiles: ['owl2rl'] });
    const sorted = (quads) => quads.map((q) => q.map((x) => write(x).replace(/skolem\([^)]*\)/g, 'S')).join(' ')).sort();
    const both = (message) => {
      const special = reasoner.infer(message);
      const saved = reasoner.specializer.reason;
      reasoner.specializer.reason = 'compared';
      const whole = reasoner.infer(message);
      reasoner.specializer.reason = saved;
      assert.deepEqual(sorted(special.quads), sorted(whole.quads));
      return special;
    };
    const typed = both([t(ex('x'), ex('p'), ex('y'))]);
    assert.ok(typed.specialized);
    assert.ok(sorted(typed.quads).includes(`${write(ex('x'))} ${write(rdf('type'))} ${write(ex('D'))} 'default_graph'`));
    // A message with the same shape reuses the program.
    assert.equal(both([t(ex('z'), ex('p'), ex('w'))]).sources, null);
    // A background triple adds nothing.
    assert.deepEqual(both([background[0]]).quads, []);
    // A second value of a functional property makes owl:sameAs between
    // individuals: new facts can then have any property, so the whole
    // program runs, with the same conclusions.
    assert.equal(both([t(ex('a'), ex('f'), ex('c'))]).specialized, false);
    // Schema triples in a message are new facts like any other.
    both([t(ex('r'), rdfs('subPropertyOf'), ex('p')), t(ex('u'), ex('r'), ex('v'))]);
    // With an output contract, the pruned rules give the projected whole run.
    const wanted = [new Struct('rdf', [new Var('S'), rdf('type'), ex('D'), new Var('G')]), new Struct('rdf', [new Var('S'), ex('q'), new Var('O'), new Var('G')])];
    const contracted = messageReasoner({ quads: background, prefixes: {}, wanted }, { profiles: ['owl2rl'] });
    for (const message of [[t(ex('x'), ex('p'), ex('y'))], [t(ex('r'), rdfs('subPropertyOf'), ex('p')), t(ex('u'), ex('r'), ex('v'))], [t(ex('a'), ex('f'), ex('c'))]]) {
      const special = contracted.infer(message);
      contracted.specializer.reason = 'compared';
      const whole = contracted.infer(message);
      contracted.specializer.reason = null;
      assert.deepEqual(sorted(special.quads), sorted(whole.quads));
      assert.ok(special.quads.every(([, p, o]) => write(p) === write(ex('q')) || write(o) === write(ex('D'))));
    }
    assert.ok(sorted(contracted.infer([t(ex('x'), ex('p'), ex('y'))]).quads).length === 2);
  },

  'a program with more facts shares its rules and concludes as one built with them'() {
    const program = loadText('implies(edge(X, Y), path(X, Y)); implies([edge(X, Y), path(Y, Z)], path(X, Z)); implies([node(X), not(edge(X, _))], sink(X)); fact(edge(a, b));');
    const extra = [new Struct('edge', ['b', 'c']), new Struct('node', ['c']), new Struct('node', ['a'])];
    const together = loadText('implies(edge(X, Y), path(X, Y)); implies([edge(X, Y), path(Y, Z)], path(X, Z)); implies([node(X), not(edge(X, _))], sink(X)); fact(edge(a, b)); fact(edge(b, c)); fact(node(c)); fact(node(a));');
    assert.deepEqual(run(program.withFacts(extra)).answers, run(together).answers);
    assert.deepEqual(run(program).answers, ["path('a', 'b')"]);
    assert.throws(() => program.withFacts([new Struct('edge', [new Var('X'), 'c'])]), /not a ground fact/);
  },

  'a specialized program keeps rules whose new premise is inside a control goal or a backward clause'() {
    const program = loadText(`fact(seen(old)); fact(kind(a)); implies([kind(X), or(seen(X), alarm(X))], flagged(X));
      implied_by(watched(X), seen(X)); implies([kind(X), watched(X)], tracked(X)); implies(flagged(X), report(X));`);
    const specializer = new Specializer(program);
    assert.equal(specializer.reason, null);
    const special = specializer.specialize([new Struct('seen', ['a'])]);
    assert.ok(special);
    assert.deepEqual(run(special.program).derived.map((node) => write(node.goal)).sort(),
      ["flagged('a')", "report('a')", "tracked('a')"]);
    // Negating facts that can be new is not specialized, nor are arriving
    // facts of a relation the program has no facts or forward rules for.
    assert.equal(new Specializer(loadText('fact(kind(a)); fact(seen(b)); implies([kind(X), not(seen(X))], fresh(X));'))
      .specialize([new Struct('seen', ['a'])]), null);
    assert.equal(new Specializer(loadText('fact(kind(a)); implies([kind(X), not(seen(X))], fresh(X));'))
      .specialize([new Struct('seen', ['a'])]), null);
  },

  'generalizing terms keeps what they share and pairs what they do not'() {
    const general = generalize([new Struct('f', ['a', 'a', 'b']), new Struct('f', ['c', 'c', 'b'])]);
    assert.equal(general.args[2], 'b');
    assert.ok(general.args[0] instanceof Var && general.args[0] === general.args[1]);
    assert.equal(identity(generalize([new Struct('g', [1n])])), identity(new Struct('g', [1n])));
  },
};
