// Finite-tree terms, substitutions, unification and the standard order.
//
// A term is one of
//   - a string: an atom ('socrates'; '[]' is the empty list),
//   - a bigint: an integer, of unbounded size,
//   - a number: a float, an IEEE-754 double,
//   - a Var: a logical variable, identified by its name,
//   - a Struct: a compound term, a name with an array of argument terms.
// A list is built from Struct('.', [Head, Tail]) cells ending in '[]'.
// Terms never change once built.

export const EMPTY = '[]';

export class EyecodeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EyecodeError';
  }
}

// A variable is known by its name: two Var objects with one name are one
// variable. A variable the engine makes in renaming a clause apart is fresh:
// its name carries a serial no other variable of the run has, so it is the
// only object with that name, and the first Env to bind it keeps its binding
// on the object itself (owner and value) rather than in a map by name.
// owner is undefined for a variable that is not fresh, null for a fresh one
// not bound yet.
export class Var {
  constructor(name, fresh = false) {
    this.name = name;
    this.owner = fresh ? null : undefined;
    this.value = undefined;
  }

  // Lets [H, ...T] write an open list: spreading a variable yields its tail.
  *[Symbol.iterator]() {
    yield new Tail(this);
  }
}

export class Struct {
  constructor(name, args) {
    this.name = name;
    this.args = args;
  }

  *[Symbol.iterator]() {
    yield new Tail(this);
  }
}

// The rest of an open list: [H, ...T] spreads T, which yields one Tail.
export class Tail {
  constructor(term) {
    this.term = term;
  }
}

export const isVar = (term) => term instanceof Var;
export const isStruct = (term) => term instanceof Struct;
export const isAtom = (term) => typeof term === 'string';
export const isInt = (term) => typeof term === 'bigint';
export const isFloat = (term) => typeof term === 'number';
export const isNumber = (term) => typeof term === 'bigint' || typeof term === 'number';
export const isCallable = (term) => typeof term === 'string' || term instanceof Struct;

// 0, 1, 2 or 3: the rank of a term's kind in the standard order.
function kindRank(term) {
  if (term instanceof Var) return 0;
  const type = typeof term;
  if (type === 'bigint' || type === 'number') return 1;
  if (type === 'string') return 2;
  return 3;
}

export function nonfinite(value, where = '') {
  return new EyecodeError(`${where}a float term must be finite, not ${value}`);
}

export function cons(head, tail) {
  return new Struct('.', [head, tail]);
}

export function listFromItems(items, tail = EMPTY) {
  let result = tail;
  for (let i = items.length - 1; i >= 0; i--) result = new Struct('.', [items[i], result]);
  return result;
}

export function isCons(term) {
  return term instanceof Struct && term.name === '.' && term.args.length === 2;
}

export function properListItems(term, env) {
  const items = [];
  let cursor = deref(term, env);
  while (cursor instanceof Struct && cursor.name === '.' && cursor.args.length === 2) {
    items.push(cursor.args[0]);
    cursor = deref(cursor.args[1], env);
  }
  return cursor === EMPTY ? items : null;
}

// The name/arity of a callable term, as a string usable as a map key.
export function key(term) {
  return typeof term === 'string' ? `${term}/0` : `${term.name}/${term.args.length}`;
}

export function keyName(goalKey) {
  return goalKey.slice(0, goalKey.lastIndexOf('/'));
}

export function keyArity(goalKey) {
  return Number(goalKey.slice(goalKey.lastIndexOf('/') + 1));
}

export function isTerm(term, name, arity) {
  if (typeof term === 'string') return arity === 0 && term === name;
  return term instanceof Struct && term.name === name && term.args.length === arity;
}

export function flattenConjunction(goal) {
  const out = [];
  const stack = [goal];
  while (stack.length) {
    const current = stack.pop();
    if (current instanceof Struct && current.name === 'and' && current.args.length === 2) {
      stack.push(current.args[1]);
      stack.push(current.args[0]);
    } else {
      out.push(current);
    }
  }
  return out;
}

// Goals joined left to right: [g1, g2, g3] is and(and(g1, g2), g3).
export function conjunction(items) {
  if (!items.length) return 'true';
  let result = items[0];
  for (let i = 1; i < items.length; i++) result = new Struct('and', [result, items[i]]);
  return result;
}

// One substitution per search, with an undo trail. Backtracking restores the
// bindings a failed branch made instead of copying the whole map for every
// alternative. A fresh variable this Env owns keeps its binding on the object;
// every other variable is bound by name in the map. The trail records each
// variable object or name with the value it had, so rebinding, which path
// compression in deref does, undoes correctly.
export class Env {
  constructor() {
    this.bindings = new Map();
    this.trail = [];
  }

  mark() {
    return this.trail.length;
  }

  isEmpty() {
    return this.trail.length === 0;
  }

  undo(mark) {
    const { trail, bindings } = this;
    while (trail.length > mark) {
      const previous = trail.pop();
      const target = trail.pop();
      if (typeof target !== 'string') {
        target.value = previous;
      } else if (previous === undefined) {
        bindings.delete(target);
      } else {
        bindings.set(target, previous);
      }
    }
  }

  // The value bound to a variable, or undefined. A fresh variable no Env
  // has bound yet is unbound everywhere: binding it would have claimed it.
  lookup(variable) {
    const owner = variable.owner;
    if (owner === this) return variable.value;
    return owner === null ? undefined : this.bindings.get(variable.name);
  }

  bind(variable, value) {
    const owner = variable.owner;
    if (owner === this || owner === null) {
      variable.owner = this;
      this.trail.push(variable, variable.value);
      variable.value = value;
    } else {
      // Not fresh, or fresh but owned by another Env: its name is its key.
      const name = variable.name;
      this.trail.push(name, this.bindings.get(name));
      this.bindings.set(name, value);
    }
  }
}

export function deref(term, env) {
  if (!(term instanceof Var)) return term;
  let value = env.lookup(term);
  if (value === undefined) return term;
  if (!(value instanceof Var)) return value;
  // Resolving a chain of variable-to-variable bindings records where the
  // whole chain ended, so a variable threaded through N resolution steps is
  // not re-walked on every dereference.
  // The last variable walked is already bound to the end of the chain, so
  // only the ones before it are rebound; a variable bound to an unbound one
  // needs no rebinding, and leaves nothing on the trail.
  const chain = [term];
  while (value instanceof Var) {
    const following = env.lookup(value);
    if (following === undefined) break;
    chain.push(value);
    value = following;
  }
  for (let i = 0; i < chain.length - 1; i++) env.bind(chain[i], value);
  return value;
}

function occurs(name, term, env) {
  const pending = [term];
  while (pending.length) {
    const item = deref(pending.pop(), env);
    if (item instanceof Var) {
      if (item.name === name) return true;
    } else if (item instanceof Struct) {
      for (const arg of item.args) pending.push(arg);
    }
  }
  return false;
}

// Atoms, integers and floats are equal when they are of the same kind and
// value: 7n and 7 stay distinct.
function sameConstant(a, b) {
  return typeof a === typeof b && a === b;
}

// Unify on finite trees: the occurs check always applies.
export function unify(left, right, env) {
  const pending = [left, right];
  while (pending.length) {
    let b = pending.pop();
    let a = pending.pop();
    if (b instanceof Var) b = deref(b, env);
    if (a instanceof Var) a = deref(a, env);
    if (a === b) continue;
    if (a instanceof Var) {
      if (b instanceof Var && a.name === b.name) continue;
      if (b instanceof Struct && occurs(a.name, b, env)) return false;
      env.bind(a, b);
    } else if (b instanceof Var) {
      if (a instanceof Struct && occurs(b.name, a, env)) return false;
      env.bind(b, a);
    } else if (a instanceof Struct) {
      if (!(b instanceof Struct) || a.name !== b.name || a.args.length !== b.args.length) return false;
      const argsA = a.args;
      const argsB = b.args;
      for (let i = argsA.length - 1; i >= 0; i--) {
        const argA = argsA[i];
        const argB = argsB[i];
        if (argA === argB) continue;
        if (!(argA instanceof Var) && !(argA instanceof Struct) && !(argB instanceof Var)) {
          if (!sameConstant(argA, argB)) return false;
          continue;
        }
        pending.push(argA, argB);
      }
    } else if (b instanceof Struct || !sameConstant(a, b)) {
      return false;
    }
  }
  return true;
}

// Rename a term's variables apart. A subterm without variables is shared.
// unique says no other variable of the run gets this suffix (see Var).
export function freshTerm(term, suffix, names = new Map(), unique = false) {
  if (term instanceof Var) {
    let fresh = names.get(term.name);
    if (fresh === undefined) {
      fresh = new Var(`${term.name}#${suffix}`, unique);
      names.set(term.name, fresh);
    }
    return fresh;
  }
  if (!(term instanceof Struct)) return term;
  const args = term.args;
  let copied = null;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    let copy;
    if (arg instanceof Var) {
      copy = names.get(arg.name);
      if (copy === undefined) {
        copy = new Var(`${arg.name}#${suffix}`, unique);
        names.set(arg.name, copy);
      }
    } else if (arg instanceof Struct) {
      copy = freshTerm(arg, suffix, names, unique);
    } else {
      copy = arg;
    }
    if (copied === null) {
      if (copy === arg) continue;
      copied = args.slice(0, index);
    }
    copied.push(copy);
  }
  return copied === null ? term : new Struct(term.name, copied);
}

// Terms nested deeper than this are copied iteratively instead.
const COPY_DEPTH = 200;
const DEEP = Symbol('deep');

// The term with every bound variable replaced by its value. A subterm that
// resolves to itself is not copied, and a value bound to a variable is copied
// once however often it is used, so shared subterms stay shared.
export function copyResolved(term, env) {
  try {
    return copy(term, env, new Map(), 0);
  } catch (error) {
    if (error !== DEEP) throw error;
    return copyIteratively(term, env);
  }
}

function copy(term, env, memo, depth) {
  if (term instanceof Var) {
    const value = deref(term, env);
    if (!(value instanceof Struct)) return value;
    let copied = memo.get(value);
    if (copied === undefined) {
      copied = copy(value, env, memo, depth);
      memo.set(value, copied);
    }
    return copied;
  }
  if (!(term instanceof Struct)) return term;
  if (depth > COPY_DEPTH) throw DEEP;
  const args = term.args;
  let copied = null;
  for (let position = 0; position < args.length; position++) {
    const arg = args[position];
    const value = arg instanceof Var || arg instanceof Struct ? copy(arg, env, memo, depth + 1) : arg;
    if (copied === null) {
      if (value === arg) continue;
      copied = args.slice(0, position);
    }
    copied.push(value);
  }
  return copied === null ? term : new Struct(term.name, copied);
}

function copyIteratively(term, env) {
  const root = deref(term, env);
  if (!(root instanceof Struct)) return root;
  const done = new Map();
  const stack = [root];
  while (stack.length) {
    const node = stack[stack.length - 1];
    if (done.has(node)) {
      stack.pop();
      continue;
    }
    let missing = false;
    for (const raw of node.args) {
      const arg = deref(raw, env);
      if (arg instanceof Struct && !done.has(arg)) {
        stack.push(arg);
        missing = true;
      }
    }
    if (missing) continue;
    stack.pop();
    const args = [];
    let same = true;
    for (const arg of node.args) {
      let value = deref(arg, env);
      if (value instanceof Struct) value = done.get(value);
      if (value !== arg) same = false;
      args.push(value);
    }
    done.set(node, same ? node : new Struct(node.name, args));
  }
  return done.get(root);
}

// Whether a variable stands for a _ of a program or a document: _0, _1, ...
// in a clause, renamed apart or not, or one a reader made.
export function isAnonymous(variable) {
  const hash = variable.name.indexOf('#');
  const base = hash < 0 ? variable.name : variable.name.slice(0, hash);
  return base === '_' || (base.length > 1 && base[0] === '_' && /^[0-9]+$/.test(base.slice(1)));
}

// Whether every variable left in term, read through env, is anonymous.
export function isGroundButAnonymous(term, env) {
  const pending = [term];
  while (pending.length) {
    const item = deref(pending.pop(), env);
    if (item instanceof Var) {
      if (!isAnonymous(item)) return false;
    } else if (item instanceof Struct) {
      for (const arg of item.args) pending.push(arg);
    }
  }
  return true;
}

export function isGround(term, env = null) {
  const pending = [term];
  let seen = null;
  while (pending.length) {
    let item = pending.pop();
    if (env !== null) item = deref(item, env);
    if (item instanceof Var) return false;
    if (item instanceof Struct) {
      if (seen === null) seen = new Set();
      if (seen.has(item)) continue;
      seen.add(item);
      for (const arg of item.args) pending.push(arg);
    }
  }
  return true;
}

// Whether two terms are identical: what identity() keys alike, decided by
// walking both at once, so it allocates nothing and stops at the first
// difference. Bindings in env are followed. Integers and floats stay apart,
// and so do 0.0 and -0.0, as their texts do.
export function identical(left, right, env = null) {
  const pending = [left, right];
  while (pending.length) {
    let b = pending.pop();
    let a = pending.pop();
    if (env !== null) {
      if (a instanceof Var) a = deref(a, env);
      if (b instanceof Var) b = deref(b, env);
    }
    if (a === b && (typeof a !== 'number' || Object.is(a, b))) continue;
    if (a instanceof Struct) {
      if (!(b instanceof Struct) || a.name !== b.name || a.args.length !== b.args.length) return false;
      for (let i = 0; i < a.args.length; i++) pending.push(a.args[i], b.args[i]);
    } else if (a instanceof Var) {
      if (!(b instanceof Var) || a.name !== b.name) return false;
    } else {
      return false;
    }
  }
  return true;
}

// A key that two terms share exactly when their canonical texts are equal,
// cheaper to make than the text: the term's nodes in prefix order, each with
// a tag. Names and atoms carry their lengths so embedded separators cannot
// collide. Floats keep 0.0 and -0.0 apart as their texts do.
export function identity(term) {
  const out = [];
  const pending = [term];
  while (pending.length) {
    const item = pending.pop();
    if (item instanceof Struct) {
      out.push('\u0000c', String(item.name.length), item.name, String(item.args.length));
      for (let i = item.args.length - 1; i >= 0; i--) pending.push(item.args[i]);
    } else if (typeof item === 'string') {
      out.push('\u0000a', String(item.length), item);
    } else if (typeof item === 'bigint') {
      out.push('\u0000i', String(item));
    } else if (typeof item === 'number') {
      out.push('\u0000f', Object.is(item, -0) ? '-0' : String(item));
    } else {
      out.push('\u0000v', String(item.name.length), item.name);
    }
  }
  return out.join('\u0001');
}

// The variables of a term by name, in order of first appearance.
export function variables(term, result = new Map()) {
  const pending = [term];
  while (pending.length) {
    const item = pending.pop();
    if (item instanceof Var) {
      if (!result.has(item.name)) result.set(item.name, item);
    } else if (item instanceof Struct) {
      for (let i = item.args.length - 1; i >= 0; i--) pending.push(item.args[i]);
    }
  }
  return result;
}

// The code points of a string, in order.
export function codePoints(text) {
  return Array.from(text, (ch) => ch.codePointAt(0));
}

// Strings ordered by the code points of their characters, as the standard
// order requires; JavaScript's < compares UTF-16 code units instead.
export function compareText(a, b) {
  if (a === b) return 0;
  // Equal code units are equal code points, so skip the common prefix unit
  // by unit and decode code points only where the texts differ.
  const length = Math.min(a.length, b.length);
  let i = 0;
  while (i < length && a.charCodeAt(i) === b.charCodeAt(i)) i++;
  if (i === length) return a.length < b.length ? -1 : a.length > b.length ? 1 : 0;
  const x = a.charCodeAt(i);
  const y = b.charCodeAt(i);
  // Outside the surrogates a code unit is its code point.
  if ((x < 0xd800 || x > 0xdfff) && (y < 0xd800 || y > 0xdfff)) return x < y ? -1 : 1;
  // A differing low surrogate completes the pair begun one unit back; the
  // code points there then differ, since their low halves do.
  if (i > 0 && ((x >= 0xdc00 && x <= 0xdfff) || (y >= 0xdc00 && y <= 0xdfff))) {
    const high = a.charCodeAt(i - 1);
    if (high >= 0xd800 && high <= 0xdbff) i--;
  }
  return a.codePointAt(i) < b.codePointAt(i) ? -1 : 1;
}

// -1, 0 or 1: integers and floats compared exactly by value.
export function compareNumbers(a, b) {
  if (typeof a === typeof b) return a < b ? -1 : a > b ? 1 : 0;
  // One is a bigint, the other a finite float.
  const float = typeof a === 'number' ? a : b;
  const integer = typeof a === 'bigint' ? a : b;
  let order;
  if (Number.isInteger(float)) {
    const exact = BigInt(float);
    order = exact < integer ? -1 : exact > integer ? 1 : 0;
  } else {
    const floor = BigInt(Math.floor(float));
    order = floor < integer ? -1 : 1;
  }
  return typeof a === 'number' ? order : -order;
}

// Standard order: variables < numbers < atoms < compound terms. Numbers are
// ordered by value, and a float precedes an integer of equal value. Distinct
// variables are ordered by name, so the order is the same in every comparison.
export function compareTerms(left, right) {
  const pending = [left, right];
  while (pending.length) {
    const r = pending.pop();
    const l = pending.pop();
    const lr = kindRank(l);
    const rr = kindRank(r);
    if (lr !== rr) return lr < rr ? -1 : 1;
    if (lr === 1) {
      const order = compareNumbers(l, r);
      if (order) return order;
      if (typeof l !== typeof r) return typeof l === 'bigint' ? 1 : -1;
    } else if (lr === 0) {
      const order = compareText(l.name, r.name);
      if (order) return order;
    } else if (lr === 2) {
      const order = compareText(l, r);
      if (order) return order;
    } else {
      if (l.args.length !== r.args.length) return l.args.length < r.args.length ? -1 : 1;
      const order = compareText(l.name, r.name);
      if (order) return order;
      for (let i = l.args.length - 1; i >= 0; i--) pending.push(l.args[i], r.args[i]);
    }
  }
  return 0;
}
