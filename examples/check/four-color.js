// Checked answers: these follow from the input program and are every answer of its questions.
colors('mapEU', [['Belgium', 'yellow'], ['Netherlands', 'green'], ['Luxemburg', 'green'], ['France', 'blue'], ['Germany', 'red'], ['Italy', 'red'], ['Denmark', 'green'], ['Ireland', 'red'], ['Greece', 'red'], ['Spain', 'green'], ['Portugal', 'red'], ['Austria', 'yellow'], ['Sweden', 'green'], ['Finland', 'red'], ['Cyprus', 'red'], ['Malta', 'red'], ['Poland', 'blue'], ['Hungary', 'blue'], ['Czech Republic', 'green'], ['Slovakia', 'red'], ['Slovenia', 'green'], ['Estonia', 'red'], ['Latvia', 'green'], ['Lithuania', 'red'], ['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']])

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
