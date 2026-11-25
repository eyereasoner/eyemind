import { readFileSync } from 'node:fs';
import { assert } from './helpers.js';
import { compileLe, run, writeLe } from '../src/index.js';

// The answers of an LE example, after an edit, as sentences.
function answers(name, edit = (text) => text) {
  const file = `${name}-le.le`, text = readFileSync(new URL(`../examples/${file}`, import.meta.url), 'utf8');
  const loaded = compileLe([[edit(text), file]]);
  return writeLe(run(loaded.program), loaded);
}

const replace = (from, to) => (text) => {
  assert.ok(text.includes(from), from);
  return text.replace(from, to);
};

export const tests = {
  'the examples give their expected answers'() {
    for (const name of ['socrates', 'british-citizenship', 'library-fines', 'election-tally', 'shortest-path', 'river-crossing',
      'breach-notification', 'data-transfers', 'right-to-erasure']) {
      assert.doesNotMatch(answers(name), /not as expected|no answers/, name);
    }
  },

  'British citizenship follows a settlement date and the contrary evidence'() {
    const settled = answers('british-citizenship', replace('Ivan is settled in the UK since 2005-01-01.', 'Ivan is settled in the UK since 1999-01-01.'));
    assert.match(settled, /^Dara is a British citizen\.$/m);
    assert.match(settled, /% not as expected: citizens/);
    assert.match(answers('british-citizenship', replace('    the contrary is shown for Finn.\n', '')), /^Finn is a British citizen\.$/m);
  },

  'library fines follow the days late and the daily rates'() {
    const bob = answers('library-fines', replace('l4 is a loan of novel to Bob returned 4 days late.', 'l4 is a loan of novel to Bob returned 6 days late.'));
    assert.match(bob, /^Bob owes 6 in total\.$/m);
    assert.doesNotMatch(bob, /^Bob is blocked\.$/m);
    assert.match(answers('library-fines', replace('dvd has a daily rate of 2.', 'dvd has a daily rate of 3.')), /^Alice owes 12 in total\.$/m);
    // Lost but not damaged, the poems are still charged once.
    assert.match(answers('library-fines', replace('    l3 is damaged.\n', '')), /^Alice owes 11 in total\.$/m);
  },

  'the election counts a verified voter and breaks the tie without a spoiled vote'() {
    const verified = answers('election-tally', replace('v10 is a provisional voter.', 'v10 is a provisional voter.\n    v10 is verified.'));
    assert.match(verified, /^Sven receives 2 votes\.$/m);
    assert.match(verified, /^Hana wins\.\nRavi wins\.$/m);
    const unspoiled = answers('election-tally', replace('    v7 casts ballot 9 for Sven.\n', ''));
    assert.match(unspoiled, /^Hana receives 4 votes\.$/m);
    assert.match(unspoiled, /% query winners with scenario count\nHana wins\.\n%/);
  },

  'shortest paths keep ties, prefer a cheaper road and respect the road bound'() {
    const direct = answers('shortest-path', replace('atrium has a road to harbor taking 15 minutes.', 'atrium has a road to harbor taking 5 minutes.'));
    assert.match(direct, /% query best with scenario town\n\[atrium, harbor\] is a best route from atrium to harbor in 5 minutes\.\n/);
    const limited = answers('shortest-path', (text) => text.replaceAll('using at most 4 roads', 'using at most 1 roads'));
    assert.match(limited, /% query best with scenario town\n\[atrium, harbor\] is a best route from atrium to harbor in 15 minutes\.\n/);
  },

  'river crossing finds the two seven-crossing plans and none within six'() {
    assert.equal(answers('river-crossing', replace('in at most 7 crossings.\n', 'in at most 6 crossings.\n')), '% query plans\n% no answers\n');
    const longer = answers('river-crossing', replace('in at most 7 crossings.\n', 'in at most 9 crossings.\n'));
    assert.ok(longer.split('\n').filter((line) => line.endsWith('crossings.')).length > 2);
  },

  'breach notification follows the processing agreement and the data subjects notice'() {
    const quick = answers('breach-notification', replace('the processor alerted the controller to the database leak after 30 hours.', 'the processor alerted the controller to the database leak after 20 hours.'));
    assert.doesNotMatch(quick, /^the processor breaches/m);
    const informed = answers('breach-notification', replace('    the misdirected email is a personal data breach.', '    the controller informed the data subjects of the database leak.\n    the misdirected email is a personal data breach.'));
    assert.doesNotMatch(informed, /^the controller breaches Article 34\(1\)/m);
    assert.match(informed, /^the controller breaches Article 33\(1\) for the ransomware attack\.$/m);
  },

  'data transfers follow the impact assessment and the US certification'() {
    const assessed = answers('data-transfers', replace('    the helpdesk transfer relies on standard contractual clauses.\n',
      '    the helpdesk transfer relies on standard contractual clauses.\n    the transfer impact of the helpdesk transfer is assessed.\n'));
    assert.match(assessed, /^the helpdesk transfer is allowed\.$/m);
    const uncertified = answers('data-transfers', replace('    the support desk is certified under the Data Privacy Framework.\n', ''));
    assert.match(uncertified, /^the support transfer has no legal basis\.$/m);
    assert.doesNotMatch(uncertified, /^the support transfer is allowed\.$/m);
  },

  'erasure follows the recorded retention period and the litigation hold'() {
    const expired = answers('right-to-erasure', replace('    a retention period applies to the backup archive.\n',
      '    a retention period applies to the backup archive.\n    the retention period of the backup archive has 0 years left.\n'));
    assert.match(expired, /^the backup archive must be erased\.$/m);
    assert.match(answers('right-to-erasure', replace('    a litigation hold covers the support tickets.\n', '')), /^the support tickets must be erased\.$/m);
  },
};
