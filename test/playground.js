// The playground's tests, run in a real Chrome by npm test (section
// playground) and by test/browser.mjs. Each test gets the page connection
// and the URL of playground/; they run in order, on one page, and each
// opens or sets up what it needs, so -k can pick any of them.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadCases } from '../conformance/run.js';
import { artifactPath, readManifest, sourceFiles } from '../tools/corpus.js';

const expected = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const socrates = readFileSync(new URL('../examples/output/socrates.js', import.meta.url), 'utf8');
const manifest = readManifest();

// Render the catalogue's headings and lists for the browser harness, which
// serves repository files without running Jekyll.
function exampleCatalog(base) {
  const source = readFileSync(new URL('../examples/README.md', import.meta.url), 'utf8');
  const content = source.slice(source.indexOf('## Contents'))
    .replace(/^## (.+)$/gm, (_, title) =>
      `<h2 id="${title.toLowerCase().replace(/[^a-z ]/g, '').replaceAll(' ', '-')}">${title}</h2>`)
    .replace(/(?:^- .+\n)+/gm, (list) => {
      const rows = list.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        .replace(/^- \[([^\]]+)\]\(([^)]+)\)(.*)$/gm, '<li><a href="$2">$1</a>$3</li>');
      return `<ul>${rows}</ul>`;
    });
  return `<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="${new URL('../assets/docs.css', base)}">
    <main class="documentation"><article>${content}</article></main>`;
}

// What the tests do with the page.
export function driver(page) {
  const { command, evaluate } = page;
  async function until(expression, what, ms = 30000) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const status = await evaluate("document.getElementById('status')?.textContent ?? ''");
    throw new Error(`timed out waiting for ${what}${status ? ': ' + status : ''}`);
  }
  return {
    until,
    async open(url, width = 1280, mobile = false) {
      await command('Emulation.setDeviceMetricsOverride', { width, height: mobile ? 900 : 1000, deviceScaleFactor: 1, mobile });
      // A fresh document each time: a navigation that changes only the
      // fragment would keep the previous page until it reloads itself.
      await command('Page.navigate', { url: 'about:blank' });
      await until("location.href === 'about:blank'", 'a blank page');
      await command('Page.navigate', { url });
      await until("document.readyState === 'complete' && !!document.getElementById('status') && /^(Ready|Could)/.test(document.getElementById('status').textContent)", 'the page');
    },
    status: () => evaluate("document.getElementById('status').textContent"),
    output: () => evaluate("document.getElementById('output').value"),
    messages: () => evaluate("document.getElementById('messages').textContent"),
    async run() {
      await evaluate("document.getElementById('run').click()");
      await until("!document.getElementById('run').disabled && document.getElementById('status').textContent !== 'Running…'", 'the run');
    },
    async select(id, value) {
      await evaluate(`(() => { const el = document.getElementById(${JSON.stringify(id)}); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); })()`);
    },
    async type(id, text) {
      await evaluate(`(() => { const el = document.getElementById(${JSON.stringify(id)}); el.value = ${JSON.stringify(text)}; el.dispatchEvent(new Event('input')); })()`);
    },
    // The text the input's error bar marks, or null when no line is marked.
    marked: () => evaluate(`(() => {
      const frame = document.getElementById('input').parentElement;
      const bar = frame.querySelector('.error-bar');
      if (bar.hidden) return null;
      return [...frame.querySelectorAll('mark.error-line')].map((mark) => mark.textContent).join('');
    })()`),
  };
}

export const tests = [
  ['the example contents jump to visible topics on desktop and phone', async (page, base) => {
    const { command, evaluate } = page, p = driver(page);
    for (const [width, mobile] of [[1280, false], [390, true]]) {
      await p.open(base, width, mobile);
      const { frameTree } = await command('Page.getFrameTree');
      await command('Page.setDocumentContent', { frameId: frameTree.frame.id, html: exampleCatalog(base) });
      await p.until('document.styleSheets.length === 1', 'the examples stylesheet');
      assert.equal(await evaluate("document.querySelectorAll('article a[href*=\"/examples/deck/\"]').length"), manifest.length);
      const topic = 'policy-rights-and-privacy';
      await evaluate(`document.querySelector('article a[href="#${topic}"]').click()`);
      await p.until(`(() => {
        const heading = document.getElementById('${topic}').getBoundingClientRect();
        return location.hash === '#${topic}' && heading.top >= 0 && heading.bottom <= innerHeight;
      })()`, 'the topic from the contents');
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'));
    }
  }],
  ['the catalog loads and socrates runs, answers a goal and checks its proof', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=socrates`);
    assert.equal(await page.evaluate('document.title'), 'The eyemind Playground');
    assert.equal(await page.evaluate("document.querySelector('h1').textContent"), 'The eyemind Playground');
    assert.match(await page.evaluate("document.querySelector('header p').textContent"), /Logic Script \(LS\).*JavaScript syntax/);
    assert.equal(await page.evaluate("document.querySelector('a[href=\"https://github.com/eyereasoner/eyemind\"]').textContent"), 'Repository ↗');
    assert.equal(await page.evaluate("document.getElementById('version').textContent"), expected);
    assert.equal(await page.evaluate("document.getElementById('examples').value"), 'socrates');
    assert.deepEqual(await page.evaluate("[...document.getElementById('examples').options].map(option => option.value).filter(Boolean).sort()"),
      manifest.map((entry) => entry.name).sort());
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    assert.equal(await p.output(), socrates);
    await p.select('goal', "type(X, 'mortal')");
    await p.run();
    assert.equal(await p.output(), "// Answers: each instance of a goal that holds.\ntype('socrates', 'mortal')\n");
    await p.select('goal', '');
    await p.select('mode', '--proof');
    await p.run();
    const proof = await p.output();
    assert.match(proof, /^step\(/m);
    await p.select('mode', '--check-proof');
    await p.type('proof-input', proof);
    await p.run();
    assert.match(await p.output(), /verdict\('checked'\)/);
    assert.match(await page.evaluate("document.getElementById('command').textContent"), /^eyemind --check-proof proof\.js examples\/socrates\.js$/);
    await p.select('mode', '');
  }],

  ['an ODRL Turtle snapshot runs, downloads as Turtle and checks its proof', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=handicap-card`);
    assert.equal(await page.evaluate("document.getElementById('odrl').checked"), true);
    assert.match(await page.evaluate("document.getElementById('command').textContent"), /--odrl/);
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    assert.equal(await p.output(), readFileSync(new URL('../examples/output/handicap-card.ttl', import.meta.url), 'utf8'));
    await page.evaluate(`(() => {
      HTMLAnchorElement.prototype.click = function () { window.savedFilename = this.download; };
      document.getElementById('save-output').click();
    })()`);
    assert.equal(await page.evaluate('window.savedFilename'), 'output.ttl');
    await page.evaluate("document.getElementById('odrl').click()");
    assert.doesNotMatch(await page.evaluate("document.getElementById('command').textContent"), /--odrl/);
    await p.run();
    assert.doesNotMatch(await p.output(), /canHappen|EvaluationReport/);
    await page.evaluate("document.getElementById('share-link').click()");
    await p.until("document.getElementById('share-url').value.includes('#state=')", 'the disabled ODRL switch');
    const withoutOdrl = await page.evaluate("document.getElementById('share-url').value");
    await p.open(withoutOdrl, 390, true);
    assert.equal(await page.evaluate("document.getElementById('odrl').checked"), false);
    await page.evaluate("document.getElementById('odrl').click()");
    await p.select('mode', '--proof');
    await p.run();
    const proof = await p.output();
    assert.match(proof, /^step\(/m);
    await p.select('mode', '--check-proof');
    await p.type('proof-input', proof);
    await page.evaluate("document.getElementById('share-link').click()");
    await p.until("document.getElementById('share-url').value.includes('#state=')", 'the enabled ODRL switch and proof');
    const withOdrl = await page.evaluate("document.getElementById('share-url').value");
    await p.open(withOdrl);
    assert.equal(await page.evaluate("document.getElementById('odrl').checked"), true);
    await p.run();
    assert.match(await p.output(), /verdict\('checked'\)/);
    await p.select('mode', '');
  }],

  ['OWL 2 RL runs RDFS and OWL examples, checks proofs and survives shared links', async (page, base) => {
    const p = driver(page);
    for (const name of ['family-owl2rl', 'people-owl2rl']) {
      await p.open(`${base}#example=${name}`);
      assert.equal(await page.evaluate("document.querySelectorAll('#rdfs, #owl-rl').length"), 0);
      assert.equal(await page.evaluate("document.getElementById('owl2rl').checked"), true);
      assert.match(await page.evaluate("document.getElementById('command').textContent"), /--owl2rl/);
      await p.run();
      assert.match(await p.status(), /^Done · exit 0/);
      assert.equal(await p.output(), readFileSync(new URL(`../examples/output/${name}.ttl`, import.meta.url), 'utf8'));
    }
    // Both examples have corpus proof checks. Exercise the browser's proof,
    // download and sharing controls once with the smaller example.
    await page.evaluate(`(() => {
      HTMLAnchorElement.prototype.click = function () { window.savedFilename = this.download; };
      document.getElementById('save-output').click();
    })()`);
    assert.equal(await page.evaluate('window.savedFilename'), 'output.ttl');
    await p.select('mode', '--proof');
    await p.run();
    const proof = await p.output();
    assert.match(proof, /^step\(/m);
    await p.select('mode', '--check-proof');
    await p.type('proof-input', proof);
    await page.evaluate("document.getElementById('share-link').click()");
    await p.until("document.getElementById('share-url').value.includes('#state=')", 'the entailment switch and proof');
    await p.open(await page.evaluate("document.getElementById('share-url').value"), 390, true);
    assert.equal(await page.evaluate("document.getElementById('owl2rl').checked"), true);
    await p.run();
    assert.match(await p.output(), /verdict\('checked'\)/);
    await p.select('mode', '');
    await p.type('proof-input', '');
    await page.evaluate("document.getElementById('owl2rl').click()");
    await page.evaluate("document.getElementById('share-link').click()");
    await p.until("document.getElementById('share-url').value.includes('#state=')", 'the disabled entailment switch');
    await p.open(await page.evaluate("document.getElementById('share-url').value"));
    assert.equal(await page.evaluate("document.getElementById('owl2rl').checked"), false);
    await p.run();
    assert.doesNotMatch(await p.output(), /result_rdf|ent:Conflict/);
  }],

  ['QUDT, SKOS and SHACL switches run examples and preserve composed sessions', async (page, base) => {
    const p = driver(page);
    for (const [name, flags] of [['quantities-qudt', ['qudt']], ['thesaurus-skos', ['skos']],
      ['people-shacl', ['shacl']], ['measurement-shacl', ['qudt', 'shacl']]]) {
      await p.open(`${base}#example=${name}`);
      for (const flag of flags) assert.equal(await page.evaluate(`document.getElementById('${flag}').checked`), true);
      await p.run();
      assert.match(await p.status(), /^Done · exit 0/);
      assert.equal(await p.output(), readFileSync(new URL(`../examples/output/${name}.ttl`, import.meta.url), 'utf8'));
      await p.select('mode', '--proof');
      await p.run();
      const proof = await p.output();
      assert.match(proof, /^step\(/m);
      await p.select('mode', '--check-proof');
      await p.type('proof-input', proof);
      if (name === 'measurement-shacl') continue; // check the proof after restoring the shared session
      await p.run();
      assert.match(await p.output(), /verdict\('checked'\)/);
    }
    await page.evaluate("document.getElementById('share-link').click()");
    await p.until("document.getElementById('share-url').value.includes('#state=')", 'the composed RDF profiles');
    await p.open(await page.evaluate("document.getElementById('share-url').value"), 390, true);
    for (const flag of ['qudt', 'shacl']) assert.equal(await page.evaluate(`document.getElementById('${flag}').checked`), true);
    await p.run();
    assert.match(await p.output(), /verdict\('checked'\)/);
    await p.select('mode', '');
    await p.type('proof-input', '');
    await page.evaluate("document.getElementById('qudt').click()");
    await p.run();
    assert.doesNotMatch(await p.output(), /qconv:normalizedCdtLiteral/);
    assert.match(await p.output(), /sh:conforms false/);
    await page.evaluate("document.getElementById('share-link').click()");
    await p.until("document.getElementById('share-url').value.includes('#state=')", 'the disabled conversion profile');
    await p.open(await page.evaluate("document.getElementById('share-url').value"));
    assert.equal(await page.evaluate("document.getElementById('qudt').checked"), false);
    assert.equal(await page.evaluate("document.getElementById('shacl').checked"), true);
  }],

  ['Logical English examples download LE conclusions and keep JavaScript proofs', async (page, base) => {
    const p = driver(page);
    for (const name of ['socrates-le', 'records-le', 'handicap-card-le', 'research-access-le',
      'research-snapshot-le', 'shortest-path-le', 'river-crossing-le', 'course-certificates-le']) {
      await p.open(`${base}#example=${name}`);
      await p.run();
      assert.match(await p.status(), /^Done · exit 0/);
      assert.equal(await p.output(), readFileSync(new URL(`../examples/output/${name}.le`, import.meta.url), 'utf8'));
    }
    // The certificate example also exercises witness terms in both formats.
    await page.evaluate(`(() => {
      HTMLAnchorElement.prototype.click = function () { window.savedFilename = this.download; };
      document.getElementById('save-output').click();
    })()`);
    assert.equal(await page.evaluate('window.savedFilename'), 'output.le');
    await p.select('mode', '--proof');
    await p.run();
    const proof = await p.output();
    assert.match(proof, /^step\(/m);
    await page.evaluate("document.getElementById('save-output').click()");
    assert.equal(await page.evaluate('window.savedFilename'), 'proof.js');
    await p.select('mode', '--check-proof');
    await p.type('proof-input', proof);
    await page.evaluate("document.getElementById('share-link').click()");
    await p.until("document.getElementById('share-url').value.includes('#state=')", 'the LE source and JavaScript proof');
    await p.open(await page.evaluate("document.getElementById('share-url').value"), 390, true);
    await p.run();
    assert.match(await p.output(), /verdict\('checked'\)/);
    await p.select('mode', '');
    await p.type('input', '# Header\n\nSocrates is not a human.');
    await p.run();
    assert.match(await p.messages(), /line 3: Logical English: ordinary "not"/);
    assert.equal(await p.marked(), 'Socrates is not a human.');
  }],

  ['practical and mathematical examples load from the manifest and run', async (page, base) => {
    const p = driver(page);
    // The corpus checks every example. Here exercise representative browser
    // loads for planning, exact arithmetic and list-valued answers.
    for (const name of ['battery-dispatch', 'pell-equation', 'hamming-code']) {
      await p.open(`${base}#example=${name}`);
      assert.equal(await page.evaluate("document.getElementById('examples').value"), name);
      await p.run();
      assert.match(await p.status(), /^Done · exit 0/, name);
      assert.equal(await p.output(), readFileSync(new URL(`../examples/output/${name}.js`, import.meta.url), 'utf8'), name);
    }
  }],

  ['older links name N3 and SRL examples without -n3 or -srl', async (page, base) => {
    const p = driver(page);
    for (const [link, name] of [['family', 'family-n3'], ['orders', 'orders-srl'], ['socrates', 'socrates']]) {
      await p.open(`${base}#example=${link}`);
      assert.equal(await page.evaluate("document.getElementById('examples').value"), name, link);
    }
  }],

  ['SRL decimal arithmetic and execution functions work with saved proofs', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=exact-decimals-srl`);
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    assert.equal(await p.output(), readFileSync(artifactPath('output', manifest.find((e) => e.name === 'exact-decimals-srl')), 'utf8'));
    await p.open(`${base}#example=execution-identifiers-srl`);
    await p.select('mode', '--proof');
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    const proof = await p.output();
    assert.match(proof, /^\/\/ Answers:/);
    assert.match(proof, /urn:uuid:/);
    await p.select('mode', '--check-proof');
    await p.type('proof-input', proof);
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    assert.match(await p.output(), /verdict\('checked'\)/);
  }],

  ['native input combinations run and their saved proofs check in the playground', async (page, base) => {
    const p = driver(page);
    // Cover each loading path, including a contradiction and message replay.
    // The example corpus checks the remaining programs outside the browser.
    for (const example of ['family-n3', 'triple-term-n3', 'trig-named-graph-n3', 'distances-srl', 'fuse-n3', 'message-boundaries-n3']) {
      const entry = manifest.find(({ name }) => name === example);
      assert.ok(entry, `missing browser example: ${example}`);
      const { name } = entry;
      const files = sourceFiles(entry).map((file) => `examples/${file}`);
      const mobile = name === 'trig-named-graph-n3';
      await p.open(`${base}#example=${name}`, mobile ? 390 : 1280, mobile);
      assert.equal(await page.evaluate("document.getElementById('input-source').textContent"), files.join(' + '), name);
      await p.run();
      const status = entry.halt_code === 65 ? 'Contradiction' : 'Done';
      assert.match(await p.status(), new RegExp(`^${status} · exit ${entry.halt_code ?? 0}`), name);
      assert.equal(await p.output(), readFileSync(artifactPath('output', entry), 'utf8'), name);
      await p.select('mode', '--check-proof');
      await p.type('proof-input', readFileSync(artifactPath('proof', entry), 'utf8'));
      if (mobile) {
        await page.evaluate("document.getElementById('share-link').click()");
        await p.until("document.getElementById('share-url').value.includes('#state=')", 'the shared proof and inputs');
        const shared = await page.evaluate("document.getElementById('share-url').value");
        await p.open(shared, 390, true);
      }
      await p.run();
      assert.match(await p.status(), /^Done · exit 0/, name);
      assert.equal(await p.output(), readFileSync(new URL(`../examples/check/${name}.js`, import.meta.url), 'utf8'), name);
      await p.select('mode', '');
    }
  }],

  ['RDF Messages stream independently and preserve their mode in shared links', async (page, base) => {
    const p = driver(page);
    const output = readFileSync(new URL('../examples/output/message-alerts-n3.n3', import.meta.url), 'utf8');
    await p.open(`${base}#example=message-alerts-n3`, 390, true);
    await p.select('mode', '--stream-messages');
    assert.match(await page.evaluate("document.getElementById('command').textContent"), /^eyemind --stream-messages /);
    assert.ok(await page.evaluate("document.getElementById('json').disabled"));
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    assert.equal(await p.output(), output);
    await page.evaluate("document.getElementById('share-link').click()");
    await p.until("document.getElementById('share-url').value.includes('#state=')", 'the shared streaming mode');
    const url = await page.evaluate("document.getElementById('share-url').value");
    await p.open(url, 390, true);
    assert.equal(await page.evaluate("document.getElementById('mode').value"), '--stream-messages');
    await p.run();
    assert.equal(await p.output(), output);
    await p.select('mode', '--check-proof');
    await p.type('proof-input', readFileSync(new URL('../examples/proof/message-alerts-n3.js', import.meta.url), 'utf8'));
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    assert.equal(await p.output(), readFileSync(new URL('../examples/check/message-alerts-n3.js', import.meta.url), 'utf8'));
    await p.select('mode', '');
  }],

  ['streamed OWL 2 RL examples run their messages with specialized rules, from SHACL shapes too, and leave streaming with the example', async (page, base) => {
    const p = driver(page);
    const entry = manifest.find(({ name }) => name === 'observations-owl2rl');
    await p.open(`${base}#example=observations-owl2rl`, 390, true);
    assert.equal(await page.evaluate("document.getElementById('mode').value"), '--stream-messages');
    assert.ok(await page.evaluate("document.getElementById('owl2rl').checked"));
    assert.match(await page.evaluate("document.getElementById('command').textContent"), /--stream-messages/);
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    assert.equal(await p.output(), readFileSync(artifactPath('output', entry), 'utf8'));
    // An example's SHACL shapes are given with --shacl-in and --shacl-out.
    const shaped = manifest.find(({ name }) => name === 'shape-planning-owl2rl');
    await p.select('examples', 'shape-planning-owl2rl');
    await p.until("document.getElementById('status').textContent === 'Inputs ready.'", 'shape-planning-owl2rl');
    assert.match(await page.evaluate("document.getElementById('command').textContent"),
      /--shacl-in examples\/shape-planning-owl2rl-shacl-in\.ttl --shacl-out examples\/shape-planning-owl2rl-shacl-out\.ttl/);
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    assert.equal(await p.output(), readFileSync(artifactPath('output', shaped), 'utf8'));
    await p.select('examples', 'socrates');
    await p.until("document.getElementById('examples').value === 'socrates' && document.getElementById('status').textContent === 'Inputs ready.'", 'socrates');
    assert.equal(await page.evaluate("document.getElementById('mode').value"), '');
  }],

  ['N3 and SRL proofs generate, download and check as JavaScript proofs', async (page, base) => {
    const p = driver(page);
    for (const [name, width] of [['socrates-n3', 1280], ['socrates-srl', 390]]) {
      const entry = manifest.find((entry) => entry.name === name);
      await p.open(`${base}#example=${name}`, width, width === 390);
      await p.select('mode', '--proof');
      await p.run();
      const document = await p.output();
      assert.equal(document, readFileSync(artifactPath('proof', entry), 'utf8'));
      await page.evaluate(`(() => {
        HTMLAnchorElement.prototype.click = function () { window.savedFilename = this.download; };
        document.getElementById('save-output').click();
      })()`);
      assert.equal(await page.evaluate('window.savedFilename'), 'proof.js');
      await p.select('mode', '--check-proof');
      assert.match(await page.evaluate("document.getElementById('command').textContent"), /--check-proof proof\.js /);
      await p.type('proof-input', document);
      await p.run();
      assert.match(await p.status(), /^Done · exit 0/);
      assert.equal(await p.output(), readFileSync(artifactPath('check', entry), 'utf8'));
    }
    await p.select('mode', '');
  }],

  ['derived rule examples run, prove and check in the playground', async (page, base) => {
    const p = driver(page);
    for (const name of ['derived-rule', 'derived-backward-rule', 'derived-backward-rule-2']) {
      await p.open(`${base}#example=${name}`);
      await p.run();
      assert.equal(await p.output(), readFileSync(new URL(`../examples/output/${name}.js`, import.meta.url), 'utf8'));
      await p.select('mode', '--proof');
      await p.run();
      const proof = await p.output();
      assert.doesNotMatch(proof, /activated\(/);
      await p.select('mode', '--check-proof');
      await p.type('proof-input', proof);
      await p.run();
      assert.match(await p.output(), /verdict\('checked'\)/);
    }
    await p.select('mode', '');
  }],

  ['source rule inspection preserves variables and checks in the playground', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=rule-inspection`);
    await p.run();
    assert.equal(await p.output(), '// Answers: each instance of a query() that holds.\ntest(a(A), c(A))\n');
    await p.select('mode', '--proof');
    await p.run();
    assert.match(await p.output(), /\[implies\(a\(B\), c\(B\)\)\]/);
    await p.select('mode', '--prove-and-check');
    await p.run();
    assert.match(await p.output(), /test\(a\(A\), c\(A\)\)/);
    assert.match(await p.output(), /verdict\('checked'\)/);
    await p.select('mode', '');
  }],

  ['a restricted rule runs and is colored as a statement in the playground', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=derived-rule`);
    await p.type('input', `fact(human('jo'), father('jo', 'bob'), human('ann'))
restricted(human(X), [father(X, F), man(F)])
implies(father(X, Y), man(Y))
`);
    await p.run();
    assert.equal(await p.output(), "// Conclusions: the facts the program derives, in the order derived.\nman('bob')\nfather('ann', skolem(4, 'F', ['ann']))\nman(skolem(4, 'F', ['ann']))\n");
    assert.ok(await page.evaluate("[...document.querySelectorAll('.editor > .highlight .t-keyword')].some((node) => node.textContent === 'restricted')"));
  }],

  ['nested rule calls in the playground require their generator', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=derived-rule`);
    await p.type('input', `fact(p('a'))
implies(enabled('yes'), [implies(p(X), q(X)), implied_by(r(X), p(X))])
query(or(q(X), r(X)))`);
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    assert.equal(await p.output(), '// No answers: no query() instance holds.\n');
    await p.select('mode', '--prove-and-check');
    await p.run();
    // The generator never holds, so neither derived rule has an instance, and
    // the certificate shows that the question has no answers.
    assert.match(await p.output(), /^\/\/ No answers: the original questions have none\./);
    assert.match(await p.output(), /verdict\('checked'\)/);
    await p.select('mode', '');
  }],

  ['prove-and-check shows checked answers and supports JSON output', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=socrates`);
    await p.select('mode', '--prove-and-check');
    assert.ok(await page.evaluate("document.getElementById('proof-panel').hidden"));
    await p.run();
    assert.equal(await p.output(), readFileSync(new URL('../examples/check/socrates.js', import.meta.url), 'utf8'));
    assert.match(await p.output(), /Proof check \(SPEC 11\.2-11\.6\):/);
    assert.match(await p.output(), /Call tables: every consulted table matches its one-level expansion/);
    assert.match(await p.output(), /Evidence: every recorded step, call table and listing is used/);
    assert.match(await page.evaluate("document.getElementById('command').textContent"), /^eyemind --prove-and-check examples\/socrates.js$/);
    await page.evaluate("document.getElementById('json').click()");
    await p.run();
    assert.deepEqual(JSON.parse(await p.output()).answers, ["type('socrates', 'mortal')", "type('socrates', 'human')"]);
    await page.evaluate("document.getElementById('json').click()");
    await p.open(`${base}#example=witnesses-n3`);
    await p.select('mode', '--prove-and-check');
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    assert.match(await p.output(), /verdict\('checked'\)/);
    // A conclusion blank node makes a restricted rule, whose firing a proof
    // cannot establish: the reasoner refuses to certify it.
    await p.type('input', '@prefix : <http://example.org/>.\n:a :p :b.\n{ ?x :p ?y } => { ?x :q _:w }.');
    await p.run();
    assert.match(await p.status(), /^Failed · exit 1/);
    await p.select('mode', '');
  }],

  ['checking certifies the original questions and rejects a later once answer', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=socrates`);
    await p.select('mode', '--prove-and-check');
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    assert.match(await p.output(), /every answer of its questions/);
    await p.type('input', "fact(p('a'), p('b'))\nimplied_by(q(X), once(p(X)))\nquery(q(X))");
    await p.type('proof-input', "q('b')\ncalled(q(A), [q('a')])\n");
    await p.select('mode', '--check-proof');
    await p.run();
    assert.match(await p.status(), /^Proof not valid · exit 2/);
    assert.match(await p.output(), /failed; no claim is certified by this report/);
    assert.doesNotMatch(await p.output(), /\/\/ Replay:/);
    assert.match(await p.output(), /failure\('the question does not return this answer: q\(\\'b\\'\)'\)/);
    await p.type('proof-input', "q('a')\ncalled(q(A), [q('a')])\n");
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    assert.match(await p.output(), /verdict\('checked'\)/);
    await p.select('mode', '');
  }],

  ['syntax and execution errors mark their lines and editing clears them', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=socrates`);
    await p.type('input', "fact(p(1))\nfact(q(2)\nquery(p(X))\n");
    await p.run();
    assert.match(await p.status(), /^Failed · exit 1/);
    assert.match(await p.messages(), /^eyemind: line 2: missing \) after argument list/);
    assert.equal(await p.marked(), 'fact(q(2)');
    // Editing the input clears the mark.
    await p.type('input', "fact(p(1))\nfact(q(2))\nquery(p(X))\n");
    assert.equal(await p.marked(), null);
    await p.run();
    assert.equal(await p.output(), '// Answers: each instance of a query() that holds.\np(1)\n');
    assert.equal(await p.marked(), null);
    await p.type('input', "fact(p(1))\n\nfcat(q(2))\n");
    await p.run();
    assert.match(await p.messages(), /^eyemind: line 3: fcat\(\.\.\.\) on its own states nothing/);
    assert.equal(await p.marked(), 'fcat(q(2))');
    // A line holding nothing but the stray token is marked as well.
    await p.type('input', "fact(p(1))\n\n)\n");
    await p.run();
    assert.match(await p.messages(), /^eyemind: line 3: /);
    assert.equal(await p.marked(), ')');
  }],

  ['a run that would not end can be stopped', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=socrates`);
    // Bounds high enough that no machine reaches them before Stop is pressed.
    await p.type('input', 'implied_by(p(X), p(s(X)))\nquery(p(z))\n');
    await p.select('max-depth', '100000000');
    await p.select('max-inferences', '1000000000000');
    await page.evaluate("document.getElementById('run').click()");
    await p.until("document.getElementById('status').textContent === 'Running…'", 'the run to start');
    await new Promise((resolve) => setTimeout(resolve, 200));
    await page.evaluate("document.getElementById('stop').click()");
    await p.until("!document.getElementById('run').disabled", 'stopping');
    assert.equal(await p.status(), 'Stopped.');
    await p.select('max-depth', '');
    await p.select('max-inferences', '');
  }],

  ['the page fits desktop and phone widths', async (page, base) => {
    const p = driver(page);
    for (const [name, width, mobile] of [['desktop', 1280, false], ['phone', 390, true]]) {
      await p.open(`${base}#example=graphs`, width, mobile);
      const overflow = await page.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
      assert.ok(overflow <= 0, `${name}: the page scrolls sideways by ${overflow}px`);
    }
  }],

  ['legacy playground links preserve their query and shared example', async (page, base) => {
    const p = driver(page);
    await p.open(new URL('../playground.html?probe=1#example=graphs', base).href);
    assert.equal(await page.evaluate('location.pathname'), '/playground/');
    assert.equal(await page.evaluate('location.search + location.hash'), '?probe=1#example=graphs');
    assert.equal(await page.evaluate("document.getElementById('examples').value"), 'graphs');
    await p.run();
    assert.equal(await p.output(), readFileSync(new URL('../examples/output/graphs.js', import.meta.url), 'utf8'));
  }],

  ['the navigation opens conformance and every case passes in the browser', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=socrates`);
    const labels = ['Playground', 'Examples', 'Specification', 'Conformance', 'Book', 'Repository ↗'];
    assert.deepEqual(await page.evaluate("[...document.querySelectorAll('nav a')].map(a => a.textContent)"), labels);
    await page.evaluate("[...document.querySelectorAll('nav a')].find(a => a.textContent === 'Conformance').click()");
    const count = loadCases().length;
    await p.until(`document.querySelectorAll('.cases > li').length === ${count} && !document.getElementById('run').disabled`, 'conformance cases');
    assert.equal(await page.evaluate('location.pathname'), '/playground/conformance');
    assert.deepEqual(await page.evaluate("[...document.querySelectorAll('nav a')].map(a => a.textContent)"), labels);
    assert.equal(await page.evaluate("document.querySelector('nav [aria-current=page]').textContent"), 'Conformance');
    assert.match(await page.evaluate("document.querySelector('.tagline').textContent"), /Logic Script \(LS\) conformance/);
    assert.match(await page.evaluate("document.querySelector('footer').textContent"), /eyemind.*Logic Script \(LS\) reasoner/s);
    assert.ok(await page.evaluate("[...document.querySelectorAll('.spec')].some(node => node.textContent.includes('README.command-line'))"));
    assert.ok(await page.evaluate("[...document.querySelectorAll('.spec')].every(node => node.textContent.startsWith('References: '))"));
    await p.type('filter', 'replay');
    const filtered = await page.evaluate("document.querySelectorAll('.cases > li:not(.hidden)').length");
    assert.ok(filtered > 0 && filtered < count);
    await p.type('filter', '');
    await page.evaluate("document.getElementById('run').click()");
    await p.until(`!document.getElementById('run').disabled && document.querySelectorAll('.mark.pass, .mark.fail').length === ${count}`, 'all browser conformance cases', 120000);
    assert.equal(await page.evaluate("[...document.querySelectorAll('.mark.fail')].map(mark => mark.closest('li').textContent).join('\\n')"), '');
    assert.equal(await page.evaluate("document.querySelectorAll('.mark.pass').length"), count);
    assert.ok(await page.evaluate(`Array.from(document.querySelectorAll('.group')).every(group => {
      const size = group.querySelectorAll('.cases > li').length;
      return group.querySelector('.counts.badge.ok')?.textContent === size + ' / ' + size;
    })`));
    for (const width of [1280, 390]) {
      await page.command('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width === 390 });
      assert.ok(await page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth'), `conformance at ${width}px`);
      assert.ok(await page.evaluate("[...document.querySelectorAll('.spec')].every(node => node.getBoundingClientRect().right <= innerWidth)"),
        `conformance references fit at ${width}px`);
    }
    await page.evaluate("document.querySelector('nav a[href=\"./\"]').click()");
    await p.until("document.getElementById('input') && !document.getElementById('run').disabled", 'return to the playground');
  }],

  ['the page threw no exceptions' , async (page) => {
    assert.deepEqual(page.exceptions, []);
  }],
];

// Start the page for the tests and collect JavaScript exceptions.
export async function prepare(page) {
  await page.command('Page.enable');
  await page.command('Runtime.enable');
}
