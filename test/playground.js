// The playground's tests, run in a real Chrome by npm test (section
// playground) and by test/browser.mjs. Each test gets the page connection
// and the URL of playground.html; they run in order, on one page, and each
// opens or sets up what it needs, so -k can pick any of them.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
      await until("document.readyState === 'complete' && /^(Ready|Could)/.test(document.getElementById('status').textContent)", 'the page');
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

  ['a goal asks the program a question', async (page, base) => {
    const p = driver(page);
    await p.open(`${base}#example=socrates`);
    await p.select('goal', "type(X, 'mortal')");
    await p.run();
    assert.equal(await p.output(), "type('socrates', 'mortal')\n");
    await p.select('goal', '');
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
    assert.equal(await p.output(), 'p(1)\n');
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

  ['the page threw no exceptions', async (page) => {
    assert.deepEqual(page.exceptions, []);
  }],
];

// Start the page for the tests: DevTools domains on, the cache off.
export async function prepare(page) {
  await page.command('Page.enable');
  await page.command('Runtime.enable');
  await page.command('Network.setCacheDisabled', { cacheDisabled: true });
}
