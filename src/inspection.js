// Rule inspection reads a fixed source catalogue, not the run's rule index.
import { subgoals } from './goals.js';
import { Struct, conjunction, isTerm } from './terms.js';

export const INSPECTION_KEYS = new Set(['implies/2', 'implied_by/2']);
export const isInspection = (term) => isTerm(term, 'implies', 2) || isTerm(term, 'implied_by', 2);

export function hasInspection(goal) {
  if (isInspection(goal)) return true;
  const inner = subgoals(goal);
  return inner !== null && inner.some(hasInspection);
}

export function inspectionTerm(clause) {
  const body = conjunction(clause.body);
  return new Struct(clause.forward ? 'implies' : 'implied_by', clause.forward ? [body, clause.head] : [clause.head, body]);
}
