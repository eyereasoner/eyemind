// Compile every potential derived rule before validation and stratification.
// Generators derive scoped rule instances, rather than synthetic facts.
import { RULE_NAMES, normalizeGoal, subgoals } from './goals.js';
import { isInspection } from './inspection.js';
import {
  EMPTY, EyemindError, Struct, Var, conjunction, flattenConjunction, isCallable, isTerm, listFromItems, variables,
} from './terms.js';

const isTemplate = (term) => term instanceof Struct && term.args.length === 2 && RULE_NAMES.has(term.name);

export function containsTemplate(term) {
  const pending = [term];
  while (pending.length) {
    const item = pending.pop();
    if (isTemplate(item)) return true;
    if (item instanceof Struct) pending.push(...item.args);
  }
  return false;
}

function checkGoal(goal, line, generated = false) {
  if (generated && goal instanceof Var) throw new EyemindError(`line ${line}: generated rule bodies require statically named calls`);
  if (generated && (!isCallable(goal) || goal === EMPTY || isTerm(goal, '.', 2))) {
    throw new EyemindError(`line ${line}: a generated rule goal must be an atom or a compound, not a number or list`);
  }
  if (!(goal instanceof Struct)) return;
  if (isInspection(goal)) return;
  if (isTemplate(goal)) throw new EyemindError(`line ${line}: rule templates belong in an implies() conclusion`);
  if (isTerm(goal, 'findall', 3) && (containsTemplate(goal.args[0]) || containsTemplate(goal.args[2]))) {
    throw new EyemindError(`line ${line}: rule values in a body must be inspection goals`);
  }
  const inner = subgoals(goal);
  if (inner !== null) {
    for (const part of inner) checkGoal(part, line, generated);
  } else if (containsTemplate(goal)) {
    throw new EyemindError(`line ${line}: rule templates must be top-level conjuncts of an implies() conclusion or inspection goals`);
  }
}

export function expandTemplates(sources) {
  const expanded = [...sources];
  for (let index = 0; index < expanded.length; index++) {
    let source = expanded[index];
    for (const goal of source.body) checkGoal(goal, source.line, source.captures !== undefined);
    const heads = flattenConjunction(source.head);
    for (const head of heads) {
      if (isTerm(head, 'activated', 2)) throw new EyemindError(`line ${source.line}: activated/2 is reserved`);
    }
    const templates = heads.filter(isTemplate);
    if (!templates.length) {
      if (containsTemplate(source.head)) {
        throw new EyemindError(`line ${source.line}: rule templates must be top-level conjuncts of an implies() conclusion`);
      }
      expanded[index] = source;
      continue;
    }
    if (source.kind !== 'forward') {
      throw new EyemindError(`line ${source.line}: rule templates belong in an implies() conclusion`);
    }
    source = { ...source, body: source.body.flatMap(flattenConjunction) };
    // Variables occurring outside a template are captured. Other variables
    // belong to that generated rule and are freshened by ordinary resolution.
    const outer = new Map();
    for (const goal of source.body) variables(goal, outer);
    for (const head of heads) if (!isTemplate(head)) variables(head, outer);
    const derived = [];
    const lowered = heads.map((head, position) => {
      if (!isTemplate(head)) {
        if (containsTemplate(head)) throw new EyemindError(`line ${source.line}: a rule template cannot be nested inside an ordinary term`);
        return head;
      }
      const forward = head.name === 'implies' || head.name === 'forward';
      const premise = normalizeGoal(head.args[forward ? 0 : 1]);
      const conclusion = normalizeGoal(head.args[forward ? 1 : 0]);
      for (const item of flattenConjunction(conclusion)) {
        if (item === EMPTY || isTerm(item, '.', 2)) {
          throw new EyemindError(`line ${source.line}: a generated rule conclusion cannot be an empty or open list`);
        }
      }
      const body = flattenConjunction(premise);
      for (const goal of body) checkGoal(goal, source.line, true);
      const captured = [...variables(head).values()].filter((variable) => outer.has(variable.name));
      const rule = { position, ids: [], captures: captured.map((variable) => variable.name) };
      const conclusions = forward ? [conclusion] : flattenConjunction(conclusion);
      for (const generated of conclusions) {
        rule.ids.push(expanded.length + 1);
        expanded.push({
          kind: forward ? 'forward' : 'backward', head: generated, body: [...source.body, ...body],
          line: source.line, file: source.file, captures: rule.captures,
          parentId: index + 1, prefixLength: source.body.length,
        });
      }
      derived.push(rule);
      // Only captures belong to this firing's head. Template-local variables
      // stay universal until a derived rule is used. This list is compiler
      // data; it is never a fact or a goal of a certificate.
      return listFromItems(captured);
    });
    expanded[index] = { ...source, head: conjunction(lowered), originalHead: source.head, templates: derived };
  }
  return expanded;
}
