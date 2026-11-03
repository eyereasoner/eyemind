# Tower of Hanoi

*A classic puzzle solved by thinking smaller — with every move accounted for.*

[hanoi.js](https://github.com/eyereasoner/eyemind/blob/main/examples/hanoi.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/hanoi.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/hanoi.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/hanoi.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=hanoi)

---

## The question

Three pegs: left, center, right. On the left peg sit three disks, largest
at the bottom. Move them all to the right peg. The rules:

- move one disk at a time;
- never put a bigger disk on a smaller one.

**Which moves solve it?** And can the computer show why that sequence is
right?

---

## The trick: think smaller

To move a stack of N disks from one peg to another:

1. move the top N−1 disks out of the way, onto the spare peg;
2. move the biggest disk to its target;
3. move the N−1 disks from the spare peg on top of it.

Moving N−1 disks is the same puzzle, only smaller. Solving a problem by
reducing it to a smaller copy of itself is called *recursion*. One disk is
the easy case: just move it.

---

## What we tell eyemind

```js
// … two lines defining append
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

The `moves(N, …)` rule is the trick, word for word: the smaller stack goes to the
spare peg (`First`), the big disk moves, the smaller stack follows
(`Last`). `append` glues the move lists
together.

---

## What eyemind concludes

```js
moves(3, 'left', 'right', 'center', [move('left', 'right'), move('left', 'center'), move('right', 'center'), move('left', 'right'), move('center', 'left'), move('center', 'right'), move('left', 'right')])
```

Seven moves, the shortest solution, in three groups:

- left → right, left → center, right → center — *the top two disks step aside*
- **left → right** — *the big disk*
- center → left, center → right, left → right — *the two disks follow*

---

## Why: the proof in plain words

The proof follows the trick down to single disks:

1. 3 > 1, and 3 − 1 = 2 — *built-in calculations*.
2. Two disks left → center: left → right, left → center, right → center —
   *rule 4*, itself built from two one-disk moves (*fact 3*).
3. Two disks center → right: center → left, center → right, left → right —
   *rule 4* again.
4. Glue: first three moves, the big move, last three — *rules 1 and 2*.
5. So the full seven-move list solves three disks — *rule 4*.

---

## Checked, not just claimed

A separate checker read the proof's 18 steps against the program:

- **14** steps are exact instances of the program lines they cite;
- **4** calculations (like 3 > 1 and 3 − 1 = 2) were **recomputed** and
  agreed;
- no circular reasoning, and every step serves the answer.

Verdict: **checked**. Nothing taken on trust.

---

## Try it

```sh
eyemind examples/hanoi.js            # the answers
eyemind --proof examples/hanoi.js    # answers with their proof
eyemind --goal "moves(2, 'left', 'right', 'center', Moves)" examples/hanoi.js
```

The last asks for two disks: three moves, left → center, left → right,
center → right. Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=hanoi).

Change the `3` in the last line to `4`: the answer grows to 15 moves.

---

## Takeaway

A recursive idea — "solve the smaller puzzle, twice" — becomes a proof with
the same shape: each big move list is justified by smaller ones, down to
single disks that anyone can check by eye.
