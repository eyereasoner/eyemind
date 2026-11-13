// The example corpus: the manifest, and evaluating an example into the
// output, proof and check report saved beside it.
import { readFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkReport, run } from '../src/index.js';
import { defaultFormat, loadInputs, writeConclusions, writeProof } from '../src/formats.js';
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
  (sourceFiles(entry).some((file) => file.endsWith('.n3')) ? 'n3' :
    sourceFiles(entry).some((file) => file.endsWith('.srl')) ? 'ttl' : 'js');
// Every file of an example, sources, data and artifacts alike, is named
// after the example, and an N3 or SRL example's name ends in -n3 or -srl.
const nativeSource = (entry) => sourceFiles(entry).find((file) => /\.(n3|srl)$/.test(file));
export function artifactPath(kind, entry) {
  const source = nativeSource(entry);
  const extension = kind === 'output' ? outputExtension(entry) : kind === 'proof' && source ? extname(source).slice(1) : 'js';
  return join(ROOT, kind, `${entry.name}.${extension}`);
}

export function loadExampleInputs(entry) {
  const inputs = sourceFiles(entry).map((file) => {
    const path = join(ROOT, file);
    return [readFileSync(path, 'utf8'), path];
  });
  return loadInputs(inputs, nodeIO, { srlContext: entry.srlContext ?? null });
}

export const loadExample = (entry) => loadExampleInputs(entry).program;
export const outputText = (loaded, result) => writeConclusions(loaded, result, { format: defaultFormat(loaded.kind) }) ?? result.stdout;

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
  const loaded = loadExampleInputs(entry);
  const { program } = loaded;
  const output = run(program);
  const proved = certify(entry, program, output);
  return { output: outputText(loaded, output), proof: writeProof(loaded, proved), check: checkReport(proved.proofReport) };
}
