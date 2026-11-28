// RDF/XML in eyemind: the grammar of RDF 1.2 XML Syntax read from an XML
// tree, giving the same quads as the other RDF formats, and those quads
// written as RDF/XML. Where the RDF 1.2
// draft disagrees with itself, the W3C RDF/XML tests decide: a triple term
// (rdf:parseType="Triple") holds one node element with one property, and
// rdf:annotation or rdf:annotationNodeID names a reifier of its triple.
// https://www.w3.org/TR/rdf12-xml/#section-Infoset-Grammar
import { resolveIriRef } from './rdf-prelude.js';
import { Struct } from './terms.js';
import { isNcName, isXmlContent, parseXml } from './xml.js';

const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const XML = 'http://www.w3.org/XML/1998/namespace';
const ITS = 'http://www.w3.org/2005/11/its';

// The names the grammar reserves (RDF 1.2 XML Syntax, 6.2.2 to 6.2.4).
const CORE = new Set(['RDF', 'ID', 'about', 'parseType', 'resource', 'nodeID', 'datatype', 'version', 'annotation', 'annotationNodeID']);
const OLD = new Set(['aboutEach', 'aboutEachPrefix', 'bagID']);
// Unqualified attributes that older documents use for their RDF names.
const UNQUALIFIED = new Set(['ID', 'about', 'resource', 'parseType', 'type', 'version']);

const st = (name, ...args) => new Struct(name, args);
const iri = (v) => st('iri', v);
// Whether an RDF version of 1.2 or later, such as 1.2-basic, is in scope.
const rdf12 = (context) => /^(?:1\.(?:[2-9]|[1-9][0-9]+)|[2-9]\.)/.test(context.version ?? '');

// Read an RDF/XML document into [S, P, O, G] quads of the default graph.
// The caller supplies the terms for literals, so they match the other formats.
export function parseRdfXml(source, options) {
  const root = parseXml(source);
  const top = { base: options.base ? options.base.replace(/#.*$/, '') : null, lang: '', dir: '', version: '' };
  return { ...reader(options).document(root, top), prefixes: prefixesOf(root), base: top.base };
}

// The messages of an RDF Message Log in RDF/XML: an rdfm:MessageLog root
// whose rdf:RDF children are the messages, each with its own blank nodes.
// Namespaces, base, language and direction on the log apply to them all.
// https://w3c-cg.github.io/rsp/spec/messages#rdf-xml
const RDFM = 'https://w3c-cg.github.io/rsp/spec/messages#';
export function parseRdfXmlMessages(source, options) {
  const root = parseXml(source);
  if (root.ns !== RDFM || root.local !== 'MessageLog') throw new SyntaxError('an RDF/XML message log has an rdfm:MessageLog root');
  const top = { base: options.base ? options.base.replace(/#.*$/, '') : null, lang: '', dir: '', version: '' };
  const { context } = reader(options).contextOf(root, top);
  const messages = [];
  for (const child of root.children) {
    if (child.type === 'text' && /\S/.test(child.value)) throw new SyntaxError('an RDF/XML message log holds only rdf:RDF elements');
    if (child.type !== 'element') continue;
    if (child.ns !== RDF || child.local !== 'RDF') throw new SyntaxError(`an RDF/XML message log holds rdf:RDF elements, not <${child.name}>`);
    const scope = `${options.scope ?? 'messages'}#message${messages.length + 1}`;
    messages.push({ ...reader({ ...options, scope }).document(child, context), prefixes: prefixesOf(root), base: context.base, index: messages.length + 1 });
  }
  return messages;
}

function reader({ scope = 'rdf', graph, literal }) {
  const out = [];
  const ids = new Set();
  let blanks = 0;
  const fail = (message) => { throw new SyntaxError(message); };
  const fresh = () => st('bnode', scope, String(++blanks));
  const node = (id) => {
    if (!isNcName(id)) fail(`rdf:nodeID "${id}" is not an XML name`);
    return st('bnode', scope, id);
  };
  const resolve = (ref, context) => iri(resolveIriRef(ref, context.base ?? ''));
  const emit = (s, p, o, target = out) => target.push([s, p, o, graph]);
  const rdf = (local) => iri(RDF + local);

  // An element's context: base, language, direction and RDF version,
  // inherited, and its attributes without the XML and ITS ones. Text
  // direction (its:dir) needs an RDF version of 1.2 or later in scope.
  const contextOf = (element, parent) => {
    const context = { base: parent.base, lang: parent.lang, dir: parent.dir, version: parent.version };
    const attrs = new Map();
    const version = element.attrs.find((a) => a.local === 'version' && (a.ns === RDF || !a.ns));
    if (version) context.version = version.value;
    for (const a of element.attrs) {
      if (a.ns === XML) {
        if (a.local === 'base') context.base = resolveIriRef(a.value, parent.base ?? '').replace(/#.*$/, '');
        else if (a.local === 'lang') context.lang = a.value.toLowerCase();
      } else if (a.ns === ITS) {
        if (a.local === 'dir' && rdf12(context)) {
          if (!['ltr', 'rtl', ''].includes(a.value)) fail(`its:dir is ltr or rtl, not "${a.value}"`);
          context.dir = a.value;
        }
      } else if (!a.ns && /^xml/i.test(a.local)) {
        // Names starting with xml are reserved by XML and ignored here.
      } else if (!a.ns) {
        if (!UNQUALIFIED.has(a.local)) fail(`the attribute ${a.name} has no namespace`);
        attrs.set(RDF + a.local, a.value);
      } else attrs.set(a.ns + a.local, a.value);
    }
    attrs.delete(`${RDF}version`);
    return { context, attrs };
  };
  const textOf = (element) => element.children.filter((c) => c.type === 'text').map((c) => c.value).join('');
  const elements = (element) => {
    const found = element.children.filter((c) => c.type === 'element');
    if (found.length && /\S/.test(textOf(element))) fail(`<${element.name}> mixes text and elements`);
    return found;
  };
  const plain = (value, context) => literal(value, context.lang ? { lang: context.lang, dir: context.dir } : null, null);
  const idOf = (value, context) => {
    if (!isNcName(value)) fail(`rdf:ID "${value}" is not an XML name`);
    const id = resolveIriRef(`#${value}`, context.base ?? '');
    if (ids.has(id)) fail(`rdf:ID "${value}" is used twice with one base`);
    ids.add(id);
    return iri(id);
  };

  // A node element: its subject, type and property attributes, then its
  // property elements. Returns the subject.
  const nodeElement = (element, parent, target = out) => {
    const name = element.ns + element.local;
    if (name.startsWith(RDF) && (CORE.has(element.local) || OLD.has(element.local) || element.local === 'li')) {
      fail(`rdf:${element.local} cannot name a node element`);
    }
    const { context, attrs } = contextOf(element, parent);
    const ways = [`${RDF}ID`, `${RDF}about`, `${RDF}nodeID`].filter((k) => attrs.has(k));
    if (ways.length > 1) fail(`<${element.name}> has more than one of rdf:ID, rdf:about and rdf:nodeID`);
    let subject;
    if (attrs.has(`${RDF}ID`)) subject = idOf(attrs.get(`${RDF}ID`), context);
    else if (attrs.has(`${RDF}about`)) subject = resolve(attrs.get(`${RDF}about`), context);
    else if (attrs.has(`${RDF}nodeID`)) subject = node(attrs.get(`${RDF}nodeID`));
    else subject = fresh();
    for (const k of ways) attrs.delete(k);
    if (name !== `${RDF}Description`) emit(subject, rdf('type'), iri(name), target);
    propertyAttributes(subject, attrs, context, target);
    let li = 0;
    for (const child of elements(element)) li = propertyElement(child, subject, context, li, target);
    if (/\S/.test(textOf(element))) fail(`<${element.name}> has text, not property elements`);
    return subject;
  };

  // Property attributes of a node, or of the node an empty property element
  // makes: each is a triple with a literal object, rdf:type an IRI one.
  const propertyAttributes = (subject, attrs, context, target) => {
    for (const [name, value] of attrs) {
      if (name.startsWith(RDF) && (CORE.has(name.slice(RDF.length)) || OLD.has(name.slice(RDF.length)) || ['li', 'Description'].includes(name.slice(RDF.length)))) {
        fail(`rdf:${name.slice(RDF.length)} cannot be a property attribute here`);
      }
      if (name === `${RDF}type`) emit(subject, rdf('type'), resolve(value, context), target);
      else emit(subject, iri(name), plain(value, context), target);
    }
  };

  // The triples that an rdf:ID on a property element (reification) and an
  // annotation (a reifier of a triple term) add.
  const decorate = (s, p, o, attrs, context, target) => {
    if (attrs.has(`${RDF}ID`)) {
      const r = idOf(attrs.get(`${RDF}ID`), context);
      emit(r, rdf('type'), rdf('Statement'), target);
      emit(r, rdf('subject'), s, target);
      emit(r, rdf('predicate'), p, target);
      emit(r, rdf('object'), o, target);
    }
    if (attrs.has(`${RDF}annotation`) && attrs.has(`${RDF}annotationNodeID`)) fail('rdf:annotation and rdf:annotationNodeID cannot be used together');
    const reifier = attrs.has(`${RDF}annotation`) ? resolve(attrs.get(`${RDF}annotation`), context)
      : attrs.has(`${RDF}annotationNodeID`) ? node(attrs.get(`${RDF}annotationNodeID`)) : null;
    if (reifier) emit(reifier, rdf('reifies'), st('triple', s, p, o), target);
  };
  const only = (attrs, allowed, element) => {
    for (const name of attrs.keys()) {
      if (!name.startsWith(RDF) || !allowed.includes(name.slice(RDF.length))) fail(`<${element.name}> cannot have the attribute ${name.startsWith(RDF) ? `rdf:${name.slice(RDF.length)}` : name}`);
    }
  };

  // A property element of subject: one triple, and those of its object.
  // Returns the rdf:li counter of the subject's node element.
  const propertyElement = (element, subject, parent, li, target) => {
    let name = element.ns + element.local;
    if (name === `${RDF}li`) name = `${RDF}_${++li}`;
    else if (name.startsWith(RDF) && (CORE.has(element.local) || OLD.has(element.local) || element.local === 'Description')) {
      fail(`rdf:${element.local} cannot name a property element`);
    }
    const p = iri(name);
    const { context, attrs } = contextOf(element, parent);
    const children = elements(element);
    const decorations = ['ID', 'annotation', 'annotationNodeID'];
    const link = (object) => {
      emit(subject, p, object, target);
      decorate(subject, p, object, attrs, context, target);
      return li;
    };
    if (attrs.has(`${RDF}parseType`)) {
      const kind = attrs.get(`${RDF}parseType`);
      attrs.delete(`${RDF}parseType`);
      only(attrs, decorations, element);
      if (kind === 'Resource') {
        const object = fresh();
        link(object);
        let inner = 0;
        for (const child of children) inner = propertyElement(child, object, context, inner, target);
        return li;
      }
      if (kind === 'Collection') {
        const items = children.map((child) => nodeElement(child, context, target));
        const cells = items.map(() => fresh());
        items.forEach((item, i) => {
          emit(cells[i], rdf('first'), item, target);
          emit(cells[i], rdf('rest'), cells[i + 1] ?? rdf('nil'), target);
        });
        return link(cells[0] ?? rdf('nil'));
      }
      if (kind === 'Triple') {
        // Before RDF 1.2, a triple term is ignored.
        if (!rdf12(context)) return li;
        if (children.length !== 1) fail('rdf:parseType="Triple" holds one node element');
        const inner = [];
        nodeElement(children[0], context, inner);
        if (inner.length !== 1) fail('rdf:parseType="Triple" describes exactly one triple');
        return link(st('triple', ...inner[0].slice(0, 3)));
      }
      // Literal, and any other parse type, is an XML literal of the content.
      return link(literal(xmlLiteral(element), null, `${RDF}XMLLiteral`));
    }
    if (children.length) {
      if (children.length > 1) fail(`<${element.name}> holds more than one node element`);
      only(attrs, decorations, element);
      return link(nodeElement(children[0], context, target));
    }
    // A literal: text, or an empty element with only a datatype.
    const rest = new Map([...attrs].filter(([k]) => !(k.startsWith(RDF) && decorations.includes(k.slice(RDF.length)))));
    const value = textOf(element);
    if (value !== '' || (rest.size === 1 && rest.has(`${RDF}datatype`))) {
      only(attrs, [...decorations, 'datatype'], element);
      return link(attrs.has(`${RDF}datatype`) ? literal(value, null, resolveIriRef(attrs.get(`${RDF}datatype`), context.base ?? '')) : plain(value, context));
    }
    // An empty property element: an empty literal, or a resource that the
    // remaining attributes describe.
    if (rest.size === 0) return link(plain('', context));
    if (rest.has(`${RDF}resource`) && rest.has(`${RDF}nodeID`)) fail(`<${element.name}> has both rdf:resource and rdf:nodeID`);
    if (rest.has(`${RDF}datatype`)) fail(`<${element.name}> has rdf:datatype and resource attributes`);
    const object = rest.has(`${RDF}resource`) ? resolve(rest.get(`${RDF}resource`), context)
      : rest.has(`${RDF}nodeID`) ? node(rest.get(`${RDF}nodeID`)) : fresh();
    rest.delete(`${RDF}resource`);
    rest.delete(`${RDF}nodeID`);
    link(object);
    propertyAttributes(object, rest, context, target);
    return li;
  };

  // A document element: rdf:RDF with node elements, or one node element.
  const document = (root, top) => {
    if (root.ns === RDF && root.local === 'RDF') {
      const { context, attrs } = contextOf(root, top);
      if (attrs.size) fail(`rdf:RDF cannot have the attribute ${[...attrs.keys()][0]}`);
      for (const child of elements(root)) nodeElement(child, context);
      if (/\S/.test(textOf(root))) fail('rdf:RDF holds node elements, not text');
    } else nodeElement(root, top);
    return { quads: out };
  };
  return { document, contextOf };
}

function prefixesOf(root) {
  const out = {};
  for (const [name, ns] of Object.entries(root.declared)) if (name) out[name] = ns;
  return out;
}

// The content of an rdf:parseType="Literal" element in exclusive XML
// canonical form, with comments: each element declares the namespaces it and
// its attributes use that no output ancestor has declared alike.
// https://www.w3.org/TR/xml-exc-c14n/
function xmlLiteral(element) {
  const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r/g, '&#xD;');
  const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
    .replace(/\t/g, '&#x9;').replace(/\n/g, '&#xA;').replace(/\r/g, '&#xD;');
  const prefixOf = (name) => (name.includes(':') ? name.slice(0, name.indexOf(':')) : '');
  const write = (node, rendered) => {
    if (node.type === 'text') return escapeText(node.value);
    if (node.type === 'comment') return `<!--${node.value}-->`;
    if (node.type === 'pi') return `<?${node.target}${node.value ? ` ${node.value}` : ''}?>`;
    const used = new Map([[prefixOf(node.name), node.ns]]);
    for (const a of node.attrs) if (a.name.includes(':')) used.set(prefixOf(a.name), a.ns);
    const declarations = [];
    const inScope = new Map(rendered);
    for (const [prefix, ns] of used) {
      if (prefix === 'xml') continue;
      if ((rendered.get(prefix) ?? '') === ns && (prefix === '' ? true : rendered.has(prefix))) continue;
      if (prefix === '' && ns === '' && !rendered.get('')) continue;
      declarations.push([prefix, ns]);
      inScope.set(prefix, ns);
    }
    declarations.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const attrs = [...node.attrs].sort((a, b) => (a.ns === b.ns ? (a.local < b.local ? -1 : 1) : a.ns < b.ns ? -1 : 1));
    const open = `<${node.name}${declarations.map(([prefix, ns]) => ` ${prefix ? `xmlns:${prefix}` : 'xmlns'}="${escapeAttr(ns)}"`).join('')}` +
      `${attrs.map((a) => ` ${a.name}="${escapeAttr(a.value)}"`).join('')}>`;
    return open + node.children.map((child) => write(child, inScope)).join('') + `</${node.name}>`;
  };
  return element.children.map((child) => write(child, new Map())).join('');
}

// RDF/XML out: neutral quads (rdf.js) of the default graph as one rdf:RDF
// document, a node element per subject. RDF/XML has no named graphs and no
// triple term subjects; a predicate must end in an XML name to be written.
// A triple term object needs rdf:version="1.2", a text direction its:dir.
export function writeRdfXml(quads, prefixes = {}) {
  // Control characters are character references, which XML 1.1 allows.
  let xml11 = false;
  const escape = (s, attribute) => {
    if (/[\u0000\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(s)) {
      throw new SyntaxError('RDF/XML cannot write U+0000, U+FFFE, U+FFFF or a lone surrogate');
    }
    let out = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r/g, '&#xD;');
    if (attribute) out = out.replace(/"/g, '&quot;').replace(/\t/g, '&#x9;').replace(/\n/g, '&#xA;');
    return out.replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u0084\u0086-\u009F]/g, (c) => {
      xml11 ||= c < ' ';
      return `&#x${c.charCodeAt(0).toString(16).toUpperCase()};`;
    });
  };
  const namespaces = new Map([['rdf', RDF]]);
  for (const [name, ns] of Object.entries(prefixes)) if (/^[A-Za-z_][\w.-]*$/.test(name) && !/^xml/i.test(name) && name !== 'rdf') namespaces.set(name, ns);
  let rdf12 = false, its = false;
  const qname = (iri) => {
    for (const [name, ns] of namespaces) if (iri.startsWith(ns) && isNcName(iri.slice(ns.length))) return `${name}:${iri.slice(ns.length)}`;
    const m = /^(.*?)([A-Z_a-zÀ-�][\w.·À-�-]*)$/u.exec(iri);
    if (!m || !m[1] || !isNcName(m[2])) throw new SyntaxError(`RDF/XML cannot write the predicate ${iri}, which does not end in an XML name`);
    let name = `ns${namespaces.size}`;
    while (namespaces.has(name)) name += '_';
    namespaces.set(name, m[1]);
    return `${name}:${m[2]}`;
  };
  const subjectAttribute = (t) => (t.termType === 'blank' ? `rdf:nodeID="${escape(t.value, true)}"` : `rdf:about="${escape(t.value, true)}"`);
  const property = (p, o, indent) => {
    const name = qname(p.value);
    if (o.termType === 'iri') return `${indent}<${name} rdf:resource="${escape(o.value, true)}"/>`;
    if (o.termType === 'blank') return `${indent}<${name} rdf:nodeID="${escape(o.value, true)}"/>`;
    if (o.termType === 'triple') {
      rdf12 = true;
      if (o.subject.termType === 'triple') throw new SyntaxError('RDF/XML cannot write a triple term as a subject');
      return [`${indent}<${name} rdf:parseType="Triple">`, `${indent}  <rdf:Description ${subjectAttribute(o.subject)}>`,
        property(o.predicate, o.object, `${indent}    `), `${indent}  </rdf:Description>`, `${indent}</${name}>`].join('\n');
    }
    if (o.datatype === `${RDF}XMLLiteral` && isXmlContent(o.value)) return `${indent}<${name} rdf:parseType="Literal">${o.value}</${name}>`;
    let attributes = '';
    if (o.language) {
      attributes = ` xml:lang="${escape(o.language, true)}"`;
      if (o.direction) {
        rdf12 = its = true;
        attributes += ` its:dir="${o.direction}"`;
      }
    } else if (o.datatype && o.datatype !== 'http://www.w3.org/2001/XMLSchema#string') {
      attributes = ` rdf:datatype="${escape(o.datatype, true)}"`;
    }
    return `${indent}<${name}${attributes}>${escape(o.value, false)}</${name}>`;
  };
  const subjects = new Map();
  for (const [s, p, o, g] of quads) {
    if (g) throw new SyntaxError('RDF/XML has no named graphs; write TriG, N-Quads or JSON-LD');
    if (s.termType === 'triple') throw new SyntaxError('RDF/XML cannot write a triple term as a subject');
    const key = `${s.termType} ${s.value}`;
    if (!subjects.has(key)) subjects.set(key, [s, []]);
    subjects.get(key)[1].push(property(p, o, '    '));
  }
  const body = [...subjects.values()].map(([s, lines]) => [`  <rdf:Description ${subjectAttribute(s)}>`, ...lines, '  </rdf:Description>'].join('\n'));
  const declarations = [...namespaces].map(([name, ns]) => `xmlns:${name}="${escape(ns, true)}"`);
  if (its) declarations.push(`xmlns:its="${ITS}"`, 'its:version="2.0"');
  if (rdf12) declarations.push('rdf:version="1.2"');
  return `<?xml version="${xml11 ? '1.1' : '1.0'}" encoding="utf-8"?>\n<rdf:RDF ${declarations.join('\n         ')}>\n${body.map((b) => `${b}\n`).join('')}</rdf:RDF>\n`;
}
