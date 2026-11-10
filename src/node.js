// What the program loader and the command line need from Node: files, and
// syntax errors with their line.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { EyemindError } from './terms.js';

export const nodeIO = {
  readFile: (path) => readFileSync(path, 'utf8'),
  // The loader is synchronous. Fetch in a child before compilation, with
  // bounds on its time and output; no I/O happens during proof checking.
  readDocument(iri) {
    if (!/^https?:/.test(iri)) throw new EyemindError('a remote document needs an HTTP or HTTPS IRI');
    // The test suite pins remote inputs. A missing fixture is an error,
    // so an offline run can never silently fall back to the network.
    if (process.env.EYEMIND_N3_DOCUMENTS) {
      const fixtures = JSON.parse(readFileSync(process.env.EYEMIND_N3_DOCUMENTS, 'utf8'));
      const document = fixtures[iri.replace(/#.*$/, '')];
      if (!document) throw new EyemindError(`no saved N3 document for ${iri}`);
      if (document.error !== undefined) throw new EyemindError(document.error);
      if (typeof document.text !== 'string') throw new EyemindError(`invalid saved N3 document for ${iri}`);
      return document.text;
    }
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
      try {
        const response = await fetch(process.argv[1], { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        let size = 0;
        for await (const chunk of response.body) {
          size += chunk.byteLength;
          if (size > 16 * 1024 * 1024) throw new Error('document exceeds 16 MiB');
          process.stdout.write(chunk);
        }
      } catch (error) {
        process.stderr.write(error.message);
        process.exitCode = 1;
      }
    `, iri], { encoding: 'utf8', timeout: 11000, maxBuffer: 16 * 1024 * 1024 });
    if (child.error || child.status !== 0) throw new EyemindError(child.error?.message ?? child.stderr.trim());
    return child.stdout;
  },
  // The base IRI of a file, against which its relative IRIs resolve.
  fileIri: (path) => (path === '<stdin>' ? null : pathToFileURL(resolve(path)).href),
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

