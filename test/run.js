#!/usr/bin/env node
// Every test of eyemind in one run, one numbered line per test: npm test
//
//     npm test                       unit tests, examples, conformance in process,
//                                    a selection of its cases through the command
//                                    (EYEMIND_CLI_ALL=1: all of them, as in CI),
//                                    and the playground in a headless Chrome
//     npm test -- unit examples      only these sections
//     npm test -- -k skolem          only tests whose line contains "skolem"
//     EYEMIND_TEST_JOBS=1 npm test   unit and example tests in this process,
//                                    not in worker processes (default 4)
//
// Sections: unit, examples, conformance, cli, playground. The playground
// section needs Chrome (CHROME names it when it is not on the PATH); without
// one it says so and runs nothing. Each test prints OK or FAIL, its
// number, what it tests and how long it took; each section and the whole run
// end with a total. The exit code is 1 when a test failed.
import { spawn } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { cpus } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { VERSION } from '../src/index.js';
import { check, execute, loadCases, shellSplit } from '../conformance/run.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const SECTIONS = ['unit', 'examples', 'conformance', 'cli', 'playground'];
const TITLES = {
  unit: 'Unit tests', examples: 'Examples', conformance: 'Conformance', cli: 'Command-line cases through the eyemind command',
  playground: 'Playground in a headless Chrome',
};
const COUNTED = {
  unit: 'unit tests', examples: 'example tests', conformance: 'conformance cases',
  cli: 'command-line cases through the eyemind command', playground: 'playground tests',
};
const COLOR = process.env.NO_COLOR === undefined && (process.stdout.isTTY || (process.env.FORCE_COLOR ?? '0') !== '0');
const paint = (code, text) => (COLOR ? `\x1b[${code}m${text}\x1b[0m` : text);

class Reporter {
  constructor(pattern) {
    this.pattern = pattern;
    this.passed = 0;
    this.total = 0;
    this.failures = [];
    this.started = performance.now();
    this.heading = null;
  }

  wanted(label) {
    return this.pattern === null || label.toLowerCase().includes(this.pattern.toLowerCase());
  }

  // The heading waits for the section's first test, so a section -k leaves
  // empty does not show. Sections run together in workers pass the times
  // they started and ended.
  section(name, started = performance.now()) {
    this.heading = name;
    this.sectionStart = [started, this.passed, this.total];
  }

  endSection(name, ended = performance.now()) {
    const [started, passed, total] = this.sectionStart;
    if (this.total === total) return;
    this.summary(this.passed - passed, this.total - total, COUNTED[name], ended - started);
  }

  summary(passed, total, what, ms) {
    const word = passed === total ? paint('32', 'OK') : paint('31', 'FAIL');
    const outcome = passed === total ? 'passed' : `passed, ${total - passed} failed`;
    console.log(`${word} ${passed}/${total} ${what} ${outcome} ${paint('2', `(${(ms / 1000).toFixed(1)} s)`)}`);
  }

  // The section's heading, once, before its first line.
  head() {
    if (this.heading !== null) {
      console.log(`\n${paint('33', `== ${TITLES[this.heading]}`)}`);
      this.heading = null;
    }
  }

  // A line that is not a test, such as why a section ran nothing.
  note(text) {
    this.head();
    console.log(paint('2', text));
  }

  result(label, ms, problem = null) {
    this.head();
    this.total++;
    const number = String(this.total).padStart(3, '0');
    const timing = paint('2', `(${Math.round(ms)} ms)`);
    if (problem === null) {
      this.passed++;
      console.log(`${paint('32', 'OK')} ${number} ${label} ${timing}`);
    } else {
      this.failures.push([number, label]);
      console.log(`${paint('31', 'FAIL')} ${number} ${label} ${timing}`);
      console.error(problem.trimEnd());
    }
  }

  finish() {
    if (this.total === 0) {
      console.log(`${paint('31', 'FAIL')} no test matches`);
      return 1;
    }
    console.log(`\n${paint('33', '== Total')}`);
    this.summary(this.passed, this.total, 'tests', performance.now() - this.started);
    for (const [number, label] of this.failures) console.log(`${paint('31', 'FAIL')} ${number} ${label}`);
    return this.passed === this.total ? 0 : 1;
  }
}

// Every test of the test modules, as [section, label, fn]. A module exports
// tests, an object from description to function, and may name its section.
async function moduleTests() {
  const found = [];
  for (const file of readdirSync(HERE).filter((name) => name.endsWith('.test.js')).sort()) {
    const module = await import(pathToFileURL(join(HERE, file)).href);
    const prefix = file.replace(/\.test\.js$/, '');
    for (const [description, fn] of Object.entries(module.tests)) {
      const section = module.section ?? 'unit';
      found.push([section, section === 'unit' ? `${prefix}: ${description}` : description, fn]);
    }
  }
  return found;
}

function problemOf(error) {
  return `${error && error.stack ? error.stack : String(error)}\n`;
}

async function runOne(fn) {
  const started = performance.now();
  let problem = null;
  try {
    await fn();
  } catch (error) {
    problem = problemOf(error);
  }
  return [performance.now() - started, problem];
}

async function runTests(reporter, tests) {
  for (const [, label, fn] of tests) {
    if (reporter.wanted(label)) reporter.result(label, ...await runOne(fn));
  }
}

// The unit and example tests in worker processes, a group at a time, with
// their results printed in the order a single process would print them. A
// group is every test of one example, in order, across modules, so that the
// tests sharing an example's runs stay in one process and a large example
// is never worked on in two at once; any other test is a group of its own.
// The largest examples, by saved proof, start first so that they do not
// finish last. EYEMIND_TEST_JOBS=1 runs everything in this process.
const JOBS = Math.max(1, Number(process.env.EYEMIND_TEST_JOBS ?? Math.min(cpus().length || 1, 4)) || 1);
const EXAMPLE = /(?:examples\/(?:check\/)?|^decks: )([\w-]+)(?:\.js| deck)/;

function groupsOf(tests, indices) {
  const groups = new Map();
  for (const index of indices) {
    const name = tests[index][1].match(EXAMPLE)?.[1] ?? null;
    const id = name ?? `test ${index}`;
    if (!groups.has(id)) groups.set(id, { indices: [], cost: 0 });
    groups.get(id).indices.push(index);
    if (name !== null && groups.get(id).cost === 0) {
      try {
        groups.get(id).cost = statSync(join(ROOT, 'examples', 'proof', `${name}.js`)).size;
      } catch {
        groups.get(id).cost = 1;
      }
    }
  }
  return [...groups.values()].sort((a, b) => b.cost - a.cost);
}

async function runPool(reporter, tests, names) {
  const indices = names.flatMap((name) => tests.flatMap(([section, label], index) =>
    section === name && reporter.wanted(label) ? [index] : []));
  const groups = groupsOf(tests, indices);
  const jobs = Math.min(JOBS, groups.length);
  if (jobs <= 1) {
    for (const name of names) {
      reporter.section(name);
      await runTests(reporter, tests.filter(([section]) => section === name));
      reporter.endSection(name);
    }
    return;
  }
  const { fork } = await import('node:child_process');
  const started = performance.now();
  const results = new Map();
  const finished = new Map();
  let printed = 0;
  let current = null;
  // Print every result that follows those already printed, in order.
  const flush = () => {
    while (printed < indices.length && results.has(indices[printed])) {
      const index = indices[printed++];
      const [section, label] = tests[index];
      if (section !== current) {
        if (current !== null) reporter.endSection(current, finished.get(current));
        reporter.section(section, started);
        current = section;
      }
      reporter.result(label, ...results.get(index));
    }
  };
  const done = (index, result) => {
    results.set(index, result);
    finished.set(tests[index][0], performance.now());
    flush();
  };
  let next = 0;
  const worker = () => new Promise((resolve) => {
    const child = fork(fileURLToPath(import.meta.url), [], { env: { ...process.env, EYEMIND_TEST_WORKER: '1' } });
    let group = null;
    const send = () => {
      group = next < groups.length ? groups[next++] : null;
      if (group === null) child.disconnect();
      else child.send(group.indices);
    };
    child.on('message', ([index, ms, problem]) => {
      done(index, [ms, problem]);
      if (group.indices.every((i) => results.has(i))) send();
    });
    // A worker that ends with tests of its group unrun fails them, so a
    // crash, such as one the memory cap causes, cannot pass unnoticed.
    child.on('exit', (code, signal) => {
      for (const index of group?.indices ?? []) {
        if (!results.has(index)) done(index, [0, `the test worker ended (${signal ?? `code ${code}`}) before this test finished\n`]);
      }
      resolve();
    });
    send();
  });
  await Promise.all(Array.from({ length: jobs }, worker));
  if (current !== null) reporter.endSection(current, finished.get(current));
}

// A worker of runPool: it runs each group it is sent and reports each test.
async function serveTests() {
  const tests = await moduleTests();
  process.on('message', async (indices) => {
    for (const index of indices) process.send([index, ...await runOne(tests[index][2])]);
  });
}

function casesFor(reporter) {
  return loadCases().filter((item) => reporter.wanted(`${item.where} ${item.name}`));
}

function runInProcess(reporter) {
  for (const item of casesFor(reporter)) {
    const started = performance.now();
    let problem = null;
    try {
      const problems = check(item, ...execute(item));
      if (problems.length) problem = `${problems.join('; ')}\n`;
    } catch (error) {
      problem = problemOf(error);
    }
    reporter.result(`${item.where} ${item.name}`, performance.now() - started, problem);
  }
}

// The cases that run through the command. The conformance section has already
// run every case in process through the same main(); a process adds only what
// bin/eyemind.js does with its arguments, standard streams and exit code. So
// by default these are every command-line case, the first case of each kind
// (case file, exit code, standard input or not, standard error setting) and
// every tenth case besides; EYEMIND_CLI_ALL=1, as CI sets it, runs them all.
function throughCommand(cases) {
  if (process.env.EYEMIND_CLI_ALL === '1') return cases;
  const kinds = new Set();
  return cases.filter((item, i) => {
    const kind = [item.path, item.exit, item.stdin !== null, item.stderr].join('\0');
    const first = !kinds.has(kind);
    kinds.add(kind);
    return item.path.endsWith('14-command-line.js') || first || i % 10 === 0;
  });
}

// Cases run through the actual command, each in a process and directory of
// its own. Results retain case order; bounded concurrency keeps process
// startup from dominating the suite.
async function runThroughCommandLine(reporter) {
  const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const all = casesFor(reporter);
  const cases = throughCommand(all);
  if (cases.length < all.length) {
    reporter.note(`${cases.length} of ${all.length} cases, each kind of case and every tenth; EYEMIND_CLI_ALL=1 runs them all.`);
  }
  const outcomes = new Array(cases.length);
  // Starting Node dominates each case; a compile cache shared by the cases
  // spares each process compiling eyemind's modules again.
  const cache = mkdtempSync(join(tmpdir(), 'eyemind-compile-cache-'));
  const env = { ...process.env, NODE_COMPILE_CACHE: cache };
  let next = 0;
  const one = (item) => new Promise((resolve) => {
    const directory = mkdtempSync(join(tmpdir(), 'eyemind-cli-'));
    for (const [name, text] of Object.entries(item.files)) {
      mkdirSync(dirname(join(directory, name)), { recursive: true });
      writeFileSync(join(directory, name), text);
    }
    const started = performance.now();
    const child = spawn(process.execPath, [join(ROOT, 'bin', 'eyemind.js'), ...shellSplit(item.args)], { cwd: directory, env });
    const out = [];
    const err = [];
    child.stdout.on('data', (chunk) => out.push(chunk));
    child.stderr.on('data', (chunk) => err.push(chunk));
    child.stdin.on('error', () => {});
    child.stdin.end(item.stdin ?? '');
    child.on('close', (code) => {
      rmSync(directory, { recursive: true, force: true });
      const problems = check(item, code, Buffer.concat(out).toString('utf8'), Buffer.concat(err).toString('utf8'));
      resolve([performance.now() - started, problems.length ? `${problems.join('; ')}\n` : null]);
    });
  });
  const worker = async () => {
    while (next < cases.length) {
      const index = next++;
      outcomes[index] = await one(cases[index]);
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(cpus().length || 4, 8) }, worker));
  } finally {
    rmSync(cache, { recursive: true, force: true });
  }
  cases.forEach((item, i) => reporter.result(`${item.where} ${item.name}`, ...outcomes[i]));
}

// The playground's tests, in order, on one page of a headless Chrome that
// loads playground/index.html from a server of the repository started here.
async function runPlayground(reporter) {
  const { tests, prepare } = await import('./playground.js');
  const wanted = tests.filter(([name]) => reporter.wanted(`playground: ${name}`));
  if (!wanted.length) return;
  if (typeof WebSocket === 'undefined') {
    reporter.note('This Node.js has no WebSocket, which talking to Chrome needs, so the playground tests did not run.');
    return;
  }
  const { connect, findChrome, launch, serve } = await import('./chrome.js');
  const executable = findChrome();
  if (executable === null) {
    reporter.note('No Chrome found, so the playground tests did not run; CHROME names the Chrome to use.');
    return;
  }
  const started = performance.now();
  let server = null;
  let chrome = null;
  let page = null;
  try {
    server = await serve(ROOT);
    chrome = await launch(executable);
    page = await connect(chrome.debugUrl);
    await prepare(page);
  } catch (error) {
    reporter.result('playground: Chrome starts and opens the playground', performance.now() - started, problemOf(error));
    if (chrome) await chrome.close();
    if (server) await server.close();
    return;
  }
  try {
    const base = `${server.url}playground/`;
    for (const [name, test] of wanted) {
      const begun = performance.now();
      let problem = null;
      try {
        await test(page, base);
      } catch (error) {
        problem = problemOf(error);
      }
      reporter.result(`playground: ${name}`, performance.now() - begun, problem);
    }
  } finally {
    page.close();
    await chrome.close();
    await server.close();
  }
}

async function main(argv) {
  let pattern = null;
  const sections = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '-k') pattern = argv[++i];
    else if (SECTIONS.includes(argv[i])) sections.push(argv[i]);
    else {
      console.error(`unknown argument ${argv[i]}; sections are ${SECTIONS.join(', ')}`);
      return 1;
    }
  }
  const reporter = new Reporter(pattern);
  console.log(paint('2', `eyemind ${VERSION} on Node.js ${process.versions.node}`));
  const tests = await moduleTests();
  const pooled = ['unit', 'examples'].filter((section) => !sections.length || sections.includes(section));
  if (pooled.length) await runPool(reporter, tests, pooled);
  for (const section of SECTIONS) {
    if ((sections.length && !sections.includes(section)) || pooled.includes(section)) continue;
    reporter.section(section);
    if (section === 'conformance') runInProcess(reporter);
    else if (section === 'cli') await runThroughCommandLine(reporter);
    else if (section === 'playground') await runPlayground(reporter);
    reporter.endSection(section);
  }
  return reporter.finish();
}

if (process.env.EYEMIND_TEST_WORKER === '1') await serveTests();
else process.exitCode = await main(process.argv.slice(2));
