# Deep Taxonomy (10 levels)

*Ten levels down a family tree of categories, ignoring every dead end on the way.*

[deep-taxonomy-10.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-10.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/deep-taxonomy-10.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-10.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/deep-taxonomy-10.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=deep-taxonomy-10)

---

## The question

A **taxonomy** is a tree of categories: a poodle is a dog, a dog is a mammal,
a mammal is an animal. Knowing something's lowest category tells you all the
higher ones.

Here we have one individual, `ind`, in category `n0`, and a chain of ten
levels above it. At every level the chain also branches into two side
categories that lead nowhere.

**Does `ind` belong to `n10`, the top of the chain?**

---

## What we tell eyemind

One fact, and three rules per level, which a loop states. The program is
JavaScript, so it can compute its own rules:

```js
fact(type('ind', 'n0'))
for (let level = 1; level <= 10; level++) {
  implied_by(type(X, `n${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `i${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `j${level}`), type(X, `n${level - 1}`))
}
query(type(X, 'n10'))
```

- `fact(...)` states something true outright: `ind` is of type `n0`.
- `implied_by(conclusion, condition)` is a **backward rule**: *the conclusion
  holds whenever the condition holds*. The first rule of level 1 reads
  *"X is an `n1` if X is an `n0`"*.
- `X` is a **variable**: capitalized names stand for whatever value makes
  the rule fit. Each rule gets its own fresh `X`.
- The `n` rules are the real chain; `i` and `j` are the side branches. In
  all, the loop states 30 rules, so with the fact the program has 31
  numbered **clauses** (a clause is one fact or one rule): the fact is
  clause 1, and level K's three rules are clauses 3K−1, 3K and 3K+1.
- `query(...)` is the question: *"which X are of type `n10`?"* eyemind works
  backward from it: to show `n10` it looks for a rule that concludes `n10`,
  then tries to show that rule's condition, and so on.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
type('ind', 'n10')
```

The comment line says what follows: every answer to the query. There is
one: `ind` is an `n10`. The side categories are never needed, so they never
appear in the answer.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
type('ind', 'n10')

// Certificate: the derived facts and every answer of each call the questions make.
called(type(A, 'n10'), [type('ind', 'n10')])
called(type(B, 'n9'), [type('ind', 'n9')])
called(type(C, 'n8'), [type('ind', 'n8')])
called(type(D, 'n7'), [type('ind', 'n7')])
called(type(E, 'n6'), [type('ind', 'n6')])
called(type(F, 'n5'), [type('ind', 'n5')])
called(type(G, 'n4'), [type('ind', 'n4')])
called(type(H, 'n3'), [type('ind', 'n3')])
called(type(I, 'n2'), [type('ind', 'n2')])
called(type(J, 'n1'), [type('ind', 'n1')])
called(type(K, 'n0'), [type('ind', 'n0')])
```

It has two parts:

- **The claim**: the answer the proof is about, `type('ind', 'n10')`.
- **The certificate**: one **call table** per question asked along the way.
  `called(Call, Answers)` says: *this call has exactly these answers*. The
  variable in each call (`A`, `B`, …) is the unknown still open when the
  call was made.

A proof can also hold `step(...)` records, for facts that forward rules
derive. Every rule here is a backward rule, worked out only when asked, so
this proof has none.

Read the tables as sentences:

1. *Which X are `n10`? Exactly `ind`.* Clause 29 asks this of `n9`.
2. *Which X are `n9`? Exactly `ind`.* Clause 26 asks this of `n8`.
3. –10. The same, one level lower each time, by clauses 23, 20, …, 2.
11. *Which X are `n0`? Exactly `ind`*: fact 1.

Only the `n` rules lead to a table. The side branches `i` and `j` conclude
other categories, so none of the questions ever calls them.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the query by
applying the program's clauses one level at a time, taking the answer of
every inner call from its table, and checks each table it consults the same
way: `type(X, 'n1')` must give exactly what clause 2 gives from the answers
of `type(X, 'n0')`, and so on up the ladder. A wrong or missing table shows
up as a disagreement, and a table the check does not use fails it too. This
is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
type('ind', 'n10')

verdict('checked')
```

The verdict is **checked**: `ind` is an `n10` follows from the program, and
it is every answer of the original question. A wrong claim, or a left-out
answer, would instead be listed as a `failure(...)` and end the report with
`verdict(failed(N))`.

---

## One of five sizes

This is the smallest of a well-known benchmark, the deep taxonomy, that
eyemind ships at five sizes:

- `deep-taxonomy-10` (this one), `-100`, `-1000`, `-10000` and `-100000` levels.

eyemind answers by working backward from the question, one step per level,
so the benchmark tests how deep goal-directed search, and its proof, can go.
Each size costs exactly one call table per level, plus one for the fact. The
hundred-thousand-level version checks 100001 tables. Time, proof size and
checking all grow in proportion to the depth, so a longer chain costs
more, but never disproportionately more.

---

## Try it

```sh
eyemind examples/deep-taxonomy-10.js
eyemind --stats examples/deep-taxonomy-10.js
eyemind --proof examples/deep-taxonomy-10.js
eyemind -c examples/deep-taxonomy-10.js
eyemind --check-proof examples/proof/deep-taxonomy-10.js examples/deep-taxonomy-10.js
```

`--stats` adds a line counting the work: 11 inferences, one per step of the
ladder. In the [playground](https://eyereasoner.github.io/eyemind/playground/#example=deep-taxonomy-10),
change the last line to `query(type(X, 'j7'))` and the answer becomes
`type('ind', 'j7')`: a side branch, reached by climbing six levels first. Its
proof has 8 call tables: for `j7`, and for `n6` down to `n0`.

---

## Takeaway

A long chain of reasoning stays easy to trust when every link is written
down and checked, and the dead ends stay out of the explanation.
