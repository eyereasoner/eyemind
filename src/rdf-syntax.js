// The RDF 1.2 grammars of Turtle, TriG, N-Triples and N-Quads, checked token
// by token before eyeling's parser reads a document.
//
// eyeling's parser reads N3, a superset of these formats, so on its own it
// would accept what they forbid: N3 operators and formulas, ?variables,
// keywords, unknown escapes, malformed names. This pass reads the document
// with the formats' own token rules and the statement shapes the parser
// cannot tell apart from N3, and throws a SyntaxError naming the problem.

const PN_CHARS_BASE = 'A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D' +
  '\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\u{10000}-\\u{EFFFF}';
const PN_CHARS_U = `${PN_CHARS_BASE}_`;
const PN_CHARS = `${PN_CHARS_U}\\-0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040`;
const PLX = '%[0-9A-Fa-f]{2}|\\\\[_~.\\-!$&\'()*+,;=/?#@%]';
const PN_PREFIX = `[${PN_CHARS_BASE}](?:[${PN_CHARS}.]*[${PN_CHARS}])?`;
const PN_LOCAL = `(?:[${PN_CHARS_U}:0-9]|${PLX})(?:(?:[${PN_CHARS}.:]|${PLX})*(?:[${PN_CHARS}:]|${PLX}))?`;
const PNAME = new RegExp(`^(?:${PN_PREFIX})?:(?:${PN_LOCAL})?`, 'u');
const BLANK = new RegExp(`^_:[${PN_CHARS_U}0-9](?:[${PN_CHARS}.]*[${PN_CHARS}])?`, 'u');
const LANGTAG = /^@[A-Za-z]+(?:-[A-Za-z0-9]+)*(?:--[A-Za-z]+)?/;
const NUMBER = /^[+-]?(?:[0-9]+(?:\.[0-9]*)?[eE][+-]?[0-9]+|\.[0-9]+[eE][+-]?[0-9]+|[0-9]*\.[0-9]+|[0-9]+)/;
const UCHAR = /^\\(?:u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/;
const PUNCT = ['<<(', ')>>', '<<', '>>', '{|', '|}', '^^', '.', ';', ',', '[', ']', '(', ')', '{', '}', '~'];
const KEYWORDS = new Set(['a', 'true', 'false', 'PREFIX', 'BASE', 'VERSION', 'GRAPH']);
const DIRECTIVES = new Set(['@prefix', '@base', '@version']);

// The tokens of a document: { k: kind, v: text }.
function tokens(text, line) {
  const out = [];
  let i = 0;
  const fail = (message) => {
    throw new SyntaxError(message);
  };
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === '#') {
      while (i < text.length && text[i] !== '\n' && text[i] !== '\r') i += 1;
      continue;
    }
    const rest = text.slice(i, i + 3);
    if (ch === '<' && !rest.startsWith('<<')) {
      // An IRI: no spaces, no <>"{}|^`\ but escapes \u and \U.
      let j = i + 1;
      while (j < text.length && text[j] !== '>') {
        if (text[j] === '\\') {
          const m = UCHAR.exec(text.slice(j));
          if (!m) fail(`invalid escape in an IRI: ${text.slice(j, j + 2)}`);
          j += m[0].length;
        } else if (/[\u0000-\u0020<"{}|^`]/.test(text[j])) fail(`invalid character in an IRI: ${JSON.stringify(text[j])}`);
        else j += 1;
      }
      if (j >= text.length) fail('an IRI is not closed with >');
      out.push({ k: 'iri', v: text.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const long = text.startsWith(ch.repeat(3), i);
      if (line && (long || ch === "'")) fail('only "..." strings are allowed in RDF line syntax');
      let j = i + (long ? 3 : 1);
      for (;;) {
        if (j >= text.length) fail('a string is not closed');
        if (long ? text.startsWith(ch.repeat(3), j) : text[j] === ch) break;
        if (!long && (text[j] === '\n' || text[j] === '\r')) fail('a short string cannot hold a line break');
        if (text[j] === '\\') {
          const m = UCHAR.exec(text.slice(j));
          if (m) j += m[0].length;
          else if (/[tbnrf"'\\]/.test(text[j + 1] ?? '')) j += 2;
          else fail(`invalid escape in a string: ${text.slice(j, j + 2)}`);
        } else j += 1;
      }
      j += long ? 3 : 1;
      out.push({ k: 'string', v: text.slice(i, j) });
      i = j;
      const tag = LANGTAG.exec(text.slice(i));
      if (text[i] === '@') {
        if (!tag) fail('invalid language tag');
        if (/--/.test(tag[0]) && !/--(?:ltr|rtl)$/.test(tag[0])) fail(`invalid base direction ${tag[0]}`);
        out.push({ k: 'langtag', v: tag[0] });
        i += tag[0].length;
      }
      continue;
    }
    const punct = PUNCT.find((p) => text.startsWith(p, i));
    if (punct && !(punct === '.' && /[0-9]/.test(text[i + 1] ?? '') && !/[0-9A-Za-z_:]/.test(text[i - 1] ?? ''))) {
      out.push({ k: punct, v: punct });
      i += punct.length;
      continue;
    }
    if (text.startsWith('_:', i)) {
      const m = BLANK.exec(text.slice(i));
      if (!m) fail(`invalid blank node label ${text.slice(i, i + 12)}`);
      out.push({ k: 'bnode', v: m[0] });
      i += m[0].length;
      continue;
    }
    if (/[0-9+\-.]/.test(ch)) {
      const m = NUMBER.exec(text.slice(i));
      if (!m) fail(`invalid number ${text.slice(i, i + 12)}`);
      out.push({ k: 'number', v: m[0] });
      i += m[0].length;
      continue;
    }
    if (ch === '@') {
      const m = /^@[A-Za-z]+/.exec(text.slice(i));
      if (!m || !DIRECTIVES.has(m[0])) fail(`unknown directive ${m ? m[0] : '@'}`);
      out.push({ k: m[0], v: m[0] });
      i += m[0].length;
      continue;
    }
    const pname = PNAME.exec(text.slice(i));
    if (pname && pname[0].includes(':')) {
      out.push({ k: 'pname', v: pname[0] });
      i += pname[0].length;
      continue;
    }
    const word = /^[A-Za-z]+/.exec(text.slice(i));
    if (word && (KEYWORDS.has(word[0]) || /^(?:prefix|base|version|graph)$/i.test(word[0]))) {
      const upper = word[0].toUpperCase();
      out.push({ k: KEYWORDS.has(word[0]) && word[0] !== upper ? word[0] : upper, v: word[0] });
      i += word[0].length;
      continue;
    }
    fail(`unexpected ${JSON.stringify(text.slice(i, i + 12))}`);
  }
  return out;
}

const OPENS = { '[': ']', '(': ')', '<<': '>>', '<<(': ')>>', '{|': '|}' };
const CLOSES = new Set(Object.values(OPENS));

// Check a document of the given format; throws a SyntaxError.
export function checkRdfSyntax(text, format) {
  const line = format === 'n-triples' || format === 'n-quads';
  const trig = format === 'trig';
  const ts = tokens(text, line);
  const allowed = line ? new Set(['iri', 'bnode', 'string', 'langtag', '^^', '.', '<<(', ')>>', 'VERSION']) : null;
  const declared = new Set();
  const nesting = [];  // open brackets, parentheses, reified triples and annotation blocks
  let graph = false;   // inside a TriG graph's braces
  let items = 0;       // top-level items of the statement so far
  let first = null;    // the statement's first item: 'term', 'list', '[]', '[...]' or '<<'
  let directive = 0;   // tokens left of a directive
  const fail = (message) => {
    throw new SyntaxError(message);
  };
  // A statement ends: one that is only a subject is an error, unless it is
  // a blank node property list [ ... ] or a reified triple << ... >>.
  const endStatement = (what) => {
    if (items === 1 && first !== '[...]' && first !== '<<') fail(`${what} has no predicate`);
    items = 0;
    first = null;
  };
  for (let k = 0; k < ts.length; k++) {
    const t = ts[k];
    const prev = ts[k - 1];
    const next = ts[k + 1];
    if (allowed && !allowed.has(t.k)) fail(`${t.v} is not allowed in ${format}`);
    if (line && t.k === 'iri' && !/^<[A-Za-z][A-Za-z0-9+.-]*:/.test(t.v)) fail(`an IRI in ${format} must be absolute: ${t.v}`);
    if (t.k === 'pname') {
      const name = t.v.slice(0, t.v.indexOf(':'));
      if (['@prefix', 'PREFIX'].includes(prev?.k)) declared.add(name);
      else if (!declared.has(name)) fail(`the prefix ${name}: is not declared`);
    }
    if (directive > 0) {
      directive -= 1;
      continue;
    }
    const inReified = nesting.some((n) => n === '<<' || n === '<<(');
    const between = () => {
      if (graph || nesting.length || items) fail(`${t.v} is only allowed between statements`);
    };
    switch (t.k) {
      case '@prefix':
      case 'PREFIX':
        between();
        if (next?.k !== 'pname' || !next.v.endsWith(':') || ts[k + 2]?.k !== 'iri') fail(`${t.v} takes a prefix name and an IRI`);
        if ((ts[k + 3]?.k === '.') !== (t.k === '@prefix')) fail(t.k === '@prefix' ? '@prefix ends with a dot' : 'PREFIX has no dot');
        directive = t.k === '@prefix' ? 3 : 2;
        continue;
      case '@base':
      case 'BASE':
        between();
        if (next?.k !== 'iri') fail(`${t.v} takes an IRI`);
        if ((ts[k + 2]?.k === '.') !== (t.k === '@base')) fail(t.k === '@base' ? '@base ends with a dot' : 'BASE has no dot');
        directive = t.k === '@base' ? 2 : 1;
        continue;
      case '@version':
      case 'VERSION':
        between();
        if (next?.k !== 'string' || next.v.startsWith(next.v[0].repeat(3))) fail(`${t.v} takes a short string`);
        if ((ts[k + 2]?.k === '.') !== (t.k === '@version')) fail(t.k === '@version' ? '@version ends with a dot' : 'VERSION has no dot');
        directive = t.k === '@version' ? 2 : 1;
        continue;
      case 'GRAPH':
        if (!trig) fail(`GRAPH is not allowed in ${format}`);
        between();
        continue;
      case 'a':
        // a is a predicate: never a subject or an object.
        if (items === 0 || (prev && ['(', '<<', '<<(', '^^'].includes(prev.k)) ||
          (next && ['.', ';', ',', ']', ')', '}', '|}', '>>', ')>>'].includes(next.k))) fail('a is only a predicate');
        break;
      case '{':
        if (!trig) fail(`{ is not allowed in ${format}`);
        if (graph || nesting.length) fail('TriG graphs do not nest');
        // A graph is named by at most one term: GRAPH g { or g { or {.
        if (items > 1 || (items === 1 && !['term', '[]'].includes(first))) fail('a TriG graph is named by an IRI or a blank node');
        graph = true;
        items = 0;
        first = null;
        continue;
      case '}':
        if (!graph || nesting.length) fail('} closes no graph');
        if (items) endStatement(prev.v);
        graph = false;
        if (next?.k === '.') fail('a TriG graph is not followed by a dot');
        continue;
      case '.':
        if (nesting.length) fail('. inside brackets');
        if (items === 0) fail('a statement is empty');
        endStatement(prev.v);
        continue;
      default:
    }
    if (OPENS[t.k]) {
      if (inReified && (t.k === '(' || (t.k === '[' && next?.k !== ']'))) {
        fail('a reified triple or triple term holds no lists or blank node property lists');
      }
      if (nesting.length === 0) {
        if (items === 0) first = t.k === '(' ? 'list' : t.k === '[' ? (next?.k === ']' ? '[]' : '[...]') : t.k === '<<' ? '<<' : 'term';
        items += 1;
      }
      nesting.push(t.k);
    } else if (CLOSES.has(t.k)) {
      const open = nesting.pop();
      if (OPENS[open] !== t.k) fail(`${t.v} closes nothing`);
    } else if (nesting.length === 0) {
      if (items === 0) first = 'term';
      items += 1;
    }
  }
  if (nesting.length) fail('a bracket is not closed');
  if (graph) fail('a TriG graph is not closed');
  if (items) fail('the last statement does not end');
}
