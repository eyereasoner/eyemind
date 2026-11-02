// The playground's tests in a real Chrome, as npm test runs them, plus
// screenshots at desktop and phone widths when a directory is given:
//
//     node test/browser.mjs [SCREENSHOT_DIR]
//
// It serves the repository and starts headless Chrome itself; CHROME names
// the Chrome to use when it is not found on the PATH.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect, findChrome, launch, serve } from './chrome.js';
import { driver, prepare, tests } from './playground.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const [screenshots] = process.argv.slice(2);
const executable = findChrome();
if (executable === null) {
  console.error('no Chrome found: install it or set CHROME');
  process.exit(1);
}
const server = await serve(ROOT);
const chrome = await launch(executable);
let failed = 0;
try {
  const page = await connect(chrome.debugUrl);
  await prepare(page);
  const base = `${server.url}playground.html`;
  for (const [name, test] of tests) {
    try {
      await test(page, base);
      console.log(`ok   ${name}`);
    } catch (error) {
      failed++;
      console.log(`FAIL ${name}\n${error.stack}`);
    }
  }
  if (screenshots) {
    const p = driver(page);
    for (const [name, width, mobile] of [['desktop', 1280, false], ['phone', 390, true]]) {
      await p.open(`${base}#example=graphs`, width, mobile);
      const shot = await page.command('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(screenshots, `playground-${name}.png`), Buffer.from(shot.data, 'base64'));
    }
  }
  page.close();
} finally {
  await chrome.close();
  await server.close();
}
process.exitCode = failed ? 1 : 0;
