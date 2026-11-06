// Goals as a program, a command line or a checked proof states them.
//
// An array in a goal position is the conjunction of its items: [p(X), q(X)]
// is and(p(X), q(X)). A goal position is a statement's goal, an argument of
// and, or, not, call or once, either part of a rule template, or the goal of
// findall. Anywhere else an array is a list.
import { EMPTY, Env, EyemindError, Struct, Var, conjunction, properListItems } from './terms.js';
import { readTerm } from './reader.js';

const EMPTY_ENV = new Env();

// The calls that state or construct a rule; both their arguments are goal
// positions.
export const RULE_NAMES = new Set(['implies', 'implied_by', 'forward', 'backward']);

// The goal positions directly inside a control goal, or null when the goal is
// not a control: both sides of and and or, the argument of not, call and
// once, and the goal of findall.
export function subgoals(goal) {
  if (!(goal instanceof Struct)) return null;
  const { name, args } = goal;
  if ((name === 'and' || name === 'or') && args.length === 2) return args;
  if ((name === 'not' || name === 'call' || name === 'once') && args.length === 1) return args;
  if (name === 'findall' && args.length === 3) return [args[1]];
  return null;
}

function isList(term) {
  return term === EMPTY || (term instanceof Struct && term.name === '.' && term.args.length === 2);
}

export function normalizeGoal(term) {
  if (isList(term)) {
    const items = properListItems(term, EMPTY_ENV);
    if (items === null) {
      let tail = term;
      while (isList(tail) && tail !== EMPTY) tail = tail.args[1];
      throw new EyemindError(tail instanceof Var ? 'an open list is not a goal' : 'an improper list is not a goal');
    }
    if (!items.length) throw new EyemindError('an empty array is not a goal');
    return conjunction(items.map(normalizeGoal));
  }
  if (!(term instanceof Struct)) return term;
  const { name, args } = term;
  if ((name === 'and' || name === 'or' || RULE_NAMES.has(name)) && args.length === 2) {
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

// A goal given either as text or as a term already.
export function goalTerm(goal) {
  return typeof goal === 'string' ? readGoal(goal) : normalizeGoal(goal);
}
