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

`eyemind --proof` writes down how it reached the answer. The proof does not
replay the dead ends of the search; it records why *this* placement works.
It has 153 steps; see the [full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/queens.js).
Here are its claim, all its clauses, the first 56 steps (up to the third
queen) and the last step:

```js
// Answers: each instance of a query() that holds.
once(queens(8, [1, 5, 8, 6, 3, 7, 2, 4]))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(queens(N, Columns), [is_int(N), ge(N, 0), columns(1, N, Available), place(Available, [], Columns)]))
clause(2, implied_by(columns(I, N, []), gt(I, N)))
clause(3, implied_by(columns(I, N, [I, ...Rest]), [le(I, N), is(Next, add(I, 1)), columns(Next, N, Rest)]))
clause(4, fact(select(X, [X, ...Rest], Rest)))
clause(5, implied_by(select(X, [Y, ...Rest], [Y, ...Remaining]), select(X, Rest, Remaining)))
clause(6, fact(place([], _0, [])))
clause(7, implied_by(place(Available, Placed, [Column, ...Rest]), [select(Column, Available, Remaining), safe(Column, Placed, 1), place(Remaining, [Column, ...Placed], Rest)]))
clause(8, fact(safe(_0, [], _1)))
clause(9, implied_by(safe(Column, [Other, ...Rest], Distance), [ne(Column, add(Other, Distance)), ne(Column, sub(Other, Distance)), is(Next, add(Distance, 1)), safe(Column, Rest, Next)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(once(queens(8, [1, 5, 8, 6, 3, 7, 2, 4])), 'control', {}, [queens(8, [1, 5, 8, 6, 3, 7, 2, 4])])
step(queens(8, [1, 5, 8, 6, 3, 7, 2, 4]), clause(1), {N: 8, Columns: [1, 5, 8, 6, 3, 7, 2, 4], Available: [1, 2, 3, 4, 5, 6, 7, 8]}, [is_int(8), ge(8, 0), columns(1, 8, [1, 2, 3, 4, 5, 6, 7, 8]), place([1, 2, 3, 4, 5, 6, 7, 8], [], [1, 5, 8, 6, 3, 7, 2, 4])])
step(is_int(8), 'builtin', {}, [])
step(ge(8, 0), 'builtin', {}, [])
step(columns(1, 8, [1, 2, 3, 4, 5, 6, 7, 8]), clause(3), {I: 1, N: 8, Rest: [2, 3, 4, 5, 6, 7, 8], Next: 2}, [le(1, 8), is(2, add(1, 1)), columns(2, 8, [2, 3, 4, 5, 6, 7, 8])])
step(le(1, 8), 'builtin', {}, [])
step(is(2, add(1, 1)), 'builtin', {}, [])
step(columns(2, 8, [2, 3, 4, 5, 6, 7, 8]), clause(3), {I: 2, N: 8, Rest: [3, 4, 5, 6, 7, 8], Next: 3}, [le(2, 8), is(3, add(2, 1)), columns(3, 8, [3, 4, 5, 6, 7, 8])])
step(le(2, 8), 'builtin', {}, [])
step(is(3, add(2, 1)), 'builtin', {}, [])
step(columns(3, 8, [3, 4, 5, 6, 7, 8]), clause(3), {I: 3, N: 8, Rest: [4, 5, 6, 7, 8], Next: 4}, [le(3, 8), is(4, add(3, 1)), columns(4, 8, [4, 5, 6, 7, 8])])
step(le(3, 8), 'builtin', {}, [])
step(is(4, add(3, 1)), 'builtin', {}, [])
step(columns(4, 8, [4, 5, 6, 7, 8]), clause(3), {I: 4, N: 8, Rest: [5, 6, 7, 8], Next: 5}, [le(4, 8), is(5, add(4, 1)), columns(5, 8, [5, 6, 7, 8])])
step(le(4, 8), 'builtin', {}, [])
step(is(5, add(4, 1)), 'builtin', {}, [])
step(columns(5, 8, [5, 6, 7, 8]), clause(3), {I: 5, N: 8, Rest: [6, 7, 8], Next: 6}, [le(5, 8), is(6, add(5, 1)), columns(6, 8, [6, 7, 8])])
step(le(5, 8), 'builtin', {}, [])
step(is(6, add(5, 1)), 'builtin', {}, [])
step(columns(6, 8, [6, 7, 8]), clause(3), {I: 6, N: 8, Rest: [7, 8], Next: 7}, [le(6, 8), is(7, add(6, 1)), columns(7, 8, [7, 8])])
step(le(6, 8), 'builtin', {}, [])
step(is(7, add(6, 1)), 'builtin', {}, [])
step(columns(7, 8, [7, 8]), clause(3), {I: 7, N: 8, Rest: [8], Next: 8}, [le(7, 8), is(8, add(7, 1)), columns(8, 8, [8])])
step(le(7, 8), 'builtin', {}, [])
step(is(8, add(7, 1)), 'builtin', {}, [])
step(columns(8, 8, [8]), clause(3), {I: 8, N: 8, Rest: [], Next: 9}, [le(8, 8), is(9, add(8, 1)), columns(9, 8, [])])
step(le(8, 8), 'builtin', {}, [])
step(is(9, add(8, 1)), 'builtin', {}, [])
step(columns(9, 8, []), clause(2), {I: 9, N: 8}, [gt(9, 8)])
step(gt(9, 8), 'builtin', {}, [])
step(place([1, 2, 3, 4, 5, 6, 7, 8], [], [1, 5, 8, 6, 3, 7, 2, 4]), clause(7), {Available: [1, 2, 3, 4, 5, 6, 7, 8], Placed: [], Column: 1, Rest: [5, 8, 6, 3, 7, 2, 4], Remaining: [2, 3, 4, 5, 6, 7, 8]}, [select(1, [1, 2, 3, 4, 5, 6, 7, 8], [2, 3, 4, 5, 6, 7, 8]), safe(1, [], 1), place([2, 3, 4, 5, 6, 7, 8], [1], [5, 8, 6, 3, 7, 2, 4])])
step(select(1, [1, 2, 3, 4, 5, 6, 7, 8], [2, 3, 4, 5, 6, 7, 8]), clause(4), {X: 1, Rest: [2, 3, 4, 5, 6, 7, 8]}, [])
step(safe(1, [], 1), clause(8), {_0: 1, _1: 1}, [])
step(place([2, 3, 4, 5, 6, 7, 8], [1], [5, 8, 6, 3, 7, 2, 4]), clause(7), {Available: [2, 3, 4, 5, 6, 7, 8], Placed: [1], Column: 5, Rest: [8, 6, 3, 7, 2, 4], Remaining: [2, 3, 4, 6, 7, 8]}, [select(5, [2, 3, 4, 5, 6, 7, 8], [2, 3, 4, 6, 7, 8]), safe(5, [1], 1), place([2, 3, 4, 6, 7, 8], [5, 1], [8, 6, 3, 7, 2, 4])])
step(select(5, [2, 3, 4, 5, 6, 7, 8], [2, 3, 4, 6, 7, 8]), clause(5), {X: 5, Y: 2, Rest: [3, 4, 5, 6, 7, 8], Remaining: [3, 4, 6, 7, 8]}, [select(5, [3, 4, 5, 6, 7, 8], [3, 4, 6, 7, 8])])
step(select(5, [3, 4, 5, 6, 7, 8], [3, 4, 6, 7, 8]), clause(5), {X: 5, Y: 3, Rest: [4, 5, 6, 7, 8], Remaining: [4, 6, 7, 8]}, [select(5, [4, 5, 6, 7, 8], [4, 6, 7, 8])])
step(select(5, [4, 5, 6, 7, 8], [4, 6, 7, 8]), clause(5), {X: 5, Y: 4, Rest: [5, 6, 7, 8], Remaining: [6, 7, 8]}, [select(5, [5, 6, 7, 8], [6, 7, 8])])
step(select(5, [5, 6, 7, 8], [6, 7, 8]), clause(4), {X: 5, Rest: [6, 7, 8]}, [])
step(safe(5, [1], 1), clause(9), {Column: 5, Other: 1, Rest: [], Distance: 1, Next: 2}, [ne(5, add(1, 1)), ne(5, sub(1, 1)), is(2, add(1, 1)), safe(5, [], 2)])
step(ne(5, add(1, 1)), 'builtin', {}, [])
step(ne(5, sub(1, 1)), 'builtin', {}, [])
step(safe(5, [], 2), clause(8), {_0: 5, _1: 2}, [])
step(place([2, 3, 4, 6, 7, 8], [5, 1], [8, 6, 3, 7, 2, 4]), clause(7), {Available: [2, 3, 4, 6, 7, 8], Placed: [5, 1], Column: 8, Rest: [6, 3, 7, 2, 4], Remaining: [2, 3, 4, 6, 7]}, [select(8, [2, 3, 4, 6, 7, 8], [2, 3, 4, 6, 7]), safe(8, [5, 1], 1), place([2, 3, 4, 6, 7], [8, 5, 1], [6, 3, 7, 2, 4])])
step(select(8, [2, 3, 4, 6, 7, 8], [2, 3, 4, 6, 7]), clause(5), {X: 8, Y: 2, Rest: [3, 4, 6, 7, 8], Remaining: [3, 4, 6, 7]}, [select(8, [3, 4, 6, 7, 8], [3, 4, 6, 7])])
step(select(8, [3, 4, 6, 7, 8], [3, 4, 6, 7]), clause(5), {X: 8, Y: 3, Rest: [4, 6, 7, 8], Remaining: [4, 6, 7]}, [select(8, [4, 6, 7, 8], [4, 6, 7])])
step(select(8, [4, 6, 7, 8], [4, 6, 7]), clause(5), {X: 8, Y: 4, Rest: [6, 7, 8], Remaining: [6, 7]}, [select(8, [6, 7, 8], [6, 7])])
step(select(8, [6, 7, 8], [6, 7]), clause(5), {X: 8, Y: 6, Rest: [7, 8], Remaining: [7]}, [select(8, [7, 8], [7])])
step(select(8, [7, 8], [7]), clause(5), {X: 8, Y: 7, Rest: [8], Remaining: []}, [select(8, [8], [])])
step(select(8, [8], []), clause(4), {X: 8, Rest: []}, [])
step(safe(8, [5, 1], 1), clause(9), {Column: 8, Other: 5, Rest: [1], Distance: 1, Next: 2}, [ne(8, add(5, 1)), ne(8, sub(5, 1)), is(2, add(1, 1)), safe(8, [1], 2)])
step(ne(8, add(5, 1)), 'builtin', {}, [])
step(ne(8, sub(5, 1)), 'builtin', {}, [])
step(safe(8, [1], 2), clause(9), {Column: 8, Other: 1, Rest: [], Distance: 2, Next: 3}, [ne(8, add(1, 2)), ne(8, sub(1, 2)), is(3, add(2, 1)), safe(8, [], 3)])
step(ne(8, add(1, 2)), 'builtin', {}, [])
step(ne(8, sub(1, 2)), 'builtin', {}, [])
step(safe(8, [], 3), clause(8), {_0: 8, _1: 3}, [])
// … steps 57 to 152 place the queens of rows 4 to 8 in the same way:
// select a column, then check it against every earlier queen.
step(place([], [4, 2, 7, 3, 6, 8, 5, 1], []), clause(6), {_0: [4, 2, 7, 3, 6, 8, 5, 1]}, [])
```

It has three parts:

- **The claim**: the answer.
- **The clauses**: every line of the program, numbered 1 to 9 in order. The
  `_` marks are shown as `_0` and `_1`, so they can be given values like any
  other variable.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable of the cited line stood for.

Three kinds of justification occur. `clause(N)` means "by line N of the
program". `'builtin'` means a test or calculation, such as `ne(5, add(1, 1))`
(5 ≠ 1 + 1), that the checker redoes itself. `'control'` means the
`once(...)`, which the checker rebuilds from the goal inside it.

The steps shown say:

- **Step 1.** *`once(...)` holds* — **control**: because the goal inside it
  holds (step 2).
- **Steps 2 to 4.** *`[1, 5, 8, 6, 3, 7, 2, 4]` solves eight queens* — by
  rule 1: 8 is a whole number and 8 ≥ 0 (builtin), the available columns are
  1 to 8, and placing them gives that list.
- **Steps 5 to 30.** *The columns 1 to 8 are `[1, 2, …, 8]`* — by rule 3,
  counting up with `1 ≤ 8`, `1 + 1 = 2`, and so on, until 9 > 8 ends the list
  (rule 2).
- **Steps 31 to 33.** *Row 1 takes column 1* — by rule 7: column 1 is
  selected (fact 4), and it is safe against no earlier queens (fact 8).
- **Steps 34 to 42.** *Row 2 takes column 5* — rule 7: column 5 is selected
  from `[2, 3, 4, 5, 6, 7, 8]` (rule 5 three times, skipping 2, 3, 4, then
  fact 4), and it is safe against the queen in column 1 one row up: 5 ≠ 1 + 1
  and 5 ≠ 1 − 1 (rule 9 and builtins), with no queens left after that
  (fact 8).
- **Steps 43 to 56.** *Row 3 takes column 8* — selected the same way, and
  safe against column 5 one row up (8 ≠ 6, 8 ≠ 4) and column 1 two rows up
  (8 ≠ 3, 8 ≠ −1).
- **Steps 57 to 152** do the same for rows 4 to 8: columns 6, 3, 7, 2 and 4.
- **Step 153.** *With no columns left, the placement is complete* — fact 6.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
once(queens(8, [1, 5, 8, 6, 3, 7, 2, 4]))

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 77)
condition('C2', 'well_founded', 'ok', 153)
condition('C3', 'justification', 'ok', 153)
condition('C4', 'coverage', 'ok', 181)
condition('C5', 're_decision', 'ok', 76)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 154)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(153)
verified(77)
recomputed(75)
composed(1)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (77)**: the 77 steps that cite a program line really are
  instances of that line with the values shown.
- **C2 well-founded (153)**: none of the 153 steps depends on itself, even
  indirectly.
- **C3 justification (153)**: every step says how it was justified, in a
  form the checker understands.
- **C4 coverage (181)**: the 1 claim and the 180 things the steps use are
  each backed by a step.
- **C5 re-decision (76)**: the checker redid the 75 built-in tests and
  calculations, every diagonal test included, and rebuilt the 1 `once(...)`
  from its part; all agree.
- **C6 boundary consistency (0)**: nothing was concluded from the absence of
  a fact, so there is nothing to confront.
- **C7 relevance (154)**: the 1 claim answers the query, and all 153 steps
  serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (0)**: there was no absence or collection to
  settle, so no search certificate to check.

The statistics: 153 steps, 77 verified against the program, 75 recomputed,
1 composed (the `once`), none taken on trust, 1 claim. The verdict is
**checked**: the placement really is a solution. Finding it took searching;
checking it does not. As the last comment says, this confirms the claim; it
does not say how many other solutions there are.

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
one clean certificate for the answer it found, and anyone can check it
without searching again.
