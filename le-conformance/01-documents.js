// LE-SPEC Documents, Templates, Sentences and Not supported.

conformance("LE: section order and the predicates and contract headers", [
  spec("LE-SPEC.documents"),
  args("program.le"),
  file("program.le", [
    "query q is: which bird migrates.",
    "the target language is: prolog.",
    "the contract migration states that: swallow migrates.",
    "the predicates are: *a bird* migrates.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "swallow migrates.",
  ]),
])

conformance("LE: comments and multiline sentences", [
  spec("LE-SPEC.documents"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* builds *a nest*.",
    "the knowledge base migration includes:",
    "# A whole line of comment.",
    "swallow /* this is not part of the name */ builds",
    "    \"a mud nest\". % trailing comment",
    "query q is: swallow builds which nest.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "swallow builds a mud nest.",
  ]),
])

conformance("LE: relative LE resources contribute definitions only", [
  spec("LE-SPEC.documents"),
  args("lib/main.le"),
  file("lib/main.le", [
    "the knowledge base migration includes these resources:",
    "    rules.",
    "query q is: which bird flies.",
  ]),
  file("lib/rules.le", [
    "the templates are: *a bird* flies.",
    "the knowledge base birds includes: wren flies.",
    "scenario excluded is: robin flies.",
    "query excluded is: which bird flies.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "wren flies.",
  ]),
])

conformance("LE: scenario resources contribute their queries and local facts", [
  spec("LE-SPEC.documents"),
  args("main.le"),
  file("main.le", [
    "the templates are: *a bird* flies.",
    "the knowledge base migration includes these scenarios:",
    "    observations.",
  ]),
  file("observations.le", [
    "scenario spring is: robin flies.",
    "query q is: which bird flies.",
  ]),
  stderr("empty"),
  stdout([
    "% query q with scenario spring",
    "robin flies.",
  ]),
])

conformance("LE: two LE inputs share templates and rules", [
  spec("LE-SPEC.documents"),
  args("templates.le birds.le"),
  file("templates.le", ["the templates are: *a bird* is winged, *a bird* flies."]),
  file("birds.le", [
    "the knowledge base migration includes:",
    "wren is winged.",
    "a bird flies if the bird is winged.",
    "query q is: which bird flies.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "wren flies.",
  ]),
])

conformance("LE: case-insensitive template words", [
  spec("LE-SPEC.documents"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* migrates.",
    "the knowledge base demo includes:",
    "wren MIGRATES.",
    "query q is: which bird migrates.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "wren migrates.",
  ]),
])

conformance("LE: a web address at sentence end is a name", [
  spec("LE-SPEC.documents, LE-SPEC.sentences"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a file* has address *an address*.",
    "the knowledge base demo includes:",
    "map has address https://example.org/a::b.",
    "query q is: map has address which address.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "map has address https://example.org/a::b.",
  ]),
])

conformance("LE: a date with a time is a name", [
  spec("LE-SPEC.documents, LE-SPEC.sentences"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a map* has timestamp *a timestamp*.",
    "the knowledge base demo includes:",
    "map has timestamp 2018-06-29:00:00.",
    "map has timestamp 2018-06-29T10:30:00Z.",
    "query q is: map has timestamp which timestamp.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "map has timestamp 2018-06-29:00:00.",
    "map has timestamp 2018-06-29T10:30:00Z.",
  ]),
])

conformance("LE: unstarred LE1 places", [
  spec("LE-SPEC.templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: a bird migrates.",
    "the knowledge base demo includes:",
    "wren migrates.",
    "query q is: which bird migrates.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "wren migrates.",
  ]),
])

conformance("LE: an article is literal when the document uses starred templates", [
  spec("LE-SPEC.templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: a bird migrates, *a bird* flies.",
    "the knowledge base demo includes:",
    "a bird migrates.",
    "query q is: a bird migrates.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "a bird migrates.",
  ]),
])

conformance("LE: synonyms share facts in the same argument order", [
  spec("LE-SPEC.templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* rests on *a place*; synonym *a bird* perches on *a place*.",
    "the knowledge base demo includes:",
    "wren perches on fence.",
    "query q is: which bird rests on which place.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "wren rests on fence.",
  ]),
])

conformance("LE: ignored template additions leave the answers intact", [
  spec("LE-SPEC.templates"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* migrates; memorable; image \"bird.png\".",
    "the knowledge base demo includes:",
    "tern migrates.",
    "query q is: which bird migrates.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "tern migrates.",
  ]),
])

conformance("LE: a sentence term in a that place round trips through its template", [
  spec("LE-SPEC.templates, LE-SPEC.sentences"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* migrates, *a witness* says that *a sentence*.",
    "the knowledge base demo includes:",
    "kim says that tern migrates.",
    "query q is: which witness says that which sentence.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "kim says that tern migrates.",
  ]),
])

conformance("LE: quoted punctuation and parenthesized words in names", [
  spec("LE-SPEC.sentences"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a code* names *a thing*.",
    "the knowledge base demo includes:",
    "branch names Core Statistical Areas (Branch).",
    "clock names \"Ready? Yes.\".",
    "query q is: which code names which thing.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "branch names Core Statistical Areas (Branch).",
    "clock names Ready? Yes..",
  ]),
])

conformance("LE: constants supply values", [
  spec("LE-SPEC.sentences"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a parcel* costs *an amount*.",
    "the knowledge base demo includes:",
    "the constants are: the fee is 7.",
    "the knowledge base demo includes: parcel costs the fee.",
    "query q is: parcel costs which amount.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "parcel costs 7.",
  ]),
])

conformance("LE: a definite description without a variable is a name", [
  spec("LE-SPEC.sentences"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a parcel* goes to *a place*.",
    "the knowledge base demo includes:",
    "parcel goes to the depot.",
    "query q is: parcel goes to which place.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "parcel goes to the depot.",
  ]),
])

conformance("LE: an introduced ID is reused at both places", [
  spec("LE-SPEC.sentences"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* greets *a bird*, *a bird* greets itself.",
    "the knowledge base demo includes:",
    "wren greets wren.",
    "tern greets gull.",
    "a bird T greets itself if T greets T.",
    "query q is: which bird greets itself.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "wren greets itself.",
  ]),
])

conformance("LE: an explicit variable can carry a rule value", [
  spec("LE-SPEC.sentences"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a bird* covers *a distance* km, *a bird* flies far.",
    "the knowledge base demo includes:",
    "tern covers 90 km.",
    "a bird flies far if the bird covers *a distance* km and the distance > 50.",
    "query q is: which bird flies far.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "tern flies far.",
  ]),
])

conformance("LE: a lone which is a variable", [
  spec("LE-SPEC.sentences"),
  args("program.le"),
  file("program.le", [
    "the templates are: *a parcel* weighs *a number* kg.",
    "the knowledge base demo includes:",
    "parcel weighs 2 kg.",
    "query q is: parcel weighs which kg.",
  ]),
  stderr("empty"),
  stdout([
    "% query q",
    "parcel weighs 2 kg.",
  ]),
])

conformance("LE: reject a sentence with no full stop", [
  spec("LE-SPEC.documents"),
  args("program.le"),
  exit(1),
  file("program.le", [
    "the templates are: *a bird* migrates.",
    "the knowledge base migration includes: tern migrates",
  ]),
  stderr("nonempty"),
  stdout([]),
])

conformance("LE: reject a sentence with no matching template", [
  spec("LE-SPEC.sentences"),
  args("program.le"),
  exit(1),
  file("program.le", [
    "the templates are: *a bird* migrates.",
    "query q is: tern swims.",
  ]),
  stderr("nonempty"),
  stdout([]),
])

conformance("LE: reject two wordings with a colliding relation name and arity", [
  spec("LE-SPEC.templates"),
  args("program.le"),
  exit(1),
  file("program.le", [
    "the templates are: *a bird* visits *a place*,",
    "visits *a bird* *a place*.",
  ]),
  stderr("nonempty"),
  stdout([]),
])

conformance("LE: reject prepositional template additions", [
  spec("LE-SPEC.templates, LE-SPEC.not-supported"),
  args("program.le"),
  exit(1),
  file("program.le", ["the templates are: *a bird* migrates; prepositional."]),
  stderr("nonempty"),
  stdout([]),
])

conformance("LE: reject dynamic sections", [
  spec("LE-SPEC.not-supported"),
  args("program.le"),
  exit(1),
  file("program.le", ["the fluents are: *a bird* migrates."]),
  stderr("nonempty"),
  stdout([]),
])
