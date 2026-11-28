// The toRdf and fromRdf tests of the W3C JSON-LD API (w3c/json-ld-api,
// tests/). A toRdf case deserializes a JSON-LD document to RDF and compares
// the dataset with the expected N-Quads, or expects the error code it names;
// a fromRdf case serializes N-Quads as JSON-LD and compares it with the
// expected expanded document, arrays in any order except lists. Remote contexts
// are files of the mirror, read through the document loader. A case for
// JSON-LD 1.0 runs in that processing mode, the others in json-ld-1.2; a case
// that produces generalized RDF, with blank node predicates that RDF and so
// eyemind's N-Quads reader do not allow, is compared line by line.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { jsonLdToRdf } from '../src/jsonld.js';
import { literalOf, parseRdf, writeRdf } from '../src/rdf.js';
import { Struct } from '../src/terms.js';
import { cachePaths } from '../tools/test-cache.js';
import { isomorphic } from './w3c.js';

export const JSONLD_SOURCE = 'https://github.com/w3c/json-ld-api';
export const JSONLD_PATHS = ['tests/toRdf', 'tests/expand', 'tests/fromRdf'];
export const JSONLD_MANIFESTS = ['tests/toRdf-manifest.jsonld', 'tests/fromRdf-manifest.jsonld'];
const BASE = 'https://w3c.github.io/json-ld-api/';

export function jsonLdCases({ mirror = cachePaths().jsonld } = {}) {
  return JSONLD_MANIFESTS.flatMap((path) => JSON.parse(readFileSync(join(mirror, path), 'utf8')).sequence
    .map((entry) => ({ ...entry, id: `${path.slice(6, -16)}${entry['@id']}`, types: [].concat(entry['@type']), mirror })));
}

// Expanded JSON-LD in a form that compares arrays in any order, but lists in theirs.
function canonical(value, list = false) {
  if (Array.isArray(value)) {
    const items = value.map((item) => canonical(item));
    return JSON.stringify(list ? items : items.sort());
  }
  if (value && typeof value === 'object') return JSON.stringify(Object.keys(value).sort().map((k) => [k, canonical(value[k], k === '@list')]));
  return JSON.stringify(value);
}

function scoreFromRdf(c, option) {
  const negative = c.types.includes('jld:NegativeEvaluationTest');
  let output;
  try {
    const quads = parseRdf(readFileSync(join(c.mirror, 'tests', c.input), 'utf8'), { format: 'n-quads', scope: 'input' }).quads;
    output = JSON.parse(writeRdf(quads, { format: 'json-ld', useNativeTypes: option.useNativeTypes, useRdfType: option.useRdfType,
      rdfDirection: option.rdfDirection ?? null, processingMode: option.specVersion === 'json-ld-1.0' ? 'json-ld-1.0' : option.processingMode }));
  } catch (error) {
    return negative && error.message.includes(c.expectErrorCode) ? { status: 'passed' } : { status: 'failed', message: error.message };
  }
  if (negative) return { status: 'failed', message: `accepted, expected ${c.expectErrorCode}` };
  const expected = JSON.parse(readFileSync(join(c.mirror, 'tests', c.expect), 'utf8'));
  return canonical(output) === canonical(expected) ? { status: 'passed' } : { status: 'failed', message: 'the document differs from the expected one' };
}

// Generalized N-Quads, for the cases that produce them: one quad a line.
function generalized(text) {
  const st = (name, ...args) => new Struct(name, args);
  const term = (token) => {
    if (token.startsWith('<')) return st('iri', token.slice(1, -1));
    if (token.startsWith('_:')) return st('bnode', 'expected', token.slice(2));
    const [, value, lang, datatype] = /^("(?:[^"\\]|\\.)*")(?:@([\w-]+)|\^\^<([^>]*)>)?$/.exec(token);
    return lang ? st('literal', JSON.parse(value), st('lang', lang.toLowerCase())) : literalOf(JSON.parse(value), datatype ?? 'http://www.w3.org/2001/XMLSchema#string');
  };
  return text.split('\n').filter((line) => line.trim()).map((line) => {
    const tokens = line.match(/<[^>]*>|_:\S+|"(?:[^"\\]|\\.)*"(?:@[\w-]+|\^\^<[^>]*>)?/g).map(term);
    return [...tokens.slice(0, 3), tokens[3] ?? 'default_graph'];
  });
}

// 'passed' or 'failed', with a message for a failure.
export function scoreJsonLdCase(c) {
  const option = c.option ?? {};
  if (c.types.includes('jld:FromRDFTest')) return scoreFromRdf(c, option);
  const file = (path) => join(c.mirror, 'tests', path);
  const url = `${BASE}tests/${c.input}`;
  const loadDocument = (iri) => {
    const path = iri.startsWith(BASE) ? join(c.mirror, iri.slice(BASE.length).replace(/#.*$/, '')) : null;
    if (!path || !existsSync(path)) throw new Error(`no document ${iri}`);
    return { document: readFileSync(path, 'utf8'), documentUrl: iri };
  };
  const processingMode = option.specVersion === 'json-ld-1.0' ? 'json-ld-1.0' : option.processingMode;
  const options = { base: option.base ?? url, processingMode, rdfDirection: option.rdfDirection ?? null,
    produceGeneralizedRdf: option.produceGeneralizedRdf ?? false,
    expandContext: option.expandContext ? `${BASE}tests/${option.expandContext}` : undefined, loadDocument };
  const input = readFileSync(file(c.input), 'utf8');
  const negative = c.types.includes('jld:NegativeEvaluationTest');
  let actual;
  try {
    actual = parseRdf(input, { format: 'json-ld', scope: 'actual', ...options }).quads;
  } catch {
    // The error code, which the message of parseRdf does not keep apart.
    let code = null;
    try { jsonLdToRdf(input, options); } catch (error) { code = error.code ?? error.message; }
    if (negative && code === c.expectErrorCode) return { status: 'passed' };
    return { status: 'failed', message: `${code}${negative ? `, expected ${c.expectErrorCode}` : ''}` };
  }
  if (negative) return { status: 'failed', message: `accepted, expected ${c.expectErrorCode}` };
  if (!c.types.includes('jld:PositiveEvaluationTest')) return { status: 'passed' };
  const text = readFileSync(file(c.expect), 'utf8');
  const expected = option.produceGeneralizedRdf ? generalized(text) : parseRdf(text, { format: 'n-quads', scope: 'expected' }).quads;
  return isomorphic(actual, expected) ? { status: 'passed' } : { status: 'failed', message: 'the dataset differs from the expected one' };
}
