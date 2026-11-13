// RDF Messages, following the living draft and its message-level cases:
// https://w3c-cg.github.io/rsp/spec/messages-tests (22 October 2026).
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { checkProof, run, write } from '../src/index.js';
import { loadInputs, writeConclusions } from '../src/formats.js';
import { parseRdf } from '../src/rdf.js';
import { parseN3 } from '../src/n3-parser.js';
import { isRdfMessageLog, MESSAGE_NS, parseRdfMessages, RdfMessageReader } from '../src/messages.js';
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
};
