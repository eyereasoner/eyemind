// RDF Message Logs: delimit datasets before parsing them, so blank nodes and
// assertions stay local to a message. The replay view is ordinary N3 data.
// See https://w3c-cg.github.io/rsp/spec/messages and its companion tests.
import { DEFAULT_GRAPH, parseRdf } from './rdf.js';
import { readSources } from './n3.js';
import { tripleToEyemind } from './n3-writer.js';
import { EyemindError } from './terms.js';

export const MESSAGE_NS = 'https://eyereasoner.github.io/eyeling/vocab/message#';
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const LOG_NAME = 'http://www.w3.org/2000/10/swap/log#nameOf';
const GRAPH_CONTENT = 'https://eyereasoner.github.io/eyemind/graph#content';
const iri = (v) => ({ t: 'iri', v });
const triple = (s, p, o) => ({ s, p: iri(p), o });
const int = (v) => ({ t: 'int', v: BigInt(v) });
const wordEnd = (c) => c === undefined || /[\s<>"'{}\[\]();,]/.test(c);
const iriText = (v) => v.replace(/[\u0000-\u0020<>"{}|^`\\]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
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
  constructor({ format = 'trig', base = null, scope = 'messages', onMessage = () => {}, probe = false } = {}) {
    if (!['turtle', 'trig', 'n-triples', 'n-quads'].includes(format)) throw new EyemindError(`RDF Messages do not support the format ${format}`);
    this.format = format;
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
    this.scan(false);
    if (this.probe) {
      this.buffer = this.buffer.slice(this.at);
      this.at = 0;
    }
  }

  finish() {
    if (this.stopped) { this.buffer = ''; return; }
    this.scan(true);
    if (!this.probe) {
      if (!this.isLog) throw new EyemindError('RDF Message Log needs a VERSION "*-messages" directive');
      this.emit(this.buffer, false);
    }
    this.buffer = '';
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
