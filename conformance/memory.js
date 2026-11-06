// Run the real command line with one case's files in memory. Each invocation
// gets a new host, so cases cannot supply files to one another.
import { main } from '../src/cli.js';
import { shellSplit } from './cases.js';

export function executeMemory(item) {
  const out = [];
  const err = [];
  const code = main(shellSplit(item.args), {
    stdin: () => item.stdin ?? '',
    stdout: (text) => out.push(text),
    stderr: (text) => err.push(text),
    readFile(path) {
      if (Object.hasOwn(item.files, path)) return item.files[path];
      const error = new Error(`no such file in the conformance case: ${path}`);
      error.code = 'ENOENT';
      throw error;
    },
  });
  return [code, out.join(''), err.join('')];
}
