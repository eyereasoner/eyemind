# Dog license

*A rule that depends on counting, and an honest note about the count.*

[dog-license.js](https://github.com/eyereasoner/eyemind/blob/main/examples/dog-license.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/dog-license.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/dog-license.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/dog-license.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=dog-license)

---

## The question

Imagine a town rule: anyone who owns more than four dogs needs a dog license.
The threshold is made up for this example, not taken from any real town's
rules.

Alice owns five dogs, Bob owns two. To apply the rule we must *count* each
person's dogs, and counting means being sure we saw every dog.

**Who needs a dog license?**

---

## What we tell eyemind

```js
fact(owns('alice', 'dog1'))
fact(owns('alice', 'dog2'))
fact(owns('alice', 'dog3'))
fact(owns('alice', 'dog4'))
fact(owns('alice', 'dog5'))
fact(owns('bob', 'dog6'))
fact(owns('bob', 'dog7'))
fact(owner('alice'))
fact(owner('bob'))
// The length of a list, counted recursively.
fact(length([], 0))
implied_by(length([_, ...Xs], N), [length(Xs, Before), is(N, add(Before, 1))])
implies(
  [owner(Owner), findall(Dog, owns(Owner, Dog), Dogs), length(Dogs, N)],
  dog_count(Owner, N),
)
implies([dog_count(Owner, N), gt(N, 4)], requires(Owner, 'dog_license'))
```

- The `fact` lines say who owns which dog, and who the owners are.
  Capitalized names such as `Owner`, `Dog` and `N` are variables:
  placeholders for any value.
- `length` counts a list. The empty list `[]` has length 0. The
  `implied_by(conclusion, premise)` line is a backward rule, used on demand: a
  list made of a first item (`_`, "any item, we don't care which") followed by
  the rest `Xs` is one longer than the rest. `is(N, add(Before, 1))` is a
  **built-in calculation**: eyemind adds 1.
- `implies(premise, conclusion)` is a forward rule: whenever the premise
  holds, conclude the conclusion; a premise in square brackets needs all its
  parts. The first one uses `findall(Dog, owns(Owner, Dog), Dogs)`: it
  **collects** every dog of that owner into one list, `Dogs`, whose length is
  the count.
- The last rule applies the threshold: `gt(N, 4)` is another built-in test,
  "N is greater than 4".

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
dog_count('alice', 5)
dog_count('bob', 2)
requires('alice', 'dog_license')
```

The program has no query, so eyemind lists every fact it derived. Alice has
5 dogs and needs a license. Bob has 2 and does not: since 2 is not more than
4, no license conclusion is drawn for him.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
dog_count('alice', 5)
dog_count('bob', 2)
requires('alice', 'dog_license')

// Clauses: the program clauses the steps cite, by clause number.
clause(8, fact(owner('alice')))
clause(9, fact(owner('bob')))
clause(10, fact(length([], 0)))
clause(11, implied_by(length([_0, ...Xs], N), [length(Xs, Before), is(N, add(Before, 1))]))
clause(12, implies([owner(Owner), findall(Dog, owns(Owner, Dog), Dogs), length(Dogs, N)], dog_count(Owner, N)))
clause(13, implies([dog_count(Owner, N), gt(N, 4)], requires(Owner, 'dog_license')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(dog_count('alice', 5), clause(12), {Owner: 'alice', Dog: A, Dogs: ['dog1', 'dog2', 'dog3', 'dog4', 'dog5'], N: 5}, [owner('alice'), findall(A, owns('alice', A), ['dog1', 'dog2', 'dog3', 'dog4', 'dog5']), length(['dog1', 'dog2', 'dog3', 'dog4', 'dog5'], 5)])
step(owner('alice'), clause(8), {}, [])
step(findall(A, owns('alice', A), ['dog1', 'dog2', 'dog3', 'dog4', 'dog5']), 'collected', {}, [])
step(length(['dog1', 'dog2', 'dog3', 'dog4', 'dog5'], 5), clause(11), {_0: 'dog1', Xs: ['dog2', 'dog3', 'dog4', 'dog5'], N: 5, Before: 4}, [length(['dog2', 'dog3', 'dog4', 'dog5'], 4), is(5, add(4, 1))])
step(length(['dog2', 'dog3', 'dog4', 'dog5'], 4), clause(11), {_0: 'dog2', Xs: ['dog3', 'dog4', 'dog5'], N: 4, Before: 3}, [length(['dog3', 'dog4', 'dog5'], 3), is(4, add(3, 1))])
step(length(['dog3', 'dog4', 'dog5'], 3), clause(11), {_0: 'dog3', Xs: ['dog4', 'dog5'], N: 3, Before: 2}, [length(['dog4', 'dog5'], 2), is(3, add(2, 1))])
step(length(['dog4', 'dog5'], 2), clause(11), {_0: 'dog4', Xs: ['dog5'], N: 2, Before: 1}, [length(['dog5'], 1), is(2, add(1, 1))])
step(length(['dog5'], 1), clause(11), {_0: 'dog5', Xs: [], N: 1, Before: 0}, [length([], 0), is(1, add(0, 1))])
step(length([], 0), clause(10), {}, [])
step(is(1, add(0, 1)), 'builtin', {}, [])
step(is(2, add(1, 1)), 'builtin', {}, [])
step(is(3, add(2, 1)), 'builtin', {}, [])
step(is(4, add(3, 1)), 'builtin', {}, [])
step(is(5, add(4, 1)), 'builtin', {}, [])
step(dog_count('bob', 2), clause(12), {Owner: 'bob', Dog: A, Dogs: ['dog6', 'dog7'], N: 2}, [owner('bob'), findall(A, owns('bob', A), ['dog6', 'dog7']), length(['dog6', 'dog7'], 2)])
step(owner('bob'), clause(9), {}, [])
step(findall(A, owns('bob', A), ['dog6', 'dog7']), 'collected', {}, [])
step(length(['dog6', 'dog7'], 2), clause(11), {_0: 'dog6', Xs: ['dog7'], N: 2, Before: 1}, [length(['dog7'], 1), is(2, add(1, 1))])
step(length(['dog7'], 1), clause(11), {_0: 'dog7', Xs: [], N: 1, Before: 0}, [length([], 0), is(1, add(0, 1))])
step(requires('alice', 'dog_license'), clause(13), {Owner: 'alice', N: 5}, [dog_count('alice', 5), gt(5, 4)])
step(gt(5, 4), 'builtin', {}, [])
```

It has three parts:

- **The claims**: the three conclusions the proof is about.
- **The clauses**: the program lines the steps cite, numbered by their place
  in the program (the seven `owns` facts are lines 1 to 7, which no step
  cites: see below). The `_` of the program is shown as `_0`, so that it can
  be given a value like any other variable.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable of the cited line stood for. The `A` in the
  collection steps is not a value: it is the open placeholder, "any dog".

Read the steps as sentences:

- **Step 1.** *Alice has 5 dogs* — by rule 12, because Alice is an owner,
  her collected dogs are `dog1` to `dog5`, and that list has length 5.
- **Step 2.** *Alice is an owner* — fact 8.
- **Step 3.** *Alice's dogs are exactly `dog1` to `dog5`* — **collected**:
  the list of every dog eyemind found for her. The checker confirms it is
  complete (see below).
- **Steps 4 to 8.** *The list of five dogs has length 5*, *of four has
  length 4*, and so on down to *the list of one dog has length 1* — each by
  rule 11, one dog shorter each time, and each using an addition of 1.
- **Step 9.** *The empty list has length 0* — fact 10.
- **Steps 10 to 14.** *0 + 1 = 1*, *1 + 1 = 2*, *2 + 1 = 3*, *3 + 1 = 4*,
  *4 + 1 = 5* — **builtin**: calculations, which the checker redoes itself.
- **Step 15.** *Bob has 2 dogs* — by rule 12, in the same way as Alice.
- **Step 16.** *Bob is an owner* — fact 9.
- **Step 17.** *Bob's dogs are exactly `dog6` and `dog7`* — collected, and
  confirmed the same way.
- **Steps 18 and 19.** *Bob's list has length 2*, and *its last dog alone has
  length 1* — by rule 11. They reuse steps 9, 10 and 11 (the empty list,
  0 + 1 and 1 + 1), which are not repeated.
- **Step 20.** *Alice requires a dog license* — by rule 13, because she has
  5 dogs and 5 is greater than 4.
- **Step 21.** *5 > 4* — builtin.

Why do no steps cite the `owns` facts? A `'collected'` step stands for the
whole search behind a `findall`. Its list could be checked dog by dog, but
the part that matters, "there are no other dogs", can only come from having
searched everything. A proof cannot point at a missing dog, but here the
checker does not need one: `owns` is defined only by facts, so the checker
scans those facts itself and finds exactly the dogs in the list, in the same
order.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
dog_count('alice', 5)
dog_count('bob', 2)
requires('alice', 'dog_license')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 13)
condition('C2', 'well_founded', 'ok', 21)
condition('C3', 'justification', 'ok', 21)
condition('C4', 'coverage', 'ok', 25)
condition('C5', 're_decision', 'ok', 6)
condition('C6', 'boundary_consistency', 'ok', 2)
condition('C7', 'relevance', 'ok', 24)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(21)
verified(13)
recomputed(6)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (13)**: the 13 steps that cite a program line really are
  instances of that line with the values shown.
- **C2 well-founded (21)**: none of the 21 steps depends on itself, even
  indirectly.
- **C3 justification (21)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (25)**: the 3 claims and the 22 things the steps use are each
  backed by a step.
- **C5 re-decision (6)**: the checker redid the 5 additions and the test
  5 > 4, and got the same results.
- **C6 boundary consistency (2)**: both collected lists were confronted with
  the evidence and settled: scanning the `owns` facts gives exactly these
  lists, so no dog of Alice or Bob is missing.
- **C7 relevance (24)**: the 3 claims are conclusions of the program, and all
  21 steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics: 21 steps, 13 verified against the program, 6 recomputed and
the 2 collections settled from the facts, none trusted, 3 claims.

Neither collection is taken on trust. Because only facts define `owns`, the
proof needs no search certificate: the checker reads the facts and confirms
that Alice's dogs are exactly `dog1` to `dog5`, and Bob's exactly `dog6` and
`dog7`. "Complete" means complete with respect to this program: add a dog
and the list changes. The verdict is **checked**: the conclusions follow
from the program. The verdict does not say the program has no other
conclusions.

---

## Try it

```sh
eyemind examples/dog-license.js
eyemind --strict-proof --check-proof examples/proof/dog-license.js examples/dog-license.js
```

The second command refuses any proof that leans on trust. This one takes
nothing on trust, so it reports `verdict('checked')`.

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=dog-license).
Add `fact(owns('bob', 'dog8'))`, `fact(owns('bob', 'dog9'))` and
`fact(owns('bob', 'dog10'))`, and run again: Bob's count becomes 5 and he
needs a license too. Or lower the threshold by changing `gt(N, 4)` to
`gt(N, 1)`: Bob's two dogs are then enough.

---

## Takeaway

Counting is a claim about *everything* you know. eyemind does the count, shows
it, and tells you plainly which part rests on "that was the full list".
