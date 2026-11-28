
const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const RDF_TYPE = `${RDF_NS}type`;
const RDF_FIRST = `${RDF_NS}first`;
const RDF_REST = `${RDF_NS}rest`;
const RDF_NIL = `${RDF_NS}nil`;
const RDF_REIFIES = `${RDF_NS}reifies`;
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

export {
  termKey,
  RDF_NS,
  RDF_TYPE,
  RDF_FIRST,
  RDF_REST,
  RDF_NIL,
  RDF_REIFIES,
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
