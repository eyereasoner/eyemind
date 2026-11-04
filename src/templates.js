// Inline rule templates become statically visible clauses whose first
// premise records the generating activation. No rule is installed at run time.
import { normalizeGoal } from './goals.js';
import {
  EMPTY, EyemindError, Struct, Var, conjunction, flattenConjunction, isCallable, isTerm, listFromItems, variables,
} from './terms.js';

export const ACTIVATION_KEY = 'activated/2';
export const isActivation = (term) => isTerm(term, 'activated', 2);
const isTemplate = (term) => isTerm(term, 'forward', 2) || isTerm(term, 'backward', 2);

function containsTemplate(term) {
  const pending = [term];
  while (pending.length) {
    const item = pending.pop();
    if (isTemplate(item)) return true;
    if (item instanceof Struct) pending.push(...item.args);
  }
  return false;
}

function checkGoal(goal, line) {
  if (goal instanceof Var) throw new EyemindError(`line ${line}: generated rule bodies require statically named calls`);
  if (!isCallable(goal) || goal === EMPTY || isTerm(goal, '.', 2)) {
    throw new EyemindError(`line ${line}: a generated rule goal must be an atom or a compound, not a number or list`);
  }
  if (!(goal instanceof Struct)) return;
  if (isTemplate(goal)) throw new EyemindError(`line ${line}: rule templates belong in an implies() conclusion`);
  if (isTerm(goal, 'and', 2) || isTerm(goal, 'or', 2)) {
    for (const part of goal.args) checkGoal(part, line);
  } else if (['not', 'call', 'once'].includes(goal.name) && goal.args.length === 1) {
    checkGoal(goal.args[0], line);
  } else if (isTerm(goal, 'findall', 3)) checkGoal(goal.args[1], line);
}

export function expandTemplates(sources) {
  const expanded = [...sources];
  for (let index = 0; index < expanded.length; index++) {
    const source = expanded[index];
    const heads = flattenConjunction(source.head);
    for (const head of heads) {
      if (isActivation(head)) throw new EyemindError(`line ${source.line}: activated/2 is reserved for generated rules`);
    }
    const templates = heads.filter(isTemplate);
    if (!templates.length) {
      if (containsTemplate(source.head) || source.body.some(containsTemplate)) {
        throw new EyemindError(`line ${source.line}: rule templates must be top-level conjuncts of an implies() conclusion`);
      }
      continue;
    }
    if (source.kind !== 'forward') {
      throw new EyemindError(`line ${source.line}: rule templates belong in an implies() conclusion`);
    }
    if (source.body.some(containsTemplate)) {
      throw new EyemindError(`line ${source.line}: rule templates belong in an implies() conclusion`);
    }
    // Variables occurring outside a template are captured. Other variables
    // belong to that generated rule and are freshened by ordinary resolution.
    const outer = new Map();
    for (const goal of source.body) variables(goal, outer);
    for (const head of heads) if (!isTemplate(head)) variables(head, outer);
    const lowered = heads.map((head) => {
      if (!isTemplate(head)) {
        if (containsTemplate(head)) throw new EyemindError(`line ${source.line}: a rule template cannot be nested inside an ordinary term`);
        return head;
      }
      const forward = head.name === 'forward';
      const premise = normalizeGoal(head.args[forward ? 0 : 1]);
      const conclusion = normalizeGoal(head.args[forward ? 1 : 0]);
      for (const item of flattenConjunction(conclusion)) {
        if (item === EMPTY || isTerm(item, '.', 2)) {
          throw new EyemindError(`line ${source.line}: a generated rule conclusion cannot be an empty or open list`);
        }
      }
      const body = flattenConjunction(premise);
      for (const goal of body) checkGoal(goal, source.line);
      const captured = [...variables(head).values()].filter((variable) => outer.has(variable.name));
      const activation = new Struct('activated', [BigInt(expanded.length + 1), listFromItems(captured)]);
      const conclusions = forward ? [conclusion] : flattenConjunction(conclusion);
      for (const generated of conclusions) {
        expanded.push({
          kind: forward ? 'forward' : 'backward', head: generated, body: [activation, ...body],
          line: source.line, file: source.file, captures: captured.map((variable) => variable.name),
        });
      }
      return activation;
    });
    expanded[index] = { ...source, head: conjunction(lowered) };
  }
  return expanded;
}
