// Logical English, the controlled natural language of Robert Kowalski and his
// colleagues, compiled to ordinary LS clauses. eyemind reads the core that the
// original implementation and Logical English 2 share: templates, a knowledge
// base of facts and rules, scenarios, queries and their expected answers.
// LE-SPEC.md describes what it accepts. No input text is executed.
//
// A template is a predicate whose name joins the template's words. Rules are
// backward clauses, as in LE's Prolog target. When a document has scenarios,
// every relation gets the scenario as its first argument: the knowledge base
// holds in every scenario, a scenario's facts only in that one, so a single
// program answers every query in every scenario.
import { PRIMITIVE_KEYS } from './builtins.js';
import { CONTROL_KEYS, Program, RESERVED_KEYS, Source } from './program.js';
import { loadText } from './lang.js';
import { readTerm } from './reader.js';
import { EMPTY, EyemindError, Struct, Var, conjunction } from './terms.js';
import { write } from './writer.js';

const st = (name, ...args) => new Struct(name, args);
const list = (items) => items.reduceRight((tail, head) => st('.', head, tail), EMPTY);
const RESERVED = new Set([...PRIMITIVE_KEYS, ...CONTROL_KEYS, ...RESERVED_KEYS].map((key) => key.split('/')[0]));
const SCENARIO = 'le:scenario', ANSWER = 'le:answer';
const INTRODUCING = new Set(['a', 'an', 'some', 'each', 'which']);
const OPERATORS = new Set(['+', '-', '*', '/', '//', 'mod']);
const COMPARISONS = new Set(['=', '==', '!=', '\\=', '\\==', '<', '>', '<=', '=<', '>=']);
// LE arithmetic functions and the LS functions they are.
const FUNCTIONS = { ceiling: 'ceil', floor: 'floor', round: 'round', truncate: 'trunc', integer: 'round', abs: 'abs', sqrt: 'sqrt' };
const AGGREGATES = { sum: 'le:sum', count: 'le:count', average: 'le:average', min: 'le:min', minimum: 'le:min', max: 'le:max', maximum: 'le:max', list: null };
const SECTIONS = [
  'the constants are', 'the functions are', 'the fluents are', 'the events are',
  'the event predicates are', 'the meta predicates are', 'the meta templates are', 'the facts background includes',
];

// The helper relations of aggregates, divisions, lists and dates. Their names
// contain ':', which no template name can, so they never meet a user's relation.
const HELPERS = {
  'le:sum': `implied_by(struct('le:sum', [], 0), 'true')
implied_by(struct('le:sum', [H, ...T], S), [struct('le:sum', T, S0), is(S, add(S0, H))])`,
  'le:count': `implied_by(struct('le:count', [], 0), 'true')
implied_by(struct('le:count', [H, ...T], N), [struct('le:count', T, M), is(N, add(M, 1))])`,
  'le:min': `implied_by(struct('le:min', [X], X), 'true')
implied_by(struct('le:min', [X, Y, ...T], M), [struct('le:min', [Y, ...T], M0), is(M, min(X, M0))])`,
  'le:max': `implied_by(struct('le:max', [X], X), 'true')
implied_by(struct('le:max', [X, Y, ...T], M), [struct('le:max', [Y, ...T], M0), is(M, max(X, M0))])`,
  'le:average': `implied_by(struct('le:average', [X, ...T], A), [struct('le:sum', [X, ...T], S), struct('le:count', [X, ...T], N), struct('le:divide', S, N, A)])`,
  // Prolog's division: exact for integers that divide, a float otherwise.
  'le:divide': `implied_by(struct('le:divide', A, B, Q), [is(X, A), is(Y, B), struct('le:quotient', X, Y, Q)])
implied_by(struct('le:quotient', X, Y, Q), [is_int(X), is_int(Y), eq(mod(X, Y), 0), is(Q, floordiv(X, Y))])
implied_by(struct('le:quotient', X, Y, Q), [not([is_int(X), is_int(Y), eq(mod(X, Y), 0)]), is(Q, div(X, Y))])`,
  'le:reverse': `implied_by(struct('le:reverse', L, R), struct('le:reverse', L, [], R))
implied_by(struct('le:reverse', [], R, R), 'true')
implied_by(struct('le:reverse', [H, ...T], A, R), struct('le:reverse', T, [H, ...A], R))`,
  'le:append': `implied_by(struct('le:append', [], L, L), 'true')
implied_by(struct('le:append', [H, ...T], L, [H, ...R]), struct('le:append', T, L, R))`,
  'le:member': `implied_by(struct('le:member', X, [X, ..._]), 'true')
implied_by(struct('le:member', X, [_, ...T]), struct('le:member', X, T))`,
  // Days since 1970-01-01 in the proleptic Gregorian calendar, and back.
  'le:days_after': `implied_by(struct('le:days_after', A, N, B), [is_nonvar(B), is_nonvar(N), struct('le:day_number', B, K), is(J, add(K, N)), struct('le:date_of', J, A)])
implied_by(struct('le:days_after', A, N, B), [is_nonvar(A), is_nonvar(B), is_var(N), struct('le:day_number', A, J), struct('le:day_number', B, K), is(N, sub(J, K))])
implied_by(struct('le:days_after', A, N, B), [is_nonvar(A), is_nonvar(N), is_var(B), struct('le:day_number', A, J), is(K, sub(J, N)), struct('le:date_of', K, B)])
implied_by(struct('le:day_number', date(Y, M, D), N), [
  is(Y1, sub(Y, floordiv(sub(14, M), 12))), is(Era, floordiv(Y1, 400)), is(Yoe, sub(Y1, mul(Era, 400))),
  is(Doy, add(sub(floordiv(add(mul(153, mod(add(M, 9), 12)), 2), 5), 1), D)),
  is(Doe, add(sub(add(mul(Yoe, 365), floordiv(Yoe, 4)), floordiv(Yoe, 100)), Doy)),
  is(N, sub(add(mul(Era, 146097), Doe), 719468))])
implied_by(struct('le:date_of', N, date(Y, M, D)), [
  is(Z, add(N, 719468)), is(Era, floordiv(Z, 146097)), is(Doe, sub(Z, mul(Era, 146097))),
  is(Yoe, floordiv(sub(add(sub(Doe, floordiv(Doe, 1460)), floordiv(Doe, 36524)), floordiv(Doe, 146096)), 365)),
  is(Doy, sub(Doe, sub(add(mul(365, Yoe), floordiv(Yoe, 4)), floordiv(Yoe, 100)))),
  is(Mp, floordiv(add(mul(5, Doy), 2), 153)), is(D, add(sub(Doy, floordiv(add(mul(153, Mp), 2), 5)), 1)),
  is(M, sub(add(Mp, 3), mul(12, floordiv(Mp, 10)))), is(Y, add(add(Yoe, mul(Era, 400)), floordiv(sub(14, M), 12)))])`,
};
// The helpers each helper calls.
const NEEDS = { 'le:average': ['le:sum', 'le:count', 'le:divide'] };

// ---------------------------------------------------------------- Tokens

// A word may join parts with hyphens and apostrophes; a final 's is a word of
// its own, so that "the person's" meets a template's "*a person*'s".
const WORD = /^(?:\p{N}+\p{L}|[\p{L}_])[\p{L}\p{N}_]*(?:-[\p{L}\p{N}_]+|['’](?!s(?![\p{L}\p{N}_]))[\p{L}\p{N}_]+)*/u;
const POSSESSIVE = /^['’]s(?![\p{L}\p{N}_])/u;
const DATE = /^(\d{4})-(\d{2})-(\d{2})(?![\p{L}\p{N}_])/u;
// Numbers may group thousands with commas, as in 1,000,000.
const NUMBER = /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:[eE][+-]?\d+)?(?![\p{L}\p{N}_])/u;
const SYMBOLS = ['\\==', '>=', '=<', '<=', '==', '!=', '\\=', '//'];

// Tokens carry their line, the indentation of that line (a tab counts four
// spaces, as LE's editor shows it) and whether they begin it.
function tokenize(text, file) {
  const tokens = [];
  let line = 1, indent = 0, bol = true, pos = 0;
  const fail = (message) => { throw new EyemindError(`${file}: line ${line}: Logical English: ${message}`); };
  while (pos < text.length) {
    const c = text[pos];
    if (c === '\n') { line++; indent = 0; bol = true; pos++; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { if (bol) indent += c === '\t' ? 4 : c === ' ' ? 1 : 0; pos++; continue; }
    if (c === '%' || c === '#') { while (pos < text.length && text[pos] !== '\n') pos++; continue; }
    if (text.startsWith('/*', pos)) {
      const end = text.indexOf('*/', pos + 2);
      if (end < 0) fail('a block comment is not closed with */');
      line += (text.slice(pos, end).match(/\n/g) ?? []).length;
      pos = end + 2;
      continue;
    }
    const tail = text.slice(pos);
    let token;
    if (POSSESSIVE.test(tail) && pos > 0 && !/\s/.test(text[pos - 1])) {
      token = { text: tail.slice(0, 2), kind: 'word' };
    } else if (c === '"' || c === "'") {
      const match = (c === '"' ? /^"(?:[^"\\\n]|\\.)*"/ : /^'(?:[^'\\\n]|\\.)*'/).exec(tail);
      if (!match) fail('a quoted text is not closed on its line');
      token = { text: match[0], kind: 'string', value: match[0].slice(1, -1).replace(/\\(.)/g, '$1') };
    } else if (DATE.test(tail)) {
      const [raw, y, m, d] = DATE.exec(tail);
      token = { text: raw, kind: 'date', value: [BigInt(y), BigInt(m), BigInt(d)] };
    } else if (WORD.test(tail)) {
      token = { text: WORD.exec(tail)[0], kind: 'word' };
    } else if (NUMBER.test(tail)) {
      const raw = NUMBER.exec(tail)[0];
      const digits = raw.replaceAll(',', '');
      token = { text: raw, kind: 'number', value: /[.eE]/.test(digits) ? Number(digits) : BigInt(digits) };
    } else {
      const symbol = SYMBOLS.find((s) => tail.startsWith(s)) ?? c;
      token = { text: symbol, kind: 'punct' };
      // A full stop ends a sentence when white space or the end follows it.
      if (symbol === '.' && (pos + 1 === text.length || /\s/.test(text[pos + 1]))) token.kind = 'stop';
    }
    tokens.push({ ...token, line, indent, bol });
    bol = false;
    pos += token.text.length;
  }
  tokens.push({ text: '', kind: 'end', line, indent: 0, bol: true });
  return tokens;
}

const lower = (token) => token.kind === 'word' ? token.text.toLowerCase() : token.text;
const isWord = (token, ...words) => token.kind === 'word' && words.includes(token.text.toLowerCase());
// Words joined as written: no space before a comma, a closing bracket or 's.
const joined = (words) => words.join(' ').replace(/ ([,:\])]) ?/g, '$1 ').replace(/([[(]) /g, '$1').replace(/ (['’]s)(?= |$)/g, '$1').replace(/ +$/, '');
const phrase = (tokens) => joined(tokens.map((t) => t.text));
// Whether tokens start with these words, compared without case.
const startsWith = (tokens, words, at = 0) => words.every((word, i) => tokens[at + i] && lower(tokens[at + i]) === word);
const indexOfWords = (tokens, words, from = 0) => {
  for (let i = from; i + words.length <= tokens.length; i++) if (startsWith(tokens, words, i)) return i;
  return -1;
};

// Brackets balance in a slice, and its words lie outside them.
function balanced(tokens) {
  let depth = 0;
  for (const token of tokens) {
    if (token.text === '[' || token.text === '(') depth++;
    else if (token.text === ']' || token.text === ')') { if (--depth < 0) return false; }
  }
  return depth === 0;
}

function depths(tokens) {
  const out = [];
  let depth = 0;
  for (const token of tokens) {
    if (token.kind === 'punct' && (token.text === ']' || token.text === ')')) depth--;
    out.push(depth);
    if (token.kind === 'punct' && (token.text === '[' || token.text === '(')) depth++;
  }
  return out;
}

// ---------------------------------------------------------------- Templates

// A template's parts are words and places. A place after "that" holds a
// sentence; a place after "is a" in the built-in type template holds a type.
function readTemplate(tokens, error, starred = true) {
  const parts = [];
  // In a document without asterisks, as LE1 also writes templates, "a" or
  // "an" and the word after it make a place.
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!starred && isWord(token, 'a', 'an') && tokens[i + 1]?.kind === 'word') {
      parts.push({ place: true, name: tokens[i + 1].text, meta: parts.at(-1)?.word === 'that' });
      i++;
    } else if (token.text === '*') {
      const end = tokens.findIndex((t, j) => j > i && t.text === '*');
      if (end < 0) error('a place in a template needs a closing *', token.line);
      const words = tokens.slice(i + 1, end);
      if (!words.length || !words.every((t) => t.kind === 'word')) error('a place in a template is a phrase such as *a person*', token.line);
      const named = INTRODUCING.has(lower(words[0])) || lower(words[0]) === 'the' ? words.slice(1) : words;
      parts.push({ place: true, name: named.map((t) => t.text).join(' ') || words[0].text, meta: parts.at(-1)?.word === 'that' });
      i = end;
    } else if (token.text === ';') {
      error('template additions after ";" belong to Logical English 2 and are not supported', token.line);
    } else {
      parts.push({ word: lower(token), text: token.text });
    }
  }
  if (!parts.some((part) => part.word)) error('a template needs at least one word', tokens[0]?.line);
  return parts;
}

function templateName(parts) {
  const name = parts.filter((part) => part.word).map((part) => part.text).join('_');
  return RESERVED.has(name) || name === 'date' ? `le_${name}` : name;
}

// Built-in templates. Each compiles its arguments to goals; expr marks a
// place that also takes an arithmetic formula.
const BUILTINS = [
  ['*a* is equal to *b*', (c, [a, b]) => c.equal(a, b), true],
  ['*a* is different from *b*', (c, [a, b]) => c.different(a, b), true],
  ['*a* is not equal to *b*', (c, [a, b]) => c.different(a, b), true],
  ['*a* is greater than or equal to *b*', (c, [a, b]) => c.compare('ge', a, b), true],
  ['*a* is greater or equal to *b*', (c, [a, b]) => c.compare('ge', a, b), true],
  ['*a* is less than or equal to *b*', (c, [a, b]) => c.compare('le', a, b), true],
  ['*a* is less or equal to *b*', (c, [a, b]) => c.compare('le', a, b), true],
  ['*a* is greater than *b*', (c, [a, b]) => c.compare('gt', a, b), true],
  ['*a* is less than *b*', (c, [a, b]) => c.compare('lt', a, b), true],
  ['*a* is after or equal to *b*', (c, [a, b]) => [st('or', st('compare', '>', a, b), st('compare', '=', a, b))]],
  ['*a* is before or equal to *b*', (c, [a, b]) => [st('or', st('compare', '<', a, b), st('compare', '=', a, b))]],
  ['*a* is not before *b*', (c, [a, b]) => [st('or', st('compare', '>', a, b), st('compare', '=', a, b))]],
  ['*a* is after *b*', (c, [a, b]) => [st('compare', '>', a, b)]],
  ['*a* is before *b*', (c, [a, b]) => [st('compare', '<', a, b)]],
  ['*a* is *n* days after *b*', (c, [a, n, b]) => [c.helper('le:days_after', a, n, b)]],
  ['*a* is *n* day after *b*', (c, [a, n, b]) => [c.helper('le:days_after', a, n, b)]],
  ['*a* is in *b*', (c, [a, b]) => [c.helper('le:member', a, b)]],
  ['*a* is known', (c, [a]) => [st('is_nonvar', a)]],
  ['the minimum of *a* and *b* is *c*', (c, [a, b, m]) => [st('is', m, st('min', a, b))]],
  ['the maximum of *a* and *b* is *c*', (c, [a, b, m]) => [st('is', m, st('max', a, b))]],
  ['the length of *a* is *b*', (c, [a, n]) => [c.helper('le:count', a, n)]],
  ['*a* is the reverse of *b*', (c, [a, b]) => [c.helper('le:reverse', b, a)]],
  ['appending *a* then *b* gives *c*', (c, [a, b, d]) => [c.helper('le:append', a, b, d)]],
  ['*a* has *b* as head before *c*', (c, [a, b, d]) => [st('unify', a, st('.', b, d))]],
  // LE1's "X is Y" equates, or evaluates a formula; it yields to any other
  // template. Between two names it would only fail, so it does not apply,
  // and a sentence no template matches is reported.
  ['*a* is *b*', (c, [a, b]) => a.formula || b.formula || a.term instanceof Var || b.term instanceof Var ? c.equal(a, b) : null, true],
].map(([text, compile, expr]) => {
  const parts = readTemplate(tokenize(text, 'built-in').slice(0, -1), (m) => { throw new Error(m); });
  for (const part of parts) if (part.place) part.expr = expr;
  return { parts, compile, builtin: true, words: parts.filter((p) => p.word).length };
});
// "X is a T" names a type when no template says more; it is the relation is_a.
// LE1 also writes "X is of type T".
const TYPE_TEMPLATES = ['*an object* is a *type*', '*an object* is an *type*', '*an object* is of type *type*'].map((text) => {
  const parts = readTemplate(tokenize(text, 'built-in').slice(0, -1), (m) => { throw new Error(m); });
  parts.at(-1).type = true;
  return { parts, name: 'is_a', arity: 2, typed: true, words: parts.filter((p) => p.word).length };
});

// Every way a template's words meet the tokens, as the slices of its places:
// each place takes at least one token, and its brackets balance.
function* matches(parts, tokens, i = 0, j = 0, fills = []) {
  if (i === parts.length) { if (j === tokens.length) yield fills; return; }
  const part = parts[i];
  if (part.word) {
    if (j < tokens.length && sameWord(tokens[j], part)) yield* matches(parts, tokens, i + 1, j + 1, fills);
    return;
  }
  const last = i === parts.length - 1;
  for (let k = last ? tokens.length : j + 1; k <= tokens.length; k++) {
    const slice = tokens.slice(j, k);
    if (!balanced(slice)) continue;
    yield* matches(parts, tokens, i + 1, k, [...fills, slice]);
    if (last) break;
  }
}

function sameWord(token, part) {
  const word = lower(token);
  return word === part.word || (part.word === 'a' && word === 'an') || (part.word === 'an' && word === 'a');
}

// ---------------------------------------------------------------- Variables

// An id names a variable: "a person X", or X alone. As in LE2, an id is one
// capital letter, possibly with digits, or a word of at most six capitals
// other than UK; eyemind reads short names such as Bob as names, as LE1 does.
// Alone, before any phrase introduces it, only a capital letter with
// possibly digits is a variable: LE1 programs use acronyms such as GST and
// CET as names.
const ID = /^(?:[A-Z][0-9]*|(?!UK$)[A-Z][A-Z0-9_]{1,5})$/;
const BARE_ID = /^[A-Z][0-9]*$/;

// The variables of one clause, by the phrase that introduced them and by
// their id. A scope can be saved and restored while conditions are tried.
class Scope {
  constructor() {
    this.names = new Map();
    this.used = new Set(['Scenario']);
    this.marks = [];
  }

  save() { return [new Map(this.names), new Set(this.used), this.marks.length]; }
  restore([names, used, marks]) { this.names = names; this.used = used; this.marks.length = marks; }

  find(words) {
    return this.names.get(words.map((t) => t.text.toLowerCase()).join(' ')) ??
      (words.length === 1 && ID.test(words[0].text) ? this.names.get(`#${words[0].text}`) : undefined);
  }

  introduce(words) {
    const existing = this.find(words);
    if (existing) return existing;
    const id = words.length > 1 && ID.test(words.at(-1).text) ? words.at(-1).text : words.length === 1 && ID.test(words[0].text) ? words[0].text : null;
    if (id && this.names.has(`#${id}`)) return this.names.get(`#${id}`);
    let base = id ?? words.map((t) => t.text[0].toUpperCase() + t.text.slice(1)).join('').replace(/[^\p{L}\p{N}]/gu, '');
    if (!/^\p{Lu}/u.test(base)) base = `V${base}`;
    let name = base;
    for (let n = 2; this.used.has(name); n++) name = `${base}${n}`;
    this.used.add(name);
    const variable = new Var(name);
    this.names.set(words.map((t) => t.text.toLowerCase()).join(' '), variable);
    if (id) this.names.set(`#${id}`, variable);
    return variable;
  }
}

// Where the words of an aggregate start, after its result phrase at i:
// "is the sum of each" or "is a collection of". The result phrase holds no
// connective, so an aggregate after an "and" starts after it.
function aggregateAt(tokens, i) {
  for (let k = i; k < tokens.length && !(k > i && isWord(tokens[k], 'and', 'or')); k++) {
    if (startsWith(tokens, ['is', 'the'], k) && AGGREGATES[lower(tokens[k + 2] ?? {})] !== undefined && startsWith(tokens, ['of', 'each'], k + 3)) return k;
    if (startsWith(tokens, ['is', 'a', 'collection', 'of'], k)) return k;
  }
  return -1;
}

// ---------------------------------------------------------------- Compiler

class Compiler {
  constructor(file, templates) {
    this.file = file;
    this.templates = templates;
    this.helpers = new Set();
  }

  error(message, line) { throw new EyemindError(`${this.file}: line ${line}: Logical English: ${message}`); }

  helper(name, ...args) {
    for (const needed of [name, ...(NEEDS[name] ?? [])]) this.helpers.add(needed);
    return st(name, ...args);
  }

  // A relation's goal: the scenario comes first when the document has any.
  relation(name, args) { return this.scenario === null ? st(name, ...args) : st(name, this.scenario, ...args); }

  // The term a slice of tokens names, or null when it names none.
  term(tokens, scope, { type = false } = {}) {
    if (!tokens.length) return null;
    const [first] = tokens;
    if (tokens.length === 1 && first.kind === 'string') return first.value;
    if (tokens.length === 1 && first.kind === 'date') return st('date', ...first.value);
    if (tokens.length === 1 && first.kind === 'number') return first.value;
    if (tokens.length === 2 && first.text === '-' && tokens[1].kind === 'number') return -tokens[1].value;
    if (first.text === '[' && tokens.at(-1).text === ']' && balanced(tokens.slice(1, -1))) {
      const inner = tokens.slice(1, -1), items = [];
      if (!inner.length) return EMPTY;
      const level = depths(inner);
      let start = 0;
      for (let i = 0; i <= inner.length; i++) {
        if (i < inner.length && !(inner[i].text === ',' && level[i] === 0)) continue;
        const item = this.term(inner.slice(start, i), scope);
        if (item === null) return null;
        items.push(item);
        start = i + 1;
      }
      return list(items);
    }
    if (!tokens.every((t) => t.kind === 'word' || t.kind === 'number' || t.text === '&')) return null;
    const head = lower(first), rest = tokens.slice(1);
    // A kind is a name, unless a phrase such as "which type" asks for it.
    if (type && !(INTRODUCING.has(head) && rest.length && scope.find(rest) === undefined && rest.length <= 2)) return tokens.map((t) => t.text).join(' ');
    const at = this.offset(tokens);
    if (INTRODUCING.has(head) && !(first.text === 'A' && tokens.length === 1) && rest.length && rest.length <= 6 && rest.every((t) => t.kind === 'word' && !isWord(t, 'that', 'if'))) {
      return this.mark(scope, scope.introduce(rest), at, tokens.length);
    }
    if (head === 'the' && rest.length) {
      const found = scope.find(rest);
      if (found) return this.mark(scope, found, at, tokens.length);
      return ['the', ...rest.map((t) => t.text)].join(' ');
    }
    const found = scope.find(tokens);
    if (found) return this.mark(scope, found, at, tokens.length);
    if (tokens.length === 1 && BARE_ID.test(first.text) && !this.fact) return this.mark(scope, scope.introduce(tokens), at, 1);
    return tokens.map((t) => t.text).join(' ');
  }

  // Where a slice starts in the sentence a query renders its answers from.
  offset(tokens) { return this.sentence ? this.sentence.indexOf(tokens[0]) : -1; }

  mark(scope, variable, at, length) {
    if (at >= 0) scope.marks.push({ at, length, variable });
    return variable;
  }

  // An arithmetic formula or a term: { term, goals, formula }.
  expression(tokens, scope) {
    // In a formula, ET-P is ET - P when its parts are variables.
    tokens = tokens.flatMap((t) => {
      if (t.kind !== 'word' || !t.text.includes('-') || scope.find([t])) return [t];
      const parts = t.text.split('-').map((text) => ({ ...t, text }));
      if (!parts.every((part) => scope.find([part]))) return [t];
      return parts.flatMap((part, i) => i ? [{ ...t, text: '-', kind: 'punct' }, part] : [part]);
    });
    const level = depths(tokens);
    if (!tokens.some((t, i) => level[i] === 0 && (OPERATORS.has(lower(t)) && !(t.kind === 'word' && t.text !== 'mod')) || t.text === '(')) {
      const term = this.term(tokens, scope);
      return term === null ? null : { term, goals: [], formula: false };
    }
    const goals = [];
    let at = 0;
    const peek = () => tokens[at];
    const operand = () => {
      const start = at;
      let depth = 0;
      while (at < tokens.length) {
        const t = tokens[at];
        if (t.text === '[') depth++;
        if (t.text === ']') depth--;
        if (depth === 0 && (OPERATORS.has(lower(t)) && (t.kind !== 'word' || t.text === 'mod') || t.text === '(' || t.text === ')' || t.text === ',')) break;
        at++;
      }
      if (at === start) return null;
      return this.term(tokens.slice(start, at), scope);
    };
    const factor = () => {
      const t = peek();
      if (!t) return null;
      if (t.text === '-') { at++; const f = factor(); return f === null ? null : st('neg', f); }
      if (t.text === '(') {
        at++;
        const e = sum();
        if (e === null || peek()?.text !== ')') return null;
        at++;
        return e;
      }
      if (t.kind === 'word' && FUNCTIONS[lower(t)] && tokens[at + 1]?.text === '(') {
        at += 2;
        const e = sum();
        if (e === null || peek()?.text !== ')') return null;
        at++;
        return st(FUNCTIONS[lower(t)], e);
      }
      return operand();
    };
    const product = () => {
      let left = factor();
      while (left !== null && peek() && ['*', '/', '//'].includes(peek().text) || (left !== null && peek() && peek().kind === 'word' && peek().text === 'mod')) {
        const op = peek().text;
        at++;
        const right = factor();
        if (right === null) return null;
        if (op === '/') {
          const quotient = new Var(`Q${this.quotients = (this.quotients ?? 0) + 1}`);
          goals.push(this.helper('le:divide', left, right, quotient));
          left = quotient;
        } else left = st(op === '*' ? 'mul' : op === '//' ? 'floordiv' : 'mod', left, right);
      }
      return left;
    };
    const sum = () => {
      let left = product();
      while (left !== null && peek() && (peek().text === '+' || peek().text === '-')) {
        const op = peek().text;
        at++;
        const right = product();
        if (right === null) return null;
        left = st(op === '+' ? 'add' : 'sub', left, right);
      }
      return left;
    };
    const term = sum();
    if (term === null || at !== tokens.length) return null;
    return { term, goals, formula: true };
  }

  equal(a, b) {
    if (!a.formula && !b.formula) return [...a.goals, ...b.goals, st('unify', a.term, b.term)];
    if (!a.formula) return [...b.goals, st('is', a.term, b.term)];
    if (!b.formula) return [...a.goals, st('is', b.term, a.term)];
    return [...a.goals, ...b.goals, st('eq', a.term, b.term)];
  }

  different(a, b) {
    if (!a.formula && !b.formula) return [st('not_unify', a.term, b.term)];
    return [...a.goals, ...b.goals, st('ne', a.term, b.term)];
  }

  compare(op, a, b) { return [...a.goals, ...b.goals, st(op, a.term, b.term)]; }

  // One condition: a comparison, or a sentence of a template.
  condition(tokens, scope) {
    const level = depths(tokens);
    const at = tokens.findIndex((t, i) => level[i] === 0 && t.kind === 'punct' && COMPARISONS.has(t.text));
    if (at > 0) {
      const a = this.expression(tokens.slice(0, at), scope), b = a && this.expression(tokens.slice(at + 1), scope);
      if (!a || !b) return null;
      const op = tokens[at].text;
      if (op === '=' || op === '==') return this.equal(a, b);
      if (op === '!=' || op === '\\=') return this.different(a, b);
      if (op === '\\==') return [st('not_identical', a.term, b.term)];
      return this.compare({ '<': 'lt', '>': 'gt', '<=': 'le', '=<': 'le', '>=': 'ge' }[op], a, b);
    }
    const sentence = this.sentenceOf(tokens, scope);
    if (!sentence) return null;
    if (sentence.builtin) return sentence.goals;
    return [this.relation(sentence.name, sentence.args)];
  }

  // The best template for a sentence: as in LE, one with a "that" place
  // first, then the one with the most words, a declared template before a
  // built-in one. Its arguments are the places' terms.
  sentenceOf(tokens, scope, { data = false } = {}) {
    const meta = (t) => t.parts.some((p) => p.meta) ? 1 : 0;
    const candidates = [...this.templates, ...(data ? [] : BUILTINS), ...TYPE_TEMPLATES].sort((a, b) => meta(b) - meta(a) || b.words - a.words);
    for (const template of candidates) {
      for (const fills of matches(template.parts, tokens)) {
        const saved = scope.save();
        const args = [];
        const places = template.parts.filter((p) => p.place);
        for (let i = 0; i < fills.length && args.length === i; i++) {
          const place = places[i];
          let value = null;
          if (place.meta) {
            const inner = this.sentenceOf(fills[i], scope, { data: true });
            if (inner) value = inner.builtin ? null : st(inner.name, ...inner.args);
          }
          if (value === null && place.expr) value = this.expression(fills[i], scope);
          else if (value === null) value = this.term(fills[i], scope, { type: place.type });
          if (value !== null) args.push(value);
        }
        if (args.length === fills.length) {
          // A built-in template with formula places takes { term, goals, formula }.
          const goals = template.builtin ? template.compile(this, args) : null;
          if (goals) return { builtin: true, goals };
          if (!template.builtin) return { name: template.name, args };
        }
        scope.restore(saved);
      }
    }
    return null;
  }

  // ------------------------------------------------------------ Conditions

  // A body of conditions: lines joined by "and" and "or", where a deeper
  // indentation binds tighter, as in LE. Negations, universals and aggregates
  // take the deeper lines that follow them.
  body(tokens, scope) {
    const entries = this.entries(tokens, scope);
    return this.combine(entries);
  }

  // The conditions of a slice as entries { op, indent, goals }.
  entries(tokens, scope) {
    const entries = [];
    let i = 0;
    let op = null, indent = tokens[0]?.indent ?? 0;
    while (i < tokens.length) {
      // A construct starts here: it runs to the next line that starts with a
      // connective at its own indentation or less.
      const t = tokens[i];
      const lineIndent = t.indent;
      const end = (from) => {
        for (let k = from; k < tokens.length; k++) {
          if (tokens[k].bol && isWord(tokens[k], 'and', 'or') && tokens[k].indent <= lineIndent) return k;
        }
        return tokens.length;
      };
      let construct = null, next = i;
      const negation = startsWith(tokens, ['it', 'is', 'not', 'the', 'case', 'that'], i) ? 6 : startsWith(tokens, ['not', 'the', 'case', 'that'], i) ? 4 : 0;
      if (negation) {
        next = end(i + negation);
        const inner = tokens.slice(i + negation, next);
        if (!inner.length) this.error('"it is not the case that" needs a condition', t.line);
        construct = [st('not', conjunction(this.body(inner, scope)))];
      } else if (startsWith(tokens, ['for', 'all', 'cases', 'in', 'which'], i)) {
        next = end(i + 5);
        const inner = tokens.slice(i + 5, next);
        const split = indexOfWords(inner, ['it', 'is', 'the', 'case', 'that']);
        if (split < 0) this.error('"for all cases in which" needs "it is the case that"', t.line);
        const then = inner.slice(split + 5 + (inner[split + 5]?.text === ':' ? 1 : 0));
        const conditions = this.body(inner.slice(0, split), scope), consequence = this.body(then, scope);
        construct = [st('not', conjunction([...conditions, st('not', conjunction(consequence))]))];
      } else {
        const aggregate = this.aggregate(tokens, i, scope, end);
        if (aggregate) [construct, next] = aggregate;
      }
      if (construct) {
        entries.push({ op, indent, goals: construct });
        i = next;
      } else {
        // A segment of plain conditions runs to the next line that starts
        // with a connective, or a construct.
        let k = i + 1;
        while (k < tokens.length && !(tokens[k].bol && isWord(tokens[k], 'and', 'or'))) k++;
        // A construct inside the segment, after a connective, ends it there.
        let cut = k;
        for (let m = i + 1; m < k; m++) {
          if (isWord(tokens[m - 1], 'and', 'or') && (startsWith(tokens, ['it', 'is', 'not', 'the', 'case', 'that'], m) ||
              startsWith(tokens, ['for', 'all', 'cases', 'in', 'which'], m) || aggregateAt(tokens, m) >= 0)) { cut = m - 1; break; }
        }
        const pieces = this.split(tokens.slice(i, cut), scope);
        if (!pieces) this.error(`no template matches "${phrase(tokens.slice(i, cut))}"`, t.line);
        pieces[0].op = op; pieces[0].indent = indent;
        entries.push(...pieces);
        i = cut;
      }
      if (i < tokens.length) {
        if (!isWord(tokens[i], 'and', 'or')) this.error(`expected "and" or "or" before "${phrase(tokens.slice(i, i + 6))}"`, tokens[i].line);
        op = lower(tokens[i]);
        indent = tokens[i].indent;
        i++;
      }
    }
    if (!entries.length) this.error('a condition is missing', tokens[0]?.line ?? 0);
    return entries;
  }

  // An aggregate at i: "R is the sum of each V such that" or LE's
  // "R is a collection of V where", followed by its conditions.
  aggregate(tokens, i, scope, end) {
    const k = aggregateAt(tokens, i);
    if (k >= 0) {
      if (startsWith(tokens, ['is', 'the'], k) && AGGREGATES[lower(tokens[k + 2] ?? {})] !== undefined && startsWith(tokens, ['of', 'each'], k + 3)) {
        const thatAt = indexOfWords(tokens, ['such', 'that'], k + 5);
        if (thatAt < 0) return null;
        const next = end(thatAt + 2);
        return [this.collect(tokens.slice(i, k), tokens.slice(k + 4, thatAt), tokens.slice(thatAt + 2, next), lower(tokens[k + 2]), scope), next];
      }
      if (startsWith(tokens, ['is', 'a', 'collection', 'of'], k)) {
        const whereAt = tokens.findIndex((t, m) => m > k + 4 && isWord(t, 'where'));
        if (whereAt < 0) return null;
        const next = end(whereAt + 1);
        return [this.collect(tokens.slice(i, k), tokens.slice(k + 4, whereAt), tokens.slice(whereAt + 1, next), 'list', scope), next];
      }
    }
    return null;
  }

  collect(result, each, conditions, op, scope) {
    const line = (result[0] ?? each[0]).line;
    const total = this.term(result, scope);
    if (total === null) this.error(`the result of an aggregate is a variable such as "a number N", not "${phrase(result)}"`, line);
    const template = this.term(each, scope);
    if (template === null) this.error(`an aggregate collects a variable, not "${phrase(each)}"`, line);
    if (!conditions.length) this.error('an aggregate needs conditions after "such that"', line);
    const goals = this.body(conditions, scope);
    const items = new Var(`L${this.lists = (this.lists ?? 0) + 1}`);
    const found = st('findall', template, conjunction(goals), items);
    return AGGREGATES[op] === null ? [found, st('unify', total, items)] : [found, this.helper(AGGREGATES[op], items, total)];
  }

  // Splits a segment into conditions at an inline "and" or "or", or a line
  // break, wherever every piece is a condition; fewer tokens first.
  split(tokens, scope) {
    const cuts = [];
    for (let i = 1; i < tokens.length; i++) {
      if (isWord(tokens[i], 'and', 'or') && i + 1 < tokens.length) cuts.push({ at: i, skip: 1, op: lower(tokens[i]), indent: tokens[i].indent });
      else if (tokens[i].bol && !isWord(tokens[i - 1], 'and', 'or')) cuts.push({ at: i, skip: 0, op: 'and', indent: tokens[i].indent });
    }
    const attempt = (from, start) => {
      const options = [...cuts.filter((c) => c.at > start), { at: tokens.length, skip: 0 }];
      for (const cut of options) {
        const saved = scope.save();
        const goals = this.condition(tokens.slice(start, cut.at), scope);
        if (goals) {
          if (cut.at === tokens.length) return [{ goals }];
          const rest = attempt(cut, cut.at + cut.skip);
          if (rest) { rest[0].op = cut.op; rest[0].indent = cut.indent; return [{ goals }, ...rest]; }
        }
        scope.restore(saved);
      }
      return null;
    };
    return attempt(null, 0);
  }

  // Entries joined by their connectives: the shallowest connectives last,
  // and connectives at one indentation from the top down.
  combine(entries) {
    if (entries.length === 1) return entries[0].goals;
    const least = Math.min(...entries.slice(1).map((e) => e.indent));
    const groups = [[entries[0]]];
    for (const entry of entries.slice(1)) {
      if (entry.indent === least) groups.push([entry]);
      else groups.at(-1).push(entry);
    }
    let goals = this.combine([{ ...groups[0][0], op: null }, ...groups[0].slice(1)]);
    for (const group of groups.slice(1)) {
      const right = this.combine([{ ...group[0], op: null }, ...group.slice(1)]);
      goals = group[0].op === 'or' ? [st('or', conjunction(goals), conjunction(right))] : [...goals, ...right];
    }
    return goals;
  }
}

// Variables that occur only inside negations stand for any value there: they
// are renamed _0, _1, ..., which LS negation treats as anonymous.
function anonymize(head, goals) {
  const outside = new Set(), inside = new Set();
  const visit = (term, negated) => {
    if (term instanceof Var) (negated ? inside : outside).add(term);
    else if (term instanceof Struct) {
      const deeper = negated || (term.name === 'not' && term.args.length === 1);
      for (const arg of term.args) visit(arg, deeper);
    }
  };
  visit(head, false);
  for (const goal of goals) visit(goal, false);
  let n = 0;
  for (const variable of inside) if (!outside.has(variable)) variable.name = `_${n++}`;
  return n;
}

const varsOf = (term, out = new Set()) => {
  if (term instanceof Var) out.add(term);
  else if (term instanceof Struct) for (const arg of term.args) varsOf(arg, out);
  return out;
};

function substitute(term, map) {
  if (term instanceof Var) return map.get(term) ?? term;
  if (term instanceof Struct) return new Struct(term.name, term.args.map((arg) => substitute(arg, map)));
  return term;
}

// Prolog's negation, which LE's rules are written for, succeeds when no
// instance of its goal holds if a variable of the goal is still unbound. LS
// requires the variables of a negation to be bound, so a negation whose
// variable no earlier condition binds tests at run time: while the variable
// is unbound, the negation stands for any value there.
function guardNegations(goals, bound, counter, open = false) {
  const out = [];
  for (const goal of goals) {
    if (goal instanceof Struct && goal.name === 'not' && goal.args.length === 1) {
      const inner = guardInner(goal.args[0], bound, counter, open);
      const unbound = [...varsOf(inner)].filter((v) => !/^_\d+$/.test(v.name) && !bound.has(v));
      if (!unbound.length || unbound.length > 3) out.push(st('not', inner));
      else {
        const cases = [];
        for (let mask = 0; mask < 1 << unbound.length; mask++) {
          const map = new Map(), tests = [];
          unbound.forEach((v, i) => {
            if (mask & (1 << i)) { tests.push(st('is_var', v)); map.set(v, new Var(`_${counter.n++}`)); }
            else tests.push(st('is_nonvar', v));
          });
          cases.push(conjunction([...tests, st('not', substitute(inner, map))]));
        }
        out.push(cases.reduce((a, b) => st('or', a, b)));
      }
      continue;
    }
    if (goal instanceof Struct && goal.name === 'or' && goal.args.length === 2) {
      const branches = goal.args.map((branch) => conjunction(guardNegations(flatten(branch), new Set(bound), counter, open)));
      out.push(st('or', ...branches));
      if (!open) varsOf(goal, bound);
      continue;
    }
    out.push(goal);
    if (open) continue;
    if (goal instanceof Struct && goal.name === 'findall' && goal.args.length === 3) varsOf(goal.args[2], bound);
    else varsOf(goal, bound);
  }
  return out;
}

function guardInner(goal, bound, counter, open) {
  return conjunction(guardNegations(flatten(goal), new Set(bound), counter, open));
}

function flatten(goal) {
  if (goal instanceof Struct && goal.name === 'and' && goal.args.length === 2) return [...flatten(goal.args[0]), ...flatten(goal.args[1])];
  return [goal];
}

// Variables outside negations and collections, in order: a query's answer.
function openVariables(goals) {
  const out = [];
  const visit = (term) => {
    if (term instanceof Var) { if (!out.includes(term)) out.push(term); }
    else if (term instanceof Struct && !(term.name === 'not' && term.args.length === 1) && !(term.name === 'findall' && term.args.length === 3)) {
      for (const arg of term.args) visit(arg);
    } else if (term instanceof Struct && term.name === 'findall') visit(term.args[2]);
  };
  for (const goal of goals) visit(goal);
  return out;
}

// ---------------------------------------------------------------- Documents

// The sections of one document as sentences: [kind, name, tokens, line].
function sections(tokens, file) {
  const error = (message, line) => { throw new EyemindError(`${file}: line ${line}: Logical English: ${message}`); };
  const out = [];
  let i = 0, section = null;
  const colon = (from) => {
    for (let k = from; k < tokens.length && tokens[k].kind !== 'stop' && tokens[k].kind !== 'end'; k++) if (tokens[k].text === ':') return k;
    return -1;
  };
  while (tokens[i].kind !== 'end') {
    const line = tokens[i].line;
    if (startsWith(tokens, ['the', 'target', 'language', 'is'], i)) {
      while (tokens[i].kind !== 'stop' && tokens[i].kind !== 'end') i++;
      i++;
      continue;
    }
    if (startsWith(tokens, ['the', 'templates', 'are'], i) || startsWith(tokens, ['the', 'predicates', 'are'], i)) {
      if (tokens[i + 3]?.text !== ':') error('expected ":" after "the templates are"', line);
      section = { kind: 'templates' };
      i += 4;
      continue;
    }
    // An ontology states what kinds of thing are kinds of other things.
    if (startsWith(tokens, ['the', 'ontology', 'is', ':'], i)) {
      section = { kind: 'ontology' };
      i += 4;
      continue;
    }
    // LE2 also opens a knowledge base with "the contract NAME states that:".
    if (startsWith(tokens, ['the', 'contract'], i) && colon(i) > 0 && startsWith(tokens, ['states', 'that'], colon(i) - 2)) {
      section = { kind: 'kb', name: tokens.slice(i + 2, colon(i) - 2).map((t) => t.text).join(' ') };
      i = colon(i) + 1;
      continue;
    }
    if (startsWith(tokens, ['the', 'knowledge', 'base'], i)) {
      const at = colon(i);
      const includes = at > 0 && isWord(tokens[at - 1], 'includes');
      if (!includes) {
        if (at > 0 && startsWith(tokens, ['includes', 'these'], at - 3)) error('included resources and scenarios belong to Logical English 2 and are not supported', line);
        error('expected "the knowledge base NAME includes:"', line);
      }
      section = { kind: 'kb', name: tokens.slice(i + 3, at - 1).map((t) => t.text).join(' ') };
      i = at + 1;
      continue;
    }
    if (isWord(tokens[i], 'scenario', 'query') && tokens[i].bol) {
      const at = colon(i);
      if (at > i + 2 && isWord(tokens[at - 1], 'is')) {
        const name = tokens.slice(i + 1, at - 1).map((t) => t.text).join(' ');
        section = { kind: lower(tokens[i]), name, line };
        if (section.kind === 'scenario') out.push(['scenario', name, [], line]);
        i = at + 1;
        continue;
      }
      if (at > 0) error(`the header "${phrase(tokens.slice(i, at + 1))}" belongs to Logical English 2 and is not supported`, line);
    }
    // LE2 labels a rule with "rule NAME:".
    if (isWord(tokens[i], 'rule') && colon(i) > i + 1 && colon(i) < i + 5 && tokens.slice(i + 1, colon(i)).every((t) => t.kind === 'word')) {
      error('rule labels belong to Logical English 2 and are not supported', line);
    }
    const unsupported = SECTIONS.find((words) => startsWith(tokens, words.split(' '), i));
    if (unsupported || (startsWith(tokens, ['section'], i) && tokens[i].bol && colon(i) > 0)) {
      error(`the section "${unsupported ?? 'section'}" belongs to Logical English 2 and is not supported`, line);
    }
    let end = i;
    while (tokens[end].kind !== 'stop' && tokens[end].kind !== 'end') end++;
    if (tokens[end].kind === 'end') error(`a sentence must end with a full stop: "${phrase(tokens.slice(i, Math.min(end, i + 12)))}"`, line);
    const sentence = tokens.slice(i, end);
    if (!section) error('a sentence comes before any section; start with "the templates are:"', line);
    if (section.kind === 'templates') {
      // Templates are separated by full stops, and by commas that end a
      // line or come before a place: a template's own words may hold commas.
      // A part without words of its own belongs to the template before it.
      const level = depths(sentence), parts = [];
      let start = 0;
      for (let k = 0; k <= sentence.length; k++) {
        const separates = sentence[k]?.text === ',' && level[k] === 0 && (k + 1 === sentence.length || sentence[k + 1].bol || sentence[k + 1].text === '*');
        if (k < sentence.length && !separates) continue;
        if (k > start) {
          const part = sentence.slice(start, k);
          let inside = false;
          const words = part.some((t) => { if (t.text === '*') inside = !inside; return !inside && t.kind === 'word'; });
          if (!words && parts.length && sentence[start - 1]?.text === ',') parts.at(-1).push(sentence[start - 1], ...part);
          else parts.push(part);
        }
        start = k + 1;
      }
      for (const part of parts) out.push(['template', null, part, part[0].line]);
    } else if (section.kind === 'query') {
      out.push(['query', section.name, sentence, line]);
      section = { kind: 'after query' };
    } else if (section.kind === 'after query') {
      error('a query has one sentence; start a new section after it', line);
    } else {
      out.push([{ kb: 'clause', ontology: 'ontology clause' }[section.kind] ?? 'scenario clause', section.name ?? null, sentence, line]);
    }
    i = end + 1;
  }
  return out;
}

export function compileLe(inputs) {
  const items = [];
  for (const [text, file] of inputs) {
    for (const item of sections(tokenize(String(text), file), file)) items.push([...item, file]);
  }
  // Templates first: a sentence can use a template declared after it.
  const templates = [], byName = new Map();
  const starred = items.some((item) => item[0] === 'template' && item[2].some((t) => t.text === '*'));
  for (const [kind, , tokens, line, file] of items.filter((item) => item[0] === 'template')) {
    const error = (message, at = line) => { throw new EyemindError(`${file}: line ${at}: Logical English: ${message}`); };
    const parts = readTemplate(tokens, error, starred);
    const name = templateName(parts), arity = parts.filter((p) => p.place).length, key = `${name}/${arity}`;
    if (byName.has(key)) {
      const other = byName.get(key);
      if (other.parts.map((p) => p.word ?? '*').join(' ') === parts.map((p) => p.word ?? '*').join(' ')) continue;
      error(`the templates "${other.text}" and "${phrase(tokens)}" both name the relation ${name}/${arity}; change a word of one`);
    }
    const template = { parts, name, arity, words: parts.filter((p) => p.word).length, text: phrase(tokens) };
    byName.set(key, template);
    templates.push(template);
  }
  const scenarios = [];
  for (const [kind, name, , line, file] of items) {
    if (kind !== 'scenario') continue;
    if (scenarios.includes(name)) throw new EyemindError(`${file}: line ${line}: Logical English: scenario ${name} is stated twice`);
    scenarios.push(name);
  }
  const threaded = scenarios.length > 0;
  const clauses = [], sources = [], queries = [], expectations = [], helpers = new Set(), pending = [];
  // Clauses wait until every one is read: their negations depend on whether
  // any fact or rule leaves a variable of its conclusion open.
  const emit = (kind, head, body, line, file, guard = null) => pending.push({ kind, head, body, line, file, guard });
  const write = ({ kind, head, body, line, file }) => {
    clauses.push(`// ${String(file).replace(/[\r\n\u2028\u2029]/g, ' ')}: line ${line}`);
    if (kind === 'fact') {
      clauses.push(`fact(${javascript(head)})`);
      sources.push(new Source('fact', head, [], line, file));
    } else if (kind === 'query') {
      clauses.push(`query(${javascript(head)})`);
      sources.push(new Source('query', 'true', [head], line, file));
    } else if (kind === 'forward') {
      clauses.push(`implies(${javascript(conjunction(body))}, ${javascript(head)})`);
      sources.push(new Source('forward', head, body, line, file));
    } else {
      clauses.push(`implied_by(${javascript(head)}, ${body.length ? javascript(conjunction(body)) : "'true'"})`);
      sources.push(new Source('backward', head, body.length ? body : ['true'], line, file));
    }
  };
  for (const name of scenarios) {
    const [, , , line, file] = items.find((item) => item[0] === 'scenario' && item[1] === name);
    emit('fact', st(SCENARIO, name), [], line, file);
  }
  // An ontology's kinds are transitive: what is a b is a c when the ontology
  // says that b is a c. One rule per such fact keeps the dependencies of
  // rules that negate other kinds apart.
  const kinds = [];
  for (const [kind, name, tokens, line, file] of items) {
    if (kind === 'template' || kind === 'scenario') continue;
    const compiler = new Compiler(file, templates);
    const scope = new Scope();
    if (kind === 'query') {
      compiler.scenario = threaded ? new Var('Scenario') : null;
      let body = tokens;
      // LE's "for which event:" names the thing a query asks for.
      if (startsWith(body, ['for', 'which'])) {
        const at = body.findIndex((t) => t.text === ':');
        if (at < 0) compiler.error('expected ":" after "for which ..."', line);
        compiler.term([{ text: 'which', kind: 'word' }, ...body.slice(2, at)], scope);
        body = body.slice(at + 1);
      }
      compiler.sentence = body;
      const goals = compiler.body(body, scope);
      const counter = { n: anonymize(st('true'), goals) };
      const answer = openVariables(goals).filter((v) => !/^_\d+$/.test(v.name) && v !== compiler.scenario);
      const head = st(ANSWER, name, ...(threaded ? [compiler.scenario] : []), ...answer);
      emit('backward', head, threaded ? [st(SCENARIO, compiler.scenario), ...goals] : goals, line, file, { counter, scenario: compiler.scenario });
      emit('query', head, [], line, file);
      queries.push({ name, tokens: body.map((t) => t.text), marks: scope.marks.map(({ at, length, variable }) => ({ at, length, slot: answer.indexOf(variable) })) });
      for (const h of compiler.helpers) helpers.add(h);
      continue;
    }
    const inScenario = kind === 'scenario clause';
    // An expected answer: "one expects answers [...] and unknowns [...]."
    const expects = tokens.findIndex((t, k) => isWord(t, 'expects') && (tokens[k + 1]?.text === '[' || (isWord(tokens[k + 1] ?? {}, 'answers') && tokens[k + 2]?.text === '[')));
    if (tokens.some((t, k) => isWord(t, 'expects') && isWord(tokens[k + 1] ?? {}, 'changes'))) {
      compiler.error('flip queries ("expects changes") belong to Logical English 2 and are not supported', line);
    }
    if (expects > 0) {
      if (!inScenario) compiler.error('an expectation belongs to a scenario', line);
      const list = (at) => {
        const close = tokens.findIndex((t, k) => k > at && t.text === ']');
        if (tokens[at]?.text !== '[' || close < 0) compiler.error('expected answers are a list of sentences, as in one expects answers ["..."]', line);
        // Each item is a quoted sentence, or its words up to a comma.
        const items = [];
        let words = [];
        for (const t of [...tokens.slice(at + 1, close), { text: ',' }]) {
          if (t.text !== ',') { words.push(t); continue; }
          if (words.length === 1 && words[0].kind === 'string') items.push(words[0].value);
          else if (words.length) items.push(phrase(words));
          words = [];
        }
        return [items, close];
      };
      const [answers, close] = list(expects + 1 + (isWord(tokens[expects + 1] ?? {}, 'answers') ? 1 : 0));
      // Expected unknowns are assumptions eyemind does not make.
      const unknowns = startsWith(tokens, ['and', 'unknowns'], close + 1) ? list(close + 3)[0] : [];
      expectations.push({ scenario: name, query: tokens.slice(0, expects).map((t) => t.text).join(' '), answers, unknowns, line });
      continue;
    }
    if (startsWith(tokens, ['it', 'is', 'unknown', 'whether']) || startsWith(tokens, ['it', 'must', 'not', 'be', 'true', 'that']) ||
        (startsWith(tokens, ['it', 'is', 'not', 'the', 'case', 'that']) && inScenario)) {
      compiler.error('unknowns, constraints and negated facts belong to Logical English 2 and are not supported', line);
    }
    compiler.scenario = !threaded ? null : inScenario ? name : new Var('Scenario');
    const level = depths(tokens);
    const ifAt = tokens.findIndex((t, k) => level[k] === 0 && isWord(t, 'if'));
    let headTokens = ifAt < 0 ? tokens : tokens.slice(0, ifAt);
    // In an ontology, "a student is a person" is about the kinds themselves.
    if (kind === 'ontology clause' && ifAt < 0 && isWord(headTokens[0], 'a', 'an') && !isWord(headTokens[1] ?? {}, 'is')) headTokens = headTokens.slice(1);
    if (!headTokens.length) compiler.error('a rule needs a conclusion before "if"', line);
    // In a fact, an id that no phrase introduces is a name, as in Q1.
    compiler.fact = ifAt < 0;
    const head = compiler.sentenceOf(headTokens, scope, { data: true });
    if (!head) {
      const builtin = compiler.sentenceOf(headTokens, new Scope());
      if (builtin?.builtin) compiler.error(`"${phrase(headTokens)}" is a built-in condition and cannot be concluded`, line);
      compiler.error(`no template matches "${phrase(headTokens)}"`, line);
    }
    const headTerm = compiler.relation(head.name, head.args);
    if (kind === 'ontology clause' && ifAt < 0 && head.name === 'is_a' && head.args.every(isGround)) kinds.push({ term: headTerm, line, file });
    if (ifAt < 0) {
      const body = compiler.scenario instanceof Var ? [st(SCENARIO, compiler.scenario)] : [];
      if (!body.length && isGround(headTerm)) emit('fact', headTerm, [], line, file);
      else emit('backward', headTerm, body, line, file);
      continue;
    }
    if (ifAt === tokens.length - 1) compiler.error('a rule needs conditions after "if"', line);
    // LE1 also writes "if" followed by a line that starts with "and".
    const goals = compiler.body(tokens.slice(ifAt + (isWord(tokens[ifAt + 1], 'and') ? 2 : 1)), scope);
    const counter = { n: anonymize(headTerm, goals) };
    emit('backward', headTerm, goals, line, file, { counter, scenario: compiler.scenario, rule: true });
    for (const h of compiler.helpers) helpers.add(h);
  }
  // A fact or rule may leave a variable of its conclusion open. Then no
  // earlier condition surely binds a variable, and every negation tests its
  // variables at run time.
  const open = pending.some(({ kind, head, body, guard }) => kind !== 'query' && (guard ? guard.rule : true) &&
    [...varsOf(head)].some((v) => !/^_\d+$/.test(v.name) && v.name !== 'Scenario' && !openVariables(body).includes(v)));
  for (const { term, line, file } of kinds) {
    const S = new Var('Scenario'), X = new Var('X'), [sub, kind] = term.args.slice(-2);
    const isA = (a, b) => threaded ? st('is_a', S, a, b) : st('is_a', a, b);
    emit('backward', isA(X, kind), [isA(X, sub)], line, file, { counter: { n: 0 }, scenario: threaded ? S : null, rule: true });
  }
  forwardRecursion(pending, templates, threaded);
  for (const clause of pending) {
    if (clause.guard) {
      const { counter, scenario } = clause.guard;
      clause.body = guardNegations(clause.body, new Set(scenario instanceof Var ? [scenario] : []), counter, open);
    }
    write(clause);
  }
  // The helpers follow every stated clause.
  const used = Object.keys(HELPERS).filter((name) => helpers.has(name));
  if (used.length) {
    const text = used.map((name) => HELPERS[name]).join('\n');
    clauses.push('// Logical English helpers.', text);
    sources.push(...loadText(text, 'Logical English helpers').sources.map((s) => Object.assign(s, { line: null, file: null })));
  }
  return { kind: 'le', text: '// Compiled from Logical English to Logic Script.\n\n' + clauses.join('\n') + '\n',
    program: new Program(sources), compiled: { templates, scenarios, threaded, queries, expectations } };
}

// LE runs recursive rules with tabling (LE1) or a loop check (LE2), so a rule
// that depends on itself, directly or through others, ends where Prolog's
// search would not. LS forward rules reach the least fixpoint that tabling
// computes. A recursive group of rules therefore becomes forward rules when
// each of its rules binds every variable of its conclusion through the
// relations of its conditions; a rule whose conclusion depends on how it is
// called, such as a counter that goes down, stays backward.
function forwardRecursion(pending, templates, threaded) {
  const keys = new Set([...templates.map((t) => `${t.name}/${t.arity + (threaded ? 1 : 0)}`), `is_a/${threaded ? 3 : 2}`]);
  const keyOf = (term) => term instanceof Struct ? `${term.name}/${term.args.length}` : null;
  const calls = (term, out = new Set()) => {
    if (term instanceof Struct) {
      if (keys.has(keyOf(term))) out.add(keyOf(term));
      else for (const arg of term.args) calls(arg, out);
    }
    return out;
  };
  const rules = pending.filter((clause) => clause.kind === 'backward' && clause.guard?.rule);
  const edges = new Map();
  for (const rule of rules) {
    const from = keyOf(rule.head);
    if (!edges.has(from)) edges.set(from, new Set());
    for (const goal of rule.body) for (const to of calls(goal)) edges.get(from).add(to);
  }
  // Tarjan's strongly connected components of the relations.
  const index = new Map(), low = new Map(), stack = [], onStack = new Set(), component = new Map();
  let counter = 0;
  const visit = (v) => {
    index.set(v, counter); low.set(v, counter++); stack.push(v); onStack.add(v);
    for (const w of edges.get(v) ?? []) {
      if (!index.has(w)) { visit(w); low.set(v, Math.min(low.get(v), low.get(w))); }
      else if (onStack.has(w)) low.set(v, Math.min(low.get(v), index.get(w)));
    }
    if (low.get(v) === index.get(v)) {
      const members = [];
      let w;
      do { w = stack.pop(); onStack.delete(w); members.push(w); } while (w !== v);
      for (const m of members) component.set(m, members);
    }
  };
  for (const v of edges.keys()) if (!index.has(v)) visit(v);
  const recursive = (key) => component.get(key)?.length > 1 || edges.get(key)?.has(key);
  const bound = (rule) => {
    const relations = new Set();
    for (const goal of rule.body) if (keys.has(keyOf(goal)) || keyOf(goal) === `${SCENARIO}/1`) varsOf(goal, relations);
    return [...varsOf(rule.head)].every((v) => /^_\d+$/.test(v.name) || relations.has(v));
  };
  for (const members of new Set(component.values())) {
    if (!recursive(members[0])) continue;
    const group = rules.filter((rule) => members.includes(keyOf(rule.head)));
    if (group.every(bound)) for (const rule of group) rule.kind = 'forward';
  }
}

function isGround(term) {
  if (term instanceof Var) return false;
  if (term instanceof Struct) return term.args.every(isGround);
  return true;
}

// Explicit constructors keep quoted names, floats and reserved JS names safe.
function javascript(term) {
  if (term instanceof Var) return `vars(${JSON.stringify(term.name)})`;
  if (term instanceof Struct) return `struct(${JSON.stringify(term.name)}, ${term.args.map(javascript).join(', ')})`;
  if (typeof term === 'bigint') return `${term}n`;
  if (typeof term === 'number') return `float(${write(term)})`;
  return JSON.stringify(term);
}

// ---------------------------------------------------------------- Answers

// A value as LE writes it: names as they are, dates as YYYY-MM-DD, lists in
// brackets and a sentence through its template.
function leValue(term, templates) {
  if (typeof term === 'string') return term === EMPTY ? '[]' : term;
  if (typeof term === 'bigint' || typeof term === 'number') return write(term);
  if (term instanceof Struct) {
    if (term.name === 'date' && term.args.length === 3 && term.args.every((a) => typeof a === 'bigint')) {
      const [y, m, d] = term.args.map(String);
      return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    if (term.name === '.' && term.args.length === 2) {
      const items = [];
      let rest = term;
      while (rest instanceof Struct && rest.name === '.' && rest.args.length === 2) { items.push(rest.args[0]); rest = rest.args[1]; }
      if (rest === EMPTY) return `[${items.map((item) => leValue(item, templates)).join(', ')}]`;
    }
    const template = templates.find((t) => t.name === term.name && t.arity === term.args.length);
    if (template) {
      let n = 0;
      return template.parts.map((p) => p.place ? leValue(term.args[n++], templates) : p.text).join(' ');
    }
  }
  return write(term);
}

// The answers of a query as sentences: the query's words, with each variable
// it found a value for written as that value.
function sentence(query, values, templates) {
  const words = [];
  for (let i = 0; i < query.tokens.length; i++) {
    const mark = query.marks.find((m) => m.at === i);
    const value = mark && mark.slot >= 0 ? values[mark.slot] : undefined;
    // An answer that leaves a variable open writes _ there, as LE does.
    if (value !== undefined) {
      words.push(value instanceof Var ? '_' : leValue(value, templates));
      i += mark.length - 1;
    } else words.push(query.tokens[i]);
  }
  return joined(words);
}

// The conclusions of a run: each query's answers in each scenario, as
// sentences, and any expected answers that differ from them.
export function writeLe(result, loaded) {
  const { templates, scenarios, threaded, queries, expectations } = loaded.compiled;
  const found = new Map();
  for (const answer of result.answers) {
    const term = readTerm(answer);
    if (!(term instanceof Struct) || term.name !== ANSWER) continue;
    const [name, ...rest] = term.args;
    const scenario = threaded ? rest.shift() : null;
    const query = queries.find((q) => q.name === name);
    if (!query) continue;
    const key = `${scenario}\u0000${name}`;
    if (!found.has(key)) found.set(key, []);
    const text = sentence(query, rest, templates);
    if (!found.get(key).includes(text)) found.get(key).push(text);
  }
  const blocks = [];
  for (const scenario of threaded ? scenarios : [null]) {
    for (const query of queries) {
      const answers = found.get(`${scenario}\u0000${query.name}`) ?? [];
      const title = scenario === null ? `% query ${query.name}` : `% query ${query.name} with scenario ${scenario}`;
      const lines = [title, ...(answers.length ? answers.map((a) => `${a}.`) : ['% no answers'])];
      const expected = expectations.find((e) => e.scenario === scenario && e.query === query.name && !e.unknowns.length);
      // LE2 writes the underscores of names as spaces and repeats an answer
      // for each proof; expected answers are compared as a set, either way.
      const same = (a) => a.replaceAll('_', ' ').replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim();
      const want = new Set(expected?.answers.map(same)), got = new Set(answers.map(same));
      if (expected && (want.size !== got.size || [...want].some((a) => !got.has(a)))) {
        lines.push(`% not as expected: ${query.name} expects answers [${expected.answers.map((a) => JSON.stringify(a)).join(', ')}]`);
      }
      blocks.push(lines.join('\n'));
    }
  }
  return blocks.length ? blocks.join('\n\n') + '\n' : '% no queries\n';
}
