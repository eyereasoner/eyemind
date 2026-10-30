// What the tests share: programs from source text, certified runs, the
// command line, and assertions.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

export function cli(args, stdin = '') {
  const result = spawnSync(process.execPath, [join(ROOT, 'bin', 'eyelit.js'), ...args], {
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
