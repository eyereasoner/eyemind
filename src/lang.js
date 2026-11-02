// Writing programs in JavaScript.
//
// A program is a JavaScript script that states facts and rules:
//
//     fact(type('socrates', 'human'))
//     fact(subclass_of('human', 'mortal'))
//     implies([type(S, A), subclass_of(A, B)], type(S, B))
//     query(type(X, Y))
//
// Atoms are strings, integers are numbers with an integral value or bigints,
// floats are other numbers, lists are arrays, and [H, ...T] is a list with
// head H and tail T. An array in a goal position is the conjunction of its
// goals. Each call states one clause, in source order; loadText runs the
// script and collects them into a Program.
//
// A name the program does not define is supplied as it runs: a name
// beginning with an uppercase letter or _ is the variable of that name, and
// any other name a predicate, which builds a compound when called and stands
// for the atom of its name when not.
import { PRIMITIVE_KEYS } from './builtins.js';
import { run } from './engine.js';
import { normalizeGoal } from './goals.js';
import { CONTROL_KEYS, Program, RESERVED_KEYS, Source } from './program.js';
import { checkProof, checkReport, verdictText } from './proof.js';
import { readTerm, readTerms } from './reader.js';
import { EMPTY, EyecodeError, Struct, Tail, Var, conjunction, keyName } from './terms.js';
import { RESERVED_CALLS, RESERVED_WORDS, write } from './writer.js';

const PREDICATE = Symbol('eyecode.predicate');

// A float written float(N) in a program, kept apart from the integer N.
class FloatLiteral {
  constructor(value) {
    this.value = value;
  }
}

function refuseOperators() {
  throw new EyecodeError('operators do not apply to terms: write add(X, 1) rather than X + 1, gt(X, 1) ' +
                        'rather than X > 1, and an array [g1, g2] rather than g1 && g2');
}

// A term has no value as a JavaScript primitive, so an operator such as + or
// > applied to one is an error rather than a string or false.
for (const kind of [Var, Struct]) {
  Object.defineProperty(kind.prototype, Symbol.toPrimitive, { value: refuseOperators });
}

// Turn a JavaScript value written in a program into a term.
export function toTerm(value) {
  const type = typeof value;
  if (type === 'string' || type === 'bigint' || value instanceof Var || value instanceof Struct) return value;
  if (type === 'number') {
    if (!Number.isFinite(value)) throw new EyecodeError(`a float term must be finite, not ${value}`);
    return Number.isInteger(value) ? BigInt(value) : value;
  }
  if (value instanceof FloatLiteral) return value.value;
  if (Array.isArray(value)) return fromArray(value);
  if (type === 'function' && value[PREDICATE] !== undefined) return value[PREDICATE];
  if (type === 'boolean') {
    // A comparison of two plain values, such as 1 < 2 or N > 1, is decided by
    // JavaScript before eyecode sees it.
    throw new EyecodeError(`${value} is not a term: a comparison of plain JavaScript values is decided by ` +
                          `JavaScript before eyecode sees it; write gt(X, Y) and the like, or an atom such as 'true'`);
  }
  if (value === null || value === undefined) {
    throw new EyecodeError(`${value} is not a term; write an atom such as 'true' instead`);
  }
  throw new EyecodeError(`a value of type ${value?.constructor?.name ?? type} is not a term`);
}

function fromArray(items) {
  let tail = EMPTY;
  let count = items.length;
  if (count && items[count - 1] instanceof Tail) {
    tail = toTerm(items[count - 1].term);
    count--;
  }
  let result = tail;
  for (let i = count - 1; i >= 0; i--) {
    if (items[i] instanceof Tail) throw new EyecodeError('a spread tail can only end a list');
    result = new Struct('.', [toTerm(items[i]), result]);
  }
  return result;
}

const goalOf = (value) => normalizeGoal(toTerm(value));

// The goals a statement or control joins: one goal, or several as and(...).
function joined(values) {
  return conjunction(values.map(goalOf));
}

// Names for the _ of one clause: _0, _1, ..., skipping names the clause
// already uses, which are looked up only once a _ is met.
class Anonymous {
  constructor(head, body) {
    this.head = head;
    this.body = body;
    this.used = null;
    this.count = 0;
  }

  next() {
    if (this.used === null) {
      this.used = new Set();
      const pending = [this.head, ...this.body];
      while (pending.length) {
        const term = pending.pop();
        if (term instanceof Var) this.used.add(term.name);
        else if (term instanceof Struct) pending.push(...term.args);
      }
    }
    while (true) {
      const name = `_${this.count}`;
      this.count++;
      if (!this.used.has(name)) return name;
    }
  }
}

// Every _ in a clause is a variable of its own. A term without one is
// returned as it is.
function renameAnonymous(term, counter) {
  if (term instanceof Var) return term.name === '_' ? new Var(counter.next()) : term;
  if (!(term instanceof Struct)) return term;
  let args = null;
  const given = term.args;
  for (let index = 0; index < given.length; index++) {
    const arg = given[index];
    if (arg instanceof Struct || (arg instanceof Var && arg.name === '_')) {
      const renamed = renameAnonymous(arg, counter);
      if (renamed !== arg) {
        if (args === null) args = [...given];
        args[index] = renamed;
      }
    }
  }
  return args === null ? term : new Struct(term.name, args);
}

// Collects the clauses a program states, in order.
// The line of the statement call being run, when the call names it (see
// markStatements); otherwise statements find it on the stack.
let statedLine = null;

class Builder {
  constructor(locate) {
    this.sources = [];
    this.locate = locate;
  }

  add(kind, head, body, line = null) {
    if (line === null) line = statedLine !== null ? statedLine : this.locate();
    const counter = new Anonymous(head, body);
    // In the order the statement writes them: a forward rule, implies(),
    // writes its premise first.
    if (kind !== 'backward') {
      body = body.map((goal) => renameAnonymous(goal, counter));
      head = renameAnonymous(head, counter);
    } else {
      head = renameAnonymous(head, counter);
      body = body.map((goal) => renameAnonymous(goal, counter));
    }
    for (const goal of body) {
      if (!(goal instanceof Var) && typeof goal !== 'string' && !(goal instanceof Struct)) {
        throw new EyecodeError('a goal must be an atom, a compound term or a variable, not a number');
      }
      if (goal instanceof Struct && goal.name === '.' && goal.args.length === 2) {
        throw new EyecodeError('an open list is not a goal');
      }
      if (goal === EMPTY) throw new EyecodeError('an empty array is not a goal');
    }
    this.sources.push(new Source(kind, head, body, line));
  }
}

const NAME_LIST = /[\s,]+/;

function names(spec) {
  return String(spec).split(NAME_LIST).filter(Boolean);
}

const PLAIN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const RESERVED_NAMES = new Set([...PRIMITIVE_KEYS, ...CONTROL_KEYS, ...RESERVED_KEYS].map(keyName));
for (const name of RESERVED_CALLS) RESERVED_NAMES.add(name);

function predicate(name) {
  const make = (...args) => {
    if (!args.length) return name;
    // float(N) on a number is the float N, which an integral number could
    // not otherwise write.
    if (name === 'float' && args.length === 1 && typeof args[0] === 'number' && Number.isFinite(args[0])) {
      return new FloatLiteral(args[0]);
    }
    return new Struct(name, args.map(toTerm));
  };
  Object.defineProperty(make, PREDICATE, { value: name });
  Object.defineProperty(make, Symbol.toPrimitive, { value: refuseOperators });
  return make;
}

function control(name, arity) {
  return (...args) => {
    if (args.length !== arity) throw new EyecodeError(`${name} takes ${arity} arguments, got ${args.length}`);
    return new Struct(name, args.map(toTerm));
  };
}

const TRUE_ATOM = 'true';

// The programs being built, innermost last: a statement states its clause
// into the innermost, so a program can build another with eyecode.build().
const builders = [];

function active() {
  if (!builders.length) throw new EyecodeError('a statement states a clause only while a program is built');
  return builders[builders.length - 1];
}

// Build a program with builder innermost while statements() runs.
function within(builder, statements) {
  builders.push(builder);
  try {
    statements();
  } finally {
    builders.pop();
  }
  return builder;
}

// The library, as a program reaches it: eyecode.run(eyecode.build(rules)), and
// the readers and writers of documents, so a program can reason over the
// proofs and reports of another in the same language.
const LIBRARY = Object.freeze({
  run,
  build: (statements) => build(statements),
  checkProof,
  checkReport,
  verdictText,
  readTerm,
  readTerms,
  write,
});

// The names a program is given: the statements and the terms it builds goals
// with. The statements report to the innermost program being built.
function exportsFor(io) {
  const builder = {
    add: (...args) => active().add(...args),
    locate: () => (statedLine !== null ? statedLine : active().locate()),
  };
  const statements = {
    fact: (...terms) => {
      for (const term of terms) builder.add('fact', toTerm(term), []);
    },
    implies: (premise, conclusion) => builder.add('forward', goalOf(conclusion), [goalOf(premise)]),
    implied_by: (conclusion, premise) => builder.add('backward', toTerm(conclusion), [goalOf(premise)]),
    query: (...body) => builder.add('query', TRUE_ATOM, body.map(goalOf)),
    contradiction: (...body) => builder.add('contradiction', 'false', body.map(goalOf)),
    facts_from: (source) => {
      const line = builder.locate();
      let documentText;
      let label;
      if (source !== null && typeof source === 'object' && typeof source.text === 'string') {
        documentText = source.text;
        label = 'the text';
      } else if (typeof source === 'string') {
        if (!io || !io.readFile) throw new EyecodeError('facts_from(path) needs a file system; pass {text: ...} instead');
        documentText = io.readFile(source);
        label = source;
      } else {
        throw new EyecodeError('facts_from needs a path or {text: ...}');
      }
      let terms;
      try {
        terms = readTerms(documentText);
      } catch (error) {
        // The document's own line, named so it is not taken for the program's.
        if (error instanceof EyecodeError) throw new EyecodeError(`${label}: ${error.message}`);
        throw error;
      }
      // Each fact is stated by this call, so it records the call's line, as
      // every clause records the line of the statement that states it.
      for (const [term] of terms) builder.add('fact', term, [], line);
    },
    struct: (name, ...args) => {
      if (typeof name !== 'string') throw new EyecodeError('struct() needs a name string first');
      return args.length ? new Struct(name, args.map(toTerm)) : name;
    },
    preds: (spec) => {
      const made = names(spec).map((name) => {
        if (!PLAIN.test(name) || RESERVED_WORDS.has(name)) throw new EyecodeError(`'${name}' is not a valid predicate name`);
        if (RESERVED_NAMES.has(name)) throw new EyecodeError(`'${name}' is a reserved name`);
        return predicate(name);
      });
      return made.length === 1 ? made[0] : made;
    },
    vars: (spec) => {
      const made = names(spec).map((name) => {
        if (!PLAIN.test(name) || RESERVED_WORDS.has(name)) throw new EyecodeError(`'${name}' is not a valid variable name`);
        return new Var(name);
      });
      return made.length === 1 ? made[0] : made;
    },
    // The controls. An array or several goals are their conjunction.
    and: (...goals) => joined(goals),
    or: (...goals) => {
      if (!goals.length) return 'fail';
      let result = goalOf(goals[0]);
      for (const goal of goals.slice(1)) result = new Struct('or', [result, goalOf(goal)]);
      return result;
    },
    not: (...goals) => new Struct('not', [joined(goals)]),
    call: (...goals) => new Struct('call', [joined(goals)]),
    once: (...goals) => new Struct('once', [joined(goals)]),
    findall: (template, goal, result) => new Struct('findall', [toTerm(template), goalOf(goal), toTerm(result)]),
    fail: 'fail',
    eyecode: LIBRARY,
  };
  const named = new Set(STATEMENT_NAMES.map((name) => statements[name]));
  // A statement call rewritten by markStatements: the statement, run with its
  // line known.
  Object.defineProperty(statements, AT, {
    value: (statement, line) => {
      if (!named.has(statement)) return statement;
      return (...args) => {
        const outer = statedLine;
        statedLine = line;
        try {
          return statement(...args);
        } finally {
          statedLine = outer;
        }
      };
    },
  });
  for (const primitiveKey of PRIMITIVE_KEYS) {
    const name = keyName(primitiveKey);
    const arity = Number(primitiveKey.slice(name.length + 1));
    if (arity > 0) statements[name] = control(name, arity);
  }
  return statements;
}

// JavaScript globals a program keeps, to compute its clauses with. Any other
// name it does not define is a variable or a predicate: Date, Map or Object
// are variables, as logic programs name them; globalThis.Date still reaches
// the global.
const KEPT = new Set([
  'Math', 'JSON', 'BigInt', 'Infinity', 'NaN', 'undefined', 'console', 'globalThis', 'parseInt',
  'parseFloat', 'isNaN', 'isFinite',
]);

// The scope a program runs in: every name it does not define resolves here.
function programScope(exported) {
  const locals = new Map();
  const predicates = new Map();
  // Variables are matched by name and each _ is renamed where it occurs, so
  // one Var per name serves every use.
  const variables = new Map();
  return new Proxy(Object.create(null), {
    has(target, name) {
      // The scope parameter itself is not a name of the program's.
      return typeof name === 'string' && !KEPT.has(name) && name !== SCOPE;
    },
    get(target, name) {
      if (typeof name !== 'string') return undefined;
      if (locals.has(name)) return locals.get(name);
      if (Object.hasOwn(exported, name)) return exported[name];
      const first = name.charCodeAt(0);
      if ((first >= 65 && first <= 90) || first === 95) {
        let variable = variables.get(name);
        if (variable === undefined) {
          variable = new Var(name);
          variables.set(name, variable);
        }
        return variable;
      }
      let made = predicates.get(name);
      if (made === undefined) {
        made = predicate(name);
        predicates.set(name, made);
      }
      return made;
    },
    set(target, name, value) {
      // var declarations and plain assignments of a sloppy script land here.
      locals.set(name, value);
      return true;
    },
  });
}

// Where the statement being run is: the line of the innermost program frame
// on the stack.
let serial = 0;
const FRAME = /eyecode-program-(\d+)\.js:(\d+):\d+/;

function frameLines(stack, id) {
  const lines = [];
  for (const line of String(stack).split('\n')) {
    const match = FRAME.exec(line);
    if (match && Number(match[1]) === id) lines.push(Number(match[2]));
  }
  return lines;
}

// The line a program's first line is reported as, found once by compiling a
// probe the same way programs are compiled.
let firstLine = null;
function lineOffset() {
  if (firstLine === null) {
    const probe = compile('return new Error().stack', 'eyecode-program-0.js');
    const lines = frameLines(probe({}), 0);
    firstLine = lines.length ? lines[0] : 3;
  }
  return firstLine;
}

const AT = '__eyecode_at__';
const SCOPE = '__eyecode_scope__';
const STATEMENT_NAMES = ['fact', 'implies', 'implied_by', 'query', 'contradiction', 'facts_from'];
const STATEMENT_SET = new Set(STATEMENT_NAMES);
const IDENTIFIER = /[A-Za-z0-9_$]/;
// Words after which a slash starts a regular expression rather than a division.
const BEFORE_EXPRESSION = new Set(['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'throw', 'else', 'do',
  'instanceof', 'yield', 'await']);

// The program with each call of a statement, such as fact(...), rewritten to
// name its own line: __eyecode_at__(fact, 12)(...). Finding the line of a call
// on the stack costs microseconds, which adds up over a program that states a
// hundred thousand clauses. The rewriting adds no line breaks, skips strings,
// comments, template text and regular expressions, and leaves property calls
// and declarations alone; a call it misses still finds its line on the stack.
// It also lists, in names, every name the program could look up in its
// scope, and clears plain when the program has code it cannot see through:
// a name with a character outside ASCII or an escape, or eval, Function or
// with, which could reach a name it does not list.
function markStatements(source, names = new Set()) {
  let plain = true;
  const out = [];
  const templates = []; // for each open brace: true when it closes a template's ${
  let from = 0;
  let line = 1;
  let i = 0;
  let previous = ''; // the previous token: an identifier, or one punctuation character
  const n = source.length;
  const skipTo = (end) => {
    for (; i < end; i++) if (source[i] === '\n') line++;
  };
  const template = () => {
    // From inside a template's text to its end, or to a ${ that opens code.
    while (i < n) {
      const ch = source[i];
      if (ch === '\\') skipTo(i + 2);
      else if (ch === '`') {
        i++;
        previous = ')';
        return;
      } else if (ch === '$' && source[i + 1] === '{') {
        i += 2;
        templates.push(true);
        previous = '{';
        return;
      } else skipTo(i + 1);
    }
  };
  while (i < n) {
    const ch = source[i];
    if (ch === '\n') {
      line++;
      i++;
    } else if (ch === ' ' || ch === '\t' || ch === '\r') {
      i++;
    } else if (ch === '/' && source[i + 1] === '/') {
      while (i < n && source[i] !== '\n') i++;
    } else if (ch === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      skipTo(end < 0 ? n : end + 2);
    } else if (ch === "'" || ch === '"') {
      i++;
      while (i < n && source[i] !== ch && source[i] !== '\n') skipTo(source[i] === '\\' ? i + 2 : i + 1);
      i++;
      previous = ')';
    } else if (ch === '`') {
      i++;
      template();
    } else if (ch === '/' && (previous === '' || BEFORE_EXPRESSION.has(previous) || '(,=:[!&|?{};+-*%<>~^'.includes(previous))) {
      // A regular expression literal.
      i++;
      let inClass = false;
      while (i < n && source[i] !== '\n' && (inClass || source[i] !== '/')) {
        if (source[i] === '\\') i++;
        else if (source[i] === '[') inClass = true;
        else if (source[i] === ']') inClass = false;
        i++;
      }
      i++;
      while (i < n && IDENTIFIER.test(source[i])) i++;
      previous = ')';
    } else if (IDENTIFIER.test(ch)) {
      const start = i;
      while (i < n && IDENTIFIER.test(source[i])) i++;
      const word = source.slice(start, i);
      if (previous !== '.' && !/^[0-9]/.test(word)) {
        if (UNSEEN.has(word)) plain = false;
        names.add(word);
      }
      if (STATEMENT_SET.has(word) && previous !== '.' && previous !== 'function') {
        let next = i;
        while (source[next] === ' ' || source[next] === '\t') next++;
        if (source[next] === '(') {
          out.push(source.slice(from, start), `${AT}(${word}, ${line})`);
          names.add(AT);
          from = i;
        }
      }
      previous = /^[0-9]/.test(word) ? ')' : word;
    } else if (ch === '{') {
      templates.push(false);
      previous = '{';
      i++;
    } else if (ch === '}') {
      i++;
      if (templates.pop()) template();
      else previous = '}';
    } else if (ch === '.' && source[i + 1] === '.' && source[i + 2] === '.') {
      // A spread, [H, ...T]: the name after it is looked up, not a property.
      previous = ',';
      i += 3;
    } else {
      if (ch === '\\' || ch.charCodeAt(0) > 127) plain = false;
      previous = ch === ')' || ch === ']' ? ')' : ch;
      i++;
    }
  }
  out.push(source.slice(from));
  return { code: out.join(''), names, plain };
}

// Names that let a program reach a name without writing it.
const UNSEEN = new Set(['eval', 'Function', 'with']);
// Names a program cannot declare, or that keep their global meaning.
const NOT_LOOKED_UP = new Set([...RESERVED_WORDS, 'arguments', 'eval', 'of', 'get', 'set', 'async']);

// The line of the innermost frame of the script at url, or null when none is
// on the stack. Where the host gives stack frames as objects (V8), they are
// read directly, which is many times faster than formatting the stack as
// text for every statement; elsewhere this returns undefined and the text is
// searched.
function innermostLine(url) {
  if (typeof Error.captureStackTrace !== 'function') return undefined;
  // A statement is usually called from the program itself, a few frames up,
  // so a short stack is captured first and the whole one only when needed.
  for (const limit of [10, Infinity]) {
    const frames = callSites(limit);
    if (!Array.isArray(frames)) return undefined;
    for (const frame of frames) {
      if (frame.getScriptNameOrSourceURL() === url) return frame.getLineNumber();
    }
    if (frames.length < limit) break;
  }
  return null;
}

function callSites(limit) {
  const prepare = Error.prepareStackTrace;
  const stackLimit = Error.stackTraceLimit;
  const holder = {};
  try {
    Error.prepareStackTrace = (_, sites) => sites;
    Error.stackTraceLimit = limit;
    Error.captureStackTrace(holder, innermostLine);
    return holder.stack;
  } finally {
    Error.prepareStackTrace = prepare;
    Error.stackTraceLimit = stackLimit;
  }
}

// The function that runs a program's source in its scope. Given the names
// the program looks up, each is looked up once, before the program runs, and
// the program runs as a function of its own inside them: code directly
// inside with is never optimized, and a loop stating a hundred thousand
// clauses would otherwise look every name up through the scope on every
// pass. A name the list misses still reaches the scope, only more slowly.
// The program's own declarations shadow these names, as they shadow the
// scope. Either way the source starts on the function's second line, so line
// numbers agree.
function compile(source, url, names = null) {
  if (names !== null) {
    const looked = [...names].filter((name) => !NOT_LOOKED_UP.has(name) && !KEPT.has(name));
    const declared = looked.map((name) => `${name} = __eyecode_scope__.${name}`).join(', ');
    // eslint-disable-next-line no-new-func
    return new Function('__eyecode_scope__',
      `with (__eyecode_scope__) { ${declared ? `let ${declared}; ` : ''}return (function () {\n${source}\n})(); }\n//# sourceURL=${url}`);
  }
  // eslint-disable-next-line no-new-func
  return new Function('__eyecode_scope__', `with (__eyecode_scope__) {\n${source}\n}\n//# sourceURL=${url}`);
}

const PROOF_LINE = /^step\(/m;
const LEADING_CALL = /^([A-Za-z_$][\w$]*)[ \t]*\(/gm;
const DECLARED = /\b(?:function\s*\*?\s*|class\s+|(?:const|let|var)\s+)([A-Za-z_$][\w$]*)|^[ \t]*([A-Za-z_$][\w$]*)[ \t]*=(?!=)/gm;
// Statements of earlier versions, and what states the same clause now.
const RENAMED = { forward: 'implies(Premise, Conclusion), premise first', backward: 'implied_by(Conclusion, Premise)' };

// A top-level call of an implicit predicate states nothing: a misspelled fact?
function checkStatements(source, exported) {
  const declared = new Set();
  for (const match of source.matchAll(DECLARED)) declared.add(match[1] || match[2]);
  for (const match of source.matchAll(LEADING_CALL)) {
    const name = match[1];
    if (Object.hasOwn(exported, name) || KEPT.has(name) || declared.has(name) || /^[A-Z_]/.test(name)) continue;
    if (RESERVED_WORDS.has(name)) continue;
    const line = source.slice(0, match.index).split('\n').length;
    if (Object.hasOwn(RENAMED, name)) throw new EyecodeError(`line ${line}: ${name}(...) is now ${RENAMED[name]}`);
    throw new EyecodeError(`line ${line}: ${name}(...) on its own states nothing; ` +
                          `write fact(${name}(...)) to state it, or check the spelling`);
  }
}

// The program line an error came from, unless it already names one.
function withLine(error, stack, id) {
  const lines = frameLines(stack, id).map((line) => line - lineOffset() + 1);
  const where = lines.length ? `line ${lines[0]}: ` : '';
  if (error instanceof EyecodeError) {
    if (error.message.startsWith('line ') || !where) return error;
    return new EyecodeError(`${where}${error.message}`);
  }
  return new EyecodeError(`${where}${error.name || 'Error'}: ${error.message}`);
}

// Run one program's source, stating its clauses into builder.
function execute(source, filename, builder, io) {
  if (PROOF_LINE.test(source)) {
    throw new EyecodeError('this is a proof document, not a program: check it with --check-proof PROOF PROGRAM');
  }
  if (io && io.checkSyntax) io.checkSyntax(source, filename);
  const exported = exportsFor(io);
  checkStatements(source, exported);
  serial++;
  const id = serial;
  const url = `eyecode-program-${id}.js`;
  let fn;
  try {
    const marked = markStatements(source);
    try {
      fn = compile(marked.code, url, marked.plain ? marked.names : null);
    } catch {
      fn = compile(marked.code, url);
    }
  } catch {
    // Should the rewriting ever break the program, it runs as written.
    try {
      fn = compile(source, url);
    } catch (error) {
      throw new EyecodeError(`${filename}: ${error.name}: ${error.message}`);
    }
  }
  builder.locate = () => {
    const line = innermostLine(url);
    if (line !== undefined) return line === null ? null : line - lineOffset() + 1;
    const lines = frameLines(new Error().stack, id);
    return lines.length ? lines[0] - lineOffset() + 1 : null;
  };
  try {
    within(builder, () => fn(programScope(exported)));
  } catch (error) {
    throw withLine(error, error && error.stack, id);
  }
}

// A Program from JavaScript source text. io supplies readFile for
// facts_from(path) and, where the host can, checkSyntax for better syntax
// error messages.
export function loadText(source, filename = '<program>', io = null) {
  const builder = new Builder(() => null);
  execute(String(source).replace(/^#![^\n]*/, ''), filename, builder, io);
  return new Program(builder.sources);
}

// One Program from several sources, given as [text, filename] pairs, run in
// order.
export function loadSources(sources, io = null) {
  const builder = new Builder(() => null);
  for (const [source, filename] of sources) {
    execute(String(source).replace(/^#![^\n]*/, ''), filename, builder, io);
  }
  return new Program(builder.sources);
}

// A Program from a function that states clauses when called: a function of a
// program, which states them with the names the program uses, or one of
// library code, which is handed those names.
export function build(statements) {
  const outer = builders.length ? builders[builders.length - 1] : null;
  const builder = new Builder(outer ? outer.locate : () => null);
  within(builder, () => statements(exportsFor(null)));
  return new Program(builder.sources);
}

export { FloatLiteral, PREDICATE };
