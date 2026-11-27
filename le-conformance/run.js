#!/usr/bin/env node
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadCases as load, mainCommand, readManifest as manifest } from '../conformance/run.js';

export const HERE = fileURLToPath(new URL('.', import.meta.url));
export const readManifest = () => manifest(HERE);
export const loadCases = (names, pattern) => load(names, pattern, HERE);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = mainCommand(process.argv.slice(2), HERE);
}
