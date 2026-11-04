// Rule inspection reads a fixed source catalogue, not the run's rule index.
import { Struct, conjunction, isTerm } from './terms.js';

export const INSPECTION_KEYS = new Set(['implies/2', 'implied_by/2']);
export const isInspection = (term) => isTerm(term, 'implies', 2) || isTerm(term, 'implied_by', 2);

export function hasInspection(goal) {
  if (isInspection(goal)) return true;
  if (isTerm(goal, 'and', 2) || isTerm(goal, 'or', 2)) return goal.args.some(hasInspection);
  if (isTerm(goal, 'not', 1) || isTerm(goal, 'call', 1) || isTerm(goal, 'once', 1)) return hasInspection(goal.args[0]);
  return isTerm(goal, 'findall', 3) && hasInspection(goal.args[1]);
}

export function inspectionTerm(clause) {
  const body = conjunction(clause.body);
  return new Struct(clause.forward ? 'implies' : 'implied_by', clause.forward ? [body, clause.head] : [clause.head, body]);
}
