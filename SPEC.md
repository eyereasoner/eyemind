# <img src="assets/eye.png" alt="" width="48" height="48" align="absmiddle"> eyemind specification

```text
Title:      The eyemind Rule Language and Proof Format
Version:    eyemind 0.5.23
```

This document specifies the syntax and meaning of eyemind programs and data
documents, their observable evaluation, and the conditions for checking a
proof.

## Table of Contents

- [1. Scope and Conventions](#1-scope-and-conventions)
  - [1.1 Scope](#11-scope)
  - [1.2 Requirements and notation](#12-requirements-and-notation)
  - [1.3 Terminology](#13-terminology)
- [2. Terms](#2-terms)
  - [2.1 Kinds of terms](#21-kinds-of-terms)
  - [2.2 Lists](#22-lists)
  - [2.3 Identity and unification](#23-identity-and-unification)
  - [2.4 Standard order](#24-standard-order)
- [3. Program Syntax](#3-program-syntax)
  - [3.1 Scripts](#31-scripts)
  - [3.2 Names](#32-names)
  - [3.3 Term construction](#33-term-construction)
  - [3.4 Statements](#34-statements)
  - [3.5 Clause constraints and numbering](#35-clause-constraints-and-numbering)
- [4. Goals and Primitives](#4-goals-and-primitives)
  - [4.1 Goal syntax](#41-goal-syntax)
  - [4.2 Controls](#42-controls)
  - [4.3 Primitives](#43-primitives)
- [5. Arithmetic](#5-arithmetic)
  - [5.1 Expressions](#51-expressions)
  - [5.2 Functions and arities](#52-functions-and-arities)
  - [5.3 Numeric results](#53-numeric-results)
  - [5.4 Arithmetic errors and limits](#54-arithmetic-errors-and-limits)
- [6. Rule Structure](#6-rule-structure)
  - [6.1 Dependencies and stratification](#61-dependencies-and-stratification)
  - [6.2 Inline rule templates](#62-inline-rule-templates)
  - [6.3 Source rule inspection](#63-source-rule-inspection)
  - [6.4 Chain stratification](#64-chain-stratification)
- [7. Semantics](#7-semantics)
  - [7.1 Herbrand interpretation](#71-herbrand-interpretation)
  - [7.2 Variables and witnesses](#72-variables-and-witnesses)
  - [7.3 Positive least model](#73-positive-least-model)
  - [7.4 Negation and collection](#74-negation-and-collection)
  - [7.5 Sets and operational behavior](#75-sets-and-operational-behavior)
  - [7.6 Termination and proof claims](#76-termination-and-proof-claims)
- [8. Evaluation and Conclusions](#8-evaluation-and-conclusions)
  - [8.1 Goal search](#81-goal-search)
  - [8.2 Forward evaluation and witnesses](#82-forward-evaluation-and-witnesses)
  - [8.3 Resource bounds](#83-resource-bounds)
  - [8.4 External goals](#84-external-goals)
  - [8.5 Contradictions](#85-contradictions)
  - [8.6 Reported conclusions](#86-reported-conclusions)
  - [8.7 Proof generation](#87-proof-generation)
- [9. Document Syntax and Canonical Text](#9-document-syntax-and-canonical-text)
  - [9.1 Accepted document syntax](#91-accepted-document-syntax)
  - [9.2 Canonical atoms, numbers, variables and lists](#92-canonical-atoms-numbers-variables-and-lists)
  - [9.3 Canonical compounds](#93-canonical-compounds)
  - [9.4 Variable scope in output](#94-variable-scope-in-output)
- [10. Proof Documents](#10-proof-documents)
  - [10.1 Structure](#101-structure)
  - [10.2 Clause displays](#102-clause-displays)
  - [10.3 Steps](#103-steps)
  - [10.4 Search certificates](#104-search-certificates)
  - [10.5 Call-fidelity certificates](#105-call-fidelity-certificates)
- [11. Proof Checking](#11-proof-checking)
  - [11.1 Scope of a valid proof](#111-scope-of-a-valid-proof)
  - [11.2 Operational query fidelity](#112-operational-query-fidelity)
  - [11.3 Reading the document](#113-reading-the-document)
  - [11.4 C1 Resolution](#114-c1-resolution)
  - [11.5 C2 Well-foundedness](#115-c2-well-foundedness)
  - [11.6 C3 Justification](#116-c3-justification)
  - [11.7 C4 Coverage](#117-c4-coverage)
  - [11.8 C5 Re-decision](#118-c5-re-decision)
  - [11.9 C6 Boundary consistency](#119-c6-boundary-consistency)
  - [11.10 C7 Relevance](#1110-c7-relevance)
  - [11.11 C8 Witness integrity](#1111-c8-witness-integrity)
  - [11.12 C9 Search closure](#1112-c9-search-closure)
  - [11.13 C10 Call fidelity](#1113-c10-call-fidelity)
  - [11.14 Counts and validity](#1114-counts-and-validity)
- [12. Check Reports](#12-check-reports)
  - [12.1 JSON form](#121-json-form)
- [13. Command-Line Interface](#13-command-line-interface)
  - [13.1 Invocation and options](#131-invocation-and-options)
  - [13.2 Unused clauses](#132-unused-clauses)
- [14. Conformance](#14-conformance)
  - [14.1 Conformance test suite](#141-conformance-test-suite)
- [15. Security](#15-security)
- [Appendix A. Document Grammar](#appendix-a-document-grammar)
- [Appendix B. Example](#appendix-b-example)

---

## 1. Scope and Conventions

### 1.1 Scope

This specification defines eyemind's terms, program syntax, semantics,
evaluation, document formats, proof checking and command-line interface.
Programs are JavaScript scripts. Conclusions, proofs and check reports are
data documents whose expressions MUST be read without execution.

The JavaScript library API, browser interface, installation and release
procedures are outside this specification. [Section 1.3](#13-terminology) defines the terms
used throughout.

### 1.2 Requirements and notation

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY" and "OPTIONAL" are to be
interpreted as described in BCP 14 (RFC 2119, RFC 8174) when they appear in
all capitals.

In syntax descriptions, `T` denotes a term, `G` a goal, `Body` a premise and
`Head` a conclusion. Subscripts distinguish arguments; `T1, ..., Tn` means
comma-separated arguments, not a literal ellipsis. The token `...` is literal
only in list-tail syntax such as `[Head, ...Tail]`. Code blocks marked `js`
show actual syntax. `name/arity` identifies a predicate or constructor by
its name and number of arguments.

### 1.3 Terminology

These terms are used throughout. Each entry names the section that defines
it fully; where an entry and that section differ, the section governs.

Terms and matching:

- **Term**: an atom, a number, a variable or a compound ([Section 2.1](#21-kinds-of-terms)).
- **Substitution**: an assignment of terms to variables.
- **Instance**: the result of applying a substitution to a term or clause.
- **Ground**: containing no variable.
- **Identical**: equal by canonical text, with each variable identical only
  to itself.
- **Renamed apart**: with fresh variables, preserving all sharing within
  the renamed terms and avoiding capture of other variables.
- **Anonymous variable**: an occurrence of `_`, or a variable named `_`
  followed by digits; inside a negation it stands for any value (Sections
  [3.3](#33-term-construction) and [4.2](#42-controls)).
- **Canonical text**: the one spelling a writer gives a term (Sections [9.2](#92-canonical-atoms-numbers-variables-and-lists)
  and [9.3](#93-canonical-compounds)).
- **Document**: a sequence of expressions in the data syntax of [Section 9](#9-document-syntax-and-canonical-text),
  read without executing it.

Programs:

- **Clause**: a fact, a forward rule or a backward rule, numbered from 1 in
  statement order ([Section 3.5](#35-clause-constraints-and-numbering)). `fact`, `implies` and `implied_by` state
  them ([Section 3.4](#34-statements)); a query is a forward rule with the head `'true'`, and a
  contradiction one with the head `'false'`.
- **Head** and **body**: the conclusions of a clause, and its premises.
- **Goal**: an atom, a compound, a variable bound to one of them, or a
  conjunction of goals, to be solved ([Section 4.1](#41-goal-syntax)).
- **Control**: `and`, `or`, `not`, `call`, `once` or `findall` ([Section 4.2](#42-controls)).
  A **negation** is a `not(G)` goal and a **collection** a
  `findall(T, G, L)` goal.
- **Primitive**: a built-in goal such as `is` or `atom_concat` ([Section 4.3](#43-primitives)).
- **Rank** and **stratum**: a clause's rank is at least that of every
  clause it depends on, and above that of every clause a negation or
  collection in its body depends on; a stratum is the forward rules of one
  rank ([Section 6.1](#61-dependencies-and-stratification)).
- **Rule template**: a rule written in a forward rule's conclusion; that
  forward rule is its **generator** ([Section 6.2](#62-inline-rule-templates)).
- **Captured variable**: a template variable that also occurs in its
  generator's body or ordinary heads ([Section 6.2](#62-inline-rule-templates)).
- **Appended clause**: the clause compiled from a template, numbered after
  the stated clauses ([Section 6.2](#62-inline-rule-templates)).
- **Rule instance**: an appended clause with its captured variables bound by
  one solution of its generator ([Section 6.2](#62-inline-rule-templates)).
- **Source inspection**: an `implies` or `implied_by` goal, which matches the
  program's own rules as data ([Section 6.3](#63-source-rule-inspection)).

Runs:

- **Run**: one evaluation of a program: forward reasoning, then any goals
  ([Section 8](#8-evaluation-and-conclusions)).
- **Derived fact**: a fact a forward rule adds during a run ([Section 8.2](#82-forward-evaluation-and-witnesses)).
- **Firing**: one solution of a forward rule's body, with the instance of
  its heads it gives ([Section 8.2](#82-forward-evaluation-and-witnesses)).
- **Witness** or **Skolem term**: the term `skolem(Rule, Variable,
  Arguments)` a firing gives a head variable its body leaves unbound
  (Sections [7.2](#72-variables-and-witnesses) and [8.2](#82-forward-evaluation-and-witnesses)).
- **External goal**: a goal given to a run from outside the program
  ([Section 8.4](#84-external-goals)).
- **Halt**: the end of a run that concludes `'false'`, with halt code 65
  ([Section 8.5](#85-contradictions)).
- **Conclusion**: a term reported by a run ([Section 8.6](#86-reported-conclusions)).
- **Reasoner**: a processor that evaluates programs and checks its generated
  proofs before returning them ([Section 8.7](#87-proof-generation)).
- **Checker**: a processor that verifies proof documents against a supplied
  program, without using reasoning to fill missing derivations ([Section 11](#11-proof-checking)).

Proofs:

- **Proof document**: a document recording how a run's conclusions follow
  from the program ([Section 10](#10-proof-documents)). Its **claims** are its statements other
  than `clause/2`, `step/4`, `searched/2`, `derived/2` and `called/2`
  ([Section 10.1](#101-structure)).
- **Clause display**: `clause(N, Display)`, clause `N` in normalized form
  ([Section 10.2](#102-clause-displays)).
- **Step**: `step(Goal, By, Bindings, Uses)`, the justification of one goal
  by a clause, a primitive, a control, an absence or a collection; its
  **uses** are the goals that justify it ([Section 10.3](#103-steps)).
- **Boundary**: a negation or collection that a proof justifies by an
  `'absent'` or `'collected'` step ([Section 11.9](#119-c6-boundary-consistency)).
- **Search certificate**: the tables and listings that record the searches
  behind a proof's boundaries ([Section 10.4](#104-search-certificates)).
- **Table**: `searched(Call, Answers)`, every answer of one call, in order
  ([Section 10.4](#104-search-certificates)).
- **Listing**: `derived(Pattern, Facts)`, every fact a run derived for one
  relation, in order ([Section 10.4](#104-search-certificates)).
- **Call table**: `called(Call, Answers)`, a table of a call made while
  answering an original question, kept apart from the tables of the search
  certificate and checked by C10 ([Section 10.5](#105-call-fidelity-certificates)).
- **Original question**: each external goal; without external goals, the
  body of each query; without queries, each ordinary forward head. C10
  checks that the claims are exactly their answers ([Section 11.13](#1113-c10-call-fidelity)).
- **Answer completeness**: of a proof, that its claims include every answer
  of every original question; an unconditional `checked` verdict
  establishes it ([Section 11.1](#111-scope-of-a-valid-proof)).
- **Settled**: established by its search certificate, as a boundary is when
  C9 accepts that certificate ([Section 11.12](#1112-c9-search-closure)).
- **Trusted boundary**: a boundary that is not settled. A valid proof
  assumes it, and its check report lists it as an **obligation**, as it
  lists each claim whose call fidelity and each question whose answer
  completeness remains unproved (Sections [11.9](#119-c6-boundary-consistency),
  [11.13](#1113-c10-call-fidelity) and [12](#12-check-reports)).
- **Check report**: what a checker writes: the claims, the outcome of each
  of C1–C10, failures, obligations, counts and a verdict ([Section 12](#12-check-reports)).
- **Valid**: of a proof, failing no condition; a valid proof with
  obligations is valid conditional on them ([Section 11.14](#1114-counts-and-validity)).

## 2. Terms

### 2.1 Kinds of terms

A term is one of the following. The examples use document syntax; program
construction is defined separately in [Section 3.3](#33-term-construction).

| Kind | Meaning | Examples |
| --- | --- | --- |
| Atom | Character text. | `'socrates'`, `'human'` |
| Integer | An exact integer of unbounded size. | `42`, `-7` |
| Float | A finite IEEE-754 binary64 value. | `0.5`, `2.0`, `1e+22` |
| Variable | A named logical variable. | `X`, `_Rest` |
| Compound | An atom naming a constructor and one or more argument terms. | `parent('alice', 'bob')` |

An atom used as a predicate has arity 0. A compound's name and arity identify
its constructor. Integers and floats are distinct: `1` and `1.0` MUST NOT
unify. Booleans, `null`, `undefined`, infinities and NaN are not terms.
Nonfinite numeric values MUST be rejected.

### 2.2 Lists

Lists use bracket syntax:

| Form | Meaning |
| --- | --- |
| `[]` | Empty list. |
| `[T1, ..., Tn]` | List of `n` elements, for `n >= 1`. |
| `[Head, ...Tail]` | One element followed by a tail. The comma before `...` is required. |
| `[T1, ..., Tn, ...Tail]` | Several elements followed by a tail. |

For example, `[1, 2]` and `[1, ...[2]]` denote the same list. A **proper
list** ends in `[]`. A tail left as a variable gives an **open list**;
a non-list tail gives an **improper list**. Only the final item may be a
spread tail; a program that spreads a logical variable or compound before
the last item, as in `[...T, 1]`, MUST raise an error. In document syntax, `[...Tail]` denotes `Tail` itself.
Program spread expressions also follow [Section 3.3](#33-term-construction).

The empty list is the atom whose text is `[]`, so `'[]'` denotes the same
term. A non-empty list has the compound structure exposed by `functor` and
`univ`: name `'.'`, arity 2, and arguments head and tail. This describes
term structure, not an alternative written list syntax. A character list
contains one-character atoms.

A non-empty proper list in a goal position denotes conjunction instead
([Section 4.1](#41-goal-syntax)). A list inside an ordinary argument remains list data.

### 2.3 Identity and unification

Unification is syntactic matching on finite trees. It MUST apply the occurs
check: binding a variable to a term containing that variable fails. Atoms
unify when their texts are equal; numbers when they have the same kind and
value; compounds when their names and arities agree and their arguments
unify pairwise. Lists unify by their heads and tails.

The floats `0.0` and `-0.0` unify and compare equal, but their canonical
texts differ, so they are not identical. This distinction also applies
inside compounds and lists. Asserting a relation between two terms does not
make the terms identical.

### 2.4 Standard order

Terms are totally ordered: variables, numbers, atoms, then compounds.
Numbers are ordered by value, compared exactly across integers and floats;
a float precedes an integer of equal value. Atoms are ordered by Unicode
code point. Compounds are ordered by arity, then name, then arguments from
left to right. Lists follow their compound structure ([Section 2.2](#22-lists)).

Variables are ordered by the code points of their names. Fresh variables
introduced by renaming apart have unspecified names, so programs SHOULD NOT
depend on their relative order. A lone UTF-16 surrogate is ordered by its
own code point; a valid surrogate pair denotes one supplementary code point.

## 3. Program Syntax

### 3.1 Scripts

A program consists of one or more non-strict JavaScript scripts. Each script
may use JavaScript declarations, expressions, functions and control flow to
construct its clauses. No import is required for the statements and term
constructors defined here. Clauses are stated in the order their statement
calls occur; multiple input scripts are processed in input order. Each
script runs in a scope of its own: a name one script declares is, in
another script, resolved as [Section 3.2](#32-names) specifies, so scripts share no
declarations.

The supplied names are the statements of [Section 3.4](#34-statements), `forward`, `backward`,
`preds`, `vars`, `struct`, the controls and primitives of [Section 4](#4-goals-and-primitives), the
atom `fail`, and the library name `eyemind`. Library operations are outside
this specification. Other names are resolved as [Section 3.2](#32-names) specifies.

### 3.2 Names

A name a script does not declare or assign is resolved as follows:

1. a supplied name ([Section 3.1](#31-scripts)) has that meaning;
2. the JavaScript globals `Math`, `JSON`, `BigInt`, `Infinity`, `NaN`,
   `undefined`, `console`, `globalThis`, `parseInt`, `parseFloat`, `isNaN`
   and `isFinite` keep their meaning;
3. any other name beginning with an ASCII uppercase letter or `_` is the variable of
   that name, so that `Date`, `Map` or `Object` are variables as logic
   programs name them (`globalThis.Date` still reaches the global);
4. any other name is the predicate of that name: calling it with arguments
   builds the compound with that name, calling it without arguments or using
   it uncalled stands for the atom of that name.

A program MAY name predicates and variables explicitly, which it MUST do for
a predicate named like a name of rules 1 or 2 or a variable whose name begins
with a lowercase letter: `const [p, q] = preds('p q')` and
`const [X, Y] = vars('X Y')`, where one name gives the predicate or variable
itself rather than an array.

`preds` and `vars` take a string of names separated by spaces or commas.
Each name MUST be an ASCII identifier and MUST NOT be a reserved JavaScript
word. `preds` MUST also reject control and primitive names and the reserved
names `step`, `clause`, `activated`, `forward`, `backward`, `struct`,
`implies` and `implied_by`.

A top-level expression statement that calls a predicate supplied by rule 4,
such as a misspelled `fcat(p(1))`, states nothing; a loader MUST report it as
an error rather than ignore it. Only statements at the top level of a script
are checked: inside a function or a block, such a call builds a term the
script discards, and a loader MAY accept it.

### 3.3 Term construction

Program expressions construct terms as follows. This is distinct from
reading a data document ([Section 9.1](#91-accepted-document-syntax)).

| Program expression | Term constructed |
| --- | --- |
| A JavaScript string, such as `'alice'` | Atom. |
| A `BigInt` literal, such as `42n` | Exact integer. |
| An integral finite number, such as `2` or `2.0` | Integer. |
| A non-integral finite number, such as `0.5` | Float. |
| `float(N)`, where `N` is a finite JavaScript number | Float, including an integral value or signed zero. |
| An implicit variable name, such as `X` | Variable ([Section 3.2](#32-names)). |
| `p(T1, ..., Tn)`, with `n >= 1` | Compound named `p`, when `p` is a predicate constructor. |
| `p` or `p()` | Atom `p`, when `p` is a predicate constructor. |
| `struct(Name, T1, ..., Tn)` | Compound with the atom name `Name`; `struct(Name)` gives the atom. |
| `[]`, `[T1, ..., Tn]`, `[Head, ...Tail]` | Lists ([Section 2.2](#22-lists)). |

Thus `2.0` in a program is an integer; use `float(2)` for the float `2.0`.
Applied to anything other than a JavaScript number, such as a `BigInt`, a
string or a variable, `float(...)` is the ordinary compound `float/1`, the
arithmetic function of [Section 5.2](#52-functions-and-arities): `is(Y, float(2n))` binds `Y` to `2.0`.
Use a `BigInt` literal for an integer outside JavaScript's exact number
range, for example `9007199254740993n`. Numeric expressions are evaluated by
JavaScript before conversion to terms.

The first argument of `struct` MUST be a JavaScript string.

In `[Head, ...Tail]`, a logical variable or compound used as `Tail` supplies
the tail term, and a JavaScript array supplies its elements. Spreading a
JavaScript string uses JavaScript's character iteration; it does not supply
an atom tail. To construct an arbitrary atom or numeric tail in a program,
use `struct('.', Head, Tail)`. Documents use the bracket-tail syntax for any
tail term without executing a JavaScript spread.

Each occurrence of `_` in a clause is a distinct anonymous variable.
Anonymous occurrences are named `_0`, `_1`, ... in textual order, skipping
names already used in the clause. Clause displays and proof bindings use
these names. Programs SHOULD NOT give their own variables names consisting
of `_` followed by digits, which negation treats as anonymous.

Operators do not construct logical terms. An operator applied to a variable,
compound or predicate constructor, such as `X + 1` or `X > 1`, MUST raise
an error identifying the term form to write: `add(X, 1)` or `gt(X, 1)`.
Operators on ordinary JavaScript values keep their JavaScript meaning and
are evaluated by JavaScript before any term exists: `3 + 4` reaches the
implementation as the number 7, and `1 < 2` as a boolean, which is not a
term. Such a result is converted by the rules above like any other
number, so JavaScript arithmetic can lose integer precision, as in
`2 ** 60 + 1`, or the distinction between integers and floats, as in
`0.5 + 0.5`, which gives the integer 1. Programs SHOULD compute with `is`
and the arithmetic functions of [Section 5](#5-arithmetic), such as `is(Y, add(3, 4))`.

### 3.4 Statements

The basic statement forms are:

| Form | Meaning |
| --- | --- |
| `fact(T)` | State one fact with head `T` and no body. |
| `implies(Body, Head)` | State a forward rule. `Body` is a goal or a non-empty array of goals; `Head` is one head or a non-empty array of heads. |
| `implied_by(Head, Body)` | State a backward rule with one head. `Body` is a goal or a non-empty array of goals. |
| `restricted(Body, Head)` | State a restricted forward rule: as `implies`, but a firing whose heads some known values already satisfy is not applied ([Section 7.2](#72-variables-and-witnesses)). |
| `query(G)` | Report the successful instances of `G`. An array denotes one conjunction. |
| `contradiction(G)` | Halt with conclusion `'false'` when `G` succeeds. An array denotes one conjunction. |
| `facts_from(Path)` | Read a document from a path and state one fact per expression. |
| `facts_from({text: Text})` | Read a document from a string and state one fact per expression. |

`implies`, `implied_by` and `restricted` require exactly two arguments. The variadic forms
of `fact`, `query` and `contradiction` are also defined:

```js
fact(p('a'), p('b'))      // Two facts: fact(p('a')); fact(p('b')).
query(p(X), q(X))         // One query: query([p(X), q(X)]).
contradiction(p(X), q(X)) // One conjunction that triggers a contradiction.
```

`fact(T1, ..., Tn)` states `n` independent facts in argument order;
`fact()` states none. `query(G1, ..., Gn)` and
`contradiction(G1, ..., Gn)` require `n >= 1` and form one conjunctive body,
not separate queries or contradictions. `query()` and `contradiction()`
MUST be rejected. For example:

```js
fact(parent('alice', 'bob'))
fact(parent('bob', 'carol'))
implies([parent(X, Y), parent(Y, Z)], grandparent(X, Z))
query(grandparent(X, Z))
```

Queries are forward rules with head `'true'`; contradictions are forward
rules with head `'false'`. Their reporting and halting behavior is defined
in [Section 8](#8-evaluation-and-conclusions). `implies` and `implied_by` also return rule values. A value
embedded in another statement contributes a template or inspection pattern
as [Section 6](#6-rule-structure) specifies, instead of a separate clause.

`facts_from` input MUST be read using [Section 9.1](#91-accepted-document-syntax) and MUST NOT be executed.
It only states facts. A path requires file access; a text string does not.

### 3.5 Clause constraints and numbering

After embedded rule calls have been excluded ([Section 6.2](#62-inline-rule-templates)), clauses are
numbered from 1 in statement order. A multi-argument `fact` contributes one
numbered clause per argument. Each clause records the source line where its
statement call begins; facts read by `facts_from` use that call's line.

A clause MUST be rejected when:

- a head is not an atom or compound, or is a list, the atom `'[]'` or a
  `'.'/2` compound, which as a goal would be a conjunction ([Section 4.1](#41-goal-syntax)) and
  could never call the clause;
- a head uses `step/4`, `clause/2`, `searched/2`, `derived/2`, `called/2`, reserved
  for proof documents, or explicitly states the reserved predicate
  `activated/2`;
- a head is a primitive or control, except the head `'true'` of a query or
  `'false'` of a contradiction; `implies` MUST NOT conclude either atom;
- a body goal is neither a variable, atom nor compound, or is an empty or
  non-proper list in a goal position.

Conjunctive bodies are flattened to their ordered goals. Conjunctive forward
heads retain their order. Only a forward rule may have several heads;
backward templates with several heads are expanded as [Section 6.2](#62-inline-rule-templates) defines.
Reserved template and inspection forms are permitted only in the positions
specified in [Section 6](#6-rule-structure).

## 4. Goals and Primitives

### 4.1 Goal syntax

A goal is an atom, a compound, a variable to be bound to a callable term,
or a non-empty proper array of goals denoting their conjunction. A number,
an empty array or an open or improper list is not a goal. An array of one
goal denotes that goal: `[p(X)]` is `p(X)`. Arrays of several goals denote
the left-nested `and` chain, also in goal text, so the goal text
`once([p(X), q(X)])` is answered as `once(and(p(1), q(1)))`.

A variable called as a goal MUST be bound when it runs: an unbound variable,
or one bound to a number, MUST raise an error. A variable bound to an atom or
compound calls that term as it is; a list bound at run time is the compound
`'.'/2`, not a conjunction, and so has no solution.

Array-to-conjunction notation applies in these positions:

- a rule body and each argument of `query` or `contradiction`;
- each argument of `and`, `or`, `not`, `call` and `once`;
- the second argument of `findall`;
- both arguments of a rule template or source inspection pattern.

It also applies to a forward head, where the conjunction means several
conclusions. Elsewhere an array denotes list data. For example:

```js
query([p(X), q(X)])         // Conjunction of two goals.
query(p([X, Y]))            // One goal with a list argument.
implies(p(X), [q(X), r(X)]) // Two heads.
```

The control meanings apply in goal contexts. Arithmetic terms with the
names `and`, `or` and `not` instead have the meanings of [Section 5](#5-arithmetic).

Unbound callable variables and forward dependencies are restricted by
[Section 6.1](#61-dependencies-and-stratification). A goal whose name and arity identify neither a control,
primitive, inspection form nor any clause head has no solution.

### 4.2 Controls

| Control | Term | Meaning |
| --- | --- | --- |
| `and(A, B)`, `[A, B]` | `and(A, B)` | Conjunction: solve `A`, then `B`. |
| `or(A, B)` | `or(A, B)` | Disjunction: the solutions of `A`, then those of `B`. |
| `not(G)` | `not(G)` | Negation: succeeds once, binding nothing, when `G` has no solution. When the negation is solved, every variable of `G` MUST be bound except anonymous ones, which stand for any value: `not(q(X, _))` succeeds when `q(X, Y)` has no solution for any `Y`. A named unbound variable is an error. |
| `call(G)` | `call(G)` | The solutions of `G`. |
| `once(G)` | `once(G)` | The first solution of `G`. |
| `findall(T, G, L)` | `findall(T, G, L)` | Unifies `L` with the list of instances of `T`, one per solution of `G`, in order, each renamed apart. |

Anonymous variables are `_` occurrences and source variables named `_`
followed by digits ([Section 3.3](#33-term-construction)), including their renamed-apart copies.

The term forms in the table have exactly the displayed arities. In program
scripts, the following constructors additionally accept goal sequences:

| Constructor | Result |
| --- | --- |
| `and(G1, ..., Gn)` | Left-associated conjunction; for `n = 1`, `G1`; for `n = 0`, `'true'`. |
| `or(G1, ..., Gn)` | Left-associated disjunction; for `n = 1`, `G1`; for `n = 0`, `'fail'`. |
| `not(G1, ..., Gn)` | `not` of the conjunction, using `'true'` when `n = 0`. |
| `call(G1, ..., Gn)` | `call` of that conjunction. |
| `once(G1, ..., Gn)` | `once` of that conjunction. |

For example, `and(A, B, C)` constructs `and(and(A, B), C)` and
`not(A, B)` constructs `not(and(A, B))`. Document calls to `and` and `or`
with more than two arguments also denote left-associated chains. Other
document calls retain their stated name and arity; in particular `not(A, B)`
in a document is a compound `not/2`, not the unary control.

### 4.3 Primitives

In a flow pattern, `+` marks an argument that MUST be bound when the goal
runs, `-` one that MUST be unbound, `?` either, and `@` one only inspected. A
primitive called outside its patterns raises an error.

| Primitive | Pattern | Meaning |
| --- | --- | --- |
| `'true'`, `'fail'`, `'false'` | | Succeeds; fails; fails. |
| `unify(?X, ?Y)` | | Unifies `X` and `Y`. |
| `not_unify(@X, @Y)` | | Succeeds, binding nothing, when `X` and `Y` do not unify. |
| `identical(@X, @Y)` | | `X` and `Y` are identical. |
| `not_identical(@X, @Y)` | | `X` and `Y` are not identical. |
| `compare(?O, @X, @Y)` | | Unifies `O` with `'<'`, `'='` or `'>'`, by the standard order. |
| `is(?V, +E)` | | Evaluates `E` ([Section 5](#5-arithmetic)) and unifies `V` with the result. |
| `eq(+E1, +E2)`, `ne(+E1, +E2)` | | The values of `E1` and `E2` are equal, or not. |
| `lt(+E1, +E2)`, `le(+E1, +E2)`, `gt(+E1, +E2)`, `ge(+E1, +E2)` | | Compares the values of `E1` and `E2`. |
| `is_var(@X)`, `is_nonvar(@X)` | | `X` is an unbound variable, or is not. |
| `is_ground(@X)` | | `X` contains no unbound variable. |
| `is_atom(@X)`, `is_number(@X)` | | `X` is an atom, or a number. |
| `is_int(@X)`, `is_float(@X)` | | `X` is an integer, or a float. |
| `is_compound(@X)` | | `X` is a compound; a non-empty list is one. |
| `functor` | `functor(+T, ?N, ?A)`, `functor(-T, +N, +A)` | Name and arity of `T`, or `T` built with fresh variable arguments. When constructing, `A` MUST be an integer from 0 to 1024; with `A` 0, `N` MUST be atomic and `T` is `N` itself, so `functor(T, 3, 0)` gives `3`; with `A` above 0, `N` MUST be an atom. |
| `arg` | `arg(+N, +T, ?A)` | `A` is the `N`th argument of `T`, counting from 1. `N` MUST be an integer from 1 to 1024. An atomic `T`, or an `N` above `T`'s arity, has no such argument, and `arg` fails. |
| `univ` | `univ(+T, ?L)`, `univ(-T, +L)` | `L` is the list of `T`'s name and arguments; for atomic `T`, `[T]`. When constructing, `L` MUST be a non-empty proper list whose first element is an atom, or a one-element list of a number; a partial list raises an error. |
| `atom_chars` | `atom_chars(+A, ?L)`, `atom_chars(-A, +L)` | `L` is the list of `A`'s characters as atoms. |
| `atom_codes` | `atom_codes(+A, ?L)`, `atom_codes(-A, +L)` | `L` is the list of `A`'s character code points. Each code MUST be an integer from 0 to 1114111 (0x10FFFF); a code of a lone surrogate gives that lone surrogate. |
| `atom_length` | `atom_length(+A, ?N)` | `N` is the number of characters of `A`. |
| `number_chars` | `number_chars(?N, +L)`, `number_chars(+N, -L)` | A bound `L` is read as a number: an optional sign and decimal digits give an integer, and with a fraction or an exponent a float, as in `'007'`, `'-21.5'`, `'.5'`, `'1.'` and `'2E-2'`; other text fails, as does text whose value is too large for a finite float, such as `'1e400'`. Otherwise `L` spells `N` in its canonical text ([Section 9.2](#92-canonical-atoms-numbers-variables-and-lists)). |
| `atom_concat` | `atom_concat(+A, +B, ?AB)`, `atom_concat(?A, ?B, +AB)` | `AB` is `A` followed by `B`; with `AB` given, every split, shortest `A` first. |
| `atom_lower`, `atom_upper` | `atom_lower(+A, ?L)`, `atom_upper(+A, ?U)` | `L` is `A` in lower case, `U` in upper case, by Unicode default case conversion: the full mappings, independent of locale, with the final sigma of a word lowered to `'ς'`, so `atom_upper('straße', 'STRASSE')` holds. |
| `digest` | `digest(+H, +A, ?D)` | `D` is the digest of the UTF-8 encoding of the atom `A` by the hash function `H`, one of `'md5'`, `'sha1'`, `'sha256'` and `'sha512'`, as lowercase hexadecimal. A lone surrogate is encoded as U+FFFD. Another `H` raises an error. |
| `term_text` | `term_text(+T, ?A)` | `A` is the canonical text of `T` ([Section 9.2](#92-canonical-atoms-numbers-variables-and-lists)), which MUST be ground: `term_text(f('a', [1, 2.0]), "f('a', [1, 2.0])")` holds. |
| `float64` | `float64(+Op, +A, +B, ?R)` | Explicit IEEE-754 binary64 computation, including exceptional values represented as atoms, as defined below. |
| `regex_match` | `regex_match(+P, +T)` | Some part of the atom `T` matches the regular expression `P`. |
| `regex_find` | `regex_find(+P, +T, ?G)` | One solution per match of `P` in `T`, from left to right: `G` is the list of the matched text followed by each capture group's text, `''` for a group that took no part in the match. |
| `regex_replace` | `regex_replace(+P, +T, +R, ?U)` | `U` is `T` with every match of `P` replaced by `R`. |

A character is a Unicode code point. Every primitive except `atom_concat`
and `regex_find` has at most one solution.

`float64/4` converts numeric operands explicitly to binary64, rounding an
integer to nearest with ties to even. Exceptional values are the atoms
`'INF'`, `'-INF'` and `'NaN'`; they are not additional core numbers.
`Op` is `'add'`, `'sub'`, `'mul'` or `'div'`, with IEEE-754 results,
including overflow, underflow and division by zero. Signed zero is retained.
For `'compare'`, `R` is `'<'`, `'='`, `'>'`, or `'unordered'` if either
operand is NaN. Operations `'convert'`, `'neg'`, `'abs'`, `'ceil'`, `'floor'`
and `'round'` use only `A`; `'round'` rounds halves toward positive infinity
and retains negative zero. `'trunc'` returns an exact integer for a finite
converted `A` and fails otherwise. The unused `B` is still an input.

For `'parse'`, `A` is an atom with an XSD float/double lexical form: an
optionally signed decimal with an optional exponent, `'INF'`, `'+INF'`,
`'-INF'` or `'NaN'`, optionally surrounded by XML whitespace. Parsing rounds
once to binary64 and allows overflow and underflow. An invalid lexical
form or operand fails; another `Op` raises an error. Finite numeric results
are floats; exceptional results are the atoms above. C5 re-decides these
operations, including signed zeros and exceptional results.

A regular expression `P` is an atom read as an ECMAScript pattern
(ECMA-262, the `RegExp` pattern grammar and matching semantics) with only the
`u` flag, so it matches by code point: `.` matches `'\u{1F600}'` as one
character, `^` and `$` match only at the ends of the text, and matching is
case-sensitive. A pattern that is not valid in that mode, such as `'('`,
raises an error. `regex_find` and `regex_replace` take the matches as a
global search does: after an empty match the search resumes one code point
later, so `regex_find('a*', 'baa', G)` gives `['']`, `['aa']` and `['']`. In
the replacement `R`, `$&` stands for the match, `$1` to `$99` and `$<Name>`
for its groups, `` $` `` and `$'` for the text before and after it, and `$$`
for `$`; any other `$` is itself. Primitives MUST be pure: their solutions depend only on
their arguments. A primitive given an argument of the wrong kind for its
patterns raises an error, as `atom_length(123, N)` does; one given arguments
of the right kinds that has no solution fails, as `arg(5, f(1), A)` does.

All primitives take exactly the displayed number of arguments. `functor`
and `univ` expose list structure as specified in [Section 2.2](#22-lists); use bracket
syntax when writing lists.

## 5. Arithmetic

### 5.1 Expressions

An arithmetic expression is a number, a variable bound to an expression,
one of the atoms `'pi'`, `'e'`, `'tau'`, or a function term from [Section 5.2](#52-functions-and-arities).
The constants denote binary64 approximations of pi, e and twice pi.
Arguments of a function term are evaluated recursively. An unbound variable,
an unknown function, an unsupported arity or any other atom is an error.

Arithmetic is evaluated only where required by a primitive such as `is`,
`eq` or `lt`. Elsewhere `add(1, 2)` is a compound term, not the number 3.
Comparisons are goals ([Section 4.3](#43-primitives)), not arithmetic expressions.

### 5.2 Functions and arities

The arity column gives the exact accepted number of arguments, or an
inclusive range. Function names are written as calls, for example
`add(X, 1)` and `round(X, 2)`.

| Names | Arity | Meaning |
| --- | --- | --- |
| `add`, `sub`, `mul` | 2 | Addition, subtraction, multiplication. |
| `div`, `floordiv`, `mod` | 2 | True division, floor division, floor remainder. |
| `pow` | 2 | Exponentiation. |
| `shl`, `shr`, `xor`, `and`, `or` | 2 | Integer shifts and bitwise operations. Shift counts must be nonnegative integers. |
| `not` | 1 | Integer bitwise inversion. |
| `neg`, `pos` | 1 | Numeric negation, identity. |
| `abs` | 1 | Absolute value. |
| `min`, `max` | 2 or more | Least or greatest argument. |
| `round` | 1 or 2 | Round half to even, optionally to an integer decimal-place count. |
| `int`, `trunc`, `floor`, `ceil` | 1 | Integer conversion: toward zero, toward zero, down, up. |
| `float` | 1 | Conversion to binary64. |
| `sqrt`, `isqrt` | 1 | Square root as a float; floor square root of a nonnegative integer. |
| `exp`, `log2`, `log10` | 1 | Exponential, base-2 logarithm, base-10 logarithm. |
| `log` | 1 or 2 | Natural logarithm, or logarithm with the second argument as base. |
| `sin`, `cos`, `tan`, `asin`, `acos`, `atan` | 1 | Trigonometric functions and inverses; angles are in radians. |
| `atan2` | 2 | Angle from its ordinate and abscissa, in that order. |
| `sinh`, `cosh`, `tanh` | 1 | Hyperbolic functions. |
| `hypot` | 1 or more | Euclidean norm. |
| `degrees`, `radians` | 1 | Conversion from radians to degrees, or degrees to radians. |
| `fmod`, `copysign` | 2 | Float remainder with the dividend's sign; magnitude of the first argument with the second's sign. |
| `gcd`, `lcm` | 1 or more | Nonnegative integer greatest common divisor or least common multiple. |

A zero-argument call denotes an atom, not a function term; only the three
constant atoms of [Section 5.1](#51-expressions) are arithmetic values. A `float(N)` applied
directly to a JavaScript number in a script constructs a float immediately
([Section 3.3](#33-term-construction)).

### 5.3 Numeric results

Integer arithmetic is exact and unbounded. Integer operands give an integer
result except for `div`, a negative exponent in `pow`, and functions defined
to return a float. Mixed `add`, `sub`, `mul`, `div`, `floordiv`, `mod` and
`pow` give a float. Integer-conversion functions return integers; `min` and
`max` return the selected operand with its original kind, and among equal
operands the first: `min(1, 1.0)` is `1` and `min(1.0, 1)` is `1.0`. No operation
implicitly makes an integer and a float unify.

`floordiv` rounds down and `mod` has the divisor's sign:
`floordiv(-7, 3)` is -3 and `mod(-7, 3)` is 2. `div` of integers rounds
their exact quotient once to the nearest binary64 value, with halfway cases
rounded to even, including in the subnormal range. Underflow to zero keeps
the sign, and a zero quotient has the sign binary64 division gives it:
`div(0, -5)` is `-0.0`. `sqrt(-0.0)` is `-0.0`. `round(X)` gives an integer; `round(X, Digits)` rounds to the
specified number of decimal places. Float spelling is defined in [Section 9.2](#92-canonical-atoms-numbers-variables-and-lists).

Numeric comparison is exact across integers and floats. Bitwise operations
use unbounded two's-complement integers.

### 5.4 Arithmetic errors and limits

An evaluation MUST raise an error, rather than produce a value, on a division
or modulo by zero, a domain error (such as `sqrt(-1)`, `log(0)`, or a
logarithm `log(X, B)` whose `X` or base `B` is not positive or whose `B` is
1), a bitwise operation, `isqrt`, `gcd` or `lcm` on a float, a negative shift
count, when the result
is not a finite real number,
or when a power or left shift would need more than 2^26 bits: for a power of
integers `pow(A, B)` with `B > 0` and `abs(A) > 1`, when `B` times the bit
length of `A` exceeds 2^26; for a shift `shl(A, B)` of integers, when `B`
exceeds 2^26.

## 6. Rule Structure

### 6.1 Dependencies and stratification

A body goal depends on a clause when the goal, renamed apart, unifies with
one of the clause's heads. The dependency is **closed** when the goal occurs
inside a negation or as the goal of a collection ([Section 4.2](#42-controls)), and **open**
otherwise. Each clause has a rank: the least assignment such that a clause's
rank is at least the rank of every clause it depends on, plus one for a closed
dependency. Forward rules run in order of rank ([Section 8.2](#82-forward-evaluation-and-witnesses)).

A program MUST be rejected when:

- no such assignment exists, because a closed dependency lies on a cycle,
  and the program is not chain-stratified ([Section 6.4](#64-chain-stratification));
- a forward rule can reach, through dependencies, a clause with a body goal
  that is a variable.

Because dependencies compare whole terms, two relations sharing a predicate
name MAY have different ranks.

The guard of a restricted rule ([Section 7.2](#72-variables-and-witnesses)) is a body goal whose
dependencies are open, though it is a negation: the rule ranks at least as
high as every clause that derives its heads, itself included, without a
closed dependency on itself.

### 6.2 Inline rule templates

Nested `implies(Body, Head)` and `implied_by(Head, Body)` calls construct rule
templates. A rule value in a conclusion MUST occur as a top-level conjunct of
an `implies` conclusion; in a body, `implies` and `implied_by` are inspection
goals ([Section 6.3](#63-source-rule-inspection)). A rule value anywhere else in a clause, such as an
argument of an ordinary head or goal, or the template or result of `findall`,
MUST be rejected. The conclusion MAY combine ordinary heads and several
templates. Each template's
body and head MAY themselves be conjunctions, written as arrays. A backward
template with several heads defines one backward clause per head, sharing
the same captures and body. Empty and open lists are not goals or heads.

A rule call embedded in another statement of the same program contributes
only its rule value, not a standalone clause. This exclusion precedes clause
numbering and validation. This applies through arrays, helpers and stored
values. A value MAY be reused in several generators; it contributes no
standalone clause in that program. Separate programs apply this rule
independently. Anonymous variables are named within each enclosing clause,
so a template's anonymous variables cannot capture unrelated anonymous
variables of the generator.

The pure constructors `forward(Body, Head)` and `backward(Head, Body)` also
construct templates with the same expansion and scope. They state no clauses
unless embedded in a generating statement.

A template variable is **captured** when it also occurs in the generating
clause's body or in an ordinary sibling head. The other variables are local
to that template: they are universally quantified within the generated rule,
except for head-only variables of a forward template, which receive witnesses
as [Section 8.2](#82-forward-evaluation-and-witnesses) describes. Variables shared only between sibling templates are
local to each. Every call in a template body, including calls inside controls,
MUST be statically named; a variable in a term's argument is permitted, but a
variable used as a goal is not. A forward template MAY conclude further inline
templates. A backward template MUST NOT conclude templates.

Template compilation precedes validation and stratification. Starting with
all stated clauses in order, append a potential clause for each template,
left to right. Its body is the generating clause's full body followed by the
template's body; its head and direction are those of the template. A forward
template keeps its head conjunction; a backward template appends one clause
per head. Continue processing appended clauses in order, compiling nested
forward templates in the same way. Original clause numbers are kept;
appended clauses are numbered consecutively and inherit the generator's
source line. `forward` and `backward` are displayed as `implies` and
`implied_by`. The original generating clause retains its template heads.

For example, `implies(cat(X), implies(dog(Y), test('yes')))` as the only
stated clause has these displays:

```js
clause(1, implies(cat(X), implies(dog(Y), test('yes'))))
clause(2, implies([cat(X), dog(Y)], test('yes')))
```

The appended body describes the premises a certificate must justify. It is
not a prescription to reevaluate the generator when the appended rule is
called. During forward evaluation, each solution of the generator creates a
rule instance with its captures bound to that solution and its generator's
evidence retained. Identical captures of the same template create one
instance. The rule instance searches only the template's own body; a
backward caller cannot change how the generator's body was evaluated.
Template-local variables remain universal and are renamed apart on each use.
The run derives no synthetic enabling facts, and certificates have no
intermediate enabling steps: the generator's premises are direct uses of
the derived rule's step. A nested instance retains all enclosing premises.

For witness construction, a generating head's **scope projection** replaces
each template conjunct by the list of its captured variables, in order of
their first occurrence in the template as written, leaving ordinary
heads in place. These lists are compiler data and are never concluded as
facts. Only variables of this projection participate in that firing's witness
construction ([Section 8.2](#82-forward-evaluation-and-witnesses)). A witness introduced by the generator remains
shared across every use of the derived rule; a witness introduced by a derived
forward rule additionally depends on its captured context. An existential
variable is a feature of a forward rule, not a third rule direction.

All potential clauses participate in [Section 6.1](#61-dependencies-and-stratification), including clauses whose
generators never succeed. Each appended clause has an open dependency on its
generator as well as the dependencies of its own body. Consequently, negation
and collection wait for both the generator and all potential rules they may
consult to finish. A closed dependency cycle MUST be rejected even if its
generator would never succeed. Only a forward clause can generate templates;
backward generators and backward templates that conclude templates are
rejected.

### 6.3 Source rule inspection

As goals, `implies(Body, Head)` and `implied_by(Head, Body)` match ordinary
forward and backward source rules respectively. The fixed catalogue contains
only original `implies` and `implied_by` clauses whose heads contain no rule
templates and whose bodies contain no inspection goals, including inside
controls. Facts, queries, contradictions, template generators and appended
clauses are excluded. Inspecting rules therefore cannot inspect themselves.
A rule value used as an inspection pattern is embedded in the inspecting
statement ([Section 6.2](#62-inline-rule-templates)), so a stored rule value used as a pattern loses its
standalone clause and is not in the catalogue.

The catalogue keeps source order. A rule's body and forward head conjunctions
are terms `and(...)`, as normalized goals are, and inspection arguments are
goal positions. Each attempt renames the entire rule apart, preserving
shared variables. Matching can instantiate these variables. Inspection reads
the rule's structure; it
does not solve its body or establish that its head holds.

Free variables supplied by a successful inspection are scoped universal
pattern variables. Forward conclusions preserve them, including through
backward derivations and copied collection results. Derived patterns are
identified up to variable renaming and freshened, together with their evidence,
at every use. Unrelated unbound variables keep [Section 8.2](#82-forward-evaluation-and-witnesses)'s witness behavior.
When inspection variables remain free in a conclusion or its captured
template context, that firing MUST NOT introduce head-only existential
witnesses: it MUST fail with an error requiring the inspection variables to
be bound first. [Section 11.11](#1111-c8-witness-integrity) rejects certificates that bypass this boundary.

Inspection uses a fixed source catalogue, so its own results do not depend on
forward rounds. Other goals using derived patterns still participate in
stratification. Negation and collection keep their own justifications ([Section 10.3](#103-steps)).

### 6.4 Chain stratification

A rule whose head has a variable in every argument, such as
`implies([rdf(P, 'spo', Q), rdf(X, P, Y)], rdf(X, Q, Y))`, unifies with every
negated goal of its relation, so a cycle through it and a negation defeats
[Section 6.1](#61-dependencies-and-stratification)'s ranks. Many such programs still have one intended result:
no sequence of rule applications that starts at a rule with a negation can
make one of its negated goals true without also satisfying a
contradiction's body. N. Küchenmeister, A. Ivliev, D. Arndt and
M. Krötzsch, "Stratified Negation in RDF Rules: A Correct Approach"
(arXiv:2607.28778), call such programs chain-stratified under constraints.
This section defines the decision eyemind makes, which errs towards
rejection: a program it accepts is chain-stratified in the paper's sense.
It is made only for a program [Section 6.1](#61-dependencies-and-stratification) rejects for a closed cycle.

**Rules.** The rules are the forward clauses and the backward clauses with a
body. A program with templates or captures, a rule body goal `or`, `once`,
`call` or a variable, or a backward rule with a negation or collection, is
not chain-stratified. A rule has:

- **positive goals**: its body goals other than primitives, negations,
  collections and `'true'`, and other than a restricted rule's guard
  ([Section 7.2](#72-variables-and-witnesses));
- **negated groups**: for each `not(G)` and `findall(T, G, L)` body goal,
  the goals of the conjunction `G` other than primitives; a group with a
  control or a variable makes the program not chain-stratified, and an
  empty group is left out;
- **heads**: a forward rule's heads other than `'true'` and `'false'`, or a
  backward rule's head.

A rule is **Datalog** when it has no negation or collection and is not
restricted; a Datalog rule without primitives is **pure**. A contradiction is
a forward rule whose head is `'false'`.

**Closure.** Chain facts are terms whose variables are treated as distinct
constants. The closure of a set of chain facts adds, for each pure Datalog
rule renamed apart and each way its positive goals unify with facts of the
set, its heads that the unifier makes ground, repeatedly until nothing is
added. The set is **contradictory** when a contradiction's positive goals
match it.

**States.** A chain state is formed from a rule `r`, its heads `H`,
**conditions** `C` and **caused facts** `K`. Let `B` be the closure of `C`
and `F` the closure of `C ∪ K ∪ H`; there is no state when either is
contradictory. The state's facts are the facts of `F` whose variables all
occur in `H`, each marked **caused** when it is not in `B`. Two states are
the same when they have the same rule and, after renaming their variables
to `V0`, `V1`, ... in order of first occurrence in `H`, the same heads and
the same facts with the same marks.

**Chains.** Each forward rule `s` that is not Datalog starts a search with
the state of `s` with `C` its positive goals, `K` empty and `H` its heads,
renamed apart. A state `S` is **extended** by a rule `r` with heads, renamed
apart, for each positive goal `g` of `r` and each caused fact `c` of `S`
whose most general unifier with `g` is `σ`. Let `D` be the facts of `S` and
the positive goals of `r`, under `σ`. The extension is discarded when the
closure of `D` is contradictory, when the heads of `r` under `σ` match facts
of `D` with only their variables absent from `D` free, or when the goals of
a negated group of `r` under `σ` match facts of `D` in the same way.
Otherwise it gives the state of `r` with `H` its heads under `σ`, `K` the
caused facts of `S` under `σ`, and `C` the other facts of `S` under `σ`
together with the positive goals of `r` under `σ` that are not among `K`.
Each search visits a state once.

**Edges.** A rule `s` has an edge to a rule `t` with a negated group when a
state of `s`'s search has a caused fact that unifies, by `τ`, with a goal of
a negated group of `t` renamed apart, and the facts of the state under `τ`
have a closure that is not contradictory. The program is
**chain-stratified** when no rule reaches itself through edges. A search
that visits more than 4096 states in total, or a closure of more than 2048
facts, makes the program not chain-stratified.

**Ranks.** A Datalog forward rule has rank 0. Another forward rule has rank 1,
or one more than the greatest rank of a rule with an edge to it. Forward
rules then run by these ranks as [Section 8.2](#82-forward-evaluation-and-witnesses) specifies for chain strata. For
example, with constraints that the examiner relation is no subproperty of
the participant relation, of `spo` or of the type relation:

```js
implies(rdf(C, 'participant', P), rdf(P, 'type', 'Student'))
implies([rdf(C, 'teacher', P), not(rdf(P, 'type', 'Student'))], rdf(C, 'examiner', P))
implies([rdf(P, 'spo', Q), rdf(Q, 'spo', R)], rdf(P, 'spo', R))
implies([rdf(P, 'spo', Q), rdf(X, P, Y)], rdf(X, Q, Y))
contradiction(rdf('examiner', 'spo', 'participant'))
contradiction(rdf('examiner', 'spo', 'spo'))
contradiction(rdf('examiner', 'spo', 'type'))
```

is chain-stratified: every chain from the second rule that could make
`rdf(P, 'type', 'Student')` true satisfies a contradiction's body. Without
any one of the three contradictions it is not.

## 7. Semantics

### 7.1 Herbrand interpretation

Ordinary predicates have a **Herbrand interpretation**: ground terms denote
themselves, and predicates relate those terms. The **Herbrand universe**
contains the finite ground terms of [Section 2](#2-terms), including values constructed
by arithmetic or text operations and Skolem terms. The **Herbrand base** is
the set of ordinary ground predicate applications over that universe,
including predicates of arity 0. An interpretation is a subset of the base.

Matching uses [Section 2.3](#23-identity-and-unification)'s unification, including its signed-zero rule.
Asserting a relation does not change term identity. Controls, primitives
and source inspection have the fixed meanings of Sections [4](#4-goals-and-primitives)–[6](#6-rule-structure).

### 7.2 Variables and witnesses

Variables of facts and backward clauses are universally quantified within
their clause, except for collection-local variables ([Section 4.2](#42-controls)).
`fact(p(X))` states every ground instance of `p(X)`. Resolution may return
a universal answer containing variables without enumerating its ground
instances. Template variables have the scope of [Section 6.2](#62-inline-rule-templates).

An unbound variable in a forward conclusion instead receives a witness,
unless it is a scoped inspection variable ([Section 6.3](#63-source-rule-inspection)). For example,
`implies(person(X), has_token(X, T))` introduces an existential witness for
`T`. [Section 8.2](#82-forward-evaluation-and-witnesses) determines its Skolem term from the rule and head context,
including captured template values. Body variables absent from that context
do not distinguish witnesses; shared head variables share a witness.

A restricted rule, `restricted(Body, Head)`, with head-only variables
`W1, ..., Wk` has one more body goal after `Body`, its **guard**:

```js
not([H1', ..., Hm', not_unify([_A1, ..., _Ak], [S1, ..., Sk])])
```

`H1', ..., Hm'` are its heads with each `Wi` replaced by a distinct
anonymous variable `_Ai`, numbered `_0`, `_1`, ... as the first such names
the clause does not use; `Si` is `skolem(N, 'Wi', Frontier)`, the witness a
firing of clause `N` gives `Wi` ([Section 8.2](#82-forward-evaluation-and-witnesses)), where `Frontier` is the list of
the heads' other variables in order of first occurrence. The guard holds when
nothing but the firing's own witnesses satisfies its heads. Before a
firing, that is when no known values satisfy them, so a satisfied rule does
not invent new values, as the restricted chase does; after it, that is when
the firing's witnesses are needed, which the search certificate shows like
any negation. A restricted rule without head-only variables has no guard and
behaves as `implies`. For example:

```js
fact(human('jo'), father('jo', 'bob'))
restricted(human(X), [father(X, F), man(F)])
implies(father(X, Y), man(Y))
```

concludes `man('bob')` and invents no father for `'jo'`, since `'bob'`
already satisfies the heads once the third rule has run. A restricted
rule's display omits its guard ([Section 10.2](#102-clause-displays)).

A `restricted` call states a clause and is no rule value: a `restricted`
call nested in another statement MUST be rejected. Its premise MUST bind
every variable of its heads other than the head-only ones when the guard is
solved; a solution that leaves one unbound, as a fact with variables can,
is an error.

This gives the specified Skolemized reading of existential conclusions.
The original existential rule need not have a least model over its original
vocabulary. A witness is an ordinary compound in subsequent reasoning; it
does not imply the existence of a distinct real-world object.

### 7.3 Positive least model

The positive relational fragment consists of ground facts and rules with
ordinary body calls, conjunction and disjunction, with each head variable
bound by the body. Primitives may be included when earlier goals supply
their required inputs and their solutions agree with the ground relation
under further substitution. This fragment excludes negation, collection,
`once`, inspection and tests of an unbound variable's current state.

Its meaning is the **least Herbrand model**: the smallest interpretation
containing the facts and closed under ground rule instances, with matching
as in [Section 7.1](#71-herbrand-interpretation). If a body holds, every head of that rule instance holds.
Existential forward rules extend this reading with the specified witnesses.
The closure can be infinite.

Forward and backward clauses both express implication in this fragment;
their directions determine evaluation. A completed ordinary goal search
returns the goal's instances that hold in the model. The model includes
source facts and consequences available only by backward search, beyond
the newly derived facts or selected answers printed by a run.

### 7.4 Negation and collection

For stratified negation, interpret ranks in increasing order, fixing lower
strata before testing absence at a higher rank ([Section 6.1](#61-dependencies-and-stratification)). `not(G)`
holds when `G` has no solution, with the binding restrictions of [Section
4.2](#42-controls). This is absence relative to the program, not falsity in the world.
For relational goals this gives the stratified least-model reading.

A chain-stratified program ([Section 6.4](#64-chain-stratification)) has no such ranks. Its meaning
is the set of facts [Section 8.2](#82-forward-evaluation-and-witnesses)'s chain strata derive. When no
contradiction holds, that set is a **stable model**: the least model of
the program's rules with every negation decided by the set itself. Chain
stratification is what makes it the only one, so the order of rule
applications cannot change it.

A restricted rule ([Section 7.2](#72-variables-and-witnesses)) reads its conclusion existentially: for each
solution of its premise, some values satisfy its heads. A result is **lean**
when each witness a restricted rule made is needed, no other values
satisfying those heads. [Section 8.2](#82-forward-evaluation-and-witnesses) derives one lean result or fails;
another order of rule applications could derive another, so a lean result
is not determined by the program alone.

Collection also waits for its dependencies. `findall` collects ordered
search solutions, including repeated derivations and nonground instances;
its meaning is not determined by a set of ground atoms alone. Bindings
made while solving its goal do not escape except through the copied result
list. Clause order and duplicate source clauses can affect that list.

### 7.5 Sets and operational behavior

Derived facts and reported answers follow the duplicate-suppression rules
of [Section 8](#8-evaluation-and-conclusions). These rules do not remove alternative search derivations.
The unrestricted least-model reading alone therefore does not define every
program's answers. `once` selects the first solution, and tests such as
`is_var`, `identical` and `not_unify` can observe current bindings:

```js
fact(q('b'))
implied_by(p(X), [not_unify(X, 'a'), q(X)])
```

The goal `p(X)` has no answer because the initial unbound `X` unifies with
`'a'`, causing `not_unify` to fail. The goal `p('b')` succeeds. Forward
rules calling such clauses can inherit their dependence on call bindings.
[Section 8](#8-evaluation-and-conclusions) defines the observable goal, clause and result order.

### 7.6 Termination and proof claims

Arithmetic, term construction and witness introduction can generate an
infinite closure. A finite model does not ensure search termination:
`implied_by(p(X), p(X))` has an empty least model, but searching `p('a')`
recurs indefinitely. Exceeding a resource bound raises an error ([Section
8.3](#83-resource-bounds)). Contradictions halt without completing the closure ([Section 8.5](#85-contradictions)).
A valid proof establishes its claims subject to its obligations and, when
it checks without obligations, that they are every answer of the original
questions ([Section 11.1](#111-scope-of-a-valid-proof)); it does not
establish termination of the whole program. Its search
certificate settles the negations and collections it can ([Section 10.4](#104-search-certificates)).

## 8. Evaluation and Conclusions

### 8.1 Goal search

Goals are solved depth-first, left to right. A goal is solved, in order:

1. by a control, primitive or source inspection (Sections [4](#4-goals-and-primitives) and [6.3](#63-source-rule-inspection)), when
   it is one;
2. otherwise against the facts derived so far by forward rules with the same
   name and arity, in the order they were derived;
3. then against the program's facts and backward rules with the same name and
   arity, in clause order, each renamed apart before it is unified with the
   goal; a rule's body is then solved in its place.

Each clause attempt MUST rename its variables apart before unification.
An appended backward clause is eligible only through its derived instances,
tried in their creation order. Each instance binds its captures before its
head meets the goal, and searches only its own body.

### 8.2 Forward evaluation and witnesses

Forward rules run stratum by stratum, in increasing rank ([Section 6.1](#61-dependencies-and-stratification)). Within
a stratum, rounds are repeated until a round adds no new fact or rule instance.
In a round, clauses run in clause order. An appended clause runs its derived
instances in the order they were created; a potential clause with no instance
is skipped. Each instance searches only its own body with its captures bound.
All instances of one clause search the same current state, and all solutions
are collected before any conclusion of that clause is published. They are
published solution by solution, in the order found, and the heads of each
solution in their stated order: `implies(p(X), [a(X), b(X)])` over `p(1)`
and `p(2)` publishes `a(1)`, `b(1)`, `a(2)`, `b(2)`. For each head:

- a head variable the solution leaves unbound is bound to a **Skolem term**
  `skolem(Rule, Variable, Arguments)`: `Rule` is the clause number of the
  rule, `Variable` the name of the head variable the term stands for, as the
  program writes it (an anonymous one as `_0`, `_1`, ..., [Section 3.3](#33-term-construction)), and
  `Arguments` the list of
  the ground values the solution gives the heads' other variables, in order
  of their first occurrence in the heads. A Skolem term is thus a function of
  the firing: the rule and the instance of its heads. The same firing
  gives the same terms, in any round and in any run, and different
  firings give different terms; variables shared between heads stay
  shared. When several head variables stand for one term, the first of them
  in the heads names it, whichever way unification bound them. A variable
  that a value of the solution brought in, which no head variable stands
  for, keeps its own name when no other term of the firing has it; the
  others take that name followed by the first of `1`, `2`, ... that is
  free, in order of first occurrence in the heads. A rule that keeps meeting new firings does
  not terminate ([Section 8.3](#83-resource-bounds)). Derived facts other than scoped inspection
  patterns ([Section 6.3](#63-source-rule-inspection)) are therefore ground. A
  checker verifies the Skolem terms of a proof (C8, [Section 11.11](#1111-c8-witness-integrity));
- a head `'true'` reports the instance of the rule's body, as a conjunction,
  once per distinct instance (by identity of canonical text);
- a head `'false'` records the conclusion `'false'` and stops all reasoning
  with halt code 65;
- a template head derives a rule instance as specified in [Section 6.2](#62-inline-rule-templates);
- any other head is added as a derived fact unless an identical fact is
  already derived or is a ground fact of the program.

When the run asks its own goals ([Section 8.4](#84-external-goals)), rules whose heads are all
`'true'` are not run.

A program accepted by chain stratification ([Section 6.4](#64-chain-stratification)) runs its forward
rules by chain strata instead of stratum by stratum. Rules of rank 0 run in
rounds; a round of the rules of a rank `k > 0` runs only after a round of
each lower rank, in increasing order, that added nothing; after a round of
any rank that adds something, rank 0 runs again. Reasoning ends after a
round of the highest rank that adds nothing, all lower ranks' latest rounds
having added nothing. A rule thus never fires while a rule of a lower rank
has a firing left.

A stratum with restricted rules alternates two kinds of round. Its other
rules run in rounds as above; a round of its restricted rules, in restraint
order, follows only a round of the other rules that adds nothing, and is
followed by rounds of the other rules again when it adds something. The
stratum ends with a round of its restricted rules that adds nothing. The
other rules of a stratum thus run before its restricted rules, whose guards
see what they derive.

A restricted rule `A` **restrains** a restricted rule `B`, both renamed
apart, when for some head `h` of `B` with a head-only variable of `B`, the
heads of `B` sharing a head-only variable with `h` (`h` included) unify, one
after another under one substitution, each with some head of `A`: firing
`A` can then satisfy `B`'s heads. The **restraint order** of a set of
restricted rules repeatedly takes the first rule, in clause order, that no
other remaining rule restrains, or the first remaining rule when every one
is restrained. A chain stratum ([Section 6.4](#64-chain-stratification)) runs its restricted rules after its
other rules, in restraint order.

When reasoning ends without a contradiction, every guard of a published
restricted firing MUST hold again, with the firing's bindings, in the final
facts. Otherwise later facts satisfy the firing's heads, so its witness is
not needed and the result depends on the order in which rules were applied:
the run MUST fail with an error. For example,

```js
fact(f('a'))
restricted(f(X), h(W))
implies(g(X, Y), h(Y))
restricted(f(X), g(X, W))
```

fails: the second rule makes `h(skolem(2, 'W', []))`, and the last rule's
`g('a', skolem(4, 'W', ['a']))` then gives `h(skolem(4, 'W', ['a']))`,
which satisfies the second rule's head too.

For a generator, use its scope projection ([Section 6.2](#62-inline-rule-templates)) as its head when
constructing witnesses. For an appended forward clause of [Section 6.2](#62-inline-rule-templates),
prepend one element to
`Arguments`: the grounded capture list of its rule instance. This distinguishes
witnesses of different captured contexts even when a head does not mention
those values. An empty capture list still contributes one element, `[]`.
Original clauses, including generators, use the ordinary witness convention.

Scoped inspection variables ([Section 6.3](#63-source-rule-inspection)) are preserved instead of receiving
witnesses, so such a conclusion is a universal pattern. It is not added when
a pattern identical up to renaming of its variables was already derived.

### 8.3 Resource bounds

A run is bounded by `max_depth`, the depth of nested rule bodies (default
1000000), by `max_inferences`, the number of goals started (default
1000000), and by `max_iterations`, the rounds per stratum (default 1000).
Exceeding a bound MUST raise an error; a partial result MUST NOT be returned
as complete. The bounds count as follows:

- A goal solved by a rule is one level deeper than the goal whose body it is
  in, and a goal asked from outside or a forward rule's premise is at level
  0; solving a goal through more than `max_depth` nested rule bodies exceeds
  the bound. A goal solved by a fact adds no level.
- Every goal the search starts counts once toward `max_inferences`,
  including each conjunction, control and primitive, in forward premises as
  in goals: `[p(X), p(Y)]` against one fact starts three goals.
- Every forward round of a stratum counts toward `max_iterations`,
  including the final round that adds nothing; a stratum without forward
  rules has no rounds.

A run that exceeds a bound concludes nothing: the command line writes no
conclusions to standard output, even answers found before the bound was
reached, and exits with code 1 ([Section 13.1](#131-invocation-and-options)).

Each supplied bound MUST be a positive integer no greater than 9007199254740991.

### 8.4 External goals

A run MAY be given goals. Each goal is read on its own, so goals share no
variables: `p(X)` and `q(X)` given separately ask two unrelated questions.
After forward reasoning, each goal is solved in
turn, and each solution is reported as the instance of its goal, unless an
instance identical up to renaming of its variables was already reported for
this goal or an earlier one of the same run.

### 8.5 Contradictions

A run that concluded `'false'` has halt code 65; otherwise it has none.

### 8.6 Reported conclusions

The conclusions of a run are, in order:

1. when it halted: every derived fact, in the order derived, ending with
   `'false'`;
2. otherwise, when it was given goals: the reported instances of its goals;
3. otherwise, when the program has a forward rule with a head `'true'`: the
   reported instances, in order of first report, which MAY be none;
4. otherwise: every derived fact, in the order derived.

Rule instances are not facts and cannot be queried as enabling predicates.
The `derived` statistic counts only facts added during reasoning.

The output of a run is a comment line saying which of these the conclusions
are, followed by the canonical text ([Section 9](#9-document-syntax-and-canonical-text)) of each conclusion, one per
line. The comment MUST say when the run halted, when the conclusions answer
goals, when they answer `query()` rules, or when they are derived facts, and
MUST say so when there are none. Comments are informative and MAY be worded
differently; they are ignored when the output is read ([Section 9.1](#91-accepted-document-syntax)).

### 8.7 Proof generation

When a proof is requested, each solution records how each of its goals was
justified: by a fact or rule of the program, by a derived fact (whose own
record is kept), by a primitive, by a control, by an absence (a negation) or
by a collection (`findall`). For each conclusion the first derivation found is
recorded. Each original question gets call-fidelity evidence (Sections [10.5](#105-call-fidelity-certificates) and [11.13](#1113-c10-call-fidelity)),
when supported. Each negation and collection of a proof gets the search certificate
that settles it (Sections [10.4](#104-search-certificates) and [11.12](#1112-c9-search-closure)) whenever [Section 11.12](#1112-c9-search-closure) allows one. A
table holds every answer of its call, so it can search beyond where the run
stopped, as under `once`; a boundary whose tables would meet an error, or
exceed `max_inferences` calls and answers ([Section 8.3](#83-resource-bounds)), stays trusted. So does a
boundary of a halted run ([Section 8.5](#85-contradictions)) whose listings a rule of a later stratum
would extend: the run stopped before its fixpoint, so its derived facts need
not be closed under the rules. A
reasoner MUST check every proof it generates ([Section 11](#11-proof-checking)) before returning it,
and MUST fail with an error rather than return a proof that does not pass. A
run without conclusions has a proof without claims; its call tables, when
they settle, certify that the original questions have no answers.

A **state test** is `is_var/1`, `not_identical/2` or `compare/3`: a test a
later binding can make false. A goal such as `is_var(X)` followed by
`unify(X, 'a')` holds when it runs, but its final instance `is_var('a')` does
not, so the proof records it as it was called ([Section 10.3](#103-steps)).

## 9. Document Syntax and Canonical Text

A document is data, not a program. Readers MUST use the syntax below and
MUST NOT execute any expression. Writers MUST use the canonical forms of
Sections [9.2](#92-canonical-atoms-numbers-variables-and-lists)–[9.4](#94-variable-scope-in-output). The grammar is given in [Appendix A](#appendix-a-document-grammar).

### 9.1 Accepted document syntax

A document is UTF-8 text containing expression statements. A statement ends
at a line feed outside brackets, a `;`, or the end of the document. Empty
statements, comments (`// ...` and `/* ... */`) and indentation are ignored.
Each term records the line where its expression begins. Writers emit one
expression per line. Readers accept exactly:

- a string literal between single or double quotes, with the escapes
  defined below: an atom;
- a decimal integer literal with optional suffix `n`, or a finite decimal
  float literal containing a point or exponent: a number;
- a name: the variable of that name, where each `_` is a new anonymous
  variable ([Section 4.2](#42-controls)) and a name starting with `VAR_` is decoded
  ([Section 9.2](#92-canonical-atoms-numbers-variables-and-lists)), with malformed encodings rejected; a decoded name is a
  named variable even when it is `_`, so `VAR___` twice is one variable;
- a call of a plain name: the compound, or the atom when there are no
  arguments; `struct('name', ...)` as in [Section 9.3](#93-canonical-compounds); `and` and `or` with
  more than two arguments as in [Section 4.2](#42-controls);
- an array literal: the list, where only the last item MAY be spread
  (`...Tail`) and then is the tail; `[...T]` is `T`;
- an object literal `{K: V, ...}` whose keys are names or strings: the list
  of `struct('=', K, V)` terms, in order;
- a minus sign applied directly to a numeric literal: the negative number;
- an expression in parentheses: that expression.

A trailing comma is allowed in a call, an array and an object. All syntax
outside these forms MUST be rejected, including operators other than a
numeric minus, property or subscript access, spread call arguments,
assignments, declarations, functions and template literals. Numeric literals
MUST be decimal without separators; integers other than `0` MUST NOT start
with `0`, and neither may the digits before a float's point or exponent, so
`00.5` and `05.5` MUST be rejected while `0.5` and `0e1` are floats. A float
literal denotes the nearest binary64 value: one that underflows reads as a
zero of its sign, as `1e-400` reads as `0.0`, and one whose value is too
large for a finite float MUST be rejected. Reading canonical text MUST
recover the original term.

A call's name and opening `(` MUST NOT be separated by a line feed outside
a comment. The same restriction applies between a numeric minus and its
literal. Other line feeds inside brackets are layout.

Bare names are variables regardless of case: `alice` in a document is a
variable; use `'alice'` for an atom. A no-argument call such as `alice()`
also denotes the atom. `2` and `2n` denote integers, while `2.0` and `2e0`
denote floats. `float(2)` is a compound expression, not a float literal.
Array syntax denotes list data; only reading it as a goal applies the
conjunction rules of [Section 4.1](#41-goal-syntax).

String escapes are `\\`, `\'`, `\"`, `\n`, `\r`, `\t`, `\b`, `\f`,
`\v`, `\0` (not followed by a decimal digit), `\xHH`, `\uHHHH` and
`\u{H...}` with one to six hexadecimal digits denoting a Unicode code point.
Other escapes and raw line breaks in strings MUST be rejected; a raw line
break is a line feed or a carriage return, while the characters U+2028 and
U+2029 are allowed in a string as themselves. Outside
strings, layout consists of spaces, tabs, carriage returns, line feeds and
the byte-order-mark character, plus comments. A line feed outside brackets
ends the current expression statement.

Names use ASCII letters, digits and `_`, beginning with a letter or `_`.
The following names are reserved, both bare and as call names:

```text
await break case catch class const continue debugger default delete do else
enum export extends false finally for function if implements import in
instanceof interface let new null package private protected public return
static super switch this throw true try typeof var void while with yield
undefined NaN Infinity
```

Object keys may also use these reserved names, since keys denote atom text.

### 9.2 Canonical atoms, numbers, variables and lists

- An atom is single-quoted. Backslash and quote are escaped as `\\` and
  `\'`; newline, tab, carriage return, backspace, form feed and vertical tab
  as `\n`, `\t`, `\r`, `\b`, `\f` and `\v`. Other characters in
  U+0000-U+001F or U+007F-U+009F, U+2028, U+2029 and lone UTF-16
  surrogates use `\uHHHH` with four lowercase hexadecimal digits. Other
  characters are written literally. The empty-list atom is written `[]`.
- An integer is decimal without a suffix, leading zeros or a plus sign.
  A float uses the shortest significant decimal digits that recover its
  binary64 value. For decimal exponents from -4 through 15, use fixed-point
  form with at least one fractional digit, such as `0.1`, `2.0`, `-0.0`.
  Otherwise use `e`, an explicit exponent sign and at least two exponent
  digits, such as `1e+22` or `1e-05`.
- A variable is written as its name when the name is an ASCII identifier
  (letters, digits and `_`, not starting with a digit), not a reserved name
  of [Section 9.1](#91-accepted-document-syntax), not `_` and does not begin with `VAR_`. Any other name is
  written `VAR_` followed by the name with every ASCII letter and digit kept,
  every `_` doubled and every other character `c` replaced by `_hex_` where
  `hex` is the lowercase hexadecimal code point of `c`. The variable name `A-B`
  is thus written `VAR_A_2d_B`. A reader decodes such a name back
  ([Section 9.1](#91-accepted-document-syntax)).
- A list is written `[I1, I2, ...]`; an open list ends with `, ...Tail`.

### 9.3 Canonical compounds

A compound is written `name(A1, A2, ...)` when its name is an ASCII
identifier, not a reserved name of [Section 9.1](#91-accepted-document-syntax) and not `struct`, and
`struct('name', A1, ...)` otherwise. Arguments are separated by `, `.

A chain of conjunctions or disjunctions built from the left,
`and(and(A, B), C)`, is written as one call, `and(A, B, C)`. A compound
`and/N` or `or/N` with more than two arguments is written with `struct`, as
`struct('and', A, B, C)`.

### 9.4 Variable scope in output

The conclusions a run writes, its proof documents ([Section 10](#10-proof-documents)) and check
reports ([Section 12](#12-check-reports)) use the following variable names. In
the conclusions of a run and in a proof document, the variables are named
`A`, `B`, ..., `Z`, `A1`, ..., `Z1`, `A2`, ... in the order the document
first shows them, across the whole document, the conclusions written first;
the clause displays of a proof keep the program's names. A check report
names the variables of each fact anew ([Section 12](#12-check-reports)).
The call tables of a proof (`called/2`, [Section 10.5](#105-call-fidelity-certificates)) name their variables
in a scope of their own, keeping anonymous variables distinct from named
ones.

## 10. Proof Documents

### 10.1 Structure

A proof document is a document ([Section 9.1](#91-accepted-document-syntax)) holding, in this order:

1. the output of the run ([Section 8.6](#86-reported-conclusions)): its comment line, then its
   conclusions, one per line;
2. an empty line;
3. when the proof cites any clause, a comment line introducing the clauses,
   then one `clause(N, Display)` per program clause the proof cites, by
   increasing `N`;
4. an empty line;
5. when there are steps, comment lines saying what a step records, then one
   `step(Goal, By, Bindings, Uses)` per justified goal;
6. when it has a search certificate ([Section 10.4](#104-search-certificates)), an empty line, comment
   lines introducing it, then one `derived(Pattern, Facts)` per listed
   relation, then one `searched(Call, Answers)` per table;
7. then any `called(Call, Answers)` tables ([Section 10.5](#105-call-fidelity-certificates)), in first-consulted
   order and with their own variable naming scope.

Comments are informative and MAY be worded differently; they are ignored when
the document is read.

A checker MUST treat every statement that is neither `clause/2`, `step/4`,
`searched/2`, `derived/2` nor `called/2` as a claim, whatever its position.

### 10.2 Clause displays

`Display` shows clause `N` in normalized statement form: `fact(Head)`,
`implies(Body, Head)`, `restricted(Body, Head)`, `implied_by(Head, Body)`,
`query(G1, ...)` or `contradiction(G1, ...)`, where `Body` is the clause's
one body goal without a restricted rule's guard, or the
array of its body goals when it has several, `Head` likewise the head or the
array of heads, and `G1, ...` are the body goals themselves. Displays are not
authority: a checker MUST compare each with the program it checks against.

Each argument of a multi-argument `fact` has its own `fact(Head)` display.
A body is displayed with its conjunctions flattened ([Section 3.5](#35-clause-constraints-and-numbering)), whether
the program wrote them as arrays or with `and`: `implied_by(r, and(a, b))`
has display `implied_by('r', ['a', 'b'])`.
Conjunctive query and contradiction bodies are displayed as separate goal
arguments: `query([p(X), q(X)])` has display `query(p(X), q(X))`.

For a program with templates, displays show the original generators and the
potential appended clauses of [Section 6.2](#62-inline-rule-templates). A derived rule's body includes all
enclosing generator premises. The source program is the authority for its
origin, captures and scope projections; a display cannot introduce a new
rule. A reasoner displays the enclosing generators as well as the clauses its
steps cite. Each derived rule step lists its generator's premise evidence
before its own body evidence, with no intermediate enabling step.

### 10.3 Steps

`Goal` is the justified goal as it stands once the whole solution is found:
the goal with every variable the solution bound replaced by its value. The
program's goal `unify(Y, 6)`, solved with `Y` unbound, thus has the step
`step(unify(6, 6), 'builtin', {}, [])`; the value `Y` received is recorded in
the bindings of the step that cites the clause, as `{Y: 6}`. Steps appear
in the order a depth-first walk
from the claims first meets each goal, and each distinct goal (by canonical
text) has one step. `Uses` is the list of the goals that justify `Goal`, in
order. `By` is one of:

| `By` | Meaning | `Bindings` | `Uses` |
| --- | --- | --- | --- |
| `clause(N)` | `Goal` is an instance of a head of clause `N`, a fact or a rule, whose body instance is `Uses`. | the clause's variables | the body instance, empty for a fact |
| `source(N)` | `Goal` is an instance of the inspectable source rule `N` as `implies(Body, Head)` or `implied_by(Head, Body)`. | empty | empty |
| `'builtin'` | `Goal` is a primitive that holds. | empty | empty |
| `called(Called)` | `Goal` is a state test ([Section 8.7](#87-proof-generation)) that held as `Called`, the goal when it ran, its then unbound variables written as variables. | empty | empty |
| `'control'` | `Goal` is `call`, `once` or a disjunction, solved by `Uses`. | empty | the solved goals; for a disjunction, the side that was solved, so `or(or(A, B), C)` solved by `A` uses `or(A, B)`, which has a step of its own |
| `'absent'` | `Goal` is a negation, settled by the search certificate or taken on trust. | empty | empty |
| `'collected'` | `Goal` is a `findall`, settled by the search certificate or taken on trust. | empty | empty |

`Bindings` is an object from each variable name of the cited clause, as
the program wrote it, to its value in this step: `{X: 'socrates'}`. A key
that is a plain name of [Section 9.2](#92-canonical-atoms-numbers-variables-and-lists) is written bare, and any other name as a
string, such as `{'A-B': 1}`. A
reasoner writes every variable of the clause, in the order the clause display
first shows them (for `implies`, the premise first);
a checker MUST accept partial bindings when the goal and uses determine the
omitted values needed by C1 and C8. Values needed only by an enclosing
witness scope must be supplied when those terms do not determine them.
A primitive has no variables of its own, so `'builtin'` and `called`
steps have empty bindings. A reasoner writes `called(Called)` exactly for a
state test whose goal, when it held, had a variable the solution later
bound; `Called` is that goal after the test, so `compare(O, X, 'b')` run
with `X` unbound is written `called(compare('<', A, 'b'))`. Every other
primitive step, and a state test no later binding changed, is `'builtin'`:

```js
implied_by(p(X), [is_var(X), unify(X, 'a')])
// step(is_var('a'), called(is_var(A)), {}, [])
``` A derived clause's bindings also include variables of its
enclosing generators' scope projections, so their witnesses can be checked.
These variables are renamed together with the clause's head and full body.

### 10.4 Search certificates

No step can show that a goal has no solution, or that a list holds every
solution. A search certificate shows it by recording the searches behind a
proof's negations and collections:

- `searched(Call, Answers)` is a **table**: `Call` is a goal as one of those
  searches called it, and `Answers` the array of its answers, each the
  instance of `Call` that one solution gave, in the order of [Section 8.1](#81-goal-search),
  repetitions included. Each answer's variables are its own: they are shared
  neither with `Call` nor with another answer.
- `derived(Pattern, Facts)` is a **listing**: `Pattern` is the name of a
  relation that forward rules conclude, applied to distinct variables, or the
  name alone for arity 0, and `Facts` the array of every fact the run derived
  for that relation, in the order derived ([Section 8.2](#82-forward-evaluation-and-witnesses)). Each listed fact has
  steps of its own.

A table exists for each call to a relation that a backward rule defines or
forward rules conclude, made by those searches or by the closure checks of
[Section 11.12](#1112-c9-search-closure); a call to a relation defined by facts alone needs none. A
listing exists for each relation forward rules conclude that a table or a
closure check consults. A reasoner writes only the tables and listings of
the boundaries it settles: listings first, in the order first consulted,
then tables, in the order their calls are first met. For example:

```js
derived(nonpacifist(A), [nonpacifist('nixon')])
searched(nonpacifist('ada'), [])
```

### 10.5 Call-fidelity certificates

`called(Call, Answers)` is a **call table**. Its shape and answer ordering
are those of `searched/2` ([Section 10.4](#104-search-certificates)), but it records a call made while
answering an original question, for C10 ([Section 11.13](#1113-c10-call-fidelity)). External goals
remain inputs to the checker: a call table cannot supply or specialize the
question a claim must answer.

Two calls identify the same call table only when they are identical up to
renaming **that preserves anonymous-variable status** ([Section 4.2](#42-controls)), including
inside nested compounds. There MUST NOT be two such tables. An anonymous
variable cannot be renamed to a named one, or vice versa, when comparing
call-table answers either. These restrictions matter because a named unbound
variable makes a negation an error. A malformed or duplicate call table
fails C3 as a malformed or duplicate search table does.

Call-table variables have their own naming scope. Writers name named
variables `A`, `B`, ..., counting variables in first-occurrence order, and
anonymous ones `_0`, `_1`, ... using their position in the same order.
For example, a named call returning an anonymous parameter may be:

```js
called(p(A), [p(_1)])
```

Each answer is freshened separately when used, as in [Section 10.4](#104-search-certificates). C10 call
tables and C9 search tables are distinct, even for textually identical calls.
They share any applicable `derived/2` listings, whose facts require steps.

## 11. Proof Checking

A checker establishes whether the proof's claimed answers follow from the
source program, with any assumptions reported as obligations. Its inputs
are the program, the proof document and, when the proof answers goals asked
from outside the program, those original goals. The source program is the
authority for clauses and questions; the proof supplies evidence to check.

There are three parts to that evidence:

| Evidence in the proof | What the checker establishes |
| --- | --- |
| `step(Goal, By, Bindings, Uses)` | Each recorded inference follows from its cited source clause, primitive or control, with justified premises and correct witnesses. |
| `searched(Call, Answers)` and `derived(Pattern, Facts)` | A negation's search has no solution, or a collection contains all its search results (C9). |
| `called(Call, Answers)`, sharing applicable `derived/2` listings | A claimed answer can result from the original question with its actual call-time bindings and control choices (C10). |

The tables and listings are statements **inside the proof document**, after
its steps ([Section 10.1](#101-structure)). They are checked claims about
search, not authority to invent answers. The `called/2` table used by C10
is distinct from the `called(Called)` justification of a state-test step
([Section 10.3](#103-steps)).

The checker MUST NOT call a reasoner to supply missing evidence. It MAY
recompute primitives and expand a call one level against the source
program, answering inner relation calls from the certificate. Each
consulted table is itself checked by this expansion; tables cannot justify
themselves through a cycle. Sections [11.12](#1112-c9-search-closure) and
[11.13](#1113-c10-call-fidelity) specify these checks.

The ten conditions answer different questions:

| Condition | Question |
| --- | --- |
| [C1 Resolution](#114-c1-resolution) | Is this step an instance of the source clause it cites? |
| [C2 Well-foundedness](#115-c2-well-foundedness) | Are the steps free of circular justification through their uses? |
| [C3 Justification](#116-c3-justification) | Is each statement and justification well formed? |
| [C4 Coverage](#117-c4-coverage) | Does every claim and premise have evidence? |
| [C5 Re-decision](#118-c5-re-decision) | Do primitives hold, and do control steps compose from their uses? |
| [C6 Boundary consistency](#119-c6-boundary-consistency) | Does available evidence contradict an unsettled negation or collection? |
| [C7 Relevance](#1110-c7-relevance) | Does the evidence serve the claimed answers to the program's questions? |
| [C8 Witness integrity](#1111-c8-witness-integrity) | Does each existential witness identify the correct rule firing? |
| [C9 Search closure](#1112-c9-search-closure) | Does the certificate establish the recorded negation or collection? |
| [C10 Call fidelity](#1113-c10-call-fidelity) | Can the original question return this answer, and is each of its answers claimed? |

C9 checks the search behind a recorded step; C10 checks the original call
before the proof's final bindings. This distinction matters for negation,
collection, `once` and tests of variable state. A specialized goal can
succeed even when the original open question would not return it
([Section 11.2](#112-operational-query-fidelity)). Every proof check
includes C10.

The checker records each failure with its condition, a detail and, where
there is one, the term concerned. Missing or unsupported search evidence
can instead leave an obligation. The verdict distinguishes these outcomes:

| Verdict | Meaning |
| --- | --- |
| `checked` | No condition failed and no obligation remains. |
| `checked_with_obligations` | No condition failed, but the claims depend on the reported obligations. |
| `failed(N)` | The checker recorded `N` failures. |

Strict checking forbids unresolved obligations. A `checked` verdict
establishes the claimed answers and that they are every answer of the
original questions, but not that the whole program terminates
([Section 11.1](#111-scope-of-a-valid-proof)).

### 11.1 Scope of a valid proof

A valid proof establishes that each claim follows from the source program
by the recorded steps, conditional on any reported obligations. A settled
boundary is established by its search certificate. An unconditional
`checked` verdict also establishes operational query fidelity
([Section 11.2](#112-operational-query-fidelity)) and **answer
completeness**: the claims include every answer of every original question
([Section 11.13](#1113-c10-call-fidelity)). Every question asked has a
certified answer set, and every answer in it is claimed.

For a program with negation, "follows" is relative to the facts the
certificate lists: C9 establishes that they are supported by steps, closed
under the forward rules and consistent with every settled negation. In the
ground relational fragment of [Section 11.13](#1113-c10-call-fidelity), a stratified or
chain-stratified program has only one such result ([Section 7.4](#74-negation-and-collection)). With restricted
witnesses, different lean results can have these properties. A claim whose
forward dependency closure includes a restricted rule with head-only
variables therefore retains a call-fidelity obligation, and a strict check
rejects it. Independent claims may still check strictly.

It does not establish:

- answer completeness for a halted proof, whose claims contain `'false'`;
- that the program derives no `'false'`;
- that execution of the whole program terminates or reaches every question;
- that the supplied program expresses the author's intended model.

A run's own proof contains exactly that run's conclusions. A proof that
omits an answer its certificate establishes fails C10. One without the
certificate to show its answers complete is valid only conditionally: an
empty proof establishes no answers and leaves each original question whose
answers need a call table as an obligation.

### 11.2 Operational query fidelity

**Operational query fidelity** means that the original question can return
the claimed answer under [Section 8](#8-evaluation-and-conclusions), with
the bindings, control choices and forward state applicable at its calls.
C10 checks this property. It concerns each claimed answer's reachability
in that question's ordered search, not whether the proof includes every
answer or whether execution reaches the question at all.

Proof steps show goals after the whole solution's bindings have been
applied ([Section 10.3](#103-steps)). Those final instances can hide a
different result at the original call. For example:

```js
fact(value('a'), value('b'))
implied_by(p(X), value(X))
implied_by(q(X), once(p(X)))
```

For the external question `q(X)`, `once(p(X))` selects `'a'`, so the only
answer is `q('a')`. But if the checker starts from the final instance
`q('b')`, the specialized call `once(p('b'))` succeeds. A derivation of
that specialized call can pass C1–C9 without showing that the original
question could return it.

Negation has the same problem with call-time bindings. Consider a separate
program:

```js
fact(p('a'))
implied_by(q(X), [not(p(X)), unify(X, 'b')])
```

The external question `q(X)` raises an error: `X` is still a named unbound
variable when `not(p(X))` runs. The specialized call `q('b')` succeeds,
but the later `unify` cannot retroactively bind the original negation.
Tests of variable state and collection likewise depend on their actual
calls ([Section 7.5](#75-sets-and-operational-behavior)).

A checker MUST NOT treat C7's instance test or C5's composition of a
`once` step as establishing the original call's result. To establish
operational query fidelity, it MUST validate the original call state,
propagation of bindings between ordered premises, freshening and scope,
and any first-solution choice or required search closure. These must follow
from the original question, source clauses and checked evidence. Generator
captures MUST remain independent of later caller bindings. The checker
MUST NOT invoke the reasoner to fill gaps.

C10 supplies this certificate check in [Section 11.13](#1113-c10-call-fidelity).
A C1–C9 verdict alone MUST NOT be presented as establishing operational
query fidelity. Fidelity alone does not establish answer completeness,
which C10 checks separately, avoidance of an earlier contradiction, or
termination of preceding questions.

### 11.3 Reading the document

The document MUST be read as data using [Section 9.1](#91-accepted-document-syntax),
without executing it. If it cannot be read, C3 fails and the document has no
claims and no steps. The reader classifies its statements as follows:

| Statement | Requirement | Failure |
| --- | --- | --- |
| `clause(N, Display)` | `N` names a source clause whose display is identical to `Display`, including variable names ([Section 10.2](#102-clause-displays)). | C1 |
| `step(Goal, By, Bindings, Uses)` | Bindings read as a list of `'='/2` pairs, as an object literal does; uses form a list; no other step has an identical goal. | C3; set the step aside |
| `searched(Call, Answers)` | `Call` is callable and `Answers` is an array; no other search table has the same call up to variable renaming. | C3; set the statement aside |
| `derived(Pattern, Facts)` | `Pattern` is callable and `Facts` is an array; no other listing names the same relation. | C3; set the statement aside |
| `called(Call, Answers)` | The call-table requirements of [Section 10.5](#105-call-fidelity-certificates) hold, including preservation of anonymous-variable status when detecting duplicates. | C3; set the statement aside |

Every other statement is a claim, wherever it occurs in the document
([Section 10.1](#101-structure)). Renaming variables in a clause display
does not make it identical to the source display.

### 11.4 C1 Resolution

C1 checks that the displayed inference is an instance of the source
clause. For a `clause(N)` step:

1. `N` MUST identify a clause of the program. A value such as `'x'` or
   `1.0` that is not a clause number fails C1.
2. Rename the source clause apart. Each binding MUST name a distinct
   variable of that clause and unify it with its displayed value.
3. One head of the clause MUST unify with `Goal`. For a forward rule,
   consider each conjunct of its head separately. The body MUST have the
   same length as `Uses` and unify with it pairwise, in order.
4. After these unifications, the head MUST be identical to `Goal`, and
   each body goal to its corresponding use. The step's own terms MUST NOT
   require further instantiation.

For example, a source clause `same(X, X)` cannot justify `same('a', 'b')`.
Identity also keeps the sign of zero: a fact `z(0.0)` cannot justify
`z(-0.0)`.

For a derived clause step, each enclosing generator MUST belong to the
program. Its bindings may name variables of those generators' scope
projections as well as of the clause itself. The checker renames these
projections together with the clause before applying the bindings.

For a `source(N)` step, `N` MUST identify an eligible source rule of [Section
6.3](#63-source-rule-inspection). Bindings and uses MUST both be empty. The rule's inspection term,
renamed apart, MUST unify with `Goal` and resolve exactly
to it without instantiating the step's own terms. This checks variable
sharing as well as the rule's direction and structure. The source rule is
read as data; its body is not derived by the checker. These steps count as
verified C1 steps and cite the usual source clause display.

### 11.5 C2 Well-foundedness

No step MAY depend on itself through the uses of steps. Even individually
valid clause instances cannot justify each other in a circle.

To find these dependencies, perform a depth-first walk starting from each
step not yet visited, in document order. Follow its uses in order to the
steps with those goals, following each conjunct of a conjunctive use
separately. Each use that leads back to a step on the current path is one
C2 failure, whose conclusion is the goal of that step. Circular search
tables are checked separately by C9 and C10.

### 11.6 C3 Justification

`By` MUST be one of the forms of [Section 10.3](#103-steps). The following
forms MUST have no bindings and no uses:

| `By` | Required goal |
| --- | --- |
| `'builtin'` | A primitive |
| `called(Called)` | A state test |
| `'absent'` | A negation `not(G)` |
| `'collected'` | A collection `findall(T, G, L)` |

A well-formed negation or collection step is called a **boundary**. A step
that fails C3 is not a trusted boundary: it counts in neither `trusted`, C6
nor C9. The checks for clause and source justifications are in C1; control
composition is checked by C5.

### 11.7 C4 Coverage

C4 checks that the proof has no missing premises:

- Each conjunct of each claim MUST have a step.
- Each use, and each conjunct of a use, MUST have a step or be identical to
  an instance of a source fact. Source facts can therefore serve directly
  as premises, but claims still require steps.

For a missing use, the failure's conclusion is the goal of the step that
uses it. A document without claims establishes no answers; it is valid if
no condition fails, and C10 decides whether it shows that the original
questions have none.

### 11.8 C5 Re-decision

C5 recomputes primitives and checks how control steps use their premises:

- **Primitive.** A `'builtin'` step's goal, solved as a primitive with no
  prior bindings, MUST succeed without binding anything.
- **State test.** For `called(Called)`, `Called` MUST have the goal's name
  and arity. Rename `Called` apart and solve it as a primitive with no
  prior bindings; it MUST succeed without binding anything. The displayed
  goal MUST be an instance of `Called`, so only variables the test leaves
  unbound may differ.
- **Control.** A `'control'` step MUST have no bindings. Its uses MUST be
  identical, in order, to the conjuncts of the argument of `call` or
  `once`, or of one side of a disjunction.
- **Strict checking.** When trusted boundaries are forbidden, each
  `'absent'` or `'collected'` step that C9 did not settle fails C5.

C5 checks the displayed primitive or chosen control branch. Whether a
state test actually ran with the claimed bindings, or `once` selected that
answer from the original open call, is checked by C10
([Section 11.13](#1113-c10-call-fidelity)).

Host math is the one exception to identical re-decision. A `'builtin'` step
`is(V, E)`, where `V` is a float and `E` applies `exp`, `log`, `log2`,
`log10`, a trigonometric or hyperbolic function, or `pow`, also passes C5
when `E` evaluates to a float at most 4 units in the last place from `V`,
that is, with at most 3 floats between them. Such results may differ between
conforming implementations ([Section 14](#14-conformance)). C5 therefore accepts this bounded
variation. C10 still compares actual answers of the original question;
when those answers depend on host math, a proof MAY fail C10 on another
implementation even when its primitive steps pass C5. Every other recomputed result MUST be identical; a difference
that grows beyond this bound, for example through cancellation, MAY make a
proof fail on an implementation other than the one that made it.

### 11.9 C6 Boundary consistency

C6 can refute an unsettled boundary using evidence already at hand. It
cannot establish that a search is complete. C9 checks boundaries whose
certificates settle or refute them; C6 checks the other well-formed
boundary steps ([Section 11.12](#1112-c9-search-closure)).

For a ground primitive, recompute whether it holds: the evidence is the
goal itself when it holds, and otherwise the fact that it fails. Controls
provide no evidence for this check and leave the boundary undecided. For
other goals, use the source facts and the document's step goals with the
same name and arity. Such a goal **has evidence** only if at least one
such fact or step exists. No evidence leaves the boundary undecided;
it does not establish absence.

- An absence `not(G)` is decided when `G` is a single goal, or a ground
  conjunction, whose every goal has evidence. It fails C6 when every goal of
  `G` unifies with some of its evidence; the anonymous variables of `G`
  unify with anything.
- A collection `findall(T, G, L)` fails C6 when `L` is not a list, and is
  decided when `G` is a single goal with evidence. It fails C6 when an
  instance of `T` for some evidence of `G` unifies with no element of `L`.

For example, evidence of `p('a')` refutes `not(p('a'))` and refutes
`findall(X, p(X), [])`. Merely failing to find evidence of `p('b')` does
not prove `not(p('b'))` by C6.

A trusted boundary that is not refuted remains an obligation. Even a
boundary that C6 has decided without finding a contradiction remains
conditional until C9 settles it ([Section 12](#12-check-reports)).

### 11.10 C7 Relevance

C7 checks that claims answer relevant questions and that evidence serves
those claims. When external goals were given and no claim is `'false'`,
the questions are those goals. Otherwise take, for each forward rule:

- each ordinary head other than `'true'`;
- its body as a conjunction when one head is `'true'` and no claim is
  `'false'`.

Each claim MUST be an instance of a question. This instance test alone
does not establish that an original question returns the claim; C10 checks
that separately.

Each step MUST be reachable from a conjunct of a claim through the
conjuncts of uses or, from a settled boundary, through facts in the listings
it rests on. Each table and listing MUST be consulted by a boundary's
search or closure check, or by the C10 check of a claim. Facts in listings
consulted by C10 are reachable through that evidence
([Section 11.13](#1113-c10-call-fidelity)).

### 11.11 C8 Witness integrity

A forward rule's head MAY contain variables its body does not contain.
Each such variable asserts existence and receives a Skolem term identifying
the firing ([Section 8.2](#82-forward-evaluation-and-witnesses)). C1 alone
would accept an arbitrary value for it. C8 checks that the value is the
specified witness and that its arguments come from the firing's evidence.

**Witness shape.** For a `clause(N)` step citing a forward rule, under the
substitution of C1, each head-only variable `V` MUST be bound to
`skolem(N, Name, Args)`, where:

- `Name` is the name of `V` as the program writes it ([Section 8.2](#82-forward-evaluation-and-witnesses));
- `Args` is the same for every such variable of the step, and is the list of
  the values of the heads' variables, in order of their first occurrence in
  the heads, omitting a value only when it holds a fresh parameter of this
  firing, as established below. The spelling of a Skolem term alone MUST
  NOT establish that it is fresh.

**Which values belong in `Args`.** A value containing
`skolem(N, _, Args)` is a **candidate** for omission.
Values of variables occurring only in the head hold the witnesses checked
above. If any other head variable's value is omitted, the checker MUST
establish its **parametric provenance**:

1. In the instantiated full head and premises, replace each distinct term
   `skolem(N, Name, Args)` by one fresh variable, using the same replacement
   throughout. Distinct such terms receive distinct variables, disjoint
   from all source and document variables. The abstracted head and premises
   together MUST still be an instance of the source clause, with all
   variable sharing preserved and without further instantiating their terms.
   A literal Skolem-shaped constant of the source is therefore fixed data,
   not a parameter the proof may abstract.
2. Each affected premise MUST have evidence under this same abstraction.
   Follow the recorded uses: backward clauses MUST still satisfy C1,
   inspection steps the source-instance check of C1, primitives C5, and
   controls the composition check of C5. An unrecorded source fact is
   available as in C4. A previously derived forward fact is fixed evidence:
   the abstracted premise MUST be an instance of that fact, allowing only
   its existing universal variables to be instantiated. Its ground terms
   MUST NOT be generalized. Each original step remains subject to its own
   checks, including C8 and C2; this traversal supplies no missing derivation.
3. Captured values and enclosing generator projections of a premise's
   derived backward rule instance are fixed before its use and MUST NOT
   change under abstraction. Likewise, this firing's captures MUST NOT
   change. A backward caller cannot make an earlier firing's data fresh.
4. An unchanged boundary may use its original evidence or obligation. A
   changed boundary MUST already be settled in its original form, and its
   abstracted form MUST also be settled by [Section 11.12](#1112-c9-search-closure), consulting only
   tables and listings the original boundary rests on. A missing or
   incomplete certificate fails provenance; an obligation for a specific
   boundary MUST NOT silently become an obligation for a stronger one.

Failure of this provenance check is C8, not C1: the original step may be a
valid clause instance while proposing the wrong witness context. Provenance
rechecks do not add steps or change the C1, C5 or C9 counts. They establish
that the displayed firing's evidence permits fresh parameters, not that the
firing is the one an original open call would select ([Section 11.2](#112-operational-query-fidelity)).

**Groundness.** When a forward clause has head-only variables, its full
head under the step's substitution MUST be ground. A step that leaves such
a variable unbound, or bound to anything but its Skolem term, fails C8
rather than C1. A generic inspection pattern cannot share one existential
witness across all its instances ([Section 6.3](#63-source-rule-inspection)).

**Generators and captures.** For a generator, use its scope projection
([Section 6.2](#62-inline-rule-templates)) as the head for this
check. For every derived clause step, including a backward clause step, the
checker MUST also perform C8 for each enclosing generator under the same
substitution. A forged outer witness cannot be authorized by using it in a
backward conclusion. Variables supplied by the instance's captures are not
new witnesses of the derived clause.

For an appended forward clause of [Section 6.2](#62-inline-rule-templates), prepend the capture list,
instantiated under the step's substitution, as one element of `Args`, as
required by [Section 8.2](#82-forward-evaluation-and-witnesses). The checker MUST compute this from the source
template's capture list and the substitution, not from the witness term.

**Coverage.** A variable of the head that also occurs in the body is not
checked by C8, even when the body leaves it unbound; its value comes from
the uses, which other conditions check. Its effect on a head-only
variable's witness context is nevertheless subject to the provenance check
above. A step with no witnesses in its own forward head or enclosing
generators is not covered by C8.

### 11.12 C9 Search closure

C9 establishes that a recorded negation or collection has the stated search
result. A step's uses alone cannot show that nothing matches, or that no
result was omitted. The **search certificate** supplies complete answer
tables and forward-fact listings for the checker to validate
([Section 10.4](#104-search-certificates)):

| Statement in the proof | Claim to check |
| --- | --- |
| `searched(Call, Answers)` | These are all answers to this call, in search order, repetitions included. |
| `derived(Pattern, Facts)` | These are the forward-derived facts for this relation; each has evidence, and none required by closure is omitted. |

A boundary is **settled** only when the certificate is supported, complete
for its search, applicable under the restrictions below, and agrees with
the boundary's result. C9 checks the goal as displayed in the step. C10
separately checks the bindings with which the original question called it.

**Answering calls from the certificate.** Search the boundary's inner goal
`G` according to [Section 8.1](#81-goal-search), with these changes:

- Answer a relation defined by backward rules or concluded by forward
  rules from the `searched/2` table whose call is identical up to variable
  renaming. Rename each answer apart before using it.
- Answer a relation defined by source facts alone from those facts, in
  clause order; it needs no table.
- Inside this search, negation treats unbound variables as anonymous.
  This does not establish that a named variable was bound at the original
  call; that is a C10 requirement.

**Expanding and checking tables.** The **expansion** of a call is one level
of the search of [Section 8.1](#81-goal-search): try its relation's listed
forward facts in listing order, then source facts and backward rules in
clause order. Search each rule's body in its place, answering inner calls
as above. Each table MUST equal its expansion: the same number of answers,
each identical up to variable renaming to the answer in the same position.

The boundary **rests on** every table and listing its search consults,
including those consulted transitively by table expansions and listing
closure checks. No table it rests on may depend on itself through the
tables consulted by its expansion.

**Supporting and closing listings.** Every listed fact MUST have a step,
have the listing's name and arity, and be ground. Its step is subject to the
other proof conditions. A listing is **closed** when, for every forward
rule with a head of its relation, each solution of the body under the
certificate gives head instances that are listed or are ground source
facts. Bind the rule's witnesses to their specified Skolem terms when
checking this closure ([Section 8.2](#82-forward-evaluation-and-witnesses)).

Support rules out invented facts; closure rules out omitted facts. For
example, an empty answer table is insufficient if a forward rule could
derive a matching fact left out of the listing.

**Comparing the result.** With all relied-on evidence checked, settlement
requires:

- For `not(G)`, `G` has no solution.
- For `findall(T, G, L)`, `L` is an instance of the list of instances of
  `T`, one per solution of `G`, in order, each renamed apart. Repeated
  solutions remain repeated list elements. The instance test allows later
  goals to have bound variables in the copied results.

**Certificate limits.** Settlement also requires all of the following:

- No collection or `once` in the boundary's search, a relied-on table or a
  closure check uses a table whose answers rest on a forward listing.
  This format checks support and closure of derived facts, but cannot
  establish their publication order for order-sensitive operations.
- The search reaches neither source inspection nor a clause appended by
  a template.
- No consulted listing's relation is concluded by a forward rule with a
  template head or captures ([Section 6.2](#62-inline-rule-templates)).

For example, the saved
[Nixon diamond proof](https://eyereasoner.github.io/eyemind/examples/proof/nixon-diamond.js)
contains this step and certificate:

```js
step(not(nonpacifist('ada')), 'absent', {}, [])

derived(nonpacifist(A), [nonpacifist('nixon')])
searched(nonpacifist('ada'), [])
```

The table expands to no answers: the listed fact does not match Ada and no
backward rule defines `nonpacifist/1`. The only forward rule for that
relation derives Nixon's fact, which is listed and has a step elsewhere in
the proof. Thus the listing is supported and closed, and the negation is
settled. Replacing the listing with `[]` would fail closure.

For a backward-defined relation `p/1` whose ordered answers are `p('a')`
and `p('b')`, a collection can instead have these entries:

```js
step(findall(A, p(A), ['a', 'b']), 'collected', {}, [])

searched(p(B), [p('a'), p('b')])
```

The checker expands `p(B)` against its source definition to validate the
table, then copies the template once per answer and compares the resulting
`['a', 'b']` with the step's list.

**Failures and obligations.** The checker distinguishes a false certificate
from evidence that cannot settle the boundary:

| Finding | Result |
| --- | --- |
| A table differs from its expansion; a listed fact lacks a step or has the wrong name or arity; a listing is not closed; tables are circular; the certificate's search raises an error; or the checked search finds a solution to a negated goal. | C9 fails. |
| A needed table or listing is missing, evidence is incomplete, or a certificate limit above applies. | The boundary is not settled. |
| A collection's list disagrees with the certificate's search results. | The boundary is not settled; C6 may refute it from available evidence. |
| A listing contains a nonground fact. | At the first such fact in listing order, leave the boundary unsettled rather than fail it. |

An incorrect table or listing is reported once, for the first boundary
resting on it. Any boundary C9 did not settle counts as trusted, including
one that failed C9; this count does not cancel the failure. C6 confronts
boundaries C9 neither settled nor refuted. An unresolved boundary remains
an obligation, and strict checking rejects it.

A collection mismatch alone is left unsettled because a step shows the
goal after the whole solution's substitution; later bindings may have
specialized the goal that was actually searched. C10 checks collection
against the original call and cannot use that final substitution to
specialize the question.

### 11.13 C10 Call fidelity

C10 checks that the original question can return each claimed answer. It
uses `called(Call, Answers)` tables in the proof, distinct from C9's
`searched/2` tables. Both checks share applicable `derived/2` listings.
Every proof check includes C10; unresolved evidence leaves a call-fidelity
obligation rather than an unconditional `checked` verdict.

**Selecting the original questions.** Use the external goals, if any.
Otherwise, if any forward rule has a head `'true'`, use those rules' bodies
as conjunctions. Otherwise use the ordinary forward heads, excluding
`'false'`. Do not instantiate these questions with the proof's final
bindings. Every question needs a certificate, including one of which no
claim is an instance: its answers must still be shown to be claimed.

When the claims contain `'false'`, C10 is inapplicable: it covers no
answers and adds no call-fidelity obligations for that halted proof.
A proof without claims certifies that a question has no answers only
through that question's certificate.

**Checking calls.** For each relevant original question, use the one-level
expansion and closure checks of [Section 11.12](#1112-c9-search-closure),
with these differences:

1. Inner relation calls use `called/2` rather than `searched/2`. Call and
   answer comparison preserves anonymous-variable status ([Section 10.5](#105-call-fidelity-certificates)).
   Facts alone and primitives need no table, as in C9. Source clauses,
   freshened apart, determine the bindings passed between ordered premises;
   the final values displayed by a logical step are not inputs to that search.
2. Negation MUST enforce [Section 4.2](#42-controls)'s binding restriction at the actual
   call. C9's treatment of an unbound named variable as anonymous MUST NOT
   be used. A source search that raises an error fails its certificate.
3. `once` and `findall` keep their [Section 4.2](#42-controls) meanings, so the first answer
   or collected answers come from the actual inner call. [Section 11.12](#1112-c9-search-closure)'s
   restriction on order-sensitive uses of derived listings still applies.
   The order of unrelated answers of an ordinary question need not be
   established to check membership of a claim.
4. A comparison `compare/3` with either compared term nonground is not
   supported by this certificate format: alpha renaming of a table need
   not preserve the order of variable names. Such a search leaves call fidelity unproved.
5. A consulted forward listing MUST have a dependency closure in the
   supported fragment described below. A final listing alone MUST NOT certify
   binding-sensitive or order-sensitive forward firings outside that fragment.

For the `once` example in [Section 11.2](#112-operational-query-fidelity),
the call certificate contains:

```js
called(q(A), [q('a')])
called(p(B), [p('a'), p('b')])
```

The checker validates the first table by expanding the original question
`q(X)` using the source rule. Its inner call is `p(X)` with `X` unbound.
The second table, checked against `p`'s source definition, supplies `'a'`
first, and `once` selects it. Thus `q('a')` is an answer and `q('b')` is
excluded. Substituting `called(p('b'), [p('b')])` cannot establish the
different call `p(X)`.

**Supported forward listings.** A listing supports C10 when a search of
each rule body it depends on, in source order, finds exactly the ground
instances of that body that hold. Its steps, whose primitives C5 re-decides
on their ground instances, then show firings that a search makes. This holds
when no goal can observe the bindings or the order in which it runs. The
checker establishes it by a **mode analysis** of the rules the listing
depends on. A **mode** of a call gives, for each argument, whether it is
ground when the call runs: an argument is ground when every variable in it
is **grounded** at that point.

The analysis starts from the listed relation and its forward rules, and
follows each ordinary body call, inside a negation or not, to the called
relation in the mode of that call: its forward rules once, and its backward
rules once in each mode. A forward rule's body starts with no grounded
variable. A backward rule's body starts with the variables of the head
arguments that are ground in the mode. Body goals are taken in order, each
with the variables grounded before it:

- `'true'` grounds nothing. Conjunction accumulates the grounded variables
  of its parts. Disjunction grounds only those grounded by both
  alternatives. `call(G)` is `G`.
- A call to an ordinary relation grounds its variables when every source
  fact of the relation is ground once the arguments ground in the mode are
  unified with it, and the relation is not **loose** in that mode;
  otherwise it grounds nothing.
- A negation grounds nothing. Each of its variables other than anonymous
  ones MUST be grounded before it, and it MUST NOT contain a negation.
- `once(G)` grounds nothing. `G` MUST satisfy these conditions. Each named
  variable of `G` that occurs elsewhere in the clause MUST be grounded before
  it, so the choice of a first answer binds nothing another goal uses.
- `findall(T, G, L)` follows the same rule for `T` and `G`. It grounds the
  variables of `L` when `G` grounds every variable of `T`.
- A primitive whose variables are all grounded before it is a test, and
  grounds nothing. `unify/2` with one side ground grounds the other, and
  with neither ground grounds nothing. Otherwise the primitive MUST be
  called in one of the modes below, its input arguments ground, and it
  grounds its variables.
- Source inspection, templates, captures and restricted rules are not
  supported. A restricted rule's guard is a negation, but which firings the
  rule makes can depend on the order of rule applications.

After its body, every head variable of a forward rule MUST be grounded or
be a head-only witness checked by C8. If a head variable of a backward rule
is not grounded, the relation is loose in that mode, and the analysis
starts again with that call grounding nothing.

| Primitive | Inputs → outputs |
| --- | --- |
| `is/2` | expression → result |
| `compare/3` | both compared terms → order |
| `atom_chars/2`, `atom_codes/2` | atom → list, or list → atom |
| `number_chars/2` | list → number |
| `atom_length/2`, `atom_lower/2`, `atom_upper/2`, `term_text/2` | first → second |
| `atom_concat/3` | both parts → whole, or whole → both parts |
| `regex_find/3`, `digest/3` | first two → third |
| `float64/4` | first three → fourth |

In each listed mode, a call with ground inputs has exactly the solutions
whose ground instances C5 re-decides as holding. `number_chars/2` re-decides
a ground instance by reading its characters, so only that direction is
listed. A host-math result accepted by C5 only within its tolerance
([Section 11.8](#118-c5-re-decision)) need not be the result a search
finds. A proof with such a step therefore supports no listing for C10 by
this analysis.

**Replayed listings.** A listing the mode analysis does not support still
supports C10 when every fact of every consulted listing **replays**. A fact
replays when its step cites a forward rule, other than a template, a rule
with captures or a restricted rule, and a search of that rule's body in
source order, starting with no bindings, solves each body goal as the
step's corresponding use records:

- A primitive runs on the bindings of that point of the search. Its first
  solution under which the goal can still unify with the use is taken.
  `compare/3` with a nonground compared term does not replay.
- `once/1`, `not/1` and `findall/3` take the answers of the goal, as it
  stands at that point, from the call tables and listings, as in checking
  the original calls. A negation with an unbound named variable does not
  replay, and neither does a first answer or a collection whose order rests
  on a listing. The first answer is taken, and the goal MUST still unify
  with the use.
- `call/1` and a disjunction replay the goals their `'control'` step uses,
  for a disjunction from the side those uses form.
- A call to an ordinary relation follows the use's step. A forward rule's
  conclusion MUST itself replay, and is then unified with the goal. A
  source fact, renamed apart, is unified with the goal. A backward rule,
  renamed apart, has its head unified with the goal and its body replayed
  against its step's uses. A use with no step is unified with a source fact
  of the relation, renamed apart. A replay that meets the same use under
  the same call again does not replay.
- After each goal, the goal MUST still unify with its use, since a step
  shows its goals after the whole solution's bindings.

Each witness is then bound to its Skolem term
([Section 8.2](#82-forward-evaluation-and-witnesses)), and the fact MUST be
identical to an instance of one of the rule's heads. Replay re-executes each
recorded firing, so a test of whether a variable is bound sees what a search
sees, a first answer is the search's first answer, and host math is
computed rather than accepted within a tolerance. C2 keeps the steps a
replay follows acyclic.

Supported facts and closed listings then establish the least ground
closure and, with negations, a set of facts that is supported, closed under
the rules and consistent with each negation, every negation being decided
by the listed facts alone. A stratified or chain-stratified program has
exactly one such set ([Section 7.4](#74-negation-and-collection)), its
result, so the listings are the facts the original calls consult. A
collection or first answer over facts that forward rules derive depends on
their publication order, which this format does not establish, and a
restricted rule's firings can depend on the order of rule applications:
both leave call fidelity unproved.

**Deciding claims.** Every relevant call certificate MUST be valid. Each
claim MUST be identical, up to variable renaming, to an answer of at least
one corresponding original question. Being an instance of a more general
answer is insufficient: a claim `p('a')` cannot replace an original call's
actual universal answer `p(A)`.

For each claim, apply these outcomes:

| Evidence for matching original questions | C10 result |
| --- | --- |
| Any corresponding question has a false certificate. | Fail the claim once. |
| No corresponding certificate is false, and at least one complete certificate returns the claim up to renaming. | Establish call fidelity for the claim. |
| Every matching question has a complete certificate, and all exclude the claim. | Fail the claim once. |
| No certificate establishes the claim, and an applicable certificate is missing, incomplete or unsupported. | Leave `obligation('call_fidelity', 'original_call', Claim)`. |

An unresolved alternative question leaves an obligation unless another
question certifies the answer. With no applicable complete certificate,
call fidelity also remains an obligation. When trusted obligations are
forbidden, each such obligation fails C10. C10 does not discharge C6/C9
obligations: both the recorded boundary and the original call need their
respective evidence.

**Answer completeness.** A valid certificate for an original question
gives all of its answers, so C10 also checks the converse: each answer is
claimed. The **required answers** of a question are its certificate's
answers when the conclusions answer goals or `query()` rules. When the
conclusions are the derived facts ([Section 8.6](#86-reported-conclusions)),
they are the facts of the question's relation in its consulted listing
that are instances of the question, since a source fact or a backward
answer is no derived fact. For each original question, in question order:

| Evidence for the question | C10 result |
| --- | --- |
| Its certificate is false. | Fail the question once, unless a claim that is an instance of it already failed for that certificate. |
| Its certificate is valid and complete, and every required answer is identical, up to renaming, to a claim. | Establish answer completeness for the question. |
| Its certificate is valid and complete, and a required answer is not claimed. | Fail once for each required answer not claimed. |
| Its certificate is missing, incomplete or unsupported. | Leave `obligation('call_fidelity', 'all_answers', Question)`. |

For example, with `fact(p('a'), p('b'))` and `query(p(X))`, a proof that
claims only `p('a')` fails C10 for `p('b')`, though `p('a')` follows. With
`implied_by(r(X), p(X))` and `query(r('c'))`, the proof without claims
holding `called(r('c'), [])` establishes that the question has no answers;
an empty document leaves `r('c')` as an obligation. A question answered
from source facts alone needs no table, so its required answers come from
the facts.

**Limits and production of certificates.** The current format requires
complete tables, even for a relation called under `once`. Later recursion
or an error may prevent a table from closing although `once` itself
terminates. A certificate for just the searched prefix is not defined, so
call fidelity then remains unproved.

A reasoner MUST attempt call-fidelity certification for every proof it
generates ([Section 8.7](#87-proof-generation)). It MAY bound this auxiliary
production. Exceeding that bound leaves an obligation and MUST NOT change
the run's answers. The bounds are outside conformance, so conforming
reasoners may differ in which generated claims carry call-fidelity
obligations. eyemind bounds this work per question by the smaller of
`max_inferences` and 50,000 calls plus answers, and by 8,388,608 UTF-16 code
units of answer text.

**Relevance and counts.** Call tables and their supporting listings serve
the claims for C7; their listed facts are reachable through that evidence.
C10 does not change C1–C9 covered counts. Its own covered count includes
claims whose call fidelity is established or refuted and questions whose
answer completeness is established or refuted, excluding unresolved ones.
Report failures in claim order, then in question order, after checking
boundaries and before C7 and C2 ([Section 12](#12-check-reports)).

These checks establish that the claims are exactly the answers of the
original questions, up to renaming. They do not establish that preceding
distinct questions terminated.

### 11.14 Counts and validity

The report distinguishes how many items a condition covered from how many
failures it found. A zero failure count does not by itself establish a
negation, collection or original call that remains an obligation.

| Condition | Covered |
| --- | --- |
| C1 resolution | `clause` and `source` steps that passed C1 |
| C2 well_founded | steps |
| C3 justification | steps |
| C4 coverage | claims plus uses |
| C5 re_decision | `'builtin'`, `called(Called)` and `'control'` steps that passed C5 |
| C6 boundary_consistency | boundaries not settled that the evidence decided |
| C7 relevance | claims plus steps |
| C8 witness_integrity | `clause` steps with witnesses in their forward head or enclosing generators that passed C8 |
| C9 search_closure | boundaries their search certificate settled or refuted |
| C10 call_fidelity | claims whose call fidelity, and questions whose answer completeness, is established or refuted |

A check also records these totals:

- **steps**: the steps it read;
- **claims**: the claims it read;
- **verified**: the `clause` and `source` inspection steps verified by C1;
- **recomputed**: the `'builtin'` and `called(Called)` steps that passed C5;
- **composed**: the `'control'` steps that passed C5;
- **trusted**: the `'absent'` and `'collected'` steps C9 did not settle,
  plus each claim whose call fidelity and each question whose answer
  completeness remains unproved by C10.

A proof is **valid** when no condition failed. It is valid *conditional on*
any obligations that remain. Section [12](#12-check-reports) specifies the
report format and verdict; strict checking forbids those obligations.

## 12. Check Reports

A check report is a document ([Section 9.1](#91-accepted-document-syntax)) beginning with the proof's claims,
in proof order, in canonical text, one per line, followed by a blank line and
the following report facts, one per line:

1. `condition(Id, Name, Outcome, Covered)` for C1 to C10, where `Outcome` is
   `'ok'` or `failed(N)`, `N` the number of that condition's failures;
2. `failure(Condition, Subject, Detail)` per failure, where `Subject` is the
   term concerned or `'proof_document'`, and `Detail` an atom;
3. `obligation(Kind, 'theory_scoped', Goal)` per trusted boundary, in step
   order, where `Kind` is `'absent'` or `'collected'`, followed by
   `obligation('call_fidelity', 'original_call', Claim)` per unresolved claim,
   in claim order, then `obligation('call_fidelity', 'all_answers', Question)`
   per question whose answer completeness is unresolved, in question order;
4. `steps(N)`, `verified(N)`, `recomputed(N)`, `composed(N)`, `trusted(N)`,
   `claims(N)`, the counts of [Section 11.14](#1114-counts-and-validity);
5. `verdict(V)`, where `V` is `failed(N)` when `N` failures were recorded,
   otherwise `'checked_with_obligations'` when there are obligations,
   otherwise `'checked'`.

Comments MUST identify these initial terms as checked answers only when the
report is valid with no obligations. A valid report with obligations MUST
label them as conditional on those obligations. A failed report MUST label
them as unverified claims; their inclusion does not validate them. A valid
report with no claims MUST say it establishes no conclusions, unless it is
valid with no obligations: it then establishes that the original questions
have no answers. Comments also explain the C1-C10 order, failures and
obligations when present, the statistics, and whether the verdict
establishes that the claims are every answer. Comments are informative
and MAY be worded differently. They are ignored when the document is read.

Failures are listed in the order they are found: those of reading the
document ([Section 11.3](#113-reading-the-document)), in document order; C4 for each claim, in claim
order; then for each step, in document order, C4 for its uses and the C1, C3,
C5 or C8 failure of its justification; for each boundary, in step order, the
C9 failures of its search certificate in the order found, or else its C6
failure; C10 for each claim, then for each question; C7 for each claim, then
for each step, then for each table and listing, in document order; and C2.

`Detail` is informative text identifying what failed; its wording is not
specified. It MUST NOT affect validity, counts or the condition reported.

The initial answers keep the variable names of the proof. The variables of
each subsequent report fact are renamed `A`, `B`, ..., `Z`, `A1`, ... in order
of first occurrence. A report is ordinary data: `facts_from` ([Section 3.4](#34-statements))
states it as facts.

### 12.1 JSON form

The JSON form includes `answers`, an array of the initial claims' canonical
texts, including unverified claims when `valid` is false. It also has `valid` (boolean), `steps`,
`claims`, `verified`, `redecided` (the count `recomputed`), `composed`,
`uses` (the number of uses of all steps, integers), `trusted`
(a list of `{kind, conclusion, reason?}`, with `reason: 'original_call'`
for a claim's call-fidelity obligation and `reason: 'all_answers'` for a
question's answer-completeness obligation), `failures` (a list of
`{condition, detail, conclusion?}`) and `conditions` (a list of
`{id, name, covered, failed}`), where `conclusion` is a canonical text.
Its variables keep the names the document gives them, rather than being
renamed for each report fact as in the text form.

## 13. Command-Line Interface

### 13.1 Invocation and options

```text
eyemind [OPTION ...] [FILE ...]
```

| Option | Meaning |
| --- | --- |
| (none) | Load the files, or standard input, as one program and print its conclusions. |
| `-p`, `--proof` | Print the proof document instead. |
| `-c`, `--prove-and-check` | Generate a proof, check the rendered proof against the input program, and print its answers and check report. |
| `--check-proof FILE` | Check the proof in `FILE` (`-` for standard input) against the program and print its answers and report. |
| `--json` | With either checking mode, print the report, including `answers`, as JSON. |
| `--goal GOAL` | Ask `GOAL`, read as in [Section 9.1](#91-accepted-document-syntax), where an array is a conjunction; MAY be repeated. With `--check-proof`, the goals the proof answers. |
| `--strict-proof` | With either checking mode, forbid trusted obligations. |
| `--unused` | Print the unused clauses ([Section 13.2](#132-unused-clauses)). |
| `--stats` | Print reasoning statistics as JSON to standard error: `inferences`, the goals started, which `--max-inferences` bounds; `rounds`, the forward rounds run over all strata; and `derived`, the facts forward rules added, not counting a conclusion the program states as a fact, a query's answers or `'false'`. |
| `--max-depth N`, `--max-iterations N`, `--max-inferences N` | The bounds of [Section 8.3](#83-resource-bounds), with the values it allows. |
| `-v`, `--version` | Print the version. |
| `-h`, `--help` | Print the usage, including every option and its short alias where one exists. |

`--proof`, `--prove-and-check`, `--check-proof` and `--unused` are mutually
exclusive. `--json` and `--strict-proof` need a checking mode. With
`--prove-and-check`, reasoning bounds and `--stats` apply to proof generation;
an invalid check returns 2, otherwise the run's halt code is retained
(65 for a contradiction, 0 otherwise). A program
text that has a line starting with `step(` or `called(` is a proof document; given one as
a program, the command line MUST say how to check it instead.

Files are programs ([Section 3](#3-program-syntax)) unless an
implementation reads other formats. eyemind reads files by their extension:
`.ttl`, `.trig`, `.nt` and `.nq` as RDF 1.2 data, joining a program as
`rdf(S, P, O, G)` facts, `.n3` as Notation3 and `.srl` as a SPARQL 1.2 RL rule
set, both compiled to a program, with the options `--to FORMAT` (the output
format of the conclusions), `--all`, `--program` and `--base IRI`; its README
describes the mappings. Such formats are outside conformance: a conforming
implementation need not read them, and the suite does not test them. The
proofs and checks of a compiled program are those of any program.

For N3 and SRL inputs, `--proof` writes native proof data, `.n3` and `.srl`
respectively. This is an additional representation of the complete proof of
[Section 10](#10-proof-documents), outside conformance. JavaScript programs and the core library
continue to write the canonical representation. `--check-proof` recognizes
all three representations from their contents, regardless of filename;
check reports retain the representation of [Section 12](#12-check-reports).

The native proof resource is `<urn:eyemind:proof>`, of type `pe:Proof`, where
`pe:` is `https://eyereasoner.github.io/pe#` and `em:` is
`https://eyereasoner.github.io/eyemind/proof#`. It has `em:format` equal to
`"n3"` or `"srl"`, `pe:claims` as an ordered collection of claim displays,
and `em:records` as an ordered collection of record IRIs. Record `N`, counted
from 1, is `<urn:eyemind:proof#recordN>` and has one `em:term` containing its
[Section 10](#10-proof-documents) statement, encoded as a tagged collection:

| Term | Collection |
| --- | --- |
| Atom | `(em:atom "text")` |
| Integer | `(em:integer "digits")`, with a minus for a negative integer |
| Float | `(em:float "number")`, preserving signed zero as `"-0"` |
| Variable | `(em:variable "name")`, including anonymous-variable status |
| `iri(I)` with an RDF-compatible IRI | `(em:iri <I>)` |
| Nonempty proper list | `(em:list (EncodedItem ...))` |
| Compound | `(em:compound "name" (EncodedArgument ...))` |

The empty list is the atom `"[]"`. Other compounds, including open lists,
quoted graphs and Skolem terms, use the compound encoding. A string field
containing a character RDF cannot represent uses an `em:utf16` typed literal
whose lexical form is four lowercase hexadecimal digits per UTF-16 code
unit. This retains every atom and variable name accepted by
[Section 9.2](#92-canonical-atoms-numbers-variables-and-lists).

A triple goal's display is an N3 quoted formula, or an SRL RDF triple term.
Other goals use their tagged encoding. A step record also displays
`pe:conclusion`, `pe:rule` for a `clause(N)` justification, `pe:source` for
`source(N)`, or `pe:justification` for another justification. `pe:binding`
is an ordered collection of `(VariableName Value)` pairs, and `pe:uses` an
ordered collection of premise displays. Non-native binding values retain
their tagged encoding. Search records display `pe:derived`, `pe:searched`
or `pe:called` and an ordered `pe:answers` collection. Clause numbers name
the compiled program's clauses, whose authority is still the source input.
SRL proofs contain only `DATA` and declarations, never rules or imports.

When an SRL rule set uses `NOW`, `UUID` or `STRUUID`, its compiled program
includes one ground `srl_execution(Now, Seed)` fact. `Now` is an ISO UTC
timestamp with milliseconds and `Seed` contains 64 lowercase hexadecimal
digits. The compiler captures these external inputs once per compilation;
they remain fixed throughout evaluation. To check a saved SRL proof, the
format loader may recover this fact from its clause records, validate its
two fields, and recompile the source with that execution context. All other
clauses still come from the source, and all displays undergo C1–C10 as
usual. This establishes consequences of the recorded context, without
certifying a clock observation or the entropy of the seed.

The reader decodes every record, verifies all displays and properties against
those records, and applies the unchanged checks of
[Section 11](#11-proof-checking) to the decoded
certificate. A missing, extra, duplicate or inconsistent property fails C3.
Numeric literal displays retain their decimal digits during this comparison;
distinct decimal literals MUST NOT agree merely by rounding to binary64.
Prefix aliases and reordering top-level properties are accepted, as is
consistent blank-node renaming; the order of collections and formula triples
is retained. Displayed claims cannot replace encoded claims, and neither
representation can change the source authority or supply missing evidence.

eyemind also reads RDF Message Logs in these four RDF syntaxes, announced by
a `*-messages` version. Replay supplies ordered envelopes and quoted payloads
to N3 or JavaScript rules; `--stream-messages` evaluates each message
independently and supports incremental Node input. Replay can produce and
check ordinary eyemind proofs. The streaming mode rejects proof generation,
proof checking, `--program` and `--unused`. These mappings and this option
are also outside conformance; the README describes their supported behavior.

| Exit code | Meaning |
| --- | --- |
| 0 | Success, including a check that found the proof valid. |
| 1 | An error, printed to standard error as `eyemind: message`. |
| 2 | A check that found the proof not valid; the report is printed as usual. |
| 65 | The run halted ([Section 8.5](#85-contradictions)). |

### 13.2 Unused clauses

A clause is **unused** when no conclusion's recorded derivation cites it,
unless a negation or collection in the proof could consult it and its
omission changes the conclusions or halt code, or causes an error. The clauses a
negation or collection could consult are those whose heads have the name and
arity of a goal it reaches through the program's bodies. Running the program
without a clause leaves every other clause its number ([Section 3.5](#35-clause-constraints-and-numbering)), so the
Skolem terms of the other rules ([Section 8.2](#82-forward-evaluation-and-witnesses)) do not change.

Unused clauses are reported one per line, in clause order, as
`unused(line(L), Display)`, where `L` is the clause's line ([Section 3.5](#35-clause-constraints-and-numbering)) in
the script that states it, and `Display` as in [Section 10.2](#102-clause-displays); with several
scripts, clause order tells which script a line belongs to. The listing is
the result whether or not the program halts with `'false'`, and the command
exits with code 0 after it.

"Unused" is relative to the recorded derivations, which are the first ones
found ([Section 8.7](#87-proof-generation)). A clause that only offers a second derivation of a
conclusion, such as a duplicate rule, is unused, though leaving out the
clause that offers the first one would make it used; leaving out several
unused clauses together can therefore change the conclusions. A
`contradiction` rule that never fires changes no conclusion and is unused,
though it guards the program against data that would make it fire; so are
the clauses only its negations or collections could consult, since they are
not in the proof.

## 14. Conformance

A conforming reasoner MUST implement the program syntax, semantics and
evaluation of Sections [2](#2-terms)–[8](#8-evaluation-and-conclusions) and the document and proof formats of Sections
[9](#9-document-syntax-and-canonical-text)–[12](#12-check-reports). A conforming checker MUST implement Sections [9](#9-document-syntax-and-canonical-text)–[12](#12-check-reports) against the supplied
program, including the clause and template rules of Sections [3](#3-program-syntax) and [6](#6-rule-structure),
without invoking a reasoner to complete the certificate. The command-line
interface of [Section 13](#13-command-line-interface) is a separate conformance requirement.

Canonical term spelling, conclusion order, proof contents and report counts
are required as specified. Comment wording and failure `Detail` text are
informative. Fresh variable names are unspecified where [Section 2.4](#24-standard-order) says
so. Float results of `exp`, logarithms, trigonometric and hyperbolic
functions, and `pow` with floats MAY differ by one unit in the last place,
and C5 accepts a result of such a function within 4 units ([Section 11.8](#118-c5-re-decision)).

The conformance cases and saved example documents exercise these
requirements. They do not replace the definitions in this specification.

### 14.1 Conformance test suite

The conformance test suite tests an implementation of the command line of
[Section 13.1](#131-invocation-and-options) as a black box: each case creates files, runs the command and
compares its exit code and output with what this specification requires.
The suite is the `conformance` directory of the eyemind repository. Its
expected outputs are derived from this specification; where a case and this
specification disagree, the specification governs and the case is wrong.

**Manifest.** `manifest.json` is a JSON array that lists the case files in
the order they run. Each element is an object with three string members:
`file`, the name of a case file in the same directory; `spec`, the sections
of this specification it tests, separated by commas; and `topic`, a
description. The cases of a file run in the order they appear in it.

**Case files.** A case file is a document ([Section 9.1](#91-accepted-document-syntax)), read as data and
never executed, whatever its file name extension. Each of its terms is one
case, `conformance(Name, Settings)`, where `Name` is an atom unique in the
suite and `Settings` is a proper list of the settings below. A **block** is a
proper list of atoms, each one line; its text is each line followed by a
line feed, so `[]` is empty text. A file MUST NOT contain any other term,
and a setting other than these is an error in the suite.

| Setting | Meaning | When absent |
| --- | --- | --- |
| `spec(S)` | `S`, an atom: the sections the case tests, separated by commas. | |
| `args(A)` | `A`, an atom: the command's arguments, split into words as described below. | `'program.js'` |
| `exit(N)` | `N`, an integer: the exit code required. | `0` |
| `stderr(M)` | Standard error: `'empty'`, no text; `'nonempty'`, some text other than white space; `'json'`, one JSON value; `prefix(T)`, text that starts with the atom `T`. | Not compared |
| `file(Name, Block)` | A file the case creates before running; `Name` is a relative path whose `/` separates directories. | |
| `stdin(Block)` | Standard input. | Empty |
| `stdout(Block)` | Standard output, compared line by line. | Not compared |
| `stdout('nonempty')` | Standard output contains text other than white space. | |
| `stdout_json(Block)` | Standard output, compared as JSON. | |
| `stdout_text(T)` | Standard output given as the atom `T`, for text a block cannot show, such as text without a final line feed; compared as `stdout` compares. | |

Each setting appears at most once in a case, except `file`.

**Running a case.** A case runs in a new empty directory. Each `file`
setting creates its file there, with any directories its path names. The
command then runs in that directory, with the words of `args` after the
command's own words and with the `stdin` text on standard input. `args` is
split into words as a POSIX shell splits a command line without expansions:
white space separates words; text between single quotes is taken as is;
between double quotes a backslash escapes only `"`, `\`, `$`, `` ` `` and a
line feed; elsewhere a backslash escapes the next character; and adjacent
quoted and unquoted parts join into one word.

**Passing.** A case passes when the exit code equals `exit` and standard
output and standard error meet the settings that compare them. Line by line,
the expected and actual standard output MUST have the same number of lines,
and each expected line MUST equal the actual one, except that each `…`
(U+2026) in an expected line matches any sequence of characters within that
line; this specification leaves such text, for example a failure detail, to
the implementation ([Section 14](#14-conformance)). As JSON, both outputs MUST parse, and they
MUST be equal as JSON values: arrays element by element, objects with the
same member names whatever their order, numbers by their values, and
strings as lines are, so that an expected string containing `…` matches any
string of that form.

## 15. Security

Programs execute JavaScript and require the caller's trust. Documents,
including proofs, reports, goals and `facts_from` input, MUST be read as data
without executing code. A deployment accepting untrusted documents SHOULD
bound their size, nesting depth, processing time and memory, in addition to
the reasoning bounds of [Section 8.3](#83-resource-bounds). A regular expression can take time exponential in
the length of the text it searches ([Section 4.3](#43-primitives)), and no reasoning bound counts
that time, so a deployment running untrusted programs SHOULD also bound it. A valid proof establishes only the
claims and assumptions described in [Section 11.1](#111-scope-of-a-valid-proof).

## Appendix A. Document Grammar

This grammar defines document expressions. Quoted strings are literal
tokens; `|` gives alternatives, `[ ... ]` an optional part, `{ ... }`
repetition, parentheses grouping, and `? ... ?` a lexical class defined in
prose. String literals, reserved names and
layout follow [Section 9.1](#91-accepted-document-syntax). Line feeds inside brackets are layout; outside
brackets they separate statements.

```ebnf
document   = { separator | expression separator }, [ expression ] ;
separator  = ";" | LF ;
expression = string | number | "-", number | name | call | array | object
           | "(", expression, ")" ;
call       = name, "(", [ arguments ], ")" ;
arguments  = expression, { ",", expression }, [ "," ] ;
array      = "[", [ items ], "]" ;
items      = expression, { ",", expression }, [ ",", "...", expression ], [ "," ]
           | "...", expression, [ "," ] ;
object     = "{", [ pair, { ",", pair }, [ "," ] ], "}" ;
pair       = ( identifier | string ), ":", expression ;
number     = integer, [ "n" ] | float ;
integer    = "0" | nonzero, { digit } ;
float      = ( digits, ".", { digit } | ".", digits ), [ exponent ]
           | digits, exponent ;
exponent   = ( "e" | "E" ), [ "+" | "-" ], digits ;
digits     = digit, { digit } ;
digit      = "0" | nonzero ;
nonzero    = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
identifier = ( letter | "_" ), { letter | digit | "_" } ;
letter     = ? ASCII letter A-Z or a-z ? ;
name       = ? identifier excluding the reserved names of Section 9.1 ? ;
string     = ? quoted string literal as defined in Section 9.1 ? ;
LF         = ? U+000A line feed ? ;
```

## Appendix B. Example

The program `socrates.js`:

```js
fact(type('socrates', 'human'))
fact(subclass_of('human', 'mortal'))
implies([type(S, A), subclass_of(A, B)], type(S, B))
query(type(X, Y))
```

Its conclusions:

```js
// Answers: each instance of a query() that holds.
type('socrates', 'mortal')
type('socrates', 'human')
```

Its proof document ([Section 10](#10-proof-documents)):

```js
// Answers: each instance of a query() that holds.
type('socrates', 'mortal')
type('socrates', 'human')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(type('socrates', 'human')))
clause(2, fact(subclass_of('human', 'mortal')))
clause(3, implies([type(S, A), subclass_of(A, B)], type(S, B)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(type('socrates', 'mortal'), clause(3), {S: 'socrates', A: 'human', B: 'mortal'}, [type('socrates', 'human'), subclass_of('human', 'mortal')])
step(type('socrates', 'human'), clause(1), {}, [])
step(subclass_of('human', 'mortal'), clause(2), {}, [])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(type(A, B), [type('socrates', 'mortal')])
called(type(A, B), [type('socrates', 'mortal'), type('socrates', 'human')])
```

Its check report ([Section 12](#12-check-reports)):

```js
// Checked answers: these follow from the input program.
type('socrates', 'mortal')
type('socrates', 'human')

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 3)
condition('C2', 'well_founded', 'ok', 3)
condition('C3', 'justification', 'ok', 3)
condition('C4', 'coverage', 'ok', 4)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 5)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 3)

// Proof statistics: recorded steps and how they were checked.
steps(3)
verified(3)
recomputed(0)
composed(0)
trusted(0)
claims(2)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
```
