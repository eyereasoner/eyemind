// SPEC 11 and 12: checking proofs. Each case checks a proof document against
// a program. A valid proof expects its exact report; a failing check only its
// exit code, since failure details, their number and order are informative.

// Reading the document (Section 11).

conformance('a generated proof checks and its report lists the checked answers', [
  spec('11, 11.1, 12'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    "fact(type('socrates', 'human'))",
    "fact(subclass_of('human', 'mortal'))",
    'implies([type(S, A), subclass_of(A, B)], type(S, B))',
    'query(type(X, Y))',
  ]),
  file('proof.js', [
    "type('socrates', 'mortal')",
    "type('socrates', 'human')",
    "step(type('socrates', 'mortal'), clause(3), {S: 'socrates', A: 'human', B: 'mortal'}, [type('socrates', 'human'), subclass_of('human', 'mortal')])",
    "step(type('socrates', 'human'), clause(1), {}, [])",
    "derived(type(A, B), [type('socrates', 'mortal')])",
    "called(type(A, B), [type('socrates', 'mortal'), type('socrates', 'human')])",
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    "type('socrates', 'mortal')",
    "type('socrates', 'human')",
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('comments of a proof are ignored, however they are worded', [
  spec('10.1, 11'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    '// my own words',
    'q(1) // the claim',
    '/* steps */',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'q(1)',
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('a proof that does not read fails the check', [
  spec('9.1, 11'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)]',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
])

conformance('a proof with an assignment is rejected rather than run', [
  spec('9.1, 11, 14'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'globalThis.checked = 1',
    'q(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
])

conformance('a step whose bindings are not an object fails', [
  spec('11'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), [1], [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
])

conformance('a step whose uses are not an array fails', [
  spec('11'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {X: 1}, p(1))',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
])

conformance('two steps with identical goals fail', [
  spec('10.2, 11'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
  ]),
])

conformance('a call table whose answers are not an array fails', [
  spec('11'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), q(1))',
  ]),
])

conformance('a listing whose facts are not an array fails', [
  spec('11'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), q(1))',
    'called(q(A), [q(1)])',
  ]),
])

conformance('a listing pattern with a repeated variable fails', [
  spec('10.3, 11'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X, X))',
  ]),
  file('proof.js', [
    'q(1, 1)',
    'step(q(1, 1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A, A), [q(1, 1)])',
    'called(q(A, A), [q(1, 1)])',
  ]),
])

conformance('a listing pattern with a constant fails', [
  spec('10.3, 11'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(1), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
])

conformance('two call tables whose calls are identical up to renaming fail', [
  spec('10.3, 11'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
    'called(q(B), [q(1)])',
  ]),
])

conformance('two listings with the same pattern fail', [
  spec('10.3, 11'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
    'derived(q(B), [q(1)])',
  ]),
])

conformance('a variable whose name contains # fails the check', [
  spec('9.2, 9.4, 11'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(X, Y))',
    'query(p(A, B))',
  ]),
  file('proof.js', [
    'p(VAR_A_23_1, VAR_A_23_2)',
  ]),
])

conformance('a variable with an encoded name of other characters is an ordinary variable', [
  spec('9.2, 11, 11.5'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    'fact(p(X, Y))',
    'query(p(A, B))',
  ]),
  file('proof.js', [
    'p(VAR_A_2d_1, VAR_A_2d_2)',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'p(VAR_A_2d_1, VAR_A_2d_2)',
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('a step citing no clause of the program fails', [
  spec('10.2, 11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(7), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
])

conformance("a step justified by something other than a clause or 'control' fails", [
  spec('10.2, 11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    "step(q(1), 'builtin', {X: 1}, [p(1)])",
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
])

// Answering calls (Section 11.3).

conformance('a call table equal to its expansion checks', [
  spec('11.3, 12'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
    'query(r(X))',
  ]),
  file('proof.js', [
    "r('a')",
    "r('b')",
    "called(r(A), [r('a'), r('b')])",
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    "r('a')",
    "r('b')",
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('a call table that leaves out an answer fails', [
  spec('11.3'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
    'query(r(X))',
  ]),
  file('proof.js', [
    "r('a')",
    "called(r(A), [r('a')])",
  ]),
])

conformance('a call table with an answer its expansion lacks fails', [
  spec('11.3'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
    'query(r(X))',
  ]),
  file('proof.js', [
    "r('a')",
    "r('b')",
    "called(r(A), [r('a'), r('b'), r('c')])",
  ]),
])

conformance('a call table with its answers reordered fails', [
  spec('11.3'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
    'query(r(X))',
  ]),
  file('proof.js', [
    "r('a')",
    "r('b')",
    "called(r(A), [r('b'), r('a')])",
  ]),
])

conformance('a call table that drops a repeated answer fails', [
  spec('11.3'),
  args("--check-proof proof.js --goal 'q(1)' program.js"),
  exit(2),
  file('program.js', [
    'fact(p(1), s(1))',
    'implied_by(q(X), p(X))',
    'implied_by(q(X), s(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'called(q(1), [q(1)])',
  ]),
])

conformance('a call table keeps the repeated answers of its expansion', [
  spec('11.3'),
  args("--check-proof proof.js --goal 'q(1)' program.js"),
  file('program.js', [
    'fact(p(1), s(1))',
    'implied_by(q(X), p(X))',
    'implied_by(q(X), s(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'called(q(1), [q(1), q(1)])',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'q(1)',
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('a call without a call table cannot be established', [
  spec('11.3'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
    'query(r(X))',
  ]),
  file('proof.js', [
    "r('a')",
    "r('b')",
  ]),
])

conformance('a call table answers only a call identical to its own', [
  spec('11.3'),
  args("--check-proof proof.js --goal 'r('\"'\"'a'\"'\"')' program.js"),
  exit(2),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
  ]),
  file('proof.js', [
    "r('a')",
    "called(r(A), [r('a'), r('b')])",
  ]),
])

conformance('a named call is not answered by a table of an anonymous one', [
  spec('10.3, 11.3'),
  args("--check-proof proof.js --goal 'p(X)' program.js"),
  exit(2),
  file('program.js', [
    "implied_by(p(_), 'true')",
  ]),
  file('proof.js', [
    'p(A)',
    'called(p(_0), [p(_1)])',
  ]),
])

conformance('a call to a relation defined by source facts needs no table', [
  spec('11.3, 12'),
  args("--check-proof proof.js --goal 'p(X)' program.js"),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  file('proof.js', [
    'p(1)',
    'p(2)',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'p(1)',
    'p(2)',
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('a table of a relation defined by source facts is unused', [
  spec('11.3, 11.6'),
  args("--check-proof proof.js --goal 'p(X)' program.js"),
  exit(2),
  file('program.js', [
    'fact(p(1), p(2))',
  ]),
  file('proof.js', [
    'p(1)',
    'p(2)',
    'called(p(A), [p(1), p(2)])',
  ]),
])

conformance('a call table that depends on itself fails', [
  spec('11.3'),
  args("--check-proof proof.js --goal 'p(1)' program.js"),
  exit(2),
  file('program.js', [
    'implied_by(p(X), p(X))',
  ]),
  file('proof.js', [
    'called(p(1), [])',
  ]),
])

conformance('call tables that depend on each other in a cycle fail', [
  spec('11.3'),
  args("--check-proof proof.js --goal 'p(1)' program.js"),
  exit(2),
  file('program.js', [
    'implied_by(p(X), q(X))',
    'implied_by(q(X), p(X))',
  ]),
  file('proof.js', [
    'called(p(1), [])',
    'called(q(1), [])',
  ]),
])

conformance('a negation with an unbound named variable fails the search', [
  spec('4.2, 11, 11.3'),
  args("--check-proof proof.js --goal 'q(X)' program.js"),
  exit(2),
  file('program.js', [
    "fact(p('a'))",
    "implied_by(q(X), [not(p(X)), unify(X, 'b')])",
  ]),
  file('proof.js', [
    "q('b')",
    "called(q(A), [q('b')])",
  ]),
])

conformance('a negation with an anonymous variable is answered from the facts', [
  spec('4.2, 11.3'),
  args("--check-proof proof.js --goal 'q(X)' program.js"),
  file('program.js', [
    "fact(p('a'), r('a', 1), p('b'))",
    'implied_by(q(X), [p(X), not(r(X, _))])',
  ]),
  file('proof.js', [
    "q('b')",
    "called(q(A), [q('b')])",
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    "q('b')",
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('compare/3 of terms that are not ground cannot be established', [
  spec('8.7, 11.1, 11.3'),
  args("--check-proof proof.js --goal 'c(O)' program.js"),
  exit(2),
  file('program.js', [
    'implied_by(c(O), compare(O, X, Y))',
  ]),
  file('proof.js', [
    "c('<')",
    "called(c(A), [c('<')])",
  ]),
])

conformance('a listing that leaves out a derived fact is not closed', [
  spec('11.3'),
  args("--check-proof proof.js --goal 'r(X)' program.js"),
  exit(2),
  file('program.js', [
    'fact(p(1), p(2))',
    'implies(p(X), q(X))',
    'implied_by(r(X), q(X))',
  ]),
  file('proof.js', [
    'r(1)',
    'step(q(1), clause(3), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(r(A), [r(1)])',
    'called(q(B), [q(1)])',
  ]),
])

conformance('a listed fact that is not ground fails without inspection', [
  spec('11.3'),
  args("--check-proof proof.js --goal 'r(X)' program.js"),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'implied_by(r(X), q(X))',
  ]),
  file('proof.js', [
    'r(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), [q(1), q(B)])',
    'called(r(A), [r(1)])',
    'called(q(B), [q(1)])',
  ]),
])

conformance('a listed fact of another relation fails', [
  spec('11.3'),
  args("--check-proof proof.js --goal 'r(X)' program.js"),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'implied_by(r(X), q(X))',
  ]),
  file('proof.js', [
    'r(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), [q(1), s(1)])',
    'called(r(A), [r(1)])',
    'called(q(B), [q(1)])',
  ]),
])

conformance('a forward template answers through the listing of its appended rule', [
  spec('6.2, 11.3, 11.4'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    "fact(cat('minka'))",
    "fact(dog('charly'))",
    "implies(cat(X), implies(dog(Y), test('yes')))",
  ]),
  file('proof.js', [
    "test('yes')",
    "step(test('yes'), clause(4), {X: 'minka', Y: 'charly'}, [cat('minka'), dog('charly')])",
    "derived(test(A), [test('yes')])",
    "called(test('yes'), [test('yes')])",
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    "test('yes')",
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('a backward template answers through its instances', [
  spec('6.2, 11.3'),
  args("--check-proof proof.js --goal 'pet(Y)' program.js"),
  file('program.js', [
    "fact(cat('minka'))",
    "implies(cat(X), implied_by(pet(X), 'true'))",
  ]),
  file('proof.js', [
    "pet('minka')",
    "called(pet(A), [pet('minka')])",
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    "pet('minka')",
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('a backward template whose instance is forged fails', [
  spec('6.2, 11.3'),
  args("--check-proof proof.js --goal 'pet(Y)' program.js"),
  exit(2),
  file('program.js', [
    "fact(cat('minka'))",
    "implies(cat(X), implied_by(pet(X), 'true'))",
  ]),
  file('proof.js', [
    "pet('tom')",
    "called(pet(A), [pet('tom')])",
  ]),
])

conformance('once over a derived relation with one answer has certified answer order', [
  spec('11.3, 11.4'),
  args("--check-proof proof.js --goal 'first(X)' program.js"),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'implied_by(first(X), once(q(X)))',
  ]),
  file('proof.js', [
    'first(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(first(A), [first(1)])',
    'called(q(B), [q(1)])',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'first(1)',
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('once over a derived relation with several answers cannot be established', [
  spec('8.7, 11.1, 11.3'),
  args("--check-proof proof.js --goal 'first(X)' program.js"),
  exit(2),
  file('program.js', [
    'fact(p(1), p(2))',
    'implies(p(X), q(X))',
    'implied_by(first(X), once(q(X)))',
  ]),
  file('proof.js', [
    'first(1)',
    'step(q(1), clause(3), {X: 1}, [p(1)])',
    'step(q(2), clause(3), {X: 2}, [p(2)])',
    'derived(q(A), [q(1), q(2)])',
    'called(first(A), [first(1)])',
    'called(q(B), [q(1), q(2)])',
  ]),
])

conformance('a sorted collection of ground items over derived facts checks', [
  spec('11.3'),
  args("--check-proof proof.js --goal 'all(L)' program.js"),
  file('program.js', [
    'fact(s(2), s(1))',
    'implies(s(X), p(X))',
    'implied_by(all(L), findall_sorted(X, p(X), L))',
  ]),
  file('proof.js', [
    'all([1, 2])',
    'step(p(2), clause(3), {X: 2}, [s(2)])',
    'step(p(1), clause(3), {X: 1}, [s(1)])',
    'derived(p(A), [p(2), p(1)])',
    'called(all(A), [all([1, 2])])',
    'called(p(B), [p(2), p(1)])',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'all([1, 2])',
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

// Replaying derived facts (Section 11.4).

conformance('each listed fact replays its recorded firing', [
  spec('11.4, 12'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'implies(q(X), r(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'r(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'step(r(1), clause(3), {X: 1}, [q(1)])',
    'derived(q(A), [q(1)])',
    'derived(r(A), [r(1)])',
    'called(q(A), [q(1)])',
    'called(r(B), [r(1)])',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'q(1)',
    'r(1)',
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('a step citing another rule fails', [
  spec('11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'implies(p(X), r(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'r(1)',
    'step(q(1), clause(3), {X: 1}, [p(1)])',
    'step(r(1), clause(3), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'derived(r(A), [r(1)])',
    'called(q(A), [q(1)])',
    'called(r(B), [r(1)])',
  ]),
])

conformance('a step of a listed fact citing a backward rule fails', [
  spec('11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'implied_by(q(X), p(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(3), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1), q(1)])',
  ]),
])

conformance('a step whose uses are not the body instance fails', [
  spec('11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1), p(2))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'q(2)',
    'step(q(1), clause(3), {X: 1}, [p(2)])',
    'step(q(2), clause(3), {X: 2}, [p(2)])',
    'derived(q(A), [q(1), q(2)])',
    'called(q(A), [q(1), q(2)])',
  ]),
])

conformance('a step whose bindings give a variable another value fails', [
  spec('11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {X: 2}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
])

conformance('a step whose bindings name a variable the rule lacks fails', [
  spec('11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {Y: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
])

conformance('a step may leave out its bindings', [
  spec('10.2, 11.4'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'q(1)',
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('a variable shared by two goals cannot take two values', [
  spec('11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1), r(1), r(2))',
    'implies([p(X), r(X)], q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(4), {X: 1}, [p(1), r(2)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
])

conformance('a forged witness fails', [
  spec('8.2, 11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    "fact(person('ann'))",
    'implies(person(X), has(X, T))',
  ]),
  file('proof.js', [
    "has('ann', skolem(2, 'T', ['ann']))",
    "step(has('ann', skolem(2, 'T', ['ann'])), clause(2), {X: 'ann', T: skolem(2, 'T', ['ann'])}, [person('ann')])",
    "derived(has(A, B), [has('ann', skolem(2, 'T', ['ann'])), has('ann', skolem(2, 'T', ['bob']))])",
    "called(has(A, B), [has('ann', skolem(2, 'T', ['ann'])), has('ann', skolem(2, 'T', ['bob']))])",
    "has('ann', skolem(2, 'T', ['bob']))",
    "step(has('ann', skolem(2, 'T', ['bob'])), clause(2), {X: 'ann', T: skolem(2, 'T', ['bob'])}, [person('ann')])",
  ]),
])

conformance('a witness replaced by a constant fails', [
  spec('8.2, 11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    "fact(person('ann'))",
    'implies(person(X), has(X, T))',
  ]),
  file('proof.js', [
    "has('ann', skolem(2, 'T', ['ann']))",
    "step(has('ann', skolem(2, 'T', ['ann'])), clause(2), {X: 'ann', T: skolem(2, 'T', ['ann'])}, [person('ann')])",
    "derived(has(A, B), [has('ann', skolem(2, 'T', ['ann'])), has('ann', 't1')])",
    "called(has(A, B), [has('ann', skolem(2, 'T', ['ann'])), has('ann', 't1')])",
    "has('ann', 't1')",
    "step(has('ann', 't1'), clause(2), {X: 'ann', T: 't1'}, [person('ann')])",
  ]),
])

conformance('derived facts supporting each other only through a cycle fail', [
  spec('11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(s(1))',
    'implies(s(X), p(X))',
    'implies(p(X), q(X))',
    'implies(q(X), p(X))',
  ]),
  file('proof.js', [
    'p(1)',
    'q(1)',
    'p(2)',
    'q(2)',
    'step(p(1), clause(2), {X: 1}, [s(1)])',
    'step(q(1), clause(3), {X: 1}, [p(1)])',
    'step(p(2), clause(4), {X: 2}, [q(2)])',
    'step(q(2), clause(3), {X: 2}, [p(2)])',
    'derived(p(A), [p(1), p(2)])',
    'derived(q(A), [q(1), q(2)])',
    'called(p(A), [p(1), p(2)])',
    'called(q(B), [q(1), q(2)])',
  ]),
])

conformance('a state test replays with the bindings of its call', [
  spec('7.5, 11.4'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    'fact(r(1))',
    "implies([r(N), is_var(X), unify(X, 'a')], q(N, X))",
  ]),
  file('proof.js', [
    "q(1, 'a')",
    "step(q(1, 'a'), clause(2), {N: 1, X: 'a'}, [r(1), is_var('a'), unify('a', 'a')])",
    "derived(q(A, B), [q(1, 'a')])",
    "called(q(A, B), [q(1, 'a')])",
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    "q(1, 'a')",
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('a state test that held only for the final instance fails', [
  spec('7.5, 11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(r(1))',
    "implies([r(N), is_atom(X), unify(X, 'a')], q(N, X))",
  ]),
  file('proof.js', [
    "q(1, 'a')",
    "step(q(1, 'a'), clause(2), {N: 1, X: 'a'}, [r(1), is_atom('a'), unify('a', 'a')])",
    "derived(q(A, B), [q(1, 'a')])",
    "called(q(A, B), [q(1, 'a')])",
  ]),
])

conformance('once replays its first answer', [
  spec('11.4'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    'fact(go(1), p(1), p(2))',
    'implies([go(N), once(p(X))], first(X))',
  ]),
  file('proof.js', [
    'first(1)',
    'step(first(1), clause(4), {N: 1, X: 1}, [go(1), once(p(1))])',
    'derived(first(A), [first(1)])',
    'called(first(A), [first(1)])',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'first(1)',
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('once that uses a later answer fails', [
  spec('11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(go(1), p(1), p(2))',
    'implies([go(N), once(p(X))], first(X))',
  ]),
  file('proof.js', [
    'first(1)',
    'step(first(1), clause(4), {N: 1, X: 1}, [go(1), once(p(1))])',
    'derived(first(A), [first(1), first(2)])',
    'called(first(A), [first(1), first(2)])',
    'first(2)',
    'step(first(2), clause(4), {N: 1, X: 2}, [go(1), once(p(2))])',
  ]),
])

conformance('a negation that does not hold fails', [
  spec('11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1), q(1))',
    'implies([p(X), not(q(X))], ok(X))',
  ]),
  file('proof.js', [
    'ok(1)',
    'step(ok(1), clause(3), {X: 1}, [p(1), not(q(1))])',
    'derived(ok(A), [ok(1)])',
    'called(ok(A), [ok(1)])',
  ]),
])

conformance('arithmetic is computed, not accepted', [
  spec('11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(n(4))',
    'implies([n(X), is(Y, mul(X, 2))], double(X, Y))',
  ]),
  file('proof.js', [
    'double(4, 8)',
    'step(double(4, 8), clause(2), {X: 4, Y: 8}, [n(4), is(8, mul(4, 2))])',
    'derived(double(A, B), [double(4, 8), double(4, 9)])',
    'called(double(A, B), [double(4, 8), double(4, 9)])',
    'double(4, 9)',
    'step(double(4, 9), clause(2), {X: 4, Y: 9}, [n(4), is(9, mul(4, 2))])',
  ]),
])

conformance('a control step replays the side of the disjunction it uses', [
  spec('11.4'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    'fact(a(1))',
    'implies(a(X), b(X))',
    'implies([a(X), or(q(X), b(X))], c(X))',
  ]),
  file('proof.js', [
    'b(1)',
    'c(1)',
    'step(b(1), clause(2), {X: 1}, [a(1)])',
    'step(c(1), clause(3), {X: 1}, [a(1), or(q(1), b(1))])',
    "step(or(q(1), b(1)), 'control', {}, [b(1)])",
    'derived(b(A), [b(1)])',
    'derived(c(A), [c(1)])',
    'called(b(A), [b(1)])',
    'called(c(B), [c(1)])',
    'called(b(1), [b(1)])',
  ]),
  stdout([
    '// Checked answers: these follow from the input program and are every answer of its questions.',
    'b(1)',
    'c(1)',
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('a control step using a side that does not hold fails', [
  spec('11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(a(1))',
    'implies(a(X), b(X))',
    'implies([a(X), or(q(X), b(X))], c(X))',
  ]),
  file('proof.js', [
    'b(1)',
    'c(1)',
    'step(b(1), clause(2), {X: 1}, [a(1)])',
    'step(c(1), clause(3), {X: 1}, [a(1), or(q(1), b(1))])',
    "step(or(q(1), b(1)), 'control', {}, [q(1)])",
    'derived(b(A), [b(1)])',
    'derived(c(A), [c(1)])',
    'called(b(A), [b(1)])',
    'called(c(B), [c(1)])',
    'called(b(1), [b(1)])',
  ]),
])

conformance('a disjunction over derived facts without its control step fails', [
  spec('11.4'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(a(1))',
    'implies(a(X), b(X))',
    'implies([a(X), or(q(X), b(X))], c(X))',
  ]),
  file('proof.js', [
    'b(1)',
    'c(1)',
    'step(b(1), clause(2), {X: 1}, [a(1)])',
    'step(c(1), clause(3), {X: 1}, [a(1), or(q(1), b(1))])',
    'derived(b(A), [b(1)])',
    'derived(c(A), [c(1)])',
    'called(b(A), [b(1)])',
    'called(c(B), [c(1)])',
    'called(b(1), [b(1)])',
  ]),
])

// Nothing unused (Section 11.6).

conformance('a step the check does not follow fails', [
  spec('11.6'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
    'step(p(1), clause(1), {}, [])',
  ]),
])

conformance('a call table the check does not consult fails', [
  spec('11.6'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
    'called(q(2), [])',
  ]),
])

conformance('a listing the check does not consult fails', [
  spec('11.6'),
  args('--check-proof proof.js program.js'),
  exit(2),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'implies(p(X), s(X))',
    'query(q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
    'derived(s(A), [s(1)])',
    'step(s(1), clause(3), {X: 1}, [p(1)])',
  ]),
])

// Check reports (Section 12).

conformance('a check report of a valid proof without claims says the questions have no answers', [
  spec('11.1, 12'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    "fact(p('a'), p('b'))",
    'implied_by(r(X), p(X))',
    "query(r('c'))",
  ]),
  file('proof.js', [
    "called(r('c'), [])",
  ]),
  stdout([
    '// No answers: the original questions have none.',
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('a check report of a valid halted proof says its claims follow from a halted program', [
  spec('11.5, 12'),
  args('--check-proof proof.js program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
    'contradiction(q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    "'false'",
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    "step('false', clause(3), {X: 1}, [q(1)])",
  ]),
  stdout([
    '// Checked claims: these follow from the input program, which halted.',
    'q(1)',
    "'false'",
    '',
    "// Proof check (SPEC 11.2-11.6):",
    "// Halted proof: every claim, including 'false', replays its recorded firing.",
    "// Answer completeness is not established for a halted proof.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    '',
    "verdict('checked')",
  ]),
])

conformance('a check report is written as JSON with --json', [
  spec('12, README.json-check-reports'),
  args('--json --check-proof proof.js program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), q(X))',
  ]),
  file('proof.js', [
    'q(1)',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'derived(q(A), [q(1)])',
    'called(q(A), [q(1)])',
  ]),
  stdout_json([
    "{",
    "  \"valid\": true,",
    "  \"claims\": 1,",
    "  \"steps\": 1,",
    "  \"answers\": [",
    "    \"q(1)\"",
    "  ],",
    "  \"halted\": false,",
    "  \"failures\": []",
    "}",
  ]),
])
