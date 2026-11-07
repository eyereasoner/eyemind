# Tower of Hanoi

*A classic puzzle solved by thinking smaller — with every move accounted for.*

[hanoi.js](https://github.com/eyereasoner/eyemind/blob/main/examples/hanoi.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/hanoi.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/hanoi.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/hanoi.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=hanoi)

---

## The question

Three pegs: left, center, right. On the left peg sit three disks, largest
at the bottom. Move them all to the right peg. The rules:

- move one disk at a time;
- never put a bigger disk on a smaller one.

**Which moves solve it, and can the computer show why that sequence is
right?**

---

## The trick: think smaller

To move a stack of N disks from one peg to another:

1. move the top N−1 disks out of the way, onto the spare peg;
2. move the biggest disk to its target;
3. move the N−1 disks from the spare peg on top of it.

Moving N−1 disks is the same puzzle, only smaller. Solving a problem by
reducing it to a smaller copy of itself is called **recursion**. One disk is
the easy case: just move it.

---

## What we tell eyemind

```js
fact(append([], Ys, Ys))
implied_by(append([X, ...Xs], Ys, [X, ...Zs]), append(Xs, Ys, Zs))
// moves(N, From, To, Spare, Moves): one disk moves directly.
fact(moves(1, From, To, _, [move(From, To)]))
implied_by(
  moves(N, From, To, Spare, Moves),
  [
    gt(N, 1),
    is(Smaller, sub(N, 1)),
    moves(Smaller, From, Spare, To, First),
    moves(Smaller, Spare, To, From, Last),
    append(First, [move(From, To), ...Last], Moves),
  ],
)
query(moves(3, 'left', 'right', 'center', Moves))
```

Capitalized names are **variables**: blanks that stand for whatever fits. A
lone `_` is a blank whose value nobody cares about. Lists are written in
square brackets; `[X, ...Xs]` is a list whose first item is `X` and whose
remaining items form the list `Xs`.

- Lines 1 and 2 define `append(A, B, C)`: list `C` is list `A` followed by
  list `B`. Nothing followed by `Ys` is `Ys`; otherwise peel off the first
  item and append the rest.
- Line 3, a **fact**: one disk moves straight from `From` to `To`, whatever
  the spare peg is.
- Line 4 is a **backward rule**, `implied_by(conclusion, conditions)`: when
  eyemind needs the conclusion, it tries to show all the conditions. It is
  the trick, word for word. If `N` is greater than 1 (`gt`), compute
  `Smaller` = N − 1 (`is` with `sub` does arithmetic), move the smaller stack
  to the spare peg (`First`), move the big disk, move the smaller stack on
  top (`Last`), and glue the moves together with `append`.
- The `query` asks for the moves of three disks from left to right with
  center as the spare.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
moves(3, 'left', 'right', 'center', [move('left', 'right'), move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')])
```

Seven moves, the shortest solution, in three groups:

- left → right, left → center, right → center: *the top two disks step
  aside onto the center peg*;
- **left → right**: *the big disk*;
- center → left, center → right, left → right: *the two disks follow on top
  of it*.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. This is the complete
proof; its lines are long because each one spells out whole move lists:

```js
// Answers: each instance of a query() that holds.
moves(3, 'left', 'right', 'center', [move('left', 'right'), move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')])

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(append([], Ys, Ys)))
clause(2, implied_by(append([X, ...Xs], Ys, [X, ...Zs]), append(Xs, Ys, Zs)))
clause(3, fact(moves(1, From, To, _0, [move(From, To)])))
clause(4, implied_by(moves(N, From, To, Spare, Moves), [gt(N, 1), is(Smaller, sub(N, 1)), moves(Smaller, From, Spare, To, First), moves(Smaller, Spare, To, From, Last), append(First, [move(From, To), ...Last], Moves)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(moves(3, 'left', 'right', 'center', [move('left', 'right'), move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')]), clause(4), {N: 3, From: 'left', To: 'right', Spare: 'center', Moves: [move('left', 'right'), move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], Smaller: 2, First: [move('left', 'right'), move('left', 'center'), move('right', 'center')], Last: [move('center', 'left'), move('center', 'right'), move('left', 'right')]}, [gt(3, 1), is(2, sub(3, 1)), moves(2, 'left', 'center', 'right', [move('left', 'right'), move('left', 'center'), move('right', 'center')]), moves(2, 'center', 'right', 'left', [move('center', 'left'), move('center', 'right'), move('left', 'right')]), append([move('left', 'right'), move('left', 'center'), move('right', 'center')], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], [move('left', 'right'), move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')])])
step(gt(3, 1), 'builtin', {}, [])
step(is(2, sub(3, 1)), 'builtin', {}, [])
step(moves(2, 'left', 'center', 'right', [move('left', 'right'), move('left', 'center'), move('right', 'center')]), clause(4), {N: 2, From: 'left', To: 'center', Spare: 'right', Moves: [move('left', 'right'), move('left', 'center'), move('right', 'center')], Smaller: 1, First: [move('left', 'right')], Last: [move('right', 'center')]}, [gt(2, 1), is(1, sub(2, 1)), moves(1, 'left', 'right', 'center', [move('left', 'right')]), moves(1, 'right', 'center', 'left', [move('right', 'center')]), append([move('left', 'right')], [move('left', 'center'), move('right', 'center')], [move('left', 'right'), move('left', 'center'), move('right', 'center')])])
step(gt(2, 1), 'builtin', {}, [])
step(is(1, sub(2, 1)), 'builtin', {}, [])
step(moves(1, 'left', 'right', 'center', [move('left', 'right')]), clause(3), {From: 'left', To: 'right', _0: 'center'}, [])
step(moves(1, 'right', 'center', 'left', [move('right', 'center')]), clause(3), {From: 'right', To: 'center', _0: 'left'}, [])
step(append([move('left', 'right')], [move('left', 'center'), move('right', 'center')], [move('left', 'right'), move('left', 'center'), move('right', 'center')]), clause(2), {X: move('left', 'right'), Xs: [], Ys: [move('left', 'center'), move('right', 'center')], Zs: [move('left', 'center'), move('right', 'center')]}, [append([], [move('left', 'center'), move('right', 'center')], [move('left', 'center'), move('right', 'center')])])
step(append([], [move('left', 'center'), move('right', 'center')], [move('left', 'center'), move('right', 'center')]), clause(1), {Ys: [move('left', 'center'), move('right', 'center')]}, [])
step(moves(2, 'center', 'right', 'left', [move('center', 'left'), move('center', 'right'), move('left', 'right')]), clause(4), {N: 2, From: 'center', To: 'right', Spare: 'left', Moves: [move('center', 'left'), move('center', 'right'), move('left', 'right')], Smaller: 1, First: [move('center', 'left')], Last: [move('left', 'right')]}, [gt(2, 1), is(1, sub(2, 1)), moves(1, 'center', 'left', 'right', [move('center', 'left')]), moves(1, 'left', 'right', 'center', [move('left', 'right')]), append([move('center', 'left')], [move('center', 'right'), move('left', 'right')], [move('center', 'left'), move('center', 'right'), move('left', 'right')])])
step(moves(1, 'center', 'left', 'right', [move('center', 'left')]), clause(3), {From: 'center', To: 'left', _0: 'right'}, [])
step(append([move('center', 'left')], [move('center', 'right'), move('left', 'right')], [move('center', 'left'), move('center', 'right'), move('left', 'right')]), clause(2), {X: move('center', 'left'), Xs: [], Ys: [move('center', 'right'), move('left', 'right')], Zs: [move('center', 'right'), move('left', 'right')]}, [append([], [move('center', 'right'), move('left', 'right')], [move('center', 'right'), move('left', 'right')])])
step(append([], [move('center', 'right'), move('left', 'right')], [move('center', 'right'), move('left', 'right')]), clause(1), {Ys: [move('center', 'right'), move('left', 'right')]}, [])
step(append([move('left', 'right'), move('left', 'center'), move('right', 'center')], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], [move('left', 'right'), move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')]), clause(2), {X: move('left', 'right'), Xs: [move('left', 'center'), move('right', 'center')], Ys: [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], Zs: [move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')]}, [append([move('left', 'center'), move('right', 'center')], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], [move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')])])
step(append([move('left', 'center'), move('right', 'center')], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], [move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')]), clause(2), {X: move('left', 'center'), Xs: [move('right', 'center')], Ys: [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], Zs: [move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')]}, [append([move('right', 'center')], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], [move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')])])
step(append([move('right', 'center')], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], [move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')]), clause(2), {X: move('right', 'center'), Xs: [], Ys: [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], Zs: [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')]}, [append([], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')])])
step(append([], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')]), clause(1), {Ys: [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')]}, [])
```

It has three parts:

- **The claim**: the seven-move answer.
- **The clauses**: the four program lines, numbered as above. The `_` of
  line 3 is shown as `_0`, so that a step can name it.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *Three disks go left → right in the seven moves*: by rule 4 with `N` = 3,
   `Smaller` = 2, `First` = the first three moves and `Last` = the last
   three, using steps 2, 3, 4, 11 and 15.
2. *3 is greater than 1*: justified as `'builtin'`, a calculation the
   checker does again itself.
3. *2 is 3 − 1*: `'builtin'`.
4. *Two disks go left → center in three moves* (left → right,
   left → center, right → center): by rule 4 with `N` = 2 and `Smaller` = 1.
5. *2 is greater than 1*: `'builtin'`.
6. *1 is 2 − 1*: `'builtin'`.
7. *One disk goes left → right*: fact 3, with the spare `_0` = center.
8. *One disk goes right → center*: fact 3, with `_0` = left.
9. *Gluing [left → right] before [left → center, right → center] gives the
   three moves*: rule 2 peels off the first move, using step 10.
10. *Nothing before a list is that list*: fact 1.
11. *Two disks go center → right in three moves* (center → left,
    center → right, left → right): by rule 4; it reuses steps 5, 6 and 7.
12. *One disk goes center → left*: fact 3, with `_0` = right.
13. *Gluing [center → left] before the other two moves*: rule 2, using
    step 14.
14. *Nothing before a list is that list*: fact 1.
15. *Gluing the first three moves before the big move and the last three
    gives all seven*: rule 2 peels off the first move, using step 16.
16. Rule 2 peels off the second move, using step 17.
17. Rule 2 peels off the third move, using step 18.
18. *Nothing before the last four moves is those four moves*: fact 1.

Each big move list is justified by smaller ones, down to single-disk moves
and the gluing of lists.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
moves(3, 'left', 'right', 'center', [move('left', 'right'), move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 14)
condition('C2', 'well_founded', 'ok', 18)
condition('C3', 'justification', 'ok', 18)
condition('C4', 'coverage', 'ok', 21)
condition('C5', 're_decision', 'ok', 4)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 19)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(18)
verified(14)
recomputed(4)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (14)**: the 14 steps that cite a program line really are
  instances of it with the values shown. Step 1, for instance, is rule 4
  with `N` = 3, `From` = left, `To` = right, `Spare` = center.
- **C2 well-founded (18)**: none of the 18 steps depends on itself, even
  indirectly: three disks rest on two, two on one.
- **C3 justification (18)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (21)**: the 1 answer and the 20 things the steps use are each
  backed by a step.
- **C5 re-decision (4)**: the 4 calculations, 3 > 1, 3 − 1 = 2, 2 > 1 and
  2 − 1 = 1, were done again by the checker and agreed.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (19)**: the 1 answer answers the question, and all 18 steps
  serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 18 steps, 14 verified against the program and 4
recomputed, none taken on trust, for 1 claim. The verdict is **checked**: the
seven moves follow from the program's rules. The check confirms this
solution follows the rules as written; it does not by itself show that no
shorter solution exists. That is a known fact about the puzzle
(2 × 2 × 2 − 1 = 7 moves for three disks), not something this proof
establishes.

---

## Try it

```sh
eyemind examples/hanoi.js            # the answers
eyemind --proof examples/hanoi.js    # answers with their proof
eyemind --goal "moves(2, 'left', 'right', 'center', Moves)" examples/hanoi.js
```

The last asks for two disks: three moves, left → center, left → right,
center → right. Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=hanoi).

Change the `3` in the query to `4`: the answer grows to 15 moves, and the
proof to 37 steps.

---

## Takeaway

A recursive idea — "solve the smaller puzzle, twice" — becomes a proof with
the same shape: each big move list is justified by smaller ones, down to
single disks that anyone can check by eye.
