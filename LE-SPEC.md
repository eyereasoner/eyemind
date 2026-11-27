# Logical English

[Logical English](https://github.com/LogicalContractsOrg/LogicalEnglish) (LE)
is the controlled natural language of Robert Kowalski, Jacinto Dávila, Miguel
Calejo, Galileo Sartor and their colleagues for writing legal and business
rules as English that a computer runs. eyemind reads `.le` files in the core
that the original implementation, LE 1.0 with its
[syntax document](https://github.com/LogicalContractsOrg/LogicalEnglish/blob/main/le_syntax.md),
and [Logical English 2](https://github.com/LogicalContractsOrg/LogicalEnglish2)
share, and compiles them to ordinary Logic Script (LS). This is an input
extension: the meaning of the compiled program is defined by the
[LS specification](https://eyereasoner.github.io/eyemind/LS-SPEC), and this
document says how eyemind reads LE and what it compiles each part to. Where the
two LE implementations differ, it says which reading eyemind follows.

The [Logical English conformance suite](https://eyereasoner.github.io/eyemind/le-conformance/)
has cases for each section of this reference. Run them with
`node le-conformance/run.js` or in the
[LE browser runner](https://eyereasoner.github.io/eyemind/playground/conformance?suite=le).

## Documents

A document is a sequence of sections. Each section starts with a header that
ends with `:`:

| Header | Section |
| --- | --- |
| `the templates are:`, `the predicates are:` | Templates, separated by full stops, and by commas at the end of a line or before a place. |
| `the functions are:` | Templates of the form `... is *a value*`, also written without their value. |
| `the knowledge base NAME includes:`, `the contract NAME states that:` | Facts and rules. |
| `the ontology is:` | Facts and rules; a fact `a student is a person.` relates the kinds `student` and `person`. |
| `the constants are:` | Named values, one sentence each: `the fee is 5.` |
| `the knowledge base NAME includes these resources:` | Other files, separated by commas, whose templates, facts, rules, ontologies and constants join the document. |
| `the knowledge base NAME includes these scenarios:` | Other files, as resources, whose scenarios and queries join the document too. |
| `scenario NAME is:` | Facts and rules of one scenario, and its expected answers. |
| `query NAME is:` | One query. |

`the target language is: prolog.` is accepted and ignored, and so are LE2's
section markers, `section NAME is:` and `the annexes to the contract are:`,
and its rule labels, `rule NAME:` before a rule. The sections can come in any
order, and a template can be used before it is declared. Several `.le` files
are read as one document.

An included file is named as in LE2: a path relative to the file that
includes it, or a web address, without `.le` if one likes. It is read once,
and a chain of includes stops at five. The command line reads included files
and web addresses; the library reads them through `io.readFile` and
`io.readDocument` when `compileLe(inputs, io)` is given them. A Prolog
resource, a file ending in `.pl`, gives its facts and rules: Prolog clauses
`Head.` and `Head :- Body.`, with the goals of an embedded Prolog goal (see
Embedded Prolog); its directives are left out.

`the facts background includes these resources: ...` names the programs that
help an assistant read facts from a text; as in LE2, the answers do not depend
on them, and eyemind reads past the section.

A fact or a rule's label may carry LE2's provenance, which changes nothing in
the proof but gives the fact its source:

- trailers after a fact, each after a comma: `, according to SOURCE`,
  `, as stated in DOCUMENT at LOCATOR`, `, because "..."` and `, confer "..."`;
- `scenario NAME is, as stated in DOCUMENT:`, the default document of the
  scenario's facts;
- `rule NAME with provenance DOCUMENT, confer "...":`;
- `DOCUMENT is published at "..."` and `the text of DOCUMENT is at "..."`,
  which eyemind reads past.

A fact's source is its `according to`, else its document. It matters only to
source-scoped proof (see Negation).

Sentences end with a full stop followed by white space or the end of the file;
a sentence can span lines. `%` or `#` starts a comment through the end of the
line, and `/* ... */` is a block comment. Words are compared without case.

A token is a word (letters, digits and underscores, joined by hyphens or
apostrophes, as in `JE-201` and `don't`), a final `'s` as a word of its own, a
number (`42`, `3.14`, `1,000,000`), a date (`2021-10-09`), a quoted text
(`"..."` or `'...'`), a web address (`https://example.org/a::b`, up to white
space and without a final `.`, `,`, `;` or `:`), a date followed at once by a
time (`2018-06-29T10:30:00Z`, `2018-06-29:00:00`), or a punctuation sign. A web
address and a date with a time are words of a name, written as they are; only
a date has a calendar meaning. The indentation of a line counts a
space as one and a tab as four, as LE's editor shows it.

## Templates

A template is a sentence pattern: words and places. A place is a phrase between
asterisks, such as `*a person*`; LE1 also writes templates without asterisks.
In a document without any, `a` or `an` and the word after it make a place in a
template that starts with `a` or `an`, such as `a person has a balance`; a
template such as `the applicant has a good credit score` keeps its words.

```text
the templates are:
    *a person* acquires British citizenship on *a date*,
    *a person* says that *a sentence*,
    a person has a balance.
```

Each template is a relation whose name joins its words with underscores and
whose arguments are its places in order: `acquires_British_citizenship_on/2`,
`says_that/2`, `has/2`. A name that is an LS primitive or control, or `date`,
gets the prefix `le_`. Two templates with different words for one name and
arity are an error. A place after the word `that` holds a sentence. A document
with an asterisk in any template reads `a` and `an` in its other templates as
words.

LE2's additions follow a template after `;`:

| Addition | Meaning in eyemind |
| --- | --- |
| `; synonym TEMPLATE` | A second wording of the same relation, with its places in the same order. |
| `; opposite: TEMPLATE`, `; opposite TEMPLATE` | The wording of a separate relation, concluded only by its own rules and by `only if` rules. |
| `; assumable`, `; unknown`, `; assumed`, `; judged`, `; open textured`, `; evaluative` | A sentence that the program cannot prove can be assumed; see Abduction. |
| `; memorable`, `; memoised`, `; memoized`, `; cached`, `; undefined`, `; scenario element`, `; one value`, `; single valued`, `; image ...` | Nothing that eyemind computes changes. |

Other additions, such as `; prepositional` and `; via service NAME`, are errors.

## Sentences

A sentence matches a template when it has the template's words in order, with
at least one token in each place and balanced brackets in each. eyemind tries
the templates with a `that` place first, as LE does, then the templates with the
most words, a declared template before a built-in one, and takes the first that
matches with a valid term in every place. A sentence that matches no template
is an error that quotes it.

The tokens in a place are a term:

- A number is an exact integer, or a float when it has a fraction or an
  exponent; `-` before a number negates it. Commas may group thousands.
- A date is the compound `date(Year, Month, Day)`.
- A quoted text is a name.
- `[A, B, C]` is a list of terms.
- `a`, `an`, `some`, `each` or `which`, followed by at most six words,
  introduces a variable: `a person`, `an other person`, `a second date`. The
  same phrase again is the same variable.
- `the` followed by the words of a variable introduced earlier in the clause
  refers to it: `the person`, `the other person`. A definite phrase that refers
  to no variable is a name, written with its article: `the UK`, `the white
  rabbit`. This follows LE2; the same phrase names the same thing everywhere.
- A phrase whose last word is an id names its variable by the id: `a person X`
  is the variable `X`, and `X` alone then refers to it. An id is one capital
  letter with optional digits, or a word of at most six capitals and digits
  other than `UK`. eyemind does not read LE2's short proper names such as `Bob`
  as ids: LE1 programs use them as names.
- A single capital letter with optional digits, such as `L` or `T1`, is a
  variable even when no phrase introduced it. Longer ids need an introducing
  phrase, because LE1 programs use acronyms such as `GST` as names.
- `*a name*` between asterisks, LE2's explicit variable, is the variable of
  that phrase, introduced or referred to.
- A lone `which`, `what`, `who`, `when` or `where` introduces a variable.
- A phrase that names a constant of `the constants are:` is its value, unless a
  variable of the clause has that name.
- Other words are a name, written as they are, such as `Socrates` or
  `cash at bank`. After its first word, a name may hold words in brackets, as
  in `Core Statistical Areas (Branch)`; brackets around anything else make a
  formula.

In the place of a `that`, a sentence of a template is a term: the template's
relation with its arguments, as data.

## Facts and rules

In a knowledge base or a scenario, a sentence is a fact, or a rule
`conclusion if conditions.` The conclusion matches a declared template or the
type template `*an object* is a *type*` (the relation `is_a/2`, whose type is a
name). A fact with a variable holds for every value. In an ontology, a fact
whose subject starts with `a` or `an` is about the kind: `a student is a person.`
states `is_a('student', 'person')`. An ontology's kinds are transitive: for
each such ground fact `b is a c`, whatever is a `b` is a `c`. A fact or rule
may end with LE2's `; image ...`, which is ignored.

`Head only if Body.` makes Body necessary for Head, as in LE2: it concludes the
opposite of Head, the template's `; opposite` wording or else an internal
relation, when it is not the case that Body. The other rules of Head's relation
then conclude a base relation, and Head holds when the base holds and its
opposite does not.

The conditions are joined by `and` and `or`. Each connective has the
indentation of its line; a connective in the middle of a line has the
indentation of that line, and a line break without a connective joins the lines
with `and` where both lines are conditions. eyemind reads the connectives as
LE's indentation does: the conditions are split at the least indented
connectives, joined from the top down, and each part is read in the same way.
So a deeper indentation binds tighter:

```text
a person is eligible            a person is eligible
    if the person is a resident     if the person is a resident
    or the person is a citizen      or the person is a citizen
    and the person is an adult.         and the person is an adult.
```

The left rule means *(resident or citizen) and adult*, the right one *resident
or (citizen and adult)*. LE1 rejects different connectives at one indentation;
eyemind reads them from the top down, as LE2 does. A body may start with `and`
after `if`, as some LE1 programs write it.

A condition is a sentence of a template, a comparison, or one of the following,
each of which takes the lines that follow it up to the next line that starts
with a connective at the same or a lesser indentation:

| Condition | LS |
| --- | --- |
| `it is not the case that C`, `not the case that C` | `not(C)` |
| `for all cases in which C it is the case that D` | `not([C, not(D)])` |
| `R is the sum of each X such that C` | `findall(X, C, L)` and the sum of `L`; `0` for none |
| `R is the count of each X such that C` | the length of `L`; `0` for none |
| `R is the average of each X such that C` | the sum divided by the count; none for none |
| `R is the min of each X such that C`, `minimum`, `max`, `maximum` | the least or greatest of `L`; none for none |
| `R is the list of each X such that C` | `L` itself |
| `R is a collection of X where C` | `L` itself, as LE1 writes it |

LE2 also groups conditions without connectives. `any of`, `either` or
`at least one of`, and `all of`, each followed by `:` or a line break, join the
conditions on the lines below them, one per line at the least indentation,
with `or` or with `and`.

A rule whose `if` is followed by `:` has a numbered body, as LE2 writes one
after a statute:

```text
an entity must register for GST if:
    1. the entity is a not-for-profit; and
    2. either:
    2.1. the entity has a turnover
    2.2. all of:
    2.2.1. the entity projected turnover is a projection; and
    2.2.2. the projection >= 150000.
```

A designator such as `2.2.1.` begins its line. An item's trailing `and` or
`or`, after an optional `;`, joins it to the next item of its level, and an
item without one joins with `and`. An item `either:`, `any of:`,
`at least one of:`, `all of:` or `it is not the case that:` stands for the
items numbered below it, joined as the group says, or denied.

An aggregate collects one value for every solution of its conditions, in the
order they are found, as Prolog's `findall` does: a value found twice counts
twice. The result phrase of an aggregate is the phrase before `is the`, after any
connective.

## Functions

A template of `the functions are:` is an ordinary template whose last place
follows `is`, such as `the price of a cup with capacity *a number* ml is *an
amount*`. Wherever a value is needed (a place of another template, a side of a
comparison, an operand of a formula or the conclusion of a rule), the template
can be written without `is` and its last place:
`the price of a cup with capacity the capacity ml > 10`. That phrase is a
variable that a call of the function binds, asked before the condition that
uses it, or after the conditions of a rule for its conclusion; a fact whose
conclusion calls a function is such a rule. One clause asks one call once. A
variable or a constant of the same name comes first. In a formula, an operand
is the words up to the next operator, and a function's last argument may be a
formula in brackets: `the double of (the fee + 1)`.

## Negation

Variables that occur only inside a negation stand for any value there; eyemind
renames them `_0`, `_1`, ..., which LS negation treats as anonymous. LE's rules
are written for Prolog, whose negation also succeeds when no instance of its
goal holds if one of its variables is unbound. LS requires the named variables
of a negation to be bound, so a negation with a variable no earlier condition
binds, up to three such variables, tests each one at run time: while it is
unbound (`is_var`), the negation stands for any value there; once bound
(`is_nonvar`), it is that value. When a fact or rule of the document leaves a
variable of its conclusion open, no condition surely binds a variable, and
every negation tests its variables in this way.

LE runs a rule top-down, so a negation or a collection may reach the rule's own
relation, through other rules, as long as the data never closes the cycle. LS
stratifies statically, so eyemind unfolds such a group of relations into eight
levels: a negation or collection at level k calls level k + 1, a relation of
its own, `NAME#k`. The answers are exact up to eight levels; a program that
needs more stops with an error that says so.

`C according to S`, written at the end of a condition or on a line indented
below it, is LE2's source-scoped proof: C must follow from the knowledge base
and only the scenario facts whose source is admissible under S. Every relation
C can reach compiles to a second relation, `NAME:sc`, with the scope as one
more argument, in which a scenario fact holds when its source is admissible
under the scope; a scenario fact without a source is never admissible. The
built-in template `*a source* is admissible under *a scope*` holds for a source
under itself and as the program's facts and rules say. When a template's own
words contain `according to`, a condition is read as that template first.

## Embedded Prolog

A condition `prolog GOAL` runs a Prolog goal, as LE2 writes one: goals joined
by `,` and `;`, `\+ GOAL` for negation, `Module:GOAL`, and the tests `=`,
`\=`, `==`, `\==`, `<`, `>`, `=<`, `>=`, `atom/1`, `number/1`, `integer/1`,
`var/1`, `nonvar/1`, `true` and `fail`. An argument is a Prolog variable, atom,
number, list or compound, or an LE phrase such as `the person`; a definite
phrase that refers to no variable starts one. Other goals call the relations of
Prolog resources. LE2's system predicates are:

| Goal | Holds for |
| --- | --- |
| `le_my_kb(K)`, `le_kb(K)` | the name of the rule's knowledge base |
| `le_my_id(L)` | the rule's label |
| `le_source_element(L, D, G)` | the label of a rule with a numbered body, and each designator `D` of its conditions |
| `le_source_section(S, L)` | the section of a labelled rule: `main`, `annexes`, or the name of `section NAME is:` |

## Arithmetic, comparisons and built-in templates

A comparison has `=`, `==`, `!=`, `\=`, `\==`, `<`, `>`, `<=`, `=<` or `>=`
between two sides. A side is a term, or a formula of terms with `+`, `-`, `*`,
`/`, `//`, `mod`, parentheses and the functions `ceiling`, `floor`, `round`,
`truncate`, `integer`, `abs` and `sqrt`. A term in a formula is any of the terms
above, such as `the gain = the proceeds - the cost base`.

| Comparison | LS |
| --- | --- |
| `A = B`, `A == B`, `A is equal to B` | `unify(A, B)` between terms; `is` when one side is a formula; `eq` between formulas |
| `A != B`, `A \= B`, `A is different from B`, `A is not equal to B` | `not_unify(A, B)` between terms; `ne` otherwise |
| `A \== B` | `not_identical(A, B)` |
| `<`, `>`, `<=` or `=<`, `>=`, and `is less than`, `is greater than`, `is less than or equal to`, `is greater than or equal to`, `is less or equal to`, `is greater or equal to` | `lt`, `gt`, `le`, `ge` |

`/` divides as Prolog does: integers that divide give an integer, other
operands a float. `//` is floor division. LE1's `A is B` equates or evaluates
as `=` does when a side is a variable or a formula; between two names no
template matches.

| Built-in template | LS |
| --- | --- |
| `*a* is after *b*`, `is before`, `is after or equal to`, `is before or equal to`, `is not before` | the standard order with `compare`, so dates compare in time order |
| `*a* is *n* days after *b*`, `*a* is *n* day after *b*` | days in the proleptic Gregorian calendar; any two of the three give the third |
| `*a* is in *b*` | `a` is a member of the list `b` |
| `*a* is known` | `is_nonvar(a)` |
| `the minimum of *a* and *b* is *c*`, `the maximum of ...` | `is(c, min(a, b))`, `max` |
| `the length of *a* is *b*` | the length of the list `a` |
| `*a* is the reverse of *b*` | `a` is the list `b` reversed |
| `appending *a* then *b* gives *c*` | `c` is `a` followed by `b` |
| `*a* has *b* as head before *c*` | `unify(a, [b, ...c])` |

## Scenarios, queries and expected answers

A query has one sentence of conditions, read as a rule's conditions are.
`which person`, like `a person`, introduces a variable, and LE1's prefix
`for which event:` introduces one too. A scenario has facts and rules, and
expectations:

```text
scenario alice is:
    John is born in the UK on 2021-10-09.
    one expects answers ["John acquires British citizenship on 2021-10-09"].
```

`NAME expects answers [...]` and `NAME expects [...]` state the answers the
query `NAME` gives in the scenario. The answers may be quoted sentences or, as
some examples write them, words up to a comma. An expectation with
`and unknowns [...]` also states the union of the unknowns the answers rest
on, and one with `and any unknowns` compares only the answers; one without
`and unknowns` wants answers that rest on none. Each query is answered in each
scenario, or once when the document has none.

## Abduction

When the program cannot prove a sentence of an assumable template, an answer
can rest on the assumption that the sentence holds, as in LE2. The sentence is
then one of the answer's unknowns. `it is unknown whether SENTENCE.`, in the
knowledge base or in one scenario, makes the sentences that SENTENCE describes
assumable there, as in `it is unknown whether a payment is approved.`

Every relation that can reach an assumable sentence also compiles to a second
relation, `NAME:ab`, with one more argument: the list of the sentences it
assumes. Its rules are those of `NAME`, each condition that can reach an
assumable sentence called through its own `:ab` relation, and the lists
appended. An assumable relation also has the rule that assumes its sentence.
Each answer, `'le:answer'(..., U)`, gets the list `U` of its assumptions,
without each ground sentence that the facts and rules prove after all, through
`'le:unknowns'` and `'le:holds'`. An answer that holds with no assumption is
definite; otherwise each of its sets of assumptions is written after it:

```text
% query explain with scenario observation
the grass is wet.
% assuming that it rained
% or assuming that the sprinkler was on
```

A negation of a sentence that can rest on an assumption follows LE2. It finds
every way the sentence holds, with its assumptions; it fails when one way needs
none, and otherwise assumes, for each way, one of its assumptions false,
leaving out a way that contradicts what the answer assumes already. A
negative assumption is written `it is not the case that S`. A collection, and
the conditions of a universal, count every way with all its assumptions, as
LE2's maximal reading does. An assumption is not made when, at the time it is
asked, its sentence is proved, or a scenario denies it with
`it is not the case that S.`

An answer is rejected when it assumes a sentence and its negation, or assumes
false a sentence that the facts and rules prove. `it must not be true that C.`
is an integrity constraint: with the answer's assumptions as the only ones,
C must not hold. A violation whose missing piece is a negated assumable
sentence, as in `... and it is not the case that the second person is married
to the person`, is repaired by assuming that sentence too; another violation
rejects the answer. Facts that break a constraint alone leave the scenario
without answers. The constraints compile to `NAME:w` relations, in which an
assumable sentence holds when proved or assumed, and `'le:violation'`.

## Flip queries

`query NAME is: which minimal change to the scenario makes it the case that
GOAL.` asks, for each scenario, for the smallest sets of changes after which
GOAL holds without assumptions. A change adds or removes a fact of a template
marked `; undefined` or `; judged`, or, in a program without such marks, of a
template that no rule concludes and that is no function. A place is filled with
the individuals the scenario names as of the place's type, or with all its
individuals when it names none; a kind is no individual, and a template of more
than two places is not filled. A set has at most three changes. Each changed
world `'le:flip'(S, CHANGES)` states its facts as ground facts, so a search
whose worlds would need more than 200000 facts is refused. An answer is written
`add: S and remove: T`, or `no change is needed`, and
`NAME expects changes [["add: S"], ...]` states the expected sets.

## Compilation to LS

Facts and rules compile to LS facts and backward rules (`implied_by`), as LE's
Prolog target runs them; a ground fact is `fact(...)`, a fact with a variable a
backward rule with the body `'true'`. LE1 runs recursive rules with tabling and
LE2 with a loop check, so a group of relations that depend on themselves
compiles to forward rules (`implies`), which reach the least fixpoint, when
each of its rules binds every variable of its conclusion through the relations
of its conditions; a rule that depends on how it is called, such as a counter
that goes down, stays backward.

When a document has scenarios, every relation gets the scenario as its first
argument, a scenario's clauses have the scenario's name there, and the
knowledge base's clauses have a variable there, bound by the facts
`'le:scenario'(NAME)`. A ground knowledge-base fact is stated once in each
scenario, and another becomes a rule whose body is `'le:scenario'(S)`. So the
knowledge base holds in every scenario and a
scenario's facts in that one, and one program and one proof answer every query
in every scenario.

A query `NAME` compiles to a backward rule for `'le:answer'(NAME, S, V1, ...)`,
whose body starts with `'le:scenario'(S)` when there are scenarios, and the
statement `query('le:answer'(NAME, S, V1, ...))`. `V1, ...` are the variables of
the query outside negations and collections, in the order they appear.

A sum, count, average, minimum or maximum collects its values with
`findall_sorted`, since it does not depend on their order, and a proof can
then certify it even when the values rest on derived facts; `list` and
`collection` keep the order found, with `findall`.

Aggregates, divisions, lists and dates use backward helper rules whose names
start with `le:` (`le:sum`, `le:count`, `le:days_after`, ...); no template name
can contain `:`. The helpers follow the document's clauses. `--program` prints
the compiled program as a standalone LS script.

## Output

The default output of an LE run is LE text: for each scenario, in the order of
the document, and each query, a heading comment and the answers as sentences.
An answer is the query's words with each variable it found a value for
written as that value; an open variable is written `_`, as LE writes it. A date
is written `YYYY-MM-DD`, a list in brackets, and a sentence term through its
template.

```text
% query one with scenario alice
John acquires British citizenship on 2021-10-09.
```

A query without answers has the line `% no answers`. When the scenario states
expected answers for the query and they differ from the answers, a line
`% not as expected: NAME expects answers [...]` follows. LE2 writes the
underscores of names as spaces and repeats an answer for each proof, so the
comparison reads underscores as spaces, ignores spaces around hyphens, and
compares the answers as a set.

`--to le` writes the answers of an LE run only; `--to eyemind` writes the
`'le:answer'` terms. Proofs and check reports are `.js` documents of the
compiled LS program, and check against it; with abduction, a checked proof
establishes each answer with the assumptions it lists. That the program reads the English
as intended is a matter of the compiler and its tests; a checked proof
establishes the answers under the compiled rules.

## Explanations

`--explain` writes each answer with the derivation its checked proof records,
in English: under each query's heading, the answer's sentence, then `because`
and the conditions it rests on, joined by `and`, each relation that a rule
concludes explained the same way on the lines indented below it. The last
line of an answer ends with a full stop.

```text
% query q with scenario s
Socrates owes 7 by 2024-03-16
    because Socrates is mortal
        because Socrates is human
        and it is not the case that Socrates is exempt
    and Socrates charged 6 for wine on 2024-02-15
    and 2024-03-16 is 30 days after 2024-02-15
    and 10 is the sum of each fee such that Socrates charged the fee for a thing on a day, namely 4 and 6
    and 7 = 10 - 6 / 2.
```

The proof is made and checked first; a proof that does not check explains
nothing. An answer of a call table is explained by expanding the table's call
one level against the program, as the checker does, and taking the first
solution that gives the answer; a fact that forward rules derive, by the
firing its step records. The inner calls are answered by the proof's own
tables and listings, so nothing is searched for. Each condition is written
through its template, with the values of that solution:

- a variable left open is the phrase that named it, `a thing` and then
  `the thing`, or the noun of its place when it had none, as in `an article`;
  a variable named by an id is the id;
- a negation is `it is not the case that` and the sentence it denies; it rests
  on the complete tables of the proof, and has no derivation of its own;
- an aggregate gives its value, its condition and the values it collected, after
  `namely`;
- a comparison of dates is `is before`, `is after` or `is the same day as`, a
  date count `is N days after`, and arithmetic the formula with its values and
  parentheses to preserve the order of operations;
- a sentence a relation states at another level of an unfolding, or the base
  relation of an `only if` rule, gives its own conditions instead of
  repeating the answer;
- a fact, and a sentence already explained earlier in the same answer, ends
  its line.

Answers that rest on assumptions, and flip queries, are not explained.

## Not supported

These belong to Logical English 2, or to the Prolog that LE1 can embed, and
are errors: the template additions the table above leaves out, such as
`; prepositional` and `; via service`, `the fluents are:`, `the events are:`
and the other dynamic and meta sections, Prolog goals other than those of
Embedded Prolog, `otherwise`, `unless`, decision tables, services, views, LPS
and s(CASP). eyemind does not check types: the head noun of a place is not a
type constraint, except that a flip query fills a place with individuals of
its type.

Some of LE2's readings are lenient, and eyemind follows them: a name's
underscores are spaces (`Sales Associates` refers to `a Sales_Associates`); a
formula over a name, which Prolog stops with an error, fails; a scenario fact
`A is B` that no template matches states the relation `le_is`; after a type, a
short capitalized word is an id, as in `a number MyD`; and an expected number
with decimals matches an answer rounded to as many decimals.
