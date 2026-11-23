// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('https://example.org/research-snapshot#evaluation'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://eyereasoner.github.io/eyemind/odrl#EvaluationReport'))
rdf(iri('https://example.org/research-snapshot#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#policy'), iri('https://example.org/research-snapshot#agreement1'))
rdf(iri('https://example.org/research-snapshot#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#conflictStrategy'), iri('http://www.w3.org/ns/odrl/2/prohibit'))
rdf(iri('https://example.org/research-snapshot#ready'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://eyereasoner.github.io/eyemind/odrl#Request'))
rdf(iri('https://example.org/research-snapshot#ready'), iri('http://www.w3.org/ns/odrl/2/assignee'), iri('https://example.org/research-snapshot#researcher'))
rdf(iri('https://example.org/research-snapshot#ready'), iri('http://www.w3.org/ns/odrl/2/action'), iri('http://www.w3.org/ns/odrl/2/use'))
rdf(iri('https://example.org/research-snapshot#ready'), iri('http://www.w3.org/ns/odrl/2/target'), iri('https://example.org/research-snapshot#directory'))
rdf(iri('https://example.org/research-snapshot#ready'), iri('https://eyereasoner.github.io/eyemind/odrl#subject'), iri('https://example.org/research-snapshot#visitor'))
rdf(iri('https://example.org/research-snapshot#ready'), iri('https://eyereasoner.github.io/eyemind/odrl#state'), iri('https://example.org/research-snapshot#researchState'))
rdf(iri('https://example.org/research-snapshot#ready'), iri('https://eyereasoner.github.io/eyemind/odrl#fulfilledDuty'), iri('https://example.org/research-snapshot#credit'))
rdf(iri('https://example.org/research-snapshot#pending'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://eyereasoner.github.io/eyemind/odrl#Request'))
rdf(iri('https://example.org/research-snapshot#pending'), iri('http://www.w3.org/ns/odrl/2/assignee'), iri('https://example.org/research-snapshot#researcher'))
rdf(iri('https://example.org/research-snapshot#pending'), iri('http://www.w3.org/ns/odrl/2/action'), iri('http://www.w3.org/ns/odrl/2/use'))
rdf(iri('https://example.org/research-snapshot#pending'), iri('http://www.w3.org/ns/odrl/2/target'), iri('https://example.org/research-snapshot#directory'))
rdf(iri('https://example.org/research-snapshot#pending'), iri('https://eyereasoner.github.io/eyemind/odrl#subject'), iri('https://example.org/research-snapshot#visitor'))
rdf(iri('https://example.org/research-snapshot#pending'), iri('https://eyereasoner.github.io/eyemind/odrl#state'), iri('https://example.org/research-snapshot#researchState'))
rdf(iri('https://example.org/research-snapshot#marketing'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://eyereasoner.github.io/eyemind/odrl#Request'))
rdf(iri('https://example.org/research-snapshot#marketing'), iri('http://www.w3.org/ns/odrl/2/assignee'), iri('https://example.org/research-snapshot#researcher'))
rdf(iri('https://example.org/research-snapshot#marketing'), iri('http://www.w3.org/ns/odrl/2/action'), iri('http://www.w3.org/ns/odrl/2/use'))
rdf(iri('https://example.org/research-snapshot#marketing'), iri('http://www.w3.org/ns/odrl/2/target'), iri('https://example.org/research-snapshot#directory'))
rdf(iri('https://example.org/research-snapshot#marketing'), iri('https://eyereasoner.github.io/eyemind/odrl#subject'), iri('https://example.org/research-snapshot#visitor'))
rdf(iri('https://example.org/research-snapshot#marketing'), iri('https://eyereasoner.github.io/eyemind/odrl#state'), iri('https://example.org/research-snapshot#marketingState'))
rdf(iri('https://example.org/research-snapshot#marketing'), iri('https://eyereasoner.github.io/eyemind/odrl#fulfilledDuty'), iri('https://example.org/research-snapshot#credit'))
rdf(iri('https://example.org/research-snapshot#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#validationStatus'), iri('https://eyereasoner.github.io/eyemind/odrl#Valid'))
rdf(iri('https://example.org/research-snapshot#pending'), iri('https://eyereasoner.github.io/eyemind/odrl#uncertainty'), skolem(286, 'Issue', [iri('https://example.org/research-snapshot#pending'), iri('https://example.org/research-snapshot#credit'), iri('https://example.org/research-snapshot#researchUse'), iri('https://eyereasoner.github.io/eyemind/odrl#MissingDutyEvidence')]))
rdf(skolem(286, 'Issue', [iri('https://example.org/research-snapshot#pending'), iri('https://example.org/research-snapshot#credit'), iri('https://example.org/research-snapshot#researchUse'), iri('https://eyereasoner.github.io/eyemind/odrl#MissingDutyEvidence')]), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://eyereasoner.github.io/eyemind/odrl#Uncertainty'))
rdf(skolem(286, 'Issue', [iri('https://example.org/research-snapshot#pending'), iri('https://example.org/research-snapshot#credit'), iri('https://example.org/research-snapshot#researchUse'), iri('https://eyereasoner.github.io/eyemind/odrl#MissingDutyEvidence')]), iri('https://eyereasoner.github.io/eyemind/odrl#duty'), iri('https://example.org/research-snapshot#credit'))
rdf(skolem(286, 'Issue', [iri('https://example.org/research-snapshot#pending'), iri('https://example.org/research-snapshot#credit'), iri('https://example.org/research-snapshot#researchUse'), iri('https://eyereasoner.github.io/eyemind/odrl#MissingDutyEvidence')]), iri('https://eyereasoner.github.io/eyemind/odrl#rule'), iri('https://example.org/research-snapshot#researchUse'))
rdf(skolem(286, 'Issue', [iri('https://example.org/research-snapshot#pending'), iri('https://example.org/research-snapshot#credit'), iri('https://example.org/research-snapshot#researchUse'), iri('https://eyereasoner.github.io/eyemind/odrl#MissingDutyEvidence')]), iri('https://eyereasoner.github.io/eyemind/odrl#reason'), iri('https://eyereasoner.github.io/eyemind/odrl#MissingDutyEvidence'))
rdf(iri('https://example.org/research-snapshot#marketing'), iri('https://eyereasoner.github.io/eyemind/odrl#unmetConstraint'), iri('https://example.org/research-snapshot#scope'))
rdf(iri('https://example.org/research-snapshot#ready'), iri('https://eyereasoner.github.io/eyemind/odrl#permission'), iri('https://example.org/research-snapshot#researchUse'))
rdf(iri('https://example.org/research-snapshot#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#conflictCount'), 0)
rdf(iri('https://example.org/research-snapshot#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#request'), iri('https://example.org/research-snapshot#pending'))
rdf(iri('https://example.org/research-snapshot#pending'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Undetermined'))
rdf(iri('https://example.org/research-snapshot#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#request'), iri('https://example.org/research-snapshot#ready'))
rdf(iri('https://example.org/research-snapshot#ready'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Allowed'))
rdf(iri('https://example.org/research-snapshot#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#request'), iri('https://example.org/research-snapshot#marketing'))
rdf(iri('https://example.org/research-snapshot#marketing'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#NotApplicable'))
rdf(iri('https://example.org/research-snapshot#evaluation'), iri('https://eyereasoner.github.io/eyemind/odrl#canHappen'), iri('https://example.org/research-snapshot#ready'))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
