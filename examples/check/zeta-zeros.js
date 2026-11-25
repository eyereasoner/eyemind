// Checked answers: these follow from the input program and are every answer of its questions.
z_sign('h14_25', 'positive')
z_sign('h20_9', 'positive')
z_sign('h25_1', 'positive')
z_sign('h14', 'negative')
z_sign('h21_1', 'negative')
z_sign('h24_9', 'negative')
zero_on_critical_line('first', between(frac(14, 1), frac(57, 4)))
zero_on_critical_line('second', between(frac(209, 10), frac(211, 10)))
zero_on_critical_line('third', between(frac(249, 10), frac(251, 10)))
z_enclosure('h14', -0.10562658661567, -0.1056255733636982)
z_enclosure('h14_25', 0.09226467784791645, 0.09226577366785449)
z_enclosure('h20_9', 0.13948587145674496, 0.13952175732126232)
z_enclosure('h21_1', -0.08824156957988483, -0.0881991343458041)
z_enclosure('h24_9', -0.1498220197204312, -0.14960548561547557)
z_enclosure('h25_1', 0.12354636574444405, 0.12376514485508538)

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
