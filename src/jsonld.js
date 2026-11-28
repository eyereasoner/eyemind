// JSON-LD in eyemind, as the JSON-LD 1.2 Processing Algorithms and API
// define it: a document deserialized to RDF (context processing, expansion,
// node map generation and conversion to RDF), giving the same quads as the
// other RDF formats, and RDF serialized as JSON-LD. The processing mode is
// json-ld-1.2 unless json-ld-1.1 or json-ld-1.0 is asked for. Remote contexts
// come from a loader the caller supplies; eyemind itself never fetches one.
// Errors carry the code the specification names.
// https://w3c.github.io/json-ld-api/
import { resolveIriRef } from './rdf-prelude.js';

const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const XSD = 'http://www.w3.org/2001/XMLSchema#';
const KEYWORDS = new Set(['@base', '@container', '@context', '@direction', '@graph', '@id', '@import', '@included', '@index',
  '@json', '@language', '@list', '@nest', '@none', '@prefix', '@propagate', '@protected', '@reverse', '@set', '@type', '@value',
  '@version', '@vocab']);
const CONTAINERS = ['@graph', '@id', '@index', '@language', '@list', '@set', '@type'];
const TERM_KEYS = new Set(['@id', '@reverse', '@container', '@context', '@direction', '@index', '@language', '@nest', '@prefix', '@protected', '@type']);
const MAX_REMOTE = 32;

class JsonLdError extends Error {
  constructor(code, message = code) {
    super(message === code ? code : `${code}: ${message}`);
    this.code = code;
  }
}

const fail = (code, message) => { throw new JsonLdError(code, message); };
const isKeyword = (v) => KEYWORDS.has(v);
const keywordLike = (v) => typeof v === 'string' && /^@[A-Za-z]+$/.test(v);
const isMap = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const asArray = (v) => (Array.isArray(v) ? v : [v]);
const isScalar = (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
const absolute = (v) => typeof v === 'string' && /^[A-Za-z][A-Za-z0-9+.-]*:/.test(v);
const isBlank = (v) => typeof v === 'string' && v.startsWith('_:');
const isValue = (v) => isMap(v) && '@value' in v;
const isList = (v) => isMap(v) && '@list' in v;
const isGraph = (v) => isMap(v) && '@graph' in v && Object.keys(v).every((k) => k === '@graph' || k === '@id' || k === '@index');
const resolve = (ref, base) => (base == null ? ref : resolveIriRef(ref, base));
const sortedKeys = (map) => Object.keys(map).sort();

function newContext(base, mode) {
  return { base, originalBase: base, vocab: null, language: null, direction: null, terms: new Map(), previous: null, mode };
}
const cloneContext = (c) => ({ ...c, terms: new Map(c.terms) });

// Options: base, processingMode, expandContext, loadDocument(url) returning
// { document, documentUrl }.
export function jsonLdToRdf(input, options = {}) {
  const state = { options, contexts: new Map(), blanks: new Map(), counter: 0 };
  const document = typeof input === 'string' ? parseJson(input) : input;
  const base = options.base ?? null;
  let active = newContext(base, options.processingMode ?? 'json-ld-1.2');
  if (options.expandContext) {
    let ctx = options.expandContext;
    if (typeof ctx === 'string') ctx = load(state, resolve(ctx, base)).document;
    if (isMap(ctx) && '@context' in ctx) ctx = ctx['@context'];
    active = processContext(state, active, ctx, base);
  }
  let expanded = expand(state, active, null, document, base, false);
  if (isMap(expanded) && Object.keys(expanded).length === 1 && '@graph' in expanded) expanded = expanded['@graph'];
  expanded = expanded == null ? [] : asArray(expanded);
  const nodeMap = { '@default': {} };
  nodes(state, expanded, nodeMap, '@default');
  return toRdf(state, nodeMap, options);
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return fail('loading document failed', `the JSON is malformed: ${error.message}`);
  }
}

function load(state, url) {
  if (state.contexts.has(url)) return state.contexts.get(url);
  if (!state.options.loadDocument) fail('loading remote context failed', `${url} is not available; eyemind reads no remote documents`);
  let loaded;
  try {
    loaded = state.options.loadDocument(url);
  } catch (error) {
    return fail('loading remote context failed', `${url}: ${error.message}`);
  }
  const document = typeof loaded.document === 'string' ? (() => {
    try { return JSON.parse(loaded.document); } catch { return fail('loading remote context failed', `${url} is not JSON`); }
  })() : loaded.document;
  const result = { document, documentUrl: loaded.documentUrl ?? url };
  state.contexts.set(url, result);
  return result;
}

// 4.1.2 Context Processing.
function processContext(state, active, local, baseUrl, remote = [], overrideProtected = false, propagate = true, validate = true) {
  let result = cloneContext(active);
  if (isMap(local) && '@propagate' in local) {
    if (typeof local['@propagate'] !== 'boolean') fail('invalid @propagate value');
    propagate = local['@propagate'];
  }
  if (!propagate && !result.previous) result.previous = active;
  for (let context of asArray(local)) {
    if (context === null) {
      if (!overrideProtected && [...result.terms.values()].some((d) => d.protected)) fail('invalid context nullification');
      const previous = result;
      result = newContext(active.originalBase, active.mode);
      if (!propagate) result.previous = previous;
      continue;
    }
    if (typeof context === 'string') {
      const url = resolve(context, baseUrl);
      if (!validate && remote.includes(url)) continue;
      if (remote.includes(url)) fail('recursive context inclusion', url);
      if (remote.length > MAX_REMOTE) fail('context overflow');
      const loaded = load(state, url);
      if (!isMap(loaded.document) || !('@context' in loaded.document)) fail('invalid remote context', url);
      result = processContext(state, result, loaded.document['@context'], loaded.documentUrl, [...remote, url], overrideProtected, true, validate);
      continue;
    }
    if (!isMap(context)) fail('invalid local context');
    context = { ...context };
    if ('@version' in context) {
      if (context['@version'] !== 1.1 && context['@version'] !== 1.2) fail('invalid @version value');
      if (result.mode === 'json-ld-1.0') fail('processing mode conflict');
    }
    if ('@import' in context) {
      if (result.mode === 'json-ld-1.0') fail('invalid context entry', '@import');
      if (typeof context['@import'] !== 'string') fail('invalid @import value');
      const loaded = load(state, resolve(context['@import'], baseUrl));
      const imported = loaded.document?.['@context'];
      if (!isMap(imported)) fail('invalid remote context', '@import needs a context map');
      if ('@import' in imported) fail('invalid context entry', 'an imported context cannot import');
      context = { ...imported, ...context };
    }
    if ('@base' in context && remote.length === 0) {
      const value = context['@base'];
      if (value === null) result.base = null;
      else if (typeof value !== 'string') fail('invalid base IRI');
      else if (absolute(value)) result.base = value;
      else if (result.base != null) result.base = resolve(value, result.base);
      else fail('invalid base IRI', value);
    }
    if ('@vocab' in context) {
      const value = context['@vocab'];
      if (value === null) result.vocab = null;
      else if (typeof value !== 'string') fail('invalid vocab mapping');
      else if (absolute(value) || isBlank(value) || result.mode !== 'json-ld-1.0') {
        result.vocab = expandIri(state, result, value, true, true);
        if (!absolute(result.vocab) && !isBlank(result.vocab) && result.vocab !== '') fail('invalid vocab mapping', value);
      } else fail('invalid vocab mapping', value);
    }
    if ('@language' in context) {
      const value = context['@language'];
      if (value === null) result.language = null;
      else if (typeof value !== 'string') fail('invalid default language');
      else result.language = value.toLowerCase();
    }
    if ('@direction' in context) {
      if (result.mode === 'json-ld-1.0') fail('invalid context entry', '@direction');
      const value = context['@direction'];
      if (value === null) result.direction = null;
      else if (value !== 'ltr' && value !== 'rtl') fail('invalid base direction');
      else result.direction = value;
    }
    if ('@propagate' in context && result.mode === 'json-ld-1.0') fail('invalid context entry', '@propagate');
    const defined = new Map();
    const protectedDefault = context['@protected'] ?? false;
    for (const term of Object.keys(context)) {
      if (['@base', '@direction', '@import', '@language', '@propagate', '@protected', '@version', '@vocab'].includes(term)) continue;
      defineTerm(state, result, context, term, defined, baseUrl, protectedDefault, overrideProtected, remote, validate);
    }
  }
  return result;
}

// 4.2.2 Create Term Definition.
function defineTerm(state, active, local, term, defined, baseUrl, protectedDefault = false, overrideProtected = false, remote = [], validate = true) {
  if (defined.get(term) === true) return;
  if (defined.get(term) === false) fail('cyclic IRI mapping', term);
  if (term === '') fail('invalid term definition', 'the empty term');
  defined.set(term, false);
  let value = local[term];
  if (term === '@type' && active.mode !== 'json-ld-1.0' && isMap(value) &&
      Object.keys(value).length && Object.keys(value).every((k) => k === '@container' || k === '@protected') &&
      (!('@container' in value) || value['@container'] === '@set')) {
    // @type may be given a @set container and protection.
  } else if (isKeyword(term)) fail('keyword redefinition', term);
  else if (keywordLike(term)) { defined.set(term, true); return; }
  const previous = active.terms.get(term);
  active.terms.delete(term);
  let simple = false;
  if (value === null || typeof value === 'string') {
    simple = typeof value === 'string';
    value = { '@id': value };
  } else if (!isMap(value)) fail('invalid term definition', term);
  const definition = { prefix: false, protected: protectedDefault, reverse: false };
  if ('@protected' in value) {
    if (active.mode === 'json-ld-1.0') fail('invalid term definition', '@protected');
    if (typeof value['@protected'] !== 'boolean') fail('invalid @protected value');
    definition.protected = value['@protected'];
  }
  if ('@type' in value) {
    let type = value['@type'];
    if (typeof type !== 'string') fail('invalid type mapping', term);
    type = expandIri(state, active, type, false, true, local, defined);
    if ((type === '@json' || type === '@none') && active.mode === 'json-ld-1.0') fail('invalid type mapping', type);
    if (!['@id', '@vocab', '@json', '@none'].includes(type) && !absolute(type)) fail('invalid type mapping', type);
    definition.type = type;
  }
  if ('@reverse' in value) {
    if ('@id' in value || '@nest' in value) fail('invalid reverse property', term);
    if (typeof value['@reverse'] !== 'string') fail('invalid IRI mapping', term);
    if (keywordLike(value['@reverse'])) { defined.set(term, true); return; }
    definition.iri = expandIri(state, active, value['@reverse'], false, true, local, defined);
    if (!definition.iri || !definition.iri.includes(':')) fail('invalid IRI mapping', term);
    if ('@container' in value) {
      if (![null, '@set', '@index'].includes(value['@container'])) fail('invalid reverse property', term);
      if (value['@container'] !== null) definition.container = [value['@container']];
    }
    definition.reverse = true;
    // Since the 2023 erratum, the other entries of a reverse definition are
    // processed as those of any term definition.
  } else if ('@id' in value && value['@id'] !== term) {
    const id = value['@id'];
    if (id === null) definition.iri = null;
    else {
      if (typeof id !== 'string') fail('invalid IRI mapping', term);
      if (!isKeyword(id) && keywordLike(id)) { defined.set(term, true); return; }
      definition.iri = expandIri(state, active, id, false, true, local, defined);
      if (!isKeyword(definition.iri) && !absolute(definition.iri) && !isBlank(definition.iri)) fail('invalid IRI mapping', term);
      if (definition.iri === '@context') fail('invalid keyword alias', term);
      // JSON-LD 1.0 lets a term that looks like a compact IRI map elsewhere.
      if (active.mode !== 'json-ld-1.0' && (term.slice(1, -1).includes(':') || term.includes('/'))) {
        defined.set(term, true);
        if (expandIri(state, active, term, false, true, local, defined) !== definition.iri) fail('invalid IRI mapping', term);
      }
      if (!term.includes(':') && !term.includes('/') && simple && (/[:/?#[\]@]$/.test(definition.iri) || isBlank(definition.iri))) {
        definition.prefix = true;
      }
    }
  } else if (term.slice(1).includes(':')) {
    const colon = term.indexOf(':', 1);
    const prefix = term.slice(0, colon), suffix = term.slice(colon + 1);
    if (prefix in local) defineTerm(state, active, local, prefix, defined, baseUrl, protectedDefault, overrideProtected, remote, validate);
    const prefixDefinition = active.terms.get(prefix);
    definition.iri = prefixDefinition?.iri != null ? prefixDefinition.iri + suffix : term;
  } else if (term.includes('/')) {
    definition.iri = expandIri(state, active, term, false, true);
    if (!absolute(definition.iri)) fail('invalid IRI mapping', term);
  } else if (term === '@type') {
    definition.iri = '@type';
  } else {
    if (active.vocab == null) fail('invalid IRI mapping', `${term} needs a vocabulary mapping`);
    definition.iri = active.vocab + term;
  }
  if ('@container' in value && !definition.reverse) {
    const container = value['@container'];
    const items = asArray(container);
    if (!items.every((c) => CONTAINERS.includes(c))) fail('invalid container mapping', term);
    if (active.mode === 'json-ld-1.0' && (Array.isArray(container) || ['@graph', '@id', '@type'].includes(container))) fail('invalid container mapping', term);
    const set = new Set(items);
    const valid = items.length === 1 ||
      (set.has('@graph') && (set.has('@id') || set.has('@index')) && items.length <= 3 && [...set].every((c) => ['@graph', '@id', '@index', '@set'].includes(c)) && !(set.has('@id') && set.has('@index'))) ||
      (set.has('@set') && items.length === 2 && [...set].some((c) => ['@index', '@graph', '@id', '@type', '@language'].includes(c))) ||
      (set.has('@set') && set.has('@graph') && items.length === 2);
    if (!valid || set.has('@list') && items.length > 1) fail('invalid container mapping', term);
    definition.container = items;
    if (set.has('@type')) {
      if (definition.type === undefined) definition.type = '@id';
      if (!['@id', '@vocab'].includes(definition.type)) fail('invalid type mapping', term);
    }
  }
  if ('@index' in value) {
    if (active.mode === 'json-ld-1.0' || !definition.container?.includes('@index')) fail('invalid term definition', `${term} has @index without an index container`);
    const index = value['@index'];
    if (typeof index !== 'string' || isKeyword(expandIri(state, active, index, false, true))) fail('invalid term definition', `${term} has an invalid @index`);
    definition.index = index;
  }
  if ('@context' in value) {
    if (active.mode === 'json-ld-1.0') fail('invalid term definition', '@context');
    try {
      processContext(state, active, value['@context'], baseUrl, [...remote], true, true, false);
    } catch (error) {
      if (error instanceof JsonLdError) fail('invalid scoped context', `${term}: ${error.message}`);
      throw error;
    }
    definition.context = value['@context'];
    definition.baseUrl = baseUrl;
  }
  if ('@language' in value && !('@type' in value)) {
    const language = value['@language'];
    if (language !== null && typeof language !== 'string') fail('invalid language mapping', term);
    definition.language = language === null ? null : language.toLowerCase();
  }
  if ('@direction' in value && !('@type' in value)) {
    const direction = value['@direction'];
    if (direction !== null && direction !== 'ltr' && direction !== 'rtl') fail('invalid base direction', term);
    definition.direction = direction;
  }
  if ('@nest' in value) {
    if (active.mode === 'json-ld-1.0') fail('invalid term definition', '@nest');
    const nest = value['@nest'];
    if (typeof nest !== 'string' || (isKeyword(nest) && nest !== '@nest')) fail('invalid @nest value', term);
    definition.nest = nest;
  }
  if ('@prefix' in value) {
    if (active.mode === 'json-ld-1.0' || term.includes(':') || term.includes('/')) fail('invalid term definition', `${term} cannot have @prefix`);
    if (typeof value['@prefix'] !== 'boolean') fail('invalid @prefix value', term);
    definition.prefix = value['@prefix'];
    if (definition.prefix && isKeyword(definition.iri)) fail('invalid term definition', `${term} is a keyword alias`);
  }
  for (const key of Object.keys(value)) if (!TERM_KEYS.has(key)) fail('invalid term definition', `${term} has ${key}`);
  if (!overrideProtected && previous?.protected) {
    const same = (d) => JSON.stringify([d.iri, d.prefix, d.reverse, d.type, d.container, d.index, d.language, d.direction, d.nest, d.context]);
    if (same(previous) !== same(definition)) fail('protected term redefinition', term);
    active.terms.set(term, previous);
  } else active.terms.set(term, definition);
  defined.set(term, true);
}

// 5.2.2 IRI Expansion.
function expandIri(state, active, value, documentRelative = false, vocab = false, local = null, defined = null) {
  if (value === null || isKeyword(value)) return value;
  if (keywordLike(value)) return null;
  if (local && value in local && defined?.get(value) !== true) defineTerm(state, active, local, value, defined);
  const definition = active.terms.get(value);
  if (definition && isKeyword(definition.iri)) return definition.iri;
  if (vocab && active.terms.has(value)) return definition.iri ?? null;
  const colon = value.indexOf(':', 1);
  if (colon > 0) {
    const prefix = value.slice(0, colon), suffix = value.slice(colon + 1);
    if (prefix === '_' || suffix.startsWith('//')) return value;
    if (local && prefix in local && defined?.get(prefix) !== true) defineTerm(state, active, local, prefix, defined);
    const prefixDefinition = active.terms.get(prefix);
    // JSON-LD 1.0 has no prefix flag: any term is a prefix.
    if (prefixDefinition?.iri != null && (prefixDefinition.prefix || active.mode === 'json-ld-1.0')) return prefixDefinition.iri + suffix;
    if (absolute(value)) return value;
  }
  if (vocab && active.vocab != null) return active.vocab + value;
  if (documentRelative) return resolve(value, active.base);
  return value;
}

// 5.3.2 Value Expansion.
function expandValue(state, active, property, value) {
  const definition = active.terms.get(property);
  if (definition?.type === '@id' && typeof value === 'string') return { '@id': expandIri(state, active, value, true, false) };
  if (definition?.type === '@vocab' && typeof value === 'string') return { '@id': expandIri(state, active, value, true, true) };
  const result = { '@value': value };
  if (definition?.type !== undefined && !['@id', '@vocab', '@none'].includes(definition.type)) result['@type'] = definition.type;
  else if (typeof value === 'string') {
    const language = definition && 'language' in definition ? definition.language : active.language;
    const direction = definition && 'direction' in definition ? definition.direction : active.direction;
    if (language != null) result['@language'] = language;
    if (direction != null) result['@direction'] = direction;
  }
  return result;
}

// 5.1.2 Expansion.
function expand(state, active, property, element, baseUrl, fromMap) {
  if (element === null || element === undefined) return null;
  const definition = property === null ? undefined : active.terms.get(property);
  const scoped = definition && 'context' in definition ? definition : null;
  if (isScalar(element)) {
    if (property === null || property === '@graph') return null;
    if (scoped) active = processContext(state, active, scoped.context, scoped.baseUrl);
    return expandValue(state, active, property, element);
  }
  if (Array.isArray(element)) {
    const result = [];
    for (const item of element) {
      let expanded = expand(state, active, property, item, baseUrl, fromMap);
      const listed = definition?.container?.includes('@list');
      if (active.mode === 'json-ld-1.0' && listed && (Array.isArray(expanded) || isList(expanded))) fail('list of lists');
      if (listed && Array.isArray(expanded)) expanded = { '@list': expanded };
      if (Array.isArray(expanded)) result.push(...expanded);
      else if (expanded !== null) result.push(expanded);
    }
    return result;
  }
  if (!isMap(element)) return null;
  if (active.previous && !fromMap) {
    const keys = Object.keys(element).map((k) => expandIri(state, active, k, false, true));
    if (!keys.includes('@value') && !(keys.length === 1 && keys[0] === '@id')) active = active.previous;
  }
  if (scoped) active = processContext(state, active, scoped.context, scoped.baseUrl, [], true);
  if ('@context' in element) active = processContext(state, active, element['@context'], baseUrl);
  const typeScoped = active;
  let inputType = null;
  for (const key of sortedKeys(element)) {
    if (expandIri(state, active, key, false, true) !== '@type') continue;
    const types = asArray(element[key]).filter((t) => typeof t === 'string').sort();
    for (const type of types) {
      const typeDefinition = typeScoped.terms.get(type);
      if (typeDefinition && 'context' in typeDefinition) {
        active = processContext(state, active, typeDefinition.context, typeDefinition.baseUrl, [], false, false);
      }
    }
    if (types.length) inputType = expandIri(state, active, types.at(-1), false, true);
  }
  const result = {};
  // A key aliasing @nest applies its scoped context to what it nests.
  const nested = (keys, map, context) => {
    for (const key of keys) {
      const definition = context.terms.get(key);
      const inner = definition && 'context' in definition ? processContext(state, context, definition.context, definition.baseUrl, [], true) : context;
      for (const value of asArray(map[key] ?? [])) {
        if (!isMap(value) || Object.keys(value).some((k) => expandIri(state, inner, k, false, true) === '@value')) fail('invalid @nest value');
        const deeper = [];
        entries(state, inner, typeScoped, property, value, baseUrl, inputType, result, deeper);
        nested(deeper, value, inner);
      }
    }
  };
  const nests = [];
  entries(state, active, typeScoped, property, element, baseUrl, inputType, result, nests);
  nested(nests, element, active);
  // A node whose @id is ignored, such as an unknown keyword, is dropped.
  if (!('@id' in result) && Object.keys(element).some((k) => expandIri(state, active, k, false, true) === '@id')) return null;
  if ('@value' in result) {
    const keys = Object.keys(result);
    if (keys.some((k) => !['@direction', '@index', '@language', '@type', '@value'].includes(k))) fail('invalid value object');
    if ('@type' in result && ('@language' in result || '@direction' in result)) fail('invalid value object');
    if (result['@type'] === '@json') return result;
    if (result['@value'] === null) return null;
    if ('@language' in result && typeof result['@value'] !== 'string') fail('invalid language-tagged value');
    if ('@type' in result && (typeof result['@type'] !== 'string' || !absolute(result['@type']) || /\s/.test(result['@type']))) fail('invalid typed value');
    if (!isScalar(result['@value'])) fail('invalid value object value');
    return dropTop(result, property);
  }
  if ('@type' in result && !Array.isArray(result['@type'])) result['@type'] = [result['@type']];
  if ('@set' in result || '@list' in result) {
    if (Object.keys(result).some((k) => k !== '@set' && k !== '@list' && k !== '@index')) fail('invalid set or list object');
    if ('@set' in result) return result['@set'];
  }
  if (Object.keys(result).length === 1 && '@language' in result) return null;
  return dropTop(result, property);
}

function dropTop(result, property) {
  if (property !== null && property !== '@graph') return result;
  const keys = Object.keys(result);
  if (keys.length === 0 || '@value' in result || '@list' in result) return null;
  if (keys.length === 1 && keys[0] === '@id') return null;
  return result;
}

// Step 13 of expansion: the entries of a map, and of the maps it nests.
function entries(state, active, typeScoped, property, element, baseUrl, inputType, result, nests) {
  for (const key of sortedKeys(element)) {
    const value = element[key];
    if (key === '@context') continue;
    const expandedProperty = expandIri(state, active, key, false, true);
    if (expandedProperty === null || (!expandedProperty.includes(':') && !isKeyword(expandedProperty))) continue;
    if (isKeyword(expandedProperty)) {
      if (property === '@reverse') fail('invalid reverse property map');
      if (expandedProperty in result && !(active.mode !== 'json-ld-1.0' && ['@included', '@type'].includes(expandedProperty))) fail('colliding keywords', expandedProperty);
      let expanded;
      switch (expandedProperty) {
        case '@id':
          if (typeof value !== 'string') fail('invalid @id value');
          expanded = expandIri(state, active, value, true, false);
          break;
        case '@type':
          if (!(typeof value === 'string' || (Array.isArray(value) && value.every((v) => typeof v === 'string')))) fail('invalid type value');
          expanded = asArray(value).map((v) => expandIri(state, typeScoped, v, true, true));
          if (!Array.isArray(value)) expanded = expanded[0];
          if ('@type' in result) expanded = [...asArray(result['@type']), ...asArray(expanded)];
          break;
        case '@graph':
          expanded = asArray(expand(state, active, '@graph', value, baseUrl, false) ?? []);
          break;
        case '@included': {
          if (active.mode === 'json-ld-1.0') continue;
          if (!asArray(value).every((v) => isMap(v) && !Object.keys(v).some((k) => ['@value', '@list'].includes(expandIri(state, active, k, false, true))))) {
            fail('invalid @included value');
          }
          expanded = asArray(expand(state, active, null, value, baseUrl, false) ?? []);
          if (!expanded.every((v) => isMap(v) && !isValue(v) && !isList(v) && !('@set' in v))) fail('invalid @included value');
          if ('@included' in result) expanded = [...result['@included'], ...expanded];
          break;
        }
        case '@value':
          if (inputType === '@json') {
            if (active.mode === 'json-ld-1.0') fail('invalid value object value');
            expanded = value;
          } else if (value !== null && !isScalar(value)) fail('invalid value object value');
          else expanded = value;
          result['@value'] = expanded;
          continue;
        case '@language':
          if (typeof value !== 'string') fail('invalid language-tagged string');
          expanded = value.toLowerCase();
          break;
        case '@direction':
          if (active.mode === 'json-ld-1.0') continue;
          if (value !== 'ltr' && value !== 'rtl') fail('invalid base direction');
          expanded = value;
          break;
        case '@index':
          if (typeof value !== 'string') fail('invalid @index value');
          expanded = value;
          break;
        case '@list':
          if (property === null || property === '@graph') continue;
          expanded = asArray(expand(state, active, property, value, baseUrl, false) ?? []);
          if (active.mode === 'json-ld-1.0' && expanded.some(isList)) fail('list of lists');
          break;
        case '@set':
          expanded = expand(state, active, property, value, baseUrl, false);
          break;
        case '@reverse': {
          if (!isMap(value)) fail('invalid @reverse value');
          const inner = expand(state, active, '@reverse', value, baseUrl, false) ?? {};
          if ('@reverse' in inner) for (const [p, items] of Object.entries(inner['@reverse'])) result[p] = [...(result[p] ?? []), ...asArray(items)];
          const reverse = result['@reverse'] ?? {};
          for (const [p, items] of Object.entries(inner)) {
            if (p === '@reverse') continue;
            for (const item of asArray(items)) {
              if (isValue(item) || isList(item)) fail('invalid reverse property value');
              (reverse[p] ??= []).push(item);
            }
          }
          if (Object.keys(reverse).length) result['@reverse'] = reverse;
          continue;
        }
        case '@nest':
          nests.push(key);
          continue;
        default:
          continue;
      }
      if (expanded !== null && expanded !== undefined) result[expandedProperty] = expanded;
      continue;
    }
    const definition = active.terms.get(key);
    const container = definition?.container ?? [];
    let expanded;
    if (definition?.type === '@json') {
      expanded = { '@value': value, '@type': '@json' };
    } else if (container.includes('@language') && isMap(value)) {
      expanded = [];
      const direction = definition && 'direction' in definition ? definition.direction : active.direction;
      for (const language of sortedKeys(value)) {
        for (const item of asArray(value[language])) {
          if (item === null) continue;
          if (typeof item !== 'string') fail('invalid language map value');
          const v = { '@value': item };
          if (expandIri(state, active, language, false, true) !== '@none') v['@language'] = language.toLowerCase();
          if (direction != null) v['@direction'] = direction;
          expanded.push(v);
        }
      }
    } else if ((container.includes('@index') || container.includes('@type') || container.includes('@id')) && isMap(value)) {
      expanded = [];
      const indexKey = definition.index ?? '@index';
      for (const index of sortedKeys(value)) {
        let mapContext = (container.includes('@id') || container.includes('@type')) && active.previous ? active.previous : active;
        const indexDefinition = active.terms.get(index);
        if (container.includes('@type') && indexDefinition && 'context' in indexDefinition) {
          mapContext = processContext(state, mapContext, indexDefinition.context, indexDefinition.baseUrl);
        }
        const expandedIndex = expandIri(state, active, index, false, true);
        const items = asArray(expand(state, mapContext, key, asArray(value[index]), baseUrl, true) ?? []);
        for (let item of items) {
          if (container.includes('@graph') && !isGraph(item)) item = { '@graph': asArray(item) };
          if (container.includes('@index') && indexKey !== '@index' && expandedIndex !== '@none') {
            const reExpanded = expandValue(state, active, indexKey, index);
            const property = expandIri(state, active, indexKey, false, true);
            if (isValue(item)) fail('invalid value object', 'a property-valued index needs a node');
            item[property] = [reExpanded, ...asArray(item[property] ?? [])];
          } else if (container.includes('@index') && !('@index' in item) && expandedIndex !== '@none') {
            item['@index'] = index;
          } else if (container.includes('@id') && !('@id' in item) && expandedIndex !== '@none') {
            item['@id'] = expandIri(state, active, index, true, false);
          } else if (container.includes('@type') && expandedIndex !== '@none') {
            item['@type'] = [expandedIndex, ...asArray(item['@type'] ?? [])];
          }
          expanded.push(item);
        }
      }
    } else {
      expanded = expand(state, active, key, value, baseUrl, false);
    }
    if (expanded === null || expanded === undefined) continue;
    if (container.includes('@list') && !isList(expanded)) expanded = { '@list': asArray(expanded) };
    if (container.includes('@graph') && !container.includes('@id') && !container.includes('@index')) {
      expanded = asArray(expanded).map((v) => ({ '@graph': asArray(v) }));
    }
    if (definition?.reverse) {
      const reverse = result['@reverse'] ??= {};
      for (const item of asArray(expanded)) {
        if (isValue(item) || isList(item)) fail('invalid reverse property value');
        (reverse[expandedProperty] ??= []).push(item);
      }
    } else {
      result[expandedProperty] = [...(result[expandedProperty] ?? []), ...asArray(expanded)];
    }
  }
}

function blank(state, id) {
  if (id != null && state.blanks.has(id)) return state.blanks.get(id);
  const label = `_:b${state.counter++}`;
  if (id != null) state.blanks.set(id, label);
  return label;
}

// 7.2.2 Node Map Generation.
function nodes(state, element, map, graphName, subject = null, property = null, list = null) {
  if (Array.isArray(element)) {
    for (const item of element) nodes(state, item, map, graphName, subject, property, list);
    return;
  }
  const graph = map[graphName] ??= {};
  const subjectNode = typeof subject === 'string' ? graph[subject] : null;
  if (Array.isArray(element['@type'])) element['@type'] = element['@type'].map((t) => (isBlank(t) ? blank(state, t) : t));
  if ('@value' in element) {
    if (list === null) {
      const values = subjectNode[property] ??= [];
      if (!values.some((v) => JSON.stringify(v) === JSON.stringify(element))) values.push(element);
    } else list['@list'].push(element);
    return;
  }
  if ('@list' in element) {
    const result = { '@list': [] };
    nodes(state, element['@list'], map, graphName, subject, property, result);
    if (list === null) (subjectNode[property] ??= []).push(result);
    else list['@list'].push(result);
    return;
  }
  let id = element['@id'];
  if (id === undefined || id === null) id = blank(state, null);
  else if (isBlank(id)) id = blank(state, id);
  const node = graph[id] ??= { '@id': id };
  if (isMap(subject)) {
    const values = node[property] ??= [];
    if (!values.some((v) => v['@id'] === subject['@id'])) values.push(subject);
  } else if (property !== null) {
    const reference = { '@id': id };
    if (list === null) {
      const values = subjectNode[property] ??= [];
      if (!values.some((v) => v['@id'] === id)) values.push(reference);
    } else list['@list'].push(reference);
  }
  if ('@type' in element) node['@type'] = [...new Set([...(node['@type'] ?? []), ...element['@type']])];
  if ('@index' in element) {
    if ('@index' in node && node['@index'] !== element['@index']) fail('conflicting indexes');
    node['@index'] = element['@index'];
  }
  if ('@reverse' in element) {
    const referenced = { '@id': id };
    for (const [p, values] of Object.entries(element['@reverse'])) for (const value of values) nodes(state, value, map, graphName, referenced, p);
  }
  if ('@graph' in element) nodes(state, element['@graph'], map, id);
  if ('@included' in element) nodes(state, element['@included'], map, graphName);
  for (const p of sortedKeys(element)) {
    if (['@id', '@type', '@index', '@reverse', '@graph', '@included'].includes(p)) continue;
    const name = isBlank(p) ? blank(state, p) : p;
    node[name] ??= [];
    nodes(state, element[p], map, graphName, id, name);
  }
}

const wellFormed = (v) => typeof v === 'string' && (isBlank(v) || (absolute(v) && !/[\s<>"{}|\\^`]/.test(v) && !/#.*#/.test(v)));
const wellFormedLanguage = (v) => /^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*$/.test(v);

// 8.1.2 Deserialize JSON-LD to RDF: [subject, predicate, object, graph] as
// { termType, value, datatype?, language?, direction? } objects.
function toRdf(state, map, { rdfDirection = null, produceGeneralizedRdf = false }) {
  const quads = [];
  const term = (v) => (isBlank(v) ? { termType: 'blank', value: v.slice(2) } : { termType: 'iri', value: v });
  for (const graphName of sortedKeys(map)) {
    if (graphName !== '@default' && !wellFormed(graphName)) continue;
    const graph = graphName === '@default' ? null : term(graphName);
    for (const subject of sortedKeys(map[graphName])) {
      if (!wellFormed(subject)) continue;
      const node = map[graphName][subject];
      for (const property of sortedKeys(node)) {
        if (property === '@type') {
          for (const type of node['@type']) if (wellFormed(type)) quads.push([term(subject), term(`${RDF}type`), term(type), graph]);
          continue;
        }
        if (isKeyword(property)) continue;
        if (isBlank(property) && !produceGeneralizedRdf) continue;
        if (!wellFormed(property)) continue;
        for (const item of node[property]) {
          const extra = [];
          const object = objectToRdf(state, item, extra, rdfDirection, term);
          if (object !== null) quads.push([term(subject), term(property), object, graph]);
          for (const [s, p, o] of extra) quads.push([s, p, o, graph]);
        }
      }
    }
  }
  return quads;
}

// 8.2.2 Object to RDF Conversion, and 8.3 List Conversion.
function objectToRdf(state, item, extra, rdfDirection, term) {
  if (!isValue(item) && !isList(item)) return wellFormed(item['@id']) ? term(item['@id']) : null;
  if (isList(item)) {
    const items = item['@list'];
    if (!items.length) return term(`${RDF}nil`);
    const cells = items.map(() => blank(state, null));
    items.forEach((value, i) => {
      const object = objectToRdf(state, value, extra, rdfDirection, term);
      if (object !== null) extra.push([term(cells[i]), term(`${RDF}first`), object]);
      extra.push([term(cells[i]), term(`${RDF}rest`), term(cells[i + 1] ?? `${RDF}nil`)]);
    });
    return term(cells[0]);
  }
  let value = item['@value'];
  let datatype = item['@type'] ?? null;
  if (datatype !== null && datatype !== '@json' && !wellFormed(datatype)) return null;
  if ('@language' in item && !wellFormedLanguage(item['@language'])) return null;
  if (datatype === '@json') {
    value = canonicalJson(value);
    datatype = `${RDF}JSON`;
  } else if (typeof value === 'boolean') {
    value = String(value);
    datatype ??= `${XSD}boolean`;
  } else if (typeof value === 'number' && (!Number.isInteger(value) || Math.abs(value) >= 1e21 || datatype === `${XSD}double`)) {
    value = canonicalDouble(value);
    datatype ??= `${XSD}double`;
  } else if (typeof value === 'number') {
    value = BigInt(value).toString();
    datatype ??= `${XSD}integer`;
  } else if (datatype === null) {
    datatype = '@language' in item ? `${RDF}langString` : `${XSD}string`;
  }
  if ('@direction' in item && rdfDirection !== null) {
    const language = (item['@language'] ?? '').toLowerCase();
    if (rdfDirection === 'i18n-datatype') {
      return { termType: 'literal', value, datatype: `https://www.w3.org/ns/i18n#${language}_${item['@direction']}` };
    }
    if (rdfDirection === 'compound-literal') {
      const node = term(blank(state, null));
      extra.push([node, term(`${RDF}value`), { termType: 'literal', value, datatype: `${XSD}string` }]);
      if ('@language' in item) extra.push([node, term(`${RDF}language`), { termType: 'literal', value: language, datatype: `${XSD}string` }]);
      extra.push([node, term(`${RDF}direction`), { termType: 'literal', value: item['@direction'], datatype: `${XSD}string` }]);
      return node;
    }
  }
  if ('@language' in item) return { termType: 'literal', value, language: item['@language'].toLowerCase() };
  return { termType: 'literal', value, datatype };
}

// XSD's canonical double: one digit before the point, at least one after.
function canonicalDouble(n) {
  if (Number.isNaN(n)) return 'NaN';
  if (!Number.isFinite(n)) return n > 0 ? 'INF' : '-INF';
  let [mantissa, exponent] = n.toExponential().split('e');
  if (!mantissa.includes('.')) mantissa += '.0';
  return `${mantissa}E${Number(exponent)}`;
}

// The JSON Canonicalization Scheme (RFC 8785): sorted keys, ES numbers.
function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (isMap(value)) return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}

// 8.4 Serialize RDF as JSON-LD: [subject, predicate, object, graph] quads of
// { termType, value, datatype?, language?, direction? } terms, graph null for
// the default one, to expanded JSON-LD, with each named graph nested in its
// node. Options: useNativeTypes, useRdfType, rdfDirection, processingMode.
export function rdfToJsonLd(quads, { useNativeTypes = false, useRdfType = false, rdfDirection = null, processingMode = 'json-ld-1.2' } = {}) {
  const id = (t) => (t.termType === 'blank' ? `_:${t.value}` : t.value);
  const graphs = new Map([['@default', new Map()]]);
  const once = new Map(), compound = new Map(), nil = new Map();
  for (const [s, p, o, g] of quads) {
    if (s.termType === 'triple' || o.termType === 'triple') fail('invalid RDF term', 'JSON-LD has no triple terms');
    const name = g ? id(g) : '@default';
    if (!graphs.has(name)) graphs.set(name, new Map());
    if (name !== '@default' && !graphs.get('@default').has(name)) graphs.get('@default').set(name, { '@id': name });
    const nodes = graphs.get(name);
    const subject = id(s);
    if (!nodes.has(subject)) nodes.set(subject, { '@id': subject });
    const node = nodes.get(subject);
    if (rdfDirection === 'compound-literal' && p.value === `${RDF}direction`) {
      if (!compound.has(name)) compound.set(name, new Set());
      compound.get(name).add(subject);
    }
    if (o.termType !== 'literal' && !nodes.has(id(o))) nodes.set(id(o), { '@id': id(o) });
    if (p.value === `${RDF}type` && !useRdfType && o.termType !== 'literal') {
      const types = node['@type'] ??= [];
      if (!types.includes(id(o))) types.push(id(o));
      continue;
    }
    const value = rdfToObject(o, { useNativeTypes, rdfDirection, processingMode, id });
    const values = node[p.value] ??= [];
    // A duplicate triple adds no value, and no second reference.
    if (values.some((v) => JSON.stringify(v) === JSON.stringify(value))) continue;
    values.push(value);
    if (o.termType === 'iri' && o.value === `${RDF}nil`) {
      if (!nil.has(name)) nil.set(name, []);
      nil.get(name).push({ node, property: p.value, value });
    } else if (o.termType !== 'literal') {
      // A blank node referenced from more than one place, in any graph, is
      // no list cell.
      if (once.has(id(o))) once.set(id(o), false);
      else if (o.termType === 'blank') once.set(id(o), { node, property: p.value, value });
    }
  }
  for (const [name, nodes] of graphs) {
    // Compound literals become value objects with a language and direction.
    for (const subject of compound.get(name) ?? []) {
      const usage = once.get(subject);
      if (!usage) continue;
      const literal = nodes.get(subject);
      nodes.delete(subject);
      for (const reference of usage.node[usage.property]) {
        if (reference['@id'] !== subject) continue;
        delete reference['@id'];
        reference['@value'] = literal[`${RDF}value`]?.[0]?.['@value'];
        const language = literal[`${RDF}language`]?.[0]?.['@value'];
        if (language !== undefined) {
          if (!wellFormedLanguage(language)) fail('invalid language-tagged string', language);
          reference['@language'] = language;
        }
        const direction = literal[`${RDF}direction`]?.[0]?.['@value'];
        if (direction !== undefined) {
          if (direction !== 'ltr' && direction !== 'rtl') fail('invalid base direction', direction);
          reference['@direction'] = direction;
        }
      }
    }
    // Well-formed rdf:first and rdf:rest chains of blank nodes become lists.
    for (const usage of nil.get(name) ?? []) {
      let { node, property, value: head } = usage;
      const list = [], cells = [];
      while (property === `${RDF}rest` && isBlank(node['@id'])) {
        const listed = once.get(node['@id']);
        const keys = Object.keys(node);
        const first = node[`${RDF}first`], rest = node[`${RDF}rest`];
        if (!isMap(listed) || first?.length !== 1 || rest?.length !== 1 ||
            !keys.every((k) => ['@id', `${RDF}first`, `${RDF}rest`, '@type'].includes(k)) ||
            ('@type' in node && !(node['@type'].length === 1 && node['@type'][0] === `${RDF}List`))) break;
        list.push(first[0]);
        cells.push(node['@id']);
        ({ node, property, value: head } = listed);
        if (!isBlank(node['@id'])) break;
      }
      // JSON-LD 1.0 keeps the head of a list that is an item of another list.
      if (processingMode === 'json-ld-1.0' && property === `${RDF}first`) {
        if (node['@id'] === `${RDF}nil`) continue;
        head = nodes.get(head['@id'])[`${RDF}rest`][0];
        list.pop();
        cells.pop();
      }
      delete head['@id'];
      head['@list'] = list.reverse();
      for (const cell of cells) nodes.delete(cell);
    }
  }
  const result = [];
  const sorted = (map) => [...map.keys()].sort();
  const defaults = graphs.get('@default');
  for (const subject of sorted(defaults)) {
    const node = defaults.get(subject);
    if (graphs.has(subject) && subject !== '@default') {
      const inner = graphs.get(subject);
      node['@graph'] = sorted(inner).map((s) => inner.get(s)).filter((n) => Object.keys(n).length > 1);
    }
    if (Object.keys(node).length > 1) result.push(node);
  }
  return result;
}

// 8.5 RDF to Object Conversion.
function rdfToObject(o, { useNativeTypes, rdfDirection, processingMode, id }) {
  if (o.termType !== 'literal') return { '@id': id(o) };
  const result = {};
  let value = o.value, type = null;
  const datatype = o.datatype ?? (o.language ? `${RDF}langString` : `${XSD}string`);
  if (useNativeTypes && datatype === `${XSD}string` && !o.language) {
    // A plain string is a JSON string.
  } else if (useNativeTypes && datatype === `${XSD}boolean` && ['true', 'false', '1', '0'].includes(value)) {
    value = value === 'true' || value === '1';
  } else if (useNativeTypes && datatype === `${XSD}integer` && /^[+-]?[0-9]+$/.test(value) && Number.isSafeInteger(Number(value))) {
    value = Number(value);
  } else if (useNativeTypes && datatype === `${XSD}double` && /^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/.test(value) &&
      Number.isFinite(Number(value))) {
    value = Number(value);
  } else if (processingMode !== 'json-ld-1.0' && datatype === `${RDF}JSON`) {
    try {
      value = JSON.parse(value);
    } catch {
      fail('invalid JSON literal', o.value);
    }
    type = '@json';
  } else if (rdfDirection === 'i18n-datatype' && datatype.startsWith('https://www.w3.org/ns/i18n#')) {
    const [language, direction] = datatype.slice('https://www.w3.org/ns/i18n#'.length).split('_');
    if (language) result['@language'] = language;
    if (direction) result['@direction'] = direction;
  } else if (o.language) {
    result['@language'] = o.language;
    if (o.direction) result['@direction'] = o.direction;
  } else if (datatype !== `${XSD}string`) {
    type = datatype;
  }
  result['@value'] = value;
  if (type !== null) result['@type'] = type;
  return result;
}
