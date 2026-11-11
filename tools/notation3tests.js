#!/usr/bin/env node
// Score eyemind on the Notation3 test suite
// (https://codeberg.org/phochste/notation3tests), given its tests directory.
//
//   node tools/notation3tests.js [--timeout SECONDS] [--json] [--progress] [-v]
//                              [--documents FILE | --live] [DIR]
//
// Each test file runs through the eyemind command, which compiles it from
// N3. A test file states :test :contains :NAME and, when it passes,
// :result :has :NAME or :test :is true. A success-* test passes when its
// result appears, a fail-* test when none does, and a crash-* test when the
// run stops with an error, an inference fuse or no output. --json prints the
// tally and the time taken as JSON instead. --progress writes case counts
// to stderr as the tests finish. The default is the local .cache/ suite,
// created if missing, then reused with its saved document fixtures.
import { fork } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { cpus, tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { parseN3 } from '../src/n3-parser.js';
import { cachePaths } from './test-cache.js';
import { ensureTestCache } from './sync.js';

const args = process.argv.slice(2);
let timeout = 10;
let verbose = false;
let json = false;
let progress = false;
let documents = null;
let live = false;
const rest = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--timeout') timeout = Number(args[++i]);
  else if (args[i] === '-v') verbose = true;
  else if (args[i] === '--json') json = true;
  else if (args[i] === '--progress') progress = true;
  else if (args[i] === '--documents') documents = args[++i];
  else if (args[i] === '--live') live = true;
  else rest.push(args[i]);
}
const dir = resolve(rest[0] ?? join(cachePaths().notation3tests, 'tests'));
if (rest.length > 1 || !Number.isFinite(timeout) || timeout <= 0 || (live && documents)) {
  process.stderr.write('usage: node tools/notation3tests.js [--timeout SECONDS] [--json] [--progress] [-v] [--documents FILE | --live] [DIR]\n');
  process.exit(2);
}
if (!rest.length) await ensureTestCache({ log: (text) => process.stderr.write(`${text}\n`) });
const env = { ...process.env };
if (live) delete env.EYEMIND_N3_DOCUMENTS;
else {
  const saved = documents ?? join(dir, '..', 'documents.json');
  if (documents || existsSync(saved)) env.EYEMIND_N3_DOCUMENTS = resolve(saved);
}
const workerFile = new URL('./notation3-worker.js', import.meta.url);
const EX = 'http://example.org/';

const collect = (d, out = []) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const full = join(d, e.name);
    if (e.isDirectory()) collect(full, out);
    else if (e.name.endsWith('.n3')) out.push(full);
  }
  return out;
};

function runOne(child, file) {
  return new Promise((resolve) => {
    let out = '';
    let err = '';
    let settled = false;
    const stdout = (data) => { out += data; };
    const stderr = (data) => { err += data; };
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.stdout.off('data', stdout);
      child.stderr.off('data', stderr);
      child.off('message', message);
      child.off('exit', closed);
      child.off('error', failed);
      resolve({ ...result, out: out + (result.out ?? ''), err: err + (result.err ?? '') });
    };
    const message = (result) => finish(result);
    const closed = (code, signal) => finish({ code, signal, exited: true });
    const failed = (error) => finish({ code: 1, signal: null, err: error.message, exited: true });
    child.stdout.on('data', stdout);
    child.stderr.on('data', stderr);
    child.once('message', message);
    child.once('exit', closed);
    child.once('error', failed);
    const timer = setTimeout(() => child.kill('SIGKILL'), timeout * 1000);
    child.send(relative(dir, file), (error) => { if (error) failed(error); });
  });
}

function score(file, { out, err, code, signal }) {
  const crash = file.split('/').pop().startsWith('crash');
  if (signal) return [crash ? 'ok' : 'timeout', 'timeout'];
  if (crash && code === 65) return ['ok', 'inference fuse'];
  let triples;
  try {
    // 65: an inference fuse fired, and the derived triples are still written.
    if (code !== 0 && code !== 65) throw new Error(err.trim());
    if (!out.trim()) throw new Error('empty output');
    triples = parseN3(out).triples;
  } catch (error) {
    return [crash ? 'ok' : /is not supported/.test(error.message) ? 'unsupported' : 'crashed', error.message.split('\n')[0]];
  }
  const isEx = (t, name) => t.t === 'iri' && t.v === EX + name;
  const tests = [...new Set(triples.filter((x) => isEx(x.s, 'test') && isEx(x.p, 'contains')).map((x) => x.o.v))];
  if (crash) return [tests.length ? 'nonconform' : 'ok', 'no crash'];
  if (!tests.length) return ['incomplete', 'no :test :contains'];
  const has = (test) => triples.some((x) => isEx(x.s, 'result') && isEx(x.p, 'has') && x.o.v === test);
  const is = (value) => triples.some((x) => isEx(x.s, 'test') && isEx(x.p, 'is') && x.o.t === 'literal' && x.o.v === value);
  const verdicts = tests.map((test) => {
    const name = test.replace(/.*[/#]/, '');
    if (name.startsWith('fail')) return has(test) || is('true') || is('false') ? 'nonconform' : 'ok';
    if (name.startsWith('success')) return has(test) || is('true') ? 'ok' : is('false') ? 'nonconform' : 'incomplete';
    return 'incomplete';
  });
  return [verdicts.every((v) => v === 'ok') ? 'ok' : verdicts.find((v) => v !== 'ok'), ''];
}

const started = performance.now();
const files = collect(dir).sort();
if (progress) process.stderr.write(`Running ${files.length} Notation3 cases through the eyemind command.\n`);
const tally = {};
const lines = new Array(files.length);
let next = 0;
let finished = 0;
// Reuse loaded modules, while each case gets a fresh CLI run. Replacement
// workers share compiled modules too; a caller's cache remains theirs.
const cache = env.NODE_COMPILE_CACHE ? null : mkdtempSync(join(tmpdir(), 'eyemind-n3-cache-'));
if (cache) env.NODE_COMPILE_CACHE = cache;
async function worker() {
  let child = null;
  try {
    while (next < files.length) {
      const k = next++;
      // A timeout or heap failure costs one worker, not the rest of the suite.
      child ??= fork(workerFile, { cwd: dir, env, execArgv: ['--max-old-space-size=512'], silent: true });
      const result = await runOne(child, files[k]);
      if (result.exited) child = null;
      const [verdict, detail] = score(files[k], result);
      tally[verdict] = (tally[verdict] ?? 0) + 1;
      lines[k] = `${verdict.padEnd(11)} ${relative(dir, files[k])}${verdict !== 'ok' && detail ? `  ${detail.slice(0, 140)}` : ''}`;
      finished++;
      if (progress && finished % 200 === 0 && finished < files.length) {
        process.stderr.write(`${finished}/${files.length} Notation3 cases completed.\n`);
      }
    }
  } finally {
    if (child) {
      await new Promise((resolve) => {
        child.once('exit', resolve);
        child.disconnect();
      });
    }
  }
}
try {
  await Promise.all(Array.from({ length: Math.min(3, cpus().length) }, worker));
} finally {
  if (cache) rmSync(cache, { recursive: true, force: true });
}
const seconds = (performance.now() - started) / 1000;
if (json) {
  process.stdout.write(`${JSON.stringify({ total: files.length, tally, seconds, failures: lines.filter((l) => !l.startsWith('ok')) })}\n`);
} else {
  for (const line of lines) if (verbose || !line.startsWith('ok')) console.log(line);
  console.log(`${tally.ok ?? 0}/${files.length} ok; ${Object.entries(tally).filter(([k]) => k !== 'ok').map(([k, v]) => `${k} ${v}`).join(', ')} (${seconds.toFixed(1)} s)`);
}
