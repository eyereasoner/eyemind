/**
 * eyemind: RDF parser
 *
 * Parser for the supported N3 syntax. Turns tokens into the internal term and
 * formula representation used by the engine.
 */


import {
  RDF_NS,
  resolveIriRef,
  Literal,
  Blank,
  ListTerm,
  GraphTerm,
  Triple,
  internIri,
  internLiteral,
  PrefixEnv,
} from './rdf-prelude.js';

import { N3SyntaxError } from './rdf-lexer.js';

function assertValidQNamePrefix(prefixName, fail, tok, context = 'prefixed name') {
  if (typeof prefixName === 'string' && prefixName.endsWith('.')) {
    fail(`Invalid ${context}: prefix names cannot end with '.'`, tok);
  }
}

function failInvalidKeywordLikeIdent(fail, tok, name) {
  fail(`invalid_keyword(${name})`, tok);
}

function annotateSourceOffset(obj, offset) {
  if (!obj || typeof offset !== 'number') return obj;
  Object.defineProperty(obj, '__sourceOffset', {
    value: offset,
    enumerable: false,
    writable: false,
    configurable: true,
  });
  return obj;
}

class Parser {
  constructor(tokens, options = {}) {
    this.toks = tokens;
    this.pos = 0;
    // RDF declares every prefix it uses; none is predeclared.
    this.prefixes = new PrefixEnv();
    this.blankCounter = 0;
    // Helper triples that must be emitted *before* the triple that consumes them.
    // Used primarily for N3 path expansion (e.g. :a :p/:q :b .).
    this.pendingTriples = [];

    // Helper triples that should be emitted *after* the triple that references
    // the described term (used for [...] blank-node / IRI property lists). This
    // makes derived output read naturally, e.g. ':s :p _:b.' preceding
    // '_:b :q :r.'
    this.pendingTriplesAfter = [];
    this.trackSourceOffsets = !!(options && options.sourceOffsets);
  }

  peek() {
    return this.toks[this.pos];
  }

  next() {
    const tok = this.toks[this.pos];
    this.pos += 1;
    return tok;
  }

  annotateSourceOffset(obj, offset) {
    return this.trackSourceOffsets ? annotateSourceOffset(obj, offset) : obj;
  }

  fail(message, tok = this.peek()) {
    const off = tok && typeof tok.offset === 'number' ? tok.offset : null;
    throw new N3SyntaxError(message, off);
  }

  expectDot() {
    const tok = this.next();
    if (tok.typ !== 'Dot') {
      this.fail(`Expected '.', got ${tok.toString()}`, tok);
    }
  }

  peekAt(offset) {
    return this.toks[this.pos + offset];
  }

  isIdentKeyword(tok, keyword) {
    if (!tok || tok.typ !== 'Ident' || typeof tok.value !== 'string') return false;
    const v = tok.value;
    if (v.length !== keyword.length) return false;
    for (let i = 0; i < keyword.length; i++) {
      const code = v.charCodeAt(i);
      const lower = code >= 65 && code <= 90 ? code + 32 : code;
      if (lower !== keyword.charCodeAt(i)) return false;
    }
    return true;
  }

  canStartSparqlPrefixDirective() {
    const prefixNameTok = this.peekAt(1);
    const iriTok = this.peekAt(2);
    return (
      this.isIdentKeyword(this.peek(), 'prefix') &&
      prefixNameTok &&
      prefixNameTok.typ === 'Ident' &&
      typeof prefixNameTok.value === 'string' &&
      prefixNameTok.value.endsWith(':') &&
      iriTok &&
      (iriTok.typ === 'IriRef' || iriTok.typ === 'Ident')
    );
  }

  canStartSparqlBaseDirective(allowIdentIri = false) {
    const iriTok = this.peekAt(1);
    return (
      this.isIdentKeyword(this.peek(), 'base') &&
      iriTok &&
      (iriTok.typ === 'IriRef' || (allowIdentIri && iriTok.typ === 'Ident'))
    );
  }

  parseDirectiveIfPresent({ allowIdentBaseIri = false } = {}) {
    if (this.peek().typ === 'AtPrefix') {
      this.next();
      this.parsePrefixDirective();
      return true;
    }
    if (this.peek().typ === 'AtBase') {
      this.next();
      this.parseBaseDirective();
      return true;
    }
    if (this.canStartSparqlPrefixDirective()) {
      this.next();
      this.parseSparqlPrefixDirective();
      return true;
    }
    if (this.canStartSparqlBaseDirective(allowIdentBaseIri)) {
      this.next();
      this.parseSparqlBaseDirective();
      return true;
    }
    return false;
  }

  flushPendingTriples(out, { includeBefore = true, includeAfter = true } = {}) {
    if (includeBefore && this.pendingTriples.length > 0) {
      out.push(...this.pendingTriples);
      this.pendingTriples = [];
    }
    if (includeAfter && this.pendingTriplesAfter.length > 0) {
      out.push(...this.pendingTriplesAfter);
      this.pendingTriplesAfter = [];
    }
  }

  parseDocument() {
    const triples = [];

    while (this.peek().typ !== 'EOF') {
      if (this.parseDirectiveIfPresent({ allowIdentBaseIri: true })) {
        continue;
      }

      const statementToken = this.peek();
      const statementOffset = statementToken && typeof statementToken.offset === 'number' ? statementToken.offset : null;
      const first = this.parseTerm();
      let more;
      if (this.peek().typ === 'Dot') {
        // A bare subject followed by '.' contributes only the triples of its
        // reified triples or blank node property lists, if any.
        more = [];
        this.flushPendingTriples(more);
        this.next(); // consume '.'
      } else {
        more = this.parsePredicateObjectList(first);
        this.expectDot();
      }
      for (const triple of more) triples.push(this.annotateSourceOffset(triple, statementOffset));
    }

    return [this.prefixes, triples];
  }

  parsePrefixDirective() {
    const tok = this.next();
    if (tok.typ !== 'Ident') {
      this.fail(`Expected prefix name, got ${tok.toString()}`, tok);
    }
    const pref = tok.value || '';
    if (!pref.endsWith(':')) {
      this.fail("Invalid @prefix directive: prefix name must end with ':'", tok);
    }
    const prefName = pref.endsWith(':') ? pref.slice(0, -1) : pref;
    assertValidQNamePrefix(prefName, this.fail.bind(this), tok, '@prefix directive');

    if (this.peek().typ === 'Dot') {
      this.next();
      if (!Object.prototype.hasOwnProperty.call(this.prefixes.map, prefName)) {
        this.prefixes.set(prefName, '');
      }
      return;
    }

    const tok2 = this.next();
    const iri = this.directiveIri(tok2, '@prefix', '@prefix directive IRI');
    this.expectDot();
    this.prefixes.set(prefName, iri);
  }

  parseBaseDirective() {
    const tok = this.next();
    const iri = this.directiveIri(tok, '@base', '@base directive IRI');
    this.expectDot();
    this.prefixes.setBase(iri);
  }

  parseSparqlPrefixDirective() {
    // SPARQL/Turtle-style PREFIX directive: PREFIX pfx: <iri>  (no trailing '.')
    const tok = this.next();
    if (tok.typ !== 'Ident') {
      this.fail(`Expected prefix name after PREFIX, got ${tok.toString()}`, tok);
    }
    const pref = tok.value || '';
    if (!pref.endsWith(':')) {
      this.fail("Invalid PREFIX directive: prefix name must end with ':'", tok);
    }
    const prefName = pref.endsWith(':') ? pref.slice(0, -1) : pref;
    assertValidQNamePrefix(prefName, this.fail.bind(this), tok, 'PREFIX directive');

    const tok2 = this.next();
    const iri = this.directiveIri(tok2, 'PREFIX', '@prefix directive IRI');

    // N3/Turtle: PREFIX directives do not have a trailing '.', but accept it permissively.
    if (this.peek().typ === 'Dot') this.next();

    this.prefixes.set(prefName, iri);
  }

  parseSparqlBaseDirective() {
    // SPARQL/Turtle-style BASE directive: BASE <iri>  (no trailing '.')
    const tok = this.next();
    const iri = this.directiveIri(tok, 'BASE', 'BASE directive IRI');

    // N3/Turtle: BASE directives do not have a trailing '.', but accept it permissively.
    if (this.peek().typ === 'Dot') this.next();

    this.prefixes.setBase(iri);
  }

  // A directive's IRI: an IRI reference, resolved against the base, or a
  // prefixed name.
  directiveIri(tok, after, context) {
    if (tok.typ === 'IriRef') return resolveIriRef(tok.value || '', this.prefixes.baseIri || '');
    if (tok.typ !== 'Ident') this.fail(`Expected IRI after ${after}, got ${tok.toString()}`, tok);
    const qn = tok.value || '';
    if (!qn.includes(':')) failInvalidKeywordLikeIdent(this.fail.bind(this), tok, qn);
    assertValidQNamePrefix(qn.slice(0, qn.indexOf(':')), this.fail.bind(this), tok, context);
    return this.prefixes.expandQName(qn);
  }

  parseTerm() {
    const tok = this.next();
    const typ = tok.typ;
    const val = tok.value;

    if (typ === 'LtLt') return this.parseReifiedTriple();

    if (typ === 'IriRef') {
      const base = this.prefixes.baseIri || '';
      return internIri(resolveIriRef(val || '', base));
    }
    if (typ === 'Ident') {
      const name = val || '';
      if (name === 'a') {
        return internIri(RDF_NS + 'type');
      }
      const sep = name.indexOf(':');
      if (sep === 1 && name.charCodeAt(0) === 95) {
        return new Blank(name);
      }
      if (sep >= 0) {
        const prefixName = name.slice(0, sep);
        assertValidQNamePrefix(prefixName, this.fail.bind(this), tok);
        const base = this.prefixes.map[prefixName] || '';
        return internIri(base ? base + name.slice(sep + 1) : name);
      }
      failInvalidKeywordLikeIdent(this.fail.bind(this), tok, name);
    }

    if (typ === 'Literal') {
      let s = val || '';

      // Optional language tag: "..."@en, per N3 LANGTAG production.
      if (this.peek().typ === 'LangTag') {
        // Only quoted string literals can carry a language tag.
        if (!(s.startsWith('"') && s.endsWith('"'))) {
          this.fail('Language tag is only allowed on quoted string literals', this.peek());
        }
        const langTok = this.next();
        const lang = langTok.value || '';
        s = `${s}@${lang}`;

        // N3/Turtle: language tags and datatypes are mutually exclusive.
        if (this.peek().typ === 'HatHat') {
          this.fail('A literal cannot have both a language tag (@...) and a datatype (^^...)', this.peek());
        }
      }

      if (this.peek().typ === 'HatHat') {
        this.next();
        const dtTok = this.next();
        let dtIri;
        if (dtTok.typ === 'IriRef') {
          dtIri = dtTok.value || '';
        } else if (dtTok.typ === 'Ident') {
          const qn = dtTok.value || '';
          if (!qn.includes(':')) failInvalidKeywordLikeIdent(this.fail.bind(this), dtTok, qn);
          assertValidQNamePrefix(qn.slice(0, qn.indexOf(':')), this.fail.bind(this), dtTok, 'datatype prefixed name');
          dtIri = this.prefixes.expandQName(qn);
        } else {
          this.fail(`Expected datatype after ^^, got ${dtTok.toString()}`, dtTok);
        }
        s = `${s}^^<${dtIri}>`;
      }
      return internLiteral(s);
    }

    if (typ === 'LParen') return this.parseList();
    if (typ === 'LBracket') return this.parseBlank();
    if (typ === 'LBrace') return this.parseGraph();

    this.fail(`Unexpected term token: ${tok.toString()}`, tok);
  }

  parseList() {
    const elems = [];
    while (this.peek().typ !== 'RParen') {
      elems.push(this.parseTerm());
    }
    this.next(); // consume ')'
    return new ListTerm(elems);
  }

  parseBlank() {
    // [] or [ ... ] property list
    if (this.peek().typ === 'RBracket') {
      this.next();
      this.blankCounter += 1;
      return new Blank(`_:b${this.blankCounter}`, 'unlabeled');
    }

    // IRI property list: [ id <IRI> predicateObjectList? ]
    // Lets you embed descriptions of an IRI directly in object position.
    if (this.peek().typ === 'Ident' && (this.peek().value || '') === 'id') {
      const iriTok = this.next(); // consume 'id'
      const iriTerm = this.parseTerm();

      // N3 note: 'id' form is not meant to be used with blank node identifiers.
      if (iriTerm instanceof Blank && iriTerm.label.startsWith('_:')) {
        this.fail("Cannot use 'id' keyword with a blank node identifier inside [...]", iriTok);
      }

      // Optional ';' right after the id IRI (tolerated).
      if (this.peek().typ === 'Semicolon') this.next();

      // Empty IRI property list: [ id :iri ]
      if (this.peek().typ === 'RBracket') {
        this.next();
        return iriTerm;
      }

      const localTriples = this.parsePropertyListTriples(iriTerm, 'RBracket', 'IRI property list');

      // Defer the embedded description until after the triple that references the IRI.
      if (localTriples.length) this.pendingTriplesAfter.push(...localTriples);
      return iriTerm;
    }

    // [ predicateObjectList ]
    this.blankCounter += 1;
    const id = `_:b${this.blankCounter}`;
    const subj = new Blank(id, 'unlabeled');
    const localTriples = this.parsePropertyListTriples(subj, 'RBracket', 'blank node property list');

    // Defer the blank-node description until after the triple that references it.
    if (localTriples.length) this.pendingTriplesAfter.push(...localTriples);
    return new Blank(id, 'unlabeled');
  }

  // A verb: a, or a predicate term.
  parseVerb() {
    if (this.peek().typ === 'Ident' && (this.peek().value || '') === 'a') {
      this.next();
      return internIri(RDF_NS + 'type');
    }
    return this.parseTerm();
  }

  parsePropertyListTriples(subject, closingTyp, contextLabel) {
    const localTriples = [];

    while (true) {
      const pred = this.parseVerb();

      // If a pathological predicate term produced post-triples, don't let them leak.
      this.flushPendingTriples(localTriples, { includeBefore: false, includeAfter: true });

      const objs = [];
      const readObj = () => {
        const term = this.parseTerm();
        const postTriples = this.pendingTriplesAfter;
        this.pendingTriplesAfter = [];
        const annotations = this.parseAnnotations(new Triple(subject, pred, term));
        objs.push({ term, postTriples, annotations });
      };

      readObj();
      while (this.peek().typ === 'Comma') {
        this.next();
        readObj();
      }

      for (const { term: o, postTriples, annotations } of objs) {
        // Path helper triples must come before the triple that consumes the path result.
        this.flushPendingTriples(localTriples, { includeBefore: true, includeAfter: false });
        localTriples.push(new Triple(subject, pred, o));
        if (postTriples && postTriples.length) localTriples.push(...postTriples);
        if (annotations && annotations.length) localTriples.push(...annotations);
      }

      if (this.peek().typ === 'Semicolon') {
        while (this.peek().typ === 'Semicolon') this.next();
        if (this.peek().typ === closingTyp) break;
        continue;
      }
      break;
    }

    if (this.peek().typ !== closingTyp) {
      this.fail(`Expected ']' at end of ${contextLabel}, got ${this.peek().toString()}`);
    }
    this.next();

    return localTriples;
  }

  parseGraph() {
    const triples = [];
    while (this.peek().typ !== 'RBrace') {
      // N3 allows @prefix/@base and SPARQL-style PREFIX/BASE directives anywhere
      // outside of a triple. This includes inside quoted graph terms.
      // These directives affect parsing (prefix/base resolution) but do not emit triples.
      if (this.parseDirectiveIfPresent()) {
        continue;
      }

      const left = this.parseTerm();
      // A bare subject contributes only the triples it produced, if any.
      if (this.peek().typ === 'Dot' || this.peek().typ === 'RBrace') {
        this.flushPendingTriples(triples);
        if (this.peek().typ === 'Dot') this.next();
        continue;
      }

      triples.push(...this.parsePredicateObjectList(left));
      if (this.peek().typ === 'Dot') this.next();
      else if (this.peek().typ !== 'RBrace') this.fail(`Expected '.' or '}', got ${this.peek().toString()}`);
    }
    this.next(); // consume '}'
    return new GraphTerm(triples);
  }

  parsePredicateObjectList(subject) {
    const out = [];

    // If the SUBJECT was a path or property-list, emit its helper triples first.
    this.flushPendingTriples(out);

    while (true) {
      const verb = this.parseVerb();

      while (true) {
        const o = this.parseTerm();
        const postTriples = this.pendingTriplesAfter;
        this.pendingTriplesAfter = [];
        const triple = new Triple(subject, verb, o);
        const annotations = this.parseAnnotations(triple);

        // The triples of reified triples in the verb or object come before
        // the triple that uses them.
        this.flushPendingTriples(out);

        out.push(triple);
        if (postTriples.length) out.push(...postTriples);
        if (annotations.length) out.push(...annotations);

        if (this.peek().typ !== 'Comma') break;
        this.next();
      }

      if (this.peek().typ === 'Semicolon') {
        while (this.peek().typ === 'Semicolon') this.next();
        // eyemind: a graph's last triple may end with ; before its }.
        if (this.peek().typ === 'Dot' || this.peek().typ === 'RBrace') break;
        continue;
      }
      break;
    }

    return out;
  }

  // eyemind: RDF 1.2 reification. A reified triple << s p o ~ r >> stands
  // for its reifier r, or a fresh blank node, which rdf:reifies the triple
  // term; that triple comes before the statement that uses it.
  parseReifiedTriple() {
    const s = this.parseTerm();
    const p = this.parseTerm();
    const o = this.parseTerm();
    let reifier = null;
    if (this.peek().typ === 'Tilde') {
      this.next();
      if (this.peek().typ !== 'GtGt') reifier = this.parseTerm();
    }
    if (this.peek().typ !== 'GtGt') this.fail(`Expected '>>' to close a reified triple, got ${this.peek().toString()}`);
    this.next();
    reifier = reifier ?? this.freshBlank();
    this.pendingTriples.push(new Triple(reifier, internIri(RDF_NS + 'reifies'), new GraphTerm([new Triple(s, p, o)])));
    return reifier;
  }

  freshBlank() {
    this.blankCounter += 1;
    return new Blank(`_:b${this.blankCounter}`, 'unlabeled');
  }

  // eyemind: RDF 1.2 annotations after a triple's object: each ~ names a
  // reifier (a fresh blank node when none follows), and each {| ... |}
  // describes the reifier just named, or a fresh one. Returns the triples.
  parseAnnotations(triple) {
    const out = [];
    let current = null;
    const reifies = (reifier) => out.push(new Triple(reifier, internIri(RDF_NS + 'reifies'), new GraphTerm([triple])));
    while (this.peek().typ === 'Tilde' || this.peek().typ === 'AnnotOpen') {
      if (this.next().typ === 'Tilde') {
        const end = ['Tilde', 'AnnotOpen', 'Dot', 'Semicolon', 'Comma', 'RBracket', 'RBrace', 'AnnotClose', 'GtGt', 'EOF'];
        current = end.includes(this.peek().typ) ? this.freshBlank() : this.parseTerm();
        this.flushPendingTriples(out, { includeAfter: false });
        reifies(current);
      } else {
        if (this.peek().typ === 'AnnotClose') this.fail('An annotation block may not be empty');
        const reifier = current ?? this.freshBlank();
        if (!current) reifies(reifier);
        current = null;
        out.push(...this.parsePropertyListTriples(reifier, 'AnnotClose', 'annotation block'));
      }
    }
    return out;
  }
}

export { Parser };
