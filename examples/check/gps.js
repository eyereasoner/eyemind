// Checked answers: these follow from the input program and are every answer of its questions.
findpath('map_be', [location('i1', 'oostende'), ['drive_gent_brugge', 'drive_brugge_oostende'], 2400.0, 0.01, 0.9408, 0.99, [5000.0, 5.0, 0.2, 0.4, 1]])
findpath('map_be', [location('i1', 'oostende'), ['drive_gent_kortrijk', 'drive_kortrijk_brugge', 'drive_brugge_oostende'], 4100.0, 0.018000000000000002, 0.903168, 0.9801, [5000.0, 5.0, 0.2, 0.4, 1]])

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
