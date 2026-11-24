// LE names for the existing ODRL snapshot profile. This module maps data and
// reports; validation and evaluation remain the rules of odrl.js.
import { compileOdrl, ODRL_EVAL } from './odrl.js';
import { loadText } from './lang.js';
import { DEFAULT_GRAPH, writeRdf } from './rdf.js';
import { EyemindError, Struct, isGround, properListItems } from './terms.js';
import { readTerm } from './reader.js';
import { write } from './writer.js';

const ODRL = 'http://www.w3.org/ns/odrl/2/';
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const XSD = 'http://www.w3.org/2001/XMLSchema#';
const iri = (value) => new Struct('iri', [value]);
const literal = (value, type) => new Struct('literal', [value, new Struct('datatype', [XSD + type])]);
const NAME = /^[a-z][A-Za-z0-9_]*$/;
const TYPES = new Map(Object.entries({
  evaluation: ODRL_EVAL + 'Evaluation', policy: ODRL + 'Set', agreement: ODRL + 'Agreement',
  permission: ODRL + 'Permission', prohibition: ODRL + 'Prohibition', constraint: ODRL + 'Constraint',
  logicalConstraint: ODRL + 'LogicalConstraint', duty: ODRL + 'Duty',
  request: ODRL_EVAL + 'Request', state: ODRL_EVAL + 'State', action: ODRL + 'Action',
  assetCollection: ODRL + 'AssetCollection', partyCollection: ODRL + 'PartyCollection',
  evaluationReport: ODRL_EVAL + 'EvaluationReport', conflict: ODRL_EVAL + 'Conflict',
  validationError: ODRL_EVAL + 'ValidationError', uncertainty: ODRL_EVAL + 'Uncertainty',
}));
const PROPERTIES = new Map();
for (const name of ['profile', 'permission', 'prohibition', 'assignee', 'assigner', 'action', 'target',
  'constraint', 'leftOperand', 'operator', 'rightOperand', 'duty', 'obligation', 'inheritFrom',
  'includedIn', 'partOf', 'refinement']) PROPERTIES.set(name, ODRL + name);
for (const name of ['policy', 'request', 'state', 'subject', 'conflictStrategy', 'decision', 'canHappen',
  'validationStatus', 'invalidPolicy', 'reason', 'unmetConstraint', 'unmetDuty', 'fulfilledDuty', 'unfulfilledDuty', 'uncertainty', 'rule', 'property',
  'validationError', 'focus', 'code', 'permissionPolicy', 'permissionRule', 'prohibitionPolicy',
  'prohibitionRule', 'conflictCount']) PROPERTIES.set(name, ODRL_EVAL + name);
// A conflict is an evaluation report link; policy-local conflict has a
// separate name so neither meaning silently replaces the other.
PROPERTIES.set('conflict', ODRL_EVAL + 'conflict');
PROPERTIES.set('policyConflict', ODRL + 'conflict');
PROPERTIES.set('applicablePermission', ODRL_EVAL + 'permission');
PROPERTIES.set('applicableProhibition', ODRL_EVAL + 'prohibition');
PROPERTIES.set('reportConstraint', ODRL_EVAL + 'constraint');
PROPERTIES.set('reportDuty', ODRL_EVAL + 'duty');
PROPERTIES.set('type', RDF + 'type');
const LIST_OPERANDS = new Set();
for (const name of ['and', 'or', 'xone']) {
  const property = ODRL + name;
  PROPERTIES.set(name + 'Operands', property);
  LIST_OPERANDS.add(property);
}
const VALUES = new Map(Object.entries({
  snapshotProfile: ODRL_EVAL + 'SnapshotProfile',
  perm: ODRL + 'perm', prohibit: ODRL + 'prohibit', invalid: ODRL + 'invalid',
  eq: ODRL + 'eq', neq: ODRL + 'neq', gt: ODRL + 'gt', gteq: ODRL + 'gteq', lt: ODRL + 'lt', lteq: ODRL + 'lteq',
  withinCategory: ODRL_EVAL + 'withinCategory',
  allowed: ODRL_EVAL + 'Allowed', prohibited: ODRL_EVAL + 'Prohibited',
  notApplicable: ODRL_EVAL + 'NotApplicable', undetermined: ODRL_EVAL + 'Undetermined',
  valid: ODRL_EVAL + 'Valid', invalidReport: ODRL_EVAL + 'Invalid',
}));
const reverse = (map) => new Map([...map].map(([name, value]) => [value, name]));
const TYPE_NAMES = reverse(TYPES), PROPERTY_NAMES = reverse(PROPERTIES), VALUE_NAMES = reverse(VALUES);

function rdfValue(term, namespace) {
  if (typeof term === 'string') {
    if (term === 'true' || term === 'false') return literal(term, 'boolean');
    return iri(VALUES.get(term) ?? namespace + term);
  }
  if (typeof term === 'bigint') return term;
  if (typeof term === 'number') return literal(write(term), 'double');
  if (term instanceof Struct && ['iri', 'bnode', 'literal', 'triple', 'skolem'].includes(term.name)) return term;
  throw new EyemindError('LE ODRL values need names, numbers or explicit RDF terms such as iri(...) and literal(...)');
}

function resource(term) {
  return term instanceof Struct && ['iri', 'bnode', 'triple', 'skolem'].includes(term.name);
}

// The LE operand abbreviations accept a list of constraint references.
// Convert it to the same RDF first/rest links used by Turtle collections.
function expandOperandLists(quads, namespace) {
  const lists = quads.filter(([, p, o]) => LIST_OPERANDS.has(p.args[0]) && properListItems(o) !== null);
  if (!lists.length) return;
  const scopes = new Set(), pending = quads.flatMap((quad) => quad.slice(0, 3));
  while (pending.length) {
    const term = pending.pop();
    if (!(term instanceof Struct)) continue;
    if (term.name === 'bnode') scopes.add(term.args[0]);
    pending.push(...term.args);
  }
  let scope = 'le-odrl-list', suffix = 0, label = 0;
  while (scopes.has(scope)) scope = `le-odrl-list-${++suffix}`;
  for (const quad of lists) {
    let tail = iri(RDF + 'nil');
    for (const item of properListItems(quad[2]).reverse()) {
      const cell = new Struct('bnode', [scope, String(++label)]);
      quads.push([cell, iri(RDF + 'first'), rdfValue(item, namespace), DEFAULT_GRAPH],
        [cell, iri(RDF + 'rest'), tail, DEFAULT_GRAPH]);
      tail = cell;
    }
    quad[2] = tail;
  }
}

export function compileOdrlLe(statements, profile, source) {
  const { namespace, evaluate } = profile;
  const quads = [];
  for (const statement of statements) {
    if (statement.kind !== 'fact') throw new EyemindError(`${statement.file}: line ${statement.line}: an LE ODRL snapshot or report contains ground facts, not rules or questions`);
    for (const head of statement.heads) {
      if (!(head instanceof Struct) || !isGround(head)) throw new EyemindError(`${statement.file}: line ${statement.line}: an LE ODRL fact needs a ground class or property statement`);
      let s, p, o;
      if (head.name === 'rdf' && head.args.length === 3) {
        [s, p, o] = head.args;
        s = rdfValue(s, namespace);
        o = LIST_OPERANDS.has(p.args?.[0]) && properListItems(o) !== null ? o : rdfValue(o, namespace);
      }
      else if (head.args.length === 1) {
        s = rdfValue(head.args[0], namespace); p = iri(RDF + 'type');
        o = iri(TYPES.get(head.name) ?? namespace + head.name);
      } else if (head.args.length === 2) {
        s = rdfValue(head.args[0], namespace); p = iri(PROPERTIES.get(head.name) ?? namespace + head.name);
        const value = head.args[1];
        o = LIST_OPERANDS.has(p.args[0]) && properListItems(value) !== null ? value : rdfValue(value, namespace);
      } else throw new EyemindError(`${statement.file}: line ${statement.line}: use class facts, binary properties or explicit rdf(S, P, O) facts in LE ODRL`);
      if (!resource(s) || !(p instanceof Struct && p.name === 'iri' && p.args.length === 1)) {
        throw new EyemindError(`${statement.file}: line ${statement.line}: an LE ODRL triple needs a resource subject and an IRI property`);
      }
      quads.push([s, p, o, DEFAULT_GRAPH]);
    }
  }
  expandOperandLists(quads, namespace);
  // Validate RDF constructors without rewriting terms or witness identities.
  const pending = quads.flatMap((quad) => quad.slice(0, 3));
  while (pending.length) {
    const term = pending.pop();
    if (!(term instanceof Struct) || ['skolem', 'bnode'].includes(term.name)) continue;
    if (term.name === 'iri' || term.name === 'datatype') {
      const [value] = term.args;
      if (term.args.length !== 1 || typeof value !== 'string' || !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value) || /[\s<>"{}|^`\\]/u.test(value)) {
        throw new EyemindError('LE ODRL IRIs and datatype IRIs must be absolute, without whitespace or forbidden characters');
      }
    }
    pending.push(...term.args);
  }
  writeRdf(quads, { format: 'n-triples' });
  const prefixes = { '': namespace, odrl: ODRL, eval: ODRL_EVAL };
  let loaded;
  if (evaluate) loaded = compileOdrl({ quads, prefixes }, { source });
  else {
    const facts = quads.map(([s, p, o]) => write(new Struct('rdf', [s, p, o]))).join('\n');
    const text = `// RDF facts from an LE ODRL vocabulary document.\nfacts_from({ text: ${JSON.stringify(facts)} })\n`;
    loaded = { text, program: loadText(text, source), prefixes };
  }
  return { ...loaded, kind: 'le', compiled: { statements, odrl: profile, quads } };
}

function leValue(term, namespace) {
  if (term instanceof Struct && term.name === 'iri' && term.args.length === 1) {
    const value = term.args[0], known = VALUE_NAMES.get(value);
    if (known) return known;
    if (value.startsWith(namespace)) {
      const name = value.slice(namespace.length);
      if (/^[A-Za-z][A-Za-z0-9_]*$/.test(name) && !VALUES.has(name) && name !== 'true' && name !== 'false') return name;
    }
  }
  if (term instanceof Struct && term.name === 'literal' && term.args.length === 2 &&
      term.args[1] instanceof Struct && term.args[1].name === 'datatype' && term.args[1].args[0] === XSD + 'boolean' &&
      ['true', 'false'].includes(term.args[0])) return term.args[0];
  return term;
}

export function odrlLeReport(result, namespace) {
  const answers = result.answers.map((answer) => {
    const term = readTerm(answer);
    if (!(term instanceof Struct) || term.name !== 'rdf' || term.args.length !== 3) throw new EyemindError('LE ODRL reports need rdf(S, P, O) conclusions');
    const [s, p, o] = term.args;
    if (p instanceof Struct && p.name === 'iri') {
      if (p.args[0] === RDF + 'type' && o instanceof Struct && o.name === 'iri' && TYPE_NAMES.has(o.args[0])) {
        return write(new Struct(TYPE_NAMES.get(o.args[0]), [leValue(s, namespace)]));
      }
      const name = PROPERTY_NAMES.get(p.args[0]) ?? (p.args[0].startsWith(namespace) ? p.args[0].slice(namespace.length) : null);
      if (name && NAME.test(name) && (PROPERTIES.get(name) ?? namespace + name) === p.args[0]) {
        return write(new Struct(name, [leValue(s, namespace), leValue(o, namespace)]));
      }
    }
    return answer;
  });
  return { answers };
}
