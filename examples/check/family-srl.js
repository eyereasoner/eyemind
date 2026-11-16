// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#bob'))
inf(iri('http://example.org/family#bob'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#cid'))
inf(iri('http://example.org/family#cid'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#dee'))
inf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#cid'))
inf(iri('http://example.org/family#bob'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#dee'))
inf(iri('http://example.org/family#ann'), iri('http://example.org/family#parentOf'), iri('http://example.org/family#bob'))
inf(iri('http://example.org/family#bob'), iri('http://example.org/family#parentOf'), iri('http://example.org/family#cid'))
inf(iri('http://example.org/family#cid'), iri('http://example.org/family#parentOf'), iri('http://example.org/family#dee'))
inf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#dee'))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
