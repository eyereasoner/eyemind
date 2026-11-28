// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('https://example.org/members/ada'), iri('https://example.org/library#hasBorrowed'), literal('Dune', lang('en')))
rdf(iri('https://example.org/members/grace'), iri('https://example.org/library#hasBorrowed'), literal('Solaris', lang('pl')))
rdf(iri('https://example.org/members/ada'), iri('https://example.org/library#hasBorrowed'), literal('Good Omens', lang('en')))
rdf(iri('https://example.org/loans/1'), iri('https://example.org/library#overdue'), literal('Dune', lang('en')))
rdf(iri('https://example.org/loans/3'), iri('https://example.org/library#overdue'), literal('Good Omens', lang('en')))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
