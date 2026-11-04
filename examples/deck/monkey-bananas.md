# Monkey and bananas

*A classic planning puzzle: how does the monkey reach the bananas?*

[monkey-bananas.js](https://github.com/eyereasoner/eyemind/blob/main/examples/monkey-bananas.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/monkey-bananas.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/monkey-bananas.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/monkey-bananas.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=monkey-bananas)

---

## The question

A room has three spots: loc1, loc2 and loc3. Bananas hang from the ceiling at
loc1, too high to reach. The monkey stands at loc2. A box sits at loc3.

The monkey can walk, push the box while on the ground, climb on and off the
box, and grab the bananas when standing on the box beneath them. Finding a
sequence of moves that reaches a goal is called *planning*.

**Which sequences of one to five moves end with the monkey holding the
bananas?**

---

## What we tell eyemind: situations and moves

A situation, or *state*, is a list `[Bananas, Monkey, Box, OnBox,
HasBananas]`: where the bananas, the monkey and the box are, then `'y'` or
`'n'` (yes or no) for whether the monkey is on the box and whether it holds
the bananas.

```js
fact(initial_state(['loc1', 'loc2', 'loc3', 'n', 'n']))
// Any state in which the monkey holds the bananas is a goal.
fact(goal_state([_, _, _, _, 'y']))

// Climbing needs the monkey and box at the same place, and grabbing needs
// all three there with the monkey on the box. Pushing moves monkey and box
// together; walking (go) moves only the monkey. Both need it on the ground.
fact(legal_move([B, M, M, 'n', H], 'climb_on', [B, M, M, 'y', H]))
fact(legal_move([B, M, M, 'y', H], 'climb_off', [B, M, M, 'n', H]))
fact(legal_move([B, B, B, 'y', 'n'], 'grab', [B, B, B, 'y', 'y']))
implied_by(
  legal_move([B, M, M, 'n', H], push(X), [B, X, X, 'n', H]),
  [location(X), not_unify(X, M)],
)
implied_by(
  legal_move([B, M, L, 'n', H], go(X), [B, X, L, 'n', H]),
  [location(X), not_unify(X, M)],
)

fact(location('loc1'))
fact(location('loc2'))
fact(location('loc3'))
```

- `legal_move(Before, Move, After)` says a move leads from one state to the
  next.
- Capitalized names such as `B`, `M` and `H` are variables, placeholders for
  any value. A variable that appears twice must have the same value both
  times, so `[B, M, M, ...]` means "the monkey and the box are at the same
  place", and `grab` needs all three at `B`, with the monkey on the box.
  `_` means "anything, we don't care what".
- `implied_by(conclusion, premise)` is a backward rule, used on demand. A
  push to `X`, or a walk to `X`, is legal if `X` is a location and
  `not_unify(X, M)`: a **built-in test** that `X` and `M` are different, so
  the monkey cannot "move" to where it already is.

---

## What we tell eyemind: searching for plans

```js
implied_by(reaches_goal(Moves), [initial_state(I), goal_state(G), reachable(I, Moves, G)])

fact(reachable(S, [], S))
implied_by(reachable(S1, [M, ...Rest], S3), [legal_move(S1, M, S2), reachable(S2, Rest, S3)])

// Plans are tried shortest first: a plan of a given length is a list of that
// many moves still to be chosen. in_range(1, 5, N) yields N = 1, 2, ..., 5.
fact(moves(0, []))
implied_by(moves(N, [_, ...Rest]), [gt(N, 0), is(M, sub(N, 1)), moves(M, Rest)])
implied_by(in_range(Low, High, Low), le(Low, High))
implied_by(
  in_range(Low, High, N),
  [lt(Low, High), is(Next, add(Low, 1)), in_range(Next, High, N)],
)

implies([in_range(1, 5, N), moves(N, Moves), reaches_goal(Moves)], plan(Moves))
```

- A list of moves *reaches the goal* if it leads from the initial state to a
  goal state.
- `reachable(S1, Moves, S3)`: with no moves you stay where you are; otherwise
  make a legal first move `M`, then follow the rest. `[M, ...Rest]` is a list
  whose first item is `M` and whose remaining items are `Rest`.
- `moves(N, Moves)` makes a list of `N` moves still to be chosen, and
  `in_range(1, 5, N)` counts `N` from 1 to 5. `gt`, `lt`, `le` ("greater
  than", "less than", "at most") are built-in tests; `is(M, sub(N, 1))`
  calculates.
- `implies(premise, conclusion)` is a forward rule: whenever the premise
  holds, conclude the conclusion. Here: for each length from 1 to 5, every
  list of that many moves that reaches the goal is a `plan`. The length
  bound keeps the search finite, even though the monkey could walk back and
  forth forever.

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
plan([go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc1'), go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc3'), push('loc1'), 'climb_on', 'grab', 'climb_off'])
plan([go('loc3'), push('loc2'), push('loc1'), 'climb_on', 'grab'])
```

There is no plan of three moves or fewer. There is one four-move plan: walk
to the box, push it under the bananas, climb on, grab. The three five-move
plans are variations of it: a detour to loc1 first, an extra climb down at
the end, or an extra push via loc2.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. The whole proof
has 86 steps; see the [full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/monkey-bananas.js).
Here are its claims, all its clauses, and the complete chain of 41 steps
for the first plan:

```js
// Conclusions: the facts the program derives, in the order derived.
plan([go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc1'), go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc3'), push('loc1'), 'climb_on', 'grab', 'climb_off'])
plan([go('loc3'), push('loc2'), push('loc1'), 'climb_on', 'grab'])

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(reaches_goal(Moves), [initial_state(I), goal_state(G), reachable(I, Moves, G)]))
clause(2, fact(reachable(S, [], S)))
clause(3, implied_by(reachable(S1, [M, ...Rest], S3), [legal_move(S1, M, S2), reachable(S2, Rest, S3)]))
clause(4, fact(initial_state(['loc1', 'loc2', 'loc3', 'n', 'n'])))
clause(5, fact(goal_state([_0, _1, _2, _3, 'y'])))
clause(6, fact(legal_move([B, M, M, 'n', H], 'climb_on', [B, M, M, 'y', H])))
clause(7, fact(legal_move([B, M, M, 'y', H], 'climb_off', [B, M, M, 'n', H])))
clause(8, fact(legal_move([B, B, B, 'y', 'n'], 'grab', [B, B, B, 'y', 'y'])))
clause(9, implied_by(legal_move([B, M, M, 'n', H], push(X), [B, X, X, 'n', H]), [location(X), not_unify(X, M)]))
clause(10, implied_by(legal_move([B, M, L, 'n', H], go(X), [B, X, L, 'n', H]), [location(X), not_unify(X, M)]))
clause(11, fact(location('loc1')))
clause(12, fact(location('loc2')))
clause(13, fact(location('loc3')))
clause(14, fact(moves(0, [])))
clause(15, implied_by(moves(N, [_0, ...Rest]), [gt(N, 0), is(M, sub(N, 1)), moves(M, Rest)]))
clause(16, implied_by(in_range(Low, High, Low), le(Low, High)))
clause(17, implied_by(in_range(Low, High, N), [lt(Low, High), is(Next, add(Low, 1)), in_range(Next, High, N)]))
clause(18, implies([in_range(1, 5, N), moves(N, Moves), reaches_goal(Moves)], plan(Moves)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(plan([go('loc3'), push('loc1'), 'climb_on', 'grab']), clause(18), {N: 4, Moves: [go('loc3'), push('loc1'), 'climb_on', 'grab']}, [in_range(1, 5, 4), moves(4, [go('loc3'), push('loc1'), 'climb_on', 'grab']), reaches_goal([go('loc3'), push('loc1'), 'climb_on', 'grab'])])
step(in_range(1, 5, 4), clause(17), {Low: 1, High: 5, N: 4, Next: 2}, [lt(1, 5), is(2, add(1, 1)), in_range(2, 5, 4)])
step(lt(1, 5), 'builtin', {}, [])
step(is(2, add(1, 1)), 'builtin', {}, [])
step(in_range(2, 5, 4), clause(17), {Low: 2, High: 5, N: 4, Next: 3}, [lt(2, 5), is(3, add(2, 1)), in_range(3, 5, 4)])
step(lt(2, 5), 'builtin', {}, [])
step(is(3, add(2, 1)), 'builtin', {}, [])
step(in_range(3, 5, 4), clause(17), {Low: 3, High: 5, N: 4, Next: 4}, [lt(3, 5), is(4, add(3, 1)), in_range(4, 5, 4)])
step(lt(3, 5), 'builtin', {}, [])
step(is(4, add(3, 1)), 'builtin', {}, [])
step(in_range(4, 5, 4), clause(16), {Low: 4, High: 5}, [le(4, 5)])
step(le(4, 5), 'builtin', {}, [])
step(moves(4, [go('loc3'), push('loc1'), 'climb_on', 'grab']), clause(15), {N: 4, _0: go('loc3'), Rest: [push('loc1'), 'climb_on', 'grab'], M: 3}, [gt(4, 0), is(3, sub(4, 1)), moves(3, [push('loc1'), 'climb_on', 'grab'])])
step(gt(4, 0), 'builtin', {}, [])
step(is(3, sub(4, 1)), 'builtin', {}, [])
step(moves(3, [push('loc1'), 'climb_on', 'grab']), clause(15), {N: 3, _0: push('loc1'), Rest: ['climb_on', 'grab'], M: 2}, [gt(3, 0), is(2, sub(3, 1)), moves(2, ['climb_on', 'grab'])])
step(gt(3, 0), 'builtin', {}, [])
step(is(2, sub(3, 1)), 'builtin', {}, [])
step(moves(2, ['climb_on', 'grab']), clause(15), {N: 2, _0: 'climb_on', Rest: ['grab'], M: 1}, [gt(2, 0), is(1, sub(2, 1)), moves(1, ['grab'])])
step(gt(2, 0), 'builtin', {}, [])
step(is(1, sub(2, 1)), 'builtin', {}, [])
step(moves(1, ['grab']), clause(15), {N: 1, _0: 'grab', Rest: [], M: 0}, [gt(1, 0), is(0, sub(1, 1)), moves(0, [])])
step(gt(1, 0), 'builtin', {}, [])
step(is(0, sub(1, 1)), 'builtin', {}, [])
step(moves(0, []), clause(14), {}, [])
step(reaches_goal([go('loc3'), push('loc1'), 'climb_on', 'grab']), clause(1), {Moves: [go('loc3'), push('loc1'), 'climb_on', 'grab'], I: ['loc1', 'loc2', 'loc3', 'n', 'n'], G: ['loc1', 'loc1', 'loc1', 'y', 'y']}, [initial_state(['loc1', 'loc2', 'loc3', 'n', 'n']), goal_state(['loc1', 'loc1', 'loc1', 'y', 'y']), reachable(['loc1', 'loc2', 'loc3', 'n', 'n'], [go('loc3'), push('loc1'), 'climb_on', 'grab'], ['loc1', 'loc1', 'loc1', 'y', 'y'])])
step(initial_state(['loc1', 'loc2', 'loc3', 'n', 'n']), clause(4), {}, [])
step(goal_state(['loc1', 'loc1', 'loc1', 'y', 'y']), clause(5), {_0: 'loc1', _1: 'loc1', _2: 'loc1', _3: 'y'}, [])
step(reachable(['loc1', 'loc2', 'loc3', 'n', 'n'], [go('loc3'), push('loc1'), 'climb_on', 'grab'], ['loc1', 'loc1', 'loc1', 'y', 'y']), clause(3), {S1: ['loc1', 'loc2', 'loc3', 'n', 'n'], M: go('loc3'), Rest: [push('loc1'), 'climb_on', 'grab'], S3: ['loc1', 'loc1', 'loc1', 'y', 'y'], S2: ['loc1', 'loc3', 'loc3', 'n', 'n']}, [legal_move(['loc1', 'loc2', 'loc3', 'n', 'n'], go('loc3'), ['loc1', 'loc3', 'loc3', 'n', 'n']), reachable(['loc1', 'loc3', 'loc3', 'n', 'n'], [push('loc1'), 'climb_on', 'grab'], ['loc1', 'loc1', 'loc1', 'y', 'y'])])
step(legal_move(['loc1', 'loc2', 'loc3', 'n', 'n'], go('loc3'), ['loc1', 'loc3', 'loc3', 'n', 'n']), clause(10), {B: 'loc1', M: 'loc2', L: 'loc3', H: 'n', X: 'loc3'}, [location('loc3'), not_unify('loc3', 'loc2')])
step(location('loc3'), clause(13), {}, [])
step(not_unify('loc3', 'loc2'), 'builtin', {}, [])
step(reachable(['loc1', 'loc3', 'loc3', 'n', 'n'], [push('loc1'), 'climb_on', 'grab'], ['loc1', 'loc1', 'loc1', 'y', 'y']), clause(3), {S1: ['loc1', 'loc3', 'loc3', 'n', 'n'], M: push('loc1'), Rest: ['climb_on', 'grab'], S3: ['loc1', 'loc1', 'loc1', 'y', 'y'], S2: ['loc1', 'loc1', 'loc1', 'n', 'n']}, [legal_move(['loc1', 'loc3', 'loc3', 'n', 'n'], push('loc1'), ['loc1', 'loc1', 'loc1', 'n', 'n']), reachable(['loc1', 'loc1', 'loc1', 'n', 'n'], ['climb_on', 'grab'], ['loc1', 'loc1', 'loc1', 'y', 'y'])])
step(legal_move(['loc1', 'loc3', 'loc3', 'n', 'n'], push('loc1'), ['loc1', 'loc1', 'loc1', 'n', 'n']), clause(9), {B: 'loc1', M: 'loc3', H: 'n', X: 'loc1'}, [location('loc1'), not_unify('loc1', 'loc3')])
step(location('loc1'), clause(11), {}, [])
step(not_unify('loc1', 'loc3'), 'builtin', {}, [])
step(reachable(['loc1', 'loc1', 'loc1', 'n', 'n'], ['climb_on', 'grab'], ['loc1', 'loc1', 'loc1', 'y', 'y']), clause(3), {S1: ['loc1', 'loc1', 'loc1', 'n', 'n'], M: 'climb_on', Rest: ['grab'], S3: ['loc1', 'loc1', 'loc1', 'y', 'y'], S2: ['loc1', 'loc1', 'loc1', 'y', 'n']}, [legal_move(['loc1', 'loc1', 'loc1', 'n', 'n'], 'climb_on', ['loc1', 'loc1', 'loc1', 'y', 'n']), reachable(['loc1', 'loc1', 'loc1', 'y', 'n'], ['grab'], ['loc1', 'loc1', 'loc1', 'y', 'y'])])
step(legal_move(['loc1', 'loc1', 'loc1', 'n', 'n'], 'climb_on', ['loc1', 'loc1', 'loc1', 'y', 'n']), clause(6), {B: 'loc1', M: 'loc1', H: 'n'}, [])
step(reachable(['loc1', 'loc1', 'loc1', 'y', 'n'], ['grab'], ['loc1', 'loc1', 'loc1', 'y', 'y']), clause(3), {S1: ['loc1', 'loc1', 'loc1', 'y', 'n'], M: 'grab', Rest: [], S3: ['loc1', 'loc1', 'loc1', 'y', 'y'], S2: ['loc1', 'loc1', 'loc1', 'y', 'y']}, [legal_move(['loc1', 'loc1', 'loc1', 'y', 'n'], 'grab', ['loc1', 'loc1', 'loc1', 'y', 'y']), reachable(['loc1', 'loc1', 'loc1', 'y', 'y'], [], ['loc1', 'loc1', 'loc1', 'y', 'y'])])
step(legal_move(['loc1', 'loc1', 'loc1', 'y', 'n'], 'grab', ['loc1', 'loc1', 'loc1', 'y', 'y']), clause(8), {B: 'loc1'}, [])
step(reachable(['loc1', 'loc1', 'loc1', 'y', 'y'], [], ['loc1', 'loc1', 'loc1', 'y', 'y']), clause(2), {S: ['loc1', 'loc1', 'loc1', 'y', 'y']}, [])
// … 45 more steps, 86 in total, prove the three five-move plans. They reuse
// the steps above wherever they can, such as the legal moves already shown.
```

It has three parts:

- **The claims**: the four plans.
- **The clauses**: every line of the program, numbered 1 to 18 in order. The
  `_` marks of the program are shown as `_0` to `_3`, so they can be given
  values like any other variable.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable of the cited line stood for. `clause(N)`
  means "by line N of the program"; `'builtin'` means a test or calculation
  that the checker does not take on trust but redoes itself.

The 41 steps for the first plan say:

- **Step 1.** *`[go('loc3'), push('loc1'), 'climb_on', 'grab']` is a plan* —
  by rule 18, with `N` = 4: 4 is in the range 1 to 5, the plan is a list of
  4 moves, and it reaches the goal.
- **Steps 2 to 12.** *4 is in the range 1 to 5* — by rules 17 and 16,
  counting up 1, 2, 3, 4 with the built-in tests `1 < 5`, `1 + 1 = 2`, and so
  on, until `4 ≤ 5`.
- **Steps 13 to 25.** *The plan is a list of 4 moves* — by rule 15, taking
  one move off at a time (4 > 0, 4 − 1 = 3, …), down to the empty list of
  0 moves (fact 14).
- **Step 26.** *The plan reaches the goal* — by rule 1: it leads from the
  initial state to the goal state `['loc1', 'loc1', 'loc1', 'y', 'y']`.
- **Steps 27 and 28.** *The initial state is bananas at loc1, monkey at loc2,
  box at loc3* (fact 4), and *any state where the monkey holds the bananas
  is a goal* (fact 5).
- **Steps 30 to 32.** *`go('loc3')` is legal* — by rule 10: loc3 is a
  location (fact 13) and loc3 ≠ loc2 (builtin). The monkey walks to the box.
- **Steps 34 to 36.** *`push('loc1')` is legal* — by rule 9: loc1 is a
  location (fact 11) and loc1 ≠ loc3. Monkey and box move under the
  bananas.
- **Step 38.** *`'climb_on'` is legal* — fact 6: monkey and box are
  in the same place, and the monkey is on the ground.
- **Step 40.** *`'grab'` is legal* — fact 8: all three are at loc1
  and the monkey is on the box.
- **Step 41.** *With no moves left, the monkey stays in the goal state* —
  fact 2.

Steps 29, 33, 37 and 39, by rule 3, link these moves together: each says
*from this state, these remaining moves reach the goal*, because the first
of them is legal and the rest reach the goal from the state it leads to.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
plan([go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc1'), go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc3'), push('loc1'), 'climb_on', 'grab', 'climb_off'])
plan([go('loc3'), push('loc2'), push('loc1'), 'climb_on', 'grab'])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 61)
condition('C2', 'well_founded', 'ok', 86)
condition('C3', 'justification', 'ok', 86)
condition('C4', 'coverage', 'ok', 127)
condition('C5', 're_decision', 'ok', 25)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 90)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(86)
verified(61)
recomputed(25)
composed(0)
trusted(0)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (61)**: the 61 steps that cite a program line really are
  instances of that line with the values shown: each move is a legal move,
  and each state follows from the last.
- **C2 well-founded (86)**: none of the 86 steps depends on itself, even
  indirectly.
- **C3 justification (86)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (127)**: the 4 claims and the 123 things the steps use are
  each backed by a step.
- **C5 re-decision (25)**: the checker redid the 25 built-in tests and
  calculations (counting to 5, "loc3 ≠ loc2", and so on) and got the same
  results.
- **C6 boundary consistency (0)**: nothing was concluded from the absence of
  a fact, so there is nothing to confront.
- **C7 relevance (90)**: the 4 claims are conclusions of the program, and
  all 86 steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics: 86 steps, 61 verified against the program, 25 recomputed,
none taken on trust, 4 claims. The verdict is **checked**: each of the four
plans really works. As the last comment says, this confirms the claims; it
does not by itself show that there are no other plans of up to five moves.

---

## Try it

```sh
eyemind examples/monkey-bananas.js            # the answers
eyemind --proof examples/monkey-bananas.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=monkey-bananas).
Change `in_range(1, 5, N)` to `in_range(1, 4, N)` to allow at most four
moves: only the shortest plan remains. Or start the monkey next to the box,
by changing the initial state to `['loc1', 'loc3', 'loc3', 'n', 'n']`: the
shortest plan is now three moves, `[push('loc1'), 'climb_on', 'grab']`, and
there are 18 plans in all.
