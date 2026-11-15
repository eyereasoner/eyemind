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

eyemind backs such a conclusion with **call tables**. A table
`called(call, answers)` lists every answer a call gives: for the negation,
`called('counterexample', [])` says the search for a counterexample gave
none. The search behind it made many more calls, one per multiset and per
Kaprekar step, and each gets its own table. The checker never redoes the
search. It checks each table by expanding its call one level against the
program, as a search would, and answering every inner call from that call's
own table, so no table vouches for itself. If every table agrees with its
expansion, the absence is checked, not taken on trust.

---

## The proof, line by line

This is the proof, with its claim and the start of its certificate; the
certificate has 13,556 call tables, of which three are shown:

```js
// Answers: each instance of a query() that holds.
kaprekar_verified(6174, 7)

// Certificate: the derived facts and every answer of each call the questions make.
called(kaprekar_verified(6174, 7), [kaprekar_verified(6174, 7)])
called('counterexample', [])
// … the table for digit_multiset(A): the 705 representative numbers
called(in_range(0, 9, B), [in_range(0, 9, 0), in_range(0, 9, 1), in_range(0, 9, 2), in_range(0, 9, 3), in_range(0, 9, 4), in_range(0, 9, 5), in_range(0, 9, 6), in_range(0, 9, 7), in_range(0, 9, 8), in_range(0, 9, 9)])
// … 13552 more call tables: every Kaprekar step the multisets take
```

It has two parts:

- **The claim**: the answer the proof is about.
- **The certificate**: one call table per call the question makes, directly
  or inside another call's search. It starts with the question itself,
  which has the one answer `kaprekar_verified(6174, 7)`, then the negated
  call `'counterexample'`, which has none. Below those come the calls that
  search made, from the digit multisets down to each Kaprekar step, each
  with its answers.

There are no steps. Steps record the firings of forward rules, and this
program has none: every rule is a backward rule, so every call is answered
by its table, and the tables are checked against the rules directly.

Read the first lines as sentences:

1. *The question `kaprekar_verified(6174, 7)` has exactly one answer*: the
   claim.
2. *There is no counterexample*: the call `'counterexample'` has no answers.
3. *The digit multisets are exactly the 705 numbers listed*.
4. *Counting from 0 to 9 gives 0, 1, …, 9*, used to build those multisets.

The whole exhaustive search sits behind the second line: all 705 multisets
and every Kaprekar step they take. The certificate records what each call
answered, including the calls that answered nothing, so that the search can
be checked too.

---

## Checked: what the report says

`eyemind -c` generates the proof and checks it against the program;
`--check-proof` checks a saved proof. The checker never reasons by itself:
it reads the clauses from the program and confirms the proof against them
in one procedure:

- **It answers the question.** Expanding `kaprekar_verified(6174, 7)` one
  level reaches clause 19, whose `not('counterexample')` is decided from the
  `'counterexample'` table: no answers, so the negation holds and the
  question has its one answer.
- **It checks every table it consults.** `'counterexample'` expands to the
  rule that tries each digit multiset, with `digit_multiset(A)` answered from
  its table and each `reaches_6174(A, 0)` from its own. Each of those
  expands in turn to Kaprekar steps, whose digit sorting and arithmetic the
  checker computes. Every table must equal its expansion, answer for answer,
  and no table may rest on itself.
- **It compares the claims with the answers.** The claim is the only answer,
  and every table in the proof was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
kaprekar_verified(6174, 7)

verdict('checked')
```

*"There is no counterexample"* is true relative to this program, that is,
as far as these rules and facts can show. The verdict is **checked**: the
claim follows from the program, and it is every answer of the question. The
checker did not re-run the search: it confirmed the record of it, table by
table.

---

## Checking a search without redoing it

The claim *is* a claim about absence: no number fails. A checker could
redo the whole search, or take it on trust. eyemind's checker does neither:
it checks the written record of the search, one call at a time, and never
searches itself. The record is large, 13,556 tables, but each table is a
small check: one level of search, with every inner call looked up.

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

eyemind checked a famous number fact case by case, and its call
tables turn "we searched and found nothing" into something a checker
can confirm.
