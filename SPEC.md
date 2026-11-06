# <img src="assets/eye.png" alt="" width="48" height="48" align="absmiddle"> eyemind specification

```text
Title:      The eyemind Rule Language and Proof Format
Version:    eyemind 0.2.2
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
- [11. Proof Checking](#11-proof-checking)
  - [11.1 Reading the document](#111-reading-the-document)
  - [11.2 C1 Resolution](#112-c1-resolution)
  - [11.3 C2 Well-foundedness](#113-c2-well-foundedness)
  - [11.4 C3 Justification](#114-c3-justification)
  - [11.5 C4 Coverage](#115-c4-coverage)
  - [11.6 C5 Re-decision](#116-c5-re-decision)
  - [11.7 C6 Boundary consistency](#117-c6-boundary-consistency)
  - [11.8 C7 Relevance](#118-c7-relevance)
  - [11.9 C8 Witness integrity](#119-c8-witness-integrity)
  - [11.10 Counts and validity](#1110-counts-and-validity)
  - [11.11 Scope of a valid proof](#1111-scope-of-a-valid-proof)
- [12. Check Reports](#12-check-reports)
  - [12.1 JSON form](#121-json-form)
- [13. Command-Line Interface](#13-command-line-interface)
  - [13.1 Invocation and options](#131-invocation-and-options)
  - [13.2 Unused clauses](#132-unused-clauses)
- [14. Conformance](#14-conformance)
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
procedures are outside this specification.

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

- **Clause**: a fact, a forward rule or a backward rule.
- **Substitution**: an assignment of terms to variables.
- **Instance**: the result of applying a substitution to a term or clause.
- **Ground**: containing no variable.
- **Identical**: equal by canonical text (Section 9), with each variable
  identical only to itself.
- **Renamed apart**: with fresh variables, preserving all sharing within
  the renamed terms and avoiding capture of other variables.
- **Conclusion**: a term reported by a run (Section 8.6).
- **Document**: a sequence of expressions in the data syntax of Section 9.
- **Reasoner**: a processor that evaluates programs and checks its generated
  proofs before returning them.
- **Checker**: a processor that verifies proof documents against a supplied
  program, without using reasoning to fill missing derivations.

## 2. Terms

### 2.1 Kinds of terms

A term is one of the following. The examples use document syntax; program
construction is defined separately in Section 3.3.

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
spread tail. In document syntax, `[...Tail]` denotes `Tail` itself.
Program spread expressions also follow Section 3.3.

The empty list is the atom whose text is `[]`, so `'[]'` denotes the same
term. A non-empty list has the compound structure exposed by `functor` and
`univ`: name `'.'`, arity 2, and arguments head and tail. This describes
term structure, not an alternative written list syntax. A character list
contains one-character atoms.

A non-empty proper list in a goal position denotes conjunction instead
(Section 4.1). A list inside an ordinary argument remains list data.

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
left to right. Lists follow their compound structure (Section 2.2).

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
calls occur; multiple input scripts are processed in input order.

The supplied names are the statements of Section 3.4, `forward`, `backward`,
`preds`, `vars`, `struct`, the controls and primitives of Section 4, the
atom `fail`, and the library name `eyemind`. Library operations are outside
this specification. Other names are resolved as Section 3.2 specifies.

### 3.2 Names

A name a script does not declare or assign is resolved as follows:

1. a supplied name (Section 3.1) has that meaning;
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
an error rather than ignore it.

### 3.3 Term construction

Program expressions construct terms as follows. This is distinct from
reading a data document (Section 9.1).

| Program expression | Term constructed |
| --- | --- |
| A JavaScript string, such as `'alice'` | Atom. |
| A `BigInt` literal, such as `42n` | Exact integer. |
| An integral finite number, such as `2` or `2.0` | Integer. |
| A non-integral finite number, such as `0.5` | Float. |
| `float(N)`, where `N` is a finite JavaScript number | Float, including an integral value or signed zero. |
| An implicit variable name, such as `X` | Variable (Section 3.2). |
| `p(T1, ..., Tn)`, with `n >= 1` | Compound named `p`, when `p` is a predicate constructor. |
| `p` or `p()` | Atom `p`, when `p` is a predicate constructor. |
| `struct(Name, T1, ..., Tn)` | Compound with the atom name `Name`; `struct(Name)` gives the atom. |
| `[]`, `[T1, ..., Tn]`, `[Head, ...Tail]` | Lists (Section 2.2). |

Thus `2.0` in a program is an integer; use `float(2)` for the float `2.0`.
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
and the arithmetic functions of Section 5, such as `is(Y, add(3, 4))`.

### 3.4 Statements

The basic statement forms are:

| Form | Meaning |
| --- | --- |
| `fact(T)` | State one fact with head `T` and no body. |
| `implies(Body, Head)` | State a forward rule. `Body` is a goal or a non-empty array of goals; `Head` is one head or a non-empty array of heads. |
| `implied_by(Head, Body)` | State a backward rule with one head. `Body` is a goal or a non-empty array of goals. |
| `query(G)` | Report the successful instances of `G`. An array denotes one conjunction. |
| `contradiction(G)` | Halt with conclusion `'false'` when `G` succeeds. An array denotes one conjunction. |
| `facts_from(Path)` | Read a document from a path and state one fact per expression. |
| `facts_from({text: Text})` | Read a document from a string and state one fact per expression. |

`implies` and `implied_by` require exactly two arguments. The variadic forms
of `fact`, `query` and `contradiction` are also defined:

```js
fact(p('a'), p('b'))       // Two facts: fact(p('a')); fact(p('b')).
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
in Section 8. `implies` and `implied_by` also return rule values. A value
embedded in another statement contributes a template or inspection pattern
as Section 6 specifies, instead of a separate clause.

`facts_from` input MUST be read using Section 9.1 and MUST NOT be executed.
It only states facts. A path requires file access; a text string does not.

### 3.5 Clause constraints and numbering

After embedded rule calls have been excluded (Section 6.2), clauses are
numbered from 1 in statement order. A multi-argument `fact` contributes one
numbered clause per argument. Each clause records the source line where its
statement call begins; facts read by `facts_from` use that call's line.

A clause MUST be rejected when:

- a head is not an atom or compound;
- a head uses `step/4` or `clause/2`, reserved for proof documents, or
  explicitly states the reserved predicate `activated/2`;
- a head is a primitive or control, except the head `'true'` of a query or
  `'false'` of a contradiction; `implies` MUST NOT conclude either atom;
- a body goal is neither a variable, atom nor compound, or is an empty or
  non-proper list in a goal position.

Conjunctive bodies are flattened to their ordered goals. Conjunctive forward
heads retain their order. Only a forward rule may have several heads;
backward templates with several heads are expanded as Section 6.2 defines.
Reserved template and inspection forms are permitted only in the positions
specified in Section 6.

## 4. Goals and Primitives

### 4.1 Goal syntax

A goal is an atom, a compound, a variable to be bound to a callable term,
or a non-empty proper array of goals denoting their conjunction. A number,
an empty array or an open or improper list is not a goal.

Array-to-conjunction notation applies in these positions:

- a rule body and each argument of `query` or `contradiction`;
- each argument of `and`, `or`, `not`, `call` and `once`;
- the second argument of `findall`;
- both arguments of a rule template or source inspection pattern.

It also applies to a forward head, where the conjunction means several
conclusions. Elsewhere an array denotes list data. For example:

```js
query([p(X), q(X)])       // Conjunction of two goals.
query(p([X, Y]))          // One goal with a list argument.
implies(p(X), [q(X), r(X)]) // Two heads.
```

The control meanings apply in goal contexts. Arithmetic terms with the
names `and`, `or` and `not` instead have the meanings of Section 5.

Unbound callable variables and forward dependencies are restricted by
Section 6.1. A goal whose name and arity identify neither a control,
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
followed by digits (Section 3.3), including their renamed-apart copies.

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
| `is(?V, +E)` | | Evaluates `E` (Section 5) and unifies `V` with the result. |
| `eq(+E1, +E2)`, `ne(+E1, +E2)` | | The values of `E1` and `E2` are equal, or not. |
| `lt(+E1, +E2)`, `le(+E1, +E2)`, `gt(+E1, +E2)`, `ge(+E1, +E2)` | | Compares the values of `E1` and `E2`. |
| `is_var(@X)`, `is_nonvar(@X)` | | `X` is an unbound variable, or is not. |
| `is_ground(@X)` | | `X` contains no unbound variable. |
| `is_atom(@X)`, `is_number(@X)` | | `X` is an atom, or a number. |
| `is_int(@X)`, `is_float(@X)` | | `X` is an integer, or a float. |
| `is_compound(@X)` | | `X` is a compound; a non-empty list is one. |
| `functor` | `functor(+T, ?N, ?A)`, `functor(-T, +N, +A)` | Name and arity of `T`, or `T` built with fresh variable arguments. When constructing, `A` MUST be an integer from 0 to 1024. |
| `arg` | `arg(+N, +T, ?A)` | `A` is the `N`th argument of `T`, counting from 1. |
| `univ` | `univ(+T, ?L)`, `univ(-T, +L)` | `L` is the list of `T`'s name and arguments. |
| `atom_chars` | `atom_chars(+A, ?L)`, `atom_chars(-A, +L)` | `L` is the list of `A`'s characters as atoms. |
| `atom_codes` | `atom_codes(+A, ?L)`, `atom_codes(-A, +L)` | `L` is the list of `A`'s character code points. |
| `atom_length` | `atom_length(+A, ?N)` | `N` is the number of characters of `A`. |
| `number_chars` | `number_chars(?N, +L)`, `number_chars(+N, -L)` | A bound `L` is read as a number: an optional sign and decimal digits give an integer, and with a fraction or an exponent a float, as in `'007'`, `'-21.5'`, `'.5'` and `'1E3'`; other text fails. Otherwise `L` spells `N` in its canonical text (Section 9.2). |
| `atom_concat` | `atom_concat(+A, +B, ?AB)`, `atom_concat(?A, ?B, +AB)` | `AB` is `A` followed by `B`; with `AB` given, every split, shortest `A` first. |

A character is a Unicode code point. Every primitive except `atom_concat` has
at most one solution. Primitives MUST be pure: their solutions depend only on
their arguments. A primitive given an argument of the wrong kind for its
patterns raises an error, as `atom_length(123, N)` does; one given arguments
of the right kinds that has no solution fails, as `arg(5, f(1), A)` does.

All primitives take exactly the displayed number of arguments. `functor`
and `univ` expose list structure as specified in Section 2.2; use bracket
syntax when writing lists.

## 5. Arithmetic

### 5.1 Expressions

An arithmetic expression is a number, a variable bound to an expression,
one of the atoms `'pi'`, `'e'`, `'tau'`, or a function term from Section 5.2.
The constants denote binary64 approximations of pi, e and twice pi.
Arguments of a function term are evaluated recursively. An unbound variable,
an unknown function, an unsupported arity or any other atom is an error.

Arithmetic is evaluated only where required by a primitive such as `is`,
`eq` or `lt`. Elsewhere `add(1, 2)` is a compound term, not the number 3.
Comparisons are goals (Section 4.3), not arithmetic expressions.

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
constant atoms of Section 5.1 are arithmetic values. A `float(N)` applied
directly to a JavaScript number in a script constructs a float immediately
(Section 3.3).

### 5.3 Numeric results

Integer arithmetic is exact and unbounded. Integer operands give an integer
result except for `div`, a negative exponent in `pow`, and functions defined
to return a float. Mixed `add`, `sub`, `mul`, `div`, `floordiv`, `mod` and
`pow` give a float. Integer-conversion functions return integers; `min` and
`max` return the selected operand with its original kind. No operation
implicitly makes an integer and a float unify.

`floordiv` rounds down and `mod` has the divisor's sign:
`floordiv(-7, 3)` is -3 and `mod(-7, 3)` is 2. `div` of integers rounds
their exact quotient once to the nearest binary64 value, with halfway cases
rounded to even, including in the subnormal range. Underflow to zero keeps
the sign. `round(X)` gives an integer; `round(X, Digits)` rounds to the
specified number of decimal places. Float spelling is defined in Section 9.2.

Numeric comparison is exact across integers and floats. Bitwise operations
use unbounded two's-complement integers.

### 5.4 Arithmetic errors and limits

An evaluation MUST raise an error, rather than produce a value, on a division
or modulo by zero, a domain error (such as `sqrt(-1)` or `log(0)`), a bitwise
operation, `gcd` or `lcm` on a float, a negative shift count, when the result
is not a finite real number,
or when a power or left shift would need more than 2^26 bits: for a power of
integers `pow(A, B)` with `B > 0` and `abs(A) > 1`, when `B` times the bit
length of `A` exceeds 2^26; for a shift `shl(A, B)` of integers, when `B`
exceeds 2^26.

## 6. Rule Structure

### 6.1 Dependencies and stratification

A body goal depends on a clause when the goal, renamed apart, unifies with
one of the clause's heads. The dependency is **closed** when the goal occurs
inside a negation or as the goal of a collection (Section 4.2), and **open**
otherwise. Each clause has a rank: the least assignment such that a clause's
rank is at least the rank of every clause it depends on, plus one for a closed
dependency. Forward rules run in order of rank (Section 8.2).

A program MUST be rejected when:

- no such assignment exists, because a closed dependency lies on a cycle;
- a forward rule can reach, through dependencies, a clause with a body goal
  that is a variable.

Because dependencies compare whole terms, two relations sharing a predicate
name MAY have different ranks.

### 6.2 Inline rule templates

Nested `implies(Body, Head)` and `implied_by(Head, Body)` calls construct rule
templates. A rule value in a conclusion MUST occur as a top-level conjunct of
an `implies` conclusion; in a body, `implies` and `implied_by` are inspection
goals (Section 6.3). A rule value anywhere else in a clause, such as an
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
as Section 8.2 describes. Variables shared only between sibling templates are
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
each template conjunct by the list of its captured variables, leaving ordinary
heads in place. These lists are compiler data and are never concluded as
facts. Only variables of this projection participate in that firing's witness
construction (Section 8.2). A witness introduced by the generator remains
shared across every use of the derived rule; a witness introduced by a derived
forward rule additionally depends on its captured context. An existential
variable is a feature of a forward rule, not a third rule direction.

All potential clauses participate in Section 6.1, including clauses whose
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
statement (Section 6.2), so a stored rule value used as a pattern loses its
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
at every use. Unrelated unbound variables keep Section 8.2's witness behavior.
When inspection variables remain free in a conclusion or its captured
template context, that firing MUST NOT introduce head-only existential
witnesses: it MUST fail with an error requiring the inspection variables to
be bound first. Section 11.9 rejects certificates that bypass this boundary.

Inspection uses a fixed source catalogue, so its own results do not depend on
forward rounds. Other goals using derived patterns still participate in
stratification. Negation and collection retain their explicit obligations.

## 7. Semantics

### 7.1 Herbrand interpretation

Ordinary predicates have a **Herbrand interpretation**: ground terms denote
themselves, and predicates relate those terms. The **Herbrand universe**
contains the finite ground terms of Section 2, including values constructed
by arithmetic or text operations and Skolem terms. The **Herbrand base** is
the set of ordinary ground predicate applications over that universe,
including predicates of arity 0. An interpretation is a subset of the base.

Matching uses Section 2.3's unification, including its signed-zero rule.
Asserting a relation does not change term identity. Controls, primitives
and source inspection have the fixed meanings of Sections 4-6.

### 7.2 Variables and witnesses

Variables of facts and backward clauses are universally quantified within
their clause, except for collection-local variables (Section 4.2).
`fact(p(X))` states every ground instance of `p(X)`. Resolution may return
a universal answer containing variables without enumerating its ground
instances. Template variables have the scope of Section 6.2.

An unbound variable in a forward conclusion instead receives a witness,
unless it is a scoped inspection variable (Section 6.3). For example,
`implies(person(X), has_token(X, T))` introduces an existential witness for
`T`. Section 8.2 determines its Skolem term from the rule and head context,
including captured template values. Body variables absent from that context
do not distinguish witnesses; shared head variables share a witness.

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
as in Section 7.1. If a body holds, every head of that rule instance holds.
Existential forward rules extend this reading with the specified witnesses.
The closure can be infinite.

Forward and backward clauses both express implication in this fragment;
their directions determine evaluation. A completed ordinary goal search
returns the goal's instances that hold in the model. The model includes
source facts and consequences available only by backward search, beyond
the newly derived facts or selected answers printed by a run.

### 7.4 Negation and collection

For stratified negation, interpret ranks in increasing order, fixing lower
strata before testing absence at a higher rank (Section 6.1). `not(G)`
holds when `G` has no solution, with the binding restrictions of Section
4.2. This is absence relative to the program, not falsity in the world.
For relational goals this gives the stratified least-model reading.

Collection also waits for its dependencies. `findall` collects ordered
search solutions, including repeated derivations and nonground instances;
its meaning is not determined by a set of ground atoms alone. Bindings
made while solving its goal do not escape except through the copied result
list. Clause order and duplicate source clauses can affect that list.

### 7.5 Sets and operational behavior

Derived facts and reported answers follow the duplicate-suppression rules
of Section 8. These rules do not remove alternative search derivations.
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
Section 8 defines the observable goal, clause and result order.

### 7.6 Termination and proof claims

Arithmetic, term construction and witness introduction can generate an
infinite closure. A finite model does not ensure search termination:
`implied_by(p(X), p(X))` has an empty least model, but searching `p('a')`
recurs indefinitely. Exceeding a resource bound raises an error (Section
8.3). Contradictions halt without completing the closure (Section 8.5).
A valid proof establishes only its claims subject to its trusted boundaries
(Section 11.11), not completeness of the model or the answers.

## 8. Evaluation and Conclusions

### 8.1 Goal search

Goals are solved depth-first, left to right. A goal is solved, in order:

1. by a control, primitive or source inspection (Sections 4 and 6.3), when
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

Forward rules run stratum by stratum, in increasing rank (Section 6.1). Within
a stratum, rounds are repeated until a round adds no new fact or rule instance.
In a round, clauses run in clause order. An appended clause runs its derived
instances in the order they were created; a potential clause with no instance
is skipped. Each instance searches only its own body with its captures bound.
All instances of one clause search the same current state, and all solutions
are collected before any conclusion of that clause is published:

- a head variable the solution leaves unbound is bound to a **Skolem term**
  `skolem(Rule, Variable, Arguments)`: `Rule` is the clause number of the
  rule, `Variable` the name of the head variable the term stands for, as the
  program writes it (an anonymous one as `_0`, `_1`, ..., Section 3.3), and
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
  not terminate (Section 8.3). Derived facts other than scoped inspection
  patterns (Section 6.3) are therefore ground. A
  checker verifies the Skolem terms of a proof (C8, Section 11.9);
- a head `'true'` reports the instance of the rule's body, as a conjunction,
  once per distinct instance (by identity of canonical text);
- a head `'false'` records the conclusion `'false'` and stops all reasoning
  with halt code 65;
- a template head derives a rule instance as specified in Section 6.2;
- any other head is added as a derived fact unless an identical fact is
  already derived or is a ground fact of the program.

When the run asks its own goals (Section 8.4), rules whose heads are all
`'true'` are not run.

For a generator, use its scope projection (Section 6.2) as its head when
constructing witnesses. For an appended forward clause of Section 6.2,
prepend one element to
`Arguments`: the grounded capture list of its rule instance. This distinguishes
witnesses of different captured contexts even when a head does not mention
those values. An empty capture list still contributes one element, `[]`.
Original clauses, including generators, use the ordinary witness convention.

Scoped inspection variables of Section 6.3 are preserved instead of receiving
witnesses; derived conclusions may therefore be universal patterns. Each use
renames a pattern and its evidence apart. Such patterns are suppressed when
an alpha-equivalent pattern was already derived. Other derived facts keep
their ordinary ground identity convention.

### 8.3 Resource bounds

A run is bounded by `max_depth`, the depth of nested rule bodies (default
1000000), by `max_inferences`, the number of goals started (default
1000000), and by `max_iterations`, the rounds per stratum (default 1000).
Exceeding a bound MUST raise an error; a partial result MUST NOT be returned
as complete.

Each supplied bound MUST be a positive integer no greater than 9007199254740991.

### 8.4 External goals

A run MAY be given goals. After forward reasoning, each goal is solved in
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
are, followed by the canonical text (Section 9) of each conclusion, one per
line. The comment MUST say when the run halted, when the conclusions answer
goals, when they answer `query()` rules, or when they are derived facts, and
MUST say so when there are none. Comments are informative and MAY be worded
differently; they are ignored when the output is read (Section 9.1).

### 8.7 Proof generation

When a proof is requested, each solution records how each of its goals was
justified: by a fact or rule of the program, by a derived fact (whose own
record is kept), by a primitive, by a control, by an absence (a negation) or
by a collection (`findall`). For each conclusion the first derivation found
is recorded. A reasoner MUST check every proof it generates (Section 11)
before returning it, and MUST fail with an error rather than return a proof
that does not pass. A run without conclusions has a proof without claims,
which is valid and certifies nothing.

A goal such as `is_var(X)` followed by `unify(X, 'a')`
cannot be recorded faithfully by its final substitution, so such a run
cannot produce a proof.

## 9. Document Syntax and Canonical Text

A document is data, not a program. Readers MUST use the syntax below and
MUST NOT execute any expression. Writers MUST use the canonical forms of
Sections 9.2-9.4. The grammar is given in Appendix A.

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
  variable (Section 4.2) and a name starting with `VAR_` is decoded
  (Section 9.2), with malformed encodings rejected;
- a call of a plain name: the compound, or the atom when there are no
  arguments; `struct('name', ...)` as in Section 9.3; `and` and `or` with
  more than two arguments as in Section 4.2;
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
with `0`. Reading canonical text MUST recover the original term.

A call's name and opening `(` MUST NOT be separated by a line feed outside
a comment. The same restriction applies between a numeric minus and its
literal. Other line feeds inside brackets are layout.

Bare names are variables regardless of case: `alice` in a document is a
variable; use `'alice'` for an atom. A no-argument call such as `alice()`
also denotes the atom. `2` and `2n` denote integers, while `2.0` and `2e0`
denote floats. `float(2)` is a compound expression, not a float literal.
Array syntax denotes list data; only reading it as a goal applies the
conjunction rules of Section 4.1.

String escapes are `\\`, `\'`, `\"`, `\n`, `\r`, `\t`, `\b`, `\f`,
`\v`, `\0` (not followed by a decimal digit), `\xHH`, `\uHHHH` and
`\u{H...}` with one to six hexadecimal digits denoting a Unicode code point.
Other escapes and raw line breaks in strings MUST be rejected. Outside
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
  (letters, digits and `_`, not starting with a digit), not a reserved word
  of JavaScript, not `_` and does not begin with `VAR_`. Any other name is
  written `VAR_` followed by the name with every ASCII letter and digit kept,
  every `_` doubled and every other character `c` replaced by `_hex_` where
  `hex` is the lowercase hexadecimal code point of `c`. The variable name `A-B`
  is thus written `VAR_A_2d_B`. A reader decodes such a name back
  (Section 9.1).
- A list is written `[I1, I2, ...]`; an open list ends with `, ...Tail`.

### 9.3 Canonical compounds

A compound is written `name(A1, A2, ...)` when its name is an ASCII
identifier, not a reserved word of JavaScript and not `struct`, and
`struct('name', A1, ...)` otherwise. Arguments are separated by `, `.

A chain of conjunctions or disjunctions built from the left,
`and(and(A, B), C)`, is written as one call, `and(A, B, C)`. A compound
`and/N` or `or/N` with more than two arguments is written with `struct`, as
`struct('and', A, B, C)`.

### 9.4 Variable scope in output

The conclusions a run writes, its proof documents (Section 10) and check
reports (Section 12) use the following variable names. In
the conclusions of a run and in a proof document, the variables are named
`A`, `B`, ..., `Z`, `A1`, ..., `Z1`, `A2`, ... in the order the document
first shows them, across the whole document, the conclusions written first;
the clause displays of a proof keep the program's names. A check report
names the variables of each fact anew (Section 12).

## 10. Proof Documents

### 10.1 Structure

A proof document is a document (Section 9.1) holding, in this order:

1. the output of the run (Section 8.6): its comment line, then its
   conclusions, one per line;
2. an empty line;
3. when the proof cites any clause, a comment line introducing the clauses,
   then one `clause(N, Display)` per program clause the proof cites, by
   increasing `N`;
4. an empty line;
5. when there are steps, comment lines saying what a step records, then one
   `step(Goal, By, Bindings, Uses)` per justified goal.

Comments are informative and MAY be worded differently; they are ignored when
the document is read.

A checker MUST treat every statement that is neither `clause/2` nor `step/4`
as a claim, whatever its position.

### 10.2 Clause displays

`Display` shows clause `N` in normalized statement form: `fact(Head)`,
`implies(Body, Head)`, `implied_by(Head, Body)`, `query(G1, ...)` or
`contradiction(G1, ...)`, where `Body` is the clause's one body goal, or the
array of its body goals when it has several, `Head` likewise the head or the
array of heads, and `G1, ...` are the body goals themselves. Displays are not
authority: a checker MUST compare each with the program it checks against.

Each argument of a multi-argument `fact` has its own `fact(Head)` display.
Conjunctive query and contradiction bodies are displayed as separate goal
arguments: `query([p(X), q(X)])` has display `query(p(X), q(X))`.

For a program with templates, displays show the original generators and the
potential appended clauses of Section 6.2. A derived rule's body includes all
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
| `'control'` | `Goal` is `call`, `once` or a disjunction, solved by `Uses`. | empty | the solved goals |
| `'absent'` | `Goal` is a negation taken on trust. | empty | empty |
| `'collected'` | `Goal` is a `findall` taken on trust. | empty | empty |

`Bindings` is an object from each variable name of the cited clause, as
the program wrote it, to its value in this step: `{X: 'socrates'}`. A
reasoner writes every variable of the clause, in the order the clause display
first shows them (for `implies`, the premise first);
a checker MUST accept partial bindings when the goal and uses determine the
omitted values needed by C1 and C8. Values needed only by an enclosing
witness scope must be supplied when those terms do not determine them.
A primitive has no variables of its own, so `'builtin'` steps have
empty bindings. A derived clause's bindings also include variables of its
enclosing generators' scope projections, so their witnesses can be checked.
These variables are renamed together with the clause's head and full body.

## 11. Proof Checking

A checker is given a program, a proof document and, when the proof answers
goals asked from outside the program, those goals. It MUST NOT call a
reasoner to supply a missing step; it MAY recompute primitives. It
establishes eight conditions and records each failure with its condition, a
detail and, where there is one, the term concerned.

### 11.1 Reading the document

The document MUST read (Section 9.1); otherwise C3 fails and the document has
no claims and no steps. Each `clause(N, Display)` MUST name a clause of the
program whose display (Section 10.2) is identical to `Display`; otherwise C1
fails. Each `step` MUST have bindings that read as a list of `'='/2` pairs,
as an object literal does, and a list of uses, and no two steps may have
identical goals; otherwise C3 fails and the step is set aside. Every other
statement is a claim (Section 10.1).

### 11.2 C1 Resolution

For a `clause(N)` step, `N` MUST be a clause of the program. The clause,
renamed apart, MUST satisfy: each binding names a distinct variable of the
clause and unifies it with its value; and for one of the clause's heads
(each conjunct of a forward rule's head), the head unifies with `Goal` and
the body, of the same length as `Uses`, unifies with `Uses` pairwise, such
that afterwards the head is identical to `Goal` and each body goal to its
use. A step's own terms MUST NOT need further instantiation to match: a
source clause `same(X, X)` cannot justify `same('a', 'b')`.

For a derived clause step, each enclosing generator MUST belong to the
program. Its bindings may name variables of those generators' scope
projections as well as of the clause itself. The checker renames these
projections together with the clause before applying the bindings.

For a `source(N)` step, `N` MUST identify an eligible source rule of Section
6.3. Bindings and uses MUST both be empty. The rule's inspection term,
renamed apart, MUST unify with `Goal` and resolve exactly
to it without instantiating the step's own terms. This checks variable
sharing as well as the rule's direction and structure. The source rule is
read as data; its body is not derived by the checker. These steps count as
verified C1 steps and cite the usual source clause display.

### 11.3 C2 Well-foundedness

No step MAY depend on itself through the uses of steps.

### 11.4 C3 Justification

`By` MUST be one of the forms of Section 10.3. A `'builtin'` step MUST have
no bindings and no uses and a goal that is a primitive; an `'absent'` or
`'collected'` step MUST have no bindings and no uses and a goal that is a
negation or a `findall`, respectively.

### 11.5 C4 Coverage

Each conjunct of each claim MUST have a step. Each use, and each conjunct of
a use, MUST have a step or be identical to an instance of a fact of the
program. A document without claims is valid and certifies nothing.

### 11.6 C5 Re-decision

A `'builtin'` step's goal, solved as a primitive with no prior bindings, MUST
succeed without binding anything. A `'control'` step MUST have no bindings,
and its uses MUST be identical, in order, to the conjuncts of the argument of
`call` or `once`, or of one side of a disjunction. When trusted boundaries are
forbidden ("strict"), each `'absent'` or `'collected'` step fails C5.

Host math is the one exception to identical re-decision. A `'builtin'` step
`is(V, E)`, where `V` is a float and `E` applies `exp`, `log`, `log2`,
`log10`, a trigonometric or hyperbolic function, or `pow`, also passes C5
when `E` evaluates to a float at most 4 units in the last place from `V`,
that is, with at most 3 floats between them. Such results may differ between
conforming implementations (Section 14), so a proof made by one still checks
with another. Every other recomputed result MUST be identical; a difference
that grows beyond this bound, for example through cancellation, MAY make a
proof fail on an implementation other than the one that made it.

### 11.7 C6 Boundary consistency

A trusted boundary cannot be proved, but the evidence at hand can refute it.
The evidence for a goal is: when the goal is a ground primitive, the goal
itself if it holds, and otherwise the recomputed fact that it fails; when it
is a control, none, and the boundary is left undecided; otherwise the
program's facts and the goals of the document's steps with the same name and
arity. A goal of the last kind **has evidence** only when there is at least
one such fact or step goal; with none, nothing could refute the boundary, and
it is left undecided.

- An absence `not(G)` is decided when `G` is a single goal, or a ground
  conjunction, whose every goal has evidence. It fails C6 when every goal of
  `G` unifies with some of its evidence; the anonymous variables of `G`
  unify with anything.
- A collection `findall(T, G, L)` fails C6 when `L` is not a list, and is
  decided when `G` is a single goal with evidence. It fails C6 when an
  instance of `T` for some evidence of `G` unifies with no element of `L`.

A boundary that is not refuted remains an obligation (Section 12).

### 11.8 C7 Relevance

When goals were given and no claim is `'false'`, the questions are the goals.
Otherwise the questions are, for each forward rule, each ordinary head other
than `'true'`, and the rule's body as a conjunction when one of its heads is
`'true'` and no claim is `'false'`. Each claim MUST be an instance of a
question. Each step MUST be reachable from a conjunct of a claim through the
conjuncts of uses.

### 11.9 C8 Witness integrity

A forward rule's head MAY contain variables its body does not contain; each
says that something exists, and a reasoner concludes it with a Skolem term
(Section 8.2). C1 alone would accept any value for such a variable, since any
value gives an instance of the rule, so for a `clause(N)` step citing a
forward rule, under the substitution of C1, each such variable `V` MUST be
bound to `skolem(N, Name, Args)`, where:

- `Name` is the name of `V` as the program writes it (Section 8.2);
- `Args` is the same for every such variable of the step, and is the list of
  the values of the heads' variables, in order of their first occurrence in
  the heads, that are ground and contain no Skolem term `skolem(N, _, Args)`:
  the values that do contain one hold a witness of this firing.

When a forward clause has any such variables, its full head under the step's
substitution MUST be ground. A generic inspection pattern cannot share one
existential witness across all its instances (Section 6.3).

For a generator, use its scope projection (Section 6.2) as the head for this
check. For every derived clause step, including a backward clause step, the
checker MUST also perform C8 for each enclosing generator under the same
substitution. A forged outer witness cannot be authorized by using it in a
backward conclusion. Variables supplied by the instance's captures are not
new witnesses of the derived clause.

For an appended forward clause of Section 6.2, prepend the capture list,
instantiated under the step's substitution, as one element of `Args`, as
required by Section 8.2. The checker MUST compute this from the source
template's capture list and the substitution, not from the witness term.

A variable of the head that also occurs in the body is not checked by C8,
even when the body leaves it unbound; its value comes from the uses, which
other conditions check. A step with no witnesses in its own forward head or enclosing generators is
not covered by C8.

### 11.10 Counts and validity

| Condition | Covered |
| --- | --- |
| C1 resolution | `clause` and `source` steps that passed C1 |
| C2 well_founded | steps |
| C3 justification | steps |
| C4 coverage | claims plus uses |
| C5 re_decision | `'builtin'` and `'control'` steps that passed C5 |
| C6 boundary_consistency | boundaries decided |
| C7 relevance | claims plus steps |
| C8 witness_integrity | `clause` steps with witnesses in their forward head or enclosing generators that passed C8 |

A check also counts the **steps** it read, the **claims**, the `clause` steps
**verified** by C1, the `source` inspection steps also **verified** by C1,
the `'builtin'` steps **recomputed** by C5, the
`'control'` steps **composed** by C5, and the `'absent'` and `'collected'`
steps **trusted**.

A proof is **valid** when no condition failed. A valid proof with trusted
boundaries is valid *conditional on* them.

### 11.11 Scope of a valid proof

A valid proof establishes that each of its claims follows from the program
by the recorded steps, given its trusted boundaries. It does not establish
that the claims are all the conclusions of the program, that the program
derives no `'false'`, or that the program is the one intended: a proof MAY
leave conclusions out, and a run's own proof holds exactly its conclusions.

## 12. Check Reports

A check report is a document (Section 9.1) beginning with the proof's claims,
in proof order, in canonical text, one per line, followed by a blank line and
the following report facts, one per line:

1. `condition(Id, Name, Outcome, Covered)` for C1 to C8, where `Outcome` is
   `'ok'` or `failed(N)`, `N` the number of that condition's failures;
2. `failure(Condition, Subject, Detail)` per failure, where `Subject` is the
   term concerned or `'proof_document'`, and `Detail` an atom;
3. `obligation(Kind, 'theory_scoped', Goal)` per trusted boundary, in step
   order, where `Kind` is `'absent'` or `'collected'`;
4. `steps(N)`, `verified(N)`, `recomputed(N)`, `composed(N)`, `trusted(N)`,
   `claims(N)`, the counts of Section 11.10;
5. `verdict(V)`, where `V` is `failed(N)` when `N` failures were recorded,
   otherwise `'checked_with_obligations'` when there are obligations,
   otherwise `'checked'`.

Comments MUST identify these initial terms as checked answers only when the
report is valid with no obligations. A valid report with obligations MUST
label them as conditional on those obligations. A failed report MUST label
them as unverified claims; their inclusion does not validate them. A valid
report with no claims MUST say it establishes no conclusions. Comments also
explain the C1-C8 order, failures and obligations when present, the statistics,
and that the verdict does not establish completeness. Comments are informative
and MAY be worded differently. They are ignored when the document is read.

Failures are listed in the order they are found: those of reading the
document (Section 11.1), in document order; C4 for each claim, in claim
order; then for each step, in document order, C4 for its uses and the C1, C3,
C5 or C8 failure of its justification; C6 for each boundary, in step order;
C7 for each claim, then for each step; and C2.

`Detail` is informative text identifying what failed; its wording is not
specified. It MUST NOT affect validity, counts or the condition reported.

The initial answers keep the variable names of the proof. The variables of
each subsequent report fact are renamed `A`, `B`, ..., `Z`, `A1`, ... in order
of first occurrence. A report is ordinary data: `facts_from` (Section 3.4)
states it as facts.

### 12.1 JSON form

The JSON form includes `answers`, an array of the initial claims' canonical
texts, including unverified claims when `valid` is false. It also has `valid` (boolean), `steps`,
`claims`, `verified`, `redecided` (the count `recomputed`), `composed`,
`uses` (the number of uses of all steps, integers), `trusted`
(a list of `{kind, conclusion}`), `failures` (a list of
`{condition, detail, conclusion?}`) and `conditions` (a list of
`{id, name, covered, failed}`), where `conclusion` is a canonical text.

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
| `--goal GOAL` | Ask `GOAL`, read as in Section 9.1, where an array is a conjunction; MAY be repeated. With `--check-proof`, the goals the proof answers. |
| `--strict-proof` | With either checking mode, forbid trusted boundaries. |
| `--unused` | Print the unused clauses (Section 13.2). |
| `--stats` | Print reasoning statistics as JSON to standard error: `inferences`, the goals started, which `--max-inferences` bounds; `rounds`, the forward rounds run over all strata; and `derived`, the facts forward rules added, not counting a conclusion the program states as a fact, a query's answers or `'false'`. |
| `--max-depth N`, `--max-iterations N`, `--max-inferences N` | The bounds of Section 8.3; `N` MUST be a positive safe integer, at most 9007199254740991. |
| `-v`, `--version` | Print the version. |
| `-h`, `--help` | Print the usage, including every option and its short alias where one exists. |

`--proof`, `--prove-and-check`, `--check-proof` and `--unused` are mutually
exclusive. `--json` and `--strict-proof` need a checking mode. With
`--prove-and-check`, reasoning bounds and `--stats` apply to proof generation;
an invalid check returns 2, otherwise the run's halt code is retained
(65 for a contradiction, 0 otherwise). A program
text that has a line starting with `step(` is a proof document; given one as
a program, the command line MUST say how to check it instead.

| Exit code | Meaning |
| --- | --- |
| 0 | Success, including a check that found the proof valid. |
| 1 | An error, printed to standard error as `eyemind: message`. |
| 2 | A check that found the proof not valid; the report is printed as usual. |
| 65 | The run halted (Section 8.5). |

### 13.2 Unused clauses

A clause is **unused** when no conclusion's recorded derivation cites it,
unless a negation or collection in the proof could consult it and its
omission changes the conclusions or halt code, or causes an error. The clauses a
negation or collection could consult are those whose heads have the name and
arity of a goal it reaches through the program's bodies. Running the program
without a clause leaves every other clause its number (Section 3.4), so the
Skolem terms of the other rules (Section 8.2) do not change.

Unused clauses are reported one per line, in clause order, as
`unused(line(L), Display)`, where `L` is the clause's line (Section 3.4) and
`Display` as in Section 10.2.

"Unused" is relative to the recorded derivations, which are the first ones
found (Section 8.7). A clause that only offers a second derivation of a
conclusion, such as a duplicate rule, is unused, though leaving out the
clause that offers the first one would make it used; leaving out several
unused clauses together can therefore change the conclusions. A
`contradiction` rule that never fires changes no conclusion and is unused,
though it guards the program against data that would make it fire.

## 14. Conformance

A conforming reasoner MUST implement the program syntax, semantics and
evaluation of Sections 2-8 and the document and proof formats of Sections
9-12. It MUST check every proof it generates before returning it. A
conforming checker MUST implement Sections 9-12 against the supplied
program, including the clause and template rules of Sections 3 and 6,
without invoking a reasoner to complete the certificate. The command-line
interface of Section 13 is a separate conformance requirement.

Canonical term spelling, conclusion order, proof contents and report counts
are required as specified. Comment wording and failure `Detail` text are
informative. Fresh variable names are unspecified where Section 2.4 says
so. Float results of `exp`, logarithms, trigonometric and hyperbolic
functions, and `pow` with floats MAY differ by one unit in the last place,
and C5 accepts a result of such a function within 4 units (Section 11.6).

The conformance cases and saved example documents exercise these
requirements. They do not replace the definitions in this specification.

## 15. Security

Programs execute JavaScript and require the caller's trust. Documents,
including proofs, reports, goals and `facts_from` input, MUST be read as data
without executing code. A deployment accepting untrusted documents SHOULD
bound their size, nesting depth, processing time and memory, in addition to
the reasoning bounds of Section 8.3. A valid proof establishes only the
claims and assumptions described in Section 11.11.

## Appendix A. Document Grammar

This grammar defines document expressions. Quoted strings are literal
tokens; `|` gives alternatives, `[ ... ]` an optional part, `{ ... }`
repetition, parentheses grouping, and `? ... ?` a lexical class defined in
prose. String literals, reserved names and
layout follow Section 9.1. Line feeds inside brackets are layout; outside
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

Its proof document (Section 10):

```js
// Answers: each instance of a query() that holds.
type('socrates', 'mortal')
type('socrates', 'human')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(type('socrates', 'human')))
clause(2, fact(subclass_of('human', 'mortal')))
clause(3, implies([type(S, A), subclass_of(A, B)], type(S, B)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(type('socrates', 'mortal'), clause(3), {S: 'socrates', A: 'human', B: 'mortal'}, [type('socrates', 'human'), subclass_of('human', 'mortal')])
step(type('socrates', 'human'), clause(1), {}, [])
step(subclass_of('human', 'mortal'), clause(2), {}, [])
```

Its check report (Section 12):

```js
// Checked answers: these follow from the input program.
type('socrates', 'mortal')
type('socrates', 'human')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 3)
condition('C2', 'well_founded', 'ok', 3)
condition('C3', 'justification', 'ok', 3)
condition('C4', 'coverage', 'ok', 4)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 5)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(3)
verified(3)
recomputed(0)
composed(0)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```
