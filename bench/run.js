#!/usr/bin/env node
// Time RDF reasoners on the workloads of workloads.js through command adapters,
// and compare what they conclude. See bench/README.md.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseRdfMessages } from '../src/messages.js';
import { parseRdf } from '../src/rdf.js';
import { write } from '../src/writer.js';
import { baseline, files, workloads, writeWorkloads } from './workloads.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const EYEMIND = `${JSON.stringify(process.execPath)} ${JSON.stringify(join(ROOT, 'bin/eyemind.js'))} {flags} --to n-quads {ontology} {data}`;
const USAGE = `Usage: node bench/run.js [--adapter NAME=COMMAND ...] [--reference NAME] [--case ID ...]
  [--iterations N] [--timeout SECONDS] [--json FILE] [--dir DIR]
An adapter command may use {flags}, {profiles}, {ontology}, {data}, {shaclIn},
{shaclOut} and {output}; without {output} its standard output is the output.
The default adapter is eyemind.`;
// Statements about these vocabularies are axioms whose coverage differs by design.
const VOCABULARY = /^iri\('http:\/\/www\.w3\.org\/(1999\/02\/22-rdf-syntax-ns|2000\/01\/rdf-schema|2002\/07\/owl|2001\/XMLSchema)#/;
const SH = 'http://www.w3.org/ns/shacl#';
const NORMALIZED = 'https://eyereasoner.github.io/eyemind/qudt#normalizedQuantity';
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const REFLEXIVE = new Set(['http://www.w3.org/2002/07/owl#sameAs', 'http://www.w3.org/2002/07/owl#equivalentClass', 'http://www.w3.org/2002/07/owl#equivalentProperty',
  'http://www.w3.org/2000/01/rdf-schema#subClassOf', 'http://www.w3.org/2000/01/rdf-schema#subPropertyOf']);
const TRIVIAL = new Set(['http://www.w3.org/2000/01/rdf-schema#Resource', 'http://www.w3.org/2002/07/owl#Thing']);

export function parseArgs(argv) {
  const options = { adapters: [], cases: [], iterations: 3, timeout: 600, dir: join(ROOT, '.cache/bench') };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i], value = () => {
      if (i + 1 >= argv.length) throw new Error(`${arg} needs a value`);
      return argv[++i];
    };
    if (arg === '--adapter') {
      const text = value(), at = text.indexOf('=');
      if (at < 1) throw new Error(`--adapter needs NAME=COMMAND, not ${text}`);
      options.adapters.push({ name: text.slice(0, at), command: text.slice(at + 1) });
    } else if (arg === '--reference') options.reference = value();
    else if (arg === '--case') options.cases.push(value());
    else if (arg === '--iterations') options.iterations = positive(arg, value());
    else if (arg === '--timeout') options.timeout = positive(arg, value());
    else if (arg === '--json') options.json = resolve(value());
    else if (arg === '--dir') options.dir = resolve(value());
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`unknown argument ${arg}\n${USAGE}`);
  }
  if (!options.adapters.length) options.adapters.push({ name: 'eyemind', command: EYEMIND });
  options.reference ??= options.adapters[0].name;
  if (!options.adapters.some((a) => a.name === options.reference)) throw new Error(`--reference ${options.reference} names no adapter`);
  return options;
}

function positive(name, text) {
  const n = Number(text);
  if (!Number.isInteger(n) || n < 1) throw new Error(`${name} needs a positive integer, not ${text}`);
  return n;
}

const quote = (s) => `'${s.replaceAll("'", "'\\''")}'`;

// One run of an adapter: wall time of the whole process, its peak memory where
// GNU time is available, and its output.
function runOnce(adapter, workload, dir, timeout) {
  const output = join(dir, `${adapter.name}.out`), path = (file) => quote(join(dir, file));
  const { ontology, data, shaclIn, shaclOut } = files(workload);
  // A message workload streams its messages with its shapes as contracts.
  const flags = [...workload.profiles.map((p) => `--${p}`),
    ...(workload.messages ? ['--stream-messages', '--shacl-in', path(shaclIn), '--shacl-out', path(shaclOut)] : [])].join(' ');
  const fill = (text) => text.replaceAll('{flags}', flags).replaceAll('{profiles}', workload.profiles.join(','))
    .replaceAll('{ontology}', path(ontology)).replaceAll('{data}', path(data))
    .replaceAll('{shaclIn}', shaclIn ? path(shaclIn) : '').replaceAll('{shaclOut}', shaclOut ? path(shaclOut) : '')
    .replaceAll('{output}', quote(output));
  const command = fill(adapter.command) + (adapter.command.includes('{output}') ? '' : ` > ${quote(output)}`);
  // GNU timeout runs the command in its own process group, so a timeout also
  // ends the processes the adapter starts.
  const measured = existsSync('/usr/bin/time') ? `/usr/bin/time -f '%M' -o ${quote(output + '.rss')} sh -c ${quote(command)}` : `sh -c ${quote(command)}`;
  const timed = `timeout -s KILL ${timeout} ${measured}`;
  const started = performance.now();
  const result = spawnSync('sh', ['-c', timed], { encoding: 'utf8', timeout: (timeout + 30) * 1000, killSignal: 'SIGKILL', maxBuffer: 1 << 26 });
  const ms = performance.now() - started;
  if (result.error?.code === 'ETIMEDOUT' || (result.status === 137 && ms >= timeout * 1000)) return { error: `timeout after ${timeout} s` };
  if (result.status !== 0) return { error: `exit ${result.status}: ${(result.stderr || '').trim().split('\n').slice(-2).join(' ').slice(0, 300)}` };
  const rssKB = existsSync(output + '.rss') ? Number(readFileSync(output + '.rss', 'utf8').trim().split('\n').pop()) : NaN;
  return { ms, rssMB: Number.isFinite(rssKB) ? Math.round(rssKB / 1024) : undefined, output };
}

// What an output concludes beyond its input. Domain triples are those about a
// subject of the input, without blank nodes, statements about the W3C
// vocabularies, reflexive axioms or rdfs:Resource and owl:Thing typing, whose
// coverage differs between rule sets by design. A SHACL output is compared by
// its violations: each focus node with the constraint component it violates.
export function conclusions(outputText, inputTexts) {
  const key = ([s, p, o]) => `${write(s)} ${write(p)} ${write(o)}`;
  // An RDF Message log is read as the triples of all its messages.
  const inputTriples = inputTexts.flatMap((text) => text.startsWith('VERSION "1.2-messages"')
    ? parseRdfMessages(text, { format: 'trig', scope: 'bench' }).messages.flatMap((m) => m.quads)
    : parseRdf(text, { format: 'turtle', scope: 'bench' }).quads);
  const input = new Set(inputTriples.map(key)), subjects = new Set(inputTriples.flatMap(([s, , o]) => [write(s), write(o)]));
  const derived = new Map();
  for (const [s, p, o] of parseRdf(outputText, { format: 'n-quads', scope: 'bench' }).quads) {
    const t = [s, p, o];
    if (!input.has(key(t))) derived.set(key(t), t);
  }
  const blank = (t) => t instanceof Object && ['bnode', 'skolem'].includes(t.name);
  const domain = new Set([...derived].filter(([k, [s, p, o]]) => subjects.has(write(s)) && ![s, p, o].some(blank) &&
    !VOCABULARY.test(k) && !(REFLEXIVE.has(p.args?.[0]) && write(s) === write(o)) && !TRIVIAL.has(o.args?.[0])).map(([k]) => k));
  const bySubject = new Map();
  for (const t of derived.values()) {
    const k = write(t[0]);
    if (!bySubject.has(k)) bySubject.set(k, []);
    bySubject.get(k).push(t);
  }
  const objects = (s, predicate) => (bySubject.get(write(s)) ?? []).filter(([, p]) => p.args?.[0] === SH + predicate).map(([, , o]) => o);
  const results = [...derived.values()].filter(([, p, o]) => p.args?.[0] === RDF_TYPE && o.args?.[0] === SH + 'ValidationResult').map(([r]) => r);
  const violations = new Set(results.flatMap((r) => objects(r, 'focusNode').flatMap((f) =>
    (objects(r, 'sourceConstraintComponent').length ? objects(r, 'sourceConstraintComponent') : [null]).map((c) => `${write(f)} ${c ? write(c) : '?'}`))));
  const normalizedQuantities = [...derived.values()].filter(([s, p]) => p.args?.[0] === NORMALIZED && subjects.has(write(s))).length;
  return { derived: derived.size, domain, results: results.length, violations, normalizedQuantities };
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

// A run longer than ten seconds is measured once; others take the median of
// the iterations after one warmup run.
export function measure(adapter, workload, dir, { iterations, timeout }) {
  const { ontology, data } = files(workload);
  const inputs = [ontology, data].map((f) => readFileSync(join(dir, f), 'utf8'));
  const summarize = (run) => conclusions(readFileSync(run.output, 'utf8'), inputs);
  const measured = () => {
    const run = runOnce(adapter, workload, dir, timeout);
    if (run.error || !workload.expected) return run;
    const summary = summarize(run);
    for (const [field, expected] of Object.entries(workload.expected)) {
      if (summary[field] !== expected) return { error: `expected ${expected} ${field}, got ${summary[field]}` };
    }
    return { ...run, summary };
  };
  const first = measured();
  if (first.error) return first;
  const count = first.ms > 10_000 ? 1 : iterations;
  const times = [], memory = [];
  let last = first;
  for (let i = 0; i < count; i++) {
    if (first.ms <= 10_000) last = measured();
    if (last.error) return last;
    times.push(last.ms);
    memory.push(last.rssMB ?? 0);
  }
  return { ms: median(times), runs: count, rssMB: median(memory) || undefined, ...(last.summary ?? summarize(last)) };
}

export function agreement(reference, other, shacl) {
  const [a, b] = shacl ? [reference.violations, other.violations] : [reference.domain, other.domain];
  const both = [...a].filter((k) => b.has(k)).length;
  return { kind: shacl ? 'violations' : 'triples', common: both, onlyReference: a.size - both, onlyOther: b.size - both };
}

export function report(rows, adapters, reference) {
  const others = adapters.filter((a) => a.name !== reference);
  const seconds = (ms) => ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`;
  // The total, and after start-up: less the baseline of the same profiles, or
  // of the same message workload's first message.
  const time = (r) => r.error ? (r.error.startsWith('timeout') ? `> ${r.error.match(/\d+/)[0]} s` : r.error.startsWith('expected ') ? r.error : 'error') :
    r.baselineMs === undefined ? seconds(r.ms) : `${seconds(r.ms)} (${seconds(Math.max(0, r.ms - r.baselineMs))} after start-up)`;
  const head = ['Workload', 'Profiles', ...adapters.map((a) => a.name), ...others.map((a) => `${a.name} vs ${reference}`)];
  const lines = [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`];
  for (const row of rows) {
    const cells = [row.id, row.profiles.join(', '), ...adapters.map((a) => time(row.results[a.name]))];
    for (const a of others) {
      const g = row.agreement[a.name];
      cells.push(!g ? '–' : `${g.common} common ${g.kind}, ${g.onlyReference} only ${reference}, ${g.onlyOther} only ${a.name}`);
    }
    lines.push(`| ${cells.join(' | ')} |`);
  }
  return lines.join('\n');
}

async function main(argv) {
  const options = parseArgs(argv);
  if (options.help) { console.log(USAGE); return 0; }
  const selected = workloads().filter((w) => !options.cases.length || options.cases.includes(w.id));
  if (options.cases.some((id) => !selected.some((w) => w.id === id))) throw new Error(`unknown workload in ${options.cases.join(', ')}`);
  mkdirSync(options.dir, { recursive: true });
  writeWorkloads(options.dir, selected);
  // Each adapter's start-up with each profile set, measured once on empty
  // graphs, or for each message workload, with its first message.
  const baselines = new Map();
  const startup = (adapter, workload) => {
    const empty = baseline(workload), key = `${adapter.name} ${empty.id}`;
    if (!baselines.has(key)) {
      writeWorkloads(join(options.dir, 'baselines'), [empty]);
      baselines.set(key, measure(adapter, empty, join(options.dir, 'baselines', empty.id), options));
      const b = baselines.get(key);
      console.error(`${empty.id} ${adapter.name}: ${b.error ?? `${Math.round(b.ms)} ms`}`);
    }
    return baselines.get(key);
  };
  const rows = [];
  for (const workload of selected) {
    const dir = join(options.dir, workload.id), row = { id: workload.id, profiles: workload.profiles, results: {}, agreement: {} };
    for (const adapter of options.adapters) {
      const base = startup(adapter, workload);
      row.results[adapter.name] = measure(adapter, workload, dir, options);
      const r = row.results[adapter.name];
      if (!base.error && !r.error) r.baselineMs = base.ms;
      console.error(`${workload.id} ${adapter.name}: ${r.error ?? `${Math.round(r.ms)} ms, ${r.derived} new triples`}`);
    }
    const ref = row.results[options.reference];
    for (const a of options.adapters) if (a.name !== options.reference && !ref.error && !row.results[a.name].error)
      row.agreement[a.name] = agreement(ref, row.results[a.name], workload.profiles.includes('shacl'));
    rows.push(row);
    if (options.json) writeFileSync(options.json, JSON.stringify(rows, (k, v) => v instanceof Set ? v.size : v, 2) + '\n');
  }
  console.log(report(rows, options.adapters, options.reference));
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { process.exitCode = await main(process.argv.slice(2)); }
  catch (error) { console.error(`eyemind bench: ${error.message}`); process.exitCode = 1; }
}
