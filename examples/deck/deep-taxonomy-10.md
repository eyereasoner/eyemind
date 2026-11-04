# Deep Taxonomy (10 levels)

*Ten levels down a family tree of categories, ignoring every dead end on the way.*

[deep-taxonomy-10.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-10.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/deep-taxonomy-10.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-10.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/deep-taxonomy-10.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=deep-taxonomy-10)

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

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(type('ind', 'n0')))
clause(2, implied_by(type(X, 'n1'), type(X, 'n0')))
clause(5, implied_by(type(X, 'n2'), type(X, 'n1')))
clause(8, implied_by(type(X, 'n3'), type(X, 'n2')))
clause(11, implied_by(type(X, 'n4'), type(X, 'n3')))
clause(14, implied_by(type(X, 'n5'), type(X, 'n4')))
clause(17, implied_by(type(X, 'n6'), type(X, 'n5')))
clause(20, implied_by(type(X, 'n7'), type(X, 'n6')))
clause(23, implied_by(type(X, 'n8'), type(X, 'n7')))
clause(26, implied_by(type(X, 'n9'), type(X, 'n8')))
clause(29, implied_by(type(X, 'n10'), type(X, 'n9')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(type('ind', 'n10'), clause(29), {X: 'ind'}, [type('ind', 'n9')])
step(type('ind', 'n9'), clause(26), {X: 'ind'}, [type('ind', 'n8')])
step(type('ind', 'n8'), clause(23), {X: 'ind'}, [type('ind', 'n7')])
step(type('ind', 'n7'), clause(20), {X: 'ind'}, [type('ind', 'n6')])
step(type('ind', 'n6'), clause(17), {X: 'ind'}, [type('ind', 'n5')])
step(type('ind', 'n5'), clause(14), {X: 'ind'}, [type('ind', 'n4')])
step(type('ind', 'n4'), clause(11), {X: 'ind'}, [type('ind', 'n3')])
step(type('ind', 'n3'), clause(8), {X: 'ind'}, [type('ind', 'n2')])
step(type('ind', 'n2'), clause(5), {X: 'ind'}, [type('ind', 'n1')])
step(type('ind', 'n1'), clause(2), {X: 'ind'}, [type('ind', 'n0')])
step(type('ind', 'n0'), clause(1), {}, [])
```

It has three parts:

- **The claim**: the answer the proof is about, `type('ind', 'n10')`.
- **The clauses**: the 11 program lines the proof relies on, with their
  numbers in the program. Only the `n` rules appear (clauses 2, 5, 8, …,
  29); the 20 side-branch rules are left out because no step uses them.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`. The values,
  such as `{X: 'ind'}`, say what each variable of the cited clause stood for.

Read the steps as sentences:

1. *`ind` is an `n10`*: by clause 29, with `X` being `ind`, because `ind` is
   an `n9`.
2. *`ind` is an `n9`*: by clause 26, because `ind` is an `n8`.
3. *`ind` is an `n8`*: by clause 23, because `ind` is an `n7`.
4. *`ind` is an `n7`*: by clause 20, because `ind` is an `n6`.
5. *`ind` is an `n6`*: by clause 17, because `ind` is an `n5`.
6. *`ind` is an `n5`*: by clause 14, because `ind` is an `n4`.
7. *`ind` is an `n4`*: by clause 11, because `ind` is an `n3`.
8. *`ind` is an `n3`*: by clause 8, because `ind` is an `n2`.
9. *`ind` is an `n2`*: by clause 5, because `ind` is an `n1`.
10. *`ind` is an `n1`*: by clause 2, because `ind` is an `n0`.
11. *`ind` is an `n0`*: fact 1; it uses nothing.

Every step is justified by a clause of the program, and each leans only on
the step below it, down to the one fact: a straight ladder of ten rule steps
plus one fact.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
type('ind', 'n10')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 11)
condition('C2', 'well_founded', 'ok', 11)
condition('C3', 'justification', 'ok', 11)
condition('C4', 'coverage', 'ok', 11)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 12)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(11)
verified(11)
recomputed(0)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (11)**: each of the 11 steps really is an instance of the
  clause it cites, with the values shown. Step 1 is clause 29 with `X` =
  `ind`, and so on down the ladder.
- **C2 well-founded (11)**: no step depends on itself, even indirectly; the
  ladder has a bottom.
- **C3 justification (11)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (11)**: the 1 claim and the 10 things the steps use are each
  backed by a step: nothing is taken for granted.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (12)**: the 1 claim answers the query, and all 11 steps
  serve it. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 11 steps, all 11 verified against the program,
none recomputed, composed or taken on trust. The verdict is **checked**:
`ind` is an `n10` follows from the program. As the last comment says, this
confirms the claim; it does not say the program has no other answers.

---

## One of five sizes

This is the smallest of a well-known benchmark, the deep taxonomy, that
eyemind ships at five sizes:

- `deep-taxonomy-10` (this one), `-100`, `-1000`, `-10000` and `-100000` levels.

eyemind answers by working backward from the question, one step per level,
so the benchmark tests how deep goal-directed search, and its proof, can go.
Each size costs exactly one step per level, plus one for the fact. The
hundred-thousand-level version verifies 100001 steps. Time, proof size and
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
ladder. In the [playground](https://eyereasoner.github.io/eyemind/playground#example=deep-taxonomy-10),
change the last line to `query(type(X, 'j7'))` and the answer becomes
`type('ind', 'j7')`: a side branch, reached by climbing six levels first. Its
proof has 8 steps: the `j7` rule, the six `n` rules from `n6` down to `n1`,
and the fact.
