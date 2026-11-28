// The RDF Messages tests of the W3C RDF Stream Processing Community Group
// (w3c-cg/rsp, spec/messages-tests.bs). The tests are written in the
// specification's source: each ### section is a case with an input block and
// either the expected messages, each a list of N-Triples or N-Quads lines or
// "empty", or "Parse error.". eyemind reads message logs in Turtle, TriG,
// N-Triples and N-Quads; NDJSON-LD and RDF/XML logs and the serialization
// round trips are not supported. Any other wrong result fails the run.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseRdfMessages } from '../src/messages.js';
import { writeRdf } from '../src/rdf.js';
import { identity } from '../src/terms.js';
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

// 'passed', 'unsupported' or 'failed', with a message for a failure.
export function scoreRdfmCase({ section, input, expected }) {
  if (/NDJSON-LD|RDF\/XML|Serialization/.test(section) || ['json', 'xml'].includes(input.lang)) return { status: 'unsupported' };
  let messages;
  try {
    messages = parseRdfMessages(input.body, { format: input.lang === 'turtle' ? 'trig' : 'n-quads' }).messages.map((m) => m.quads);
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
  const sorted = (lists) => JSON.stringify(lists.map((lines) => [...lines].sort()));
  const want = expected.body.split(/^Message \d+:\n/m).slice(1)
    .map((message) => message.split('\n').map((line) => line.trim()).filter((line) => line && line !== 'empty'));
  const have = messages.map((quads) => quads.map(lineOf));
  return sorted(want) === sorted(have) ? { status: 'passed' } : { status: 'failed', message: `read ${JSON.stringify(have)}` };
}
