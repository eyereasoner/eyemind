// Helpers shared by the engine and the proof checker.
import { Struct, Var, deref, freshTerm, unify } from './terms.js';
import { write } from './writer.js';

// The canonical spelling of a term, which also serves as its identity.
export function text(term, env = null) {
  return write(term, env);
}

// Rename a clause apart: head and body share one set of fresh variables,
// listed in the order the clause is written (a forward rule's body first).
// unique says no other variable of the run will get this suffix, so the
// variables may keep their bindings on themselves (see Var).
export function freshClause(clause, suffix, unique = false) {
  const renamed = renaming(clause);
  if (renamed === null) {
    const names = new Map();
    let head;
    let body;
    if (clause.forward) {
      body = clause.body.map((goal) => freshTerm(goal, suffix, names, unique));
      head = freshTerm(clause.head, suffix, names, unique);
    } else {
      head = freshTerm(clause.head, suffix, names, unique);
      body = clause.body.map((goal) => freshTerm(goal, suffix, names, unique));
    }
    return [head, body, names];
  }
  const tag = String(suffix);
  const values = renamed.prefixes.map((prefix) => new Var(prefix + tag, unique));
  let names = new Map(renamed.names.map((name, i) => [name, values[i]]));
  if (renamed.written !== null) names = new Map(renamed.written.map((name) => [name, names.get(name)]));
  return [renamed.head(values), renamed.body(values), names];
}

// How to rename a clause apart quickly, or null while it has been used too
// seldom to be worth working out: most clauses of a large program are used
// once, and renaming those directly is cheaper.
export function renaming(clause) {
  let renamed = clause.renaming;
  if (renamed === null) {
    clause.uses++;
    if (clause.uses < WORK_OUT_AFTER) return null;
    renamed = clause.renaming = workOut(clause);
  }
  return renamed;
}

const WORK_OUT_AFTER = 3;

function collectNames(terms, index) {
  for (const term of terms) {
    const pending = [term];
    while (pending.length) {
      const item = pending.pop();
      if (item instanceof Var) {
        if (!index.has(item.name)) index.set(item.name, index.size);
      } else if (item instanceof Struct) {
        for (let i = item.args.length - 1; i >= 0; i--) pending.push(item.args[i]);
      }
    }
  }
}

// The clause's variables are numbered in order of first occurrence, head
// first; head(values) and body(values) build the renamed head and body from
// fresh variables in that order, the first headCount of them sufficing for
// the head. Subterms without variables are shared. pattern and patterns are
// the head and body with each variable replaced by its number, for matchHead
// and instantiate.
function workOut(clause) {
  const index = new Map();
  collectNames([clause.head], index);
  const headCount = index.size;
  collectNames(clause.body, index);
  const names = [...index.keys()];
  const pattern = compile(clause.head, index);
  const patterns = clause.body.map((goal) => compile(goal, index));
  let written = null;
  if (clause.forward) {
    // A forward rule is written premise first, implies(Body, Head), and its
    // variables are listed in that order.
    const order = new Map();
    collectNames([...clause.body, clause.head], order);
    written = [...order.keys()];
  }
  return {
    names,
    prefixes: names.map((name) => `${name}#`),
    headCount,
    written,
    pattern,
    patterns,
    head: (values) => instantiate(pattern, values),
    body: (values) => patterns.map((goal) => instantiate(goal, values)),
  };
}

// A variable of a compiled clause, by its number, and a compound with one
// somewhere inside it. A subterm without variables stays as it is, and
// instantiate shares it. Neither ever leaves this module's functions.
class Slot {
  constructor(index) {
    this.index = index;
  }
}

class Pattern {
  constructor(name, args) {
    this.name = name;
    this.args = args;
  }
}

function compile(term, index) {
  if (term instanceof Var) return new Slot(index.get(term.name));
  if (!(term instanceof Struct)) return term;
  const args = term.args.map((arg) => compile(arg, index));
  return args.some((arg, i) => arg !== term.args[i]) ? new Pattern(term.name, args) : term;
}

function instantiate(term, values) {
  if (term instanceof Slot) return values[term.index];
  if (!(term instanceof Pattern)) return term;
  const args = term.args;
  const copied = new Array(args.length);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    copied[i] = arg instanceof Slot ? values[arg.index] : arg instanceof Pattern ? instantiate(arg, values) : arg;
  }
  return new Struct(term.name, copied);
}

// Match a goal against a renamed clause's head without building the head:
// the first occurrence of a variable takes the goal's subterm there as its
// value, binding nothing; a later one unifies with that value; a compound
// meeting an unbound goal variable is built and bound. fresh(i) makes the
// fresh variable i when a compound has to be built before i has a value.
// values, as filled, give the same answers as renaming the head and unifying
// it would: each variable's value is what its fresh variable would have been
// bound to.
export function matchHead(renamed, goal, values, fresh, env) {
  const pending = [renamed.pattern, goal];
  while (pending.length) {
    let given = pending.pop();
    const wanted = pending.pop();
    if (wanted instanceof Slot) {
      const value = values[wanted.index];
      if (value === undefined) values[wanted.index] = given;
      else if (!unify(value, given, env)) return false;
      continue;
    }
    if (given instanceof Var) given = deref(given, env);
    if (wanted instanceof Pattern) {
      if (given instanceof Var) {
        if (!unify(given, build(wanted, values, fresh), env)) return false;
        continue;
      }
      if (!(given instanceof Struct) || given.name !== wanted.name || given.args.length !== wanted.args.length) {
        return false;
      }
      for (let i = wanted.args.length - 1; i >= 0; i--) pending.push(wanted.args[i], given.args[i]);
      continue;
    }
    // wanted is a constant or a compound without variables.
    if (given === wanted) continue;
    if (!unify(wanted, given, env)) return false;
  }
  return true;
}

// A compiled term built from values, giving a fresh variable to each
// variable that has no value yet.
function build(term, values, fresh) {
  if (term instanceof Slot) {
    let value = values[term.index];
    if (value === undefined) value = values[term.index] = fresh(term.index);
    return value;
  }
  if (!(term instanceof Pattern)) return term;
  return new Struct(term.name, term.args.map((arg) => build(arg, values, fresh)));
}

// A key that preserves sharing while forgetting variable names.
export function variant(term) {
  const names = new Map();
  function visit(t) {
    if (t instanceof Var) {
      if (!names.has(t.name)) names.set(t.name, new Var(`V${names.size}`));
      return names.get(t.name);
    }
    if (t instanceof Struct) return new Struct(t.name, t.args.map(visit));
    return t;
  }
  return text(visit(term));
}
