// Node's incremental RDF Message input. The shared CLI supplies the operation
// to run for each message; this adapter owns only file/HTTP/stdin access.
import { createReadStream } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { rdfMessageFormat } from './formats.js';
import { replayMessages, RdfMessageReader } from './messages.js';

const remote = (name) => /^https?:/.test(name);

async function messageFile(name) {
  if (name === '-' || remote(name)) return true;
  if (/\.js$/i.test(name)) return false;
  const probe = new RdfMessageReader({ probe: true });
  for await (const text of createReadStream(name, { encoding: 'utf8' })) {
    probe.write(text);
    if (probe.isLog) return true;
    if (probe.version || probe.hasPayload) return false;
  }
  probe.finish();
  return probe.isLog;
}

async function openSource(name) {
  if (name === '-') {
    process.stdin.setEncoding('utf8');
    return { body: process.stdin, base: null };
  }
  if (!remote(name)) return { body: createReadStream(name, { encoding: 'utf8' }), base: pathToFileURL(resolve(name)).href };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  let response;
  try {
    response = await fetch(name, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`${name}: HTTP ${response.status}`);
  }
  const decoder = new TextDecoder();
  async function* text() {
    if (response.body) for await (const bytes of response.body) yield decoder.decode(bytes, { stream: true });
    const tail = decoder.decode();
    if (tail) yield tail;
  }
  const mediaType = response.headers.get('content-type')?.split(';')[0].trim();
  const format = { 'application/n-triples': 'n-triples', 'application/n-quads': 'n-quads',
    'text/turtle': 'turtle', 'application/trig': 'trig' }[mediaType] ?? rdfMessageFormat(response.url);
  return { body: text(), base: response.url, format };
}

export async function streamMessages(request, io) {
  try {
    const inputs = [];
    const logs = [];
    for (const [index, name] of request.files.entries()) {
      if (await messageFile(name)) logs.push({ name, index });
      else inputs.push([name, io.readFile(name)]);
    }
    if (!logs.length) throw new Error('--stream-messages needs an RDF Message Log with VERSION "*-messages"');
    for (const { name, index } of logs) {
      const source = await openSource(name);
      const scope = request.scope(name, index);
      let code = 0;
      const reader = new RdfMessageReader({ format: source.format ?? rdfMessageFormat(name), base: request.base ?? source.base, scope,
        onMessage: (message) => {
          code = request.run(inputs, name, replayMessages([message], { scope }));
          return code === 0;
        } });
      for await (const text of source.body) {
        reader.write(text);
        if (reader.stopped) break;
      }
      reader.finish();
      if (code) return code;
    }
    return 0;
  } catch (error) {
    io.stderr(`eyemind: ${error.message}\n`);
    return 1;
  }
}
