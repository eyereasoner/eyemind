# Wolf, goat and cabbage

*The river crossing puzzle, with the shortest answer shown to be shortest.*

[wolf-goat-cabbage.js](https://github.com/eyereasoner/eyemind/blob/main/examples/wolf-goat-cabbage.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/wolf-goat-cabbage.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/wolf-goat-cabbage.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/wolf-goat-cabbage.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=wolf-goat-cabbage)

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
has 72 steps; see the [full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/wolf-goat-cabbage.js).
Here are its claims, its clauses, and the complete chain of 55 steps for
the first answer:

```js
// Answers: each instance of a query() that holds.
wolf_goat_cabbage_verified(7)
shortest_crossing(['goat', 'nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat'])
shortest_crossing(['goat', 'nothing', 'cabbage', 'goat', 'wolf', 'nothing', 'goat'])

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(solution(['e', 'e', 'e', 'e'], [])))
clause(2, implied_by(solution(State, [Move, ...Rest]), [move(State, Move, Next), safe(Next), solution(Next, Rest)]))
clause(3, implied_by(move([X, X, Goat, Cabbage], 'wolf', [Y, Y, Goat, Cabbage]), change(X, Y)))
clause(4, implied_by(move([X, Wolf, X, Cabbage], 'goat', [Y, Wolf, Y, Cabbage]), change(X, Y)))
clause(5, implied_by(move([X, Wolf, Goat, X], 'cabbage', [Y, Wolf, Goat, Y]), change(X, Y)))
clause(6, implied_by(move([X, Wolf, Goat, Cabbage], 'nothing', [Y, Wolf, Goat, Cabbage]), change(X, Y)))
clause(7, fact(change('e', 'w')))
clause(8, fact(change('w', 'e')))
clause(9, implied_by(safe([Farmer, Wolf, Goat, Cabbage]), [one_eq(Farmer, Goat, Wolf), one_eq(Farmer, Goat, Cabbage)]))
clause(10, fact(one_eq(X, X, _0)))
clause(11, fact(one_eq(X, _0, X)))
clause(12, fact(moves(0, [])))
clause(13, implied_by(moves(N, [_0, ...Rest]), [gt(N, 0), is(M, sub(N, 1)), moves(M, Rest)]))
clause(17, implied_by(wolf_goat_cabbage_verified(7), [not('shorter_solution'), moves(7, Plan), once(solution(['w', 'w', 'w', 'w'], Plan))]))
clause(18, implied_by(shortest_crossing(Plan), [not('shorter_solution'), moves(7, Plan), solution(['w', 'w', 'w', 'w'], Plan)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(wolf_goat_cabbage_verified(7), clause(17), {Plan: ['goat', 'nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat']}, [not('shorter_solution'), moves(7, ['goat', 'nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat']), once(solution(['w', 'w', 'w', 'w'], ['goat', 'nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat']))])
step(not('shorter_solution'), 'absent', {}, [])
step(moves(7, ['goat', 'nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat']), clause(13), {N: 7, _0: 'goat', Rest: ['nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat'], M: 6}, [gt(7, 0), is(6, sub(7, 1)), moves(6, ['nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat'])])
step(gt(7, 0), 'builtin', {}, [])
step(is(6, sub(7, 1)), 'builtin', {}, [])
step(moves(6, ['nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat']), clause(13), {N: 6, _0: 'nothing', Rest: ['wolf', 'goat', 'cabbage', 'nothing', 'goat'], M: 5}, [gt(6, 0), is(5, sub(6, 1)), moves(5, ['wolf', 'goat', 'cabbage', 'nothing', 'goat'])])
step(gt(6, 0), 'builtin', {}, [])
step(is(5, sub(6, 1)), 'builtin', {}, [])
step(moves(5, ['wolf', 'goat', 'cabbage', 'nothing', 'goat']), clause(13), {N: 5, _0: 'wolf', Rest: ['goat', 'cabbage', 'nothing', 'goat'], M: 4}, [gt(5, 0), is(4, sub(5, 1)), moves(4, ['goat', 'cabbage', 'nothing', 'goat'])])
step(gt(5, 0), 'builtin', {}, [])
step(is(4, sub(5, 1)), 'builtin', {}, [])
step(moves(4, ['goat', 'cabbage', 'nothing', 'goat']), clause(13), {N: 4, _0: 'goat', Rest: ['cabbage', 'nothing', 'goat'], M: 3}, [gt(4, 0), is(3, sub(4, 1)), moves(3, ['cabbage', 'nothing', 'goat'])])
step(gt(4, 0), 'builtin', {}, [])
step(is(3, sub(4, 1)), 'builtin', {}, [])
step(moves(3, ['cabbage', 'nothing', 'goat']), clause(13), {N: 3, _0: 'cabbage', Rest: ['nothing', 'goat'], M: 2}, [gt(3, 0), is(2, sub(3, 1)), moves(2, ['nothing', 'goat'])])
step(gt(3, 0), 'builtin', {}, [])
step(is(2, sub(3, 1)), 'builtin', {}, [])
step(moves(2, ['nothing', 'goat']), clause(13), {N: 2, _0: 'nothing', Rest: ['goat'], M: 1}, [gt(2, 0), is(1, sub(2, 1)), moves(1, ['goat'])])
step(gt(2, 0), 'builtin', {}, [])
step(is(1, sub(2, 1)), 'builtin', {}, [])
step(moves(1, ['goat']), clause(13), {N: 1, _0: 'goat', Rest: [], M: 0}, [gt(1, 0), is(0, sub(1, 1)), moves(0, [])])
step(gt(1, 0), 'builtin', {}, [])
step(is(0, sub(1, 1)), 'builtin', {}, [])
step(moves(0, []), clause(12), {}, [])
step(once(solution(['w', 'w', 'w', 'w'], ['goat', 'nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat'])), 'control', {}, [solution(['w', 'w', 'w', 'w'], ['goat', 'nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat'])])
step(solution(['w', 'w', 'w', 'w'], ['goat', 'nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat']), clause(2), {State: ['w', 'w', 'w', 'w'], Move: 'goat', Rest: ['nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat'], Next: ['e', 'w', 'e', 'w']}, [move(['w', 'w', 'w', 'w'], 'goat', ['e', 'w', 'e', 'w']), safe(['e', 'w', 'e', 'w']), solution(['e', 'w', 'e', 'w'], ['nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat'])])
step(move(['w', 'w', 'w', 'w'], 'goat', ['e', 'w', 'e', 'w']), clause(4), {X: 'w', Wolf: 'w', Cabbage: 'w', Y: 'e'}, [change('w', 'e')])
step(change('w', 'e'), clause(8), {}, [])
step(safe(['e', 'w', 'e', 'w']), clause(9), {Farmer: 'e', Wolf: 'w', Goat: 'e', Cabbage: 'w'}, [one_eq('e', 'e', 'w'), one_eq('e', 'e', 'w')])
step(one_eq('e', 'e', 'w'), clause(10), {X: 'e', _0: 'w'}, [])
step(solution(['e', 'w', 'e', 'w'], ['nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat']), clause(2), {State: ['e', 'w', 'e', 'w'], Move: 'nothing', Rest: ['wolf', 'goat', 'cabbage', 'nothing', 'goat'], Next: ['w', 'w', 'e', 'w']}, [move(['e', 'w', 'e', 'w'], 'nothing', ['w', 'w', 'e', 'w']), safe(['w', 'w', 'e', 'w']), solution(['w', 'w', 'e', 'w'], ['wolf', 'goat', 'cabbage', 'nothing', 'goat'])])
step(move(['e', 'w', 'e', 'w'], 'nothing', ['w', 'w', 'e', 'w']), clause(6), {X: 'e', Wolf: 'w', Goat: 'e', Cabbage: 'w', Y: 'w'}, [change('e', 'w')])
step(change('e', 'w'), clause(7), {}, [])
step(safe(['w', 'w', 'e', 'w']), clause(9), {Farmer: 'w', Wolf: 'w', Goat: 'e', Cabbage: 'w'}, [one_eq('w', 'e', 'w'), one_eq('w', 'e', 'w')])
step(one_eq('w', 'e', 'w'), clause(11), {X: 'w', _0: 'e'}, [])
step(solution(['w', 'w', 'e', 'w'], ['wolf', 'goat', 'cabbage', 'nothing', 'goat']), clause(2), {State: ['w', 'w', 'e', 'w'], Move: 'wolf', Rest: ['goat', 'cabbage', 'nothing', 'goat'], Next: ['e', 'e', 'e', 'w']}, [move(['w', 'w', 'e', 'w'], 'wolf', ['e', 'e', 'e', 'w']), safe(['e', 'e', 'e', 'w']), solution(['e', 'e', 'e', 'w'], ['goat', 'cabbage', 'nothing', 'goat'])])
step(move(['w', 'w', 'e', 'w'], 'wolf', ['e', 'e', 'e', 'w']), clause(3), {X: 'w', Goat: 'e', Cabbage: 'w', Y: 'e'}, [change('w', 'e')])
step(safe(['e', 'e', 'e', 'w']), clause(9), {Farmer: 'e', Wolf: 'e', Goat: 'e', Cabbage: 'w'}, [one_eq('e', 'e', 'e'), one_eq('e', 'e', 'w')])
step(one_eq('e', 'e', 'e'), clause(10), {X: 'e', _0: 'e'}, [])
step(solution(['e', 'e', 'e', 'w'], ['goat', 'cabbage', 'nothing', 'goat']), clause(2), {State: ['e', 'e', 'e', 'w'], Move: 'goat', Rest: ['cabbage', 'nothing', 'goat'], Next: ['w', 'e', 'w', 'w']}, [move(['e', 'e', 'e', 'w'], 'goat', ['w', 'e', 'w', 'w']), safe(['w', 'e', 'w', 'w']), solution(['w', 'e', 'w', 'w'], ['cabbage', 'nothing', 'goat'])])
step(move(['e', 'e', 'e', 'w'], 'goat', ['w', 'e', 'w', 'w']), clause(4), {X: 'e', Wolf: 'e', Cabbage: 'w', Y: 'w'}, [change('e', 'w')])
step(safe(['w', 'e', 'w', 'w']), clause(9), {Farmer: 'w', Wolf: 'e', Goat: 'w', Cabbage: 'w'}, [one_eq('w', 'w', 'e'), one_eq('w', 'w', 'w')])
step(one_eq('w', 'w', 'e'), clause(10), {X: 'w', _0: 'e'}, [])
step(one_eq('w', 'w', 'w'), clause(10), {X: 'w', _0: 'w'}, [])
step(solution(['w', 'e', 'w', 'w'], ['cabbage', 'nothing', 'goat']), clause(2), {State: ['w', 'e', 'w', 'w'], Move: 'cabbage', Rest: ['nothing', 'goat'], Next: ['e', 'e', 'w', 'e']}, [move(['w', 'e', 'w', 'w'], 'cabbage', ['e', 'e', 'w', 'e']), safe(['e', 'e', 'w', 'e']), solution(['e', 'e', 'w', 'e'], ['nothing', 'goat'])])
step(move(['w', 'e', 'w', 'w'], 'cabbage', ['e', 'e', 'w', 'e']), clause(5), {X: 'w', Wolf: 'e', Goat: 'w', Y: 'e'}, [change('w', 'e')])
step(safe(['e', 'e', 'w', 'e']), clause(9), {Farmer: 'e', Wolf: 'e', Goat: 'w', Cabbage: 'e'}, [one_eq('e', 'w', 'e'), one_eq('e', 'w', 'e')])
step(one_eq('e', 'w', 'e'), clause(11), {X: 'e', _0: 'w'}, [])
step(solution(['e', 'e', 'w', 'e'], ['nothing', 'goat']), clause(2), {State: ['e', 'e', 'w', 'e'], Move: 'nothing', Rest: ['goat'], Next: ['w', 'e', 'w', 'e']}, [move(['e', 'e', 'w', 'e'], 'nothing', ['w', 'e', 'w', 'e']), safe(['w', 'e', 'w', 'e']), solution(['w', 'e', 'w', 'e'], ['goat'])])
step(move(['e', 'e', 'w', 'e'], 'nothing', ['w', 'e', 'w', 'e']), clause(6), {X: 'e', Wolf: 'e', Goat: 'w', Cabbage: 'e', Y: 'w'}, [change('e', 'w')])
step(safe(['w', 'e', 'w', 'e']), clause(9), {Farmer: 'w', Wolf: 'e', Goat: 'w', Cabbage: 'e'}, [one_eq('w', 'w', 'e'), one_eq('w', 'w', 'e')])
step(solution(['w', 'e', 'w', 'e'], ['goat']), clause(2), {State: ['w', 'e', 'w', 'e'], Move: 'goat', Rest: [], Next: ['e', 'e', 'e', 'e']}, [move(['w', 'e', 'w', 'e'], 'goat', ['e', 'e', 'e', 'e']), safe(['e', 'e', 'e', 'e']), solution(['e', 'e', 'e', 'e'], [])])
step(move(['w', 'e', 'w', 'e'], 'goat', ['e', 'e', 'e', 'e']), clause(4), {X: 'w', Wolf: 'e', Cabbage: 'e', Y: 'e'}, [change('w', 'e')])
step(safe(['e', 'e', 'e', 'e']), clause(9), {Farmer: 'e', Wolf: 'e', Goat: 'e', Cabbage: 'e'}, [one_eq('e', 'e', 'e'), one_eq('e', 'e', 'e')])
step(solution(['e', 'e', 'e', 'e'], []), clause(1), {}, [])
// … 17 more steps, 72 in total, prove the two shortest_crossing answers.
// They reuse the steps above, so only the second plan needs new ones.
```

It has three parts:

- **The claims**: the three answers.
- **The clauses**: the program lines the steps cite, numbered by their place
  in the program. Lines 14 to 16 (`in_range` and `'shorter_solution'`) are
  not cited: no step uses them, because the absence of a shorter plan is
  taken on trust rather than proved (see below). The `_` of the program is
  shown as `_0`.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable of the cited line stood for.

Four kinds of justification occur. `clause(N)` means "by line N of the
program". `'builtin'` means a test or calculation, such as `gt(7, 0)`, that
the checker redoes itself. `'control'` means `once(...)`, which the checker
rebuilds from the goal inside it. `'absent'` means something was concluded
because it could **not** be found.

The 55 steps say:

- **Step 1.** *7 crossings is verified* — by rule 17, because there is no
  shorter solution, the plan is a list of 7 moves, and it is a solution.
- **Step 2.** *There is no shorter solution* — **absent**: eyemind tried
  every plan of 0 to 6 crossings and none worked. A proof cannot point at a
  missing plan, so this is taken on trust.
- **Steps 3 to 24.** *The plan is a list of 7 moves* — by rule 13, taking
  one move off at a time (7 > 0, 7 − 1 = 6, …), down to the empty list
  (fact 12).
- **Step 25.** *`once(...)` of the solution holds* — **control**: it holds
  because the solution inside it holds (step 26).
- **Steps 26 to 30.** *From all-west, taking the goat gets everyone across* —
  by rule 2: the goat move is legal (rule 4, since the farmer goes from west
  to east, fact 8), and the new state `['e', 'w', 'e', 'w']` is safe (rule
  9: the goat is with the farmer, fact 10).
- **Steps 31 to 35.** *Coming back alone* — rule 6 and fact 7; the state
  `['w', 'w', 'e', 'w']` is safe because the goat is alone on the east bank,
  apart from both the wolf and the cabbage (fact 11).
- **Steps 36 to 39.** *Taking the wolf* — rule 3; `['e', 'e', 'e', 'w']` is
  safe because the farmer is with the goat.
- **Steps 40 to 44.** *Bringing the goat back* — rule 4; `['w', 'e', 'w',
  'w']` is safe because the farmer is with the goat.
- **Steps 45 to 48.** *Taking the cabbage* — rule 5; `['e', 'e', 'w', 'e']`
  is safe because the goat is alone on the west bank.
- **Steps 49 to 51.** *Coming back alone* — rule 6; `['w', 'e', 'w', 'e']`
  is safe because the farmer is with the goat.
- **Steps 52 to 54.** *Taking the goat* — rule 4; `['e', 'e', 'e', 'e']` is
  safe.
- **Step 55.** *With everyone east, nothing is left to do* — fact 1.

Steps already shown, such as `change('w', 'e')`, are reused rather than
repeated.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
wolf_goat_cabbage_verified(7)
shortest_crossing(['goat', 'nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat'])
shortest_crossing(['goat', 'nothing', 'cabbage', 'goat', 'wolf', 'nothing', 'goat'])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 56)
condition('C2', 'well_founded', 'ok', 72)
condition('C3', 'justification', 'ok', 72)
condition('C4', 'coverage', 'ok', 113)
condition('C5', 're_decision', 'ok', 15)
condition('C6', 'boundary_consistency', 'ok', 1)
condition('C7', 'relevance', 'ok', 75)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not('shorter_solution'))

// Proof statistics: recorded steps and how they were checked.
steps(72)
verified(56)
recomputed(14)
composed(1)
trusted(1)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (56)**: the 56 steps that cite a program line really are
  instances of that line with the values shown: every move is legal and
  every state on the way is safe.
- **C2 well-founded (72)**: none of the 72 steps depends on itself, even
  indirectly.
- **C3 justification (72)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (113)**: the 3 claims and the 110 things the steps use are
  each backed by a step.
- **C5 re-decision (15)**: the checker redid the 14 built-in tests and
  calculations and rebuilt the 1 `once(...)` from its part, and all agree.
- **C6 boundary consistency (1)**: the 1 absence was confronted with the
  evidence: nothing in the proof shows a shorter solution.
- **C7 relevance (75)**: the 3 claims answer the queries, and all 72 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics: 72 steps, 56 verified against the program, 14 recomputed, 1
composed (the `once`), 1 trusted, 3 claims.

The `obligation` line is the step taken on trust: *there is no shorter
solution*. `'theory_scoped'` means "with respect to this program": the
search covered every plan of 0 to 6 crossings the program allows. The
verdict is **checked with obligations**: the two plans are fully checked,
move by move; the claim that *7 is the minimum* rests on that exhaustive
search, and the report says so. The verdict does not say the program has no
other conclusions.

---

## Try it

```sh
eyemind examples/wolf-goat-cabbage.js            # the answers
eyemind --proof examples/wolf-goat-cabbage.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=wolf-goat-cabbage).
Change `in_range(0, 6, N)` to `in_range(0, 7, N)`. Now "a shorter solution"
includes seven-crossing plans, which exist, so `not('shorter_solution')`
fails and eyemind reports `// No answers: no query() instance holds.`
