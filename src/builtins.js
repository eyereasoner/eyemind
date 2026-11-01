// The pure primitives.
//
// Only pure primitives belong here. Collections, call and negation are
// controls handled by the solver and explicitly distinguished in proof
// documents.
//
// A test decides a goal at most once: it is handed the goal's arguments, the
// same arguments dereferenced, the substitution and a bind function, and says
// whether the goal holds. Any bindings it made on the way to failing are
// undone for it. A relation can hold several times: it is a generator that
// yields once per solution, and the solver undoes the bindings of one
// solution before asking for the next.
import * as arith from './arith.js';
import {
  EyecodeError, Struct, Var, codePoints, compareTerms, copyResolved, deref, identity, isGround, key,
  listFromItems, nonfinite, properListItems, unify,
} from './terms.js';
import { floatText } from './writer.js';

function comparison(holds) {
  return (args, resolved, env) => holds(arith.compare(args[0], args[1], env));
}

function same(args, env) {
  return identity(copyResolved(args[0], env)) === identity(copyResolved(args[1], env));
}

function notUnify(args, resolved, env) {
  const mark = env.mark();
  const unifies = unify(args[0], args[1], env);
  env.undo(mark);
  return !unifies;
}

function boundedInteger(term, low, high) {
  if (typeof term !== 'bigint' || term < 0n) throw new EyecodeError('expected a nonnegative integer');
  if (term < BigInt(low) || term > BigInt(high)) throw new EyecodeError(`integer outside ${low}..${high}`);
  return Number(term);
}

let functorSerial = 0;

function functor(args, resolved, env, bind) {
  const [term, name, arity] = resolved;
  if (!(term instanceof Var)) {
    if (term instanceof Struct) return bind(args[1], term.name) && bind(args[2], BigInt(term.args.length));
    return bind(args[1], term) && bind(args[2], 0n);
  }
  const count = boundedInteger(arity, 0, 1024);
  if (name instanceof Var) throw new EyecodeError('functor/3 needs a bound name');
  if (count > 0 && typeof name !== 'string') throw new EyecodeError('functor/3 needs an atom name');
  // Unique names across primitive invocations preserve variable isolation.
  functorSerial++;
  if (count === 0) return bind(args[0], name);
  const fresh = [];
  for (let i = 0; i < count; i++) fresh.push(new Var(`_functor${functorSerial}_${i}`));
  return bind(args[0], new Struct(name, fresh));
}

function arg(args, resolved, env, bind) {
  const [position, term] = resolved;
  const index = boundedInteger(position, 1, 1024);
  return term instanceof Struct && index <= term.args.length && bind(args[2], term.args[index - 1]);
}

function univ(args, resolved, env, bind) {
  const term = resolved[0];
  if (!(term instanceof Var)) {
    if (term instanceof Struct) return bind(args[1], listFromItems([term.name, ...term.args]));
    return bind(args[1], listFromItems([term]));
  }
  let items = properListItems(args[1], env);
  items = items === null ? null : items.map((item) => deref(item, env));
  if (!items || !items.length || items[0] instanceof Var || (items.length > 1 && typeof items[0] !== 'string')) {
    throw new EyecodeError('univ/2 needs a nonempty bound term list');
  }
  return bind(args[0], items.length === 1 ? items[0] : new Struct(items[0], items.slice(1)));
}

function atomText(name, codes) {
  return (args, resolved, env, bind) => {
    const term = resolved[0];
    if (typeof term === 'string') {
      const items = codes ? codePoints(term).map(BigInt) : Array.from(term);
      return bind(args[1], listFromItems(items));
    }
    const items = properListItems(args[1], env);
    if (items === null) throw new EyecodeError(`${name} needs a proper list`);
    const chars = [];
    for (let item of items) {
      item = deref(item, env);
      if (codes) {
        chars.push(String.fromCodePoint(boundedInteger(item, 0, 0x10ffff)));
      } else {
        if (typeof item !== 'string' || Array.from(item).length !== 1) {
          throw new EyecodeError('atom_chars/2 needs characters');
        }
        chars.push(item);
      }
    }
    return bind(args[0], chars.join(''));
  };
}

// A number's text: an optional sign, digits, and a fraction or an exponent for
// a float. Leading zeros are allowed, as in RDF's lexical forms.
const NUMBER_TEXT = /^[+-]?(?:([0-9]+)|(?:[0-9]+\.[0-9]*|\.[0-9]+)(?:[eE][+-]?[0-9]+)?|[0-9]+[eE][+-]?[0-9]+)$/;

// number_chars(?N, +L) reads the characters as an integer or a float, and
// fails on other text; number_chars(+N, -L) spells N in its canonical text. A
// bound list is read even when N is bound, so '007' gives 7 either way.
function numberChars(args, resolved, env, bind) {
  const number = resolved[0];
  if (!(number instanceof Var) && typeof number !== 'bigint' && typeof number !== 'number') {
    throw new EyecodeError('number_chars/2 needs a number or an unbound first argument');
  }
  const items = properListItems(args[1], env)?.map((item) => deref(item, env));
  if (!items || items.some((item) => item instanceof Var)) {
    if (number instanceof Var) throw new EyecodeError('number_chars/2 needs a number or a proper list of characters');
    const text = typeof number === 'bigint' ? number.toString() : floatText(number);
    return bind(args[1], listFromItems(Array.from(text)));
  }
  if (items.some((item) => typeof item !== 'string' || Array.from(item).length !== 1)) {
    throw new EyecodeError('number_chars/2 needs characters');
  }
  const text = items.join('');
  const match = NUMBER_TEXT.exec(text);
  if (!match) return false;
  if (match[1] !== undefined) return bind(args[0], BigInt(text));
  const value = Number(text);
  if (!Number.isFinite(value)) throw nonfinite(value, 'number_chars/2: ');
  return bind(args[0], value);
}

function atomLength(args, resolved, env, bind) {
  if (typeof resolved[0] !== 'string') throw new EyecodeError('atom_length/2 needs a bound atom');
  return bind(args[1], BigInt(Array.from(resolved[0]).length));
}

function compare(args, resolved, env, bind) {
  const order = compareTerms(copyResolved(args[1], env), copyResolved(args[2], env));
  return bind(args[0], order < 0 ? '<' : order > 0 ? '>' : '=');
}

function is(args, resolved, env, bind) {
  return bind(args[0], arith.evaluate(args[1], env));
}

const isNumberValue = (term) => typeof term === 'bigint' || typeof term === 'number';

export const TESTS = new Map([
  ['true/0', () => true],
  ['fail/0', () => false],
  ['false/0', () => false],
  ['unify/2', (args, resolved, env, bind) => bind(args[0], args[1])],
  ['not_unify/2', notUnify],
  ['identical/2', (args, resolved, env) => same(args, env)],
  ['not_identical/2', (args, resolved, env) => !same(args, env)],
  ['is/2', is],
  ['eq/2', comparison((n) => n === 0)],
  ['ne/2', comparison((n) => n !== 0)],
  ['lt/2', comparison((n) => n < 0)],
  ['le/2', comparison((n) => n <= 0)],
  ['gt/2', comparison((n) => n > 0)],
  ['ge/2', comparison((n) => n >= 0)],
  ['is_var/1', (args, resolved) => resolved[0] instanceof Var],
  ['is_nonvar/1', (args, resolved) => !(resolved[0] instanceof Var)],
  ['is_ground/1', (args, resolved, env) => isGround(args[0], env)],
  ['is_atom/1', (args, resolved) => typeof resolved[0] === 'string'],
  ['is_number/1', (args, resolved) => isNumberValue(resolved[0])],
  ['is_int/1', (args, resolved) => typeof resolved[0] === 'bigint'],
  ['is_float/1', (args, resolved) => typeof resolved[0] === 'number'],
  ['is_compound/1', (args, resolved) => resolved[0] instanceof Struct],
  ['functor/3', functor],
  ['arg/3', arg],
  ['univ/2', univ],
  ['atom_chars/2', atomText('atom_chars/2', false)],
  ['atom_codes/2', atomText('atom_codes/2', true)],
  ['atom_length/2', atomLength],
  ['number_chars/2', numberChars],
  ['compare/3', compare],
]);

function* atomConcat(args, resolved, env, mark) {
  const [left, right, whole] = resolved;
  if (typeof left === 'string' && typeof right === 'string') {
    if (unify(args[2], left + right, env)) yield env;
    else env.undo(mark);
    return;
  }
  if (typeof whole !== 'string') throw new EyecodeError('atom_concat/3 needs the result or both operands bound');
  const chars = Array.from(whole);
  for (let i = 0; i <= chars.length; i++) {
    if (unify(args[0], chars.slice(0, i).join(''), env) && unify(args[1], chars.slice(i).join(''), env)) yield env;
    env.undo(mark);
  }
}

export const RELATIONS = new Map([['atom_concat/3', atomConcat]]);
export const PRIMITIVE_KEYS = new Set([...TESTS.keys(), ...RELATIONS.keys()]);

// Solve a primitive goal: a generator yielding env once per solution.
export function* primitive(goal, env) {
  const goalKey = key(goal);
  const args = goal instanceof Struct ? goal.args : [];
  const resolved = args.map((a) => deref(a, env));
  const mark = env.mark();
  const test = TESTS.get(goalKey);
  if (test === undefined) {
    const relation = RELATIONS.get(goalKey);
    if (relation === undefined) throw new EyecodeError(`unsupported primitive ${goalKey}`);
    yield* relation(args, resolved, env, mark);
    return;
  }
  if (test(args, resolved, env, (a, b) => unify(a, b, env))) yield env;
  else env.undo(mark);
}
