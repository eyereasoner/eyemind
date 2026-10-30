#!/usr/bin/env node
// Run the eyelit conformance suite against an implementation.
//
//     node conformance/run.js                          every case, in this process
//     node conformance/run.js --command "my-eyelit"    against another implementation
//     node conformance/run.js -k skolem 07-reasoning.txt
//
// The case format is described in conformance/README.md.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { main as cliMain } from '../src/cli.js';
import { nodeIO } from '../src/node.js';

export const HERE = dirname(fileURLToPath(import.meta.url));
const WILDCARD = '…';

class Case {
  constructor(name, path, line) {
    this.name = name;
    this.path = path;
    this.line = line;
    this.spec = '';
    this.args = 'program.js';
    this.exit = 0;
    this.stderr = null; // null: not checked; 'empty', 'nonempty', 'json' or 'prefix ...'
    this.stdoutMode = 'exact';
    this.files = {};
    this.stdin = null;
    this.stdout = null;
    this.stdoutLiteral = false;
  }

  get where() {
    return `${basename(this.path)}:${this.line}`;
  }
}

// The cases of one file: '=== name' starts a case, 'key: value' lines set its
// options, and '--- block' starts a block that runs to the next marker.
export function parse(path) {
  const cases = [];
  let current = null;
  let block = null;
  let lines = [];
  const closeBlock = () => {
    if (current === null || block === null) return;
    const text = lines.length ? `${lines.join('\n')}\n` : '';
    if (block === 'stdin') {
      current.stdin = text;
    } else if (block === 'stdout' || block === 'stdout json') {
      current.stdout = text;
      if (block === 'stdout json') current.stdoutMode = 'json';
    } else {
      current.files[block] = text;
    }
  };
  const source = readFileSync(path, 'utf8').split('\n');
  if (source.length && source[source.length - 1] === '') source.pop();
  source.forEach((line, index) => {
    const number = index + 1;
    if (line.startsWith('=== ')) {
      closeBlock();
      block = null;
      lines = [];
      current = new Case(line.slice(4).trim(), path, number);
      cases.push(current);
    } else if (line.startsWith('--- ')) {
      closeBlock();
      block = line.slice(4).trim();
      lines = [];
    } else if (block !== null) {
      lines.push(line);
    } else if (current !== null && line.trim() && !line.startsWith('#')) {
      const colon = line.indexOf(':');
      const key = line.slice(0, colon).trim();
      const value = line.slice(colon + 1).trim();
      if (key === 'spec') current.spec = value;
      else if (key === 'args') current.args = value;
      else if (key === 'exit') current.exit = Number(value);
      else if (key === 'stderr') current.stderr = value;
      else if (key === 'stdout' && value === 'nonempty') current.stdoutMode = 'nonempty';
      else if (key === 'stdout-literal') {
        // Exact output that a block cannot show, such as empty lines.
        current.stdout = JSON.parse(value);
        current.stdoutLiteral = true;
      } else throw new Error(`${path}:${number}: unknown key ${key}`);
    }
  });
  closeBlock();
  // Trailing empty lines separate cases in the file; they are not content.
  const trim = (text) => (text.trim() ? `${text.replace(/\n+$/, '')}\n` : '');
  for (const item of cases) {
    for (const name of Object.keys(item.files)) item.files[name] = trim(item.files[name]);
    if (item.stdin !== null) item.stdin = trim(item.stdin);
    if (item.stdout !== null && !item.stdoutLiteral) item.stdout = trim(item.stdout);
  }
  return cases;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lineMatches(expected, actual) {
  if (!expected.includes(WILDCARD)) return expected === actual;
  const pattern = expected.split(WILDCARD).map(escapeRegExp).join('[\\s\\S]*');
  return new RegExp(`^${pattern}$`).test(actual);
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// null when the output is as expected, otherwise a description.
function compareStdout(item, actual) {
  if (item.stdoutMode === 'nonempty') return actual.trim() ? null : 'expected output on standard output';
  if (item.stdout === null) return null;
  if (item.stdoutMode === 'json') {
    let parsed;
    try {
      parsed = JSON.parse(actual);
    } catch (error) {
      return `standard output is not JSON: ${error.message}`;
    }
    if (sameJson(parsed, JSON.parse(item.stdout))) return null;
    return `JSON differs:\n  expected ${item.stdout.trim()}\n  actual   ${actual.trim()}`;
  }
  const expected = item.stdout.split('\n');
  const got = actual.split('\n');
  if (expected.length === got.length && expected.every((line, i) => lineMatches(line, got[i]))) return null;
  for (let i = 0; i < Math.min(expected.length, got.length); i++) {
    if (!lineMatches(expected[i], got[i])) return `line ${i + 1} differs:\n  expected ${expected[i]}\n  actual   ${got[i]}`;
  }
  return `expected ${expected.length - 1} lines, got ${got.length - 1}:\n  expected ${JSON.stringify(item.stdout)}\n  actual   ${JSON.stringify(actual)}`;
}

export function check(item, code, stdout, stderr) {
  const problems = [];
  if (code !== item.exit) {
    problems.push(`exit code ${code}, expected ${item.exit}${stderr.trim() ? `; stderr: ${stderr.trim().slice(0, 300)}` : ''}`);
  }
  const difference = compareStdout(item, stdout);
  if (difference) problems.push(difference);
  if (item.stderr === 'empty' && stderr) {
    problems.push(`expected no standard error, got: ${stderr.trim().slice(0, 300)}`);
  } else if (item.stderr === 'nonempty' && !stderr.trim()) {
    problems.push('expected a message on standard error');
  } else if (item.stderr && item.stderr.startsWith('prefix ')) {
    const prefix = item.stderr.slice('prefix '.length);
    if (!stderr.startsWith(prefix)) problems.push(`expected standard error to start with ${JSON.stringify(prefix)}, got: ${stderr.trim().slice(0, 300)}`);
  } else if (item.stderr === 'json') {
    try {
      JSON.parse(stderr);
    } catch {
      problems.push(`standard error is not JSON: ${stderr.trim().slice(0, 300)}`);
    }
  }
  return problems;
}

// Words of a command line, split as a POSIX shell splits them.
export function shellSplit(text) {
  const words = [];
  let word = null;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      if (word !== null) words.push(word);
      word = null;
      i++;
    } else if (ch === "'") {
      const end = text.indexOf("'", i + 1);
      if (end < 0) throw new Error(`unterminated quote in ${text}`);
      word = (word ?? '') + text.slice(i + 1, end);
      i = end + 1;
    } else if (ch === '"') {
      let out = '';
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\' && i + 1 < text.length && '"\\$`\n'.includes(text[i + 1])) {
          out += text[i + 1];
          i += 2;
        } else {
          out += text[i];
          i++;
        }
      }
      if (i >= text.length) throw new Error(`unterminated quote in ${text}`);
      word = (word ?? '') + out;
      i++;
    } else if (ch === '\\' && i + 1 < text.length) {
      word = (word ?? '') + text[i + 1];
      i += 2;
    } else {
      word = (word ?? '') + ch;
      i++;
    }
  }
  if (word !== null) words.push(word);
  return words;
}

function runInProcess(item, directory) {
  const out = [];
  const err = [];
  const previous = process.cwd();
  process.chdir(directory);
  let code;
  try {
    code = cliMain(shellSplit(item.args), {
      ...nodeIO,
      stdout: (text) => out.push(text),
      stderr: (text) => err.push(text),
      stdin: () => item.stdin ?? '',
    });
  } finally {
    process.chdir(previous);
  }
  return [code, out.join(''), err.join('')];
}

function runSubprocess(item, command, directory) {
  const [program, ...rest] = shellSplit(command);
  const result = spawnSync(program, [...rest, ...shellSplit(item.args)], {
    cwd: directory, input: item.stdin ?? '', encoding: 'utf8', timeout: 300000,
  });
  return [result.status, result.stdout, result.stderr];
}

// Run a case in a directory of its own: its exit code, stdout and stderr.
// Without a command, eyelit runs in this process.
export function execute(item, command = null) {
  const directory = mkdtempSync(join(tmpdir(), 'eyelit-conformance-'));
  try {
    for (const [name, text] of Object.entries(item.files)) {
      const path = join(directory, name);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, text);
    }
    return command === null ? runInProcess(item, directory) : runSubprocess(item, command, directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

// The problems a case found, empty when it passed.
export function runCase(item, command = null) {
  return check(item, ...execute(item, command));
}

// The case files, in order, with the SPEC sections and topic of each.
export function readManifest() {
  return JSON.parse(readFileSync(join(HERE, 'manifest.json'), 'utf8'));
}

function caseFiles(names) {
  if (names.length) return names.map((name) => (isAbsolute(name) ? name : join(HERE, basename(name))));
  return readManifest().map((entry) => join(HERE, entry.file));
}

export function loadCases(names = [], pattern = null) {
  let cases = caseFiles(names).flatMap(parse);
  if (pattern) cases = cases.filter((item) => item.name.toLowerCase().includes(pattern.toLowerCase()));
  return cases;
}

function mainCommand(argv) {
  const files = [];
  let command = null;
  let pattern = null;
  let verbose = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--command') command = argv[++i];
    else if (argv[i] === '-k') pattern = argv[++i];
    else if (argv[i] === '-v' || argv[i] === '--verbose') verbose = true;
    else files.push(argv[i]);
  }
  const cases = loadCases(files, pattern);
  let failed = 0;
  for (const item of cases) {
    const problems = runCase(item, command);
    if (problems.length) {
      failed++;
      console.log(`FAIL ${item.where} ${item.name} [SPEC ${item.spec}]`);
      for (const problem of problems) console.log(`     ${problem.replace(/\n/g, '\n     ')}`);
    } else if (verbose) {
      console.log(`ok   ${item.where} ${item.name}`);
    }
  }
  console.log(`${cases.length - failed} of ${cases.length} cases passed`);
  return failed ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = mainCommand(process.argv.slice(2));
}

export const CASE_FILES = () => readdirSync(HERE).filter((name) => name.endsWith('.txt')).sort();
