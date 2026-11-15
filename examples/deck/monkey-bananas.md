# Monkey and bananas

*A classic planning puzzle: how does the monkey reach the bananas?*

[monkey-bananas.js](https://github.com/eyereasoner/eyemind/blob/main/examples/monkey-bananas.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/monkey-bananas.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/monkey-bananas.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/monkey-bananas.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=monkey-bananas)

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
has 4 steps, 1 listing and 79 call tables; see the
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/monkey-bananas.js).
Here are its claims, its steps and listing, and the call tables that show
there is no plan of one move and how the four-move plan is found:

```js
// Conclusions: the facts the program derives, in the order derived.
plan([go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc1'), go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc3'), push('loc1'), 'climb_on', 'grab', 'climb_off'])
plan([go('loc3'), push('loc2'), push('loc1'), 'climb_on', 'grab'])

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(plan([go('loc3'), push('loc1'), 'climb_on', 'grab']), clause(18), {N: 4, Moves: [go('loc3'), push('loc1'), 'climb_on', 'grab']}, [in_range(1, 5, 4), moves(4, [go('loc3'), push('loc1'), 'climb_on', 'grab']), reaches_goal([go('loc3'), push('loc1'), 'climb_on', 'grab'])])
step(plan([go('loc1'), go('loc3'), push('loc1'), 'climb_on', 'grab']), clause(18), {N: 5, Moves: [go('loc1'), go('loc3'), push('loc1'), 'climb_on', 'grab']}, [in_range(1, 5, 5), moves(5, [go('loc1'), go('loc3'), push('loc1'), 'climb_on', 'grab']), reaches_goal([go('loc1'), go('loc3'), push('loc1'), 'climb_on', 'grab'])])
step(plan([go('loc3'), push('loc1'), 'climb_on', 'grab', 'climb_off']), clause(18), {N: 5, Moves: [go('loc3'), push('loc1'), 'climb_on', 'grab', 'climb_off']}, [in_range(1, 5, 5), moves(5, [go('loc3'), push('loc1'), 'climb_on', 'grab', 'climb_off']), reaches_goal([go('loc3'), push('loc1'), 'climb_on', 'grab', 'climb_off'])])
step(plan([go('loc3'), push('loc2'), push('loc1'), 'climb_on', 'grab']), clause(18), {N: 5, Moves: [go('loc3'), push('loc2'), push('loc1'), 'climb_on', 'grab']}, [in_range(1, 5, 5), moves(5, [go('loc3'), push('loc2'), push('loc1'), 'climb_on', 'grab']), reaches_goal([go('loc3'), push('loc2'), push('loc1'), 'climb_on', 'grab'])])

// Certificate: the derived facts and every answer of each call the questions make.
derived(plan(A), [plan([go('loc3'), push('loc1'), 'climb_on', 'grab']), plan([go('loc1'), go('loc3'), push('loc1'), 'climb_on', 'grab']), plan([go('loc3'), push('loc1'), 'climb_on', 'grab', 'climb_off']), plan([go('loc3'), push('loc2'), push('loc1'), 'climb_on', 'grab'])])
called(plan(A), [plan([go('loc3'), push('loc1'), 'climb_on', 'grab']), plan([go('loc1'), go('loc3'), push('loc1'), 'climb_on', 'grab']), plan([go('loc3'), push('loc1'), 'climb_on', 'grab', 'climb_off']), plan([go('loc3'), push('loc2'), push('loc1'), 'climb_on', 'grab'])])
called(in_range(1, 5, B), [in_range(1, 5, 1), in_range(1, 5, 2), in_range(1, 5, 3), in_range(1, 5, 4), in_range(1, 5, 5)])
// … the tables counting 2 to 5
called(moves(1, G), [moves(1, [_7])])
called(moves(0, I), [moves(0, [])])
called(reaches_goal([_9]), [])
called(reachable(['loc1', 'loc2', 'loc3', 'n', 'n'], [_10], [_11, _12, _13, _14, 'y']), [])
called(legal_move(['loc1', 'loc2', 'loc3', 'n', 'n'], P, Q), [legal_move(['loc1', 'loc2', 'loc3', 'n', 'n'], go('loc1'), ['loc1', 'loc1', 'loc3', 'n', 'n']), legal_move(['loc1', 'loc2', 'loc3', 'n', 'n'], go('loc3'), ['loc1', 'loc3', 'loc3', 'n', 'n'])])
// … 30 tables: the rest of the one-move search, and the empty two- and
// three-move searches
called(moves(4, G), [moves(4, [_86, _87, _88, _89])])
called(reaches_goal([_90, _91, _92, _93]), [reaches_goal([go('loc3'), push('loc1'), 'climb_on', 'grab'])])
called(reachable(['loc1', 'loc2', 'loc3', 'n', 'n'], [_94, _95, _96, _97], [_98, _99, _100, _101, 'y']), [reachable(['loc1', 'loc2', 'loc3', 'n', 'n'], [go('loc3'), push('loc1'), 'climb_on', 'grab'], ['loc1', 'loc1', 'loc1', 'y', 'y'])])
// … the table for the other first move
called(reachable(['loc1', 'loc3', 'loc3', 'n', 'n'], [_102, _103, _104], [_105, _106, _107, _108, 'y']), [reachable(['loc1', 'loc3', 'loc3', 'n', 'n'], [push('loc1'), 'climb_on', 'grab'], ['loc1', 'loc1', 'loc1', 'y', 'y'])])
// … the table for the other second move
called(reachable(['loc1', 'loc1', 'loc1', 'n', 'n'], [_109, _110], [_111, _112, _113, _114, 'y']), [reachable(['loc1', 'loc1', 'loc1', 'n', 'n'], ['climb_on', 'grab'], ['loc1', 'loc1', 'loc1', 'y', 'y'])])
called(reachable(['loc1', 'loc1', 'loc1', 'y', 'n'], [_115], [_116, _117, _118, _119, 'y']), [reachable(['loc1', 'loc1', 'loc1', 'y', 'n'], ['grab'], ['loc1', 'loc1', 'loc1', 'y', 'y'])])
// … the moves allowed on the box
called(reachable(['loc1', 'loc1', 'loc1', 'y', 'y'], [], [_122, _123, _124, _125, 'y']), [reachable(['loc1', 'loc1', 'loc1', 'y', 'y'], [], ['loc1', 'loc1', 'loc1', 'y', 'y'])])
// … 28 more tables: the dead ends of four moves, and the plans of five
```

It has three parts:

- **The claims**: the four plans.
- **The steps**: one per plan, since `plan` is the only relation a forward
  rule concludes. A step reads `step(what, by which clause, with which
  values, using what)`: here clause 18, the planning rule, with `N` and
  `Moves` filled in. Clauses are numbered 1 to 18 in program order.
- **The certificate**: the *listing* `derived(plan(A), ...)` of every plan
  the rule derived, and one *call table* `called(call, answers)` per call
  the search made, with every answer it gave. Open places in a call are
  shown as variables; `_7`, `_9` and the like are the move slots the search
  had not yet filled.

The step for the first plan says: *`[go('loc3'), push('loc1'), 'climb_on',
'grab']` is a plan* — by rule 18, with `N` = 4, because 4 is in the range 1
to 5, the plan is a list of 4 moves, and it reaches the goal. The rest of
the story is in the tables:

- **Counting.** `in_range(1, 5, B)` gives exactly 1 to 5: plans are tried for
  each length in turn.
- **No plan of one move.** `moves(1, G)` gives one list with an open slot,
  `[_7]`; `reaches_goal([_9])` has *no* answers, because from the initial
  state (bananas at loc1, monkey at loc2, box at loc3) no single legal move
  reaches a state where the monkey holds the bananas. The `legal_move`
  table lists the moves allowed from the start: the monkey can walk to loc1
  or loc3.
- **No plan of two or three moves.** Further tables show every search of
  those lengths coming up empty.
- **The four-move plan.** `reaches_goal` of four open moves has exactly one
  answer, and the `reachable` tables below it follow the plan one move at a
  time: from the box's position, `push('loc1')` moves monkey and box under
  the bananas; from there `'climb_on'` and `'grab'` reach the goal state
  `['loc1', 'loc1', 'loc1', 'y', 'y']`; and with no moves left, the monkey
  stays there.

Each `reachable` table rests on the `legal_move` table of its state, and
each `legal_move` table on rules 9 and 10 and the facts for climbing and
grabbing, with the built-in test `not_unify` deciding that a walk or push
goes somewhere new.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the question.** The program has no query, so its question is
  the head of its forward rule, `plan(Moves)`. The checker expands it one
  level: the listed plans are its answers, as the table says.
- **It checks the listing is closed.** It runs the body of rule 18 against
  the certificate: for each length, `moves` and `reaches_goal` are answered
  from their tables, and each of those tables is checked by expanding its
  call one level against the program, with the counting and the `not_unify`
  tests computed. The four plans it finds are exactly the four listed, so
  the rule derives no plan the listing leaves out.
- **It replays each listed fact.** It re-runs rule 18 for each plan from no
  bindings, and the result matches the recorded step.
- **It compares the claims with the answers.** The four claims are exactly
  the four plans. Every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
plan([go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc1'), go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc3'), push('loc1'), 'climb_on', 'grab', 'climb_off'])
plan([go('loc3'), push('loc2'), push('loc1'), 'climb_on', 'grab'])

verdict('checked')
```

The verdict is **checked**: each of the four plans really works, and they
are every plan of up to five moves this program allows.

---

## Try it

```sh
eyemind examples/monkey-bananas.js            # the answers
eyemind --proof examples/monkey-bananas.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=monkey-bananas).
Change `in_range(1, 5, N)` to `in_range(1, 4, N)` to allow at most four
moves: only the shortest plan remains. Or start the monkey next to the box,
by changing the initial state to `['loc1', 'loc3', 'loc3', 'n', 'n']`: the
shortest plan is now three moves, `[push('loc1'), 'climb_on', 'grab']`, and
there are 18 plans in all.

---

## Takeaway

A plan is a chain of small, checkable moves. eyemind finds the plans and
records why each move was allowed, so you can follow the monkey step by step.
