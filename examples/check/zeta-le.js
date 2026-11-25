// Checked answers: these follow from the input program and are every answer of its questions.
bernoulli(1, 1, 2)
bernoulli(0, 1, 1)
bernoulli(2, 1, 6)
bernoulli(3, 0, 1)
bernoulli(4, -1, 30)
bernoulli(5, 0, 1)
bernoulli(6, 1, 42)
bernoulli(7, 0, 1)
bernoulli(8, -1, 30)
bernoulli(9, 0, 1)
bernoulli(10, 5, 66)
bernoulli(11, 0, 1)
bernoulli(12, -691, 2730)
zetaAtNegative(0, -1, 2)
zetaAtNegative(1, -1, 12)
zetaAtNegative(2, 0, 1)
zetaAtNegative(3, 1, 120)
zetaAtNegative(4, 0, 1)
zetaAtNegative(5, -1, 252)
zetaAtNegative(6, 0, 1)
zetaAtNegative(7, 1, 240)
zetaAtNegative(8, 0, 1)
zetaAtNegative(9, -1, 132)
zetaAtNegative(10, 0, 1)
trivialZero(-2)
trivialZero(-4)
trivialZero(-6)
trivialZero(-8)
trivialZero(-10)
zetaAtEven(2, 1, 6)
zetaAtEven(4, 1, 90)
zetaAtEven(6, 1, 945)
zetaAtEven(8, 1, 9450)
zetaAtEven(10, 1, 93555)
zetaAtEven(12, 691, 638512875)
criticalLineZero('firstZero')
criticalLineZero('secondZero')
criticalLineZero('thirdZero')
nonzeroPoint('notAZero')
eulerAgrees(2, 1.6449340668482264, 1.6449340668482266)

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
