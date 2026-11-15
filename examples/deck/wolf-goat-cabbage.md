# Wolf, goat and cabbage

*The river crossing puzzle, with the shortest answer shown to be shortest.*

[wolf-goat-cabbage.js](https://github.com/eyereasoner/eyemind/blob/main/examples/wolf-goat-cabbage.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/wolf-goat-cabbage.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/wolf-goat-cabbage.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/wolf-goat-cabbage.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=wolf-goat-cabbage)

---

## The question

A farmer must get a wolf, a goat and a cabbage across a river. The boat holds
the farmer and at most one passenger. Left alone, the wolf eats the goat, and
the goat eats the cabbage. Finding a plan is one thing; showing that no
shorter plan exists is another.

**How can he do it, and what is the fewest number of crossings?**

---

## What we tell eyemind: crossings

A situation, or *state*, lists which bank, west (`'w'`) or east (`'e'`), the
farmer, wolf, goat and cabbage are on, in that order. Everyone starts west:
`['w', 'w', 'w', 'w']`.

```js
// A plan from a state is a safe move followed by a plan from the next state;
// everyone on the east bank needs no more moves.
fact(solution(['e', 'e', 'e', 'e'], []))
implied_by(
  solution(State, [Move, ...Rest]),
  [move(State, Move, Next), safe(Next), solution(Next, Rest)],
)

// The farmer crosses alone or with one passenger that is on his bank.
implied_by(move([X, X, Goat, Cabbage], 'wolf', [Y, Y, Goat, Cabbage]), change(X, Y))
implied_by(move([X, Wolf, X, Cabbage], 'goat', [Y, Wolf, Y, Cabbage]), change(X, Y))
implied_by(move([X, Wolf, Goat, X], 'cabbage', [Y, Wolf, Goat, Y]), change(X, Y))
implied_by(move([X, Wolf, Goat, Cabbage], 'nothing', [Y, Wolf, Goat, Cabbage]), change(X, Y))

fact(change('e', 'w'))
fact(change('w', 'e'))

// Safe when the goat is with the farmer, or with neither the wolf nor the cabbage.
implied_by(
  safe([Farmer, Wolf, Goat, Cabbage]),
  [one_eq(Farmer, Goat, Wolf), one_eq(Farmer, Goat, Cabbage)],
)
fact(one_eq(X, X, _))
fact(one_eq(X, _, X))
```

- Capitalized names such as `State`, `X` and `Goat` are variables,
  placeholders for any value. A variable used twice must have the same value
  both times, so `move([X, X, ...], 'wolf', ...)` only works when the farmer
  and the wolf are on the same bank. `_` means "anything, we don't care
  what".
- `implied_by(conclusion, premise)` is a backward rule, used on demand. A
  premise in square brackets needs all its parts.
- `solution(State, Plan)`: from `State`, the list of moves `Plan` gets
  everyone across. Nothing is left to do once everyone is east; otherwise
  make a move, check that the new state is safe, and continue.
  `[Move, ...Rest]` is a list whose first item is `Move`.
- `change(X, Y)`: the farmer goes from bank `X` to bank `Y`.
- `one_eq(A, B, C)` holds when `A` equals `B` or `A` equals `C`. A state is
  safe when the goat is with the farmer or apart from the wolf, and with the
  farmer or apart from the cabbage.

---

## What we tell eyemind: the shortest plan

```js
// Some plan of 0 to 6 crossings works.
implied_by(
  'shorter_solution',
  [in_range(0, 6, N), moves(N, Plan), solution(['w', 'w', 'w', 'w'], Plan)],
)

// once(...) stops at the first seven-crossing plan; shortest_crossing lists all.
implied_by(
  wolf_goat_cabbage_verified(7),
  [not('shorter_solution'), moves(7, Plan), once(solution(['w', 'w', 'w', 'w'], Plan))],
)
implied_by(
  shortest_crossing(Plan),
  [not('shorter_solution'), moves(7, Plan), solution(['w', 'w', 'w', 'w'], Plan)],
)

query(wolf_goat_cabbage_verified(7))
query(shortest_crossing(_))
```

- `moves(N, Plan)` makes a plan of exactly `N` moves still to be chosen, and
  `in_range(0, 6, N)` counts `N` from 0 to 6 (both are defined in the
  program with simple counting rules). Fixing the length keeps the search
  finite, even though a plan may visit the same state twice.
- `'shorter_solution'` holds if some plan of 0 to 6 crossings works.
- `not('shorter_solution')` holds if eyemind **cannot find** such a plan:
  it tries every one and all fail. This is called *negation as failure*.
- `once(...)` is a **control**: it stops at the first answer of the goal
  inside it.
- So: *7 is verified* if there is no shorter plan and there is a plan of 7.
  *A shortest crossing* is any plan of 7, given that there is no shorter one.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
wolf_goat_cabbage_verified(7)
shortest_crossing(['goat', 'nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat'])
shortest_crossing(['goat', 'nothing', 'cabbage', 'goat', 'wolf', 'nothing', 'goat'])
```

Seven crossings is the minimum, and there are exactly two seven-crossing
plans. Both start and end by taking the goat; they differ only in whether the
wolf or the cabbage goes over first. The first plan, crossing by crossing:

1. Take the goat over. (Wolf and cabbage are safe together.)
2. Come back alone.
3. Take the wolf over.
4. Bring the goat back, or the wolf would eat it.
5. Take the cabbage over.
6. Come back alone.
7. Take the goat over. Everyone is east.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The whole proof
has 87 call tables; see the [full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/wolf-goat-cabbage.js).
Here are its claims and a few of its tables:

```js
// Answers: each instance of a query() that holds.
wolf_goat_cabbage_verified(7)
shortest_crossing(['goat', 'nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat'])
shortest_crossing(['goat', 'nothing', 'cabbage', 'goat', 'wolf', 'nothing', 'goat'])

// Certificate: the derived facts and every answer of each call the questions make.
called(wolf_goat_cabbage_verified(7), [wolf_goat_cabbage_verified(7)])
called('shorter_solution', [])
called(in_range(0, 6, A), [in_range(0, 6, 0), in_range(0, 6, 1), in_range(0, 6, 2), in_range(0, 6, 3), in_range(0, 6, 4), in_range(0, 6, 5), in_range(0, 6, 6)])
// …
called(solution(['w', 'w', 'w', 'w'], [_79, _80, _81, _82, _83, _84]), [])
// …
called(moves(7, A4), [moves(7, [_105, _106, _107, _108, _109, _110, _111])])
// … 82 more called lines, 87 in all
```

It has two parts:

- **The claims**: the three answers.
- **The certificate**: one *call table* per call the questions make, each
  written `called(call, answers)` with every answer of that call, in the
  order the search found them, repetitions included. A table's own
  variables, such as `A` or `_79`, stand for what the call left open.

The puzzle is solved entirely by backward rules, so no forward rule derives
a fact: the proof needs no steps and no listings. Clauses are numbered by
their place in the program.

Read the shown tables as sentences:

- *7 crossings is verified, once* — the table for the first query. Rule 17
  needs no shorter solution, a list of 7 moves, and the first solution among
  them.
- *There is no shorter solution* — `called('shorter_solution', [])`: the
  search for a shorter plan has **no** answers. The tables below it record
  that search: the lengths 0 to 6 from `in_range`, a plan of each length,
  the moves possible from each state, and which states are safe.
- *No plan of 6 crossings works* — the table for `solution` from all-west
  with 6 open moves is empty, as are those for 0 to 5 moves.
- *Every plan has 7 moves* — `moves(7, A4)` has one answer, a list of 7
  open moves, which the `solution` table after it fills in. That table
  holds the two plans, each found 16 times, because a safe state can often
  be shown safe in two ways (facts 10 and 11). The table for
  `shortest_crossing(_145)` repeats them the same way; the claims list each
  plan once.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms each table in one procedure. It expands the call
one level against the program, as a search would, computing tests such as
`gt(7, 0)` and `7 − 1 = 6` itself, and answers each inner call from that
call's own table, so no table vouches for itself. For rule 17 it answers
`not('shorter_solution')` from that call's empty table, and
`once(solution(...))` from the first answer of the `solution` table. Every
move must be legal and every state on the way safe, and a plan a table hid,
or added, would show up as a disagreement. Finally the claims must be
exactly the answers, and every table must have been used. This is the
complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
wolf_goat_cabbage_verified(7)
shortest_crossing(['goat', 'nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat'])
shortest_crossing(['goat', 'nothing', 'cabbage', 'goat', 'wolf', 'nothing', 'goat'])

verdict('checked')
```

*There is no shorter solution* is not taken on trust: the empty table and
the tables below it record the search behind it, and the checker confirms
each one. "No shorter plan" is meant with respect to this program: the
search covered every plan of 0 to 6 crossings the program allows. The
verdict is **checked**: the two plans are fully checked, move by move, and so
is the claim that *7 is the minimum*. The claims are also every answer of
the original questions.

---

## Try it

```sh
eyemind examples/wolf-goat-cabbage.js            # the answers
eyemind --proof examples/wolf-goat-cabbage.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=wolf-goat-cabbage).
Change `in_range(0, 6, N)` to `in_range(0, 7, N)`. Now "a shorter solution"
includes seven-crossing plans, which exist, so `not('shorter_solution')`
fails and eyemind reports `// No answers: no query() instance holds.`

---

## Takeaway

"Here is a plan" and "no better plan exists" are different kinds of claim.
eyemind records the search behind both, call by call, so that the second
can be checked as well as the first.
