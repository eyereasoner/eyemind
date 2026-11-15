# Eight queens

*Place eight queens on a chessboard so that none can attack another.*

[queens.js](https://github.com/eyereasoner/eyemind/blob/main/examples/queens.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/queens.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/queens.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/queens.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=queens)

---

## The question

In chess, a queen attacks along its row, its column and both diagonals. It
is a classic puzzle to place eight queens on an 8×8 board so that no two
attack each other; finding one answer by hand takes patience.

**Can you place eight queens on an 8×8 board so that no two attack each
other?**

---

## How the board is written

One queen per row, so a placement is just a list of eight column numbers.
The first number is the column of the queen in row 1, the second that of the
queen in row 2, and so on, both counted from 1.

Because each column is used exactly once, rows and columns are safe
automatically. Only the **diagonals** still need checking: two queens that
are `d` rows apart are on the same diagonal when their columns differ by
exactly `d`.

---

## What we tell eyemind

```js
implied_by(
  queens(N, Columns),
  [is_int(N), ge(N, 0), columns(1, N, Available), place(Available, [], Columns)],
)
// columns(1, N, Available) lists the columns 1 to N.
implied_by(columns(I, N, []), gt(I, N))
implied_by(columns(I, N, [I, ...Rest]), [le(I, N), is(Next, add(I, 1)), columns(Next, N, Rest)])
// select(X, List, Rest) picks one element X of List, leaving Rest.
fact(select(X, [X, ...Rest], Rest))
implied_by(select(X, [Y, ...Rest], [Y, ...Remaining]), select(X, Rest, Remaining))
// Each row takes a column not used yet, so columns never repeat; safe checks
// the diagonals against the queens placed so far, nearest row first.
fact(place([], _, []))
implied_by(
  place(Available, Placed, [Column, ...Rest]),
  [
    select(Column, Available, Remaining),
    safe(Column, Placed, 1),
    place(Remaining, [Column, ...Placed], Rest),
  ],
)
// A queen Distance rows away attacks along a diagonal when the columns
// differ by exactly Distance.
fact(safe(_, [], _))
implied_by(
  safe(Column, [Other, ...Rest], Distance),
  [
    ne(Column, add(Other, Distance)),
    ne(Column, sub(Other, Distance)),
    is(Next, add(Distance, 1)),
    safe(Column, Rest, Next),
  ],
)
query(once(queens(8, Columns)))
```

- Capitalized names such as `N`, `Column` and `Rest` are variables,
  placeholders for any value; `_` means "anything, we don't care what".
  `[I, ...Rest]` is a list whose first item is `I`, followed by the items
  `Rest`.
- `implied_by(conclusion, premise)` is a backward rule, used on demand. A
  premise in square brackets needs all its parts, in order.
- `queens(N, Columns)`: `N` must be a whole number, 0 or more; list the
  columns 1 to `N`; then place a queen in each row.
- `select` picks one column from those still available.
- `place` gives each row a column not used yet, checks it is `safe` against
  the queens already placed, and continues with the next row.
- `safe` compares the new column with each earlier queen, the nearest row
  first (distance 1, then 2, …): it must differ from that queen's column
  plus the distance and minus the distance. `ne` ("not equal"), `le`, `gt`,
  `ge` and `is_int` are **built-in tests**, and `is(Next, add(...))` a
  built-in calculation.
- If no column works for a row, eyemind backs up and tries another column
  for an earlier row: a *backtracking search*.
- `once(...)` is a **control**: it stops at the first answer of the goal
  inside it, so the query asks for the first solution only.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
once(queens(8, [1, 5, 8, 6, 3, 7, 2, 4]))
```

```text
Q . . . . . . .
. . . . Q . . .
. . . . . . . Q
. . . . . Q . .
. . Q . . . . .
. . . . . . Q .
. Q . . . . . .
. . . Q . . . .
```

The queen of row 1 is in column 1, that of row 2 in column 5, and so on. No
two share a row, a column or a diagonal.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. The proof records
the search of the question one call at a time: it holds the claim and 13,886
call tables; see the [full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/queens.js).
Here are its claim and a few of its tables:

```js
// Answers: each instance of a query() that holds.
once(queens(8, [1, 5, 8, 6, 3, 7, 2, 4]))

// Certificate: the derived facts and every answer of each call the questions make.
// … the table of the question, called(queens(8, A), [...]), with all 92 solutions
called(columns(1, 8, B), [columns(1, 8, [1, 2, 3, 4, 5, 6, 7, 8])])
called(columns(2, 8, C), [columns(2, 8, [2, 3, 4, 5, 6, 7, 8])])
called(columns(3, 8, D), [columns(3, 8, [3, 4, 5, 6, 7, 8])])
called(columns(4, 8, E), [columns(4, 8, [4, 5, 6, 7, 8])])
called(columns(5, 8, F), [columns(5, 8, [5, 6, 7, 8])])
called(columns(6, 8, G), [columns(6, 8, [6, 7, 8])])
called(columns(7, 8, H), [columns(7, 8, [7, 8])])
called(columns(8, 8, I), [columns(8, 8, [8])])
called(columns(9, 8, J), [columns(9, 8, [])])
// … the tables of place and select
called(safe(1, [], 1), [safe(1, [], 1)])
called(safe(2, [1], 1), [])
called(safe(3, [1], 1), [safe(3, [1], 1)])
called(safe(3, [], 2), [safe(3, [], 2)])
// … and the rest of the 13,886 tables
```

It has two parts:

- **The claim**: the answer, the first placement found.
- **The certificate**: one *call table* per call the search makes, written
  `called(call, answers)` with every answer it gives, in order. Variables
  are renamed `A`, `B`, ... in each table.

There are no steps: steps record the firings of *forward* rules, and this
program has only backward rules and facts, so everything the answer rests
on is a search, which the tables show.

The tables shown say:

- *Asking `queens(8, A)` gives 92 answers*, starting with
  `[1, 5, 8, 6, 3, 7, 2, 4]`. The question asks for `once(...)`, the first
  of them, which is the claim.
- *The columns from 1 to 8 are `[1, 2, …, 8]`*, from 2 they are
  `[2, …, 8]`, and so on, until from 9 there are none (rule 2: 9 > 8).
- *Column 1 is safe against no earlier queens* (fact 8).
- *Column 2 is not safe against a queen in column 1 one row up*: the table
  has no answers, because 2 = 1 + 1 puts them on a diagonal (rule 9).
- *Column 3 is safe against it*, since 3 ≠ 2 and 3 ≠ 0, with no queens left
  after that.

The `place` and `select` tables record, for each partial placement, every
column that can be chosen and every way the rest can be completed, dead
ends included: a table with no answers says that branch fails.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the question.** It expands `once(queens(8, Columns))`: the
  `queens` call is answered from its table, and `once` takes its first
  answer, `[1, 5, 8, 6, 3, 7, 2, 4]`.
- **It checks every table it consults.** Each table must equal its own
  expansion one level against the program, with its inner calls answered
  from their own tables, and the checker computes every test and
  calculation, such as `ne(2, add(1, 1))`, itself. The `queens` table is
  checked against rule 1, the `place` tables against rule 7, and so on down
  to `safe` and `columns`. Tables cannot vouch for themselves through a
  cycle, so the first answer really is the first placement the search finds.
- **It compares the claim with the answer.** The claim is the answer, and
  every table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
once(queens(8, [1, 5, 8, 6, 3, 7, 2, 4]))

verdict('checked')
```

The verdict is **checked**: the placement really is a solution, and it is
the answer the question asks for, the first solution in the program's
search order. Checking it confirms the whole search, one call at a time,
which is why the proof records every branch, not just the winning one.

---

## Try it

```sh
eyemind examples/queens.js
eyemind --goal "queens(4, Columns)" examples/queens.js
```

The 4×4 board has two solutions, `[2, 4, 1, 3]` and `[3, 1, 4, 2]`. Without
`once`, `--goal "queens(8, C)"` lists all 92 solutions for the 8×8 board,
and `queens(6, C)` finds 4.

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=queens).

---

## Takeaway

Search can be long and messy, but its result need not be. eyemind hands back
a certificate for the answer it found, every call of the search with all
its answers, and anyone can check it one call at a time without a solver.
