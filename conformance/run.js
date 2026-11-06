#!/usr/bin/env node
// Run the eyemind conformance suite against an implementation.
//
//     node conformance/run.js                          every case, in this process
//     node conformance/run.js --command "my-eyemind"    against another implementation
//     node conformance/run.js -k skolem 07-reasoning.js
//
// The case format is described in conformance/README.md.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { main as cliMain } from '../src/cli.js';
import { check, parseCases, shellSplit } from './cases.js';
import { nodeIO } from '../src/node.js';

export const HERE = dirname(fileURLToPath(import.meta.url));
export { check, parseCases, shellSplit } from './cases.js';

export function parse(path) {
  return parseCases(readFileSync(path, 'utf8'), path);
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
// Without a command, eyemind runs in this process.
export function execute(item, command = null) {
  const directory = mkdtempSync(join(tmpdir(), 'eyemind-conformance-'));
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

export const CASE_FILES = () => readdirSync(HERE).filter((name) => /^\d.*\.js$/.test(name)).sort();
