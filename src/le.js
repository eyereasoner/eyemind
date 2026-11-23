// Logical English: an explicit grammar, ordinary LS clauses,
// and conclusions that can be read back as facts. No input text is executed.
import { PRIMITIVE_KEYS } from './builtins.js';
import { CONTROL_KEYS, Program, RESERVED_KEYS, Source } from './program.js';
import { readTerm } from './reader.js';
import { EMPTY, EyemindError, Struct, Var, conjunction, flattenConjunction } from './terms.js';
import { write } from './writer.js';
import { compileOdrlLe, odrlLeReport } from './le-odrl.js';
import { dpvRules } from './dpv.js';
import { loadText } from './lang.js';

const st = (name, ...args) => new Struct(name, args);
const VARIABLE = /^[A-Z][0-9]*$/;
const NAME = /^[a-z][A-Za-z0-9_]*$/;
const PREFIX = /^[A-Za-z][A-Za-z0-9_]*$/;
const LOCAL = /^[A-Za-z0-9_][A-Za-z0-9_-]*$/;
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const SENTENCE_WORDS = new Set(['every', 'for', 'if', 'find', 'there', 'it', 'contradiction', 'use']);
const RESERVED = new Set([...PRIMITIVE_KEYS, ...CONTROL_KEYS, ...RESERVED_KEYS].map((key) => key.split('/')[0]));
for (const name of ['true', 'false', 'fail']) RESERVED.add(name);
const OPERATORS = { '+': ['add', 1], '-': ['sub', 1], '*': ['mul', 2], '/': ['div', 2] };
const list = (items) => items.reduceRight((tail, head) => st('.', head, tail), EMPTY);
const cons = (head, tail) => st('.', head, tail);
const AGGREGATES = { number: 'le:count', sum: 'le:sum', maximum: 'le:max', minimum: 'le:min' };

// Aggregates collect t(...) tuples with findall_sorted, drop repeated tuples
// with le:distinct and fold the rest with these backward rules. Their names
// contain ':', which no LE name can, so they never meet a user's relation.
// Each clause is a function so that every use has its own variables.
const HELPERS = {
  'le:distinct': [
    () => [st('le:distinct', EMPTY, EMPTY), []],
    () => { const X = new Var('X'); return [st('le:distinct', list([X]), list([X])), []]; },
    () => {
      const X = new Var('X'), Y = new Var('Y'), T = new Var('T'), R = new Var('R');
      return [st('le:distinct', cons(X, cons(Y, T)), R), [st('identical', X, Y), st('le:distinct', cons(Y, T), R)]];
    },
    () => {
      const X = new Var('X'), Y = new Var('Y'), T = new Var('T'), R = new Var('R');
      return [st('le:distinct', cons(X, cons(Y, T)), cons(X, R)), [st('not_identical', X, Y), st('le:distinct', cons(Y, T), R)]];
    },
  ],
  'le:count': [
    () => [st('le:count', EMPTY, 0n), []],
    () => {
      const H = new Var('H'), T = new Var('T'), N = new Var('N'), M = new Var('M');
      return [st('le:count', cons(H, T), N), [st('le:count', T, M), st('is', N, st('add', M, 1n))]];
    },
  ],
  'le:sum': [
    () => [st('le:sum', EMPTY, 0n), []],
    () => {
      const H = new Var('H'), T = new Var('T'), S = new Var('S'), S0 = new Var('S0'), V = new Var('V');
      return [st('le:sum', cons(H, T), S), [st('arg', 1n, H, V), st('le:sum', T, S0), st('is', S, st('add', S0, V))]];
    },
  ],
  'le:max': extremum('le:max', 'ge', 'lt'),
  'le:min': extremum('le:min', 'le', 'gt'),
};

// The value of a list's best tuple; an empty list has none.
function extremum(name, keep, pass) {
  const one = () => { const H = new Var('H'), V = new Var('V'); return [st(name, list([H]), V), [st('arg', 1n, H, V)]]; };
  const more = (test, chosen) => () => {
    const H = new Var('H'), I = new Var('I'), T = new Var('T'), M = new Var('M'), M0 = new Var('M0'), V = new Var('V');
    return [st(name, cons(H, cons(I, T)), M),
      [st(name, cons(I, T), M0), st('arg', 1n, H, V), st(test, V, M0), st('unify', M, chosen(V, M0))]];
  };
  return [one, more(keep, (V) => V), more(pass, (V, M0) => M0)];
}

function listItems(term) {
  const items = [];
  while (term instanceof Struct && term.name === '.' && term.args.length === 2) {
    items.push(term.args[0]);
    term = term.args[1];
  }
  return term === EMPTY ? items : null;
}

class Parser {
  constructor(text, file) {
    this.file = file;
    this.tokens = [];
    this.at = 0;
    this.scope = new Map();
    this.closed = new Set();
    this.helpers = new Set();
    this.prefixes = new Map();
    this.aggregates = 0;
    this.depth = 0;
    let line = 1, pos = 0;
    while (pos < text.length) {
      const tail = text.slice(pos);
      const whitespace = /^\s+/.exec(tail);
      if (whitespace) { line += (whitespace[0].match(/\n/g) ?? []).length; pos += whitespace[0].length; continue; }
      if (tail[0] === '#') { const end = text.indexOf('\n', pos); pos = end < 0 ? text.length : end; continue; }
      const match = /^("(?:[^"\\\r\n]|\\.)*"|(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?|[A-Za-z][A-Za-z0-9_]*(?::[A-Za-z0-9_][A-Za-z0-9_-]*)?|[()[\],.+*/-])/.exec(tail);
      if (!match) this.error(`unexpected character ${JSON.stringify(tail[0])}`, line);
      const raw = match[0];
      let value = raw, kind = 'word';
      if (raw[0] === '"') {
        try { value = JSON.parse(raw); } catch { this.error('invalid quoted name; use a JSON string', line); }
        kind = 'string';
      } else if (/^[0-9]/.test(raw)) kind = 'number';
      else if (!/^[A-Za-z]/.test(raw)) kind = 'punct';
      else if (raw.includes(':')) kind = 'qualified';
      this.tokens.push({ value, raw, kind, line });
      pos += raw.length;
    }
    this.tokens.push({ value: '', raw: '', kind: 'end', line });
  }

  get token() { return this.tokens[this.at]; }
  error(message, line = this.token?.line ?? 1) { throw new EyemindError(`${this.file}: line ${line}: Logical English: ${message}`); }
  is(word) { return this.token.kind !== 'string' && this.token.value.toLowerCase() === word; }
  take(word) { if (!this.is(word)) return false; this.at++; return true; }
  need(word) { if (!this.take(word)) this.error(`expected ${JSON.stringify(word)}, found ${JSON.stringify(this.token.raw || 'end of input')}`); }

  name() {
    const token = this.token;
    if (token.kind === 'qualified') return this.qualifiedName();
    if (token.kind !== 'word' || !NAME.test(token.value) || RESERVED.has(token.value)) {
      this.error('a relation or class name must start with a lowercase letter and must not name an LS primitive or control');
    }
    this.at++;
    return token.value;
  }

  qualifiedName() {
    const token = this.token, [prefix, local] = token.value.split(':');
    if (!this.prefixes.has(prefix)) this.error(`prefix ${prefix} is undeclared; introduce it with "Use prefix ${prefix} with namespace …"`, token.line);
    this.at++;
    return st('iri', this.prefixes.get(prefix) + local);
  }

  statement(name, subject, ...objects) {
    if (typeof name === 'string') return st(name, subject, ...objects);
    if (!rdfResource(subject)) this.error('a qualified RDF statement needs a resource subject such as ex:item, iri(...) or a variable');
    if (!objects.length) return st('rdf', subject, st('iri', RDF_TYPE), name);
    if (!rdfValue(objects[0])) this.error('a qualified RDF property needs an RDF value such as a qualified name, number or literal(...)');
    return st('rdf', subject, name, objects[0]);
  }

  declarations() {
    const vars = [];
    do {
      const name = this.token.value;
      if (this.token.kind !== 'word' || !VARIABLE.test(name)) this.error('a variable is one capital letter, optionally followed by digits, such as X or Y1');
      if (this.scope.has(name)) this.error(`variable ${name} is already declared in this sentence`);
      const variable = new Var(name);
      this.scope.set(name, variable);
      vars.push(variable);
      this.at++;
    } while (this.take('and'));
    return vars;
  }

  nested(read) {
    if (this.depth >= 256) this.error('terms and expressions may nest at most 256 levels');
    this.depth++;
    try { return read(); } finally { this.depth--; }
  }

  term() { return this.nested(() => this.termValue()); }

  termValue() {
    if (this.take('-')) {
      if (this.token.kind !== 'number') this.error('a minus sign in a term needs a number; use the value-of form for arithmetic');
      return this.number(true);
    }
    if (this.token.kind === 'number') return this.number(false);
    if (this.take('[')) {
      const items = [];
      if (!this.take(']')) { do { items.push(this.term()); } while (this.take(',')); this.need(']'); }
      return list(items);
    }
    // The explicit "rule N" marker distinguishes a generated witness from
    // an ordinary compound named witness. Its label is data, not a variable.
    if (this.is('witness') && this.tokens[this.at + 1]?.value === '(' &&
        this.tokens[this.at + 2]?.kind === 'word' && this.tokens[this.at + 2].value.toLowerCase() === 'rule' &&
        (this.tokens[this.at + 3]?.kind === 'number' || this.tokens[this.at + 3]?.value === '-')) {
      this.at += 3;
      const rule = this.term();
      if (typeof rule !== 'bigint' || rule < 1n) this.error('a witness rule number must be a positive integer');
      this.need(',');
      const label = this.token;
      if (label.kind !== 'string' && !(label.kind === 'word' && VARIABLE.test(label.value))) {
        this.error('a witness label must be a variable name such as Y or a quoted name');
      }
      this.at++;
      const args = [];
      while (this.take(',')) args.push(this.term());
      this.need(')');
      return st('skolem', rule, label.value, list(args));
    }
    const token = this.token;
    if (token.kind === 'qualified') return this.qualifiedName();
    if (!['word', 'string'].includes(token.kind)) this.error('expected a name, number, variable, list or compound term');
    this.at++;
    if (this.take('(')) {
      const args = [];
      if (!this.take(')')) { do { args.push(this.term()); } while (this.take(',')); this.need(')'); }
      if (!args.length) this.error('a compound term needs at least one argument', token.line);
      return st(token.value, ...args);
    }
    if (token.kind === 'word' && VARIABLE.test(token.value)) {
      if (this.closed.has(token.value)) this.error(`variable ${token.value} belongs to the aggregate that declares it and cannot be used outside it`, token.line);
      if (!this.scope.has(token.value)) this.error(`variable ${token.value} is undeclared; introduce it with "For every", "Find every" or "there exists", or quote it as a name`, token.line);
      return this.scope.get(token.value);
    }
    return token.value;
  }

  number(negative) {
    const token = this.token;
    this.at++;
    try { return readTerm((negative ? '-' : '') + token.raw); }
    catch { this.error(`invalid or nonfinite number ${(negative ? '-' : '') + token.raw}`, token.line); }
  }

  expression(min = 0) { return this.nested(() => this.expressionValue(min)); }

  expressionValue(min) {
    let left;
    if (this.take('-')) left = st('neg', this.expression(3));
    else if (this.take('(')) { left = this.expression(); this.need(')'); }
    else {
      left = this.term();
      if (!(left instanceof Var) && !['bigint', 'number'].includes(typeof left)) this.error('arithmetic operands must be numbers or declared variables');
    }
    while (OPERATORS[this.token.value]?.[1] > min) {
      const [name, precedence] = OPERATORS[this.token.value];
      this.at++;
      left = st(name, left, this.expression(precedence));
    }
    return left;
  }

  atomic(body) {
    if (body && this.take('it')) {
      this.need('is'); this.need('not'); this.need('known'); this.need('that');
      return st('not', this.atomic(false));
    }
    const subject = this.term();
    if (this.take('has')) {
      const name = this.name();
      return this.statement(name, subject, this.term());
    }
    if (this.take('is')) {
      if (this.is('not')) this.error('ordinary "not" is unsupported; use "it is not known that" in a premise for absence, or a separate relation for explicit negative evidence');
      if (!body && this.is('the')) this.error('put calculations in a premise, as in "Y is the value of X + 1", then state the result relation');
      if (this.take('a') || this.take('an')) {
        const name = this.name();
        return this.take('of') ? this.statement(name, subject, this.term()) : this.statement(name, subject);
      }
      if (body) {
        if (this.take('the')) {
          if (!(subject instanceof Var) && !['bigint', 'number'].includes(typeof subject)) this.error('a calculation needs a variable or number on its left');
          const kind = Object.keys(AGGREGATES).find((word) => this.is(word));
          if (kind) return this.aggregate(subject, kind);
          this.need('value'); this.need('of');
          return st('is', subject, this.expression());
        }
        let comparison;
        if (this.take('greater')) { this.need('than'); comparison = 'gt'; }
        else if (this.take('less')) { this.need('than'); comparison = 'lt'; }
        else if (this.take('at')) {
          if (this.take('least')) comparison = 'ge';
          else { this.need('most'); comparison = 'le'; }
        } else if (this.take('equal')) { this.need('to'); comparison = 'eq'; }
        else if (this.take('different')) { this.need('from'); comparison = 'ne'; }
        if (comparison) {
          if (!(subject instanceof Var) && !['bigint', 'number'].includes(typeof subject)) this.error('a comparison needs a variable or number on its left');
          return st(comparison, subject, this.expression());
        }
      }
      // Adjectival class form, as in "Every human is mortal".
      return this.statement(this.name(), subject);
    }
    if (subject instanceof Struct && subject.name !== '.' && NAME.test(subject.name) && !RESERVED.has(subject.name)) return subject;
    if (typeof subject === 'string' && NAME.test(subject) && !RESERVED.has(subject)) return subject;
    this.error('expected "is a class", "is a relation of", or a relation call such as parent(Alice, Bob)');
  }

  // An aggregate statement stands for several goals, so goals are flattened.
  goals(body) {
    const goals = [this.atomic(body)];
    while (this.take('and')) goals.push(this.atomic(body));
    return goals.flat();
  }

  // Premises joined by "or", with "and" binding more tightly; each
  // alternative becomes a clause of its own.
  alternatives() {
    const result = [this.goals(true)];
    while (this.take('or')) result.push(this.goals(true));
    return result;
  }

  // "N is the number of X and Y such that ..." counts the distinct
  // combinations of the declared variables; sum, maximum and minimum fold the
  // value V over them. The condition is one statement or a conjunction in
  // parentheses, and its declared variables stay inside it.
  aggregate(result, kind) {
    this.at++; this.need('of');
    let value = null;
    if (kind !== 'number') {
      if (this.token.kind !== 'word' || !VARIABLE.test(this.token.value)) {
        this.error(`"the ${kind} of" needs a variable, as in "the ${kind} of V for every X and V such that ..."`);
      }
      value = this.token.value;
      this.at++; this.need('for'); this.need('every');
    }
    const locals = this.declarations();
    if (value !== null && !locals.some((v) => v.name === value)) this.error(`${value} must be declared after "for every" in its aggregate`);
    this.need('such'); this.need('that');
    let condition;
    if (this.take('(')) { condition = this.goals(true); this.need(')'); }
    else condition = [this.atomic(true)].flat();
    if (condition.some((goal) => goal instanceof Struct && goal.name === 'findall_sorted')) {
      this.error('an aggregate cannot contain another aggregate; derive the inner one in a rule and use its conclusion');
    }
    for (const v of locals) this.closed.add(v.name);
    const ordered = value === null ? locals : [locals.find((v) => v.name === value), ...locals.filter((v) => v.name !== value)];
    const n = ++this.aggregates, all = new Var(`Agg${n}`), distinct = new Var(`Agg${n}d`), helper = AGGREGATES[kind];
    this.helpers.add('le:distinct');
    this.helpers.add(helper);
    return [st('findall_sorted', st('t', ...ordered), conjunction(condition), all),
      st('le:distinct', all, distinct), st(helper, distinct, result)];
  }

  // Calculations, comparisons and absence tests need their inputs from
  // earlier premises; an aggregate needs those of its condition other than
  // its own variables, and checks its condition in the same way.
  checkOrder(goals, bound, line) {
    for (const goal of goals) {
      if (goal instanceof Struct && goal.name === 'findall_sorted') {
        const locals = variablesIn([goal.args[0]]), inner = new Set(bound);
        for (const name of variablesIn([goal.args[1]])) {
          if (!locals.has(name) && !bound.has(name)) this.error(`${name} must be supplied by an earlier premise before the aggregate that uses it`, line);
        }
        this.checkOrder(flattenConjunction(goal.args[1]), inner, line);
        bound.add(goal.args[2].name);
        continue;
      }
      const required = goal instanceof Struct && RESERVED.has(goal.name) ? variablesIn(goal.name === 'is' ? [goal.args[1]] : [goal]) : new Set();
      for (const name of required) if (!bound.has(name)) this.error(`${name} must be supplied by an earlier positive premise or calculation`, line);
      if (!(goal instanceof Struct && goal.name === 'not')) for (const name of variablesIn([goal])) bound.add(name);
    }
    return bound;
  }

  namespace(label) {
    this.need('with'); this.need('namespace');
    if (this.token.kind !== 'string') this.error(`${label} namespace must be a quoted absolute IRI`);
    const namespace = this.token.value;
    try { new URL(namespace); } catch { this.error(`${label} namespace must be an absolute IRI`); }
    if (/[\s<>"{}|^`\\]/u.test(namespace)) this.error(`${label} namespace must be an absolute IRI without whitespace or forbidden characters`);
    this.at++; this.need('.');
    return namespace;
  }

  sentence() {
    const line = this.token.line;
    this.scope = new Map();
    this.closed = new Set();
    if (this.is('use') && this.tokens[this.at + 1]?.kind === 'word' && this.tokens[this.at + 1].value.toLowerCase() === 'dpv') {
      this.at += 2;
      this.need('hierarchy'); this.need('logic'); this.need('.');
      return { kind: 'dpv', line };
    }
    if (this.is('use') && this.tokens[this.at + 1]?.kind === 'word' && this.tokens[this.at + 1].value.toLowerCase() === 'prefix') {
      this.at += 2;
      const prefix = this.token.value;
      if (this.token.kind !== 'word' || !PREFIX.test(prefix)) this.error('expected a prefix name such as dpv');
      if (this.prefixes.has(prefix)) this.error(`prefix ${prefix} is already declared in this file`);
      this.at++;
      this.prefixes.set(prefix, this.namespace('a prefix'));
      return { kind: 'prefix', line };
    }
    if (this.is('use') && this.tokens[this.at + 1]?.kind === 'word' && this.tokens[this.at + 1].value.toLowerCase() === 'odrl') {
      this.at++;
      this.need('odrl');
      let evaluate = false;
      if (this.take('snapshot')) { this.need('logic'); evaluate = true; }
      else this.need('vocabulary');
      const namespace = this.namespace('an ODRL');
      return { kind: 'odrl', namespace, evaluate, line };
    }
    if (this.take('every')) {
      const x = new Var('X'), froms = [this.name()], heads = [];
      while (this.take('or')) froms.push(this.name());
      this.need('is');
      do { this.take('a') || this.take('an'); heads.push(this.statement(this.name(), x)); } while (this.take('and'));
      this.need('.');
      return { kind: 'forward', heads, bodies: froms.map((from) => [this.statement(from, x)]), line };
    }
    let quantified = false;
    if (this.take('for')) { this.need('every'); this.declarations(); this.need(','); quantified = true; }
    let kind = 'fact', bodies = [[]], heads = [], witnesses = [];
    if (this.take('find')) {
      if (quantified) this.error('a question introduces its variables with "Find every"');
      if (this.take('every')) { this.declarations(); this.need('such'); this.need('that'); }
      else this.need('whether');
      kind = 'query'; bodies = [this.goals(true)];
      if (this.is('or')) this.error('a question has no "or"; ask one question per alternative, or derive a relation with an "or" rule and ask for it');
      if (bodies[0].some((goal) => goal instanceof Struct && goal.name === 'findall_sorted')) {
        this.error('a question cannot aggregate; derive the aggregate in a rule and ask for its conclusion');
      }
    } else if (this.take('contradiction')) {
      kind = 'contradiction'; bodies = [['true']];
    } else if (this.take('it')) {
      this.need('is'); this.need('impossible'); this.need('that');
      kind = 'contradiction'; bodies = this.alternatives();
    } else {
      if (this.take('if')) { kind = 'forward'; bodies = this.alternatives(); this.need('then'); }
      if (this.take('there')) {
        this.need('exists'); witnesses = this.declarations(); this.need('such'); this.need('that');
        if (kind === 'fact') { kind = 'forward'; bodies = [['true']]; }
      }
      heads = this.goals(false);
    }
    this.need('.');
    const headVars = variablesIn(heads), witnessNames = new Set(witnesses.map((v) => v.name));
    if (witnesses.some((v) => !headVars.has(v.name))) this.error('every existential variable must occur in its conclusion', line);
    for (const body of bodies) {
      const bound = this.checkOrder(body, new Set(), line);
      if (kind === 'forward' && [...headVars].some((name) => !bound.has(name) && !witnessNames.has(name))) {
        this.error(bodies.length > 1 ? 'a conclusion variable must occur in every alternative of an "or" premise, or be introduced with "there exists"'
          : 'a conclusion variable must occur in a premise or be introduced with "there exists"', line);
      }
    }
    return { kind, heads, bodies, line };
  }
}

function rdfResource(term) {
  return term instanceof Var || term instanceof Struct &&
    (term.name === 'iri' && term.args.length === 1 && typeof term.args[0] === 'string' ||
      term.name === 'bnode' && term.args.length === 2 || term.name === 'skolem' && term.args.length === 3);
}

function rdfValue(term) {
  return rdfResource(term) || typeof term === 'bigint' || typeof term === 'number' ||
    term instanceof Struct && (term.name === 'literal' && term.args.length === 2 || term.name === 'triple' && term.args.length === 3);
}

function variablesIn(terms) {
  const result = new Set(), pending = [...terms];
  while (pending.length) {
    const term = pending.pop();
    if (term instanceof Var) result.add(term.name);
    else if (term instanceof Struct) pending.push(...term.args);
  }
  return result;
}

// Explicit constructors keep quoted names, floats and reserved JS names safe.
function javascript(term) {
  if (term instanceof Var) return `vars(${JSON.stringify(term.name)})`;
  if (term instanceof Struct) return `struct(${JSON.stringify(term.name)}, ${term.args.map(javascript).join(', ')})`;
  if (typeof term === 'bigint') return `${term}n`;
  if (typeof term === 'number') return `float(${write(term)})`;
  return JSON.stringify(term);
}

export function compileLe(inputs) {
  const clauses = [], statements = [], sources = [], helpers = new Set(), prefixes = new Map();
  let profile = null, dpv = false;
  for (const [text, file] of inputs) {
    const parser = new Parser(String(text), file);
    while (parser.token.kind !== 'end') {
      const sentence = parser.sentence(), { kind, heads, bodies, line } = sentence;
      if (kind === 'prefix') continue;
      if (kind === 'dpv') {
        if (profile) parser.error('the DPV hierarchy directive belongs to ordinary LE; an ODRL snapshot uses its withinCategory operator', line);
        dpv = true;
        continue;
      }
      if (kind === 'odrl') {
        if (profile || dpv || statements.length || parser.prefixes.size || inputs.length !== 1) parser.error('an ODRL directive must be the first sentence of one LE file', line);
        profile = { namespace: sentence.namespace, evaluate: sentence.evaluate };
        continue;
      }
      clauses.push(`// ${String(file).replace(/[\r\n\u2028\u2029]/g, ' ')}: line ${line}`);
      for (const body of bodies) {
        statements.push({ kind, heads, body, line, file });
        if (kind === 'fact') {
          for (const head of heads) {
            clauses.push(`fact(${javascript(head)})`);
            sources.push(new Source('fact', head, [], line, file));
          }
        } else if (kind === 'forward') {
          clauses.push(`implies(${javascript(conjunction(body))}, ${javascript(conjunction(heads))})`);
          sources.push(new Source('forward', conjunction(heads), body, line, file));
        } else {
          clauses.push(`${kind}(${body.map(javascript).join(', ')})`);
          sources.push(new Source(kind, kind === 'query' ? 'true' : 'false', body, line, file));
        }
      }
    }
    for (const name of parser.helpers) helpers.add(name);
    for (const [prefix, namespace] of parser.prefixes) prefixes.set(prefix, namespace);
  }
  if (profile) {
    const loaded = compileOdrlLe(statements, profile, inputs[0][1]);
    return { ...loaded, prefixes: { ...loaded.prefixes, ...Object.fromEntries(prefixes) } };
  }
  // The helpers follow every stated clause, so a witness's rule number is
  // the same whether or not the program aggregates.
  if (helpers.size) clauses.push('// Aggregation helpers.');
  for (const name of Object.keys(HELPERS).filter((key) => helpers.has(key))) {
    for (const make of HELPERS[name]) {
      const [head, body] = make();
      clauses.push(`implied_by(${javascript(head)}, ${body.length ? javascript(conjunction(body)) : "'true'"})`);
      sources.push(new Source('backward', head, body.length ? body : ['true'], null, null));
    }
  }
  if (dpv) {
    const rules = dpvRules('rdf', true);
    sources.push(...loadText(rules, 'DPV hierarchy rules').sources);
    clauses.push(rules);
  }
  return { kind: 'le', text: '// Compiled from Logical English to Logic Script.\n\n' + clauses.join('\n') + '\n',
    program: new Program(sources), prefixes: Object.fromEntries(prefixes), compiled: { statements } };
}

function leTerm(term, names, compact) {
  if (term instanceof Var) return names.get(term.name);
  if (term === EMPTY) return '[]';
  if (typeof term === 'string') {
    return /^[A-Za-z][A-Za-z0-9_]*$/.test(term) && !VARIABLE.test(term) && !SENTENCE_WORDS.has(term.toLowerCase()) ? term : JSON.stringify(term);
  }
  if (typeof term === 'bigint' || typeof term === 'number') return write(term);
  if (!(term instanceof Struct)) throw new EyemindError('cannot write this term as Logical English');
  const qualified = compact(term);
  if (qualified) return qualified;
  const render = (arg) => leTerm(arg, names, compact);
  if (term.name === 'skolem' && term.args.length === 3) {
    const [rule, label, bindings] = term.args, args = listItems(bindings);
    if (typeof rule === 'bigint' && rule > 0n && typeof label === 'string' && args !== null) {
      const name = VARIABLE.test(label) ? label : JSON.stringify(label);
      return `witness(rule ${rule}, ${name}${args.map((arg) => ', ' + render(arg)).join('')})`;
    }
  }
  if (term.name === '.') {
    const items = listItems(term);
    if (items !== null) return `[${items.map(render).join(', ')}]`;
    // Improper lists remain explicit compounds.
  }
  return `${JSON.stringify(term.name)}(${term.args.map(render).join(', ')})`;
}

function leGoal(term, render, properties, compact) {
  if (term === 'false') return 'Contradiction';
  if (typeof term === 'string' && NAME.test(term) && !RESERVED.has(term)) return render(term);
  if (!(term instanceof Struct) || !NAME.test(term.name) || RESERVED.has(term.name)) {
    throw new EyemindError(`${write(term)} is not a Logical English relation; use --to eyemind`);
  }
  if (term.name === 'rdf' && term.args.length === 3) {
    const [s, p, o] = term.args;
    if (rdfResource(s) && rdfValue(o)) {
      if (p instanceof Struct && p.name === 'iri' && p.args.length === 1 && p.args[0] === RDF_TYPE) {
        const type = compact(o);
        if (type) return `${render(s)} is a ${type}`;
      }
      const property = compact(p);
      if (property) return `${render(s)} has ${property} ${render(o)}`;
    }
  }
  const article = /^[aeiou]/.test(term.name) ? 'an' : 'a';
  if (term.args.length === 1) return `${render(term.args[0])} is ${article} ${term.name}`;
  if (properties && term.args.length === 2) return `${render(term.args[0])} has ${term.name} ${render(term.args[1])}`;
  if (term.args.length === 2) return `${render(term.args[0])} is ${article} ${term.name} of ${render(term.args[1])}`;
  return `${term.name}(${term.args.map(render).join(', ')})`;
}

export function writeLe(result, { odrl = null, prefixes = {} } = {}) {
  if (odrl) result = odrlLeReport(result, odrl.namespace);
  const namespaces = odrl ? [] : Object.entries(prefixes).filter(([prefix]) => PREFIX.test(prefix))
    .sort((a, b) => b[1].length - a[1].length);
  const used = new Map();
  const compact = (term) => {
    if (!(term instanceof Struct) || term.name !== 'iri' || term.args.length !== 1 || typeof term.args[0] !== 'string') return null;
    for (const [prefix, namespace] of namespaces) {
      if (!term.args[0].startsWith(namespace)) continue;
      const local = term.args[0].slice(namespace.length);
      if (!LOCAL.test(local)) continue;
      used.set(prefix, namespace);
      return `${prefix}:${local}`;
    }
    return null;
  };
  const lines = [];
  for (const answer of result.answers) {
    const term = readTerm(answer);
    const names = new Map([...variablesIn([term])].map((name, i) => [name, `X${i}`]));
    const quantifier = names.size ? `For every ${[...names.values()].join(' and ')}, ` : '';
    const render = (arg) => leTerm(arg, names, compact);
    lines.push(quantifier + flattenConjunction(term).map((goal) => leGoal(goal, render, odrl !== null, compact)).join(' and ') + '.');
  }
  const declarations = [...used].sort().map(([prefix, namespace]) => `Use prefix ${prefix} with namespace ${JSON.stringify(namespace)}.`);
  const header = odrl ? `Use ODRL vocabulary with namespace ${JSON.stringify(odrl.namespace)}.\n\n`
    : declarations.length ? `${declarations.join('\n')}\n\n` : '';
  return header + (lines.length ? lines.join('\n') + '\n' : '# No conclusions.\n');
}
