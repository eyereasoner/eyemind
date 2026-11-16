// Checked answers: these follow from the input program and are every answer of its questions.
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague'])
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Diagoras Airport', 'Václav Havel Airport Prague'])
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Palma De Mallorca Airport', 'Václav Havel Airport Prague'])

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
