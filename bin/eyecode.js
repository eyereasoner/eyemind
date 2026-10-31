#!/usr/bin/env node
// The eyecode command: reason over JavaScript rule programs.
import { readFileSync, writeSync } from 'node:fs';
import { main } from '../src/cli.js';
import { nodeIO } from '../src/node.js';

function write(fd, text) {
  // Written synchronously, so a large proof is complete before the exit.
  const buffer = Buffer.from(text, 'utf8');
  let offset = 0;
  while (offset < buffer.length) {
    try {
      offset += writeSync(fd, buffer, offset);
    } catch (error) {
      if (error.code === 'EAGAIN') continue;
      if (error.code === 'EPIPE') return;
      throw error;
    }
  }
}

const code = main(process.argv.slice(2), {
  ...nodeIO,
  stdout: (text) => write(1, text),
  stderr: (text) => write(2, text),
  stdin: () => readFileSync(0, 'utf8'),
});
process.exitCode = code;
