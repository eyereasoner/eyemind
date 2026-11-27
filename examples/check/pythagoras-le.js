// Checked answers: these follow from the input program and are every answer of its questions.
struct('le:answer', 'right', 'geometry', 't1')
struct('le:answer', 'right', 'geometry', 't2')
struct('le:answer', 'right', 'geometry', 't3')
struct('le:answer', 'acute', 'geometry', 't4')
struct('le:answer', 'obtuse', 'geometry', 't5')
struct('le:answer', 'degenerate', 'geometry', 't6')
struct('le:answer', 'hypotenuses', 'geometry', 20, 21, 29)
struct('le:answer', 'hypotenuses', 'geometry', 9, 40, 41)
struct('le:answer', 'triples', 'geometry', 3, 4, 5)
struct('le:answer', 'triples', 'geometry', 5, 12, 13)
struct('le:answer', 'triples', 'geometry', 8, 15, 17)
struct('le:answer', 'triples', 'geometry', 7, 24, 25)
struct('le:answer', 'triples', 'geometry', 20, 21, 29)
struct('le:answer', 'triples', 'geometry', 9, 40, 41)
struct('le:answer', 'triples', 'geometry', 12, 35, 37)
struct('le:answer', 'triples', 'geometry', 11, 60, 61)
struct('le:answer', 'triples', 'geometry', 28, 45, 53)
struct('le:answer', 'triples', 'geometry', 33, 56, 65)
struct('le:answer', 'triples', 'geometry', 13, 84, 85)
struct('le:answer', 'irrational', 'geometry', 1, 1)
struct('le:answer', 'irrational', 'geometry', 2, 3)
struct('le:answer', 'counts', 'geometry', 4, 25)
struct('le:answer', 'counts', 'geometry', 7, 50)

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
