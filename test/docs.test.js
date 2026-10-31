// Runnable documentation stays tied to what eyecode does.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkReport, loadText, run } from '../src/index.js';
import { ROOT, assert, cli } from './helpers.js';

const document = (path) => readFileSync(join(ROOT, path), 'utf8');

// The code blocks of one section, by language.
function blocks(path, heading, language = 'js') {
  const section = document(path).split(`${heading}\n`)[1].split(/\n#{2,6} /)[0];
  return [...section.matchAll(new RegExp(`^\`\`\`${language}\\n([\\s\\S]*?)^\`\`\``, 'gm'))].map((match) => match[1]);
}

export const tests = {
  'the spec appendix output proof and report match the program'() {
    const [source, output, proof, report] = blocks('SPEC.md', '## Appendix B. Example');
    const program = loadText(source);
    assert.equal(run(program).stdout, output);
    const result = run(program, { proof: true });
    assert.equal(result.proof, proof);
    assert.equal(checkReport(result.proofReport), report);
  },

  'the guide report is the socrates report'() {
    const [report] = blocks('GUIDE.md', '## Proofs, and what checking one means');
    assert.equal(report, document('examples/check/socrates.js'));
  },

  'the guide first program concludes what it says'() {
    const [source] = blocks('GUIDE.md', '## Your first program');
    assert.deepEqual(run(loadText(source)).answers, ["related('alice', 'carol')"]);
  },

  'the guide unused clauses are what --unused lists'() {
    const [source] = blocks('GUIDE.md', '## Checking the translation');
    const [listing] = blocks('GUIDE.md', '## Checking the translation', 'text');
    assert.equal(cli(['--unused'], source).stdout, listing.split('\n').slice(1).join('\n'));
  },

  async 'the guide library example runs with the documented results'() {
    const [source] = blocks('GUIDE.md', '## JavaScript library');
    const logged = [];
    const saved = console.log;
    console.log = (value) => logged.push(value);
    try {
      const module = `data:text/javascript,${encodeURIComponent(source.replace("from '@josd/eyecode'", `from ${JSON.stringify(new URL('../src/index.js', import.meta.url).href)}`))}`;
      await import(module);
    } finally {
      console.log = saved;
    }
    assert.deepEqual(logged, [["mortal('socrates')"], [{ X: "'socrates'" }], true]);
  },

  'documented example counts match the manifest'() {
    const count = JSON.parse(document('examples/manifest.json')).length;
    assert.match(document('README.md'), new RegExp(`\\b${count} runnable programs`));
    assert.match(document('GUIDE.md'), new RegExp(`is ${count} complete programs`));
  },
};
