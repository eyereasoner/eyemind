// The RDF Messages tests of the W3C RDF Stream Processing Community Group
// (w3c-cg/rsp, spec/messages-tests.bs). The tests are written in the
// specification's source: each ### section is a case with an input block and
// either the expected messages, each a list of N-Triples or N-Quads lines or
// "empty", or "Parse error.". The NDJSON-LD cases state their expected
// datasets in prose, as the document a message is read as: the scorer reads
// that document, with a stub for each remote context ({"@vocab": its IRI}),
// so both sides interpret a context alike. A serialization round trip is
// written and read again in every log format. Any wrong result fails the run.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseRdfMessages, writeRdfMessages } from '../src/messages.js';
import { parseRdf, writeRdf } from '../src/rdf.js';
import { identity } from '../src/terms.js';
import { isomorphic } from './w3c.js';
import { cachePaths } from '../tools/test-cache.js';

export const RDFM_SOURCE = 'https://github.com/w3c-cg/rsp';
export const RDFM_PATH = 'spec/messages-tests.bs';

const blocks = (text) => [...text.matchAll(/```(\w*)\n([\s\S]*?)```/g)].map(([, lang, body]) => ({ lang, body }));

// The cases of the test document, in order: { id, section, input, expected }.
export function rdfmCases({ mirror = cachePaths().rdfm } = {}) {
  const source = readFileSync(join(mirror, RDFM_PATH), 'utf8');
  const cases = [];
  for (const part of source.split(/^## (?!#)/m).slice(1)) {
    const section = part.slice(0, part.indexOf(' ##'));
    const tests = part.split(/^### /m);
    if (tests.length === 1) {
      // A section of round trips: pairs of given and expected messages.
      const found = blocks(part);
      for (let i = 0; i + 1 < found.length; i += 2) {
        cases.push({ id: `${section}: round trip ${i / 2 + 1}`, section, input: found[i], expected: found[i + 1] });
      }
    }
    for (const test of tests.slice(1)) {
      const [input, expected] = blocks(test);
      if (input && expected) cases.push({ id: test.slice(0, test.indexOf(' ###')), section, input, expected });
    }
  }
  return cases;
}

const lineOf = (quad) => writeRdf([quad], { format: 'n-quads' }).trim();

const loadDocument = (url) => ({ document: { '@context': { '@vocab': url } }, documentUrl: url });
const messagesOf = (block) => block.split(/^Message \d+:\n/m).slice(1).map((m) => m.split('\n').map((line) => line.trim()).filter(Boolean));
const nquads = (lines) => parseRdf(lines.filter((l) => !['empty', '(empty)'].includes(l)).join('\n'), { format: 'n-quads', scope: 'expected' }).quads;

// The dataset of each NDJSON-LD message as its prose states it.
function ndjsonExpected(input, expected) {
  const objects = input.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
  const data = objects.filter((o) => !(Object.keys(o).length === 1 && '@context' in o) && Object.keys(o).length);
  const ordinals = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
  const read = (document) => parseRdf(JSON.stringify(document), { format: 'json-ld', scope: 'expected', loadDocument }).quads;
  return messagesOf(expected).map((lines) => {
    const text = lines.join(' ');
    if (/^\(?empty\)?$/.test(text)) return [];
    const effective = /effective JSON-LD document: (\{.*\})/.exec(text);
    if (effective) return read(JSON.parse(effective[1].replace(/\}\s+The local.*$/, '}')));
    const nth = /interpreting the (\w+) JSON object with @context = ("[^"]*")/.exec(text);
    if (nth) return read({ '@context': JSON.parse(nth[2]), '@graph': objects[ordinals.indexOf(nth[1])] });
    if (/as regular JSON-LD/.test(text)) return read(data[0]);
    throw new Error(`unknown expectation: ${text}`);
  });
}

// 'passed' or 'failed', with a message for a failure.
export function scoreRdfmCase({ id, section, input, expected }) {
  if (/Serialization/.test(section)) {
    const messages = messagesOf(input.body).map(nquads);
    const want = messagesOf(expected.body).map(nquads);
    // Turtle, N-Triples and RDF/XML hold no named graphs.
    const named = messages.some((quads) => quads.some((q) => q[3] !== 'default_graph'));
    for (const format of ['turtle', 'trig', 'n-triples', 'n-quads', 'rdf-xml', 'ndjson-ld']) {
      if (named && ['turtle', 'n-triples', 'rdf-xml'].includes(format)) continue;
      const back = parseRdfMessages(writeRdfMessages(messages, { format }), { format }).messages.map((m) => m.quads);
      if (back.length !== want.length || !back.every((quads, i) => isomorphic(quads, want[i]))) return { status: 'failed', message: `${format} does not round trip` };
    }
    return { status: 'passed' };
  }
  if (input.lang === 'json') {
    let messages;
    try {
      messages = parseRdfMessages(input.body, { format: 'ndjson-ld', loadDocument }).messages.map((m) => m.quads);
    } catch (error) {
      return /Parse error\./.test(expected.body) ? { status: 'passed' } : { status: 'failed', message: error.message };
    }
    const want = ndjsonExpected(input.body, expected.body);
    return messages.length === want.length && messages.every((quads, i) => isomorphic(quads, want[i])) ? { status: 'passed' }
      : { status: 'failed', message: `read ${messages.length} messages, not the expected ${want.length}, or other quads` };
  }
  const format = { turtle: 'trig', xml: 'rdf-xml' }[input.lang] ?? 'n-quads';
  let messages;
  try {
    // A parser without message support reads the log as one document.
    messages = /Without Message Support/.test(id) && format === 'rdf-xml' ? [parseRdf(input.body, { format }).quads]
      : parseRdfMessages(input.body, { format }).messages.map((m) => m.quads);
  } catch (error) {
    if (/Parse error\./.test(expected.body)) return { status: 'passed' };
    return { status: 'failed', message: error.message };
  }
  if (/Parse error\./.test(expected.body)) return { status: 'failed', message: 'the log was read, not rejected' };
  // Blank nodes of different messages are different terms, though their
  // N-Quads lines look alike.
  if (/must not be the same RDF term/.test(expected.body)) {
    const subjects = messages.map((quads) => quads.length === 1 && quads[0][0].name === 'bnode' ? identity(quads[0][0]) : null);
    return subjects.length === 2 && subjects.every(Boolean) && subjects[0] !== subjects[1] ? { status: 'passed' }
      : { status: 'failed', message: 'the blank nodes of the two messages are not two distinct terms' };
  }
  if (/must be the same RDF term/.test(expected.body)) {
    const subjects = (messages[0] ?? []).map((q) => (q[0].name === 'bnode' ? identity(q[0]) : null));
    return messages.length === 1 && subjects.length === 2 && subjects.every(Boolean) && subjects[0] === subjects[1] ? { status: 'passed' }
      : { status: 'failed', message: 'the two blank nodes of the message are not one term' };
  }
  if (/No messages\./.test(expected.body)) {
    return messages.length === 0 ? { status: 'passed' } : { status: 'failed', message: `read ${messages.length} messages` };
  }
  const sorted = (lists) => JSON.stringify(lists.map((lines) => [...lines].sort()));
  const want = expected.body.split(/^Message \d+:\n/m).slice(1)
    .map((message) => message.split('\n').map((line) => line.trim()).filter((line) => line && !['empty', '(empty)'].includes(line)));
  const have = messages.map((quads) => quads.map(lineOf));
  return sorted(want) === sorted(have) ? { status: 'passed' } : { status: 'failed', message: `read ${JSON.stringify(have)}` };
}
