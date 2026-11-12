// The inputs of a run in other formats than JavaScript, and its output as
// RDF or N3.
//
// A file's extension says what it holds:
//
//   .js and standard input   an eyemind program
//   .ttl .trig .nt .nq       RDF 1.2 data: with a program, rdf(S, P, O, G)
//                            facts; with an N3 document, default triples and
//                            graph:content formulas for named graphs; with a
//                            rule set, its base graph
//   .n3                      Notation3, compiled to an eyemind program
//   .srl                     a SPARQL 1.2 RL rule set, compiled to one
//
// The compiled program is ordinary eyemind: proofs, checking and --unused
// apply to it. SRL execution functions capture a context that a saved proof
// retains; compiling with that context reproduces the same program later.
import { EyemindError, Struct } from './terms.js';
import { loadSources } from './lang.js';
import { readTerms } from './reader.js';
import { DEFAULT_GRAPH, parseRdf, rdfDocument, rdfFormat, writeRdf } from './rdf.js';
import { answersToN3, compileSources } from './n3.js';
import { compileSrl, srlQuads } from './srl.js';
import { write } from './writer.js';
import { isRdfMessageLog, parseRdfMessages } from './messages.js';
import { writeNativeProof } from './native-proof.js';
import { checkProof } from './proof.js';

export const OUTPUT_FORMATS = ['eyemind', 'turtle', 'trig', 'n-triples', 'n-quads', 'n3'];

// What a file holds: 'js', 'rdf', 'n3' or 'srl'.
export function inputKind(name) {
  if (rdfFormat(name)) return 'rdf';
  if (/\.n3$/i.test(name)) return 'n3';
  if (/\.srl$/i.test(name)) return 'srl';
  return 'js';
}

export function rdfMessageFormat(name) {
  const path = /^https?:/.test(name) ? new URL(name).pathname : name;
  return rdfFormat(path) ?? 'trig';
}

// Load inputs, given as [text, name] pairs, as one program. io may supply
// readFile, for the documents N3 and IMPORTS name, and fileIri(name), the
// base IRI of a file. Returns { kind, program, text, prefixes, compiled }:
// kind is 'js', 'n3' or 'srl', text the compiled program for N3 and SRL,
// and compiled what writing the conclusions needs.
export function loadInputs(inputs, io = null, options = {}) {
  try {
    return load(inputs, io, options);
  } catch (error) {
    // The N3 and SPARQL 1.2 RL readers report errors of their own kinds.
    if (error instanceof EyemindError || !(error instanceof Error) || error instanceof TypeError || error instanceof ReferenceError) throw error;
    throw new EyemindError(error.message);
  }
}

function load(inputs, io, { base = null, messageInputs = null, srlContext = null }) {
  const kinds = inputs.map(([text, name]) => messageInputs?.has(name) ||
    (inputKind(name) === 'n3' && isRdfMessageLog(text)) ? 'rdf' : inputKind(name));
  const baseOf = (name) => base ?? io?.fileIri?.(name) ?? null;
  const rdf = (text, name, k) => messageInputs?.get(name) ??
    (isRdfMessageLog(text) ? parseRdfMessages : parseRdf)(text, {
      format: rdfFormat(name) ?? 'trig', base: baseOf(name), scope: scopeOf(inputs, name, k),
    });
  if (kinds.includes('srl')) {
    const others = kinds.filter((k) => k !== 'srl' && k !== 'rdf');
    if (kinds.filter((k) => k === 'srl').length > 1 || others.length) {
      throw new EyemindError('a SPARQL 1.2 RL run takes one .srl rule set, and RDF data for its base graph');
    }
    const [text, name] = inputs[kinds.indexOf('srl')];
    const data = inputs.flatMap(([t, n], k) => {
      if (kinds[k] !== 'rdf') return [];
      const parsed = rdf(t, n, k);
      if (parsed.triples) throw new EyemindError('RDF Message Log replay needs N3 or JavaScript rules; a SPARQL rule set takes an RDF base graph');
      return parsed.quads;
    });
    const compiled = compileSrl(text, { base: baseOf(name), filename: name, resolve: importResolver(io), data, context: srlContext });
    for (const warning of compiled.warnings) io?.stderr?.(`eyemind: warning: ${warning}\n`);
    return { kind: 'srl', program: loadSources([[compiled.program, name]], io), text: compiled.program, prefixes: compiled.prefixes, compiled };
  }
  if (kinds.includes('n3')) {
    if (kinds.includes('js')) throw new EyemindError('an N3 run takes .n3 documents and RDF data, not JavaScript programs');
    const sources = inputs.map(([t, n], k) => (kinds[k] === 'rdf' ? rdf(t, n, k) : [t, n]));
    const compiled = compileSources(sources, { base: base ?? '', baseOf: (n) => baseOf(n) ?? '', readFile: io?.readFile ?? null, readDocument: io?.readDocument ?? null,
      source: inputs.map(([, n]) => n).join(', ') });
    return { kind: 'n3', program: loadSources([[compiled.program, inputs[kinds.indexOf('n3')][1]]], io), text: compiled.program, prefixes: compiled.doc.prefixes, compiled };
  }
  // RDF data joins a program as rdf/4 facts, read without running anything.
  const prefixes = {};
  const sources = inputs.map(([t, n], k) => {
    if (kinds[k] !== 'rdf') return [t, n];
    const parsed = rdf(t, n, k);
    Object.assign(prefixes, parsed.prefixes);
    return [`facts_from({ text: ${JSON.stringify(rdfDocument(parsed.quads))} })\n`, n];
  });
  const text = sources.map(([t]) => t).join('\n');
  return { kind: 'js', program: loadSources(sources, io), text, prefixes, compiled: null };
}

// A blank-node scope per data file: its name, numbered when names repeat.
export function scopeOf(inputs, name, k) {
  const base = String(name).replace(/^.*[\\/]/, '');
  const same = inputs.filter(([, n]) => String(n).replace(/^.*[\\/]/, '') === base);
  return same.length > 1 ? `${base}#${inputs.slice(0, k).filter(([, n]) => String(n).replace(/^.*[\\/]/, '') === base).length + 1}` : base;
}

// IMPORTS of local files, read by the host.
function importResolver(io) {
  if (!io?.readFile) return null;
  return (target) => {
    if (!target.startsWith('file:')) return null;
    try {
      return io.readFile(decodeURIComponent(new URL(target).pathname));
    } catch {
      return null;
    }
  };
}

// The default output format of a run: N3 for N3, Turtle for SRL, and
// eyemind's own text for a program.
export const defaultFormat = (kind) => ({ n3: 'n3', srl: 'turtle' })[kind] ?? 'eyemind';

// The core certificate keeps its specified JavaScript form. Native inputs
// expose the same evidence as N3 or SRL data at the format boundary.
export function writeProof(loaded, result, { goals = null } = {}) {
  if (loaded.kind === 'js') return result.proof;
  const document = writeNativeProof(result.proof, { format: loaded.kind, prefixes: loaded.prefixes });
  const report = checkProof(loaded.program, document, { goals });
  if (!report.valid) throw new EyemindError(`generated ${loaded.kind} proof failed verification: ${report.failures[0].detail}`);
  return document;
}

// The conclusions of a run in an output format; null for eyemind's own text.
// all also writes the given data. Throws when a conclusion is no triple.
export function writeConclusions(loaded, result, { format, all = false, blankNodePrefix = '' } = {}) {
  if (format === 'eyemind') return null;
  const answers = result.answers;
  if (format === 'n3') {
    if (loaded.kind !== 'n3') throw new EyemindError('--to n3 writes the conclusions of an N3 run');
    return answersToN3(loaded.compiled.doc, answers, { mode: all ? 'all' : 'new', blankNodePrefix }).n3;
  }
  let quads;
  if (loaded.kind === 'srl') quads = srlQuads(loaded.text, answers, { all });
  else quads = conclusionQuads(answers, all ? loaded.text : null);
  return writeRdf(quads, { format, prefixes: loaded.kind === 'n3' ? Object.fromEntries(loaded.prefixes) : loaded.prefixes, blankNodePrefix });
}

// Conclusions that are triples, rdf/3 or result/3, or quads, rdf/4 or
// result_rdf/4, as quads; given, the program's own rdf facts come first.
function conclusionQuads(answers, given) {
  const quads = [];
  const seen = new Set();
  const add = (t) => {
    const quad = t.args.length === 3 ? [...t.args, DEFAULT_GRAPH] : t.args;
    const key = quad.map((x) => (x === DEFAULT_GRAPH ? x : write(x))).join(' ');
    if (!seen.has(key)) {
      seen.add(key);
      quads.push(quad);
    }
  };
  if (given) {
    for (const match of given.matchAll(/^facts_from\(\{ text: (".*") \}\)$/gm)) {
      for (const [t] of readTerms(JSON.parse(match[1]))) add(t);
    }
  }
  for (const answer of answers) {
    const [[t]] = readTerms(answer);
    if (t === 'false') continue;
    const triple = t instanceof Struct && ['rdf', 'result', 'inf'].includes(t.name) && t.args.length === 3;
    const quad = t instanceof Struct && ['rdf', 'result_rdf'].includes(t.name) && t.args.length === 4;
    if (!triple && !quad) throw new EyemindError(`${answer} is no triple; write rdf(S, P, O) or rdf(S, P, O, G) conclusions, or leave out --to`);
    add(t);
  }
  return quads;
}
