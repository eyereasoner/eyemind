# The Sieve of Eratosthenes

*A 2,200-year-old recipe for prime numbers, with every crossed-out number on record.*

[sieve.js](https://github.com/eyereasoner/eyemind/blob/main/examples/sieve.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/sieve.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/sieve.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/sieve.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=sieve)

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

`eyemind --proof` writes down how it reached the answer. The proof records
every call the search made: 563 call tables and about 138 KB, because many
tables carry a whole list of up to 99 numbers. The
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/sieve.js)
is linked above. Here are its claim, the start of its certificate, the end
of the list building, one crossing-out, and the complete chain for the end
of the sieve, `sift([79, 83, 89, 97], …)`:

```js
// Answers: each instance of a query() that holds.
primes(100, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97])

// Certificate: the derived facts and every answer of each call the questions make.
called(primes(100, _0), [primes(100, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97])])
// … tables 2–99: the lists from 3 to 100 down to 98 to 100
called(integers(100, 100, V3), [integers(100, 100, [100])])
called(integers(101, 100, W3), [integers(101, 100, [])])
// … tables 102–303: sifting out 2, 3 and 5, and starting on 7
called(remove(7, [77, 79, 83, 89, 91, 97], R11), [remove(7, [77, 79, 83, 89, 91, 97], [79, 83, 89, 97])])
// … tables 305–548: the rest of 7, then 11 up to 73
called(sift([79, 83, 89, 97], C21), [sift([79, 83, 89, 97], [79, 83, 89, 97])])
called(remove(79, [83, 89, 97], D21), [remove(79, [83, 89, 97], [83, 89, 97])])
called(remove(79, [89, 97], E21), [remove(79, [89, 97], [89, 97])])
called(remove(79, [97], F21), [remove(79, [97], [97])])
called(remove(79, [], G21), [remove(79, [], [])])
called(sift([83, 89, 97], H21), [sift([83, 89, 97], [83, 89, 97])])
called(remove(83, [89, 97], I21), [remove(83, [89, 97], [89, 97])])
called(remove(83, [97], J21), [remove(83, [97], [97])])
called(remove(83, [], K21), [remove(83, [], [])])
called(sift([89, 97], L21), [sift([89, 97], [89, 97])])
called(remove(89, [97], M21), [remove(89, [97], [97])])
called(remove(89, [], N21), [remove(89, [], [])])
called(sift([97], O21), [sift([97], [97])])
called(remove(97, [], P21), [remove(97, [], [])])
called(sift([], Q21), [sift([], [])])
```

That last line is table 563, the final one. The proof has two parts:

- **The claim**: the list of primes.
- **The certificate**: one **call table** per call the search made. A table
  reads `called(call, every answer)`, and renames the call's variables `A`,
  `B`, … in order (`_0` for the query's `_`). Each table here has exactly
  one answer: there is only one way to sift a list.

There are no `step(...)` lines. Steps record how forward rules derived
facts; this program has only backward rules, so the tables carry
everything. The first table answers the query. The next 100 build the list
2 … 100, one number at a time: `integers(101, 100, W3)` is the empty end.
Then comes the sifting.

The crossing-out table reads: *removing the multiples of 7 from
[77, 79, 83, 89, 91, 97] leaves [79, 83, 89, 97], and nothing else*. Rule 7
explains it: the remainder of 77 divided by 7 is 0, so 77 is dropped, and
the rest comes from the table for `remove(7, [79, 83, 89, 91, 97], …)`.

The chain at the end reads:

1. *Sifting [79, 83, 89, 97] gives [79, 83, 89, 97]* — by rule 5: keep 79,
   remove its multiples from [83, 89, 97] (none), and sift what is left.
2. –5. *Removing multiples of 79 leaves each list unchanged* — by rule 8,
   since 83, 89 and 97 are not multiples of 79, down to the empty list
   (fact 6).
6. –14. The same pattern for 83, 89 and 97.
15. *Sifting an empty list gives an empty list* — fact 4. The recipe ends.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the rules from
the program and confirms every call table by expanding its call one level,
answering each inner call from its own table.

For the crossing-out table, it tries rules 6, 7 and 8 on
`remove(7, [77, …], R)`: fact 6 needs an empty list; rule 7 **computes**
77 mod 7 itself, gets 0, and takes the rest from the next table; rule 8
needs a remainder other than 0, so it gives nothing. That is exactly the
table's one answer. All 563 tables are confirmed this way, every comparison,
sum and remainder computed afresh, and none rests on itself: each list
rests on a shorter one, down to the empty list. Then the query's answers are
compared with the claim: it is the one answer, and every table was used.
This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
primes(100, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97])

verdict('checked')
```

The verdict is **checked**: the list of primes follows from the program, and
it is the only answer of the query.

Why stop at 100? The proof records every intermediate list, so it grows far
faster than the answer: about 138 KB here, and far more at a limit of 1000.

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
