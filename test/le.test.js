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
    // Unquoted expected answers are read to the next comma.
    assert.doesNotMatch(output(`the templates are: *a thing* is human.
the knowledge base kb includes:
scenario s is:
    ann is human.
    q expects answers [ann is human].
query q is: which thing is human.`), /not as expected/);
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

  'Logical English 2 template additions: synonyms, opposites with "only if", assumable and ignored ones'() {
    const synonyms = `the templates are:
    *a payment* is in respect of *a claim*; synonym *a payment* covers *a claim*,
    *a payment* is made; memorable; image "pay.png".
the knowledge base k includes:
p1 covers c1.
a payment is made if the payment is in respect of a claim.
query q is: which payment is made.
query r is: which payment is in respect of which claim.`;
    assert.equal(output(synonyms), '% query q\np1 is made.\n\n% query r\np1 is in respect of c1.\n');
    const onlyIf = `the templates are:
    I will marry *a woman*; opposite I will not marry *a woman*.
    I love *a woman*.
the knowledge base k includes:
I will marry a woman if the woman is "Alice".
I will marry a woman if the woman is "Eve".
I will marry a woman only if I love the woman.
I love "Alice".
query q is: I will marry which woman.
query r is: I will not marry "Eve".`;
    assert.equal(output(onlyIf), '% query q\nI will marry Alice.\n\n% query r\nI will not marry Eve.\n');
    assert.match(errorOf(() => compile('the templates are: *a payment* is made; prepositional.')), /addition "; prepositional" belongs to Logical English 2/);
  },

  'abduction: answers rest on assumed sentences that the facts and rules do not prove'() {
    const assumable = (rule, query) => `the templates are:
    *a person* pays tax in *a country*,
    *a person* is resident in *a country*; assumable.
the knowledge base k includes:
${rule}
ann is resident in France.
query q is: ${query}.`;
    const pays = 'a person pays tax in a country if the person is resident in the country.';
    // A stated sentence is not assumed; an open question rests on an open assumption.
    assert.equal(output(assumable(pays, 'which person pays tax in which country')),
      '% query q\nann pays tax in France.\n_ pays tax in _.\n% assuming that _ is resident in _\n');
    assert.equal(output(assumable(pays, 'bob pays tax in France')), '% query q\nbob pays tax in France.\n% assuming that bob is resident in France\n');
    assert.equal(output(assumable(pays, 'ann pays tax in France')), '% query q\nann pays tax in France.\n');
    // Alternatives give alternative assumptions; "it is unknown whether" makes a pattern assumable in one scenario.
    const grass = `the templates are:
    the grass is wet,
    it rained,
    the sprinkler was on; unknown.
the knowledge base k includes:
the grass is wet if it rained.
the grass is wet if the sprinkler was on.
scenario dry is:
    q expects answers ["the grass is wet"] and unknowns ["the sprinkler was on"].
scenario cloudy is:
    it is unknown whether it rained.
    q expects answers ["the grass is wet"] and unknowns ["it rained", "the sprinkler was on"].
    q expects answers ["the grass is wet"] and any unknowns.
scenario rainy is:
    it rained.
    q expects answers ["the grass is wet"].
query q is: the grass is wet.`;
    assert.equal(output(grass), ['% query q with scenario dry', 'the grass is wet.', '% assuming that the sprinkler was on', '',
      '% query q with scenario cloudy', 'the grass is wet.', '% assuming that it rained', '% or assuming that the sprinkler was on', '',
      '% query q with scenario rainy', 'the grass is wet.', ''].join('\n'));
  },

  'abduction through negation, collections, universals, denials and constraints'() {
    // A negation assumes the sentence false, unless that contradicts an
    // assumption the answer already makes.
    const therapy = `the templates are:
    *a patient* is treated,
    *a patient* has therapy; assumable,
    *a patient* is excluded,
    *a patient* is a candidate.
the knowledge base k includes:
a patient is excluded if it is not the case that the patient has therapy.
a patient is treated if the patient is a candidate and the patient has therapy and it is not the case that the patient is excluded.
dan is a candidate.
query q is: which patient is treated.
query r is: which patient is excluded.`;
    assert.equal(output(therapy), '% query q\ndan is treated.\n% assuming that dan has therapy\n\n% query r\n_ is excluded.\n% assuming that it is not the case that _ has therapy\n');
    // A collection counts every way, with all its assumptions; a stated
    // sentence is not assumed again.
    const items = `the templates are:
    *an item* is eligible; unknown,
    *an item* has a value of *an amount*,
    *a total* is the eligible total.
the knowledge base k includes:
a total is the eligible total if the total is the sum of each partial such that an item has a value of the partial and the item is eligible.
scenario mixed is:
    widget has a value of 10.
    gadget has a value of 5.
    gadget is eligible.
    total expects answers ["15 is the eligible total"] and unknowns ["widget is eligible"].
query total is: which total is the eligible total.`;
    assert.doesNotMatch(output(items), /not as expected/);
    // A scenario can deny a sentence; constraints reject or repair assumptions.
    const marriage = `the templates are:
    *a person* is married to *a second person*; unknown,
    *a person* is a joint filer with *a second person*,
    *a person* files jointly.
the knowledge base k includes:
a person files jointly if the person is a joint filer with a second person and the person is married to the second person.
it must not be true that
    a person is married to a second person
    and it is not the case that
        the second person is married to the person.
it must not be true that
    a person is married to a second person
    and the person is married to a third person
    and the second person is different from the third person.
scenario one sided is:
    dan is a joint filer with erin.
    q expects answers ["dan files jointly"] and unknowns ["dan is married to erin", "erin is married to dan"].
scenario taken is:
    dan is a joint filer with erin.
    erin is married to fred.
    fred is married to erin.
    q expects answers [] and unknowns [].
scenario denied is:
    dan is a joint filer with erin.
    it is not the case that dan is married to erin.
    q expects answers [].
query q is: which person files jointly.`;
    assert.doesNotMatch(output(marriage), /not as expected/);
  },

  'embedded Prolog, Prolog resources and the system predicates of LE2'() {
    const files = new Map([['dir/regions.pl', '% facts\npostcode_region(eh1, edinburgh).\nregion_country(edinburgh, scotland).\n' +
      'postcode_country(P, C) :- postcode_region(P, R), region_country(R, C).\n']]);
    const io = { readFile: (path) => files.get(path) ?? (() => { throw new Error('missing'); })() };
    const text = `the knowledge base k includes these resources:
    regions.pl.
the templates are:
    *a postcode* is in *a country*,
    the kb name is *a name*,
    *a rule* has designator *a d*,
    *a person* is on record.
the knowledge base my kb includes:
a postcode is in a country if prolog postcode_country(the postcode, the country).
the kb name is a name if prolog (le_my_kb(KB), KB:le_kb(the name)).
a rule has designator a d if prolog le_source_element(the rule, the d, G).
rule numbered:
ann is on record if:
    1. either:
    1.1. prolog atom(ann)
    1.2. prolog fail.
query q is: eh1 is in which country.
query r is: the kb name is which name.
query d is: which rule has designator which d.
query e is: which person is on record.`;
    const loaded = compileLe([[text, 'dir/main.le']], io);
    assert.equal(writeLe(run(loaded.program), loaded), ['% query q', 'eh1 is in scotland.', '', '% query r', 'the kb name is my kb.', '',
      '% query d', 'numbered has designator 1.', 'numbered has designator 1.1.', 'numbered has designator 1.2.', '', '% query e', 'ann is on record.', ''].join('\n'));
  },

  'provenance trailers, facts backgrounds and source-scoped proof'() {
    const text = `the facts background includes these resources:
    background/words.
the templates are:
    *a garment* is knitted,
    *a garment* is classified by *a reading*.
the knowledge base k includes:
the listing is published at "https://example.org/listing".
rule by_reading with provenance the tariff, confer "knitted goods":
a garment is classified by a reading
    if the reading is in [strict reading, full reading]
    and the garment is knitted
        according to the reading.
the listing is admissible under strict reading.
the listing is admissible under full reading.
garment presumptions is admissible under full reading.
scenario stated is, as stated in the listing:
    tee is knitted.
scenario read is:
    tee is knitted, according to garment presumptions, because "a presumption".
query q is: tee is classified by which reading.`;
    assert.equal(output(text), ['% query q with scenario stated', 'tee is classified by strict reading.', 'tee is classified by full reading.', '',
      '% query q with scenario read', 'tee is classified by full reading.', ''].join('\n'));
  },

  'flip queries find the smallest changes to a scenario that make a goal hold'() {
    const text = `the templates are:
    *a creature* is a parent of *a dragon*,
    *a creature* flies,
    *a creature* is happy.
the knowledge base k includes:
a dragon is happy if
    the dragon is a dragon and
    for all cases in which
        the dragon is a parent of an other dragon
        it is the case that
        the other dragon flies.
scenario s is:
    bob is a dragon.
    alice is a dragon.
    alice is a parent of bob.
    sad expects changes [["add: bob is a parent of alice"], ["add: bob is a parent of bob"]].
    glad expects changes [["remove: alice is a parent of bob"], ["add: bob flies"]].
query sad is: which minimal change to the scenario makes it the case that it is not the case that bob is happy.
query glad is: which minimal change to the scenario makes it the case that alice is happy.`;
    assert.doesNotMatch(output(text), /not as expected/);
    assert.match(output(text), /^add: bob is a parent of alice\.$/m);
  },

  'negation and collection through recursion unfold, and LE2 reads names and numbers leniently'() {
    const party = document('*a person* will go, *a person* follows *a second person*, *a person* watches *a second person*.',
      'a first person will go if the first person follows a second person and the second person will go.\n' +
      'a first person will go if the first person watches a second person and it is not the case that the second person will go.\n' +
      'mary follows john.\njohn watches bob.', 'which person will go.');
    assert.deepEqual(sentences(party).sort(), ['john will go.', 'mary will go.']);
    // An underscore in a name is a space, a formula over a name fails, and a
    // scenario fact "A is B" without a template is accepted.
    const totals = document('*an amount* is the total, *an amount* is the bad total.',
      'a T is the total if a Sales_Associates = 4 and T = Sales Associates + 1.\na T is the bad total if T = Sales + 1.', 'which amount is the total and which other amount is the bad total.');
    assert.deepEqual(sentences(totals), []);
    assert.deepEqual(sentences(document('*an amount* is the total.', 'a T is the total if a Sales_Associates = 4 and T = Sales Associates + 1.', 'which amount is the total.')), ['5 is the total.']);
    assert.doesNotMatch(output(`the templates are: *a thing* is human.\nthe knowledge base k includes:\nscenario s is:\n    message 1 is 'a text'.\n    ann is human.\n    q expects answers ["ann is human"].\nquery q is: which thing is human.`), /not as expected/);
    // An expected number with decimals matches an answer rounded to them.
    assert.doesNotMatch(output(`the templates are: *a number* is a third.\nthe knowledge base k includes:\na number N is a third if N = 1 / 3.\nscenario s is:\n    q expects answers ["0.33 is a third"].\nquery q is: which number is a third.`), /not as expected/);
  },

  'rule labels, sections, constants, explicit variables and a lone which'() {
    const text = `the templates are:
    *a person* pays *an amount*,
    walking *a distance* takes *a number* minutes.
the constants are:
    the fee is 5.
the knowledge base k includes:
section main is:
rule fee: a person pays an amount if the amount = the fee * 2.
walking *a distance* takes *a number* minutes if the number = the distance * 12.
query q is: ann pays which amount.
query r is: walking 2 takes which minutes.`;
    assert.equal(output(text), '% query q\nann pays 10.\n\n% query r\nwalking 2 takes 24 minutes.\n');
  },

  'included files give their templates and rules, and included scenario files their cases'() {
    const files = new Map([
      ['dir/rules.le', 'the templates are: *a thing* is mortal, *a thing* is human.\nthe knowledge base r includes:\na person is mortal if the person is human.\nscenario ignored is:\n    ann is human.\nquery ignored is: which thing is human.'],
      ['dir/cases.le', 'the knowledge base c includes these resources:\n    rules.\nscenario s is:\n    bob is human.\nquery q is: which thing is mortal.'],
    ]);
    const io = { readFile: (path) => { if (!files.has(path)) throw new Error('missing'); return files.get(path); } };
    const main = 'the knowledge base m includes these scenarios:\n    cases.\nthe knowledge base m includes:\ncid is human.';
    const loaded = compileLe([[main, 'dir/main.le']], io);
    assert.equal(writeLe(run(loaded.program), loaded), '% query q with scenario s\nbob is mortal.\ncid is mortal.\n');
    assert.match(errorOf(() => compileLe([['the knowledge base m includes these resources:\n    other.', 'main.le']])), /including other needs file access/);
    assert.match(errorOf(() => compileLe([['the knowledge base m includes these resources:\n    https://example.org/x.', 'main.le']], io)), /including https:\/\/example.org\/x needs network access/);
  },

  'numbered conditions, grouped alternatives and functions written without their value'() {
    const numbered = `the templates are:
    *an entity* is a charity,
    *an entity* has *a turnover*,
    *an entity* must register.
the knowledge base k includes:
rule gst:
an entity must register if:
    1. the entity is a charity; and
    2. either:
    2.1. the entity has a turnover
    2.2. all of:
    2.2.1. the entity has a turnover; and
    2.2.2. the turnover >= 100.
ann is a charity.
ann has 50.
bob is a charity.
bob has 150.
query q is: which entity must register.`;
    // Without a connective, 2.1 joins 2.2 with "either"'s "or".
    assert.deepEqual(sentences(numbered), ['ann must register.', 'bob must register.']);
    const grouped = document('*a person* is rich, *a person* is famous, *a person* is successful, *a person* is happy.',
      'a person is successful if\n    any of\n        the person is rich\n        the person is famous.\n' +
      'a person is happy if\n    all of\n        the person is rich\n        the person is successful.\nmary is rich.\njohn is famous.',
      'which person is successful and the person is happy.');
    assert.deepEqual(sentences(grouped), ['mary is successful and mary is happy.']);
    const functions = `the templates are:
    the capacity of *a cup* is *a number* ml,
    *a cup* is expensive,
    the total of *a cup* is *an amount*.
the functions are:
    the price of a cup with capacity *a number* ml is *an amount*,
    the double of *a number* is *a number*.
the knowledge base k includes:
the price of a cup with capacity a number ml is an amount if the amount is the number / 10.
the double of a number is a result if the result is the number * 2.
a cup is expensive if the capacity of the cup is a capacity ml and the price of a cup with capacity the capacity ml > 10.
the total of a cup is a total if the capacity of the cup is a capacity ml and the total is the double of (the price of a cup with capacity the capacity ml + 1).
the capacity of mug is 200 ml.
the capacity of thimble is 20 ml.
query q is: which cup is expensive.
query r is: the total of which cup is which amount.`;
    assert.equal(output(functions), '% query q\nmug is expensive.\n\n% query r\nthe total of mug is 42.\nthe total of thimble is 6.\n');
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
      ['the templates are: *a thing* is human; via service geo.', /addition "; via service geo" belongs to Logical English 2/],
      ['the fluents are:\n *a light* is on.', /"the fluents are".*Logical English 2/],
      ['the functions are:\n the price of *a cup* plus *an amount*.', /a function has the form/],
      ['the templates are: *a* likes *b*,\nlikes *a* *b*.', /both name the relation likes\/2/],
      ['the templates are: *a thing* is human.\nthe knowledge base k includes:\nann is greater than bob.', /built-in condition and cannot be concluded/],
      ['the templates are: *a thing* is human.\nthe knowledge base k includes:\nq expects answers [].', /expectation belongs to a scenario/],
      ['the templates are: *a thing* is human.\nthe knowledge base k includes:\nit is not the case that ann is human.', /a negated fact belongs to a scenario/],
      ['the templates are: *a thing* is human.\nthe knowledge base k includes:\na thing is human if for all cases in which the thing is human.', /needs "it is the case that"/],

    ]) {
      assert.match(errorOf(() => compile(text)), pattern, text);
    }
  },
};
