// A real Chrome for the playground tests: the repository served over HTTP,
// headless Chrome with a profile of its own, and a connection to its page
// through the DevTools protocol. Nothing here is installed: Chrome is used
// when it is found (CHROME names it otherwise), and the tests say so when not.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml',
};

const CANDIDATES = [
  'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

// The Chrome to start, or null when none is found.
export function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const path = (process.env.PATH || '').split(process.platform === 'win32' ? ';' : ':');
  for (const candidate of CANDIDATES) {
    if (candidate.includes('/') || candidate.includes('\\')) {
      if (existsSync(candidate)) return candidate;
    } else {
      for (const directory of path) if (directory && existsSync(join(directory, candidate))) return join(directory, candidate);
    }
  }
  return null;
}

// The files under root, served on a free port of this machine.
export async function serve(root) {
  const server = createServer((request, response) => {
    const path = normalize(join(root, decodeURIComponent(new URL(request.url, 'http://x').pathname)));
    if (!path.startsWith(root + sep) && path !== root) {
      response.writeHead(403).end();
      return;
    }
    let file = path;
    try {
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
      const body = readFileSync(file);
      response.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise((resolve) => server.close(resolve)) };
}

// Headless Chrome with a profile of its own, and its DevTools address. On a
// CI machine, which often cannot give Chrome the user namespaces its sandbox
// needs, Chrome runs without the sandbox; it only ever loads this repository.
export async function launch(executable) {
  const profile = mkdtempSync(join(tmpdir(), 'eyemind-chrome-'));
  const child = spawn(executable, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-background-networking', '--disable-component-update', '--remote-debugging-port=0',
    ...(process.env.CI ? ['--no-sandbox'] : []), `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const address = await new Promise((resolve, reject) => {
    let seen = '';
    const timer = setTimeout(() => reject(new Error(`Chrome did not start: ${seen.slice(-500)}`)), 30000);
    child.stderr.on('data', (chunk) => {
      seen += chunk;
      const match = seen.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(new URL(match[1]));
      }
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(new Error(`Chrome could not start (${executable}): ${error.message}`));
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome exited with code ${code}: ${seen.slice(-500)}`));
    });
  }).catch((error) => {
    if (child.exitCode === null) child.kill();
    removeProfile(profile);
    throw error;
  });
  const debugUrl = `http://${address.host}`;
  return {
    debugUrl,
    // Chrome is asked to close, so its helper processes stop writing to the
    // profile before it is removed; it is killed if it does not.
    async close() {
      if (child.exitCode === null) {
        const exited = new Promise((resolve) => child.once('exit', resolve));
        const wait = (ms) => Promise.race([exited.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), ms))]);
        try {
          const { webSocketDebuggerUrl } = await (await fetch(`${debugUrl}/json/version`)).json();
          const socket = new WebSocket(webSocketDebuggerUrl);
          await new Promise((resolve, reject) => {
            socket.onopen = resolve;
            socket.onerror = reject;
          });
          socket.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
        } catch {
          // Then it is killed below.
        }
        if (!(await wait(5000))) {
          child.kill();
          await wait(5000);
        }
      }
      removeProfile(profile);
    },
  };
}

// A profile left behind is only a folder in the temporary directory, never
// a reason for the tests to fail.
function removeProfile(profile) {
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch {
    // Left for the system to clear.
  }
}

// A connection to Chrome's open page: DevTools commands, expressions
// evaluated in the page, and the exceptions the page has thrown.
export async function connect(debugUrl) {
  let tab = null;
  for (let tries = 0; tab === null && tries < 50; tries++) {
    tab = (await (await fetch(`${debugUrl}/json`)).json()).find((item) => item.type === 'page') ?? null;
    if (tab === null) await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (tab === null) throw new Error('Chrome has no open page');
  const socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
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
    } else if (message.method === 'Runtime.exceptionThrown') {
      exceptions.push(message.params.exceptionDetails);
    }
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
  return { command, evaluate, exceptions, close: () => socket.close() };
}
