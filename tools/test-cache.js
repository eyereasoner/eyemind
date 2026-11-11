// Upstream suites are disposable local data. Keep a file inventory so a
// partial cache is rebuilt instead of silently omitting tests.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const cachePaths = (root = ROOT) => ({
  notation3tests: join(root, '.cache/notation3tests'),
  rdf: join(root, '.cache/w3c/rdf-tests'),
  srl: join(root, '.cache/w3c/sparql-rl'),
});

export function writeInventory(directory) {
  const files = [];
  const walk = (path) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const file = join(path, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (file !== join(directory, 'inventory.json')) files.push(relative(directory, file).split(sep).join('/'));
    }
  };
  walk(directory);
  writeFileSync(join(directory, 'inventory.json'), `${JSON.stringify(files.sort())}\n`);
}

export function readCachedSuites(root = ROOT) {
  const info = {};
  try {
    for (const [name, directory] of Object.entries(cachePaths(root))) {
      const metadata = JSON.parse(readFileSync(join(directory, 'upstream.json'), 'utf8'));
      const files = JSON.parse(readFileSync(join(directory, 'inventory.json'), 'utf8'));
      if (!/^[a-f0-9]{40}$/.test(metadata.revision) || !Number.isInteger(metadata.cases) || metadata.cases < 1 ||
          !Array.isArray(files) || !files.length || !files.includes('upstream.json') ||
          !files.every((file) => typeof file === 'string' && !file.split('/').includes('..') &&
            !file.startsWith('/') && statSync(join(directory, file)).isFile())) return null;
      info[name] = metadata;
    }
  } catch { return null; }
  return info;
}

export function recordUpstream(root, info) {
  const path = join(root, 'test/upstream.json');
  const text = `${JSON.stringify(info, null, 2)}\n`;
  if (!existsSync(path) || readFileSync(path, 'utf8') !== text) writeFileSync(path, text);
}
