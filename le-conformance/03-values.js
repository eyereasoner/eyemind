// LE-SPEC arithmetic, comparisons, built-in templates and aggregates.

conformance("LE: sum and count keep repeated values and return zero for no solutions", [
  spec("LE-SPEC.facts-and-rules"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a lot* contains *an item* worth *an amount*. the total is *an amount*. the count is *a number*.",
    "the knowledge base demo includes:",
    "the total is a total if the total is the sum of each amount such that a lot contains an item worth the amount.",
    "the count is a count if the count is the count of each amount such that a lot contains an item worth the amount.",
    "scenario stocked is:",
    "    alpha contains bolt worth 5.",
    "    alpha contains screw worth 2.",
    "    beta contains pin worth 5.",
    "scenario empty is:",
    "query total is: the total is which amount.",
    "query count is: the count is which number.",
  ]),
  stderr("empty"),
  stdout([
    "% query total with scenario stocked",
    "the total is 12.",
    "",
    "% query count with scenario stocked",
    "the count is 3.",
    "",
    "% query total with scenario empty",
    "the total is 0.",
    "",
    "% query count with scenario empty",
    "the count is 0.",
  ]),
])

conformance("LE: min max and average have no result for an empty collection", [
  spec("LE-SPEC.facts-and-rules"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a box* holds *an amount*.",
    "scenario stocked is: alpha holds 2. beta holds 5.",
    "scenario empty is:",
    "query least is: which amount is the minimum of each weight such that a box holds the weight.",
    "query most is: which amount is the maximum of each weight such that a box holds the weight.",
    "query mean is: which amount is the average of each weight such that a box holds the weight.",
  ]),
  stderr("empty"),
  stdout([
    "% query least with scenario stocked",
    "2 is the minimum of each weight such that a box holds the weight.",
    "",
    "% query most with scenario stocked",
    "5 is the maximum of each weight such that a box holds the weight.",
    "",
    "% query mean with scenario stocked",
    "3.5 is the average of each weight such that a box holds the weight.",
    "",
    "% query least with scenario empty",
    "% no answers",
    "",
    "% query most with scenario empty",
    "% no answers",
    "",
    "% query mean with scenario empty",
    "% no answers",
  ]),
])

conformance("LE: list and LE1 collection preserve discovery order and duplicates", [
  spec("LE-SPEC.facts-and-rules"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a box* holds *an amount*. the ordered weights are *a list*. the observed weights are *a list*.",
    "the knowledge base demo includes:",
    "the ordered weights are a list L if L is the list of each W such that a box holds W.",
    "the observed weights are a list L if L is a collection of a W",
    "    where a box holds W.",
    "alpha holds 9.",
    "beta holds 2.",
    "gamma holds 9.",
    "query list is: the ordered weights are which list.",
    "query collection is: the observed weights are which list.",
  ]),
  stderr("empty"),
  stdout([
    "% query list",
    "the ordered weights are [9, 2, 9].",
    "",
    "% query collection",
    "the observed weights are [9, 2, 9].",
  ]),
])

conformance("LE: multiplication binds more tightly than addition", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: the result is *a number*.",
    "the knowledge base demo includes:",
    "the result is a number N if N = 2 + 3 * 4.",
    "query q is: the result is which number.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "the result is 14.",
  ]),
])

conformance("LE: parentheses change the order of operations", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: the result is *a number*.",
    "the knowledge base demo includes:",
    "the result is a number N if N = (2 + 3) * 4.",
    "query q is: the result is which number.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "the result is 20.",
  ]),
])

conformance("LE: equal-precedence subtraction evaluates left to right", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: the result is *a number*.",
    "the knowledge base demo includes:",
    "the result is a number N if N = 20 - 8 - 3.",
    "query q is: the result is which number.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "the result is 9.",
  ]),
])

conformance("LE: whole quotients are integers", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: the result is *a number*.",
    "the knowledge base demo includes:",
    "the result is a number N if N = 18 / 6.",
    "query q is: the result is which number.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "the result is 3.",
  ]),
])

conformance("LE: non-whole quotients are floats", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: the result is *a number*.",
    "the knowledge base demo includes:",
    "the result is a number N if N = 7 / 2.",
    "query q is: the result is which number.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "the result is 3.5.",
  ]),
])

conformance("LE: floor division of a negative dividend rounds downward", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: the result is *a number*.",
    "the knowledge base demo includes:",
    "the result is a number N if N = (0 - 7) // 3.",
    "query q is: the result is which number.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "the result is -3.",
  ]),
])

conformance("LE: the remainder has the sign of the divisor", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: the result is *a number*.",
    "the knowledge base demo includes:",
    "the result is a number N if N = (0 - 7) mod 3.",
    "query q is: the result is which number.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "the result is 2.",
  ]),
])

conformance("LE: thousands separators do not affect exact integers", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: the result is *a number*.",
    "the knowledge base demo includes:",
    "the result is a number N if N = 9,007,199,254,740,992 + 1.",
    "query q is: the result is which number.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "the result is 9007199254740993.",
  ]),
])

conformance("LE: a unary minus applies to the parenthesized formula", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: the result is *a number*.",
    "the knowledge base demo includes:",
    "the result is a number N if N = -(2 + 3).",
    "query q is: the result is which number.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "the result is -5.",
  ]),
])

conformance("LE: built-in arithmetic functions compose", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: the result is *a number*.",
    "the knowledge base demo includes:",
    "the result is a number N if N = round(sqrt(82)) + ceiling(1.2) + floor(2.9) + truncate(2.9) + abs(-4).",
    "query q is: the result is which number.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "the result is 19.",
  ]),
])

conformance("LE: arithmetic comparisons compare numbers from both formulas", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a box* weighs *a number*, *a box* is heavy.",
    "the knowledge base demo includes:",
    "alpha weighs 4.",
    "beta weighs 5.",
    "a box is heavy if the box weighs a number W and W * 2 > 7 + 1.",
    "query q is: which box is heavy.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "beta is heavy.",
  ]),
])

conformance("LE: a formula over a name fails", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates, LE-SPEC.not-supported"),
  args("program.le"),
  file("program.le", [
    "the templates are: the result is *a number*.",
    "the knowledge base demo includes:",
    "the result is a number N if N = barrel + 1.",
    "query q is: the result is which number.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "% no answers",
  ]),
])

conformance("LE: term equality distinguishes an integer and a float", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: equal numbers.",
    "the knowledge base demo includes:",
    "equal numbers if 2 = 2.0.",
    "query q is: equal numbers.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "% no answers",
  ]),
])

conformance("LE: arithmetic equality compares integer and float values", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: equal numbers.",
    "the knowledge base demo includes:",
    "equal numbers if 1 + 1 = 1.0 + 1.0.",
    "query q is: equal numbers.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "equal numbers.",
  ]),
])

conformance("LE: dates compare chronologically across a leap day", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a date* is on record, *a date* is late.",
    "the knowledge base demo includes:",
    "a date is late if the date is on record and the date is after 2024-02-29.",
    "2024-03-01 is on record.",
    "2024-02-29 is on record.",
    "2024-02-28 is on record.",
    "query q is: which date is late.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "2024-03-01 is late.",
  ]),
])

conformance("LE: date addition and subtraction both traverse a leap day", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: a date test.",
    "query add is: which date is 2 days after 2024-02-28.",
    "query count is: 2024-03-01 is which number days after 2024-02-28.",
    "query subtract is: 2024-03-01 is 2 days after which date.",
  ]),
  stderr("empty"),
  stdout([
    "% query add",
    "2024-03-01 is 2 days after 2024-02-28.",
    "",
    "% query count",
    "2024-03-01 is 2 days after 2024-02-28.",
    "",
    "% query subtract",
    "2024-03-01 is 2 days after 2024-02-28.",
  ]),
])

conformance("LE: minimum and maximum are built-in conditions", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: a number test.",
    "query low is: the minimum of 7 and 3 is which number.",
    "query high is: the maximum of 7 and 3 is which number.",
  ]),
  stderr("empty"),
  stdout([
    "% query low",
    "the minimum of 7 and 3 is 3.",
    "",
    "% query high",
    "the maximum of 7 and 3 is 7.",
  ]),
])

conformance("LE: list membership length reversal append and head-tail matching", [
  spec("LE-SPEC.arithmetic-comparisons-and-built-in-templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: a list test.",
    "query member is: which item is in [first, second].",
    "query length is: the length of [first, second] is which number.",
    "query reverse is: which list is the reverse of [first, second].",
    "query append is: appending [first] then [second] gives which list.",
    "query tail is: [first, second] has first as head before which rest.",
  ]),
  stderr("empty"),
  stdout([
    "% query member",
    "first is in [first, second].",
    "second is in [first, second].",
    "",
    "% query length",
    "the length of [first, second] is 2.",
    "",
    "% query reverse",
    "[second, first] is the reverse of [first, second].",
    "",
    "% query append",
    "appending [first] then [second] gives [first, second].",
    "",
    "% query tail",
    "[first, second] has first as head before [second].",
  ]),
])
