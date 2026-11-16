// Checked answers: these follow from the input program and are every answer of its questions.
solution(0, 1, 0)
solution(1, 3, 2)
solution(5, 3363, 2378)
solution(8, 665857, 470832)
solution(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772)
equation_holds(0)
equation_holds(1)
equation_holds(5)
equation_holds(8)
equation_holds(50)

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
