// SHACL 1.2 node expressions compile to LS backward rules. An expression is a
// predicate E(Focus, Scope, Result): Focus is a node or 'sh_none', Scope a
// list of [Key, Value] pairs, and Result either nodes(List), the ordered
// output nodes, or failure, an evaluation failure. Every expression has
// exactly one result, so an enclosing expression decides from it whether to
// propagate a failure, as the specification requires.
// https://www.w3.org/TR/shacl12-node-expr/
import { EyemindError, Struct } from './terms.js';
import { write } from './writer.js';
import { DEFINITIONS } from './srl-functions.js';

const SH = 'http://www.w3.org/ns/shacl#';
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const XSD = 'http://www.w3.org/2001/XMLSchema#';
const SHNEX = 'http://www.w3.org/ns/shacl-node-expr#';
export const SPARQL = 'http://www.w3.org/ns/sparql#';
const TRUE = `literal('true', datatype('${XSD}boolean'))`;
const FALSE = `literal('false', datatype('${XSD}boolean'))`;
export const isIri = (t) => t instanceof Struct && t.name === 'iri';
const isBlank = (t) => t instanceof Struct && t.name === 'bnode';

// sparql:<name> to its SRL function goal and the library definition it needs.
const FUNCTIONS = {
  abs: ['srl_abs'], ceil: ['srl_ceil', 'srl_abs'], floor: ['srl_floor', 'srl_abs'], round: ['srl_round', 'srl_abs'],
  concat: ['srl_concat'], contains: ['srl_contains', 'srl_strstarts'], datatype: ['srl_datatype'],
  day: ['srl_day', 'srl_datetime'], divide: ['srl_div'], 'encode-for-uri': ['srl_encode_for_uri'],
  equals: ['srl_eq'], 'not-equals': ['srl_ne'], 'greater-than': ['srl_gt', 'srl_order'],
  'greater-than-or-equal': ['srl_ge', 'srl_order'], 'less-than': ['srl_lt', 'srl_order'],
  'less-than-or-equal': ['srl_le', 'srl_order'], hasLang: ['srl_has_lang', 'srl_kind_tests'],
  hasLangdir: ['srl_has_langdir', 'srl_kind_tests'], hours: ['srl_hours', 'srl_datetime'], iri: ['srl_iri'],
  uri: ['srl_iri'], isBlank: ['srl_is_blank', 'srl_kind_tests'], isIRI: ['srl_is_iri', 'srl_kind_tests'],
  isURI: ['srl_is_iri', 'srl_kind_tests'], isLiteral: ['srl_is_literal', 'srl_kind_tests'],
  isNumeric: ['srl_is_numeric', 'srl_kind_tests'], isTriple: ['srl_is_triple', 'srl_kind_tests'],
  lang: ['srl_lang'], langdir: ['srl_langdir', 'srl_lang'], langMatches: ['srl_langmatches'],
  lcase: ['srl_lcase', 'srl_ucase'], ucase: ['srl_ucase'], 'logical-not': ['srl_not'], minutes: ['srl_minutes', 'srl_datetime'],
  month: ['srl_month', 'srl_datetime'], multiply: ['srl_mul'], plus: ['srl_add'], subtract: ['srl_sub'],
  'unary-minus': ['srl_neg'], 'unary-plus': ['srl_pos', 'srl_neg'], now: ['srl_now'], object: ['srl_object', 'srl_triple'],
  predicate: ['srl_predicate', 'srl_triple'], subject: ['srl_subject', 'srl_triple'], triple: ['srl_triple'],
  regex: ['srl_regex'], replace: ['srl_replace'], sameTerm: ['srl_same_term'], seconds: ['srl_seconds', 'srl_datetime'],
  str: ['srl_str'], strafter: ['srl_strafter', 'srl_strbefore'], strbefore: ['srl_strbefore'], strdt: ['srl_strdt'],
  strends: ['srl_strends', 'srl_strstarts'], strlang: ['srl_strlang'], strlangdir: ['srl_strlangdir', 'srl_strlang'],
  strlen: ['srl_strlen'], strstarts: ['srl_strstarts'], substr: ['srl_substr'], timezone: ['srl_timezone', 'srl_datetime'],
  tz: ['srl_tz', 'srl_datetime'], year: ['srl_year', 'srl_datetime'],
  md5: ['sh_ne_md5'], sha1: ['sh_ne_sha1'], sha256: ['sh_ne_sha256'], sha384: ['sh_ne_sha384'], sha512: ['sh_ne_sha512'],
  sameValue: ['sh_ne_same_value', 'srl_equal'], rand: ['sh_ne_rand'], uuid: ['sh_ne_uuid', 'srl_uuid'],
  struuid: ['sh_ne_struuid', 'srl_uuid'], bnode: ['sh_ne_bnode'],
};
// Functions that receive unbound arguments and errors themselves.
const UNBOUND = new Set(['bound', 'coalesce', 'if', 'logical-and', 'logical-or']);
// Execution functions read the captured clock and seed.
const EXECUTION = new Set(['now', 'rand', 'uuid', 'struuid', 'bnode']);
// Built-in named parameter functions by their key parameter.
const NAMED = ['var', 'pathValues', 'exists', 'if', 'distinct', 'intersection', 'concat', 'remove', 'filterShape', 'limit',
  'offset', 'orderBy', 'flatMap', 'findFirst', 'matchAll', 'count', 'min', 'max', 'sum', 'instancesOf', 'nodesMatching', 'arg'];

// The expressions of one graph. The shapes compiler supplies its graph
// access, its paths and the conformance predicates of its shapes.
export function nodeExpressions({ G, lines, needs, index, rdfList, path, conforms, error, fresh }) {
  const memo = new Map(), compiling = new Set();
  // Custom functions declared in the shapes graph by sh:bodyExpression.
  const custom = { list: new Map(), named: new Map() };
  for (const [key, properties] of index) {
    const body = properties.get(SH + 'bodyExpression');
    if (!body) continue;
    const types = (properties.get(RDF + 'type') ?? []).map((t) => t.args?.[0]);
    if (body.length !== 1) throw new EyemindError(`--shacl: ${key} needs one sh:bodyExpression`);
    if (types.includes(SH + 'ListParameterExpressionFunction')) custom.list.set(key, body[0]);
    else if (types.includes(SH + 'NamedParameterExpressionFunction')) {
      const parameters = (properties.get(SH + 'parameter') ?? []).map((p) => {
        const paths = index.get(write(p))?.get(SH + 'path') ?? [];
        if (paths.length !== 1 || !isIri(paths[0])) throw new EyemindError(`--shacl: ${key} declares a parameter without an IRI sh:path`);
        const flag = index.get(write(p))?.get(SH + 'keyParameter')?.[0];
        return { path: paths[0].args[0], key: flag?.args?.[0] === 'true' };
      });
      for (const p of parameters.filter((q) => q.key)) custom.named.set(p.path, { body: body[0], parameters });
    }
  }
  const properties = (t) => index.get(write(t)) ?? new Map();
  const single = (t, p) => {
    const list = properties(t).get(p) ?? [];
    if (list.length > 1) error(t, `has multiple <${p}> values`);
    return list[0];
  };
  // The arguments of a list parameter function: a SHACL list, or one argument.
  const argumentsOf = (o) => (isIri(o) && o.args[0] === RDF + 'nil') || (isBlank(o) && properties(o).has(RDF + 'first')) ? rdfList(o) : [o];

  // compile(term, env) names the predicate of an expression; env maps the
  // parameters of an enclosing custom named function to their arguments.
  const compile = (term, env = null) => {
    const key = `${write(term)}|${env?.id ?? ''}`;
    if (memo.has(key)) return memo.get(key);
    if (compiling.has(key)) error(term, 'is a recursive node expression');
    compiling.add(key);
    const name = fresh('e');
    memo.set(key, name);
    const rule = (body, result = 'R') => lines.push(`implied_by(${name}(F, S, ${result}), [${body.join(', ')}]);`);
    const own = properties(term);
    if (!isBlank(term)) lines.push(`fact(${name}(_, _, nodes([${write(term)}])));`);
    else if (!own.size) lines.push(`fact(${name}(_, _, nodes([])));`);
    else if (own.has(RDF + 'first')) lines.push(`fact(${name}(_, _, nodes([${rdfList(term).map((t) => write(t)).join(', ')}])));`);
    else {
      const named = NAMED.filter((n) => own.has(SHNEX + n));
      const listed = [...own.keys()].filter((p) => p === SHNEX + 'conformsToShape' || p.startsWith(SPARQL) || custom.list.has(write(new Struct('iri', [p]))));
      const keyed = [...own.keys()].filter((p) => custom.named.has(p));
      if (named.length + listed.length + keyed.length !== 1)
        error(term, named.length + listed.length + keyed.length ? 'mixes the key parameters of several node expression functions' : 'is not a supported node expression');
      const sub = (p, fallback) => {
        const t = single(term, SHNEX + p);
        return t === undefined ? fallback : compile(t, env);
      };
      // Input nodes: shnex:nodes when given, otherwise the focus node.
      const input = (required) => {
        const nodes = single(term, SHNEX + 'nodes');
        if (nodes === undefined) {
          if (required) error(term, 'needs shnex:nodes');
          return 'sh_ne_focus_nodes(F, R0)';
        }
        return `${compile(nodes, env)}(F, S, R0)`;
      };
      const integer = (p) => {
        const t = single(term, SHNEX + p);
        if (typeof t !== 'bigint' || t < 0n) error(term, `needs a nonnegative integer shnex:${p}`);
        return write(t);
      };
      if (named.length) {
        const fn = named[0];
        switch (fn) {
          case 'var': {
            const v = single(term, SHNEX + 'var');
            if (!(v instanceof Struct && v.name === 'literal' && typeof v.args[0] === 'string' && v.args[0])) error(term, 'needs a nonempty string shnex:var');
            rule([`sh_ne_var(${JSON.stringify(v.args[0])}, F, S, R)`]);
            break;
          }
          case 'arg': {
            const a = single(term, SHNEX + 'arg');
            if (typeof a === 'bigint') rule([`sh_ne_var(${write(a)}, 'sh_none', S, R)`]);
            else if (isIri(a) && env?.args.has(a.args[0])) {
              const argument = env.args.get(a.args[0]);
              rule([`${compile(argument.term, argument.env)}(F, [], R)`]);
            } else if (isIri(a)) lines.push(`fact(${name}(_, _, nodes([])));`);
            else error(term, 'needs an IRI or integer shnex:arg');
            break;
          }
          case 'pathValues': {
            const p = path(single(term, SHNEX + 'pathValues')), values = fresh('path');
            const focus = single(term, SHNEX + 'focusNode');
            rule([focus === undefined ? 'sh_ne_own_focus(F, N)' : `${compile(focus, env)}(F, S, R0), sh_ne_focus(R0, N)`, `${values}(N, R)`]);
            lines.push(`fact(${values}(failure, failure), ${values}(none, nodes([])));`);
            lines.push(`implied_by(${values}(one(X), nodes(L)), findall(Y, ${p}(X, Y), L));`);
            break;
          }
          case 'exists': rule([`${sub('exists')}(F, S, R0)`, 'sh_ne_exists(R0, R)']); break;
          case 'if': {
            const condition = sub('if'), then = sub('then', null), otherwise = sub('else', null);
            if (!then && !otherwise) error(term, 'needs shnex:then or shnex:else');
            const branch = (b) => b ? `${b}(F, S, R)` : 'unify(R, nodes([]))';
            rule([`${condition}(F, S, C)`, 'unify(C, failure)', 'unify(R, failure)']);
            rule([`${condition}(F, S, C)`, `unify(C, nodes([${TRUE}]))`, branch(then)]);
            rule([`${condition}(F, S, C)`, 'unify(C, nodes(L))', `not(unify(L, [${TRUE}]))`, branch(otherwise)]);
            break;
          }
          case 'distinct': rule([`${sub('distinct')}(F, S, R0)`, 'sh_ne_distinct(R0, R)']); break;
          case 'count': rule([`${sub('count')}(F, S, R0)`, 'sh_ne_count(R0, R)']); break;
          case 'min': case 'max': case 'sum':
            needs.add('srl_aggregates');
            rule([`${sub(fn)}(F, S, R0)`, `sh_ne_aggregate('${fn}', R0, R)`]);
            break;
          case 'intersection': case 'concat': {
            const members = rdfList(single(term, SHNEX + fn)).map((t) => compile(t, env));
            rule([...members.map((m, i) => `${m}(F, S, R${i})`), `sh_ne_all([${members.map((_, i) => 'R' + i).join(', ')}], A)`, `sh_ne_${fn}(A, R)`]);
            break;
          }
          case 'remove': rule([`${sub('remove')}(F, S, M)`, input(true), 'sh_ne_remove(M, R0, R)']); break;
          case 'limit': case 'offset': rule([input(true), `sh_ne_${fn}(R0, ${integer(fn)}, R)`]); break;
          case 'filterShape': case 'findFirst': case 'matchAll': {
            const filter = fresh('filter'), ok = conforms(single(term, SHNEX + fn));
            lines.push(`fact(${filter}([], []));`);
            lines.push(`implied_by(${filter}([X, ...T], [X, ...R]), [${ok}(X), ${filter}(T, R)]);`);
            lines.push(`implied_by(${filter}([X, ...T], R), [not(${ok}(X)), ${filter}(T, R)]);`);
            rule([input(fn === 'filterShape'), `sh_ne_${fn}(R0, ${filter}, R)`]);
            lines.push(`fact(sh_ne_${fn}(failure, ${filter}, failure));`);
            const kept = `${filter}(L, K)`;
            if (fn === 'filterShape') lines.push(`implied_by(sh_ne_filterShape(nodes(L), ${filter}, nodes(K)), ${kept});`);
            if (fn === 'findFirst') lines.push(`implied_by(sh_ne_findFirst(nodes(L), ${filter}, R), [${kept}, sh_ne_first(K, R)]);`);
            if (fn === 'matchAll') lines.push(`implied_by(sh_ne_matchAll(nodes(L), ${filter}, R), [${kept}, or([unify(L, K), unify(R, nodes([${TRUE}]))], [not(unify(L, K)), unify(R, nodes([${FALSE}]))])]);`);
            break;
          }
          case 'nodesMatching': {
            const ok = conforms(single(term, SHNEX + 'nodesMatching'));
            rule([`findall(X, [sh_graph_node(X, ${G}), ${ok}(X)], L)`, 'unify(R, nodes(L))']);
            break;
          }
          case 'instancesOf': rule([`${sub('instancesOf')}(F, S, R0)`, `once(sh_ne_instances(R0, ${G}, R))`]); break;
          case 'flatMap': case 'orderBy': {
            const each = fresh('each'), inner = sub(fn);
            if (fn === 'flatMap') {
              lines.push(`fact(${each}([], _, nodes([])));`);
              lines.push(`implied_by(${each}([N, ...T], S, R), [${inner}(N, S, R1), ${each}(T, S, R2), sh_ne_join(R1, R2, R)]);`);
              rule([input(false), `sh_ne_each(R0, ${each}, S, R)`]);
            } else {
              const desc = single(term, SHNEX + 'desc');
              lines.push(`fact(${each}([], _, pairs([])));`);
              lines.push(`implied_by(${each}([N, ...T], S, R), [${inner}(N, S, R1), ${each}(T, S, R2), sh_ne_keyed(N, R1, R2, R)]);`);
              needs.add('srl_aggregates');
              rule([input(true), `sh_ne_each(R0, ${each}, S, P)`, `sh_ne_sorted(P, ${desc?.args?.[0] === 'true' ? "'desc'" : "'asc'"}, R)`]);
            }
            lines.push(`fact(sh_ne_each(failure, ${each}, _, failure));`);
            lines.push(`implied_by(sh_ne_each(nodes(L), ${each}, S, R), ${each}(L, S, R));`);
            break;
          }
        }
      } else if (keyed.length) {
        // A custom named parameter function evaluates its body with the
        // argument expressions of this call bound to its parameters.
        const { body, parameters } = custom.named.get(keyed[0]);
        const args = new Map();
        for (const p of parameters) {
          const a = single(term, p.path);
          if (a !== undefined) args.set(p.path, { term: a, env });
        }
        rule([`${compile(body, { id: name, args })}(F, [], R)`]);
      } else {
        // A list parameter function evaluates each argument to one node,
        // none (unbound) or an error before it applies.
        const p = listed[0], fn = p.startsWith(SPARQL) ? p.slice(SPARQL.length) : null;
        const args = argumentsOf(single(term, p)).map((t) => compile(t, env));
        const evaluated = [...args.map((a, i) => `${a}(F, S, R${i}), sh_ne_arg(R${i}, A${i})`)];
        const list = `[${args.map((_, i) => 'A' + i).join(', ')}]`;
        if (p === SHNEX + 'conformsToShape') {
          if (args.length !== 2) error(term, 'needs two arguments for shnex:conformsToShape');
          rule([...evaluated, `sh_ne_status(${list}, T)`, `sh_ne_conforms(T, A0, A1, ${G}, R)`]);
        } else if (fn === null) {
          // A custom list parameter function: its body sees only its arguments.
          const body = compile(custom.list.get(write(new Struct('iri', [p]))));
          const scope = `[${args.map((_, i) => `[${i}, X${i}]`).join(', ')}]`;
          rule([...evaluated, `sh_ne_status(${list}, T)`, `sh_ne_custom(T, ${list}, ${scope}, ${body}, F, R)`]);
          lines.push(`fact(sh_ne_custom('error', _, _, ${body}, _, failure), sh_ne_custom('unbound', _, _, ${body}, _, nodes([])));`);
          lines.push(`implied_by(sh_ne_custom('ok', [${args.map((_, i) => `v(X${i})`).join(', ')}], ${scope}, ${body}, F, R), [${body}(F, ${scope}, R0), sh_ne_at_most_one(R0, R)]);`);
        } else if (UNBOUND.has(fn)) {
          if (fn === 'bound') rule([...evaluated, `sh_ne_bound(${list}, R)`]);
          if (fn === 'coalesce') rule([...evaluated, `sh_ne_coalesce(${list}, R)`]);
          if (fn === 'if') {
            needs.add('srl_ebv');
            if (args.length !== 3) error(term, 'needs three arguments for sparql:if');
            rule([...evaluated, 'sh_ne_choose(A0, A1, A2, R)']);
          }
          if (fn === 'logical-and' || fn === 'logical-or') {
            needs.add('srl_ebv'); needs.add(fn === 'logical-and' ? 'srl_and' : 'srl_or');
            rule([...evaluated, `sh_ne_truth(${list}, Bs)`, `sh_ne_${fn === 'logical-and' ? 'and' : 'or'}(Bs, R)`]);
          }
        } else {
          const entry = FUNCTIONS[fn];
          if (!entry) error(term, `uses the unsupported SPARQL function <${p}>`);
          const [goal] = entry;
          for (const d of entry) if (DEFINITIONS[d] || NODE_FUNCTIONS[d]) needs.add(d);
          let call = `${goal}(${args.map((_, i) => 'X' + i).join(', ')}${args.length ? ', ' : ''}Y)`;
          if (fn === 'concat') call = `srl_concat([${args.map((_, i) => 'X' + i).join(', ')}], Y)`;
          if (fn === 'now') call = 'srl_now(Y)';
          else if (EXECUTION.has(fn)) call = `${goal}(${write(term)}, F, S, [${args.map((_, i) => 'X' + i).join(', ')}], Y)`;
          const apply = fresh('apply');
          rule([...evaluated, `sh_ne_status(${list}, T)`, `${apply}(T, ${list}, F, S, R)`]);
          lines.push(`fact(${apply}('error', _, _, _, failure), ${apply}('unbound', _, _, _, nodes([])));`);
          lines.push(`implied_by(${apply}('ok', [${args.map((_, i) => `v(X${i})`).join(', ')}], F, S, R), once(or([${call}, unify(R, nodes([Y]))], unify(R, failure))));`);
        }
      }
    }
    compiling.delete(key);
    return name;
  };
  return { compile };
}

// Definitions of functions SRL lacks, keyed like the SRL library.
export const NODE_FUNCTIONS = {
  ...Object.fromEntries(['md5', 'sha1', 'sha256', 'sha384', 'sha512'].map((h) => [`sh_ne_${h}`,
    `implied_by(sh_ne_${h}(literal(A, datatype('${XSD}string')), literal(D, datatype('${XSD}string'))), digest('${h}', A, D));`])),
  sh_ne_same_value: `implied_by(sh_ne_same_value(A, B, R), once(or([identical(A, B), unify(R, ${TRUE})], [srl_equal(A, B, 'true'), unify(R, ${TRUE})], [sh_ne_nan(A), sh_ne_nan(B), unify(R, ${TRUE})], unify(R, ${FALSE}))));
implied_by(sh_ne_nan(literal(L, datatype(D))), [srl_numeric_type(D, K), srl_float_kind(K), srl_read_number(K, L, 'nan')]);`,
  // Execution functions derive their values from the captured seed, the
  // expression and its evaluation context, so a proof can replay them.
  // A double in [0, 1) whose fraction digits are the decimal digits of a digest.
  sh_ne_rand: `implied_by(sh_ne_rand(E, F, S, [], literal(L, datatype('${XSD}double'))), [srl_execution(_, Seed), term_text([Seed, E, F, S], Text), digest('sha256', Text, Hex), regex_replace('[a-f]', Hex, '', D), atom_concat('0.', D, M), atom_concat(M, 'e0', L)]);`,
  sh_ne_uuid: `implied_by(sh_ne_uuid(E, F, S, [], iri(I)), [srl_uuid(E, F, S, Id), atom_concat('urn:uuid:', Id, I)]);`,
  sh_ne_struuid: `implied_by(sh_ne_struuid(E, F, S, [], literal(Id, datatype('${XSD}string'))), srl_uuid(E, F, S, Id));`,
  sh_ne_bnode: `implied_by(sh_ne_bnode(E, F, S, Args, bnode('shnex', Text)), term_text([E, F, S, Args], Text));`,
};

export const NODE_COMMON = String.raw`
// Node expression results: nodes(List) or failure.
implied_by(sh_ne_var('focusNode', F, _, R), or([identical(F, 'sh_none'), unify(R, failure)], [not_identical(F, 'sh_none'), unify(R, nodes([F]))]));
implied_by(sh_ne_var(N, _, S, R), [not_identical(N, 'focusNode'), once(or([ent_member([N, V], S), unify(R, nodes([V]))], unify(R, nodes([]))))]);
implied_by(sh_ne_own_focus(F, N), or([identical(F, 'sh_none'), unify(N, failure)], [not_identical(F, 'sh_none'), unify(N, one(F))]));
implied_by(sh_ne_focus_nodes(F, R), or([identical(F, 'sh_none'), unify(R, failure)], [not_identical(F, 'sh_none'), unify(R, nodes([F]))]));
fact(sh_ne_focus(failure, failure), sh_ne_focus(nodes([]), none), sh_ne_focus(nodes([X]), one(X)), sh_ne_focus(nodes([_, _, ..._]), failure));
fact(sh_ne_at_most_one(failure, failure), sh_ne_at_most_one(nodes([]), nodes([])), sh_ne_at_most_one(nodes([X]), nodes([X])), sh_ne_at_most_one(nodes([_, _, ..._]), failure));
fact(sh_ne_first([], nodes([])), sh_ne_first([X, ..._], nodes([X])));
fact(sh_ne_exists(failure, failure), sh_ne_exists(nodes([]), nodes([${FALSE}])), sh_ne_exists(nodes([_, ..._]), nodes([${TRUE}])));
fact(sh_ne_count(failure, failure));
implied_by(sh_ne_count(nodes(L), nodes([N])), ent_count(L, N));
fact(sh_ne_append([], L, L));
implied_by(sh_ne_append([X, ...T], L, [X, ...R]), sh_ne_append(T, L, R));
fact(sh_ne_join(failure, _, failure), sh_ne_join(nodes(_), failure, failure));
implied_by(sh_ne_join(nodes(A), nodes(B), nodes(C)), sh_ne_append(A, B, C));
// Term equality: nodes are ground, so identity decides.
implied_by(sh_ne_in(X, [Y, ..._]), identical(X, Y));
implied_by(sh_ne_in(X, [_, ...T]), sh_ne_in(X, T));
fact(sh_ne_dedup([], _, []));
implied_by(sh_ne_dedup([X, ...T], Seen, R), [once(sh_ne_in(X, Seen)), sh_ne_dedup(T, Seen, R)]);
implied_by(sh_ne_dedup([X, ...T], Seen, [X, ...R]), [not(sh_ne_in(X, Seen)), sh_ne_dedup(T, [X, ...Seen], R)]);
fact(sh_ne_distinct(failure, failure));
implied_by(sh_ne_distinct(nodes(L), nodes(D)), sh_ne_dedup(L, [], D));
fact(sh_ne_without([], _, []));
implied_by(sh_ne_without([X, ...T], M, R), [once(sh_ne_in(X, M)), sh_ne_without(T, M, R)]);
implied_by(sh_ne_without([X, ...T], M, [X, ...R]), [not(sh_ne_in(X, M)), sh_ne_without(T, M, R)]);
fact(sh_ne_remove(failure, _, failure), sh_ne_remove(nodes(_), failure, failure));
implied_by(sh_ne_remove(nodes(M), nodes(N), nodes(R)), sh_ne_without(N, M, R));
fact(sh_ne_take([], _, []));
implied_by(sh_ne_take([X, ...T], N, R), or([eq(N, 0), unify(R, [])], [gt(N, 0), is(M, sub(N, 1)), sh_ne_take(T, M, R1), unify(R, [X, ...R1])]));
fact(sh_ne_drop([], _, []));
implied_by(sh_ne_drop([X, ...T], N, R), or([eq(N, 0), unify(R, [X, ...T])], [gt(N, 0), is(M, sub(N, 1)), sh_ne_drop(T, M, R)]));
fact(sh_ne_limit(failure, _, failure), sh_ne_offset(failure, _, failure));
implied_by(sh_ne_limit(nodes(L), N, nodes(R)), sh_ne_take(L, N, R));
implied_by(sh_ne_offset(nodes(L), N, nodes(R)), sh_ne_drop(L, N, R));
// sh_ne_all(Results, A): failure when any result fails, else nodes(Lists).
fact(sh_ne_all([], nodes([])));
implied_by(sh_ne_all([failure, ..._], failure), 'true');
implied_by(sh_ne_all([nodes(L), ...T], R), [sh_ne_all(T, A), or([unify(A, failure), unify(R, failure)], [unify(A, nodes(Ls)), unify(R, nodes([L, ...Ls]))])]);
fact(sh_ne_concat(failure, failure), sh_ne_concat(nodes([]), nodes([])));
implied_by(sh_ne_concat(nodes([L, ...Ls]), nodes(R)), [sh_ne_concat(nodes(Ls), nodes(M)), sh_ne_append(L, M, R)]);
fact(sh_ne_intersection(failure, failure), sh_ne_intersection(nodes([]), nodes([])));
implied_by(sh_ne_intersection(nodes([L, ...Ls]), nodes(R)), [sh_ne_dedup(L, [], D), sh_ne_within(D, Ls, R)]);
fact(sh_ne_within([], _, []));
implied_by(sh_ne_within([X, ...T], Ls, R), or([sh_ne_everywhere(X, Ls), sh_ne_within(T, Ls, R1), unify(R, [X, ...R1])], [not(sh_ne_everywhere(X, Ls)), sh_ne_within(T, Ls, R)]));
fact(sh_ne_everywhere(_, []));
implied_by(sh_ne_everywhere(X, [L, ...Ls]), [once(sh_ne_in(X, L)), sh_ne_everywhere(X, Ls)]);
fact(sh_ne_aggregate(_, failure, failure), sh_ne_aggregate('min', nodes([]), nodes([])), sh_ne_aggregate('max', nodes([]), nodes([])), sh_ne_aggregate('sum', nodes([]), nodes([0])));
implied_by(sh_ne_aggregate(K, nodes([X, ...T]), R), sh_ne_fold(K, [X, ...T], R));
implied_by(sh_ne_fold('min', L, R), once(or([srl_min(L, M), unify(R, nodes([M]))], unify(R, failure))));
implied_by(sh_ne_fold('max', L, R), once(or([srl_max(L, M), unify(R, nodes([M]))], unify(R, failure))));
implied_by(sh_ne_fold('sum', L, R), once(or([srl_sum(L, M), unify(R, nodes([M]))], unify(R, failure))));
// instancesOf fails for a type that is not an IRI.
fact(sh_ne_instances(failure, _, failure));
implied_by(sh_ne_instances(nodes(Ts), _, failure), not(sh_ne_iris(Ts)));
implied_by(sh_ne_instances(nodes(Ts), G, nodes(L)), [sh_ne_iris(Ts), findall(X, [ent_member(T, Ts), sh_instance(X, T, G)], L0), sh_ne_dedup(L0, [], L)]);
fact(sh_ne_iris([]));
implied_by(sh_ne_iris([iri(_), ...T]), sh_ne_iris(T));
// orderBy pairs each node with its first key, none when it has none.
fact(sh_ne_keyed(_, failure, _, failure), sh_ne_keyed(_, nodes(_), failure, failure));
implied_by(sh_ne_keyed(N, nodes([]), pairs(Ps), pairs([p(none, N), ...Ps])), 'true');
implied_by(sh_ne_keyed(N, nodes([K, ..._]), pairs(Ps), pairs([p(k(K), N), ...Ps])), 'true');
fact(sh_ne_sorted(failure, _, failure));
implied_by(sh_ne_sorted(pairs(Ps), D, nodes(R)), [sh_ne_sort(Ps, [], S), sh_ne_direction(D, S, Q), findall(N, ent_member(p(_, N), Q), R)]);
fact(sh_ne_direction('asc', S, S));
implied_by(sh_ne_direction('desc', S, Q), sh_ne_reverse(S, [], Q));
fact(sh_ne_reverse([], A, A));
implied_by(sh_ne_reverse([X, ...T], A, R), sh_ne_reverse(T, [X, ...A], R));
fact(sh_ne_sort([], A, A));
implied_by(sh_ne_sort([P, ...T], A, R), [sh_ne_insert(P, A, B), sh_ne_sort(T, B, R)]);
fact(sh_ne_insert(P, [], [P]));
implied_by(sh_ne_insert(P, [Q, ...T], R), or([sh_ne_before(P, Q), unify(R, [P, Q, ...T])], [not(sh_ne_before(P, Q)), sh_ne_insert(P, T, R1), unify(R, [Q, ...R1])]));
implied_by(sh_ne_before(p(none, _), p(k(_), _)), 'true');
// The order is computed before it is tested: srl_rank_order falls back to
// the term order when a bound order does not match.
implied_by(sh_ne_before(p(k(A), _), p(k(B), _)), [srl_rank_order(A, B, O), identical(O, '<')]);
// List parameter arguments: v(Node), unbound, or error.
fact(sh_ne_arg(failure, error), sh_ne_arg(nodes([]), unbound), sh_ne_arg(nodes([X]), v(X)), sh_ne_arg(nodes([_, _, ..._]), error));
implied_by(sh_ne_status(As, T), once(or([ent_member(error, As), unify(T, 'error')], [ent_member(unbound, As), unify(T, 'unbound')], unify(T, 'ok'))));
fact(sh_ne_conforms('error', _, _, _, failure), sh_ne_conforms('unbound', _, _, _, nodes([])));
implied_by(sh_ne_conforms('ok', v(X), v(Shape), G, R), once(or([sh_shape(Shape, G), sh_conforms(Shape, X, G), unify(R, nodes([${TRUE}]))], [sh_shape(Shape, G), not(sh_conforms(Shape, X, G)), unify(R, nodes([${FALSE}]))], unify(R, failure))));
implied_by(sh_ne_bound([A], R), or([unify(A, v(_)), unify(R, nodes([${TRUE}]))], [unify(A, unbound), unify(R, nodes([${FALSE}]))], [unify(A, error), unify(R, failure)]));
implied_by(sh_ne_coalesce(As, R), once(or([ent_member(v(X), As), unify(R, nodes([X]))], unify(R, failure))));
implied_by(sh_ne_choose(v(C), A, B, R), once(or([srl_ebv(C, 'true'), sh_ne_value(A, R)], [srl_ebv(C, 'false'), sh_ne_value(B, R)], unify(R, failure))));
fact(sh_ne_choose(unbound, _, _, failure), sh_ne_choose(error, _, _, failure));
fact(sh_ne_value(v(X), nodes([X])), sh_ne_value(unbound, failure), sh_ne_value(error, failure));
fact(sh_ne_truth([], []));
implied_by(sh_ne_truth([v(X), ...T], [B, ...Bs]), [once(or(srl_ebv(X, B), unify(B, 'error'))), sh_ne_truth(T, Bs)]);
implied_by(sh_ne_truth([A, ...T], ['error', ...Bs]), [not(unify(A, v(_))), sh_ne_truth(T, Bs)]);
implied_by(sh_ne_and([A, B], R), once(or([srl_and(A, B, Y), unify(R, nodes([Y]))], unify(R, failure))));
implied_by(sh_ne_or([A, B], R), once(or([srl_or(A, B, Y), unify(R, nodes([Y]))], unify(R, failure))));
`;
