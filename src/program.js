// A program: its clauses, validated, indexed and stratified.
import { PRIMITIVE_KEYS } from './builtins.js';
import {
  Env, EyecodeError, Struct, Var, deref, flattenConjunction, freshTerm, identity, isCallable,
  isGround, isTerm, key, keyArity, unify,
} from './terms.js';

export const CONTROL_KEYS = new Set(['and/2', 'or/2', 'not/1', 'call/1', 'once/1', 'findall/3']);
export const RESERVED_KEYS = new Set(['step/4', 'clause/2']);

// The statements that state a forward rule, and how an error names them.
const FORWARD_KINDS = { forward: 'a forward rule', query: 'query()', contradiction: 'contradiction()' };
const isIndexable = (value) => typeof value === 'string' || typeof value === 'bigint' || typeof value === 'number';

export class Clause {
  constructor(id, head, heads, body, forward, line) {
    this.id = id;
    this.head = head;
    // Only a forward rule can have several heads, so only it stores them.
    this.heads = heads;
    this.body = body;
    this.forward = forward;
    this.line = line;
    this.renaming = null; // how to rename it apart, worked out once it is used often
    this.uses = 0;
  }
}

// One clause as a program states it, before validation. kind is 'fact',
// 'backward', 'forward', 'query' or 'contradiction'; body is a list of goals.
export class Source {
  constructor(kind, head, body, line = null, file = null) {
    this.kind = kind;
    this.head = head;
    this.body = body;
    this.line = line;
    this.file = file;
  }
}

function pushGoals(goal, out) {
  if (goal instanceof Struct && goal.name === 'and' && goal.args.length === 2) {
    out.push(...flattenConjunction(goal));
  } else {
    out.push(goal);
  }
}

// options: without leaves out the clause with that number, counting from 1.
// The other clauses keep their numbers, and so the Skolem terms their rules
// make, so leaving a clause out changes nothing else.
export class Program {
  constructor(sources, without = null) {
    this.sources = [...sources];
    this.clauses = [];
    this.byId = new Map();
    this.groups = new Map();
    this.forward = [];
    let stratifying = false;
    this.sources.forEach((source, index) => {
      const ordinal = index + 1;
      if (ordinal === without) return;
      const forward = Object.hasOwn(FORWARD_KINDS, source.kind);
      const body = [];
      for (const goal of source.body) pushGoals(goal, body);
      if (forward && !body.length) {
        throw new EyecodeError(`line ${source.line}: ${FORWARD_KINDS[source.kind]} needs at least one goal`);
      }
      if (source.kind === 'fact' && body.length) throw new EyecodeError(`line ${source.line}: a fact has no body`);
      const heads = forward ? flattenConjunction(source.head) : [source.head];
      if (source.kind === 'forward' && heads.some((item) => item === 'true' || item === 'false')) {
        // query() and contradiction() state these, and say so.
        throw new EyecodeError(`line ${source.line}: implies() cannot conclude 'true' or 'false'; ` +
                              'write query(Premise) or contradiction(Premise)');
      }
      for (const goal of body) {
        if (!stratifying && mayNeedStratifying(goal)) stratifying = true;
      }
      for (const item of heads) {
        if (!isCallable(item)) throw new EyecodeError(`line ${source.line}: a head must be an atom or a compound term`);
        const itemKey = key(item);
        if (RESERVED_KEYS.has(itemKey) ||
            ((PRIMITIVE_KEYS.has(itemKey) || CONTROL_KEYS.has(itemKey)) &&
             !(forward && (item === 'true' || item === 'false')))) {
          throw new EyecodeError(`line ${source.line}: unsupported or reserved head ${itemKey}`);
        }
      }
      const clause = new Clause(ordinal, source.head, forward ? heads : null, body, forward, source.line);
      this.clauses.push(clause);
      this.byId.set(ordinal, clause);
      if (forward) {
        this.forward.push(clause);
      } else {
        const headKey = key(source.head);
        if (!this.groups.has(headKey)) this.groups.set(headKey, []);
        this.groups.get(headKey).push(clause);
      }
    });
    this.indexes = new Map();
    for (const [groupKey, clauses] of this.groups) {
      this.indexes.set(groupKey, positionIndexes(clauses, (clause) => clause.head, keyArity(groupKey)));
    }
    // Ground source facts are compared against forward conclusions by
    // identity, so work those out once here.
    this.groundFactKeys = new Set();
    for (const clause of this.clauses) {
      if (!clause.forward && !clause.body.length && isGround(clause.head)) this.groundFactKeys.add(identity(clause.head));
    }
    this.strata = stratify(this.clauses, stratifying);
  }

  candidates(goal, env, goalKey) {
    const clauses = this.groups.get(goalKey);
    if (clauses === undefined) return [];
    const positions = this.indexes.get(goalKey);
    if (!positions || !positions.length) return clauses;
    let chosen = null;
    let matches = null;
    let count = clauses.length;
    const args = goal.args;
    positions.forEach((index, position) => {
      if (index === null) return;
      let argument = args[position];
      if (argument instanceof Var) argument = deref(argument, env);
      if (!isIndexable(argument)) return;
      const bucket = index[0].get(argument) || [];
      const size = bucket.length + index[1].length;
      if (size < count) {
        chosen = index;
        matches = bucket;
        count = size;
      }
    });
    if (chosen === null) return clauses;
    if (!chosen[1].length) return matches;
    // Both buckets retain source order. Merge them without sorting on every
    // call, including clauses with variable or structured heads.
    const other = chosen[1];
    const merged = [];
    let i = 0;
    let j = 0;
    while (i < matches.length && j < other.length) {
      merged.push(matches[i].id < other[j].id ? matches[i++] : other[j++]);
    }
    while (i < matches.length) merged.push(matches[i++]);
    while (j < other.length) merged.push(other[j++]);
    return merged;
  }
}

// An index per argument position where enough entries carry an atom or
// number. Each index is [constants, other]: a map from value to entries, and
// the entries with anything else there. Map keys keep integers and floats
// distinct while equating signed zeros, just as unification does.
export function positionIndexes(entries, headOf, arity) {
  const counts = new Array(arity).fill(0);
  for (const entry of entries) {
    const head = headOf(entry);
    if (arity) {
      head.args.forEach((arg, position) => {
        if (isIndexable(arg)) counts[position]++;
      });
    }
  }
  const positions = counts.map((count) => (count * 2 < entries.length ? null : [new Map(), []]));
  for (const entry of entries) {
    const head = headOf(entry);
    for (let position = 0; position < arity; position++) {
      const index = positions[position];
      if (index === null) continue;
      const argument = head.args[position];
      if (!isIndexable(argument)) {
        index[1].push(entry);
      } else {
        if (!index[0].has(argument)) index[0].set(argument, []);
        index[0].get(argument).push(entry);
      }
    }
  }
  return positions;
}

const CONTROL_NAMES = new Set(['and', 'or', 'not', 'call', 'once', 'findall']);

// Closed dependencies arise from absence and collection.
function dependencies(goal, closed = false, out = []) {
  if (isTerm(goal, 'and', 2) || isTerm(goal, 'or', 2)) {
    dependencies(goal.args[0], closed, out);
    dependencies(goal.args[1], closed, out);
  } else if (isTerm(goal, 'not', 1)) {
    dependencies(goal.args[0], true, out);
  } else if (isTerm(goal, 'findall', 3)) {
    dependencies(goal.args[1], true, out);
  } else if (isTerm(goal, 'once', 1) || isTerm(goal, 'call', 1)) {
    dependencies(goal.args[0], closed, out);
  } else if (goal instanceof Var || (isCallable(goal) && !PRIMITIVE_KEYS.has(key(goal)))) {
    out.push([goal, closed]);
  }
  return out;
}

// Whether a goal could contribute a closed dependency or a dynamic call.
function mayNeedStratifying(goal) {
  if (goal instanceof Var) return true;
  if (!(goal instanceof Struct) || !CONTROL_NAMES.has(goal.name)) return false;
  if (isTerm(goal, 'and', 2) || isTerm(goal, 'or', 2)) {
    return mayNeedStratifying(goal.args[0]) || mayNeedStratifying(goal.args[1]);
  }
  if (isTerm(goal, 'not', 1) || isTerm(goal, 'findall', 3)) return true;
  if (isTerm(goal, 'once', 1) || isTerm(goal, 'call', 1)) return mayNeedStratifying(goal.args[0]);
  return false;
}

function headIndex(clauses) {
  const index = new Map();
  for (const clause of clauses) {
    for (const head of clause.heads || [clause.head]) {
      const headKey = key(head);
      let entry = index.get(headKey);
      if (entry === undefined) {
        entry = { pairs: [], arity: keyArity(headKey), positions: null };
        index.set(headKey, entry);
      }
      entry.pairs.push([clause, head]);
    }
  }
  for (const entry of index.values()) entry.positions = positionIndexes(entry.pairs, (pair) => pair[1], entry.arity);
  return index;
}

function headCandidates(entry, goal) {
  if (entry === undefined) return [];
  let chosen = entry.pairs;
  entry.positions.forEach((bucket, position) => {
    if (bucket === null || !(goal instanceof Struct) || !isIndexable(goal.args[position])) return;
    const matched = bucket[0].get(goal.args[position]) || [];
    if (matched.length + bucket[1].length < chosen.length) chosen = [...matched, ...bucket[1]];
  });
  return chosen;
}

// Ranks per clause id; an absent rank is stratum 0. Stratification matches
// whole terms, not just predicate names, so two relations sharing a name can
// sit in different strata. Closed dependency cycles are rejected, as are
// dynamic calls reachable from forward rules.
function stratify(clauses, stratifying) {
  if (!stratifying) return new Map();
  const ranks = new Map(clauses.map((clause) => [clause.id, 0]));
  const edges = [];
  const outgoing = new Map();
  const dynamic = new Set();
  const index = headIndex(clauses);
  const everyHead = [];
  for (const clause of clauses) for (const head of clause.heads || [clause.head]) everyHead.push([clause, head]);
  for (const clause of clauses) {
    for (const goal of clause.body) {
      for (const [depGoal, closed] of dependencies(goal)) {
        const named = !(depGoal instanceof Var);
        if (!named) dynamic.add(clause.id);
        const candidates = named ? headCandidates(index.get(key(depGoal)), depGoal) : everyHead;
        for (const [candidateClause, head] of candidates) {
          if (unify(freshTerm(depGoal, 'dependency'), freshTerm(head, 'head'), new Env())) {
            const edge = [clause.id, candidateClause.id, closed];
            edges.push(edge);
            if (!outgoing.has(clause.id)) outgoing.set(clause.id, []);
            outgoing.get(clause.id).push(edge);
          }
        }
      }
    }
  }
  const reachable = new Set();
  const pending = clauses.filter((clause) => clause.forward).map((clause) => clause.id);
  while (pending.length) {
    const clauseId = pending.pop();
    if (reachable.has(clauseId)) continue;
    reachable.add(clauseId);
    if (dynamic.has(clauseId)) throw new EyecodeError('forward dependencies require statically named calls');
    for (const edge of outgoing.get(clauseId) || []) pending.push(edge[1]);
  }
  for (let round = 0; round <= ranks.size; round++) {
    let changed = false;
    for (const [headId, targetId, closed] of edges) {
      const rank = (ranks.get(targetId) || 0) + (closed ? 1 : 0);
      if (rank > ranks.get(headId)) {
        ranks.set(headId, rank);
        changed = true;
      }
    }
    if (!changed) return ranks;
  }
  throw new EyecodeError('unstratified negation or collection dependency');
}
