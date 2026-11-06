// The browser uses the same case grammar, comparisons and command line as
// the Node suite, with a fresh in-memory file host for each case.
import { parseCases, check } from './cases.js';
import { executeMemory } from './memory.js';
import { VERSION } from '../src/version.js';

let cases = [];
self.onmessage = ({ data }) => {
  try {
    if (data.type === 'load') {
      cases = data.files.flatMap(({ file, text }) => parseCases(text, file).map((item) => ({ ...item, file })));
      self.postMessage({ type: 'loaded', version: VERSION, cases });
    } else if (data.type === 'run') {
      const started = performance.now();
      const item = cases[data.index];
      const [code, stdout, stderr] = executeMemory(item);
      self.postMessage({ type: 'result', index: data.index, code, stdout, stderr,
        problems: check(item, code, stdout, stderr), milliseconds: performance.now() - started });
    }
  } catch (error) {
    if (data.type === 'run') {
      self.postMessage({ type: 'result', index: data.index, code: null, stdout: '', stderr: String(error),
        problems: [`The case could not run: ${error.message ?? error}`], milliseconds: 0 });
    } else self.postMessage({ type: 'failed', error: error.message ?? String(error) });
  }
};
self.postMessage({ type: 'ready' });
