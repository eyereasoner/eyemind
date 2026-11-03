// What the program loader and the command line need from Node: files, and
// syntax errors with their line.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { EyemindError } from './terms.js';

export const nodeIO = {
  readFile: (path) => readFileSync(path, 'utf8'),
  checkSyntax(source, filename) {
    try {
      // Parsed only, never run: a script with the program's source.
      new vm.Script(source, { filename }); // eslint-disable-line no-new
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      const match = String(error.stack).match(/:(\d+)\n/);
      const where = match ? `line ${match[1]}: ` : '';
      throw new EyemindError(`${where}${error.message}`);
    }
  },
};

