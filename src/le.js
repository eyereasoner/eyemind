// Logical English: an explicit grammar, ordinary LS clauses,
// and conclusions that can be read back as facts. No input text is executed.
import { PRIMITIVE_KEYS } from './builtins.js';
import { CONTROL_KEYS, Program, RESERVED_KEYS, Source } from './program.js';
import { readTerm } from './reader.js';
import { EMPTY, EyemindError, Struct, Var, conjunction, flattenConjunction } from './terms.js';
import { write } from './writer.js';
import { compileOdrlLe, odrlLeReport } from './le-odrl.js';

const st = (name, ...args) => new Struct(name, args);
const VARIABLE = /^[A-Z][0-9]*$/;
const NAME = /^[a-z][A-Za-z0-9_]*$/;
const SENTENCE_WORDS = new Set(['every', 'for', 'if', 'find', 'there', 'it', 'contradiction', 'use']);
const RESERVED = new Set([...PRIMITIVE_KEYS, ...CONTROL_KEYS, ...RESERVED_KEYS].map((key) => key.split('/')[0]));
for (const name of ['true', 'false', 'fail']) RESERVED.add(name);
const OPERATORS = { '+': ['add', 1], '-': ['sub', 1], '*': ['mul', 2], '/': ['div', 2] };
const list = (items) => items.reduceRight((tail, head) => st('.', head, tail), EMPTY);

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
    this.depth = 0;
    let line = 1, pos = 0;
    while (pos < text.length) {
      const tail = text.slice(pos);
      const whitespace = /^\s+/.exec(tail);
      if (whitespace) { line += (whitespace[0].match(/\n/g) ?? []).length; pos += whitespace[0].length; continue; }
      if (tail[0] === '#') { const end = text.indexOf('\n', pos); pos = end < 0 ? text.length : end; continue; }
      const match = /^("(?:[^"\\\r\n]|\\.)*"|(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?|[A-Za-z][A-Za-z0-9_]*|[()[\],.+*/-])/.exec(tail);
      if (!match) this.error(`unexpected character ${JSON.stringify(tail[0])}`, line);
      const raw = match[0];
      let value = raw, kind = 'word';
      if (raw[0] === '"') {
        try { value = JSON.parse(raw); } catch { this.error('invalid quoted name; use a JSON string', line); }
        kind = 'string';
      } else if (/^[0-9]/.test(raw)) kind = 'number';
      else if (!/^[A-Za-z]/.test(raw)) kind = 'punct';
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
    if (token.kind !== 'word' || !NAME.test(token.value) || RESERVED.has(token.value)) {
      this.error('a relation or class name must start with a lowercase letter and must not name an LS primitive or control');
    }
    this.at++;
    return token.value;
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
    if (!['word', 'string'].includes(token.kind)) this.error('expected a name, number, variable, list or compound term');
    this.at++;
    if (this.take('(')) {
      const args = [];
      if (!this.take(')')) { do { args.push(this.term()); } while (this.take(',')); this.need(')'); }
      if (!args.length) this.error('a compound term needs at least one argument', token.line);
      return st(token.value, ...args);
    }
    if (token.kind === 'word' && VARIABLE.test(token.value)) {
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
      return st(name, subject, this.term());
    }
    if (this.take('is')) {
      if (this.is('not')) this.error('ordinary "not" is unsupported; use "it is not known that" in a premise for absence, or a separate relation for explicit negative evidence');
      if (!body && this.is('the')) this.error('put calculations in a premise, as in "Y is the value of X + 1", then state the result relation');
      if (this.take('a') || this.take('an')) {
        const name = this.name();
        return this.take('of') ? st(name, subject, this.term()) : st(name, subject);
      }
      if (body) {
        if (this.take('the')) {
          this.need('value'); this.need('of');
          if (!(subject instanceof Var) && !['bigint', 'number'].includes(typeof subject)) this.error('a calculation needs a variable or number on its left');
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
      return st(this.name(), subject);
    }
    if (subject instanceof Struct && subject.name !== '.' && NAME.test(subject.name) && !RESERVED.has(subject.name)) return subject;
    if (typeof subject === 'string' && NAME.test(subject) && !RESERVED.has(subject)) return subject;
    this.error('expected "is a class", "is a relation of", or a relation call such as parent(Alice, Bob)');
  }

  goals(body) {
    const goals = [this.atomic(body)];
    while (this.take('and')) goals.push(this.atomic(body));
    return goals;
  }

  sentence() {
    const line = this.token.line;
    this.scope = new Map();
    if (this.is('use') && this.tokens[this.at + 1]?.kind === 'word' && this.tokens[this.at + 1].value.toLowerCase() === 'odrl') {
      this.at++;
      this.need('odrl');
      let evaluate = false;
      if (this.take('snapshot')) { this.need('logic'); evaluate = true; }
      else this.need('vocabulary');
      this.need('with'); this.need('namespace');
      if (this.token.kind !== 'string') this.error('an ODRL namespace must be a quoted absolute IRI');
      const namespace = this.token.value;
      try { new URL(namespace); } catch { this.error('an ODRL namespace must be an absolute IRI'); }
      if (/[\s<>"{}|^`\\]/u.test(namespace)) this.error('an ODRL namespace must be an absolute IRI without whitespace or forbidden characters');
      this.at++; this.need('.');
      return { kind: 'odrl', namespace, evaluate, line };
    }
    if (this.take('every')) {
      const from = this.name(); this.need('is');
      const x = new Var('X'), heads = [];
      do { this.take('a') || this.take('an'); heads.push(st(this.name(), x)); } while (this.take('and'));
      this.need('.');
      return { kind: 'forward', heads, body: [st(from, x)], line };
    }
    let quantified = false;
    if (this.take('for')) { this.need('every'); this.declarations(); this.need(','); quantified = true; }
    let kind = 'fact', body = [], heads = [], witnesses = [];
    if (this.take('find')) {
      if (quantified) this.error('a question introduces its variables with "Find every"');
      if (this.take('every')) { this.declarations(); this.need('such'); this.need('that'); }
      else this.need('whether');
      kind = 'query'; body = this.goals(true);
    } else if (this.take('contradiction')) {
      kind = 'contradiction'; body = ['true'];
    } else if (this.take('it')) {
      this.need('is'); this.need('impossible'); this.need('that');
      kind = 'contradiction'; body = this.goals(true);
    } else {
      if (this.take('if')) { kind = 'forward'; body = this.goals(true); this.need('then'); }
      if (this.take('there')) {
        this.need('exists'); witnesses = this.declarations(); this.need('such'); this.need('that');
        if (kind === 'fact') { kind = 'forward'; body = ['true']; }
      }
      heads = this.goals(false);
    }
    this.need('.');
    const headVars = variablesIn(heads), bound = new Set(), witnessNames = new Set(witnesses.map((v) => v.name));
    for (const goal of body) {
      const required = goal instanceof Struct && RESERVED.has(goal.name) ? variablesIn(goal.name === 'is' ? [goal.args[1]] : [goal]) : new Set();
      for (const name of required) if (!bound.has(name)) this.error(`${name} must be supplied by an earlier positive premise or calculation`, line);
      if (!(goal instanceof Struct && goal.name === 'not')) for (const name of variablesIn([goal])) bound.add(name);
    }
    if (witnesses.some((v) => !headVars.has(v.name))) this.error('every existential variable must occur in its conclusion', line);
    if (kind === 'forward' && [...headVars].some((name) => !bound.has(name) && !witnessNames.has(name))) {
      this.error('a conclusion variable must occur in a premise or be introduced with "there exists"', line);
    }
    return { kind, heads, body, line };
  }
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
  const clauses = [], statements = [], sources = [];
  let profile = null;
  for (const [text, file] of inputs) {
    const parser = new Parser(String(text), file);
    while (parser.token.kind !== 'end') {
      const sentence = parser.sentence(), { kind, heads, body, line } = sentence;
      if (kind === 'odrl') {
        if (profile || statements.length || inputs.length !== 1) parser.error('an ODRL directive must be the first sentence of one LE file', line);
        profile = { namespace: sentence.namespace, evaluate: sentence.evaluate };
        continue;
      }
      statements.push({ ...sentence, file });
      clauses.push(`// ${String(file).replace(/[\r\n\u2028\u2029]/g, ' ')}: line ${line}`);
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
  if (profile) return compileOdrlLe(statements, profile, inputs[0][1]);
  return { kind: 'le', text: '// Compiled from Logical English to Logic Script.\n\n' + clauses.join('\n') + '\n',
    program: new Program(sources), prefixes: {}, compiled: { statements } };
}

function leTerm(term, names) {
  if (term instanceof Var) return names.get(term.name);
  if (term === EMPTY) return '[]';
  if (typeof term === 'string') {
    return /^[A-Za-z][A-Za-z0-9_]*$/.test(term) && !VARIABLE.test(term) && !SENTENCE_WORDS.has(term.toLowerCase()) ? term : JSON.stringify(term);
  }
  if (typeof term === 'bigint' || typeof term === 'number') return write(term);
  if (!(term instanceof Struct)) throw new EyemindError('cannot write this term as Logical English');
  if (term.name === 'skolem' && term.args.length === 3) {
    const [rule, label, bindings] = term.args, args = listItems(bindings);
    if (typeof rule === 'bigint' && rule > 0n && typeof label === 'string' && args !== null) {
      const name = VARIABLE.test(label) ? label : JSON.stringify(label);
      return `witness(rule ${rule}, ${name}${args.map((arg) => ', ' + leTerm(arg, names)).join('')})`;
    }
  }
  if (term.name === '.') {
    const items = listItems(term);
    if (items !== null) return `[${items.map((item) => leTerm(item, names)).join(', ')}]`;
    // Improper lists remain explicit compounds.
  }
  return `${JSON.stringify(term.name)}(${term.args.map((arg) => leTerm(arg, names)).join(', ')})`;
}

function leGoal(term, names, properties) {
  if (term === 'false') return 'Contradiction';
  if (typeof term === 'string' && NAME.test(term) && !RESERVED.has(term)) return leTerm(term, names);
  if (!(term instanceof Struct) || !NAME.test(term.name) || RESERVED.has(term.name)) {
    throw new EyemindError(`${write(term)} is not a Logical English relation; use --to eyemind`);
  }
  const article = /^[aeiou]/.test(term.name) ? 'an' : 'a';
  if (term.args.length === 1) return `${leTerm(term.args[0], names)} is ${article} ${term.name}`;
  if (properties && term.args.length === 2) return `${leTerm(term.args[0], names)} has ${term.name} ${leTerm(term.args[1], names)}`;
  if (term.args.length === 2) return `${leTerm(term.args[0], names)} is ${article} ${term.name} of ${leTerm(term.args[1], names)}`;
  return `${term.name}(${term.args.map((arg) => leTerm(arg, names)).join(', ')})`;
}

export function writeLe(result, { odrl = null } = {}) {
  if (odrl) result = odrlLeReport(result, odrl.namespace);
  const lines = [];
  for (const answer of result.answers) {
    const term = readTerm(answer);
    const names = new Map([...variablesIn([term])].map((name, i) => [name, `X${i}`]));
    const quantifier = names.size ? `For every ${[...names.values()].join(' and ')}, ` : '';
    lines.push(quantifier + flattenConjunction(term).map((goal) => leGoal(goal, names, odrl !== null)).join(' and ') + '.');
  }
  const header = odrl ? `Use ODRL vocabulary with namespace ${JSON.stringify(odrl.namespace)}.\n\n` : '';
  return header + (lines.length ? lines.join('\n') + '\n' : '# No conclusions.\n');
}
