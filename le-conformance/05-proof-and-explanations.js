// LE-SPEC compilation, output, checked proofs and explanations.

conformance("LE: explicit LE output writes the same answer sentences", [
  spec("LE-SPEC.output"),
  args("--to le program.le"),
  file("program.le", [
    "the templates are: *a bird* migrates.",
    "the knowledge base demo includes: tern migrates.",
    "query q is: which bird migrates.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "tern migrates.",
  ]),
])

conformance("LE: eyemind output writes the answer relation and its query variables", [
  spec("LE-SPEC.compilation-to-ls, LE-SPEC.output"),
  args("--to eyemind program.le"),
  file("program.le", [
    "the templates are: *a bird* migrates.",
    "the knowledge base demo includes: tern migrates.",
    "query q is: which bird migrates.",
  ]),
  stderr("empty"),
  stdout([
    "// Answers: each instance of a query() that holds.",
    "struct('le:answer', 'q', 'tern')",
  ]),
])

conformance("LE: an LS proof checks against the compiled LE program", [
  spec("LE-SPEC.output"),
  args("--check-proof proof.js program.le"),
  file("program.le", [
    "the templates are: *a bird* migrates.",
    "the knowledge base demo includes: tern migrates.",
    "query q is: which bird migrates.",
  ]),
  file("proof.js", [
    "struct('le:answer', 'q', 'tern')",
    "",
    "called(struct('le:answer', 'q', A), [struct('le:answer', 'q', 'tern')])",
  ]),
  stderr("empty"),
  stdout([
    "// Checked answers: these follow from the input program and are every answer of its questions.",
    "struct('le:answer', 'q', 'tern')",
    "",
    "// Proof check (SPEC 11.2-11.6):",
    "// Questions: every claim is an answer, and every required answer is claimed.",
    "// Call tables: every consulted table matches its one-level expansion against the program.",
    "// Derived listings: every consulted listing is closed under the forward rules.",
    "// Replay: every required firing replays from no bindings; primitives, controls and",
    "// Skolem witnesses are checked at the bindings where they run.",
    "// Evidence: every recorded step, call table and listing is used by the check.",
    "",
    "verdict('checked')",
  ]),
])

conformance("LE: a proof with a forged LE answer does not check", [
  spec("LE-SPEC.output"),
  args("--check-proof proof.js program.le"),
  exit(2),
  file("program.le", [
    "the templates are: *a bird* migrates.",
    "the knowledge base demo includes: tern migrates.",
    "query q is: which bird migrates.",
  ]),
  file("proof.js", [
    "struct('le:answer', 'q', 'gull')",
    "",
    "called(struct('le:answer', 'q', A), [struct('le:answer', 'q', 'gull')])",
  ]),
  stderr("empty"),
])

conformance("LE: an explanation follows each relation back to its premises", [
  spec("LE-SPEC.explanations"),
  args("--explain program.le"),
  file("program.le", [
    "the templates are: *a bird* has feathers, *a bird* is winged, *a bird* migrates.",
    "the knowledge base demo includes:",
    "tern has feathers.",
    "a bird is winged if the bird has feathers.",
    "a bird migrates if the bird is winged.",
    "query q is: which bird migrates.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "tern migrates",
    "    because tern is winged",
    "        because tern has feathers.",
  ]),
])

conformance("LE: an explanation displays the negated condition", [
  spec("LE-SPEC.explanations"),
  args("--explain program.le"),
  file("program.le", [
    "the templates are: *a bird* nests, *a bird* is tagged, *a bird* is unmarked.",
    "the knowledge base demo includes:",
    "tern nests.",
    "a bird is unmarked if the bird nests and it is not the case that the bird is tagged.",
    "query q is: which bird is unmarked.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "tern is unmarked",
    "    because tern nests",
    "    and it is not the case that tern is tagged.",
  ]),
])

conformance("LE: an explanation preserves a grouped divisor", [
  spec("LE-SPEC.explanations"),
  args("--explain program.le"),
  file("program.le", [
    "the templates are: the result is *a number*.",
    "the knowledge base demo includes: the result is a number N if N = 12 / (2 + 4).",
    "query q is: the result is which number.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "the result is 2",
    "    because 2 = 12 / (2 + 4).",
  ]),
])

conformance("LE: an unanswered query has no explanation", [
  spec("LE-SPEC.explanations"),
  args("--explain program.le"),
  file("program.le", [
    "the templates are: *a bird* migrates.",
    "query q is: which bird migrates.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "% no answers",
  ]),
])

conformance("LE: answers resting on assumptions cannot be explained", [
  spec("LE-SPEC.explanations"),
  args("--explain program.le"),
  exit(1),
  file("program.le", [
    "the templates are: the lamp is on; assumable.",
    "query q is: the lamp is on.",
  ]),
  stderr("nonempty"),
  stdout([]),
])

conformance("LE: flip queries cannot be explained", [
  spec("LE-SPEC.explanations"),
  args("--explain program.le"),
  exit(1),
  file("program.le", [
    "the templates are: *a bird* nests; judged.",
    "scenario field is: tern is a bird.",
    "query q is: which minimal change to the scenario makes it the case that tern nests.",
  ]),
  stderr("nonempty"),
  stdout([]),
])
