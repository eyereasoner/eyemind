// Stating programs: names a program uses without defining them are supplied.
import { loadText, run } from '../src/index.js';
import { assert, program, throwsMatching } from './helpers.js';

export const tests = {
  'socrates without declarations'() {
    const source = program(`
fact(type('socrates', 'human'))
fact(subclass_of('human', 'mortal'))
implies([type(S, A), subclass_of(A, B)], type(S, B))
query(type(X, Y))
`);
    assert.deepEqual(run(source).answers, ["type('socrates', 'mortal')", "type('socrates', 'human')"]);
  },

  'helper functions see the implicit names'() {
    const source = program(`
function chain(n) {
  for (let i = 0; i < n; i++) fact(edge(i, i + 1))
}
chain(3)
implies(edge(X, Y), path(X, Y))
implies([path(X, Y), edge(Y, Z)], path(X, Z))
query(path(0, W))
`);
    assert.deepEqual(run(source).answers, ['path(0, 1)', 'path(0, 2)', 'path(0, 3)']);
  },

  'local parameters do not suppress implicit globals'() {
    assert.deepEqual(run(program('function state(X) { fact(p(X)) }\nstate(1)\nquery(p(X))')).answers, ['p(1)']);
  },

  'predicate names work as atoms and in arithmetic'() {
    const source = program("fact(ready)\nquery(is(V, add(mul(2, pi), sqrt(4))), not(blocked), ready)");
    assert.deepEqual(run(source).answers, ["and(is(8.283185307179586, add(mul(2, 'pi'), sqrt(4))), not('blocked'), 'ready')"]);
  },

  'capitalized JavaScript globals are variables'() {
    assert.deepEqual(run(program('fact(answer(42))\nquery(answer(Map))')).answers, ['answer(42)']);
    assert.deepEqual(run(program('fact(answer(42))\nquery(answer(Date))')).answers, ['answer(42)']);
  },

  'explicit declarations still work'() {
    const source = program("const range = preds('range')\nconst [N, M] = vars('N M')\nfact(range(1, 3))\nquery(range(1, N))");
    assert.deepEqual(run(source).answers, ['range(1, 3)']);
  },

  'kept globals keep their JavaScript meaning'() {
    assert.deepEqual(run(program('fact(p(Math.max(2, 3), parseInt("7")))\nquery(p(X, Y))')).answers, ['p(3, 7)']);
  },

  'clauses know the line that states them'() {
    const lines = ['', 'function state(n) {', '  fact(n_(n))', '}', ''];
    for (let i = 0; i < 2000; i++) lines.push(`fact(p(${i}))`);
    lines.push('state(1)', 'implied_by(', '  q(X),', '  p(X),', ')');
    const { clauses } = loadText(`${lines.join('\n')}\n`);
    assert.deepEqual(clauses.slice(0, 2).map((clause) => clause.line), [6, 7]);
    assert.equal(clauses[1999].line, 2005);
    assert.equal(clauses[2000].line, 3); // stated inside state()
    assert.equal(clauses[2001].line, 2007);
  },

  'statement lines survive strings, comments, templates and regular expressions'() {
    const source = [
      "fact(p('fact(1)'), p(\"implies(\"))",                      // 1
      '// fact(p(2))',                                             // 2
      '/* query(p(3)) */ fact(p(`fact(${1 + 2})`))',                // 3
      'const pattern = /fact\\(/',                                 // 4
      "fact(p(pattern.test('fact(') ? 'yes' : 'no'))",               // 5
      'const helper = { fact: (n) => n }',                         // 6
      'fact(p(helper.fact(7)))',                                    // 7
      'function state(n) { fact(q(n)) }',                           // 8
      'state(9)',                                                   // 9
    ].join('\n');
    const program = loadText(source);
    assert.deepEqual(program.clauses.map((clause) => clause.line), [1, 1, 3, 5, 7, 8]);
    assert.deepEqual(run(program, { goal: 'p(X)' }).answers,
      ["p('fact(1)')", "p('implies(')", "p('fact(3)')", "p('yes')", 'p(7)']);
  },

  'a method named like a statement still runs, with its lines'() {
    const program = loadText("const helper = { fact(n) { return n } }\nfact(p(helper.fact(2)))");
    assert.deepEqual(program.clauses.map((clause) => clause.line), [2]);
    assert.deepEqual(run(program, { goal: 'p(X)' }).answers, ['p(2)']);
  },

  'a misspelled statement is an error'() {
    throwsMatching(() => program('fact(p(1))\nfcat(p(2))'), /line 2: fcat\(\.\.\.\) on its own states nothing/);
  },

  'operators on terms are errors that say what to write'() {
    throwsMatching(() => program('implies([q(X), X > 1], p(X))'), /gt\(X, 1\) rather than X > 1/);
    throwsMatching(() => program('implies(q(X), p(X + 1))'), /add\(X, 1\) rather than X \+ 1/);
  },
};
