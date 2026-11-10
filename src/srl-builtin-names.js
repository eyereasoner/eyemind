
// The SPARQL 1.2 RL BuiltInCall names and arities, from eyeleng's src/builtins.js.
// This table is intentionally shaped by the SPARQL 1.2 RL grammar production BuiltInCall.
// Keys are the canonical spellings used by the draft; lookup is case-insensitive so examples
// may use SPARQL-style uppercase or lowercase spellings while still being checked against the
// grammar's finite set of built-ins.
const BUILTIN_SIGNATURES = Object.freeze({
  STR: { min: 1, max: 1 },
  LANG: { min: 1, max: 1 },
  LANGMATCHES: { min: 2, max: 2 },
  LANGDIR: { min: 1, max: 1 },
  DATATYPE: { min: 1, max: 1 },
  IRI: { min: 1, max: 1 },
  URI: { min: 1, max: 1 },
  BNODE: { min: 0, max: 1 },
  ABS: { min: 1, max: 1 },
  CEIL: { min: 1, max: 1 },
  FLOOR: { min: 1, max: 1 },
  ROUND: { min: 1, max: 1 },
  CONCAT: { min: 0, max: Infinity },
  SUBSTR: { min: 2, max: 3 },
  STRLEN: { min: 1, max: 1 },
  REPLACE: { min: 3, max: 4 },
  UCASE: { min: 1, max: 1 },
  LCASE: { min: 1, max: 1 },
  ENCODE_FOR_URI: { min: 1, max: 1 },
  CONTAINS: { min: 2, max: 2 },
  STRSTARTS: { min: 2, max: 2 },
  STRENDS: { min: 2, max: 2 },
  STRBEFORE: { min: 2, max: 2 },
  STRAFTER: { min: 2, max: 2 },
  YEAR: { min: 1, max: 1 },
  MONTH: { min: 1, max: 1 },
  DAY: { min: 1, max: 1 },
  HOURS: { min: 1, max: 1 },
  MINUTES: { min: 1, max: 1 },
  SECONDS: { min: 1, max: 1 },
  TIMEZONE: { min: 1, max: 1 },
  TZ: { min: 1, max: 1 },
  NOW: { min: 0, max: 0 },
  UUID: { min: 0, max: 0 },
  STRUUID: { min: 0, max: 0 },
  IF: { min: 3, max: 3, lazy: true },
  STRLANG: { min: 2, max: 2 },
  STRLANGDIR: { min: 3, max: 3 },
  STRDT: { min: 2, max: 2 },
  sameTerm: { min: 2, max: 2 },
  isIRI: { min: 1, max: 1 },
  isURI: { min: 1, max: 1 },
  isBLANK: { min: 1, max: 1 },
  isLITERAL: { min: 1, max: 1 },
  isNUMERIC: { min: 1, max: 1 },
  hasLANG: { min: 1, max: 1 },
  hasLANGDIR: { min: 1, max: 1 },
  REGEX: { min: 2, max: 3 },
  isTRIPLE: { min: 1, max: 1 },
  TRIPLE: { min: 3, max: 3 },
  SUBJECT: { min: 1, max: 1 },
  PREDICATE: { min: 1, max: 1 },
  OBJECT: { min: 1, max: 1 },
});

const BUILTIN_BY_LOWER = new Map(Object.keys(BUILTIN_SIGNATURES).map((name) => [name.toLowerCase(), name]));

function canonicalBuiltinName(name) {
  return BUILTIN_BY_LOWER.get(String(name).toLowerCase()) || null;
}

function isBuiltinName(name) {
  return canonicalBuiltinName(name) !== null;
}

function builtinNames() {
  return Object.keys(BUILTIN_SIGNATURES);
}


export { BUILTIN_SIGNATURES, canonicalBuiltinName, isBuiltinName, builtinNames };
