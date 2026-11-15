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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(same_inverse('x', 'i', 'j'), clause(10), {Y: 'i', X: 'x', Z: 'j'}, [inverse_of('i', 'x'), inverse_of('j', 'x'), not_identical('i', 'j'), equal('i', 'j')])
step(equal('i', 'j'), clause(9), {A: 'j', B: 'x', AB: 'e', C: 'i', Left: 'i', BC: 'e', Right: 'j'}, [product('j', 'x', 'e'), product('e', 'i', 'i'), product('x', 'i', 'e'), product('j', 'e', 'j')])
step(product('j', 'x', 'e'), clause(8), {Y: 'j', X: 'x'}, [inverse_of('j', 'x')])
step(product('e', 'i', 'i'), clause(7), {A: 'i'}, [element('i')])
step(product('x', 'i', 'e'), clause(8), {Y: 'i', X: 'x'}, [inverse_of('i', 'x')])
step(product('j', 'e', 'j'), clause(7), {A: 'j'}, [element('j')])
step(same_inverse('x', 'j', 'i'), clause(10), {Y: 'j', X: 'x', Z: 'i'}, [inverse_of('j', 'x'), inverse_of('i', 'x'), not_identical('j', 'i'), equal('j', 'i')])
step(equal('j', 'i'), clause(9), {A: 'i', B: 'x', AB: 'e', C: 'j', Left: 'j', BC: 'e', Right: 'i'}, [product('i', 'x', 'e'), product('e', 'j', 'j'), product('x', 'j', 'e'), product('i', 'e', 'i')])
step(product('i', 'x', 'e'), clause(8), {Y: 'i', X: 'x'}, [inverse_of('i', 'x')])
step(product('e', 'j', 'j'), clause(7), {A: 'j'}, [element('j')])
step(product('x', 'j', 'e'), clause(8), {Y: 'j', X: 'x'}, [inverse_of('j', 'x')])
step(product('i', 'e', 'i'), clause(7), {A: 'i'}, [element('i')])
step(equal('e', 'e'), clause(9), {A: 'e', B: 'e', AB: 'e', C: 'e', Left: 'e', BC: 'e', Right: 'e'}, [product('e', 'e', 'e'), product('e', 'e', 'e'), product('e', 'e', 'e'), product('e', 'e', 'e')])
step(product('e', 'e', 'e'), clause(7), {A: 'e'}, [element('e')])
step(equal('x', 'x'), clause(9), {A: 'e', B: 'e', AB: 'e', C: 'x', Left: 'x', BC: 'x', Right: 'x'}, [product('e', 'e', 'e'), product('e', 'x', 'x'), product('e', 'x', 'x'), product('e', 'x', 'x')])
step(product('e', 'x', 'x'), clause(7), {A: 'x'}, [element('x')])
step(equal('i', 'i'), clause(9), {A: 'e', B: 'e', AB: 'e', C: 'i', Left: 'i', BC: 'i', Right: 'i'}, [product('e', 'e', 'e'), product('e', 'i', 'i'), product('e', 'i', 'i'), product('e', 'i', 'i')])
step(equal('j', 'j'), clause(9), {A: 'e', B: 'e', AB: 'e', C: 'j', Left: 'j', BC: 'j', Right: 'j'}, [product('e', 'e', 'e'), product('e', 'j', 'j'), product('e', 'j', 'j'), product('e', 'j', 'j')])
step(product('x', 'e', 'x'), clause(7), {A: 'x'}, [element('x')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(same_inverse(A, B, C), [same_inverse('x', 'i', 'j'), same_inverse('x', 'j', 'i')])
derived(equal(A, B), [equal('e', 'e'), equal('x', 'x'), equal('i', 'i'), equal('j', 'j'), equal('j', 'i'), equal('i', 'j')])
derived(product(A, B, C), [product('e', 'e', 'e'), product('e', 'x', 'x'), product('x', 'e', 'x'), product('e', 'i', 'i'), product('i', 'e', 'i'), product('e', 'j', 'j'), product('j', 'e', 'j'), product('x', 'i', 'e'), product('i', 'x', 'e'), product('x', 'j', 'e'), product('j', 'x', 'e')])
called(same_inverse(A, B, C), [same_inverse('x', 'i', 'j'), same_inverse('x', 'j', 'i')])
called(equal('i', 'j'), [equal('i', 'j')])
called(equal('j', 'i'), [equal('j', 'i')])
called(product(D, E, F), [product('e', 'e', 'e'), product('e', 'x', 'x'), product('x', 'e', 'x'), product('e', 'i', 'i'), product('i', 'e', 'i'), product('e', 'j', 'j'), product('j', 'e', 'j'), product('x', 'i', 'e'), product('i', 'x', 'e'), product('x', 'j', 'e'), product('j', 'x', 'e')])
called(product('e', G, H), [product('e', 'e', 'e'), product('e', 'x', 'x'), product('e', 'i', 'i'), product('e', 'j', 'j')])
called(product('e', 'e', I), [product('e', 'e', 'e')])
called(product('e', 'x', I), [product('e', 'x', 'x')])
called(product('e', 'i', I), [product('e', 'i', 'i')])
called(product('e', 'j', I), [product('e', 'j', 'j')])
called(product('x', G, H), [product('x', 'e', 'x'), product('x', 'i', 'e'), product('x', 'j', 'e')])
called(product('x', 'e', I), [product('x', 'e', 'x')])
called(product('x', 'i', I), [product('x', 'i', 'e')])
called(product('x', 'j', I), [product('x', 'j', 'e')])
called(product('i', G, H), [product('i', 'e', 'i'), product('i', 'x', 'e')])
called(product('i', 'e', I), [product('i', 'e', 'i')])
called(product('i', 'x', I), [product('i', 'x', 'e')])
called(product('j', G, H), [product('j', 'e', 'j'), product('j', 'x', 'e')])
called(product('j', 'e', I), [product('j', 'e', 'j')])
called(product('j', 'x', I), [product('j', 'x', 'e')])
called(product('i', 'i', I), [])
called(product('i', 'j', I), [])
called(product('x', 'x', I), [])
called(product('j', 'i', I), [])
called(product('j', 'j', I), [])
```

It has three parts:

- **The claims**: the two answers the proof is about.
- **The steps**: one per derived fact. A step reads
  `step(what, by which clause, with which values, using what)`. Clauses are
  numbered in program order, one per fact: the six stated facts are clauses
  1–6, and the identity, inverse, associativity and theorem rules are 7, 8,
  9 and 10. The values say what each variable of the rule stood for;
  *using what* lists the things the rule's condition needed. Stated facts
  such as `inverse_of('i', 'x')` need no step: the checker reads them from
  the program, and it redoes the built-in test `not_identical` itself.
- **The certificate**: the `derived` **listings** of every `same_inverse`,
  `equal` and `product` fact the rules derived, and the `called` **call
  tables**, each call the questions make with all of its answers.

The first six steps prove that i and j are the same inverse. Read them as
sentences:

1. *i and j are the same inverse of x* — by rule 10, with `X` = x, `Y` = i,
   `Z` = j, because i and j are inverses of x, are different names, and are
   equal.
2. *i equals j* — by associativity, rule 9, with a = j, b = x, c = i. On one
   side (j · x) · i = e · i = i, so `Left` is i. On the other side
   j · (x · i) = j · e = j, so `Right` is j. It uses the four equations of
   steps 3 to 6.
3. *j · x = e* — by the inverse law, rule 8, because j is an inverse of x.
4. *e · i = i* — by the identity law, rule 7, because i is an element.
5. *x · i = e* — by the inverse law, rule 8, because i is an inverse of x.
6. *j · e = j* — by the identity law, rule 7, because j is an element.

Together this is the textbook argument
i = e · i = (j · x) · i = j · (x · i) = j · e = j.

Steps 7–12 do the same with i and j swapped, for the answer
`same_inverse('x', 'j', 'i')`. The last seven steps derive the dull
equalities, such as `equal('e', 'e')`, and the equations they use. They are
here because the listing of `equal` holds every equality the rules derived,
and every listed fact must show its firing.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it follows the
certificate. It answers the question `same_inverse(A, B, C)` against the
program, one level at a time, with every inner call answered from its table,
and checks each table it consults the same way. It requires each listing to
be closed: the group laws, applied to the listed equations, derive nothing
the listings leave out. It replays each listed fact's step from its rule,
redoing the `not_identical` tests. The empty tables, such as
`called(product('i', 'i', I), [])`, say that no law gives i · i a value.
This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
same_inverse('x', 'i', 'j')
same_inverse('x', 'j', 'i')

verdict('checked')
```

The verdict is **checked**: the uniqueness of the inverse follows from the
group laws and the hypothesis, and as the comment says, the two claims are
every answer of the original question. A proof that left out one of them,
or claimed `same_inverse('x', 'i', 'i')`, would fail.


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
