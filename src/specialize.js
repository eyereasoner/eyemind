// Specializing a program for facts that arrive again and again, such as RDF
// Messages: the program's own facts are closed once, and each shape of
// arriving facts gets only the rule instances that can use one of them.
//
// The closure of the program's own facts are the old facts; facts not among
// them are new. A rule instance whose premises are all old concludes an old
// fact, so for each forward rule every choice of which data premises are
// new, at least one, is a variant. An old premise is unfolded into the old
// facts it matches when they are few and bind a property or class that makes
// another premise or a conclusion specific; otherwise it is kept, bound to
// what all those facts share, and reads old_NAME, a copy of the old facts it
// needs. A new premise reads NAME, the arriving and the derived new facts,
// and is specialized to each pattern new facts can have: the arriving facts
// with their values made variables, and the conclusions of the variants,
// generalized per relation, property and class until no variant adds one. A
// conclusion that is one of its premises or an old fact is never new and is
// dropped. The variants, the backward clauses and the old facts they read
// form an ordinary program, cached per shape of arriving facts, and the
// arriving facts complete it.
//
// Negation and collection are not monotone: more facts can retract an old
// conclusion. A program that negates or collects what can be new, or that
// has restricted rules, rule templates or inspection, is not specialized.
import { CONTROL_KEYS, Program, Source } from './program.js';
import { run } from './engine.js';
import { Env, Struct, Var, conjunction, copyResolved, deref, freshTerm, flattenConjunction, identical, identity, isGround, isTerm, key, listFromItems, unify, variables } from './terms.js';
import { Lettering, write } from './writer.js';

const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const NEGATING = new Set(['not/1', 'findall/3', 'findall_sorted/3']);
// Unfold an old premise into at most this many facts.
const UNFOLD = 256;
// Generalize, or guard a conclusion against, at most this many old facts.
const MANY = 4096;
// How deep to look into backward clauses for a goal that cannot hold.
const DEPTH = 4;
// Give up on specializing a rule that unfolds into more instances than this,
// or on a shape of messages that takes more search steps than STEPS.
const LEAVES = 100000;
const STEPS = 60000;

class Unsupported extends Error {}

let fresh = 0;
const variable = () => new Var(`G#${++fresh}`);
const renamed = (term) => freshTerm(term, `p${++fresh}`);
const isType = (term) => term instanceof Struct && term.name === 'iri' && term.args[0] === RDF_TYPE;
// Type tests a pattern can decide once its argument is bound.
const TYPE_TESTS = new Map([
  ['is_atom/1', (t) => typeof t === 'string'], ['is_int/1', (t) => typeof t === 'bigint'],
  ['is_float/1', (t) => typeof t === 'number'], ['is_number/1', (t) => typeof t === 'bigint' || typeof t === 'number' || t instanceof Struct],
]);
const old = (goal) => new Struct(`old_${goal.name}`, goal.args);

// The most specific term every one of these terms is an instance of: where
// two differ, a variable, the same one for the same pair of subterms.
export function generalize(terms) {
  let general = terms[0];
  for (const term of terms.slice(1)) {
    const pairs = new Map();
    const walk = (a, b) => {
      if (a instanceof Struct && b instanceof Struct && a.name === b.name && a.args.length === b.args.length) {
        return new Struct(a.name, a.args.map((arg, i) => walk(arg, b.args[i])));
      }
      if (!(a instanceof Var) && !(a instanceof Struct) && typeof a === typeof b && a === b) return a;
      const pair = `${identity(a)}\u0001${identity(b)}`;
      let found = pairs.get(pair);
      if (found === undefined) pairs.set(pair, found = variable());
      return found;
    };
    general = walk(general, term);
  }
  return general;
}

// Whether term is an instance of pattern.
function instance(pattern, term) {
  const env = new Env();
  const frozen = new Map();
  for (const [name] of variables(term)) frozen.set(name, `\u0000${name}`);
  const freeze = (t) => t instanceof Var ? frozen.get(t.name) : t instanceof Struct ? new Struct(t.name, t.args.map(freeze)) : t;
  return unify(renamed(pattern), freeze(term), env);
}

// Whether two terms differ in a constant or functor near their roots, so
// they cannot unify; false is no promise that they do.
function clashes(a, b, env, depth = 2) {
  a = deref(a, env);
  if (a instanceof Var || b instanceof Var) return false;
  if (!(a instanceof Struct) || !(b instanceof Struct)) return a !== b || typeof a !== typeof b;
  if (a.name !== b.name || a.args.length !== b.args.length) return true;
  return depth > 1 && a.args.some((arg, i) => clashes(arg, b.args[i], env, depth - 1));
}

// The identity of a pattern with its variables named in order.
function canonical(pattern) {
  const names = new Map();
  const walk = (t) => {
    if (t instanceof Var) {
      if (!names.has(t.name)) names.set(t.name, new Var(`V${names.size}`));
      return names.get(t.name);
    }
    return t instanceof Struct ? new Struct(t.name, t.args.map(walk)) : t;
  };
  return identity(walk(pattern));
}

// A term with its atoms and numbers made variables: the shape of a value.
// A literal keeps its datatype.
const shape = (term) => term instanceof Var ? term : !(term instanceof Struct) ? variable()
  : term.name === 'datatype' && term.args.length === 1 ? term : new Struct(term.name, term.args.map(shape));
// The functors of a term to a depth, and the datatypes of its literals:
// patterns with the same skeleton are generalized into one.
const skeleton = (term, depth) => term instanceof Var || !depth ? '*' : !(term instanceof Struct) ? typeof term
  : term.name === 'datatype' && term.args.length === 1 ? identity(term)
    : `${term.name}(${term.args.map((arg) => skeleton(arg, depth - 1)).join(',')})`;

// Sources as Logic Script statements.
export function programText(sources) {
  return sources.map((source) => {
    const body = listFromItems(source.body);
    const statement = source.kind === 'fact' ? new Struct('fact', [source.head])
      : source.kind === 'backward' ? new Struct('implied_by', [source.head, body])
        : source.kind === 'contradiction' ? new Struct('contradiction', [body])
          : new Struct('implies', [body, isTerm(source.head, 'and', 2) ? listFromItems(flattenConjunction(source.head)) : source.head]);
    return `${write(statement, null, new Lettering())};\n`;
  }).join('');
}

export class Specializer {
  // quads: the keys whose arguments are subject, property, object and graph.
  // wanted: patterns of the new facts asked for, or null for all; rules that
  // cannot contribute to one are left out.
  constructor(program, { quads = [], wanted = null } = {}) {
    this.quads = new Set(quads);
    this.wanted = wanted;
    this.cache = new Map();
    this.reason = null;
    try {
      this.prepare(program);
    } catch (error) {
      if (!(error instanceof Unsupported)) throw error;
      this.reason = error.message;
    }
  }

  prepare(program) {
    if (program.inspectionEnabled) throw new Unsupported('it inspects rules');
    const bodied = new Set(program.clauses.filter((c) => !c.forward && c.body.length).map((c) => key(c.head)));
    this.data = new Set();
    for (const clause of program.clauses) {
      if (clause.restricted || clause.templates.length || clause.parentId !== null || clause.captures !== null) {
        throw new Unsupported('it has restricted rules or rule templates');
      }
      if (clause.forward) {
        for (const head of clause.heads) if (head !== 'true' && head !== 'false') this.data.add(key(head));
        if (clause.body.some((goal) => goal instanceof Var)) throw new Unsupported('a forward rule calls a variable');
      }
    }
    for (const clause of program.clauses) {
      if (!clause.forward && !clause.body.length && !bodied.has(key(clause.head))) this.data.add(key(clause.head));
    }
    for (const k of this.data) {
      if (bodied.has(k)) throw new Unsupported(`${k} has forward and backward clauses`);
      if (program.groups.has(`old_${k}`) || this.data.has(`old_${k}`)) throw new Unsupported(`it names old_${k}`);
    }
    // Backward clauses and the facts of backward relations stay as they are.
    this.backward = program.clauses.filter((c) => !c.forward && !this.data.has(key(c.head)));
    this.backwardKeys = new Set(this.backward.map((c) => key(c.head)));
    this.clausesOf = new Map();
    for (const clause of this.backward) {
      const k = key(clause.head);
      if (!this.clausesOf.has(k)) this.clausesOf.set(k, []);
      this.clausesOf.get(k).push(clause);
    }
    this.rules = program.clauses.filter((c) => c.forward && !c.heads.every((head) => head === 'true'));
    const result = run(program);
    if (result.haltCode !== null) throw new Unsupported('its own facts are contradictory');
    const facts = program.clauses.filter((c) => !c.forward && !c.body.length && this.data.has(key(c.head))).map((c) => c.head);
    for (const node of result.derived) if (this.data.has(key(node.goal))) facts.push(node.goal);
    if (!facts.every((fact) => isGround(fact))) throw new Unsupported('it has facts with variables');
    this.oldIds = new Set(facts.map(identity));
    this.index = new Map();
    for (const fact of facts) {
      for (const at of this.indexKeys(fact)) {
        let list = this.index.get(at);
        if (list === undefined) this.index.set(at, list = []);
        list.push(fact);
      }
    }
  }

  // The index keys of a term from least to most specific: its key, and for
  // a quad its property, and the class of an rdf:type statement.
  indexKeys(goal, env = null) {
    const k = key(goal);
    const keys = [k];
    if (!this.quads.has(k)) return keys;
    const p = env === null ? goal.args[1] : copyResolved(goal.args[1], env);
    if (!isGround(p)) return keys;
    keys.push(`${k}|${identity(p)}`);
    if (!isType(p)) return keys;
    const o = env === null ? goal.args[2] : copyResolved(goal.args[2], env);
    if (isGround(o)) keys.push(`${k}|${identity(p)}|${identity(o)}`);
    return keys;
  }

  // The old facts a goal matches.
  matches(goal, env, limit = Infinity) {
    const bucket = this.index.get(this.indexKeys(goal, env).at(-1)) ?? [];
    if (bucket.length > limit) return null;
    return bucket.filter((fact) => {
      const mark = env.mark();
      const matches = unify(goal, fact, env);
      env.undo(mark);
      return matches;
    });
  }

  // A program for these arriving facts, or null when this program cannot be
  // specialized; old holds the identities of the old facts.
  specialize(facts) {
    if (this.reason !== null) return null;
    const arriving = facts.filter((fact) => !this.oldIds.has(identity(fact)));
    this.patterns = new Map();
    for (const fact of arriving) {
      const k = key(fact);
      // A relation without facts or forward rules of its own may be read
      // anywhere, under negation too: the whole program runs.
      if (!this.data.has(k)) return null;
      this.addPattern(this.quads.has(k)
        ? new Struct(fact.name, [shape(fact.args[0]), fact.args[1], isType(fact.args[1]) ? fact.args[2] : shape(fact.args[2]), fact.args[3]])
        : shape(fact));
    }
    const id = [...this.patterns.values()].flatMap((group) => [...group.values()].map(canonical)).sort().join('\n');
    let compiled = this.cache.get(id);
    if (compiled === undefined) {
      try {
        compiled = this.compile();
      } catch (error) {
        if (!(error instanceof Unsupported)) throw error;
        compiled = { reason: error.message };
      }
      this.cache.set(id, compiled);
    }
    if (compiled.reason) return null;
    const first = compiled.program === undefined;
    compiled.program ??= new Program(compiled.sources);
    return { program: compiled.program.withFacts(arriving), sources: compiled.sources, old: this.oldIds, fresh: first };
  }

  // Add a pattern of new facts, generalizing the one of its relation,
  // property and class; true when that changes what can be new.
  addPattern(pattern) {
    const k = key(pattern);
    // With new facts of any property, as owl:sameAs between individuals
    // makes, nearly every rule is a variant: the whole program runs instead.
    if (this.quads.has(k) && !isGround(pattern.args[1])) throw new Unsupported('new facts can have any property');
    let group = this.patterns.get(k);
    if (group === undefined) this.patterns.set(k, group = new Map());
    const at = `${this.indexKeys(pattern).at(-1)}|${skeleton(pattern, 4)}`;
    const known = group.get(at);
    if (known !== undefined && instance(known, pattern)) return false;
    group.set(at, known === undefined ? pattern : generalize([known, pattern]));
    return true;
  }

  // The patterns of new facts a goal can match.
  newPatterns(goal, env) {
    const found = [];
    const args = goal.args.map((arg) => deref(arg, env));
    for (const pattern of this.patterns.get(key(goal))?.values() ?? []) {
      if (pattern.args.some((arg, i) => clashes(args[i], arg, env))) continue;
      const copy = renamed(pattern);
      const mark = env.mark();
      if (unify(goal, copy, env)) found.push(copy);
      env.undo(mark);
    }
    return found;
  }

  mayBeNew(goal, env = new Env()) {
    return this.newPatterns(goal, env).length > 0;
  }

  compile() {
    this.readsMemo = new Map();
    this.steps = 0;
    // The patterns of new facts, to a fixpoint.
    for (let changed = true; changed;) {
      changed = false;
      for (const rule of this.rules) {
        this.variants(rule, (heads) => {
          for (const head of heads) if (head !== 'false' && this.addPattern(head)) changed = true;
        });
      }
      if (changed) this.readsMemo = new Map();
    }
    const variants = [];
    for (const rule of this.rules) this.variants(rule, (heads, body, newIndex, free) => variants.push([heads, body, newIndex, free]));
    const sources = [];
    const needed = new Map();
    const need = (goal) => {
      for (const fact of this.matches(goal, new Env())) needed.set(identity(fact), fact);
    };
    for (const [heads, body, newIndex] of this.relevant(variants)) {
      const goals = body.map(([goal, mode]) => {
        if (mode === 'old') {
          need(goal);
          return old(goal);
        }
        return mode === 'new' ? goal : this.rewrite(goal, false, need);
      });
      // A new premise first: it has the fewest facts to try.
      const ordered = newIndex < 0 ? goals : [goals[newIndex], ...goals.filter((_, i) => i !== newIndex)];
      const inBody = new Set();
      for (const goal of ordered) for (const name of variables(goal).keys()) inBody.add(name);
      if (heads.some((head) => [...variables(head).keys()].some((name) => !inBody.has(name)))) {
        // Witnesses are shared by the conclusions of one firing.
        sources.push(new Source('forward', conjunction(heads), ordered));
        continue;
      }
      for (const head of heads) {
        if (head === 'false') {
          sources.push(new Source('contradiction', 'false', ordered));
          continue;
        }
        // An old conclusion is not new: say so when the old facts it
        // could be are few enough to copy.
        const could = this.matches(head, new Env(), MANY);
        if (could !== null && could.length) {
          need(head);
          sources.push(new Source('forward', head, [...ordered, new Struct('not', [old(head)])]));
        } else {
          sources.push(new Source('forward', head, ordered));
        }
      }
    }
    for (const clause of this.backward) {
      sources.push(clause.body.length
        ? new Source('backward', clause.head, clause.body.map((goal) => this.rewrite(goal, false, need)))
        : new Source('fact', clause.head, []));
    }
    for (const fact of needed.values()) sources.push(new Source('fact', old(fact), []));
    return { sources };
  }

  // The variants that can contribute to a wanted fact: one with a wanted
  // conclusion, or a contradiction, and then those concluding what its new
  // premises and the goals it calls read, to a fixpoint. Each wanted fact
  // says which of its positions matter to its reader: a value matters when
  // it reaches a position some reader uses, or joins goals. A conclusion
  // does not serve a reader when the variant reading it would conclude only
  // its own premises, as reflexive owl:sameAs does in replacement rules, or
  // when one of its own premises already agrees with it wherever the reader
  // looks, as a triple owl:sameAs copies to an equal object has the subject
  // its original has. All variants without wanted patterns.
  relevant(variants) {
    if (this.wanted === null) return variants;
    const wanted = this.wanted.map((pattern) => ({ goal: renamed(pattern), heads: null, premises: null, positions: pattern.args.map(() => true) }));
    const want = (goal, heads, premises, positions, free = null) => {
      const names = new Map();
      const suffix = `r${++fresh}`;
      const copy = freshTerm(goal, suffix, names);
      // The premise open where the rule has a variable whose value does
      // not matter: any value there serves alike.
      const open = free === null ? copy : new Struct(copy.name, copy.args.map((arg, i) => free[i] && !positions[i] ? variable() : arg));
      wanted.push({ goal: copy, open, heads: heads && heads.map((head) => freshTerm(head, suffix, names)),
        premises: premises && premises.map((premise) => freshTerm(premise, suffix, names)), positions });
    };
    const env = new Env();
    const serves = (head, own, { goal, open, heads, premises, positions }) => {
      const mark = env.mark();
      try {
        if (!unify(head, goal, env)) return false;
        if (heads === null) return true;
        // Every firing whose conclusion is read here has such a premise when
        // the premise, as the firing binds it, is an instance of the read one.
        if (own.some((premise) => {
          const bound = copyResolved(premise, env);
          return bound instanceof Struct && instance(open, bound) &&
            positions.every((matters, i) => !matters || identical(bound.args[i], head.args[i], env));
        })) return false;
        return heads.some((item) => item === 'false' || !premises.some((premise) => identical(premise, item, env)));
      } finally {
        env.undo(mark);
      }
    };
    // For each kept variant, the positions of each conclusion some reader uses.
    const usage = new Map();
    const checked = new Map();
    for (let changed = true; changed;) {
      changed = false;
      for (const variant of variants) {
        const [heads, body, , free] = variant;
        const own = body.filter(([, mode]) => mode === 'new' || mode === 'old').map(([goal]) => goal);
        let use = usage.get(variant);
        let grew = false;
        const from = checked.get(variant) ?? 0;
        checked.set(variant, wanted.length);
        heads.forEach((head, h) => {
          if (head === 'false') {
            if (use === undefined) usage.set(variant, use = heads.map((item) => item instanceof Struct ? item.args.map(() => false) : []));
            if (from === 0) grew = true;
            return;
          }
          for (let w = from; w < wanted.length; w++) {
            if (!serves(head, own, wanted[w])) continue;
            if (use === undefined) usage.set(variant, use = heads.map((item) => item instanceof Struct ? item.args.map(() => false) : []));
            wanted[w].positions.forEach((matters, i) => {
              if (matters && !use[h][i]) use[h][i] = grew = true;
            });
            if (!use[h].length) grew = true;
          }
        });
        if (!grew) continue;
        changed = true;
        // The values that matter: those at used positions of the
        // conclusions, and those shared with another goal of the body.
        const values = (except) => {
          const names = new Set();
          heads.forEach((head, h) => {
            if (head instanceof Struct) head.args.forEach((arg, i) => { if (use[h][i]) for (const name of variables(arg).keys()) names.add(name); });
          });
          for (const [goal] of body) if (goal !== except) for (const name of variables(goal).keys()) names.add(name);
          return names;
        };
        for (const [at, [goal, mode]] of body.entries()) {
          if (mode === 'new') {
            const names = values(goal);
            const counts = new Map();
            for (const arg of goal.args) for (const name of variables(arg).keys()) counts.set(name, (counts.get(name) ?? 0) + 1);
            want(goal, heads, own, goal.args.map((arg) => [...variables(arg).keys()].some((name) => names.has(name) || counts.get(name) > 1)), free[at]);
          } else if (mode === null) {
            for (const read of this.reads(goal)) want(read, null, null, read.args.map(() => true));
          }
        }
      }
    }
    return variants.filter((variant) => usage.has(variant));
  }

  // The data goals that a goal which is no premise reads and that can be
  // new: inside control goals, and in the backward clauses it calls.
  reads(goal, seen = new Set()) {
    if (!(goal instanceof Struct)) return [];
    const goalKey = key(goal);
    if (this.data.has(goalKey)) return this.mayBeNew(goal) ? [goal] : [];
    if (CONTROL_KEYS.has(goalKey)) return goal.args.flatMap((arg) => this.reads(arg, seen));
    if (!this.backwardKeys.has(goalKey) || seen.has(goalKey)) return [];
    seen.add(goalKey);
    return this.clausesOf.get(goalKey).flatMap((clause) => clause.body.flatMap((item) => this.reads(item, seen)));
  }

  // Whether a goal that is no premise may hold: false when no clause can
  // answer it within depth steps, or a type test fails. A goal only one fact
  // can answer is bound to it in env, so the goals after it see its values.
  holds(goal, depth, env) {
    const resolved = copyResolved(goal, env);
    if (!(resolved instanceof Struct)) return true;
    const goalKey = key(resolved);
    if (TYPE_TESTS.has(goalKey)) return resolved.args[0] instanceof Var || TYPE_TESTS.get(goalKey)(resolved.args[0]);
    if (goalKey === 'and/2') return resolved.args.every((arg) => this.holds(arg, depth, env));
    if (goalKey === 'or/2') return resolved.args.some((arg) => this.holds(arg, depth, new Env()));
    if (!this.backwardKeys.has(goalKey)) return true;
    let only = null;
    let count = 0;
    for (const clause of this.clausesOf.get(goalKey)) {
      const names = new Map();
      const suffix = `h${++fresh}`;
      const head = freshTerm(clause.head, suffix, names);
      const local = new Env();
      if (!unify(resolved, head, local)) continue;
      if (depth && !clause.body.every((item) => this.holds(freshTerm(item, suffix, names), depth - 1, local))) continue;
      if (++count > 1) return true;
      only = clause.body.length ? null : copyResolved(head, local);
    }
    if (only !== null) unify(resolved, only, env);
    return count > 0;
  }

  // Whether a goal that is no premise reads facts that can be new: a data
  // goal inside a control goal, or a backward relation that reads them.
  readsNew(goal) {
    if (!(goal instanceof Struct || typeof goal === 'string')) return goal instanceof Var;
    const goalKey = key(goal);
    if (this.data.has(goalKey)) return this.mayBeNew(goal);
    if (CONTROL_KEYS.has(goalKey)) return goal.args.some((arg) => this.readsNew(arg));
    if (!this.backwardKeys.has(goalKey)) return false;
    let reads = this.readsMemo.get(goalKey);
    if (reads !== undefined) return reads;
    const seen = new Set([goalKey]);
    const walk = (item) => {
      if (!(item instanceof Struct || typeof item === 'string')) return item instanceof Var;
      const itemKey = key(item);
      if (this.data.has(itemKey)) return this.mayBeNew(item);
      if (CONTROL_KEYS.has(itemKey)) return item.args.some(walk);
      if (!this.backwardKeys.has(itemKey) || seen.has(itemKey)) return false;
      seen.add(itemKey);
      return this.clausesOf.get(itemKey).some((c) => c.body.some(walk));
    };
    reads = this.clausesOf.get(goalKey).some((c) => c.body.some(walk));
    this.readsMemo.set(goalKey, reads);
    return reads;
  }

  // A goal that is not a premise of a variant, with its data goals reading
  // old facts, or old and new ones; negating or collecting new facts is not
  // specialized.
  rewrite(goal, negated, need) {
    if (goal instanceof Var) throw new Unsupported('a goal is a variable');
    if (!(goal instanceof Struct || typeof goal === 'string')) return goal;
    const goalKey = key(goal);
    if (this.data.has(goalKey)) {
      const may = this.mayBeNew(goal);
      if (may && negated) throw new Unsupported(`it negates or collects ${goalKey} facts that can be new`);
      need(goal);
      return may ? new Struct('or', [old(goal), goal]) : old(goal);
    }
    if (NEGATING.has(goalKey)) {
      const at = goalKey === 'not/1' ? 0 : 1;
      return new Struct(goal.name, goal.args.map((arg, i) => i === at ? this.rewrite(arg, true, need) : arg));
    }
    if (CONTROL_KEYS.has(goalKey)) return new Struct(goal.name, goal.args.map((arg) => this.rewrite(arg, negated, need)));
    if (negated && this.readsNew(goal)) {
      throw new Unsupported(`it negates or collects ${goalKey}, which reads facts that can be new`);
    }
    return goal;
  }

  // Each variant of a forward rule: emit(heads, body, newIndex), the body a
  // list of [goal, mode], mode 'new', 'old' or null for a goal that is no
  // premise, and newIndex the position of the first new premise.
  variants(rule, emit) {
    const names = new Map();
    const suffix = `s${++fresh}`;
    const heads = rule.heads.filter((head) => head !== 'true').map((head) => freshTerm(head, suffix, names));
    const body = rule.body.map((goal) => freshTerm(goal, suffix, names));
    const data = body.map((goal, i) => this.data.has(key(goal)) ? i : -1).filter((i) => i >= 0);
    // A negation or collection of what can be new is refused whether or not
    // a variant survives: more facts could retract an old conclusion.
    for (const goal of body) if (!this.data.has(key(goal))) this.rewrite(goal, false, () => {});
    // A goal that is no premise but reads new facts makes a variant new.
    const reading = body.some((goal) => !this.data.has(key(goal)) && this.readsNew(goal));
    const modes = new Array(body.length).fill(null);
    const env = new Env();
    let leaves = 0;
    const leaf = (count) => {
      if (!count && !reading) return;
      const mark = env.mark();
      try {
        for (const [i, goal] of body.entries()) if (modes[i] === null && !this.holds(goal, DEPTH, env)) return;
        settled(count);
      } finally {
        env.undo(mark);
      }
    };
    const settled = () => {
      const resolved = body.map((goal) => copyResolved(goal, env));
      const premises = resolved.filter((_, i) => modes[i] === 'new' || modes[i] === 'old');
      const kept = heads.map((head) => copyResolved(head, env)).filter((head) => head === 'false' ||
        (!premises.some((goal) => identical(goal, head)) && !(isGround(head) && this.oldIds.has(identity(head)))));
      if (!kept.length) return;
      const list = [];
      let newIndex = -1;
      resolved.forEach((goal, i) => {
        if (modes[i] === 'fact') return;
        if (modes[i] === 'new' && newIndex < 0) newIndex = list.length;
        list.push([goal, modes[i], body[i]]);
      });
      emit(kept, list, newIndex, list.map(([, , original]) => original instanceof Struct ? original.args.map((arg) => arg instanceof Var) : []));
    };
    // The variables in the property, or rdf:type class, of the conclusions
    // and the other premises: unfolding an old premise that binds one makes
    // a pattern specific.
    const keyed = (i) => {
      const found = new Set();
      for (const term of [...heads, ...data.filter((j) => j !== i).map((j) => body[j])]) {
        if (!(term instanceof Struct) || !this.quads.has(key(term))) continue;
        const [, p, o] = term.args.map((arg) => copyResolved(arg, env));
        for (const name of variables(p).keys()) found.add(name);
        if (p instanceof Var || isType(p)) for (const name of variables(o).keys()) found.add(name);
      }
      return found;
    };
    const visit = (pending, count) => {
      if (++this.steps > STEPS) throw new Unsupported('its messages need too many specialized rules');
      if (!pending.length) return leaf(count);
      if (!count && !reading && !pending.some((i) => this.mayBeNew(body[i], env))) return;
      // The premise with the fewest alternatives first; none ends the search.
      let choice = null;
      for (const [at, i] of pending.entries()) {
        const goal = body[i];
        const patterns = this.newPatterns(goal, env);
        const facts = this.matches(goal, env, MANY);
        const any = facts === null || facts.length > 0;
        let unfold = facts !== null && facts.length > 0 && facts.length <= UNFOLD;
        if (unfold) {
          const names = keyed(i);
          unfold = [...variables(copyResolved(goal, env)).keys()].some((name) => names.has(name));
        }
        const branches = patterns.length + (unfold ? facts.length : any ? 1 : 0);
        if (!branches) return;
        if (choice === null || branches < choice.branches) choice = { at, i, patterns, facts, any, unfold, branches };
      }
      const { at, i, patterns, facts, any, unfold } = choice;
      const rest = pending.filter((_, k) => k !== at);
      const goal = body[i];
      for (const pattern of patterns) {
        const mark = env.mark();
        if (unify(goal, pattern, env)) {
          modes[i] = 'new';
          visit(rest, count + 1);
        }
        env.undo(mark);
      }
      // Old: possible only if a later premise can still be new.
      if (any && (count || reading || rest.some((j) => this.mayBeNew(body[j], env)))) {
        if (unfold) {
          for (const fact of facts) {
            const mark = env.mark();
            if (unify(goal, fact, env)) {
              modes[i] = 'fact';
              if (++leaves > LEAVES) throw new Unsupported(`rule ${rule.id} has too many specialized instances`);
              visit(rest, count);
            }
            env.undo(mark);
          }
        } else {
          // What all the old facts it matches share, such as the same
          // subject and object, still binds the premise.
          const mark = env.mark();
          if (facts !== null) unify(goal, generalize(facts), env);
          modes[i] = 'old';
          visit(rest, count);
          env.undo(mark);
        }
      }
      modes[i] = null;
    };
    visit(data, 0);
  }
}
