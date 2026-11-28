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

// Whether a text is an XML name without a colon, as rdf:ID and rdf:nodeID are.
const NC_NAME_ONLY = new RegExp(`^${NC_NAME}$`, 'u');
export const isNcName = (text) => NC_NAME_ONLY.test(text);

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

// An XML document as a tree, for RDF/XML: the root element, each element
// { name, ns, local, attrs, children, declared } with attrs [{ name, ns,
// local, value }] and declared the namespaces it declares, and text, comment
// and processing instruction nodes. A DOCTYPE may declare internal general
// entities; external ones are not read. Throws a SyntaxError.
// https://www.w3.org/TR/xml/#sec-documents
export function parseXml(input) {
  const fail = (message) => { throw new SyntaxError(`XML: ${message}`); };
  if (INVALID_RAW.test(input)) fail('a character is not allowed in XML');
  const text = String(input).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const entities = { ...ENTITIES };
  let at = 0;
  const take = (token) => text.startsWith(token, at) && (at += token.length, true);
  const read = (pattern) => {
    const found = match(pattern, text, at)?.[0];
    if (found) at += found.length;
    return found;
  };
  const until = (token, what) => {
    const end = text.indexOf(token, at);
    if (end < 0) fail(`unterminated ${what}`);
    const body = text.slice(at, end);
    at = end + token.length;
    return body;
  };
  // Character and entity references; an entity's text may hold references.
  const expand = (raw, attribute, depth = 0) => {
    if (depth > 16) fail('entities nest too deeply');
    let value = '', start = 0;
    for (let amp = raw.indexOf('&'); amp >= 0; amp = raw.indexOf('&', start)) {
      const plain = raw.slice(start, amp);
      value += attribute ? plain.replace(/[\t\n]/g, ' ') : plain;
      const char = reference(raw, amp);
      if (char) {
        value += char[1];
        start = amp + char[0];
        continue;
      }
      const named = /^&([^;\s&]+);/.exec(raw.slice(amp));
      if (!named || !(named[1] in entities)) fail(`unknown reference ${raw.slice(amp, amp + 12)}`);
      value += named[1] in ENTITIES ? entities[named[1]] : expand(entities[named[1]], attribute, depth + 1);
      start = amp + named[0].length;
    }
    const rest = raw.slice(start);
    return value + (attribute ? rest.replace(/[\t\n]/g, ' ') : rest);
  };
  const misc = () => {
    for (;;) {
      read(SPACE);
      if (take('<!--')) {
        const body = until('-->', 'comment');
        if (body.includes('--')) fail('a comment contains --');
      } else if (text.startsWith('<?', at) && !text.startsWith('<?xml ', at)) {
        at += 2;
        if (!read(PI_NAME)) fail('a processing instruction has no target');
        until('?>', 'processing instruction');
      } else return;
    }
  };
  if (take('<?xml')) until('?>', 'XML declaration');
  misc();
  if (take('<!DOCTYPE')) {
    // Internal general entities; parameter entities and external ones are not read.
    let depth = 0;
    const start = at;
    while (at < text.length && (depth || text[at] !== '>')) {
      if (text[at] === '[') depth++;
      else if (text[at] === ']') depth--;
      else if (text[at] === '"' || text[at] === "'") at = text.indexOf(text[at], at + 1);
      if (at < 0) fail('unterminated DOCTYPE');
      at++;
    }
    for (const [, name, , value] of text.slice(start, at).matchAll(/<!ENTITY\s+([^\s%]+)\s+(["'])([\s\S]*?)\2\s*>/g)) {
      if (!(name in entities)) entities[name] = value;
    }
    if (!take('>')) fail('unterminated DOCTYPE');
    misc();
  }
  const scope = [new Map([['xml', XML], ['', '']])];
  const resolve = (name, element) => {
    const colon = name.indexOf(':');
    const prefix = colon < 0 ? '' : name.slice(0, colon), local = colon < 0 ? name : name.slice(colon + 1);
    if (colon < 0 && !element) return { ns: '', local };
    const ns = scope.at(-1).get(prefix);
    if (ns === undefined) fail(`the prefix ${prefix} is not declared`);
    return { ns, local };
  };
  const element = () => {
    const name = read(QNAME);
    if (!name) fail(`an element name is expected at offset ${at}`);
    const raw = [];
    while (read(SPACE) && text[at] !== '>' && text[at] !== '/') {
      const attr = read(QNAME);
      if (!attr) fail(`an attribute name is expected in <${name}>`);
      read(SPACE);
      if (!take('=')) fail(`the attribute ${attr} has no value`);
      read(SPACE);
      const quote = text[at++];
      if (quote !== '"' && quote !== "'") fail(`the value of ${attr} is not quoted`);
      const value = until(quote, 'attribute value');
      if (value.includes('<')) fail(`the value of ${attr} contains <`);
      if (raw.some(([n]) => n === attr)) fail(`the attribute ${attr} occurs twice`);
      raw.push([attr, expand(value, true)]);
    }
    const empty = take('/>');
    if (!empty && !take('>')) fail(`the tag <${name}> is not closed`);
    const namespaces = new Map(scope.at(-1)), declared = {};
    for (const [key, value] of raw) {
      if (key !== 'xmlns' && !key.startsWith('xmlns:')) continue;
      const prefix = key === 'xmlns' ? '' : key.slice(6);
      if (prefix === 'xmlns' || value === XMLNS || (prefix === 'xml') !== (value === XML) || (prefix && !value)) fail(`the namespace declaration ${key} is not allowed`);
      namespaces.set(prefix, value);
      declared[prefix] = value;
    }
    scope.push(namespaces);
    const node = { type: 'element', name, ...resolve(name, true), attrs: [], children: [], declared };
    const seen = new Set();
    for (const [key, value] of raw) {
      if (key === 'xmlns' || key.startsWith('xmlns:')) continue;
      const attr = { name: key, ...resolve(key, false), value };
      if (seen.has(attr.ns + ' ' + attr.local)) fail(`the attribute ${key} occurs twice`);
      seen.add(attr.ns + ' ' + attr.local);
      node.attrs.push(attr);
    }
    if (!empty) {
      for (;;) {
        if (take('</')) {
          if (read(QNAME) !== name) fail(`</${name}> is expected`);
          read(SPACE);
          if (!take('>')) fail(`the end tag of ${name} is not closed`);
          break;
        } else if (take('<!--')) {
          const body = until('-->', 'comment');
          if (body.includes('--')) fail('a comment contains --');
          node.children.push({ type: 'comment', value: body });
        } else if (take('<![CDATA[')) {
          const value = until(']]>', 'CDATA section'), last = node.children.at(-1);
          if (last?.type === 'text') last.value += value;
          else node.children.push({ type: 'text', value });
        } else if (take('<?')) {
          const target = read(PI_NAME);
          if (!target || target.toLowerCase() === 'xml') fail('a processing instruction has no valid target');
          const data = take('?>') ? '' : (read(SPACE), until('?>', 'processing instruction'));
          node.children.push({ type: 'pi', target, value: data });
        } else if (take('<')) {
          node.children.push(element());
        } else if (at >= text.length) {
          fail(`<${name}> is not closed`);
        } else {
          const end = text.indexOf('<', at);
          const raw = text.slice(at, end < 0 ? text.length : end);
          if (raw.includes(']]>')) fail('character data contains ]]>');
          at += raw.length;
          const value = expand(raw, false);
          const last = node.children.at(-1);
          if (last?.type === 'text') last.value += value;
          else node.children.push({ type: 'text', value });
        }
      }
    }
    scope.pop();
    return node;
  };
  if (!take('<')) fail('the document has no root element');
  const root = element();
  misc();
  if (at < text.length) fail('only one root element is allowed');
  return root;
}
