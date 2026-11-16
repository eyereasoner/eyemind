// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('https://example.org/handicap-card#evaluation'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://eyereasoner.github.io/eyemind/odrl#EvaluationReport'))
rdf(iri('https://example.org/handicap-card#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#policy'), iri('https://example.org/handicap-card#eligibility'))
rdf(iri('https://example.org/handicap-card#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#policy'), iri('https://example.org/handicap-card#administrativeHold'))
rdf(iri('https://example.org/handicap-card#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#conflictStrategy'), iri('http://www.w3.org/ns/odrl/2/prohibit'))
rdf(iri('https://example.org/handicap-card#issueAlice'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://eyereasoner.github.io/eyemind/odrl#Request'))
rdf(iri('https://example.org/handicap-card#issueAlice'), iri('http://www.w3.org/ns/odrl/2/assignee'), iri('https://example.org/handicap-card#CivicOffice'))
rdf(iri('https://example.org/handicap-card#issueAlice'), iri('http://www.w3.org/ns/odrl/2/action'), iri('https://example.org/handicap-card#issueHandicapCard'))
rdf(iri('https://example.org/handicap-card#issueAlice'), iri('http://www.w3.org/ns/odrl/2/target'), iri('https://example.org/handicap-card#HandicapCardService'))
rdf(iri('https://example.org/handicap-card#issueAlice'), iri('https://eyereasoner.github.io/eyemind/odrl#subject'), iri('https://example.org/handicap-card#Alice'))
rdf(iri('https://example.org/handicap-card#issueAlice'), iri('https://eyereasoner.github.io/eyemind/odrl#state'), iri('https://example.org/handicap-card#aliceState'))
rdf(iri('https://example.org/handicap-card#issueBob'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://eyereasoner.github.io/eyemind/odrl#Request'))
rdf(iri('https://example.org/handicap-card#issueBob'), iri('http://www.w3.org/ns/odrl/2/assignee'), iri('https://example.org/handicap-card#CivicOffice'))
rdf(iri('https://example.org/handicap-card#issueBob'), iri('http://www.w3.org/ns/odrl/2/action'), iri('https://example.org/handicap-card#issueHandicapCard'))
rdf(iri('https://example.org/handicap-card#issueBob'), iri('http://www.w3.org/ns/odrl/2/target'), iri('https://example.org/handicap-card#HandicapCardService'))
rdf(iri('https://example.org/handicap-card#issueBob'), iri('https://eyereasoner.github.io/eyemind/odrl#subject'), iri('https://example.org/handicap-card#Bob'))
rdf(iri('https://example.org/handicap-card#issueBob'), iri('https://eyereasoner.github.io/eyemind/odrl#state'), iri('https://example.org/handicap-card#bobState'))
rdf(iri('https://example.org/handicap-card#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#validationStatus'), iri('https://eyereasoner.github.io/eyemind/odrl#Valid'))
rdf(iri('https://example.org/handicap-card#issueAlice'), iri('https://eyereasoner.github.io/eyemind/odrl#unmetConstraint'), iri('https://example.org/handicap-card#held'))
rdf(iri('https://example.org/handicap-card#issueAlice'), iri('https://eyereasoner.github.io/eyemind/odrl#permission'), iri('https://example.org/handicap-card#mayIssue'))
rdf(iri('https://example.org/handicap-card#issueBob'), iri('https://eyereasoner.github.io/eyemind/odrl#permission'), iri('https://example.org/handicap-card#mayIssue'))
rdf(iri('https://example.org/handicap-card#issueBob'), iri('https://eyereasoner.github.io/eyemind/odrl#prohibition'), iri('https://example.org/handicap-card#mustWait'))
rdf(iri('https://example.org/handicap-card#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#conflict'), skolem(223, 'Conflict', [iri('https://example.org/handicap-card#evaluation'), iri('https://example.org/handicap-card#issueBob'), iri('https://example.org/handicap-card#eligibility'), iri('https://example.org/handicap-card#mayIssue'), iri('https://example.org/handicap-card#administrativeHold'), iri('https://example.org/handicap-card#mustWait')]))
rdf(skolem(223, 'Conflict', [iri('https://example.org/handicap-card#evaluation'), iri('https://example.org/handicap-card#issueBob'), iri('https://example.org/handicap-card#eligibility'), iri('https://example.org/handicap-card#mayIssue'), iri('https://example.org/handicap-card#administrativeHold'), iri('https://example.org/handicap-card#mustWait')]), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://eyereasoner.github.io/eyemind/odrl#Conflict'))
rdf(skolem(223, 'Conflict', [iri('https://example.org/handicap-card#evaluation'), iri('https://example.org/handicap-card#issueBob'), iri('https://example.org/handicap-card#eligibility'), iri('https://example.org/handicap-card#mayIssue'), iri('https://example.org/handicap-card#administrativeHold'), iri('https://example.org/handicap-card#mustWait')]), iri('https://eyereasoner.github.io/eyemind/odrl#request'), iri('https://example.org/handicap-card#issueBob'))
rdf(skolem(223, 'Conflict', [iri('https://example.org/handicap-card#evaluation'), iri('https://example.org/handicap-card#issueBob'), iri('https://example.org/handicap-card#eligibility'), iri('https://example.org/handicap-card#mayIssue'), iri('https://example.org/handicap-card#administrativeHold'), iri('https://example.org/handicap-card#mustWait')]), iri('https://eyereasoner.github.io/eyemind/odrl#permissionPolicy'), iri('https://example.org/handicap-card#eligibility'))
rdf(skolem(223, 'Conflict', [iri('https://example.org/handicap-card#evaluation'), iri('https://example.org/handicap-card#issueBob'), iri('https://example.org/handicap-card#eligibility'), iri('https://example.org/handicap-card#mayIssue'), iri('https://example.org/handicap-card#administrativeHold'), iri('https://example.org/handicap-card#mustWait')]), iri('https://eyereasoner.github.io/eyemind/odrl#permissionRule'), iri('https://example.org/handicap-card#mayIssue'))
rdf(skolem(223, 'Conflict', [iri('https://example.org/handicap-card#evaluation'), iri('https://example.org/handicap-card#issueBob'), iri('https://example.org/handicap-card#eligibility'), iri('https://example.org/handicap-card#mayIssue'), iri('https://example.org/handicap-card#administrativeHold'), iri('https://example.org/handicap-card#mustWait')]), iri('https://eyereasoner.github.io/eyemind/odrl#prohibitionPolicy'), iri('https://example.org/handicap-card#administrativeHold'))
rdf(skolem(223, 'Conflict', [iri('https://example.org/handicap-card#evaluation'), iri('https://example.org/handicap-card#issueBob'), iri('https://example.org/handicap-card#eligibility'), iri('https://example.org/handicap-card#mayIssue'), iri('https://example.org/handicap-card#administrativeHold'), iri('https://example.org/handicap-card#mustWait')]), iri('https://eyereasoner.github.io/eyemind/odrl#prohibitionRule'), iri('https://example.org/handicap-card#mustWait'))
rdf(iri('https://example.org/handicap-card#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#conflictCount'), 1)
rdf(iri('https://example.org/handicap-card#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#request'), iri('https://example.org/handicap-card#issueAlice'))
rdf(iri('https://example.org/handicap-card#issueAlice'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Allowed'))
rdf(iri('https://example.org/handicap-card#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#request'), iri('https://example.org/handicap-card#issueBob'))
rdf(iri('https://example.org/handicap-card#issueBob'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Prohibited'))
rdf(iri('https://example.org/handicap-card#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#canHappen'), iri('https://example.org/handicap-card#issueAlice'))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
