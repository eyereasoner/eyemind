// Checked claims: these follow from the input program, which halted.
'false'

// Proof check (SPEC 11.2-11.6):
// Halted proof: every claim, including 'false', replays its recorded firing.
// Answer completeness is not established for a halted proof.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
