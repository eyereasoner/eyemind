// LE-SPEC Facts and rules, Functions, Negation, Embedded Prolog and Compilation to LS.

conformance("LE: a variable in a fact holds for every value", [
  spec("LE-SPEC.facts-and-rules"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* has wings.",
    "the knowledge base demo includes:",
    "a bird has wings.",
    "query q is: tern has wings.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "tern has wings.",
  ]),
])

conformance("LE: ontology kinds are transitive", [
  spec("LE-SPEC.facts-and-rules"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* migrates.",
    "the knowledge base demo includes:",
    "the ontology is:",
    "    a tern is a seabird.",
    "    a seabird is an animal.",
    "the knowledge base demo includes: arctic is a tern.",
    "query q is: arctic is an animal.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "arctic is an animal.",
  ]),
])

conformance("LE: equal indentation and deeper indentation yield distinct groups", [
  spec("LE-SPEC.facts-and-rules"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a user* is local, *a user* is a member, *a user* is an adult,",
    "    *a user* may enter, *a user* may vote.",
    "the knowledge base demo includes:",
    "a user may enter",
    "    if the user is local",
    "    or the user is a member",
    "        and the user is an adult.",
    "a user may vote",
    "    if the user is local",
    "    or the user is a member",
    "    and the user is an adult.",
    "ann is local.",
    "bob is a member.",
    "bob is an adult.",
    "query entry is: which user may enter.",
    "query ballot is: which user may vote.",
  ]),
  stderr("empty"),
  stdout([
    "% query entry",
    "ann may enter.",
    "bob may enter.",
    "",
    "% query ballot",
    "bob may vote.",
  ]),
])

conformance("LE: grouped any of and all of select the matching participants", [
  spec("LE-SPEC.facts-and-rules"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a user* is local, *a user* is a member, *a user* is an adult, *a user* may enter.",
    "the knowledge base demo includes:",
    "a user may enter if",
    "    all of:",
    "        the user is an adult",
    "        any of:",
    "            the user is local",
    "            the user is a member.",
    "ann is local.",
    "ann is an adult.",
    "bob is a member.",
    "query q is: which user may enter.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "ann may enter.",
  ]),
])

conformance("LE: numbered rule items support nested alternatives and conjunctions", [
  spec("LE-SPEC.facts-and-rules"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a user* is local, *a user* is a member, *a user* is an adult, *a user* may enter.",
    "the knowledge base demo includes:",
    "a user may enter if:",
    "    1. the user is an adult; and",
    "    2. either:",
    "    2.1. the user is local",
    "    2.2. the user is a member.",
    "ann is local.",
    "ann is an adult.",
    "bob is a member.",
    "bob is an adult.",
    "cal is local.",
    "query q is: which user may enter.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "ann may enter.",
    "bob may enter.",
  ]),
])

conformance("LE: only if blocks a base fact and derives its declared opposite", [
  spec("LE-SPEC.facts-and-rules"),
  args("program.le"),
  file("program.le", [
    "the templates are:",
    "    *a bird* may fly; opposite *a bird* must stay,",
    "    *a bird* is ready.",
    "the knowledge base demo includes:",
    "tern may fly.",
    "wren may fly.",
    "tern is ready.",
    "a bird may fly only if the bird is ready.",
    "query allowed is: which bird may fly.",
    "query blocked is: wren must stay.",
  ]),
  stderr("empty"),
  stdout([
    "% query allowed",
    "tern may fly.",
    "",
    "% query blocked",
    "wren must stay.",
  ]),
])

conformance("LE: a local variable under negation ranges over every possible value", [
  spec("LE-SPEC.negation"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a parcel* is waiting, *a parcel* reached *a place*, *a parcel* is undelivered.",
    "the knowledge base demo includes:",
    "a parcel is undelivered if the parcel is waiting and it is not the case that the parcel reached a place.",
    "box is waiting.",
    "crate is waiting.",
    "box reached depot.",
    "query q is: which parcel is undelivered.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "crate is undelivered.",
  ]),
])

conformance("LE: an open negated variable is existential", [
  spec("LE-SPEC.negation"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* nests, *a bird* is free.",
    "the knowledge base demo includes:",
    "a bird is free if it is not the case that the bird nests.",
    "wren nests.",
    "query q is: which bird is free.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "% no answers",
  ]),
])

conformance("LE: a bound negated variable tests that value", [
  spec("LE-SPEC.negation"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* nests, *a bird* is free.",
    "the knowledge base demo includes:",
    "a bird is free if it is not the case that the bird nests.",
    "wren nests.",
    "query q is: tern is free.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "tern is free.",
  ]),
])

conformance("LE: a universal fails on a counterexample and holds vacuously", [
  spec("LE-SPEC.facts-and-rules"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* nests, *a bird* is tagged. all nests are known.",
    "the knowledge base demo includes:",
    "all nests are known if for all cases in which a bird nests it is the case that the bird is tagged.",
    "scenario covered is: wren nests. wren is tagged.",
    "scenario missing is: tern nests.",
    "scenario empty is:",
    "query q is: all nests are known.",
  ]),
  stderr("empty"),
  stdout([
    "% query q with scenario covered",
    "all nests are known.",
    "",
    "% query q with scenario missing",
    "% no answers",
    "",
    "% query q with scenario empty",
    "all nests are known.",
  ]),
])

conformance("LE: acyclic data can pass through a recursive negation", [
  spec("LE-SPEC.negation"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* settles, *a bird* watches *a rival*.",
    "the knowledge base demo includes:",
    "a bird settles if the bird watches a rival and it is not the case that the rival settles.",
    "tern watches gull.",
    "gull watches wren.",
    "query q is: which bird settles.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "gull settles.",
  ]),
])

conformance("LE: source-scoped proof excludes unsourced and inadmissible scenario facts", [
  spec("LE-SPEC.negation"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a claim* is accepted, *a claim* is reported.",
    "the knowledge base demo includes:",
    "a claim is accepted if the claim is reported according to verified.",
    "field log is admissible under verified.",
    "claim1 is reported.",
    "scenario check is:",
    "    claim2 is reported, according to field log.",
    "    claim3 is reported, according to draft.",
    "    claim4 is reported.",
    "query q is: which claim is accepted.",
  ]),
  stderr("empty"),
  stdout([
    "% query q with scenario check",
    "claim1 is accepted.",
    "claim2 is accepted.",
  ]),
])

conformance("LE: positive recursion reaches a fixpoint through a cycle", [
  spec("LE-SPEC.compilation-to-ls"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a station* links to *a destination*, *a station* reaches *a destination*.",
    "the knowledge base demo includes:",
    "a station reaches a destination if the station links to the destination.",
    "a station reaches a destination if the station links to a next station and the next station reaches the destination.",
    "alpha links to beta.",
    "beta links to alpha.",
    "beta links to gamma.",
    "query q is: alpha reaches gamma.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "alpha reaches gamma.",
  ]),
])

conformance("LE: call-dependent recursion counts down", [
  spec("LE-SPEC.compilation-to-ls"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a number* can count down.",
    "the knowledge base demo includes:",
    "0 can count down.",
    "a number N can count down if N > 0 and M = N - 1 and M can count down.",
    "query q is: 3 can count down.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "3 can count down.",
  ]),
])

conformance("LE: a function supplies an operand and accepts a formula in brackets", [
  spec("LE-SPEC.functions"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a parcel* costs *an amount*.",
    "the functions are: the double of *a number* is *an amount*.",
    "the knowledge base demo includes:",
    "the double of a number N is an amount R if R = N * 2.",
    "parcel costs an amount R if R = the double of (3 + 2) + 1.",
    "query q is: parcel costs which amount.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "parcel costs 11.",
  ]),
])

conformance("LE: a function in a conclusion makes the fact a rule", [
  spec("LE-SPEC.functions"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a parcel* costs *an amount*.",
    "the functions are: the double of *a number* is *an amount*.",
    "the knowledge base demo includes:",
    "the double of a number N is an amount R if R = N * 2.",
    "parcel costs the double of 3.",
    "query q is: parcel costs which amount.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "parcel costs 6.",
  ]),
])

conformance("LE: embedded Prolog joins facts defined in a Prolog resource", [
  spec("LE-SPEC.documents, LE-SPEC.embedded-prolog"),
  args("program.le"),
  file("program.le", [
    "the knowledge base demo includes these resources: routes.pl.",
    "the templates are: *a site* is reached from *a place*.",
    "the knowledge base demo includes:",
    "a site is reached from a place if prolog route(the place, the site).",
    "query q is: which site is reached from east.",
  ]),
  file("routes.pl", [
    "leg(east, bridge).",
    "leg(bridge, depot).",
    "route(A, B) :- leg(A, X), leg(X, B).",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "depot is reached from east.",
  ]),
])

conformance("LE: an embedded Prolog goal can test an atom and fail", [
  spec("LE-SPEC.embedded-prolog"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a number* has a label, *a value* is labeled.",
    "the knowledge base demo includes:",
    "dock has a label.",
    "5 has a label.",
    "a value V is labeled",
    "    if V has a label",
    "    and prolog atom(V).",
    "query q is: which value is labeled.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "dock is labeled.",
  ]),
])

conformance("LE: reject a function template without a result introduced by is", [
  spec("LE-SPEC.functions"),
  args("program.le"),
  exit(1),
  file("program.le", ["the functions are: the double of *a number* plus *a number*."]),
  stderr("nonempty"),
  stdout([]),
])

conformance("LE: reject a universal missing its consequent", [
  spec("LE-SPEC.facts-and-rules"),
  args("program.le"),
  exit(1),
  file("program.le", [
    "the templates are: *a bird* nests. all nests are known.",
    "the knowledge base demo includes:",
    "all nests are known if for all cases in which a bird nests.",
  ]),
  stderr("nonempty"),
  stdout([]),
])
