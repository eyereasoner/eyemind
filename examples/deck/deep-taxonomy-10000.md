# Deep Taxonomy 10000

*Ten thousand steps of reasoning, every one written down and checked.*

[deep-taxonomy-10000.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-10000.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/deep-taxonomy-10000.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-10000.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/deep-taxonomy-10000.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=deep-taxonomy-10000)

---

## The question

A *taxonomy* is a tree of categories: a robin is a bird, a bird is an
animal, and so on. Here the tree is ten thousand levels deep, and at every
level it also splits into two side branches that go nowhere.

We know one thing: an individual, `'ind'`, is in the top category `'n0'`.

**Is `'ind'` in category `'n10000'`, at the very bottom?** And can the
computer show all ten thousand steps, and have them checked?

---

## A benchmark, at five sizes

This is the *deep-taxonomy benchmark*, a standard stress test for reasoners.
The collection has it at five depths:

| Example | Levels | Call tables |
| --- | --- | --- |
| deep-taxonomy-10 | 10 | 11 |
| deep-taxonomy-100 | 100 | 101 |
| deep-taxonomy-1000 | 1000 | 1001 |
| **deep-taxonomy-10000** | **10000** | **10001** |
| deep-taxonomy-100000 | 100000 | 100001 |

Same shape each time; only the length of the chain changes.

---

## What we tell eyemind

One fact, then three rules per level, 30,000 rules in all, stated by a loop:

```js
fact(type('ind', 'n0'))
for (let level = 1; level <= 10000; level++) {
  implied_by(type(X, `n${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `i${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `j${level}`), type(X, `n${level - 1}`))
}
query(type(X, 'n10000'))
```

`fact(...)` states something true: `'ind'` is of type `'n0'`. A program is a
JavaScript script, so an ordinary `for` loop can state many rules; the
`` `n${level}` `` pieces build the names `'n1'`, `'n2'`, and so on.

`implied_by(head, body)` is a backward rule: *"the head holds if the body
holds"*. `X` is a variable, a placeholder for any individual. So
`implied_by(type(X, 'n2'), type(X, 'n1'))` reads *anything in n1 is also in
n2*. The `i` and `j` rules are the dead-end side branches. `query(...)` asks
the question: *what is of type `'n10000'`?*

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
type('ind', 'n10000')
```

The first line is a comment saying what follows. One answer: yes, `'ind'`
is in `'n10000'`.

eyemind works backward from the question (backward rules are explored only
when a question needs them): to be in `n10000`, be in `n9999`; to be in
`n9999`, be in `n9998`; … all the way up to the fact we gave. The search is
an explicit machine inside eyemind rather than a chain of nested function
calls, so ten thousand levels deep is no problem.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. The proof is about
515 KB: the claim and 10,001 call tables, one per level. Here is its
beginning and its end, with the middle left out; the
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-10000.js)
is linked above.

```js
// Answers: each instance of a query() that holds.
type('ind', 'n10000')

// Certificate: the derived facts and every answer of each call the questions make.
called(type(A, 'n10000'), [type('ind', 'n10000')])
called(type(B, 'n9999'), [type('ind', 'n9999')])
called(type(C, 'n9998'), [type('ind', 'n9998')])
called(type(D, 'n9997'), [type('ind', 'n9997')])
// … tables 5 to 9997: one per level, from n9996 down to n4
called(type(N384, 'n3'), [type('ind', 'n3')])
called(type(O384, 'n2'), [type('ind', 'n2')])
called(type(P384, 'n1'), [type('ind', 'n1')])
called(type(Q384, 'n0'), [type('ind', 'n0')])
```

It has two parts:

- **The claim**: the answer.
- **The certificate**: one **call table** per question asked along the way.
  `called(Call, Answers)` says: *this call has exactly these answers*. The
  variable in each call (`A`, `B`, …, `Q384`) is the unknown still open when
  the call was made. The 20,000 side-branch rules (`i` and `j`) lead to no
  table: no question calls them.

A proof can also hold `step(...)` records, for facts that forward rules
derive. Every rule here is a backward rule, worked out only when asked, so
this proof has none.

Read the tables as sentences:

1. *Who is in `'n10000'`? Exactly `'ind'`.* Rule 29999 asks this of
   `'n9999'`.
2. *Who is in `'n9999'`? Exactly `'ind'`.* Rule 29996 asks this of
   `'n9998'`.
3. … one table per level, each call made by the rule three clause numbers
   higher …
4. *Who is in `'n1'`? Exactly `'ind'`.* Rule 2 asks this of `'n0'`.
5. *Who is in `'n0'`? Exactly `'ind'`*: fact 1.

Every table rests only on the one listed right below it, down to the fact.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the query by
applying the program's rules one level at a time, taking the answer of every
inner call from its table, and checks each of the 10,001 tables it consults
the same way, down to the fact. A wrong or missing table shows up as a
disagreement, and a table the check does not use fails it too. This is the
complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
type('ind', 'n10000')

verdict('checked')
```

The verdict is **checked**: `'ind'` is in `'n10000'` follows from the
program, and it is every answer of the original questions.

The program is a few lines and its proof about 515 KB: a proof records every
call its answer rests on.

---

## Try it

```sh
eyemind examples/deep-taxonomy-10000.js            # the answer
eyemind --stats examples/deep-taxonomy-10000.js    # and its cost
```

`--stats` reports `"inferences":10001`: one step per level, plus the fact.

Change the last line to `query(type(X, 'j5000'))` and run with `--stats`
again: the answer is `type('ind', 'j5000')`, a side branch halfway down,
reached in 5001 inferences.

---

## Takeaway

Going from ten levels to ten thousand changes the cost, not the kind of
answer. Time, proof size and checking all grow in step with the depth, so a
ten-thousand-step argument is just as followable — and just as checkable —
as a ten-step one.
