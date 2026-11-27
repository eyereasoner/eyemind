// LE-SPEC scenarios, expected answers, abduction, flip queries and output.

conformance("LE: knowledge-base facts are shared and scenario rules stay local", [
  spec("LE-SPEC.scenarios-queries-and-expected-answers, LE-SPEC.compilation-to-ls"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* flies, *a bird* migrates.",
    "the knowledge base demo includes:",
    "wren flies.",
    "scenario north is:",
    "    a bird migrates if the bird flies.",
    "    tern flies.",
    "scenario south is:",
    "    robin flies.",
    "query migrants is: which bird migrates.",
    "query flyers is: which bird flies.",
  ]),
  stderr("empty"),
  stdout([
    "% query migrants with scenario north",
    "wren migrates.",
    "tern migrates.",
    "",
    "% query flyers with scenario north",
    "wren flies.",
    "tern flies.",
    "",
    "% query migrants with scenario south",
    "% no answers",
    "",
    "% query flyers with scenario south",
    "wren flies.",
    "robin flies.",
  ]),
])

conformance("LE: expected answers compare as a set", [
  spec("LE-SPEC.scenarios-queries-and-expected-answers, LE-SPEC.output"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a parcel* reached the port.",
    "scenario delivery is:",
    "    alpha reached the port.",
    "    beta reached the port.",
    "    q expects answers [\"beta reached the port\", \"alpha reached the port\", \"alpha reached the port\"].",
    "query q is: which parcel reached the port.",
  ]),
  stderr("empty"),
  stdout([
    "% query q with scenario delivery",
    "alpha reached the port.",
    "beta reached the port.",
  ]),
])

conformance("LE: an unmet expectation is reported after the actual answers", [
  spec("LE-SPEC.scenarios-queries-and-expected-answers, LE-SPEC.output"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a parcel* reached the port.",
    "scenario delivery is:",
    "    alpha reached the port.",
    "    q expects answers [\"beta reached the port\"].",
    "query q is: which parcel reached the port.",
  ]),
  stderr("empty"),
  stdout([
    "% query q with scenario delivery",
    "alpha reached the port.",
    "% not as expected: q expects answers [\"beta reached the port\"]",
  ]),
])

conformance("LE: an unanswered query still has its heading", [
  spec("LE-SPEC.output"),
  args("program.le"),
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

conformance("LE: an unbound query variable is written as an underscore", [
  spec("LE-SPEC.output"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* has wings.",
    "the knowledge base demo includes:",
    "a bird has wings.",
    "query q is: which bird has wings.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "_ has wings.",
  ]),
])

conformance("LE: an assumption is reported only when the sentence cannot be proved", [
  spec("LE-SPEC.abduction"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a door* opens, *a door* is unlocked; assumable.",
    "the knowledge base demo includes:",
    "a door opens if the door is unlocked.",
    "north is unlocked.",
    "query northbound is: north opens.",
    "query southbound is: south opens.",
  ]),
  stderr("empty"),
  stdout([
    "% query northbound",
    "north opens.",
    "",
    "% query southbound",
    "south opens.",
    "% assuming that south is unlocked",
  ]),
])

conformance("LE: a scenario denial prevents making the assumption", [
  spec("LE-SPEC.abduction"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a door* opens, *a door* is unlocked; unknown.",
    "the knowledge base demo includes:",
    "a door opens if the door is unlocked.",
    "scenario barred is:",
    "    it is not the case that north is unlocked.",
    "scenario open question is:",
    "    q expects answers [\"north opens\"] and unknowns [\"north is unlocked\"].",
    "query q is: north opens.",
  ]),
  stderr("empty"),
  stdout([
    "% query q with scenario barred",
    "% no answers",
    "",
    "% query q with scenario open question",
    "north opens.",
    "% assuming that north is unlocked",
  ]),
])

conformance("LE: negation can require a negative assumption", [
  spec("LE-SPEC.abduction"),
  args("program.le"),
  file("program.le", [
    "the templates are: the trail is closed; assumable. the trail is open.",
    "the knowledge base demo includes:",
    "the trail is open if it is not the case that the trail is closed.",
    "query q is: the trail is open.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "the trail is open.",
    "% assuming that it is not the case that the trail is closed",
  ]),
])

conformance("LE: different derivations can give alternative assumption sets", [
  spec("LE-SPEC.abduction"),
  args("program.le"),
  file("program.le", [
    "the templates are: the lamp is on; unknown. the window is open; unknown. the room is lit.",
    "the knowledge base demo includes:",
    "the room is lit if the lamp is on.",
    "the room is lit if the window is open.",
    "query q is: the room is lit.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "the room is lit.",
    "% assuming that the lamp is on",
    "% or assuming that the window is open",
  ]),
])

conformance("LE: an integrity constraint rejects an incompatible assumption", [
  spec("LE-SPEC.abduction"),
  args("program.le"),
  file("program.le", [
    "the templates are: the trail is closed; assumable. the trail is flooded.",
    "the knowledge base demo includes:",
    "it must not be true that the trail is closed and it is not the case that the trail is flooded.",
    "query q is: the trail is closed.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "% no answers",
  ]),
])

conformance("LE: flip queries report a minimal addition and no change in another scenario", [
  spec("LE-SPEC.flip-queries"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a door* is locked; judged. *a door* is marked.",
    "scenario locked is:",
    "    main is a door.",
    "    main is locked.",
    "scenario open is:",
    "    main is a door.",
    "query q is: which minimal change to the scenario makes it the case that it is not the case that main is locked.",
    "query r is: which minimal change to the scenario makes it the case that main is locked.",
  ]),
  stderr("empty"),
  stdout([
    "% query q with scenario locked",
    "remove: main is locked.",
    "",
    "% query r with scenario locked",
    "no change is needed.",
    "",
    "% query q with scenario open",
    "no change is needed.",
    "",
    "% query r with scenario open",
    "add: main is locked.",
  ]),
])

conformance("LE: flip queries exclude larger sets when one change suffices", [
  spec("LE-SPEC.flip-queries"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* is tagged; judged. *a bird* nests; judged. *a bird* is recorded.",
    "the knowledge base demo includes:",
    "a bird is recorded if the bird is tagged.",
    "a bird is recorded if the bird nests.",
    "scenario field is:",
    "    tern is a bird.",
    "    q expects changes [[\"add: tern is tagged\"], [\"add: tern nests\"]].",
    "query q is: which minimal change to the scenario makes it the case that tern is recorded.",
  ]),
  stderr("empty"),
  stdout([
    "% query q with scenario field",
    "add: tern is tagged.",
    "add: tern nests.",
  ]),
])
