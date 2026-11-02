// Helpers shared by the engine and the proof checker.
import { Struct, Var, freshTerm } from './terms.js';
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
// the head. Subterms without variables are shared.
function workOut(clause) {
  const index = new Map();
  collectNames([clause.head], index);
  const headCount = index.size;
  collectNames(clause.body, index);
  const names = [...index.keys()];
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
    head: (values) => substitute(clause.head, index, values),
    body: (values) => clause.body.map((goal) => substitute(goal, index, values)),
  };
}

function substitute(term, index, values) {
  if (term instanceof Var) return values[index.get(term.name)];
  if (!(term instanceof Struct)) return term;
  const args = term.args;
  let copied = null;
  for (let position = 0; position < args.length; position++) {
    const arg = args[position];
    const copy = arg instanceof Var || arg instanceof Struct ? substitute(arg, index, values) : arg;
    if (copied === null) {
      if (copy === arg) continue;
      copied = args.slice(0, position);
    }
    copied.push(copy);
  }
  return copied === null ? term : new Struct(term.name, copied);
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
