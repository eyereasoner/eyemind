// Self-contained XML 1.1 content (RDF 1.2 Concepts, Appendix A.2), with
// Namespaces in XML 1.0. The scanner needs no document wrapper, DTD or I/O.
// https://www.w3.org/TR/xml11/#sec-well-formed
// https://www.w3.org/TR/xml-names/#Conformance
const NC_START = String.raw`A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}`;
const NC_CHAR = NC_START + String.raw`0-9.\-\u00B7\u0300-\u036F\u203F-\u2040`;
const NC_NAME = `[${NC_START}][${NC_CHAR}]*`;
const QNAME = new RegExp(NC_NAME + '(?::' + NC_NAME + ')?', 'uy');
const PI_NAME = new RegExp(NC_NAME, 'uy');
const SPACE = /[ \t\n]+/y;
const DATA = /[^<&]+/y;
const REFERENCE = /&(?:(amp|lt|gt|apos|quot)|#([0-9]+)|#x([0-9a-fA-F]+));/y;
const ENTITIES = { amp: '&', lt: '<', gt: '>', apos: "'", quot: '"' };
const XML = 'http://www.w3.org/XML/1998/namespace';
const XMLNS = 'http://www.w3.org/2000/xmlns/';
const INVALID_RAW = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u0084\u0086-\u009F\uD800-\uDFFF\uFFFE\uFFFF]/u;

function match(pattern, text, at) {
  pattern.lastIndex = at;
  return pattern.exec(text);
}

function reference(text, at) {
  const ref = match(REFERENCE, text, at);
  if (!ref) return null;
  const [raw, name, decimal, hex] = ref;
  if (name) return [raw.length, ENTITIES[name]];
  const code = decimal === undefined ? Number.parseInt(hex, 16) : Number(decimal);
  if (code === 0 || code > 0x10FFFF || (code >= 0xD800 && code <= 0xDFFF) || code === 0xFFFE || code === 0xFFFF) return null;
  return [raw.length, String.fromCodePoint(code)];
}

export function isXmlContent(text) {
  if (INVALID_RAW.test(text)) return false;
  text = text.replace(/\r[\n\u0085]?|[\u0085\u2028]/gu, '\n');
  const namespaces = new Map([['xml', XML]]), open = [];
  let at = 0;
  const take = (token) => {
    if (!text.startsWith(token, at)) return false;
    at += token.length;
    return true;
  };
  const read = (pattern) => {
    const found = match(pattern, text, at)?.[0];
    if (found) at += found.length;
    return found;
  };
  const attributes = () => {
    const found = new Map();
    while (read(SPACE) && text[at] !== '>' && text[at] !== '/') {
      const name = read(QNAME);
      if (!name || found.has(name)) return null;
      read(SPACE);
      if (!take('=')) return null;
      read(SPACE);
      const quote = text[at++];
      if (quote !== '"' && quote !== "'") return null;
      const end = text.indexOf(quote, at);
      if (end < 0) return null;
      const raw = text.slice(at, end);
      if (raw.includes('<')) return null;
      let value = '', start = 0;
      for (let amp = raw.indexOf('&'); amp >= 0; amp = raw.indexOf('&', start)) {
        const ref = reference(raw, amp);
        if (!ref) return null;
        value += raw.slice(start, amp).replace(/[\t\n]/g, ' ') + ref[1];
        start = amp + ref[0];
      }
      found.set(name, value + raw.slice(start).replace(/[\t\n]/g, ' '));
      at = end + 1;
    }
    return found;
  };
  const restore = (changes) => {
    for (const [prefix, value] of changes) {
      if (value === undefined) namespaces.delete(prefix);
      else namespaces.set(prefix, value);
    }
  };
  while (at < text.length) {
    if (take('<!--')) {
      const end = text.indexOf('--', at);
      if (end < 0 || !text.startsWith('-->', end)) return false;
      at = end + 3;
    } else if (take('<![CDATA[')) {
      const end = text.indexOf(']]>', at);
      if (end < 0) return false;
      at = end + 3;
    } else if (take('<?')) {
      const target = read(PI_NAME);
      if (!target || target.toLowerCase() === 'xml') return false;
      if (take('?>')) continue;
      if (!read(SPACE)) return false;
      const end = text.indexOf('?>', at);
      if (end < 0) return false;
      at = end + 2;
    } else if (take('</')) {
      const name = read(QNAME), frame = open.pop();
      if (!frame || frame.name !== name) return false;
      read(SPACE);
      if (!take('>')) return false;
      restore(frame.changes);
    } else if (take('<')) {
      const name = read(QNAME);
      if (!name) return false;
      const attrs = attributes();
      if (!attrs) return false;
      const empty = take('/>');
      if (!empty && !take('>')) return false;
      const changes = new Map();
      // Declarations apply to the whole tag, including attributes before them.
      for (const [key, value] of attrs) {
        if (key !== 'xmlns' && !key.startsWith('xmlns:')) continue;
        const prefix = key === 'xmlns' ? '' : key.slice(6);
        if (prefix === 'xmlns' || value === XMLNS || (prefix === 'xml') !== (value === XML) || (prefix && !value)) return false;
        changes.set(prefix, namespaces.get(prefix));
        namespaces.set(prefix, value);
        attrs.delete(key);
      }
      const [prefix, local] = name.split(':');
      if (local && !namespaces.has(prefix)) return false;
      const expanded = new Set();
      for (const key of attrs.keys()) {
        const [prefix, local] = key.split(':');
        const namespace = local ? namespaces.get(prefix) : '';
        if (namespace === undefined) return false;
        const expandedName = namespace + '\0' + (local ?? prefix);
        if (expanded.has(expandedName)) return false;
        expanded.add(expandedName);
      }
      if (empty) restore(changes);
      else open.push({ name, changes });
    } else if (text[at] === '&') {
      const ref = reference(text, at);
      if (!ref) return false;
      at += ref[0];
    } else if (read(DATA).includes(']]>')) {
      return false;
    }
  }
  return open.length === 0;
}
