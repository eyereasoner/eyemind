# Controlled Mathematical English

eyemind reads `.me` files as the controlled language defined here and compiles
them to ordinary Logic Script (LS). This is an input extension; the meaning of
the compiled program is defined by the [LS specification](https://eyereasoner.github.io/eyemind/SPEC).
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

| ME form | LS term |
| --- | --- |
| `T is a class` | `class(T)` |
| `T is an class` | `class(T)` |
| `T is class` | `class(T)` |
| `T is a relation of U` | `relation(T, U)` |
| `T is an relation of U` | `relation(T, U)` |
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

| ME form | LS goal |
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
they do not produce the continuing RDF conflict reports of `--owl-rl`.

## Output, compilation and checking

ME inputs default to `.me` conclusions. Each answer becomes a sentence:

```text
Socrates is a mortal.
16 is a square of 4.
Alice is an owner of witness(rule 4, Y, Alice).
```

`witness(rule 4, Y, Alice)` names the witness for existential variable `Y` of
rule 4 with argument Alice. It reads back as `skolem(4, 'Y', ['Alice'])` in LS.
The label `Y` in this position is a name, independent of any declared ME
variable. A label outside the variable-name syntax is quoted. Additional
arguments follow as more comma-separated terms; a witness without arguments
is `witness(rule 4, Y)`. The rule number, label and arguments all contribute
to its identity. Ordinary compounds named witness retain their quoted spelling.

Unary and binary relations use the class and relation-of forms; relations with
more arguments use calls. Names are quoted when required to preserve their
meaning. Compound names are quoted. Variable answers use `For every X0 and X1,
...`, consistently renaming their variables while retaining sharing. A conjunctive
answer uses `and`. These sentences can be loaded as facts in another `.me`
program. An empty answer set is `# No conclusions.`. The writer rejects goals
outside these relational forms instead of silently changing their meaning.

```sh
eyemind examples/socrates-me.me
eyemind --program examples/socrates-me.me > /tmp/socrates-me.js
eyemind --to me /tmp/socrates-me.js
eyemind --proof examples/socrates-me.me > /tmp/socrates-me-proof.js
eyemind --check-proof /tmp/socrates-me-proof.js examples/socrates-me.me
```

Multiple `.me` files form one program in file order; they do not mix with other
input formats or the RDF logic switches. Standard input remains LS; `--to me`
can write supported LS conclusions as ME. `--goal` uses LS goal syntax and
defaults to LS output; add `--to me` for ME output. `--all` applies to RDF and N3
output, without changing ME's selected conclusions.

The compiler reads data without executing it and emits standalone `.js` LS
using explicit constructors to retain names and numeric types. Comments in the
compiled text identify the source file and sentence line. Parser errors name
that location. ME runs use LS's usual work bounds, which can be overridden by
the CLI. Existential or recursive rules can still have an infinite closure.

Proofs and check reports are `.js` documents and use the existing LS checker.
Checking establishes the compiled LS result. It does not independently validate
the English-to-LS translation; that contract is this grammar and its tests.

Supported sentences have no disjunctive conclusions, pronouns, implicit
assumptions, set comprehension, higher-order quantification or proof blocks.
Unsupported syntax is an error, with no approximate translation.
