# The Sieve of Eratosthenes

*A 2,200-year-old recipe for prime numbers, with every crossed-out number on record.*

[sieve.js](https://github.com/eyereasoner/eyemind/blob/main/examples/sieve.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/sieve.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/sieve.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/sieve.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=sieve)

---

## The question

A **prime** is a whole number above 1 that only divides by 1 and itself:
2, 3, 5, 7, 11, …

The Greek scholar Eratosthenes found them like this: write down the numbers
from 2 upwards. Keep the first one, cross out all its multiples. Keep the
next number still standing, cross out its multiples. Repeat until the list
is used up.

**Which numbers up to 100 are prime?**

---

## What we tell eyemind

```js
implied_by(primes(Limit, Primes), [integers(2, Limit, Integers), sift(Integers, Primes)])

// integers(Start, End, List): List is Start, Start + 1, ..., End.
implied_by(integers(Start, End, []), gt(Start, End))
implied_by(
  integers(Start, End, [Start, ...Rest]),
  [le(Start, End), is(Next, add(Start, 1)), integers(Next, End, Rest)],
)

// sift keeps the first number as a prime and sifts what is left after
// removing its multiples.
fact(sift([], []))
implied_by(sift([I, ...Is], [I, ...Ps]), [remove(I, Is, New), sift(New, Ps)])

// remove(P, List, Rest): Rest is List without the multiples of P; exactly
// one of the two guards, I mod P = 0 or not, holds for each number.
fact(remove(_, [], []))
implied_by(remove(P, [I, ...Is], Rest), [eq(0, mod(I, P)), remove(P, Is, Rest)])
implied_by(remove(P, [I, ...Is], [I, ...Rest]), [ne(0, mod(I, P)), remove(P, Is, Rest)])

query(primes(100, _))
```

`implied_by(head, body)` is a backward rule: *"the head holds if every part
of the body holds"*. `fact(...)` states something true outright.
Capitalized names are variables, placeholders for any value, and `_` is one
whose value does not matter.

Lists are written in square brackets. `[I, ...Is]` means *a list whose first
number is `I`, followed by the rest of the list `Is`*; `[]` is the empty
list. The rules take a list apart this way, one number at a time:

- `integers(2, 100, List)` builds the list 2, 3, …, 100.
- `sift` keeps the first number as a prime, has `remove` cross out its
  multiples from the rest, and sifts what is left.
- `remove(P, List, Rest)` looks at each number `I`: if the remainder of
  `I` divided by `P` (`mod(I, P)`) is 0, it is a multiple and is dropped;
  otherwise it is kept.

`eq`, `ne`, `gt` and `le` are comparisons (equal, not equal, greater than,
at most), `is` computes, and `add` and `mod` are addition and remainder.
These are **builtins**, operations built into eyemind. The comparisons act
as *guards*: for each number exactly one of the two `remove` rules applies.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
primes(100, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97])
```

The first line is a comment saying what follows. The answer is the list of
the 25 primes below 100, exactly the classic list.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. The proof replays
the whole recipe: 1,173 steps and about 315 KB, because many steps carry a
whole list of up to 99 numbers. The
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/sieve.js)
is linked above. Here are its claim and clauses, one crossing-out step, and
the complete chain for the end of the sieve, `sift([79, 83, 89, 97], …)`:

```js
// Answers: each instance of a query() that holds.
primes(100, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97])

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(primes(Limit, Primes), [integers(2, Limit, Integers), sift(Integers, Primes)]))
clause(2, implied_by(integers(Start, End, []), gt(Start, End)))
clause(3, implied_by(integers(Start, End, [Start, ...Rest]), [le(Start, End), is(Next, add(Start, 1)), integers(Next, End, Rest)]))
clause(4, fact(sift([], [])))
clause(5, implied_by(sift([I, ...Is], [I, ...Ps]), [remove(I, Is, New), sift(New, Ps)]))
clause(6, fact(remove(_0, [], [])))
clause(7, implied_by(remove(P, [I, ...Is], Rest), [eq(0, mod(I, P)), remove(P, Is, Rest)]))
clause(8, implied_by(remove(P, [I, ...Is], [I, ...Rest]), [ne(0, mod(I, P)), remove(P, Is, Rest)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
// … steps 1–697: build the list 2 to 100, sift out 2, 3 and 5, start on 7
step(remove(7, [77, 79, 83, 89, 91, 97], [79, 83, 89, 97]), clause(7), {P: 7, I: 77, Is: [79, 83, 89, 91, 97], Rest: [79, 83, 89, 97]}, [eq(0, mod(77, 7)), remove(7, [79, 83, 89, 91, 97], [79, 83, 89, 97])])
step(eq(0, mod(77, 7)), 'builtin', {}, [])
// … steps 700–1152: the rest of 7, then 11 up to 73
step(sift([79, 83, 89, 97], [79, 83, 89, 97]), clause(5), {I: 79, Is: [83, 89, 97], Ps: [83, 89, 97], New: [83, 89, 97]}, [remove(79, [83, 89, 97], [83, 89, 97]), sift([83, 89, 97], [83, 89, 97])])
step(remove(79, [83, 89, 97], [83, 89, 97]), clause(8), {P: 79, I: 83, Is: [89, 97], Rest: [89, 97]}, [ne(0, mod(83, 79)), remove(79, [89, 97], [89, 97])])
step(ne(0, mod(83, 79)), 'builtin', {}, [])
step(remove(79, [89, 97], [89, 97]), clause(8), {P: 79, I: 89, Is: [97], Rest: [97]}, [ne(0, mod(89, 79)), remove(79, [97], [97])])
step(ne(0, mod(89, 79)), 'builtin', {}, [])
step(remove(79, [97], [97]), clause(8), {P: 79, I: 97, Is: [], Rest: []}, [ne(0, mod(97, 79)), remove(79, [], [])])
step(ne(0, mod(97, 79)), 'builtin', {}, [])
step(remove(79, [], []), clause(6), {_0: 79}, [])
step(sift([83, 89, 97], [83, 89, 97]), clause(5), {I: 83, Is: [89, 97], Ps: [89, 97], New: [89, 97]}, [remove(83, [89, 97], [89, 97]), sift([89, 97], [89, 97])])
step(remove(83, [89, 97], [89, 97]), clause(8), {P: 83, I: 89, Is: [97], Rest: [97]}, [ne(0, mod(89, 83)), remove(83, [97], [97])])
step(ne(0, mod(89, 83)), 'builtin', {}, [])
step(remove(83, [97], [97]), clause(8), {P: 83, I: 97, Is: [], Rest: []}, [ne(0, mod(97, 83)), remove(83, [], [])])
step(ne(0, mod(97, 83)), 'builtin', {}, [])
step(remove(83, [], []), clause(6), {_0: 83}, [])
step(sift([89, 97], [89, 97]), clause(5), {I: 89, Is: [97], Ps: [97], New: [97]}, [remove(89, [97], [97]), sift([97], [97])])
step(remove(89, [97], [97]), clause(8), {P: 89, I: 97, Is: [], Rest: []}, [ne(0, mod(97, 89)), remove(89, [], [])])
step(ne(0, mod(97, 89)), 'builtin', {}, [])
step(remove(89, [], []), clause(6), {_0: 89}, [])
step(sift([97], [97]), clause(5), {I: 97, Is: [], Ps: [], New: []}, [remove(97, [], []), sift([], [])])
step(remove(97, [], []), clause(6), {_0: 97}, [])
step(sift([], []), clause(4), {}, [])
```

That last line is step 1,173, the final one. The proof has three parts:

- **The claim**: the list of primes.
- **The clauses**: the program's eight lines, numbered by position. The
  `_` placeholder is named `_0` so a step can say what it stood for.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`. A `'builtin'`
  step is a comparison or calculation the checker redoes itself.

The first step uses rule 1: the primes up to 100 are what sifting the list
2 … 100 gives. Then come 299 steps that build that list, three per number
(is it at most 100? add 1; continue), and the sifting.

The crossing-out step reads: *removing the multiples of 7 from
[77, 79, 83, 89, 91, 97] leaves [79, 83, 89, 97]* — by rule 7, because the
remainder of 77 divided by 7 is 0, so 77 is dropped; the next step
recomputes that remainder.

The chain at the end reads:

1. *Sifting [79, 83, 89, 97] gives [79, 83, 89, 97]* — by rule 5: keep 79,
   remove its multiples from [83, 89, 97] (none), and sift what is left.
2. *Removing multiples of 79 from [83, 89, 97] leaves it unchanged* — by
   rule 8, because 83 mod 79 is not 0 (step 3, builtin), and so on.
4. –7. The same for 89 and 97: neither is a multiple of 79.
8. *Removing anything from an empty list leaves it empty* — fact 6.
9. *Sifting [83, 89, 97] gives [83, 89, 97]* — by rule 5, and so on down.
10. –20. The same pattern for 83, 89 and 97.
21. *Sifting an empty list gives an empty list* — fact 4. The recipe ends.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
primes(100, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 563)
condition('C2', 'well_founded', 'ok', 1173)
condition('C3', 'justification', 'ok', 1173)
condition('C4', 'coverage', 'ok', 1173)
condition('C5', 're_decision', 'ok', 610)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 1174)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(1173)
verified(563)
recomputed(610)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (563)**: the 563 steps that cite a program line, every
  keep, every crossing-out and every list-building step, really are
  instances of it with the values shown.
- **C2 well-founded (1173)**: none of the 1,173 steps depends on itself,
  even indirectly: each list rests on a shorter one, down to the empty list.
- **C3 justification (1173)**: every step says how it was justified, in a
  form the checker understands.
- **C4 coverage (1173)**: the 1 claim and the 1,172 things the steps use are
  each backed by a step.
- **C5 re-decision (610)**: the checker **recomputed** all 610 builtin
  steps, every comparison and every remainder, and got the same results.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of something, so there is nothing to confront.
- **C7 relevance (1174)**: the 1 claim answers the query, and all 1,173
  steps serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.

The statistics repeat this: 1,173 steps, 563 verified against the program,
610 recomputed, none taken on trust. The verdict is **checked**: the list of
primes follows from the program. It does not say there are no other
answers.

Why stop at 100? The proof records every intermediate list, so it grows far
faster than the answer: about 315 KB here, and more than memory holds at a
limit of 1000.

---

## Try it

```sh
eyemind examples/sieve.js
eyemind --proof examples/sieve.js
```

Change `primes(100, _)` to `primes(50, _)`: you get the 15 primes up to 47.
To watch one crossing-out on its own, ask
`--goal "remove(3, [4, 6, 7, 9, 10], R)"`: the answer is `[4, 7, 10]`.

---

## Takeaway

An old algorithm becomes a fully audited one: not just "here are the
primes", but every single crossing-out, independently rechecked. The cost
of that honesty is visible too, in the size of the proof.
