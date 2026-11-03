# Group Inverse Uniqueness

*A first theorem of algebra, proved from the axioms and checked step by step.*

[group-inverse-uniqueness.js](https://github.com/eyereasoner/eyemind/blob/main/examples/group-inverse-uniqueness.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/group-inverse-uniqueness.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/group-inverse-uniqueness.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/group-inverse-uniqueness.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=group-inverse-uniqueness)

---

## The question

A **group** is a set with a way to combine two elements, written a · b, that
obeys three laws:

- **associativity**: (a · b) · c = a · (b · c);
- **identity**: there is an e with e · a = a · e = a;
- **inverse**: every x has a y with x · y = y · x = e.

Numbers under addition form a group (e is 0, the inverse of 5 is −5), and so
do the rotations of a square. **Could an element have two different
inverses?** Suppose x has inverses i and j. Must i and j be the same?

---

## What we tell eyemind: the hypothesis

```js
fact(element('e'), element('x'), element('i'), element('j'))
// the hypothesis: i and j are both inverses of x
fact(inverse_of('i', 'x'), inverse_of('j', 'x'))
```

Four names, and the assumption that i and j are both inverses of x. Nothing
says that i and j are equal.

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
```

`product(A, B, AB)` records the equation A · B = AB. The identity and
inverse laws supply such equations; associativity is the only rule that
concludes two elements are `equal`. A last rule reports two different names
of inverses of the same element that turn out equal.

---

## What eyemind concludes

```js
same_inverse('x', 'i', 'j')
same_inverse('x', 'j', 'i')
```

**The two inverses are the same element.** Both directions are found: i
equals j, and j equals i.

---

## Why: the proof in plain words

The proof that i equals j is the argument from an algebra textbook:

1. j · x = e, because j is an inverse of x — *the inverse law, clause 8*.
2. e · i = i — *the identity law, clause 7*.
3. x · i = e, because i is an inverse of x — *clause 8 again*.
4. j · e = j — *clause 7 again*.
5. So i = (j · x) · i = j · (x · i) = j — *associativity, clause 9, with
   a = j, b = x, c = i*.
6. i and j are different names, and both are inverses of x, so
   `same_inverse('x', 'i', 'j')` — *clause 10*.

The whole proof, for both conclusions, has 18 steps.

---

## Checked, not just claimed

A separate checker read the proof against the program:

- 16 steps were matched to the exact program line they cite;
- 2 steps are built-in checks that i and j are different names, and the
  checker **recomputed** both;
- no step depends on itself, and every step serves one of the 2 answers.

Verdict: **checked**. All 18 steps verified, nothing taken on trust.

---

## Try it

```sh
eyemind examples/group-inverse-uniqueness.js
eyemind --proof examples/group-inverse-uniqueness.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=group-inverse-uniqueness).
Give x a third inverse: add `element('k')` to the first fact and
`inverse_of('k', 'x')` to the second. eyemind then concludes six
`same_inverse` facts: i, j and k are all the same element.

---

## Takeaway

A theorem is a conclusion forced by the axioms. Here eyemind derives that an
inverse is unique from the three group laws alone, and its checked proof is
the familiar five-line argument, each line tied to the law it uses.
