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

// What the tests do with the page.
export function driver(page) {
  const { command, evaluate } = page;
  async function until(expression, what, ms = 30000) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`timed out waiting for ${what}: ${await evaluate("document.getElementById('status').textContent")}`);
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
  ['the socrates example loads and runs', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=socrates`);
    assert.equal(await page.evaluate('document.title'), 'The eyemind Playground');
    assert.equal(await page.evaluate("document.querySelector('h1').textContent"), 'The eyemind Playground');
    assert.equal(await page.evaluate("document.querySelector('a[href=\"https://github.com/eyereasoner/eyemind\"]').textContent"), 'Repository ↗');
    assert.equal(await page.evaluate("document.getElementById('version').textContent"), expected);
    assert.equal(await page.evaluate("document.getElementById('examples').value"), 'socrates');
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    assert.equal(await p.output(), socrates);
  }],

  ['practical and mathematical examples load from the manifest and run', async (page, base) => {
    const p = driver(page);
    for (const name of [
      'service-outage-recovery', 'critical-path-schedule', 'battery-dispatch', 'cold-chain-recall', 'school-placement-audit',
      'gcd-bezout-identity', 'pell-equation', 'binomial-vandermonde', 'least-squares-regression', 'hamming-code',
    ]) {
      await p.open(`${base}#example=${name}`);
      assert.equal(await page.evaluate("document.getElementById('examples').value"), name);
      await p.run();
      assert.match(await p.status(), /^Done · exit 0/, name);
      assert.equal(await p.output(), readFileSync(new URL(`../examples/output/${name}.js`, import.meta.url), 'utf8'), name);
    }
  }],

  ['native N3, RDF and SRL examples run and their saved proofs check in the playground', async (page, base) => {
    const p = driver(page);
    const entries = readManifest().filter((entry) => sourceFiles(entry).some((file) => /\.(n3|srl)$/.test(file)));
    for (const entry of entries) {
      const { name } = entry;
      const files = sourceFiles(entry).map((file) => `examples/${file}`);
      const mobile = name === 'trig-named-graph';
      await p.open(`${base}#example=${name}`, mobile ? 390 : 1280, mobile);
      assert.equal(await page.evaluate("document.getElementById('input-source').textContent"), files.join(' + '), name);
      await p.run();
      const status = entry.halt_code === 65 ? 'Contradiction' : 'Done';
      assert.match(await p.status(), new RegExp(`^${status} · exit ${entry.halt_code ?? 0}`), name);
      assert.equal(await p.output(), readFileSync(artifactPath('output', entry), 'utf8'), name);
      await p.select('mode', '--check-proof');
      await p.type('proof-input', readFileSync(new URL(`../examples/proof/${name}.js`, import.meta.url), 'utf8'));
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
    const output = readFileSync(new URL('../examples/output/message-alerts.n3', import.meta.url), 'utf8');
    await p.open(`${base}#example=message-alerts`, 390, true);
    await p.select('mode', '--stream-messages');
    assert.match(await page.evaluate("document.getElementById('command').textContent"), /^eyemind --stream-messages /);
    assert.ok(await page.evaluate("document.getElementById('strict-proof').disabled"));
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
    await p.type('proof-input', readFileSync(new URL('../examples/proof/message-alerts.js', import.meta.url), 'utf8'));
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    assert.equal(await p.output(), readFileSync(new URL('../examples/check/message-alerts.js', import.meta.url), 'utf8'));
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
      assert.match(await p.output(), /verdict\('checked_with_obligations'\)/);
      assert.match(await p.output(), /obligation\('call_fidelity', 'original_call',/);
    }
    await p.select('mode', '');
  }],

  ['a proof made in the playground checks there', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=socrates`);
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

  ['source rule inspection preserves variables and checks in the playground', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=rule-inspection`);
    await p.run();
    assert.equal(await p.output(), '// Answers: each instance of a query() that holds.\ntest(a(A), c(A))\n');
    await p.select('mode', '--proof');
    await p.run();
    assert.match(await p.output(), /source\(2\)/);
    await p.select('mode', '--prove-and-check');
    await p.run();
    assert.match(await p.output(), /test\(a\(A\), c\(A\)\)/);
    assert.match(await p.output(), /verdict\('checked_with_obligations'\)/);
    assert.match(await p.output(), /obligation\('call_fidelity', 'original_call',/);
    await p.select('mode', '');
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
    assert.match(await p.output(), /^\/\/ No answers claimed;/);
    assert.match(await p.output(), /verdict\('checked'\)/);
    await p.select('mode', '');
  }],

  ['prove-and-check shows checked answers and supports strict and JSON output', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=socrates`);
    await p.select('mode', '--prove-and-check');
    assert.ok(await page.evaluate("document.getElementById('proof-panel').hidden"));
    await p.run();
    assert.equal(await p.output(), readFileSync(new URL('../examples/check/socrates.js', import.meta.url), 'utf8'));
    assert.match(await page.evaluate("document.getElementById('command').textContent"), /^eyemind --prove-and-check examples\/socrates.js$/);
    await page.evaluate("document.getElementById('json').click()");
    await p.run();
    assert.deepEqual(JSON.parse(await p.output()).answers, ["type('socrates', 'mortal')", "type('socrates', 'human')"]);
    await p.open(`${base}#example=inventory`);
    await p.select('mode', '--prove-and-check');
    await page.evaluate("document.getElementById('strict-proof').click()");
    await p.run();
    assert.match(await p.status(), /^Proof not valid · exit 2/);
    assert.match(await p.output(), /^\/\/ Unverified claims:/);
    await p.select('mode', '');
  }],

  ['a goal asks the program a question', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=socrates`);
    await p.select('goal', "type(X, 'mortal')");
    await p.run();
    assert.equal(await p.output(), "// Answers: each instance of a goal that holds.\ntype('socrates', 'mortal')\n");
    await p.select('goal', '');
  }],

  ['C10 call fidelity certifies original questions and rejects a later once answer', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=socrates`);
    await p.select('mode', '--prove-and-check');
    await p.run();
    assert.match(await p.status(), /^Done · exit 0/);
    assert.match(await p.output(), /condition\('C10', 'call_fidelity', 'ok', 2\)/);
    await p.type('input', "fact(p('a'), p('b'))\nimplied_by(q(X), once(p(X)))\nquery(q(X))");
    await p.type('proof-input', "q('b')\nstep(q('b'), clause(3), {}, [once(p('b'))])\n" +
      "step(once(p('b')), 'control', {}, [p('b')])\ncalled(q(A), [q('a')])\n");
    await p.select('mode', '--check-proof');
    await p.run();
    assert.match(await p.status(), /^Proof not valid · exit 2/);
    assert.match(await p.output(), /failure\('C10'/);
    await page.evaluate("(() => { const el = document.getElementById('strict-proof'); if (el.checked) el.click(); })()");
    await p.type('proof-input', "q('b')\nstep(q('b'), clause(3), {}, [once(p('b'))])\n" +
      "step(once(p('b')), 'control', {}, [p('b')])\n");
    await p.run();
    assert.match(await p.output(), /verdict\('checked_with_obligations'\)/);
    assert.match(await page.evaluate("document.getElementById('strict-proof').parentElement.title"), /call fidelity/);
    await page.evaluate("document.getElementById('strict-proof').click()");
    await p.run();
    assert.match(await p.output(), /failure\('C10'/);
    await page.evaluate("document.getElementById('strict-proof').click()");
    await p.select('mode', '');
  }],

  ['a syntax error marks its line in the input', async (page) => {
    const p = driver(page);
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
  }],

  ['an error found while running marks its line too', async (page) => {
    const p = driver(page);
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

  ['a run that would not end can be stopped', async (page) => {
    const p = driver(page);
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
    const labels = ['Playground', 'Specification', 'Conformance', 'Repository ↗'];
    assert.deepEqual(await page.evaluate("[...document.querySelectorAll('nav a')].map(a => a.textContent)"), labels);
    await page.evaluate("[...document.querySelectorAll('nav a')].find(a => a.textContent === 'Conformance').click()");
    const count = loadCases().length;
    await p.until(`document.querySelectorAll('.cases > li').length === ${count} && !document.getElementById('run').disabled`, 'conformance cases');
    assert.equal(await page.evaluate('location.pathname'), '/playground/conformance');
    assert.deepEqual(await page.evaluate("[...document.querySelectorAll('nav a')].map(a => a.textContent)"), labels);
    assert.equal(await page.evaluate("document.querySelector('nav [aria-current=page]').textContent"), 'Conformance');
    await p.type('filter', 'C8');
    const filtered = await page.evaluate("document.querySelectorAll('.cases > li:not(.hidden)').length");
    assert.ok(filtered > 0 && filtered < count);
    await p.type('filter', '');
    await page.evaluate("document.getElementById('run').click()");
    await p.until(`!document.getElementById('run').disabled && document.querySelectorAll('.mark.pass, .mark.fail').length === ${count}`, 'all browser conformance cases', 120000);
    assert.equal(await page.evaluate("[...document.querySelectorAll('.mark.fail')].map(mark => mark.closest('li').textContent).join('\\n')"), '');
    assert.equal(await page.evaluate("document.querySelectorAll('.mark.pass').length"), count);
    for (const width of [1280, 390]) {
      await page.command('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width === 390 });
      assert.ok(await page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth'), `conformance at ${width}px`);
    }
    await page.evaluate("document.querySelector('nav a[href=\"./\"]').click()");
    await p.until("document.getElementById('input') && !document.getElementById('run').disabled", 'return to the playground');
  }],

  ['the page threw no exceptions' , async (page) => {
    assert.deepEqual(page.exceptions, []);
  }],
];

// Start the page for the tests: DevTools domains on, the cache off.
export async function prepare(page) {
  await page.command('Page.enable');
  await page.command('Runtime.enable');
  await page.command('Network.setCacheDisabled', { cacheDisabled: true });
}
