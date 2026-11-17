// The example corpus: the manifest, and evaluating an example into the
// output, proof and check report saved beside it.
import { readFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkReport, run } from '../src/index.js';
import { RDF_PROFILES, defaultFormat, loadInputs, writeConclusions } from '../src/formats.js';
import { nodeIO } from '../src/node.js';

export const ROOT = join(dirname(dirname(fileURLToPath(import.meta.url))), 'examples');
export const KINDS = ['output', 'proof', 'check'];

export function readManifest() {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
  if (!Array.isArray(manifest) || !manifest.length) throw new Error('the example manifest must be a nonempty list');
  const names = new Set();
  for (const entry of manifest) {
    if (!/^[a-z][a-z0-9-]*$/.test(entry.name ?? '') || names.has(entry.name) ||
        typeof entry.description !== 'string') {
      throw new Error(`invalid example manifest entry: ${JSON.stringify(entry)}`);
    }
    names.add(entry.name);
    for (const file of sourceFiles(entry)) {
      const expected = `${entry.name}${extname(file)}`;
      if (basename(file) !== expected) throw new Error(`example ${entry.name}: ${file} must be named ${expected}`);
    }
    const source = nativeSource(entry);
    if (source && !entry.name.endsWith(`-${extname(source).slice(1)}`)) {
      throw new Error(`example ${entry.name} must be named ${entry.name}-${extname(source).slice(1)}`);
    }
  }
  return manifest;
}

export const sourceFiles = (entry) => entry.files ?? [`${entry.name}.js`];
export const outputExtension = (entry) => entry.output ??
  (sourceFiles(entry).some((file) => file.endsWith('.le')) ? 'le' :
    sourceFiles(entry).some((file) => file.endsWith('.n3')) ? 'n3' :
    sourceFiles(entry).some((file) => file.endsWith('.srl')) ? 'ttl' : 'js');
// Every file of an example, sources, data and artifacts alike, is named
// after the example; native N3, SRL and LE names end in -n3, -srl and -le.
const nativeSource = (entry) => sourceFiles(entry).find((file) => /\.(n3|srl|le)$/.test(file));
// Proofs and check reports are eyemind's own JavaScript expressions for
// every example, so all examples keep them in one standard form.
export function artifactPath(kind, entry) {
  const extension = kind === 'output' ? outputExtension(entry) : 'js';
  return join(ROOT, kind, `${entry.name}.${extension}`);
}

export function loadExampleInputs(entry) {
  const inputs = sourceFiles(entry).map((file) => {
    const path = join(ROOT, file);
    return [readFileSync(path, 'utf8'), path];
  });
  return loadInputs(inputs, nodeIO, { srlContext: entry.srlContext ?? null, odrl: entry.odrl ?? false,
    ...Object.fromEntries(RDF_PROFILES.map((p) => [p, entry[p] ?? false])) });
}

export const loadExample = (entry) => loadExampleInputs(entry).program;
export const outputText = (loaded, result) => writeConclusions(loaded, result, { format: defaultFormat(loaded.kind) }) ?? result.stdout;

// A certified run holds a proof that checks and agrees with the plain run.
export function certify(entry, program, output) {
  const { name } = entry;
  const proved = run(program, { proof: true });
  const report = proved.proofReport;
  if (!report || !report.valid) throw new Error(`${name}: no valid proof`);
  if (output.haltCode !== (entry.halt_code ?? null) || proved.haltCode !== output.haltCode) {
    throw new Error(`${name}: unexpected halt code`);
  }
  if (JSON.stringify(output.answers) !== JSON.stringify(proved.answers)) throw new Error(`${name}: proof changed the answers`);
  return proved;
}

export function evaluate(entry) {
  const loaded = loadExampleInputs(entry);
  const { program } = loaded;
  const output = run(program);
  const proved = certify(entry, program, output);
  return { output: outputText(loaded, output), proof: proved.proof, check: checkReport(proved.proofReport) };
}
