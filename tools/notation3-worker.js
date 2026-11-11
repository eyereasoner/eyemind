// A reusable process for the Notation3 scorer. Each message runs the same
// entry point as bin/eyemind.js, with its own program and output buffers.
import { main } from '../src/cli.js';
import { nodeIO } from '../src/node.js';

process.on('message', (file) => {
  const out = [];
  const err = [];
  let code;
  try {
    code = main([file], {
      ...nodeIO,
      stdout: (text) => out.push(text),
      stderr: (text) => err.push(text),
      stdin: () => '',
    });
  } catch (error) {
    // An unexpected exception is an error exit from the actual command too.
    code = 1;
    err.push(`${error.stack ?? error}\n`);
  }
  process.send({ code, signal: null, out: out.join(''), err: err.join('') });
});
