import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EyemindError, VERSION, readTerm } from '../src/index.js';
import { main } from '../src/cli.js';
import { ROOT, assert, cli, command } from './helpers.js';

const SOCRATES = "// Answers: each instance of a query() that holds.\ntype('socrates', 'mortal')\ntype('socrates', 'human')\n";

export const tests = {
  'the package exposes the eyemind command and error'() {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    assert.equal(pkg.name, 'eyemind');
    assert.deepEqual(pkg.bin, { eyemind: 'bin/eyemind.js' });
    assert.equal(command(['--help']).code, 0);
    assert.match(command(['--help']).stdout, /^Usage: eyemind /);
    assert.throws(() => readTerm('('), (error) => error instanceof EyemindError && error.name === 'EyemindError');
  },

  'runs files stdin multiple sources and goals'() {
    assert.equal(cli(['examples/socrates.js']).stdout, SOCRATES);
    assert.equal(cli([], "fact(p('a'))\nimplies(p(X), q(X))\n").stdout,
      "// Conclusions: the facts the program derives, in the order derived.\nq('a')\n");
    const result = cli(['examples/socrates.js', '-', '--goal', "type(X, 'mortal')"], "fact(type('plato', 'human'))\n");
    assert.equal(result.stdout,
      "// Answers: each instance of a goal that holds.\ntype('socrates', 'mortal')\ntype('plato', 'mortal')\n", result.stderr);
  },

  'output written by main goes through the io it is given'() {
    const out = [];
    assert.equal(main(['--help'], { stdout: (text) => out.push(text), stderr: () => {}, stdin: () => '', readFile: () => '' }), 0);
    assert.match(out.join(''), /^Usage: eyemind/);
  },

  'proof generation pipes into proof checking'() {
    // Two processes of the command, the proof the first writes read by the
    // second from its standard input.
    const generated = command(['--proof', 'examples/socrates.js']);
    assert.equal(generated.code, 0, generated.stderr);
    const checked = command(['--check-proof', '-', 'examples/socrates.js'], generated.stdout);
    assert.equal(checked.code, 0, checked.stderr);
    assert.ok(checked.stdout.includes("condition('C1', 'resolution', 'ok', 3)\n"));
    assert.ok(checked.stdout.includes("verdict('checked')\n"));
    const asJson = cli(['--json', '--check-proof', '-', 'examples/socrates.js'], generated.stdout);
    assert.equal(asJson.code, 0);
    assert.ok(JSON.parse(asJson.stdout).valid);
    assert.equal(JSON.parse(asJson.stdout).conditions.length, 8);
    assert.equal(cli(['--check-proof', '-', 'examples/socrates.js'], `${generated.stdout}bogus()\n`).code, 2);
  },

  'prove-and-check generates checked answers from files stdin and goals'() {
    const proof = readFileSync(join(ROOT, 'examples/proof/socrates.js'), 'utf8');
    for (const [args, stdin] of [
      [['examples/socrates.js'], ''],
      [[], "fact(p('a'))\nquery(p(X))"],
      [['examples/socrates.js', '--json'], ''],
      [['examples/socrates.js', '--goal', "type(X, 'mortal')"], ''],
      [['examples/permissions.js', '--strict-proof'], ''],
    ]) assert.deepEqual(cli(['-c', ...args], stdin), cli(['--prove-and-check', ...args], stdin));
    assert.equal(command(['-c', 'examples/socrates.js']).code, 0);
    assert.equal(cli(['-c', 'examples/socrates.js']).stdout,
      cli(['--check-proof', '-', 'examples/socrates.js'], proof).stdout);
    // The check report shows the same answers under its own heading.
    assert.equal(cli(['-c', 'examples/socrates.js']).stdout.split('\n').slice(1, 3).join('\n') + '\n',
      SOCRATES.slice(SOCRATES.indexOf('\n') + 1));
    assert.equal(cli(['-c'], "fact(p('a'))\nquery(p(X))").code, 0);
    assert.deepEqual(JSON.parse(cli(['-c', '--json', 'examples/socrates.js']).stdout).answers,
      ["type('socrates', 'mortal')", "type('socrates', 'human')"]);
    assert.equal(cli(['-c', '--strict-proof', 'examples/permissions.js']).code, 2);
    assert.equal(cli(['-c', 'examples/integrity.js']).code, 65);
    assert.equal(JSON.parse(cli(['-c', '--stats', 'examples/socrates.js']).stderr).derived, 1);
    for (const args of [['-p'], ['--check-proof', 'examples/proof/socrates.js'], ['--unused']]) {
      assert.equal(cli(['-c', ...args, 'examples/socrates.js']).code, 1);
    }
  },

  'both help flags list every long option and every short alias'() {
    const help = cli(['--help']);
    assert.deepEqual(cli(['-h']), help);
    assert.equal(help.code, 0);
    assert.equal(help.stderr, '');
    assert.deepEqual([...help.stdout.matchAll(/^(?:  -[a-z], |      )(--[a-z-]+)/gm)].map((match) => match[1]), [
      '--proof', '--prove-and-check', '--check-proof', '--json', '--goal', '--strict-proof', '--unused', '--stats',
      '--max-depth', '--max-iterations', '--max-inferences', '--version', '--help',
    ]);
    for (const [short, long] of [['-p', '--proof'], ['-c', '--prove-and-check'], ['-v', '--version'], ['-h', '--help']]) {
      assert.ok(help.stdout.includes(`${short}, ${long}`));
    }
  },

  'a proof document given as a program says how to check it'() {
    const ran = cli(['examples/proof/socrates.js']);
    assert.equal(ran.code, 1);
    assert.ok(ran.stderr.includes('this is a proof document, not a program: check it with --check-proof PROOF PROGRAM'), ran.stderr);
    assert.ok(cli([], "fact(struct('clause', 'a', 'b'))\n").stderr.includes('reserved head clause/2'));
  },

  'prints the version'() {
    for (const [flag, ran] of [['-v', command], ['--version', cli]]) {
      const result = ran([flag, 'examples/socrates.js']);
      assert.equal(result.code, 0);
      assert.equal(result.stdout, `eyemind v${VERSION}\n`);
    }
  },

  'the version agrees everywhere it is written'() {
    assert.equal(JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version, VERSION);
    const checked = spawnSync(process.execPath, [join(ROOT, 'tools', 'version.js'), '--check'], { encoding: 'utf8' });
    assert.equal(checked.status, 0, checked.stderr);
  },

  'lists the clauses that make no difference'() {
    const source = "fact(p('a'))\nfact(q('b'))\nimplied_by(s(X), q(X))\nfact(z('c'))\nimplies([p('a'), not(s('a'))], ok)\n";
    const result = cli(['--unused'], source);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(result.stdout, "unused(line(2), fact(q('b')))\nunused(line(3), implied_by(s(X), q(X)))\n" +
      "unused(line(4), fact(z('c')))\n");
    assert.equal(cli(['--unused', 'examples/socrates.js']).stdout, '');
    assert.equal(cli(['--unused', '--proof', 'examples/socrates.js']).code, 1);
  },

  'help errors stats and fuse exit codes'() {
    assert.ok(cli(['--help']).stdout.includes('Usage: eyemind'));
    assert.equal(cli(['--unknown']).code, 1);
    assert.equal(cli(['--max-depth', '0']).code, 1);
    assert.equal(cli(['--check-proof', '-']).code, 1);
    assert.equal(cli([], "fact('p')\ncontradiction('p')\n").code, 65);
    assert.equal(JSON.parse(cli(['--stats', 'examples/socrates.js']).stderr).derived, 1);
  },

  'command line reasoning bounds reject overflow and unsafe integers'() {
    for (const option of ['--max-depth', '--max-iterations', '--max-inferences']) {
      for (const value of ['0', '-1', '1.5', 'Infinity', '9007199254740992', '9'.repeat(400)]) {
        const result = cli([option, value], '');
        assert.equal(result.code, 1);
        assert.equal(result.stdout, '');
        assert.equal(result.stderr, `eyemind: ${option} needs a positive safe integer\n`);
      }
    }
  },

  'failed and strict checks print verdicts and exit unsuccessfully'() {
    const failed = cli(['--check-proof', '-', '--goal', 'is(7, add(2, 3))', 'examples/socrates.js'],
      "is(7, add(2, 3))\nstep(is(7, add(2, 3)), 'builtin', {}, [])\n");
    assert.equal(failed.code, 2);
    assert.equal(failed.stderr, '');
    assert.ok(failed.stdout.includes("condition('C5', 're_decision', failed(1), 0)\n"));
    assert.ok(failed.stdout.includes("failure('C5', is(7, add(2, 3)),"));
    assert.ok(failed.stdout.includes('verdict(failed(1))\n'));
    const strictly = cli(['--strict-proof', '--check-proof', 'examples/proof/permissions.js', 'examples/permissions.js']);
    assert.equal(strictly.code, 2);
    assert.ok(strictly.stdout.includes("obligation('absent', 'theory_scoped',"));
    assert.ok(strictly.stdout.includes('verdict(failed('));
    assert.equal(cli(['--json', 'examples/socrates.js']).code, 1);
  },
};
