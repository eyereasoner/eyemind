/**
 * eyemind: RDF terms and shared utilities
 *
 * Core data model and shared utilities: Term/Triple/Formula types, namespaces,
 * and prefix environment helpers used throughout the project.
 */


// ===========================================================================
// Namespace constants
// ===========================================================================

const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const XSD_NS = 'http://www.w3.org/2001/XMLSchema#';
const LOG_NS = 'http://www.w3.org/2000/10/swap/log#';

function parseUriReferenceForResolution(uri) {
  // RFC 3986 Appendix B-style component parser, with the scheme tightened to
  // the RFC scheme grammar. Capturing delimiter presence matters: `?` with an
  // empty query is defined, while no `?` means undefined.
  const m = /^(([A-Za-z][A-Za-z0-9+.-]*):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/u.exec(String(uri));
  if (!m) return null;
  return {
    scheme: m[2] !== undefined ? m[2] : undefined,
    authority: m[4] !== undefined ? m[4] : undefined,
    path: m[5] || '',
    query: m[6] !== undefined ? (m[7] || '') : undefined,
    fragment: m[8] !== undefined ? (m[9] || '') : undefined,
  };
}

function recomposeUriReference(parts) {
  let out = '';
  if (parts.scheme !== undefined) out += `${parts.scheme}:`;
  if (parts.authority !== undefined) out += `//${parts.authority}`;
  out += parts.path || '';
  if (parts.query !== undefined) out += `?${parts.query}`;
  if (parts.fragment !== undefined) out += `#${parts.fragment}`;
  return out;
}

function removeLastPathSegment(path) {
  if (!path) return '';
  const i = path.lastIndexOf('/');
  if (i < 0) return '';
  if (i === 0) return '';
  return path.slice(0, i);
}

function removeDotSegments(path) {
  // eyemind: use RFC 3986 section 5.2.4 instead of WHATWG URL parsing to
  // preserve IRI spelling (for example, do not add a trailing
  // slash to `http://example.org`) while still normalizing `.` and `..` path
  // segments as required by section 5.2.2.
  let input = String(path || '');
  let output = '';

  while (input.length > 0) {
    if (input.startsWith('../')) {
      input = input.slice(3);
    } else if (input.startsWith('./')) {
      input = input.slice(2);
    } else if (input.startsWith('/./')) {
      input = `/${input.slice(3)}`;
    } else if (input === '/.') {
      input = '/';
    } else if (input.startsWith('/../')) {
      input = `/${input.slice(4)}`;
      output = removeLastPathSegment(output);
    } else if (input === '/..') {
      input = '/';
      output = removeLastPathSegment(output);
    } else if (input === '.' || input === '..') {
      input = '';
    } else {
      let segmentEnd;
      if (input[0] === '/') {
        segmentEnd = input.indexOf('/', 1);
      } else {
        segmentEnd = input.indexOf('/');
      }

      if (segmentEnd < 0) {
        output += input;
        input = '';
      } else {
        output += input.slice(0, segmentEnd);
        input = input.slice(segmentEnd);
      }
    }
  }

  return output;
}

function mergePaths(base, refPath) {
  if (base.authority !== undefined && base.path === '') {
    return `/${refPath}`;
  }
  const i = base.path.lastIndexOf('/');
  if (i < 0) return refPath;
  return `${base.path.slice(0, i + 1)}${refPath}`;
}

function resolveIriRef(ref, base) {
  const r = parseUriReferenceForResolution(ref);
  if (!r) return ref;

  const baseParts = base ? parseUriReferenceForResolution(base) : null;

  // Absolute references do not need a base, but RFC 3986 section 5.2.2 still
  // applies remove_dot_segments(R.path) when R.scheme is defined.
  if (r.scheme !== undefined) {
    return recomposeUriReference({
      scheme: r.scheme,
      authority: r.authority,
      path: removeDotSegments(r.path),
      query: r.query,
      fragment: r.fragment,
    });
  }

  // Without a usable base, preserve relative references as written.
  if (!baseParts || baseParts.scheme === undefined) return ref;

  const t = {
    scheme: baseParts.scheme,
    authority: undefined,
    path: '',
    query: undefined,
    fragment: r.fragment,
  };

  if (r.authority !== undefined) {
    t.authority = r.authority;
    t.path = removeDotSegments(r.path);
    t.query = r.query;
  } else if (r.path === '') {
    t.authority = baseParts.authority;
    t.path = baseParts.path;
    t.query = r.query !== undefined ? r.query : baseParts.query;
  } else {
    t.authority = baseParts.authority;
    if (r.path.startsWith('/')) {
      t.path = removeDotSegments(r.path);
    } else {
      t.path = removeDotSegments(mergePaths(baseParts, r.path));
    }
    t.query = r.query;
  }

  return recomposeUriReference(t);
}

// -----------------------------------------------------------------------------
// Literal helpers
// -----------------------------------------------------------------------------

// Hot cache used by literalParts().
const MAX_LITERAL_PARTS_CACHE_LEN = 1024;

const __literalPartsCache = new Map(); // lit string -> [lex, dt]

function quotedLiteralEndIndex(str) {
  if (typeof str !== 'string' || str.length < 2) return -1;

  const quote = str[0];
  if (quote !== '"' && quote !== "'") return -1;

  const delimLen = str.startsWith(quote.repeat(3)) ? 3 : 1;
  const delim = quote.repeat(delimLen);

  let i = delimLen;
  while (i < str.length) {
    // Stored literals may contain escaped quotes, e.g. \"...\"^^xsd:dateTime
    // inside a plain string. Those must not terminate the outer lexical form.
    if (str[i] === '\\') {
      i += 2;
      continue;
    }

    if (delimLen === 1) {
      if (str[i] === quote) return i + 1;
      i += 1;
      continue;
    }

    if (str.startsWith(delim, i)) return i + delimLen;
    i += 1;
  }

  return -1;
}

function literalParts(lit) {
  // Avoid caching extremely large literals (notably huge numeric intermediates)
  // to prevent unbounded memory growth.
  const useCache = typeof lit === 'string' && lit.length <= MAX_LITERAL_PARTS_CACHE_LEN;

  if (useCache) {
    const cached = __literalPartsCache.get(lit);
    if (cached) return cached;
  }

  // Split a literal into lexical form and datatype IRI (if any).
  // Also strip an optional language tag from the lexical form:
  //   "\"hello\"@en"  -> "\"hello\""
  //   "\"hello\"@en^^<...>" is rejected earlier in the parser.
  let lex = lit;
  let dt = null;

  const lexEnd = quotedLiteralEndIndex(lit);
  if (lexEnd > 0 && lit.startsWith('^^', lexEnd)) {
    lex = lit.slice(0, lexEnd);
    dt = lit.slice(lexEnd + 2);
    if (dt.startsWith('<') && dt.endsWith('>')) {
      dt = dt.slice(1, -1);
    }
  }

  // Strip LANGTAG from the lexical form when present.
  const langLexEnd = quotedLiteralEndIndex(lex);
  if (langLexEnd > 0 && lex[0] === '"' && langLexEnd < lex.length && lex[langLexEnd] === '@') {
    const lang = lex.slice(langLexEnd + 1);
    if (/^[A-Za-z]+(?:-[A-Za-z0-9]+)*$/.test(lang)) {
      lex = lex.slice(0, langLexEnd);
    }
  }

  const res = [lex, dt];
  if (useCache) __literalPartsCache.set(lit, res);
  return res;
}

// -----------------------------------------------------------------------------
// Global stable term IDs (performance)
// -----------------------------------------------------------------------------
// A small integer ID is assigned per *value-based* key, and stored on each term
// as non-enumerable property `__tid`. This enables cheaper indexing and
// equality fast-paths than repeated string key construction.

let __nextTid = 1;
const __iriTidIntern = new Map();      // IRI value -> number
const __blankTidIntern = new Map();    // blank label -> number
const __literalTidIntern = new Map();  // normalized literal lexical form -> number

// Avoid storing extremely large literal keys in the global term-id intern map.
// For huge literals we still assign a unique __tid, but we do not intern the key.
const MAX_LITERAL_TID_LEN = 1024;

function __getTidFromMap(map, key) {
  let id = map.get(key);
  if (!id) {
    id = __nextTid++;
    map.set(key, id);
  }
  return id;
}

function __getIriTid(value) {
  return __getTidFromMap(__iriTidIntern, value);
}

function __getBlankTid(label) {
  return __getTidFromMap(__blankTidIntern, label);
}

function __getLiteralTid(norm) {
  return __getTidFromMap(__literalTidIntern, norm);
}

function __isQuotedLexical(lit) {
  if (typeof lit !== 'string') return false;
  if (lit.length >= 6) {
    if (lit.startsWith('"""') && lit.endsWith('"""')) return true;
    if (lit.startsWith("'''") && lit.endsWith("'''")) return true;
  }
  if (lit.length >= 2) {
    const a = lit[0];
    const b = lit[lit.length - 1];
    if ((a === '"' && b === '"') || (a === "'" && b === "'")) return true;
  }
  return false;
}

function __literalHasLangTag(lit) {
  if (typeof lit !== 'string' || !__isQuotedLexical(lit)) return false;
  let end = -1;
  let qlen = 1;
  if (lit.startsWith('"""')) {
    end = lit.lastIndexOf('"""');
    qlen = 3;
  } else if (lit.startsWith("'''")) {
    end = lit.lastIndexOf("'''");
    qlen = 3;
  } else {
    end = lit.lastIndexOf(lit[0]);
    qlen = 1;
  }
  if (end < 0) return false;
  const after = lit.slice(end + qlen);
  if (!after.startsWith('@')) return false;
  const lang = after.slice(1);
  return /^[A-Za-z]+(?:-[A-Za-z0-9]+)*$/.test(lang);
}

function __isPlainStringLiteralValue(lit) {
  if (typeof lit !== 'string') return false;
  if (lit.indexOf('^^') >= 0) return false;
  if (!__isQuotedLexical(lit)) return false;
  return !__literalHasLangTag(lit);
}

function normalizeLiteralForTid(lit) {
  // Canonicalize so that plain string and explicit xsd:string share the same id.
  if (typeof lit !== 'string') return lit;

  // Fast path for the overwhelmingly common lexer output for plain string
  // literals: a canonical JSON-style quoted lexical form with no suffix.
  // This avoids literalParts()/language-tag parsing for large fact tables.
  if (lit.length >= 2 && lit.charCodeAt(0) === 34 && lit.charCodeAt(lit.length - 1) === 34 && lit.indexOf('^^') < 0) {
    return `${lit}^^<${XSD_NS}string>`;
  }

  const [lex, dt] = literalParts(lit);
  if (dt === XSD_NS + 'string') return `${lex}^^<${XSD_NS}string>`;
  if (dt === null && __isPlainStringLiteralValue(lit)) return `${lex}^^<${XSD_NS}string>`;
  return lit;
}

// ===========================================================================
// AST (Abstract Syntax Tree)
// ===========================================================================

class Term {}

class Iri extends Term {
  constructor(value) {
    super();
    this.value = value;
    Object.defineProperty(this, '__tid', {
      value: __getIriTid(value),
      enumerable: false,
    });
  }
}

class Literal extends Term {
  constructor(value) {
    super();
    this.value = value; // raw lexical form, e.g. "foo", 12, true, or "\"1944-08-21\"^^..."
    const norm = normalizeLiteralForTid(value);
    const useIntern = typeof norm === 'string' && norm.length <= MAX_LITERAL_TID_LEN;
    const tid = useIntern ? __getLiteralTid(norm) : __nextTid++;
    Object.defineProperty(this, '__tid', {
      value: tid,
      enumerable: false,
    });
  }
}

class Blank extends Term {
  constructor(label, blankNodeKind = 'labeled') {
    super();
    this.label = label; // _:b1, etc.
    // eyemind: log:rawType distinguishes source-labeled blank nodes (_:name)
    // from unlabeled blank nodes introduced by N3 syntax such as [] / [...].
    this.blankNodeKind = blankNodeKind === 'unlabeled' ? 'unlabeled' : 'labeled';
    Object.defineProperty(this, '__tid', {
      value: __getBlankTid(label),
      enumerable: false,
    });
  }
}

class ListTerm extends Term {
  constructor(elems) {
    super();
    this.elems = elems; // Term[]
  }
}

class GraphTerm extends Term {
  constructor(triples) {
    super();
    this.triples = triples; // Triple[]
  }
}

class Triple {
  constructor(s, p, o) {
    this.s = s;
    this.p = p;
    this.o = o;
  }
}

// ===========================================================================
// Term interning
// ===========================================================================

// Intern IRIs and literals by their raw lexical string.
// This reduces allocations when the same terms repeat and can improve performance.
//
// NOTE: Terms are treated as immutable. Do NOT mutate .value on interned objects.
const __iriIntern = new Map();
const __literalIntern = new Map();

// eyemind: conversion produces independent eyemind terms. Keeping parser
// intern tables after that would retain every term in an unbounded log.
function clearParserCaches() {
  for (const cache of [__literalPartsCache, __iriTidIntern, __blankTidIntern,
    __literalTidIntern, __iriIntern, __literalIntern]) cache.clear();
}

// Do not intern extremely large literal strings (e.g., huge numeric intermediates).
// Interning them creates global strong references that prevent GC.
const MAX_LITERAL_INTERN_LEN = 1024;

/** @param {string} value */
function internIri(value) {
  let t = __iriIntern.get(value);
  if (!t) {
    t = new Iri(value);
    __iriIntern.set(value, t);
  }
  return t;
}

/** @param {string} value */
function internLiteral(value) {
  if (typeof value === 'string' && value.length > MAX_LITERAL_INTERN_LEN) {
    // Skip global interning for huge literals to avoid retaining them forever.
    return new Literal(value);
  }
  let t = __literalIntern.get(value);
  if (!t) {
    t = new Literal(value);
    __literalIntern.set(value, t);
  }
  return t;
}

// ===========================================================================
// Special predicate helpers (kept here because PrefixEnv needs them)
// ===========================================================================

// ===========================================================================
// PREFIX ENVIRONMENT
// ===========================================================================

class PrefixEnv {
  constructor(map, baseIri) {
    this.map = map || {};          // prefix -> IRI (including "" for @prefix :)
    this.baseIri = baseIri || '';  // base IRI for resolving <relative>
  }

  set(pref, base) {
    this.map[pref] = base;
  }

  setBase(baseIri) {
    this.baseIri = baseIri || '';
  }

  expandQName(q) {
    const sep = typeof q === 'string' ? q.indexOf(':') : -1;
    if (sep >= 0) {
      const p = q.slice(0, sep);
      const local = q.slice(sep + 1);
      const base = this.map[p] || '';
      if (base) return base + local;
      return q;
    }
    return q;
  }
}

export {
  RDF_NS,
  LOG_NS,
  resolveIriRef,
  literalParts,
  Iri,
  Literal,
  Blank,
  ListTerm,
  GraphTerm,
  Triple,
  internIri,
  internLiteral,
  clearParserCaches,
  PrefixEnv,
};
