#!/usr/bin/env node
// Regenerate the saved output, proof and check report of every example, or
// of the examples named as arguments.
//
// Every example is evaluated before any file is written, so a reasoning
// failure does not leave a partially refreshed corpus.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { KINDS, artifactKinds, artifactPath, evaluate, readManifest } from './corpus.js';

const only = new Set(process.argv.slice(2));
const entries = readManifest().filter((entry) => !only.size || only.has(entry.name));
const results = entries.map((entry) => [entry, evaluate(entry)]);
for (const kind of KINDS) mkdirSync(dirname(artifactPath(kind, entries[0])), { recursive: true });
for (const [entry, artifacts] of results) {
  for (const kind of artifactKinds(entry)) writeFileSync(artifactPath(kind, entry), artifacts[kind]);
  console.log(`updated ${entry.name}: ${artifactKinds(entry).join(', ')}`);
}
