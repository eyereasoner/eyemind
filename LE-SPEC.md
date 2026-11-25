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

## Documents

A document is a sequence of sections. Each section starts with a header that
ends with `:`:

| Header | Section |
| --- | --- |
| `the templates are:`, `the predicates are:` | Templates, separated by full stops, and by commas at the end of a line or before a place. |
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
includes it, without `.le` if one likes. It is read once, and a chain of
includes stops at five. The command line reads included files; the library
reads them through `io.readFile` when `compileLe(inputs, io)` is given one.
Web addresses and Prolog resources (`.pl`) are not read.

Sentences end with a full stop followed by white space or the end of the file;
a sentence can span lines. `%` or `#` starts a comment through the end of the
line, and `/* ... */` is a block comment. Words are compared without case.

A token is a word (letters, digits and underscores, joined by hyphens or
apostrophes, as in `JE-201` and `don't`), a final `'s` as a word of its own, a
number (`42`, `3.14`, `1,000,000`), a date (`2021-10-09`), a quoted text
(`"..."` or `'...'`), or a punctuation sign. The indentation of a line counts a
space as one and a tab as four, as LE's editor shows it.

## Templates

A template is a sentence pattern: words and places. A place is a phrase between
asterisks, such as `*a person*`; LE1 also writes templates without asterisks,
and in a template without any, `a` or `an` and the word after it make a place.

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
| `; assumable`, `; unknown`, `; assumed`, `; judged`, `; open textured`, `; evaluative` | eyemind makes no assumptions: a sentence that is not stated or concluded is false. A negated assumable sentence is an error, because it would hold only as an assumption. |
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
  `cash at bank`.

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

An aggregate collects one value for every solution of its conditions, in the
order they are found, as Prolog's `findall` does: a value found twice counts
twice. The result phrase of an aggregate is the phrase before `is the`, after any
connective.

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
`and unknowns [...]` that lists unknowns, or with `and any unknowns`, rests on
assumptions and is not compared; `and unknowns []` is.
Each query is answered in each scenario, or once when the document has none.

## Compilation to LS

Facts and rules compile to LS facts and backward rules (`implied_by`), as LE's
Prolog target runs them; a ground fact is `fact(...)`, a fact with a variable a
backward rule with the body `'true'`.

When a document has scenarios, every relation gets the scenario as its first
argument, a scenario's clauses have the scenario's name there, and the
knowledge base's clauses have a variable there, bound by the facts
`'le:scenario'(NAME)`. A knowledge-base fact becomes a rule whose body is
`'le:scenario'(S)`. So the knowledge base holds in every scenario and a
scenario's facts in that one, and one program and one proof answer every query
in every scenario.

A query `NAME` compiles to a backward rule for `'le:answer'(NAME, S, V1, ...)`,
whose body starts with `'le:scenario'(S)` when there are scenarios, and the
statement `query('le:answer'(NAME, S, V1, ...))`. `V1, ...` are the variables of
the query outside negations and collections, in the order they appear.

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
compiled LS program, and check against it. That the program reads the English
as intended is a matter of the compiler and its tests; a checked proof
establishes the answers under the compiled rules.

## Not supported

These belong to Logical English 2, or to the Prolog that LE1 can embed, and
are errors: the template additions the table above leaves out,
`the functions are:`, `the fluents are:`, `the events are:` and the other
dynamic and meta sections, facts backgrounds, included web addresses and
Prolog resources, embedded `prolog` goals, numbered conditions, provenance
trailers and document locations, `it is unknown whether`,
`it must not be true that`, negated facts in scenarios, negated assumable
sentences (abduction), flip queries (`expects changes`), scenario headers with
provenance, `otherwise`, `unless`, `according to`, decision tables, services,
LPS and s(CASP). eyemind does not
check types: the head noun of a place is not a type constraint. A program whose
negation lies on a dependency cycle compiles, and the LS program is then
rejected unless it is chain-stratified (LS-SPEC Section 6.4), where Prolog would
run it.
