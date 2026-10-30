// Every term has one JavaScript spelling, and reading it back gives the term.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { EyelitError, Struct, Var, readTerm, readTerms, write } from '../src/index.js';
import { listFromItems } from '../src/terms.js';
import { ROOT, assert, throwsMatching } from './helpers.js';

const CASES = [
  "'socrates'", '[]', '0', '-7', '123456789012345678901234567890', '0.1', '-2.5e-07', '1e+22',
  'X', '_G1', "f(X, 'a', [1, 2.0, ...T])", "['a', ...'b']", "struct('hello world', 1)",
  "struct('from', X)", "struct('struct', 1)", "struct('-', 1)", "struct('-', -1)", 'neg(X)', 'pos(X)', 'not(X)',
  'neg(neg(X))', 'sub(X, -1)', 'sub(-1, X)', 'pow(-2, 2)', 'neg(pow(2, 2))', 'pow(2, pow(3, 2))',
  'add(X, mul(Y, Z))', 'and(X, Y, Z)', 'and(X, and(Y, Z))', 'or(X, Y, Z)', 'or(and(X, Y), Z)', 'lt(X, Y)',
  'f(lt(X, Y), [gt(X, Y)])', '"it\'s"', "'say \"hi\"'", "'\\n\\t\\\\'", "'😀'", "struct('[]')", "struct('{}', X)",
  'eq(X, 1)', 'is(X, add(Y, 1))', '[...X]', "struct('and', 'a', 'b', 'c')", '{X: 1, Y: f(2)}',
  'var_name(VAR_VAR__X)', "struct('if', 1)",
];

// One line of each kind from the saved documents of the examples.
function savedLines() {
  const lines = new Map();
  for (const kind of ['output', 'proof', 'check']) {
    const directory = join(ROOT, 'examples', kind);
    for (const file of readdirSync(directory).sort()) {
      for (const line of readFileSync(join(directory, file), 'utf8').split('\n')) {
        if (!line) continue;
        const shape = line.replace(/'[^'\\\n]*'/g, "'a'").replace(/\d+/g, (n) => '0'.repeat(Math.ceil(Math.log2(n.length + 1))));
        if (!lines.has(shape)) lines.set(shape, line);
      }
    }
  }
  return [...lines.values()];
}

export const tests = {
  'edge cases round trip'() {
    for (const text of CASES) {
      const written = write(readTerm(text));
      assert.equal(write(readTerm(written)), written, text);
    }
  },

  'spellings are canonical'() {
    assert.equal(write(readTerm('"it\'s"')), "'it\\'s'");
    assert.equal(write(readTerm('(X)')), 'X');
    assert.equal(write(readTerm('and(and(a, b), c)')), 'and(a, b, c)');
    assert.equal(write(readTerm('and(a, and(b, c))')), 'and(a, and(b, c))');
    assert.equal(write(new Struct('-', [1n])), "struct('-', 1)");
    assert.equal(write(new Struct('neg', [new Var('X')])), 'neg(X)');
    assert.equal(write(readTerm('[...X]')), 'X');
    assert.equal(write(listFromItems([1n, 2n], new Var('T'))), '[1, 2, ...T]');
    assert.equal(write(readTerm('p()')), "'p'");
    assert.equal(write(new Struct('struct', [1n])), "struct('struct', 1)");
    assert.equal(write(new Struct('true', [1n])), "struct('true', 1)");
  },

  'anonymous variables are distinct'() {
    const term = readTerm('f(_, _)');
    assert.notEqual(term.args[0].name, term.args[1].name);
  },

  'nonfinite numeric literals are rejected'() {
    for (const text of ['1e999', '-1e999', 'f(1e+999)', '[1e+999]', 'eq(1e+999, 2e+999)']) {
      throwsMatching(() => readTerm(text), /finite/);
      throwsMatching(() => readTerms(text), /finite/);
    }
  },

  'document reader rejects invalid source characters'() {
    for (const text of ["'a\x00b'", "'a\rb'", 'p(1) ', '\v', ' ']) {
      assert.throws(() => readTerms(text), EyelitError, JSON.stringify(text));
    }
    assert.deepEqual(readTerms('p(1)\r\np(2)\r\n').map(([term, line]) => [write(term), line]), [['p(1)', 1], ['p(2)', 2]]);
  },

  'long integers read and write exactly'() {
    const digits = '9'.repeat(5000);
    const [[term]] = readTerms(`p(${digits})`);
    assert.equal(term.args[0], 10n ** 5000n - 1n);
    assert.equal(write(term), `p(${digits})`);
  },

  'nonfinite literals are reported at their line'() {
    throwsMatching(() => readTerms('p(1)\np(1e999)'), /^line 2: a float term must be finite/);
    throwsMatching(() => readTerms('p()\n'.repeat(513) + 'p(1e999)'), /^line 514: a float term must be finite/);
  },

  'only term syntax is read'() {
    for (const text of ["os.system('x')", 'f(X = 1)', 'f(...X)', '(1, 2)', '{...X}', '() => 1', 'X === Y',
      '1 < 2', '[...X, 1]', 'null', 'true', 'undefined', 'NaN', 'f()()', 'X + Y', '!X', '`x`', '/x/', '0x10',
      '1_000', 'new f()', 'x[0]', 'X ? Y : Z', 'struct()', 'struct(1, 2)', '$x']) {
      assert.throws(() => readTerm(text), EyelitError, text);
    }
    assert.throws(() => readTerms('x = 1\n'), EyelitError);
    assert.throws(() => readTerms('const x = 1\n'), EyelitError);
  },

  'large documents keep line numbers and anonymous names'() {
    const read = readTerms(Array.from({ length: 600 }, () => 'f(_, _)\n').join('\n'));
    assert.equal(read.length, 600);
    assert.deepEqual(read.slice(0, 2).map(([, line]) => line), [1, 3]);
    const names = new Set(read.flatMap(([term]) => term.args.map((arg) => arg.name)));
    assert.equal(names.size, 1200);
    const multiline = readTerms('p()\n'.repeat(511) + 'f(\n X)\n');
    assert.deepEqual(multiline.slice(-1).map(([term, line]) => [write(term), line]), [['f(X)', 512]]);
  },

  'saved documents read back to their own spelling'() {
    const lines = savedLines();
    const read = readTerms(lines.join('\n'));
    assert.equal(read.length, lines.length);
    // Bindings are written as an object, which reads as a list of = pairs.
    lines.forEach((line, i) => { if (!line.startsWith('step(')) assert.equal(write(read[i][0]), line); });
  },
};
