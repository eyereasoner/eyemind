# Group Inverse Uniqueness

*A first theorem of algebra, proved from the axioms and checked step by step.*

[group-inverse-uniqueness.js](https://github.com/eyereasoner/eyemind/blob/main/examples/group-inverse-uniqueness.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/group-inverse-uniqueness.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/group-inverse-uniqueness.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/group-inverse-uniqueness.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=group-inverse-uniqueness)

---

## The question

A **group** is a set with a way to combine two elements, written a · b, that
obeys three laws:

- **associativity**: (a · b) · c = a · (b · c), so brackets do not matter;
- **identity**: there is an element e with e · a = a · e = a, a "do nothing"
  element;
- **inverse**: every x has a y with x · y = y · x = e, an element that undoes
  x.

Whole numbers under addition form a group (e is 0, and the inverse of 5 is
−5), and so do the rotations of a square (e is "do not rotate", and the
inverse of a quarter turn left is a quarter turn right).

Suppose an element x has two inverses, called i and j. Nobody says they are
equal.

**Do the three laws force i and j to be the same element?**

---

## What we tell eyemind: the hypothesis

```js
// the elements named; the proof needs the identity law only for i and j
fact(element('e'), element('x'), element('i'), element('j'))
// the hypothesis: i and j are both inverses of x
fact(inverse_of('i', 'x'), inverse_of('j', 'x'))
```

A **fact** is something we state as true. A `fact` with several entries
states each of them, so these two lines are six facts: four named elements,
and the assumption that i and j are both inverses of x. Nothing says that i
and j are equal.

---

## What we tell eyemind: the group laws

```js
// identity: e · a = a and a · e = a
implies(element(A), [product('e', A, A), product(A, 'e', A)])
// inverse: when y is an inverse of x, x · y = e and y · x = e
implies(inverse_of(Y, X), [product(X, Y, 'e'), product(Y, X, 'e')])
// associativity: when (a · b) · c works out to Left and a · (b · c) to Right,
// Left and Right are equal
implies(
  [product(A, B, AB), product(AB, C, Left), product(B, C, BC), product(A, BC, Right)],
  equal(Left, Right),
)

// Two different names for inverses of the same element that are equal.
implies(
  [inverse_of(Y, X), inverse_of(Z, X), not_identical(Y, Z), equal(Y, Z)],
  same_inverse(X, Y, Z),
)
query(same_inverse(X, Y, Z))
```

`implies(condition, conclusion)` is a **rule**: whenever the condition holds,
eyemind concludes the conclusion. A list in square brackets means *all of
these*. Capitalized names (`A`, `X`, `Left`...) are **variables**:
placeholders that can stand for any element.

`product(A, B, AB)` records one equation, A · B = AB. The identity and inverse
laws produce such equations. Associativity is the only rule that concludes
two elements are `equal`: if computing (a · b) · c gives `Left`, and
computing a · (b · c) gives `Right`, then `Left` and `Right` are equal.

The last rule asks for the theorem: two inverses of the same `X`, with
different names (`not_identical` is a built-in test that two names differ),
that turn out `equal`. `query(...)` asks eyemind to report every way this
holds.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
same_inverse('x', 'i', 'j')
same_inverse('x', 'j', 'i')
```

The comment line says what follows: the filled-in versions of the question
that are true. **The two inverses are the same element.** Both directions
are found: i equals j, and j equals i.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
same_inverse('x', 'i', 'j')
same_inverse('x', 'j', 'i')

// Clauses: the program clauses the steps cite, by clause number.
clause(3, fact(element('i')))
clause(4, fact(element('j')))
clause(5, fact(inverse_of('i', 'x')))
clause(6, fact(inverse_of('j', 'x')))
clause(7, implies(element(A), [product('e', A, A), product(A, 'e', A)]))
clause(8, implies(inverse_of(Y, X), [product(X, Y, 'e'), product(Y, X, 'e')]))
clause(9, implies([product(A, B, AB), product(AB, C, Left), product(B, C, BC), product(A, BC, Right)], equal(Left, Right)))
clause(10, implies([inverse_of(Y, X), inverse_of(Z, X), not_identical(Y, Z), equal(Y, Z)], same_inverse(X, Y, Z)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(same_inverse('x', 'i', 'j'), clause(10), {Y: 'i', X: 'x', Z: 'j'}, [inverse_of('i', 'x'), inverse_of('j', 'x'), not_identical('i', 'j'), equal('i', 'j')])
step(inverse_of('i', 'x'), clause(5), {}, [])
step(inverse_of('j', 'x'), clause(6), {}, [])
step(not_identical('i', 'j'), 'builtin', {}, [])
step(equal('i', 'j'), clause(9), {A: 'j', B: 'x', AB: 'e', C: 'i', Left: 'i', BC: 'e', Right: 'j'}, [product('j', 'x', 'e'), product('e', 'i', 'i'), product('x', 'i', 'e'), product('j', 'e', 'j')])
step(product('j', 'x', 'e'), clause(8), {Y: 'j', X: 'x'}, [inverse_of('j', 'x')])
step(product('e', 'i', 'i'), clause(7), {A: 'i'}, [element('i')])
step(element('i'), clause(3), {}, [])
step(product('x', 'i', 'e'), clause(8), {Y: 'i', X: 'x'}, [inverse_of('i', 'x')])
step(product('j', 'e', 'j'), clause(7), {A: 'j'}, [element('j')])
step(element('j'), clause(4), {}, [])
step(same_inverse('x', 'j', 'i'), clause(10), {Y: 'j', X: 'x', Z: 'i'}, [inverse_of('j', 'x'), inverse_of('i', 'x'), not_identical('j', 'i'), equal('j', 'i')])
step(not_identical('j', 'i'), 'builtin', {}, [])
step(equal('j', 'i'), clause(9), {A: 'i', B: 'x', AB: 'e', C: 'j', Left: 'j', BC: 'e', Right: 'i'}, [product('i', 'x', 'e'), product('e', 'j', 'j'), product('x', 'j', 'e'), product('i', 'e', 'i')])
step(product('i', 'x', 'e'), clause(8), {Y: 'i', X: 'x'}, [inverse_of('i', 'x')])
step(product('e', 'j', 'j'), clause(7), {A: 'j'}, [element('j')])
step(product('x', 'j', 'e'), clause(8), {Y: 'j', X: 'x'}, [inverse_of('j', 'x')])
step(product('i', 'e', 'i'), clause(7), {A: 'i'}, [element('i')])
```

It has three parts:

- **The claims**: the two answers the proof is about.
- **The clauses**: the program's facts and rules that the steps cite. They
  are numbered in program order, one per fact: `element('e')` and
  `element('x')` are clauses 1 and 2, but no step needs them, so they are
  left out.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values say what
  each variable of the rule stood for; *using what* lists the things the step
  needs, each with a step of its own.

Two kinds of justification occur. `clause(N)` means the step is an instance
of fact or rule N. `'builtin'` means the step is a built-in test, here that
two names differ, which the checker can simply redo.

The first eleven steps prove that i and j are the same inverse. Read them as
sentences:

1. *i and j are the same inverse of x* — by rule 10, with `X` = x, `Y` = i,
   `Z` = j, because i and j are inverses of x, are different names, and are
   equal.
2. *i is an inverse of x* — fact 5.
3. *j is an inverse of x* — fact 6.
4. *i and j are different names* — a built-in test.
5. *i equals j* — by associativity, rule 9, with a = j, b = x, c = i. On one
   side (j · x) · i = e · i = i, so `Left` is i. On the other side
   j · (x · i) = j · e = j, so `Right` is j. It uses the four equations of
   steps 6, 7, 9 and 10.
6. *j · x = e* — by the inverse law, rule 8, because j is an inverse of x.
7. *e · i = i* — by the identity law, rule 7, because i is an element.
8. *i is an element* — fact 3.
9. *x · i = e* — by the inverse law, rule 8, because i is an inverse of x.
10. *j · e = j* — by the identity law, rule 7, because j is an element.
11. *j is an element* — fact 4.

Together this is the textbook argument
i = e · i = (j · x) · i = j · (x · i) = j · e = j.

The last seven steps do the same with i and j swapped, for the answer
`same_inverse('x', 'j', 'i')`. Steps already shown, such as *i is an inverse
of x*, are not repeated.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
same_inverse('x', 'i', 'j')
same_inverse('x', 'j', 'i')

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 16)
condition('C2', 'well_founded', 'ok', 18)
condition('C3', 'justification', 'ok', 18)
condition('C4', 'coverage', 'ok', 26)
condition('C5', 're_decision', 'ok', 2)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 20)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(18)
verified(16)
recomputed(2)
composed(0)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (16)**: the 16 steps that cite a clause really are
  instances of it. For example, step 5 is the associativity rule with
  `A` = j, `B` = x, `C` = i, and its four equations really are the ones the
  rule asks for.
- **C2 well-founded (18)**: none of the 18 steps depends on itself, even
  indirectly. The argument is not circular.
- **C3 justification (18)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (26)**: the 2 claims and the 24 things the steps use are each
  backed by a step: no equation is taken for granted.
- **C5 re-decision (2)**: the 2 built-in tests, that i and j are different
  names and that j and i are, were recomputed by the checker.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (20)**: each of the 2 claims answers the question, and all
  18 steps serve a claim.
- **C8 witness integrity (0)**: no rule invented a new, unnamed element, so
  there is no invented name to verify.
- **C9 search closure (0)**: there was no absence or collection to
  settle, so no search certificate to check.

The statistics repeat this: 18 steps, 16 verified against the program and 2
recomputed, none taken on trust. The verdict is **checked**: the uniqueness
of the inverse follows from the group laws and the hypothesis. As the last
comment says, this confirms the claims; it does not say the program has no
other conclusions.

---

## Try it

```sh
eyemind examples/group-inverse-uniqueness.js
eyemind --proof examples/group-inverse-uniqueness.js
eyemind -c examples/group-inverse-uniqueness.js
eyemind --check-proof examples/proof/group-inverse-uniqueness.js examples/group-inverse-uniqueness.js
eyemind --goal 'equal(A, B)' examples/group-inverse-uniqueness.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=group-inverse-uniqueness).

The last command asks a different question: which equalities follow at all?
Besides `equal('i', 'j')` and `equal('j', 'i')`, eyemind lists the dull ones
such as `equal('e', 'e')`, where both sides of associativity give the same
element.

Give x a third inverse: add `element('k')` to the first fact and
`inverse_of('k', 'x')` to the second. eyemind then concludes six
`same_inverse` facts: i, j and k are all the same element.

Remove `inverse_of('j', 'x')` instead. With only one inverse there is
nothing to compare, and eyemind reports no answers.

---

## Takeaway

A theorem is a conclusion forced by the axioms. Here eyemind derives that an
inverse is unique from the three group laws alone, and its checked proof is
the familiar textbook argument, each line tied to the law it uses.
