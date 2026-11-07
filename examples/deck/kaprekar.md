# Kaprekar's 6174

*A number trick that always lands on 6174 — checked for every case, with one honest caveat.*

[kaprekar.js](https://github.com/eyereasoner/eyemind/blob/main/examples/kaprekar.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/kaprekar.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/kaprekar.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/kaprekar.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=kaprekar)

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
there." To back it, the proof ends with a **search certificate**: every call
that search made, each written `searched(call, answers)` with every answer
it gave. The checker never redoes the search. It checks each line by
expanding its call one level against the program, as a search would, and
answering every inner call from that call's own line, so no line vouches
for itself. If all lines agree, the absence is **settled**: checked, not
taken on trust.

---

## The proof, line by line

This is the proof, with all its claims, clauses and steps; its search
certificate has 13,555 lines, of which only the first is shown:

```js
// Answers: each instance of a query() that holds.
kaprekar_verified(6174, 7)

// Clauses: the program clauses the steps cite, by clause number.
clause(19, implied_by(kaprekar_verified(6174, 7), not('counterexample')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(kaprekar_verified(6174, 7), clause(19), {}, [not('counterexample')])
step(not('counterexample'), 'absent', {}, [])

// Search certificate: every fact derived for each relation the searches behind
// negations and collections consult, and every answer of each call they made, in order.
searched('counterexample', [])
// … 13554 more searched lines: the 705 multisets, and every Kaprekar step they take
```

It has four parts:

- **The claim**: the answer the proof is about.
- **The clauses**: only the program lines the steps cite. The program has 19
  rules and facts; this proof needs only the last one, clause 19.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.
- **The search certificate**: the search behind the absence. Its first line
  says the search for a counterexample gave no answers; the rest record the
  calls that search made, from the digit multisets down to each Kaprekar
  step, with their answers.

Read the steps as sentences:

1. *Kaprekar's claim is verified* — by clause 19, with no variables to fill
   in, because there is no counterexample.
2. *There is no counterexample* — `'absent'`: eyemind searched for one and
   found none. It uses nothing.

The whole exhaustive search sits behind that second step: all 705 multisets
and every Kaprekar step they take. The steps list what *was* found; the
certificate lists the search that found nothing, so that it can be checked
too.

---

## Checked: what the report says

`eyemind -c` generates the proof and checks it against the program;
`--check-proof` checks a saved proof. The checker never reasons by itself: it
only confirms each step against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
kaprekar_verified(6174, 7)

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 1)
condition('C2', 'well_founded', 'ok', 2)
condition('C3', 'justification', 'ok', 2)
condition('C4', 'coverage', 'ok', 2)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 3)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 1)

// Proof statistics: recorded steps and how they were checked.
steps(2)
verified(1)
recomputed(0)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
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
- **C6 boundary consistency (0)**: no boundary was left to the evidence:
  C9 settled the only absence.
- **C7 relevance (3)**: the 1 claim answers the query, and both steps
  serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.
- **C9 search closure (1)**: the 1 absence was settled by the search
  certificate, `searched('counterexample', [])` and the lines that answer
  its inner calls: no counterexample.

There is no obligation line: *"there is no counterexample"* was checked
against the certificate, and it is true relative to this program, that is,
as far as these rules and facts can show. The statistics say the same: 2
steps, 1 verified against the program and the absence settled by the
certificate, none trusted.

The verdict is **checked**: the claim follows from the program. It does not
establish completeness, and the checker did not re-run the search: it
confirmed the record of it, line by line.

---

## Checking a search without redoing it

The claim *is* a claim about absence: no number fails. A checker could
redo the whole search, or take it on trust. eyemind's checker does neither:
it checks the written record of the search, one call at a time, and never
searches itself. The record is large, 13,555 lines, but each line is a
small check. Because nothing is taken on trust, `--strict-proof`, which
rejects any proof with trusted steps, accepts this one.

---

## Try it

```sh
eyemind examples/kaprekar.js            # the answers
eyemind --proof examples/kaprekar.js    # answers with their proof
eyemind --goal "kaprekar_step(3524, B)" examples/kaprekar.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=kaprekar).
The `--goal` line asks for one step of the routine: it answers
`kaprekar_step(3524, 3087)`, the first line of the example above.

- On a copy, change `lt(Steps, 7)` to `lt(Steps, 6)`: the conclusion
  disappears, because some numbers really do need all seven steps.
- Ask for `kaprekar_step(1000, B)`: the answer is 999, because 1000 is
  treated as the digits 1, 0, 0, 0, and 1000 − 0001 = 999. The next step
  then reads 999 as 0999.

---

## Takeaway

eyemind checked a famous number fact case by case, and its search
certificate turns "we searched and found nothing" into something a checker
can confirm.
