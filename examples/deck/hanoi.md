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

// Certificate: the derived facts and every answer of each call the questions make.
called(moves(3, 'left', 'right', 'center', A), [moves(3, 'left', 'right', 'center', [move('left', 'right'), move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')])])
called(moves(2, 'left', 'center', 'right', B), [moves(2, 'left', 'center', 'right', [move('left', 'right'), move('left', 'center'), move('right', 'center')])])
called(moves(1, 'left', 'right', 'center', C), [moves(1, 'left', 'right', 'center', [move('left', 'right')])])
called(moves(1, 'right', 'center', 'left', D), [moves(1, 'right', 'center', 'left', [move('right', 'center')])])
called(append([move('left', 'right')], [move('left', 'center'), move('right', 'center')], E), [append([move('left', 'right')], [move('left', 'center'), move('right', 'center')], [move('left', 'right'), move('left', 'center'), move('right', 'center')])])
called(append([], [move('left', 'center'), move('right', 'center')], F), [append([], [move('left', 'center'), move('right', 'center')], [move('left', 'center'), move('right', 'center')])])
called(moves(2, 'center', 'right', 'left', G), [moves(2, 'center', 'right', 'left', [move('center', 'left'), move('center', 'right'), move('left', 'right')])])
called(moves(1, 'center', 'left', 'right', H), [moves(1, 'center', 'left', 'right', [move('center', 'left')])])
called(append([move('center', 'left')], [move('center', 'right'), move('left', 'right')], I), [append([move('center', 'left')], [move('center', 'right'), move('left', 'right')], [move('center', 'left'), move('center', 'right'), move('left', 'right')])])
called(append([], [move('center', 'right'), move('left', 'right')], J), [append([], [move('center', 'right'), move('left', 'right')], [move('center', 'right'), move('left', 'right')])])
called(append([move('left', 'right'), move('left', 'center'), move('right', 'center')], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], K), [append([move('left', 'right'), move('left', 'center'), move('right', 'center')], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], [move('left', 'right'), move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')])])
called(append([move('left', 'center'), move('right', 'center')], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], L), [append([move('left', 'center'), move('right', 'center')], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], [move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')])])
called(append([move('right', 'center')], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], M), [append([move('right', 'center')], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], [move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')])])
called(append([], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], N), [append([], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')], [move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')])])
```

It has two parts:

- **The claim**: the seven-move answer.
- **The certificate**: one **call table** per question the search asked.
  `called(Call, Answers)` says: *this call has exactly these answers*. The
  capital letters `A` to `N` are the unknowns still open when each call was
  made. Every rule here is a backward rule, worked out only when asked, so
  the proof needs no `step(...)` records: the tables say it all.

Read the tables as sentences:

1. *Moving three disks left → right has exactly one answer, the seven
   moves.* Rule 4 asks for two smaller puzzles and one gluing.
2. *Two disks go left → center in three moves* (left → right,
   left → center, right → center).
3. *One disk goes left → right* and 4. *one disk goes right → center*: the
   fact for a single disk.
5. *Gluing [left → right] before [left → center, right → center] gives the
   three moves*, and 6. *nothing before a list is that list*.
7. *Two disks go center → right in three moves* (center → left,
   center → right, left → right). Its single-disk move left → right was
   already asked in table 3, so it is not asked again.
8. *One disk goes center → left*, and 9.–10. the gluing of
   [center → left] before the other two moves.
11. –14. *Gluing the first three moves before the big move and the last
    three gives all seven*, peeling off one move per table until nothing
    is left in front.

Each big move list rests on smaller ones, down to single-disk moves and the
gluing of lists. The comparisons and subtractions in between (3 > 1,
3 − 1 = 2, …) are not written down: the checker computes them itself.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the question
by applying the program's rules one level at a time, taking every inner
call's answers from its table and redoing every calculation, and it checks
each table it consults the same way, so a wrong table shows up as a
disagreement. A table the check does not use fails it too. This is the
complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
moves(3, 'left', 'right', 'center', [move('left', 'right'), move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')])

verdict('checked')
```

The verdict is **checked**: the seven moves follow from the program's rules,
and they are every answer of the question. The check confirms this solution
follows the rules as written; it does not by itself show that no shorter
solution exists. That is a known fact about the puzzle
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
