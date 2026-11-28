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
import { EMPTY, EyemindError, Struct, Var, conjunction, listFromItems } from './terms.js';
import { write } from './writer.js';

const st = (name, ...args) => new Struct(name, args);
const RESERVED = new Set([...PRIMITIVE_KEYS, ...CONTROL_KEYS, ...RESERVED_KEYS].map((key) => key.split('/')[0]));
const SCENARIO = 'le:scenario', ANSWER = 'le:answer';
const INTRODUCING = new Set(['a', 'an', 'some', 'each', 'which']);
const OPERATORS = new Set(['+', '-', '*', '/', '//', 'mod']);
const COMPARISONS = new Set(['=', '==', '!=', '\\=', '\\==', '<', '>', '<=', '=<', '>=']);
// LE arithmetic functions and the LS functions they are.
const FUNCTIONS = { ceiling: 'ceil', floor: 'floor', round: 'round', truncate: 'trunc', integer: 'round', abs: 'abs', sqrt: 'sqrt' };
const AGGREGATES = { sum: 'le:sum', count: 'le:count', average: 'le:average', min: 'le:min', minimum: 'le:min', max: 'le:max', maximum: 'le:max', list: null };
const SECTIONS = [
 'the fluents are', 'the events are',
  'the event predicates are', 'the meta predicates are', 'the meta templates are',
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
  // The assumptions that the facts and rules do not settle: a proved
  // sentence is not assumed, and a proved sentence cannot be assumed false.
  'le:unknowns': `implied_by(struct('le:unknowns', [], []), 'true')
implied_by(struct('le:unknowns', [G, ...T], R), [is_ground(G), findall('x', unify(G, struct('le:not', _)), []), once(struct('le:holds', G)), struct('le:unknowns', T, R)])
implied_by(struct('le:unknowns', [G, ...T], [G, ...R]), [is_ground(G), findall('x', unify(G, struct('le:not', _)), []), not(struct('le:holds', G)), struct('le:unknowns', T, R)])
implied_by(struct('le:unknowns', [struct('le:not', S), ...T], [struct('le:not', S), ...R]), [is_ground(S), not(struct('le:holds', S)), struct('le:unknowns', T, R)])
implied_by(struct('le:unknowns', [G, ...T], [G, ...R]), [findall('x', is_ground(G), []), struct('le:unknowns', T, R)])`,
  'le:coherent': `implied_by(struct('le:coherent', U), findall('x', [struct('le:member', struct('le:not', S), U), struct('le:member', S, U)], []))`,
  // For each way, in order, a negation assumes one assumption of the way
  // false, unless the way contradicts what is assumed already.
  'le:negate': `implied_by(struct('le:negate', [], A, []), 'true')
implied_by(struct('le:negate', [W, ...Ws], A, N), [findall('x', struct('le:conflicts', W, A), [X, ..._]), struct('le:negate', Ws, A, N)])
implied_by(struct('le:negate', [W, ...Ws], A, [M, ...N]), [findall('x', struct('le:conflicts', W, A), []), struct('le:member', L, W), struct('le:complement', L, M), struct('le:negate', Ws, [M, ...A], N)])
implied_by(struct('le:conflicts', W, A), [struct('le:member', L, W), struct('le:complement', L, M), struct('le:member', M, A)])
implied_by(struct('le:complement', struct('le:not', S), S), 'true')
implied_by(struct('le:complement', S, struct('le:not', S)), findall('x', unify(S, struct('le:not', _)), []))`,
  'le:choose': `implied_by(struct('le:choose', 0, _, []), 'true')
implied_by(struct('le:choose', K, [X, ...Xs], [X, ...Ys]), [gt(K, 0), is(K1, sub(K, 1)), struct('le:choose', K1, Xs, Ys)])
implied_by(struct('le:choose', K, [_, ...Xs], Ys), [gt(K, 0), struct('le:choose', K, Xs, Ys)])`,
  'le:no_empty': `implied_by(struct('le:no_empty', []), 'true')
implied_by(struct('le:no_empty', [[X, ..._], ...T]), struct('le:no_empty', T))`,
  'le:union': `implied_by(struct('le:union', [], []), 'true')
implied_by(struct('le:union', [W, ...Ws], U), [struct('le:union', Ws, U0), struct('le:append', W, U0, U)])`,
  'le:pairs': `implied_by(struct('le:pairs', [], [], []), 'true')
implied_by(struct('le:pairs', [struct('le:pair', T, W), ...Ps], [T, ...Ts], [W, ...Ws]), struct('le:pairs', Ps, Ts, Ws))`,
  // A violated constraint that one more assumption repairs is repaired.
  'le:consistent': `implied_by(struct('le:consistent', S, U, U), findall('x', struct('le:violation', S, U, _), []))
implied_by(struct('le:consistent', S, U, V), [once(struct('le:violation', S, U, F)), not_unify(F, 'none'), struct('le:consistent', S, [F, ...U], V)])`,
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
const DESIGNATOR = /^\d+(?:\.\d+)*\.(?=[ \t]*\p{L})/u;
// LE2's grouped alternatives, before ":" or a line break, and how they join
// the conditions below them.
const GROUPS = [[['at', 'least', 'one', 'of'], 'or'], [['any', 'of'], 'or'], [['either'], 'or'], [['all', 'of'], 'and']];
const DATE = /^(\d{4})-(\d{2})-(\d{2})(?![\p{L}\p{N}_])/u;
// A date followed at once by a time is a name, as written: only dates have a
// calendar meaning.
const DATE_TIME = /^\d{4}-\d{2}-\d{2}[T:]\d{2}(?::\d{2}){1,2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?(?![\p{L}\p{N}_])/u;
// A web address is a name up to white space, without a final full stop or
// comma, so that it can end a sentence.
const ADDRESS = /^[a-z][a-z0-9+.-]*:\/\/\S*[^\s.,;:]/i;
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
    } else if (bol && DESIGNATOR.test(tail)) {
      // A numbered condition starts its line with a designator such as 4.2.1.
      token = { text: DESIGNATOR.exec(tail)[0], kind: 'designator' };
    } else if (ADDRESS.test(tail)) {
      token = { text: ADDRESS.exec(tail)[0], kind: 'word' };
    } else if (DATE_TIME.test(tail)) {
      token = { text: DATE_TIME.exec(tail)[0], kind: 'word' };
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

// A name may hold words in brackets after its first word, as in "Core Based
// Statistical Areas (Branch)"; brackets around anything else are a formula.
function bracketedName(tokens) {
  let open = false;
  return tokens.every((t, i) => {
    if (t.text === '(' && t.kind === 'punct') return i > 0 && !open && tokens[i + 1]?.kind === 'word' && (open = true);
    if (t.text === ')' && t.kind === 'punct') return open && tokens[i - 1]?.text !== '(' && !(open = false);
    return t.kind === 'word' || t.kind === 'number' || t.text === '&';
  }) && !open;
}

const lower = (token) => token.kind === 'word' ? token.text.toLowerCase() : token.text;
const isWord = (token, ...words) => token.kind === 'word' && words.includes(token.text.toLowerCase());
// Words joined as written: no space before a comma, a closing bracket or 's.
const joined = (words) => words.join(' ').replace(/ ([,:\])])/g, '$1').replace(/([[(]) /g, '$1').replace(/ (['’]s)(?= |$)/g, '$1').replace(/ +$/, '');
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
  // "an" and the word after it make a place, in a template that starts with
  // one; a sentence such as "the applicant has a good credit score" keeps its
  // words.
  if (!isWord(tokens[0] ?? {}, 'a', 'an')) starred = true;
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
// LE2's admissibility of evidence: a source is admissible under itself, and
// under what the program's facts and rules say.
const ADMISSIBLE = 'is_admissible_under';
TYPE_TEMPLATES.push({ parts: readTemplate(tokenize('*a source* is admissible under *a scope*', 'built-in').slice(0, -1), (m) => { throw new Error(m); }),
  name: ADMISSIBLE, arity: 2, words: 3 });

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
const key = (words) => words.map((t) => t.text.toLowerCase()).join(' ').replaceAll('_', ' ');
const ID = /^(?:[A-Z][0-9]*|(?!UK$)[A-Z][A-Z0-9_]{1,5})$/;
const BARE_ID = /^[A-Z][0-9]*$/;

// The variables of one clause, by the phrase that introduced them and by
// their id. A scope can be saved and restored while conditions are tried.
class Scope {
  constructor() {
    this.names = new Map();
    this.used = new Set(['Scenario']);
    this.marks = [];
    // The goals that function calls in the condition being read need first,
    // and the calls made so far, so that one call is asked once.
    this.pre = [];
    this.calls = new Map();
  }

  save() { return [new Map(this.names), new Set(this.used), this.marks.length, this.pre.length, new Map(this.calls)]; }
  restore([names, used, marks, pre, calls]) {
    this.names = names; this.used = used; this.marks.length = marks; this.pre.length = pre; this.calls = calls;
  }

  // A name's underscores are spaces, as LE2 reads them: the phrase
  // "Sales Associates" refers to "a Sales_Associates".
  find(words) {
    return this.names.get(key(words)) ??
      (words.length === 1 ? this.names.get(`#${words[0].text}`) : undefined);
  }

  introduce(words) {
    const existing = this.find(words);
    if (existing) return existing;
    // After a type, LE2 also reads a short capitalized word as the id, as in
    // "a number MyD" or "an account Acc".
    const id = words.length > 1 && (ID.test(words.at(-1).text) || /^[A-Z][A-Za-z0-9]{0,2}$/.test(words.at(-1).text)) ? words.at(-1).text : words.length === 1 && ID.test(words[0].text) ? words[0].text : null;
    if (id && this.names.has(`#${id}`)) return this.names.get(`#${id}`);
    let base = id ?? words.map((t) => t.text[0].toUpperCase() + t.text.slice(1)).join('').replace(/[^\p{L}\p{N}]/gu, '');
    if (!/^\p{Lu}/u.test(base)) base = `V${base}`;
    let name = base;
    for (let n = 2; this.used.has(name); n++) name = `${base}${n}`;
    this.used.add(name);
    const variable = new Var(name);
    this.names.set(key(words), variable);
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
    if (tokens.length === 1 && (first.kind === 'string' || first.kind === 'value')) return first.value;
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
      return listFromItems(items);
    }
    // LE2's explicit variable: *a name*.
    if (first.text === '*' && tokens.at(-1).text === '*' && tokens.length > 2 && tokens.slice(1, -1).every((t) => t.kind === 'word')) {
      const words = tokens.slice(1, -1), named = INTRODUCING.has(lower(words[0])) || isWord(words[0], 'the') ? words.slice(1) : words;
      return this.mark(scope, scope.find(named) ?? scope.introduce(named.length ? named : words), this.offset(tokens), tokens.length);
    }
    if (!tokens.every((t) => t.kind === 'word' || t.kind === 'number' || t.text === '&') && !bracketedName(tokens)) {
      return tokens.some((t) => t.kind === 'value') ? this.call(tokens, scope) : null;
    }
    // A lone which, what, who, when or where asks for a value.
    if (tokens.length === 1 && isWord(first, 'which', 'what', 'who', 'when', 'where')) {
      return this.mark(scope, scope.introduce([{ ...first, text: first.text[0].toUpperCase() + first.text.slice(1) }]), this.offset(tokens), 1);
    }
    const head = lower(first), rest = tokens.slice(1);
    // A kind is a name, unless a phrase such as "which type" asks for it.
    if (type && !(INTRODUCING.has(head) && rest.length && scope.find(rest) === undefined && rest.length <= 2)) return tokens.map((t) => t.text).join(' ');
    const at = this.offset(tokens);
    if (INTRODUCING.has(head) && !(first.text === 'A' && tokens.length === 1) && rest.length && rest.length <= 6 && rest.every((t) => t.kind === 'word' && !isWord(t, 'that', 'if'))) {
      return this.mark(scope, scope.introduce(rest), at, tokens.length);
    }
    const constant = this.constants?.get(tokens.map((t) => t.text.toLowerCase()).join(' '));
    if (head === 'the' && rest.length) {
      const found = scope.find(rest);
      if (found) return this.mark(scope, found, at, tokens.length);
      if (constant !== undefined) return constant;
      return this.call(tokens, scope) ?? joined(['the', ...rest.map((t) => t.text)]);
    }
    const found = scope.find(tokens);
    if (found) return this.mark(scope, found, at, tokens.length);
    if (constant !== undefined) return constant;
    const called = this.call(tokens, scope);
    if (called !== null) return called;
    if (tokens.length === 1 && BARE_ID.test(first.text) && !this.fact) return this.mark(scope, scope.introduce(tokens), at, 1);
    return joined(tokens.map((t) => t.text));
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
      // A function with its last argument in brackets: the double of (N + 1).
      if (peek()?.text === '(' && this.templates.some((t) => t.function)) {
        const words = tokens.slice(start, at), open = at;
        at++;
        const inner = sum();
        if (inner !== null && peek()?.text === ')') {
          at++;
          const value = new Var(`V${scope.pre.length + 1}_`);
          scope.pre.push(st('is', value, inner));
          const call = this.call([...words, { text: '(…)', kind: 'value', value, line: words[0].line }], scope);
          if (call !== null) return call;
        }
        at = open;
      }
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
          const quotient = new Var(`Q${this.quotients = (this.quotients ?? 0) + 1}_`);
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
    // Prolog stops a formula over a name with an error, which LE2 reads as
    // no answer; such a condition fails.
    const names = (t) => typeof t === 'string' ? !['pi', 'e', 'tau'].includes(t) : t instanceof Struct && t.name !== 'date' && t.args.some(names);
    if (names(term)) return { term: 0n, goals: [...goals, 'fail'], formula: true };
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
  // A condition, after the goals its function calls need.
  condition(tokens, scope) {
    const start = scope.pre.length;
    const goals = this.conditionOnly(tokens, scope);
    return goals && [...scope.pre.splice(start), ...goals];
  }

  // A function phrase without its value, as in "the price of a cup with
  // capacity 200 ml": a variable that a call of the function binds.
  call(tokens, scope) {
    const functions = this.templates.filter((t) => t.function).sort((a, b) => b.words - a.words);
    for (const template of functions) {
      for (const fills of matches(template.function, tokens)) {
        const saved = scope.save();
        const args = fills.map((fill) => this.term(fill, scope));
        if (args.every((arg) => arg !== null)) {
          const key = `${template.name}(${args.map((arg) => write(arg)).join(', ')})`;
          if (scope.calls.has(key)) return scope.calls.get(key);
          const value = new Var(`F${scope.calls.size + 1}_`);
          scope.pre.push(this.relation(template.name, [...args, value]));
          scope.calls.set(key, value);
          return value;
        }
        scope.restore(saved);
      }
    }
    return null;
  }

  conditionOnly(tokens, scope) {
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
      } else if (isWord(t, 'prolog') && i + 1 < tokens.length && !tokens[i + 1].bol) {
        next = end(i + 1);
        construct = this.prologGoal(tokens.slice(i + 1, next), scope);
      } else if (this.group(tokens, i)) {
        const [words, op] = this.group(tokens, i);
        let from = i + words.length + (tokens[i + words.length]?.text === ':' ? 1 : 0);
        next = end(from);
        // Each line at the least indentation below starts one condition.
        const inner = tokens.slice(from, next), items = [];
        const least = Math.min(...inner.filter((u) => u.bol).map((u) => u.indent));
        for (const u of inner) {
          if (u.bol && u.indent === least) items.push([]);
          items.at(-1)?.push(u);
        }
        if (!items.length) this.error(`"${words.join(' ')}" needs conditions on the lines below it`, t.line);
        construct = this.join(items.map((item) => this.body(item, scope)), op);
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
        // "C according to S" proves C from the evidence admissible under S.
        // When a template's own words say "according to", the whole segment
        // is read as conditions first.
        const own = this.templates.some((t) => t.parts.some((p, k) => p.word === 'according' && t.parts[k + 1]?.word === 'to'));
        let according = indexOfWords(tokens.slice(i, cut), ['according', 'to']), whole = null;
        if (according < 0 || own) {
          const saved = scope.save();
          whole = this.split(tokens.slice(i, cut), scope);
          if (whole) according = -1;
          else scope.restore(saved);
        }
        if (according > 0) {
          const scopeTerm = this.term(tokens.slice(i + according + 2, cut), scope);
          if (scopeTerm === null) this.error(`"according to" needs a source, not "${phrase(tokens.slice(i + according + 2, cut))}"`, t.line);
          const inner = this.split(tokens.slice(i, i + according), scope);
          if (!inner) this.error(`no template matches "${phrase(tokens.slice(i, i + according))}"`, t.line);
          entries.push({ op, indent, goals: [st('le:according', conjunction(this.combine(inner)), scopeTerm)] });
          i = cut;
          if (i < tokens.length) { op = lower(tokens[i]); indent = tokens[i].indent; i++; }
          continue;
        }
        const pieces = whole ?? this.split(tokens.slice(i, cut), scope);
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

  // An embedded Prolog goal, as LE2 writes one after "prolog": conjunctions
  // with ",", disjunctions with ";", "\\+" for negation and Module:Goal, over
  // LE2's system predicates, a few Prolog tests and the relations of Prolog
  // resources. An argument may be an LE phrase such as "the person".
  prologGoal(tokens, scope) {
    const fail = (message) => this.error(message, tokens[0]?.line ?? 0);
    const level = depths(tokens);
    const split = (sep) => {
      const parts = [];
      let start = 0;
      for (let k = 0; k <= tokens.length; k++) {
        if (k < tokens.length && !(tokens[k].text === sep && level[k] === 0)) continue;
        parts.push(tokens.slice(start, k));
        start = k + 1;
      }
      return parts;
    };
    if (!tokens.length) fail('a prolog goal is missing');
    const alternatives = split(';');
    if (alternatives.length > 1) return [alternatives.map((part) => conjunction(this.prologGoal(part, scope))).reduce((a, b) => st('or', a, b))];
    const parts = split(',');
    if (parts.length > 1) return parts.flatMap((part) => this.prologGoal(part, scope));
    if (tokens[0].text === '(' && tokens.at(-1).text === ')' && balanced(tokens.slice(1, -1))) return this.prologGoal(tokens.slice(1, -1), scope);
    if (tokens[0].text === '\\' && tokens[1]?.text === '+') return [st('not', conjunction(this.prologGoal(tokens.slice(2), scope)))];
    const colon = tokens.findIndex((t, k) => level[k] === 0 && t.text === ':' && tokens[k + 1]?.text !== '-');
    if (colon > 0) return this.prologGoal(tokens.slice(colon + 1), scope);
    const tests = { '=': 'unify', '\\=': 'not_unify', '==': 'identical', '\\==': 'not_identical', '<': 'lt', '>': 'gt', '=<': 'le', '>=': 'ge' };
    const op = tokens.findIndex((t, k) => level[k] === 0 && t.kind === 'punct' && tests[t.text]);
    if (op > 0) return [st(tests[tokens[op].text], this.prologArg(tokens.slice(0, op), scope), this.prologArg(tokens.slice(op + 1), scope))];
    const goal = this.prologArg(tokens, scope, true);
    const [name, args] = goal instanceof Struct ? [goal.name, goal.args] : [goal, []];
    const system = {
      'le_my_kb/1': () => this.kb === null ? 'fail' : st('unify', args[0], this.kb),
      'le_kb/1': () => this.kb === null ? 'fail' : st('unify', args[0], this.kb),
      'le_my_id/1': () => this.label === null ? 'fail' : st('unify', args[0], this.label),
      'atom/1': () => st('is_atom', args[0]), 'number/1': () => st('is_number', args[0]), 'integer/1': () => st('is_int', args[0]),
      'var/1': () => st('is_var', args[0]), 'nonvar/1': () => st('is_nonvar', args[0]), 'true/0': () => 'true', 'fail/0': () => 'fail',
    }[`${name}/${args.length}`];
    if (system) return [system()];
    if (typeof name !== 'string' || RESERVED.has(name)) fail(`the Prolog goal "${phrase(tokens)}" is not supported`);
    return [goal];
  }

  // A Prolog argument: a variable, atom, number, list or compound, or an LE
  // phrase. An LE definite phrase that refers to no variable starts one.
  prologArg(tokens, scope, callable = false) {
    const fail = () => this.error(`"${phrase(tokens)}" is not a Prolog term`, tokens[0]?.line ?? 0);
    if (!tokens.length) fail();
    const [first] = tokens;
    if (tokens.length === 1 && first.kind === 'word') {
      if (/^[A-Z_]/.test(first.text)) return first.text === '_' ? new Var('_') : this.mark(scope, scope.find([first]) ?? scope.introduce([first]), this.offset(tokens), 1);
      return first.text;
    }
    if (first.kind === 'word' && tokens[1]?.text === '(' && tokens.at(-1).text === ')' && balanced(tokens.slice(2, -1))) {
      const inner = tokens.slice(2, -1), level = depths(inner), args = [];
      let start = 0;
      for (let k = 0; k <= inner.length; k++) {
        if (k < inner.length && !(inner[k].text === ',' && level[k] === 0)) continue;
        args.push(this.prologArg(inner.slice(start, k), scope));
        start = k + 1;
      }
      return new Struct(first.text, args);
    }
    if (callable) fail();
    if (first.text === '[' && tokens.at(-1).text === ']') {
      const inner = tokens.slice(1, -1), level = depths(inner);
      const bar = inner.findIndex((t, k) => t.text === '|' && level[k] === 0);
      const items = [], body = bar < 0 ? inner : inner.slice(0, bar);
      const bodyLevel = depths(body);
      let start = 0;
      for (let k = 0; k <= body.length && body.length; k++) {
        if (k < body.length && !(body[k].text === ',' && bodyLevel[k] === 0)) continue;
        items.push(this.prologArg(body.slice(start, k), scope));
        start = k + 1;
      }
      const tail = bar < 0 ? EMPTY : this.prologArg(inner.slice(bar + 1), scope);
      return items.reduceRight((t, h) => st('.', h, t), tail);
    }
    const term = this.term(tokens, scope);
    if (term === null) fail();
    if (typeof term === 'string' && isWord(first, 'the') && tokens.length > 1) return this.mark(scope, scope.introduce(tokens.slice(1)), this.offset(tokens), tokens.length);
    return term;
  }

  // A grouped alternative at i: its words and how it joins its conditions.
  group(tokens, i) {
    for (const [words, op] of GROUPS) {
      const after = tokens[i + words.length];
      if (startsWith(tokens, words, i) && after && (after.text === ':' || after.bol)) return [words, op];
    }
    return null;
  }

  // Conditions joined by one connective.
  join(parts, op) {
    if (op === 'and') return parts.flat();
    return [parts.map((goals) => conjunction(goals)).reduce((a, b) => st('or', a, b))];
  }

  // LE2's numbered body: items such as "4.2.1. the A is connected to an E;
  // and". An item's connective joins it to the next item of its level; an item
  // "either:", "all of:" or "it is not the case that:" groups the items
  // numbered below it.
  numbered(tokens, scope) {
    const items = [];
    for (const t of tokens) {
      if (t.kind === 'designator') {
        items.push({ depth: t.text.split('.').length - 1, tokens: [], line: t.line });
        this.designators?.push(t.text.slice(0, -1));
      }
      else if (items.length) items.at(-1).tokens.push(t);
      else this.error('a numbered condition starts with its number, such as 1.', t.line);
    }
    for (const item of items) {
      let words = item.tokens;
      if (isWord(words.at(-1) ?? {}, 'and', 'or')) { item.op = lower(words.at(-1)); words = words.slice(0, -1); }
      if (words.at(-1)?.text === ';') words = words.slice(0, -1);
      if (words.at(-1)?.text === ':') { item.opens = true; words = words.slice(0, -1); }
      item.words = words;
    }
    const level = (from, depth) => {
      const parts = [];
      let i = from;
      while (i < items.length && items[i].depth >= depth) {
        const item = items[i];
        let j = i + 1;
        while (j < items.length && items[j].depth > item.depth) j++;
        let goals;
        const group = item.opens ? this.group([...item.words, { text: ':' }], 0) : null;
        if (group && group[0].length === item.words.length) goals = this.join(level(i + 1, item.depth + 1).map((p) => p.goals), group[1]);
        else if (item.opens && startsWith(item.words, ['it', 'is', 'not', 'the', 'case', 'that']) && item.words.length === 6) {
          goals = [st('not', conjunction(this.join(level(i + 1, item.depth + 1).map((p) => p.goals), 'and')))];
        } else {
          if (j > i + 1) this.error(`the numbered condition "${phrase(item.words)}" has conditions below it; end it with "either:", "all of:" or "it is not the case that:"`, item.line);
          if (!item.words.length) this.error('a numbered condition is missing', item.line);
          goals = this.body(item.words, scope);
        }
        parts.push({ goals, op: item.op });
        i = j;
      }
      return parts;
    };
    const parts = level(0, items[0]?.depth ?? 1);
    if (!parts.length) this.error('a numbered body needs numbered conditions', tokens[0]?.line ?? 0);
    let goals = parts[0].goals;
    for (let k = 1; k < parts.length; k++) {
      goals = (parts[k - 1].op ?? 'and') === 'or' ? [st('or', conjunction(goals), conjunction(parts[k].goals))] : [...goals, ...parts[k].goals];
    }
    return goals;
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
    const items = new Var(`L${this.lists = (this.lists ?? 0) + 1}_`);
    // A sum, count, average, minimum or maximum does not depend on the order
    // of its values, so it collects them sorted, which a proof can certify
    // even when they rest on derived facts; a list keeps the order found.
    const found = st(AGGREGATES[op] === null ? 'findall' : 'findall_sorted', template, conjunction(goals), items);
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
    if (goal instanceof Struct && (goal.name === 'findall' || goal.name === 'findall_sorted') && goal.args.length === 3) varsOf(goal.args[2], bound);
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
    else if (term instanceof Struct && !(term.name === 'not' && term.args.length === 1) && !((term.name === 'findall' || term.name === 'findall_sorted') && term.args.length === 3)) {
      for (const arg of term.args) visit(arg);
    } else if (term instanceof Struct && (term.name === 'findall' || term.name === 'findall_sorted')) visit(term.args[2]);
  };
  for (const goal of goals) visit(goal);
  return out;
}

// ---------------------------------------------------------------- Documents

// The sections of one document as sentences: [kind, name, tokens, line].
// A source or document named in a trailer: its words, or a quoted text.
function sourceTerm(words) {
  if (words.length === 1 && words[0].kind === 'string') return words[0].value;
  return words.map((t) => t.text).join(' ');
}

function sections(tokens, file) {
  const error = (message, line) => { throw new EyemindError(`${file}: line ${line}: Logical English: ${message}`); };
  const out = [];
  let i = 0, section = null, label = null, part = 'main';
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
    if (startsWith(tokens, ['the', 'templates', 'are'], i) || startsWith(tokens, ['the', 'predicates', 'are'], i) || startsWith(tokens, ['the', 'functions', 'are'], i)) {
      if (tokens[i + 3]?.text !== ':') error(`expected ":" after "the ${lower(tokens[i + 1])} are"`, line);
      section = { kind: 'templates', functions: isWord(tokens[i + 1], 'functions') };
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
      // "includes these resources:" or "includes these scenarios:" names other
      // files, separated by commas, up to a full stop.
      if (at > 0 && startsWith(tokens, ['includes', 'these'], at - 3) && isWord(tokens[at - 1], 'resources', 'scenarios')) {
        let end = at + 1;
        while (tokens[end].kind !== 'stop' && tokens[end].kind !== 'end') end++;
        const names = [];
        let name = [];
        for (const t of [...tokens.slice(at + 1, end), { text: ',' }]) {
          if (t.text !== ',') { name.push(t.text); continue; }
          if (name.length) names.push(name.join(''));
          name = [];
        }
        out.push(['include', lower(tokens[at - 1]), names, line]);
        i = end + 1;
        continue;
      }
      const includes = at > 0 && isWord(tokens[at - 1], 'includes');
      if (!includes) error('expected "the knowledge base NAME includes:"', line);
      section = { kind: 'kb', name: tokens.slice(i + 3, at - 1).map((t) => t.text).join(' ') };
      i = at + 1;
      continue;
    }
    if (isWord(tokens[i], 'scenario', 'query') && tokens[i].bol) {
      const at = colon(i);
      // LE2's "scenario NAME is, as stated in DOCUMENT:" names the default
      // document of the scenario's facts.
      const stated = indexOfWords(tokens.slice(i, at), [',', 'as', 'stated', 'in'].map((w) => w));
      const isAt = stated > 0 ? i + stated - 1 : at - 1;
      if (at > i + 2 && isWord(tokens[isAt], 'is') && (stated < 0 || tokens[i + stated]?.text === ',')) {
        const name = tokens.slice(i + 1, isAt).map((t) => t.text).join(' ');
        const document = stated > 0 ? sourceTerm(tokens.slice(i + stated + 4, at)) : null;
        section = { kind: lower(tokens[i]), name, line, document };
        if (section.kind === 'scenario') out.push(['scenario', name, [], line]);
        i = at + 1;
        continue;
      }
      if (at > 0) error(`the header "${phrase(tokens.slice(i, at + 1))}" belongs to Logical English 2 and is not supported`, line);
    }
    // LE2 labels a rule with "rule NAME:", and marks sections of rules with
    // "section NAME is:" or "the annexes to the contract are:". Neither
    // changes what the rules mean.
    // A label may give the rule's provenance, "rule NAME with provenance
    // DOCUMENT, confer ...:", which changes nothing in the proof.
    const provenance = isWord(tokens[i], 'rule') ? indexOfWords(tokens.slice(i, Math.max(colon(i), i)), ['with', 'provenance']) : -1;
    const labelEnd = provenance > 1 ? i + provenance : colon(i);
    if (isWord(tokens[i], 'rule') && colon(i) > i + 1 && labelEnd < i + 5 && tokens.slice(i + 1, labelEnd).every((t) => t.kind === 'word' || t.kind === 'number')) {
      label = tokens.slice(i + 1, labelEnd).map((t) => t.text).join(' ');
      i = colon(i) + 1;
      continue;
    }
    // A facts background helps an assistant read facts from a text; the
    // answers are the same without it.
    if (startsWith(tokens, ['the', 'facts', 'background', 'includes', 'these', 'resources', ':'], i)) {
      while (tokens[i].kind !== 'stop' && tokens[i].kind !== 'end') i++;
      i++;
      continue;
    }
    if (isWord(tokens[i], 'section') && tokens[i].bol && colon(i) > 0 && isWord(tokens[colon(i) - 1], 'is')) {
      part = tokens.slice(i + 1, colon(i) - 1).map((t) => t.text).join(' ');
      i = colon(i) + 1;
      continue;
    }
    if (startsWith(tokens, ['the', 'annexes', 'to', 'the'], i) && colon(i) > 0 && isWord(tokens[colon(i) - 1], 'are')) {
      part = 'annexes';
      i = colon(i) + 1;
      continue;
    }
    // LE2's named constants: "the fee is 5."
    if (startsWith(tokens, ['the', 'constants', 'are', ':'], i)) {
      section = { kind: 'constants' };
      i += 4;
      continue;
    }
    const unsupported = SECTIONS.find((words) => startsWith(tokens, words.split(' '), i));
    if (unsupported) error(`the section "${unsupported}" belongs to Logical English 2 and is not supported`, line);
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
      for (const part of parts) out.push(['template', section.functions ? 'function' : null, part, part[0].line]);
    } else if (section.kind === 'constants') {
      out.push(['constant', null, sentence, line]);
    } else if (section.kind === 'query') {
      out.push(['query', section.name, sentence, line]);
      section = { kind: 'after query' };
    } else if (section.kind === 'after query') {
      error('a query has one sentence; start a new section after it', line);
    } else {
      // The location of a document changes nothing in the proof.
      const quoted = sentence.at(-1)?.kind === 'string';
      if (quoted && (startsWith(sentence, ['is', 'published', 'at'], sentence.length - 4) ||
          (startsWith(sentence, ['the', 'text', 'of']) && startsWith(sentence, ['is', 'at'], sentence.length - 3)))) {
        i = end + 1;
        continue;
      }
      // A fact's trailers, ", according to SOURCE", ", as stated in DOCUMENT
      // at LOCATOR", ", because ..." and ", confer ...", keep its source.
      let fact = sentence, source = section.document ?? null;
      const level = depths(sentence), trailer = (k) => sentence[k]?.text === ',' && level[k] === 0 &&
        (startsWith(sentence, ['according', 'to'], k + 1) || startsWith(sentence, ['as', 'stated', 'in'], k + 1) || isWord(sentence[k + 1] ?? {}, 'because', 'confer'));
      const first = sentence.findIndex((t, k) => trailer(k));
      if (first > 0 && !sentence.slice(0, first).some((t, k) => level[k] === 0 && isWord(t, 'if'))) {
        fact = sentence.slice(0, first);
        let according = null, document = null;
        for (let k = first; k < sentence.length; k++) {
          if (!trailer(k)) continue;
          let stop = k + 1;
          while (stop < sentence.length && !trailer(stop)) stop++;
          const words = sentence.slice(k + 1, stop);
          if (startsWith(words, ['according', 'to'])) according = sourceTerm(words.slice(2));
          if (startsWith(words, ['as', 'stated', 'in'])) {
            const at = words.findIndex((t, m) => m > 3 && isWord(t, 'at'));
            document = sourceTerm(words.slice(3, at > 0 ? at : words.length));
          }
        }
        source = according ?? document ?? source;
      }
      // A rule's label and section, which LE2's system predicates report.
      Object.assign(fact, { label, part, source });
      const sentence_ = fact;
      label = null;
      out.push([{ kb: 'clause', ontology: 'ontology clause' }[section.kind] ?? 'scenario clause', section.name ?? null, sentence_, line]);
    }
    i = end + 1;
  }
  return out;
}

// The ways LE2 lets a template be read, after ";": additions that change
// nothing eyemind computes, and additions that make a sentence assumable.
const IGNORED = ['memorable', 'memoised', 'memoized', 'cached', 'undefined', 'scenario element', 'one value', 'single valued'];
const ASSUMABLE = ['assumable', 'unknown', 'assumed', 'judged', 'open textured', 'evaluative'];

// io.readFile reads an included file. The paths of an included file's own
// includes are relative to it; a chain of includes stops at five.
export function compileLe(inputs, io = null) {
  const items = [], read = new Set();
  const load = (text, file, keep, depth) => {
    for (const item of sections(tokenize(String(text), file), file)) {
      if (item[0] === 'include') {
        const [, kind, names, line] = item;
        const fail = (message) => { throw new EyemindError(`${file}: line ${line}: Logical English: ${message}`); };
        for (const name of names) {
          // A web address is read with io.readDocument; a path, relative to
          // the including file or web address, with io.readFile.
          const web = /^https?:/i.test(name), base = String(file);
          if (/^[a-z]+:/i.test(name) && !web) fail(`cannot include ${name}; include a file or an HTTP(S) address`);
          const dir = web ? '' : base.includes('/') ? base.slice(0, base.lastIndexOf('/') + 1) : '';
          const path = dir + name + (/\.(le|pl)$/.test(name) ? '' : '.le');
          if (read.has(path)) continue;
          if (depth >= 5) fail(`including ${name} makes a chain of more than five includes`);
          const reader = /^https?:/i.test(path) ? io?.readDocument : io?.readFile;
          if (!reader) fail(`including ${name} needs ${/^https?:/i.test(path) ? 'network' : 'file'} access`);
          let included;
          try { included = reader(path); } catch (error) { fail(`cannot read the included ${path}: ${error.message}`); }
          read.add(path);
          // A Prolog resource gives its facts and rules.
          if (path.endsWith('.pl')) {
            const tokens = tokenize(included, path);
            for (let start = 0, k = 0; k < tokens.length; k++) {
              if (tokens[k].kind !== 'stop' && tokens[k].kind !== 'end') continue;
              if (k > start) items.push(['prolog', null, tokens.slice(start, k), tokens[start].line, path]);
              start = k + 1;
            }
            continue;
          }
          // A resource gives its templates, rules, facts and ontology; an
          // included scenario file also gives its scenarios and queries.
          load(included, path, kind === 'scenarios', depth + 1);
        }
        continue;
      }
      if (!keep && ['scenario', 'scenario clause', 'query'].includes(item[0])) continue;
      items.push([...item, file]);
    }
  };
  for (const [text, file] of inputs) {
    read.add(String(file));
    load(text, file, true, 0);
  }
  // Templates first: a sentence can use a template declared after it.
  const templates = [], byName = new Map();
  const starred = items.some((item) => item[0] === 'template' && item[2].some((t) => t.text === '*'));
  const declare = (tokens, error, relation = null) => {
    const parts = readTemplate(tokens, error, starred);
    const arity = parts.filter((p) => p.place).length;
    if (relation && relation.arity !== arity) error(`a synonym needs the ${relation.arity} places of "${relation.text}"`);
    const name = relation?.name ?? templateName(parts), key = `${name}/${arity}`;
    if (!relation && byName.has(key)) {
      const other = byName.get(key);
      if (other.parts.map((p) => p.word ?? '*').join(' ') === parts.map((p) => p.word ?? '*').join(' ')) return other;
      error(`the templates "${other.text}" and "${phrase(tokens)}" both name the relation ${name}/${arity}; change a word of one`);
    }
    const template = { parts, name, arity, words: parts.filter((p) => p.word).length, text: phrase(tokens) };
    if (!relation) byName.set(key, template);
    templates.push(template);
    return template;
  };
  for (const [, role, tokens, line, file] of items.filter((item) => item[0] === 'template')) {
    const error = (message, at = line) => { throw new EyemindError(`${file}: line ${at}: Logical English: ${message}`); };
    // A template, then its additions after ";".
    const pieces = [[]];
    let inside = false;
    for (const t of tokens) {
      if (t.text === '*') inside = !inside;
      if (t.text === ';' && !inside) pieces.push([]);
      else pieces.at(-1).push(t);
    }
    const template = declare(pieces[0], error);
    // A function "... is *a value*" can be written without its value.
    if (role === 'function') {
      const parts = template.parts;
      if (parts.length < 2 || !parts.at(-1).place || parts.at(-2).word !== 'is') error('a function has the form "... is *a value*"');
      template.function = parts.slice(0, -2);
    }
    for (const addition of pieces.slice(1)) {
      const words = addition.map((t) => t.text.toLowerCase()).join(' ');
      if (['undefined', 'scenario element'].includes(words)) template.scenarioElement = true;
      if (IGNORED.includes(words) || isWord(addition[0] ?? {}, 'image')) continue;
      if (ASSUMABLE.includes(words)) { template.assumable = true; if (['judged', 'open textured', 'evaluative'].includes(words)) template.scenarioElement = true; continue; }
      // A synonym is another wording of the same relation; an opposite is the
      // wording of a separate relation, which only its own rules conclude.
      if (isWord(addition[0] ?? {}, 'synonym')) { declare(addition.slice(1), error, template); continue; }
      if (isWord(addition[0] ?? {}, 'opposite')) { template.opposite = declare(addition.slice(addition[1]?.text === ':' ? 2 : 1), error); continue; }
      error(`the template addition "; ${phrase(addition)}" belongs to Logical English 2 and is not supported`);
    }
  }
  // Named constants: "the fee is 5." The name stands for the value wherever
  // no variable of the clause has that name.
  const constants = new Map();
  for (const [, , tokens, line, file] of items.filter((item) => item[0] === 'constant')) {
    const at = tokens.findLastIndex((t) => isWord(t, 'is'));
    const value = at > 0 ? new Compiler(file, []).term(tokens.slice(at + 1), new Scope()) : null;
    if (value === null || value instanceof Var) throw new EyemindError(`${file}: line ${line}: Logical English: a constant is written "the fee is 5."`);
    constants.set(tokens.slice(0, at).map((t) => t.text.toLowerCase()).join(' '), value);
  }
  const scenarios = [];
  for (const [kind, name, , line, file] of items) {
    if (kind !== 'scenario') continue;
    if (scenarios.includes(name)) throw new EyemindError(`${file}: line ${line}: Logical English: scenario ${name} is stated twice`);
    scenarios.push(name);
  }
  const threaded = scenarios.length > 0;
  const clauses = [], sources = [], queries = [], expectations = [], helpers = new Set(), pending = [], necessary = new Map(), abducibles = [], constraints = [], denials = [], flips = [];
  // Clauses wait until every one is read: their negations depend on whether
  // any fact or rule leaves a variable of its conclusion open.
  const emit = (kind, head, body, line, file, guard = null) => pending.push({ kind, head, body, line, file, guard });
  const write = ({ kind, head, body, line, file }) => {
    if (line !== null) clauses.push(`// ${String(file).replace(/[\r\n\u2028\u2029]/g, ' ')}: line ${line}`);
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
  for (let [kind, name, tokens, line, file] of items) {
    if (kind === 'template' || kind === 'scenario' || kind === 'constant') continue;
    const compiler = new Compiler(file, templates);
    compiler.constants = constants;
    Object.assign(compiler, { kb: kind === 'clause' ? name : null, label: tokens.label ?? null, designators: [] });
    if (kind === 'prolog') {
      const local = new Scope();
      // A clause of a Prolog resource; directives are left out.
      if (tokens[0]?.text === ':' && tokens[1]?.text === '-') continue;
      const neck = tokens.findIndex((t, k) => t.text === ':' && tokens[k + 1]?.text === '-');
      const head = compiler.prologArg(neck < 0 ? tokens : tokens.slice(0, neck), local, true);
      if (!(head instanceof Struct) && typeof head !== 'string') compiler.error('a Prolog clause needs a head such as p(X)', line);
      const body = neck < 0 ? [] : compiler.prologGoal(tokens.slice(neck + 2), local);
      if (!body.length && isGround(head)) emit('fact', head, [], line, file);
      else emit('backward', head, body, line, file, body.length ? { counter: { n: anonymize(head, body) }, scenario: null, rule: true } : null);
      continue;
    }
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
      // LE2's flip query: "which minimal change to the scenario makes it the
      // case that GOAL". Its goal runs in the world of a scenario with changes.
      const FLIP = ['which', 'minimal', 'change', 'to', 'the', 'scenario', 'makes', 'it', 'the', 'case', 'that'];
      if (startsWith(body, FLIP)) {
        if (!threaded) compiler.error('a flip query changes a scenario; the document has none', line);
        const S = new Var('Scenario'), changes = new Var('Changes_');
        compiler.scenario = st('le:flip', S, changes);
        const goals = compiler.body(body.slice(FLIP.length), scope);
        anonymize(st('le:flip', S, changes), goals);
        flips.push({ name, goals, S, changes, line, file });
        queries.push({ name, flip: true });
        for (const h of compiler.helpers) helpers.add(h);
        continue;
      }
      compiler.sentence = body;
      const goals = compiler.body(body, scope);
      const counter = { n: anonymize(st('true'), goals) };
      const answer = openVariables(goals).filter((v) => !/^_\d+$/.test(v.name) && v !== compiler.scenario);
      const head = st(ANSWER, name, ...(threaded ? [compiler.scenario] : []), ...answer);
      emit('backward', head, threaded ? [st(SCENARIO, compiler.scenario), ...goals] : goals, line, file, { counter, scenario: compiler.scenario });
      emit('query', head, [], line, file);
      // A quoted name is written as the name, as LE writes its answers.
      queries.push({ name, tokens: body.map((t) => t.kind === 'string' ? t.value : t.text), marks: scope.marks.map(({ at, length, variable }) => ({ at, length, slot: answer.indexOf(variable) })) });
      for (const h of compiler.helpers) helpers.add(h);
      continue;
    }
    const inScenario = kind === 'scenario clause';
    // An expected answer: "one expects answers [...] and unknowns [...]."
    const expects = tokens.findIndex((t, k) => isWord(t, 'expects') && (tokens[k + 1]?.text === '[' || (isWord(tokens[k + 1] ?? {}, 'answers') && tokens[k + 2]?.text === '[')));
    // "NAME expects changes [[...], ...]": the minimal change sets of a flip.
    const changesAt = tokens.findIndex((t, k) => isWord(t, 'expects') && isWord(tokens[k + 1] ?? {}, 'changes'));
    if (changesAt > 0) {
      if (!inScenario) compiler.error('an expectation belongs to a scenario', line);
      const sets = [];
      let current = null;
      for (const t of tokens.slice(changesAt + 2)) {
        if (t.text === '[' && current === null && sets.started) current = [];
        else if (t.text === '[') sets.started = true;
        else if (t.text === ']' && current !== null) { sets.push(current); current = null; }
        else if (t.kind === 'string' && current !== null) current.push(t.value);
      }
      expectations.push({ scenario: name, query: tokens.slice(0, changesAt).map((t) => t.text).join(' '), changes: [...sets], line });
      continue;
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
      // Without "and unknowns", the answers must rest on no unknowns.
      const unknowns = startsWith(tokens, ['and', 'unknowns'], close + 1) ? list(close + 3)[0]
        : startsWith(tokens, ['and', 'any', 'unknowns'], close + 1) ? 'any' : [];
      expectations.push({ scenario: name, query: tokens.slice(0, expects).map((t) => t.text).join(' '), answers, unknowns, line });
      continue;
    }
    compiler.scenario = !threaded ? null : inScenario ? name : new Var('Scenario');
    // An integrity constraint, "it must not be true that C": no answer's
    // assumptions may make C true.
    if (startsWith(tokens, ['it', 'must', 'not', 'be', 'true', 'that'])) {
      const goals = compiler.body(tokens.slice(6), scope);
      anonymize(st('true'), goals);
      constraints.push({ goals, line, file, scenario: compiler.scenario });
      for (const h of compiler.helpers) helpers.add(h);
      continue;
    }
    // A scenario may deny a sentence: it is then neither stated nor assumed.
    if (startsWith(tokens, ['it', 'is', 'not', 'the', 'case', 'that'])) {
      if (!inScenario) compiler.error('a negated fact belongs to a scenario', line);
      const sentence = compiler.sentenceOf(tokens.slice(6), scope, { data: true });
      if (!sentence) compiler.error(`no template matches "${phrase(tokens.slice(6))}"`, line);
      denials.push({ term: compiler.relation(sentence.name, sentence.args), line, file });
      continue;
    }
    // "it is unknown whether S" makes the sentences S describes assumable,
    // in the knowledge base or in one scenario.
    if (['unknown', 'assumed', 'assumable'].some((word) => startsWith(tokens, ['it', 'is', word, 'whether']))) {
      const sentence = compiler.sentenceOf(tokens.slice(4), scope, { data: true });
      if (!sentence) compiler.error(`no template matches "${phrase(tokens.slice(4))}"`, line);
      abducibles.push({ term: compiler.relation(sentence.name, sentence.args), line, file });
      continue;
    }
    // A fact may carry LE2's picture, "; image ...", which changes nothing.
    const semicolon = tokens.findIndex((t) => t.text === ';');
    if (semicolon > 0 && isWord(tokens[semicolon + 1] ?? {}, 'image')) tokens = tokens.slice(0, semicolon);
    const level = depths(tokens);
    const ifAt = tokens.findIndex((t, k) => level[k] === 0 && isWord(t, 'if'));
    // "Head only if Body" makes Body necessary: the opposite of the head holds
    // when Body does not, and the head then fails.
    const onlyIf = ifAt > 0 && isWord(tokens[ifAt - 1], 'only');
    let headTokens = ifAt < 0 ? tokens : tokens.slice(0, onlyIf ? ifAt - 1 : ifAt);
    // In an ontology, "a student is a person" is about the kinds themselves.
    if (kind === 'ontology clause' && ifAt < 0 && isWord(headTokens[0], 'a', 'an') && !isWord(headTokens[1] ?? {}, 'is')) headTokens = headTokens.slice(1);
    if (!headTokens.length) compiler.error('a rule needs a conclusion before "if"', line);
    // In a fact, an id that no phrase introduces is a name, as in Q1.
    compiler.fact = ifAt < 0;
    let head = compiler.sentenceOf(headTokens, scope, { data: true });
    // A scenario may state "A is B" with no template for it, as LE2 accepts;
    // it is a fact of the relation le_is.
    const isAt = headTokens.findIndex((t) => isWord(t, 'is'));
    if (!head && inScenario && ifAt < 0 && isAt > 0) {
      const a = compiler.term(headTokens.slice(0, isAt), scope), b = compiler.term(headTokens.slice(isAt + 1), scope);
      if (a !== null && b !== null) head = { name: 'le_is', args: [a, b] };
    }
    if (!head) {
      const builtin = compiler.sentenceOf(headTokens, new Scope());
      if (builtin?.builtin) compiler.error(`"${phrase(headTokens)}" is a built-in condition and cannot be concluded`, line);
      compiler.error(`no template matches "${phrase(headTokens)}"`, line);
    }
    const headTerm = compiler.relation(head.name, head.args);
    // A function in the conclusion is asked after the conditions.
    const headCalls = scope.pre.splice(0);
    if (kind === 'ontology clause' && ifAt < 0 && head.name === 'is_a' && head.args.every(isGround)) kinds.push({ term: headTerm, line, file });
    if (ifAt < 0) {
      // A ground fact of the knowledge base is stated in every scenario.
      if (compiler.scenario instanceof Var && !headCalls.length && head.args.every(isGround)) {
        for (const scenario of scenarios) {
          emit('fact', new Struct(headTerm.name, [scenario, ...headTerm.args.slice(1)]), [], line, file);
          pending.at(-1).kb = true;
        }
        continue;
      }
      const body = [...(compiler.scenario instanceof Var ? [st(SCENARIO, compiler.scenario)] : []), ...headCalls];
      if (!body.length && isGround(headTerm)) emit('fact', headTerm, [], line, file);
      else emit('backward', headTerm, body, line, file);
      // A scenario fact is evidence of its source; one without is never
      // admissible in a source-scoped proof.
      if (inScenario) pending.at(-1).evidence = tokens.source ?? null;
      continue;
    }
    if (ifAt === tokens.length - 1) compiler.error('a rule needs conditions after "if"', line);
    // LE1 also writes "if" followed by a line that starts with "and".
    const goals = tokens[ifAt + 1]?.text === ':' ? compiler.numbered(tokens.slice(ifAt + 2), scope)
      : compiler.body(tokens.slice(ifAt + (isWord(tokens[ifAt + 1], 'and') ? 2 : 1)), scope);
    if (onlyIf) {
      const template = templates.find((t) => t.name === head.name && t.arity === head.args.length && t.opposite);
      const opposite = compiler.relation(template ? template.opposite.name : `${head.name}:not`, head.args);
      const body = [st('not', conjunction(goals))];
      const counter = { n: anonymize(opposite, body) };
      emit('backward', opposite, body, line, file, { counter, scenario: compiler.scenario, rule: true });
      necessary.set(`${head.name}/${headTerm.args.length}`, { name: head.name, opposite: opposite.name, arity: headTerm.args.length, line, file });
      for (const h of compiler.helpers) helpers.add(h);
      continue;
    }
    goals.push(...headCalls);
    const counter = { n: anonymize(headTerm, goals) };
    emit('backward', headTerm, goals, line, file, { counter, scenario: compiler.scenario, rule: true });
    // LE2's system predicates: the section of a labelled rule, and the
    // designators of its numbered conditions.
    if (compiler.label !== null) {
      emit('fact', st('le_source_section', tokens.part ?? 'main', compiler.label), [], line, file);
      for (const designator of compiler.designators) emit('fact', st('le_source_element', compiler.label, designator, 'true'), [], line, file);
    }
    for (const h of compiler.helpers) helpers.add(h);
  }
  // A fact or rule may leave a variable of its conclusion open. Then no
  // earlier condition surely binds a variable, and every negation tests its
  // variables at run time.
  const open = pending.some(({ kind, head, body, guard }) => kind !== 'query' && (guard ? guard.rule : true) &&
    [...varsOf(head)].some((v) => !/^_\d+$/.test(v.name) && v.name !== 'Scenario' && !openVariables(body).includes(v)));
  // A relation with "only if" rules holds by its other rules, through a base
  // relation, unless its opposite holds.
  for (const [key, { name, opposite, arity, line, file }] of necessary) {
    const base = `${name}:if`;
    for (const clause of pending) {
      if (clause.head instanceof Struct && `${clause.head.name}/${clause.head.args.length}` === key) clause.head = new Struct(base, clause.head.args);
    }
    const args = Array.from({ length: arity }, (_, i) => new Var(i === 0 && threaded ? 'Scenario' : `A${i}`));
    emit('backward', new Struct(name, args), [new Struct(base, args), st('not', new Struct(opposite, args))], line, file,
      { counter: { n: 0 }, scenario: threaded ? args[0] : null, rule: true });
  }
  for (const { term, line, file } of kinds) {
    const S = new Var('Scenario'), X = new Var('X'), [sub, kind] = term.args.slice(-2);
    const isA = (a, b) => threaded ? st('is_a', S, a, b) : st('is_a', a, b);
    emit('backward', isA(X, kind), [isA(X, sub)], line, file, { counter: { n: 0 }, scenario: threaded ? S : null, rule: true });
  }
  if (flips.length) flipWorlds(pending, { templates, flips, scenarios, helpers, emit });
  scopeProofs(pending, { templates, threaded, emit });
  const assumable = new Set([...templates.filter((t) => t.assumable).map((t) => `${t.name}/${t.arity + (threaded ? 1 : 0)}`),
    ...abducibles.map(({ term }) => `${term.name}/${term.args.length}`)]);
  unfold(pending, templates, threaded);
  forwardRecursion(pending, templates, threaded, assumable);
  const abductive = assumable.size > 0 || constraints.length > 0;
  if (abductive) abduce(pending, { templates, threaded, assumable, abducibles, constraints, denials, helpers, emit });
  for (const clause of pending) {
    if (!clause.guard) continue;
    const { counter, scenario } = clause.guard;
    clause.body = guardNegations(clause.body, new Set(scenario instanceof Var ? [scenario] : []), counter, open);
  }
  for (const clause of pending) write(clause);
  // The helpers follow every stated clause.
  const used = Object.keys(HELPERS).filter((name) => helpers.has(name));
  if (used.length) {
    const text = used.map((name) => HELPERS[name]).join('\n');
    clauses.push('// Logical English helpers.', text);
    sources.push(...loadText(text, 'Logical English helpers').sources.map((s) => Object.assign(s, { line: null, file: null })));
  }
  return { kind: 'le', text: '// Compiled from Logical English to Logic Script.\n\n' + clauses.join('\n') + '\n',
    program: new Program(sources), compiled: { templates, scenarios, threaded, queries, expectations, abductive } };
}

// The relation of a goal, as name/arity, or null for a variable.
const keyOf = (term) => term instanceof Struct ? `${term.name}/${term.args.length}` : null;

// Tarjan's strongly connected components of a graph, given its nodes and the
// nodes each one leads to: each node maps to the members of its component.
function components(nodes, next) {
  const index = new Map(), low = new Map(), stack = [], onStack = new Set(), component = new Map();
  let counter = 0;
  const visit = (v) => {
    index.set(v, counter); low.set(v, counter++); stack.push(v); onStack.add(v);
    for (const w of next(v)) {
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
  for (const v of nodes) if (!index.has(v)) visit(v);
  return component;
}

// LE runs recursive rules with tabling (LE1) or a loop check (LE2), so a rule
// that depends on itself, directly or through others, ends where Prolog's
// search would not. LS forward rules reach the least fixpoint that tabling
// computes. A recursive group of rules therefore becomes forward rules when
// each of its rules binds every variable of its conclusion through the
// relations of its conditions; a rule whose conclusion depends on how it is
// called, such as a counter that goes down, stays backward.
function forwardRecursion(pending, templates, threaded, assumable = new Set()) {
  const keys = new Set([...templates.map((t) => `${t.name}/${t.arity + (threaded ? 1 : 0)}`), `is_a/${threaded ? 3 : 2}`]);
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
  const component = components(edges.keys(), (v) => edges.get(v) ?? []);
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

// LE2's flip queries. A changed scenario is the world le:flip(S, Changes): its
// stated facts are those of S, without the removed ones, with the added ones,
// and the rules run in it as in any scenario. A change adds or removes a fact
// of a template that no rule concludes, or one marked undefined or judged,
// filled with individuals the scenario names; an answer is a smallest set of
// at most three changes that makes the goal hold.
const FLIP_LIMIT = 3;
function flipWorlds(pending, { templates, flips, scenarios, helpers, emit }) {
  const concluded = new Set(pending.filter((c) => c.guard?.rule).map((c) => keyOf(c.head)));
  const marked = templates.filter((t) => t.scenarioElement);
  const changeable = (marked.length ? marked : templates.filter((t) => !t.function && !concluded.has(`${t.name}/${t.arity + 1}`)))
    .filter((t, i, all) => all.findIndex((u) => u.name === t.name && u.arity === t.arity) === i);
  const isChangeable = (name, arity) => changeable.some((t) => t.name === name && t.arity === arity);
  // The facts each scenario states, and the knowledge base's facts, which
  // hold in every world.
  const stated = new Map(scenarios.map((s) => [s, []]));
  for (const clause of pending) {
    const head = clause.head;
    if (clause.kind === 'query' || !(head instanceof Struct) || head.args.length === 0 || head.name.startsWith('le:')) continue;
    const world = head.args[0];
    if (clause.kind === 'fact' && typeof world === 'string' && stated.has(world)) {
      const fact = new Struct(head.name, head.args.slice(1));
      fact.kb = clause.kb === true;
      stated.get(world).push(fact);
    }
    // A knowledge-base fact holds in a changed world too.
    if (world instanceof Var && clause.body?.length === 1 && clause.body[0] instanceof Struct && clause.body[0].name === SCENARIO) {
      clause.body = [st('le:world', world)];
    }
  }
  // The changed worlds are finite: each set of at most FLIP_LIMIT candidate
  // changes of a scenario. Each world states its facts: the scenario's, without
  // the removed ones, with the added ones, so that every rule runs in it.
  const S = new Var('Scenario');
  emit('backward', st('le:world', S), [st(SCENARIO, S)], null, null);
  let size = 0;
  for (const [scenario, facts] of stated) {
    // A place is filled with the individuals of its type, or with every
    // individual when the scenario names none of that type; a kind is no
    // individual.
    const kinds = new Set(facts.filter((f) => f.name === 'is_a').map((f) => f.args[1]));
    const individuals = [...new Set(facts.flatMap((f) => f.name === 'is_a' ? [f.args[0]] : f.args).filter((a) => typeof a === 'string' && !kinds.has(a)))];
    const ofType = (place) => {
      const typed = facts.filter((f) => f.name === 'is_a' && f.args[1] === place.name.split(' ').at(-1)).map((f) => f.args[0]);
      return typed.length ? typed : individuals;
    };
    const candidates = [];
    for (const fact of facts) if (!fact.kb && isChangeable(fact.name, fact.args.length)) candidates.push(st('remove', fact));
    for (const t of changeable) {
      if (t.arity > 2) continue;
      const places = t.parts.filter((part) => part.place).map(ofType);
      const fills = t.arity === 0 ? [[]] : t.arity === 1 ? places[0].map((a) => [a]) : places[0].flatMap((a) => places[1].map((b) => [a, b]));
      for (const fill of fills) {
        const sentence = new Struct(t.name, fill);
        if (!facts.some((f) => write(f) === write(sentence))) candidates.push(st('add', sentence));
      }
    }
    emit('fact', st('le:candidates', scenario, listFromItems(candidates)), [], null, null);
    const subsets = (from, k) => k === 0 ? [[]] : candidates.slice(from).flatMap((c, i) => subsets(from + i + 1, k - 1).map((rest) => [c, ...rest]));
    for (let k = 0; k <= FLIP_LIMIT; k++) {
      for (const changes of subsets(0, k)) {
        const world = st('le:flip', scenario, listFromItems(changes));
        const removed = new Set(changes.filter((c) => c.name === 'remove').map((c) => write(c.args[0])));
        const worldFacts = [...facts.filter((f) => !removed.has(write(f))), ...changes.filter((c) => c.name === 'add').map((c) => c.args[0])];
        size += worldFacts.length + 1;
        if (size > 200000) throw new EyemindError(`a flip query's search is larger than eyemind states: ${candidates.length} candidate changes in scenario ${scenario}`);
        emit('fact', st('le:world', world), [], null, null);
        for (const fact of worldFacts) emit('fact', new Struct(fact.name, [world, ...fact.args]), [], null, null);
      }
    }
  }
  helpers.add('le:choose');
  helpers.add('le:member');
  const sizes = listFromItems(Array.from({ length: FLIP_LIMIT + 1 }, (_, k) => BigInt(k)));
  for (const { name, goals, S: world, changes, line, file } of flips) {
    const size = new Var('K_'), candidates = new Var('Candidates_');
    emit('backward', st('le:flips', name, world, size, changes),
      [st('le:candidates', world, candidates), st('le:choose', size, candidates, changes), ...goals], line, file,
      { counter: { n: 100 }, scenario: st('le:flip', world, changes), rule: false });
    const smaller = new Var('J_');
    emit('backward', st('le:smaller', name, world, size), [st('le:member', smaller, sizes), st('lt', smaller, size), st('le:flips', name, world, smaller, new Var('_'))], line, file);
    const answer = st(ANSWER, name, world, changes);
    emit('backward', answer, [st(SCENARIO, world), st('le:member', size, sizes), st('le:flips', name, world, size, changes),
      st('not', st('le:smaller', name, world, size))], line, file);
    emit('query', answer, [], line, file);
  }
}

// LE2's source-scoped proof: "C according to S" proves C from the rules and
// facts of the program and only the scenario facts whose source is
// admissible under S. Every relation C can reach gets a second version,
// NAME:sc, with the scope as one more argument; in it, a scenario fact holds
// when its source is admissible under the scope.
function scopeProofs(pending, { templates, threaded, emit }) {
  const user = new Set([...templates.map((t) => `${t.name}/${t.arity + (threaded ? 1 : 0)}`), `is_a/${threaded ? 3 : 2}`, `${ADMISSIBLE}/${threaded ? 3 : 2}`]);
  const placeholders = [];
  const find = (term) => {
    if (!(term instanceof Struct)) return;
    if (term.name === 'le:according' && term.args.length === 2) placeholders.push(term);
    for (const arg of term.args) find(arg);
  };
  for (const clause of pending) for (const goal of clause.body ?? []) find(goal);
  if (!placeholders.length) return;
  const calls = (term, out = new Set()) => {
    if (term instanceof Struct) {
      if (user.has(keyOf(term))) out.add(keyOf(term));
      for (const arg of term.args) calls(arg, out);
    }
    return out;
  };
  const reach = new Set();
  for (const p of placeholders) for (const k of calls(p.args[0])) reach.add(k);
  for (let changed = true; changed;) {
    changed = false;
    for (const clause of pending) {
      if (!reach.has(keyOf(clause.head))) continue;
      for (const goal of clause.body ?? []) for (const k of calls(goal)) if (!reach.has(k)) { reach.add(k); changed = true; }
    }
  }
  const scoped = (term, scope) => {
    if (!(term instanceof Struct)) return term;
    if (term.name === 'le:according' && term.args.length === 2) return scoped(term.args[0], term.args[1]);
    if (scope !== null && reach.has(keyOf(term))) return new Struct(`${term.name}:sc`, [...term.args, scope]);
    return new Struct(term.name, term.args.map((arg) => scoped(arg, scope)));
  };
  const admissible = (scenario, source, scope) => new Struct(ADMISSIBLE, [...(threaded ? [scenario] : []), source, scope]);
  for (const clause of [...pending]) {
    if (!reach.has(keyOf(clause.head)) || clause.kind === 'query') continue;
    const scope = new Var('Scope_');
    if (clause.evidence === null) continue;
    const head = new Struct(`${clause.head.name}:sc`, [...clause.head.args, scope]);
    if (clause.evidence !== undefined) {
      emit('backward', head, [admissible(clause.head.args[0], clause.evidence, scope)], clause.line, clause.file);
    } else {
      emit('backward', head, (clause.body ?? []).map((goal) => scoped(goal, scope)), clause.line, clause.file,
        clause.guard && { ...clause.guard, counter: { n: clause.guard.counter.n } });
    }
  }
  for (const clause of pending) if (clause.body) clause.body = clause.body.map((goal) => scoped(goal, null));
  // A source is admissible under itself.
  const S = new Var('Scenario'), X = new Var('X');
  emit('backward', admissible(S, X, X), threaded ? [st(SCENARIO, S)] : [], null, null);
}

// LE runs a rule top-down, so a negation or a collection may reach the rule's
// own relation, through other rules, as long as the data never closes the
// cycle. LS stratifies statically, so such a group of relations is unfolded
// into levels: a negation or collection at level k calls level k + 1, a
// relation of its own. The answers are exact up to DEPTH levels; a program
// that needs more stops with an error that says so.
const DEPTH = 8;
function unfold(pending, templates, threaded) {
  const keys = new Set([...templates.map((t) => `${t.name}/${t.arity + (threaded ? 1 : 0)}`), `is_a/${threaded ? 3 : 2}`, `le_is/${threaded ? 3 : 2}`]);
  const closedControl = (term) => term instanceof Struct && ((term.name === 'not' && term.args.length === 1) || ((term.name === 'findall' || term.name === 'findall_sorted') && term.args.length === 3));
  const edges = new Map();
  const visitCalls = (term, from, closed) => {
    if (!(term instanceof Struct)) return;
    if (keys.has(keyOf(term))) edges.get(from).push([keyOf(term), closed]);
    for (const arg of term.args) visitCalls(arg, from, closed || closedControl(term));
  };
  const rules = pending.filter((c) => c.kind !== 'query' && c.head instanceof Struct && keys.has(keyOf(c.head)));
  for (const rule of rules) {
    if (!edges.has(keyOf(rule.head))) edges.set(keyOf(rule.head), []);
    for (const goal of rule.body ?? []) visitCalls(goal, keyOf(rule.head), false);
  }
  // The strongly connected components, and those with a closed edge inside.
  const component = components(edges.keys(), (v) => (edges.get(v) ?? []).map(([w]) => w));
  const unfolded = new Set();
  for (const [from, list] of edges) {
    for (const [to, closed] of list) if (closed && component.get(from)?.includes(to)) for (const m of component.get(from)) unfolded.add(m);
  }
  if (!unfolded.size) return;
  const named = (term, level) => level === 0 ? term : new Struct(`${term.name}#${level}`, term.args);
  const rename = (term, level, closed) => {
    if (!(term instanceof Struct)) return term;
    if (unfolded.has(keyOf(term))) {
      const target = closed ? level + 1 : level;
      // Past the last level, the call stops the run and says why.
      if (target >= DEPTH) return st('is', new Var('_'), `Logical English: a negation or collection through recursion deeper than ${DEPTH} levels`);
      return named(term, target);
    }
    return new Struct(term.name, term.args.map((arg) => rename(arg, level, closed || closedControl(term))));
  };
  const copies = [];
  for (const clause of pending) {
    if (clause.kind === 'query' || !unfolded.has(keyOf(clause.head))) {
      if (clause.body) clause.body = clause.body.map((goal) => rename(goal, 0, false));
      continue;
    }
    for (let level = 1; level < DEPTH; level++) {
      copies.push({ ...clause, head: named(clause.head, level), body: clause.body?.map((goal) => rename(goal, level, false)),
        guard: clause.guard && { ...clause.guard, counter: { n: clause.guard.counter.n } } });
    }
    if (clause.body) clause.body = clause.body.map((goal) => rename(goal, 0, false));
  }
  pending.push(...copies);
}

// Abduction, as LE2 does it. When the program cannot prove a sentence of an
// assumable template, or of an "it is unknown whether" pattern, an answer can
// rest on the assumption that it holds; a negation of such a sentence holds by
// assuming it false. Every relation that can reach one gets a second version,
// NAME:ab, with one more argument: the list of its assumptions, a sentence or
// 'le:not'(sentence). A negation finds every way its goal holds and assumes,
// for each, one of its assumptions false, leaving out a way that contradicts
// what the answer already assumes; a collection or a universal counts every
// way, and assumes all their assumptions. Each answer gets its list, without
// the sentences the facts and rules prove after all, and is rejected when it
// assumes a sentence and its negation, denies a proved sentence, or breaks a
// constraint that more assumptions cannot repair.
function abduce(pending, { templates, threaded, assumable, abducibles, constraints, denials, helpers, emit }) {
  const user = new Set([...templates.map((t) => `${t.name}/${t.arity + (threaded ? 1 : 0)}`), `is_a/${threaded ? 3 : 2}`,
    `le_is/${threaded ? 3 : 2}`, ...assumable]);
  const calls = (term, out = new Set()) => {
    if (term instanceof Struct) {
      if (user.has(keyOf(term))) out.add(keyOf(term));
      for (const arg of term.args) calls(arg, out);
    }
    return out;
  };
  const clauses = pending.filter((c) => c.kind !== 'query');
  const closure = (start) => {
    const set = new Set(start);
    for (let changed = true; changed;) {
      changed = false;
      for (const clause of clauses) {
        const key = keyOf(clause.head);
        if (set.has(key) || !clause.body) continue;
        if (clause.body.some((goal) => [...calls(goal)].some((k) => set.has(k)))) { set.add(key); changed = true; }
      }
    }
    return set;
  };
  const reach = closure(assumable);
  const reaches = (goal) => [...calls(goal)].some((k) => reach.has(k));
  let n = 0;
  const fresh = () => new Var(`U${++n}_`);
  for (const name of ['le:append', 'le:member', 'le:unknowns', 'le:negate', 'le:union', 'le:pairs', 'le:no_empty']) helpers.add(name);
  const fail = (clause) => { throw new EyemindError(`${clause.file}: line ${clause.line}: Logical English: this combination of assumptions, negation and collection belongs to Logical English 2 and is not supported`); };
  // The goals of a body in the abductive version, given the list of what is
  // assumed before them; and the list after them.
  const transform = (goals, clause, before) => {
    const out = [];
    let acc = before;
    const add = (list) => {
      if (acc === EMPTY) { acc = list; return; }
      const next = fresh();
      out.push(st('le:append', acc, list, next));
      acc = next;
    };
    for (const goal of goals) {
      if (!reaches(goal)) { out.push(goal); continue; }
      if (goal instanceof Struct && reach.has(keyOf(goal))) {
        const u = fresh();
        out.push(new Struct(`${goal.name}:ab`, [...goal.args, u]));
        add(u);
      } else if (goal instanceof Struct && goal.name === 'or' && goal.args.length === 2) {
        const v = fresh();
        const branch = (g) => { const [body, w] = transform(flattenGoal(g), clause, acc); return conjunction([...body, st('unify', v, w)]); };
        out.push(st('or', branch(goal.args[0]), branch(goal.args[1])));
        acc = v;
      } else if (goal instanceof Struct && goal.name === 'not' && goal.args.length === 1) {
        const inner = flattenGoal(goal.args[0]), last = inner.at(-1);
        if (inner.length > 1 && last instanceof Struct && last.name === 'not' && last.args.length === 1 && !reaches(last)) {
          // A universal: every way its conditions hold, with all their
          // assumptions, must meet the consequence.
          const [body, w] = transform(inner.slice(0, -1), clause, EMPTY);
          const local = renameApart(conjunction([...body, last]));
          out.push(st('not', local));
          const ways = fresh(), union = fresh();
          out.push(st('findall', w, conjunction(body), ways), st('le:union', ways, union));
          add(union);
        } else {
          const [body, w] = transform(inner, clause, EMPTY);
          const ways = fresh(), denied = fresh();
          out.push(st('findall', w, conjunction(body), ways), st('le:no_empty', ways), st('le:negate', ways, acc, denied));
          add(denied);
        }
      } else if (goal instanceof Struct && (goal.name === 'findall' || goal.name === 'findall_sorted') && goal.args.length === 3) {
        const [template, inner, list] = goal.args;
        const [body, w] = transform(flattenGoal(inner), clause, EMPTY);
        const pairs = fresh(), ways = fresh(), union = fresh();
        out.push(st('findall', st('le:pair', template, w), conjunction(body), pairs), st('le:pairs', pairs, list, ways), st('le:union', ways, union));
        add(union);
      } else fail(clause);
    }
    return [out, acc];
  };
  const guardOf = (clause) => clause.guard ? { ...clause.guard, counter: { n: clause.guard.counter.n }, rule: false } : null;
  for (const clause of clauses) {
    if (!reach.has(keyOf(clause.head)) || clause.head.name === ANSWER) continue;
    const [body, u] = transform(clause.body ?? [], clause, EMPTY);
    emit('backward', new Struct(`${clause.head.name}:ab`, [...clause.head.args, u]), body, clause.line, clause.file, guardOf(clause));
  }
  // The assumptions themselves. A sentence is assumed when it is not proved
  // and not denied when it is asked, or when it is asked open.
  const assume = (sentence, line, file) => {
    const open = st('findall', 'x', st('is_ground', sentence), EMPTY);
    const closed = conjunction([st('is_ground', sentence), st('not', sentence), st('not', st('le:denied', sentence))]);
    emit('backward', new Struct(`${sentence.name}:ab`, [...sentence.args, listFromItems([sentence])]), [st('or', closed, open)], line, file);
  };
  for (const template of templates.filter((t) => t.assumable)) {
    const args = Array.from({ length: template.arity + (threaded ? 1 : 0) }, (_, i) => new Var(i === 0 && threaded ? 'Scenario' : `A${i}`));
    assume(new Struct(template.name, args), null, null);
  }
  for (const { term, line, file } of abducibles) assume(term, line, file);
  for (const { term, line, file } of denials) emit('fact', st('le:denied', term), [], line, file);
  // Whether an assumed sentence holds after all, relation by relation.
  for (const key of assumable) {
    const [name, arity] = [key.slice(0, key.lastIndexOf('/')), Number(key.slice(key.lastIndexOf('/') + 1))];
    const sentence = new Struct(name, Array.from({ length: arity }, (_, i) => new Var(`A${i}`)));
    emit('backward', st('le:holds', sentence), [sentence], null, null);
  }
  // Constraints: the relations they reach, with an answer's assumptions as
  // the only assumptions, NAME:w; a violation, and the sentence whose
  // assumption repairs it, or 'none'.
  if (constraints.length) {
    helpers.add('le:consistent');
    const world = closure(new Set([...constraints.flatMap((c) => c.goals.flatMap((g) => [...calls(g)]))]));
    const worldly = (goal, u) => {
      if (!(goal instanceof Struct)) return goal;
      if (world.has(keyOf(goal))) return new Struct(`${goal.name}:w`, [...goal.args, u]);
      return new Struct(goal.name, goal.args.map((arg) => worldly(arg, u)));
    };
    for (const clause of clauses) {
      if (!world.has(keyOf(clause.head)) || clause.head.name === ANSWER) continue;
      const u = new Var('U_');
      emit('backward', new Struct(`${clause.head.name}:w`, [...clause.head.args, u]), (clause.body ?? []).map((g) => worldly(g, u)), clause.line, clause.file, guardOf(clause));
    }
    for (const key of world) {
      if (!assumable.has(key)) continue;
      const [name, arity] = [key.slice(0, key.lastIndexOf('/')), Number(key.slice(key.lastIndexOf('/') + 1))];
      const args = Array.from({ length: arity }, (_, i) => new Var(`A${i}`)), u = new Var('U_');
      emit('backward', new Struct(`${name}:w`, [...args, u]), [st('le:member', new Struct(name, args), u)], null, null);
    }
    for (const constraint of constraints) {
      const u = new Var('U_');
      const negated = constraint.goals.find((g) => g instanceof Struct && g.name === 'not' && g.args.length === 1 && assumable.has(keyOf(g.args[0])));
      const fix = negated ? negated.args[0] : 'none';
      emit('backward', st('le:violation', constraint.scenario ?? 'none', u, fix), [...(constraint.scenario instanceof Var ? [st(SCENARIO, constraint.scenario)] : []),
        ...constraint.goals.map((g) => worldly(g, u))], constraint.line, constraint.file,
      { counter: { n: 0 }, scenario: constraint.scenario, rule: false });
    }
  }
  // Every answer gets the list of its unknowns, empty when it needs none.
  for (const clause of pending.filter((c) => c.head instanceof Struct && c.head.name === ANSWER)) {
    const final = fresh();
    if (clause.kind !== 'query') {
      const [body, u] = transform(clause.body, clause, EMPTY);
      const checked = constraints.length ? fresh() : final;
      clause.body = [...body, st('le:unknowns', u, checked), st('le:coherent', checked),
        ...(constraints.length ? [st('le:consistent', threaded ? clause.head.args[1] : 'none', checked, final)] : [])];
      helpers.add('le:coherent');
    }
    clause.head = new Struct(ANSWER, [...clause.head.args, final]);
  }
}

// A universal's check inside a negation: the variables of its assumption
// lists stand for any value there, so they become anonymous, _100000 on.
function renameApart(goal) {
  const map = new Map();
  const visit = (term) => {
    if (term instanceof Var && /^U\d+_$/.test(term.name)) {
      if (!map.has(term)) map.set(term, new Var(`_${100000 + map.size}`));
      return map.get(term);
    }
    if (term instanceof Struct) return new Struct(term.name, term.args.map(visit));
    return term;
  };
  return visit(goal);
}

function flattenGoal(goal) {
  if (goal instanceof Struct && goal.name === 'and' && goal.args.length === 2) return [...flattenGoal(goal.args[0]), ...flattenGoal(goal.args[1])];
  return [goal];
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
export function leValue(term, templates) {
  if (term instanceof Var) return '_';
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
export function sentence(query, values, templates) {
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
  const { templates, scenarios, threaded, queries, expectations, abductive } = loaded.compiled;
  // Per scenario and query, each answer with the sets of unknowns it rests
  // on; an answer that also holds without any is definite.
  const found = new Map();
  // A negative assumption reads "it is not the case that S".
  const unknown = (term) => {
    if (term instanceof Struct && term.name === 'le:not' && term.args.length === 1) return `it is not the case that ${unknown(term.args[0])}`;
    // Without a scenario argument a sentence with no places is an atom.
    if (typeof term === 'string') return leValue(new Struct(term, []), templates);
    return leValue(threaded && term instanceof Struct ? new Struct(term.name, term.args.slice(1)) : term, templates);
  };
  for (const answer of result.answers) {
    const term = readTerm(answer);
    if (!(term instanceof Struct) || term.name !== ANSWER) continue;
    const [name, ...rest] = term.args;
    const scenario = threaded ? rest.shift() : null;
    const assumed = abductive ? listTerms(rest.pop()).map(unknown) : [];
    const query = queries.find((q) => q.name === name);
    if (!query) continue;
    const key = `${scenario}\u0000${name}`;
    if (!found.has(key)) found.set(key, new Map());
    // A flip's answer is its changes: "add: S and remove: T".
    const flip = (changes) => listTerms(changes).map((c) => `${c.name}: ${leValue(c.args[0], templates)}`).sort().join(' and ') || 'no change is needed';
    const text = query.flip ? flip(rest[0]) : sentence(query, rest, templates), answers = found.get(key);
    if (!answers.has(text)) answers.set(text, []);
    const sets = answers.get(text), set = [...new Set(assumed)].sort();
    if (!sets.some((other) => other.join('\u0000') === set.join('\u0000'))) sets.push(set);
  }
  // LE2 writes the underscores of names as spaces and repeats an answer for
  // each proof; expected answers are compared as a set, either way.
  // An expected number with decimals matches an answer's number rounded to
  // as many decimals, as LE2 compares them.
  const same = (a) => a.replaceAll('_', ' ').replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim();
  const matches = (want, got) => {
    const w = want.split(' '), g = got.split(' ');
    return w.length === g.length && w.every((word, i) => {
      if (word === g[i]) return true;
      const decimals = /^-?\d+\.(\d+)$/.exec(word);
      return decimals !== null && /^-?\d+(\.\d+)?(e[+-]?\d+)?$/.test(g[i]) && Number(g[i]).toFixed(decimals[1].length) === word;
    });
  };
  const equal = (a, b) => {
    const x = [...new Set(a.map(same))], y = [...new Set(b.map(same))];
    return x.every((w) => y.some((g) => matches(w, g))) && y.every((g) => x.some((w) => matches(w, g)));
  };
  const blocks = [];
  for (const scenario of threaded ? scenarios : [null]) {
    for (const query of queries) {
      const answers = found.get(`${scenario}\u0000${query.name}`) ?? new Map();
      const title = scenario === null ? `% query ${query.name}` : `% query ${query.name} with scenario ${scenario}`;
      const lines = [title];
      const unknowns = new Set();
      for (const [text, sets] of answers) {
        lines.push(`${text}.`);
        if (sets.some((set) => !set.length)) continue;
        sets.forEach((set, i) => lines.push(`% ${i ? 'or assuming' : 'assuming'} that ${set.join(' and ')}`));
        for (const set of sets) for (const u of set) unknowns.add(u);
      }
      if (!answers.size) lines.push('% no answers');
      // An expectation without "and unknowns", or with an empty list, wants
      // answers that rest on nothing; "and any unknowns" compares the answers.
      for (const expected of expectations.filter((e) => e.scenario === scenario && e.query === query.name)) {
        if (expected.changes) {
          const sets = expected.changes.map((set) => [...set].sort().join(' and ') || 'no change is needed');
          if (!equal(sets, [...answers.keys()])) {
            lines.push(`% not as expected: ${query.name} expects changes [${expected.changes.map((set) => `[${set.map((c) => JSON.stringify(c)).join(', ')}]`).join(', ')}]`);
          }
          continue;
        }
        const ok = equal(expected.answers, [...answers.keys()]) && (expected.unknowns === 'any' || equal(expected.unknowns, [...unknowns]));
        if (ok) continue;
        const quoted = (items) => `[${items.map((a) => JSON.stringify(a)).join(', ')}]`;
        const tail = expected.unknowns === 'any' ? ' and any unknowns' : expected.unknowns.length ? ` and unknowns ${quoted(expected.unknowns)}` : '';
        lines.push(`% not as expected: ${query.name} expects answers ${quoted(expected.answers)}${tail}`);
      }
      blocks.push(lines.join('\n'));
    }
  }
  return blocks.length ? blocks.join('\n\n') + '\n' : '% no queries\n';
}

function listTerms(term) {
  const items = [];
  while (term instanceof Struct && term.name === '.' && term.args.length === 2) { items.push(term.args[0]); term = term.args[1]; }
  return items;
}
