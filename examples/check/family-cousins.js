// Checked answers: these follow from the input program and are every answer of its questions.
generation('bob', 1)
generation('carol', 1)
branch('heidi', 'b')
branch('ivan', 'b')
branch('judy', 'c')
generation('dave', 2)
generation('eve', 2)
generation('frank', 2)
generation('grace', 2)
cousin('dave', 'frank')
cousin('dave', 'grace')
cousin('eve', 'frank')
cousin('eve', 'grace')
cousin('frank', 'dave')
cousin('frank', 'eve')
cousin('grace', 'dave')
cousin('grace', 'eve')
generation('heidi', 3)
generation('ivan', 3)
generation('judy', 3)
cousin('heidi', 'judy')
cousin('ivan', 'judy')
cousin('judy', 'heidi')
cousin('judy', 'ivan')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
