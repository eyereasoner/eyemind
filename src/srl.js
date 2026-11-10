// SPARQL 1.2 RL rule sets compiled to eyemind programs.
//
// Rule sets are read by the SRL tokenizer, parser and analysis (the
// srl-*.js files): parsing gives the rule set's data blocks and rules, and the
// analysis checks sequential variable scope and stratification by the
// specification's open and closed dependencies.
//
// Every RDF triple is rdf(Subject, Predicate, Object), the union of the two
// graphs a rule body matches. base(S, P, O) marks the base graph, the RDF
// data a run is given, and inf(S, P, O) the inference graph, which starts
// with the rule set's DATA blocks and grows with rule conclusions; the
// conclusions of a run are the inference graph:
//
//   DATA { T }                      fact(rdf(T), inf(T))
//   base data T                     rdf(T) and base(T), by facts_from
//   RULE { H } WHERE { B }          implies(B, [rdf(H), inf(H)])
//   RULE { H } WHERE DATA { B }     B matches base(T) instead of rdf(T)
//   NOT { P }                       not(srl_not_N(Bound...)), with
//                                   implied_by(srl_not_N(Bound...), P)
//   FILTER(E), SET(?v := E)         goals that bind E's value
//   GROUP BY ?k { P } [ ?a := F ]   findall over P, then the aggregate
//
// A blank node in a rule head is a variable only the conclusion mentions,
// so eyemind makes it the Skolem term of the firing; the extra conclusion
// srl_solution([Values...]) makes every solution of the body its own firing.
// eyemind's stratification orders negations and collections after what
// they inspect. A run-once rule (one with SET, GROUP, a head blank node or a
// head triple term with variables) needs no more: the rule set's analysis
// has rejected those that depend on their own conclusions, and the others
// conclude the same when they run alongside what they read, because SET and
// Skolem terms give the same values in every round.
import { analyze } from './srl-analyze.js';
import { BUILTIN_SIGNATURES, canonicalBuiltinName } from './srl-builtin-names.js';
import { libraryText } from './srl-functions.js';
import { Parser } from './srl-parser.js';
import { run } from './engine.js';
import { loadText } from './lang.js';
import { DEFAULT_GRAPH } from './rdf.js';
import { readTerms } from './reader.js';
import { Struct } from './terms.js';
import { write } from './writer.js';

export class SrlError extends Error {}

// A rule set as data blocks and rules: { baseIRI, prefixes, imports, data,
// rules }. strictGrammar follows the SPARQL 1.2 RL grammar exactly.
export function parseRuleSet(text, { base = null, filename = '<input>' } = {}) {
  return new Parser(String(text), { baseIRI: base, filename, strictGrammar: true }).parseProgram();
}

// A rule set with its imports resolved and its rules analyzed. resolve(IRI,
// from) returns an imported rule set's text, or null; without it a rule set
// with IMPORTS is an error. Analysis errors (an unbound variable, a
// recursive closed dependency) throw an SrlError listing them.
export function readRuleSet(text, { base = null, filename = '<input>', resolve = null, checkStratification = true } = {}) {
  const program = withImports(parseRuleSet(text, { base, filename }), { filename, resolve, seen: new Set() });
  const analysis = analyze(program, { checkStratification });
  if (analysis.errors.length > 0) {
    throw new SrlError(analysis.errors.map((d) => d.message).join('; '));
  }
  return program;
}

// IMPORTS incorporates other rule sets, their data blocks included; each is
// read once, so cyclic imports end.
function withImports(program, { filename, resolve, seen }) {
  seen.add(program.baseIRI || filename);
  if (program.imports.length === 0) return program;
  if (!resolve) throw new SrlError(`${filename} has IMPORTS, but no import resolver is given`);
  const merged = { ...program, imports: [], prefixes: {}, data: [], rules: [] };
  for (const target of program.imports) {
    if (seen.has(target)) continue;
    seen.add(target);
    const source = resolve(target, program.baseIRI || filename);
    if (source == null) throw new SrlError(`IMPORTS <${target}> could not be read`);
    const imported = withImports(new Parser(String(source), { baseIRI: target, filename: target, strictGrammar: true }).parseProgram(),
      { filename: target, resolve, seen });
    Object.assign(merged.prefixes, imported.prefixes);
    merged.data.push(...imported.data);
    merged.rules.push(...imported.rules);
  }
  Object.assign(merged.prefixes, program.prefixes);
  merged.data.push(...program.data);
  merged.rules.push(...program.rules);
  return merged;
}

const XSD = 'http://www.w3.org/2001/XMLSchema#';

// A term or atom text as a JavaScript string literal.
const q = (text) => JSON.stringify(text);

const RESERVED = new Set(['Math', 'JSON', 'BigInt', 'Infinity', 'NaN', 'undefined', 'console', 'globalThis',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Symbol',
  'Date', 'RegExp', 'Error', 'Map', 'Set', 'Promise', 'Reflect', 'Proxy']);

// Compile a rule set's text. Options: base (IRI), filename, resolve (for
// IMPORTS, see readRuleSet), data (the base graph, as RDF quads from
// parseRdf, in its default graph). Returns { program, prefixes, warnings }.
export function compileSrl(text, { base = null, filename = '<input>', resolve = null, data = [] } = {}) {
  const ruleSet = readRuleSet(text, { base, filename, resolve });
  return compileRuleSet(ruleSet, { data, source: filename });
}

// Compile a parsed rule set over a base graph of RDF quads.
export function compileRuleSet(ruleSet, { data = [], source = '<input>' } = {}) {
  const needed = new Set();
  const warnings = [];
  const lines = [
    `// Generated by eyemind from ${String(source).replace(/[\r\n]/g, ' ')}, a SPARQL 1.2 RL rule set.`,
    '// Each RDF triple is rdf(Subject, Predicate, Object); base(S, P, O) is the',
    '// base graph and inf(S, P, O) the inference graph, the conclusions.',
  ];
  if (data.some((q) => q[3] !== DEFAULT_GRAPH)) throw new SrlError('the base graph is one graph; give the data as Turtle or N-Triples');
  if (data.length) {
    // Through facts_from, as document text, so integers of any size are exact.
    const document = data.flatMap(([S, P, O]) => [write(new Struct('rdf', [S, P, O])), write(new Struct('base', [S, P, O]))]);
    lines.push(`facts_from({ text: ${JSON.stringify(document.join('\n'))} })`);
  }
  const terms = new Terms('srl');
  for (const t of ruleSet.data) lines.push(`fact(${terms.rdf(t, 'rdf')}, ${terms.rdf(t, 'inf')})`);
  ruleSet.rules.forEach((rule, index) => {
    lines.push(...new RuleCompiler(rule, index + 1, { needed, warnings }).compile());
  });
  lines.push('query(inf(S, P, O))');
  const library = libraryText(needed);
  if (library) lines.push('', '// SPARQL functions and aggregates.', library);
  return { program: `${lines.join('\n')}\n`, prefixes: ruleSet.prefixes, warnings };
}

// RDF terms as eyemind terms. Blank nodes of data are bnode(Scope, Label).
class Terms {
  constructor(scope) {
    this.scope = scope;
  }

  term(t) {
    switch (t.type) {
      case 'iri': return `iri(${q(t.value)})`;
      case 'blank': return `bnode(${q(this.scope)}, ${q(t.value)})`;
      case 'literal': return literalText(t);
      case 'triple': return `triple(${this.term(t.s)}, ${this.term(t.p)}, ${this.term(t.o)})`;
      default: throw new SrlError(`a ${t.type} cannot appear in data`);
    }
  }

  rdf(t, name) {
    return `${name}(${this.term(t.s)}, ${this.term(t.p)}, ${this.term(t.o)})`;
  }
}

// A literal: an xsd:integer with a canonical lexical form is an integer,
// any other literal keeps its lexical form and datatype or language tag.
function literalText(t) {
  if (t.lang) return `literal(${q(String(t.value))}, ${t.langDir ? `lang(${q(t.lang)}, ${q(t.langDir)})` : `lang(${q(t.lang)})`})`;
  const datatype = t.datatype || `${XSD}string`;
  const lexical = t.lexical ?? String(t.value);
  if (datatype === `${XSD}integer` && /^(?:0|-?[1-9][0-9]*)$/.test(lexical)) {
    const n = BigInt(lexical);
    return n >= -(2n ** 53n) && n <= 2n ** 53n ? lexical : `${lexical}n`;
  }
  return `literal(${q(lexical)}, datatype(${q(datatype)}))`;
}

// One rule: its body as goals, its head as conclusions.
class RuleCompiler {
  constructor(rule, number, { needed, warnings }) {
    this.rule = rule;
    this.number = number;
    this.needed = needed;
    this.warnings = warnings;
    this.used = new Set();
    this.helpers = [];
    this.helperCount = 0;
    this.terms = new Terms('srl');
  }

  compile() {
    const { rule } = this;
    if (rule.head.length === 0) return [`// Rule ${this.number} concludes nothing.`];
    const scope = new Scope(this, null, rule.groundData ? 'base' : 'rdf');
    const goals = this.body(rule.body, scope);
    const solution = [...scope.bound].sort().map((v) => scope.name(v));
    const headBlanks = new Map();
    const blank = (label) => {
      if (!headBlanks.has(label)) headBlanks.set(label, this.fresh(`B${label.replace(/[^A-Za-z0-9_]/g, '_')}`));
      return headBlanks.get(label);
    };
    const term = (t) => {
      if (t.type === 'var') return scope.name(t.value);
      if (t.type === 'blank') return blank(t.value);
      if (t.type === 'triple') return `triple(${term(t.s)}, ${term(t.p)}, ${term(t.o)})`;
      return this.terms.term(t);
    };
    // A head triple whose predicate is no IRI is not concluded. A variable
    // a body triple matched as a predicate is an IRI already.
    const predicates = new Set(rule.body.filter((c) => c.type === 'triple' && c.triple.p.type === 'var').map((c) => c.triple.p.value));
    const guarded = rule.head.filter((t) => t.p.type === 'var' && !predicates.has(t.p.value));
    const heads = rule.head.map((t) => [`rdf(${term(t.s)}, ${term(t.p)}, ${term(t.o)})`, `inf(${term(t.s)}, ${term(t.p)}, ${term(t.o)})`]);
    const out = [];
    const emit = (extra, conclusions) => {
      const body = [...goals, ...extra];
      const conclusion = conclusions.flat();
      if (headBlanks.size > 0) conclusion.push(`srl_solution([${solution.join(', ')}])`);
      out.push(`implies(${body.length ? `[${body.join(', ')}]` : "'true'"}, [${conclusion.join(', ')}])`);
    };
    const check = (t) => `unify(${term(t.p)}, iri(_))`;
    if (guarded.length === 0) emit([], heads);
    else if (headBlanks.size > 0 || rule.head.length === 1) {
      // Blank nodes shared between head triples need one firing.
      emit([...new Set(guarded.map(check))], heads);
    } else {
      // Each head triple is concluded on its own, guarded when needed.
      rule.head.forEach((t, k) => emit(guarded.includes(t) ? [check(t)] : [], [heads[k]]));
    }
    return [...this.helpers, ...out];
  }

  fresh(hint) {
    let base = hint.replace(/[^A-Za-z0-9_]/g, '_');
    if (/^[a-z]/.test(base)) base = base[0].toUpperCase() + base.slice(1);
    if (!/^[A-Z]/.test(base) || RESERVED.has(base)) base = `V${base}`;
    let name = base;
    for (let k = 2; this.used.has(name); k++) name = `${base}_${k}`;
    this.used.add(name);
    return name;
  }

  need(name) {
    this.needed.add(name);
  }

  // Body clauses in order, each seeing the variables earlier ones bound.
  body(clauses, scope) {
    const goals = [];
    for (const clause of clauses) {
      switch (clause.type) {
        case 'triple':
          goals.push(scope.pattern(clause.triple.s, clause.triple.p, clause.triple.o));
          break;
        case 'path':
          goals.push(...scope.path(clause.triple.s, clause.triple.p, clause.triple.o));
          break;
        case 'filter': {
          const { goals: g, value } = this.expression(clause.expr, scope);
          this.need('srl_ebv');
          goals.push(...g, `srl_true(${value})`);
          break;
        }
        case 'set': {
          const { goals: g, value } = this.expression(clause.expr, scope);
          goals.push(...g, `unify(${scope.name(clause.variable)}, ${value})`);
          scope.bind(clause.variable);
          break;
        }
        case 'not':
          goals.push(this.negation(clause, scope));
          break;
        case 'group':
          goals.push(...this.group(clause, scope));
          break;
        default:
          throw new SrlError(`unsupported body clause ${clause.type}`);
      }
    }
    return goals;
  }

  // NOT { P } is not(srl_not_N(V...)) for the variables of P bound before
  // it; the others are local to P.
  negation(clause, scope) {
    const name = `srl_not_${this.number}_${++this.helperCount}`;
    const inner = new Scope(this, null, clause.groundData || scope.graph === 'base' ? 'base' : 'rdf');
    const mentioned = new Set();
    collectClauseVars(clause.body, mentioned);
    const shared = [...mentioned].filter((v) => scope.bound.has(v)).sort();
    for (const v of shared) inner.bind(v);
    const goals = this.body(clause.body, inner);
    const args = (s) => shared.map((v) => s.name(v)).join(', ');
    this.helpers.push(`implied_by(${name}(${args(inner)}), ${goals.length === 1 ? goals[0] : `[${goals.join(', ')}]`})`);
    return `not(${name}(${args(scope)}))`;
  }

  // GROUP: the pattern sees only the incoming values of its keys. Without
  // BY there is one group, even when the pattern has no solutions; with BY
  // there is a group per distinct value of the keys.
  group(clause, scope) {
    const inner = new Scope(this, scope, scope.graph, new Set(clause.keys));
    for (const k of clause.keys) if (scope.bound.has(k)) inner.bind(k);
    const pattern = this.body(clause.pattern, inner);
    const conj = pattern.length === 0 ? "'true'" : pattern.length === 1 ? pattern[0] : `[${pattern.join(', ')}]`;
    const columns = clause.aggregations.filter((a) => a.function.argument !== '*').map((a) => a.function.argument);
    const distinctColumns = [...new Set(columns)];
    const goals = [];
    const keys = `[${clause.keys.map((k) => scope.name(k)).join(', ')}]`;
    if (clause.keys.length > 0) {
      // The key values are collected under names of their own, so the
      // collection a proof records is the one searched.
      const incoming = new Set(clause.keys.filter((k) => scope.bound.has(k)));
      const own = new Scope(this, scope, scope.graph, incoming);
      for (const k of incoming) own.bind(k);
      const ownPattern = this.body(clause.pattern, own);
      const ownConj = ownPattern.length === 0 ? "'true'" : ownPattern.length === 1 ? ownPattern[0] : `[${ownPattern.join(', ')}]`;
      const all = this.fresh('Keys');
      const distinct = this.fresh('Groups');
      this.need('srl_distinct');
      this.need('srl_member');
      goals.push(`findall([${clause.keys.map((k) => own.name(k)).join(', ')}], ${ownConj}, ${all})`,
        `srl_distinct(${all}, ${distinct})`, `srl_member(${keys}, ${distinct})`);
    }
    const rows = this.fresh('Rows');
    goals.push(`findall([${distinctColumns.map((v) => inner.name(v)).join(', ')}], ${conj}, ${rows})`);
    this.need('srl_aggregates');
    this.need('srl_column');
    for (const k of clause.keys) scope.bind(k);
    for (const { variable, function: fn } of clause.aggregations) {
      const target = scope.name(variable);
      if (fn.argument === '*') {
        goals.push(`srl_count(${rows}, ${target})`);
      } else {
        const column = this.fresh('Values');
        goals.push(`srl_column(${rows}, ${distinctColumns.indexOf(fn.argument) + 1}, ${column})`);
        const name = fn.name === 'COUNT' ? (fn.distinct ? 'srl_count_distinct' : 'srl_count') : `srl_${fn.name.toLowerCase()}`;
        goals.push(`${name}(${column}, ${target})`);
      }
      scope.bind(variable);
    }
    return goals;
  }

  // An expression as { goals, value }: the goals bind the value's variable.
  expression(expr, scope) {
    switch (expr.type) {
      case 'var':
        return { goals: [], value: scope.name(expr.name) };
      case 'literal':
        if (expr.term) return { goals: [], value: literalText(expr.term) };
        if (typeof expr.value === 'boolean') return { goals: [], value: `literal(${q(String(expr.value))}, datatype(${q(`${XSD}boolean`)}))` };
        return { goals: [], value: `literal(${q(String(expr.value))}, datatype(${q(`${XSD}string`)}))` };
      case 'term':
        if (expr.value.type === 'triple' || expr.value.type === 'var') {
          const term = (t) => (t.type === 'var' ? scope.name(t.value) : t.type === 'triple'
            ? `triple(${term(t.s)}, ${term(t.p)}, ${term(t.o)})` : this.terms.term(t));
          return { goals: [], value: term(expr.value) };
        }
        return { goals: [], value: this.terms.term(expr.value) };
      case 'unary': {
        const a = this.expression(expr.expr, scope);
        const name = { '!': 'srl_not', '-': 'srl_neg', '+': 'srl_pos' }[expr.op];
        return this.call(name, [a]);
      }
      case 'binary':
        return this.binary(expr, scope);
      case 'call':
        return this.functionCall(expr, scope);
      default:
        throw new SrlError(`unsupported expression ${expr.type}`);
    }
  }

  // A function goal over evaluated arguments.
  call(name, args, need = name) {
    this.need(need);
    const value = this.fresh('R');
    return { goals: [...args.flatMap((a) => a.goals), `${name}(${[...args.map((a) => a.value), value].join(', ')})`], value };
  }

  binary(expr, scope) {
    const { op } = expr;
    if (op === '&&' || op === '||') {
      // Each side is its effective boolean value or 'error'.
      const side = (e) => {
        const { goals, value } = this.expression(e, scope);
        const b = this.fresh('E');
        this.need('srl_ebv');
        const goal = goals.length === 0 ? `srl_ebv3(${value}, ${b})` : `once(or([${goals.join(', ')}, srl_ebv(${value}, ${b})], unify(${b}, 'error')))`;
        return { goal, b };
      };
      const left = side(expr.left);
      const right = side(expr.right);
      const name = op === '&&' ? 'srl_and' : 'srl_or';
      this.need(name);
      const value = this.fresh('R');
      return { goals: [left.goal, right.goal, `${name}(${left.b}, ${right.b}, ${value})`], value };
    }
    if (op === 'IN' || op === 'NOT IN') {
      const left = this.expression(expr.left, scope);
      this.need('srl_in');
      const items = expr.right.items.map((item) => {
        const { goals, value } = this.expression(item, scope);
        const t = this.fresh('E');
        return { goal: `once(or([${[...goals, `srl_equal(${left.value}, ${value}, ${t})`].join(', ')}], unify(${t}, 'error')))`, t };
      });
      const value = this.fresh('R');
      return {
        goals: [...left.goals, ...items.map((i) => i.goal), `${op === 'IN' ? 'srl_in' : 'srl_not_in'}([${items.map((i) => i.t).join(', ')}], ${value})`],
        value,
      };
    }
    const name = {
      '+': 'srl_add', '-': 'srl_sub', '*': 'srl_mul', '/': 'srl_div',
      '=': 'srl_eq', '!=': 'srl_ne', '<': 'srl_lt', '<=': 'srl_le', '>': 'srl_gt', '>=': 'srl_ge',
    }[op];
    if (!name) throw new SrlError(`unsupported operator ${op}`);
    return this.call(name, [this.expression(expr.left, scope), this.expression(expr.right, scope)]);
  }

  functionCall(expr, scope) {
    const builtin = canonicalBuiltinName(expr.name);
    const args = () => expr.args.map((a) => this.expression(a, scope));
    if (builtin) {
      const { min, max } = BUILTIN_SIGNATURES[builtin];
      if (expr.args.length < min || expr.args.length > max) {
        throw new SrlError(`${builtin} takes ${min === max ? min : `${min} to ${max === Infinity ? 'any number of' : max}`} arguments, not ${expr.args.length}`);
      }
      return this.builtin(builtin, expr, scope, args);
    }
    if (expr.name.startsWith(XSD) && CASTS.has(expr.name.slice(XSD.length))) {
      if (expr.args.length !== 1) throw new SrlError(`the cast ${expr.name} takes one argument`);
      this.need('srl_cast');
      const [a] = args();
      const value = this.fresh('R');
      return { goals: [...a.goals, `srl_cast(${q(expr.name)}, ${a.value}, ${value})`], value };
    }
    // An unknown function is an error, so its expression has no value.
    this.warnings.push(`rule ${this.number}: the function <${expr.name}> is not known, so its expression is an error`);
    return { goals: ["'fail'"], value: this.fresh('R') };
  }

  builtin(name, expr, scope, args) {
    const simple = {
      STR: 'srl_str', LANG: 'srl_lang', LANGDIR: 'srl_langdir', LANGMATCHES: 'srl_langmatches', DATATYPE: 'srl_datatype',
      IRI: 'srl_iri', URI: 'srl_iri', ABS: 'srl_abs', CEIL: 'srl_ceil', FLOOR: 'srl_floor', ROUND: 'srl_round',
      STRLEN: 'srl_strlen', UCASE: 'srl_ucase', LCASE: 'srl_lcase', ENCODE_FOR_URI: 'srl_encode_for_uri',
      CONTAINS: 'srl_contains', STRSTARTS: 'srl_strstarts', STRENDS: 'srl_strends', STRBEFORE: 'srl_strbefore',
      STRAFTER: 'srl_strafter', YEAR: 'srl_year', MONTH: 'srl_month', DAY: 'srl_day', HOURS: 'srl_hours',
      MINUTES: 'srl_minutes', SECONDS: 'srl_seconds', TIMEZONE: 'srl_timezone', TZ: 'srl_tz', STRLANG: 'srl_strlang',
      STRLANGDIR: 'srl_strlangdir', STRDT: 'srl_strdt', sameTerm: 'srl_same_term', isIRI: 'srl_is_iri',
      isURI: 'srl_is_iri', isBLANK: 'srl_is_blank', isLITERAL: 'srl_is_literal', isNUMERIC: 'srl_is_numeric',
      hasLANG: 'srl_has_lang', hasLANGDIR: 'srl_has_langdir', isTRIPLE: 'srl_is_triple', TRIPLE: 'srl_triple',
      SUBJECT: 'srl_subject', PREDICATE: 'srl_predicate', OBJECT: 'srl_object', SUBSTR: 'srl_substr',
    };
    const library = {
      srl_langdir: 'srl_lang', srl_ceil: 'srl_abs', srl_floor: 'srl_abs', srl_round: 'srl_abs', srl_lcase: 'srl_ucase',
      srl_contains: 'srl_strstarts', srl_strends: 'srl_strstarts', srl_strafter: 'srl_strbefore',
      srl_year: 'srl_datetime', srl_month: 'srl_datetime', srl_day: 'srl_datetime', srl_hours: 'srl_datetime',
      srl_minutes: 'srl_datetime', srl_seconds: 'srl_datetime', srl_timezone: 'srl_datetime', srl_tz: 'srl_datetime',
      srl_strlangdir: 'srl_strlang', srl_is_iri: 'srl_kind_tests', srl_is_blank: 'srl_kind_tests',
      srl_is_literal: 'srl_kind_tests', srl_is_numeric: 'srl_kind_tests', srl_has_lang: 'srl_kind_tests',
      srl_has_langdir: 'srl_kind_tests', srl_is_triple: 'srl_kind_tests', srl_subject: 'srl_triple',
      srl_predicate: 'srl_triple', srl_object: 'srl_triple',
    };
    if (simple[name]) {
      const fn = simple[name];
      return this.call(fn, args(), library[fn] ?? fn);
    }
    switch (name) {
      case 'IF': {
        const [c, a, b] = args();
        this.need('srl_ebv');
        const flag = this.fresh('C');
        const value = this.fresh('R');
        const branch = (x, v) => [...x.goals, `unify(${value}, ${x.value})`];
        return {
          goals: [...c.goals, `srl_ebv(${c.value}, ${flag})`,
            `or([unify(${flag}, 'true'), ${branch(a).join(', ')}], [unify(${flag}, 'false'), ${branch(b).join(', ')}])`],
          value,
        };
      }
      case 'CONCAT': {
        const items = args();
        this.need('srl_concat');
        const value = this.fresh('R');
        return { goals: [...items.flatMap((a) => a.goals), `srl_concat([${items.map((a) => a.value).join(', ')}], ${value})`], value };
      }
      case 'REGEX':
      case 'REPLACE': {
        const items = args();
        const flags = items.length === (name === 'REGEX' ? 3 : 4) ? expr.args.at(-1) : null;
        const fn = name === 'REGEX' ? 'srl_regex' : 'srl_replace';
        if (flags === null) return this.call(fn, items);
        const text = flags.type === 'literal' && typeof flags.value === 'string' ? flags.value : null;
        if (text === null || !/^i?$/.test(text)) {
          this.warnings.push(`rule ${this.number}: ${name} supports no flags but i, so its expression is an error`);
          return { goals: ["'fail'"], value: this.fresh('R') };
        }
        const rest = items.slice(0, -1);
        if (text === '') return this.call(fn, rest);
        // Case-insensitive matching lowers the text and a constant pattern.
        const pattern = expr.args[1];
        if (!(pattern.type === 'literal' && typeof pattern.value === 'string')) {
          this.warnings.push(`rule ${this.number}: ${name} with the i flag needs a constant pattern, so its expression is an error`);
          return { goals: ["'fail'"], value: this.fresh('R') };
        }
        rest[1] = { goals: [], value: `literal(${q(lowerPattern(pattern.value))}, datatype(${q(`${XSD}string`)}))` };
        return this.call(`${fn}_i`, rest, fn);
      }
      case 'BNODE': {
        // A blank node for this solution, and for the string when given.
        const items = args();
        const solution = [...scope.allBound()].sort().map((v) => scope.name(v));
        const text = this.fresh('Text');
        const value = this.fresh('R');
        return {
          goals: [...items.flatMap((a) => a.goals), `term_text([${this.number}, ${q(`bnode${++this.helperCount}`)}, [${items.map((a) => a.value).join(', ')}], [${solution.join(', ')}]], ${text})`, `unify(${value}, bnode('srl', ${text}))`],
          value,
        };
      }
      case 'NOW':
        throw new SrlError('NOW is not supported: eyemind has no clock');
      case 'UUID':
      case 'STRUUID':
        throw new SrlError(`${name} is not supported: eyemind has no source of random identifiers`);
      default:
        throw new SrlError(`${name} is not supported`);
    }
  }
}

const CASTS = new Set(['string', 'integer', 'decimal', 'float', 'double', 'boolean', 'dateTime', 'date']);

// A pattern for case-insensitive matching against lowered text: letters
// outside escapes become lower case.
function lowerPattern(pattern) {
  return pattern.replace(/\\[pPu]\{[^}]*\}|\\.|[A-Z]/gu, (m) => (m.length === 1 ? m.toLowerCase() : m));
}

// The variables of a rule body, a scope over them, and the patterns that
// match its graph.
class Scope {
  constructor(compiler, parent, graph, keys = null) {
    this.compiler = compiler;
    this.parent = parent;
    this.graph = graph;
    // A group pattern shares only its keys with the enclosing scope.
    this.keys = keys;
    this.names = new Map();
    this.bound = new Set();
  }

  name(v) {
    if (this.names.has(v)) return this.names.get(v);
    if (this.parent && this.keys?.has(v)) return this.parent.name(v);
    const name = this.compiler.fresh(v.startsWith('__b') ? `B${v.slice(3)}` : v);
    this.names.set(v, name);
    return name;
  }

  bind(v) {
    this.bound.add(v);
  }

  allBound() {
    return new Set([...(this.parent ? this.parent.allBound() : []), ...this.bound]);
  }

  term(t) {
    if (t.type === 'var') {
      this.bind(t.value);
      return this.name(t.value);
    }
    if (t.type === 'triple') return `triple(${this.term(t.s)}, ${this.term(t.p)}, ${this.term(t.o)})`;
    return this.compiler.terms.term(t);
  }

  pattern(s, p, o) {
    return `${this.graph}(${this.term(s)}, ${this.term(p)}, ${this.term(o)})`;
  }

  // A property path of sequences and inverses as triple patterns.
  path(s, path, o) {
    if (path.type !== 'path') return [this.pattern(s, path, o)];
    if (path.kind === 'inverse') return this.path(o, path.path, s);
    if (path.kind === 'sequence') {
      const goals = [];
      let from = s;
      path.parts.forEach((part, k) => {
        const to = k === path.parts.length - 1 ? o : { type: 'var', value: `__path${this.compiler.helperCount++}` };
        goals.push(...this.path(from, part, to));
        from = to;
      });
      return goals;
    }
    throw new SrlError(`unsupported path ${path.kind}`);
  }
}

function collectClauseVars(clauses, out) {
  const term = (t) => {
    if (!t) return;
    if (t.type === 'var') out.add(t.value);
    else if (t.type === 'triple') [t.s, t.p, t.o].forEach(term);
    else if (t.type === 'path') (t.kind === 'inverse' ? [t.path] : t.parts ?? []).forEach(term);
  };
  const expr = (e) => {
    if (!e) return;
    if (e.type === 'var') out.add(e.name);
    else if (e.type === 'unary') expr(e.expr);
    else if (e.type === 'binary') { expr(e.left); expr(e.right); }
    else if (e.type === 'call') e.args.forEach(expr);
    else if (e.type === 'list') e.items.forEach(expr);
    else if (e.type === 'term') term(e.value);
  };
  for (const c of clauses) {
    if (c.type === 'triple' || c.type === 'path') [c.triple.s, c.triple.p, c.triple.o].forEach(term);
    else if (c.type === 'filter') expr(c.expr);
    else if (c.type === 'set') { out.add(c.variable); expr(c.expr); }
  }
}


// Generous bounds: rule sets over real data run longer than eyemind's defaults.
export const SRL_LIMITS = { maxDepth: 1000000, maxIterations: 100000, maxInferences: 1000000000 };

// Reason over a rule set. Options: base, filename, resolve (IMPORTS), data
// (the base graph as RDF quads), all (the base graph too), limits and proof.
// Returns { quads, program, prefixes, warnings, result }: the quads are the
// inference graph's, and with proof, result.proof is eyemind's checked
// proof of the compiled program.
export function reasonSrl(text, { base = null, filename = '<input>', resolve = null, data = [], all = false, limits = {}, proof = false } = {}) {
  const { program, prefixes, warnings } = compileSrl(text, { base, filename, resolve, data });
  const result = run(loadText(program, 'compiled.js'), { ...SRL_LIMITS, ...limits, proof });
  return { quads: srlQuads(program, result.answers, { all }), program, prefixes, warnings, result };
}

// The inference graph of a run's answers, as quads in the default graph:
// the rule set's DATA triples, then the derived ones. With all, the base
// graph the compiled program states comes first.
export function srlQuads(program, answers, { all = false } = {}) {
  const seen = new Set();
  const out = [];
  const add = (terms, name) => {
    for (const t of terms) {
      if (!(t instanceof Struct) || t.name !== name || t.args.length !== 3) continue;
      const key = write(new Struct('t', t.args));
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([...t.args, DEFAULT_GRAPH]);
    }
  };
  const lines = program.split('\n');
  if (all) {
    const line = lines.find((l) => l.startsWith('facts_from({ text: '));
    if (line) add(readTerms(JSON.parse(line.slice('facts_from({ text: '.length, -' })'.length))).map(([t]) => t), 'base');
  }
  add(readTerms(lines.filter((l) => l.startsWith('fact(rdf(') && l.includes(', inf(')).join('\n')).map(([t]) => t.args[1]), 'inf');
  add(answers.map((a) => readTerms(a)[0][0]), 'inf');
  return out;
}
