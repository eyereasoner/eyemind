# <img src="assets/eye.png" alt="" width="48" height="48" align="absmiddle"> eyemind specification

```text
Title:      The eyemind Rule Language and Proof Format
Version:    eyemind 0.1.29
Status:     Informational
Author:     Jos De Roo, KNoWS office of IDLab, Ghent University - imec
Repository: https://github.com/eyereasoner/eyemind
```

## Abstract

eyemind is a rule language written in JavaScript, with forward and backward
reasoning, and a proof format whose documents a separate checker verifies
against the program that produced them. This document specifies the terms
the language reasons over, how a program is stated in JavaScript, what a
program concludes, the canonical text in which terms, conclusions, proofs and
check reports are written and read back, the proof document, the eight
conditions (C1-C8) a proof checker establishes, the check report, and the
command line.

## Status of This Memo

This document is not an Internet Standards Track specification. It describes
the language and formats as implemented by eyemind 0.1.29, for readers who want
to write programs, produce or consume proofs and reports, or implement a
compatible reasoner or checker. Where this document and the implementation
disagree, that is a defect in one of them.

## Table of Contents

1. [Introduction](#1-introduction)
2. [Conventions and Terminology](#2-conventions-and-terminology)
3. [Terms](#3-terms)
4. [Programs](#4-programs)
5. [Goals, Controls and Primitives](#5-goals-controls-and-primitives)
6. [Arithmetic](#6-arithmetic)
7. [Reasoning](#7-reasoning)
8. [Canonical Text](#8-canonical-text)
9. [Reading Documents](#9-reading-documents)
10. [Proof Documents](#10-proof-documents)
11. [Proof Checking](#11-proof-checking)
12. [Check Reports](#12-check-reports)
13. [Unused Clauses](#13-unused-clauses)
14. [Command Line](#14-command-line)
15. [Security Considerations](#15-security-considerations)
16. [Conformance](#16-conformance)
- [Appendix A. Document Grammar](#appendix-a-document-grammar)
- [Appendix B. Example](#appendix-b-example)

---

## 1. Introduction

An eyemind program states facts and rules. Forward rules are applied until no
new conclusion follows; backward rules are applied when a goal asks for them.
Every conclusion can be accompanied by a proof: a document that names, for
each step, the program clause or primitive that justifies it. A checker that
never consults the reasoner verifies such a document against the program and
reports, condition by condition, what it established and what it had to take
on trust.

Programs are JavaScript scripts. Conclusions, proofs and check reports are
JavaScript expressions, one per line, which a reader turns back into terms
without executing them. One language thus states the rules, computes with
them, and holds every result.

## 2. Conventions and Terminology

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY" and "OPTIONAL" in this document
are to be interpreted as described in BCP 14 (RFC 2119, RFC 8174) when, and
only when, they appear in all capitals.

- **Term**: a value the language reasons over (Section 3).
- **Clause**: a fact, a forward rule or a backward rule (Section 4).
- **Goal**: a term solved by resolution or by a primitive (Section 5).
- **Substitution**: a mapping from variable names to terms.
- **Instance**: a term obtained from another by applying a substitution.
- **Identical**: two terms are identical when their canonical texts
  (Section 8) are equal; variables are identical only to themselves.
- **Ground**: containing no variable.
- **Conclusion**: a term a run reports (Section 7.6).
- **Document**: text holding a sequence of expressions (Sections 9-12).
- **Reasoner**: an implementation of Sections 3-10, which checks its own
  proofs as Section 11 describes.
- **Checker**: an implementation of Sections 9, 11 and 12.

## 3. Terms

A term is one of:

| Kind | Representation | Example |
| --- | --- | --- |
| Atom | a JavaScript string | `'socrates'`, `'[]'` |
| Integer | a JavaScript `BigInt`, of unbounded size | `42`, `-7` |
| Float | a JavaScript number that is a float, an IEEE-754 binary64 value | `0.5`, `1e+22`, `2.0` |
| Variable | a name | `X`, `_Rest` |
| Compound | a name (an atom) and one or more argument terms | `parent('alice', 'bob')` |

A compound term is identified by its name and its arity, the number of its
arguments, written `name/arity`. An atom used as a goal has arity 0.

**Lists.** The empty list is the atom `'[]'`. A non-empty list is the
compound `'.'(Head, Tail)`. A list whose final tail is not `'[]'` is an open
list. Character text is a list of one-character atoms.

**Numbers.** Integers and floats are distinct: `1` and `1.0` MUST NOT unify.
Floats MUST be finite; no operation produces an infinity or a NaN as a term
(Section 6). Nonfinite JavaScript values and float literals that overflow,
such as `1e999`, MUST be rejected in programs, goals and documents. Booleans,
`null` and `undefined` are not terms.

**Unification** is syntactic unification on finite trees. It MUST apply the
occurs check: binding a variable to a term that contains it fails. Atoms unify
when their texts are equal; numbers when they are of the same kind and equal;
compounds when their names and arities are equal and their arguments unify
pairwise.

**Standard order.** Terms are totally ordered as: variables, then numbers,
then atoms, then compounds. Numbers are ordered by value, compared exactly
across integers and floats; a float precedes an integer of equal value.
Atoms are ordered by the code points of their characters. Compounds are
ordered by arity, then name, then arguments from left to right. Distinct
variables are ordered by the code points of their names, so the order is the
same in every comparison. The names of renamed-apart variables (Section 7.1)
are implementation-specific, so a program SHOULD NOT depend on the relative
order of two distinct unbound variables.

The floats `0.0` and `-0.0` unify and compare equal, but are not identical:
their canonical texts differ (Sections 2 and 8.1). This distinction also
applies when they occur inside compounds or lists. A lone UTF-16 surrogate
in a JavaScript string is ordered by its own code point; a valid surrogate
pair denotes one supplementary code point.

## 4. Programs

### 4.1 Program scripts

A program is a JavaScript script, run in sloppy mode with every name it does
not declare resolved as Section 4.3 says. It needs no import. Running the
script states the program's clauses in the order the calls are made; `fact`
MAY state several clauses in one call (Section 4.2). Several scripts MAY be
loaded as one program; their clauses are then numbered in the order the
scripts are run.

A program is given exactly the names needed to state it: the statements of
Section 4.2, `forward`, `backward`, `preds`, `vars`, `struct`, the controls and primitives of
Section 5, the atom `fail`, and `eyemind`, the library, with which a program
can build and run another program and read and write documents
(`eyemind.build`, `eyemind.run`, `eyemind.checkProof`, `eyemind.checkReport`,
`eyemind.verdictText`, `eyemind.readTerm`, `eyemind.readTerms`, `eyemind.write`).

### 4.2 Statements

| Statement | Clause stated |
| --- | --- |
| `fact(T1, T2, ...)` | One fact per argument. |
| `implies(Premise, Conclusion)` | A forward rule: the premise's goals are its body and the conclusion its head, or its heads when the conclusion is an array of them. |
| `implied_by(Conclusion, Premise)` | A backward rule: the conclusion is its head and the premise's goals are its body. |
| `query(G1, G2, ...)` | A forward rule with the head `'true'` and the body `G1, G2, ...`: it reports its body's instances (Section 7.2). At least one goal is REQUIRED. |
| `contradiction(G1, G2, ...)` | A forward rule with the head `'false'` and the body `G1, G2, ...`: it halts the run (Section 7.2). At least one goal is REQUIRED. |
| `facts_from(path)` or `facts_from({text: ...})` | One fact per expression of a document (Section 9). |

A premise is a goal or an array of goals, their conjunction (Section 5.1). A
body goal that is a conjunction is split into its conjuncts; the clause body
is the resulting sequence of goals.

`implies` and `implied_by` take exactly two arguments. Each call also returns
a rule value; when that value is embedded in another statement of the same
program build, the call contributes a template instead of a standalone clause
(Section 4.6). An ignored or unembedded return value keeps its standalone
clause.

Clauses are numbered from 1 in the order they are stated, omitting embedded
rule calls. Each clause records
the line of the program on which the statement stating it begins; the facts
of `facts_from` record the line of that call.

`facts_from` is how a program takes in data that is not a program: a document
of plain expressions, one per line, such as the conclusions, proof or check
report of another run, or data from a source that is not trusted. The
document is read as Section 9 describes and is never executed, so it can only
ever state facts. A data file written as a program instead (`fact(...)`
statements) would run as JavaScript code.

A clause MUST be rejected when:

- a head is not an atom or a compound;
- a head is `step/4` or `clause/2`, which are reserved for proof documents,
  or explicitly states `activated/2`, reserved for template activations;
- a head is a primitive (Section 5.2) or a control (Section 5.1), except the
  head `'true'` of a query and `'false'` of a contradiction; in particular a
  conclusion of `implies` is never `'true'` or `'false'`;
- a body goal is not a variable, an atom or a compound, or is an empty array.

### 4.3 Names a program does not define

A name a program uses without declaring it (with `const`, `let`, `var`,
`function` or `class`, or by assigning to it) is supplied as follows:

1. a name the program is given (Section 4.1) has that meaning;
2. the JavaScript globals `Math`, `JSON`, `BigInt`, `Infinity`, `NaN`,
   `undefined`, `console`, `globalThis`, `parseInt`, `parseFloat`, `isNaN`
   and `isFinite` keep their meaning;
3. any other name beginning with an uppercase letter or `_` is the variable of
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

A top-level expression statement that calls a predicate supplied by rule 4,
such as a misspelled `fcat(p(1))`, states nothing; a loader MUST report it as
an error rather than ignore it.

### 4.4 Terms in a program

Within a program, a JavaScript string is an atom and a `BigInt` an integer. A
finite JavaScript number is an integer when it is integral and a float
otherwise: `2` and `2.0` are both the integer 2, and `float(2)` is the float
2.0. An integer beyond 2^53 is written as a `BigInt` literal, such as
`9007199254740993n`, since a number literal would already have rounded it. An
array is a list, and `[H, ...T]` the list with head `H` and tail `T`.
`struct('name', A1, ...)` builds a compound with any name, and
`struct('name')` the atom. Every occurrence of `_` in a clause is a distinct
variable, an **anonymous variable**: the occurrences are named `_0`, `_1`,
... in the order of the clause's text, skipping names the clause already
uses, and clause displays and bindings (Section 10) show these names. A
program SHOULD NOT name its own variables `_` followed by digits, which
Section 5.1 treats as anonymous.

In a goal position, an array is the conjunction of its items: a statement's
goal, the argument of `and`, `or`, `not`, `call` and `once`, and the goal of
`findall`, and either part of a rule template (Section 4.6). Anywhere else an
array is a list.

Operators do not build terms. Variables, compounds and predicates have no
JavaScript primitive value, so an operator applied to one, such as `X + 1` or
`X > 1`, MUST raise an error that says what to write instead: `add(X, 1)`,
`gt(X, 1)`. An operator applied only to plain JavaScript values is
JavaScript's own: `3 + 4` is the integer 7, and `1 < 2` is the JavaScript
`true`, which is not a term, so stating it is an error.

### 4.5 Stratification

A body goal depends on a clause when the goal, renamed apart, unifies with
one of the clause's heads. The dependency is **closed** when the goal occurs
inside a negation or as the goal of a collection (Section 5.1), and **open**
otherwise. Each clause has a rank: the least assignment such that a clause's
rank is at least the rank of every clause it depends on, plus one for a closed
dependency. Forward rules run in order of rank (Section 7.2).

A program MUST be rejected when:

- no such assignment exists ("unstratified negation or collection
  dependency"), that is, a closed dependency lies on a cycle;
- a forward rule can reach, through dependencies, a clause with a body goal
  that is a variable ("forward dependencies require statically named calls").

Because dependencies compare whole terms, two relations sharing a predicate
name MAY have different ranks.

### 4.6 Inline rule templates

Nested `implies(Body, Head)` and `implied_by(Head, Body)` calls construct rule
templates. A rule value in a conclusion MUST occur as a top-level conjunct of
an `implies` conclusion; in a body, `implies` and `implied_by` are inspection
goals (Section 4.7). A rule value anywhere else in a clause, such as an
argument of an ordinary head or goal, or the template or result of `findall`,
MUST be rejected. The
conclusion MAY combine ordinary heads and several templates. Each template's
body and head MAY themselves be conjunctions, written as arrays. A backward
template with several heads defines one backward clause per head, sharing
the same activation and body. Empty and open lists are not goals or heads.

JavaScript evaluates inner calls first. When a statement embeds the rule
value returned by an earlier call in the same program build, the earlier
call's standalone registration MUST be removed before clause numbering and
validation. This applies through arrays, helpers and stored values. A value
MAY be reused in several generators; none of those uses restores its
standalone registration. Separate program builds collect their registrations
independently, even when a rule value is passed between them. Anonymous
variables are named within each enclosing clause, so anonymous variables of
the template cannot capture unrelated anonymous variables of the generator.

The pure constructors `forward(Body, Head)` and `backward(Head, Body)` also
construct templates with the same lowering and scope. They do not themselves
register clauses.

A template variable is **captured** when it also occurs in the generating
clause's body or in an ordinary sibling head. The other variables are local
to that template: they are universally quantified within the generated rule,
except for head-only variables of a forward template, which receive witnesses
as Section 7.2 describes. Variables shared only between sibling templates are
local to each. Every call in a template body, including calls inside controls,
MUST be statically named; a variable in a term's argument is permitted, but a
variable used as a goal is not. A forward template MAY conclude further inline
templates. A backward template MUST NOT conclude templates.

Templates are lowered before validation, indexing and stratification. Starting
with all stated clauses, in clause order, replace each template conjunct,
left to right, with `activated(N, Captures)`. `Captures` is a list of its
captured variables in order of first occurrence in the template as written;
`N` is the number of the first clause appended for it. Append a forward or
backward clause as specified by the template, with the activation as its first
body goal, followed by the template's body goals. A forward template keeps its
head conjunction; a backward template appends one clause per head in order.
Continue processing the appended clauses in order, lowering any nested
templates the same way. Original clause numbers are kept; appended clauses
are numbered consecutively after them and inherit the generator's source line.
Capture metadata belongs to each appended clause, including one whose head
is subsequently lowered again.

For example, `implies(cat(X), implies(dog(Y), test('yes')))` as the only
stated clause becomes these two clauses:

```js
implies(cat(X), activated(2, []))
implies([activated(2, []), dog(Y)], test('yes'))
```

`Y` stays local to the second clause. Its activation is required even though
the template does not capture `X`. A generator with several solutions but
identical captures enables the same rule instance. No arbitrary rule term is
installed during reasoning. All potential generated clauses and their
activation dependencies participate in Section 4.5, including clauses whose
generators never fire. A closed dependency cycle MUST therefore be rejected
even if its template would remain inactive.

### 4.7 Source rule inspection

As goals, `implies(Body, Head)` and `implied_by(Head, Body)` match ordinary
forward and backward source rules respectively. The fixed catalogue contains
only original `implies` and `implied_by` clauses whose heads contain no rule
templates and whose bodies contain no inspection goals, including inside
controls. Facts, queries, contradictions, template generators and appended
clauses are excluded. Inspecting rules therefore cannot inspect themselves.
A rule value used as an inspection pattern is embedded in the inspecting
statement (Section 4.6), so a stored rule value used as a pattern loses its
standalone clause and is not in the catalogue.

The catalogue keeps source order. A rule's body and forward head conjunctions
are terms `and(...)`, as normalized goals are, and inspection arguments are
goal positions. Each attempt freshens the whole rule with one variable map:
shared variables stay shared, and different attempts are independent. Matching
can instantiate these variables. Inspection reads the rule's structure; it
does not solve its body or establish that its head holds.

Free variables supplied by a successful inspection are scoped universal
pattern variables. Forward conclusions preserve them, including through
backward derivations and copied collection results. Derived patterns are
identified up to variable renaming and freshened, together with their evidence,
at every use. Unrelated unbound variables keep Section 7.2's witness behavior.
When inspection variables remain free in a conclusion or its captured
template context, that firing MUST NOT introduce head-only existential
witnesses: it MUST fail with an error requiring the inspection variables to
be bound first. Section 11.9 rejects certificates that bypass this boundary.

Inspection uses a fixed source catalogue, so its own results do not depend on
forward rounds. Other goals using derived patterns still participate in
stratification. Negation and collection retain their explicit obligations.

## 5. Goals, Controls and Primitives

The program-dependent source inspection goals `implies/2` and `implied_by/2`
are defined in Section 4.7.

### 5.1 Controls

| Control | Term | Meaning |
| --- | --- | --- |
| `and(A, B)`, `[A, B]` | `and(A, B)` | Conjunction: solve `A`, then `B`. |
| `or(A, B)` | `or(A, B)` | Disjunction: the solutions of `A`, then those of `B`. |
| `not(G)` | `not(G)` | Negation: succeeds once, binding nothing, when `G` has no solution. When the negation is solved, every variable of `G` MUST be bound except anonymous ones, which stand for any value: `not(q(X, _))` succeeds when `q(X, Y)` has no solution for any `Y`. A named unbound variable is an error. |
| `call(G)` | `call(G)` | The solutions of `G`. |
| `once(G)` | `once(G)` | The first solution of `G`. |
| `findall(T, G, L)` | `findall(T, G, L)` | Unifies `L` with the list of instances of `T`, one per solution of `G`, in order, each renamed apart. |

A variable is anonymous when its name, up to any `#` a renaming apart
(Section 7.1) adds, is `_` followed by digits (Section 4.4), or is one a
reader made for a `_` (Section 9).

Conjunction and disjunction are binary. In a program, `and` and `or` with
more than two goals build the chain from the left, `and(A, B, C)` being
`and(and(A, B), C)`, and `or` with one goal is that goal. `not`, `call` and
`once` with several goals take their conjunction. A goal text (Section 9)
reads `and` and `or` with more than two arguments the same way.

### 5.2 Primitives

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
| `is(?V, +E)` | | Evaluates `E` (Section 6) and unifies `V` with the result. |
| `eq(+E1, +E2)`, `ne(+E1, +E2)` | | The values of `E1` and `E2` are equal, or not. |
| `lt(+E1, +E2)`, `le(+E1, +E2)`, `gt(+E1, +E2)`, `ge(+E1, +E2)` | | Compares the values of `E1` and `E2`. |
| `is_var(@X)`, `is_nonvar(@X)` | | `X` is an unbound variable, or is not. |
| `is_ground(@X)` | | `X` contains no unbound variable. |
| `is_atom(@X)`, `is_number(@X)` | | `X` is an atom, or a number. |
| `is_int(@X)`, `is_float(@X)` | | `X` is an integer, or a float. |
| `is_compound(@X)` | | `X` is a compound; a non-empty list is one. |
| `functor` | `functor(+T, ?N, ?A)`, `functor(-T, +N, +A)` | Name and arity of `T`, or `T` built with fresh variable arguments. `A` MUST be between 0 and 1024. |
| `arg` | `arg(+N, +T, ?A)` | `A` is the `N`th argument of `T`, counting from 1. |
| `univ` | `univ(+T, ?L)`, `univ(-T, +L)` | `L` is the list of `T`'s name and arguments. |
| `atom_chars` | `atom_chars(+A, ?L)`, `atom_chars(-A, +L)` | `L` is the list of `A`'s characters as atoms. |
| `atom_codes` | `atom_codes(+A, ?L)`, `atom_codes(-A, +L)` | `L` is the list of `A`'s character code points. |
| `atom_length` | `atom_length(+A, ?N)` | `N` is the number of characters of `A`. |
| `number_chars` | `number_chars(?N, +L)`, `number_chars(+N, -L)` | A bound `L` is read as a number: an optional sign and decimal digits give an integer, and with a fraction or an exponent a float, as in `'007'`, `'-21.5'`, `'.5'` and `'1E3'`; other text fails. Otherwise `L` spells `N` in its canonical text (Section 8.1). |
| `atom_concat` | `atom_concat(+A, +B, ?AB)`, `atom_concat(?A, ?B, +AB)` | `AB` is `A` followed by `B`; with `AB` given, every split, shortest `A` first. |

A character is a Unicode code point. Every primitive except `atom_concat` has
at most one solution. Primitives MUST be pure: their solutions depend only on
their arguments. A primitive given an argument of the wrong kind for its
patterns raises an error, as `atom_length(123, N)` does; one given arguments
of the right kinds that has no solution fails, as `arg(5, f(1), A)` does.

A goal whose name and arity are neither a control, a primitive nor the head
of any clause has no solution.

## 6. Arithmetic

An expression term is evaluated as follows:

- a number is its value; the atoms `'pi'`, `'e'` and `'tau'` are π, e and
  2π; a variable bound to an expression is that expression's value; an
  unbound variable or any other atom is an error;
- `add`, `sub`, `mul`, `div`, `floordiv`, `mod`, `pow`, `shl`, `shr` and
  `xor` with two arguments are addition, subtraction, multiplication, true
  division, floor division, modulo, power, shifts and exclusive or; `and` and
  `or` with two arguments are bitwise and and or; `not`, `neg` and `pos` with
  one argument are bitwise inversion, negation and identity;
- the functions `abs`, `min`, `max` (with two or more arguments), `round`
  (with one or two), `int`, `float`, `floor`, `ceil`, `trunc`, `sqrt`,
  `isqrt`, `exp`, `log` (with one or two: a value and a base), `log2`,
  `log10`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `sinh`,
  `cosh`, `tanh`, `hypot`, `degrees`, `radians`, `fmod`, `copysign`, `gcd`
  and `lcm`.

Integers are exact and unbounded. An operation on integers gives an integer,
except `div`, which always gives a float, and `pow` with a negative exponent.
An operation with a float operand gives a float. `floordiv` rounds toward
negative infinity and `mod` takes the sign of its divisor: `floordiv(-7, 3)`
is -3 and `mod(-7, 3)` is 2. `div` of two integers is the float nearest to
their exact quotient. `round` rounds half to even, to an integer with one
argument and to the given number of decimals with two; `int`, `floor`, `ceil`
and `trunc` give integers. A float is written as Section 8.1 says.

Integer true division rounds once, including in the subnormal range: the
nearest float to `div(1, shl(1, 1074))` is `5e-324`. Halfway cases round to
even; a result that underflows to zero keeps its sign.

An evaluation MUST raise an error, rather than produce a value, on a division
or modulo by zero, a domain error (such as `sqrt(-1)` or `log(0)`), a bitwise
operation or `gcd` on a float, when the result is not a finite real number,
or when a power or left shift would need more than 2^26 bits: for a power of
integers `pow(A, B)` with `B > 0` and `abs(A) > 1`, when `B` times the bit
length of `A` exceeds 2^26; for a shift `shl(A, B)` of integers, when `B`
exceeds 2^26.

Comparisons are primitives (Section 5.2), not arithmetic functions: `lt` and
the other comparisons in an expression are an error. Comparison primitives
compare values exactly, including across integers and floats.

## 7. Reasoning

### 7.1 Search

Goals are solved depth-first, left to right. A goal is solved, in order:

1. by a control or primitive (Section 5), when it is one;
2. otherwise against the facts derived so far by forward rules with the same
   name and arity, in the order they were derived;
3. then against the program's facts and backward rules with the same name and
   arity, in clause order, each renamed apart before it is unified with the
   goal; a rule's body is then solved in its place.

Renaming a clause apart gives each of its variables a fresh variable whose
name is the variable's name followed by `#` and an implementation-specific
suffix. Such names never appear in the documents a run writes (Section 8.3).

An implementation MAY index clauses, provided the order above is kept.

### 7.2 Forward reasoning

Forward rules run stratum by stratum, in increasing rank (Section 4.5). Within
a stratum, rounds are repeated until a round adds no new fact. In a round,
each rule in clause order is renamed apart and its body solved against the
current state; all solutions of the body are collected first, then each is
concluded:

- a head variable the solution leaves unbound is bound to a **Skolem term**
  `skolem(Rule, Variable, Arguments)`: `Rule` is the clause number of the
  rule, `Variable` the variable's name as the program writes it (an
  anonymous one as `_0`, `_1`, ..., Section 4.4), and `Arguments` the list of
  the ground values the solution gives the heads' other variables, in order
  of their first occurrence in the heads. A Skolem term is thus a function of
  the activation: the rule and the instance of its heads. The same activation
  gives the same terms, in any round and in any run, and different
  activations give different terms; variables shared between heads stay
  shared. A variable that a value of the solution brought in, rather than a
  head variable, is named after its own variable, followed by `1`, `2`, ...
  when that name is taken. A rule that keeps meeting new activations does
  not terminate (Section 7.3). Derived facts other than scoped inspection
  patterns (Section 4.7) are therefore ground. A
  checker verifies the Skolem terms of a proof (C8, Section 11.9);
- a head `'true'` reports the instance of the rule's body, as a conjunction,
  once per distinct instance (by identity of canonical text);
- a head `'false'` records the conclusion `'false'` and stops all reasoning
  with halt code 65;
- any other head is added as a derived fact unless an identical fact is
  already derived or is a ground fact of the program.

When the run asks its own goals (Section 7.4), rules whose heads are all
`'true'` are not run.

For an appended forward clause of Section 4.6, prepend one element to
`Arguments`: the grounded capture list of its activation. This distinguishes
witnesses of different captured contexts even when a head does not mention
those values. An empty capture list still contributes one element, `[]`.
Original clauses, including generators, use the ordinary witness convention.

Scoped inspection variables of Section 4.7 are preserved instead of receiving
witnesses; derived conclusions may therefore be universal patterns. Each use
renames a pattern and its evidence apart. Such patterns are suppressed when
an alpha-equivalent pattern was already derived. Other derived facts keep
their ordinary ground identity convention.

### 7.3 Bounds

A run is bounded by `max_depth`, the depth of nested rule bodies (default
1000000), by `max_inferences`, the number of goals started (default
1000000), and by `max_iterations`, the rounds per stratum (default 1000).
Exceeding a bound MUST raise an error; a partial result MUST NOT be returned
as complete.

Each supplied bound MUST be a positive safe integer, at most
9007199254740991, so a work counter can represent it exactly.

### 7.4 Goals

A run MAY be given goals. After forward reasoning, each goal is solved in
turn, and each solution is reported as the instance of its goal, unless an
instance identical up to renaming of its variables was already reported for
this goal or an earlier one of the same run.

### 7.5 Halting

A run that concluded `'false'` has halt code 65; otherwise it has none.

### 7.6 Conclusions

The conclusions of a run are, in order:

1. when it halted: every derived fact except template activations, in the order derived, ending with
   `'false'`;
2. otherwise, when it was given goals: the reported instances of its goals;
3. otherwise, when the program has a forward rule with a head `'true'`: the
   reported instances, in order of first report, which MAY be none;
4. otherwise: every derived fact except template activations, in the order derived.

An explicit goal MAY ask for an activation. Activations remain available as
premises and proof steps; the library's `inferred` list omits them. The
`derived` statistic counts them as facts added during reasoning.

The output of a run is the canonical text (Section 8) of each conclusion,
one per line.

### 7.7 Proof recording

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

## 8. Canonical Text

Every term has exactly one canonical text, which is a JavaScript expression.

### 8.1 Atoms, numbers, variables and lists

- An atom is written between single quotes, with `\\`, `\'`, and the
  characters that need it escaped as `\n`, `\t`, `\r`, `\b`, `\f`, `\v`,
  `\0`, `\xHH` or `\uHHHH`; `'[]'` is written `[]`.
- An integer is written in decimal. A float is written as the shortest
  decimal that reads back as the same value, with at least one digit after
  the point, in exponent form `1e+22` or `1e-05` when the exponent is below
  -4 or at least 16: `0.1`, `2.0`, `-0.0`, `1e+22`.
- A variable is written as its name when the name is an ASCII identifier
  (letters, digits and `_`, not starting with a digit), not a reserved word
  of JavaScript, not `_` and does not begin with `VAR_`. Any other name is
  written `VAR_` followed by the name with every ASCII letter and digit kept,
  every `_` doubled and every other character `c` replaced by `_hex_` where
  `hex` is the lowercase hexadecimal code point of `c`. The variable `X#12`
  is thus written `VAR_X_23_12`. A reader decodes such a name back
  (Section 9).
- A list is written `[I1, I2, ...]`; an open list ends with `, ...Tail`.

### 8.2 Compounds

A compound is written `name(A1, A2, ...)` when its name is an ASCII
identifier, not a reserved word of JavaScript and not `struct`, and
`struct('name', A1, ...)` otherwise. Arguments are separated by `, `.
There are no operators: `add(X, 1)` is written `add(X, 1)`.

A chain of conjunctions or disjunctions built from the left,
`and(and(A, B), C)`, is written as one call, `and(A, B, C)`. A compound
`and/N` or `or/N` with more than two arguments is written with `struct`, as
`struct('and', A, B, C)`.

### 8.3 Variables in written documents

The conclusions a run writes, its proof documents (Section 10) and check
reports (Section 12) do not show the names variables have inside a run. In
the conclusions of a run and in a proof document, the variables are named
`A`, `B`, ..., `Z`, `A1`, ..., `Z1`, `A2`, ... in the order the document
first shows them, across the whole document, the conclusions written first;
the clause displays of a proof keep the program's names. A check report
names the variables of each fact anew (Section 12). The bindings an
implementation reports for each answer to a goal SHOULD name its variables as
the answer does.

## 9. Reading Documents

A document is UTF-8 text holding a sequence of JavaScript expression
statements. A statement ends at the end of its line, unless a bracket is
still open, or at a `;`; comments (`// ...` and `/* ... */`), blank lines and
indentation are ignored; each term records the line on which its statement
begins. The documents eyemind writes hold one statement per line. A reader
MUST NOT execute the text. It accepts exactly:

- a string literal between single or double quotes, with JavaScript's
  escapes: the atom; a decimal integer literal, or one with the `BigInt`
  suffix `n`, or a finite decimal float literal (one with a point or an
  exponent): the number;
- a name: the variable of that name, where each `_` is a new anonymous
  variable (Section 5.1) and a name starting with `VAR_` is decoded
  (Section 8.1), or rejected when it encodes no name;
- a call of a plain name: the compound, or the atom when there are no
  arguments; `struct('name', ...)` as in Section 8.2; `and` and `or` with
  more than two arguments as in Section 5.1;
- an array literal: the list, where only the last item MAY be spread
  (`...Tail`) and then is the tail; `[...T]` is `T`;
- an object literal `{K: V, ...}` whose keys are names or strings: the list
  of compounds `'='(K, V)`, in order;
- a minus sign applied directly to a numeric literal: the negative number;
- an expression in parentheses: that expression.

A trailing comma is allowed in a call, an array and an object. Anything else
MUST be rejected: an operator, a property access, a subscript, a call of a
call, a spread argument, a comma expression, an assignment, a template
literal, a regular expression, a hexadecimal, octal or binary literal, a
numeric separator, an integer literal with a leading zero, the names `true`,
`false`, `null`, `undefined`, `NaN`, `Infinity` and the other reserved words,
a name containing `$`, an arrow function, a declaration, a raw control
character other than a tab in a string, and a nonbreaking space outside a
string. Reading the canonical text of a term MUST give the term back.

## 10. Proof Documents

### 10.1 Structure

A proof document is a document (Section 9) holding, in this order:

1. the conclusions of the run (Section 7.6), one per line;
2. an empty line;
3. one `clause(N, Display)` per program clause the proof cites, by
   increasing `N`;
4. an empty line;
5. one `step(Goal, By, Bindings, Uses)` per justified goal.

A checker MUST treat every statement that is neither `clause/2` nor `step/4`
as a claim, whatever its position.

### 10.2 Clause displays

`Display` shows clause `N` as the program states it: `fact(Head)`,
`implies(Body, Head)`, `implied_by(Head, Body)`, `query(G1, ...)` or
`contradiction(G1, ...)`, where `Body` is the clause's one body goal, or the
array of its body goals when it has several, `Head` likewise the head or the
array of heads, and `G1, ...` are the body goals themselves. Displays are not
authority: a checker MUST compare each with the program it checks against.

For a program with templates, displays show the deterministically lowered
clauses of Section 4.6, including activation heads and premises. The program
supplied to the checker MUST be lowered from the source as Section 4.6
requires; displays cannot authorize extra generated rules. Each use of a
generated clause requires its activation as the first use, with a justified
step of its own. All existing checks apply.

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
a checker MUST accept any subset, since the goal and uses determine the
rest. A primitive has no variables of its own, so `'builtin'` steps have
empty bindings.

## 11. Proof Checking

A checker is given a program, a proof document and, when the proof answers
goals asked from outside the program, those goals. It MUST NOT call a
reasoner to supply a missing step; it MAY recompute primitives. It
establishes eight conditions and records each failure with its condition, a
detail and, where there is one, the term concerned.

### 11.1 Reading the document

The document MUST read (Section 9); otherwise C3 fails and the document has
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

For a `source(N)` step, `N` MUST identify an eligible source rule of Section
4.7. Bindings and uses MUST both be empty. The rule's inspection term,
freshened with one variable map, MUST unify with `Goal` and resolve exactly
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

### 11.7 C6 Boundary consistency

A trusted boundary cannot be proved, but the evidence at hand can refute it.
The evidence for a goal is: when the goal is a ground primitive, the goal
itself if it holds; when it is a control, none, and the boundary is left
undecided; otherwise the program's facts and the goals of the document's
steps with the same name and arity.

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
Otherwise the questions are, for each forward rule, each head other than
`'true'` or a template activation, and the rule's body as a conjunction when one of its heads is
`'true'` and no claim is `'false'`. Each claim MUST be an instance of a
question. Each step MUST be reachable from a conjunct of a claim through the
conjuncts of uses.

### 11.9 C8 Witness integrity

A forward rule's head MAY contain variables its body does not contain; each
says that something exists, and a reasoner concludes it with a Skolem term
(Section 7.2). C1 alone would accept any value for such a variable, since any
value gives an instance of the rule, so for a `clause(N)` step citing a
forward rule, under the substitution of C1, each such variable `V` MUST be
bound to `skolem(N, Name, Args)`, where:

- `Name` is the name of `V` as the program writes it, or that name followed
  by digits (Section 7.2);
- `Args` is the same for every such variable of the step, and is the list of
  the values of the heads' variables, in order of their first occurrence in
  the heads, that are ground and contain no Skolem term `skolem(N, _, Args)`:
  the values that do contain one hold a witness of this firing.

When a forward clause has any such variables, its full head under the step's
substitution MUST be ground. A generic inspection pattern cannot share one
existential witness across all its instances (Section 4.7).

For an appended forward clause of Section 4.6, prepend the capture list,
instantiated under the step's substitution, as one element of `Args`, as
required by Section 7.2. The checker MUST compute this from the source
template's capture metadata and the substitution, not from the witness term.

A variable of the head that also occurs in the body is not checked by C8,
even when the body leaves it unbound; its value comes from the uses, which
other conditions check. A step citing a rule without such variables is not
covered by C8.

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
| C8 witness_integrity | `clause` steps of forward rules with witnesses that passed C8 |

A check also counts the **steps** it read, the **claims**, the `clause` steps
**verified** by C1, the `source` inspection steps also **verified** by C1,
the `'builtin'` steps **recomputed** by C5, the
`'control'` steps **composed** by C5, and the `'absent'` and `'collected'`
steps **trusted**.

A proof is **valid** when no condition failed. A valid proof with trusted
boundaries is valid *conditional on* them.

### 11.11 What a valid proof establishes

A valid proof establishes that each of its claims follows from the program
by the recorded steps, given its trusted boundaries. It does not establish
that the claims are all the conclusions of the program, that the program
derives no `'false'`, or that the program is the one intended: a proof MAY
leave conclusions out, and a run's own proof holds exactly its conclusions.

## 12. Check Reports

A check report is a document (Section 9) beginning with the proof's claims,
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

`Detail` is a short human-readable text that names what failed, often with
the canonical text of a term; it is informative, and implementations MAY word
it differently. eyemind's details are, by condition:

| Condition | Details |
| --- | --- |
| C1 | `clause display differs from source`, `unknown clause ...`, `not an instance of source clause N: ...`, `not an instance of inspectable source rule N: ...` |
| C2 | `cyclic derivation at ...` |
| C3 | the reader's error, `step bindings must be an object and uses an array`, `duplicate justification for ...`, `invalid builtin justification`, `trusted boundaries cannot have bindings or uses`, `unknown justification ...` |
| C4 | `unjustified claim ...`, `unjustified use ...` |
| C5 | `primitive disagrees: ...`, `control step does not follow from its uses: ...`, `trusted boundary forbidden: absent` or `collected` |
| C6 | `absence contradicted by evidence: ...`, `collected result is not a proper list: ...`, `collection misses ...: ...` |
| C7 | `claim answers no goal: ...`, `step serves no claim: ...` |
| C8 | `not the witness of this firing of clause N: ...` |

The initial answers keep the variable names of the proof. The variables of
each subsequent report fact are renamed `A`, `B`, ..., `Z`, `A1`, ... in order
of first occurrence. A report is ordinary data: `facts_from` (Section 4.2)
states it as facts.

The JSON form includes `answers`, an array of the initial claims' canonical
texts, including unverified claims when `valid` is false. It also has `valid` (boolean), `steps`,
`claims`, `verified`, `redecided` (the count `recomputed`), `composed`,
`uses` (the number of uses of all steps, integers), `trusted`
(a list of `{kind, conclusion}`), `failures` (a list of
`{condition, detail, conclusion?}`) and `conditions` (a list of
`{id, name, covered, failed}`), where `conclusion` is a canonical text.

## 13. Unused Clauses

A clause is **unused** when no conclusion's recorded derivation cites it,
unless a negation or collection in the proof could consult it and running the
program without it changes the conclusions or the halt code, or fails. The clauses a
negation or collection could consult are those whose heads have the name and
arity of a goal it reaches through the program's bodies. Running the program
without a clause leaves every other clause its number (Section 4.2), so the
Skolem terms of the other rules (Section 7.2) do not change.

Unused clauses are reported one per line, in clause order, as
`unused(line(L), Display)`, where `L` is the clause's line (Section 4.2) and
`Display` as in Section 10.2.

"Unused" is relative to the recorded derivations, which are the first ones
found (Section 7.7). A clause that only offers a second derivation of a
conclusion, such as a duplicate rule, is unused, though leaving out the
clause that offers the first one would make it used; leaving out several
unused clauses together can therefore change the conclusions. A
`contradiction` rule that never fires changes no conclusion and is unused,
though it guards the program against data that would make it fire.

## 14. Command Line

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
| `--goal GOAL` | Ask `GOAL`, read as in Section 9, where an array is a conjunction; MAY be repeated. With `--check-proof`, the goals the proof answers. |
| `--strict-proof` | With either checking mode, forbid trusted boundaries. |
| `--unused` | Print the unused clauses (Section 13). |
| `--stats` | Print reasoning statistics as JSON to standard error: `inferences`, the goals started, which `--max-inferences` bounds; `rounds`, the forward rounds run over all strata; and `derived`, the facts forward rules added, not counting a conclusion the program states as a fact, a query's answers or `'false'`. |
| `--max-depth N`, `--max-iterations N`, `--max-inferences N` | The bounds of Section 7.3; `N` MUST be a positive safe integer, at most 9007199254740991. |
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
| 65 | The run halted (Section 7.5). |

## 15. Security Considerations

A **program** is JavaScript code and runs with the privileges of whoever runs
it; only programs from trusted sources should be run. Reasoning itself calls
no code of the program: once stated, clauses are terms.

A **document** (conclusions, proofs, reports, `facts_from` input and goals)
is untrusted data. It MUST NOT be executed. The reader of Section 9 accepts
literals, names, calls of a plain name and array and object literals, so no
document can run code, import modules or reach properties. Checking a proof
from a third party is therefore safe in the sense that it runs none of the
third party's code.

Reasoning and checking consume time and memory. The bounds of Section 7.3,
the limit on powers and shifts in Section 6 and the limit on `functor`
arities in Section 5.2 bound some of this; a deployment that checks untrusted
proofs SHOULD additionally bound document size, nesting depth and running
time.

A valid proof establishes that its claims follow from the program supplied
to the checker (Section 11.11). It does not establish that the program is
correct or that the claims are all its conclusions, and a proof with
obligations holds only conditional on them.

## 16. Conformance

A conforming **reasoner** implements Sections 3 to 10, produces
conclusions and proof documents in the canonical text, and checks every proof
it produces as Section 11 describes. A conforming **checker** implements
Sections 9, 11 and 12 and does not depend on a reasoner. For the same
program, a conforming reasoner and checker MUST produce the same
conclusions, proof documents and reports as eyemind 0.1.29, byte for byte,
except for comments and the `Detail` texts of failures (Section 12), the internal names of
variables where Section 3 says so, and where the host's floating-point
library functions (`exp`, `log`, the trigonometric and hyperbolic functions,
`pow` of floats) differ in the last digit.

The conformance suite in the repository's `conformance/` directory tests an
implementation against this document through its command line, case by case,
each case naming the sections it tests; `conformance/README.md` describes how
to run it against any implementation. The repository's examples, with their
saved conclusions (`examples/output/`), proofs (`examples/proof/`) and reports
(`examples/check/`), test the same on larger programs.

---

## Appendix A. Document Grammar

The documents of Sections 9 to 12 use this subset of JavaScript's expression
grammar, in the ABNF style of RFC 5234, with spaces, tabs and comments
between tokens allowed, and line breaks too inside brackets.

```abnf
document    = *( line LF ) [ line ]
line        = [ expression *( ";" expression ) [ ";" ] ]
expression  = string / number / "-" number / name / call / array / object
            / "(" expression ")"
call        = name "(" [ expression *( "," expression ) [ "," ] ] ")"
array       = "[" [ items ] "]"
items       = expression *( "," expression ) [ "," "..." expression ] [ "," ]
            / "..." expression [ "," ]
object      = "{" [ pair *( "," pair ) [ "," ] ] "}"
pair        = ( name / string ) ":" expression
string      = "'" *<character or escape> "'" / DQUOTE *<character or escape> DQUOTE
number      = 1*DIGIT [ "n" ] / float
float       = ( 1*DIGIT "." *DIGIT / "." 1*DIGIT ) [ exponent ] / 1*DIGIT exponent
exponent    = ( "e" / "E" ) [ "+" / "-" ] 1*DIGIT
name        = ( ALPHA / "_" ) *( ALPHA / DIGIT / "_" )   ; not a reserved word
```

An integer literal other than `0` MUST NOT begin with `0`.

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
type('socrates', 'mortal')
type('socrates', 'human')
```

Its proof document (Section 10):

```js
type('socrates', 'mortal')
type('socrates', 'human')

clause(1, fact(type('socrates', 'human')))
clause(2, fact(subclass_of('human', 'mortal')))
clause(3, implies([type(S, A), subclass_of(A, B)], type(S, B)))

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
