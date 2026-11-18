// Sync tests use small local Git repositories, never the network or the
// main test cache. Upstream bytes and failures are both significant.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkout, ensureTestCache, syncTestSuites } from '../tools/sync.js';
import { readCachedSuites } from '../tools/test-cache.js';
import { syncNotation3Tests } from '../tools/sync-notation3tests.js';
import { RDF_MANIFESTS, W3C_BASE } from './w3c.js';
import { ROOT, assert } from './helpers.js';

const raw = 'https://codeberg.org/phochste/notation3tests/raw/branch/main/';
const SRL_PATH = 'shacl12-test-suite/tests/sparql-rl';
const text = (path) => readFileSync(path, 'utf8');
function put(path, value) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, value); }
function git(path, ...args) { return execFileSync('git', ['-C', path, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }

// A stored (uncompressed) ZIP archive of [name, text] entries.
function zip(entries) {
  const crc = (data) => {
    let c = ~0;
    for (const byte of data) {
      c ^= byte;
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
  };
  const locals = [], centrals = [];
  let offset = 0;
  for (const [name, text] of entries) {
    const file = Buffer.from(name), data = Buffer.from(text), sum = crc(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt32LE(sum, 14);
    local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(file.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt32LE(sum, 16);
    central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(file.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, file, data);
    centrals.push(central, file);
    offset += 30 + file.length + data.length;
  }
  const directory = Buffer.concat(centrals), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

function fixture() {
  const temporary = mkdtempSync(join(tmpdir(), 'eyemind-sync-test-'));
  const root = join(temporary, 'project');
  const checkouts = Object.fromEntries(['notation3tests', 'w3c-rdf', 'w3c-sparql-rl', 'mobibench'].map((name) => [name, join(temporary, name)]));
  for (const path of Object.values(checkouts)) mkdirSync(path, { recursive: true });
  const n3 = checkouts.notation3tests;
  put(join(n3, 'LICENSE'), 'fixture license\n');
  put(join(n3, 'README.md'), 'upstream N3 readme\n');
  put(join(n3, 'tests/content.n3'), `<${raw}HELLO.txt#part> <http://www.w3.org/2000/10/swap/log#content> ?text.\n`);
  put(join(n3, 'tests/missing.n3'), `<${raw}absent.n3> <http://www.w3.org/2000/10/swap/log#semanticsOrError> ?data.\n`);
  put(join(n3, 'tests/negative.n3'), '@prefix : <unterminated');
  put(join(n3, 'HELLO.txt'), 'raw upstream bytes\r\n');
  const rdf = checkouts['w3c-rdf'];
  put(join(rdf, 'README.md'), 'upstream RDF readme\n');
  put(join(rdf, 'LICENSE.md'), 'RDF license\n');
  for (const manifest of RDF_MANIFESTS) {
    const path = manifest.slice(W3C_BASE.length);
    put(join(rdf, path), `@prefix mf: <http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#>.\n
      <> mf:entries (<#case>).
      <#case> a <http://www.w3.org/ns/rdftest#TestTurtleNegativeSyntax>;
        mf:name "fixture"; mf:action <input.ttl>.\n`);
    put(join(rdf, dirname(path), 'input.ttl'), 'invalid syntax is copied verbatim\r\n');
    put(join(rdf, dirname(path), 'reports/historical.ttl'), 'old implementation report');
    put(join(rdf, dirname(path), 'TESTS.zip'), 'old packaged archive');
  }
  const srl = checkouts['w3c-sparql-rl'];
  put(join(srl, 'LICENSE.md'), 'SRL license\n');
  put(join(srl, SRL_PATH, 'README.md'), 'upstream SRL readme\n');
  put(join(srl, SRL_PATH, 'manifest-sparql-rl.ttl'), `@prefix mf: <http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#>.
    <> mf:include (<syntax/manifest.ttl>).`);
  put(join(srl, SRL_PATH, 'syntax/manifest.ttl'), `@prefix mf: <http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#>.
    <> mf:entries (<#case>).
    <#case> a <http://www.w3.org/ns/sparql-rl-tests#RulesPositiveSyntaxTest>;
      mf:name "fixture"; mf:action <input.srl>.`);
  put(join(srl, SRL_PATH, 'syntax/input.srl'), 'DATA {}\n');
  put(join(srl, 'shacl12-test-suite/README.md'), 'upstream SHACL readme\n');
  put(join(srl, 'shacl12-test-suite/tests/manifest.ttl'), `@prefix mf: <http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#>.
    <> mf:include <core/manifest.ttl>.`);
  put(join(srl, 'shacl12-test-suite/tests/core/manifest.ttl'), `@prefix mf: <http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#>.
    @prefix sh: <http://www.w3.org/ns/shacl#>.
    @prefix sht: <http://www.w3.org/ns/shacl-test#>.
    <> mf:entries (<#case>).
    <#case> a sht:Validate; mf:requires sht:Core;
      mf:action [sht:dataGraph <>; sht:shapesGraph <>];
      mf:result [a sh:ValidationReport; sh:conforms true].`);
  const mobibench = checkouts.mobibench, suite = 'testsuite-owl2-rdfbased/subsuites/owl2rl/rdfbased-fixture';
  put(join(mobibench, 'README.md'), 'upstream MobiBench readme\n');
  put(join(mobibench, 'LICENSE'), 'MobiBench license\n');
  mkdirSync(join(mobibench, 'web/res/owl/conf'), { recursive: true });
  writeFileSync(join(mobibench, 'web/res/owl/conf/testsuite-owl2-rdfbased.zip'), zip([
    [`${suite}/rdfbased-fixture.metadata.properties`, '<entry key="testcase.type">POSITIVE_ENTAILMENT</entry><entry key="testcase.description">fixture &amp; case</entry>'],
    [`${suite}/rdfbased-fixture.premisegraph.ttl`, '<urn:a> <http://www.w3.org/2000/01/rdf-schema#subClassOf> <urn:b> .\n'],
    [`${suite}/rdfbased-fixture.conclusiongraph.ttl`, '<urn:a> a <http://www.w3.org/2000/01/rdf-schema#Class> .\n'],
    ['testsuite-owl2-rdfbased/subsuites/other/ignored.ttl', 'outside the OWL 2 RL subsuite'],
  ]));
  const revisions = {};
  for (const [name, path] of Object.entries(checkouts)) {
    git(path, 'init', '-q');
    git(path, 'add', '-A');
    git(path, '-c', 'user.name=Sync fixture', '-c', 'user.email=sync@example.org', 'commit', '-qm', 'Test suite fixture');
    revisions[name] = git(path, 'rev-parse', 'HEAD');
  }
  for (const path of ['.cache/notation3tests', '.cache/w3c/rdf-tests', '.cache/w3c/sparql-rl', '.cache/w3c/shacl', '.cache/mobibench']) put(join(root, path, 'stale'), 'old mirror');
  put(join(root, 'unrelated.txt'), 'keep me');
  return { temporary, root, checkouts, revisions };
}

export const tests = {
  async 'a missing test cache is created once and warm tests reuse it without upstream access'() {
    const f = fixture();
    try {
      assert.equal(readCachedSuites(f.root), null);
      const info = await ensureTestCache({ root: f.root, checkouts: f.checkouts, log() {} });
      assert.deepEqual(readCachedSuites(f.root), info);
      assert.deepEqual(JSON.parse(text(join(f.root, 'test/upstream.json'))), info);
      for (const path of Object.values(f.checkouts)) rmSync(path, { recursive: true });
      const logs = [];
      assert.deepEqual(await ensureTestCache({ root: f.root, checkouts: f.checkouts, log: (line) => logs.push(line) }), info);
      assert.deepEqual(logs, []);
    } finally { rmSync(f.temporary, { recursive: true, force: true }); }
  },

  async 'an incomplete cache is rebuilt instead of silently losing a test'() {
    const f = fixture();
    try {
      await syncTestSuites({ root: f.root, checkouts: f.checkouts, log() {} });
      const input = join(f.root, '.cache/w3c/rdf-tests/rdf/rdf11/rdf-turtle/input.ttl');
      rmSync(input);
      assert.equal(readCachedSuites(f.root), null);
      await ensureTestCache({ root: f.root, checkouts: f.checkouts, log() {} });
      assert.equal(text(input), 'invalid syntax is copied verbatim\r\n');
      assert.ok(readCachedSuites(f.root));
    } finally { rmSync(f.temporary, { recursive: true, force: true }); }
  },

  async 'explicit sync refreshes a valid cache and records the new upstream revision'() {
    const f = fixture();
    try {
      const original = await syncTestSuites({ root: f.root, checkouts: f.checkouts, log() {} });
      const source = f.checkouts.notation3tests;
      put(join(source, 'tests/added.n3'), '@prefix : <urn:test:>. :s :p :o.');
      git(source, 'add', '-A');
      git(source, '-c', 'user.name=Sync fixture', '-c', 'user.email=sync@example.org', 'commit', '-qm', 'Add a test');
      assert.deepEqual(await ensureTestCache({ root: f.root, checkouts: f.checkouts, log() {} }), original);
      const updated = await syncTestSuites({ root: f.root, checkouts: f.checkouts, log() {} });
      assert.equal(updated.notation3tests.cases, 4);
      assert.notEqual(updated.notation3tests.revision, original.notation3tests.revision);
      assert.deepEqual(JSON.parse(text(join(f.root, 'test/upstream.json'))), updated);
    } finally { rmSync(f.temporary, { recursive: true, force: true }); }
  },

  'sparse upstream clones include root licensing and documentation beside the selected tests'() {
    const f = fixture();
    try {
      const target = join(f.temporary, 'sparse-clone');
      const source = pathToFileURL(f.checkouts['w3c-rdf']).href;
      // The clone helper appends .git, as the public repository URLs do.
      renameSync(f.checkouts['w3c-rdf'], `${f.checkouts['w3c-rdf']}.git`);
      checkout(source, null, target, ['rdf/rdf11/rdf-turtle']);
      assert.equal(text(join(target, 'README.md')), 'upstream RDF readme\n');
      assert.equal(text(join(target, 'LICENSE.md')), 'RDF license\n');
      assert.ok(existsSync(join(target, 'rdf/rdf11/rdf-turtle/manifest.ttl')));
      assert.ok(!existsSync(join(target, 'rdf/rdf12/rdf-turtle')));
    } finally { rmSync(f.temporary, { recursive: true, force: true }); }
  },

  async 'sync refreshes all five mirrors from local Git checkouts with exact bytes, fixtures and revisions'() {
    const f = fixture();
    try {
      const info = await syncTestSuites({ root: f.root, checkouts: f.checkouts, log() {} });
      assert.equal(info.notation3tests.cases, 3);
      assert.equal(info.rdf.cases, RDF_MANIFESTS.length);
      assert.equal(info.srl.cases, 1);
      assert.equal(info.shacl.cases, 1);
      assert.equal(info.mobibench.cases, 1);
      for (const [name, path] of [['notation3tests', '.cache/notation3tests'], ['w3c-rdf', '.cache/w3c/rdf-tests'], ['w3c-sparql-rl', '.cache/w3c/sparql-rl'],
        ['w3c-sparql-rl', '.cache/w3c/shacl'], ['mobibench', '.cache/mobibench']]) {
        assert.ok(!existsSync(join(f.root, path, 'stale')));
        assert.equal(JSON.parse(text(join(f.root, path, 'upstream.json'))).revision, f.revisions[name]);
      }
      assert.equal(text(join(f.root, '.cache/notation3tests/tests/content.n3')), text(join(f.checkouts.notation3tests, 'tests/content.n3')));
      assert.equal(text(join(f.root, '.cache/notation3tests/UPSTREAM.md')), 'upstream N3 readme\n');
      const documents = JSON.parse(text(join(f.root, '.cache/notation3tests/documents.json')));
      assert.equal(documents[`${raw}HELLO.txt`].text, 'raw upstream bytes\r\n');
      assert.match(documents[`${raw}absent.n3`].error, new RegExp(f.revisions.notation3tests));
      const input = 'rdf/rdf11/rdf-turtle/input.ttl';
      assert.equal(text(join(f.root, '.cache/w3c/rdf-tests', input)), text(join(f.checkouts['w3c-rdf'], input)));
      assert.equal(text(join(f.root, '.cache/w3c/rdf-tests/LICENSE.md')), 'RDF license\n');
      assert.ok(!existsSync(join(f.root, '.cache/w3c/rdf-tests/rdf/rdf11/rdf-turtle/reports')));
      assert.ok(!existsSync(join(f.root, '.cache/w3c/rdf-tests/rdf/rdf11/rdf-turtle/TESTS.zip')));
      assert.equal(text(join(f.root, '.cache/w3c/sparql-rl/LICENSE.md')), 'SRL license\n');
      assert.equal(text(join(f.root, '.cache/w3c/shacl/UPSTREAM.md')), 'upstream SHACL readme\n');
      assert.ok(!existsSync(join(f.root, '.cache/w3c/shacl/sparql-rl')));
      const extracted = '.cache/mobibench/testsuite-owl2-rdfbased/subsuites/owl2rl/rdfbased-fixture/rdfbased-fixture.premisegraph.ttl';
      assert.equal(text(join(f.root, extracted)), '<urn:a> <http://www.w3.org/2000/01/rdf-schema#subClassOf> <urn:b> .\n');
      assert.ok(!existsSync(join(f.root, '.cache/mobibench/testsuite-owl2-rdfbased/subsuites/other')));
      assert.equal(text(join(f.root, '.cache/mobibench/LICENSE')), 'MobiBench license\n');
      assert.equal(text(join(f.root, 'unrelated.txt')), 'keep me');
      assert.ok(readdirSync(join(f.root, '.cache')).every((name) => !name.startsWith('.sync-')));
    } finally { rmSync(f.temporary, { recursive: true, force: true }); }
  },

  async 'a failure in one suite leaves all five previous mirrors intact'() {
    const f = fixture();
    try {
      const manifest = join(f.checkouts['w3c-sparql-rl'], 'shacl12-test-suite/tests/core/manifest.ttl');
      put(manifest, text(manifest).replace('sht:dataGraph <>', 'sht:dataGraph <missing.ttl>'));
      await assert.rejects(syncTestSuites({ root: f.root, checkouts: f.checkouts, log() {} }), /missing\.ttl/);
      for (const path of ['.cache/notation3tests', '.cache/w3c/rdf-tests', '.cache/w3c/sparql-rl', '.cache/w3c/shacl', '.cache/mobibench']) {
        assert.equal(text(join(f.root, path, 'stale')), 'old mirror');
        assert.ok(!existsSync(join(f.root, path, 'upstream.json')));
      }
      assert.ok(readdirSync(join(f.root, '.cache')).every((name) => !name.startsWith('.sync-')));
    } finally { rmSync(f.temporary, { recursive: true, force: true }); }
  },

  async 'sync rejects missing negative-syntax inputs rather than treating a missing file as rejection'() {
    const f = fixture();
    try {
      rmSync(join(f.checkouts['w3c-rdf'], 'rdf/rdf11/rdf-turtle/input.ttl'));
      await assert.rejects(syncTestSuites({ root: f.root, checkouts: f.checkouts, log() {} }), /input\.ttl/);
      assert.equal(text(join(f.root, '.cache/w3c/rdf-tests/stale')), 'old mirror');
    } finally { rmSync(f.temporary, { recursive: true, force: true }); }
  },

  async 'notation3 sync stores unqualified test hosts without depending on machine DNS'() {
    const f = fixture();
    try {
      put(join(f.checkouts.notation3tests, 'tests/unqualified.n3'), '<https://unqualified> <http://www.w3.org/2000/10/swap/log#content> ?text.');
      const destination = join(f.root, '.cache/notation3tests');
      await syncNotation3Tests({ checkout: f.checkouts.notation3tests, destination, log() {},
        fetchDocument: async () => { assert.fail('unqualified hosts must not reach the resolver'); },
      });
      const documents = JSON.parse(text(join(destination, 'documents.json')));
      assert.equal(documents['https://unqualified'].error, 'unqualified test document host');
    } finally { rmSync(f.temporary, { recursive: true, force: true }); }
  },

  async 'notation3 sync records permanent dereference failures but stops on temporary network failures'() {
    const f = fixture();
    try {
      put(join(f.checkouts.notation3tests, 'tests/network.n3'), '<https://missing.example/doc> <http://www.w3.org/2000/10/swap/log#content> ?text.');
      const destination = join(f.root, '.cache/notation3tests');
      await assert.rejects(syncNotation3Tests({ checkout: f.checkouts.notation3tests, destination, log() {},
        fetchDocument: async () => { throw new TypeError('temporary lookup failure', { cause: { code: 'EAI_AGAIN' } }); },
      }), /temporary lookup failure/);
      assert.equal(text(join(destination, 'stale')), 'old mirror');
      await syncNotation3Tests({ checkout: f.checkouts.notation3tests, destination, log() {},
        fetchDocument: async () => { throw new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } }); },
      });
      assert.equal(JSON.parse(text(join(destination, 'documents.json')))['https://missing.example/doc'].error, 'fetch failed');
    } finally { rmSync(f.temporary, { recursive: true, force: true }); }
  },

  'the npm sync command documents its options and rejects malformed arguments without fetching'() {
    assert.equal(JSON.parse(text(join(ROOT, 'package.json'))).scripts.sync, 'node tools/sync.js');
    const run = (...args) => spawnSync(process.execPath, [join(ROOT, 'tools/sync.js'), ...args], { cwd: ROOT, encoding: 'utf8' });
    const help = run('--help');
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /--notation3tests PATH/);
    assert.match(help.stdout, /--w3c-rdf PATH/);
    assert.match(help.stdout, /--w3c-sparql-rl PATH/);
    assert.match(help.stdout, /--w3c-shacl PATH/);
    assert.equal(run('--unknown').status, 1);
    assert.match(run('--w3c-rdf').stderr, /needs a checkout path/);
  },
};
