// Runnable documentation stays tied to what eyemind does.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkReport, loadText, run } from '../src/index.js';
import { loadCases, parseCases } from '../conformance/run.js';
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
  'every top navigation links conformance immediately after the specification'() {
    for (const path of ['_layouts/default.html', 'playground/index.html', 'playground/conformance.html']) {
      const nav = document(path).match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/)[1];
      assert.deepEqual([...nav.matchAll(/<a\b[^>]*>([^<]+)<\/a>/g)].map((m) => m[1]),
        ['Guide', 'Playground', 'Specification', 'Conformance', 'Repository ↗'], path);
      assert.match(nav, /href="[^"]*conformance[^"]*"/, path);
    }
    assert.match(document('README.md'), /https:\/\/eyereasoner\.github\.io\/eyemind\/playground\/conformance/);
  },

  'documents link the guide, the specification and the decks through GitHub Pages'() {
    for (const path of ['README.md', 'GUIDE.md', 'SPEC.md', 'conformance/README.md', 'examples/README.md']) {
      for (const [, target] of document(path).matchAll(/\]\(([^)#][^)]*)\)/g)) {
        assert.doesNotMatch(target, /^(?!https?:)(?:.*\/)?(?:SPEC|GUIDE)(?:\.md)?(?:#|$)|^(?!https?:).*\bdeck\//,
          `${path}: ${target} should be a https://eyereasoner.github.io/eyemind/ link`);
        assert.doesNotMatch(target, /^https:\/\/github\.com\/eyereasoner\/eyemind\/(?:blob|tree)\/main\/(?:SPEC\.md|GUIDE\.md|conformance\/?$)/, `${path}: ${target}`);
      }
    }
  },

  'the site pages link within the site and leave going back to the navigation'() {
    for (const path of ['playground/index.html', 'playground/conformance.html']) {
      const page = document(path).replace(/<nav\b[\s\S]*?<\/nav>/, '');
      assert.doesNotMatch(page, />\s*Back to\b/i, path);
      assert.doesNotMatch(page, /href="https:\/\/github\.com\/eyereasoner\/eyemind\/tree\/main\/conformance/, path);
    }
    assert.match(document('playground/conformance.html'), /<a href="\.\.\/conformance\/">conformance suite<\/a>/);
  },

  'consecutive lines with inline comments align them in one column'() {
    const sources = ['README.md', 'GUIDE.md', 'SPEC.md', 'AGENTS.md', 'conformance/README.md', 'examples/README.md',
      ...['src', 'bin', 'tools', 'test', 'conformance'].flatMap((dir) => readdirSync(join(ROOT, dir))
        .filter((name) => /\.m?js$/.test(name)).map((name) => `${dir}/${name}`))];
    for (const path of sources) {
      let run = [];
      const check = () => {
        if (new Set(run.map(([, column]) => column)).size > 1) assert.fail(`${path}:${run[0][0]}: inline comments are not aligned`);
        run = [];
      };
      document(path).split('\n').forEach((line, index) => {
        const match = /^(\s*\S.*?\S)( +)(#|\/\/) /.exec(line);
        if (match && !/^\s*(#|\/\/)/.test(line) && !/:\/\/$/.test(match[1] + match[2] + match[3])) {
          run.push([index + 1, match[1].length + match[2].length]);
        } else check();
      });
      check();
    }
  },

  'the specification defines the conformance manifest and every setting the cases use'() {
    const section = document('SPEC.md').split('### 14.1 Conformance test suite\n')[1].split(/\n## /)[0];
    const defined = new Set([...section.matchAll(/^\| `([a-z_]+)\(/gm)].map((match) => match[1]));
    assert.deepEqual([...defined].sort(),
      ['args', 'exit', 'file', 'spec', 'stderr', 'stdin', 'stdout', 'stdout_json', 'stdout_text']);
    const manifest = JSON.parse(document('conformance/manifest.json'));
    for (const entry of manifest) {
      assert.deepEqual(Object.keys(entry).sort(), ['file', 'spec', 'topic'], JSON.stringify(entry));
      assert.ok(Object.values(entry).every((value) => typeof value === 'string'), JSON.stringify(entry));
    }
    // Settings stand at the start of a case's lines, indented by two spaces.
    for (const { file } of manifest) {
      for (const [, name] of document(`conformance/${file}`).matchAll(/^ {2}([a-z_]+)\(/gm)) {
        assert.ok(defined.has(name), `${file}: ${name} is not a setting SPEC Section 14.1 defines`);
      }
    }
    assert.throws(() => parseCases("conformance('x', [timeout(1)])"), /unknown setting timeout\/1/);
  },

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
    assert.ok(document('README.md').includes('[Examples](https://eyereasoner.github.io/eyemind/examples/)'));
  },
};
