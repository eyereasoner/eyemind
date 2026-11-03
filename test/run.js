#!/usr/bin/env node
// Every test of eyemind in one run, one numbered line per test: npm test
//
//     npm test                       unit tests, examples, conformance in process,
//                                    its command-line cases through the command,
//                                    and the playground in a headless Chrome
//     npm test -- unit examples      only these sections
//     npm test -- -k skolem          only tests whose line contains "skolem"
//
// Sections: unit, examples, conformance, cli, playground. The playground
// section needs Chrome (CHROME names it when it is not on the PATH); without
// one it says so and runs nothing. Each test prints OK or FAIL, its
// number, what it tests and how long it took; each section and the whole run
// end with a total. The exit code is 1 when a test failed.
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
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
  // empty does not show.
  section(name) {
    this.heading = name;
    this.sectionStart = [performance.now(), this.passed, this.total];
  }

  endSection(name) {
    const [started, passed, total] = this.sectionStart;
    if (this.total === total) return;
    this.summary(this.passed - passed, this.total - total, COUNTED[name], performance.now() - started);
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

async function runTests(reporter, tests) {
  for (const [, label, fn] of tests) {
    if (!reporter.wanted(label)) continue;
    const started = performance.now();
    let problem = null;
    try {
      await fn();
    } catch (error) {
      problem = problemOf(error);
    }
    reporter.result(label, performance.now() - started, problem);
  }
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

// The cases of 14-command-line.js, about options, standard input, errors and
// exit codes, each through the eyemind command as a process of its own, so
// they run side by side; results are reported in case order. Every case also
// runs in process, through the same main, and starting Node for each costs
// more than most cases take: node conformance/run.js --command "node
// bin/eyemind.js" runs them all through the command.
async function runThroughCommandLine(reporter) {
  const { mkdtempSync, mkdirSync, rmSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const cases = casesFor(reporter).filter((item) => item.where.startsWith('14-command-line.js:'));
  const outcomes = new Array(cases.length);
  let next = 0;
  const one = (item) => new Promise((resolve) => {
    const directory = mkdtempSync(join(tmpdir(), 'eyemind-cli-'));
    for (const [name, text] of Object.entries(item.files)) {
      mkdirSync(dirname(join(directory, name)), { recursive: true });
      writeFileSync(join(directory, name), text);
    }
    const started = performance.now();
    const child = spawn(process.execPath, [join(ROOT, 'bin', 'eyemind.js'), ...shellSplit(item.args)], { cwd: directory });
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
  await Promise.all(Array.from({ length: Math.min(cpus().length || 4, 8) }, worker));
  cases.forEach((item, i) => reporter.result(`${item.where} ${item.name}`, ...outcomes[i]));
}

// The playground's tests, in order, on one page of a headless Chrome that
// loads playground.html from a server of the repository started here.
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
    const base = `${server.url}playground.html`;
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
  for (const section of SECTIONS) {
    if (sections.length && !sections.includes(section)) continue;
    reporter.section(section);
    if (section === 'conformance') runInProcess(reporter);
    else if (section === 'cli') await runThroughCommandLine(reporter);
    else if (section === 'playground') await runPlayground(reporter);
    else await runTests(reporter, tests.filter(([name]) => name === section));
    reporter.endSection(section);
  }
  return reporter.finish();
}

process.exitCode = await main(process.argv.slice(2));
