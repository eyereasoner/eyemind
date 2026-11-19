import { readFileSync } from 'node:fs';
import { assert } from './helpers.js';
import { compileLe, readTerm, run, write } from '../src/index.js';
import { flattenConjunction, properListItems } from '../src/terms.js';

function answers(name, edit = (text) => text) {
  const file = `${name}-le.le`, text = readFileSync(new URL(`../examples/${file}`, import.meta.url), 'utf8');
  return run(compileLe([[edit(text), file]]).program, { maxRounds: 100, maxInferences: 10000 }).answers.map((answer) => readTerm(answer));
}

export const tests = {
  'shortest paths keep ties, prefer a cheaper new alternative and respect the path bound'() {
    const tied = answers('shortest-path');
    assert.equal(tied.length, 2);
    assert.deepEqual(tied.map((t) => t.args[1]), [10n, 10n]);
    const direct = answers('shortest-path', (s) => s.replace('road(Atrium, Harbor, 15)', 'road(Atrium, Harbor, 5)'));
    assert.deepEqual(direct.map((term) => write(term)), ["bestRoute('Harbor', 5, via(start('Atrium'), 'Harbor'))"]);
    const limited = answers('shortest-path', (s) => s.replace('4 is a roadLimit.', '1 is a roadLimit.'));
    assert.deepEqual(limited.map((term) => write(term)), ["bestRoute('Harbor', 15, via(start('Atrium'), 'Harbor'))"]);
  },

  'river crossing finds the two classic seven-move histories and none within six moves'() {
    const plans = answers('river-crossing'), histories = [];
    assert.equal(plans.length, 2);
    for (const plan of plans) {
      assert.equal(plan.args[0], 7n);
      const moves = [];
      let history = plan.args[2];
      while (typeof history !== 'string') {
        assert.equal(history.name, 'step');
        moves.push(history.args[1]); history = history.args[0];
      }
      assert.equal(history, 'start');
      histories.push(moves.reverse().join(' '));
    }
    assert.deepEqual(histories.sort(), [
      'goat alone cabbage goat wolf alone goat', 'goat alone wolf goat cabbage alone goat',
    ]);
    assert.deepEqual(answers('river-crossing', (s) => s.replace('7 is a crossingLimit.', '6 is a crossingLimit.')), []);
  },

  'Pell iteration limits change exact answers beyond binary64 integer precision'() {
    assert.deepEqual(answers('pell-equation', (s) => s.replace('24 is an iterationLimit.', '21 is an iterationLimit.')), []);
    const extended = answers('pell-equation', (s) => s.replace('24 is an iterationLimit.', '25 is an iterationLimit.'));
    assert.equal(extended.length, 4);
    assert.equal(write(extended.at(-1)), 'solution(6882627592338442563, 4866752642924153522, 1)');
  },

  'certificates and audits share dossier witnesses and prior learning changes eligibility'() {
    const result = answers('course-certificates'), students = [];
    assert.equal(result.length, 3);
    for (const row of result) {
      if (row.name === 'missing') {
        assert.equal(write(row), "missing('Bob', 'Robotics', 'Safety')");
        continue;
      }
      const [holder, attestation, auditEntry, audit] = flattenConjunction(row);
      students.push(holder.args[0]);
      assert.equal(write(holder.args[1]), write(attestation.args[0]));
      assert.equal(write(attestation.args[1]), write(audit.args[1]));
      assert.equal(write(auditEntry.args[0]), write(audit.args[0]));
      assert.ok(properListItems(holder.args[1].args[2]).some((arg) => write(arg) === write(attestation.args[1])));
    }
    assert.deepEqual(students.sort(), ['Alice', 'Carol']);
    const changed = answers('course-certificates', (s) => s.replace('priorLearning(Carol, Control, 90)', 'priorLearning(Carol, Control, 84)'));
    assert.ok(changed.some((row) => write(row) === "missing('Carol', 'Robotics', 'Control')"));
    assert.equal(changed.filter((row) => row.name === 'and').length, 1);
  },

  'symbolic derivative evaluation keeps points separate and responds to expression changes'() {
    const result = answers('symbolic-derivative');
    assert.deepEqual(result.map((row) => row.args.slice(2)), [[0n, 2n], [3n, 29n]]);
    assert.equal(write(result[0].args[1]), write(result[1].args[1]));
    const atTwo = answers('symbolic-derivative', (s) => s.replace('point(x, 0) and point(x, 3).', 'point(x, 2).'));
    assert.deepEqual(atTwo.map((row) => row.args.slice(2)), [[2n, 14n]]);
    const changed = answers('symbolic-derivative', (s) => s.replaceAll('constant(2)', 'constant(5)'));
    assert.deepEqual(changed.map((row) => row.args.slice(2)), [[0n, 5n], [3n, 32n]]);
  },

  'British citizenship follows either subsection, passes through a derived parent and yields to the contrary'() {
    const citizens = (edit) => answers('british-citizenship', edit).filter((row) => row.name === 'britishCitizen').map((row) => row.args[0]).sort();
    assert.deepEqual(citizens(), ['Anna', 'Ben', 'Eve', 'Gwen']);
    assert.deepEqual(citizens((s) => s.replace('settledSince(Ivan, 20050101)', 'settledSince(Ivan, 19990101)')), ['Anna', 'Ben', 'Dara', 'Eve', 'Gwen']);
    assert.deepEqual(citizens((s) => s.replace('Finn is a contraryShown.', '')), ['Anna', 'Ben', 'Eve', 'Finn', 'Gwen']);
    // Without Farid's settlement, Anna and therefore Ben lose citizenship.
    assert.deepEqual(citizens((s) => s.replace('settledSince(Farid, 19750301)', 'settledSince(Farid, 19950301)')), ['Eve', 'Gwen']);
  },

  'library fines charge a damaged and lost loan once and summarize every member'() {
    const rows = (edit) => answers('library-fines', edit).map((term) => write(term));
    assert.deepEqual(rows(), [
      "amountDue(11, 'Alice')", "amountDue(4, 'Bob')", "amountDue(0, 'Carol')",
      "lateLoanCount(2, 'Alice')", "lateLoanCount(1, 'Bob')", "lateLoanCount(0, 'Carol')",
      "longestDelay(3, 'Alice')", "longestDelay(4, 'Bob')", "longestDelay(0, 'Carol')", "blockedMember('Alice')",
    ]);
    assert.ok(rows((s) => s.replace('loan(l4, Bob, novel, 4)', 'loan(l4, Bob, novel, 6)')).includes("amountDue(6, 'Bob')"));
    assert.ok(rows((s) => s.replace('dvd has dailyRate 2', 'dvd has dailyRate 3')).includes("amountDue(12, 'Alice')"));
    // A loan that is only damaged is charged the same as one damaged and lost.
    assert.deepEqual(rows((s) => s.replace('l3 is damaged and l3 is lost.', 'l3 is damaged.')), rows());
    assert.ok(!rows((s) => s.replace('l3 is damaged and l3 is lost.', '')).includes("blockedMember('Alice')"));
  },

  'election tallies count each eligible choice once, exclude spoiled votes and keep tied winners'() {
    const rows = (edit) => answers('election-tally', edit).map((term) => write(term));
    assert.deepEqual(rows(), [
      "spoiledVoter('v7')", "'quorumMet'", "voteCount(3, 'Hana')", "voteCount(3, 'Ravi')", "voteCount(1, 'Sven')",
      "winner('Hana')", "winner('Ravi')",
    ]);
    const verified = rows((s) => s.replace('v10 is a provisionalVoter.', 'v10 is a provisionalVoter. v10 is verified.'));
    assert.ok(verified.includes("voteCount(2, 'Sven')") && verified.includes("winner('Ravi')"));
    const single = rows((s) => s.replace('ballot(b9, v7, Sven).', ''));
    assert.deepEqual(single.filter((row) => row.startsWith('winner')), ["winner('Hana')"]);
    assert.ok(single.includes("voteCount(4, 'Hana')") && !single.some((row) => row.startsWith('spoiledVoter')));
    // Two participants of eleven eligible voters fall short of the quorum.
    const few = rows((s) => s.replace(/^ballot\(b(?:[3-9]|1[01]),.*\n/gm, ''));
    assert.ok(!few.includes("'quorumMet'"));
  },
};
