# A Turing Machine

*The simplest model of a computer, adding one to a binary number, step by step.*

[turing.js](https://github.com/eyereasoner/eyemind/blob/main/examples/turing.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/turing.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/turing.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/turing.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=turing)

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
105 lines and 98 call tables
([proof/turing.js](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/turing.js)).
Here are its claims and the complete set of tables for the first claim,
101001 + 1:

```js
// Answers: each instance of a query() that holds.
compute([1, 0, 1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])
compute([1, 0, 1, 1, 1, 1], [1, 1, 0, 0, 0, 0, '#'])
compute([1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, '#'])
compute([], [1, '#'])

// Certificate: the derived facts and every answer of each call the questions make.
called(compute([1, 0, 1, 0, 0, 1], _0), [compute([1, 0, 1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])])
called(find(0, [], 1, [0, 1, 0, 0, 1], B), [find(0, [], 1, [0, 1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])])
called(struct('continue', 0, [1], 0, [1, 0, 0, 1], C), [struct('continue', 0, [1], 0, [1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])])
called(find(0, [1], 0, [1, 0, 0, 1], D), [find(0, [1], 0, [1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])])
called(struct('continue', 0, [0, 1], 1, [0, 0, 1], E), [struct('continue', 0, [0, 1], 1, [0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])])
called(find(0, [0, 1], 1, [0, 0, 1], F), [find(0, [0, 1], 1, [0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])])
called(struct('continue', 0, [1, 0, 1], 0, [0, 1], G), [struct('continue', 0, [1, 0, 1], 0, [0, 1], [1, 0, 1, 0, 1, 0, '#'])])
called(find(0, [1, 0, 1], 0, [0, 1], H), [find(0, [1, 0, 1], 0, [0, 1], [1, 0, 1, 0, 1, 0, '#'])])
called(struct('continue', 0, [0, 1, 0, 1], 0, [1], I), [struct('continue', 0, [0, 1, 0, 1], 0, [1], [1, 0, 1, 0, 1, 0, '#'])])
called(find(0, [0, 1, 0, 1], 0, [1], J), [find(0, [0, 1, 0, 1], 0, [1], [1, 0, 1, 0, 1, 0, '#'])])
called(struct('continue', 0, [0, 0, 1, 0, 1], 1, [], K), [struct('continue', 0, [0, 0, 1, 0, 1], 1, [], [1, 0, 1, 0, 1, 0, '#'])])
called(find(0, [0, 0, 1, 0, 1], 1, [], L), [find(0, [0, 0, 1, 0, 1], 1, [], [1, 0, 1, 0, 1, 0, '#'])])
called(struct('continue', 0, [1, 0, 0, 1, 0, 1], '#', [], M), [struct('continue', 0, [1, 0, 0, 1, 0, 1], '#', [], [1, 0, 1, 0, 1, 0, '#'])])
called(find(0, [1, 0, 0, 1, 0, 1], '#', [], N), [find(0, [1, 0, 0, 1, 0, 1], '#', [], [1, 0, 1, 0, 1, 0, '#'])])
called(struct('continue', 1, [0, 0, 1, 0, 1], 1, ['#'], O), [struct('continue', 1, [0, 0, 1, 0, 1], 1, ['#'], [1, 0, 1, 0, 1, 0, '#'])])
called(find(1, [0, 0, 1, 0, 1], 1, ['#'], P), [find(1, [0, 0, 1, 0, 1], 1, ['#'], [1, 0, 1, 0, 1, 0, '#'])])
called(struct('continue', 1, [0, 1, 0, 1], 0, [0, '#'], Q), [struct('continue', 1, [0, 1, 0, 1], 0, [0, '#'], [1, 0, 1, 0, 1, 0, '#'])])
called(find(1, [0, 1, 0, 1], 0, [0, '#'], R), [find(1, [0, 1, 0, 1], 0, [0, '#'], [1, 0, 1, 0, 1, 0, '#'])])
called(struct('continue', 'halt', [0, 1, 0, 1], 1, [0, '#'], S), [struct('continue', 'halt', [0, 1, 0, 1], 1, [0, '#'], [1, 0, 1, 0, 1, 0, '#'])])
called(reverse([0, 1, 0, 1], T), [reverse([0, 1, 0, 1], [1, 0, 1, 0])])
called(reverse([0, 1, 0, 1], [], U), [reverse([0, 1, 0, 1], [], [1, 0, 1, 0])])
called(reverse([1, 0, 1], [0], V), [reverse([1, 0, 1], [0], [1, 0, 1, 0])])
called(reverse([0, 1], [1, 0], W), [reverse([0, 1], [1, 0], [1, 0, 1, 0])])
called(reverse([1], [0, 1, 0], X), [reverse([1], [0, 1, 0], [1, 0, 1, 0])])
called(reverse([], [1, 0, 1, 0], Y), [reverse([], [1, 0, 1, 0], [1, 0, 1, 0])])
called(append([1, 0, 1, 0], [1, 0, '#'], Z), [append([1, 0, 1, 0], [1, 0, '#'], [1, 0, 1, 0, 1, 0, '#'])])
called(append([0, 1, 0], [1, 0, '#'], A1), [append([0, 1, 0], [1, 0, '#'], [0, 1, 0, 1, 0, '#'])])
called(append([1, 0], [1, 0, '#'], B1), [append([1, 0], [1, 0, '#'], [1, 0, 1, 0, '#'])])
called(append([0], [1, 0, '#'], C1), [append([0], [1, 0, '#'], [0, 1, 0, '#'])])
called(append([], [1, 0, '#'], D1), [append([], [1, 0, '#'], [1, 0, '#'])])
// … 68 more called lines for the other three runs (98 in all)
```

It has two parts:

- **The claims**: the four answers the proof is about.
- **The certificate**: one *call table* per call the four questions make,
  each written `called(call, answers)` with every answer of that call, in
  the order the calls were first met. The table's own variables, such as `B`
  or `_0`, stand for the parts the call left open.

The whole interpreter works backwards, so no forward rule derives a fact:
the proof needs no steps and no listings. Clauses are numbered by their
place in the program: the interpreter rules (1–15) and the machine
(16–22).

Read the tables as the machine's moves. The tape is shown with the head's
cell in brackets:

1. *Running on 101001 gives 101010 and a blank* — the question
   `compute([1, 0, 1, 0, 0, 1], _)` has exactly that one answer. Rule 2
   starts the machine in state 0 (fact 16) on the first cell.
2. **[1]01001, state 0** — the `find(0, [], 1, …)` table: instruction 18
   (read 1: write 1, go right) and fact 10 move the head right, and the
   `struct('continue', 0, …)` table continues, since state 0 is not
   `'halt'`.
3. **1[0]1001, 10[1]001, 101[0]01, 1010[0]1, 10100[1]** — one `find` and one
   `struct` table per move, using instruction 17 for a 0 and 18 for a 1.
4. **101001[#]** — moving right off the end of the tape reaches a fresh blank
   (fact 9).
5. **At the blank, state 0** — instruction 19: write blank, go left, switch
   to state 1. Fact 7 moves left; rule 5 continues because state 1 is not
   `'halt'` either.
6. **10100[1]#, state 1** — instruction 21: read 1, write 0, go left: the
   carry.
7. **1010[0]0#, state 1** — instruction 20: read 0, write 1, stay, and halt
   (fact 8 for staying).
8. *Halt* — the `struct('continue', 'halt', …)` table: rule 4 puts the tape
   back together. The `reverse` tables turn the left part, stored as 0101,
   into 1010, and the `append` tables join it to the cell and the rest,
   1 0 #, giving 1 0 1 0 1 0 #.

Each table has exactly one answer: the machine is deterministic.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms each table in one procedure. It expands the call
one level against the program, as a search would, with inner calls answered
from their own tables and the machine's instructions and moves from its
facts, and requires the result to equal the table. So for every move it
looks up the instruction and the `move` fact itself, and it decides
"state 0 is not `'halt'`" itself. No table can vouch for itself through a
cycle, so every run really halts. Then the claims must be exactly the
answers of the four questions, and every table must have been used. This is
the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
compute([1, 0, 1, 0, 0, 1], [1, 0, 1, 0, 1, 0, '#'])
compute([1, 0, 1, 1, 1, 1], [1, 1, 0, 0, 0, 0, '#'])
compute([1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, '#'])
compute([], [1, '#'])

verdict('checked')
```

The verdict is **checked**: all four runs follow from the program, and they
are every answer of the original questions.

---

## Try it

```sh
eyemind examples/turing.js            # the answers
eyemind --proof examples/turing.js    # answers with their proof
eyemind -c examples/turing.js
eyemind --check-proof examples/proof/turing.js examples/turing.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=turing).

- Add `query(compute([1, 0, 1, 1], _))` and run again: you get
  `compute([1, 0, 1, 1], [1, 1, 0, 0, '#'])`, that is 11 + 1 = 12.
- Delete the instruction `t([1, '#', 1, 's'], 'halt')`: 111111 and the empty
  tape now get no answer, because the carry runs off the left end onto a
  blank and the machine has no instruction for it. The first two answers stay.

---

## Takeaway

A Turing machine is computation at its barest. With a proof, every tick of
it becomes something you can read, replay and check.
