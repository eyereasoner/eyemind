
const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const RDF_TYPE = `${RDF_NS}type`;
const RDF_FIRST = `${RDF_NS}first`;
const RDF_REST = `${RDF_NS}rest`;
const RDF_NIL = `${RDF_NS}nil`;
const RDF_REIFIES = `${RDF_NS}reifies`;
const XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string';
const XSD_BOOLEAN = 'http://www.w3.org/2001/XMLSchema#boolean';
const XSD_INTEGER = 'http://www.w3.org/2001/XMLSchema#integer';
const XSD_DECIMAL = 'http://www.w3.org/2001/XMLSchema#decimal';
const XSD_DOUBLE = 'http://www.w3.org/2001/XMLSchema#double';

function iri(value) {
  return { type: 'iri', value: String(value) };
}

function variable(name) {
  const value = String(name);
  return { type: 'var', value: value[0] === '?' || value[0] === '$' ? value.slice(1) : value };
}

function blankNode(value) {
  const label = String(value);
  return { type: 'blank', value: label.startsWith('_:') ? label.slice(2) : label };
}

function literal(value, datatype = null, lang = null, langDir = null) {
  return { type: 'literal', value, datatype, lang, langDir };
}

function tripleTerm(s, p, o) {
  return { type: 'triple', s, p, o };
}

function isIRI(term) {
  return term && term.type === 'iri';
}

function isBlank(term) {
  return term && term.type === 'blank';
}

function isLiteral(term) {
  return term && term.type === 'literal';
}

function termEquals(a, b) {
  return termKey(a) === termKey(b);
}

function literalKeyValue(value) {
  if (typeof value === 'bigint') return `${value.toString()}n`;
  return JSON.stringify(value);
}

function termKey(term) {
  if (!term) return 'null';
  if (term.type === 'iri') return `I:${term.value}`;
  if (term.type === 'blank') return `B:${term.value}`;
  if (term.type === 'var') return `V:${term.value}`;
  if (term.type === 'literal') return `L:${literalKeyValue(term.value)}^^${term.datatype || ''}@${term.lang || ''}--${term.langDir || ''}`;
  if (term.type === 'triple') return `T:${termKey(term.s)} ${termKey(term.p)} ${termKey(term.o)}`;
  return JSON.stringify(term);
}

function cloneTerm(term) {
  if (!term) return term;
  if (term.type === 'triple') return tripleTerm(cloneTerm(term.s), cloneTerm(term.p), cloneTerm(term.o));
  return { ...term };
}

function escapeString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/"/g, '\\"');
}

function compactIRI(value, prefixes = {}) {
  if (value === RDF_TYPE) return 'a';
  const entries = Object.entries(prefixes)
    .filter(([, iriPrefix]) => iriPrefix && value.startsWith(iriPrefix))
    .sort((a, b) => b[1].length - a[1].length);
  if (entries.length > 0) {
    const [prefix, iriPrefix] = entries[0];
    const local = value.slice(iriPrefix.length);
    if (/^[A-Za-z_][A-Za-z0-9_\-]*$/.test(local) || /^[A-Za-z0-9_\-]+$/.test(local)) {
      return `${prefix}:${local}`;
    }
  }
  return `<${value}>`;
}

// A number may drop its datatype only when the shorthand reads back as the
// same datatype: an INTEGER carries neither `.` nor exponent, a DECIMAL a
// `.`, a DOUBLE an exponent ([95]-[97]). `72` written bare for an
// xsd:double would come back as an xsd:integer, so such a literal keeps
// its datatype; a whole-numbered decimal gains the `.0` that makes it one.
function numericShorthand(value, datatype) {
  const text = String(value);
  const hasExponent = /[eE]/.test(text);
  const hasDot = text.includes('.');
  if (!datatype || datatype === XSD_INTEGER) return !hasDot && !hasExponent ? text : null;
  if (datatype === XSD_DECIMAL) return hasExponent ? null : (hasDot ? text : `${text}.0`);
  if (datatype === XSD_DOUBLE) return hasExponent ? text : null;
  return null;
}

function formatTerm(term, prefixes = {}) {
  if (term.type === 'iri') return compactIRI(term.value, prefixes);
  if (term.type === 'blank') return `_:${term.value}`;
  if (term.type === 'var') return `?${term.value}`;
  if (term.type === 'triple') return `<<(${formatTerm(term.s, prefixes)} ${formatTerm(term.p, prefixes)} ${formatTerm(term.o, prefixes)})>>`;
  if (term.type === 'literal') {
    const v = term.value;
    if (typeof v === 'bigint' && !term.lang && (!term.datatype || term.datatype === XSD_INTEGER)) return String(v);
    if (typeof v === 'number' && Number.isFinite(v) && !term.lang) {
      const shorthand = numericShorthand(v, term.datatype);
      if (shorthand !== null) return shorthand;
    }
    if (typeof v === 'boolean' && !term.lang && (!term.datatype || term.datatype === XSD_BOOLEAN)) return v ? 'true' : 'false';
    const lexical = `"${escapeString(v)}"`;
    if (term.lang) return `${lexical}@${term.lang}${term.langDir ? `--${term.langDir}` : ''}`;
    if (term.datatype && term.datatype !== XSD_STRING) return `${lexical}^^${compactIRI(term.datatype, prefixes)}`;
    return lexical;
  }
  return String(term.value ?? term);
}

export {
  RDF_NS,
  RDF_TYPE,
  RDF_FIRST,
  RDF_REST,
  RDF_NIL,
  RDF_REIFIES,
  XSD_STRING,
  XSD_BOOLEAN,
  XSD_INTEGER,
  XSD_DECIMAL,
  XSD_DOUBLE,
  iri,
  variable,
  blankNode,
  literal,
  tripleTerm,
  isIRI,
  isBlank,
  isLiteral,
  termEquals,
  compactIRI,
};
