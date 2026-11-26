// The inputs of a run in other formats than Logic Script, and its output as
// RDF, N3 or Logical English.
//
// A file's extension says what it holds:
//
//   .js and standard input   a Logic Script (LS) program
//   .ttl .trig .nt .nq       RDF 1.2 data: with a program, rdf(S, P, O, G)
//                            facts; with an N3 document, default triples and
//                            graph:content formulas for named graphs; with a
//                            rule set, its base graph
//   .n3                      Notation3, compiled to an LS program
//   .srl                     a SPARQL 1.2 RL rule set, compiled to one
//   .le                      Logical English, compiled to LS
//
// The odrl option adds the snapshot profile's validation and evaluation LS
// to one Turtle input. Its vocabulary alone never enables the evaluator.
// Explicit owl2rl, qudt, skos and shacl profiles share one RDF working graph;
// with odrl as well, that graph's entailments about states feed the snapshot.
//
// The compiled program is ordinary LS: proofs, checking and --unused
// apply to it. SRL execution functions capture a context that a saved proof
// retains; compiling with that context reproduces the same program later.
import { EyemindError, Struct, Var, identity, isGround } from './terms.js';
import { loadSources } from './lang.js';
import { readTerms } from './reader.js';
import { DEFAULT_GRAPH, parseRdf, rdfDocument, rdfFormat, writeRdf } from './rdf.js';
import { resultToN3, compileSources } from './n3.js';
import { compileSrl, srlAnswers, srlQuads } from './srl.js';
import { checkOdrlInput, compileOdrl } from './odrl.js';
import { compileRdfLogic, messageReasoner, RDF_PROFILES, shaclIn as shaclInPatterns, shaclOut as shaclOutPatterns } from './rdf-logic.js';
import { compileLe, writeLe } from './le.js';
import { write } from './writer.js';
import { isRdfMessageLog, parseRdfMessages } from './messages.js';

export const OUTPUT_FORMATS = ['eyemind', 'turtle', 'trig', 'n-triples', 'n-quads', 'n3', 'le'];
export { RDF_PROFILES };

// What a file holds: 'js', 'rdf', 'n3', 'srl' or 'le'.
export function inputKind(name) {
  if (rdfFormat(name)) return 'rdf';
  if (/\.n3$/i.test(name)) return 'n3';
  if (/\.srl$/i.test(name)) return 'srl';
  if (/\.le$/i.test(name)) return 'le';
  return 'js';
}

export function rdfMessageFormat(name) {
  const path = /^https?:/.test(name) ? new URL(name).pathname : name;
  return rdfFormat(path) ?? 'trig';
}

// Load inputs, given as [text, name] pairs, as one program. io may supply
// readFile, for the documents N3 and IMPORTS name, and fileIri(name), the
// base IRI of a file. Returns { kind, program, text, prefixes, compiled }:
// kind is 'js', 'n3', 'srl', 'le', 'odrl' or an RDF profile name; text is the program,
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

// The RDF inputs of the logic profiles as one graph, and the output contract
// a Logic Script input states, if any.
function profileGraph(inputs, kinds, rdf, baseOf, switches, io) {
  if (inputs.some(([, name], k) => kinds[k] !== 'rdf' && kinds[k] !== 'js' && name !== '<stdin>')) {
    throw new EyemindError(`${switches} takes RDF inputs, and a Logic Script output contract; standard input is Turtle`);
  }
  const contracts = inputs.filter(([, name], k) => kinds[k] === 'js' && name !== '<stdin>');
  const wanted = contracts.length ? contracts.flatMap(([text, name]) => outputContract(text, name, io)) : null;
  if (contracts.length && !wanted.length) throw new EyemindError(`${switches} needs a query(rdf(S, P, O)) in its output contract`);
  const prefixes = {}, quads = [];
  inputs.forEach(([text, name], k) => {
    if (kinds[k] === 'js' && name !== '<stdin>') return;
    const parsed = name === '<stdin>' ? parseRdf(text, { format: 'turtle', base: baseOf(name), scope: scopeOf(inputs, name, k) }) : rdf(text, name, k);
    if (parsed.triples) throw new EyemindError(`${switches} takes RDF graphs, not RDF Message Logs`);
    Object.assign(prefixes, parsed.prefixes);
    quads.push(...parsed.quads);
  });
  return { quads, prefixes, wanted };
}

// The triple patterns an output contract asks for: a Logic Script program
// whose statements are query(rdf(S, P, O)) or query(rdf(S, P, O, G)).
function outputContract(text, name, io) {
  const program = loadSources([[text, name]], io);
  return program.clauses.map((clause) => {
    const goal = clause.forward && clause.heads.length === 1 && clause.heads[0] === 'true' && clause.statedBody.length === 1
      ? clause.statedBody[0] : null;
    if (!(goal instanceof Struct) || goal.name !== 'rdf' || ![3, 4].includes(goal.args.length)) {
      throw new EyemindError(`${name}: an output contract states only query(rdf(S, P, O)) or query(rdf(S, P, O, G))${clause.line ? `, not line ${clause.line}` : ''}`);
    }
    return goal.args.length === 4 ? goal : new Struct('rdf', [...goal.args, new Var(`G#contract${clause.id}`)]);
  });
}

// The reasoner the logic profiles run each RDF Message with, given the
// background inputs as [text, name] pairs (rdf-logic.js).
export function loadMessageReasoner(inputs, io = null, options = {}) {
  try {
    return load(inputs, io, { ...options, messages: true });
  } catch (error) {
    if (error instanceof EyemindError || !(error instanceof Error) || error instanceof TypeError || error instanceof ReferenceError) throw error;
    throw new EyemindError(error.message);
  }
}

function load(inputs, io, { base = null, messageInputs = null, srlContext = null, odrl = false, owl2rl = false, qudt = false, skos = false, shacl = false, messages = false, shaclIn = null, shaclOut = null, limits = {} }) {
  const options = { owl2rl, qudt, skos, shacl }, profiles = RDF_PROFILES.filter((p) => options[p]);
  const switches = profiles.map((p) => '--' + p).join(' ');
  const kinds = inputs.map(([text, name]) => messageInputs?.has(name) ||
    (inputKind(name) === 'n3' && isRdfMessageLog(text)) ? 'rdf' : inputKind(name));
  const baseOf = (name) => base ?? io?.fileIri?.(name) ?? null;
  const rdf = (text, name, k) => messageInputs?.get(name) ??
    (isRdfMessageLog(text) ? parseRdfMessages : parseRdf)(text, {
      format: rdfFormat(name) ?? 'trig', base: baseOf(name), scope: scopeOf(inputs, name, k),
    });
  // These rule sets are added only when requested, never from vocabulary.
  if (kinds.includes('le')) {
    if (kinds.some((kind) => kind !== 'le') || odrl || profiles.length) {
      throw new EyemindError('a Logical English run takes .le files without RDF logic switches or other input formats');
    }
    return compileLe(inputs, io);
  }
  if (profiles.length && odrl) {
    if (inputs.length !== 1) throw new EyemindError(`--odrl with ${switches} takes one Turtle snapshot containing policies, requests and SOTW`);
    if (shaclIn || shaclOut) throw new EyemindError('--odrl cannot be combined with --shacl-in or --shacl-out');
  }
  if (profiles.length) {
    const graph = profileGraph(inputs, kinds, rdf, baseOf, switches, io);
    if (odrl) checkOdrlInput(graph.quads);
    const source = inputs.map(([, n]) => n).join(', ');
    // SHACL shapes as contracts: what messages hold, and what is wanted.
    const shapes = ([text, name]) => parseRdf(text, { format: rdfFormat(name) ?? 'turtle', base: baseOf(name) }).quads;
    if (shaclOut) graph.wanted = [...graph.wanted ?? [], ...shaclOut.flatMap((input) => shaclOutPatterns(shapes(input), input[1]))];
    graph.planned = Boolean(shaclIn || shaclOut);
    if (shaclIn) {
      const read = shaclIn.map((input) => shaclInPatterns(shapes(input), input[1]));
      const closed = read.every((r) => r.allowed);
      graph.expected = { patterns: read.flatMap((r) => r.patterns), allowed: closed ? new Set(read.flatMap((r) => [...r.allowed])) : null };
    }
    if (messages) return messageReasoner(graph, { profiles, source, limits });
    return compileRdfLogic(graph, { profiles, source, context: srlContext, odrl });
  }
  if (odrl) {
    if (inputs.length !== 1) throw new EyemindError('--odrl takes one Turtle snapshot containing policies, requests and SOTW');
    const [text, name] = inputs[0];
    return compileOdrl(parseRdf(text, { format: 'turtle', base: baseOf(name), scope: scopeOf(inputs, name, 0) }), { source: name });
  }
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
    return { kind: 'srl', program: compiled.nativeProgram ?? loadSources([[compiled.program, name]], io),
      get text() { return compiled.program; }, prefixes: compiled.prefixes, compiled };
  }
  if (kinds.includes('n3')) {
    if (kinds.includes('js')) throw new EyemindError('an N3 run takes .n3 documents and RDF data, not JavaScript programs');
    const sources = inputs.map(([t, n], k) => (kinds[k] === 'rdf' ? rdf(t, n, k) : [t, n]));
    const compiled = compileSources(sources, { base: base ?? '', baseOf: (n) => baseOf(n) ?? '', readFile: io?.readFile ?? null, readDocument: io?.readDocument ?? null,
      source: inputs.map(([, n]) => n).join(', '), native: true });
    return { kind: 'n3', program: compiled.nativeProgram ?? loadSources([[compiled.program, inputs[kinds.indexOf('n3')][1]]], io),
      get text() { return compiled.program; }, prefixes: compiled.doc.prefixes, compiled };
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

// Default output: LE for LE, N3 for N3, Turtle for SRL and the RDF logic
// extensions, and eyemind's own text for an LS program.
export const defaultFormat = (kind) => RDF_PROFILES.includes(kind) ? 'turtle' : ({ le: 'le', n3: 'n3', srl: 'turtle', odrl: 'turtle' })[kind] ?? 'eyemind';

// The conclusions of a run in an output format; null for eyemind's own text.
// all also writes given RDF or N3 data. Rejects conclusions the format cannot represent.
export function writeConclusions(loaded, result, { format, all = false, blankNodePrefix = '' } = {}) {
  if (format === 'eyemind') return null;
  if (format === 'le') {
    if (loaded.kind !== 'le') throw new EyemindError('--to le writes the answers of a Logical English run');
    return writeLe(result, loaded);
  }
  if (format === 'n3') {
    if (loaded.kind !== 'n3') throw new EyemindError('--to n3 writes the conclusions of an N3 run');
    return resultToN3(loaded.compiled.doc, result, { mode: all ? 'all' : 'new', blankNodePrefix }).n3;
  }
  let quads;
  if (loaded.kind === 'srl') {
    quads = srlQuads(loaded.compiled, srlAnswers(result), { all });
  } else {
    // Ground conclusions need not be written and read back.
    const terms = result.conclusions?.every((term) => isGround(term)) ? result.conclusions : null;
    quads = conclusionQuads(terms ?? result.answers, all ? loaded.text : null, [], terms !== null);
  }
  return writeRdf(quads, { format, prefixes: loaded.kind === 'n3' ? Object.fromEntries(loaded.prefixes) : loaded.prefixes, blankNodePrefix });
}

// Conclusions that are triples, rdf/3 or result/3, or quads, rdf/4 or
// result_rdf/4, as quads; given, the program's own rdf facts come first.
// The answers are terms, or else their texts, which name their variables as
// the run's answers do.
function conclusionQuads(answers, given, facts = [], terms = false) {
  const quads = [];
  const seen = new Set();
  const add = (t) => {
    const quad = t.args.length === 3 ? [...t.args, DEFAULT_GRAPH] : t.args;
    const key = identity(new Struct('quad', quad));
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
  for (const fact of facts) add(fact);
  for (const answer of answers) {
    const t = terms ? answer : readTerms(answer)[0][0];
    if (t === 'false') continue;
    const triple = t instanceof Struct && ['rdf', 'result', 'inf'].includes(t.name) && t.args.length === 3;
    const quad = t instanceof Struct && ['rdf', 'result_rdf'].includes(t.name) && t.args.length === 4;
    if (!triple && !quad) throw new EyemindError(`${terms ? write(answer) : answer} is no triple; write rdf(S, P, O) or rdf(S, P, O, G) conclusions, or leave out --to`);
    add(t);
  }
  return quads;
}
