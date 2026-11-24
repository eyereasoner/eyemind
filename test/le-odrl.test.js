import { readFileSync } from 'node:fs';
import { assert, cli, errorOf } from './helpers.js';
import { checkProof, compileLe, loadText, run, write } from '../src/index.js';
import { loadInputs, writeConclusions } from '../src/formats.js';
import { parseRdf, writeRdf } from '../src/rdf.js';
import { isomorphic } from './w3c.js';

const LE = readFileSync(new URL('../examples/handicap-card-le.le', import.meta.url), 'utf8');
const TTL = readFileSync(new URL('../examples/handicap-card.ttl', import.meta.url), 'utf8');
const RESEARCH = readFileSync(new URL('../examples/research-snapshot-le.le', import.meta.url), 'utf8');
const loaded = (text = LE) => compileLe([[text, 'handicap-card-le.le']]);
const turtle = (text = TTL) => loadInputs([[text, 'handicap-card.ttl']], null, { odrl: true });

export const tests = {
  'the English snapshot uses exactly the Turtle facts and the same ODRL validation and evaluation'() {
    const le = loaded(), ttl = turtle();
    assert.deepEqual(le.program.sources.map((s) => write(s.head)), ttl.program.sources.map((s) => write(s.head)));
    const result = run(le.program, { proof: true });
    assert.deepEqual(result.answers, run(ttl.program).answers);
    assert.equal(checkProof(ttl.program, result.proof).valid, true);
    assert.equal(checkProof(loadText(le.text), result.proof).valid, true);
    const command = cli(['examples/handicap-card-le.le']);
    assert.equal(command.code, 0, command.stderr);
    assert.match(command.stdout, /issueAlice has decision allowed\./);
    assert.match(command.stdout, /issueBob has decision prohibited\./);
    assert.match(command.stdout, /evaluation has conflictCount 1\./);
    assert.match(le.text, /\/\/ Validation:/);
    assert.doesNotMatch(le.text, /\bimport\s/);
    const forged = result.proof.replaceAll('odrl#Allowed', 'odrl#Prohibited');
    assert.notEqual(forged, result.proof);
    assert.equal(checkProof(le.program, forged).valid, false);
  },

  'changed observations, unsupported policy features and conflict strategies stay equivalent'() {
    const cases = [
      [LE.replace('aliceState has administrativeHold false.', ''),
        TTL.replace(':residenceVerified true ; :administrativeHold false .', ':residenceVerified true .')],
      [LE.replace('bobState has administrativeHold true.', 'bobState has administrativeHold false.'),
        TTL.replace(':residenceVerified true ; :administrativeHold true .', ':residenceVerified true ; :administrativeHold false .')],
      [LE + '\naliceState has administrativeHold true.', TTL + '\n:aliceState :administrativeHold true .'],
      [LE.replace('approved has rightOperand true.', ''), TTL.replace('odrl:leftOperand :assessmentApproved ; odrl:operator odrl:eq ; odrl:rightOperand true .',
        'odrl:leftOperand :assessmentApproved ; odrl:operator odrl:eq .')],
      [LE + '\nmayIssue has duty payment.', TTL + '\n:mayIssue odrl:duty :payment .'],
      ...['perm', 'invalid'].map((strategy) => [LE.replace('conflictStrategy prohibit', 'conflictStrategy ' + strategy),
        TTL.replace('eval:conflictStrategy odrl:prohibit', 'eval:conflictStrategy odrl:' + strategy)]),
    ];
    for (const [le, ttl] of cases) {
      const result = run(loaded(le).program);
      assert.deepEqual(result.answers, run(turtle(ttl).program).answers);
      const report = writeConclusions(loaded(le), result, { format: 'le' });
      assert.deepEqual(loaded(report).program.sources.map((s) => write(s.head)).sort(), [...result.answers].sort());
    }
  },

  'qualified snapshot statements take names, booleans and operand lists as the short forms do'() {
    const sources = (le) => le.program.sources.map((s) => write(s.head));
    const qualified = RESEARCH.replace('scope has andOperands [research, contactData].', 'ex:scope has odrl:and [research, contactData].')
      .replace('ex:researchState has dpv:hasPurpose', 'researchState has dpv:hasPurpose');
    assert.notEqual(qualified, RESEARCH);
    assert.deepEqual(sources(compileLe([[qualified, 'q.le']])), sources(compileLe([[RESEARCH, 'q.le']])));
    const prefixed = LE.replace(/(Use ODRL snapshot logic[^\n]+\n)/, '$1Use prefix ex with namespace "https://example.org/handicap-card#".\n');
    const booleans = prefixed.replace('aliceState has assessmentApproved true', 'aliceState has ex:assessmentApproved true');
    assert.notEqual(booleans, prefixed);
    assert.deepEqual(sources(loaded(booleans)), sources(loaded(prefixed)));
    // Outside a snapshot a qualified property still needs an RDF value.
    assert.match(errorOf(() => compileLe([['Use prefix ex with namespace "https://example.org/x#".\nex:a has ex:b [ex:c, ex:d].', 'x.le']])),
      /needs an RDF value/);
    const erasure = cli(['examples/right-to-erasure-le.le']);
    assert.equal(erasure.code, 0, erasure.stderr);
    assert.match(erasure.stdout, /eraseInvoices has decision prohibited\./);
  },

  'an LE snapshot report writes other IRIs and witness keys with prefixes and reads back'() {
    const research = cli(['examples/research-snapshot-le.le']).stdout;
    assert.match(research, /^Use ODRL vocabulary with namespace "https:\/\/example\.org\/research-snapshot#"\.\nUse prefix eval /);
    assert.match(research, /ready has action odrl:use\./);
    assert.match(research, /witness\(rule \d+, "Issue", ex:pending, ex:credit, ex:researchUse, eval:MissingDutyEvidence\)/);
    assert.doesNotMatch(research, /"iri"/);
    // Without a prefix of its own, the snapshot namespace is named ns.
    const handicap = cli(['examples/handicap-card-le.le']).stdout;
    assert.match(handicap, /^Use ODRL vocabulary with namespace "https:\/\/example\.org\/handicap-card#"\.\nUse prefix ns with namespace "https:\/\/example\.org\/handicap-card#"\./);
    assert.doesNotMatch(handicap, /"iri"/);
  },

  'a snapshot can use a qualified DPV property and value for an ODRL equality constraint'() {
    const input = LE.replace(/(Use ODRL snapshot logic[^\n]+\n)/, '$1' +
      'Use prefix dpv with namespace "https://w3id.org/dpv#".\n' +
      'Use prefix ex with namespace "https://example.org/handicap-card#".\n')
      .replace('approved has leftOperand assessmentApproved', 'approved has leftOperand dpv:hasPurpose')
      .replace('approved has rightOperand true', 'approved has rightOperand dpv:AcademicResearch')
      .replace(/(aliceState|bobState) has assessmentApproved true and (\w+) has residenceVerified true\./g,
        'ex:$1 has dpv:hasPurpose dpv:AcademicResearch. $2 has residenceVerified true.');
    const le = loaded(input), result = run(le.program, { proof: true });
    const output = writeConclusions(le, result, { format: 'le' });
    assert.match(output, /issueAlice has decision allowed\./);
    assert.match(output, /issueBob has decision prohibited\./);
    assert.equal(checkProof(loadText(le.text), result.proof).valid, true);
    const missing = loaded(input.replace('ex:aliceState has dpv:hasPurpose dpv:AcademicResearch.', ''));
    assert.match(writeConclusions(missing, run(missing.program), { format: 'le' }), /issueAlice has decision undetermined\./);
  },

  'LE operand lists, request duty evidence and DPV categories agree with the Turtle snapshot'() {
    const le = loaded(RESEARCH), result = run(le.program, { proof: true });
    const report = writeConclusions(le, result, { format: 'le' });
    assert.match(report, /ready has decision allowed\./);
    assert.match(report, /pending has decision undetermined\./);
    assert.match(report, /marketing has decision notApplicable\./);
    assert.match(report, /has reportDuty credit\./);
    assert.match(report, /MissingDutyEvidence/);
    assert.deepEqual(loaded(report).program.sources.map((s) => write(s.head)).sort(), [...result.answers].sort());
    assert.ok(checkProof(loadText(le.text), result.proof).valid);
    const asTurtle = turtle(writeRdf(le.compiled.quads));
    const output = (input, answer) => parseRdf(writeConclusions(input, answer, { format: 'turtle' })).quads;
    assert.ok(isomorphic(output(le, result), output(asTurtle, run(asTurtle.program))));
    const disconnected = loaded(RESEARCH.replace('pd:EmailAddress has skos:broader pd:Contact.', ''));
    assert.match(writeConclusions(disconnected, run(disconnected.program), { format: 'le' }), /ready has decision notApplicable\./);
    const unsupported = loaded(RESEARCH.replace('research has leftOperand dpv:hasPurpose', 'research has leftOperand dpv:hasLegalBasis'));
    assert.match(writeConclusions(unsupported, run(unsupported.program), { format: 'le' }), /UnsupportedCategoryProperty/);
  },

  'the LE report retains every RDF fact and witness and Turtle output matches the original graph'() {
    const le = loaded(), result = run(le.program);
    const report = writeConclusions(le, result, { format: 'le' });
    assert.match(report, /^Use ODRL vocabulary with namespace/);
    const reread = loaded(report);
    assert.deepEqual(reread.program.sources.map((s) => write(s.head)).sort(), [...result.answers].sort());
    const native = writeConclusions(le, result, { format: 'turtle' });
    const original = cli(['--odrl', 'examples/handicap-card.ttl']);
    assert.ok(isomorphic(parseRdf(native).quads, parseRdf(original.stdout).quads));
    const ordinary = compileLe([['Alice has parent Bob. Find whether parent(Alice, Bob).', 'ordinary.le']]);
    assert.deepEqual(run(ordinary.program).answers, ["parent('Alice', 'Bob')"]);
    assert.deepEqual(run(compileLe([['Use is a word. Find whether Use is a word.', 'ordinary.le']]).program).answers, ["word('Use')"]);
  },

  'snapshot rules derive observations and duty evidence that the unchanged evaluator decides'() {
    // Alice's residence follows from her registration instead of being stated.
    const derived = LE.replace('aliceState has assessmentApproved true and aliceState has residenceVerified true.',
      'aliceState has assessmentApproved true.\nAlice has registeredIn civicDistrict.\n' +
      'For every S and P, if S is a state and S has subject P and P has registeredIn civicDistrict then S has residenceVerified true.');
    assert.notEqual(derived, LE);
    const le = loaded(derived), result = run(le.program, { proof: true });
    const output = writeConclusions(le, result, { format: 'le' });
    assert.match(output, /issueAlice has decision allowed\./);
    assert.match(output, /issueBob has decision prohibited\./);
    assert.equal(checkProof(loadText(le.text), result.proof).valid, true);
    assert.ok(!checkProof(le.program, result.proof.replaceAll('odrl#Allowed', 'odrl#Prohibited')).valid);
    // Without the registration the observation is missing, not false.
    const unregistered = loaded(derived.replace('Alice has registeredIn civicDistrict.\n', ''));
    assert.match(writeConclusions(unregistered, run(unregistered.program), { format: 'le' }), /issueAlice has decision undetermined\./);
    // An aggregate in a snapshot rule has its helpers; a snapshot without
    // rules keeps its clauses, so its saved proof still checks.
    const counted = LE.replace('aliceState has assessmentApproved true and aliceState has residenceVerified true.',
      'aliceState has assessmentApproved true.\naliceState has proof utilityBill and aliceState has proof leaseContract.\n' +
      'For every S and N, if S is a state and N is the number of D such that S has proof D and N is at least 2 then S has residenceVerified true.');
    const tally = loaded(counted);
    assert.match(writeConclusions(tally, run(tally.program), { format: 'le' }), /issueAlice has decision allowed\./);
    assert.match(tally.text, /le:count/);
    assert.equal(cli(['--check-proof', 'examples/proof/handicap-card-le.js', 'examples/handicap-card-le.le']).code, 0);
    const breach = cli(['examples/breach-notification-le.le']);
    assert.equal(breach.code, 0, breach.stderr);
    assert.match(breach.stdout, /hostingLeak has unmetDuty alertShop\./);
  },

  'ODRL activation is explicit and misplaced directives, questions, vocabulary rules and nonground data are rejected'() {
    const directive = 'Use ODRL snapshot logic with namespace "https://example.org/#".\n';
    assert.match(errorOf(() => loaded('Alice is a person.\n' + directive)), /first sentence/);
    assert.match(errorOf(() => loaded(directive + 'For every X, X is a person.')), /ground/);
    const vocabulary = 'Use ODRL vocabulary with namespace "https://example.org/#".\n';
    assert.match(errorOf(() => loaded(vocabulary + 'Every person is mortal.')), /vocabulary document contains ground facts, not rules/);
    assert.match(errorOf(() => loaded(directive + 'Find whether Alice is a person.')), /not questions; its report is the answer/);
    assert.match(errorOf(() => loaded(directive.replace('https://example.org/#', 'relative#'))), /absolute IRI/);
    assert.match(errorOf(() => compileLe([[directive, 'one.le'], ['Alice is a person.', 'two.le']])), /one LE file/);
    assert.equal(loaded(LE.replace(/^Use ODRL snapshot logic[^\n]+\n/m, '')).compiled.odrl, undefined);
    assert.match(errorOf(() => loaded(directive + 'rdf(iri("https://example.org/a"), iri("https://example.org/p"), evil(1)).')), /LE ODRL values need names, numbers or explicit RDF terms/);
    assert.match(errorOf(() => loaded(directive + 'Alice has target iri("relative").')), /IRIs must be absolute/);
  },
};
