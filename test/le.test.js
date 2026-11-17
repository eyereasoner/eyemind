import { assert, cli, errorOf } from './helpers.js';
import { checkProof, compileLe, loadText, readTerm, run, write, writeLe } from '../src/index.js';
import { inputKind, loadInputs } from '../src/formats.js';
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
