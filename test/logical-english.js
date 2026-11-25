// The examples of Logical English 2 (LogicalContractsOrg/LogicalEnglish2,
// examples/moreExamples) that state the answers their queries must give in
// their scenarios. Each file is one case: it passes when eyemind gives every
// expected answer set it compares. A file that uses a feature LE-SPEC.md
// lists as unsupported, or that LS rejects for a negation on a dependency
// cycle, is not passed; any other error or answer fails.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { compileLe, run, writeLe } from '../src/index.js';
import { cachePaths } from '../tools/test-cache.js';

export const LE_SOURCE = 'https://github.com/LogicalContractsOrg/LogicalEnglish2';
export const LE_PATH = 'examples/moreExamples';

// Files whose upstream text eyemind reads differently, and why. A listed file
// that passes fails the run, so that the list stays current.
export const KNOWN = {
  'AItest.le': 'a scenario fact matches no declared template',
  'domains/tax/4_affiliates_3.le': "its queries use LE1's predefined affiliation templates with who and which",
  'domains/tax/gstturnover.le': 'a formula names Sales Associates where the rule introduced Sales_Associates',
};

const UNSUPPORTED = /not supported|unstratified negation/;

export function leCases({ mirror = cachePaths().le } = {}) {
  const root = join(mirror, LE_PATH), cases = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.le') && /\bexpects\b/.test(readFileSync(path, 'utf8'))) {
        cases.push({ id: relative(root, path).split(sep).join('/'), path });
      }
    }
  };
  walk(root);
  return cases;
}

// { status: 'passed' | 'unsupported' | 'known' | 'failed', message, ms }.
export function scoreLeCase(c) {
  const started = performance.now();
  const done = (status, message = '') => ({ status, message, ms: performance.now() - started });
  let status, message = '';
  try {
    const loaded = compileLe([[readFileSync(c.path, 'utf8'), c.id]]);
    const compared = loaded.compiled.expectations.filter((e) => !e.unknowns.length).length;
    const output = writeLe(run(loaded.program, { maxInferences: 10_000_000 }), loaded);
    const wrong = output.split('\n').filter((line) => line.startsWith('% not as expected'));
    if (!compared) [status, message] = ['unsupported', 'every expectation rests on unknowns'];
    else if (wrong.length) [status, message] = ['failed', wrong.join('\n')];
    else status = 'passed';
  } catch (error) {
    message = error?.message ?? String(error);
    status = UNSUPPORTED.test(message) ? 'unsupported' : 'failed';
  }
  if (c.id in KNOWN) {
    return status === 'passed' ? done('failed', `listed as a known difference (${KNOWN[c.id]}) but passes`) : done('known', KNOWN[c.id]);
  }
  return done(status, message);
}
