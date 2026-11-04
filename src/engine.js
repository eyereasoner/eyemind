// Backward resolution, forward fixpoints and proof recording.
import { PRIMITIVE_KEYS, primitive } from './builtins.js';
import { freshClause, matchHead, renaming, text, variant } from './common.js';
import { readGoal } from './goals.js';
import { INSPECTION_KEYS } from './inspection.js';
import { checkRendered, clauseDisplay, renderProof } from './proof.js';
import { CONTROL_KEYS, Program } from './program.js';
import { isActivation } from './templates.js';
import {
  Env, EyemindError, Struct, Var, conjunction, copyResolved, deref, flattenConjunction, freshTerm,
  identity, isCallable, isGround, isGroundButAnonymous, isTerm, key, keyArity, listFromItems, unify,
  variables,
} from './terms.js';
import { Lettering, write } from './writer.js';

export const BUILTIN = 'builtin';
export const CONTROL = 'control';
export const ABSENT = 'absent';
export const COLLECTED = 'collected';

// One proof step: a goal, how it was justified, and the steps it used.
export class Node {
  constructor(goal, by, bindings = NO_NODES, children = NO_NODES, collectedUses = null, final = false, scoped = NO_NODES) {
    this.goal = goal;
    // A derived fact's node is resolved once and for all when the fact is
    // derived, so whatever uses the fact shares the node, derivation and all.
    this.final = final;
    this.by = by;
    this.bindings = bindings;
    this.children = children;
    // A collection has no children in a proof, so its node keeps the clauses
    // its answers used.
    this.collectedUses = collectedUses;
    this.scoped = scoped;
    this.generic = false;
  }
}

// The step a frame's body will justify once it is finished.
class Pending {
  constructor(goal, by, bindings, cut) {
    this.goal = goal;
    this.by = by;
    this.bindings = bindings;
    this.cut = cut;
  }
}

// One body being worked through. Frames never change once made.
class Frame {
  constructor(goals, index, nodes, parent, pending, depth) {
    this.goals = goals;
    this.index = index;
    this.nodes = nodes;
    this.parent = parent;
    this.pending = pending;
    this.depth = depth;
  }
}

function bisectLeft(order, value) {
  let low = 0;
  let high = order.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (order[mid] < value) low = mid + 1;
    else high = mid;
  }
  return low;
}

// A choice point: the frame it was made in and its untried alternatives: the
// derived facts from start to stop, then the source clauses. With an order,
// the facts are those at the indexes order[start:stop].
class Point {
  constructor(kind, frame, mark, goal, { alternatives = NO_NODES, facts = NO_NODES, clauses = NO_NODES,
    iterator = null, start = 0, stop = null, order = null } = {}) {
    this.kind = kind;
    this.frame = frame;
    this.mark = mark;
    this.goal = goal;
    this.alternatives = alternatives;
    this.facts = facts;
    this.clauses = clauses;
    this.position = 0;
    this.iterator = iterator;
    this.order = order;
    if (order === null) {
      this.start = start;
      this.stop = stop === null ? facts.length : stop;
    } else {
      this.start = bisectLeft(order, start);
      this.stop = stop === null ? order.length : bisectLeft(order, stop);
    }
  }

  count() {
    if (this.kind === 'branch' || this.kind === 'inspection') return this.alternatives.length;
    return this.stop - this.start + this.clauses.length;
  }
}

const NO_NODES = Object.freeze([]);
const QUIET = new Pending(null, null, NO_NODES, null);
const SPLICE = 'splice';

function resolveOne(node, env) {
  return new Node(copyResolved(node.goal, env), node.by,
    node.bindings.map(([name, value]) => [name, copyResolved(value, env)]),
    new Array(node.children.length).fill(null), node.collectedUses, false,
    node.scoped.map((term) => copyResolved(term, env)));
}

// An inspected source rule supplies universal variables. Follow the recorded
// evidence so ordinary fresh variables still receive existential witnesses.
function scopedVariables(nodes, env) {
  const found = new Map();
  const seen = new Set();
  const pending = [...nodes];
  while (pending.length) {
    const node = pending.pop();
    if (seen.has(node)) continue;
    seen.add(node);
    if (isTerm(node.by, 'source', 1)) variables(copyResolved(node.goal, env), found);
    for (const term of node.scoped) variables(copyResolved(term, env), found);
    pending.push(...node.children);
  }
  return found;
}

// A universal derived pattern is renamed together with its evidence at each
// use. Renaming just its head would disconnect the certificate's variables.
function freshNode(node, suffix) {
  const names = new Map();
  const copies = new Map();
  const make = (source) => new Node(freshTerm(source.goal, suffix, names, true), source.by,
    source.bindings.map(([name, value]) => [name, freshTerm(value, suffix, names, true)]),
    [], source.collectedUses, false, source.scoped.map((term) => freshTerm(term, suffix, names, true)));
  const root = make(node);
  copies.set(node, root);
  const pending = [node];
  while (pending.length) {
    const source = pending.pop();
    const target = copies.get(source);
    for (const child of source.children) {
      if (!copies.has(child)) {
        copies.set(child, make(child));
        pending.push(child);
      }
      target.children.push(copies.get(child));
    }
  }
  return root;
}

// Resolve a proof forest with an explicit stack: a derivation chain is as deep
// as the search that produced it. A derived fact's node is already final and
// is shared rather than copied, which keeps a long forward chain from being
// copied again at every step.
export function resolveNode(node, env) {
  if (node.final) return node;
  const root = resolveOne(node, env);
  const pending = [[node, root]];
  while (pending.length) {
    const [source, target] = pending.pop();
    source.children.forEach((child, index) => {
      if (child.final) {
        target.children[index] = child;
        return;
      }
      const copy = resolveOne(child, env);
      target.children[index] = copy;
      if (child.children.length) pending.push([child, copy]);
    });
  }
  return root;
}

// The source clauses a set of proof nodes rests on.
export function clausesUsed(nodes, used = new Set()) {
  const pending = [...nodes];
  const seen = new Set();
  while (pending.length) {
    const node = pending.pop();
    if (seen.has(node)) continue;
    seen.add(node);
    if (node.by instanceof Struct) used.add(Number(node.by.args[0]));
    if (node.collectedUses) for (const id of node.collectedUses) used.add(id);
    for (const child of node.children) pending.push(child);
  }
  return used;
}

// The source clauses that searches behind a trusted boundary could consult.
// A negation or a collection records no derivation in a proof, so follow its
// goal through the program instead: every clause whose head could answer a
// goal it reaches, and the goals in that clause's body, transitively.
export function clausesBehindBoundaries(program, roots) {
  const byKey = new Map();
  for (const clause of program.clauses) {
    for (const head of clause.heads || [clause.head]) {
      if (isCallable(head)) {
        const headKey = key(head);
        if (!byKey.has(headKey)) byKey.set(headKey, []);
        byKey.get(headKey).push(clause);
      }
    }
  }
  const pending = [];
  function visit(goal) {
    if (!isCallable(goal)) return;
    if (isTerm(goal, 'and', 2) || isTerm(goal, 'or', 2)) {
      visit(goal.args[0]);
      visit(goal.args[1]);
    } else if (isTerm(goal, 'not', 1) || isTerm(goal, 'call', 1) || isTerm(goal, 'once', 1)) {
      visit(goal.args[0]);
    } else if (isTerm(goal, 'findall', 3)) {
      visit(goal.args[1]);
    } else if (!PRIMITIVE_KEYS.has(key(goal))) {
      pending.push(key(goal));
    }
  }
  const nodes = [...roots];
  const visited = new Set();
  while (nodes.length) {
    const node = nodes.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    if (node.by === ABSENT || node.by === COLLECTED) visit(node.goal);
    for (const child of node.children) nodes.push(child);
  }
  const seen = new Set();
  const reached = new Set();
  while (pending.length) {
    const goalKey = pending.pop();
    if (seen.has(goalKey)) continue;
    seen.add(goalKey);
    const candidates = INSPECTION_KEYS.has(goalKey) ? program.inspections.get(goalKey) : byKey.get(goalKey) || [];
    for (const clause of candidates) {
      reached.add(clause.id);
      for (const goal of clause.body) visit(goal);
    }
  }
  return reached;
}

function compareChosen(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const x = a[i];
    const y = b[i];
    if (x[0] !== y[0]) return x[0] < y[0] ? -1 : 1;
    if (x[1] !== y[1]) return x[1] < y[1] ? -1 : 1;
  }
  return a.length - b.length;
}

const isIndexable = (value) => typeof value === 'string' || typeof value === 'bigint' || typeof value === 'number';

export class Solver {
  constructor(program, options) {
    this.program = program;
    this.options = options;
    this.recording = Boolean(options.proof || program.inspectionEnabled);
    this.serial = 0;
    this.facts = new Map();
    // Derived facts indexed by argument: for each name and arity, one map
    // per argument position from an atom or number to the indexes, in order,
    // of the facts with that value there.
    this.factIndex = new Map();
    this.factKeys = new Set(program.groundFactKeys);
    this.genericKeys = new Set();
    this.genericPredicates = new Set();
    this.derived = [];
    this.reported = new Map();
    this.stats = { inferences: 0, rounds: 0, derived: 0 };
    this.haltCode = null;
    this.maxDepth = options.maxDepth || 1000000;
    // Semi-naive forward reasoning: while a rule's body is searched with a
    // window, each of its goals sees only the derived facts in its window,
    // and the alternative each goal took is noted in chosen.
    this.window = null;
    this.windowGoals = null;
    this.chosen = null;
    this.snapshots = new Map();
    this.direct = new Map();
    this.maxInferences = options.maxInferences || 1000000;
  }

  // Proof nodes are recorded only when a proof is asked for. Without one,
  // frames share an empty array and a finished body has nothing to hand back.
  advance(frame, node) {
    return new Frame(frame.goals, frame.index + 1,
      this.recording ? [...frame.nodes, node] : NO_NODES,
      frame.parent, frame.pending, frame.depth);
  }

  childFrame(parent, goals, pending, depth) {
    // A last goal can return straight to its caller when there is no proof
    // step or control cut to finish. Choice points still retain their own
    // frames, so alternatives backtrack normally.
    if (!this.recording && (pending === QUIET || pending === SPLICE) && parent.index + 1 === parent.goals.length) {
      return new Frame(goals, 0, NO_NODES, parent.parent, parent.pending, depth);
    }
    return new Frame(goals, 0, this.recording ? [] : NO_NODES, parent, pending, depth);
  }

  controlPending(goal, cut) {
    if (this.recording || cut !== null) return new Pending(goal, CONTROL, NO_NODES, cut);
    return QUIET;
  }

  // A finished body hands its nodes to the frame that started it: a
  // conjunction splices them in place, anything else wraps them as one step's
  // children.
  closeFrame(frame) {
    const parent = frame.parent;
    if (!this.recording) {
      return new Frame(parent.goals, parent.index + 1, NO_NODES, parent.parent, parent.pending, parent.depth);
    }
    let nodes;
    if (frame.pending === SPLICE) {
      nodes = [...parent.nodes, ...frame.nodes];
    } else {
      const pending = frame.pending;
      nodes = [...parent.nodes, new Node(pending.goal, pending.by, pending.bindings, [...frame.nodes])];
    }
    return new Frame(parent.goals, parent.index + 1, nodes, parent.parent, parent.pending, parent.depth);
  }

  // Backward search as an explicit machine rather than nested generators. A
  // frame is one body being worked through; frames are immutable, so a choice
  // point only has to remember the frame it was made in and backtracking is a
  // pointer assignment rather than an undo log. One substitution is threaded
  // through the whole search and restored by the trail, so an answer's
  // bindings are only valid until the next one is requested: every consumer
  // copies what it needs first.
  *solve(goals, env = new Env(), depth = 0) {
    let frame = new Frame(goals, 0, this.recording ? [] : NO_NODES, null, null, depth);
    const choices = [];
    const entry = env.mark();
    let failed = false;
    const stats = this.stats;
    try {
      while (true) {
        if (failed) {
          if (!choices.length) return;
          const point = choices[choices.length - 1];
          env.undo(point.mark);
          const resumed = this.retry(point, env);
          if (resumed === null) {
            choices.pop();
            continue;
          }
          frame = resumed;
          failed = false;
          continue;
        }
        if (frame.index >= frame.goals.length) {
          if (frame.parent === null) {
            yield [env, frame.nodes];
            failed = true;
            continue;
          }
          // once/1 commits to its first solution by discarding the choice
          // points its own goal created.
          const cut = frame.pending !== SPLICE ? frame.pending.cut : null;
          if (cut !== null && choices.length > cut) choices.length = cut;
          frame = this.closeFrame(frame);
          continue;
        }
        if (frame.depth > this.maxDepth) throw new EyemindError('backward reasoning exceeded max_depth');
        stats.inferences++;
        if (stats.inferences > this.maxInferences) throw new EyemindError('reasoning exceeded max_inferences');
        const goal = deref(frame.goals[frame.index], env);
        if (!isCallable(goal)) throw new EyemindError(`expected a callable goal, got ${text(goal)}`);
        const next = this.step(goal, frame, env, choices);
        if (next === null) {
          failed = true;
          continue;
        }
        frame = next;
      }
    } finally {
      env.undo(entry);
    }
  }

  // Start one goal: the frame to continue from, or null when it has no solution.
  step(goal, frame, env, choices) {
    const recording = this.recording;
    const goalKey = key(goal);
    const windowed = this.window !== null && frame.goals === this.windowGoals;
    if (windowed) this.chosen[frame.index] = [0, 0];
    if (goalKey === 'and/2') return this.childFrame(frame, flattenConjunction(goal), SPLICE, frame.depth);
    if (goalKey === 'not/1') {
      // Negation is a test, not a way to bind its variables; its anonymous
      // variables stand for any value.
      if (!isGroundButAnonymous(goal.args[0], env)) {
        throw new EyemindError('negation requires a goal whose variables are bound, ' +
                              `except for anonymous ones: ${text(goal, env)}`);
      }
      const mark = env.mark();
      const iterator = this.solve([goal.args[0]], env, frame.depth + 1);
      let absent;
      try {
        absent = iterator.next().done;
      } finally {
        iterator.return();
        env.undo(mark);
      }
      if (!absent) return null;
      return this.advance(frame, recording ? new Node(goal, ABSENT) : null);
    }
    if (goalKey === 'findall/3') {
      const items = [];
      const scoped = [];
      const uses = recording ? new Set() : null;
      const mark = env.mark();
      for (const [answerEnv, nodes] of this.solve([goal.args[1]], env, frame.depth + 1)) {
        this.serial++;
        const names = new Map();
        items.push(freshTerm(copyResolved(goal.args[0], answerEnv), `collection${this.serial}`, names));
        if (this.program.inspectionEnabled) {
          for (const name of scopedVariables(nodes, answerEnv).keys()) {
            if (names.has(name)) scoped.push(names.get(name));
          }
        }
        if (recording) clausesUsed(nodes, uses);
      }
      env.undo(mark);
      if (!unify(goal.args[2], listFromItems(items), env)) {
        env.undo(mark);
        return null;
      }
      if (!recording) return this.advance(frame, null);
      return this.advance(frame, new Node(goal, COLLECTED, NO_NODES, NO_NODES, uses, false, scoped));
    }
    let point;
    if (INSPECTION_KEYS.has(goalKey)) {
      point = new Point('inspection', frame, env.mark(), goal, { alternatives: this.program.inspections.get(goalKey) });
    } else if (goalKey === 'or/2') {
      point = new Point('branch', frame, env.mark(), goal, { alternatives: goal.args });
    } else if (goalKey === 'call/1' || goalKey === 'once/1') {
      const cut = goalKey === 'once/1' ? choices.length : null;
      return this.childFrame(frame, [goal.args[0]], this.controlPending(goal, cut), frame.depth + 1);
    } else if (PRIMITIVE_KEYS.has(goalKey)) {
      point = new Point('primitive', frame, env.mark(), goal, { iterator: primitive(goal, env) });
    } else if (windowed) {
      const [start, stop, withClauses] = this.window[frame.index];
      point = new Point('resolve', frame, env.mark(), goal, {
        facts: this.facts.get(goalKey) || NO_NODES,
        clauses: withClauses ? this.program.candidates(goal, env, goalKey) : NO_NODES,
        start, stop, order: this.factOrder(goal, env, goalKey),
      });
    } else {
      // Derived facts are tried before source clauses. Neither list changes
      // while a search runs.
      point = new Point('resolve', frame, env.mark(), goal, {
        facts: this.facts.get(goalKey) || NO_NODES,
        clauses: this.program.candidates(goal, env, goalKey),
        order: this.factOrder(goal, env, goalKey),
      });
    }
    const next = this.retry(point, env);
    if (next === null) return null;
    if (point.kind === 'primitive' || point.position < point.count()) choices.push(point);
    return next;
  }

  addFact(goalKey, node) {
    if (node.generic) this.genericPredicates.add(goalKey);
    let facts = this.facts.get(goalKey);
    if (facts === undefined) {
      facts = [];
      this.facts.set(goalKey, facts);
    }
    const number = facts.length;
    facts.push(node);
    const arity = keyArity(goalKey);
    if (arity) {
      let positions = this.factIndex.get(goalKey);
      if (positions === undefined) {
        positions = Array.from({ length: arity }, () => new Map());
        this.factIndex.set(goalKey, positions);
      }
      node.goal.args.forEach((arg, position) => {
        if (isIndexable(arg)) {
          const bucket = positions[position].get(arg);
          if (bucket === undefined) positions[position].set(arg, [number]);
          else bucket.push(number);
        }
      });
    }
  }

  // The indexes of the derived facts a goal could match, in order, when an
  // argument of the goal narrows them down; null to try them all.
  factOrder(goal, env, goalKey) {
    if (this.genericPredicates.has(goalKey)) return null;
    const positions = this.factIndex.get(goalKey);
    if (positions === undefined) return null;
    let best = null;
    let size = this.facts.get(goalKey).length;
    for (let position = 0; position < goal.args.length; position++) {
      let arg = goal.args[position];
      if (arg instanceof Var && env !== null) arg = deref(arg, env);
      if (isIndexable(arg)) {
        const bucket = positions[position].get(arg) || NO_NODES;
        if (bucket.length < size) {
          best = bucket;
          size = bucket.length;
          if (!size) break;
        }
      }
    }
    return best;
  }

  // Take the next untried alternative of a choice point, or null. The caller
  // has already undone the bindings of the previous one.
  retry(point, env) {
    const recording = this.recording;
    const windowed = this.window !== null && point.frame.goals === this.windowGoals;
    if (point.kind === 'primitive') {
      if (point.iterator.next().done) return null;
      if (windowed) {
        this.chosen[point.frame.index] = [0, point.position];
        point.position++;
      }
      return this.advance(point.frame, recording ? new Node(point.goal, BUILTIN) : null);
    }
    const count = point.count();
    while (point.position < count) {
      const position = point.position;
      point.position++;
      if (point.kind === 'branch') {
        return this.childFrame(point.frame, [point.alternatives[position]],
          this.controlPending(point.goal, null), point.frame.depth + 1);
      }
      if (point.kind === 'inspection') {
        const source = point.alternatives[position];
        this.serial++;
        if (unify(point.goal, freshTerm(source.term, this.serial, new Map(), true), env)) {
          return this.advance(point.frame, recording ? new Node(point.goal, new Struct('source', [BigInt(source.id)])) : null);
        }
        env.undo(point.mark);
        continue;
      }
      const inWindow = point.stop - point.start;
      if (position < inWindow) {
        let index = point.start + position;
        if (point.order !== null) index = point.order[index];
        let fact = point.facts[index];
        if (fact.generic) fact = freshNode(fact, ++this.serial);
        if (unify(point.goal, fact.goal, env)) {
          if (windowed) this.chosen[point.frame.index] = [0, index];
          return this.advance(point.frame, fact);
        }
        env.undo(point.mark);
        continue;
      }
      const clause = point.clauses[position - inWindow];
      if (windowed) this.chosen[point.frame.index] = [1, clause.id];
      this.serial++;
      // The body is renamed only once the head unifies: many candidate
      // clauses of a goal fail on their head.
      const renamed = clause.renaming || renaming(clause);
      if (renamed === null) {
        const names = new Map();
        if (!unify(point.goal, freshTerm(clause.head, this.serial, names, true), env)) {
          env.undo(point.mark);
          continue;
        }
        const body = clause.body.map((goal) => freshTerm(goal, this.serial, names, true));
        const pending = recording
          ? new Pending(point.goal, new Struct('clause', [BigInt(clause.id)]), [...names], null)
          : QUIET;
        return this.childFrame(point.frame, body, pending, point.frame.depth + 1);
      }
      // The head is matched as a pattern, so its variables become the goal's
      // subterms instead of fresh variables bound to them; only a variable
      // with no value from the head gets a fresh one.
      const suffix = String(this.serial);
      const prefixes = renamed.prefixes;
      const values = new Array(prefixes.length);
      const fresh = (i) => new Var(prefixes[i] + suffix, true);
      if (!matchHead(renamed, point.goal, values, fresh, env)) {
        env.undo(point.mark);
        continue;
      }
      for (let i = 0; i < values.length; i++) if (values[i] === undefined) values[i] = fresh(i);
      const body = renamed.body(values);
      const pending = recording
        ? new Pending(point.goal, new Struct('clause', [BigInt(clause.id)]),
          renamed.names.map((name, i) => [name, values[i]]), null)
        : QUIET;
      return this.childFrame(point.frame, body, pending, point.frame.depth + 1);
    }
    return null;
  }

  // For a rule semi-naive search can take, the key of each body goal answered
  // by facts alone, or null for a primitive or a negation or collection; null
  // for other rules. Negations and collections consult lower strata only
  // (Section 4.5), so they do not change within one.
  directKeys(clause) {
    if (this.direct.has(clause.id)) return this.direct.get(clause.id);
    let keys = [];
    for (const goal of clause.body) {
      if (!isCallable(goal)) {
        keys = null;
        break;
      }
      const goalKey = key(goal);
      if (PRIMITIVE_KEYS.has(goalKey) || INSPECTION_KEYS.has(goalKey) || goalKey === 'not/1' || goalKey === 'findall/3') {
        keys.push(null);
      } else if (CONTROL_KEYS.has(goalKey) || (this.program.groups.get(goalKey) || []).some((item) => item.body.length)) {
        keys = null;
        break;
      } else {
        keys.push(goalKey);
      }
    }
    this.direct.set(clause.id, keys);
    return keys;
  }

  // The activations of a forward rule against the current state, in the
  // order a full search of its body finds them. After a rule's first search,
  // a rule whose body goals are answered by facts alone is searched
  // semi-naively: only activations that use a fact derived since its last
  // search can conclude anything new, so the body is searched once for each
  // goal that has such facts, that goal limited to them and the goals before
  // it to the older ones. The activations are then put back in the order a
  // full search would find them.
  activations(clause) {
    const keys = this.directKeys(clause);
    let now = null;
    let previous = null;
    if (keys !== null) {
      now = new Map();
      for (const goalKey of keys) if (goalKey) now.set(goalKey, (this.facts.get(goalKey) || NO_NODES).length);
      previous = this.snapshots.get(clause.id) || null;
      this.snapshots.set(clause.id, now);
    }
    let positions = null;
    if (previous !== null) {
      positions = [];
      keys.forEach((goalKey, i) => {
        if (goalKey && now.get(goalKey) > previous.get(goalKey)) positions.push(i);
      });
      if (!positions.some((i) => this.mayMatchNew(clause.body[i], keys[i], previous, now))) {
        return []; // nothing derived since its last search can be used, so nothing new follows
      }
    }
    this.serial++;
    const [head, body, names] = freshClause(clause, this.serial, true);
    if (previous === null) return this.scan(clause, head, body, names).map(([found]) => found);
    const found = [];
    for (const delta of positions) {
      const window = keys.map((goalKey, i) => {
        if (goalKey === null) return null;
        if (i < delta) return [0, previous.get(goalKey), true];
        if (i === delta) return [previous.get(goalKey), now.get(goalKey), false];
        return [0, now.get(goalKey), true];
      });
      this.window = window;
      this.windowGoals = body;
      this.chosen = new Array(body.length).fill(null);
      try {
        found.push(...this.scan(clause, head, body, names));
      } finally {
        this.window = this.windowGoals = this.chosen = null;
      }
    }
    found.sort((a, b) => compareChosen(a[1], b[1]));
    return found.map(([activation]) => activation);
  }

  // Whether a body goal, as the rule writes it, could match a fact derived
  // since the rule's last search. The goal's own atoms and numbers narrow the
  // facts down before the rule is renamed and searched.
  mayMatchNew(goal, goalKey, previous, now) {
    const order = this.factOrder(goal, null, goalKey);
    if (order === null) return true;
    const first = bisectLeft(order, previous.get(goalKey));
    return first < order.length && order[first] < now.get(goalKey);
  }

  // Each solution of a renamed rule's body, as what it concludes, with the
  // alternatives its goals took when the body is searched in a window.
  // Bindings last only until the next answer is requested, and adding facts
  // mid-scan would extend a live search, so each activation is copied out
  // first and concluded afterwards.
  scan(clause, head, body, names) {
    const found = [];
    for (const [answerEnv, nodes] of this.solve(body)) {
      const mark = answerEnv.mark();
      // Head variables the body leaves unbound become Skolem terms, shared
      // between the heads of one conclusion.
      const resolved = copyResolved(head, answerEnv);
      const unresolved = variables(resolved);
      if (this.program.inspectionEnabled) {
        const scoped = scopedVariables(nodes, answerEnv);
        const captured = clause.captures === null ? null : copyResolved(body[0].args[1], answerEnv);
        const relevant = [...unresolved.keys(), ...(captured === null ? [] : variables(captured).keys())];
        if (relevant.some((name) => scoped.has(name))) {
          const inBody = new Set();
          for (const goal of clause.body) for (const name of variables(goal).keys()) inBody.add(name);
          if ([...variables(clause.head).keys()].some((name) => !inBody.has(name))) {
            throw new EyemindError('bind inspected rule variables before deriving existential witnesses');
          }
        }
        for (const name of scoped.keys()) unresolved.delete(name);
      }
      if (unresolved.size) {
        // A generated rule also depends on its captures when its head omits
        // them; otherwise two enabled instances could share a witness.
        const context = clause.captures === null ? null : copyResolved(body[0].args[1], answerEnv);
        const witnesses = skolemTerms(clause, head, unresolved, answerEnv, context);
        [...unresolved.values()].forEach((value, i) => unify(value, witnesses[i], answerEnv));
      }
      const conclusions = unresolved.size
        ? flattenConjunction(head).map((item) => copyResolved(item, answerEnv))
        : flattenConjunction(resolved);
      let children = NO_NODES;
      let bindings = NO_NODES;
      if (this.recording) {
        children = nodes.map((node) => resolveNode(node, answerEnv));
        bindings = [...names].map(([name, value]) => [name, copyResolved(value, answerEnv)]);
      }
      const claim = conclusions.some((item) => item === 'true') ? copyResolved(conjunction(body), answerEnv) : null;
      found.push([[conclusions, children, bindings, claim], this.chosen !== null ? [...this.chosen] : null]);
      answerEnv.undo(mark);
    }
    return found;
  }

  // Run the forward rules to a fixpoint, one stratum after another. A rule
  // whose heads are all 'true' only publishes output; when the caller asks its
  // own question that output is discarded, so the rule is skipped.
  forward(reporting = true) {
    const layers = new Map();
    for (const clause of this.program.forward) {
      const rank = this.program.strata.get(clause.id) || 0;
      if (!layers.has(rank)) layers.set(rank, []);
      layers.get(rank).push(clause);
    }
    const maxIterations = this.options.maxIterations || 1000;
    for (const rank of [...layers.keys()].sort((a, b) => a - b)) {
      const rules = layers.get(rank);
      let changed = true;
      let rounds = 0;
      while (changed) {
        rounds++;
        if (rounds > maxIterations) throw new EyemindError('forward reasoning exceeded max_iterations');
        this.stats.rounds++;
        changed = false;
        for (const clause of rules) {
          if (!reporting && clause.heads.every((item) => item === 'true')) continue;
          for (const [conclusions, children, bindings, claim] of this.activations(clause)) {
            for (const conclusion of conclusions) {
              if (conclusion === 'true') {
                const claimId = this.program.inspectionEnabled ? variant(claim) : text(claim);
                if (!this.reported.has(claimId)) this.reported.set(claimId, [claim, children, clause.id]);
                continue;
              }
              const node = new Node(conclusion, new Struct('clause', [BigInt(clause.id)]), bindings, children, null, true);
              if (conclusion === 'false') {
                this.derived.push(node);
                this.haltCode = 65;
                return;
              }
              node.generic = this.program.inspectionEnabled && !isGround(conclusion);
              const conclusionId = node.generic ? variant(conclusion) : identity(conclusion);
              const factKeys = node.generic ? this.genericKeys : this.factKeys;
              if (factKeys.has(conclusionId)) continue;
              factKeys.add(conclusionId);
              this.addFact(key(conclusion), node);
              this.derived.push(node);
              this.stats.derived++;
              changed = true;
            }
          }
        }
      }
    }
  }
}

// The Skolem terms for the variables a solution leaves unbound in a rule's
// heads: skolem(Rule, Variable, Arguments), a function of the rule, the
// variable and the values the solution gave the heads' other variables. The
// same activation thus always gives the same terms, and a different one
// different terms.
export function skolemTerms(clause, head, unresolved, env, context = null) {
  const values = context === null ? [] : [context];
  for (const variable of variables(head).values()) {
    const value = copyResolved(variable, env);
    if (isGround(value)) values.push(value);
  }
  const argumentsList = listFromItems(values);
  const names = [];
  for (const variable of unresolved.values()) {
    // Each variable is named as the program names it; a variable that a value
    // of the solution brought in may share a name, so it gets a number to
    // keep the terms apart.
    const hash = variable.name.indexOf('#');
    const base = hash < 0 ? variable.name : variable.name.slice(0, hash);
    let name = base;
    let number = 1;
    while (names.includes(name)) {
      name = `${base}${number}`;
      number++;
    }
    names.push(name);
  }
  return names.map((name) => new Struct('skolem', [BigInt(clause.id), name, argumentsList]));
}

// What a run concluded. answers are the conclusions as printable text and
// bindings one object per answer of the goal's variables; with a proof, proof
// is the document and proofReport its check, clausesUsed the ids of the
// source clauses the conclusions rest on, and clausesBehindBoundaries the ids
// of clauses only searches behind a trusted boundary could consult.
export class Result {
  constructor(fields) {
    Object.assign(this, fields);
  }

  // The derived facts as text, written only when asked for.
  get inferred() {
    return this.derived.filter((node) => !isActivation(node.goal)).map((node) => text(node.goal));
  }
}

// Reason over a program: forward to a fixpoint, then answer any goals.
// program is a Program; goal or goals are terms or goal text. Without one,
// the program's own query() rules answer, and without those every newly
// derived fact is a conclusion.
export function run(program, { goal = null, goals = null, proof = false, maxDepth = null,
  maxIterations = null, maxInferences = null } = {}) {
  if (!(program instanceof Program)) throw new EyemindError('run() needs a Program; load one first');
  const options = { proof, maxDepth, maxIterations, maxInferences };
  for (const name of ['maxDepth', 'maxIterations', 'maxInferences']) {
    const value = options[name];
    if (value !== null && (!Number.isSafeInteger(value) || value < 1)) {
      throw new EyemindError(`${name} needs a positive safe integer`);
    }
  }
  if (goals === null) goals = goal === null ? [] : [goal];
  try {
    return reason(program, [...goals], options);
  } catch (error) {
    if (error instanceof RangeError) {
      // Search itself is iterative, but a few term walks are recursive, so a
      // term nested deeply enough can exhaust the host stack.
      throw new EyemindError('reasoning exhausted the host stack on a deeply nested term');
    }
    throw error;
  }
}

function goalTerm(goal) {
  return typeof goal === 'string' ? readGoal(goal) : goal;
}

function reason(program, goalInputs, options) {
  const solver = new Solver(program, options);
  const goals = goalInputs.map(goalTerm);
  solver.forward(!goals.length);
  const roots = [];
  const bindings = [];
  const claims = [];
  const seen = new Set();
  if (goals.length && solver.haltCode === null) {
    for (const goal of goals) {
      for (const [answerEnv, nodes] of solver.solve([goal])) {
        const conclusion = copyResolved(goal, answerEnv);
        const conclusionId = variant(conclusion);
        if (seen.has(conclusionId)) continue;
        seen.add(conclusionId);
        if (options.proof) for (const node of nodes) roots.push(resolveNode(node, answerEnv));
        claims.push(conclusion);
        const answer = new Map();
        for (const [name, value] of variables(goal)) {
          if (!name.startsWith('_')) answer.set(name, copyResolved(value, answerEnv));
        }
        bindings.push(answer);
      }
    }
  } else if (solver.haltCode === null && program.forward.some((clause) => clause.heads.includes('true'))) {
    // A program that asks its own questions concludes their answers, even none.
    for (const [claim, children] of solver.reported.values()) {
      claims.push(claim);
      roots.push(...children);
    }
  } else {
    for (const node of solver.derived) {
      if (isActivation(node.goal)) continue;
      roots.push(node);
      claims.push(node.goal);
    }
  }
  // Variables are named A, B, ... in the order the conclusions show them; the
  // bindings of each answer name them as its conclusion does.
  const lettering = new Lettering();
  const answers = claims.map((claim) => write(claim, null, lettering));
  const answerBindings = bindings.map((answer) => {
    const out = {};
    for (const [name, value] of answer) out[name] = write(value, null, lettering);
    return out;
  });
  const rendered = options.proof ? renderProof(program, claims, roots, true) : null;
  const document = rendered !== null ? rendered[0] : null;
  // A rule that reports a claim is used by it, though a proof records only
  // the claim's support.
  const used = options.proof ? clausesUsed(roots) : null;
  if (used !== null && solver.haltCode === null && !goals.length) {
    for (const [, , clauseId] of solver.reported.values()) used.add(clauseId);
  }
  let report = null;
  if (document !== null) {
    // The generated proof is checked before it is returned.
    report = checkRendered(program, rendered[1], goals);
    if (!report.valid) throw new EyemindError(`cannot certify this result: ${report.failures[0].detail}`);
  }
  let behind = null;
  if (used !== null) {
    behind = [...clausesBehindBoundaries(program, roots)].filter((id) => !used.has(id)).sort((a, b) => a - b);
  }
  return new Result({
    answers,
    bindings: answerBindings,
    derived: solver.derived,
    clausesUsed: used !== null ? [...used].sort((a, b) => a - b) : null,
    clausesBehindBoundaries: behind,
    stdout: document !== null ? document : answers.map((answer) => `${answer}\n`).join(''),
    proof: document,
    proofReport: report,
    stats: solver.stats,
    haltCode: solver.haltCode,
  });
}

// The clauses that make no difference to the conclusions, as text: one
// unused(line(N), Clause) per clause no conclusion's proof rests on, unless
// leaving it out changes what the program concludes: a clause only a negation
// or a collection consults may still decide a conclusion.
export function unusedClauses(program, options = {}) {
  const settings = { ...options, proof: false };
  const result = run(program, { ...settings, proof: true });
  const used = new Set(result.clausesUsed);
  const behind = new Set(result.clausesBehindBoundaries);
  const conclusions = (outcome) => JSON.stringify([[...outcome.answers].sort(), outcome.haltCode]);
  const baseline = conclusions(result);
  function matters(clause) {
    try {
      return conclusions(run(new Program(program.sources, clause.id), settings)) !== baseline;
    } catch (error) {
      if (error instanceof EyemindError) return true;
      throw error;
    }
  }
  const lines = [];
  for (const clause of program.clauses) {
    if (used.has(clause.id) || (behind.has(clause.id) && matters(clause))) continue;
    const written = new Struct('unused', [new Struct('line', [BigInt(clause.line ?? 0)]), clauseDisplay(clause)]);
    lines.push(`${write(written)}\n`);
  }
  return lines.join('');
}
