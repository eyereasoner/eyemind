// Optional real-browser check of the playground, not part of npm test.
// Serve the repository (python3 -m http.server 8767), start Chrome with
// --remote-debugging-port=9227, then run:
//
//     node test/browser.mjs [PAGE_URL] [DEBUG_URL] [SCREENSHOT_DIR]
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [base = 'http://127.0.0.1:8767/playground.html', debug = 'http://127.0.0.1:9227', screenshots] = process.argv.slice(2);
const expected = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const socrates = readFileSync(new URL('../examples/output/socrates.js', import.meta.url), 'utf8');
const tab = (await (await fetch(`${debug}/json`)).json()).find((item) => item.type === 'page');
assert.ok(tab, 'Chrome needs an open page');
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let nextId = 0;
const pending = new Map();
const exceptions = [];
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
};
const command = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function until(expression, what, ms = 30000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`timed out waiting for ${what}: ${await evaluate("document.getElementById('status').textContent")}`);
}
async function open(url, width, mobile = false) {
  await command('Emulation.setDeviceMetricsOverride', { width, height: mobile ? 900 : 1000, deviceScaleFactor: 1, mobile });
  // A fresh document each time: a navigation that changes only the fragment
  // would keep the previous page until it reloads itself.
  await command('Page.navigate', { url: 'about:blank' });
  await until("location.href === 'about:blank'", 'a blank page');
  await command('Page.navigate', { url });
  await until("document.readyState === 'complete' && /^(Ready|Could)/.test(document.getElementById('status').textContent)", 'the page');
}
const status = () => evaluate("document.getElementById('status').textContent");
const outputText = () => evaluate("document.getElementById('output').value");
async function runAndWait() {
  await evaluate("document.getElementById('run').click()");
  await until("!document.getElementById('run').disabled && document.getElementById('status').textContent !== 'Running…'", 'the run');
}
async function select(id, value) {
  await evaluate(`(() => { const el = document.getElementById(${JSON.stringify(id)}); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); })()`);
}

await command('Page.enable');
await command('Runtime.enable');
await command('Network.setCacheDisabled', { cacheDisabled: true });

await open(`${base}#example=socrates`, 1280);
assert.equal(await evaluate("document.getElementById('version').textContent"), expected);
assert.equal(await evaluate("document.getElementById('examples').value"), 'socrates');
await runAndWait();
assert.match(await status(), /^Done · exit 0/);
assert.equal(await outputText(), socrates);

await select('mode', '--proof');
await runAndWait();
const proof = await outputText();
assert.match(proof, /^step\(/m);
await select('mode', '--check-proof');
await evaluate(`(() => { const el = document.getElementById('proof-input'); el.value = ${JSON.stringify('')} + ${JSON.stringify(proof)}; el.dispatchEvent(new Event('input')); })()`);
await runAndWait();
assert.match(await outputText(), /verdict\('checked'\)/);
assert.match(await evaluate("document.getElementById('command').textContent"), /^eyelit --check-proof proof\.js examples\/socrates\.js$/);

await select('mode', '');
await select('goal', "type(X, 'mortal')");
await runAndWait();
assert.equal(await outputText(), "type('socrates', 'mortal')\n");
await select('goal', '');

// A run that would not end on its own can be stopped.
await evaluate(`(() => { const el = document.getElementById('input'); el.value = 'implied_by(p(X), p(s(X)))\\nquery(p(z))\\n'; el.dispatchEvent(new Event('input')); })()`);
await select('max-depth', '100000000');
await evaluate("document.getElementById('run').click()");
await new Promise((resolve) => setTimeout(resolve, 500));
await evaluate("document.getElementById('stop').click()");
await until("!document.getElementById('run').disabled", 'stopping');
assert.equal(await status(), 'Stopped.');
await select('max-depth', '');

if (screenshots) {
  for (const [name, width, mobile] of [['desktop', 1280, false], ['phone', 390, true]]) {
    await open(`${base}#example=graphs`, width, mobile);
    const overflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
    assert.ok(overflow <= 0, `${name}: the page scrolls sideways by ${overflow}px`);
    const shot = await command('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(screenshots, `playground-${name}.png`), Buffer.from(shot.data, 'base64'));
  }
}
assert.deepEqual(exceptions, []);
console.log('playground ok');
socket.close();
