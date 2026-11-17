// The upstream scorer must distinguish a correct report from a coincidental
// conforms value, an unsupported feature, or a broken fixture.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { checkProof, run } from '../src/index.js';
import { parseRdf } from '../src/rdf.js';
import { compileRdfLogic } from '../src/rdf-logic.js';
import { compareShaclReports, runShaclCase, shaclCases, shaclResource, SHACL_BASE } from './shacl.js';
import { assert } from './helpers.js';

const P = `@prefix : <urn:example:>.
@prefix mf: <http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix sh: <http://www.w3.org/ns/shacl#>.
@prefix sht: <http://www.w3.org/ns/shacl-test#>.
`;
const parsed = (s) => parseRdf(P + s, { scope: 'fixture' });
const root = parsed(':report a sh:ValidationReport.').quads[0][0];
const item = (fields = '') => `[a sh:ValidationResult; sh:focusNode :a; sh:sourceShape :S;
  sh:sourceConstraintComponent sh:ClassConstraintComponent; sh:resultSeverity sh:Violation; ${fields || 'sh:value :a'}]`;
const report = (items, extra = '') => parsed(':report a sh:ValidationReport; sh:conforms false; sh:result ' + items + '.' + extra).quads;

function fixture() {
  const mirror = mkdtempSync(join(tmpdir(), 'eyemind-shacl-test-'));
  const put = (name, text) => { const path = join(mirror, name); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, P + text); };
  put('manifest.ttl', '<> mf:include (<core/manifest.ttl>).');
  put('core/manifest.ttl', `<> mf:entries (<#test>).
    <#test> a sht:Validate; mf:requires sht:Core;
    mf:action [sht:dataGraph <data.ttl>; sht:shapesGraph <shapes.ttl>];
    mf:result [a sh:ValidationReport; sh:conforms true].`);
  put('core/data.ttl', ':a :p 1. :DataOnlyShape sh:targetNode :a; sh:class :Never.');
  put('core/shapes.ttl', ':a :p 2. :S sh:targetNode :a; sh:property [sh:path :p; sh:maxCount 1].');
  return { mirror, put, close: () => rmSync(mirror, { recursive: true, force: true }) };
}

export const tests = {
  'SHACL manifests follow direct and list includes and reject missing or escaping resources'() {
    const f = fixture();
    try {
      f.put('manifest.ttl', '<> mf:include <core/manifest.ttl>, <branch.ttl>.');
      f.put('branch.ttl', '<> mf:include (<core/manifest.ttl> <manifest.ttl>).');
      assert.equal(shaclCases(f).length, 1);
      assert.equal(shaclCases(f)[0].group, 'core');
      assert.throws(() => shaclResource(SHACL_BASE + '%2e%2e/escape.ttl', f.mirror), /escapes/);
      assert.throws(() => shaclResource('https://unmirrored.example/manifest.ttl', f.mirror), /outside/);
      f.put('manifest.ttl', '<> mf:include <missing.ttl>.');
      assert.throws(() => shaclCases(f), /ENOENT/);
    } finally { f.close(); }
  },

  'SHACL W3C data and shape graphs are separate, and absent target nodes still validate with proofs'() {
    const f = fixture();
    try {
      assert.equal(runShaclCase(shaclCases(f)[0], f).ok, true);
      const data = parsed(''), shapes = parsed(':S sh:targetNode :missing; sh:class :Person.');
      const loaded = compileRdfLogic({ ...data, shapes: shapes.quads }, { profiles: ['shacl'] });
      const result = run(loaded.program, { proof: true });
      assert.equal(checkProof(loaded.program, result.proof).valid, true);
      assert.ok(result.answers.some((a) => a.includes('ClassConstraintComponent')));
    } finally { f.close(); }
  },

  'SHACL 1.2 reified constraints, severities, routes, lists and closed types validate with checked proofs'() {
    const graph = parsed(`
      :S sh:targetNode :a; sh:datatype :Never {| sh:severity sh:Debug; sh:message "debug" |};
        sh:class :Never {| sh:deactivated true |}; sh:property :viaP, :viaQ.
      :viaP sh:path :p; sh:property :shared.
      :viaQ sh:path :q; sh:property :shared.
      :shared sh:path :r; sh:nodeKind sh:Literal.
      :a :p :b; :q :b. :b :r :c.
      :L sh:targetNode :list, :branch; sh:maxListLength 1; sh:uniqueMembers true.
      :list rdf:first :x; rdf:rest (:x). :branch rdf:first :x, :y; rdf:rest rdf:nil.
      :Base a rdfs:Class, sh:NodeShape; sh:closed sh:ByTypes; sh:property [sh:path :ok].
      :Sub a rdfs:Class; rdfs:subClassOf :Base. :i a :Sub; :ok 1; :extra 2.
      :D sh:targetNode :d; sh:property [sh:path :age; sh:defaultValue 0; sh:minCount 1; sh:minInclusive 18].`.replace(/^/, '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.\n'));
    const loaded = compileRdfLogic(graph, { profiles: ['shacl'] });
    const result = run(loaded.program, { proof: true });
    assert.equal(checkProof(loaded.program, result.proof).valid, true);
    // Each result names its component once, as the object of sh:sourceConstraintComponent.
    const count = (name) => result.answers.filter((a) => a.includes(`#sourceConstraintComponent'), iri('http://www.w3.org/ns/shacl#${name}')`)).length;
    assert.ok(result.answers.some((a) => a.includes("#resultSeverity'), iri('http://www.w3.org/ns/shacl#Debug')")));
    assert.equal(count('ClassConstraintComponent'), 0);
    assert.equal(count('NodeKindConstraintComponent'), 2);
    assert.equal(count('MaxListLengthConstraintComponent'), 2);
    assert.equal(count('UniqueMembersConstraintComponent'), 2);
    assert.equal(count('ClosedConstraintComponent'), 1);
    assert.equal(count('MinInclusiveConstraintComponent'), 1);
    assert.equal(count('MinCountConstraintComponent'), 0);
    assert.ok(result.answers.some((a) => a.includes("literal('debug'")));
    const strict = run(compileRdfLogic({ ...parsed(':S sh:targetNode :a; sh:datatype :Never; sh:severity sh:Warning.') },
      { profiles: ['shacl'], disallows: ['http://www.w3.org/ns/shacl#Violation'] }).program).answers;
    assert.ok(strict.some((a) => a.includes("literal('true'") && a.includes('conforms')));
    assert.ok(strict.some((a) => a.includes('conformanceDisallows')));
  },

  'SHACL node expressions evaluate in order, propagate failures and drive constraints with checked proofs'() {
    const N = '@prefix shnex: <http://www.w3.org/ns/shacl-node-expr#>.\n@prefix sparql: <http://www.w3.org/ns/sparql#>.\n';
    const evaluate = (text, options = {}) => {
      const graph = parsed(N + ':e :is ' + text + '.');
      const loaded = compileRdfLogic(graph, { profiles: ['shacl'], evaluate: { expression: graph.quads.find(([t]) => t.args[0] === 'urn:example:e')[2], ...options } });
      const result = run(loaded.program, { proof: true });
      assert.equal(checkProof(loaded.program, result.proof).valid, true);
      return result.answers[0];
    };
    assert.equal(evaluate('[shnex:nodes (2.5 1 3); shnex:orderBy [shnex:var "focusNode"]]'),
      "sh_evaluation(nodes([1, literal('2.5', datatype('http://www.w3.org/2001/XMLSchema#decimal')), 3]))");
    assert.equal(evaluate('[shnex:distinct (1 2 1 3 2)]'), 'sh_evaluation(nodes([1, 2, 3]))');
    assert.equal(evaluate('[sparql:plus ([shnex:var "x"] 4)]', { scope: [['x', 38n]] }), 'sh_evaluation(nodes([42]))');
    assert.equal(evaluate('[sparql:plus ([shnex:var "unbound"] 4)]'), 'sh_evaluation(nodes([]))');
    assert.equal(evaluate('[sparql:coalesce ((1 2) "ok")]'), "sh_evaluation(nodes([literal('ok', datatype('http://www.w3.org/2001/XMLSchema#string'))]))");
    for (const failing of ['[sparql:abs ((-1 -2))]', '[shnex:count [shnex:instancesOf 42]]', '[shnex:pathValues :p]'])
      assert.equal(evaluate(failing), "sh_evaluation('failure')");
    const graph = parsed(N + `
      :S sh:targetNode :a, :b; sh:property [sh:path :v; sh:values [shnex:pathValues :w]; sh:expression [sparql:less-than ([shnex:var "value"] 10)]].
      :T sh:targetNode :a, :b; sh:nodeByExpression :Has.
      :Has sh:property [sh:path :w; sh:minCount 1].
      :a :w 3. :b :v 12.`);
    const loaded = compileRdfLogic(graph, { profiles: ['shacl'] });
    const result = run(loaded.program, { proof: true });
    assert.equal(checkProof(loaded.program, result.proof).valid, true);
    const component = (name) => result.answers.filter((a) => a.includes(`#sourceConstraintComponent'), iri('http://www.w3.org/ns/shacl#${name}')`)).length;
    assert.equal(component('ExpressionConstraintComponent'), 1);
    assert.equal(component('NodeByExpressionConstraintComponent'), 1);
    assert.ok(result.answers.some((a) => a.includes("#sourceConstraint'), iri('urn:example:Has')")));
  },

  'SHACL report comparison detects wrong fields and preserves result multiplicity and input blank identities'() {
    const expected = report(item());
    assert.equal(compareShaclReports(expected, expected, root).ok, true);
    for (const actual of [report(item('sh:value :wrong')), report(item() + ', ' + item()),
      report(item().replace('sh:focusNode :a', 'sh:focusNode :wrong'))]) {
      const result = compareShaclReports(actual, expected, root);
      assert.equal(result.booleanOk, true);
      assert.equal(result.ok, false);
    }
    assert.equal(compareShaclReports(report(item('sh:value _:other')), report(item('sh:value _:input')), root).ok, false);
    const missingConforms = expected.filter(([, p]) => !p.args[0].endsWith('#conforms'));
    assert.equal(compareShaclReports(missingConforms, expected, root).ok, false);
  },

  'SHACL report paths compare structurally with sharing, and required messages must be preserved'() {
    const expected = report(item('sh:value :a; sh:resultPath (:p [sh:inversePath :q])') + ', ' + item('sh:value :b; sh:resultPath (:p [sh:inversePath :q])'));
    const actual = report(item('sh:value :a; sh:resultPath _:path') + ', ' + item('sh:value :b; sh:resultPath _:path'),
      '_:path rdf:first :p; rdf:rest [rdf:first [sh:inversePath :q]; rdf:rest rdf:nil].');
    assert.equal(compareShaclReports(actual, expected, root).ok, true);
    assert.equal(compareShaclReports(report(item('sh:value :a; sh:resultMessage "extra"')), report(item()), root).ok, true);
    assert.equal(compareShaclReports(report(item()), report(item('sh:value :a; sh:resultMessage "required"')), root).ok, false);
  },

  'an unsupported processor or constraint and a missing graph cannot pass an expected-failure test'() {
    const f = fixture();
    try {
      const c = shaclCases(f)[0];
      c.expected = parsed(':test mf:result sht:Failure.').quads[0][2];
      assert.equal(runShaclCase({ ...c, type: 'Infer' }, f).ok, null);
      assert.equal(runShaclCase({ ...c, requires: ['http://www.w3.org/ns/shacl-test#SPARQLValidation'] }, f).ok, null);
      f.put('core/shapes.ttl', ':S sh:targetNode :a; sh:sparql [sh:select "SELECT * WHERE {}"].');
      const unsupported = runShaclCase(c, f);
      assert.equal(unsupported.ok, false); assert.equal(unsupported.unsupported, true);
      rmSync(join(f.mirror, 'core/data.ttl'));
      assert.throws(() => runShaclCase(c, f), /ENOENT/);
    } finally { f.close(); }
  },
};
