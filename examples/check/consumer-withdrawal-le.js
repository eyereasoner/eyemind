// Checked answers: these follow from the input program and are every answer of its questions.
struct('le:answer', 'excluded', 'web shop', 'the boiler repair order', 'Article 16(a)')
struct('le:answer', 'excluded', 'web shop', 'the engraved ring order', 'Article 16(c)')
struct('le:answer', 'excluded', 'web shop', 'the face cream order', 'Article 16(e)')
struct('le:answer', 'periods', 'web shop', 'the headphones order', date(2026, 3, 18))
struct('le:answer', 'periods', 'web shop', 'the jacket order', date(2026, 3, 18))
struct('le:answer', 'periods', 'web shop', 'the language course order', date(2026, 3, 16))
struct('le:answer', 'periods', 'web shop', 'the coffee machine order', date(2026, 4, 24))
struct('le:answer', 'valid', 'web shop', 'the headphones order')
struct('le:answer', 'valid', 'web shop', 'the coffee machine order')
struct('le:answer', 'valid', 'web shop', 'the language course order')
struct('le:answer', 'late', 'web shop', 'the jacket order')
struct('le:answer', 'refunds', 'web shop', 125, 'the headphones order', date(2026, 3, 29))
struct('le:answer', 'refunds', 'web shop', 210, 'the coffee machine order', date(2026, 5, 4))
struct('le:answer', 'refunds', 'web shop', 300, 'the language course order', date(2026, 3, 24))
struct('le:answer', 'withheld', 'web shop', 'the coffee machine order')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
