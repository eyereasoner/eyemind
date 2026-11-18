// The files of a ZIP archive, read with Node's zlib, so syncing MobiBench's
// archived suite needs no dependency. Stored and deflated entries only.
import { inflateRawSync } from 'node:zlib';

const END = 0x06054b50, CENTRAL = 0x02014b50, LOCAL = 0x04034b50;

export function readZip(buffer) {
  // The end-of-central-directory record ends the archive, after a comment of
  // at most 65535 bytes.
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 22 - 65535); i--) {
    if (buffer.readUInt32LE(i) === END) { end = i; break; }
  }
  if (end < 0) throw new Error('not a ZIP archive');
  const entries = [];
  let at = buffer.readUInt32LE(end + 16);
  for (let n = buffer.readUInt16LE(end + 10); n > 0; n--) {
    if (buffer.readUInt32LE(at) !== CENTRAL) throw new Error('corrupt ZIP central directory');
    const method = buffer.readUInt16LE(at + 10), size = buffer.readUInt32LE(at + 20), length = buffer.readUInt16LE(at + 28);
    const local = buffer.readUInt32LE(at + 42), name = buffer.toString('utf8', at + 46, at + 46 + length);
    at += 46 + length + buffer.readUInt16LE(at + 30) + buffer.readUInt16LE(at + 32);
    if (name.endsWith('/')) continue;
    if (buffer.readUInt32LE(local) !== LOCAL) throw new Error(`corrupt ZIP entry ${name}`);
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const raw = buffer.subarray(start, start + size);
    if (method === 0) entries.push({ name, data: Buffer.from(raw) });
    else if (method === 8) entries.push({ name, data: inflateRawSync(raw) });
    else throw new Error(`ZIP entry ${name} uses unsupported compression method ${method}`);
  }
  return entries;
}
