// Native proof documents keep the complete compiled certificate as RDF data.
// Their formulas/triple terms are checked displays, never a second authority
// for the claims, bindings or search tables checked by C1–C10.
import { parseN3, RDF, XSD, typedLiteral } from './n3-parser.js';
import { writeN3 } from './n3-writer.js';
import { readTerms } from './reader.js';
import { Parser } from './srl-parser.js';
import { Env, EyemindError, Struct, Var, isTerm, listFromItems, properListItems } from './terms.js';

export const PROOF_NS = 'https://eyereasoner.github.io/pe#';
export const TERM_NS = 'https://eyereasoner.github.io/eyemind/proof#';
const ROOT = 'urn:eyemind:proof';
const iri = (value) => new Struct('iri', [value]);
const rdfText = (value) => [...value].every((c) => {
  const n = c.codePointAt(0);
  return n !== 0 && !(n >= 0xd800 && n <= 0xdfff) && (n & 0xfffe) !== 0xfffe;
});
const iriText = (value) => typeof value === 'string' && rdfText(value) && !/[\u0000-\u0020<>"{}|^`\\]/.test(value);
function literal(value) {
  if (rdfText(value)) return new Struct('literal', [value, new Struct('datatype', [`${XSD}string`])]);
  const hex = Array.from({ length: value.length }, (_, i) => value.charCodeAt(i).toString(16).padStart(4, '0')).join('');
  return new Struct('literal', [hex, new Struct('datatype', [`${TERM_NS}utf16`])]);
}
const list = listFromItems;
const empty = new Env();
const records = new Set(['clause/2', 'step/4', 'derived/2', 'searched/2', 'called/2']);
const record = (term) => term instanceof Struct && records.has(`${term.name}/${term.args.length}`);

// Tagged collections preserve atoms, exact integers, floats (including -0),
// variable names and arbitrary compounds without embedding executable text.
function encode(term) {
  if (term instanceof Var) return list([iri(`${TERM_NS}variable`), literal(term.name)]);
  if (typeof term === 'string') return list([iri(`${TERM_NS}atom`), literal(term)]);
  if (typeof term === 'bigint') return list([iri(`${TERM_NS}integer`), literal(String(term))]);
  if (typeof term === 'number') return list([iri(`${TERM_NS}float`), literal(Object.is(term, -0) ? '-0' : String(term))]);
  if (isTerm(term, 'iri', 1) && iriText(term.args[0])) return list([iri(`${TERM_NS}iri`), iri(term.args[0])]);
  if (isTerm(term, '.', 2)) {
    const items = properListItems(term, empty);
    if (items !== null) return list([iri(`${TERM_NS}list`), list(items.map(encode))]);
  }
  if (term instanceof Struct) return list([iri(`${TERM_NS}compound`), literal(term.name), list(term.args.map(encode))]);
  throw new EyemindError('a native proof record contains an unsupported term');
}

function native(term, format) {
  if (typeof term === 'bigint' || (typeof term === 'number' && Number.isFinite(term)) || term === '[]') return true;
  if (term instanceof Var) return format === 'n3' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(term.name);
  if (!(term instanceof Struct)) return false;
  if (isTerm(term, 'iri', 1)) return iriText(term.args[0]);
  if (isTerm(term, 'literal', 2)) {
    const [value, annotation] = term.args;
    return typeof value === 'string' && rdfText(value) && annotation instanceof Struct &&
      ((annotation.name === 'datatype' && annotation.args.length === 1 && iriText(annotation.args[0])) ||
        (annotation.name === 'lang' && [1, 2].includes(annotation.args.length) && annotation.args.every((arg) => typeof arg === 'string' && /^[A-Za-z0-9-]+$/.test(arg))));
  }
  if (isTerm(term, 'bnode', 2) || isTerm(term, 'skolem', 3)) return true;
  if (isTerm(term, 'qvar', 1) || isTerm(term, 'qbnode', 1)) return format === 'n3' && typeof term.args[0] === 'string';
  if (isTerm(term, '.', 2)) {
    const items = properListItems(term, empty);
    return items !== null && items.every((item) => native(item, format));
  }
  if (isTerm(term, 'triple', 3)) return term.args.every((arg) => native(arg, format));
  if (isTerm(term, 'graph', 1) && format === 'n3') {
    const triples = properListItems(term.args[0], empty);
    return triples !== null && triples.every((t) => isTerm(t, 'rdf', 3) && t.args.every((arg) => native(arg, format)));
  }
  return false;
}

function view(term, format) {
  if (term instanceof Struct && ['rdf', 'result', 'inf', 'base'].includes(term.name) &&
      term.args.length === 3 && term.args.every((arg) => native(arg, format))) {
    return format === 'n3' ? new Struct('graph', [list([new Struct('rdf', term.args)])]) : new Struct('triple', term.args);
  }
  return encode(term);
}

function graph(terms, format) {
  const triples = [];
  const add = (subject, predicate, object) => triples.push([iri(subject), iri(predicate), object]);
  add(ROOT, `${RDF}type`, iri(`${PROOF_NS}Proof`));
  add(ROOT, `${TERM_NS}format`, literal(format));
  add(ROOT, `${PROOF_NS}claims`, list(terms.filter((term) => !record(term)).map((term) => view(term, format))));
  terms.forEach((term, i) => {
    const id = `${ROOT}#record${i + 1}`;
    if (isTerm(term, 'step', 4)) {
      const [goal, by, bindings, uses] = term.args;
      add(id, `${PROOF_NS}conclusion`, view(goal, format));
      if (isTerm(by, 'clause', 1)) add(id, `${PROOF_NS}rule`, by.args[0]);
      else if (isTerm(by, 'source', 1)) add(id, `${PROOF_NS}source`, by.args[0]);
      else add(id, `${PROOF_NS}justification`, encode(by));
      const pairs = properListItems(bindings, empty);
      const premises = properListItems(uses, empty);
      if (pairs === null || premises === null || !pairs.every((pair) => isTerm(pair, '=', 2))) {
        throw new EyemindError('a native proof step needs bindings and uses as lists');
      }
      add(id, `${PROOF_NS}binding`, list(pairs.map(({ args: [name, value] }) =>
        list([literal(name), native(value, format) ? value : encode(value)]))));
      add(id, `${PROOF_NS}uses`, list(premises.map((premise) => view(premise, format))));
    } else if (term instanceof Struct && ['derived', 'searched', 'called'].includes(term.name) && term.args.length === 2) {
      add(id, `${PROOF_NS}${term.name}`, view(term.args[0], format));
      const answers = properListItems(term.args[1], empty);
      if (answers === null) throw new EyemindError('a native proof certificate needs an answers list');
      add(id, `${PROOF_NS}answers`, list(answers.map((answer) => view(answer, format))));
    }
  });
  // Present the readable steps first; the full compiled certificate follows.
  add(ROOT, `${TERM_NS}records`, list(terms.map((_, i) => iri(`${ROOT}#record${i + 1}`))));
  terms.forEach((term, i) => add(`${ROOT}#record${i + 1}`, `${TERM_NS}term`, encode(term)));
  return triples;
}

function render(terms, format, prefixes) {
  const names = new Map(prefixes instanceof Map ? prefixes : Object.entries(prefixes ?? {}));
  names.set('pe', PROOF_NS);
  names.set('em', TERM_NS);
  names.set('proof', `${ROOT}#`);
  const text = writeN3(graph(terms, format), { prefixes: names, strings: false });
  if (format === 'n3') return `# N3 proof: claims, steps and the complete C1–C10 certificate.\n${text}`;
  const end = text.indexOf('\n\n');
  const declarations = text.slice(0, end).split('\n').map((line) => line.slice(1, -2).replace(/^prefix /, 'PREFIX '));
  // Do not indent or otherwise rewrite the body: long literals can contain
  // newlines and text that itself looks like a prefix declaration.
  return `# SRL proof: DATA only; claims, steps and the complete C1–C10 certificate.\n${declarations.join('\n')}\n\nDATA {\n${text.slice(end + 2)}}\n`;
}

export function writeNativeProof(document, { format = 'n3', prefixes = null } = {}) {
  if (!['n3', 'srl'].includes(format)) throw new EyemindError('a native proof format must be n3 or srl');
  return render(readTerms(document).map(([term]) => term), format, prefixes);
}

function fail(message) { throw new EyemindError(`native proof: ${message}`); }
function string(term) {
  if (term?.t === 'literal' && term.dt === `${TERM_NS}utf16` && /^(?:[0-9a-f]{4})*$/.test(term.v)) {
    return term.v.replace(/[0-9a-f]{4}/g, (hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  if (term?.t !== 'literal' || term.dt !== `${XSD}string` || term.lang) fail('expected a plain string or em:utf16 literal');
  return term.v;
}
function collection(term) {
  if (term?.t !== 'list') fail('expected an RDF collection');
  return term.items;
}
function decode(term) {
  const items = collection(term);
  const tag = items[0]?.t === 'iri' ? items[0].v.slice(TERM_NS.length) : '';
  if (items[0]?.v !== `${TERM_NS}${tag}`) fail('unknown term tag');
  if (tag === 'compound' && items.length === 3) return new Struct(string(items[1]), collection(items[2]).map(decode));
  if (items.length !== 2) fail('a tagged term has the wrong number of fields');
  if (tag === 'list') return list(collection(items[1]).map(decode));
  if (tag === 'iri' && items[1]?.t === 'iri') return iri(items[1].v);
  if (tag === 'iri' && items[1]?.t === 'list' && !items[1].items.length) return iri(`${RDF}nil`);
  const value = string(items[1]);
  if (tag === 'atom') return value;
  if (tag === 'variable') return new Var(value);
  if (tag === 'integer' && /^-?(?:0|[1-9][0-9]*)$/.test(value)) return BigInt(value);
  if (tag === 'float' && value !== '' && Number.isFinite(Number(value))) return Number(value);
  fail(`invalid ${tag} term`);
}

// SRL expands collection syntax into rdf:first/rest cells. Fold only closed,
// reachable, unambiguous lists back into the same data AST that N3 reads.
function srlData(document) {
  const parsed = new Parser(document, { strictGrammar: true }).parseProgram();
  if (parsed.rules.length || parsed.imports.length) fail('an SRL proof contains DATA, never RULE or IMPORTS');
  const term = (t) => {
    if (t.type === 'iri') return { t: 'iri', v: t.value };
    if (t.type === 'blank') return { t: 'bnode', v: t.value, scope: 0 };
    if (t.type === 'literal') {
      const value = Object.is(t.value, -0) ? '-0' : String(t.value);
      return t.lang ? { t: 'literal', v: value, dt: `${RDF}langString`, lang: t.lang, dir: t.langDir }
        : typedLiteral(value, t.datatype ?? `${XSD}string`);
    }
    if (t.type === 'triple') return { t: 'triple', s: term(t.s), p: term(t.p), o: term(t.o) };
    fail('an SRL proof must be ground RDF data');
  };
  const triples = parsed.data.map((t) => ({ s: term(t.s), p: term(t.p), o: term(t.o) }));
  const cells = new Map();
  for (const t of triples) if (t.s.t === 'bnode' && [`${RDF}first`, `${RDF}rest`].includes(t.p.v)) {
    if (!cells.has(t.s.v)) cells.set(t.s.v, new Map());
    const cell = cells.get(t.s.v);
    if (cell.has(t.p.v)) fail('duplicate collection link');
    cell.set(t.p.v, t.o);
  }
  const used = new Set();
  const expand = (t, ancestors = new Set()) => {
    if (t.t === 'iri' && t.v === `${RDF}nil`) return { t: 'list', items: [] };
    if (t.t === 'triple') return { ...t, s: expand(t.s, ancestors), p: expand(t.p, ancestors), o: expand(t.o, ancestors) };
    if (t.t !== 'bnode' || !cells.has(t.v)) return t;
    const path = new Set(ancestors);
    const items = [];
    while (t.t === 'bnode' && cells.has(t.v)) {
      if (path.has(t.v)) fail('cyclic collection');
      path.add(t.v);
      const cell = cells.get(t.v);
      if (cell.size !== 2) fail('an RDF collection needs first and rest');
      used.add(t.v);
      items.push(expand(cell.get(`${RDF}first`), path));
      t = cell.get(`${RDF}rest`);
    }
    if (t.t !== 'iri' || t.v !== `${RDF}nil`) fail('an RDF collection must end in rdf:nil');
    return { t: 'list', items };
  };
  const out = triples.filter((t) => !(t.s.t === 'bnode' && cells.has(t.s.v) && [`${RDF}first`, `${RDF}rest`].includes(t.p.v)))
    .map((t) => ({ s: expand(t.s), p: expand(t.p), o: expand(t.o) }));
  if (used.size !== cells.size) fail('unreferenced collection data');
  return { triples: out };
}

// Display comparison permits prefix changes, triple reordering and consistent
// blank-node renaming. Every property is checked, including claims and uses;
// an extra assertion or an altered display cannot bypass the certificate.
function compare(actual, expected) {
  const properties = (triples) => {
    const found = new Map();
    for (const t of triples) {
      if (t.s.t !== 'iri' || t.p.t !== 'iri') fail('unexpected assertion outside a proof record');
      const key = JSON.stringify([t.s.v, t.p.v]);
      if (found.has(key)) fail('duplicate proof property');
      found.set(key, t.o);
    }
    return found;
  };
  const a = properties(actual);
  const e = properties(expected);
  if (a.size !== e.size) fail('missing or extra proof properties');
  const names = new Map();
  const reverse = new Map();
  const same = (x, y) => {
    if (!x || !y || x.t !== y.t) return false;
    if (x.t === 'bnode') {
      const kx = `${x.scope}:${x.v}`, ky = `${y.scope}:${y.v}`;
      if (names.has(kx)) return names.get(kx) === ky;
      if (reverse.has(ky)) return false;
      names.set(kx, ky); reverse.set(ky, kx);
      return true;
    }
    if (x.t === 'list') return x.items.length === y.items.length && x.items.every((t, i) => same(t, y.items[i]));
    if (x.t === 'graph') return x.triples.length === y.triples.length && x.triples.every((t, i) => sameTriple(t, y.triples[i]));
    if (x.t === 'triple') return sameTriple(x, y);
    return Object.is(x.v, y.v) && x.dt === y.dt && (x.lang ?? null) === (y.lang ?? null) && (x.dir ?? null) === (y.dir ?? null);
  };
  const sameTriple = (x, y) => same(x.s, y.s) && same(x.p, y.p) && same(x.o, y.o);
  for (const [key, value] of e) if (!same(a.get(key), value)) fail(`a displayed proof property differs from its record: ${key}`);
}

function readNative(document) {
  let parsed, format;
  try { parsed = parseN3(document); format = 'n3'; }
  catch (n3Error) {
    try { parsed = srlData(document); format = 'srl'; }
    catch (error) { throw new EyemindError(`native proof: ${error.message}`); }
  }
  const properties = new Map();
  for (const t of parsed.triples) {
    if (t.s.t !== 'iri' || t.p.t !== 'iri') fail('unexpected assertion outside a proof record');
    const key = JSON.stringify([t.s.v, t.p.v]);
    if (properties.has(key)) fail('duplicate proof record property');
    properties.set(key, t.o);
  }
  const property = (subject, predicate) => {
    const value = properties.get(JSON.stringify([subject, predicate]));
    if (!value) fail('missing proof record property');
    return value;
  };
  if (string(property(ROOT, `${TERM_NS}format`)) !== format) fail('proof format does not match its syntax');
  const ids = collection(property(ROOT, `${TERM_NS}records`));
  const terms = ids.map((id, i) => {
    if (id.t !== 'iri' || id.v !== `${ROOT}#record${i + 1}`) fail('proof records must be numbered in document order');
    return decode(property(id.v, `${TERM_NS}term`));
  });
  const expected = format === 'n3' ? parseN3(render(terms, format)) : srlData(render(terms, format));
  compare(parsed.triples, expected.triples);
  return terms;
}

export function readNativeProof(document) {
  try { return readNative(document); }
  catch (error) {
    if (error instanceof EyemindError) throw error;
    throw new EyemindError(`native proof: ${error.message}`);
  }
}

export function readProofTerms(document) {
  if (/^\s*(?:#|@|PREFIX\b|BASE\b|DATA\b|<|_:)/i.test(document)) return readNativeProof(document).map((term) => [term, 0]);
  return readTerms(document);
}
