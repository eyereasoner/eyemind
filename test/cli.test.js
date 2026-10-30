import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { VERSION } from '../src/index.js';
import { main } from '../src/cli.js';
import { ROOT, assert, cli } from './helpers.js';

const SOCRATES = "type('socrates', 'mortal')\ntype('socrates', 'human')\n";

export const tests = {
  'runs files stdin multiple sources and goals'() {
    assert.equal(cli(['examples/socrates.js']).stdout, SOCRATES);
    assert.equal(cli([], "fact(p('a'))\nimplies(p(X), q(X))\n").stdout, "q('a')\n");
    const result = cli(['examples/socrates.js', '-', '--goal', "type(X, 'mortal')"], "fact(type('plato', 'human'))\n");
    assert.equal(result.stdout, "type('socrates', 'mortal')\ntype('plato', 'mortal')\n", result.stderr);
  },

  'output written by main goes through the io it is given'() {
    const out = [];
    assert.equal(main(['--help'], { stdout: (text) => out.push(text), stderr: () => {}, stdin: () => '', readFile: () => '' }), 0);
    assert.match(out.join(''), /^Usage: eyelit/);
  },

  'proof generation pipes into proof checking'() {
    const generated = cli(['--proof', 'examples/socrates.js']);
    assert.equal(generated.code, 0, generated.stderr);
    const checked = cli(['--check-proof', '-', 'examples/socrates.js'], generated.stdout);
    assert.equal(checked.code, 0, checked.stderr);
    assert.ok(checked.stdout.includes("condition('C1', 'resolution', 'ok', 3)\n"));
    assert.ok(checked.stdout.includes("verdict('checked')\n"));
    const asJson = cli(['--json', '--check-proof', '-', 'examples/socrates.js'], generated.stdout);
    assert.equal(asJson.code, 0);
    assert.ok(JSON.parse(asJson.stdout).valid);
    assert.equal(JSON.parse(asJson.stdout).conditions.length, 7);
    assert.equal(cli(['--check-proof', '-', 'examples/socrates.js'], `${generated.stdout}bogus()\n`).code, 2);
  },

  'a proof document given as a program says how to check it'() {
    const ran = cli(['examples/proof/socrates.js']);
    assert.equal(ran.code, 1);
    assert.ok(ran.stderr.includes('this is a proof document, not a program: check it with --check-proof PROOF PROGRAM'), ran.stderr);
    assert.ok(cli([], "fact(struct('clause', 'a', 'b'))\n").stderr.includes('reserved head clause/2'));
  },

  'prints the version'() {
    for (const flag of ['-v', '--version']) {
      const result = cli([flag, 'examples/socrates.js']);
      assert.equal(result.code, 0);
      assert.equal(result.stdout, `eyelit v${VERSION}\n`);
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
    assert.ok(cli(['--help']).stdout.includes('Usage: eyelit'));
    assert.equal(cli(['--unknown']).code, 1);
    assert.equal(cli(['--max-depth', '0']).code, 1);
    assert.equal(cli(['--check-proof', '-']).code, 1);
    assert.equal(cli([], "fact('p')\ncontradiction('p')\n").code, 65);
    assert.equal(JSON.parse(cli(['--stats', 'examples/socrates.js']).stderr).derived, 1);
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
