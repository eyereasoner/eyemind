# A Turing Machine

*The simplest model of a computer, adding one to a binary number, step by step.*

[turing.js](https://github.com/eyereasoner/eyemind/blob/main/examples/turing.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/turing.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/turing.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/turing.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=turing)

---

## The question

In 1936 Alan Turing described an imaginary machine: a long tape of cells, a
head that reads and writes one cell at a time and moves left or right, and
a small table of instructions. Anything a modern computer can calculate,
such a machine can calculate too.

Here the machine adds one to a **binary** number (written with only 0 and 1).
In binary, 101001 is 41, so the answer should be 42, written 101010.

**What is 101001 + 1? And can we watch every move of the machine?**

---

## What we tell eyemind: the machine

```js
// t([State, Read, Write, Move], NextState). State 0 scans right over the
// digits; state 1 adds one: a 1 becomes 0 and the carry moves left, a 0 or a
// blank becomes 1 and the machine halts.
fact(start('add1', 0))
fact(t([0, 0, 0, 'r'], 0))
fact(t([0, 1, 1, 'r'], 0))
fact(t([0, '#', '#', 'l'], 1))
fact(t([1, 0, 1, 's'], 'halt'))
fact(t([1, 1, 0, 'l'], 1))
fact(t([1, '#', 1, 's'], 'halt'))

query(compute([1, 0, 1, 0, 0, 1], _))
// … three more questions
```

`fact(...)` states something true outright. Each `t` line is one instruction:
*in state S, seeing symbol X, write Y, move (l)eft, (r)ight or (s)tay, and go
to the next state.* `'#'` is a blank cell. `start('add1', 0)` says the machine
called add1 starts in state 0.

State 0 runs right to the end of the number. State 1 walks back, turning
1s into 0s until it can turn a 0 (or a blank) into a 1: the carry, exactly as
in adding one by hand.

`query(compute([1, 0, 1, 0, 0, 1], _))` asks: run the machine on the tape
1 0 1 0 0 1; what tape comes out? The `_` marks the answer to fill in.

---

## What we tell eyemind: the interpreter

```js
// One step: look up the transition, write and move, then continue.
implied_by(
  find(State, Left, Cell, Right, OutTape),
  [
    t([State, Cell, Write, Move], Next),
    move(Move, Left, Write, Right, A, B, C),
    struct('continue', Next, A, B, C, OutTape),
  ],
)

// In state halt, put the tape back together; in any other state, take
// another step.
implied_by(
  struct('continue', 'halt', Left, Cell, Right, OutTape),
  [reverse(Left, R), append(R, [Cell, ...Right], OutTape)],
)
implied_by(
  struct('continue', State, Left, Cell, Right, OutTape),
  [not_unify(State, 'halt'), find(State, Left, Cell, Right, OutTape)],
)
```

An **interpreter** is a program that runs another program. This one looks
up the instruction, moves the head, and repeats until the state is `'halt'`.

`implied_by(conclusion, conditions)` is a **backward rule**: to establish the
conclusion, eyemind establishes each condition in the list, in order.
Capitalized names (`State`, `Left`, `Cell`, …) are variables: placeholders
that get a value as the rule is used.

The tape is held in three parts: `Left`, the cells to the left of the head
(in reverse order, nearest first), `Cell`, the cell under the head, and
`Right`, the cells to the right. `[Cell, ...Right]` is the list whose first
element is `Cell`, followed by the elements of `Right`.

- `find` takes one step: look up the instruction `t`, then `move` the head.
  Five `move` facts (not shown) describe moving left, right or staying;
  moving off either end of the tape reaches a fresh blank cell.
- `struct('continue', ...)` decides what happens next. (`continue` is a
  reserved word in JavaScript, so the step is written with `struct`.) In
  state `'halt'`, `reverse` and `append` (not shown) put the tape back
  together in reading order. In any other state, it takes another step.
  `not_unify(State, 'halt')` means "the state is not `'halt'`".
- `compute` (not shown) starts the machine in its start state with the head
  on the first cell.

These interpreter rules work for any instruction table, not just this one.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
compute([1, 0, 1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])
compute([1, 0, 1, 1, 1, 1], [1, 1, 0, 0, 0, 0, '#'])
compute([1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, '#'])
compute([], [1, '#'])
```

In everyday numbers: 41 + 1 = 42, 47 + 1 = 48, 63 + 1 = 64 (the number
grows a digit), and an empty tape becomes 1. The trailing `'#'` is the blank
cell just past the last digit, which the machine visited; it is not a digit.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The full proof has
176 lines and 144 steps
([proof/turing.js](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/turing.js)).
Here are its claims, all 22 clauses, and the complete chain of steps for the
first claim, 101001 + 1:

```js
// Answers: each instance of a query() that holds.
compute([1, 0, 1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])
compute([1, 0, 1, 1, 1, 1], [1, 1, 0, 0, 0, 0, '#'])
compute([1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, '#'])
compute([], [1, '#'])

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(compute([], OutTape), [start(_0, I), find(I, [], '#', [], OutTape)]))
clause(2, implied_by(compute([Head, ...Tail], OutTape), [start(_0, I), find(I, [], Head, Tail, OutTape)]))
clause(3, implied_by(find(State, Left, Cell, Right, OutTape), [t([State, Cell, Write, Move], Next), move(Move, Left, Write, Right, A, B, C), struct('continue', Next, A, B, C, OutTape)]))
clause(4, implied_by(struct('continue', 'halt', Left, Cell, Right, OutTape), [reverse(Left, R), append(R, [Cell, ...Right], OutTape)]))
clause(5, implied_by(struct('continue', State, Left, Cell, Right, OutTape), [not_unify(State, 'halt'), find(State, Left, Cell, Right, OutTape)]))
clause(6, fact(move('l', [], Cell, Right, [], '#', [Cell, ...Right])))
clause(7, fact(move('l', [Head, ...Tail], Cell, Right, Tail, Head, [Cell, ...Right])))
clause(8, fact(move('s', Left, Cell, Right, Left, Cell, Right)))
clause(9, fact(move('r', Left, Cell, [], [Cell, ...Left], '#', [])))
clause(10, fact(move('r', Left, Cell, [Head, ...Tail], [Cell, ...Left], Head, Tail)))
clause(11, fact(append([], Ys, Ys)))
clause(12, implied_by(append([X, ...Xs], Ys, [X, ...Zs]), append(Xs, Ys, Zs)))
clause(13, implied_by(reverse(Xs, Ys), reverse(Xs, [], Ys)))
clause(14, fact(reverse([], Ys, Ys)))
clause(15, implied_by(reverse([X, ...Xs], Acc, Ys), reverse(Xs, [X, ...Acc], Ys)))
clause(16, fact(start('add1', 0)))
clause(17, fact(t([0, 0, 0, 'r'], 0)))
clause(18, fact(t([0, 1, 1, 'r'], 0)))
clause(19, fact(t([0, '#', '#', 'l'], 1)))
clause(20, fact(t([1, 0, 1, 's'], 'halt')))
clause(21, fact(t([1, 1, 0, 'l'], 1)))
clause(22, fact(t([1, '#', 1, 's'], 'halt')))


// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(compute([1, 0, 1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#']), clause(2), {Head: 1, Tail: [0, 1, 0, 0, 1], OutTape: [1, 0, 1, 0, 1, 0, '#'], _0: 'add1', I: 0}, [start('add1', 0), find(0, [], 1, [0, 1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])])
step(start('add1', 0), clause(16), {}, [])
step(find(0, [], 1, [0, 1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#']), clause(3), {State: 0, Left: [], Cell: 1, Right: [0, 1, 0, 0, 1], OutTape: [1, 0, 1, 0, 1, 0, '#'], Write: 1, Move: 'r', Next: 0, A: [1], B: 0, C: [1, 0, 0, 1]}, [t([0, 1, 1, 'r'], 0), move('r', [], 1, [0, 1, 0, 0, 1], [1], 0, [1, 0, 0, 1]), struct('continue', 0, [1], 0, [1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])])
step(t([0, 1, 1, 'r'], 0), clause(18), {}, [])
step(move('r', [], 1, [0, 1, 0, 0, 1], [1], 0, [1, 0, 0, 1]), clause(10), {Left: [], Cell: 1, Head: 0, Tail: [1, 0, 0, 1]}, [])
step(struct('continue', 0, [1], 0, [1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#']), clause(5), {State: 0, Left: [1], Cell: 0, Right: [1, 0, 0, 1], OutTape: [1, 0, 1, 0, 1, 0, '#']}, [not_unify(0, 'halt'), find(0, [1], 0, [1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])])
step(not_unify(0, 'halt'), 'builtin', {}, [])
step(find(0, [1], 0, [1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#']), clause(3), {State: 0, Left: [1], Cell: 0, Right: [1, 0, 0, 1], OutTape: [1, 0, 1, 0, 1, 0, '#'], Write: 0, Move: 'r', Next: 0, A: [0, 1], B: 1, C: [0, 0, 1]}, [t([0, 0, 0, 'r'], 0), move('r', [1], 0, [1, 0, 0, 1], [0, 1], 1, [0, 0, 1]), struct('continue', 0, [0, 1], 1, [0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])])
step(t([0, 0, 0, 'r'], 0), clause(17), {}, [])
step(move('r', [1], 0, [1, 0, 0, 1], [0, 1], 1, [0, 0, 1]), clause(10), {Left: [1], Cell: 0, Head: 1, Tail: [0, 0, 1]}, [])
step(struct('continue', 0, [0, 1], 1, [0, 0, 1], [1, 0, 1, 0, 1, 0, '#']), clause(5), {State: 0, Left: [0, 1], Cell: 1, Right: [0, 0, 1], OutTape: [1, 0, 1, 0, 1, 0, '#']}, [not_unify(0, 'halt'), find(0, [0, 1], 1, [0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])])
step(find(0, [0, 1], 1, [0, 0, 1], [1, 0, 1, 0, 1, 0, '#']), clause(3), {State: 0, Left: [0, 1], Cell: 1, Right: [0, 0, 1], OutTape: [1, 0, 1, 0, 1, 0, '#'], Write: 1, Move: 'r', Next: 0, A: [1, 0, 1], B: 0, C: [0, 1]}, [t([0, 1, 1, 'r'], 0), move('r', [0, 1], 1, [0, 0, 1], [1, 0, 1], 0, [0, 1]), struct('continue', 0, [1, 0, 1], 0, [0, 1], [1, 0, 1, 0, 1, 0, '#'])])
step(move('r', [0, 1], 1, [0, 0, 1], [1, 0, 1], 0, [0, 1]), clause(10), {Left: [0, 1], Cell: 1, Head: 0, Tail: [0, 1]}, [])
step(struct('continue', 0, [1, 0, 1], 0, [0, 1], [1, 0, 1, 0, 1, 0, '#']), clause(5), {State: 0, Left: [1, 0, 1], Cell: 0, Right: [0, 1], OutTape: [1, 0, 1, 0, 1, 0, '#']}, [not_unify(0, 'halt'), find(0, [1, 0, 1], 0, [0, 1], [1, 0, 1, 0, 1, 0, '#'])])
step(find(0, [1, 0, 1], 0, [0, 1], [1, 0, 1, 0, 1, 0, '#']), clause(3), {State: 0, Left: [1, 0, 1], Cell: 0, Right: [0, 1], OutTape: [1, 0, 1, 0, 1, 0, '#'], Write: 0, Move: 'r', Next: 0, A: [0, 1, 0, 1], B: 0, C: [1]}, [t([0, 0, 0, 'r'], 0), move('r', [1, 0, 1], 0, [0, 1], [0, 1, 0, 1], 0, [1]), struct('continue', 0, [0, 1, 0, 1], 0, [1], [1, 0, 1, 0, 1, 0, '#'])])
step(move('r', [1, 0, 1], 0, [0, 1], [0, 1, 0, 1], 0, [1]), clause(10), {Left: [1, 0, 1], Cell: 0, Head: 0, Tail: [1]}, [])
step(struct('continue', 0, [0, 1, 0, 1], 0, [1], [1, 0, 1, 0, 1, 0, '#']), clause(5), {State: 0, Left: [0, 1, 0, 1], Cell: 0, Right: [1], OutTape: [1, 0, 1, 0, 1, 0, '#']}, [not_unify(0, 'halt'), find(0, [0, 1, 0, 1], 0, [1], [1, 0, 1, 0, 1, 0, '#'])])
step(find(0, [0, 1, 0, 1], 0, [1], [1, 0, 1, 0, 1, 0, '#']), clause(3), {State: 0, Left: [0, 1, 0, 1], Cell: 0, Right: [1], OutTape: [1, 0, 1, 0, 1, 0, '#'], Write: 0, Move: 'r', Next: 0, A: [0, 0, 1, 0, 1], B: 1, C: []}, [t([0, 0, 0, 'r'], 0), move('r', [0, 1, 0, 1], 0, [1], [0, 0, 1, 0, 1], 1, []), struct('continue', 0, [0, 0, 1, 0, 1], 1, [], [1, 0, 1, 0, 1, 0, '#'])])
step(move('r', [0, 1, 0, 1], 0, [1], [0, 0, 1, 0, 1], 1, []), clause(10), {Left: [0, 1, 0, 1], Cell: 0, Head: 1, Tail: []}, [])
step(struct('continue', 0, [0, 0, 1, 0, 1], 1, [], [1, 0, 1, 0, 1, 0, '#']), clause(5), {State: 0, Left: [0, 0, 1, 0, 1], Cell: 1, Right: [], OutTape: [1, 0, 1, 0, 1, 0, '#']}, [not_unify(0, 'halt'), find(0, [0, 0, 1, 0, 1], 1, [], [1, 0, 1, 0, 1, 0, '#'])])
step(find(0, [0, 0, 1, 0, 1], 1, [], [1, 0, 1, 0, 1, 0, '#']), clause(3), {State: 0, Left: [0, 0, 1, 0, 1], Cell: 1, Right: [], OutTape: [1, 0, 1, 0, 1, 0, '#'], Write: 1, Move: 'r', Next: 0, A: [1, 0, 0, 1, 0, 1], B: '#', C: []}, [t([0, 1, 1, 'r'], 0), move('r', [0, 0, 1, 0, 1], 1, [], [1, 0, 0, 1, 0, 1], '#', []), struct('continue', 0, [1, 0, 0, 1, 0, 1], '#', [], [1, 0, 1, 0, 1, 0, '#'])])
step(move('r', [0, 0, 1, 0, 1], 1, [], [1, 0, 0, 1, 0, 1], '#', []), clause(9), {Left: [0, 0, 1, 0, 1], Cell: 1}, [])
step(struct('continue', 0, [1, 0, 0, 1, 0, 1], '#', [], [1, 0, 1, 0, 1, 0, '#']), clause(5), {State: 0, Left: [1, 0, 0, 1, 0, 1], Cell: '#', Right: [], OutTape: [1, 0, 1, 0, 1, 0, '#']}, [not_unify(0, 'halt'), find(0, [1, 0, 0, 1, 0, 1], '#', [], [1, 0, 1, 0, 1, 0, '#'])])
step(find(0, [1, 0, 0, 1, 0, 1], '#', [], [1, 0, 1, 0, 1, 0, '#']), clause(3), {State: 0, Left: [1, 0, 0, 1, 0, 1], Cell: '#', Right: [], OutTape: [1, 0, 1, 0, 1, 0, '#'], Write: '#', Move: 'l', Next: 1, A: [0, 0, 1, 0, 1], B: 1, C: ['#']}, [t([0, '#', '#', 'l'], 1), move('l', [1, 0, 0, 1, 0, 1], '#', [], [0, 0, 1, 0, 1], 1, ['#']), struct('continue', 1, [0, 0, 1, 0, 1], 1, ['#'], [1, 0, 1, 0, 1, 0, '#'])])
step(t([0, '#', '#', 'l'], 1), clause(19), {}, [])
step(move('l', [1, 0, 0, 1, 0, 1], '#', [], [0, 0, 1, 0, 1], 1, ['#']), clause(7), {Head: 1, Tail: [0, 0, 1, 0, 1], Cell: '#', Right: []}, [])
step(struct('continue', 1, [0, 0, 1, 0, 1], 1, ['#'], [1, 0, 1, 0, 1, 0, '#']), clause(5), {State: 1, Left: [0, 0, 1, 0, 1], Cell: 1, Right: ['#'], OutTape: [1, 0, 1, 0, 1, 0, '#']}, [not_unify(1, 'halt'), find(1, [0, 0, 1, 0, 1], 1, ['#'], [1, 0, 1, 0, 1, 0, '#'])])
step(not_unify(1, 'halt'), 'builtin', {}, [])
step(find(1, [0, 0, 1, 0, 1], 1, ['#'], [1, 0, 1, 0, 1, 0, '#']), clause(3), {State: 1, Left: [0, 0, 1, 0, 1], Cell: 1, Right: ['#'], OutTape: [1, 0, 1, 0, 1, 0, '#'], Write: 0, Move: 'l', Next: 1, A: [0, 1, 0, 1], B: 0, C: [0, '#']}, [t([1, 1, 0, 'l'], 1), move('l', [0, 0, 1, 0, 1], 0, ['#'], [0, 1, 0, 1], 0, [0, '#']), struct('continue', 1, [0, 1, 0, 1], 0, [0, '#'], [1, 0, 1, 0, 1, 0, '#'])])
step(t([1, 1, 0, 'l'], 1), clause(21), {}, [])
step(move('l', [0, 0, 1, 0, 1], 0, ['#'], [0, 1, 0, 1], 0, [0, '#']), clause(7), {Head: 0, Tail: [0, 1, 0, 1], Cell: 0, Right: ['#']}, [])
step(struct('continue', 1, [0, 1, 0, 1], 0, [0, '#'], [1, 0, 1, 0, 1, 0, '#']), clause(5), {State: 1, Left: [0, 1, 0, 1], Cell: 0, Right: [0, '#'], OutTape: [1, 0, 1, 0, 1, 0, '#']}, [not_unify(1, 'halt'), find(1, [0, 1, 0, 1], 0, [0, '#'], [1, 0, 1, 0, 1, 0, '#'])])
step(find(1, [0, 1, 0, 1], 0, [0, '#'], [1, 0, 1, 0, 1, 0, '#']), clause(3), {State: 1, Left: [0, 1, 0, 1], Cell: 0, Right: [0, '#'], OutTape: [1, 0, 1, 0, 1, 0, '#'], Write: 1, Move: 's', Next: 'halt', A: [0, 1, 0, 1], B: 1, C: [0, '#']}, [t([1, 0, 1, 's'], 'halt'), move('s', [0, 1, 0, 1], 1, [0, '#'], [0, 1, 0, 1], 1, [0, '#']), struct('continue', 'halt', [0, 1, 0, 1], 1, [0, '#'], [1, 0, 1, 0, 1, 0, '#'])])
step(t([1, 0, 1, 's'], 'halt'), clause(20), {}, [])
step(move('s', [0, 1, 0, 1], 1, [0, '#'], [0, 1, 0, 1], 1, [0, '#']), clause(8), {Left: [0, 1, 0, 1], Cell: 1, Right: [0, '#']}, [])
step(struct('continue', 'halt', [0, 1, 0, 1], 1, [0, '#'], [1, 0, 1, 0, 1, 0, '#']), clause(4), {Left: [0, 1, 0, 1], Cell: 1, Right: [0, '#'], OutTape: [1, 0, 1, 0, 1, 0, '#'], R: [1, 0, 1, 0]}, [reverse([0, 1, 0, 1], [1, 0, 1, 0]), append([1, 0, 1, 0], [1, 0, '#'], [1, 0, 1, 0, 1, 0, '#'])])
step(reverse([0, 1, 0, 1], [1, 0, 1, 0]), clause(13), {Xs: [0, 1, 0, 1], Ys: [1, 0, 1, 0]}, [reverse([0, 1, 0, 1], [], [1, 0, 1, 0])])
step(reverse([0, 1, 0, 1], [], [1, 0, 1, 0]), clause(15), {X: 0, Xs: [1, 0, 1], Acc: [], Ys: [1, 0, 1, 0]}, [reverse([1, 0, 1], [0], [1, 0, 1, 0])])
step(reverse([1, 0, 1], [0], [1, 0, 1, 0]), clause(15), {X: 1, Xs: [0, 1], Acc: [0], Ys: [1, 0, 1, 0]}, [reverse([0, 1], [1, 0], [1, 0, 1, 0])])
step(reverse([0, 1], [1, 0], [1, 0, 1, 0]), clause(15), {X: 0, Xs: [1], Acc: [1, 0], Ys: [1, 0, 1, 0]}, [reverse([1], [0, 1, 0], [1, 0, 1, 0])])
step(reverse([1], [0, 1, 0], [1, 0, 1, 0]), clause(15), {X: 1, Xs: [], Acc: [0, 1, 0], Ys: [1, 0, 1, 0]}, [reverse([], [1, 0, 1, 0], [1, 0, 1, 0])])
step(reverse([], [1, 0, 1, 0], [1, 0, 1, 0]), clause(14), {Ys: [1, 0, 1, 0]}, [])
step(append([1, 0, 1, 0], [1, 0, '#'], [1, 0, 1, 0, 1, 0, '#']), clause(12), {X: 1, Xs: [0, 1, 0], Ys: [1, 0, '#'], Zs: [0, 1, 0, 1, 0, '#']}, [append([0, 1, 0], [1, 0, '#'], [0, 1, 0, 1, 0, '#'])])
step(append([0, 1, 0], [1, 0, '#'], [0, 1, 0, 1, 0, '#']), clause(12), {X: 0, Xs: [1, 0], Ys: [1, 0, '#'], Zs: [1, 0, 1, 0, '#']}, [append([1, 0], [1, 0, '#'], [1, 0, 1, 0, '#'])])
step(append([1, 0], [1, 0, '#'], [1, 0, 1, 0, '#']), clause(12), {X: 1, Xs: [0], Ys: [1, 0, '#'], Zs: [0, 1, 0, '#']}, [append([0], [1, 0, '#'], [0, 1, 0, '#'])])
step(append([0], [1, 0, '#'], [0, 1, 0, '#']), clause(12), {X: 0, Xs: [], Ys: [1, 0, '#'], Zs: [1, 0, '#']}, [append([], [1, 0, '#'], [1, 0, '#'])])
step(append([], [1, 0, '#'], [1, 0, '#']), clause(11), {Ys: [1, 0, '#']}, [])
// … 97 more steps for the other three runs (144 steps in all)
```

It has three parts:

- **The claims**: the four answers the proof is about.
- **The clauses**: the whole program, numbered 1 to 22: the interpreter
  rules (1–15) and the machine (16–22). eyemind writes the "don't care" `_`
  as `_0`.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.

Two kinds of justification occur:

- **`clause(N)`**: the step is an instance of rule or fact N, with the
  variables set to the values shown between `{ }`.
- **`'builtin'`**: a test the checker can redo by itself. Here it is
  `not_unify(0, 'halt')`, "state 0 is not the halt state" (and the same for
  state 1).

Read the chain as the machine's moves. The tape is shown with the head's
cell in brackets:

1. *Running on 101001 gives 101010 and a blank* — by rule 2: the first cell is 1, the
   rest is 01001, and the machine starts in state 0 (fact 16).
2. **[1]01001, state 0** — instruction 18 (read 1: write 1, go right), and
   fact 10 moves the head right. Rule 5 continues, since state 0 is not
   `'halt'` (the builtin test).
3. **1[0]1001, 10[1]001, 101[0]01, 1010[0]1, 10100[1]** — the same, using
   instruction 17 for a 0 and 18 for a 1. Each of these instructions and
   moves is listed once and reused.
4. **101001[#]** — moving right off the end of the tape reaches a fresh blank
   (fact 9).
5. **At the blank, state 0** — instruction 19: write blank, go left, switch
   to state 1. Fact 7 moves left; rule 5 continues because state 1 is not
   `'halt'` either.
6. **10100[1]#, state 1** — instruction 21: read 1, write 0, go left: the
   carry.
7. **1010[0]0#, state 1** — instruction 20: read 0, write 1, stay, and halt
   (fact 8 for staying).
8. *Halt* — rule 4 puts the tape back together: the left part, stored as
   0101, is reversed to 1010 (rule 13, rule 15 four times, fact 14), and
   joined to the cell and the rest, 1 0 #, giving 1 0 1 0 1 0 # (rule 12 four
   times, fact 11).

Every step leans only on other steps of the proof, down to facts and the two
tests.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
compute([1, 0, 1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])
compute([1, 0, 1, 1, 1, 1], [1, 1, 0, 0, 0, 0, '#'])
compute([1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, '#'])
compute([], [1, '#'])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 142)
condition('C2', 'well_founded', 'ok', 144)
condition('C3', 'justification', 'ok', 144)
condition('C4', 'coverage', 'ok', 210)
condition('C5', 're_decision', 'ok', 2)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 148)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(144)
verified(142)
recomputed(2)
composed(0)
trusted(0)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (142)**: each of the 142 steps that cite a rule or fact
  really is an instance of it with the values shown: every move matches an
  instruction in the table and a `move` fact.
- **C2 well-founded (144)**: none of the 144 steps depends on itself, even
  indirectly: every run really halts.
- **C3 justification (144)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (210)**: the 4 claims and the 206 things the steps use are
  each backed by a step: nothing is taken for granted.
- **C5 re-decision (2)**: the checker redid the 2 tests "state 0 is not
  `'halt'`" and "state 1 is not `'halt'`" itself.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (148)**: the 4 claims answer the 4 queries, and all 144
  steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 144 steps, 142 verified against the program, 2
recomputed, none taken on trust. The verdict is **checked**: all four runs
follow from the program. As the last comment says, this confirms the claims;
it does not say the program has no other answers.

---

## Try it

```sh
eyemind examples/turing.js            # the answers
eyemind --proof examples/turing.js    # answers with their proof
eyemind -c examples/turing.js
eyemind --check-proof examples/proof/turing.js examples/turing.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=turing).

- Add `query(compute([1, 0, 1, 1], _))` and run again: you get
  `compute([1, 0, 1, 1], [1, 1, 0, 0, '#'])`, that is 11 + 1 = 12.
- Delete the instruction `t([1, '#', 1, 's'], 'halt')`: 111111 and the empty
  tape now get no answer, because the carry runs off the left end onto a
  blank and the machine has no instruction for it. The first two answers stay.

---

## Takeaway

A Turing machine is computation at its barest. With a proof, every tick of
it becomes something you can read, replay and check.
