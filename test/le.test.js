import { assert, cli, errorOf } from './helpers.js';
import { checkProof, compileLe, loadText, readTerm, run, write, writeLe } from '../src/index.js';
import { inputKind, loadInputs, writeConclusions } from '../src/formats.js';
import { parseRdf } from '../src/rdf.js';
import { flattenConjunction } from '../src/terms.js';

const compile = (text) => compileLe([[text, 'input.le']]);
const answers = (text) => run(compile(text).program).answers;

export const tests = {
  'class facts, every rules, conjunctions and recursive binary relations have explicit LS meanings'() {
    assert.deepEqual(answers('Socrates is a human. Every human is mortal. Find every X such that X is mortal.'), ["mortal('Socrates')"]);
    const input = 'Alice is a parent of Bob. Bob is a parent of Carol. ' +
      'For every X and Y, if parent(X, Y) then ancestor(X, Y). ' +
      'For every X and Y and Z, if parent(X, Y) and ancestor(Y, Z) then ancestor(X, Z). ' +
      'Find every X such that Alice is an ancestor of X.';
    assert.deepEqual(answers(input), ["ancestor('Alice', 'Bob')", "ancestor('Alice', 'Carol')"]);
    assert.deepEqual(answers('Ada is a human and Ada is a mathematician. Every human is mortal and animal.'), ["mortal('Ada')", "animal('Ada')"]);
  },

  'qualified RDF vocabulary joins ODRL and DPV in rules and round-trips through LE and Turtle'() {
    const loaded = compile(`
Use prefix ex with namespace "urn:example:".
Use prefix odrl with namespace "http://www.w3.org/ns/odrl/2/".
Use prefix dpv with namespace "https://w3id.org/dpv#".
ex:agreement is an odrl:Agreement.
ex:study is a dpv:Process and ex:study has dpv:hasPurpose dpv:AcademicResearch.
Every odrl:Agreement is an ex:ReviewedPolicy.
For every X and P, if X is a dpv:Process and X is a dpv:hasPurpose of P then X has ex:observedPurpose P.
Find every X such that X is an ex:ReviewedPolicy.
Find every X and P such that X has ex:observedPurpose P.`);
    const result = run(loaded.program, { proof: true });
    assert.deepEqual(run(loadText(loaded.text)).answers, result.answers);
    assert.equal(checkProof(loadText(loaded.text), result.proof).valid, true);
    const output = writeConclusions(loaded, result, { format: 'le' });
    assert.match(output, /^Use prefix dpv with namespace "https:\/\/w3id\.org\/dpv#"/);
    assert.doesNotMatch(output, /Use prefix odrl/);
    assert.match(output, /ex:agreement is a ex:ReviewedPolicy\./);
    assert.match(output, /ex:study has ex:observedPurpose dpv:AcademicResearch\./);
    assert.deepEqual(compile(output).program.sources.map((s) => write(s.head)), result.answers);
    const turtle = (all) => parseRdf(writeConclusions(loaded, result, { format: 'turtle', all })).quads;
    assert.equal(turtle(false).length, 2);
    const graph = turtle(true);
    assert.equal(graph.length, 5);
    assert.ok(graph.some((q) => q[1].args[0] === 'https://w3id.org/dpv#hasPurpose' && q[2].args[0] === 'https://w3id.org/dpv#AcademicResearch'));
  },

  'prefix definitions are scoped to their file and malformed RDF shorthand gets a located error'() {
    const first = 'Use prefix ex with namespace "urn:first:". ex:item has ex:related ex:other.';
    const second = 'Use prefix ex with namespace "urn:second:". ex:item has ex:related 1.';
    const loaded = compileLe([[first, 'one.le'], [second, 'two.le']]);
    assert.deepEqual(loaded.program.sources.map((s) => write(s.head)), [
      "rdf(iri('urn:first:item'), iri('urn:first:related'), iri('urn:first:other'))",
      "rdf(iri('urn:second:item'), iri('urn:second:related'), 1)",
    ]);
    assert.match(errorOf(() => compileLe([[first, 'one.le'], ['ex:item is a dpv:Process.', 'two.le']])), /two\.le: line 1:.*prefix ex is undeclared/);
    for (const [text, pattern] of [
      ['Use prefix pd with namespace "relative#".', /absolute IRI/],
      [first + ' Use prefix ex with namespace "urn:changed:".', /already declared/],
      [first + ' item is a ex:Class.', /needs a resource subject/],
      [first + ' ex:item has ex:related "an LS atom".', /needs an RDF value/],
    ]) assert.match(errorOf(() => compile(text)), pattern);
  },

  'DPV hierarchy logic matches exact and broader purpose and data categories from supplied SKOS edges'() {
    const input = `Use DPV hierarchy logic.
Use prefix ex with namespace "urn:example:".
Use prefix dpv with namespace "https://w3id.org/dpv#".
Use prefix pd with namespace "https://w3id.org/dpv/pd#".
Use prefix skos with namespace "http://www.w3.org/2004/02/skos/core#".
ex:study has dpv:hasPurpose dpv:AcademicResearch.
dpv:AcademicResearch has skos:broader dpv:ResearchAndDevelopment.
ex:study has dpv:hasData pd:EmailAddressWork and ex:study has dpv:hasPersonalData pd:EmailAddressWork.
pd:EmailAddressWork has skos:broader pd:EmailAddress.
pd:Contact has skos:narrower pd:EmailAddress.
Find whether ex:study has purposeWithin dpv:AcademicResearch.
Find whether ex:study has purposeWithin dpv:ResearchAndDevelopment.
Find whether ex:study has purposeWithin dpv:Marketing.
Find whether ex:study has dataWithin pd:Contact.
Find whether ex:study has personalDataWithin pd:Contact.`;
    const loaded = compile(input), result = run(loaded.program, { proof: true });
    assert.deepEqual(result.answers, [
      "purposeWithin(iri('urn:example:study'), iri('https://w3id.org/dpv#AcademicResearch'))",
      "purposeWithin(iri('urn:example:study'), iri('https://w3id.org/dpv#ResearchAndDevelopment'))",
      "dataWithin(iri('urn:example:study'), iri('https://w3id.org/dpv/pd#Contact'))",
      "personalDataWithin(iri('urn:example:study'), iri('https://w3id.org/dpv/pd#Contact'))",
    ]);
    assert.deepEqual(run(loadText(loaded.text)).answers, result.answers);
    assert.ok(checkProof(loadText(loaded.text), result.proof).valid);
    assert.deepEqual(answers(input.replace('Use DPV hierarchy logic.', '')), []);
  },

  'arithmetic preserves exact integers, float types, precedence and comparison boundaries'() {
    assert.deepEqual(answers('9007199254740993 is an integer. For every X and Y, if X is an integer and Y is the value of X + 2 * 3 then Y is a result.'),
      ['result(9007199254740999)']);
    assert.deepEqual(answers('For every Y, if Y is the value of -(2 + 3) * 4 then Y is a result.'), ['result(-20)']);
    assert.deepEqual(answers('For every Y, if Y is the value of 2.0 + 3.0 then Y is a result.'), ['result(5.0)']);
    for (const [comparison, expected] of [['greater than', []], ['less than', []], ['at least', ['accepted(2)']],
      ['at most', ['accepted(2)']], ['equal to', ['accepted(2)']], ['different from', []]]) {
      assert.deepEqual(answers(`2 is a number. For every X, if X is a number and X is ${comparison} 2 then X is accepted.`), expected);
    }
    assert.deepEqual(answers('For every Y, if Y is the value of 1 + 1.0 then Y is a result.'), ['result(2.0)']);
  },

  'explicit absence differs from negative evidence and waits for derived facts'() {
    const text = 'Alice is a person. Bob is a person. Bob is pending. ' +
      'For every X, if X is a person and it is not known that X is blocked then X is admitted. ' +
      'For every X, if X is pending then X is blocked. Find every X such that X is admitted.';
    assert.deepEqual(answers(text), ["admitted('Alice')"]);
    assert.match(errorOf(() => compile('Alice is not a person.')), /ordinary "not" is unsupported/);
    assert.match(errorOf(() => compile('For every X, if it is not known that X is blocked then X is admitted.')), /earlier positive premise/);
  },

  'existential witnesses are shared within a firing and differ between people'() {
    const loaded = compile('Alice is a person. Bob is a person. For every X, if X is a person then there exists Y such that X is an owner of Y and Y is a record. Find every X and Y such that X is an owner of Y and Y is a record.');
    const result = run(loaded.program, { proof: true });
    assert.equal(result.answers.length, 2);
    for (const answer of result.answers) {
      const [owner, record] = flattenConjunction(readTerm(answer));
      assert.equal(write(owner.args[1]), write(record.args[0]));
    }
    assert.notEqual(write(readTerm(result.answers[0]).args[0].args[1]), write(readTerm(result.answers[1]).args[0].args[1]));
    assert.equal(checkProof(loadText(loaded.text), result.proof).valid, true);
    assert.equal(answers('There exists X such that X is a record. Find every X such that X is a record.').length, 1);
  },

  'constraints report contradictions and empty questions produce readable empty output'() {
    const loaded = compile('Alice is a person. For every X, it is impossible that X is a person and X is blocked. Alice is blocked.');
    const result = run(loaded.program, { proof: true });
    assert.equal(result.haltCode, 65);
    assert.equal(writeLe(result), 'Contradiction.\n');
    assert.equal(checkProof(loaded.program, result.proof).valid, true);
    assert.equal(run(compile(writeLe(result)).program).haltCode, 65);
    assert.equal(writeLe(run(compile('Find every X such that X is a person.').program)), '# No conclusions.\n');
  },

  'or separates alternative premises, each compiled to its own clause with its own order checks'() {
    const loaded = compile('Rex is a cat. Fido is a dog. Tom is a fox and Tom is tame. Every cat or dog is a pet. ' +
      'For every X, if X is a pet or X is a fox and X is tame then X is welcome. Find every X such that X is welcome.');
    assert.deepEqual(run(loaded.program).answers, ["welcome('Rex')", "welcome('Fido')", "welcome('Tom')"]);
    assert.deepEqual(loaded.program.sources.filter((s) => s.kind === 'forward').map((s) => `${write(s.head)} :- ${s.body.map((goal) => write(goal)).join(', ')}`), [
      'pet(X) :- cat(X)', 'pet(X) :- dog(X)', 'welcome(X) :- pet(X)', 'welcome(X) :- fox(X), tame(X)',
    ]);
    assert.deepEqual(run(loadText(loaded.text)).answers, run(loaded.program).answers);
    const constraint = 'For every X, it is impossible that X is a minor and X is a voter or X is barred.';
    assert.equal(run(compile(`Ann is a minor and Ann is a voter. ${constraint}`).program).haltCode, 65);
    assert.equal(run(compile(`Bo is barred. ${constraint}`).program).haltCode, 65);
    assert.notEqual(run(compile(`Ann is a minor. ${constraint}`).program).haltCode, 65);
    for (const [text, pattern] of [
      ['For every X and Y, if X is a cat or p(X, Y) then q(X, Y).', /every alternative of an "or" premise/],
      ['For every X, if X is a cat or it is not known that X is a dog then ok(X).', /X must be supplied/],
      ['Find every X such that X is a cat or X is a dog.', /a question has no "or"/],
    ]) {
      assert.match(errorOf(() => compile(text)), pattern, text);
    }
  },

  'aggregates count, sum and fold distinct combinations, and their proofs check'() {
    // Alice's charge x is both given and derived: one combination, counted once.
    const facts = 'Alice is a member and Bob is a member and Carol is a member. ' +
      'fine(Alice, a, 3). fine(Alice, b, 5). fine(Bob, c, 2). fine(Bob, d, 2.5). a is a loan and b is a loan and c is a loan. ' +
      'charge(Alice, x, 6). For every M, if M is a member and fine(M, a, 3) then charge(M, x, 6). ';
    const rules = [
      'For every M and T, if M is a member and T is the sum of F for every L and F such that fine(M, L, F) then total(M, T).',
      'For every M and N, if M is a member and N is the number of L and F such that (fine(M, L, F) and L is a loan) then loans(M, N).',
      'For every M and B, if M is a member and B is the maximum of F for every L and F such that fine(M, L, F) then most(M, B).',
      'For every M and B, if M is a member and B is the minimum of F for every L and F such that fine(M, L, F) then least(M, B).',
      'For every M and N, if M is a member and N is the number of C and F such that charge(M, C, F) then charges(M, N).',
      'If 2 is the number of L such that L is a loan then twoLoans. If 3 is the number of L such that L is a loan then threeLoans.',
      'Find every M and T such that total(M, T). Find every M and N such that loans(M, N). Find every M and B such that most(M, B).',
      'Find every M and B such that least(M, B). Find every M and N such that charges(M, N). Find whether threeLoans. Find whether twoLoans.',
    ].join(' ');
    const loaded = compile(facts + rules), result = run(loaded.program, { proof: true });
    assert.deepEqual(result.answers, [
      "total('Alice', 8)", "total('Bob', 4.5)", "total('Carol', 0)",
      "loans('Alice', 2)", "loans('Bob', 1)", "loans('Carol', 0)",
      "most('Alice', 5)", "most('Bob', 2.5)", "least('Alice', 3)", "least('Bob', 2)",
      "charges('Alice', 1)", "charges('Bob', 0)", "charges('Carol', 0)", "'threeLoans'",
    ]);
    assert.equal(checkProof(loaded.program, result.proof).valid, true);
    assert.equal(checkProof(loadText(loaded.text), result.proof).valid, true);
    const forged = result.proof.replace("total('Alice', 8)", "total('Alice', 9)");
    assert.notEqual(forged, result.proof);
    assert.equal(checkProof(loaded.program, forged).valid, false);
    // The helpers follow the stated clauses and appear only when used.
    assert.equal(loaded.program.sources.at(-1).kind, 'backward');
    assert.doesNotMatch(compile('Find every X such that X is a cat.').text, /"le:/);
    for (const [text, pattern] of [
      ['For every M and N, if M is a member and N is the number of L such that fine(M, L) and L is a loan then x(M, N).', /belongs to the aggregate/],
      ['For every M and N, if N is the number of L such that fine(M, L) and M is a member then x(M, N).', /M must be supplied by an earlier premise before the aggregate/],
      ['For every M and N, if M is a member and N is the number of M such that p(M) then x(M, N).', /already declared/],
      ['For every S, if S is the sum of V for every L such that fine(L, V) then t(S).', /V must be declared after "for every"/],
      ['For every S, if S is the sum of the value for every L such that fine(L) then t(S).', /needs a variable/],
      ['For every N, if N is the number of L such that fine(L, F) then t(N).', /F is undeclared/],
      ['For every N, if N is the number of L such that (p(L) or q(L)) then t(N).', /expected "\)"/],
      ['Find every N such that N is the number of L such that p(L).', /a question cannot aggregate/],
      ['For every N, if N is the number of L and K such that (p(L) and K is the number of J such that q(L, J)) then t(N).', /cannot contain another aggregate/],
    ]) {
      assert.match(errorOf(() => compile(text)), pattern, text);
    }
    assert.match(errorOf(() => run(compile('p(a). For every N, if N is the number of X such that p(X) then p(N).').program)), /unstratified/);
  },

  'readable witness terms preserve rule, label, arguments and ordinary compounds'() {
    assert.equal(cli(['examples/records-le.le']).stdout, 'Alice is an owner of witness(rule 4, Y, Alice).\n');
    const values = [
      "skolem(4, 'Y', ['Alice'])", "skolem(5, 'Y', ['Alice'])", "skolem(4, 'Z', ['Alice'])",
      "skolem(4, 'Y', ['Bob'])", "skolem(4, 'Y', [])", "skolem(4, 'record label', ['Alice', 2])",
      "skolem(4, 'Y', [skolem(3, 'Z', ['Alice'])])", "witness('rule', 4, 'Y', 'Alice')",
      "skolem(0, 'Y', ['Alice'])", "skolem(4, 'Y', 'open')",
    ];
    for (const value of values) {
      const answer = `owns('Alice', ${value})`, text = writeLe({ answers: [answer] });
      const loaded = compile(text);
      assert.equal(write(loaded.program.sources[0].head), write(readTerm(answer)), text);
      assert.equal(write(loadText(loaded.text).sources[0].head), write(readTerm(answer)), text);
    }
    const quantified = compile('For every Y, owns(Y, witness(rule 4, Y, Y)).');
    assert.equal(write(quantified.program.sources[0].head), "owns(Y, skolem(4, 'Y', [Y]))");
    for (const text of ['owns(Alice, witness(rule 0, Y, Alice)).', 'owns(Alice, witness(rule 1.0, Y, Alice)).',
      'owns(Alice, witness(rule -1, Y, Alice)).']) {
      assert.match(errorOf(() => compile(text)), /positive integer/);
    }
  },

  'conclusions round-trip numbers, lists, compound witnesses, quoted names and variable sharing'() {
    const text = '# Header.\n\n"Every" is a name. "X" is a name. "a.b#c" is a name. ' +
      'data([1, -0.0, 1.0, 9007199254740993, ["quoted name"]], tag(Alice), [] ). ' +
      'For every X, matching(pair(X, X)). Find every X such that X is a name. Find every X and Y and Z such that data(X, Y, Z). ' +
      'Find every X such that matching(X).';
    const loaded = compile(text), result = run(loaded.program);
    assert.deepEqual(run(loadText(loaded.text)).answers, result.answers);
    const output = writeLe(result), read = compile(output);
    const before = result.answers.flatMap((a) => flattenConjunction(readTerm(a))).map((t) => write(t));
    const after = read.program.sources.map((s) => write(s.head));
    assert.deepEqual(after.slice(0, -1), before.slice(0, -1));
    assert.match(output, /For every X0, .*pair.*X0, X0/);
    assert.match(after.at(-1), /matching\(pair\(X0, X0\)\)/);
    assert.equal(run(compile('sunny. Find whether sunny.').program).answers[0], "'sunny'");
  },

  'unsupported syntax and variable mistakes name the source line and the required form'() {
    for (const [text, pattern] of [
      ['# Header\n\nX is a person.', /input.le: line 3:.*undeclared/],
      ['Socrates is a human', /expected "\."/],
      ['Every prime number is odd.', /expected "is"/],
      ['For every X and X, X is human.', /already declared/],
      ['For every X and Y, if X is human then Y is mortal.', /conclusion variable/],
      ['For every X, if X is greater than 0 then X is positive.', /earlier positive premise/],
      ['There exists X such that Alice is a person.', /existential variable/],
      ['For every X, if X is a person then X is the value of 1.', /calculations in a premise/],
    ]) {
      assert.match(errorOf(() => compile(text)), pattern, text);
    }
    assert.match(errorOf(() => compile('For every X, if X is human then X is blocked or X is admitted.')), /expected "\."/);
    assert.match(errorOf(() => compile('item(' + 'f('.repeat(300) + 'Alice' + ')'.repeat(300) + ').')), /256 levels/);
  },

  'input is data and compiled JavaScript cannot execute names or quoted text'() {
    const input = 'eval("globalThis.leExecuted = true"). ' + JSON.stringify('\");globalThis.leExecuted=true;//') + ' is a name. Find every X such that X is a name.';
    delete globalThis.leExecuted;
    const loaded = compile(input);
    const result = run(loadText(loaded.text));
    assert.equal(globalThis.leExecuted, undefined);
    assert.equal(result.answers.length, 1);
    assert.deepEqual(result.answers, run(loaded.program).answers);
    assert.equal(globalThis.leExecuted, undefined);
  },

  'LE files merge, default output is LE and standalone LS and proof workflows agree'() {
    assert.equal(inputKind('Socrates.LE'), 'le');
    const loaded = loadInputs([['Socrates is a human.', 'facts.le'], ['Every human is mortal. Find every X such that X is mortal.', 'rules.le']]);
    const result = run(loaded.program, { proof: true });
    assert.equal(writeLe(result), 'Socrates is a mortal.\n');
    assert.equal(checkProof(loadText(loaded.text), result.proof).valid, true);
    const forged = result.proof.replace("\nmortal('Socrates')\n", "\nmortal('Plato')\n");
    assert.notEqual(forged, result.proof);
    assert.equal(checkProof(loaded.program, forged).valid, false);
    const command = cli(['examples/socrates-le.le']);
    assert.equal(command.code, 0, command.stderr);
    assert.equal(command.stdout, 'Socrates is a mortal.\n');
    assert.equal(cli(['--check-proof', 'examples/proof/socrates-le.js', 'examples/socrates-le.le']).code, 0);
    assert.equal(cli(['--prove-and-check', 'examples/socrates-le.le']).code, 0);
    assert.equal(cli(['--to', 'eyemind', 'examples/socrates-le.le']).stdout, "// Answers: each instance of a query() that holds.\nmortal('Socrates')\n");
    assert.equal(cli(['--to', 'le'], "fact(mortal('Socrates'))\nquery(mortal(X))").stdout, 'Socrates is a mortal.\n');
    assert.match(errorOf(() => loadInputs([['Socrates is human.', 'x.le'], ['fact(p)', 'x.js']])), /takes .le files/);
    assert.match(cli(['--owl2rl', 'examples/socrates-le.le']).stderr, /without RDF logic switches/);
  },
};
