// A program: its clauses, validated, indexed and stratified.
import { PRIMITIVE_KEYS } from './builtins.js';
import { containsTemplate, expandTemplates } from './templates.js';
import { subgoals } from './goals.js';
import { hasInspection, inspectionTerm } from './inspection.js';
import {
  EMPTY, Env, EyemindError, Struct, Var, deref, flattenConjunction, freshTerm, identity, isCallable,
  isGround, isTerm, key, keyArity, unify, variables,
} from './terms.js';
import { write } from './writer.js';

export const CONTROL_KEYS = new Set(['and/2', 'or/2', 'not/1', 'call/1', 'once/1', 'findall/3']);
export const RESERVED_KEYS = new Set(['step/4', 'clause/2', 'searched/2', 'derived/2', 'activated/2', 'implies/2', 'implied_by/2', 'forward/2', 'backward/2']);

// The statements that state a forward rule, and how an error names them.
const FORWARD_KINDS = { forward: 'a forward rule', query: 'query()', contradiction: 'contradiction()' };
const isIndexable = (value) => typeof value === 'string' || typeof value === 'bigint' || typeof value === 'number';

export class Clause {
  constructor(id, head, heads, body, forward, line, captures = null) {
    this.id = id;
    this.head = head;
    // Only a forward rule can have several heads, so only it stores them.
    this.heads = heads;
    this.body = body;
    this.forward = forward;
    this.line = line;
    this.captures = captures;
    this.parentId = null;
    this.prefixLength = 0;
    this.localBody = body;
    this.templates = [];
    this.scopeIds = [];
    this.extraTerms = [];
    this.renaming = null; // how to rename it apart, worked out once it is used often
    this.uses = 0;
    this.witnessed = null;
  }

  // The names of the variables only the conclusion mentions: a forward rule
  // gives each a Skolem witness per firing (SPEC Section 8.2).
  get witnessNames() {
    if (this.witnessed === null) {
      const inBody = new Set();
      for (const goal of this.body) for (const name of variables(goal).keys()) inBody.add(name);
      for (const name of this.captures || []) inBody.add(name);
      this.witnessed = [...variables(this.head).keys()].filter((name) => !inBody.has(name));
    }
    return this.witnessed;
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

// The keys of the names and arities met so far, so that heads sharing a
// name and arity share one key string instead of each making its own.
class KeyCache {
  constructor() {
    this.byName = new Map();
  }

  of(item) {
    if (typeof item === 'string') return key(item);
    let byArity = this.byName.get(item.name);
    if (byArity === undefined) this.byName.set(item.name, byArity = []);
    const arity = item.args.length;
    return byArity[arity] ?? (byArity[arity] = key(item));
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
    const expanded = expandTemplates(this.sources);
    this.hasTemplates = expanded.some((source) => source.parentId !== undefined);
    this.maxClauseId = expanded.length;
    this.clauses = [];
    this.byId = new Map();
    this.groups = new Map();
    this.forward = [];
    let stratifying = false;
    // Most heads of a program share a few names and arities: their keys are
    // made once, and a key once allowed as a head is not checked again.
    const keys = new KeyCache();
    const allowed = new Set();
    const count = expanded.length;
    for (let index = 0; index < count; index++) {
      const source = expanded[index];
      const ordinal = index + 1;
      if (ordinal === without) continue;
      const forward = Object.hasOwn(FORWARD_KINDS, source.kind);
      const body = [];
      for (const goal of source.body) pushGoals(goal, body);
      if (forward && !body.length) {
        throw new EyemindError(`line ${source.line}: ${FORWARD_KINDS[source.kind]} needs at least one goal`);
      }
      if (source.kind === 'fact' && body.length) throw new EyemindError(`line ${source.line}: a fact has no body`);
      const heads = forward ? flattenConjunction(source.head) : [source.head];
      if (source.kind === 'forward' && heads.some((item) => item === 'true' || item === 'false')) {
        // query() and contradiction() state these, and say so.
        throw new EyemindError(`line ${source.line}: implies() cannot conclude 'true' or 'false'; ` +
                              'write query(Premise) or contradiction(Premise)');
      }
      for (const goal of body) {
        // A statement checks this as it runs; a program built from its
        // clauses directly is checked here, so no search meets a number.
        if (!isCallable(goal) && !(goal instanceof Var)) {
          throw new EyemindError(`line ${source.line}: a goal must be an atom, a compound term or a variable, not a number`);
        }
        if (!stratifying && mayNeedStratifying(goal)) stratifying = true;
      }
      let headKey = null;
      const templatePositions = new Set((source.templates || []).map((item) => item.position));
      for (const [position, item] of heads.entries()) {
        if (templatePositions.has(position)) continue;
        if (!isCallable(item)) throw new EyemindError(`line ${source.line}: a head must be an atom or a compound term`);
        // A list goal is a conjunction, so a clause with a list head could never be called.
        if (item === EMPTY || isTerm(item, '.', 2)) {
          throw new EyemindError(`line ${source.line}: a head cannot be a list; name the relation, such as items(${write(item)})`);
        }
        const itemKey = keys.of(item);
        headKey = itemKey;
        if (allowed.has(itemKey)) continue;
        if (RESERVED_KEYS.has(itemKey) ||
            ((PRIMITIVE_KEYS.has(itemKey) || CONTROL_KEYS.has(itemKey)) &&
             !(forward && (item === 'true' || item === 'false')))) {
          throw new EyemindError(`line ${source.line}: unsupported or reserved head ${itemKey}`);
        }
        allowed.add(itemKey);
      }
      const clause = new Clause(ordinal, source.head, forward ? heads : null, body, forward, source.line, source.captures ?? null);
      clause.parentId = source.parentId ?? null;
      clause.prefixLength = source.prefixLength ?? 0;
      clause.localBody = clause.prefixLength ? body.slice(clause.prefixLength) : body;
      clause.templates = source.templates || [];
      clause.originalHead = source.originalHead ?? source.head;
      clause.plainHeads = templatePositions.size ? heads.filter((_, position) => !templatePositions.has(position)) : heads;
      for (let parent = clause.parentId; parent !== null;) {
        clause.scopeIds.unshift(parent);
        clause.extraTerms.unshift(expanded[parent - 1].head);
        parent = expanded[parent - 1].parentId ?? null;
      }
      this.clauses.push(clause);
      this.byId.set(ordinal, clause);
      if (forward) {
        this.forward.push(clause);
      } else {
        // A backward clause or fact has the one head whose key was just made.
        const group = this.groups.get(headKey);
        if (group === undefined) this.groups.set(headKey, [clause]);
        else group.push(clause);
      }
    }
    // A group's argument index is made the first time a goal asks for its
    // clauses: many groups of a large program are never asked for, and a
    // program made to leave one clause out is often run only briefly.
    this.indexes = new Map();
    this.inspectionEnabled = this.clauses.some((clause) => clause.body.some(hasInspection));
    this.inspectionCatalogue = null;
    // Ground source facts are compared against forward conclusions by
    // identity, so work those out once here.
    this.groundFactKeys = new Set();
    for (const clause of this.clauses) {
      if (!clause.forward && !clause.body.length && isGround(clause.head)) this.groundFactKeys.add(identity(clause.head));
    }
    this.strata = stratify(this.clauses, stratifying);
  }

  prepareInspections() {
    if (this.inspectionCatalogue !== null) return;
    this.inspectionCatalogue = new Map([['implies/2', []], ['implied_by/2', []]]);
    this.inspectionSources = new Map();
    for (const clause of this.clauses) {
      const source = this.sources[clause.id - 1];
      if (!source || !['forward', 'backward'].includes(source.kind) ||
          containsTemplate(source.head) || source.body.some(hasInspection)) continue;
      const term = inspectionTerm(clause);
      const entry = { id: clause.id, term };
      this.inspectionCatalogue.get(key(term)).push(entry);
      this.inspectionSources.set(clause.id, entry);
    }
  }

  get inspections() {
    this.prepareInspections();
    return this.inspectionCatalogue;
  }

  get inspectedById() {
    this.prepareInspections();
    return this.inspectionSources;
  }

  candidates(goal, env, goalKey) {
    const clauses = this.groups.get(goalKey);
    if (clauses === undefined) return [];
    let positions = this.indexes.get(goalKey);
    if (positions === undefined) {
      positions = positionIndexes(clauses, (clause) => clause.head, keyArity(goalKey));
      this.indexes.set(goalKey, positions);
    }
    if (!positions.length) return clauses;
    let chosen = null;
    let matches = null;
    let count = clauses.length;
    const args = goal.args;
    for (let position = 0; position < positions.length; position++) {
      const index = positions[position];
      if (index === null) continue;
      let argument = args[position];
      if (argument instanceof Var) argument = deref(argument, env);
      if (!isIndexable(argument)) continue;
      const bucket = bucketEntries(index[0].get(argument));
      const size = bucket.length + index[1].length;
      if (size < count) {
        chosen = index;
        matches = bucket;
        count = size;
      }
    }
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
// number. Each index is [constants, other]: a map from value to the entries
// with that value there, and the entries with anything else there. Map keys
// keep integers and floats distinct while equating signed zeros, just as
// unification does. A value with one entry maps to the entry itself, and one
// with more to a Bucket of them: most values of a large program head a single
// clause, and an array for each would only be more for memory to keep.
export function positionIndexes(entries, headOf, arity) {
  const counts = new Array(arity).fill(0);
  if (arity) {
    for (let i = 0; i < entries.length; i++) {
      const args = headOf(entries[i]).args;
      for (let position = 0; position < arity; position++) if (isIndexable(args[position])) counts[position]++;
    }
  }
  const positions = counts.map((count) => (count * 2 < entries.length ? null : [new Map(), []]));
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const args = headOf(entry).args;
    for (let position = 0; position < arity; position++) {
      const index = positions[position];
      if (index === null) continue;
      const argument = args[position];
      if (!isIndexable(argument)) {
        index[1].push(entry);
        continue;
      }
      const found = index[0].get(argument);
      if (found === undefined) index[0].set(argument, entry);
      else if (found instanceof Bucket) found.entries.push(entry);
      else index[0].set(argument, new Bucket([found, entry]));
    }
  }
  return positions;
}

class Bucket {
  constructor(entries) {
    this.entries = entries;
  }
}

const NO_ENTRIES = Object.freeze([]);

// The entries a positionIndexes map gives for a value, as a list.
function bucketEntries(found) {
  if (found === undefined) return NO_ENTRIES;
  return found instanceof Bucket ? found.entries : [found];
}

// Closed dependencies arise from absence and collection.
function dependencies(goal, closed = false, out = []) {
  const inner = subgoals(goal);
  if (inner !== null) {
    const inside = closed || isTerm(goal, 'not', 1) || isTerm(goal, 'findall', 3);
    for (const part of inner) dependencies(part, inside, out);
  } else if (goal instanceof Var || (isCallable(goal) && !PRIMITIVE_KEYS.has(key(goal)))) {
    out.push([goal, closed]);
  }
  return out;
}

// Whether a goal could contribute a closed dependency or a dynamic call.
function mayNeedStratifying(goal) {
  if (goal instanceof Var || isTerm(goal, 'not', 1) || isTerm(goal, 'findall', 3)) return true;
  const inner = subgoals(goal);
  return inner !== null && inner.some(mayNeedStratifying);
}

function headIndex(clauses) {
  const index = new Map();
  for (const clause of clauses) {
    for (const head of clause.plainHeads) {
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
    const matched = bucketEntries(bucket[0].get(goal.args[position]));
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
  for (const clause of clauses) for (const head of clause.plainHeads) everyHead.push([clause, head]);
  for (const clause of clauses) {
    if (clause.parentId !== null && ranks.has(clause.parentId)) {
      const edge = [clause.id, clause.parentId, false];
      edges.push(edge);
      outgoing.set(clause.id, [edge]);
    }
    for (const goal of clause.localBody) {
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
    if (dynamic.has(clauseId)) throw new EyemindError('forward dependencies require statically named calls');
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
  throw new EyemindError('unstratified negation or collection dependency');
}
