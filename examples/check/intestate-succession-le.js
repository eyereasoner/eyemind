// Checked answers: these follow from the input program and are every answer of its questions.
struct('le:answer', 'unworthy', 'Marie', 'Claire', 'Marie')
struct('le:answer', 'usufruct', 'Marie', 'Paul', 'Marie')
struct('le:answer', 'spouse', 'Jan', 'Lea', 22500, 'Jan')
struct('le:answer', 'heirs', 'Marie', 'Anne', 80000, 'Marie')
struct('le:answer', 'heirs', 'Marie', 'Chloe', 40000, 'Marie')
struct('le:answer', 'heirs', 'Marie', 'David', 40000, 'Marie')
struct('le:answer', 'heirs', 'Marie', 'Emma', 80000, 'Marie')
struct('le:answer', 'heirs', 'Jan', 'Kim', 33750, 'Jan')
struct('le:answer', 'heirs', 'Jan', 'Uma', 16875, 'Jan')
struct('le:answer', 'heirs', 'Jan', 'Wim', 16875, 'Jan')
struct('le:answer', 'represented', 'Marie', 'Bruno', 'Marie')
struct('le:answer', 'represented', 'Marie', 'Claire', 'Marie')
struct('le:answer', 'represented', 'Jan', 'Tom', 'Jan')
struct('le:answer', 'represented', 'Jan', 'Vic', 'Jan')
struct('le:answer', 'totals', 'Marie', 'Marie', 240000)
struct('le:answer', 'totals', 'Jan', 'Jan', 90000)

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
