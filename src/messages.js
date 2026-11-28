// RDF Message Logs: delimit datasets before parsing them, so blank nodes and
// assertions stay local to a message. The replay view is ordinary N3 data.
// See https://w3c-cg.github.io/rsp/spec/messages and its companion tests.
import { DEFAULT_GRAPH, parseRdf, parseRdfXmlLog, writeRdf } from './rdf.js';
import { readSources } from './n3.js';
import { tripleToEyemind } from './n3-writer.js';
import { EyemindError } from './terms.js';

export const MESSAGE_NS = 'https://eyereasoner.github.io/eyemind/vocab/message#';
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const LOG_NAME = 'http://www.w3.org/2000/10/swap/log#nameOf';
const GRAPH_CONTENT = 'https://eyereasoner.github.io/eyemind/graph#content';
const iri = (v) => ({ t: 'iri', v });
const triple = (s, p, o) => ({ s, p: iri(p), o });
const int = (v) => ({ t: 'int', v: BigInt(v) });
const wordEnd = (c) => c === undefined || /[\s<>"'{}\[\]();,]/.test(c);
const iriText = (v) => v.replace(/[\u0000-\u0020<>"{}|^`\\]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
// The start of an RDF/XML message log: its rdfm:MessageLog root.
const XML_LOG = /^\s*(?:<\?xml[^>]*\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<(?:[\w.-]+:)?MessageLog[\s>/]/;
function trivia(s, at, final) {
  while (at < s.length) {
    if (/\s/.test(s[at])) at++;
    else if (s[at] === '#') {
      const end = s.slice(at).search(/[\r\n]/);
      if (end < 0) return final ? s.length : null;
      at += end;
    } else break;
  }
  return at;
}

// Accept strings incrementally. Only the current message and active directive
// context are retained; onMessage runs before reading any further input.
export class RdfMessageReader {
  constructor({ format = 'trig', base = null, scope = 'messages', onMessage = () => {}, probe = false, loadDocument = null } = {}) {
    if (!['turtle', 'trig', 'n-triples', 'n-quads', 'rdf-xml', 'ndjson-ld'].includes(format)) throw new EyemindError(`RDF Messages do not support the format ${format}`);
    this.format = format;
    this.loadDocument = loadDocument;
    this.context = undefined;
    this.line = 0;
    this.base = base;
    this.scope = scope;
    this.onMessage = onMessage;
    this.probe = probe;
    this.buffer = '';
    this.at = 0;
    this.quote = null;
    this.comment = false;
    this.inIri = false;
    this.stack = [];
    this.prefixes = {};
    this.index = 0;
    this.version = null;
    this.isLog = false;
    this.stopped = false;
    this.hasPayload = false;
    this.directive = false;
  }

  write(text) {
    if (this.stopped) return;
    this.buffer += text;
    // An RDF/XML log is one XML document, read when it is complete.
    if (this.format === 'rdf-xml') return;
    if (this.format === 'ndjson-ld') {
      for (let end = this.buffer.indexOf('\n'); end >= 0 && !this.stopped; end = this.buffer.indexOf('\n')) {
        const line = this.buffer.slice(0, end);
        this.buffer = this.buffer.slice(end + 1);
        this.ndjsonLine(line.replace(/\r$/, ''));
      }
      return;
    }
    if (this.probe && XML_LOG.test(this.buffer)) {
      this.isLog = true;
      return;
    }
    this.scan(false);
    if (this.probe) {
      this.buffer = this.buffer.slice(this.at);
      this.at = 0;
    }
  }

  finish() {
    if (this.stopped) { this.buffer = ''; return; }
    if (this.format === 'ndjson-ld') {
      if (this.buffer !== '') this.ndjsonLine(this.buffer.replace(/\r$/, ''));
      this.buffer = '';
      return;
    }
    if (this.format === 'rdf-xml') {
      try {
        for (const message of parseRdfXmlLog(this.buffer, { base: this.base, scope: this.scope })) {
          this.index = message.index;
          if (this.onMessage(message) === false) break;
        }
      } catch (error) {
        throw new EyemindError(`RDF Message Log: ${error.message}`);
      } finally {
        this.buffer = '';
      }
      return;
    }
    this.scan(true);
    if (!this.probe) {
      if (!this.isLog) throw new EyemindError('RDF Message Log needs a VERSION "*-messages" directive');
      this.emit(this.buffer, false);
    }
    this.buffer = '';
  }

  // A line of an NDJSON-LD log: a context message, whose @context is the
  // active context for the messages that follow, an empty message {}, or a
  // data message, read as the document {"@context": C, "@graph": message}.
  // https://w3c-cg.github.io/rsp/spec/messages#ndjson-ld
  ndjsonLine(line) {
    this.line++;
    let object;
    try {
      object = JSON.parse(line);
    } catch {
      object = null;
    }
    if (line.trim() === '') throw new EyemindError(`RDF Message Log line ${this.line}: NDJSON-LD allows no blank lines`);
    if (object === null || typeof object !== 'object' || Array.isArray(object)) {
      throw new EyemindError(`RDF Message Log line ${this.line}: each line of NDJSON-LD is one JSON object`);
    }
    const keys = Object.keys(object);
    if (keys.length === 1 && keys[0] === '@context') {
      this.context = object['@context'];
      return;
    }
    const document = keys.length === 0 ? null : this.context === undefined ? object : { '@context': this.context, '@graph': object };
    const number = this.index + 1;
    let quads = [];
    try {
      if (document) quads = parseRdf(JSON.stringify(document), { format: 'json-ld', base: this.base, scope: `${this.scope}#message${number}`, loadDocument: this.loadDocument }).quads;
    } catch (error) {
      throw new EyemindError(`RDF Message Log message ${number}: ${error.message}`);
    }
    this.isLog = true;
    this.stopped = this.onMessage({ quads, prefixes: {}, base: this.base, index: ++this.index }) === false;
  }

  emit(text, boundary) {
    if (this.probe) return;
    const line = this.format === 'n-triples' || this.format === 'n-quads';
    const context = line ? '' : Object.entries(this.prefixes).map(([name, ns]) => `PREFIX ${name}: <${iriText(ns)}>\n`).join('');
    const number = this.index + 1;
    try {
      const parsed = parseRdf(`${context}${text}`, { format: this.format, base: this.base, scope: `${this.scope}#message${this.index + 1}` });
      this.base = parsed.base;
      this.prefixes = parsed.prefixes;
      // A delimiter closes even an empty message. EOF opens no new message
      // for a trailing delimiter, comments or directives alone.
      if (boundary || parsed.quads.length) this.stopped = this.onMessage({ ...parsed, index: ++this.index }) === false;
    } catch (error) {
      throw new EyemindError(`RDF Message Log message ${number}: ${error.message}`);
    }
  }

  scan(final) {
    while (!this.stopped && this.at < this.buffer.length) {
      const s = this.buffer;
      const i = this.at;
      const c = s[i];
      if (this.comment) {
        if (c === '\n' || c === '\r') this.comment = false;
        this.at++;
      } else if (this.quote) {
        if (c === '\\') {
          if (i + 1 === s.length && !final) break;
          this.at += 2;
        } else if (c === this.quote[0]) {
          if (i + this.quote.length > s.length && !final) break;
          if (s.startsWith(this.quote, i)) {
            this.at += this.quote.length;
            this.quote = null;
          } else this.at++;
        } else this.at++;
      } else if (this.inIri) {
        this.at++;
        if (c === '>') {
          this.inIri = false;
          this.directive = false;
        }
      } else if (/\s|\uFEFF/.test(c)) this.at++;
      else if (c === '#') {
        this.comment = true;
        this.at++;
      } else if (c === '"' || c === "'") {
        if (i + 3 > s.length && !final) break;
        this.quote = s.startsWith(c.repeat(3), i) ? c.repeat(3) : c;
        if (!this.directive) this.hasPayload = true;
        this.at += this.quote.length;
      } else if (c === '<') {
        if (i + 1 === s.length && !final) break;
        if (s[i + 1] === '<') {
          if (!this.probe && this.version !== '1.2') throw new EyemindError('triple terms require VERSION "1.2-messages"');
          this.stack.push('>>');
          this.at += 2;
        } else {
          if (!this.directive) this.hasPayload = true;
          this.inIri = true;
          this.at++;
        }
      } else if (c === '>' && i + 1 === s.length && !final) break;
      else if (s.startsWith('>>', i)) {
        if (this.stack.at(-1) === '>>') this.stack.pop();
        this.at += 2;
      } else if ('{[('.includes(c)) {
        if (c === '{' && i + 1 === s.length && !final) break;
        if (!this.probe && c === '{' && s[i + 1] === '|' && this.version !== '1.2') {
          throw new EyemindError('annotations require VERSION "1.2-messages"');
        }
        this.hasPayload = true;
        this.stack.push({ '{': '}', '[': ']', '(': ')' }[c]);
        this.at++;
      } else if ('}])'.includes(c)) {
        if (this.stack.at(-1) === c) this.stack.pop();
        this.at++;
      } else if (';,'.includes(c) || c === '>') this.at++;
      else {
        let end = i;
        while (end < s.length && !wordEnd(s[end])) end += s[end] === '\\' ? 2 : 1;
        if (end >= s.length && !final) break;
        const word = s.slice(i, end);
        if (word.toUpperCase() === 'VERSION' || word === '@version') {
          const rest = s.slice(end);
          const match = /^\s+(["'])([^"'\r\n]*)\1/.exec(rest);
          if (!match) {
            if (!final && /^\s*(?:["'][^"'\r\n]*)?$/.test(rest)) break;
            throw new EyemindError(`${word} needs a short quoted version label`);
          }
          if (this.stack.length) throw new EyemindError('VERSION is only allowed between statements');
          const label = match[2];
          this.isLog ||= label.endsWith('-messages');
          const version = label.replace(/-messages$/, '');
          if (!this.probe && (!this.isLog || !['1.1', '1.2-basic', '1.2'].includes(version))) {
            throw new EyemindError(`unsupported RDF Message Log version: ${label}`);
          }
          this.version = version;
          // Keep the underlying directive for the strict RDF parser to check
          // its spelling, placement and punctuation in the selected format.
          const valueStart = end + match[0].indexOf(match[1]);
          const valueEnd = end + match[0].length;
          this.buffer = `${s.slice(0, valueStart)}${match[1]}${version}${match[1]}${s.slice(valueEnd)}`;
          this.at = valueStart + version.length + 2;
        } else if (word.toUpperCase() === 'MESSAGE' || /^@message(?:\.|$)/.test(word)) {
          if (!this.isLog && !this.probe) throw new EyemindError('MESSAGE needs a VERSION "*-messages" directive');
          if (this.stack.length) throw new EyemindError('MESSAGE is only allowed between top-level statements');
          if (word.toUpperCase() !== 'MESSAGE') {
            const dot = trivia(s, i + 8, final);
            if (dot === null || (dot === s.length && !final)) break;
            if (s[dot] !== '.') {
              throw new EyemindError('@message ends with a dot');
            }
            if (this.format === 'n-triples' || this.format === 'n-quads') throw new EyemindError('@message is not allowed in N-Triples or N-Quads; write MESSAGE');
            end = dot + 1;
          }
          if (this.format === 'n-triples' || this.format === 'n-quads') {
            if (word !== 'MESSAGE') throw new EyemindError('MESSAGE is case-sensitive in N-Triples and N-Quads');
            const start = Math.max(s.lastIndexOf('\n', i - 1), s.lastIndexOf('\r', i - 1)) + 1;
            const newline = s.slice(end).search(/[\r\n]/);
            if (newline < 0 && !final) break;
            const rest = s.slice(end, newline < 0 ? s.length : end + newline).replace(/#.*$/, '');
            if (s.slice(start, i).trim() || rest.trim()) throw new EyemindError('MESSAGE must be on its own line in N-Triples and N-Quads');
          }
          this.emit(s.slice(0, i), true);
          this.buffer = s.slice(end);
          this.at = 0;
        } else {
          if (!this.probe && this.version === '1.1' && /^@[A-Za-z].*--(?:ltr|rtl)(?:\.|$)/.test(word)) {
            throw new EyemindError('directional language strings require RDF 1.2 Messages');
          }
          if (!this.probe && this.version !== '1.2' && /(^|[^\\])~/.test(word)) {
            throw new EyemindError('reification syntax requires VERSION "1.2-messages"');
          }
          if (['PREFIX', 'BASE'].includes(word.toUpperCase()) || ['@prefix', '@base'].includes(word)) this.directive = true;
          else if (word !== '.' && !this.directive) this.hasPayload = true;
          this.at = end;
        }
      }
    }
  }
}

export function isRdfMessageLog(text) {
  if (XML_LOG.test(text)) return true;
  const reader = new RdfMessageReader({ probe: true });
  try {
    reader.write(String(text));
    reader.finish();
  } catch { /* The selected parser reports malformed inputs. */ }
  return reader.isLog;
}

// Materialize the application's replay vocabulary. Neither envelope links nor
// log:nameOf assert the payload's triples in the surrounding default graph.
export function replayMessages(messages, { scope = 'messages' } = {}) {
  const root = `urn:eyemind:message-log:${encodeURIComponent(scope)}`;
  const stream = iri(`${root}#stream`);
  const envelopes = messages.map((m) => iri(`${root}#message${m.index}`));
  const triples = [triple(stream, RDF_TYPE, iri(`${MESSAGE_NS}RDFMessageStream`)),
    triple(stream, `${MESSAGE_NS}messageCount`, int(messages.length)),
    triple(stream, `${MESSAGE_NS}orderedEnvelopes`, { t: 'list', items: envelopes })];
  if (envelopes.length) triples.push(triple(stream, `${MESSAGE_NS}firstEnvelope`, envelopes[0]),
    triple(stream, `${MESSAGE_NS}lastEnvelope`, envelopes.at(-1)));
  const prefixes = { eymsg: MESSAGE_NS };
  messages.forEach((message, i) => {
    Object.assign(prefixes, message.prefixes);
    const envelope = envelopes[i];
    triples.push(triple(stream, `${MESSAGE_NS}envelope`, envelope),
      triple(envelope, RDF_TYPE, iri(`${MESSAGE_NS}MessageEnvelope`)),
      triple(envelope, `${MESSAGE_NS}offset`, int(message.index)),
      triple(envelope, `${MESSAGE_NS}payloadKind`, iri(`${MESSAGE_NS}${message.quads.length ? 'nonEmpty' : 'empty'}`)));
    if (envelopes[i + 1]) triples.push(triple(envelope, `${MESSAGE_NS}nextEnvelope`, envelopes[i + 1]));
    if (message.quads.length) {
      const payload = iri(`${envelope.v}/payload`);
      const contents = readSources([message]).triples.map((t) => t.p.v === GRAPH_CONTENT && t.o.t === 'graph' ? { ...t, p: iri(LOG_NAME) } : t);
      triples.push(triple(envelope, `${MESSAGE_NS}payloadGraph`, payload),
        triple(payload, LOG_NAME, { t: 'graph', triples: contents, scope: 0 }));
    }
  });
  return { triples, prefixes, quads: triples.map((t) => [...tripleToEyemind(t), DEFAULT_GRAPH]) };
}

export function parseRdfMessages(text, options = {}) {
  const messages = [];
  const reader = new RdfMessageReader({ ...options, onMessage: (m) => messages.push(m) });
  reader.write(String(text));
  reader.finish();
  return { ...replayMessages(messages, options), messages };
}

// An RDF Message Log of messages, each its quads: VERSION "1.2-messages"
// and a MESSAGE delimiter between messages in Turtle, TriG, N-Triples and
// N-Quads, an rdf:RDF per message in RDF/XML, and a line per message in
// NDJSON-LD. A final empty message needs one more delimiter, as a trailing
// delimiter alone opens no message.
export function writeRdfMessages(messages, { format = 'trig', prefixes = {} } = {}) {
  if (format === 'ndjson-ld') {
    return messages.map((quads) => `${quads.length ? JSON.stringify({ '@graph': JSON.parse(writeRdf(quads, { format: 'json-ld' })) }) : '{}'}\n`).join('');
  }
  if (format === 'rdf-xml') {
    let version = '1.0';
    const parts = messages.map((quads) => {
      const text = writeRdf(quads, { format: 'rdf-xml', prefixes });
      if (text.startsWith('<?xml version="1.1"')) version = '1.1';
      return text.replace(/^<\?xml[^>]*\?>\n/, '').replace(/^/gm, '  ').trimEnd();
    });
    return `<?xml version="${version}" encoding="utf-8"?>\n<rdfm:MessageLog xmlns:rdfm="https://w3c-cg.github.io/rsp/spec/messages#">\n` +
      parts.map((p) => `${p}\n`).join('') + '</rdfm:MessageLog>\n';
  }
  if (!['turtle', 'trig', 'n-triples', 'n-quads'].includes(format)) throw new EyemindError(`RDF Messages do not support the format ${format}`);
  const out = ['VERSION "1.2-messages"\n'];
  messages.forEach((quads, i) => {
    if (i > 0) out.push('MESSAGE\n');
    out.push(writeRdf(quads, { format, prefixes }));
  });
  if (messages.length && !messages.at(-1).length) out.push('MESSAGE\n');
  return out.join('');
}
