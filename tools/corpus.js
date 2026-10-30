// The example corpus: the manifest, and evaluating an example into the
// output, proof and check report saved beside it.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkReport, loadSources, run } from '../src/index.js';
import { nodeIO } from '../src/node.js';

export const ROOT = join(dirname(dirname(fileURLToPath(import.meta.url))), 'examples');
export const KINDS = ['output', 'proof', 'check'];

export function readManifest() {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
  if (!Array.isArray(manifest) || !manifest.length) throw new Error('the example manifest must be a nonempty list');
  const names = new Set();
  for (const entry of manifest) {
    if (!/^[a-z][a-z0-9-]*$/.test(entry.name ?? '') || names.has(entry.name) ||
        typeof entry.description !== 'string' || !Array.isArray(entry.trusted)) {
      throw new Error(`invalid example manifest entry: ${JSON.stringify(entry)}`);
    }
    names.add(entry.name);
  }
  return manifest;
}

export const sourcePath = (entry) => join(ROOT, `${entry.name}.js`);
export const artifactPath = (kind, entry) => join(ROOT, kind, `${entry.name}.js`);

export function loadExample(entry) {
  const path = sourcePath(entry);
  return loadSources([[readFileSync(path, 'utf8'), path]], nodeIO);
}

// A certified run holds a valid nonempty proof, agrees with the plain run,
// and relies on exactly the trusted boundaries the manifest declares.
export function certify(entry, program, output) {
  const { name } = entry;
  const proved = run(program, { proof: true });
  const report = proved.proofReport;
  if (!report || !report.valid || !report.steps || !report.claims) throw new Error(`${name}: no valid nonempty proof`);
  if (output.haltCode !== (entry.halt_code ?? null) || proved.haltCode !== output.haltCode) {
    throw new Error(`${name}: unexpected halt code`);
  }
  if (JSON.stringify(output.answers) !== JSON.stringify(proved.answers)) throw new Error(`${name}: proof changed the answers`);
  const trusted = [...new Set(report.trusted.map((item) => item.kind))].sort();
  if (JSON.stringify(trusted) !== JSON.stringify([...entry.trusted].sort())) {
    throw new Error(`${name}: unexpected proof obligations ${trusted}`);
  }
  return proved;
}

export function evaluate(entry) {
  const program = loadExample(entry);
  const output = run(program);
  const proved = certify(entry, program, output);
  return { output: output.stdout, proof: proved.proof, check: checkReport(proved.proofReport) };
}
