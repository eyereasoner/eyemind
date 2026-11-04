// Goals as a program, a command line or a checked proof states them.
//
// An array in a goal position is the conjunction of its items: [p(X), q(X)]
// is and(p(X), q(X)). A goal position is a statement's goal, an argument of
// and, or, not, call or once, either part of a rule template, or the goal of
// findall. Anywhere else an array is a list.
import { EMPTY, Env, Struct, conjunction, properListItems } from './terms.js';
import { readTerm } from './reader.js';

const EMPTY_ENV = new Env();

function isList(term) {
  return term === EMPTY || (term instanceof Struct && term.name === '.' && term.args.length === 2);
}

export function normalizeGoal(term) {
  if (isList(term)) {
    const items = properListItems(term, EMPTY_ENV);
    // An empty or open list stays a list; a goal position rejects it later.
    if (items === null || !items.length) return term;
    return conjunction(items.map(normalizeGoal));
  }
  if (!(term instanceof Struct)) return term;
  const { name, args } = term;
  if ((name === 'and' || name === 'or') && args.length === 2) {
    return rebuild(term, args.map(normalizeGoal));
  }
  if (['implies', 'implied_by', 'forward', 'backward'].includes(name) && args.length === 2) {
    return rebuild(term, args.map(normalizeGoal));
  }
  if ((name === 'not' || name === 'call' || name === 'once') && args.length === 1) {
    return rebuild(term, [normalizeGoal(args[0])]);
  }
  if (name === 'findall' && args.length === 3) {
    return rebuild(term, [args[0], normalizeGoal(args[1]), args[2]]);
  }
  return term;
}

function rebuild(term, args) {
  return args.every((arg, i) => arg === term.args[i]) ? term : new Struct(term.name, args);
}

// A goal given as text, such as on the command line: [p(X), q(X)] asks both.
export function readGoal(text) {
  return normalizeGoal(readTerm(text));
}
