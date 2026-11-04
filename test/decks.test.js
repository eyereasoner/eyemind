// Deck claims are checked against the saved artifacts; the corpus tests
// independently reproduce those artifacts and check their proofs.
import { readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { checkProof, loadText, readGoal, readTerm, readTerms, run, write } from '../src/index.js';
import { main } from '../src/cli.js';
import { nodeIO } from '../src/node.js';
import { Env, properListItems, unify } from '../src/terms.js';
import { shellSplit } from '../conformance/run.js';
import { readManifest } from '../tools/corpus.js';
import { ROOT, assert } from './helpers.js';

const MANIFEST = readManifest();
const PROSE_GOALS = new Set(['gcd-bezout-identity', 'pell-equation', 'binomial-vandermonde', 'hamming-code']);
const read = (path) => readFileSync(join(ROOT, 'examples', path), 'utf8');
const deck = (name) => read(`deck/${name}.md`);
const terms = (text) => readTerms(text).map(([term]) => term);
const output = (name) => terms(read(`output/${name}.js`));
const answers = (name) => output(name).map((term) => write(term));

function section(text, heading) {
  const marker = `## ${heading}\n`;
  assert.ok(text.includes(marker), `missing deck section: ${heading}`);
  return text.split(marker)[1].split(/\n## /)[0];
}

function blocks(text, language) {
  return [...text.matchAll(new RegExp(`^\`\`\`${language}\\n([\\s\\S]*?)^\`\`\``, 'gm'))].map((match) => match[1]);
}

function checkSnippets(name, snippets) {
  const actual = new Set(answers(name));
  let count = 0;
  for (const snippet of snippets) {
    const clean = snippet.replace(/^\s*\/\/[^\n]*$/gm, '')
      .replace(/[ \t]+\/\/[^\n]*/g, (comment) => /…|\.\.\./.test(comment) ? ' …' : '').trim();
    if (/…|\.\.\.(?![A-Za-z_])/.test(clean)) {
      // Explicit ellipses abbreviate a displayed term. Every visible part
      // must still match one whole conclusion, including its prefix and end.
      for (const claim of clean.split(/\n(?=[a-z_][a-z0-9_]*\()/)) {
        const pattern = claim.replace(/\n\s*/g, ' ').trim().split(/…|\.\.\.(?![A-Za-z_])/)
          .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
        assert.ok([...actual].some((answer) => new RegExp(`^${pattern}$`).test(answer)), `${name}: ${claim}`);
        count++;
      }
    } else {
      for (const claim of terms(clean)) {
        assert.ok(actual.has(write(claim)), `${name}: ${write(claim)} is not a conclusion`);
        count++;
      }
    }
  }
  assert.ok(count, `${name}: no displayed conclusions checked`);
}

function proofCard(text) {
  const heading = text.match(/^## (?:Checked\b[^\n]*|What the proof establishes)\n/m);
  assert.ok(heading, 'missing proof-checking card');
  return text.slice(heading.index).split('\n## Try it')[0];
}

// Interpret only the commands the decks document, with redirected files
// held in memory. Never run the Markdown as a shell script.
function deckCommand(args, files) {
  const out = [], err = [];
  const code = main(args, {
    ...nodeIO,
    readFile: (path) => files.get(path) ?? readFileSync(isAbsolute(path) ? path : join(ROOT, path), 'utf8'),
    stdin: () => '', stdout: (text) => out.push(text), stderr: (text) => err.push(text),
  });
  return { code, stdout: out.join(''), stderr: err.join('') };
}

function rows(text) {
  return text.split('\n').filter((line) => line.startsWith('|')).slice(2)
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim().replaceAll('−', '-')));
}

function changed(name, edit, goal) {
  const source = read(`${name}.js`);
  const edited = edit(source);
  assert.notEqual(edited, source, `${name}: the suggested edit changed nothing`);
  return run(loadText(edited), { goal }).answers;
}

// The four extra goals have answers described in the following prose.
// Read the numbers from that prose so a stale explanation fails too.
function goalAnswer(name, goal, text) {
  if (name === 'gcd-bezout-identity') {
    const [, g, s, t] = text.match(/gives G = (\d+), S = (−?\d+) and T = (−?\d+)/) ?? [];
    assert.ok(g, 'missing Bezout coefficients');
    return `bezout(${goal.args[0]}, ${goal.args[1]}, ${g}, ${s.replace('−', '-')}, ${t.replace('−', '-')})`;
  }
  if (name === 'pell-equation') {
    const [, x, y] = text.match(/The answer is \((\d+), (\d+)\)/) ?? [];
    assert.ok(x, 'missing Pell solution');
    return `pell(${goal.args[0]}, ${x}, ${y})`;
  }
  if (name === 'binomial-vandermonde') {
    const [, sum] = text.match(/The sum is (\d+)/) ?? [];
    assert.ok(sum, 'missing Vandermonde sum');
    return `vandermonde(${goal.args.slice(0, 3).join(', ')}, ${sum})`;
  }
  assert.equal(name, 'hamming-code', 'a new goal needs its documented answer checked');
  const [, syndrome] = text.match(/The syndrome is (\d+)/) ?? [];
  assert.ok(syndrome, 'missing Hamming syndrome');
  assert.match(text, /all-zero word and payload/);
  return `decode(${write(goal.args[0])}, ${syndrome}, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0])`;
}

function checkAssessmentTable(name, text) {
  const portal = name === 'research-portal';
  const table = rows(section(text, portal ? 'The eleven sessions' : 'The eight cancellations'));
  const assessments = output(name).filter((term) => term.name === 'assessment');
  assert.equal(table.length * 2, assessments.length);
  const modes = portal ? ['in_force', 'omnibus_proposal'] : ['directive_2015', 'revised_2026'];
  const money = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const label = (result) => {
    if (portal) {
      if (result.name === 'permit') return 'go ahead';
      if (result.name === 'await_device_consent') return 'wait for consent';
      if (result.name === 'deny_device') return 'blocked';
      assert.equal(result.name, 'deny_policy');
      if (result.args[0]?.name === 'prohibited_by') return 'refused (forbidden)';
      return result.args[0] === 'no_matching_permission' ? 'refused (no permission)' : 'refused';
    }
    if (result.name === 'pay_fee') {
      const refund = result.args[2].args[0];
      return `fee €${money(result.args[1].args[0])}, ${refund ? `€${money(refund)} back` : 'nothing back'}`;
    }
    if (result.name === 'refund') return `free, €${money(result.args[0])} back`;
    if (result.name === 'voucher') return result.args[1].name === 'terms' ? 'voucher, on agreed terms' : 'voucher with guarantees';
    assert.equal(result.name, 'refused_by_terms');
    return 'refused by the terms';
  };
  for (const [id, , before, after] of table) {
    const cases = modes.map((mode) => assessments.find((term) => term.args[0] === mode && term.args[1] === `${portal ? 'ex:' : ''}${id}`));
    assert.ok(cases.every(Boolean), id);
    assert.equal(before.replaceAll('**', ''), label(cases[0].args[2]), id);
    if (after === 'the same') assert.equal(write(cases[1].args[2]), write(cases[0].args[2]), id);
    else assert.equal(after.replaceAll('**', ''), label(cases[1].args[2]), id);
  }
}

function checkRouteLabels(text) {
  const label = (airport) => airport === 'Václav Havel Airport Prague' ? 'Prague'
    : airport === 'Diagoras Airport' ? 'Diagoras Airport (Rhodes)' : airport.replace(/(?: International)? Airport$/, '');
  const expected = output('path-discovery').map((term) => properListItems(term.args[3], new Env()).map(label).join(' → '));
  assert.deepEqual(blocks(text, 'text')[0].trim().split('\n'), expected);
}

function checkQueenBoard(text) {
  const columns = properListItems(output('queens')[0].args[0].args[1], new Env());
  const board = columns.map((column) => columns.map((_, i) => BigInt(i + 1) === column ? 'Q' : '.').join(' '));
  assert.deepEqual(blocks(text, 'text')[0].trim().split('\n'), board);
}

export const tests = {
  'abbreviated conclusions still reject incorrect visible terms and digits'() {
    checkSnippets('ackermann', ['ackermann([4, 2], 2003529930406846464979072351560255750447825475569751419265016973710894…)']);
    assert.throws(() => checkSnippets('ackermann', ['ackermann([4, 2], 999999…)']), /ackermann/);
    assert.throws(() => checkSnippets('data-value-right', ["evaluation('autonomous_right', [...], [unaddressed('value_share')])"]),
      /data-value-right/);
    assert.throws(() => checkSnippets('symbolic-derivative', ["derivative('square', sub(…, …))"]), /symbolic-derivative/);
  },

  'every deck links its own program artifacts and playground example'() {
    for (const { name } of readManifest()) {
      const links = new Set([...deck(name).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]));
      for (const file of [`${name}.js`, `output/${name}.js`, `proof/${name}.js`, `check/${name}.js`]) {
        assert.ok(links.has(`https://github.com/eyereasoner/eyemind/blob/main/examples/${file}`), `${name}: ${file}`);
      }
      assert.ok(links.has(`https://eyereasoner.github.io/eyemind/playground#example=${name}`), name);
    }
  },

  'the battery deck table is a feasible optimum with the stated per-slot costs'() {
    const text = deck('battery-dispatch');
    const table = rows(section(text, 'What eyemind concludes'));
    assert.equal(table.length, 4);
    const program = loadText(read('battery-dispatch.js'));
    const [, initial] = text.match(/starts with (\d+) kWh/) ?? [];
    assert.ok(initial);
    assert.deepEqual(run(program, { goal: `initial_charge_kwh(${initial})` }).answers, [`initial_charge_kwh(${initial})`]);
    let charge = initial;
    let total = 0n;
    const dispatches = [];
    for (const [time, power, grid, next, cost] of table) {
      const goal = `transition(${time}, ${charge}, ${power}, ${next}, ${grid}, ${cost})`;
      assert.deepEqual(run(program, { goal }).answers, [goal]);
      dispatches.push(`dispatch(${time}, ${power}, ${grid}, ${next})`);
      total += BigInt(cost);
      charge = next;
    }
    assert.deepEqual(answers('battery-dispatch'), [`best_dispatch([${dispatches.join(', ')}], ${total})`]);
    const [, cents] = text.match(/costs \*\*(\d+) cents\*\*/) ?? [];
    assert.equal(cents, String(total));
  },

  'the school deck table and named audit flags match the conclusions'() {
    const text = deck('school-placement-audit');
    const table = rows(section(text, 'What eyemind concludes'));
    const actual = output('school-placement-audit');
    assert.deepEqual(table.map(([student, school]) => `provisional('${student.toLowerCase()}', '${school.toLowerCase()}')`).sort(),
      actual.filter((term) => term.name === 'provisional').map((term) => write(term)).sort());
    assert.deepEqual(table.map(([student, , school, score]) => `recommended('${student.toLowerCase()}', '${school.toLowerCase()}', ${score})`).sort(),
      actual.filter((term) => term.name === 'recommended').map((term) => write(term)).sort());
    const [, named] = text.match(/\n([A-Z][a-z]+, [A-Z][a-z]+ and [A-Z][a-z]+) each receive both audit flags/) ?? [];
    assert.ok(named);
    const expected = named.split(/, | and /).flatMap((name) => ['walking_limit_exceeded', 'assignment_differs']
      .map((reason) => `audit_flag('${name.toLowerCase()}', '${reason}')`));
    assert.deepEqual(actual.filter((term) => term.name === 'audit_flag').map((term) => write(term)).sort(), expected.sort());
    const [, unflagged] = text.match(/([A-Z][a-z]+) receives neither/) ?? [];
    assert.ok(unflagged);
    assert.ok(!actual.some((term) => term.name === 'audit_flag' && term.args[0] === unflagged.toLowerCase()));
  },

  'the Pell deck preserves every digit of its large solution'() {
    const text = section(deck('pell-equation'), 'What eyemind concludes');
    const [, step] = text.match(/At step (\d+):/) ?? [];
    const [, x, y] = blocks(text, 'text')[0].match(/^x = (\d+)\ny = (\d+)\n$/) ?? [];
    assert.ok(step && x && y);
    assert.ok(answers('pell-equation').includes(`solution(${step}, ${x}, ${y})`));
  },

  'the outage deck edit removes the independent support for its dependency cycle'() {
    const text = section(deck('service-outage-recovery'), 'Try it');
    const [, from, to] = text.match(/state from `'(\w+)'` to `'(\w+)'`/) ?? [];
    assert.ok(from && to);
    assert.deepEqual(changed('service-outage-recovery',
      (source) => source.replace(`node('risk_cache', '${from}', [])`, `node('risk_cache', '${to}', [])`), 'best_repair(Plan, Cost)'), []);
  },

  'the critical-path deck edit keeps the finish time and adds the tied branch'() {
    const text = section(deck('critical-path-schedule'), 'Try it');
    const [, from, to] = text.match(/duration from (\d+) to (\d+)/) ?? [];
    assert.ok(from && to);
    const edit = (source) => source.replace(`task('frontend', ${from},`, `task('frontend', ${to},`);
    const [, finish] = text.match(/finish time remains (\d+)/) ?? [];
    assert.ok(finish);
    assert.deepEqual(changed('critical-path-schedule', edit, 'project_finish(Finish)'), [`project_finish(${finish})`]);
    assert.match(text, /nine critical tasks/);
    assert.equal(changed('critical-path-schedule', edit, 'critical_task(Task)').length, 9);
  },

  'the battery deck edits change the optimum in the stated directions'() {
    const text = section(deck('battery-dispatch'), 'Try it');
    const [, from, raised] = text.match(/charge from (\d+) to (\d+) kWh/) ?? [];
    const [, lowered] = text.match(/Lowering that requirement to (\d+)/) ?? [];
    assert.ok(from && raised && lowered);
    const cost = (charge) => {
      const result = changed('battery-dispatch', (source) => source.replace(`final_charge_kwh(${from})`, `final_charge_kwh(${charge})`),
        'best_dispatch(Plan, Cost)');
      assert.equal(result.length, 1);
      return readTerm(result[0]).args[1];
    };
    const baseline = output('battery-dispatch')[0].args[1];
    assert.ok(cost(raised) > baseline);
    assert.ok(cost(lowered) < baseline);
  },

  'the cold-chain deck edit leaves only batch B in the uncommitted tail'() {
    const text = section(deck('cold-chain-recall'), 'Try it');
    const [, next] = text.match(/checkpoint to (\d+)/) ?? [];
    assert.ok(next);
    const edit = (source) => source.replace(/checkpoint\(\d+\)/, `checkpoint(${next})`);
    assert.deepEqual(changed('cold-chain-recall', edit, 'selected_reading(Id, Batch, Temperature)'),
      ["selected_reading('logger_b', 'batch_b', 75)"]);
    assert.deepEqual(changed('cold-chain-recall', edit, 'quarantine(Batch, Evidence)'), []);
    assert.deepEqual(changed('cold-chain-recall', edit, 'inspection_task(Batch, Evidence, Task)'), []);
  },

  'the school deck edit makes the provisional choice equally good'() {
    const text = section(deck('school-placement-audit'), 'Try it');
    const [, walk, rank] = text.match(/route to (\d+) m and preference rank (\d+)/) ?? [];
    assert.ok(walk && rank);
    const edit = (source) => source.replace("'centrum', 600, 3600, 2", `'centrum', 600, ${walk}, ${rank}`);
    assert.deepEqual(changed('school-placement-audit', edit, "recommended('ada', School, Score)"),
      [`recommended('ada', 'centrum', ${walk})`, `recommended('ada', 'lindholmen', ${walk})`]);
    assert.deepEqual(changed('school-placement-audit', edit, "audit_flag('ada', Reason)"), []);
  },

  'the regression deck edit produces a different fit'() {
    const text = section(deck('least-squares-regression'), 'Try it');
    const [, oldX, oldY, x, y] = text.match(/point from \((\d+), (\d+)\) to \((\d+), (\d+)\)/) ?? [];
    assert.ok(oldX && oldY && x && y);
    assert.deepEqual(changed('least-squares-regression',
      (source) => source.replace(`point(${oldX}, ${oldY})`, `point(${x}, ${y})`), "fit('demo', Slope, Intercept, R2)"),
    ["fit('demo', 1.4, 0.5, 0.98)"]);
  },
};

for (const entry of MANIFEST) {
  const { name } = entry;
  tests[`${name} deck displayed conclusions agree with its artifacts`] = () => {
    const text = deck(name);
    if (name === 'battery-dispatch') return tests['the battery deck table is a feasible optimum with the stated per-slot costs']();
    if (name === 'school-placement-audit') return tests['the school deck table and named audit flags match the conclusions']();
    const heading = name === 'research-portal' ? 'What the proposal changes'
      : name === 'package-holiday' ? 'What the revision changes' : 'What eyemind concludes';
    const conclusions = section(text, heading);
    if (name === 'path-discovery') return checkRouteLabels(conclusions);
    const snippets = blocks(conclusions, 'js');
    if (name === 'least-squares-regression') snippets.push(...blocks(section(text, 'Rejection is an answer too'), 'js'));
    checkSnippets(name, snippets);
    if (name === 'research-portal' || name === 'package-holiday') checkAssessmentTable(name, text);
    if (name === 'queens') checkQueenBoard(conclusions);
  };

  tests[`${name} deck verdict agrees with its check report`] = () => {
    const text = proofCard(deck(name));
    const verdict = terms(read(`check/${name}.js`)).find((term) => term.name === 'verdict').args[0];
    const stated = text.match(/\*\*(checked(?:_with_obligations| with obligations)?)\*\*/)?.[1]
      ?? text.match(/verdict\('(checked(?:_with_obligations)?)'\)/)?.[1];
    assert.ok(stated, `${name}: no verdict stated`);
    assert.equal(stated.replaceAll(' ', '_'), verdict);
  };

  tests[`${name} deck commands reproduce their documented results`] = () => {
    const text = deck(name);
    const commands = blocks(text, 'sh').flatMap((block) => block.trim().split('\n'));
    assert.ok(commands.length, 'no runnable commands');
    const files = new Map();
    for (const line of commands) {
      const clean = line.replace(/[ \t]+#.*$/, '').replace(/; echo "exit code: \$\?"$/, '').trim();
      if (!clean || clean.startsWith('#')) continue;
      for (const part of clean.split(' && ')) {
        const [command, ...args] = shellSplit(part);
        if (command === 'eyemind-to-rdf') {
          // The converter belongs to rdf-interchange. Check its documented
          // input here without making this dependency-free suite require it.
          assert.equal(args.length, 3);
          assert.equal(args[1], '-o');
          assert.match(args[2], /\.(?:ttl|trig)$/);
          assert.ok(files.has(args[0]), 'converter input was not produced');
          const quads = terms(files.get(args[0]));
          assert.ok(quads.length && quads.every((term) => ['rdf', 'result_rdf'].includes(term.name) && term.args.length === 4));
          continue;
        }
        assert.equal(command, 'eyemind');
        const redirect = args.indexOf('>');
        const target = redirect < 0 ? null : args[redirect + 1];
        if (redirect >= 0) {
          assert.equal(redirect, args.length - 2);
          assert.ok(target);
          args.splice(redirect);
        }
        assert.ok(args.includes(`examples/${name}.js`));
        const result = deckCommand(args, files);
        if (target) files.set(target, result.stdout);
        const goals = args.flatMap((arg, i) => arg === '--goal' ? [args[i + 1]] : []);
        const proof = args.includes('--proof') || args.includes('-p');
        const check = args.includes('--check-proof') || args.includes('-c');
        if (args.includes('--stats')) {
          const stats = JSON.parse(result.stderr);
          for (const key of ['inferences', 'rounds', 'derived']) assert.ok(Number.isSafeInteger(stats[key]) && stats[key] >= 0);
        } else assert.equal(result.stderr, '');
        if (check) {
          const report = terms(result.stdout);
          const trusted = report.find((term) => term.name === 'trusted').args[0];
          const strict = args.includes('--strict-proof');
          assert.equal(result.code, strict && trusted > 0n ? 2 : 0);
          if (strict) {
            const failures = report.filter((term) => term.name === 'failure');
            assert.equal(BigInt(failures.length), trusted);
            for (const failure of failures) {
              assert.equal(failure.args[0], 'C5');
              assert.match(failure.args[2], /^trusted boundary forbidden:/);
            }
          } else assert.equal(result.stdout, read(`check/${name}.js`));
        } else {
          assert.equal(result.code, args.includes('--unused') ? 0 : entry.halt_code ?? 0, result.stderr);
          if (args.includes('--unused')) assert.equal(result.stdout, '');
          else if (goals.length) {
            if (proof) assert.ok(checkProof(loadText(read(`${name}.js`)), result.stdout, { goals }).valid);
            else {
              const claims = terms(result.stdout);
              assert.ok(claims.length, 'documented goal has no answers');
              assert.ok(claims.every((claim) => goals.some((goal) => unify(readGoal(goal), claim, new Env()))));
              if (PROSE_GOALS.has(name)) assert.equal(result.stdout, `${goalAnswer(name, readTerm(goals[0]), section(text, 'Try it'))}\n`);
            }
          } else assert.equal(result.stdout, read(`${proof ? 'proof' : 'output'}/${name}.js`));
        }
      }
    }
  };
}
