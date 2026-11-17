// SHACL Core shapes compile to separate LS predicates. Each dependency is
// explicit before LS stratification; a nested sh:not/or/node is not a test
// against an incompletely materialized generic conformance relation.
// https://www.w3.org/TR/shacl/
import { EyemindError, Struct } from './terms.js';
import { write } from './writer.js';
import { RDF_DATATYPES } from './rdf-values.js';

const SH = 'http://www.w3.org/ns/shacl#';
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#';
const XSD = 'http://www.w3.org/2001/XMLSchema#';
const uri = (u) => new Struct('iri', [u]);
const iri = (u) => write(uri(u));
const sh = (n) => iri(SH + n);
const NONE = "'sh_none'";
const TARGETS = ['targetNode', 'targetClass', 'targetSubjectsOf', 'targetObjectsOf'];
const CONSTRAINTS = ['class', 'datatype', 'nodeKind', 'minCount', 'maxCount', 'minExclusive', 'minInclusive',
  'maxExclusive', 'maxInclusive', 'minLength', 'maxLength', 'pattern', 'languageIn', 'uniqueLang',
  'equals', 'disjoint', 'lessThan', 'lessThanOrEquals', 'not', 'and', 'or', 'xone', 'node', 'property',
  'qualifiedValueShape', 'qualifiedMinCount', 'qualifiedMaxCount', 'qualifiedValueShapesDisjoint', 'closed', 'hasValue', 'in'];
const ANNOTATIONS = ['severity', 'message', 'deactivated', 'name', 'description', 'order', 'group', 'defaultValue', 'unit'];
const ALLOWED = new Set([...TARGETS, ...CONSTRAINTS, ...ANNOTATIONS, 'path', 'flags', 'ignoredProperties']);
const BOOL = (t, v) => t instanceof Struct && t.name === 'literal' && t.args[1]?.name === 'datatype' &&
  t.args[1].args[0] === XSD + 'boolean' && (v ? ['true', '1'] : ['false', '0']).includes(t.args[0]);
const isIri = (t) => t instanceof Struct && t.name === 'iri';
const resource = (t) => t instanceof Struct && ['iri', 'bnode', 'triple'].includes(t.name);

export function compileShacl(quads) {
  const graphs = new Map(), lines = [COMMON];
  for (const [s, p, o, g] of quads) {
    const key = write(g);
    if (!graphs.has(key)) graphs.set(key, { graph: g, triples: [] });
    graphs.get(key).triples.push([s, p, o]);
  }
  let nextShape = 0, nextPath = 0;
  for (const { graph, triples } of graphs.values()) {
    const G = write(graph), index = new Map(), subjects = new Map();
    for (const [s, p, o] of triples) {
      const key = write(s);
      if (!index.has(key)) { index.set(key, new Map()); subjects.set(key, s); }
      const properties = index.get(key), name = p.args[0];
      if (!properties.has(name)) properties.set(name, []);
      if (!properties.get(name).some((v) => write(v) === write(o))) properties.get(name).push(o);
    }
    const values = (s, p) => index.get(write(s))?.get(p.startsWith('http') ? p : SH + p) ?? [];
    const error = (s, message) => { throw new EyemindError(`--shacl: ${write(s)} ${message}`); };
    const one = (s, p) => {
      const list = values(s, p);
      if (list.length > 1) error(s, `has multiple sh:${p} values`);
      return list[0];
    };
    const rdfList = (root) => {
      const items = [], seen = new Set();
      let at = root;
      while (write(at) !== iri(RDF + 'nil')) {
        if (seen.has(write(at))) error(root, 'contains a cyclic RDF list');
        seen.add(write(at));
        const first = values(at, RDF + 'first'), rest = values(at, RDF + 'rest');
        if (first.length !== 1 || rest.length !== 1) error(root, 'needs a well-formed RDF list');
        items.push(first[0]); at = rest[0];
      }
      return items;
    };
    const shapes = new Map();
    const shape = (s, depth = 0) => {
      if (!resource(s)) error(s, 'is not a shape resource');
      const key = write(s);
      if (shapes.has(key)) return shapes.get(key);
      if (depth >= 128) error(s, 'has shape references nested beyond 128 levels');
      const node = { term: s, id: nextShape++, refs: [], properties: [], lists: new Map(), inactive: BOOL(one(s, 'deactivated'), true) };
      shapes.set(key, node);
      if (node.inactive) return node;
      for (const p of index.get(key)?.keys() ?? []) if (p.startsWith(SH) && !ALLOWED.has(p.slice(SH.length))) error(s, `uses unsupported SHACL feature <${p}>`);
      for (const p of ['node', 'not', 'qualifiedValueShape', 'property']) for (const child of values(s, p)) {
        const target = shape(child, depth + 1); node.refs.push(target);
        if (p === 'property') node.properties.push(target);
      }
      for (const p of ['and', 'or', 'xone']) {
        const root = one(s, p);
        if (root) {
          const children = rdfList(root).map((child) => shape(child, depth + 1));
          node.lists.set(p, children); node.refs.push(...children);
        }
      }
      return node;
    };
    for (const [s, p, o] of triples) {
      if (p.args[0].startsWith(SH) && [...TARGETS, ...CONSTRAINTS, 'path'].includes(p.args[0].slice(SH.length))) shape(s);
      if (p.args[0] === RDF + 'type' && [SH + 'NodeShape', SH + 'PropertyShape'].includes(o.args?.[0])) shape(s);
    }
    const checked = new Set(), checking = new Set();
    const acyclic = (node) => {
      if (checking.has(node.id)) error(node.term, 'has recursive shape dependencies; recursive SHACL validation is unsupported');
      if (checked.has(node.id)) return;
      checking.add(node.id); node.refs.forEach(acyclic); checking.delete(node.id); checked.add(node.id);
    };
    shapes.forEach(acyclic);
    const paths = new Map(), parsing = new Set();
    const path = (term) => {
      const key = write(term);
      if (parsing.has(key)) error(term, 'has a cyclic SHACL path');
      if (paths.has(key)) return paths.get(key);
      if (parsing.size >= 128) error(term, 'has a SHACL path nested beyond 128 levels');
      parsing.add(key);
      const name = `sh_path_${nextPath++}`;
      if (isIri(term)) lines.push(`implies([rdf(X, ${write(term)}, Y, ${G}), ent_resource(X)], ${name}(X, Y));`);
      else {
        const operators = ['inversePath', 'alternativePath', 'zeroOrMorePath', 'oneOrMorePath', 'zeroOrOnePath'].filter((op) => values(term, op).length);
        if (values(term, RDF + 'first').length) {
          if (operators.length) error(term, 'mixes a sequence path with another path operator');
          const steps = rdfList(term);
          if (steps.length < 2) error(term, 'needs at least two members in a sequence path');
          const calls = steps.map((step, i) => `${path(step)}(${i ? 'V' + i : 'X'}, ${i === steps.length - 1 ? 'Y' : 'V' + (i + 1)})`);
          lines.push(`implies([${calls.join(', ')}], ${name}(X, Y));`);
        } else {
          if (operators.length !== 1) error(term, 'needs exactly one supported SHACL path operator');
          const op = operators[0], value = one(term, op);
          if (op === 'alternativePath') {
            const alternatives = rdfList(value);
            if (alternatives.length < 2) error(term, 'needs at least two alternative paths');
            for (const alternative of alternatives) lines.push(`implies(${path(alternative)}(X, Y), ${name}(X, Y));`);
          } else {
            const child = path(value);
            if (op === 'inversePath') lines.push(`implies(${child}(Y, X), ${name}(X, Y));`);
            else {
              if (op !== 'oneOrMorePath') lines.push(`implies(ent_node(X, ${G}), ${name}(X, X));`);
              lines.push(`implies(${child}(X, Y), ${name}(X, Y));`);
              if (op !== 'zeroOrOnePath') lines.push(`implies([${name}(X, M), ${child}(M, Y)], ${name}(X, Y));`);
            }
          }
        }
      }
      parsing.delete(key); paths.set(key, name); return name;
    };
    for (const node of shapes.values()) {
      const { term: s, id, inactive } = node, S = write(s), v = `sh_values_${id}`, ok = `sh_ok_${id}`, bad = `sh_bad_${id}`, issue = `sh_issue_${id}`, focus = `sh_focus_${id}`;
      if (inactive) { lines.push(`fact(${ok}(_));`); continue; }
      const p = one(s, 'path'), P = p ? write(p) : NONE;
      if (p && values(s, RDF + 'type').some((t) => t.args?.[0] === SH + 'NodeShape')) error(s, 'is a NodeShape with sh:path');
      if (!p && values(s, RDF + 'type').some((t) => t.args?.[0] === SH + 'PropertyShape')) error(s, 'is a PropertyShape without sh:path');
      lines.push(p ? `implied_by(${v}(F, V), ${path(p)}(F, V));` : `implied_by(${v}(F, F), ent_node(F, ${G}));`);
      // A complex resultPath must remain interpretable in the standalone report.
      const describePath = (term, seen = new Set()) => {
        if (isIri(term) || seen.has(write(term))) return;
        seen.add(write(term));
        for (const [predicate, objects] of index.get(write(term)) ?? []) {
          if (![RDF + 'first', RDF + 'rest', ...['inversePath', 'alternativePath', 'zeroOrMorePath', 'oneOrMorePath', 'zeroOrOnePath'].map((n) => SH + n)].includes(predicate)) continue;
          for (const object of objects) {
            lines.push(`fact(sh_path_statement(${P}, ${write(term)}, ${iri(predicate)}, ${write(object)}, ${G}));`);
            describePath(object, seen);
          }
        }
      };
      if (p) describePath(p);
      const emit = (body, component, value = 'V', resultPath = P, key = NONE) => lines.push(`implied_by(${issue}(F, ${resultPath}, ${value}, ${sh(component + 'ConstraintComponent')}, ${key}), [${body.join(', ')}]);`);
      const each = (property, fn) => values(s, property).forEach(fn);
      const scalar = (property, fn) => { const t = one(s, property); if (t !== undefined) fn(t); };
      const integer = (property, t) => { if (typeof t !== 'bigint' || t < 0n) error(s, `needs a nonnegative integer sh:${property}`); return write(t); };
      const boolean = (property, t) => { if (!BOOL(t, true) && !BOOL(t, false)) error(s, `needs a boolean sh:${property}`); return BOOL(t, true); };
      const requireIri = (property, t) => { if (!isIri(t)) error(s, `needs an IRI sh:${property}`); return write(t); };
      scalar('deactivated', (t) => boolean('deactivated', t));
      const severity = one(s, 'severity') ?? uri(SH + 'Violation');
      requireIri('severity', severity);
      lines.push(`fact(sh_severity(${S}, ${write(severity)}, ${G}));`);
      for (const message of values(s, 'message')) {
        if (!(message instanceof Struct && message.name === 'literal')) error(s, 'needs literal sh:message values');
        lines.push(`fact(sh_message(${S}, ${write(message)}, ${G}));`);
      }
      each('targetNode', (t) => lines.push(`fact(${focus}(${write(t)}));`));
      each('targetClass', (t) => lines.push(`implies(sh_instance(F, ${requireIri('targetClass', t)}, ${G}), ${focus}(F));`));
      each('targetSubjectsOf', (t) => lines.push(`implies([rdf(F, ${requireIri('targetSubjectsOf', t)}, _, ${G}), ent_resource(F)], ${focus}(F));`));
      each('targetObjectsOf', (t) => lines.push(`implies([rdf(X, ${requireIri('targetObjectsOf', t)}, F, ${G}), ent_resource(X)], ${focus}(F));`));
      if (values(s, RDF + 'type').some((t) => t.args?.[0] === RDFS + 'Class')) lines.push(`implies(sh_instance(F, ${S}, ${G}), ${focus}(F));`);
      each('class', (t) => emit([`${v}(F, V)`, `not(sh_instance(V, ${requireIri('class', t)}, ${G}))`], 'Class', 'V', P, write(t)));
      scalar('datatype', (t) => {
        requireIri('datatype', t);
        if (!RDF_DATATYPES.has(t.args[0])) error(s, `uses unsupported datatype ${write(t)}`);
        emit([`${v}(F, V)`, `not(rv_valid_as(V, ${write(t)}))`], 'Datatype');
      });
      scalar('nodeKind', (t) => {
        if (!['IRI', 'BlankNode', 'Literal', 'BlankNodeOrIRI', 'BlankNodeOrLiteral', 'IRIOrLiteral'].some((n) => t.args?.[0] === SH + n)) error(s, 'has an unsupported sh:nodeKind');
        emit([`${v}(F, V)`, `not(sh_kind(V, ${write(t)}))`], 'NodeKind');
      });
      const collected = [`findall_sorted(V, ${v}(F, V), Values)`, 'ent_count(Values, N)'];
      for (const [name, cmp] of [['minCount', 'lt'], ['maxCount', 'gt']]) scalar(name, (t) => {
        if (!p) error(s, `uses sh:${name} without a property path`);
        emit([...collected, `${cmp}(N, ${integer(name, t)})`], name[0].toUpperCase() + name.slice(1), NONE);
      });
      for (const [name, signs] of [['minExclusive', ['>']], ['minInclusive', ['>', '=']], ['maxExclusive', ['<']], ['maxInclusive', ['<', '=']]]) scalar(name, (t) => {
        const suffix = `sh_bound_${id}_${name}`;
        for (const sign of signs) lines.push(`implied_by(${suffix}(V), rv_order(V, ${write(t)}, '${sign}'));`);
        emit([`${v}(F, V)`, `not(${suffix}(V))`], name[0].toUpperCase() + name.slice(1));
      });
      for (const [name, cmp] of [['minLength', 'lt'], ['maxLength', 'gt']]) scalar(name, (t) => {
        const limit = integer(name, t), pass = `sh_length_${id}_${name}`;
        lines.push(`implied_by(${pass}(V), [sh_string(V, Text), atom_length(Text, N), not(${cmp}(N, ${limit}))]);`);
        emit([`${v}(F, V)`, `not(${pass}(V))`], name[0].toUpperCase() + name.slice(1));
      });
      scalar('pattern', (t) => {
        if (t.name !== 'literal' || t.args[1]?.args[0] !== XSD + 'string') error(s, 'needs an xsd:string sh:pattern');
        const flags = one(s, 'flags');
        if (flags && (flags.name !== 'literal' || flags.args[1]?.args[0] !== XSD + 'string' || /[^imsx]/.test(flags.args[0]))) error(s, 'has unsupported sh:flags');
        let expression = t.args[0];
        // The LS regex primitive uses ECMAScript Unicode syntax. Translate the
        // portable SHACL flags at compilation, without executing input patterns.
        const f = flags?.args[0] ?? '';
        if (f.includes('x')) expression = extendedPattern(expression);
        if (f.includes('s')) expression = dotAllPattern(expression);
        if (f.includes('m')) error(s, 'uses sh:flags m, which is not supported by the LS regex primitive');
        if (f.includes('i')) expression = caseInsensitivePattern(expression);
        try { new RegExp(expression, 'u'); } catch { error(s, 'has an invalid or unsupported regular expression'); }
        emit([`${v}(F, V)`, `not(sh_pattern(V, ${JSON.stringify(expression)}))`], 'Pattern');
      });
      scalar('languageIn', (t) => {
        const tags = rdfList(t);
        const allowed = `sh_language_${id}`;
        for (const tag of tags) {
          if (tag.name !== 'literal' || tag.args[1]?.args[0] !== XSD + 'string') error(s, 'needs strings in sh:languageIn');
          lines.push(`implied_by(${allowed}(V), [sh_language(V, L), sh_language_matches(L, ${JSON.stringify(tag.args[0].toLowerCase())})]);`);
        }
        emit([`${v}(F, V)`, `not(${allowed}(V))`], 'LanguageIn');
      });
      scalar('uniqueLang', (t) => {
        if (!p) error(s, 'uses sh:uniqueLang without a property path');
        if (boolean('uniqueLang', t)) emit([`${v}(F, V)`, `${v}(F, W)`, 'not_identical(V, W)', 'sh_language(V, L)', 'sh_language(W, L)'], 'UniqueLang', NONE, P, 'L');
      });
      scalar('in', (t) => {
        const allowed = `sh_in_${id}`;
        for (const item of rdfList(t)) lines.push(`fact(${allowed}(${write(item)}));`);
        emit([`${v}(F, V)`, `not(${allowed}(V))`], 'In');
      });
      each('hasValue', (t) => emit([`ent_node(F, ${G})`, `not(${v}(F, ${write(t)}))`], 'HasValue', NONE, P, write(t)));
      for (const name of ['equals', 'disjoint', 'lessThan', 'lessThanOrEquals']) scalar(name, (t) => {
        const other = requireIri(name, t), component = name[0].toUpperCase() + name.slice(1);
        if (name === 'equals') {
          emit([`${v}(F, V)`, `not(rdf(F, ${other}, V, ${G}))`], component);
          emit([`rdf(F, ${other}, V, ${G})`, `ent_resource(F)`, `not(${v}(F, V))`], component);
        } else if (name === 'disjoint') emit([`${v}(F, V)`, `rdf(F, ${other}, V, ${G})`], component);
        else {
          const ordered = `sh_pair_${id}_${name}`;
          lines.push(`implied_by(${ordered}(V, W), rv_order(V, W, '<'));`);
          if (name === 'lessThanOrEquals') lines.push(`implied_by(${ordered}(V, W), rv_order(V, W, '='));`);
          emit([`${v}(F, V)`, `rdf(F, ${other}, W, ${G})`, `not(${ordered}(V, W))`], component);
        }
      });
      for (const child of node.properties) {
        if (!child.inactive && !one(child.term, 'path')) error(child.term, 'is referenced by sh:property without sh:path');
        lines.push(`implied_by(${bad}(F), [${v}(F, V), not(sh_ok_${child.id}(V))]);`);
        if (!child.inactive) lines.push(`implies([${focus}(F), ${v}(F, V)], sh_focus_${child.id}(V));`);
      }
      each('node', (t) => emit([`${v}(F, V)`, `not(sh_ok_${shape(t).id}(V))`], 'Node', 'V', P, write(t)));
      each('not', (t) => emit([`${v}(F, V)`, `sh_ok_${shape(t).id}(V)`], 'Not', 'V', P, write(t)));
      for (const [name, children] of node.lists) {
        if (name === 'and') for (const child of children) emit([`${v}(F, V)`, `not(sh_ok_${child.id}(V))`], 'And');
        if (name === 'or') emit([`${v}(F, V)`, ...children.map((child) => `not(sh_ok_${child.id}(V))`)], 'Or');
        if (name === 'xone') {
          const match = `sh_xone_${id}`;
          children.forEach((child, i) => lines.push(`implied_by(${match}(V, ${i}), sh_ok_${child.id}(V));`));
          emit([`${v}(F, V)`, `findall_sorted(I, ${match}(V, I), Matches)`, 'ent_count(Matches, N)', 'ne(N, 1)'], 'Xone');
        }
      }
      const qualified = one(s, 'qualifiedValueShape');
      if (qualified) {
        const child = shape(qualified), match = `sh_qualified_${id}`, siblings = new Map();
        const disjoint = one(s, 'qualifiedValueShapesDisjoint');
        if (disjoint && boolean('qualifiedValueShapesDisjoint', disjoint)) for (const parent of shapes.values()) if (parent.properties.includes(node)) {
          for (const sibling of parent.properties) if (sibling !== node) {
            const q = one(sibling.term, 'qualifiedValueShape');
            if (q && write(q) !== write(qualified)) siblings.set(write(q), shape(q));
          }
        }
        lines.push(`implied_by(${match}(F, V), [${v}(F, V), sh_ok_${child.id}(V)${[...siblings.values()].map((sib) => `, not(sh_ok_${sib.id}(V))`).join('')}]);`);
        for (const [name, cmp] of [['qualifiedMinCount', 'lt'], ['qualifiedMaxCount', 'gt']]) scalar(name, (t) => {
          if (!p) error(s, `uses sh:${name} without a property path`);
          emit([`findall_sorted(V, ${match}(F, V), Matches)`, 'ent_count(Matches, N)', `${cmp}(N, ${integer(name, t)})`], name[0].toUpperCase() + name.slice(1), NONE);
        });
      } else if (one(s, 'qualifiedMinCount') !== undefined || one(s, 'qualifiedMaxCount') !== undefined) error(s, 'has qualified counts without sh:qualifiedValueShape');
      scalar('closed', (t) => {
        if (!boolean('closed', t)) return;
        const allowed = `sh_closed_${id}`, ignored = one(s, 'ignoredProperties');
        const predicates = [...node.properties.map((child) => one(child.term, 'path')).filter(isIri), ...(ignored ? rdfList(ignored) : [])];
        for (const property of predicates) lines.push(`fact(${allowed}(${requireIri('ignoredProperties', property)}));`);
        emit([`${v}(F, X)`, 'ent_resource(X)', `rdf(X, Predicate, V, ${G})`, `not(${allowed}(Predicate))`], 'Closed', 'V', 'Predicate', 'X');
      });
      lines.push(`implied_by(${bad}(F), ${issue}(F, _, _, _, _));`);
      lines.push(`implied_by(${ok}(F), not(${bad}(F)));`);
      lines.push(`implies([${focus}(F), ${issue}(F, P, V, C, K)], sh_violation(${S}, F, P, V, C, K, ${G}));`);
    }
  }
  return lines.join('\n') + '\n';
}

// Flag translation is deliberately conservative: unsupported regex syntax is
// rejected rather than changing a constraint's meaning silently.
function extendedPattern(pattern) {
  let out = '', escaped = false, inClass = false;
  for (const c of pattern) {
    if (escaped) { out += '\\' + c; escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (c === '[') inClass = true;
    if (c === ']') inClass = false;
    if (inClass || !/[ \t\r\n]/.test(c)) out += c;
  }
  return out + (escaped ? '\\' : '');
}

function dotAllPattern(pattern) {
  let out = '', escaped = false, inClass = false;
  for (const c of pattern) {
    if (escaped) { out += '\\' + c; escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (c === '[') inClass = true;
    if (c === ']') inClass = false;
    out += c === '.' && !inClass ? '[\\s\\S]' : c;
  }
  return out + (escaped ? '\\' : '');
}

function caseInsensitivePattern(pattern) {
  // Expanding literals preserves LS's one regex primitive and its proof semantics.
  // Escaped character classes and non-ASCII case folding require a richer regex
  // operation; reject them instead of weakening a validation constraint.
  if (/[^\x00-\x7F]|\\[pPuxckK0-9]|\(\?(?!:)/.test(pattern)) throw new EyemindError('--shacl: sh:flags i supports ASCII literals and character classes only');
  let out = '', escaped = false, inClass = false;
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (escaped) { out += '\\' + c; escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (c === '[') inClass = true;
    if (c === ']') inClass = false;
    if (/[A-Za-z]/.test(c)) {
      if (inClass && pattern[i + 1] === '-' && /[A-Za-z]/.test(pattern[i + 2] ?? '')) {
        const end = pattern[i + 2]; out += c + '-' + end + (c === c.toLowerCase() ? c.toUpperCase() + '-' + end.toUpperCase() : c.toLowerCase() + '-' + end.toLowerCase()); i += 2;
      } else out += inClass ? c.toLowerCase() + c.toUpperCase() : '[' + c.toLowerCase() + c.toUpperCase() + ']';
    } else out += c;
  }
  return out + (escaped ? '\\' : '');
}

const COMMON = String.raw`
const shN = 'http://www.w3.org/ns/shacl#';
const shR = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const shX = 'http://www.w3.org/2001/XMLSchema#';
implies([rdf(X, iri(shR + 'type'), C, G), ent_resource(X)], sh_instance(X, C, G));
implies([sh_instance(X, C, G), rdf(C, iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), D, G)], sh_instance(X, D, G));
fact(sh_kind(iri(_), iri(shN + 'IRI')));
fact(sh_kind(bnode(_, _), iri(shN + 'BlankNode')), sh_kind(skolem(_, _, _), iri(shN + 'BlankNode')));
implied_by(sh_kind(T, iri(shN + 'Literal')), rv_literal(T));
for (const [kind, left, right] of [['BlankNodeOrIRI', 'BlankNode', 'IRI'], ['BlankNodeOrLiteral', 'BlankNode', 'Literal'], ['IRIOrLiteral', 'IRI', 'Literal']]) {
  implied_by(sh_kind(T, iri(shN + kind)), sh_kind(T, iri(shN + left)));
  implied_by(sh_kind(T, iri(shN + kind)), sh_kind(T, iri(shN + right)));
}
fact(sh_string(iri(S), S));
implied_by(sh_string(T, S), [rv_literal(T), srl_str(T, literal(S, datatype(shX + 'string')))]);
implied_by(sh_pattern(T, Pattern), [sh_string(T, Text), regex_match(Pattern, Text)]);
implied_by(sh_language(literal(_, lang(L)), Tag), atom_lower(L, Tag));
implied_by(sh_language(literal(_, lang(L, _)), Tag), atom_lower(L, Tag));
implied_by(sh_language_matches(L, '*'), ne(L, ''));
fact(sh_language_matches(L, L));
implied_by(sh_language_matches(L, Prefix), [atom_concat(Prefix, '-', P), atom_concat(P, _, L)]);
// One report per graph, with conformance decided from the completed violation set.
implies(ent_graph(G), sh_report(Report, G));
implied_by(sh_any(G), sh_violation(_, _, _, _, _, _, G));
implies(sh_report(Report, G), ent_report(Report, iri(shR + 'type'), iri(shN + 'ValidationReport'), G));
implies([sh_report(Report, G), not(sh_any(G))], ent_report(Report, iri(shN + 'conforms'), literal('true', datatype(shX + 'boolean')), G));
implies([sh_report(Report, G), sh_any(G)], ent_report(Report, iri(shN + 'conforms'), literal('false', datatype(shX + 'boolean')), G));
implies(sh_violation(S, F, P, V, C, K, G), sh_result(Result, S, F, P, V, C, K, G));
implies([sh_result(Result, S, F, P, V, C, K, G), sh_report(Report, G), sh_severity(S, Severity, G)], [
  ent_report(Report, iri(shN + 'result'), Result, G), ent_report(Result, iri(shR + 'type'), iri(shN + 'ValidationResult'), G),
  ent_report(Result, iri(shN + 'focusNode'), F, G), ent_report(Result, iri(shN + 'sourceShape'), S, G),
  ent_report(Result, iri(shN + 'sourceConstraintComponent'), C, G), ent_report(Result, iri(shN + 'resultSeverity'), Severity, G)
]);
implies([sh_result(R, S, F, P, V, C, K, G), not_identical(P, 'sh_none')], ent_report(R, iri(shN + 'resultPath'), P, G));
implies([sh_result(R, S, F, P, V, C, K, G), not_identical(V, 'sh_none')], ent_report(R, iri(shN + 'value'), V, G));
implies([sh_result(R, S, F, P, V, C, K, G), sh_message(S, Message, G)], ent_report(R, iri(shN + 'resultMessage'), Message, G));
implies([sh_result(_, _, _, Path, _, _, _, G), sh_path_statement(Path, S, P, O, G)], ent_report(S, P, O, G));
`;
