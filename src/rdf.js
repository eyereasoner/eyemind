// RDF 1.2 in and out of eyemind: Turtle, TriG, N-Triples and N-Quads.
//
// Documents are read by the RDF lexer and parser (rdf-lexer.js,
// rdf-parser.js, rdf-prelude.js and rdf-rules.js), with the RDF 1.2
// surface checks below. Each quad becomes an eyemind term
// rdf(Subject, Predicate, Object, Graph):
//
//   IRI                          iri('https://example.org/a')
//   blank node                   bnode(Scope, Label), Scope naming the document
//   canonical xsd:integer        an integer, exact at any size
//   other literal                literal(Lexical, datatype(IRI))
//   language string              literal(Text, lang(Tag)), or lang(Tag, Direction)
//   triple term                  triple(S, P, O)
//   default graph, named graph   'default_graph', the graph's IRI or blank node
//
// Writing goes the other way; a Skolem term is a blank node, the same one for
// the same rule firing.
import { lex } from './rdf-lexer.js';
import { checkRdfSyntax } from './rdf-syntax.js';
import { Parser } from './rdf-parser.js';
import { Blank, GraphTerm, Iri, ListTerm, Literal, LOG_NS, RDF_NS, literalParts } from './rdf-prelude.js';
import { EyemindError, Struct } from './terms.js';
import { write } from './writer.js';

const XSD = 'http://www.w3.org/2001/XMLSchema#';
const RDF_TYPE = `${RDF_NS}type`;
export const DEFAULT_GRAPH = 'default_graph';

const FORMATS = { ttl: 'turtle', turtle: 'turtle', trig: 'trig', nt: 'n-triples', ntriples: 'n-triples', nq: 'n-quads', nquads: 'n-quads' };

// The RDF format a file name names by its extension, or null.
export function rdfFormat(name) {
  const m = /\.([A-Za-z]+)$/.exec(String(name));
  return m ? FORMATS[m[1].toLowerCase()] ?? null : null;
}

const st = (name, ...args) => new Struct(name, args);
const iri = (v) => st('iri', v);

// Read an RDF document. Options: format ('turtle', 'trig', 'n-triples' or
// 'n-quads'), base (IRI) and scope (for blank nodes). Returns { quads,
// prefixes }: quads are [S, P, O, G] eyemind terms, prefixes maps names to
// namespaces.
export function parseRdf(text, { format = 'turtle', base = null, scope = 'rdf' } = {}) {
  text = String(text);
  try {
    checkRdfSyntax(text, format);
    assertRdf12SurfaceSyntax(text, format);
    const parser = new Parser(lex(text, { rdf: true, trig: format === 'trig' }));
    // RDF declares every prefix it uses; N3's predeclared ones do not apply.
    parser.prefixes.map = {};
    if (base) parser.prefixes.setBase(base);
    const state = { scope, lists: 0, out: [] };
    if (format === 'n-quads') {
      while (parser.peek().typ !== 'EOF') {
        if (parser.parseDirectiveIfPresent({ allowIdentBaseIri: true })) continue;
        const s = parser.parseTerm();
        const p = parser.parseTerm();
        const o = parser.parseTerm();
        const g = parser.peek().typ === 'Dot' ? DEFAULT_GRAPH : convert(parser.parseTerm(), 'graph', DEFAULT_GRAPH, state);
        parser.expectDot();
        quad(s, p, o, g, state);
      }
    } else {
      const [, triples, forward, backward, queries] = parser.parseDocument();
      if (forward.length || backward.length || queries.length) throw new SyntaxError('an RDF document has no rules');
      for (const t of triples) {
        if (format === 'trig' && t.p instanceof Iri && t.p.value === `${LOG_NS}nameOf` && t.o instanceof GraphTerm) {
          const g = convert(t.s, 'graph', DEFAULT_GRAPH, state);
          for (const inner of t.o.triples) quad(inner.s, inner.p, inner.o, g, state);
        } else quad(t.s, t.p, t.o, DEFAULT_GRAPH, state);
      }
    }
    if (format !== 'trig' && format !== 'n-quads' && state.out.some((q) => q[3] !== DEFAULT_GRAPH)) {
      throw new SyntaxError(`${format} has no named graphs`);
    }
    return { quads: state.out, prefixes: prefixesOf(parser.prefixes) };
  } catch (error) {
    if (error instanceof EyemindError) throw error;
    throw new EyemindError(`${format}: ${error.message}`);
  }
}

function prefixesOf(env) {
  const out = {};
  for (const [name, ns] of Object.entries(env.map ?? {})) if (typeof ns === 'string' && ns !== '') out[name] = ns;
  return out;
}

function quad(s, p, o, g, state) {
  const S = convert(s, 'subject', g, state);
  const P = convert(p, 'predicate', g, state);
  const O = convert(o, 'object', g, state);
  if (!(S instanceof Struct && ['iri', 'bnode', 'triple'].includes(S.name))) throw new SyntaxError('an RDF subject is an IRI, a blank node or a triple term');
  if (!(P instanceof Struct && P.name === 'iri')) throw new SyntaxError('an RDF predicate is an IRI');
  state.out.push([S, P, O, g]);
}

function convert(term, position, graph, state, list = true) {
  if (term instanceof Iri) return iri(term.value);
  if (term instanceof Blank) return st('bnode', state.scope, String(term.label).replace(/^_:/, ''));
  if (term instanceof Literal) {
    if (position !== 'object') throw new SyntaxError(`a literal cannot be an RDF ${position}`);
    return literalTerm(term.value);
  }
  if (term instanceof GraphTerm) {
    // In RDF mode a quoted graph of one triple is a triple term.
    if (position === 'predicate' || position === 'graph' || term.triples.length !== 1) {
      throw new SyntaxError(`a quoted graph cannot be an RDF ${position}`);
    }
    const t = term.triples[0];
    const p = convert(t.p, 'predicate', graph, state, false);
    if (p.name !== 'iri') throw new SyntaxError('the predicate of a triple term is an IRI');
    return st('triple', convert(t.s, 'subject', graph, state, false), p, convert(t.o, 'object', graph, state, false));
  }
  if (term instanceof ListTerm && list) {
    if (term.elems.length === 0) return iri(`${RDF_NS}nil`);
    const nodes = term.elems.map(() => st('bnode', state.scope, `list${++state.lists}`));
    term.elems.forEach((elem, i) => {
      const value = convert(elem, 'object', graph, state);
      state.out.push([nodes[i], iri(`${RDF_NS}first`), value, graph]);
      state.out.push([nodes[i], iri(`${RDF_NS}rest`), i + 1 < nodes.length ? nodes[i + 1] : iri(`${RDF_NS}nil`), graph]);
    });
    return nodes[0];
  }
  throw new SyntaxError(`${term?.constructor?.name ?? typeof term} is no RDF term`);
}

// A parsed literal: its raw form is a quoted lexical form with a
// language tag or datatype, or a bare number or boolean.
function literalTerm(raw) {
  const text = String(raw);
  const tagged = /^(".*")@([A-Za-z]+(?:-[A-Za-z0-9]+)*)(?:--(ltr|rtl))?$/s.exec(text);
  if (tagged) {
    const lang = tagged[2].toLowerCase();
    return st('literal', unquote(tagged[1]), tagged[3] ? st('lang', lang, tagged[3]) : st('lang', lang));
  }
  const [lexical, datatype] = literalParts(text);
  const quoted = typeof lexical === 'string' && lexical.length >= 2 && lexical[0] === '"' && lexical.at(-1) === '"';
  const value = quoted ? unquote(lexical) : lexical;
  return literalOf(value, datatype ?? (quoted ? `${XSD}string` : bareDatatype(value)));
}

function unquote(lexical) {
  try {
    return JSON.parse(lexical);
  } catch {
    return lexical.slice(1, -1);
  }
}

function bareDatatype(value) {
  if (value === 'true' || value === 'false') return `${XSD}boolean`;
  if (/^[+-]?[0-9]+$/.test(value)) return `${XSD}integer`;
  if (/^[+-]?(?:[0-9]*\.[0-9]+|[0-9]+\.)$/.test(value)) return `${XSD}decimal`;
  return `${XSD}double`;
}

// A literal term: a canonical xsd:integer is an integer, any other literal
// keeps its lexical form and datatype.
export function literalOf(lexical, datatype) {
  if (datatype === `${XSD}integer` && /^(?:0|-?[1-9][0-9]*)$/.test(lexical)) return BigInt(lexical);
  return st('literal', lexical, st('datatype', datatype));
}

// The quads of a document as eyemind document text, one rdf/4 term a line,
// for facts_from.
export function rdfDocument(quads, name = 'rdf') {
  return quads.map(([s, p, o, g]) => write(st(name, s, p, o, g))).join('\n');
}

// RDF 1.2 surface checks, which the parser leaves to a separate
// pass: escaped surrogates, triple terms as subjects, and the stricter line
// syntax of N-Triples and N-Quads.
function assertRdf12SurfaceSyntax(text, format) {
  if (/\\u[dD][89a-fA-F][0-9a-fA-F]{2}/.test(text)) {
    throw new SyntaxError('RDF 1.2 numeric escape sequences must not encode UTF-16 surrogate code points');
  }
  assertNoParenthesizedTripleTermSubject(text);
  if (format === 'n-triples' || format === 'n-quads') assertLineSyntax(text);
}

function readStringAt(s, at) {
  const quote = s[at];
  let i = at;
  const long = s.startsWith(quote.repeat(3), i);
  i += long ? 3 : 1;
  while (i < s.length) {
    if (long && s.startsWith(quote.repeat(3), i)) return i + 3;
    const ch = s[i++];
    if (ch === '\\' && i < s.length) i += 1;
    else if (!long && ch === quote) return i;
  }
  return i;
}

function readIriAt(s, at) {
  let i = at + 1;
  while (i < s.length) {
    const ch = s[i++];
    if (ch === '\\' && i < s.length) i += 1;
    else if (ch === '>') return i;
  }
  return i;
}

const isWordChar = (ch) => ch != null && /[A-Za-z0-9_:-]/.test(ch);
const startsWordAt = (s, word, at) => s.startsWith(word, at) && !isWordChar(s[at - 1]) && !isWordChar(s[at + word.length]);

function skipWsAndComments(s, at) {
  let i = at;
  while (i < s.length) {
    if (/\s/.test(s[i])) i += 1;
    else if (s[i] === '#') while (i < s.length && s[i] !== '\n' && s[i] !== '\r') i += 1;
    else break;
  }
  return i;
}

function skipDirectiveAt(s, at) {
  if (s[at] === '@') {
    const lower = s.slice(at, at + 9).toLowerCase();
    if (!(lower.startsWith('@prefix') || lower.startsWith('@base') || lower.startsWith('@version'))) return null;
    let i = at;
    while (i < s.length) {
      const ch = s[i];
      if (ch === '"' || ch === "'") i = readStringAt(s, i);
      else if (ch === '<') i = readIriAt(s, i);
      else {
        i += 1;
        if (ch === '.') return i;
      }
    }
    return i;
  }
  if (!(startsWordAt(s, 'PREFIX', at) || startsWordAt(s, 'BASE', at) || startsWordAt(s, 'VERSION', at))) return null;
  // A SPARQL-style directive has no dot; it ends with its line.
  let i = at;
  while (i < s.length && s[i] !== '\n' && s[i] !== '\r') {
    if (s[i] === '"' || s[i] === "'") i = readStringAt(s, i);
    else if (s[i] === '<') i = readIriAt(s, i);
    else i += 1;
  }
  return i;
}

function assertNoParenthesizedTripleTermSubject(text) {
  let i = 0;
  let statementStart = true;
  while (i < text.length) {
    if (statementStart) {
      const start = skipWsAndComments(text, i);
      const directiveEnd = skipDirectiveAt(text, start);
      if (directiveEnd !== null) {
        i = directiveEnd;
        continue;
      }
      i = start;
      if (text.startsWith('<<(', i)) throw new SyntaxError('RDF 1.2 triple terms are not allowed in subject position');
      statementStart = false;
      continue;
    }
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      i = readStringAt(text, i);
      continue;
    }
    if (ch === '<' && !text.startsWith('<<', i)) {
      i = readIriAt(text, i);
      continue;
    }
    if (ch === '#') {
      while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i += 1;
      continue;
    }
    if (ch === '.' || ch === '{' || ch === '}') statementStart = true;
    i += 1;
  }
}

function assertLineSyntax(text) {
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '#') {
      while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      let j = readStringAt(text, i);
      if (text.startsWith('@', j)) {
        j += 1;
        const tagStart = j;
        while (j < text.length && /[A-Za-z0-9-]/.test(text[j])) j += 1;
        const tag = text.slice(tagStart, j);
        if (!/^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*(?:--(?:ltr|rtl))?$/.test(tag)) throw new SyntaxError(`invalid RDF 1.2 language tag @${tag}`);
      } else if (text.startsWith('^^<', j)) {
        const end = readIriAt(text, j + 2);
        const datatype = text.slice(j + 3, end - 1);
        if (datatype === `${RDF_NS}langString` || datatype === `${RDF_NS}dirLangString`) {
          throw new SyntaxError(`RDF datatype ${datatype} requires a language tag in RDF line syntax`);
        }
      }
      i = j;
      continue;
    }
    if (ch === '<') {
      if (text.startsWith('<<', i)) {
        if (text[skipWsAndComments(text, i + 2)] !== '(') {
          throw new SyntaxError('RDF 1.2 line syntax only allows parenthesized triple terms <<(...)>>');
        }
        i += 2;
        continue;
      }
      const end = readIriAt(text, i);
      const ref = text.slice(i + 1, end - 1);
      if (!/^[A-Za-z][A-Za-z0-9+.-]*:/.test(ref)) throw new SyntaxError(`an IRI in RDF line syntax must be absolute: <${ref}>`);
      i = end;
      continue;
    }
    if (text.startsWith('{|', i) || text.startsWith('|}', i)) throw new SyntaxError('RDF line syntax has no annotation syntax');
    if (text.startsWith('_:', i)) {
      i += 2;
      while (i < text.length && /[^\s<>"'(){}]/.test(text[i])) i += 1;
      continue;
    }
    if (startsWordAt(text, 'VERSION', i)) {
      i += 'VERSION'.length;
      continue;
    }
    if (/[A-Za-z@]/.test(ch)) throw new SyntaxError('RDF line syntax only allows the directive VERSION "..."');
    i += 1;
  }
}

// Write quads, [S, P, O, G] eyemind terms, as Turtle (or TriG when a quad is
// in a named graph) with the prefixes it uses, or as N-Triples or N-Quads.
export function writeRdf(quads, { format = 'turtle', prefixes = {} } = {}) {
  const line = format === 'n-triples' || format === 'n-quads';
  const w = new RdfWriter(line ? {} : prefixes, line);
  const body = [];
  if (line) {
    for (const [s, p, o, g] of quads) {
      if (format === 'n-triples' && g !== DEFAULT_GRAPH) continue;
      body.push(`${w.term(s)} ${w.term(p)} ${w.term(o)}${g === DEFAULT_GRAPH ? '' : ` ${w.term(g)}`} .`);
    }
    return body.map((l) => `${l}\n`).join('');
  }
  const graphs = new Map();
  for (const q of quads) {
    const key = q[3] === DEFAULT_GRAPH ? DEFAULT_GRAPH : write(q[3]);
    if (!graphs.has(key)) graphs.set(key, [q[3], []]);
    graphs.get(key)[1].push(q);
  }
  for (const [key, [g, qs]] of graphs) {
    const lines = qs.map(([s, p, o]) => `${w.term(s)} ${w.predicate(p)} ${w.term(o)} .`);
    if (key === DEFAULT_GRAPH) body.push(...lines);
    else body.push(`${w.term(g)} {`, ...lines.map((l) => `  ${l}`), '}');
  }
  const head = [...w.used].sort().map((name) => `PREFIX ${name}: <${w.prefixes.get(name)}>`);
  if (head.length && body.length) head.push('');
  return [...head, ...body].map((l) => `${l}\n`).join('');
}

const PN_LOCAL = /^(?:[A-Za-z_0-9À-�]|:)(?:[A-Za-z_0-9·À-�.:-]*[A-Za-z_0-9·À-�:-])?$/u;

class RdfWriter {
  constructor(prefixes, line) {
    this.prefixes = new Map(Object.entries(prefixes));
    this.ordered = [...this.prefixes].sort((a, b) => b[1].length - a[1].length);
    this.line = line;
    this.used = new Set();
    this.bnodes = new Map();
  }

  iri(v) {
    if (!this.line) {
      for (const [name, ns] of this.ordered) {
        if (!v.startsWith(ns)) continue;
        const local = v.slice(ns.length);
        if (local === '' || PN_LOCAL.test(local)) {
          this.used.add(name);
          return `${name}:${local}`;
        }
      }
    }
    return `<${v.replace(/[\u0000- <>"{}|^`\\]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase()}`)}>`;
  }

  predicate(p) {
    return p instanceof Struct && p.name === 'iri' && p.args[0] === RDF_TYPE ? 'a' : this.term(p);
  }

  term(t) {
    if (typeof t === 'bigint') return this.line ? `"${t}"^^<${XSD}integer>` : String(t);
    if (typeof t === 'number') return this.literal(String(t), st('datatype', `${XSD}double`));
    if (!(t instanceof Struct)) throw new EyemindError(`${write(t)} is not an RDF term`);
    const [a, b, c] = t.args;
    if (t.name === 'iri' && t.args.length === 1 && typeof a === 'string') return this.iri(a);
    if ((t.name === 'bnode' && t.args.length === 2) || (t.name === 'skolem' && t.args.length === 3)) {
      const key = write(t);
      if (!this.bnodes.has(key)) this.bnodes.set(key, `_:b${this.bnodes.size}`);
      return this.bnodes.get(key);
    }
    if (t.name === 'literal' && t.args.length === 2) return this.literal(a, b);
    if (t.name === 'triple' && t.args.length === 3) return `<<( ${this.term(a)} ${this.term(b)} ${this.term(c)} )>>`;
    throw new EyemindError(`${write(t)} is not an RDF term`);
  }

  literal(text, annotation) {
    if (typeof text !== 'string') throw new EyemindError(`a literal's text must be an atom, not ${write(text)}`);
    const lex = `"${text.replace(/[\\"\n\r]/g, (c) => ({ '\\': '\\\\', '"': '\\"', '\n': '\\n', '\r': '\\r' })[c])}"`;
    if (annotation instanceof Struct && annotation.name === 'lang') {
      const [lang, dir] = annotation.args;
      return `${lex}@${lang}${dir ? `--${dir}` : ''}`;
    }
    if (annotation instanceof Struct && annotation.name === 'datatype' && typeof annotation.args[0] === 'string') {
      const dt = annotation.args[0];
      if (dt === `${XSD}string`) return lex;
      if (!this.line) {
        if (dt === `${XSD}boolean` && (text === 'true' || text === 'false')) return text;
        if (dt === `${XSD}decimal` && /^[+-]?[0-9]*\.[0-9]+$/.test(text)) return text;
        if (dt === `${XSD}double` && /^[+-]?(?:[0-9]+\.?[0-9]*|\.[0-9]+)[eE][+-]?[0-9]+$/.test(text)) return text;
      }
      return `${lex}^^${this.iri(dt)}`;
    }
    throw new EyemindError('a literal needs datatype(IRI) or lang(Tag)');
  }
}
