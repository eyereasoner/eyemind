# <img src="assets/eye.png" alt="" width="48" height="48" align="absmiddle"> Logic Script (LS) specification

```text
Title:      The Logic Script (LS) Language and Proof Format
Version:    eyemind 0.9.3
```

This document specifies Logic Script (LS): the syntax and meaning of its
programs and data documents, their observable evaluation, their proofs, and
how a proof is checked. eyemind is an implementation of LS.

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
  - [10.2 Steps](#102-steps)
  - [10.3 Certificate](#103-certificate)
- [11. Proof Checking](#11-proof-checking)
  - [11.1 What a checked proof establishes](#111-what-a-checked-proof-establishes)
  - [11.2 Original questions](#112-original-questions)
  - [11.3 Answering calls](#113-answering-calls)
  - [11.4 Replaying derived facts](#114-replaying-derived-facts)
  - [11.5 Deciding the claims](#115-deciding-the-claims)
  - [11.6 Nothing unused](#116-nothing-unused)
- [12. Check Reports](#12-check-reports)
- [13. Conformance](#13-conformance)
- [14. Security](#14-security)
- [Appendix A. Document Grammar](#appendix-a-document-grammar)
- [Appendix B. Example](#appendix-b-example)

---

## 1. Scope and Conventions

### 1.1 Scope

This specification defines Logic Script's terms, program syntax, semantics,
evaluation, data documents, proof documents and proof checking.
LS programs are JavaScript scripts. Conclusions, proofs and check reports are
data documents whose expressions MUST be read without execution.

The requirements apply to any conforming implementation. JavaScript is the
program notation; it does not prescribe the implementation language, data
structures or execution architecture. Observable behavior is specified
independently of those choices.

Command-line options, exit codes, library APIs, browser interfaces,
additional input formats, installation and release
procedures are outside this specification. [Section 1.3](#13-terminology)
defines the terms used throughout.

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
- **Control**: `and`, `or`, `not`, `call`, `once`, `findall` or
  `findall_sorted` ([Section 4.2](#42-controls)). A **negation** is a `not(G)`
  goal and a **collection** a `findall(T, G, L)` or `findall_sorted(T, G, L)`
  goal.
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
- **Halt**: the end of a run that concludes `'false'`
  ([Section 8.5](#85-contradictions)).
- **Conclusion**: a term reported by a run ([Section 8.6](#86-reported-conclusions)).
- **Reasoner**: a processor that evaluates programs and checks its generated
  proofs before returning them ([Section 8.7](#87-proof-generation)).
- **Checker**: a processor that verifies proof documents against a supplied
  program, without using reasoning to fill missing derivations ([Section 11](#11-proof-checking)).

Proofs:

- **Proof document**: a document recording how a run's conclusions follow
  from the program ([Section 10](#10-proof-documents)). Its **claims** are its statements other
  than `step/4`, `derived/2` and `called/2` ([Section 10.1](#101-structure)).
- **Step**: `step(Goal, By, Bindings, Uses)`, the firing of a rule, or the
  solution of a control, that justifies one goal; its **uses** are the goals
  that justify it ([Section 10.2](#102-steps)).
- **Call table**: `called(Call, Answers)`, every answer of one call, in order
  ([Section 10.3](#103-certificate)).
- **Listing**: `derived(Pattern, Facts)`, every fact a run derived for one
  relation, in order ([Section 10.3](#103-certificate)).
- **Certificate**: the call tables and listings of a proof ([Section 10.3](#103-certificate)).
- **Original question**: each external goal; without external goals, the
  body of each query; without queries, each ordinary forward head
  ([Section 11.2](#112-original-questions)).
- **Replay**: re-executing the firing a step records, from its source rule,
  with the bindings of each point of the search ([Section 11.4](#114-replaying-derived-facts)).
- **Checks**: of a proof, that the checker finds no failure
  ([Section 11.1](#111-what-a-checked-proof-establishes)).
- **Check report**: what a checker writes: the claims, any failures and a
  verdict ([Section 12](#12-check-reports)).

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
Atoms and numbers are **atomic** terms.

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

A Logic Script program consists of one or more non-strict JavaScript scripts.
Each script may use JavaScript declarations, expressions, functions and control flow to
construct its clauses. No import is required for the statements and term
constructors defined here. Clauses are stated in the order their statement
calls occur; multiple input scripts are processed in input order. Each
script runs in a scope of its own: a name one script declares is, in
another script, resolved as [Section 3.2](#32-names) specifies, so scripts share no
declarations.

The supplied names are the statements of [Section 3.4](#34-statements), `forward`, `backward`,
`preds`, `vars`, `struct`, `float`, the controls and primitives of [Section 4](#4-goals-and-primitives), the
atom `fail`. Other names are resolved as [Section 3.2](#32-names) specifies.

An embedding MAY supply additional library names. Their operations and
programs that depend on them are outside this specification.

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
names `step`, `derived`, `called`, `activated`, `forward`, `backward`,
`struct`, `implies` and `implied_by`.

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
names already used in the clause. Proof bindings use these names. Programs SHOULD NOT give their own variables names consisting
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
numbered clause per argument.

A clause MUST be rejected when:

- a head is not an atom or compound, or is a list, the atom `'[]'` or a
  `'.'/2` compound, which as a goal would be a conjunction ([Section 4.1](#41-goal-syntax)) and
  could never call the clause;
- a head uses `step/4`, `derived/2` or `called/2`, reserved for proof
  documents, or explicitly states the reserved predicate
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
- the second argument of `findall` and `findall_sorted`;
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
| `findall_sorted(T, G, L)` | `findall_sorted(T, G, L)` | As `findall`, with the list sorted in the standard order ([Section 2.4](#24-standard-order)), any two variables comparing equal. Items that compare equal keep their search order; repeated items are kept. |

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
| `digest` | `digest(+H, +A, ?D)` | `D` is the digest of the UTF-8 encoding of the atom `A` by the hash function `H`, one of `'md5'`, `'sha1'`, `'sha256'`, `'sha384'` and `'sha512'`, as lowercase hexadecimal. A lone surrogate is encoded as U+FFFD. Another `H` raises an error. |
| `term_text` | `term_text(+T, ?A)` | `A` is the canonical text of `T` ([Section 9.2](#92-canonical-atoms-numbers-variables-and-lists)), which MUST be ground: `term_text(f('a', [1, 2.0]), "f('a', [1, 2.0])")` holds. |
| `float64` | `float64(+Op, +A, +B, ?R)` | Explicit IEEE-754 binary64 computation, including exceptional values represented as atoms, as defined below. |
| `regex_match` | `regex_match(+P, +T)` | Some part of the atom `T` matches the regular expression `P`. |
| `regex_find` | `regex_find(+P, +T, ?G)` | One solution per match of `P` in `T`, from left to right: `G` is the list of the matched text followed by each capture group's text, `''` for a group that took no part in the match. |
| `regex_replace` | `regex_replace(+P, +T, +R, ?U)` | `U` is `T` with every match of `P` replaced by `R`. |
| `xml_content` | `xml_content(+T)` | The atom `T` is self-contained XML content, as defined below. |

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
are floats; exceptional results are the atoms above. A checker recomputes
these operations, including signed zeros and exceptional results.

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

`xml_content/1` tests the lexical space of [`rdf:XMLLiteral`](https://www.w3.org/TR/rdf12-concepts/#section-XMLLiteral).
The atom MUST be well-balanced, self-contained content as defined by
[XML 1.1](https://www.w3.org/TR/xml11/#NT-content) and conform to
[Namespaces in XML 1.0](https://www.w3.org/TR/xml-names/#Conformance) when
embedded inside an element with no namespace declarations. Empty content and
multiple top-level nodes are allowed. Only the predefined entities and
numeric character references are available. XML declarations and DTDs are
outside the content grammar. The test performs no I/O.

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
count, or when the result is not a finite real number.

An implementation MAY bound the resources used by arithmetic. If a bound
is exceeded, evaluation MUST report resource exhaustion instead of returning
an incorrect or partial value. The bounds are implementation-defined.

## 6. Rule Structure

### 6.1 Dependencies and stratification

A body goal depends on a clause when the goal, renamed apart, unifies with
one of the clause's heads. The dependency is **closed** when the goal occurs
inside a negation or as the goal of a collection ([Section 4.2](#42-controls)), and **open**
otherwise. Each clause has a nonnegative integer rank: the least assignment
such that its rank is at least the rank of every clause it depends on, plus
one for a closed dependency. Forward rules run in order of rank
([Section 8.2](#82-forward-evaluation-and-witnesses)).

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
argument of an ordinary head or goal, or the template or result of a collection,
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
appended clauses are numbered consecutively. `forward` and `backward` stand
for `implies` and `implied_by`. The original generating clause retains its
template heads.

For example, `implies(cat(X), implies(dog(Y), test('yes')))` as the only
stated clause has these clauses:

```js
implies(cat(X), implies(dog(Y), test('yes')))   // clause 1
implies([cat(X), dog(Y)], test('yes'))          // clause 2, appended
```

The appended body describes the premises a step of the rule uses. It is
not a prescription to reevaluate the generator when the appended rule is
called. During forward evaluation, each solution of the generator creates a
rule instance with its captures bound to that solution and its generator's
evidence retained. Identical captures of the same template create one
instance. The rule instance searches only the template's own body; a
backward caller cannot change how the generator's body was evaluated.
Template-local variables remain universal and are renamed apart on each use.
The run derives no synthetic enabling facts, and proofs have no
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
be bound first. Such a firing does not replay ([Section 11.4](#114-replaying-derived-facts)).

Inspection uses a fixed source catalogue, so its own results do not depend on
forward rounds. Other goals using derived patterns still participate in
stratification.

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
This section defines a conservative decision procedure: a program it
accepts is chain-stratified in the paper's sense.
It is made only for a program [Section 6.1](#61-dependencies-and-stratification) rejects for a closed cycle.

**Rules.** The rules are the forward clauses and the backward clauses with a
body. A program with templates or captures, a rule body goal `or`, `once`,
`call` or a variable, or a backward rule with a negation or collection, is
not chain-stratified. A rule has:

- **positive goals**: its body goals other than primitives, negations,
  collections and `'true'`, and other than a restricted rule's guard
  ([Section 7.2](#72-variables-and-witnesses));
- **negated groups**: for each `not(G)` and collection `findall(T, G, L)` or
  `findall_sorted(T, G, L)` body goal,
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
the firing's witnesses are needed. A proof cannot establish a firing of a
restricted rule with a guard ([Section 11.1](#111-what-a-checked-proof-establishes)). A restricted rule without
head-only variables has no guard and behaves as `implies`. For example:

```js
fact(human('jo'), father('jo', 'bob'))
restricted(human(X), [father(X, F), man(F)])
implies(father(X, Y), man(Y))
```

concludes `man('bob')` and invents no father for `'jo'`, since `'bob'`
already satisfies the heads once the third rule has run.

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
`findall_sorted` collects the same solutions in the standard order, so the
order in which they were found decides its list only among items equal up to
their variables.

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
The guarantees and limits of a checked proof are defined in
[Section 11.1](#111-what-a-checked-proof-establishes).

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
  of their first occurrence in the heads. When several head variables stand
  for one term, the first of them in the heads names it, whichever way
  unification bound them. A variable that a value of the solution brought
  in, which no head variable stands for, keeps its own name when no other
  term of the firing has it; the others take that name followed by the first
  of `1`, `2`, ... that is
  free, in order of first occurrence in the heads. A rule that keeps meeting new firings does
  not terminate ([Section 8.3](#83-resource-bounds)). Derived facts other than scoped inspection
  patterns ([Section 6.3](#63-source-rule-inspection)) are therefore ground. A
  checker recomputes the Skolem terms of a proof ([Section 11.4](#114-replaying-derived-facts));
- a head `'true'` reports the instance of the rule's body, as a conjunction,
  once per distinct instance (by identity of canonical text);
- a head `'false'` records the conclusion `'false'` and stops all reasoning;
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

An implementation MAY bound evaluation resources. Exceeding a bound MUST
raise an error; a partial result MUST NOT be returned as complete. Limits
and their configuration are implementation-defined. When bounds on search
depth, goals started or forward rounds are provided, they count as follows:

- A goal solved by a rule is one level deeper than the goal whose body it is
  in, and a goal asked from outside or a forward rule's premise is at level
  0; solving a goal through more nested rule bodies than the depth bound
  allows exceeds it. A goal solved by a fact adds no level.
- Every goal the search starts counts once toward the inference bound,
  including each conjunction, control and primitive, in forward premises as
  in goals: the goal `[p(X), p(Y)]` against one fact starts three goals. A
  rule body is flattened to its goals ([Section 3.5](#35-clause-constraints-and-numbering)), so the same
  array as a forward premise starts two.
- Every forward round of a stratum counts toward the round bound,
  including the final round that adds nothing; a stratum without forward
  rules has no rounds.

### 8.4 External goals

A run MAY be given goals. Each goal is read on its own, so goals share no
variables: `p(X)` and `q(X)` given separately ask two unrelated questions.
After forward reasoning, each goal is solved in
turn, and each solution is reported as the instance of its goal, unless an
instance identical up to renaming of its variables was already reported for
this goal or an earlier one of the same run.

### 8.5 Contradictions

A run halts exactly when it concludes `'false'`. The halt is part of its
result and stops evaluation as specified in [Section 8.2](#82-forward-evaluation-and-witnesses).

### 8.6 Reported conclusions

The conclusions of a run are, in order:

1. when it halted: every derived fact, in the order derived, ending with
   `'false'`;
2. otherwise, when it was given goals: the reported instances of its goals;
3. otherwise, when the program has a forward rule with a head `'true'`: the
   reported instances, in order of first report, which MAY be none;
4. otherwise: every derived fact, in the order derived.

Rule instances are not facts and cannot be queried as enabling predicates.

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
by a collection. For each conclusion the first derivation found is
recorded. The proof ([Section 10](#10-proof-documents)) holds a call table for every call its
original questions make, with every answer of the call, so a table can
search beyond where the run stopped, as under `once`; the listings those
searches consult; and the steps that replay the listed facts. A halted run's
proof replays its claims instead. A reasoner MUST check every proof it
generates ([Section 11](#11-proof-checking)) before returning it, and MUST fail with an error
rather than return a proof that does not check, as for results the format
cannot establish ([Section 11.1](#111-what-a-checked-proof-establishes)) or a table that would meet an error. It
MAY bound the work of making tables; exceeding the bound is such an error
and MUST NOT change the run's answers. A run without conclusions has a proof
without claims, whose certificate establishes that there are no required
answers ([Section 11.5](#115-deciding-the-claims)).

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
Other escapes and unescaped characters U+0000–U+001F except tab MUST be
rejected. This includes raw line feeds and carriage returns; U+2028 and
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
- A list is written `[I1, I2, ...]`; an open or improper list ends with `, ...Tail`.

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
first shows them, across the whole document, the conclusions written first.
A check report keeps the names of the proof ([Section 12](#12-check-reports)). The call tables
of a proof (`called/2`, [Section 10.3](#103-certificate)) name their variables
in a scope of their own, keeping anonymous variables distinct from named
ones.

## 10. Proof Documents

### 10.1 Structure

A proof document is a document ([Section 9.1](#91-accepted-document-syntax)) holding, in this order:

1. the output of the run ([Section 8.6](#86-reported-conclusions)): its comment line, then its
   conclusions, one per line;
2. when there are steps ([Section 10.2](#102-steps)), an empty line, comment
   lines saying what a step records, then one `step(Goal, By, Bindings, Uses)`
   per recorded inference;
3. when there is a certificate ([Section 10.3](#103-certificate)), an empty
   line, a comment line introducing it, then one `derived(Pattern, Facts)` per
   listing, in the order first consulted, then one `called(Call, Answers)`
   per call table, in the order their calls are first met.

Comments are informative and MAY be worded differently; they are ignored when
the document is read. Every statement that is neither `step/4`, `derived/2`
nor `called/2` is a **claim**, whatever its position.

A proof answers the run's original questions ([Section 11.2](#112-original-questions))
by its certificate: the call tables show every answer of every call those
questions make, and the steps show how each derived fact the answers rest on
was derived.

### 10.2 Steps

A step records the firing behind a derived fact, and how its uses were
solved where the call tables cannot show it. `Goal` is the derived goal as it
stands once the whole solution is found: the goal with every variable the
solution bound replaced by its value. `Uses` is the list of the goals that
justify `Goal`, in order. `By` is one of:

| `By` | Meaning | `Bindings` | `Uses` |
| --- | --- | --- | --- |
| `clause(N)` | `Goal` is an instance of a head of rule `N`, whose body instance is `Uses`. For a rule appended by a template, the body is its full body, the generators' premises first ([Section 6.2](#62-inline-rule-templates)). | the rule's variables | the body instance |
| `'control'` | `Goal` is `call(G)` or a disjunction, solved by `Uses`. | empty | the conjuncts of `G` or of the side that was solved, so `or(or(A, B), C)` solved by `A` uses `or(A, B)` |

`Bindings` is an object from variable names of the cited rule, as the
program wrote them, to their values in this step: `{X: 'socrates'}`. A key
that is an ASCII identifier (letters, digits and `_`, not starting with a
digit) is written bare, and any other name as a string, such as `{'A-B': 1}`. A reasoner writes every variable of the rule,
in order of first occurrence in the rule, a forward rule's body first.
Bindings explain a step; a checker requires only that they agree with it
([Section 11.4](#114-replaying-derived-facts)).

A proof holds exactly the steps its check follows ([Section 11.4](#114-replaying-derived-facts)): the
step of each listed fact and, for a halted run, of each claim; and, within
the firings they record, the step of each use whose call the tables answer
only through derived facts, recursively. Each distinct goal (by canonical
text) has at most one step; a derived pattern ([Section 6.3](#63-source-rule-inspection)) has one up to
the renaming of its variables. Steps appear in the order of a depth-first
walk from the listed facts, in listing order, and then from a halted run's
claims.

### 10.3 Certificate

- `called(Call, Answers)` is a **call table**: `Call` is a goal as a search
  called it, before any later binding, and `Answers` the array of its
  answers, each the instance of `Call` that one solution gave, in the order
  of [Section 8.1](#81-goal-search), repetitions included. Each answer's variables are its own:
  they are shared neither with `Call` nor with another answer.
- `derived(Pattern, Facts)` is a **listing**: `Pattern` is the name of a
  relation that forward rules conclude, applied to distinct variables, or the
  name alone for arity 0; the `i`-th argument of every listing's pattern is
  one and the same variable, named with the rest of the document
  ([Section 9.4](#94-variable-scope-in-output)), and `Facts` the array of every fact the run derived
  for that relation, in the order derived ([Section 8.2](#82-forward-evaluation-and-witnesses)).

A call table exists for each call to a relation that a backward rule defines
or forward rules conclude, made by the searches and replays of Sections
[11.3](#113-answering-calls) and [11.4](#114-replaying-derived-facts); a call to a relation defined by facts alone needs
none. A listing exists for each
relation forward rules conclude that those searches consult.

Two calls identify the same call table only when they are identical up to
renaming **that preserves anonymous-variable status** ([Section 4.2](#42-controls)), including
inside nested compounds; there MUST NOT be two such tables. Answers are
compared the same way. These restrictions matter because a named unbound
variable makes a negation an error. The call tables of a proof share a
variable naming scope of their own: writers name named variables `A`, `B`,
..., counting variables in first-occurrence order across the tables, and
anonymous ones `_0`, `_1`, ... using their position in the same order. For example, a named call returning an anonymous
parameter may be:

```js
called(p(A), [p(_1)])
```

## 11. Proof Checking

A checker verifies a proof's claims against its source program. Its inputs
are the program, the proof document and, when the proof answers external
goals, those goals. The source program is the authority for clauses and
questions; the proof supplies evidence to check. The outcome is `checked`
or a list of failures.

The checker MUST NOT call a reasoner to supply missing evidence. It runs
primitives, expands a call one level against the source program, answering
inner calls from the call tables, and replays recorded firings. Each
consulted table is itself checked by this expansion, and tables cannot
justify themselves through a cycle.

The searches of a check start from the original questions, with the
bindings each call has when it runs, not from the final instances that steps
show. Those final instances can hide a different result. For example:

```js
fact(value('a'), value('b'))
implied_by(p(X), value(X))
implied_by(q(X), once(p(X)))
```

For the external question `q(X)`, `once(p(X))` selects `'a'`, so the only
answer is `q('a')`, although the specialized call `once(p('b'))` succeeds.
Likewise, with `fact(p('a'))` and `implied_by(q(X), [not(p(X)), unify(X, 'b')])`,
the question `q(X)` raises an error, because `X` is unbound when the
negation runs, though `q('b')` succeeds. Tests of variable state and
collections depend on their actual calls in the same way ([Section 7.5](#75-sets-and-operational-behavior)).

The document MUST be read as data using [Section 9.1](#91-accepted-document-syntax), without executing it.
The check fails when it cannot be read, when a step's bindings are not an
object or its uses not an array, when two steps have identical goals, when a
call table's answers or a listing's facts are not an array, when a listing's
pattern is not a name applied to distinct variables, when two call tables or
two listings coincide ([Section 10.3](#103-certificate)), and when a variable's name contains
`#`, which no writer gives a variable ([Section 9.4](#94-variable-scope-in-output)).

### 11.1 What a checked proof establishes

A proof **checks** when the checker finds no failure. Its claims then follow
from the source program. Unless the proof is halted, every claim is an
answer of an original question, and every required answer
([Section 11.5](#115-deciding-the-claims)) is claimed, up to variable
renaming. A checked proof without claims establishes that there are no
required answers.

For a program with negation, "follows" is relative to the facts the
listings hold: the check establishes that they are supported by replayed
firings, closed under the forward rules and consistent with every negation
decided from them. A stratified or chain-stratified program has exactly one
such set of facts ([Section 7.4](#74-negation-and-collection)), its result, so the listings are the facts the
original calls consult.

A checked proof does not establish:

- that the claims of a halted proof, which contain `'false'`, are every
  answer;
- that the program derives no `'false'`;
- that execution of the whole program terminates or reaches every question;
- that the supplied program expresses the author's intended model.

Some results cannot be established by this proof format, and their proofs
do not check: a first answer or collection requiring uncertified answer
order ([Section 11.3](#113-answering-calls)); a firing of a restricted rule
with a guard ([Section 7.2](#72-variables-and-witnesses)); a comparison
`compare/3` of terms that are not ground, since renaming a table need not
preserve the order of variable names; and a search whose table would not close.

### 11.2 Original questions

The **original questions** are the external goals, if any; otherwise, if any
forward rule has the head `'true'`, those rules' bodies as conjunctions;
otherwise the ordinary forward heads other than `'false'`. Questions
identical up to renaming that preserves anonymous-variable status count once.
They are not instantiated with the proof's final bindings.

A proof whose claims contain `'false'` is **halted** and has no original
questions ([Section 11.5](#115-deciding-the-claims)).

### 11.3 Answering calls

Each original question is answered by searching it according to [Section 8.1](#81-goal-search),
with these changes:

- A call to a relation defined by backward rules or concluded by forward
  rules is answered from the call table whose call is identical to it up to
  renaming that preserves anonymous-variable status. Each answer is renamed
  apart before it is used. A call without a table cannot be established.
- A call to a relation defined by source facts alone is answered from those
  facts, in clause order; it needs no table.
- An inspection goal is answered from the catalogue of [Section 6.3](#63-source-rule-inspection),
  in source order, each rule renamed apart; it needs no table.
- Primitives run as [Section 4.3](#43-primitives) specifies, and `not`, `once` and the
  collections keep their meanings of [Section 4.2](#42-controls), including the error for a
  negation with an unbound named variable. A comparison `compare/3` with
  either compared term not ground cannot be established. A search that
  raises an error fails the check.

The **expansion** of a call is one level of the search of [Section 8.1](#81-goal-search):
try its relation's listed facts in listing order, each derived pattern
renamed apart, then source facts and backward rules in clause order,
searching each rule's body in its place and answering inner calls as above.
Each consulted call table MUST equal its expansion: the same number of
answers, each identical up to renaming that preserves anonymous-variable
status to the answer in the same position.

A backward rule appended by a template ([Section 6.2](#62-inline-rule-templates)) answers through its
instances. A rule whose enclosing generators are not all in the program has
none. Otherwise, search the generator's part of its body first, with none of
the call's bindings, and take its solutions in order, skipping a solution
whose captured values are identical to an earlier one's. For each, unify the
call with the head and search the template's part of the body. This is the
order in which the run made the instances only when the generator's search
consults no table and no listing, and its generators have no guard and
introduce no witnesses; otherwise the search cannot be established. Captured
values that are not ground cannot be established either.

The tables a search consults, directly or through the expansions of other
tables and the closure of listings, MUST NOT depend on themselves. A table
has **certified answer order** exactly when it has at most one distinct
answer, or its expansion consults no listing and every table it depends on
has certified answer order. A search
whose `once`, `findall`, or `findall_sorted` with a result that is not
ground, consults a table without certified answer order cannot be
established: support and closure do not establish the order in which forward
facts were published. A `findall_sorted` of ground items depends on the
solutions and how often each occurs, not on their order.

Every consulted listing MUST be closed. Each of its facts has its relation's
name and arity and is ground, unless the program inspects source rules and
the fact is a derived pattern. A listing is **closed** when, for every
forward rule with a head of its relation, each solution of the rule's body
under the certificate gives head instances that are listed (a pattern up to
the renaming of its variables) or are ground source facts. Bind the rule's
witnesses to their Skolem terms when checking this ([Section 8.2](#82-forward-evaluation-and-witnesses)). A head
instance that is not ground cannot be established unless the program inspects
source rules; it is then a derived pattern the listing must hold, and its
replay decides whether an inspection supplied its variables. A rule appended by a template
searches its whole body, generator's part first; one whose enclosing
generators are not all in the program never fires and is skipped. A rule
within a template's scope that introduces witnesses, or whose generators
have a guard or introduce witnesses, cannot be established.

For example, with `fact(p('a'), p('b'))`, `implied_by(r(X), p(X))` and the
question `r(X)`, the certificate holds the call table:

```js
called(r(A), [r('a'), r('b')])
```

The checker expands `r(X)` against its source definition: the call `p(X)`
is answered from the facts, giving `r('a')` and `r('b')`, which equal the
table. A table that left out `r('b')` or listed `r('c')` fails.

### 11.4 Replaying derived facts

Support and closure show which facts a listing must hold, but not that each
was derived by a firing the run could make. Every fact of every consulted
listing MUST therefore **replay** the firing its step records, and so MUST
each claim of a halted proof.

A fact's step MUST cite a forward rule that has no guard and introduces no
witnesses within a template's scope. For a rule appended by a template,
every enclosing generator MUST belong to the program and have no guard or
witnesses. Rename the rule apart and replay each body goal, in order and
starting with no bindings, against the step's corresponding use:

- A primitive runs on the bindings of that point. Its first solution under
  which the goal can still unify with the use is taken. `compare/3` with a
  compared term that is not ground does not replay.
- `once/1`, `not/1`, `findall/3` and `findall_sorted/3` are evaluated from
  the certificate on the bindings of that point, with the binding and
  certified-order requirements of [Section 11.3](#113-answering-calls).
  The control MUST succeed and its resulting goal MUST still unify with
  the use.
- Any other goal, as it stands at that point, is answered from the
  certificate as in [Section 11.3](#113-answering-calls), when that search consults no listing:
  the answer identical to the use up to renaming is taken, or else the first
  answer under which the goal can still unify with the use. An answer's
  variables are a derived pattern's only when its search read the catalogue
  of [Section 6.3](#63-source-rule-inspection) or a listed pattern.
- Otherwise the goal follows the use's step. A call to a relation whose step
  cites a forward rule replays that rule's fact in turn, which is then unified
  with the goal. One citing a backward rule, renamed apart, has its head
  unified with the goal and its body replayed against the step's uses; for
  a backward rule appended by a template, the generator's part of the body
  replays first, before the head meets the goal, and the template's part
  after. `call/1` and a disjunction replay the goals their `'control'` step
  uses, for a disjunction from the side those uses form. A step whose replay
  meets the same step again does not replay, so derived facts support each
  other only without a cycle.
- After each goal, the goal MUST still unify with its use, since a step
  shows its goals after the whole solution's bindings.

Each witness is then bound to its Skolem term ([Section 8.2](#82-forward-evaluation-and-witnesses)), computed from the
values of the heads' other variables, which MUST be ground. Once the whole
firing has replayed, the fact with the rule's body instance MUST be one of
the rule's heads with its body, and each step followed within the firing its
rule's head with its body, identical up to the renaming of variables; a
derived pattern's variables are all supplied by an inspection or a listed
pattern. Each step's bindings MUST name distinct variables of its rule,
whose values unify with what the replay gave them.

### 11.5 Deciding the claims

For a proof that is not halted:

- Each original question MUST be answered by its certificate
  ([Section 11.3](#113-answering-calls)), and every fact of the listings its search consults MUST
  replay.
- Each claim MUST be an instance of an original question, and identical, up
  to renaming, to an answer of such a question. Being an instance of a more
  general answer is insufficient: a claim `p('a')` cannot replace an
  answer `p(A)`.
- Every **required answer** of each question MUST be identical, up to
  renaming, to a claim. The required answers are the question's answers when
  the conclusions answer goals or `query()` rules. When the conclusions are
  the derived facts ([Section 8.6](#86-reported-conclusions)), they are the facts of the question's
  relation in its listing that are instances of the question, since a source
  fact or a backward answer is no derived fact.

For example, with `fact(p('a'), p('b'))` and `query(p(X))`, a proof that
claims only `p('a')` fails, though `p('a')` follows. With
`implied_by(r(X), p(X))` and `query(r('c'))`, the proof without claims
holding `called(r('c'), [])` establishes that the question has no answers.

A halted run stopped before its fixpoint, so its questions have no certified
answers. For a halted proof, each claim, `'false'` included, MUST replay as a
derived fact ([Section 11.4](#114-replaying-derived-facts)), its step citing the forward rule or
`contradiction` that concluded it. A listing its replays consult MUST still
be closed, so a negation or collection over a relation the halt left
unfinished cannot be established.

### 11.6 Nothing unused

Every statement of a proof MUST be used by its check: each step followed by
a replay, each call table consulted by a search, an expansion, a closure or a
replay, and each listing consulted by one of those. A step, table or listing
the check does not use fails it, so a proof carries no evidence that goes
unchecked.

## 12. Check Reports

A check report is a document ([Section 9.1](#91-accepted-document-syntax)) holding:

1. a comment line, then the proof's claims, in proof order, in canonical
   text, one per line, keeping the variable names of the proof;
2. an empty line;
3. when the check failed, a comment line, then one `failure(Detail)` per
   failure, where `Detail` is an atom, then an empty line;
4. optional comment lines explaining the outcome of the check, then an
   empty line when those comments are present;
5. `verdict('checked')`, or `verdict(failed(N))` where `N`, at least 1, is
   the number of failure lines.

The comment MUST identify the claims as checked answers only when the proof
checks, as following from a halted program when it checks and is halted, and
as unverified claims when it fails; a proof without claims that checks MUST
be said to establish that there are no required answers
([Section 11.1](#111-what-a-checked-proof-establishes)). Comments MAY explain
the checks of Sections [11.2](#112-original-questions)–[11.6](#116-nothing-unused),
but MUST NOT assert guarantees beyond those of the verdict. Their wording
is informative and MAY differ. The wording of `Detail`, and
the number and order of failures, are informative: a conforming checker
agrees on the verdict `checked` or failed. A report is ordinary data:
`facts_from` ([Section 3.4](#34-statements)) states it as facts.

## 13. Conformance

A conforming reasoner MUST implement the program syntax, semantics and
evaluation of Sections [2](#2-terms)–[8](#8-evaluation-and-conclusions) and the document and proof formats of Sections
[9](#9-document-syntax-and-canonical-text)–[12](#12-check-reports). A conforming checker MUST implement Sections [9](#9-document-syntax-and-canonical-text)–[12](#12-check-reports) against the supplied
program, including the clause and template rules of Sections [3](#3-program-syntax) and [6](#6-rule-structure),
without invoking a reasoner to complete the certificate. Conformance does
not require a particular command-line interface, library API, browser
interface or test runner.

Canonical term spelling, conclusion order, proof contents and the verdict
are required as specified. Comment wording and failures are informative.
Fresh variable names are unspecified where [Section 2.4](#24-standard-order) says so. Float results
of `exp`, logarithms, trigonometric and hyperbolic functions, and `pow` with
floats MAY differ by one unit in the last place; a proof whose answers rest
on such a result MAY therefore not check on another implementation.

Tests and example documents can provide evidence of conformance. Passing
a test suite does not replace these requirements, and the behavior of an
implementation does not define them. When a test or implementation
disagrees with this specification, this specification governs.

## 14. Security

Programs execute JavaScript and require the caller's trust. Documents,
including proofs, reports, goals and `facts_from` input, MUST be read as data
without executing code. A deployment accepting untrusted documents SHOULD
bound their size, nesting depth, processing time and memory, in addition to
the reasoning bounds of [Section 8.3](#83-resource-bounds). A regular expression can take time exponential in
the length of the text it searches ([Section 4.3](#43-primitives)), and no reasoning bound counts
that time, so a deployment running untrusted programs SHOULD also bound it. A proof that checks establishes only the
claims described in [Section 11.1](#111-what-a-checked-proof-establishes).

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
float      = ( integer, ".", { digit } | ".", digits ), [ exponent ]
           | integer, exponent ;
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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(type('socrates', 'mortal'), clause(3), {S: 'socrates', A: 'human', B: 'mortal'}, [type('socrates', 'human'), subclass_of('human', 'mortal')])
step(type('socrates', 'human'), clause(1), {}, [])

// Certificate: the derived facts and every answer of each call the questions make.
derived(type(A, B), [type('socrates', 'mortal')])
called(type(A, B), [type('socrates', 'mortal'), type('socrates', 'human')])
```

Its check report ([Section 12](#12-check-reports)):

```js
// Checked answers: these follow from the input program and are every answer of its questions.
type('socrates', 'mortal')
type('socrates', 'human')

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
```
