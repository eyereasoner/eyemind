// Generate the table-driven LE fixtures without running eyemind. The
// manifest also lists hand-written cases in le-conformance/01 through 05.
import { writeFileSync } from 'node:fs';

const files = new Map();
const quoted = (value) => JSON.stringify(value);

function add(file, spec, name, source, output, { exit = 0 } = {}) {
  const cases = files.get(file) ?? [];
  const lines = [
    `conformance(${quoted(name)}, [`,
    `  spec(${quoted(`LE-SPEC.${spec}`)}),`,
    '  args("program.le"),',
  ];
  if (exit) lines.push(`  exit(${exit}),`);
  lines.push('  file("program.le", [', ...source.map((line) => `    ${quoted(line)},`), '  ]),');
  lines.push(`  stderr("${exit ? 'nonempty' : 'empty'}"),`);
  if (output.length > 2) lines.push('  stdout([', ...output.map((line) => `    ${quoted(line)},`), '  ]),');
  else lines.push(`  stdout(${quoted(output)}),`);
  lines.push('])');
  cases.push(lines.join('\n'));
  files.set(file, cases);
}

function query(file, spec, name, templates, facts, question, answers) {
  add(file, spec, name, [
    `the templates are: ${templates}`,
    'the knowledge base test includes:',
    ...facts,
    `query q is: ${question}.`,
  ], ['% query q', ...(answers.length ? answers : ['% no answers'])]);
}

const lexical = '06-names-and-variables.js';
for (const [input, output = input] of [
  ['robin'], ['North Wing'], ['São Paulo'], ['Niño'], ['Côte d’Azur'], ['Łódź'], ['Κρήτη'],
  ['JE-201'], ['route_7'], ['GST'], ['UK'], ['the UK'], ['the north gate'], ['the depot'],
  ['"line, branch"', 'line, branch'], ['"a place"', 'a place'], ['"Q1"', 'Q1'],
  ['"North: annex"', 'North: annex'], ["'the front gate'", 'the front gate'],
  ['Core Statistical Areas (Branch)'], ['Campus (North Wing)'],
  ['https://example.org/a::b'], ['https://example.org/map?layer=roads'], ['https://example.org/a/b%20c'],
  ['2018-06-29:00:00'], ['2024-02-29T23:59:59Z'], ['2021-10-09'],
  ['1,234,567', '1234567'], ['-42'], ['1.25'], ['0.0'], ['[east, west]'], ['[[room, hall], []]'],
]) {
  query(lexical, 'sentences', `term in a template place: ${input}`, '*a code* denotes *a value*.',
    [`mark denotes ${input}.`], 'mark denotes which value', [`mark denotes ${output}.`]);
}

for (const [introduction, reference] of [
  ['a bird', 'the bird'], ['an animal', 'the animal'], ['some bird', 'the bird'],
  ['a royal blue bird', 'the royal blue bird'], ['a bird T1', 'T1'], ['a bird BIRD', 'BIRD'],
  ['T1', 'T1'], ['*a bird*', 'the bird'], ['*an animal*', '*an animal*'],
]) {
  query(lexical, 'sentences', `variable sharing: ${introduction} / ${reference}`,
    '*a bird* perches on *a place*, *a bird* is settled.',
    ['tern perches on ledge.', `${introduction} is settled if ${reference} perches on ledge.`],
    'which bird is settled', ['tern is settled.']);
}
for (const word of ['which', 'what', 'who', 'when', 'where']) {
  query(lexical, 'sentences', `lone question word: ${word}`, 'the marker is *a name*.',
    ['the marker is landing.'], `the marker is ${word}`, ['the marker is landing.']);
}

const operators = '07-arithmetic-operators.js';
function calculation(file, name, formula, result) {
  add(file, 'arithmetic-comparisons-and-built-in-templates', name, [
    'the templates are: the result is *a number*.',
    `the knowledge base test includes: the result is a number N if N = ${formula}.`,
    'query q is: the result is which number.',
  ], ['% query q', `the result is ${result}.`]);
}

// Both operands and every intermediate value fit exactly in binary64. The
// expected numbers come from the operator definitions and LE's two precedence
// levels. Each pair exercises the grouped and ungrouped right operand.
const binary = [
  ['+', 1, (a, b) => a + b], ['-', 1, (a, b) => a - b],
  ['*', 2, (a, b) => a * b], ['//', 2, (a, b) => Math.floor(a / b)],
  ['mod', 2, (a, b) => a - Math.floor(a / b) * b],
];
for (const [outer, outerRank, applyOuter] of binary) {
  for (const [inner, innerRank, applyInner] of binary) {
    const a = 30, b = 9, c = 4;
    const right = applyOuter(a, applyInner(b, c));
    const flat = outerRank < innerRank ? right : applyInner(applyOuter(a, b), c);
    calculation(operators, `grouped operators: ${a} ${outer} (${b} ${inner} ${c})`,
      `${a} ${outer} (${b} ${inner} ${c})`, right);
    calculation(operators, `unparenthesized operators: ${a} ${outer} ${b} ${inner} ${c}`,
      `${a} ${outer} ${b} ${inner} ${c}`, flat);
  }
}

// Use powers of two for non-integral quotients so the expected decimal is
// exact. Floor and remainder use q = floor(a/b) and r = a - b*q.
for (const a of [-17, -16, -1, 0, 1, 16, 17]) {
  for (const b of [-8, 8]) {
    const q = Math.floor(a / b);
    const operand = b < 0 ? `(0 - ${-b})` : String(b);
    const dividend = a < 0 ? `(0 - ${-a})` : String(a);
    for (const [op, expected] of [['/', a / b], ['//', q], ['mod', a - b * q]]) {
      calculation(operators, `signed ${op}: ${a} by ${b}`, `${dividend} ${op} ${operand}`, String(expected));
    }
  }
}
for (const [formula, expected] of [
  ['9007199254740992 + 1', '9007199254740993'], ['9007199254740993 - 9007199254740992', '1'],
  ['9007199254740993 * 2', '18014398509481986'], ['9007199254740993 mod 2', '1'],
  ['9007199254740993 // 2', '4503599627370496'], ['9007199254740994 / 2', '4503599627370497'],
  ['1.0 + 1', '2.0'], ['3.0 / 2', '1.5'], ['4.0 / 2', '2.0'], ['(1 + 2.0) * 2', '6.0'],
  ['-(3 + 2)', '-5'], ['-(-2)', '2'],
]) calculation(operators, `numeric type and value: ${formula}`, formula, expected);

const comparisons = '08-comparisons-and-functions.js';
for (const [operator, accepts] of [
  ['<', [-1]], ['>', [1]], ['<=', [-1, 0]], ['=<', [-1, 0]], ['>=', [0, 1]], ['=', [0]], ['==', [0]], ['!=', [-1, 1]],
  ['is less than', [-1]], ['is greater than', [1]], ['is less than or equal to', [-1, 0]],
  ['is greater than or equal to', [0, 1]], ['is equal to', [0]], ['is different from', [-1, 1]],
]) {
  for (const [a, order] of [[1, -1], [2, 0], [3, 1]]) {
    const expression = `${a} + 0 ${operator} 1.0 + 1.0`;
    query(comparisons, 'arithmetic-comparisons-and-built-in-templates', `comparison: ${expression}`,
      'the condition holds.', [`the condition holds if ${expression}.`],
      'the condition holds', accepts.includes(order) ? ['the condition holds.'] : []);
  }
}
for (const [operator, left, right, succeeds] of [
  ['=', '2', '2.0', false], ['==', '2', '2.0', false], ['!=', '2', '2.0', true],
  ['\\=', 'east', 'west', true], ['\\=', 'east', 'east', false], ['\\==', '2', '2.0', true],
  ['\\==', 'east', 'east', false], ['is different from', '[east, west]', '[west, east]', true],
  ['is equal to', '[east, west]', '[east, west]', true], ['is not equal to', 'east', 'east', false],
]) {
  const expression = `${left} ${operator} ${right}`;
  query(comparisons, 'arithmetic-comparisons-and-built-in-templates', `term test: ${expression}`,
    'the condition holds.', [`the condition holds if ${expression}.`], 'the condition holds',
    succeeds ? ['the condition holds.'] : []);
}
for (const [fn, inputs] of [
  ['ceiling', [['1.2', '2'], ['-1.2', '-1'], ['0', '0']]],
  ['floor', [['1.8', '1'], ['-1.2', '-2'], ['0', '0']]],
  ['round', [['1.4', '1'], ['1.6', '2'], ['-1.6', '-2']]],
  ['truncate', [['1.9', '1'], ['-1.9', '-1'], ['0', '0']]],
  ['integer', [['1.2', '1'], ['1.8', '2'], ['-1.2', '-1']]],
  ['abs', [['-7', '7'], ['3', '3'], ['-1.5', '1.5']]],
  ['sqrt', [['0', '0.0'], ['4', '2.0'], ['2.25', '1.5']]],
]) {
  for (const [n, expected] of inputs) calculation(comparisons, `arithmetic function: ${fn}(${n})`, `${fn}(${n})`, expected);
}

const dates = '09-calendar.js';
const datePairs = [
  ['1899-12-31', 1, '1900-01-01'], ['1900-02-28', 1, '1900-03-01'], ['1900-02-27', 2, '1900-03-01'],
  ['1999-12-31', 1, '2000-01-01'], ['2000-02-28', 1, '2000-02-29'], ['2000-02-29', 1, '2000-03-01'],
  ['2000-02-28', 2, '2000-03-01'], ['2099-12-31', 1, '2100-01-01'], ['2100-02-28', 1, '2100-03-01'],
  ['2400-02-28', 1, '2400-02-29'], ['2400-02-29', 1, '2400-03-01'],
  ['2023-04-30', 1, '2023-05-01'], ['2023-06-30', 1, '2023-07-01'], ['2023-07-31', 1, '2023-08-01'],
  ['2023-09-30', 1, '2023-10-01'], ['2023-11-30', 1, '2023-12-01'], ['2024-01-31', 30, '2024-03-01'],
  ['2020-02-28', 366, '2021-02-28'], ['2024-01-01', 366, '2025-01-01'],
  ['2023-01-01', 365, '2024-01-01'], ['2024-07-01', 0, '2024-07-01'],
];
for (const [start, n, end] of datePairs) {
  const relation = `${n === 1 ? 'day' : 'days'} after`;
  const answer = `${end} is ${n} ${relation} ${start}.`;
  for (const [part, question] of [
    ['end', `which date is ${n} ${relation} ${start}`],
    ['start', `${end} is ${n} ${relation} which date`],
    ['distance', `${end} is which number ${relation} ${start}`],
  ]) {
    query(dates, 'arithmetic-comparisons-and-built-in-templates', `calendar ${part}: ${start} to ${end}`,
      'the calendar is ready.', [], question, [answer]);
  }
}
for (const [form, accepted] of [
  ['after', [1]], ['before', [-1]], ['after or equal to', [0, 1]],
  ['before or equal to', [-1, 0]], ['not before', [0, 1]],
]) {
  for (const [day, order] of [['1999-12-31', -1], ['2000-01-01', 0], ['2000-01-02', 1]]) {
    const question = `${day} is ${form} 2000-01-01`;
    query(dates, 'arithmetic-comparisons-and-built-in-templates', `calendar order: ${question}`,
      'the calendar is ready.', [], question, accepted.includes(order) ? [`${question}.`] : []);
  }
}

const logic = '10-rule-conditions.js';
const ruleTemplates = '*a beacon* is lit, *a beacon* is watched, *a beacon* is audible, *a beacon* is noticed.';
const states = [
  [false, false, false], [false, false, true], [false, true, false], [false, true, true],
  [true, false, false], [true, false, true], [true, true, false], [true, true, true],
];
const beaconFacts = (lit, watched, audible) => [
  ...(lit ? ['hill is lit.'] : []), ...(watched ? ['hill is watched.'] : []), ...(audible ? ['hill is audible.'] : []),
];
for (const [form, body, holds] of [
  ['flat or then and', ['    if the beacon is lit', '    or the beacon is watched', '    and the beacon is audible.'],
    (a, b, c) => (a || b) && c],
  ['indented and under or', ['    if the beacon is lit', '    or the beacon is watched', '        and the beacon is audible.'],
    (a, b, c) => a || (b && c)],
  ['flat and then or', ['    if the beacon is lit', '    and the beacon is watched', '    or the beacon is audible.'],
    (a, b, c) => (a && b) || c],
  ['indented or under and', ['    if the beacon is lit', '    and the beacon is watched', '        or the beacon is audible.'],
    (a, b, c) => a && (b || c)],
  ['numbered all of with an alternative', ['    if:', '    1. the beacon is lit; and', '    2. either:',
    '    2.1. the beacon is watched', '    2.2. the beacon is audible.'], (a, b, c) => a && (b || c)],
  ['grouped alternatives with a nested conjunction', ['    if', '    any of:', '        the beacon is lit',
    '        all of:', '            the beacon is watched', '            the beacon is audible.'], (a, b, c) => a || (b && c)],
  ['negated group followed by a condition', ['    if it is not the case that',
    '        the beacon is lit', '        and the beacon is watched', '    and the beacon is audible.'],
    (a, b, c) => !(a && b) && c],
]) {
  for (const [a, b, c] of states) {
    query(logic, 'facts-and-rules', `rule ${form}: lit=${a}, watched=${b}, audible=${c}`,
      ruleTemplates, ['a beacon is noticed', ...body, ...beaconFacts(a, b, c)],
      'hill is noticed', holds(a, b, c) ? ['hill is noticed.'] : []);
  }
}
for (const [ternNests, ternTagged, gullTagged] of states) {
  query(logic, 'facts-and-rules', `universal: tern nests=${ternNests}, tern tagged=${ternTagged}, gull tagged=${gullTagged}`,
    '*a bird* nests, *a bird* is tagged. all nests are marked.', [
      'all nests are marked if for all cases in which a bird nests it is the case that the bird is tagged.',
      'gull nests.', ...(ternNests ? ['tern nests.'] : []), ...(ternTagged ? ['tern is tagged.'] : []),
      ...(gullTagged ? ['gull is tagged.'] : []),
    ], 'all nests are marked', (!ternNests || ternTagged) && gullTagged ? ['all nests are marked.'] : []);
}
for (const [term, expected] of [
  ['an object', 'tern'], ['a seabird', 'tern'], ['an animal', 'tern'],
  ['a shorebird', null], ['a plant', null],
]) {
  query(logic, 'facts-and-rules', `ontology class selection: ${term}`, 'the register is ready.', [
    'the ontology is:', '    a tern is a seabird.', '    a seabird is an animal.', '    an animal is an object.',
    'the knowledge base test includes: tern is a tern.',
  ], `tern is ${term}`, expected ? [`${expected} is ${term}.`] : []);
}

const collection = '11-collections-and-lists.js';
for (const [label, values, sum, min, max, mean] of [
  ['empty', [], 0, null, null, null],
  ['one zero', [0], 0, 0, 0, 0],
  ['one negative value', [-4], -4, -4, -4, -4],
  ['repeated unordered values', [9, 2, 9, 0], 20, 0, 9, 5],
  ['signed values cancelling', [2, -2, 4, -4], 0, -4, 4, 0],
  ['fractional mean', [1, 2], 3, 1, 2, 1.5],
  ['all negative values', [-7, -3, -5], -15, -7, -3, -5],
  ['values that reach the same minimum', [8, 0, 0, 0], 8, 0, 8, 2],
]) {
  const facts = values.map((value, index) => `box${index + 1} holds ${value}.`);
  for (const [op, expected] of [
    ['sum', sum], ['count', values.length], ['min', min], ['minimum', min],
    ['max', max], ['maximum', max], ['average', mean], ['list', `[${values.join(', ')}]`],
  ]) {
    query(collection, 'facts-and-rules', `aggregate ${op}: ${label}`,
      '*a box* holds *a weight*. the result is *a value*.', [
        `the result is a total if the total is the ${op} of each W such that a box holds W.`, ...facts,
      ], 'the result is which value', expected === null ? [] : [`the result is ${expected}.`]);
  }
}
const listQuestions = new Set();
for (const [first, second, joined, reversed, n] of [
  ['[]', '[]', '[]', '[]', 0], ['[]', '[west]', '[west]', '[]', 0],
  ['[east]', '[]', '[east]', '[east]', 1], ['[east]', '[west]', '[east, west]', '[east]', 1],
  ['[east, north]', '[south, west]', '[east, north, south, west]', '[north, east]', 2],
  ['[east, east, west]', '[east]', '[east, east, west, east]', '[west, east, east]', 3],
  ['[[east, west], north]', '[[]]', '[[east, west], north, []]', '[north, [east, west]]', 2],
]) {
  for (const [q, a] of [
    [`appending ${first} then ${second} gives which list`, `appending ${first} then ${second} gives ${joined}.`],
    [`which list is the reverse of ${first}`, `${reversed} is the reverse of ${first}.`],
    [`the length of ${first} is which number`, `the length of ${first} is ${n}.`],
  ]) {
    if (listQuestions.has(q)) continue;
    listQuestions.add(q);
    query(collection, 'arithmetic-comparisons-and-built-in-templates', `list operation: ${q}`,
      'the list is ready.', [], q, [a]);
  }
}
for (const [item, list, found] of [
  ['east', '[]', false], ['east', '[east]', true], ['east', '[north, east]', true],
  ['east', '[west, south]', false], ['[east]', '[[east], west]', true], ['east', '[[east], west]', false],
  ['2', '[2.0]', false], ['2', '[2, 2.0]', true],
]) {
  const question = `${item} is in ${list}`;
  query(collection, 'arithmetic-comparisons-and-built-in-templates', `membership: ${question}`,
    'the list is ready.', [], question, found ? [`${question}.`] : []);
}

const scenarios = '12-assumptions-and-changes.js';
const lampStates = ['absent', 'proved', 'denied'];
for (const [a, b] of lampStates.flatMap((left) => lampStates.map((right) => [left, right]))) {
  const facts = [[a, 'lamp'], [b, 'torch']].flatMap(([state, device]) => state === 'absent' ? []
    : [`    ${state === 'denied' ? 'it is not the case that ' : ''}${device} is lit.`]);
  for (const operator of ['and', 'or']) {
    const output = ['% query q with scenario evening'];
    const succeeds = operator === 'and' ? a !== 'denied' && b !== 'denied' : a !== 'denied' || b !== 'denied';
    if (!succeeds) output.push('% no answers');
    else {
      output.push('the shed is bright.');
      const missing = [[a, 'lamp'], [b, 'torch']].filter(([state]) => state === 'absent').map(([, device]) => `${device} is lit`);
      if (operator === 'and' && missing.length) output.push(`% assuming that ${missing.join(' and ')}`);
      if (operator === 'or' && a !== 'proved' && b !== 'proved') {
        missing.forEach((condition, index) => output.push(`% ${index ? 'or assuming' : 'assuming'} that ${condition}`));
      }
    }
    add(scenarios, 'abduction', `assumable lamps: ${a} ${operator} ${b}`, [
      'the templates are: *a device* is lit; assumable. the shed is bright.',
      `the knowledge base test includes: the shed is bright if lamp is lit ${operator} torch is lit.`,
      'scenario evening is:', ...facts, 'query q is: the shed is bright.',
    ], output);
  }
}
for (const [a, b] of [[false, false], [false, true], [true, false], [true, true]]) {
  for (const [operator, positive] of [['and', true], ['and', false], ['or', true], ['or', false]]) {
    const current = operator === 'and' ? a && b : a || b;
    const facts = [...(a ? ['    lamp is lit.'] : []), ...(b ? ['    torch is lit.'] : [])];
    const output = ['% query q with scenario evening'];
    if (current === positive) output.push('no change is needed.');
    else {
      const changes = [
        ...(a !== positive ? [`${positive ? 'add' : 'remove'}: lamp is lit`] : []),
        ...(b !== positive ? [`${positive ? 'add' : 'remove'}: torch is lit`] : []),
      ];
      const needBoth = positive === (operator === 'and');
      output.push(...(needBoth ? [`${changes.join(' and ')}.`] : changes.map((change) => `${change}.`)));
    }
    add(scenarios, 'flip-queries', `minimal changes: lit=${a}, torch=${b}, ${operator} expected=${positive}`, [
      'the templates are: *a device* is lit; judged. the shed is bright.',
      `the knowledge base test includes: the shed is bright if lamp is lit ${operator} torch is lit.`,
      'scenario evening is:', '    lamp is a device.', '    torch is a device.', ...facts,
      `query q is: which minimal change to the scenario makes it the case that ${positive ? '' : 'it is not the case that '}the shed is bright.`,
    ], output);
  }
}

const rejection = '13-rejected-input.js';
for (const [part, spec, source] of [
  ['missing declaration', 'sentences', ['the templates are: *a bird* nests.', 'query q is: tern swims.']],
  ['missing period on a query', 'documents', ['the templates are: *a bird* nests.', 'query q is: tern nests']],
  ['text before the first section', 'documents', ['tern nests.', 'the templates are: *a bird* nests.']],
  ['broken list brackets', 'sentences', ['the templates are: *a bag* contains *a list*.', 'query q is: bag contains [bread, cheese.']],
  ['unsupported otherwise', 'not-supported', ['the templates are: raining. shining. thunder.', 'the knowledge base test includes: thunder if raining otherwise shining.']],
  ['unsupported unless', 'not-supported', ['the templates are: raining. shining. thunder.', 'the knowledge base test includes: thunder if raining unless shining.']],
  ['prepositional qualifier', 'not-supported', ['the templates are: *a bird* nests; prepositional.']],
  ['service qualifier', 'not-supported', ['the templates are: *a bird* nests; via service habitat.']],
  ['fluents header', 'not-supported', ['the fluents are:', '*a bird* nests.']],
  ['events header', 'not-supported', ['the events are:', '*a bird* nests.']],
  ['event predicates header', 'not-supported', ['the event predicates are:', '*a bird* nests.']],
  ['meta templates header', 'not-supported', ['the meta templates are:', '*a bird* nests.']],
  ['bad function head', 'functions', ['the functions are: the double of *a number* plus *a number*.']],
  ['predicate-name collision', 'templates', ['the templates are:', '    *a bird* visits *a place*,', '    visits *a bird* *a place*.']],
  ['expected answers outside a scenario', 'scenarios-queries-and-expected-answers', ['the templates are: *a bird* nests.',
    'the knowledge base test includes: q expects answers [].']],
  ['negated fact outside a scenario', 'abduction', ['the templates are: *a bird* nests; assumable.',
    'the knowledge base test includes: it is not the case that tern nests.']],
  ['missing universal consequent', 'facts-and-rules', ['the templates are: the rule holds. *a bird* nests.',
    'the knowledge base test includes: the rule holds if for all cases in which a bird nests.']],
  ['unsupported Prolog goal', 'not-supported', ['the templates are: the rule holds.',
    'the knowledge base test includes: the rule holds if prolog call(true).']],
]) add(rejection, spec, `reject ${part}`, source, [], { exit: 1 });

for (const [name, cases] of files) {
  const header = '// Generated by tools/le-conformance-cases.js from LE-SPEC expectations.\n';
  writeFileSync(new URL(`../le-conformance/${name}`, import.meta.url), `${header}\n${cases.join('\n\n')}\n`);
  console.log(`${name}: ${cases.length} cases`);
}
