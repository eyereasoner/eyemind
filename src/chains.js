// Chain stratification: an ordering of forward rules for programs whose
// negations or collections lie on a dependency cycle (SPEC Section 6.4).
//
// Classic stratification (program.js) asks whether a rule's head can unify
// with a negated goal. A head written with variables in every position, as
// rdf(X, Q, Y), then reaches every negation, and so does any cycle through
// it. Following N. Küchenmeister, A. Ivliev, D. Arndt and M. Krötzsch,
// "Stratified Negation in RDF Rules: A Correct Approach" (arXiv:2607.28778),
// this asks instead which chains of rule applications starting at a rule
// with a negation can make some negated goal true, given the Datalog rules
// and the contradictions: a chain whose facts make a contradiction hold
// is no chain. The rules form layers when no chain leads from a rule back to
// itself. Each check errs on the side of more chains, so an accepted program
// is chain-stratified in the paper's sense.
import { PRIMITIVE_KEYS } from './builtins.js';
import { Env, Struct, Var, copyResolved, flattenConjunction, freshTerm, identity, isCallable, isTerm, key, unify, variables } from './terms.js';

// The analysis stops, rejecting the program, beyond these many chain states,
// or closure facts for one state.
export const CHAIN_LIMITS = { states: 4096, facts: 2048 };

// Ranks for the forward clauses of a program classic stratification
// rejects, or null when the program is not chain-stratified, as far as this
// analysis can tell. Rank 0 holds the Datalog rules; a rule with a negation,
// a collection or a restriction ranks above every rule a chain from it can
// disable.
export function chainStrata(clauses) {
  const rules = [];
  for (const clause of clauses) {
    if (clause.parentId !== null || clause.templates.length || clause.captures !== null) return null;
    if (!clause.forward && !clause.body.length) continue;
    const rule = ruleOf(clause);
    if (rule === null) return null;
    rules.push(rule);
  }
  const datalog = rules.filter((rule) => rule.datalog && rule.pure);
  const negating = rules.filter((rule) => rule.negated.length);
  const edges = new Map();
  let states = 0;
  for (const start of rules.filter((rule) => rule.forward && !rule.datalog)) {
    const seen = new Set();
    const first = stateOf(start, renamed(start), datalog);
    if (first === null) continue;
    const pending = [first];
    while (pending.length) {
      const state = pending.pop();
      if (seen.has(state.label)) continue;
      seen.add(state.label);
      if (++states > CHAIN_LIMITS.states) return null;
      for (const target of negating) {
        if (edges.get(start.id)?.has(target.id) || !disables(state, target, datalog)) continue;
        if (!edges.has(start.id)) edges.set(start.id, new Set());
        edges.get(start.id).add(target.id);
        // An edge that closes a cycle settles the question.
        if (reaches(edges, target.id, start.id)) return null;
      }
      for (const next of rules) {
        if (!next.heads.length) continue;
        for (const extended of extensions(state, next, datalog)) {
          if (extended === undefined) return null;
          if (!seen.has(extended.label)) pending.push(extended);
        }
      }
    }
  }
  // Layers: the longest path of chain edges, above the Datalog rules.
  const ranks = new Map();
  const forward = rules.filter((rule) => rule.forward);
  const visiting = new Set();
  const rank = (rule) => {
    if (ranks.has(rule.id)) return ranks.get(rule.id);
    if (rule.datalog) return 0;
    if (visiting.has(rule.id)) return null;
    visiting.add(rule.id);
    let value = 1;
    for (const [from, targets] of edges) {
      if (!targets.has(rule.id)) continue;
      const before = rules.find((item) => item.id === from);
      const below = rank(before);
      if (below === null) return null;
      value = Math.max(value, below + 1);
    }
    visiting.delete(rule.id);
    ranks.set(rule.id, value);
    return value;
  };
  for (const rule of forward) {
    const value = rank(rule);
    if (value === null) return null;
    ranks.set(rule.id, value);
  }
  return ranks;
}

// Whether edges lead from one rule to another, or back to itself.
function reaches(edges, from, to) {
  const pending = [from];
  const seen = new Set();
  while (pending.length) {
    const id = pending.pop();
    if (id === to) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    pending.push(...(edges.get(id) ?? []));
  }
  return false;
}

// A clause as the analysis reads it: positive goals, negated groups (a
// negation or a collection), heads, and whether it is Datalog (no negation,
// collection or restriction) and pure (no primitive, so its closure is
// exact). A control other than these, or a variable goal, gives null.
function ruleOf(clause) {
  const positive = [];
  const negated = [];
  let pure = true;
  for (const goal of clause.localBody) {
    if (goal === clause.guard) continue;
    if (goal === 'true') continue;
    if (!isCallable(goal)) return null;
    const goalKey = key(goal);
    if (goalKey === 'not/1' || goalKey === 'findall/3' || goalKey === 'findall_sorted/3') {
      const group = [];
      for (const inner of flattenConjunction(goalKey === 'not/1' ? goal.args[0] : goal.args[1])) {
        if (inner instanceof Var || !isCallable(inner)) return null;
        if (PRIMITIVE_KEYS.has(key(inner))) continue;
        if (['not/1', 'findall/3', 'findall_sorted/3', 'or/2', 'once/1', 'call/1'].includes(key(inner))) return null;
        group.push(inner);
      }
      if (group.length) negated.push(group);
      pure = false;
    } else if (['or/2', 'once/1', 'call/1'].includes(goalKey)) {
      return null;
    } else if (PRIMITIVE_KEYS.has(goalKey)) {
      pure = false;
    } else {
      positive.push(goal);
    }
  }
  // A backward rule is answered by search, which a cycle through its
  // negation or collection would never finish.
  if (!clause.forward && negated.length) return null;
  const heads = clause.forward ? clause.plainHeads.filter((head) => head !== 'true' && head !== 'false') : [clause.head];
  const constraint = clause.forward && clause.plainHeads.includes('false');
  return {
    id: clause.id, forward: clause.forward, positive, negated, heads, constraint, pure,
    datalog: !negated.length && !clause.restricted,
  };
}

let serial = 0;
function renamed(rule) {
  const names = new Map();
  const suffix = `chain${++serial}`;
  return {
    positive: rule.positive.map((goal) => freshTerm(goal, suffix, names)),
    negated: rule.negated.map((group) => group.map((goal) => freshTerm(goal, suffix, names))),
    heads: rule.heads.map((goal) => freshTerm(goal, suffix, names)),
  };
}

// Variables written as constants, so that facts can be matched by rules.
function freeze(term, names) {
  if (term instanceof Var) {
    if (!names.has(term.name)) names.set(term.name, new Struct('$chain_var', [term.name]));
    return names.get(term.name);
  }
  if (term instanceof Struct) return new Struct(term.name, term.args.map((arg) => freeze(arg, names)));
  return term;
}
function thaw(term, vars) {
  if (isTerm(term, '$chain_var', 1)) {
    if (!vars.has(term.args[0])) vars.set(term.args[0], new Var(term.args[0]));
    return vars.get(term.args[0]);
  }
  if (term instanceof Struct) return new Struct(term.name, term.args.map((arg) => thaw(arg, vars)));
  return term;
}
function frozenNames(term, out = new Set()) {
  if (isTerm(term, '$chain_var', 1)) out.add(term.args[0]);
  else if (term instanceof Struct) for (const arg of term.args) frozenNames(arg, out);
  return out;
}

// The closure of frozen facts under the pure Datalog rules: a Map of facts by
// identity, null when a contradiction holds, undefined beyond the limit.
function closure(facts, datalog) {
  const known = new Map(facts.map((fact) => [identity(fact), fact]));
  for (let changed = true; changed;) {
    changed = false;
    for (const rule of datalog) {
      const fresh = renamed(rule);
      for (const env of matches(fresh.positive, 0, [...known.values()], new Env())) {
        if (rule.constraint) return null;
        for (const head of fresh.heads) {
          const fact = copyResolved(head, env);
          if (variables(fact).size) continue;
          const id = identity(fact);
          if (known.has(id)) continue;
          known.set(id, fact);
          changed = true;
          if (known.size > CHAIN_LIMITS.facts) return undefined;
        }
      }
    }
  }
  return known;
}

function* matches(goals, index, facts, env) {
  if (index === goals.length) {
    yield env;
    return;
  }
  for (const fact of facts) {
    const mark = env.mark();
    if (unify(goals[index], fact, env)) yield* matches(goals, index + 1, facts, env);
    env.undo(mark);
  }
}

// Whether goals, their variables free, hold among frozen facts.
function holds(goals, facts) {
  for (const _ of matches(goals, 0, facts, new Env())) return true; // eslint-disable-line no-unused-vars
  return false;
}

// A chain state: the last rule's heads, the closure of the chain's facts
// that mention only their variables, and which of those the chain caused,
// with a label naming it up to renaming. The chain's conditions hold
// independently of it: the start's goals, and each later rule's goals but
// the one a caused fact matched. A fact is caused when the closure of
// everything holds it but the closure of the conditions does not. null when
// a contradiction holds, undefined beyond the limit.
function stateOf(rule, instance, datalog, conditions = instance.positive, caused = []) {
  const names = new Map();
  const independent = conditions.map((goal) => freeze(goal, names));
  const base = closure(independent, datalog);
  if (base === null) return null;
  if (base === undefined) return undefined;
  const heads = instance.heads.map((goal) => freeze(goal, names));
  const facts = closure([...independent, ...caused.map((goal) => freeze(goal, names)), ...heads], datalog);
  if (facts === null) return null;
  if (facts === undefined) return undefined;
  const keep = new Set();
  for (const head of heads) frozenNames(head, keep);
  const kept = [...facts.values()].filter((fact) => [...frozenNames(fact)].every((name) => keep.has(name)));
  const added = kept.map((fact) => !base.has(identity(fact)));
  // Rename the kept variables in order of their first occurrence in the heads.
  const order = new Map();
  for (const head of heads) for (const name of frozenNames(head)) if (!order.has(name)) order.set(name, `V${order.size}`);
  const canonical = (term) => (isTerm(term, '$chain_var', 1) ? new Struct('$chain_var', [order.get(term.args[0])])
    : term instanceof Struct ? new Struct(term.name, term.args.map(canonical)) : term);
  const texts = kept.map((fact, i) => `${added[i] ? '+' : ''}${identity(canonical(fact))}`).sort();
  const label = `${rule.id}\u0001${heads.map((head) => identity(canonical(head))).join('\u0002')}\u0001${texts.join('\u0002')}`;
  return { rule, heads: heads.map(canonical), facts: kept.map(canonical), added, label };
}

// The chain states extending a state by one application of next: a goal of
// next matches a fact the state's heads add, a head or what the Datalog
// rules derive with it, the facts do not already satisfy next's heads or a
// negated group of next, and no contradiction holds.
function* extensions(state, next, datalog) {
  const vars = new Map();
  const facts = state.facts.map((fact) => thaw(fact, vars));
  const added = facts.filter((_, i) => state.added[i]);
  for (let position = 0; position < next.positive.length; position++) {
    for (const head of added) {
      const instance = renamed(next);
      const env = new Env();
      if (!unify(instance.positive[position], head, env)) continue;
      const resolve = (goal) => copyResolved(goal, env);
      const body = [...facts.map(resolve), ...instance.positive.map(resolve)];
      const causedBefore = facts.filter((_, i) => state.added[i]).map(resolve);
      const causedIds = new Set(causedBefore.map((goal) => identity(goal)));
      const conditions = [...facts.filter((_, i) => !state.added[i]).map(resolve),
        ...instance.positive.map(resolve).filter((goal) => !causedIds.has(identity(goal)))];
      const applied = { positive: instance.positive.map(resolve), negated: instance.negated.map((group) => group.map(resolve)), heads: instance.heads.map(resolve) };
      const names = new Map();
      const known = closure(body.map((goal) => freeze(goal, names)), datalog);
      if (known === null) continue;
      if (known === undefined) {
        yield undefined;
        return;
      }
      // Whether next adds something, and whether its negations hold, is
      // asked of the chain's closed facts and next's own goals, not of
      // their closure: the closure would include next's own conclusion.
      // Frozen, but with the variables only next's heads or negations
      // mention left free, as existential patterns.
      const pattern = (goal) => freezeBound(goal, names);
      const before = body.map(pattern);
      if (holds(applied.heads.map(pattern), before)) continue;
      if (applied.negated.some((group) => holds(group.map(pattern), before))) continue;
      const extended = stateOf(next, applied, datalog, conditions, causedBefore);
      if (extended === undefined) {
        yield undefined;
        return;
      }
      if (extended !== null) yield extended;
    }
  }
}

// A goal with the variables the frozen facts name frozen and the others free.
function freezeBound(term, names) {
  if (term instanceof Var) return names.has(term.name) ? names.get(term.name) : term;
  if (term instanceof Struct) return new Struct(term.name, term.args.map((arg) => freezeBound(arg, names)));
  return term;
}

// Whether a fact the state's heads add, a head or what the Datalog rules
// derive with it, can make a negated goal of target true without a
// contradiction holding.
function disables(state, target, datalog) {
  const vars = new Map();
  const facts = state.facts.map((fact) => thaw(fact, vars));
  const added = facts.filter((_, i) => state.added[i]);
  for (const group of target.negated) {
    for (let position = 0; position < group.length; position++) {
      for (const head of added) {
        const instance = renamed(target);
        const env = new Env();
        const goal = instance.negated[target.negated.indexOf(group)][position];
        if (!unify(goal, head, env)) continue;
        const names = new Map();
        const known = closure(facts.map((fact) => freeze(copyResolved(fact, env), names)), datalog);
        if (known !== null) return true;
      }
    }
  }
  return false;
}
