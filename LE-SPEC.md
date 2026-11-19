# Logical English

eyemind reads `.le` files as the language defined here and compiles
them to ordinary Logic Script (LS). This is an input extension; the meaning of
the compiled program is defined by the [LS specification](https://eyereasoner.github.io/eyemind/LS-SPEC).
It supports statements and computations in a fixed grammar. It does not parse
arbitrary mathematical prose or check textbook proof arguments.

## Documents and names

A document is a sequence of sentences, each ending in `.`. Whitespace and line
breaks separate tokens; a sentence can span lines. `#` starts a comment through
the end of the line, except inside a quoted name. Examples separate their header
comments from the body and put an empty line before each body comment block.

Keywords are case-insensitive. Names are case-sensitive. Class and relation
names start with a lowercase ASCII letter, followed by ASCII letters, digits or
underscores. Names of LS primitives and controls are reserved as relation names.
There is no implicit vocabulary, pluralization, pronoun resolution or spelling
normalization. `integer`, for example, is a user-defined class whose facts supply
its members; it does not enumerate all mathematical integers.

An individual can be an unquoted name such as `Socrates` or `alice`. A variable
is one capital ASCII letter optionally followed by digits, such as `X` or `Y1`.
Variables must be declared in their sentence; a quoted `"X"` is an individual.
Names containing spaces, punctuation or non-ASCII characters use JSON double
quotes, as in `"René Descartes"`. JSON escapes retain their usual meanings.
Quote names that would introduce a sentence, such as `"Every"` or `"If"`.

Terms also include integers, floats, closed lists and compounds:

```text
9007199254740993
-0.0
[Alice, Bob, [1, 2]]
pair(Alice, Bob)
"a compound name"(Alice, 1)
```

Integers have optional leading `-`, no leading zero except `0`, and arbitrary
precision. A decimal point with digits on both sides, or an exponent, denotes a
finite binary64 float: `1.0`, `0.25`, `1e3`. Integers and floats remain distinct
terms. `1.` is integer `1` followed by the sentence terminator. Nonfinite numeric
tokens are rejected. A compound has at least one argument. A closed list may be
empty; there is no open-list surface syntax, although a `"."(Head, Tail)` compound
can retain an LS list with a nonempty tail as data. Term and expression
nesting is limited to 256 levels.

## Positive statements

The following forms have the indicated LS meanings. `T`, `U` and the arguments
stand for terms; `class` and `relation` stand for names as defined above.

| LE form | LS term |
| --- | --- |
| `T is a class` | `class(T)` |
| `T is an class` | `class(T)` |
| `T is class` | `class(T)` |
| `T is a relation of U` | `relation(T, U)` |
| `T is an relation of U` | `relation(T, U)` |
| `T has relation U` | `relation(T, U)` |
| `relation(T, U, ...)` | The corresponding compound goal. |
| `relation` | An atom used as a goal, with arity zero. |

The articles `a` and `an` have the same semantics. They do not introduce an
existential variable. For example, `Socrates is a human.` states
`fact(human('Socrates'))`. Write an existential declaration to introduce an
unnamed individual.

`and` joins positive statements. A sentence containing only positive statements
states them as facts. A universally quantified fact is explicit:

```text
Ada is a human and Ada is a mathematician.
For every X, matching(pair(X, X)).
```

Variables declared by `For every` are universal within that sentence. Each
sentence has its own scope. Repeating a declaration in one scope is an error.

## Rules and calculations

```text
Every human is mortal.
Every human is mortal and animal.
For every X and Y, if X is a parent of Y then X is an ancestor of Y.
If Alice is a person then Alice is a participant.
```

`Every A is B.` compiles to `implies(A(X), B(X))`, with a fresh clause-local
variable. An if/then sentence compiles its premises and conclusions to one
forward LS rule. Both sides may contain conjunctions. A conclusion variable
must be supplied by a premise or explicitly declared existentially. The
compiler checks the stated order of premises for calculations and absence tests;
actual values must also satisfy LS's runtime requirements.

These additional forms are available in premises and questions:

| LE form | LS goal |
| --- | --- |
| `Y is the value of E` | `is(Y, E)` |
| `X is greater than E` | `gt(X, E)` |
| `X is less than E` | `lt(X, E)` |
| `X is at least E` | `ge(X, E)` |
| `X is at most E` | `le(X, E)` |
| `X is equal to E` | `eq(X, E)` |
| `X is different from E` | `ne(X, E)` |

Expressions contain numbers, declared variables, parentheses, unary `-` and
binary `+`, `-`, `*`, `/`. Unary minus binds most tightly, then multiplication
and division, then addition and subtraction. Binary operators associate left.
They compile to `neg`, `add`, `sub`, `mul` and `div`. Only the value-of form
binds its left variable; comparisons require their inputs beforehand.

```text
4 is an integer.
For every X and Y, if X is an integer and Y is the value of X * X
then Y is a square of X.
```

Arithmetic follows LS: integer addition, subtraction and multiplication are
exact; division returns a float; mixed integer/float arithmetic returns a
float. Numeric equality compares values, while ordinary relation matching
keeps integer and float terms distinct. Calculations belong in premises,
followed by relational conclusions. These calculations do not prove arbitrary
algebraic identities or supply induction.

## Alternative premises

```text
Every cat or dog is a pet.
For every V, if V is registered or V is a provisionalVoter and V is verified
then V is an eligibleVoter.
For every X, it is impossible that X is a minor and X is a voter or X is barred.
```

`or` separates alternative premises of a rule or contradiction. `and` binds
more tightly, so each alternative is a conjunction; there are no parentheses
around alternatives. Each alternative compiles to its own LS clause with the
same conclusion, in the order written: `Every A or B is C.` is
`implies(A(X), C(X))` followed by `implies(B(X), C(X))`. The sentence's
declarations are shared, and an alternative need not use every declared
variable, but each conclusion variable must be supplied by every alternative
or introduced with `there exists`. An existential conclusion therefore has a
witness per alternative and firing. The order of premises is checked within
each alternative.

Questions have no `or`: ask one question per alternative, or ask for a relation
that an `or` rule derives. Conclusions are never disjunctive.

## Aggregates

```text
For every M and T,
if M is a member and T is the sum of F for every C and F such that charge(M, C, F)
then T is an amountDue of M.
For every V and N,
if V is a participant and N is the number of C such that choice(V, C) and N is at least 2
then V is a spoiledVoter.
For every C and N,
if C is a candidate and N is the number of V such that
(choice(V, C) and V is an eligibleVoter and it is not known that V is a spoiledVoter)
then N is a voteCount of C.
```

These premise forms collect every solution of a condition:

| LE form | Result |
| --- | --- |
| `N is the number of X1 and ... such that C` | The number of distinct combinations of `X1 ...` satisfying `C`. |
| `S is the sum of V for every X1 and ... such that C` | The sum of `V` over those combinations; `0` when there are none. |
| `M is the maximum of V for every X1 and ... such that C` | The greatest `V` over those combinations; no result when there are none. |
| `M is the minimum of V for every X1 and ... such that C` | The least `V` over those combinations; no result when there are none. |

The variables after `the number of` or `for every` are declared by the
aggregate, must be new in the sentence, and cannot be used after it. `V` must
be one of them. The condition `C` is one statement, or a conjunction in
parentheses; it can use calculations, comparisons and absence tests, but no
`or` and no other aggregate. Any other variable of `C` must be supplied by an earlier premise. The
left-hand side is a declared variable or a number, as in the value-of form:
an unbound variable receives the result and a bound one is compared with it.

Each distinct combination of the declared variables' values counts once, however
many derivations it has. To count distinct values of one variable when the
condition needs others, derive a relation of that variable first, as
`choice(V, C)` above does for ballots. Values are summed with LS arithmetic, so
integers stay exact and a float makes the sum a float; maximum and minimum
compare numerically.

An aggregate compiles to
`findall_sorted(t(V, X1, ...), C, L)`, followed by goals of backward helper
relations named `le:distinct`, `le:count`, `le:sum`, `le:max` and `le:min`,
which remove repeated tuples and fold the rest. The helpers are added after
the program's own clauses, only when used, so they do not change the rule
numbers of witnesses; their names cannot be written as LE names. Like a
negation, an aggregate waits until the relations of its condition are complete,
so a program cannot aggregate over a relation that depends on the aggregate's
own result. Questions cannot aggregate: derive the aggregate in a rule and ask
for its conclusion.

## Absence and existential conclusions

An absence test has exactly this form, followed by one positive statement:

```text
For every X, if X is a person and it is not known that X is blocked
then X is an applicant.
```

It compiles to `not(blocked(X))`. Its variables must be supplied by earlier
positive premises or calculations. LS stratification decides when the tested
relation is complete. This means absence of a proof in this program, rather
than classical mathematical negation. Ordinary `not` is rejected. Explicit
negative evidence can use its own positive relation, such as `not_human`.

```text
For every X, if X is a person then there exists Y such that
Y is a record and X is an owner of Y.
There exists X such that X is a record.
```

`there exists` introduces fresh variables for a conclusion, after any universal
declarations. Every introduced variable must occur in that conclusion. The
compiler uses an ordinary LS forward rule with head-only variables; a standalone
existential sentence uses premise `'true'`. LS supplies Skolem witnesses. The
same variable shares one witness across the heads of that firing. A witness
does not assert a distinct real-world object or a minimum number of objects.

## Questions and contradictions

```text
Find every X such that X is mortal.
Find every X and Y such that X is an ancestor of Y.
Find whether Socrates is mortal.
For every X, it is impossible that X is a person and X is blocked.
It is impossible that Alice is blocked.
Contradiction.
```

Questions compile to `query(...)`; their declarations establish variable scope,
and the answers are instances of the whole question, without a separate
projection. `Find whether` introduces no variables. A question can use a
conjunction, calculations and absence tests. Without questions the run reports
derived conclusions, following LS's default; given facts alone are not printed.

`It is impossible that` compiles to an LS contradiction with the stated body.
`Contradiction.` is an unconditional contradiction, also used to serialize a
run's `'false'` conclusion. Contradictions halt reasoning with exit code 65;
they do not produce the continuing RDF conflict reports of `--owl2rl`.

## Examples combining features

These programs use the grammar above without additional syntax:

| Example | What it demonstrates |
| --- | --- |
| [Shortest paths](https://eyereasoner.github.io/eyemind/examples/deck/shortest-path-le) | Bounded recursive histories, exact costs and minimum selection by absence, retaining ties. |
| [River crossing](https://eyereasoner.github.io/eyemind/examples/deck/river-crossing-le) | Compound states, repeated-variable matching, safety constraints and complete plans within a bound. |
| [Pell equations](https://eyereasoner.github.io/eyemind/examples/deck/pell-equation-le) | Recursive arithmetic beyond binary64 integer precision and exact polynomial checks. |
| [Course certificates](https://eyereasoner.github.io/eyemind/examples/deck/course-certificates-le) | Recursive requirements, absence of a counterexample, shared existential witnesses and witnesses containing earlier witnesses. |
| [Symbolic differentiation](https://eyereasoner.github.io/eyemind/examples/deck/symbolic-derivative-le) | Structural recursion over expression trees, constructed derivatives and evaluation at separate points. |
| [British citizenship](https://eyereasoner.github.io/eyemind/examples/deck/british-citizenship-le) | Section 1 of the British Nationality Act 1981: alternative premises, a presumption that holds unless the contrary is shown, date comparisons and citizenship through a derived parent. |
| [Library fines](https://eyereasoner.github.io/eyemind/examples/deck/library-fines-le) | Charges from alternative rules, then the sum, number and maximum per member over distinct combinations. |
| [Election tally](https://eyereasoner.github.io/eyemind/examples/deck/election-tally-le) | Eligibility by alternatives, distinct choices, an absence test inside a count, winners by maximum with ties, and a quorum. |

Their decks state the modeled assumptions and what the checked proofs establish.
Bounds and finite expression domains are explicit in the programs.

## ODRL snapshots

An LE file can explicitly select the existing ODRL snapshot evaluator:

```text
Use ODRL snapshot logic with namespace "https://example.org/handicap-card#".

evaluation is an evaluation.
evaluation has policy eligibility.
evaluation has request issueAlice.
evaluation has conflictStrategy prohibit.
```

This directive must be the first sentence of one file. The remainder contains
ground facts using the snapshot vocabulary, without rules or questions. The
compiler maps those facts to RDF and includes the validation, evaluation and
reporting LS of `src/odrl.js`. The same
[snapshot profile](https://eyereasoner.github.io/eyemind/#odrl-snapshots) applies
to Turtle and LE, including missing observations, unsupported policy features
and conflict strategies. Vocabulary by itself does not enable evaluation.

Names expand as follows, with case preserved:

| LE form or name | RDF mapping |
| --- | --- |
| An ordinary individual name | An IRI formed by appending it to the declared namespace. |
| Classes `evaluation`, `request`, `state` | `eval:Evaluation`, `eval:Request`, `eval:State`. |
| Classes `policy`, `agreement`, `permission`, `prohibition`, `constraint`, `action` | `odrl:Set`, `odrl:Agreement`, `odrl:Permission`, `odrl:Prohibition`, `odrl:Constraint`, `odrl:Action`. |
| Classes `assetCollection`, `partyCollection` | ODRL collection classes, rejected by the snapshot profile. |
| Properties `policy`, `request`, `state`, `subject`, `conflictStrategy` | The corresponding `eval:` properties. |
| Properties `profile`, `permission`, `prohibition`, `assignee`, `assigner`, `action`, `target`, `constraint`, `leftOperand`, `operator`, `rightOperand` | The corresponding `odrl:` properties. |
| Property `policyConflict` | `odrl:conflict`, the policy-local strategy. |
| Property `type` | `rdf:type`. |
| An otherwise unknown class or property | An IRI in the declared namespace; validation still applies. |
| Values `snapshotProfile`, `perm`, `prohibit`, `invalid`, `eq`, `neq`, `gt`, `gteq`, `lt`, `lteq` | `eval:SnapshotProfile` or the corresponding ODRL strategy/operator IRIs. |
| Values `true`, `false` | Boolean RDF literals. Quoting does not change an LE name into an RDF string literal. |
| An integer or float | An exact RDF integer or an `xsd:double` literal. |

The unsupported ODRL properties `duty`, `obligation`, `inheritFrom`, `includedIn`,
`partOf` and `refinement` retain their ODRL IRIs so the shared validator can
report them. Explicit RDF values such as `iri("https://example.org/item")` and
`literal("text", datatype("http://www.w3.org/2001/XMLSchema#string"))` retain
their terms. `rdf(S, P, O)` facts allow any explicit RDF predicate without an
abbreviation. A snapshot still has one default graph.

The [handicap-card LE example](https://eyereasoner.github.io/eyemind/examples/deck/handicap-card-le)
contains the complete policies, requests and SOTW. Run it without CLI switches:

```sh
eyemind examples/handicap-card-le.le
eyemind --program examples/handicap-card-le.le > /tmp/handicap-card-le.js
eyemind --to turtle /tmp/handicap-card-le.js
```

Its default output is an LE report whose first sentence is
`Use ODRL vocabulary with namespace "https://example.org/handicap-card#".`.
That directive reads RDF data without evaluating policies. This makes the report
readable as input again, preserving every RDF fact and witness. Report properties
use `has`; for example `issueAlice has decision allowed.`. Status values
`allowed`, `prohibited`, `notApplicable`, `undetermined`, `valid` and
`invalidReport` name the corresponding `eval:` IRIs. Report classes include
`evaluationReport`, `conflict`, `validationError` and `uncertainty`.
`conflict` as a property means `eval:conflict`; `applicablePermission`,
`applicableProhibition` and `reportConstraint` distinguish the report's
`eval:permission`, `eval:prohibition` and `eval:constraint` links from ODRL
input properties. Other report fields retain their `eval:` names. An IRI with
no unambiguous abbreviation stays explicit, including IRIs inside witness keys.

Both ODRL directives take a single LE file and reject mixed-in ordinary LE
rules or questions. `--goal` can query their compiled LS program. The normal
`--odrl` switch continues to select the Turtle snapshot compiler.

## Output, compilation and checking

LE inputs default to `.le` conclusions. Each answer becomes a sentence:

```text
Socrates is a mortal.
16 is a square of 4.
Alice is an owner of witness(rule 4, Y, Alice).
```

`witness(rule 4, Y, Alice)` names the witness for existential variable `Y` of
rule 4 with argument Alice. It reads back as `skolem(4, 'Y', ['Alice'])` in LS.
The label `Y` in this position is a name, independent of any declared LE
variable. A label outside the variable-name syntax is quoted. Additional
arguments follow as more comma-separated terms; a witness without arguments
is `witness(rule 4, Y)`. The rule number, label and arguments all contribute
to its identity. Ordinary compounds named witness retain their quoted spelling.

Unary and binary relations use the class and relation-of forms; relations with
more arguments use calls. Names are quoted when required to preserve their
meaning. Compound names are quoted. Variable answers use `For every X0 and X1,
...`, consistently renaming their variables while retaining sharing. A conjunctive
answer uses `and`. These sentences can be loaded as facts in another `.le`
program. An empty answer set is `# No conclusions.`. The writer rejects goals
outside these relational forms instead of silently changing their meaning.

```sh
eyemind examples/socrates-le.le
eyemind --program examples/socrates-le.le > /tmp/socrates-le.js
eyemind --to le /tmp/socrates-le.js
eyemind --proof examples/socrates-le.le > /tmp/socrates-le-proof.js
eyemind --check-proof /tmp/socrates-le-proof.js examples/socrates-le.le
```

Multiple `.le` files form one program in file order; they do not mix with other
input formats or the RDF logic switches. Standard input remains LS; `--to le`
can write supported LS conclusions as LE. `--goal` uses LS goal syntax and
defaults to LS output; add `--to le` for LE output. `--all` applies to RDF and N3
output, without changing LE's selected conclusions.

The compiler reads data without executing it and emits standalone `.js` LS
using explicit constructors to retain names and numeric types. Comments in the
compiled text identify the source file and sentence line. Parser errors name
that location. LE runs use LS's usual work bounds, which can be overridden by
the CLI. Existential or recursive rules can still have an infinite closure.

Proofs and check reports are `.js` documents and use the existing LS checker.
Checking establishes the compiled LS result. It does not independently validate
the English-to-LS translation; that contract is this grammar and its tests.

Supported sentences have no disjunctive conclusions, pronouns, implicit
assumptions, set comprehension, higher-order quantification or proof blocks.
Unsupported syntax is an error, with no approximate translation.
