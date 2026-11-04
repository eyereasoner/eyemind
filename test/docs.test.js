// Runnable documentation stays tied to what eyemind does.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkReport, loadText, run } from '../src/index.js';
import { loadCases } from '../conformance/run.js';
import { ROOT, assert, cli } from './helpers.js';

const document = (path) => readFileSync(join(ROOT, path), 'utf8');

// The code blocks of one section, by language.
function blocks(path, heading, language = 'js') {
  const section = document(path).split(`${heading}\n`)[1].split(/\n#{2,6} /)[0];
  return [...section.matchAll(new RegExp(`^\`\`\`${language}\\n([\\s\\S]*?)^\`\`\``, 'gm'))].map((match) => match[1]);
}

// The anchor GitHub and the site's kramdown give a heading.
const slug = (title) => title.trim().toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, '').replace(/ /g, '-');

export const tests = {
  'the spec appendix output proof and report match the program'() {
    const [source, output, proof, report] = blocks('SPEC.md', '## Appendix B. Example');
    const program = loadText(source);
    assert.equal(run(program).stdout, output);
    const result = run(program, { proof: true });
    assert.equal(result.proof, proof);
    assert.equal(checkReport(result.proofReport), report);
  },

  'the guide contents list every section, and every link within the guide has a heading'() {
    const guide = document('GUIDE.md');
    const headings = [...guide.matchAll(/^(#{2,3}) (.+)$/gm)].filter((match) => match[2] !== 'Contents');
    const contents = guide.split('## Contents\n')[1].split(/\n## /)[0];
    const listed = [...contents.matchAll(/^( *)- \[(.+)\]\(#([^)]+)\)$/gm)];
    assert.deepEqual(
      listed.map(([, indent, title, anchor]) => [indent.length / 2 + 2, title, anchor]),
      headings.map(([, hashes, title]) => [hashes.length, title, slug(title)]),
    );
    const anchors = new Set([...guide.matchAll(/^#{1,6} (.+)$/gm)].map((match) => slug(match[1])));
    for (const [, anchor] of guide.matchAll(/\]\(#([^)]+)\)/g)) assert.ok(anchors.has(anchor), `#${anchor} names no heading`);
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

  'the guide derives conjunction templates with local variables'() {
    const [source] = blocks('GUIDE.md', '### Deriving rules');
    const result = run(loadText(source), { proof: true });
    assert.deepEqual(result.answers, ["and(known('demo', 'a'), available('demo', 'a'))"]);
    assert.ok(result.proofReport.valid);
  },

  'the guide inspects a rule and preserves its shared variable'() {
    const [source] = blocks('GUIDE.md', '### Inspecting rules');
    const result = run(loadText(source), { proof: true });
    assert.deepEqual(result.answers, ['test(a(A), c(A))']);
    assert.ok(result.proofReport.valid);
  },

  async 'the guide library example runs with the documented results'() {
    const [source] = blocks('GUIDE.md', '## JavaScript library');
    const logged = [];
    const saved = console.log;
    console.log = (value) => logged.push(value);
    try {
      const module = `data:text/javascript,${encodeURIComponent(source.replace("from 'eyemind'", `from ${JSON.stringify(new URL('../src/index.js', import.meta.url).href)}`))}`;
      await import(module);
    } finally {
      console.log = saved;
    }
    assert.deepEqual(logged, [["mortal('socrates')"], [{ X: "'socrates'" }], true]);
  },

  'documented example and conformance counts match the manifests'() {
    const count = JSON.parse(document('examples/manifest.json')).length;
    assert.match(document('README.md'), new RegExp(`\\b${count} runnable programs`));
    assert.match(document('GUIDE.md'), new RegExp(`is ${count} complete programs`));
    assert.match(document('README.md'), new RegExp(`\\b${loadCases().length} cases that test`));
  },

  'the example catalog links every deck before its source program'() {
    const manifest = JSON.parse(document('examples/manifest.json'));
    const rows = document('examples/README.md').split('\n').filter((line) => line.startsWith('| ['))
      .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));
    assert.deepEqual(rows, manifest.sort((a, b) => a.name.localeCompare(b.name, 'en')).map(({ name, description }) => [
      `[${name}](https://eyereasoner.github.io/eyemind/examples/deck/${name})`,
      `[${name}.js](https://github.com/eyereasoner/eyemind/blob/main/examples/${name}.js)`,
      description,
    ]));
    assert.ok(document('README.md').includes('**[Examples](https://eyereasoner.github.io/eyemind/examples/)**'));
  },
};
