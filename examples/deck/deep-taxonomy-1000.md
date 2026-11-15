# Deep Taxonomy 1000

*A thousand-step chain of reasoning, every step written down and checked.*

[deep-taxonomy-1000.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-1000.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/deep-taxonomy-1000.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-1000.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/deep-taxonomy-1000.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=deep-taxonomy-1000)

---

## The question

A *taxonomy* is a tree of categories: a robin is a bird, a bird is an
animal, an animal is a living thing, and so on. Here the tree is a thousand
levels deep, with categories simply numbered `n0`, `n1`, … `n1000`. At every
level it also splits off two side categories, `iK` and `jK`, that lead
nowhere.

We know one thing: an individual, `ind`, is in the top category `n0`.

**Is `ind` in category `n1000`, at the very bottom, and can every one of the
thousand steps be shown and checked?**

---

## A benchmark, at five sizes

This is the *deep-taxonomy benchmark*, a standard stress test for reasoners.
The collection has it at five depths:

| Example | Levels | Call tables |
| --- | --- | --- |
| deep-taxonomy-10 | 10 | 11 |
| deep-taxonomy-100 | 100 | 101 |
| **deep-taxonomy-1000** | **1000** | **1001** |
| deep-taxonomy-10000 | 10000 | 10001 |
| deep-taxonomy-100000 | 100000 | 100001 |

Same shape each time; only the length of the chain changes.

---

## What we tell eyemind

One fact, then three rules per level, 3000 rules in all, written by a loop:

```js
fact(type('ind', 'n0'))
for (let level = 1; level <= 1000; level++) {
  implied_by(type(X, `n${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `i${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `j${level}`), type(X, `n${level - 1}`))
}
query(type(X, 'n1000'))
```

- `fact(type('ind', 'n0'))` states that `ind` is in category `n0`.
- `implied_by(conclusion, condition)` is a **backward rule**: a definition
  eyemind consults when a question needs it. For level 2 the loop writes
  `implied_by(type(X, 'n2'), type(X, 'n1'))`: *anything in n1 is also in n2*.
  The `i` and `j` rules are the side branches.
- `X` is a variable: a placeholder for whichever individual fits.
- The `for` loop is ordinary JavaScript that writes the 3000 rules, so the
  program stays a few lines long.
- `query(…)` asks the question: *who is in n1000?*

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
type('ind', 'n1000')
```

The first line is a comment saying what follows: the answers to the query.
There is one: yes, `ind` is in `n1000`.

eyemind works backward from the question: to be in `n1000`, be in `n999`; to
be in `n999`, be in `n998`; … all the way up to the fact we gave.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. The full proof is
1005 lines (about 48 KB) with 1001 call tables, so here is its opening and the
start and end of its certificate. The
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-1000.js)
is online.

```js
// Answers: each instance of a query() that holds.
type('ind', 'n1000')

// Certificate: the derived facts and every answer of each call the questions make.
called(type(A, 'n1000'), [type('ind', 'n1000')])
called(type(B, 'n999'), [type('ind', 'n999')])
called(type(C, 'n998'), [type('ind', 'n998')])
// … 993 more tables, one per level from n997 down to n5
called(type(I38, 'n4'), [type('ind', 'n4')])
called(type(J38, 'n3'), [type('ind', 'n3')])
called(type(K38, 'n2'), [type('ind', 'n2')])
called(type(L38, 'n1'), [type('ind', 'n1')])
called(type(M38, 'n0'), [type('ind', 'n0')])
```

It has two parts:

- **The claim**: the answer the proof is about.
- **The certificate**: one **call table** per question asked along the way.
  `called(Call, Answers)` says: *this call has exactly these answers*. The
  variable in each call (`A`, `B`, …, `M38`) is the unknown still open when
  the call was made. Only the 1001 calls the search makes have a table: the
  `i` and `j` side branches never appear, because no question calls them.

A proof can also hold `step(...)` records, for facts that forward rules
derive. Every rule here is a backward rule, worked out only when asked, so
this proof has none.

Read the tables as sentences:

1. *Who is in n1000? Exactly `ind`.* Rule 2999 asks this of n999.
2. *Who is in n999? Exactly `ind`.* Rule 2996 asks this of n998.
3. *Who is in n998? Exactly `ind`.* Rule 2993 asks this of n997.
4. … one table per level, each with the answer `ind` …
5. *Who is in n1? Exactly `ind`.* Rule 2 asks this of n0.
6. *Who is in n0? Exactly `ind`*: fact 1.

Every table rests only on the one below it, down to the one fact.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the query by
applying the program's rules one level at a time, taking the answer of every
inner call from its table, and checks each of the 1001 tables it consults the
same way, down to the fact. A wrong or missing table shows up as a
disagreement, and a table the check does not use fails it too. This is the
complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
type('ind', 'n1000')

verdict('checked')
```

The verdict is **checked**: `ind` is in n1000. It confirms that answer, and
that it is every answer of the original question.

---

## Try it

```sh
eyemind examples/deep-taxonomy-1000.js            # the answer
eyemind --stats examples/deep-taxonomy-1000.js    # and its cost
```

`--stats` reports `"inferences":1001`: one step per level, plus the fact.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=deep-taxonomy-1000).

Change the last line to `query(type(X, 'i500'))` and run with `--stats`
again: the answer is `type('ind', 'i500')`, reached in 501 inferences, and
its proof has 501 call tables: one for the side branch i500, then 500 for
the categories n499, n498, … n0 above it.

---

## Takeaway

Long reasoning does not have to be opaque. Time, proof size and checking
grow in step with the depth, so a chain a thousand steps long is just as
followable — and just as checkable — as one with ten.
