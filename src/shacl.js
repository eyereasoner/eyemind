// SHACL Core shapes compile to separate LS predicates. Each dependency is
// explicit before LS stratification; a nested sh:not/or/node is not a test
// against an incompletely materialized generic conformance relation.
// https://www.w3.org/TR/shacl12-core/
import { EyemindError, Struct } from './terms.js';
import { write } from './writer.js';
import { RDF_DATATYPES } from './rdf-values.js';
import { NODE_COMMON, isIri, nodeExpressions } from './shacl-expr.js';

const SH = 'http://www.w3.org/ns/shacl#';
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const RDFS = 'http://www.w3.org/2000/01/rdf-schema#';
const XSD = 'http://www.w3.org/2001/XMLSchema#';
const uri = (u) => new Struct('iri', [u]);
const iri = (u) => write(uri(u));
const sh = (n) => iri(SH + n);
const NONE = "'sh_none'";
const TARGETS = ['targetNode', 'targetClass', 'targetSubjectsOf', 'targetObjectsOf', 'targetWhere'];
const CONSTRAINTS = ['class', 'datatype', 'nodeKind', 'minCount', 'maxCount', 'minExclusive', 'minInclusive',
  'maxExclusive', 'maxInclusive', 'minLength', 'maxLength', 'pattern', 'singleLine', 'languageIn', 'uniqueLang',
  'memberShape', 'minListLength', 'maxListLength', 'uniqueMembers', 'equals', 'disjoint', 'subsetOf', 'lessThan',
  'lessThanOrEquals', 'not', 'and', 'or', 'xone', 'node', 'property', 'someValue', 'qualifiedValueShape',
  'qualifiedMinCount', 'qualifiedMaxCount', 'qualifiedValueShapesDisjoint', 'reifierShape', 'reificationRequired',
  'closed', 'hasValue', 'in', 'rootClass', 'uniqueValuesFor', 'expression', 'nodeByExpression'];
const ANNOTATIONS = ['severity', 'message', 'deactivated', 'name', 'description', 'order', 'group', 'defaultValue', 'unit',
  'intent', 'agentInstruction', 'codeIdentifier', 'codeType', 'keyParameter', 'optional'];
const ALLOWED = new Set([...TARGETS, ...CONSTRAINTS, ...ANNOTATIONS, 'path', 'values', 'flags', 'ignoredProperties', 'condition']);
// Shape-expecting parameters, whose values are compiled as shapes and checked for recursion.
const SHAPE_PARAMETERS = ['node', 'not', 'qualifiedValueShape', 'property', 'memberShape', 'reifierShape', 'someValue', 'targetWhere', 'condition'];
const PATH_OPERATORS = ['inversePath', 'alternativePath', 'zeroOrMorePath', 'oneOrMorePath', 'zeroOrOnePath'];
// The default conformance-disallow set of SHACL 1.2.
const SHACL_DISALLOWS = ['Violation', 'Warning', 'Info'].map((n) => SH + n);
const literal = (t, datatype) => t instanceof Struct && t.name === 'literal' && t.args[1]?.name === 'datatype' && t.args[1].args[0] === datatype;
const BOOL = (t) => literal(t, XSD + 'boolean') && ['true', 'false', '1', '0'].includes(t.args[0]);
// Only the boolean true activates a constraint; the suite reads "1" as not true.
const TRUE = (t) => literal(t, XSD + 'boolean') && t.args[0] === 'true';
const resource = (t) => t instanceof Struct && ['iri', 'bnode', 'triple'].includes(t.name);
const typeNames = (types) => types.map((t) => t.args?.[0]);
const TRUE_TERM = `literal('true', datatype('${XSD}boolean'))`;

// needs collects the SPARQL library definitions that node expressions call;
// evaluate { expression, focus, scope } adds sh_evaluation(Result) for one
// node expression of the default graph.
export function compileShacl(quads, { disallows = SHACL_DISALLOWS, needs = new Set(), evaluate } = {}) {
  const graphs = new Map(), lines = [COMMON, NODE_COMMON], blocked = new Set(disallows);
  for (const severity of disallows) lines.push(`fact(sh_disallowed(${iri(severity)}));`);
  if (disallows.length !== SHACL_DISALLOWS.length || disallows.some((d) => !SHACL_DISALLOWS.includes(d)))
    lines.push('fact(sh_custom_disallows);');
  for (const [s, p, o, g] of quads) {
    const key = write(g);
    if (!graphs.has(key)) graphs.set(key, { graph: g, triples: [] });
    graphs.get(key).triples.push([s, p, o]);
  }
  let nextShape = 0, nextPath = 0, nextConstraint = 0, nextHelper = 0;
  let nextExpression = 0;
  const freshExpression = (kind) => `sh_expr_${kind}_${nextExpression++}`;
  for (const { graph, triples } of graphs.values()) {
    const G = write(graph), index = new Map(), terms = new Map(), reifiers = new Map();
    for (const [s, p, o] of triples) {
      const key = write(s);
      if (!index.has(key)) { index.set(key, new Map()); terms.set(key, s); }
      const properties = index.get(key), name = p.args[0];
      if (!properties.has(name)) properties.set(name, []);
      if (!properties.get(name).some((v) => write(v) === write(o))) properties.get(name).push(o);
      if (name === RDF + 'reifies' && o instanceof Struct && o.name === 'triple') {
        if (!reifiers.has(write(o))) reifiers.set(write(o), []);
        reifiers.get(write(o)).push(s);
      }
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
    // sh:class, sh:datatype, sh:nodeKind and sh:rootClass take an IRI or a list of IRIs.
    const iris = (s, property, t) => {
      const items = isIri(t) ? [t] : t.name === 'bnode' ? rdfList(t) : [];
      if (!items.length || !items.every(isIri)) error(s, `needs an IRI or a list of IRIs as sh:${property}`);
      return items;
    };
    const types = (s) => typeNames(values(s, RDF + 'type'));
    const isClass = (s) => types(s).some((t) => t === RDFS + 'Class' || t === SH + 'ShapeClass');
    const isNodeShape = (s) => types(s).some((t) => t === SH + 'NodeShape' || t === SH + 'ShapeClass');
    const shapes = new Map();
    const shape = (s, depth = 0) => {
      if (!resource(s)) error(s, 'is not a shape resource');
      const key = write(s);
      if (shapes.has(key)) return shapes.get(key);
      if (depth >= 128) error(s, 'has shape references nested beyond 128 levels');
      const node = { term: s, id: nextShape++, refs: [], properties: [], lists: new Map(), inactive: TRUE(one(s, 'deactivated')) };
      shapes.set(key, node);
      if (node.inactive) return node;
      for (const p of index.get(key)?.keys() ?? []) if (p.startsWith(SH) && !ALLOWED.has(p.slice(SH.length))) error(s, `uses unsupported SHACL feature <${p}>`);
      for (const p of SHAPE_PARAMETERS) for (const child of values(s, p)) {
        const target = shape(child, depth + 1); node.refs.push(target);
        if (p === 'property') node.properties.push(target);
      }
      // A focus node meets sh:condition when it conforms to every condition
      // shape; one that is a class also brings the node shapes of its
      // superclasses.
      node.conditions = [];
      for (const condition of values(s, 'condition')) {
        const seen = new Set(), pending = [condition];
        while (pending.length) {
          const t = pending.pop();
          if (seen.has(write(t))) continue;
          seen.add(write(t));
          if (write(t) === write(condition) || isNodeShape(t)) {
            const target = shape(t, depth + 1);
            node.conditions.push(target);
            if (!node.refs.includes(target)) node.refs.push(target);
          }
          if (isClass(t)) pending.push(...values(t, RDFS + 'subClassOf'));
        }
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
      if (p.args[0] === RDF + 'type' && [SH + 'NodeShape', SH + 'PropertyShape', SH + 'ShapeClass'].includes(o.args?.[0])) shape(s);
    }
    const checked = new Set(), checking = new Set();
    const acyclic = (node) => {
      if (checking.has(node.id)) error(node.term, 'has recursive shape dependencies; recursive SHACL validation is unsupported');
      if (checked.has(node.id)) return;
      checking.add(node.id); node.refs.forEach(acyclic); checking.delete(node.id); checked.add(node.id);
    };
    shapes.forEach(acyclic);
    // A shape whose conformance may consult shapes chosen at evaluation time
    // is dynamic. Dynamic dispatch (sh_conforms) lists only the other shapes,
    // so that negation stays stratified.
    const dynamics = new Map();
    const dynamic = (node) => {
      if (dynamics.has(node.id)) return dynamics.get(node.id);
      dynamics.set(node.id, false);
      const s = node.term, blank = (p) => values(s, p).some((t) => t instanceof Struct && t.name === 'bnode');
      const result = !node.inactive && (values(s, 'expression').length > 0 || values(s, 'nodeByExpression').length > 0 ||
        ['values', 'defaultValue', 'deactivated'].some(blank) || node.refs.some(dynamic));
      dynamics.set(node.id, result);
      return result;
    };
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
        const operators = PATH_OPERATORS.filter((op) => values(term, op).length);
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
    const expressions = nodeExpressions({ G, lines, needs, index, rdfList, path, error, fresh: freshExpression,
      conforms: (t) => `sh_ok_${shape(t).id}` });
    const expression = (t) => expressions.compile(t);
    // sh:closed sh:ByTypes permits, for each rdf:type T of a value node, the
    // properties that collectProperties(T) reaches in the shapes graph.
    let byTypes = null;
    const closedByTypes = () => {
      if (byTypes) return byTypes;
      byTypes = 'sh_by_types';
      const targeting = new Map();
      for (const [s, p, o] of triples) if (p.args[0] === SH + 'targetClass') {
        if (!targeting.has(write(o))) targeting.set(write(o), []);
        targeting.get(write(o)).push(s);
      }
      const collect = (s, out, seen) => {
        if (seen.has(write(s))) return;
        seen.add(write(s));
        for (const property of values(s, 'property')) for (const p of values(property, 'path')) if (isIri(p)) out.set(write(p), p);
        if (isClass(s)) {
          for (const o of values(s, RDFS + 'subClassOf')) collect(o, out, seen);
          for (const o of targeting.get(write(s)) ?? []) collect(o, out, seen);
        }
        if (isNodeShape(s)) for (const o of values(s, 'node')) collect(o, out, seen);
      };
      const candidates = new Map(terms);
      for (const [, , o] of triples) if (targeting.has(write(o))) candidates.set(write(o), o);
      for (const [key, s] of candidates) {
        if (!isIri(s)) continue;
        const out = new Map();
        collect(s, out, new Set());
        for (const p of out.keys()) lines.push(`fact(${byTypes}(${key}, ${p}, ${G}));`);
      }
      return byTypes;
    };
    for (const node of shapes.values()) {
      const { term: s, id, inactive } = node, S = write(s), v = `sh_values_${id}`, ok = `sh_ok_${id}`, bad = `sh_bad_${id}`;
      const issue = `sh_issue_${id}`, focus = `sh_focus_${id}`, target = `sh_target_${id}`;
      if (inactive) {
        lines.push(`fact(${ok}(_));`);
        if (isIri(s)) lines.push(`fact(sh_shape(${S}, ${G}));`, `implied_by(sh_conforms(${S}, X, ${G}), ${ok}(X));`);
        continue;
      }
      const p = one(s, 'path'), P = p ? write(p) : NONE;
      if (p && types(s).includes(SH + 'NodeShape')) error(s, 'is a NodeShape with sh:path');
      if (!p && types(s).includes(SH + 'PropertyShape')) error(s, 'is a PropertyShape without sh:path');
      if (p) lines.push(`implied_by(${v}(F, V), ${path(p)}(F, V));`);
      else lines.push(`fact(${v}(F, F));`);
      // sh:values adds the output nodes of its node expressions, and
      // sh:defaultValue supplies its own when there is no other value node.
      const produced = (property) => values(s, property).map((t) => {
        if (!p) error(s, `uses sh:${property} without a property path`);
        return expression(t);
      });
      const added = produced('values'), fallback = one(s, 'defaultValue');
      for (const e of added) lines.push(`implied_by(${v}(F, V), [${e}(F, [], nodes(L)), ent_member(V, L)]);`);
      if (fallback !== undefined) {
        const own = `sh_own_${id}`;
        lines.push(`implied_by(${own}(F), ${path(p)}(F, _));`);
        for (const e of added) lines.push(`implied_by(${own}(F), [${e}(F, [], nodes([_, ..._]))]);`);
        lines.push(`implied_by(${v}(F, V), [not(${own}(F)), ${produced('defaultValue')[0]}(F, [], nodes(L)), ent_member(V, L)]);`);
      }
      // A complex resultPath must remain interpretable in the standalone report.
      const describePath = (term, seen = new Set()) => {
        if (isIri(term) || seen.has(write(term))) return;
        seen.add(write(term));
        for (const [predicate, objects] of index.get(write(term)) ?? []) {
          if (![RDF + 'first', RDF + 'rest', ...PATH_OPERATORS.map((n) => SH + n)].includes(predicate)) continue;
          for (const object of objects) {
            lines.push(`fact(sh_path_statement(${P}, ${write(term)}, ${iri(predicate)}, ${write(object)}, ${G}));`);
            describePath(object, seen);
          }
        }
      };
      if (p) describePath(p);
      const integer = (property, t) => { if (typeof t !== 'bigint' || t < 0n) error(s, `needs a nonnegative integer sh:${property}`); return write(t); };
      const boolean = (property, t) => { if (!BOOL(t)) error(s, `needs a boolean sh:${property}`); return TRUE(t); };
      const requireIri = (property, t) => { if (!isIri(t)) error(s, `needs an IRI sh:${property}`); return write(t); };
      const severity = one(s, 'severity') ?? uri(SH + 'Violation');
      requireIri('severity', severity);
      const messages = values(s, 'message');
      for (const message of messages) if (!(message instanceof Struct && message.name === 'literal')) error(s, 'needs literal sh:message values');
      // A constraint is the set of triples of its parameters. Their reifiers
      // may deactivate it or give it its own severity and messages.
      const constraint = (...pairs) => {
        const annotations = pairs.flatMap(([property, t]) => reifiers.get(write(new Struct('triple', [s, uri(SH + property), t]))) ?? []);
        if (annotations.some((r) => TRUE(one(r, 'deactivated')))) return null;
        const own = annotations.flatMap((r) => values(r, 'severity')), texts = annotations.flatMap((r) => values(r, 'message'));
        if (own.length > 1) error(s, 'has multiple reified sh:severity values for one constraint');
        const level = own[0] ?? severity, cid = `'sh_c_${nextConstraint++}'`;
        requireIri('severity', level);
        lines.push(`fact(sh_constraint(${cid}, ${write(level)}));`);
        for (const message of texts.length ? texts : messages) lines.push(`fact(sh_constraint_message(${cid}, ${write(message)}));`);
        if (blocked.has(level.args[0])) lines.push(`fact(sh_blocking(${cid}));`);
        return cid;
      };
      const emit = (cid, body, component, value = 'V', resultPath = P, key = NONE) => {
        if (cid) lines.push(`implied_by(${issue}(F, ${resultPath}, ${value}, ${sh(component + 'ConstraintComponent')}, ${key}, ${cid}), [${body.join(', ')}]);`);
      };
      const each = (property, fn) => values(s, property).forEach((t) => fn(t, constraint([property, t])));
      const scalar = (property, fn) => { const t = one(s, property); if (t !== undefined) fn(t, constraint([property, t])); };
      const helper = (name) => `sh_${name}_${id}_${nextHelper++}`;
      // A deactivation expression decides for each focus node.
      const deactivated = one(s, 'deactivated'), guard = [];
      if (deactivated !== undefined && !BOOL(deactivated)) {
        lines.push(`implied_by(sh_inactive_${id}(F), ${expression(deactivated)}(F, [], nodes([${TRUE_TERM}])));`);
        guard.push(`not(sh_inactive_${id}(F))`);
      }
      for (const condition of node.conditions) guard.push(`sh_ok_${condition.id}(F)`);
      const all = (property, fn) => values(s, property).forEach(fn);
      all('targetNode', (t) => lines.push(t instanceof Struct && t.name === 'bnode' ?
        `implies([${expression(t)}('sh_none', [], nodes(L)), ent_member(T, L)], ${target}(T));` :
        `fact(${target}(${write(t)}), ent_node(${write(t)}, ${G}));`));
      all('targetClass', (t) => lines.push(`implies(sh_instance(F, ${requireIri('targetClass', t)}, ${G}), ${target}(F));`));
      all('targetSubjectsOf', (t) => lines.push(`implies([rdf(F, ${requireIri('targetSubjectsOf', t)}, _, ${G}), ent_resource(F)], ${target}(F));`));
      all('targetObjectsOf', (t) => lines.push(`implies([rdf(X, ${requireIri('targetObjectsOf', t)}, F, ${G}), ent_resource(X)], ${target}(F));`));
      all('targetWhere', (t) => lines.push(`implies([sh_graph_node(F, ${G}), sh_ok_${shape(t).id}(F)], ${target}(F));`));
      if (isClass(s)) {
        if (!isIri(s)) error(s, 'is a shape and a class but not an IRI');
        lines.push(`implies(sh_instance(F, ${S}, ${G}), ${target}(F));`);
      }
      if (isIri(s)) lines.push(`implies(rdf(F, ${sh('shape')}, ${S}, ${G}), ${target}(F));`);
      lines.push(`implies(${target}(F), ${focus}(F, 'sh_target'));`);
      each('class', (t, c) => {
        const member = helper('class');
        for (const type of iris(s, 'class', t)) lines.push(`implied_by(${member}(V), sh_instance(V, ${write(type)}, ${G}));`);
        emit(c, [`${v}(F, V)`, `not(${member}(V))`], 'Class', 'V', P, write(t));
      });
      scalar('datatype', (t, c) => {
        const member = helper('datatype');
        for (const type of iris(s, 'datatype', t)) lines.push(RDF_DATATYPES.has(type.args[0]) ?
          `implied_by(${member}(V), rv_valid_as(V, ${write(type)}));` :
          `fact(${member}(literal(_, datatype(${JSON.stringify(type.args[0])}))));`);
        emit(c, [`${v}(F, V)`, `not(${member}(V))`], 'Datatype');
      });
      scalar('nodeKind', (t, c) => {
        const kinds = iris(s, 'nodeKind', t), allowed = isIri(t) ? ['IRI', 'BlankNode', 'Literal', 'BlankNodeOrIRI', 'BlankNodeOrLiteral', 'IRIOrLiteral', 'TripleTerm'] : ['IRI', 'BlankNode', 'Literal', 'TripleTerm'];
        if (!kinds.every((k) => allowed.some((n) => k.args[0] === SH + n))) error(s, 'has an unsupported sh:nodeKind');
        const member = helper('kind');
        for (const kind of kinds) lines.push(`implied_by(${member}(V), sh_kind(V, ${write(kind)}));`);
        emit(c, [`${v}(F, V)`, `not(${member}(V))`], 'NodeKind');
      });
      const collected = [`findall_sorted(V, ${v}(F, V), Values)`, 'ent_count(Values, N)'];
      for (const [name, cmp] of [['minCount', 'lt'], ['maxCount', 'gt']]) scalar(name, (t, c) => {
        if (!p) error(s, `uses sh:${name} without a property path`);
        emit(c, [...collected, `${cmp}(N, ${integer(name, t)})`], name[0].toUpperCase() + name.slice(1), NONE);
      });
      for (const [name, signs] of [['minExclusive', ['>']], ['minInclusive', ['>', '=']], ['maxExclusive', ['<']], ['maxInclusive', ['<', '=']]]) scalar(name, (t, c) => {
        const pass = helper('bound');
        for (const sign of signs) lines.push(`implied_by(${pass}(V), rv_order(V, ${write(t)}, '${sign}'));`);
        emit(c, [`${v}(F, V)`, `not(${pass}(V))`], name[0].toUpperCase() + name.slice(1));
      });
      for (const [name, cmp] of [['minLength', 'lt'], ['maxLength', 'gt']]) scalar(name, (t, c) => {
        const limit = integer(name, t), pass = helper('length');
        lines.push(`implied_by(${pass}(V), [sh_string(V, Text), atom_length(Text, N), not(${cmp}(N, ${limit}))]);`);
        emit(c, [`${v}(F, V)`, `not(${pass}(V))`], name[0].toUpperCase() + name.slice(1));
      });
      scalar('pattern', (t, c) => {
        if (!literal(t, XSD + 'string')) error(s, 'needs an xsd:string sh:pattern');
        const flags = one(s, 'flags');
        if (flags && (!literal(flags, XSD + 'string') || /[^imsx]/.test(flags.args[0]))) error(s, 'has unsupported sh:flags');
        let expression = t.args[0];
        // The LS regex primitive uses ECMAScript Unicode syntax. Translate the
        // portable SHACL flags at compilation, without executing input patterns.
        const f = flags?.args[0] ?? '';
        // x drops whitespace and s lets a dot match newlines, outside classes.
        if (f.includes('x')) expression = rewritePattern(expression, (c) => /[ \t\r\n]/.test(c) ? '' : c);
        if (f.includes('s')) expression = rewritePattern(expression, (c) => c === '.' ? '[\\s\\S]' : c);
        if (f.includes('m')) error(s, 'uses sh:flags m, which is not supported by the LS regex primitive');
        if (f.includes('i')) expression = caseInsensitivePattern(expression);
        try { new RegExp(expression, 'u'); } catch { error(s, 'has an invalid or unsupported regular expression'); }
        emit(c, [`${v}(F, V)`, `not(sh_pattern(V, ${JSON.stringify(expression)}))`], 'Pattern');
      });
      scalar('singleLine', (t, c) => {
        if (boolean('singleLine', t)) emit(c, [`${v}(F, V)`, 'rv_literal(V)', 'sh_string(V, Text)', `regex_match(${JSON.stringify('[\n\u000b\f\r]')}, Text)`], 'SingleLine');
      });
      scalar('languageIn', (t, c) => {
        const allowed = helper('language');
        for (const tag of rdfList(t)) {
          if (!literal(tag, XSD + 'string')) error(s, 'needs strings in sh:languageIn');
          lines.push(`implied_by(${allowed}(V), [sh_language(V, L), sh_language_matches(L, ${JSON.stringify(tag.args[0].toLowerCase())})]);`);
        }
        emit(c, [`${v}(F, V)`, `not(${allowed}(V))`], 'LanguageIn');
      });
      scalar('uniqueLang', (t, c) => {
        if (!p) error(s, 'uses sh:uniqueLang without a property path');
        if (boolean('uniqueLang', t)) emit(c, [`${v}(F, V)`, `${v}(F, W)`, 'not_identical(V, W)', 'sh_language_key(V, L)', 'sh_language_key(W, L)'], 'UniqueLang', NONE, P, 'L');
      });
      // List constraints read SHACL lists of the data graph; any other value node is a result.
      const lists = (name, c, body) => {
        emit(c, [`${v}(F, V)`, `not(sh_list(V, _, ${G}))`], name);
        emit(c, [`${v}(F, V)`, `sh_list(V, Members, ${G})`, ...body], name);
      };
      each('memberShape', (t, c) => lists('MemberShape', c, ['ent_member(M, Members)', `not(sh_ok_${shape(t).id}(M))`]));
      for (const [name, cmp] of [['minListLength', 'lt'], ['maxListLength', 'gt']]) scalar(name, (t, c) =>
        lists(name[0].toUpperCase() + name.slice(1), c, ['ent_count(Members, N)', `${cmp}(N, ${integer(name, t)})`]));
      scalar('uniqueMembers', (t, c) => { if (boolean('uniqueMembers', t)) lists('UniqueMembers', c, ['sh_duplicate(Members)']); });
      scalar('in', (t, c) => {
        const allowed = helper('in');
        for (const item of rdfList(t)) lines.push(`fact(${allowed}(${write(item)}));`);
        emit(c, [`${v}(F, V)`, `not(${allowed}(V))`], 'In');
      });
      each('hasValue', (t, c) => emit(c, [`not(${v}(F, ${write(t)}))`], 'HasValue', NONE, P, write(t)));
      each('rootClass', (t, c) => {
        const member = helper('root');
        for (const root of iris(s, 'rootClass', t)) {
          lines.push(`fact(${member}(${write(root)}));`);
          lines.push(`implied_by(${member}(V), sh_subclass(V, ${write(root)}, ${G}));`);
        }
        emit(c, [`${v}(F, V)`, 'not(unify(V, iri(_)))'], 'RootClass', 'V', P, write(t));
        emit(c, [`${v}(F, V)`, 'unify(V, iri(_))', `not(${member}(V))`], 'RootClass', 'V', P, write(t));
      });
      // Property pairs compare the value nodes with the nodes of another path.
      for (const name of ['equals', 'disjoint', 'subsetOf', 'lessThan', 'lessThanOrEquals']) each(name, (t, c) => {
        const other = path(t), component = name[0].toUpperCase() + name.slice(1);
        if (name.startsWith('lessThan') && !p) error(s, `uses sh:${name} without a property path`);
        if (name === 'equals') {
          emit(c, [`${v}(F, V)`, `not(${other}(F, V))`], component, 'V', P, write(t));
          emit(c, [`${other}(F, V)`, `not(${v}(F, V))`], component, 'V', P, write(t));
        } else if (name === 'disjoint') emit(c, [`${v}(F, V)`, `${other}(F, V)`], component, 'V', P, write(t));
        else if (name === 'subsetOf') emit(c, [`${v}(F, V)`, `not(${other}(F, V))`], component, 'V', P, write(t));
        else {
          // Each value node and other node that do not compare is its own result.
          const ordered = helper('pair');
          lines.push(`implied_by(${ordered}(V, W), rv_order(V, W, '<'));`);
          if (name === 'lessThanOrEquals') lines.push(`implied_by(${ordered}(V, W), rv_order(V, W, '='));`);
          emit(c, [`${v}(F, V)`, `${other}(F, W)`, `not(${ordered}(V, W))`], component, 'V', P, `k(${write(t)}, W)`);
        }
      });
      for (const child of node.properties) {
        if (!child.inactive && !one(child.term, 'path')) error(child.term, 'is referenced by sh:property without sh:path');
        if (!constraint(['property', child.term])) continue;
        lines.push(`implied_by(${bad}(F), [${v}(F, V), not(sh_ok_${child.id}(V))${guard.map((g) => ', ' + g).join('')}]);`);
        if (!child.inactive) lines.push(`implies([${focus}(F, X), ${v}(F, V)${guard.map((g) => ', ' + g).join('')}], sh_focus_${child.id}(V, sh_via(${id}, F, X)));`);
      }
      each('node', (t, c) => emit(c, [`${v}(F, V)`, `not(sh_ok_${shape(t).id}(V))`], 'Node', 'V', P, write(t)));
      each('not', (t, c) => emit(c, [`${v}(F, V)`, `sh_ok_${shape(t).id}(V)`], 'Not', 'V', P, write(t)));
      each('someValue', (t, c) => {
        const some = helper('some');
        lines.push(`implied_by(${some}(F), [${v}(F, V), sh_ok_${shape(t).id}(V)]);`);
        emit(c, [`not(${some}(F))`], 'SomeValue', NONE, P, write(t));
      });
      for (const [name, children] of node.lists) {
        const c = constraint([name, one(s, name)]);
        if (name === 'and') for (const child of children) emit(c, [`${v}(F, V)`, `not(sh_ok_${child.id}(V))`], 'And');
        if (name === 'or') emit(c, [`${v}(F, V)`, ...children.map((child) => `not(sh_ok_${child.id}(V))`)], 'Or');
        if (name === 'xone') {
          const match = helper('xone');
          children.forEach((child, i) => lines.push(`implied_by(${match}(V, ${i}), sh_ok_${child.id}(V));`));
          emit(c, [`${v}(F, V)`, `findall_sorted(I, ${match}(V, I), Matches)`, 'ent_count(Matches, N)', 'ne(N, 1)'], 'Xone');
        }
      }
      const qualified = one(s, 'qualifiedValueShape');
      if (qualified) {
        const child = shape(qualified), match = helper('qualified'), siblings = new Map();
        const disjoint = one(s, 'qualifiedValueShapesDisjoint');
        if (disjoint && boolean('qualifiedValueShapesDisjoint', disjoint)) for (const parent of shapes.values()) if (parent.properties.includes(node)) {
          for (const sibling of parent.properties) if (sibling !== node) {
            const q = one(sibling.term, 'qualifiedValueShape');
            if (q && write(q) !== write(qualified)) siblings.set(write(q), shape(q));
          }
        }
        lines.push(`implied_by(${match}(F, V), [${v}(F, V), sh_ok_${child.id}(V)${[...siblings.values()].map((sib) => `, not(sh_ok_${sib.id}(V))`).join('')}]);`);
        for (const [name, cmp] of [['qualifiedMinCount', 'lt'], ['qualifiedMaxCount', 'gt']]) {
          const t = one(s, name);
          if (t === undefined) continue;
          if (!p) error(s, `uses sh:${name} without a property path`);
          emit(constraint(['qualifiedValueShape', qualified], [name, t]), [`findall_sorted(V, ${match}(F, V), Matches)`, 'ent_count(Matches, N)', `${cmp}(N, ${integer(name, t)})`], name[0].toUpperCase() + name.slice(1), NONE);
        }
      }
      // Each reifier of a value triple must conform; sh:reificationRequired needs one.
      each('reifierShape', (t, c) => {
        if (!p || !isIri(p)) error(s, 'uses sh:reifierShape without an IRI sh:path');
        emit(c, [`${v}(F, V)`, `rdf(R, ${iri(RDF + 'reifies')}, triple(F, ${P}, V), ${G})`, `not(sh_ok_${shape(t).id}(R))`], 'ReifierShape', 'V', P, 'R');
        const required = one(s, 'reificationRequired');
        if (required !== undefined && boolean('reificationRequired', required))
          emit(constraint(['reifierShape', t], ['reificationRequired', required]), [`${v}(F, V)`, `not(rdf(_, ${iri(RDF + 'reifies')}, triple(F, ${P}, V), ${G}))`], 'ReifierShape');
      });
      each('uniqueValuesFor', (t, c) => {
        const properties = isIri(t) ? [t] : rdfList(t);
        if (!properties.length || !properties.every(isIri)) error(s, 'needs an IRI or a list of IRIs as sh:uniqueValuesFor');
        const key = helper('key'), duplicate = helper('duplicate');
        lines.push(`implied_by(${key}(V, [${properties.map((_, i) => 'L' + i).join(', ')}]), [${properties.map((q, i) => `findall_sorted(X, rdf(V, ${write(q)}, X, ${G}), L${i})`).join(', ')}]);`);
        lines.push(`implied_by(${duplicate}(V), [${key}(V, K), not(unify(K, [${properties.map(() => '[]').join(', ')}])), ${target}(T), not_identical(T, V), ${key}(T, K)]);`);
        emit(c, [`${v}(F, V)`, `${duplicate}(V)`], 'UniqueValuesFor', NONE, P, 'V');
      });
      // sh:expression must give exactly true for each value node, bound to value.
      // A blank node expression is copied into the report as sh:sourceConstraint.
      const copy = (root, term = root, seen = new Set()) => {
        if (!(term instanceof Struct && term.name === 'bnode') || seen.has(write(term))) return;
        seen.add(write(term));
        for (const [predicate, objects] of index.get(write(term)) ?? []) for (const object of objects) {
          lines.push(`fact(sh_copy(${write(root)}, ${write(term)}, ${iri(predicate)}, ${write(object)}, ${G}));`);
          copy(root, object, seen);
        }
      };
      values(s, 'expression').forEach((t) => copy(t));
      each('expression', (t, c) => emit(c, [`${v}(F, V)`, `${expression(t)}(F, [['value', V]], R)`, `not(unify(R, nodes([${TRUE_TERM}])))`],
        'Expression', 'V', P, `source(${write(t)})`));
      each('nodeByExpression', (t, c) => emit(c, [`${v}(F, V)`, `${expression(t)}(V, [], nodes(L))`, 'ent_member(Shape, L)', `sh_shape(Shape, ${G})`, `not(sh_conforms(Shape, V, ${G}))`],
        'NodeByExpression', 'V', P, 'source(Shape)'));
      scalar('closed', (t, c) => {
        const types = isIri(t) && t.args[0] === SH + 'ByTypes';
        if (!types && !boolean('closed', t)) return;
        const allowed = helper('closed'), ignored = one(s, 'ignoredProperties');
        const predicates = [...(types ? [] : node.properties.map((child) => one(child.term, 'path')).filter(isIri)), ...(ignored ? rdfList(ignored) : [])];
        for (const property of predicates) lines.push(`fact(${allowed}(_, ${requireIri('ignoredProperties', property)}));`);
        if (types) {
          lines.push(`fact(${allowed}(_, ${iri(RDF + 'type')}));`);
          lines.push(`implied_by(${allowed}(X, P), [rdf(X, ${iri(RDF + 'type')}, T, ${G}), ${closedByTypes()}(T, P, ${G})]);`);
        }
        emit(c, [`${v}(F, X)`, 'ent_resource(X)', `rdf(X, Predicate, V, ${G})`, `not(${allowed}(X, Predicate))`], 'Closed', 'V', 'Predicate', 'X');
      });
      lines.push(`implied_by(${bad}(F), [${issue}(F, _, _, _, _, C), sh_blocking(C)${guard.map((g) => ', ' + g).join('')}]);`);
      lines.push(`implied_by(${ok}(F), not(${bad}(F)));`);
      lines.push(`implies([${focus}(F, X), ${issue}(F, P, V, C, K, I)${guard.map((g) => ', ' + g).join('')}], sh_violation(${S}, F, P, V, C, K, I, X, ${G}));`);
      if (isIri(s) && !dynamic(node)) lines.push(`fact(sh_shape(${S}, ${G}));`, `implied_by(sh_conforms(${S}, X, ${G}), ${ok}(X));`);
    }
    if (evaluate && G === "'default_graph'") {
      const scope = [...evaluate.scope ?? []].map(([k, t]) => `[${JSON.stringify(k)}, ${write(t)}]`);
      lines.push(`implied_by(sh_evaluation(R), ${expression(evaluate.expression)}(${evaluate.focus ? write(evaluate.focus) : "'sh_none'"}, [${scope.join(', ')}], R));`);
    }
  }
  return lines.join('\n') + '\n';
}

// Flag translation is deliberately conservative: unsupported regex syntax is
// rejected rather than changing a constraint's meaning silently. This
// rewrites each character of a pattern outside escapes and character classes.
function rewritePattern(pattern, rewrite) {
  let out = '', escaped = false, inClass = false;
  for (const c of pattern) {
    if (escaped) { out += '\\' + c; escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (c === '[') inClass = true;
    if (c === ']') inClass = false;
    out += inClass ? c : rewrite(c);
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
implies(rdf(C, iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), D, G), sh_subclass(C, D, G));
implies([sh_subclass(C, D, G), rdf(D, iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), E, G)], sh_subclass(C, E, G));
// The nodes of a data graph are its subjects and objects.
implies(rdf(S, _, O, G), [sh_graph_node(S, G), sh_graph_node(O, G)]);
fact(sh_kind(iri(_), iri(shN + 'IRI')));
fact(sh_kind(bnode(_, _), iri(shN + 'BlankNode')), sh_kind(skolem(_, _, _), iri(shN + 'BlankNode')));
fact(sh_kind(triple(_, _, _), iri(shN + 'TripleTerm')));
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
// sh:uniqueLang distinguishes a base direction as part of the language tag.
implied_by(sh_language_key(literal(_, lang(L)), Tag), atom_lower(L, Tag));
implied_by(sh_language_key(literal(_, lang(L, D)), tag(Tag, D)), atom_lower(L, Tag));
implied_by(sh_language_matches(L, '*'), ne(L, ''));
fact(sh_language_matches(L, L));
implied_by(sh_language_matches(L, Prefix), [atom_concat(Prefix, '-', P), atom_concat(P, _, L)]);
// SHACL lists grow from rdf:nil, so a cycle or a branching cell never forms one.
implies([ent_graph(G), not(rdf(iri(shR + 'nil'), iri(shR + 'first'), _, G)), not(rdf(iri(shR + 'nil'), iri(shR + 'rest'), _, G))], sh_list(iri(shR + 'nil'), [], G));
implies([sh_list(R, Members, G), rdf(L, iri(shR + 'rest'), R, G), ent_resource(L), findall(Y, rdf(L, iri(shR + 'rest'), Y, G), [_]),
  findall(X, rdf(L, iri(shR + 'first'), X, G), [X])], sh_list(L, [X, ...Members], G));
implied_by(sh_duplicate([X, ...T]), ent_member(X, T));
implied_by(sh_duplicate([_, ...T]), sh_duplicate(T));
fact(sh_blocking('sh_none'));
// One report per graph, with conformance decided from the completed results
// whose severity is in the conformance-disallow set.
implies(ent_graph(G), sh_report(Report, G));
implied_by(sh_any(G), [sh_violation(_, _, _, _, _, _, I, _, G), sh_constraint(I, Severity), sh_disallowed(Severity)]);
implies(sh_report(Report, G), ent_report(Report, iri(shR + 'type'), iri(shN + 'ValidationReport'), G));
implies([sh_report(Report, G), not(sh_any(G))], ent_report(Report, iri(shN + 'conforms'), literal('true', datatype(shX + 'boolean')), G));
implies([sh_report(Report, G), sh_any(G)], ent_report(Report, iri(shN + 'conforms'), literal('false', datatype(shX + 'boolean')), G));
implies([sh_report(Report, G), sh_custom_disallows, sh_disallowed(Severity)], ent_report(Report, iri(shN + 'conformanceDisallows'), Severity, G));
implies(sh_violation(S, F, P, V, C, K, I, X, G), sh_result(Result, S, F, P, V, C, K, I, X, G));
implies([sh_result(Result, S, F, P, V, C, K, I, X, G), sh_report(Report, G), sh_constraint(I, Severity)], [
  ent_report(Report, iri(shN + 'result'), Result, G), ent_report(Result, iri(shR + 'type'), iri(shN + 'ValidationResult'), G),
  ent_report(Result, iri(shN + 'focusNode'), F, G), ent_report(Result, iri(shN + 'sourceShape'), S, G),
  ent_report(Result, iri(shN + 'sourceConstraintComponent'), C, G), ent_report(Result, iri(shN + 'resultSeverity'), Severity, G)
]);
implies([sh_result(R, S, F, P, V, C, K, I, X, G), not_identical(P, 'sh_none')], ent_report(R, iri(shN + 'resultPath'), P, G));
implies([sh_result(R, S, F, P, V, C, K, I, X, G), not_identical(V, 'sh_none')], ent_report(R, iri(shN + 'value'), V, G));
implies([sh_result(R, S, F, P, V, C, K, I, X, G), sh_constraint_message(I, Message)], ent_report(R, iri(shN + 'resultMessage'), Message, G));
implies([sh_result(_, _, _, Path, _, _, _, _, _, G), sh_path_statement(Path, S, P, O, G)], ent_report(S, P, O, G));
implies(sh_result(R, _, _, _, _, _, source(T), _, _, G), ent_report(R, iri(shN + 'sourceConstraint'), T, G));
implies([sh_result(_, _, _, _, _, _, source(T), _, _, G), sh_copy(T, S, P, O, G)], ent_report(S, P, O, G));
`;
