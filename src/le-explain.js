// Explanations of Logical English answers, in English, read from a checked
// proof. An answer is explained by the derivation its proof records: a call
// table's answer by expanding the table's call one level against the program,
// as the checker does, and taking the first solution that gives the answer;
// a derived fact by the firing its step records. Each condition of that
// solution is written through the document's templates, and each relation it
// used is explained in turn, below it. Nothing is searched for: inner calls
// are answered by the proof's own tables and listings.
import { Reliance, Settler, Unsettled } from './closure.js';
import { freshClause, variant } from './common.js';
import { callQuestions } from './fidelity.js';
import { leValue, sentence } from './le.js';
import { checkProof, readProof } from './proof.js';
import { Env, EyemindError, Struct, Var, copyResolved, deref, freshTerm, key, unify } from './terms.js';
import { write } from './writer.js';

const ANSWER = 'le:answer';
// Goals that test or thread, and say nothing a reader needs.
const SILENT = new Set(['le:scenario/1', 'is_var/1', 'is_nonvar/1', 'true/0']);
const AGGREGATE_WORDS = { 'le:sum': 'sum', 'le:count': 'count', 'le:average': 'average', 'le:min': 'min', 'le:max': 'max' };
const OPERATORS = { add: '+', sub: '-', mul: '*', div: '/', floordiv: '//', mod: 'mod' };
const COMPARISONS = { lt: '<', gt: '>', le: '=<', ge: '>=', eq: '=', ne: '!=' };

// The explanations of every answer of a Logical English run, as LE text: under
// each query's heading, each answer as a sentence followed by "because" and
// the conditions it rests on, each indented under the condition it explains.
// The proof is checked first; an explanation is only given for a checked one.
export function explainLe(loaded, document) {
  const { compiled, program } = loaded;
  if (compiled.abductive) throw new EyemindError('--explain does not explain answers that rest on assumptions; ask for the answers or a proof instead');
  if (compiled.queries.some((query) => query.flip)) throw new EyemindError('--explain does not explain flip queries; ask for the answers or a proof instead');
  const report = checkProof(program, document);
  if (!report.valid) throw new EyemindError(`the proof does not check, so it explains nothing: ${report.failures[0]?.detail ?? 'it is not valid'}`);
  const { claims, certificate, stepOf } = readProof(document);
  const settler = new Settler(program, {
    answers: (call) => certificate.calls.get(variant(call, true)) ?? null,
    facts: (goalKey) => certificate.listings.get(goalKey) ?? null,
  });
  for (const question of callQuestions(program, null, claims)) settler.answers(question);
  // Each answer of a checked table, with the table that lists it.
  const tableOf = new Map();
  for (const entry of settler.tables.values()) {
    for (const answer of entry.answers || []) {
      const id = variant(answer);
      if (!tableOf.has(id)) tableOf.set(id, entry);
    }
  }
  const explainer = new Explainer(program, compiled, settler, tableOf, stepOf);
  const { templates, scenarios, threaded, queries } = compiled;
  const found = new Map();
  for (const claim of claims) {
    if (!(claim instanceof Struct) || claim.name !== ANSWER) continue;
    const [name, ...rest] = claim.args;
    const scenario = threaded ? rest.shift() : null;
    const query = queries.find((q) => q.name === name);
    if (!query) continue;
    const id = `${scenario}\u0000${name}`;
    if (!found.has(id)) found.set(id, new Map());
    const text = sentence(query, rest, templates);
    if (!found.get(id).has(text)) found.get(id).set(text, explainer.answer(claim, text));
  }
  const blocks = [];
  for (const scenario of threaded ? scenarios : [null]) {
    for (const query of queries) {
      const answers = found.get(`${scenario}\u0000${query.name}`) ?? new Map();
      const lines = [scenario === null ? `% query ${query.name}` : `% query ${query.name} with scenario ${scenario}`];
      [...answers.values()].forEach((explained, i) => lines.push(...(i ? ['', ...explained] : explained)));
      if (!answers.size) lines.push('% no answers');
      blocks.push(lines.join('\n'));
    }
  }
  return blocks.length ? blocks.join('\n\n') + '\n' : '% no queries\n';
}

class Explainer {
  constructor(program, compiled, settler, tableOf, stepOf) {
    this.program = program;
    this.compiled = compiled;
    this.settler = settler;
    this.tableOf = tableOf;
    this.stepOf = stepOf;
    this.serial = 0;
  }

  // An answer's lines: its sentence, then what it rests on. A query of one
  // condition is that condition, explained directly.
  answer(claim, text) {
    this.explained = new Set();
    const conditions = this.derivation(claim) ?? [];
    const relations = conditions.filter((c) => c.goal);
    const only = conditions.length === 1 && relations.length === 1 ? relations[0] : null;
    const lines = [text];
    const below = only ? this.because(only.goal) : conditions;
    this.lines(below, 1, lines);
    lines[lines.length - 1] += '.';
    return lines;
  }

  // The conditions a goal rests on, each { text, goal } where goal is a
  // relation to explain in turn, or null for a fact or a goal without a
  // derivation in the proof.
  because(goal) {
    const id = variant(goal);
    if (this.explained.has(id)) return null;
    this.explained.add(id);
    return this.unfolded(goal, this.derivation(goal));
  }

  // A relation unfolded into levels (NAME#k), or concluded through the base
  // relation of an "only if" rule (NAME:if), says the same as the goal it
  // explains: its own conditions stand in its place.
  unfolded(goal, conditions) {
    if (conditions === null) return null;
    const same = (other) => other && level(other) === level(goal) && other.args.every((arg, i) => variant(arg) === variant(goal.args[i]));
    const flat = conditions.flatMap((condition) => same(condition.goal) ? this.unfolded(condition.goal, this.derivation(condition.goal)) ?? [] : [condition]);
    return flat.length ? flat : null;
  }

  lines(conditions, depth, out) {
    (conditions ?? []).forEach((condition, i) => {
      out.push(`${'    '.repeat(depth)}${i ? 'and' : 'because'} ${condition.text}`);
      if (condition.goal) this.lines(this.because(condition.goal), depth + 1, out);
    });
  }

  derivation(goal) {
    const goalKey = key(goal);
    const step = this.settler.derivedKeys.has(goalKey) ? this.stepOf(goal) : undefined;
    if (step) return this.fired(goal, step);
    const entry = this.tableOf.get(variant(goal));
    if (!entry) return null;
    for (const clause of this.program.groups.get(goalKey) || []) {
      if (clause.forward) continue;
      const env = new Env();
      const [head, body, names] = freshClause(clause, `explain${++this.serial}`);
      const call = freshTerm(entry.call, `call${this.serial}`);
      if (!unify(call, head, env)) continue;
      // A fact of the program, or of a scenario, rests on nothing.
      if (!body.length) {
        if (variant(copyResolved(call, env)) === variant(goal)) return null;
        continue;
      }
      const found = this.first(body, env, names, () => variant(copyResolved(call, env)) === variant(goal));
      if (found) return found;
    }
    return null;
  }

  // A derived fact rests on the firing its step records: the rule, with the
  // step's bindings, solved again over the proof's tables and listings.
  fired(goal, step) {
    const id = step.by instanceof Struct && step.by.name === 'clause' ? Number(step.by.args[0]) : null;
    const clause = id === null ? null : this.program.byId.get(id) ?? this.program.byId.get(BigInt(id));
    if (!clause) return null;
    const env = new Env();
    const [head, body, names] = freshClause(clause, `explain${++this.serial}`);
    if (!unify(head, goal, env)) return null;
    for (const pair of step.bindings) {
      const [name, value] = pair instanceof Struct ? pair.args : pair;
      if (names.has(name) && !unify(names.get(name), freshTerm(value, `bound${this.serial}`), env)) return null;
    }
    return this.first(body, env, names, () => true);
  }

  // The conditions of the first solution of a body that passes accept, or
  // null; each is written while its bindings hold.
  first(body, env, names, accept) {
    const path = [];
    try {
      for (const _ of this.all(body, 0, env, path)) { // eslint-disable-line no-unused-vars
        if (accept()) return this.describe(path, env, names);
      }
    } catch (error) {
      // A goal the proof's tables cannot settle leaves the goal unexplained.
      if (!(error instanceof EyemindError) && !(error instanceof Unsettled)) throw error;
    }
    return null;
  }

  * all(goals, index, env, path) {
    if (index === goals.length) {
      yield;
      return;
    }
    for (const _ of this.walk(goals[index], env, path)) yield* this.all(goals, index + 1, env, path); // eslint-disable-line no-unused-vars
  }

  // A goal solved as the checker solves it, with each solved condition kept
  // on the path while its solution holds; "and" and "or" are walked here, so
  // the path shows which alternative held.
  * walk(goal, env, path) {
    goal = deref(goal, env);
    const goalKey = goal instanceof Struct ? key(goal) : null;
    if (goalKey === 'and/2') {
      for (const _ of this.walk(goal.args[0], env, path)) yield* this.walk(goal.args[1], env, path); // eslint-disable-line no-unused-vars
      return;
    }
    if (goalKey === 'or/2') {
      yield* this.walk(goal.args[0], env, path);
      yield* this.walk(goal.args[1], env, path);
      return;
    }
    // A relation forward rules derive is read from the proof's listing, as a
    // replay reads it; other calls come from the proof's tables.
    const derived = goalKey !== null && this.settler.derivedKeys.has(goalKey);
    const solutions = derived ? this.settler.expand(goal, env, new Reliance()) : this.settler.solve(goal, env, new Reliance());
    for (const _ of solutions) { // eslint-disable-line no-unused-vars
      path.push(goal);
      try {
        yield;
      } finally {
        path.pop();
      }
    }
  }

  // The solved conditions in English. A helper that computes a value for a
  // later condition, such as a collection for its sum, is written there.
  describe(path, env, names) {
    const writer = new Writer(this.compiled, env, names);
    const conditions = [];
    for (const goal of path) {
      const goalKey = key(goal);
      if (SILENT.has(goalKey)) continue;
      const text = writer.condition(goal);
      if (text === null) continue;
      const relation = !goal.name.startsWith('le:') && !PRIMITIVE_WORDS.has(goal.name) &&
        (this.program.groups.has(goalKey) || this.settler.derivedKeys.has(goalKey));
      conditions.push({ text, goal: relation ? copyResolved(goal, env) : null });
    }
    return conditions;
  }
}

// The relation of a goal, without the level an unfolding gives it.
const level = (goal) => `${goal.name.replace(/#\d+$/, '').replace(/:if$/, '')}/${goal.args.length}`;
const ID = /^[A-Z][A-Z0-9]{0,5}$/;
const PRIMITIVE_WORDS = new Set(['not', 'findall', 'findall_sorted', 'is', 'compare', 'unify', 'not_unify', 'not_identical', ...Object.keys(COMPARISONS)]);

// Terms and conditions in English, with the bindings of one solution. A
// variable that is still open is written as the phrase it was named by: "a
// charge" the first time, "the charge" after; an anonymous one as the noun of
// its template's place.
class Writer {
  constructor(compiled, env, names) {
    this.compiled = compiled;
    this.env = env;
    this.names = new Map([...names].map(([name, variable]) => [variable, name]));
    this.pending = new Map();
    this.seen = new Set();
  }

  phrase(variable, noun = null) {
    const name = this.names.get(variable);
    // A variable named by an id, such as T, is written as its id.
    if (name && ID.test(name)) return name;
    const words = name && !name.startsWith('_') && !name.endsWith('_')
      ? name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase() : noun ?? 'something';
    if (this.seen.has(variable)) return `the ${words}`;
    this.seen.add(variable);
    return /^[aeiou]/.test(words) ? `an ${words}` : `a ${words}`;
  }

  value(term, noun = null) {
    // A value a helper computed is written as the formula it came from.
    if (term instanceof Var && typeof this.pending.get(term) === 'string') return this.pending.get(term);
    term = deref(term, this.env);
    if (term instanceof Var) return this.pending.get(term) ?? this.phrase(term, noun);
    if (term instanceof Struct && OPERATORS[term.name] && term.args.length === 2) {
      const side = (arg) => {
        const text = this.value(arg);
        const inner = deref(arg, this.env);
        return inner instanceof Struct && OPERATORS[inner.name] ? `(${text})` : text;
      };
      return `${side(term.args[0])} ${OPERATORS[term.name]} ${side(term.args[1])}`;
    }
    if (term instanceof Struct && (term.name === 'min' || term.name === 'max') && term.args.length === 2) {
      return `the ${term.name === 'min' ? 'minimum' : 'maximum'} of ${this.value(term.args[0])} and ${this.value(term.args[1])}`;
    }
    if (term instanceof Struct && this.template(term)) return this.relation(term);
    return leValue(copyResolved(term, this.env), this.compiled.templates);
  }

  // The template of a relation, and the arguments of its places. A relation
  // compiled for a level (NAME#k), an "only if" rule (NAME:if), a source scope
  // (NAME:sc) or assumptions (NAME:ab) reads as NAME; the last two take one
  // more argument, which no place shows.
  template(term) {
    const name = term.name.replace(/#\d+$/, '').replace(/:(if|sc|ab|w)$/, '');
    let args = this.compiled.threaded ? term.args.slice(1) : term.args;
    if (/:(sc|ab|w)$/.test(term.name)) args = args.slice(0, -1);
    const template = this.compiled.templates.find((t) => t.name === name && t.arity === args.length);
    return template ? { template, args } : null;
  }

  relation(term) {
    const { template, args } = this.template(term) ?? { template: null, args: this.compiled.threaded ? term.args.slice(1) : term.args };
    if (!template) {
      if (term.name === 'is_a' && args.length === 2) return `${this.value(args[0])} is a ${this.value(args[1])}`;
      if (term.name === 'is_admissible_under' && args.length === 2) return `${this.value(args[0])} is admissible under ${this.value(args[1])}`;
      return write(copyResolved(term, this.env));
    }
    let n = 0;
    return template.parts.map((p) => p.place ? this.value(args[n++], p.name) : p.text).join(' ');
  }

  // A condition as a sentence, or null when it only computes a value that a
  // later condition writes.
  condition(goal) {
    const { name, args } = goal;
    if (name === 'not' && args.length === 1) {
      const inner = this.conjunction(args[0]);
      return inner === null ? null : `it is not the case that ${inner}`;
    }
    if (name === 'le:member' && args.length === 2) return `${this.value(args[0])} is in ${this.value(args[1])}`;
    if (name === 'le:reverse' && args.length === 2) return `${this.value(args[1])} is the reverse of ${this.value(args[0])}`;
    if (name === 'le:append' && args.length === 3) return `appending ${this.value(args[0])} then ${this.value(args[1])} gives ${this.value(args[2])}`;
    if ((name === 'findall' || name === 'findall_sorted') && args.length === 3) {
      const list = deref(args[2], this.env);
      const item = deref(args[0], this.env);
      const named = item instanceof Var ? this.names.get(item) : undefined;
      const each = named === undefined ? null : ID.test(named) ? named : named.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
      if (item instanceof Var) this.seen.add(item);
      const such = `each ${each ?? this.value(item)} such that ${this.conjunction(args[1])}`;
      const items = this.value(list);
      this.pending.set(args[2] instanceof Var ? args[2] : list, { such, items });
      return null;
    }
    if (AGGREGATE_WORDS[name] && args.length === 2) {
      const collected = this.collected(args[0]);
      const total = this.value(args[1]);
      if (collected) return `${total} is the ${AGGREGATE_WORDS[name]} of ${collected.such}, namely ${collected.items}`;
      return name === 'le:count' ? `the length of ${this.value(args[0])} is ${total}` : `${total} is the ${AGGREGATE_WORDS[name]} of ${this.value(args[0])}`;
    }
    if (name === 'le:divide' && args.length === 3) {
      // The quotient is written where the formula that divides uses it.
      const formula = `${this.value(args[0])} / ${this.value(args[1])}`;
      if (args[2] instanceof Var) {
        this.pending.set(args[2], formula);
        return null;
      }
      return `${this.value(args[2])} = ${formula}`;
    }
    if (name === 'le:days_after' && args.length === 3) return `${this.value(args[0])} is ${this.value(args[1])} days after ${this.value(args[2])}`;
    if (name === 'is' && args.length === 2) {
      const right = this.value(args[1]);
      const left = leValue(copyResolved(args[0], this.env), this.compiled.templates);
      return left === right ? null : `${left} = ${right}`;
    }
    if (name === 'compare' && args.length === 3) {
      const op = deref(args[0], this.env);
      const [a, b] = [this.value(args[1]), this.value(args[2])];
      const date = (t) => { t = deref(t, this.env); return t instanceof Struct && t.name === 'date'; };
      const words = date(args[1]) || date(args[2]) ? { '<': 'is before', '>': 'is after', '=': 'is the same day as' } : { '<': '<', '>': '>', '=': '=' };
      return `${a} ${words[op] ?? op} ${b}`;
    }
    if (COMPARISONS[name] && args.length === 2) return `${this.value(args[0])} ${COMPARISONS[name]} ${this.value(args[1])}`;
    if (name === 'unify' && args.length === 2) {
      // Equating a term with itself, as a rule does to build or take apart a
      // list, says nothing once both sides are known.
      const [left, right] = [this.value(args[0]), this.value(args[1])];
      return left === right ? null : `${left} = ${right}`;
    }
    if ((name === 'not_unify' || name === 'not_identical') && args.length === 2) return `${this.value(args[0])} is different from ${this.value(args[1])}`;
    if (name.startsWith('le:') && !this.template(goal)) return null;
    return this.relation(goal);
  }

  // The items a collection gathered, for the aggregate that takes them.
  collected(list) {
    const pending = this.pending.get(list instanceof Var ? list : deref(list, this.env));
    if (!pending || typeof pending === 'string') return null;
    const items = copyResolved(list, this.env);
    const values = [];
    let rest = items;
    while (rest instanceof Struct && rest.name === '.' && rest.args.length === 2) {
      values.push(leValue(rest.args[0], this.compiled.templates));
      rest = rest.args[1];
    }
    const namely = !values.length ? 'none' : values.length === 1 ? values[0] : `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`;
    return { such: pending.such, items: namely };
  }

  // A goal under a negation or a collection, its parts joined by "and" and "or".
  conjunction(goal) {
    goal = deref(goal, this.env);
    if (goal instanceof Struct && (goal.name === 'and' || goal.name === 'or') && goal.args.length === 2) {
      const parts = goal.args.map((arg) => this.conjunction(arg)).filter((part) => part !== null);
      return parts.join(` ${goal.name} `) || null;
    }
    if (goal instanceof Struct && SILENT.has(key(goal))) return null;
    if (Array.isArray(goal)) return goal.map((g) => this.conjunction(g)).filter((p) => p !== null).join(' and ');
    return goal instanceof Struct ? this.condition(goal) : this.value(goal);
  }
}
