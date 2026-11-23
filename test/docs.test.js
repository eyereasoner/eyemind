// Runnable documentation stays tied to what eyemind does.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkReport, loadText, run } from '../src/index.js';
import { loadCases, parseCases } from '../conformance/run.js';
import { sourceFiles } from '../tools/corpus.js';
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
  'public descriptions name Logic Script as the language and eyemind as the reasoner'() {
    for (const path of ['README.md', 'LS-SPEC.md', 'LE-SPEC.md', 'AGENTS.md', 'examples/README.md', 'conformance/README.md']) {
      assert.match(document(path), /Logic Script \(LS\)/, path);
    }
    for (const path of ['package.json', '.zenodo.json']) {
      const metadata = JSON.parse(document(path));
      assert.match(metadata.description, /Logic Script \(LS\)/, path);
      assert.match(metadata.description, /reasoner/, path);
    }
    assert.equal(JSON.parse(document('package.json')).name, 'eyemind');
    assert.match(cli(['--help']).stdout, /Logic Script \(LS\) programs use JavaScript syntax/);
    assert.match(document('_layouts/default.html'), /eyemind · Logic Script with checked proofs/);
  },

  async 'the package entry points give the functions the guide lists'() {
    const entries = { rdf: ['parseRdf', 'writeRdf'], messages: ['parseRdfMessages', 'RdfMessageReader'],
      formats: ['loadInputs', 'loadMessageReasoner'], cli: ['main'], qudt: ['unitConversion', 'quantityKinds'] };
    const readme = document('README.md');
    for (const [entry, names] of Object.entries(entries)) {
      const module = await import(`eyemind/${entry}`);
      for (const name of names) {
        assert.equal(typeof module[name], 'function', `eyemind/${entry} ${name}`);
        assert.ok(readme.includes(`\`${name}`), `README lists ${name}`);
      }
    }
  },

  'the guide and command help list the same options and aliases'() {
    const guide = document('README.md').split('## Command line\n')[1].split('### Resource limits\n')[0];
    const options = guide.split('\n').filter((line) => line.startsWith('| `')).map((line) => line.split('|')[1]).join('\n');
    const flags = (text) => [...new Set(text.match(/--[a-z0-9-]+|(?<![\w-])-[a-z]\b/g))].sort();
    assert.deepEqual(flags(options), flags(cli(['--help']).stdout));
  },

  'every top navigation links examples and conformance around the specification'() {
    for (const path of ['_layouts/default.html', 'playground/index.html', 'playground/conformance.html']) {
      const nav = document(path).match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/)[1];
      assert.deepEqual([...nav.matchAll(/<a\b[^>]*>([^<]+)<\/a>/g)].map((m) => m[1]),
        ['Playground', 'Examples', 'Specification', 'Conformance', 'Book', 'Repository ↗'], path);
      assert.match(nav, /href="[^"]*examples\/[^"]*"/, path);
      assert.match(nav, /href="[^"]*conformance[^"]*"/, path);
      assert.match(nav, /href="[^"]*BOOK[^"]*"/, path);
    }
    assert.match(document('README.md'), /https:\/\/eyereasoner\.github\.io\/eyemind\/playground\/conformance/);
  },

  'the guide is the README at the site root, which every logo links'() {
    assert.ok(!existsSync(join(ROOT, 'GUIDE.md')));
    assert.match(document('_layouts/default.html'), /<a class="brand" href="\{\{ '\/' \| relative_url \}\}"><img /);
    for (const path of ['playground/index.html', 'playground/conformance.html']) {
      assert.match(document(path), /<a class="home" href="\.\.\/" aria-label="eyemind home"><img /, path);
    }
  },

  'documents link the guide, the specification and the decks through GitHub Pages'() {
    for (const path of ['README.md', 'LS-SPEC.md', 'LE-SPEC.md', 'conformance/README.md', 'examples/README.md']) {
      for (const [, target] of document(path).matchAll(/\]\(([^)#][^)]*)\)/g)) {
        assert.doesNotMatch(target, /^(?!https?:)(?:.*\/)?(?:LS-SPEC|LE-SPEC|SPEC|GUIDE)(?:\.md)?(?:#|$)|^(?!https?:).*\bdeck\//,
          `${path}: ${target} should be a https://eyereasoner.github.io/eyemind/ link`);
        assert.doesNotMatch(target, /^https:\/\/github\.com\/eyereasoner\/eyemind\/(?:blob|tree)\/main\/(?:LS-SPEC\.md|LE-SPEC\.md|SPEC\.md|GUIDE\.md|conformance\/?$)/, `${path}: ${target}`);
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
    const sources = ['README.md', 'LS-SPEC.md', 'LE-SPEC.md', 'AGENTS.md', 'conformance/README.md', 'examples/README.md',
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

  'the specification keeps implementation interfaces in the guide'() {
    const spec = document('LS-SPEC.md');
    const headings = [...spec.matchAll(/^#{2,3} (.+)$/gm)].map((match) => match[1]);
    assert.ok(headings.includes('13. Conformance'));
    assert.ok(headings.includes('14. Security'));
    assert.ok(!headings.some((heading) => /Command.Line|JSON form|Unused clauses|Conformance test suite/.test(heading)));
    assert.doesNotMatch(spec, /`--[a-z]|halt code \d|50,000|8,388,608|2\^26|srl_execution|urn:eyemind:proof/);
    for (const heading of ['JSON check reports', 'Resource limits', 'Unused clauses']) {
      assert.ok(document('README.md').includes(`### ${heading}\n`), heading);
    }
  },

  'the harness guide defines the conformance manifest and every setting the cases use'() {
    const section = document('conformance/README.md').split('## Case format\n')[1].split(/\n## /)[0];
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
        assert.ok(defined.has(name), `${file}: ${name} is not a setting the harness guide defines`);
      }
    }
    assert.throws(() => parseCases("conformance('x', [timeout(1)])"), /unknown setting timeout\/1/);
  },

  'the spec appendix output proof and report match the program'() {
    const [source, output, proof, report] = blocks('LS-SPEC.md', '## Appendix B. Example');
    const program = loadText(source);
    assert.equal(run(program).stdout, output);
    const result = run(program, { proof: true });
    assert.equal(result.proof, proof);
    assert.equal(checkReport(result.proofReport), report);
  },

  'the guide contents list every section, and every link within the guide has a heading'() {
    const guide = document('README.md');
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

  'the specification links every section it mentions, and every link within it has a heading'() {
    const spec = document('LS-SPEC.md');
    const headings = [...spec.matchAll(/^(#{2,3}) (.+)$/gm)].filter((match) => match[2] !== 'Table of Contents');
    const contents = spec.split('## Table of Contents\n')[1].split(/\n---\n/)[0];
    const listed = [...contents.matchAll(/^( *)- \[(.+)\]\(#([^)]+)\)$/gm)];
    assert.deepEqual(
      listed.map(([, indent, title, anchor]) => [indent.length / 2 + 2, title, anchor]),
      headings.map(([, hashes, title]) => [hashes.length, title, slug(title)]),
    );
    const anchors = new Set([...spec.matchAll(/^#{1,6} (.+)$/gm)].map((match) => slug(match[1])));
    for (const [, anchor] of spec.matchAll(/\]\(#([^)]+)\)/g)) assert.ok(anchors.has(anchor), `#${anchor} names no heading`);
    // Prose outside headings, code blocks and code spans: a section or an
    // appendix it names is a link, written [Section 9.1](#...) or as
    // Sections [9.2](#...) and [9.4](#...).
    const prose = spec.split(/\n---\n/).slice(1).join('\n').replace(/^```[\s\S]*?^```$/gm, '').replace(/^#{1,6} .*$/gm, '')
      .replace(/``[\s\S]*?``|`[^`]*`/g, '').replace(/\[[^\]]*\]\(#[^)]+\)/g, '');
    assert.doesNotMatch(prose, /\bSections?\s+\d|\bAppendix [A-Z]\b/);
  },

  'the guide proof and report are the socrates proof and report'() {
    const [proof, report] = blocks('README.md', '## Proofs, and what checking one means');
    assert.equal(proof, document('examples/proof/socrates.js'));
    assert.equal(report, document('examples/check/socrates.js'));
  },

  'the guide first program concludes what it says'() {
    const [source] = blocks('README.md', '## Your first program');
    assert.deepEqual(run(loadText(source)).answers, ["related('alice', 'carol')"]);
  },

  'the guide unused clauses are what --unused lists'() {
    const [source] = blocks('README.md', '## Checking the translation');
    const [listing] = blocks('README.md', '## Checking the translation', 'text');
    assert.equal(cli(['--unused'], source).stdout, listing.split('\n').slice(1).join('\n'));
  },

  'the guide derives conjunction templates with local variables'() {
    const [source] = blocks('README.md', '### Deriving rules');
    const result = run(loadText(source), { proof: true });
    assert.deepEqual(result.answers, ["and(known('demo', 'a'), available('demo', 'a'))"]);
    assert.ok(result.proofReport.valid);
  },

  'the guide inspects a rule and preserves its shared variable'() {
    const [source] = blocks('README.md', '### Inspecting rules');
    const result = run(loadText(source), { proof: true });
    assert.deepEqual(result.answers, ['test(a(A), c(A))']);
    assert.ok(result.proofReport.valid);
  },

  async 'the guide library example runs with the documented results'() {
    const [source] = blocks('README.md', '## JavaScript library');
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
    assert.match(document('README.md'), new RegExp(`\\b${loadCases().length} cases that test`));
  },

  'the contents link to the topics and every example has its deck and input language'() {
    const manifest = JSON.parse(document('examples/manifest.json'));
    const catalog = document('examples/README.md');
    const [, contents, ...sections] = catalog.split(/^## /m);
    const topics = sections.map((section) => section.trim().split('\n\n'));
    assert.ok(topics.length > 1);
    assert.equal(new Set(topics.map(([title]) => slug(title))).size, topics.length);
    assert.deepEqual(contents.trim().split('\n'), ['Contents', '',
      ...topics.map(([title]) => `- [${title}](#${slug(title)})`)]);
    const rows = topics.flatMap(([, ...lists]) => lists.flatMap((list) => list.split('\n')));
    const expected = manifest.map((entry) => {
      const files = sourceFiles(entry);
      const deck = document(`examples/deck/${entry.name}.md`);
      const title = deck.match(/^# (.+)$/m)[1];
      for (const file of files) assert.ok(deck.includes(`/examples/${file})`), file);
      assert.ok(deck.includes(`/playground/#example=${entry.name})`), entry.name);
      const languages = { le: 'Logical English', n3: 'Notation3', srl: 'SPARQL 1.2 RL' };
      const native = files.find((file) => /\.(le|n3|srl)$/.test(file));
      const input = native ? languages[native.split('.').at(-1)]
        : files.some((file) => /\.(ttl|trig|nt|nq)$/.test(file)) ? 'RDF' : 'Logic Script';
      return `- [${title}](https://eyereasoner.github.io/eyemind/examples/deck/${entry.name}) (${input}) — ${entry.description}`;
    });
    assert.deepEqual(rows.sort(), expected.sort());
    const starter = catalog.match(/\[run Socrates in the Playground\]\(https:\/\/eyereasoner\.github\.io\/eyemind\/playground\/#example=([^)]+)\)/);
    assert.ok(manifest.some((entry) => entry.name === starter?.[1]));
    assert.ok(document('README.md').includes('[Examples](https://eyereasoner.github.io/eyemind/examples/)'));
  },
};
