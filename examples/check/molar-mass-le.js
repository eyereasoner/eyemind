// Checked answers: these follow from the input program and are every answer of its questions.
struct('le:answer', 'masses', 'lab', 'water', 18015)
struct('le:answer', 'masses', 'lab', 'carbon dioxide', 44009)
struct('le:answer', 'masses', 'lab', 'methane', 16043)
struct('le:answer', 'masses', 'lab', 'ammonia', 17031)
struct('le:answer', 'masses', 'lab', 'sodium chloride', 58443)
struct('le:answer', 'masses', 'lab', 'glucose', 180156)
struct('le:answer', 'oxygen', 'lab', 888, 'water')
struct('le:answer', 'oxygen', 'lab', 727, 'carbon dioxide')
struct('le:answer', 'oxygen', 'lab', 532, 'glucose')
struct('le:answer', 'lighter', 'lab', 'methane')
struct('le:answer', 'lighter', 'lab', 'ammonia')
struct('le:answer', 'heaviest', 'lab', 'glucose')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
