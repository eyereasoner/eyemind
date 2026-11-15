# Deep Taxonomy 100000

*A hundred thousand steps of reasoning, every one written down and checked.*

[deep-taxonomy-100000.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-100000.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/deep-taxonomy-100000.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-100000.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/deep-taxonomy-100000.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=deep-taxonomy-100000)

---

## The question

A *taxonomy* is a tree of categories: a robin is a bird, a bird is an animal,
and so on. Here the tree is a hundred thousand levels deep, and at every
level it also splits into two side branches that go nowhere.

We know one thing: an individual, `'ind'`, is in the top category `'n0'`.
Can the computer follow all hundred thousand levels, show every step, and
have them checked?

**Is `'ind'` in category `'n100000'`, at the very bottom?**

---

## A benchmark, at five sizes

This is the *deep-taxonomy benchmark*, a standard stress test for reasoners.
The collection has it at five depths, and this is the largest:

| Example | Levels | Call tables |
| --- | --- | --- |
| deep-taxonomy-10 | 10 | 11 |
| deep-taxonomy-100 | 100 | 101 |
| deep-taxonomy-1000 | 1000 | 1001 |
| deep-taxonomy-10000 | 10000 | 10001 |
| **deep-taxonomy-100000** | **100000** | **100001** |

Same shape each time; only the length of the chain changes.

---

## What we tell eyemind

One fact, then three rules per level: 300,000 rules in all. Listed one by
one they would make a program of several megabytes, so a loop states them:

```js
fact(type('ind', 'n0'))
for (let level = 1; level <= 100000; level++) {
  implied_by(type(X, `n${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `i${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `j${level}`), type(X, `n${level - 1}`))
}
query(type(X, 'n100000'))
```

- `fact(type('ind', 'n0'))` says `'ind'` is of type, or in category, `'n0'`.
- `implied_by(conclusion, premise)` is a backward rule, used on demand. `X`
  is a variable, a placeholder for anything. So
  `implied_by(type(X, 'n2'), type(X, 'n1'))` reads *anything in n1 is also in
  n2*.
- The program is JavaScript, so it can compute its own rules: the `for` loop
  counts `level` from 1 to 100000, and `` `n${level}` `` spells the category
  name, such as `'n2'`. The loop states exactly the same rules a long list
  would, in the same order. The `i` and `j` rules are the dead-end side
  branches.
- `query(...)` asks for everything in `'n100000'`.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
type('ind', 'n100000')
```

One answer: yes. eyemind works backward from the question: to be in
`n100000`, be in `n99999`; to be in `n99999`, be in `n99998`; and so on, all
the way up to the fact we gave. The search runs as an explicit machine inside
eyemind rather than as nested function calls, so a hundred thousand levels
deep is no problem.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. The whole proof is
about 5.4 MB: the claim and 100,001 call tables; see the
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-100000.js).
Here are its opening comment and claim, and the beginning and end of its
certificate:

```js
// Answers: each instance of a query() that holds.
type('ind', 'n100000')

// Certificate: the derived facts and every answer of each call the questions make.
called(type(A, 'n100000'), [type('ind', 'n100000')])
called(type(B, 'n99999'), [type('ind', 'n99999')])
called(type(C, 'n99998'), [type('ind', 'n99998')])
called(type(D, 'n99997'), [type('ind', 'n99997')])
// … 99,993 more tables, one per level, from n99996 down to n4
called(type(B3846, 'n3'), [type('ind', 'n3')])
called(type(C3846, 'n2'), [type('ind', 'n2')])
called(type(D3846, 'n1'), [type('ind', 'n1')])
called(type(E3846, 'n0'), [type('ind', 'n0')])
```

The excerpt has two parts:

- **The claim**: the one answer.
- **The certificate**: one **call table** per question asked along the way,
  beginning with the original question before `X` is bound.
  `called(Call, Answers)` says: *this call has exactly these answers*. The
  variable in each call (`A`, `B`, …, `E3846`) is the unknown still open
  when the call was made.

A proof can also hold `step(...)` records, for facts that forward rules
derive. Every rule here is a backward rule, worked out only when asked, so
this proof has none.

Read the tables as sentences:

1. *Who is in `'n100000'`? Exactly `'ind'`.* Rule 299999 asks this of
   `'n99999'`.
2. *Who is in `'n99999'`? Exactly `'ind'`.* Rule 299996 asks this of
   `'n99998'`.
3. … one table per level, each resting on the one after it …
4. *Who is in `'n1'`? Exactly `'ind'`.* Rule 2 asks this of `'n0'`.
5. *Who is in `'n0'`? Exactly `'ind'`*: fact 1.

That is 100,000 tables for the rule levels and 1 for the fact: 100,001 in
all. The 200,000 side-branch rules (`i` and `j`) lead to no table: their
heads are `i` and `j` categories, so they cannot add answers to an `n` call.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the original
question by applying the program's rules one level at a time, taking the
answer of every inner call from its table, and checks each of the 100,001
tables it consults the same way, against the source rules and the table of
the next level, down to the fact. A wrong or missing table shows up as a
disagreement, and a table the check does not use fails it too. This is the
complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
type('ind', 'n100000')

verdict('checked')
```

The verdict is **checked**: `'ind'` is in `'n100000'`, and it is every
answer of the original question. The program is a few lines; its proof
records each call table the answer rests on.

---

## Try it

```sh
eyemind examples/deep-taxonomy-100000.js            # the answer
eyemind --stats examples/deep-taxonomy-100000.js    # and its cost
```

`--stats` reports `"inferences":100001`: one step per level, plus the fact.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=deep-taxonomy-100000).

Change the last line to `query(type(X, 'j50000'))` and run with `--stats`
again: the answer is `type('ind', 'j50000')`, a side branch halfway down,
reached in 50001 steps.

---

## Takeaway

From ten levels to a hundred thousand, only the cost grows, in step with the
depth, and the answer stays just as followable and just as checkable. And
because the program is JavaScript, a rule set this large can be stated in a
few lines.
