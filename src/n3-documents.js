// The documents log:semantics, log:semanticsOrError and log:content read.
//
// eyemind reads no files and no network while it reasons, so the documents
// a program names are read before compiling: every IRI written as the
// subject of one of those built-ins. The compiled program states each one's
// text, formula or error as facts, and reasoning stays a function of them.
// The host supplies file access and, optionally, HTTP document access.
import { LOG } from './n3-parser.js';

export const DOCUMENT_PREDICATES = new Set([`${LOG}semantics`, `${LOG}semanticsOrError`, `${LOG}content`]);

// The IRIs a document's triples name as documents to read: the subject of
// such a built-in, and, when a rule finds that subject with a pattern whose
// predicate is an IRI, as in { :doc :source ?d. ?d log:semantics ?f }, each
// IRI the document's facts state at that place.
export function documentIris(triples, found = new Set()) {
  named(triples, found);
  const places = [];
  for (const x of triples) {
    if (!(x.s.t === 'graph' && x.p.t === 'iri' && (x.p.v === `${LOG}implies` || x.p.v === `${LOG}impliedBy` || x.p.v === `${LOG}query`))) continue;
    const body = x.p.v === `${LOG}impliedBy` ? x.o : x.s;
    if (body.t !== 'graph') continue;
    for (const b of body.triples) {
      if (!(b.p.t === 'iri' && DOCUMENT_PREDICATES.has(b.p.v) && b.s.t === 'var')) continue;
      for (const pattern of body.triples) {
        if (pattern === b || pattern.p.t !== 'iri') continue;
        if (pattern.o.t === 'var' && pattern.o.v === b.s.v) places.push([pattern.p.v, 'o']);
        if (pattern.s.t === 'var' && pattern.s.v === b.s.v) places.push([pattern.p.v, 's']);
      }
    }
  }
  for (const [predicate, position] of places) {
    for (const x of triples) if (x.p.t === 'iri' && x.p.v === predicate && x[position].t === 'iri') found.add(x[position].v);
  }
  return found;
}

function named(triples, found) {
  const term = (t) => {
    if (t.t === 'graph') named(t.triples, found);
    else if (t.t === 'list') t.items.forEach(term);
  };
  for (const x of triples) {
    if (x.p.t === 'iri' && DOCUMENT_PREDICATES.has(x.p.v) && x.s.t === 'iri') found.add(x.s.v);
    term(x.s);
    term(x.o);
  }
  return found;
}

// Read the documents: a Map from IRI to { text } or { error }. readFile
// reads a local path, readDocument an HTTP(S) IRI; a missing reader or a
// failed read becomes a dereference error for log:semanticsOrError.
export function readDocuments(iris, readFile = null, readDocument = null) {
  const documents = new Map();
  const locations = new Map();
  for (const iri of iris) {
    const location = iri.replace(/#.*$/, '');
    if (locations.has(location)) {
      documents.set(iri, locations.get(location));
      continue;
    }
    try {
      let text;
      if (location.startsWith('file:') && readFile) text = readFile(decodeURIComponent(new URL(location).pathname));
      else if (/^https?:/.test(location) && readDocument) text = readDocument(location);
      else throw new Error('no reader for this document');
      documents.set(iri, { text });
    } catch (error) {
      documents.set(iri, { error: `${location}: ${error.message}` });
    }
    locations.set(location, documents.get(iri));
  }
  return documents;
}
