// Checked answers: these follow from the input program and are every answer of its questions.
goldbach(4, [2, 2])
goldbach(8, [3, 5])
goldbach(16, [3, 13])
goldbach(32, [3, 29])
goldbach(64, [3, 61])
goldbach(128, [19, 109])
goldbach(256, [5, 251])
goldbach(512, [3, 509])
goldbach(1024, [3, 1021])
goldbach(2048, [19, 2029])
goldbach(4096, [3, 4093])
goldbach(8192, [13, 8179])
goldbach(16384, [3, 16381])
goldbach(32768, [19, 32749])
goldbach(65536, [17, 65519])
goldbach(131072, [13, 131059])
goldbach(262144, [5, 262139])
goldbach(524288, [19, 524269])
goldbach(1048576, [3, 1048573])
goldbach(2097152, [19, 2097133])
goldbach(4194304, [3, 4194301])
goldbach(8388608, [37, 8388571])
goldbach(16777216, [3, 16777213])
goldbach(33554432, [61, 33554371])

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
