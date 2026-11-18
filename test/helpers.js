// What the tests share: programs from source text, certified runs, the
// command line, and assertions.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main } from '../src/cli.js';
import { checkProof, loadText, run } from '../src/index.js';
import { nodeIO } from '../src/node.js';

export const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
export { assert };

export function program(source) {
  return loadText(source, '<program>', nodeIO);
}

// Run with a proof, check it independently and return the result.
export function proven(source, options = {}) {
  const prog = typeof source === 'string' ? program(source) : source;
  const result = run(prog, { ...options, proof: true });
  const goals = options.goals ?? (options.goal != null ? [options.goal] : null);
  const report = checkProof(prog, result.proof, { goals });
  assert.ok(report.valid, JSON.stringify(report.failures));
  return result;
}

// The command line, run in this process: what the eyemind command does with
// these arguments and standard input, from the repository, with Node's file
// access. Starting Node for each call would cost far more than most calls
// take. An error main does not report itself ends the command with code 1.
export function cli(args, stdin = '') {
  const out = [];
  const err = [];
  const previous = process.cwd();
  process.chdir(ROOT);
  try {
    const code = main(args, {
      ...nodeIO,
      stdout: (text) => out.push(text),
      stderr: (text) => err.push(text),
      stdin: () => stdin,
    });
    return { code, stdout: out.join(''), stderr: err.join('') };
  } catch (error) {
    return { code: 1, stdout: out.join(''), stderr: `${err.join('')}${error && error.stack ? error.stack : error}\n` };
  } finally {
    process.chdir(previous);
  }
}

// The eyemind command as a process of its own, for what only a process
// shows: its standard streams, a pipe between two runs, and its exit code.
export function command(args, stdin = '') {
  const result = spawnSync(process.execPath, [join(ROOT, 'bin', 'eyemind.js'), ...args], {
    cwd: ROOT, input: stdin, encoding: 'utf8',
  });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

// The message of the error fn throws, failing when it throws none.
export function errorOf(fn) {
  try {
    fn();
  } catch (error) {
    return error.message;
  }
  assert.fail('expected an error');
}

export function throwsMatching(fn, pattern) {
  assert.match(errorOf(fn), pattern);
}
