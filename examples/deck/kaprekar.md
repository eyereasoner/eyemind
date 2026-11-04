# Kaprekar's 6174

*A number trick that always lands on 6174 — checked for every case, with one honest caveat.*

[kaprekar.js](https://github.com/eyereasoner/eyemind/blob/main/examples/kaprekar.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/kaprekar.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/kaprekar.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/kaprekar.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=kaprekar)

---

## The question

Take a four-digit number whose digits are not all the same. Arrange its
digits from high to low and from low to high, and subtract the smaller number
from the larger. Repeat with the result.

```text
3524  ->  5432 - 2345 = 3087
3087  ->  8730 - 0378 = 8352
8352  ->  8532 - 2358 = 6174
```

Once you reach 6174 you stay there: 7641 − 1467 = 6174. The mathematician
D. R. Kaprekar noticed that every starting number ends up at **6174**.

**Does every such number get there within seven steps?**

---

## A shortcut that makes it checkable

There are 10,000 four-digit strings (0000 to 9999, leading zeros allowed),
but the first step only cares about *which* digits occur, not their order:
3524 and 2453 give the same result.

So it is enough to check each **multiset** of four digits (a bag of digits,
order ignored) once. Leaving out the ten where all digits are equal (0000,
1111, …), there are 705 of them.

---

## What we tell eyemind

One step of the routine, written as a backward rule:

```js
// One step: the largest number the digits make minus the smallest.
implied_by(
  kaprekar_step(A, B),
  [
    digits(A, Ds),
    sort4(Ds, Asc),
    reverse(Asc, Desc),
    number_of(Asc, Low),
    number_of(Desc, High),
    is(B, sub(High, Low)),
  ],
)
```

`implied_by(conclusion, conditions)` is a **backward rule**: the conclusion
holds when all the conditions in the list hold, and eyemind uses it only
when it needs it. Capitalized names are **variables**, placeholders for
values. Read it as: *one step takes A to B if A's digits, sorted low to high,
make the number Low, sorted high to low make High, and B is High − Low.*
Other rules, not shown, split a number into its four digits, sort them, turn
digits back into a number, and list one representative number per multiset.

And the claim to test:

```js
// reaches_6174(A, Steps): A was reached after Steps steps, and 6174 follows
// before the total number of steps exceeds seven.
fact(reaches_6174(6174, _))
implied_by(
  reaches_6174(A, Steps),
  [
    ne(A, 6174),
    lt(Steps, 7),
    kaprekar_step(A, B),
    is(Next, add(Steps, 1)),
    reaches_6174(B, Next),
  ],
)

// The claim holds when no multiset is a counterexample; not(...) checks
// every one.
implied_by('counterexample', [digit_multiset(A), not(reaches_6174(A, 0))])
implied_by(kaprekar_verified(6174, 7), not('counterexample'))
```

- 6174 itself has arrived, however many steps it took (`_` means "any value,
  we don't care").
- Any other number A, reached after `Steps` steps with fewer than 7 used,
  arrives if one more step leads to a number that arrives.
- A **counterexample** is a multiset that does *not* reach 6174 within
  seven steps starting from step 0.
- The claim `kaprekar_verified(6174, 7)` holds if there is no counterexample.

`not(...)` means "cannot be shown". To decide it, eyemind tries to show the
thing inside and concludes the opposite if it fails. That works here because
the search is finite: 705 multisets, at most seven steps each.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
kaprekar_verified(6174, 7)
```

The comment line says what follows: the answers to the program's question.
eyemind searched all 705 multisets and found no counterexample, so the claim
holds. `--stats` reports 152,940 inferences for that search.

---

## How "there is no counterexample" ends up in a proof

A proof normally shows *how* something was found: this rule, these facts,
this calculation. But "there is no counterexample" is about something that
was *not* found. There is nothing to point at.

eyemind records such a conclusion as an **absence**: a step marked
`'absent'`. It says: "I looked for this, the search finished, and it was not
there." The checker cannot redo that search from the proof alone, so it
accepts the step **on trust** and says so openly, as an **obligation**: a
statement that the reader must take on eyemind's word, listed by name.

---

## The proof, line by line

This is the complete proof:

```js
// Answers: each instance of a query() that holds.
kaprekar_verified(6174, 7)

// Clauses: the program clauses the steps cite, by clause number.
clause(19, implied_by(kaprekar_verified(6174, 7), not('counterexample')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(kaprekar_verified(6174, 7), clause(19), {}, [not('counterexample')])
step(not('counterexample'), 'absent', {}, [])
```

It has three parts:

- **The claim**: the answer the proof is about.
- **The clauses**: only the program lines the steps cite. The program has 19
  rules and facts; this proof needs only the last one, clause 19.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.

Read the steps as sentences:

1. *Kaprekar's claim is verified* — by clause 19, with no variables to fill
   in, because there is no counterexample.
2. *There is no counterexample* — `'absent'`: eyemind searched for one and
   found none. It uses nothing.

The whole exhaustive search sits inside that second step: all 705 multisets
and every Kaprekar step they take. A proof can list what *was* found; it
cannot list, one by one, all the ways something failed to be found.

---

## Checked: what the report says

`eyemind -c` generates the proof and checks it against the program;
`--check-proof` checks a saved proof. The checker never reasons by itself: it
only confirms each step against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
kaprekar_verified(6174, 7)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 1)
condition('C2', 'well_founded', 'ok', 2)
condition('C3', 'justification', 'ok', 2)
condition('C4', 'coverage', 'ok', 2)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 1)
condition('C7', 'relevance', 'ok', 3)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not('counterexample'))

// Proof statistics: recorded steps and how they were checked.
steps(2)
verified(1)
recomputed(0)
composed(0)
trusted(1)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (1)**: the 1 step that cites a clause really is an
  instance of clause 19.
- **C2 well-founded (2)**: neither of the 2 steps depends on itself.
- **C3 justification (2)**: both steps say how they are justified in a
  well-formed way; in particular the `'absent'` step has no values and uses
  nothing, as an absence must.
- **C4 coverage (2)**: the 1 claim and the 1 thing used (`not('counterexample')`)
  are each backed by a step.
- **C5 re-decision (0)**: no built-in calculation appears in the proof, so
  nothing needed recomputing.
- **C6 boundary consistency (1)**: the checker tried to refute the 1
  absence with the evidence in hand: is there a fact or a proof step saying
  there *is* a counterexample? There is none, so the absence stands.
- **C7 relevance (3)**: the 1 claim answers the query, and both steps
  serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.

The obligation line, in plain words: *"there is no counterexample" was taken
on trust; it is true relative to this program* (`'theory_scoped'`), that is,
as far as these rules and facts can show. The statistics say the same: 2
steps, 1 verified against the program, 1 trusted.

The verdict is **checked with obligations**: the claim follows from the
program, provided you accept the one listed absence. It does not establish
completeness, and it does not re-run the search.

---

## Why the caveat is honest, not a flaw

The claim *is* a claim about absence: no number fails. Any checker would have
to either redo the whole search or take it on trust.

eyemind chooses to say so in writing. If you need a proof with no trusted
steps, `--strict-proof` rejects this one; for most uses, knowing exactly
where the trust sits is what matters.

---

## Try it

```sh
eyemind examples/kaprekar.js            # the answers
eyemind --proof examples/kaprekar.js    # answers with their proof
eyemind --goal "kaprekar_step(3524, B)" examples/kaprekar.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=kaprekar).
The `--goal` line asks for one step of the routine: it answers
`kaprekar_step(3524, 3087)`, the first line of the example above.

- On a copy, change `lt(Steps, 7)` to `lt(Steps, 6)`: the conclusion
  disappears, because some numbers really do need all seven steps.
- Ask for `kaprekar_step(1000, B)`: the answer is 999, because 1000 is
  treated as the digits 1, 0, 0, 0, and 1000 − 0001 = 999. The next step
  then reads 999 as 0999.

---

## Takeaway

eyemind checked a famous number fact case by case, and its certificate says
plainly which part rests on "we searched and found nothing" — so you know
exactly what you are trusting.
