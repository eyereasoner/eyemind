import { assert, cli, errorOf } from './helpers.js';
import { checkProof, compileLe, loadText, run, writeLe } from '../src/index.js';
import { inputKind, loadInputs, writeConclusions } from '../src/formats.js';

const compile = (text) => compileLe([[text, 'input.le']]);
// The conclusions of a document, as LE writes them.
const output = (text) => {
  const loaded = compile(text);
  return writeLe(run(loaded.program), loaded);
};
// The answer sentences of a document, without the query headings.
const sentences = (text) => output(text).split('\n').filter((line) => line && !line.startsWith('%'));
const document = (templates, rules, query) => `the templates are:\n${templates}\n\nthe knowledge base test includes:\n${rules}\n\nquery q is:\n${query}\n`;

export const tests = {
  'templates, rules and queries compile to LS and answer with sentences'() {
    const text = document('*a thing* is human,\n*a thing* is mortal.', 'a person is mortal if the person is human.\nSocrates is human.', 'which thing is mortal.');
    assert.equal(output(text), '% query q\nSocrates is mortal.\n');
    const loaded = compile(text);
    assert.match(loaded.text, /implied_by\(struct\("is_mortal", vars\("Person"\)\), struct\("is_human", vars\("Person"\)\)\)/);
    assert.deepEqual(run(loadText(loaded.text)).answers, run(loaded.program).answers);
    // A query without "which" asks whether its sentence holds.
    assert.deepEqual(sentences(document('*a thing* is human.', 'Socrates is human.', 'Socrates is human.')), ['Socrates is human.']);
    assert.equal(output(document('*a thing* is human.', 'Socrates is human.', 'Plato is human.')), '% query q\n% no answers\n');
  },

  'a scenario adds its facts to the knowledge base, and expected answers are compared'() {
    const text = `the templates are: *a thing* is human, *a thing* is mortal.
the knowledge base kb includes:
a person is mortal if the person is human.
Homer is human.
scenario athens is:
    Socrates is human.
    q expects answers ["Homer is mortal", "Socrates is mortal"].
scenario sparta is:
    Leonidas is human.
    q expects answers ["Homer is mortal"].
query q is: which thing is mortal.`;
    assert.equal(output(text), [
      '% query q with scenario athens', 'Homer is mortal.', 'Socrates is mortal.', '',
      '% query q with scenario sparta', 'Homer is mortal.', 'Leonidas is mortal.',
      '% not as expected: q expects answers ["Homer is mortal"]', '',
    ].join('\n'));
    // The scenario is the first argument of every relation.
    assert.match(compile(text).text, /fact\(struct\("is_human", "athens", "Socrates"\)\)/);
    // LE2 writes underscores as spaces and repeats answers; both compare equal.
    // Unquoted expected answers are read to the next comma; answers that rest
    // on unknowns are assumptions eyemind does not make, and are not compared.
    assert.doesNotMatch(output(`the templates are: *a thing* is human.
the knowledge base kb includes:
scenario s is:
    ann is human.
    q expects answers [ann is human].
    r expects answers ["bob is human"] and unknowns ["bob is human"].
query q is: which thing is human.
query r is: bob is human.`), /not as expected/);
    assert.doesNotMatch(output(`the templates are: *a person* is accused of *a crime*.
the knowledge base kb includes:
scenario s is:
    bob is accused of robbing_the_bank.
    q expects answers ["bob is accused of robbing the bank", "bob is accused of robbing the bank"].
query q is: which person is accused of which crime.`), /not as expected/);
  },

  'deeper indentation binds tighter and one indentation reads from the top'() {
    const templates = '*a person* is eligible, *a person* is a resident, *a person* is a citizen, *a person* is an adult.';
    const facts = 'ann is a resident.\nbob is a citizen.\nbob is an adult.\ncid is a citizen.';
    const eligible = (rule) => sentences(document(templates, `${rule}\n${facts}`, 'which person is eligible.')).sort();
    // (resident or citizen) and adult
    assert.deepEqual(eligible('a person is eligible\n    if the person is a resident\n    or the person is a citizen\n    and the person is an adult.'), ['bob is eligible.']);
    // resident or (citizen and adult)
    assert.deepEqual(eligible('a person is eligible\n    if the person is a resident\n    or the person is a citizen\n        and the person is an adult.'), ['ann is eligible.', 'bob is eligible.']);
    // A tab counts four spaces, as in LE's editor.
    assert.deepEqual(eligible('a person is eligible\n\tif the person is a resident\n\tor the person is a citizen\n    \tand the person is an adult.'), ['ann is eligible.', 'bob is eligible.']);
    // A condition may run over two lines, and "and" may follow "if" on the next line.
    assert.deepEqual(eligible('a person is eligible if\nand the person is\n    a citizen.'), ['bob is eligible.', 'cid is eligible.']);
  },

  'variables are introduced by an article, referred to by "the" and named by an id'() {
    const templates = '*a person* is a parent of *a person*, *a person* is a grandparent of *a person*.';
    const facts = 'ann is a parent of bob.\nbob is a parent of cid.';
    for (const rule of [
      'a person is a grandparent of an other person if the person is a parent of a third person and the third person is a parent of the other person.',
      'a person X is a grandparent of a person Y if X is a parent of a person Z and Z is a parent of Y.',
      'X is a grandparent of Y if X is a parent of Z and Z is a parent of Y.',
    ]) {
      assert.deepEqual(sentences(document(templates, `${rule}\n${facts}`, 'which person is a grandparent of which other person.')), ['ann is a grandparent of cid.'], rule);
    }
    // A definite phrase that refers back to nothing is a name, as are acronyms.
    const named = document('*a person* lives in *a place*, *a person* is happy.', 'a person is happy if the person lives in the UK.\nann lives in the UK.\nbob lives in UK.', 'which person is happy.');
    assert.deepEqual(sentences(named), ['ann is happy.']);
    const acronym = document('*a person* pays *a tax*, *a person* is taxed.', 'a person is taxed if the person pays GST.\nann pays GST.\nbob pays VAT.', 'which person is taxed.');
    assert.deepEqual(sentences(acronym), ['ann is taxed.']);
  },

  'a "that" place holds a sentence, and templates with "that" are tried first'() {
    const text = document('*a person* says that *a sentence*, *a person* is the father of *a person*, *a person* is trusted.',
      'a person X is the father of a person Y if a person Z says that X is the father of Y and Z is trusted.\n' +
      'alice says that harry is the father of john.\nalice is trusted.', 'which person is the father of which other person.');
    assert.deepEqual(sentences(text), ['harry is the father of john.']);
    assert.match(compile(text).text, /struct\("says_that", vars\("Z"\), struct\("is_the_father_of", vars\("X"\), vars\("Y"\)\)\)/);
  },

  'negation, universals and Prolog negation of a variable no condition has bound'() {
    const templates = '*a person* is accused, *a person* is guilty, *a person* is innocent, *a person* is a dragon, *a person* is happy,\nall dragons are happy,\nnobody is guilty.';
    const innocent = document(templates, 'a person is innocent\n    if the person is accused\n    and it is not the case that\n        the person is guilty.\nann is accused.\nbob is accused.\nbob is guilty.', 'which person is innocent.');
    assert.deepEqual(sentences(innocent), ['ann is innocent.']);
    const universal = (facts) => sentences(document(templates, `all dragons are happy\n    if for all cases in which\n        a person is a dragon\n    it is the case that\n        the person is happy.\n${facts}`, 'all dragons are happy.'));
    assert.deepEqual(universal('puff is a dragon.\npuff is happy.'), ['all dragons are happy.']);
    assert.deepEqual(universal('puff is a dragon.\nsmaug is a dragon.\npuff is happy.'), []);
    // The person of the negation is open, as in Prolog: no one is guilty.
    const open = document(templates, 'nobody is guilty\n    if it is not the case that\n        a person is guilty.\nann is accused.', 'nobody is guilty.');
    assert.deepEqual(sentences(open), ['nobody is guilty.']);
    assert.match(compile(open).text, /struct\("not", struct\("is_guilty", vars\("_0"\)\)\)/);
    // A rule whose conclusion leaves its person open still negates as Prolog does.
    const late = document(templates, 'a person is innocent\n    if it is not the case that\n        the person is guilty\n    and the person is accused.\nann is accused.', 'which person is innocent.');
    assert.deepEqual(sentences(late), ['ann is innocent.']);
  },

  'recursive rules end as tabling ends them, through forward LS rules'() {
    // Left recursion and a loop between two rules would not end in Prolog's search.
    const ancestors = document('*a person* is a parent of *a person*, *a person* is an ancestor of *a person*.',
      'a person is an ancestor of an other person if the person is an ancestor of a third person and the third person is a parent of the other person.\n' +
      'a person is an ancestor of an other person if the person is a parent of the other person.\nann is a parent of bob.\nbob is a parent of cid.',
      'which person is an ancestor of which other person.');
    assert.deepEqual(sentences(ancestors).sort(), ['ann is an ancestor of bob.', 'ann is an ancestor of cid.', 'bob is an ancestor of cid.']);
    assert.match(compile(ancestors).text, /^implies\(/m);
    const party = document('*a person* will go.', 'mary will go if john will go.\njohn will go if mary will go.\nbob will go.', 'which person will go.');
    assert.deepEqual(sentences(party), ['bob will go.']);
    // A rule that counts down depends on how it is called and stays backward.
    const countdown = document('*a number* counts down.', 'a number N counts down if N = 0.\na number N counts down if N > 0 and a number M = N - 1 and M counts down.', '3 counts down.');
    assert.deepEqual(sentences(countdown), ['3 counts down.']);
    assert.doesNotMatch(compile(countdown).text, /^implies\(/m);
  },

  'an id in a fact is a name, a hyphenated formula subtracts and "which type" asks for a kind'() {
    const quarters = document('*a quarter* is previous to *a quarter*, *a quarter* is late.', 'a quarter Y is late if X is previous to Y.\nQ1 is previous to Q2.', 'which quarter is late.');
    assert.deepEqual(sentences(quarters), ['Q2 is late.']);
    const tax = document('*an amount* is due.', 'an amount A is due if a number ET = 10 and a number P = 4 and A = ET-P.', 'which amount is due.');
    assert.deepEqual(sentences(tax), ['6 is due.']);
    assert.deepEqual(sentences(document('*a thing* is red.', 'ann is a person.', 'ann is a which kind.')), ['ann is a person.']);
  },

  'aggregates count every solution, and the minimum of nothing does not exist'() {
    const templates = '*a person* pays *an amount*, *a person* paid *an amount* in total, *a person* made *a number* payments, *a person* paid at least *an amount*, *a person* paid *a list*, *a person* paid *an amount* on average.';
    const facts = 'ann pays 50.\nann pays 20.\nann pays 50.\nbob is a person.\nann is a person.';
    const ask = (rule, query) => sentences(document(templates, `${rule}\n${facts}`, query)).sort();
    assert.deepEqual(ask('a person paid a total in total if the person is a person and the total is the sum of each A such that the person pays A.', 'which person paid which amount in total.'),
      ['ann paid 120 in total.', 'bob paid 0 in total.']);
    assert.deepEqual(ask('a person made a number N payments if the person is a person and N is the count of each A such that the person pays A.', 'which person made which number payments.'),
      ['ann made 3 payments.', 'bob made 0 payments.']);
    assert.deepEqual(ask('a person paid at least a least if the person is a person and the least is the min of each A such that the person pays A.', 'which person paid at least which amount.'),
      ['ann paid at least 20.']);
    assert.deepEqual(ask('a person paid a list L if the person is a person and L is the list of each A such that the person pays A.', 'which person paid which list.'),
      ['ann paid [50, 20, 50].', 'bob paid [].']);
    assert.deepEqual(ask('a person paid a mean on average if the person is a person and the mean is the average of each A such that the person pays A.', 'which person paid which amount on average.'),
      ['ann paid 40 on average.']);
    // LE1 writes a collection with "where".
    assert.deepEqual(ask('a person paid a list L if the person is a person and L is a collection of an A\n    where the person pays the A.', 'which person paid which list.'),
      ['ann paid [50, 20, 50].', 'bob paid [].']);
  },

  'arithmetic evaluates formulas, divides as Prolog does and compares numbers'() {
    const templates = '*a number* has half *a number*, *a number* is big.';
    const half = (n) => sentences(document(templates, `a number N has half a number H if H = N / 2.\n${n} has half 0.`.replace(`\n${n} has half 0.`, ''), `${n} has half which number.`));
    assert.deepEqual(half(6), ['6 has half 3.']);
    assert.deepEqual(half(7), ['7 has half 3.5.']);
    const big = document(templates, 'a number N is big if N * 2 >= 1,000 + 1.\n', '600 is big.');
    assert.deepEqual(sentences(big), ['600 is big.']);
    assert.deepEqual(sentences(document(templates, 'a number N is big if N is greater than 10 and N mod 2 = 1.', '11 is big.')), ['11 is big.']);
    // LE1's "X is Y" equates, or evaluates a formula.
    assert.deepEqual(sentences(document(templates, 'a number N has half a number H if H is N / 2.', '8 has half which number.')), ['8 has half 4.']);
  },

  'dates compare in time order and count days across months and leap years'() {
    const templates = '*a date* is late, *a date* is *a number* days after *a date*.';
    assert.deepEqual(sentences(document(templates, 'a date is late if the date is after 2024-02-28.', '2024-02-29 is late.')), ['2024-02-29 is late.']);
    assert.deepEqual(sentences(document(templates, 'a date is late if the date is before or equal to 2024-02-28.', '2024-02-29 is late.')), []);
    const days = (query) => sentences(`the templates are: *a date* is due.\nthe knowledge base k includes:\nquery q is: ${query}.`);
    assert.deepEqual(days('which date is 2 days after 2024-02-28'), ['2024-03-01 is 2 days after 2024-02-28.']);
    assert.deepEqual(days('which date is 1 day after 2023-12-31'), ['2024-01-01 is 1 day after 2023-12-31.']);
    assert.deepEqual(days('2025-03-01 is which number days after 2024-03-01'), ['2025-03-01 is 365 days after 2024-03-01.']);
    assert.deepEqual(days('which date is 366 days after 2000-01-01'), ['2001-01-01 is 366 days after 2000-01-01.']);
  },

  'lists, membership and LE1 list templates'() {
    const templates = '*a list* has *a thing* first.';
    assert.deepEqual(sentences(document(templates, 'a list has a thing first if the list has the thing as head before a rest.', '[a, b] has which thing first.')), ['[a, b] has a first.']);
    const ask = (query) => sentences(`the templates are: *a thing* is red.\nthe knowledge base k includes:\nquery q is: ${query}.`);
    assert.deepEqual(ask('which thing is in [x, y]'), ['x is in [x, y].', 'y is in [x, y].']);
    assert.deepEqual(ask('which list is the reverse of [1, 2, 3]'), ['[3, 2, 1] is the reverse of [1, 2, 3].']);
    assert.deepEqual(ask('appending [1] then [2, 3] gives which list'), ['appending [1] then [2, 3] gives [1, 2, 3].']);
    assert.deepEqual(ask('the length of [a, b, c] is which number'), ['the length of [a, b, c] is 3.']);
  },

  'a comma separates templates at the end of a line or before a place, not inside a template'() {
    const text = 'the templates are:\n*a claim* is caused by, or results from, *a cause*, *a cause* is solar.\nthe knowledge base k includes:\n' +
      'a claim is caused by, or results from, a cause if the cause is solar.\nflare is solar.\nquery q is: c1 is caused by, or results from, which cause.';
    assert.deepEqual(sentences(text), ['c1 is caused by, or results from, flare.']);
  },

  'LE1 forms: templates without asterisks, possessives, an ontology and "the contract states that"'() {
    const starless = `the templates are:
    a person has a balance.
the ontology is:
    cash at bank is an account.
    an account is an asset.
the contract services states that:
ann has a balance 10.
query one is: which person has which balance.
query two is: which thing is an asset.`;
    assert.equal(output(starless), ['% query one', 'ann has a balance 10.', '', '% query two', 'account is an asset.', 'cash at bank is an asset.', ''].join('\n'));
    // With asterisks, "an audit" is part of a template's words.
    const starred = `the templates are:
    *a person*'s manager is *a person*,
    there is an audit.
the knowledge base k includes:
ann's manager is bob.
amy is of type employee.
query one is: which person's manager is which other person.
query two is: which thing is an employee.`;
    assert.equal(output(starred), ['% query one', "ann's manager is bob.", '', '% query two', 'amy is an employee.', ''].join('\n'));
  },

  'compiled programs give checked proofs, and a forged proof fails'() {
    const loaded = loadInputs([['the templates are: *a thing* is human, *a thing* is mortal.', 'templates.le'],
      ['the knowledge base k includes:\na person is mortal if the person is human.\nscenario s is: Socrates is human.\nquery q is: which thing is mortal.', 'rules.le']]);
    const result = run(loaded.program, { proof: true });
    assert.equal(writeConclusions(loaded, result, { format: 'le' }), '% query q with scenario s\nSocrates is mortal.\n');
    assert.equal(checkProof(loadText(loaded.text), result.proof).valid, true);
    const forged = result.proof.replaceAll("'Socrates'", "'Plato'");
    assert.notEqual(forged, result.proof);
    assert.equal(checkProof(loaded.program, forged).valid, false);
  },

  'the command line runs .le files and writes LE only for them'() {
    assert.equal(inputKind('Socrates.LE'), 'le');
    const command = cli(['examples/socrates-le.le']);
    assert.equal(command.code, 0, command.stderr);
    assert.equal(command.stdout, '% query mortal\nSocrates is mortal.\n');
    assert.equal(cli(['--check-proof', 'examples/proof/socrates-le.js', 'examples/socrates-le.le']).code, 0);
    assert.equal(cli(['--prove-and-check', 'examples/socrates-le.le']).code, 0);
    assert.equal(cli(['--to', 'eyemind', 'examples/socrates-le.le']).stdout, "// Answers: each instance of a query() that holds.\nstruct('le:answer', 'mortal', 'Socrates')\n");
    assert.match(cli(['--to', 'le', 'examples/socrates.js']).stderr, /answers of a Logical English run/);
    assert.match(errorOf(() => loadInputs([['the templates are: *a thing* is human.', 'x.le'], ['fact(p)', 'x.js']])), /takes .le files/);
    assert.match(cli(['--owl2rl', 'examples/socrates-le.le']).stderr, /without RDF logic switches/);
  },

  'input is data and compiled JavaScript cannot execute names or quoted text'() {
    const text = document('*a thing* is a name.', JSON.stringify('eval("globalThis.leExecuted = true")') + ' is a name.\n' +
      JSON.stringify('");globalThis.leExecuted=true;//') + ' is a name.', 'which thing is a name.');
    delete globalThis.leExecuted;
    const loaded = compile(text);
    const result = run(loadText(loaded.text));
    assert.equal(globalThis.leExecuted, undefined);
    assert.equal(result.answers.length, 2);
    assert.deepEqual(result.answers, run(loaded.program).answers);
  },

  'mistakes and Logical English 2 features name the source line'() {
    for (const [text, pattern] of [
      ['% Header\n\nann is human.', /input.le: line 3:.*before any section/],
      ['the templates are: *a thing* is human.\nthe knowledge base k includes:\nann is human', /must end with a full stop/],
      ['the templates are: *a thing* is human.\nthe knowledge base k includes:\nann is mortal.', /line 3:.*no template matches "ann is mortal"/],
      ['the templates are: *a thing* is human.\nthe knowledge base k includes:\nann is human if bob is tall.', /no template matches "bob is tall"/],
      ['the templates are: *a thing* is human; opposite: *a thing* is divine.', /template additions.*Logical English 2/],
      ['the constants are:\n the fee is 5.', /"the constants are".*Logical English 2/],
      ['the templates are: *a* likes *b*,\nlikes *a* *b*.', /both name the relation likes\/2/],
      ['the templates are: *a thing* is human.\nthe knowledge base k includes:\nann is greater than bob.', /built-in condition and cannot be concluded/],
      ['the templates are: *a thing* is human.\nthe knowledge base k includes:\nq expects answers [].', /expectation belongs to a scenario/],
      ['the templates are: *a thing* is human.\nscenario s is:\nit is not the case that ann is human.', /Logical English 2/],
      ['the templates are: *a thing* is human.\nthe knowledge base k includes:\na thing is human if for all cases in which the thing is human.', /needs "it is the case that"/],
      ['the templates are: *a thing* is human.\nthe knowledge base k includes:\nrule r1: ann is human.', /rule labels belong to Logical English 2/],
      ['the templates are: *a thing* is human.\nscenario s is, as stated in the act:\nann is human.', /header "scenario s is, as stated in the act:" belongs to Logical English 2/],
      ['the templates are: *a thing* is human.\nscenario s is:\nq expects changes [["add: ann is human"]].', /flip queries/],
    ]) {
      assert.match(errorOf(() => compile(text)), pattern, text);
    }
  },
};
