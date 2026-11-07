import { Struct, build, checkProof, checkReport, publicReport, readTerms, run, verdictText } from '../src/index.js';
import { shortcuts } from '../src/proof.js';
import { assert, program } from './helpers.js';

const SOURCE = program("fact(p('a'))\nimplies(p(X), q(X))\nimplies(q(X), r(X))");
const proof = () => run(SOURCE, { proof: true }).proof;

function invalid(document, condition, source = SOURCE) {
  const report = checkProof(source, document);
  assert.ok(!report.valid, document);
  assert.ok(report.failures.some((failure) => failure.condition === condition), JSON.stringify(report.failures));
}

const facts = (report) => readTerms(checkReport(report)).map(([term]) => term);
const named = (records, name) => records.filter((record) => record instanceof Struct && record.name === name);

// A proof document without its search certificate.
const withoutCertificate = (document) => document.split('\n')
  .filter((line) => !line.startsWith('searched(') && !line.startsWith('derived(')).join('\n');

const CERTIFIED = program([
  "fact(edge('a', 'b'), edge('b', 'c'))",
  'implied_by(path(X, Y), edge(X, Y))',
  'implied_by(path(X, Y), [edge(X, Z), path(Z, Y)])',
  'implied_by(tagged(X, T), edge(X, _))',
  "implies([edge(X, _), not(path(X, 'a'))], acyclic_from(X))",
  "implies(findall(Y, path('a', Y), L), reach('a', L))",
  'implies(findall(X, tagged(X, _), L), tagged_all(L))',
].join('\n'));

export const tests = {
  'check reports put answers first and distinguish failed and conditional claims'() {
    const source = program("fact(p('a'))\nimplies(p(X), q(X))");
    const document = run(source, { proof: true }).proof;
    const report = checkProof(source, document);
    assert.deepEqual(report.answers, ["q('a')"]);
    assert.match(checkReport(report), /^\/\/ Checked answers:[^\n]*\nq\('a'\)\n\n\/\/ C1-C8:/);
    const failed = checkProof(source, document.replace("step(q('a')", "step(q('b')"));
    assert.match(checkReport(failed), /^\/\/ Unverified claims:[^\n]*\nq\('a'\)/);
    assert.deepEqual(failed.answers, ["q('a')"]);
    const conditional = program('fact(a(1))\nimplies(a(X), b(X))\nimplies(findall(X, b(X), L), all(L))');
    const checked = run(conditional, { proof: true }).proofReport;
    assert.match(checkReport(checked), /^\/\/ Answers checked subject to the obligations below\./);
    assert.match(checkReport(checked), /\/\/ Obligations:/);
    assert.match(checkReport(checkProof(program(''), '')), /^\/\/ No answers claimed;/);
    assert.deepEqual(publicReport(report).answers, report.answers);
  },

  'flat resolution agrees with the general checker'() {
    const source = program("fact(p('a', 1), p('b', float(1)))\nimplied_by(q(X, Y, X), p(X, Y))\nquery(q(X, Y, X))");
    const document = run(source, { proof: true }).proof;
    const documents = [document];
    for (const [original, altered] of [["{X: 'a', Y: 1}", '{}'], ["{X: 'a', Y: 1}", "{unknown: 'a'}"],
      ["{X: 'a', Y: 1}", "{X: 'b', Y: 1}"], ["{X: 'a', Y: 1}", '{X: A, Y: 1}'], ["{X: 'a', Y: 1}", "{X: 'a', Y: 1.0}"],
      ["[p('a', 1)]", "[p('b', 1)]"], ["q('a', 1, 'a')", "q('a', 1, 'b')"], ["q('a', 1, 'a')", 'q(A, 1, A)'],
      ["q('a', 1, 'a')", "q(f('a'), 1, f('a'))"]]) {
      assert.ok(document.includes(original), original);
      documents.push(document.replaceAll(original, altered));
    }
    for (const text of documents) {
      const fast = checkProof(source, text);
      shortcuts.flatResolution = false;
      let general;
      try {
        general = checkProof(source, text);
      } finally {
        shortcuts.flatResolution = true;
      }
      assert.deepEqual(publicReport(fast), publicReport(general));
    }
  },

  'identity keeps the sign of zero in displays and steps'() {
    const source = program('fact(p(float(0)))\nquery(p(X))');
    const document = run(source, { proof: true }).proof;
    assert.ok(checkProof(source, document).valid);
    invalid(document.replace('clause(1, fact(p(0.0)))', 'clause(1, fact(p(-0.0)))'), 'C1', source);
    invalid(document.replace('step(p(0.0)', 'step(p(-0.0)'), 'C1', source);
  },

  'primitive re-decision rejects signed zero identity and underflow forgeries'() {
    invalid("identical(0.0, -0.0)\nstep(identical(0.0, -0.0), 'builtin', {}, [])", 'C5',
      program('query(identical(float(0), float(-0)))'));
    const expression = 'div(1, shl(1, 1074))';
    invalid(`is(0.0, ${expression})\nstep(is(0.0, ${expression}), 'builtin', {}, [])`, 'C5',
      program(`query(is(X, ${expression}))`));
  },

  'host math may be a few units in the last place off and exact arithmetic none'() {
    const view = new DataView(new ArrayBuffer(8));
    const ulps = (value, count) => {
      view.setFloat64(0, value);
      view.setBigInt64(0, view.getBigInt64(0) + BigInt(count));
      return view.getFloat64(0);
    };
    // The failed conditions of a one-step proof that is(Value, Expression) holds.
    const failed = (value, expression) => {
      const document = `is(${value}, ${expression})\nstep(is(${value}, ${expression}), 'builtin', {}, [])\n`;
      const report = checkProof(program(''), document, { goals: [`is(X, ${expression})`] });
      return report.failures.map((failure) => failure.condition);
    };
    const nested = 'div(mul(cos(1.25), sub(exp(0.5), exp(neg(0.5)))), 2)';
    const value = Number(run(program(`query(is(X, ${nested}))`)).answers[0].match(/^is\(([^,]+),/)[1]);
    for (const [expression, exact] of [['exp(1)', Math.exp(1)], ['pow(2.0, 0.5)', 2 ** 0.5], [nested, value]]) {
      for (const count of [-4, -1, 1, 4]) assert.deepEqual(failed(ulps(exact, count), expression), [], `${expression} ${count}`);
      for (const count of [-5, 5, 1000]) assert.deepEqual(failed(ulps(exact, count), expression), ['C5'], `${expression} ${count}`);
    }
    assert.deepEqual(failed(ulps(2.5, 1), 'add(1.5, 1.0)'), ['C5']);
    assert.deepEqual(failed(ulps(2.5, 1), 'sqrt(6.25)'), ['C5']);
    assert.deepEqual(failed('3.0', 'pow(3, 1)'), ['C5']);
  },

  'proofs are checked against source rather than display records'() {
    invalid(proof().replace("clause(1, fact(p('a')))", "clause(1, fact(p('b')))"), 'C1');
    invalid(proof(), 'C1', program("fact(p('b'))\nimplies(p(X), q(X))\nimplies(q(X), r(X))"));
  },

  'altered conclusion premise binding and citation fail resolution'() {
    invalid(proof().replace("step(q('a')", "step(q('b')"), 'C1');
    invalid(proof().replace("[p('a')]", "[p('b')]"), 'C1');
    invalid(proof().replace("{X: 'a'}", "{X: 'b'}"), 'C1');
    invalid(proof().replace('clause(2)', 'clause(999)'), 'C1');
  },

  'omitted steps missing premises and unrelated claims fail coverage'() {
    invalid(proof().replace(/^step\(q\('a'\).*\n/m, ''), 'C4');
    invalid(`${proof()}unrelated('a')\n`, 'C4');
  },

  'coverage checks every conjunct of a use'() {
    const source = program('fact(p(1))\nimplied_by(q(G), G)');
    for (const [second, valid] of [['p(1)', true], ['missing(1)', false]]) {
      const goal = `q(and(p(1), ${second}))`;
      const document = `${goal}\nstep(${goal}, clause(2), {}, [and(p(1), ${second})])\n`;
      const report = checkProof(source, document, { goals: ['q(G)'] });
      assert.equal(report.valid, valid, JSON.stringify(report.failures));
      if (!valid) assert.ok(report.failures.some((failure) => failure.condition === 'C4'), JSON.stringify(report.failures));
    }
  },

  'a document that claims nothing is valid and certifies nothing'() {
    const report = checkProof(SOURCE, '');
    assert.ok(report.valid);
    assert.deepEqual([report.claims, report.steps], [0, 0]);
  },

  'unknown duplicate and malformed justifications are rejected'() {
    invalid(proof().replace('clause(2)', "'magic'"), 'C3');
    invalid(`${proof()}step(q('a'), clause(2), {}, [])\n`, 'C3');
    invalid("q('a')\nstep(q('a'), clause(2), 'broken', [])", 'C3');
    invalid("q('a')\nx = step(q('a'), clause(2), {}, [])", 'C3');
    invalid('unterminated(', 'C3');
    invalid("require('fs').writeFileSync('x', '')", 'C3');
  },

  'nonfinite values cannot be certified as numeric equalities'() {
    invalid("eq(1e+999, 2e+999)\nstep(eq(1e+999, 2e+999), 'builtin', {}, [])", 'C3', program(''));
  },

  'cyclic certificates cannot justify their own conclusions'() {
    invalid("'p'\nstep('p', clause(1), {}, ['p'])", 'C2', program('implied_by(p, p)'));
  },

  'primitive results are recomputed with no theory clauses'() {
    invalid("is(7, add(2, 3))\nstep(is(7, add(2, 3)), 'builtin', {}, [])", 'C5', program(''));
    invalid("'evil'\nstep('evil', 'builtin', {}, [])", 'C3', program("fact('evil')"));
    const report = checkProof(program(''), "is(5, add(2, 3))\nstep(is(5, add(2, 3)), 'builtin', {}, [])",
      { goals: ['is(5, add(2, 3))'] });
    assert.ok(report.valid);
    assert.equal(report.redecided, 1);
  },

  'source variable sharing cannot be forged'() {
    invalid("same('a', 'b')\nstep(same('a', 'b'), clause(1), {}, [])", 'C1', program('fact(same(X, X))'));
  },

  'a boundary without its search certificate remains a visible obligation'() {
    const source = program("fact(p('a'))\nimplies([p(X), not(missing(X))], out(X))\nimplied_by(missing(X), banned(X))");
    const document = run(source, { proof: true }).proof;
    assert.ok(document.includes("searched(missing('a'), [])"));
    assert.equal(checkProof(source, document).trusted.length, 0);
    assert.ok(checkProof(source, document, { allowTrusted: false }).valid);
    const bare = withoutCertificate(document);
    assert.equal(checkProof(source, bare).trusted.length, 1);
    assert.ok(!checkProof(source, bare, { allowTrusted: false }).valid);
  },

  'absences and collections contradicted by evidence fail boundary consistency'() {
    const text = "fact(p('a'), p('b'))\nimplies([p(X), not(blocked(X))], out(X))\nimplies(findall(X, p(X), L), all_(L))\n";
    const source = program(text);
    const document = run(source, { proof: true }).proof;
    assert.ok(checkProof(source, document).valid);
    invalid(document, 'C6', program(`${text}fact(blocked('a'))`));
    invalid(document.replaceAll("['a', 'b']", "['a']"), 'C6', source);
    invalid("'q'\nstep('q', clause(1), {}, [not(lt(1, 2))])\nstep(not(lt(1, 2)), 'absent', {}, [])", 'C6',
      program('implies(not(lt(1, 2)), q)'));
  },

  'without a certificate, a boundary over a predicate with no fact or step is left undecided'() {
    const text = "fact(p('a'), p('b'))\nimplies([p(X), not(blocked(X))], out(X))\nimplied_by(blocked(X), banned(X))\n";
    const c6 = (source) => checkProof(program(source), withoutCertificate(run(program(source), { proof: true }).proof)).conditions[5];
    // Nothing could refute not(blocked(X)): no blocked fact, no blocked step.
    assert.deepEqual(c6(text), { id: 'C6', name: 'boundary_consistency', covered: 0, failed: 0 });
    // One blocked fact of another value is evidence: both absences are confronted.
    assert.deepEqual(c6(`${text}fact(blocked('c'))`), { id: 'C6', name: 'boundary_consistency', covered: 2, failed: 0 });
    // A ground primitive is recomputed, which settles it.
    assert.deepEqual(c6('fact(p(1))\nimplies([p(X), not(lt(X, 0))], ok(X))'),
      { id: 'C6', name: 'boundary_consistency', covered: 1, failed: 0 });
    // An undecided absence is still an obligation, and evidence still refutes.
    const document = withoutCertificate(run(program(text), { proof: true }).proof);
    assert.equal(checkProof(program(text), document).trusted.length, 2);
    invalid(document, 'C6', program(`${text}fact(blocked('a'))`));
  },

  'an absence with anonymous variables is refuted by any instance'() {
    const text = "fact(p('a'), p('b'), q('b', 1))\nimplies([p(X), not(q(X, _))], s(X))\n";
    const document = run(program(text), { proof: true }).proof;
    assert.ok(document.includes("not(q('a', A))"));
    assert.ok(checkProof(program(text), document).valid);
    invalid(document, 'C6', program(`${text}fact(q('a', 2))`));
  },

  'claims must answer the goal asked and every step must serve a claim'() {
    const asked = run(SOURCE, { goal: 'p(X)', proof: true }).proof;
    assert.ok(checkProof(SOURCE, asked, { goals: ['p(X)'] }).valid);
    invalid(asked, 'C7');
    const orphan = checkProof(SOURCE, `${asked}step(q('a'), clause(2), {X: 'a'}, [p('a')])\n`, { goals: ['p(X)'] });
    assert.deepEqual(orphan.failures.map((failure) => failure.condition), ['C7']);
  },

  'a witness must be the skolem term of its own firing'() {
    const source = program("fact(person('ann'), person('bob'))\nimplies(person(X), [has_parent(X, P), parent_known(P)])");
    const document = run(source, { proof: true }).proof;
    const report = checkProof(source, document);
    assert.ok(report.valid);
    assert.deepEqual(report.conditions[7], { id: 'C8', name: 'witness_integrity', covered: 4, failed: 0 });
    const ann = "skolem(3, 'P', ['ann'])";
    const bob = "skolem(3, 'P', ['bob'])";
    assert.ok(document.includes(ann) && document.includes(bob));
    // A value the program never concluded, another firing's witness, another
    // clause's, another variable's, and one conclusion of a firing out of step
    // with the other: each passes C1 as an instance of the rule, not C8.
    const knownAnn = `step(parent_known(${ann}), clause(3), {X: 'ann', P: ${ann}}, [person('ann')])`;
    assert.ok(document.includes(knownAnn));
    for (const forged of [
      document.replaceAll(ann, "'carol'"),
      document.replaceAll(bob, ann),
      document.replaceAll(ann, "skolem(2, 'P', ['ann'])"),
      document.replaceAll(ann, "skolem(3, 'Q', ['ann'])"),
      // A head variable's witness carries exactly that variable's name.
      document.replaceAll(ann, "skolem(3, 'P1', ['ann'])"),
      document.replace(`parent_known(${ann})\n`, `parent_known(${bob})\n`)
        .replace(knownAnn, `step(parent_known(${bob}), clause(3), {X: 'ann', P: ${bob}}, [person('ann')])`),
    ]) {
      const forgedReport = checkProof(source, forged);
      assert.ok(!forgedReport.valid, forged);
      assert.ok(forgedReport.failures.some((failure) => failure.condition === 'C8'), JSON.stringify(forgedReport.failures));
      assert.ok(!forgedReport.failures.some((failure) => failure.condition === 'C1'), JSON.stringify(forgedReport.failures));
    }
  },

  'witnesses agree with the reasoner wherever they come from'() {
    for (const text of [
      "fact(p('a'))\nimplies(p(X), [q(X, W), r(W)])",
      'fact(p(f(Z)))\nimplies(p(X), q(X, W))',
      "fact(p('a'))\nimplies(p(X), q(X, _, _))",
      "fact(p('a'))\nimplies([p(X), unify(Y, Y)], q(X, Y))",
      'fact(n(1))\nimplies(n(X), m(X, P))\nimplies(m(X, P), [o(P, Q), o2(Q)])',
    ]) {
      const source = program(text);
      const result = run(source, { proof: true });
      assert.ok(checkProof(source, result.proof).valid, text);
    }
  },

  'reports expose coverage and source and primitive counts'() {
    const source = program("fact(p('a'))\nimplied_by(q(X), [p(X), unify(X, 'a')])");
    const report = checkProof(source, run(source, { goal: 'q(X)', proof: true }).proof, { goals: ['q(X)'] });
    assert.deepEqual(report.conditions, [
      { id: 'C1', name: 'resolution', covered: 2, failed: 0 },
      { id: 'C2', name: 'well_founded', covered: 3, failed: 0 },
      { id: 'C3', name: 'justification', covered: 3, failed: 0 },
      { id: 'C4', name: 'coverage', covered: 3, failed: 0 },
      { id: 'C5', name: 're_decision', covered: 1, failed: 0 },
      { id: 'C6', name: 'boundary_consistency', covered: 0, failed: 0 },
      { id: 'C7', name: 'relevance', covered: 4, failed: 0 },
      { id: 'C8', name: 'witness_integrity', covered: 0, failed: 0 },
    ]);
    assert.equal(report.uses, 2);
    assert.equal(verdictText(report), "verdict('checked')\n");
    assert.equal(named(facts(report), 'condition').length, 8);
    assert.ok(checkReport(report).includes('recomputed(1)\n'));
  },

  'each failed condition is represented with counts and a failure'() {
    const cases = [
      ['C1', "fact(p('a'))", "p('b')\nstep(p('b'), clause(1), {}, [])"],
      ['C2', 'implied_by(p, p)', "'p'\nstep('p', clause(1), {}, ['p'])"],
      ['C3', '', "'p'\nstep('p', 'magic', {}, [])"],
      ['C4', '', "'missing'\n'true'\nstep('true', 'builtin', {}, [])"],
      ['C5', '', "is(7, add(2, 3))\nstep(is(7, add(2, 3)), 'builtin', {}, [])"],
      ['C6', "fact(p('a'))\nimplies(not(p('a')), q)", "'q'\nstep('q', clause(2), {}, [not(p('a'))])\nstep(not(p('a')), 'absent', {}, [])"],
      ['C7', "fact(p('a'))", "p('a')\nstep(p('a'), clause(1), {}, [])"],
    ];
    for (const [id, source, document] of cases) {
      const report = checkProof(program(source), document);
      const records = facts(report);
      const condition = named(records, 'condition').find((record) => record.args[0] === id);
      assert.equal(condition.args[2].name, 'failed', id);
      assert.equal(condition.args[2].args[0], BigInt(report.failures.filter((failure) => failure.condition === id).length));
      const failure = named(records, 'failure').find((record) => record.args[0] === id);
      assert.notEqual(failure.args[1], 'proof_document');
      const last = records[records.length - 1];
      assert.equal(last.args[0].name, 'failed');
      assert.equal(last.args[0].args[0], BigInt(report.failures.length));
    }
  },

  'control composition is counted under C5'() {
    const source = program("fact(p('a'))");
    const report = checkProof(source, run(source, { goal: "call(p('a'))", proof: true }).proof, { goals: ["call(p('a'))"] });
    assert.equal(report.verified, 1);
    assert.equal(report.composed, 1);
    assert.equal(report.conditions[0].covered, 1);
    assert.equal(report.conditions[4].covered, 1);
    assert.ok(checkReport(report).includes('composed(1)\n'));
    const broken = checkProof(source, "call(p('b'))\nstep(call(p('b')), 'control', {}, [p('a')])");
    assert.ok(broken.conditions[4].failed > 0);
  },

  'obligations carry goal terms and strict checking fails C5'() {
    const source = program("fact(p('a'))\nimplies([p(X), not(missing(X))], out(X))\nimplied_by(missing(X), banned(X))");
    const document = withoutCertificate(run(source, { proof: true }).proof);
    const report = checkProof(source, document);
    const [obligation] = named(facts(report), 'obligation');
    assert.equal(obligation.args[0], 'absent');
    assert.equal(obligation.args[1], 'theory_scoped');
    assert.equal(obligation.args[2].name, 'not');
    assert.equal(verdictText(report), "verdict('checked_with_obligations')\n");
    const strictly = checkProof(source, document, { allowTrusted: false });
    assert.equal(strictly.conditions[4].failed, 1);
    assert.ok(checkReport(strictly).includes("condition('C5', 're_decision', failed(1), 0)\n"));
  },

  'a search certificate settles absences and collections, so a strict check accepts them'() {
    const result = run(CERTIFIED, { proof: true });
    for (const line of ["searched(path('a', 'a'), [])", "searched(path('b', E), [path('b', 'c')])",
      "searched(path('a', D), [path('a', 'b'), path('a', 'c')])", "searched(tagged(G, H), [tagged('a', I), tagged('b', J)])"]) {
      assert.ok(result.proof.includes(`\n${line}\n`), line);
    }
    assert.equal(result.proofReport.trusted.length, 0);
    assert.equal(result.proofReport.conditions[5].covered, 4);
    assert.ok(checkProof(CERTIFIED, result.proof, { allowTrusted: false }).valid);
    // Facts alone need no table: their search is scanned where it stands.
    const facts = program("fact(p('a'))\nimplies([p(X), not(q(X))], r(X))\nimplies(findall(X, p(X), L), all(L))");
    const plain = run(facts, { proof: true });
    assert.ok(!plain.proof.includes('searched('));
    assert.equal(plain.proofReport.trusted.length, 0);
  },

  'a search table that disagrees with its one-level expansion fails C6'() {
    const document = run(CERTIFIED, { proof: true }).proof;
    for (const [original, forged] of [
      ["[path('a', 'b'), path('a', 'c')]", "[path('a', 'b')]"],
      ["[path('a', 'b'), path('a', 'c')]", "[path('a', 'c'), path('a', 'b')]"],
      ["searched(path('b', E), [path('b', 'c')])", "searched(path('b', E), [])"],
      ["searched(path('b', 'a'), [])", "searched(path('b', 'a'), [path('b', 'a')])"],
      ["[tagged('a', I), tagged('b', J)]", "[tagged('a', 'x'), tagged('b', J)]"],
    ]) {
      assert.ok(document.includes(original), original);
      invalid(document.replace(original, forged), 'C6', CERTIFIED);
    }
  },

  'an absence its own search contradicts fails C6, with or without a table'() {
    invalid("'q'\nstep('q', clause(2), {}, [not(p('a'))])\nstep(not(p('a')), 'absent', {}, [])", 'C6',
      program("fact(p('a'))\nimplies(not(p('a')), q)"));
    invalid("'q'\nstep('q', clause(3), {}, [not(p('a'))])\nstep(not(p('a')), 'absent', {}, [])\nsearched(p('a'), [p('a')])", 'C6',
      program("fact(s('a'))\nimplied_by(p(X), s(X))\nimplies(not(p('a')), q)"));
  },

  'derived facts a certificate lists must have steps and be closed under the forward rules'() {
    const source = program("fact(r('n'))\nfact(k('n'), k('a'))\nimplies(r(X), np(X))\nimplies([k(X), not(np(X))], pac(X))");
    const document = run(source, { proof: true }).proof;
    assert.ok(document.includes("\nderived(np(A), [np('n')])\n"));
    assert.ok(checkProof(source, document, { allowTrusted: false }).valid);
    invalid(document.replace("derived(np(A), [np('n')])", 'derived(np(A), [])'), 'C6', source);
    invalid(document.replace("derived(np(A), [np('n')])", "derived(np(A), [np('n'), np('z')])"), 'C6', source);
    invalid(document.replace("derived(np(A), [np('n')])", "derived(np(A), [np('n'), k('a')])"), 'C6', source);
  },

  'circular search tables fail C6'() {
    const source = program("implied_by(p(X), q(X))\nimplied_by(q(X), p(X))\nimplies(not(p('a')), r)");
    invalid("'r'\nstep('r', clause(3), {}, [not(p('a'))])\nstep(not(p('a')), 'absent', {}, [])\n" +
      "searched(p('a'), [])\nsearched(q('a'), [])", 'C6', source);
  },

  'a certificate statement that settles nothing fails C7, and a repeated one C3'() {
    const document = run(CERTIFIED, { proof: true }).proof;
    invalid(`${document}searched(edge('z', A), [])\n`, 'C7', CERTIFIED);
    invalid(`${document}derived(acyclic_from(A), [])\n`, 'C7', CERTIFIED);
    invalid(`${document}searched(path('a', 'a'), [])\n`, 'C3', CERTIFIED);
    invalid(`${document}searched(path('a', 'a'), 'none')\n`, 'C3', CERTIFIED);
    const listed = run(program("fact(r('n'))\nfact(k('a'))\nimplies(r(X), np(X))\nimplies([k(X), not(np(X))], pac(X))"), { proof: true }).proof;
    for (const pattern of ['np(1)', 'np([A])']) {
      invalid(listed.replace('derived(np(A),', `derived(${pattern},`), 'C3',
        program("fact(r('n'))\nfact(k('a'))\nimplies(r(X), np(X))\nimplies([k(X), not(np(X))], pac(X))"));
    }
  },

  'a boundary whose tables would search without end stays an obligation'() {
    const source = program([
      'fact(nat(0))',
      "implied_by(gen(N, N), 'true')",
      'implied_by(gen(N, M), [is(K, add(N, 1)), gen(K, M)])',
      'implied_by(big(X), [once(gen(X, Y)), gt(Y, 5)])',
      'implies([nat(X), not(big(X))], r1(X))',
    ].join('\n'));
    const result = run(source, { proof: true, maxInferences: 5000 });
    assert.deepEqual(result.answers, ['r1(0)']);
    assert.deepEqual(result.proofReport.trusted.map((item) => item.kind), ['absent']);
  },

  'a collection whose answers rest on derived facts stays an obligation'() {
    const source = program('fact(a(1), a(2))\nimplies(a(X), b(X))\nimplies(findall(X, b(X), L), all(L))');
    const result = run(source, { proof: true });
    assert.deepEqual(result.proofReport.trusted.map((item) => item.kind), ['collected']);
    assert.ok(!result.proof.includes('searched('));
  },

  'reports can be loaded and queried as ordinary data'() {
    const source = program("fact(p('a'))\nimplies(p(X), q(X))");
    const data = checkReport(checkProof(source, run(source, { proof: true }).proof));
    const factsProgram = build(({ facts_from: factsFrom }) => factsFrom({ text: data }));
    assert.deepEqual(run(factsProgram, { goal: "condition('C1', Name, 'ok', Count)" }).answers,
      ["condition('C1', 'resolution', 'ok', 2)"]);
    assert.deepEqual(run(factsProgram, { goal: 'verdict(Result)' }).answers, ["verdict('checked')"]);
  },

  'malformed document diagnostics stay readable data'() {
    const report = checkProof(program(''), "p('unterminated");
    const records = facts(report);
    assert.equal(named(records, 'condition').length, 8);
    const [failure] = named(records, 'failure');
    assert.equal(failure.args[1], 'proof_document');
    assert.equal(failure.args[2], report.failures[0].detail);
    assert.equal(records[records.length - 1].args[0].name, 'failed');
  },
};
