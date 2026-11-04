# Expression Evaluation

*Working out (2 × 3) + (10 − 4), and showing every intermediate result.*

[expression-eval.js](https://github.com/eyereasoner/eyemind/blob/main/examples/expression-eval.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/expression-eval.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/expression-eval.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/expression-eval.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=expression-eval)

---

## The question

A formula like **(2 × 3) + (10 − 4)** is really a little tree: the `+` at the
top, a multiplication and a subtraction below it, and plain numbers at the
bottom. Spreadsheets and calculators work through such trees all the time.

```text
          total (+)
         /         \
  product (×)   difference (−)
    /    \         /     \
   2      3      10       4
```

**What is the value of this formula, and can we see how each part was
computed?**

---

## What we tell eyemind

Every part of the formula gets a name, called a **node**. These are the
facts, numbered 1 to 8:

```js
// the leaves: literal(Node, Number)
fact(literal('n2', 2))
fact(literal('n3', 3))
fact(literal('n10', 10))
fact(literal('n4', 4))
// the inner nodes: expression(Node, Operation, Left, Right)
fact(expression('product', 'mul', 'n2', 'n3'))
fact(expression('difference', 'sub', 'n10', 'n4'))
fact(expression('total', 'add', 'product', 'difference'))
fact(root('example', 'total'))
```

`product` multiplies `n2` and `n3`; `difference` subtracts `n4` from `n10`;
`total` adds those two. The formula called `example` starts at `total`.

Then the rules, numbered 9 to 14, and the question:

```js
// A node's value is its literal, or its operation applied to its children's values.
implied_by(value(Node, Value), literal(Node, Value))
implied_by(
  value(Node, Value),
  [
    expression(Node, Operation, Left, Right),
    value(Left, L),
    value(Right, R),
    calculate(Operation, L, R, Value),
  ],
)
// One clause per operation name.
implied_by(calculate('add', L, R, Value), is(Value, add(L, R)))
implied_by(calculate('sub', L, R, Value), is(Value, sub(L, R)))
implied_by(calculate('mul', L, R, Value), is(Value, mul(L, R)))
implies([root(Name, Node), value(Node, Value)], result(Name, Value))
query(result(Name, Value))
```

Capitalized names (`Node`, `Value`, `L`, ...) are **variables**: blanks that
stand for whatever fits. Square brackets around several conditions mean *all
of these*.

- `implied_by(conclusion, condition)` is a **backward rule**: when eyemind
  needs the conclusion, it tries to show the condition. Rule 9: a number
  node's value is its number. Rule 10: an expression node's value is found by
  evaluating its left and right children, then calculating.
- Rules 11 to 13 say what each operation name means.
  `is(Value, add(L, R))` is eyemind's arithmetic: it computes L + R and
  makes `Value` the answer. `sub` subtracts and `mul` multiplies.
- Rule 14 is a **forward rule**, `implies(premise, conclusion)`: once the root
  node of a formula has a value, it records that as the formula's result.

Rule 10 uses itself on the children. This is **recursion**: the same rule
applied to smaller and smaller pieces until it reaches plain numbers.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
result('example', 12)
```

(2 × 3) + (10 − 4) = 6 + 6 = **12**.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. This is the complete
proof:

```js
// Answers: each instance of a query() that holds.
result('example', 12)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(literal('n2', 2)))
clause(2, fact(literal('n3', 3)))
clause(3, fact(literal('n10', 10)))
clause(4, fact(literal('n4', 4)))
clause(5, fact(expression('product', 'mul', 'n2', 'n3')))
clause(6, fact(expression('difference', 'sub', 'n10', 'n4')))
clause(7, fact(expression('total', 'add', 'product', 'difference')))
clause(8, fact(root('example', 'total')))
clause(9, implied_by(value(Node, Value), literal(Node, Value)))
clause(10, implied_by(value(Node, Value), [expression(Node, Operation, Left, Right), value(Left, L), value(Right, R), calculate(Operation, L, R, Value)]))
clause(11, implied_by(calculate('add', L, R, Value), is(Value, add(L, R))))
clause(12, implied_by(calculate('sub', L, R, Value), is(Value, sub(L, R))))
clause(13, implied_by(calculate('mul', L, R, Value), is(Value, mul(L, R))))
clause(14, implies([root(Name, Node), value(Node, Value)], result(Name, Value)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(result('example', 12), clause(14), {Name: 'example', Node: 'total', Value: 12}, [root('example', 'total'), value('total', 12)])
step(root('example', 'total'), clause(8), {}, [])
step(value('total', 12), clause(10), {Node: 'total', Value: 12, Operation: 'add', Left: 'product', Right: 'difference', L: 6, R: 6}, [expression('total', 'add', 'product', 'difference'), value('product', 6), value('difference', 6), calculate('add', 6, 6, 12)])
step(expression('total', 'add', 'product', 'difference'), clause(7), {}, [])
step(value('product', 6), clause(10), {Node: 'product', Value: 6, Operation: 'mul', Left: 'n2', Right: 'n3', L: 2, R: 3}, [expression('product', 'mul', 'n2', 'n3'), value('n2', 2), value('n3', 3), calculate('mul', 2, 3, 6)])
step(expression('product', 'mul', 'n2', 'n3'), clause(5), {}, [])
step(value('n2', 2), clause(9), {Node: 'n2', Value: 2}, [literal('n2', 2)])
step(literal('n2', 2), clause(1), {}, [])
step(value('n3', 3), clause(9), {Node: 'n3', Value: 3}, [literal('n3', 3)])
step(literal('n3', 3), clause(2), {}, [])
step(calculate('mul', 2, 3, 6), clause(13), {L: 2, R: 3, Value: 6}, [is(6, mul(2, 3))])
step(is(6, mul(2, 3)), 'builtin', {}, [])
step(value('difference', 6), clause(10), {Node: 'difference', Value: 6, Operation: 'sub', Left: 'n10', Right: 'n4', L: 10, R: 4}, [expression('difference', 'sub', 'n10', 'n4'), value('n10', 10), value('n4', 4), calculate('sub', 10, 4, 6)])
step(expression('difference', 'sub', 'n10', 'n4'), clause(6), {}, [])
step(value('n10', 10), clause(9), {Node: 'n10', Value: 10}, [literal('n10', 10)])
step(literal('n10', 10), clause(3), {}, [])
step(value('n4', 4), clause(9), {Node: 'n4', Value: 4}, [literal('n4', 4)])
step(literal('n4', 4), clause(4), {}, [])
step(calculate('sub', 10, 4, 6), clause(12), {L: 10, R: 4, Value: 6}, [is(6, sub(10, 4))])
step(is(6, sub(10, 4)), 'builtin', {}, [])
step(calculate('add', 6, 6, 12), clause(11), {L: 6, R: 6, Value: 12}, [is(12, add(6, 6))])
step(is(12, add(6, 6)), 'builtin', {}, [])
```

It has three parts:

- **The claim**: the one answer the proof is about.
- **The clauses**: the 14 program lines the proof relies on, numbered as
  above.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

The steps follow the tree from the top down. Read them as sentences:

1. *The formula `example` is 12*: by rule 14, because its root is `total`
   and `total` is 12.
2. *The root of `example` is `total`*: fact 8.
3. *`total` is 12*: by rule 10 with `Operation` = add, `Left` = product,
   `Right` = difference, `L` = 6 and `R` = 6, because `total` adds
   `product` and `difference`, both are 6, and adding 6 and 6 gives 12.
4. *`total` adds `product` and `difference`*: fact 7.
5. *`product` is 6*: by rule 10, because it multiplies `n2` and `n3`, they
   are 2 and 3, and multiplying gives 6.
6. *`product` multiplies `n2` and `n3`*: fact 5.
7. *`n2` is 2*: by rule 9, because of its number.
8. *`n2` holds the number 2*: fact 1.
9. *`n3` is 3*: by rule 9.
10. *`n3` holds the number 3*: fact 2.
11. *Multiplying 2 and 3 gives 6*: by rule 13, because 6 is 2 × 3.
12. *6 is 2 × 3*: justified as `'builtin'`. This is a calculation, not a
    program line, and the checker does it again itself.
13. *`difference` is 6*: by rule 10, because it subtracts `n4` from `n10`,
    they are 10 and 4, and subtracting gives 6.
14. *`difference` subtracts `n4` from `n10`*: fact 6.
15. *`n10` is 10*: by rule 9.
16. *`n10` holds the number 10*: fact 3.
17. *`n4` is 4*: by rule 9.
18. *`n4` holds the number 4*: fact 4.
19. *Subtracting 4 from 10 gives 6*: by rule 12.
20. *6 is 10 − 4*: `'builtin'`, recomputed by the checker.
21. *Adding 6 and 6 gives 12*: by rule 11.
22. *12 is 6 + 6*: `'builtin'`, recomputed by the checker.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
result('example', 12)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 19)
condition('C2', 'well_founded', 'ok', 22)
condition('C3', 'justification', 'ok', 22)
condition('C4', 'coverage', 'ok', 22)
condition('C5', 're_decision', 'ok', 3)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 23)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(22)
verified(19)
recomputed(3)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (19)**: the 19 steps that cite a program line really are
  instances of it. Step 3, for example, is rule 10 with the seven values
  shown filled in.
- **C2 well-founded (22)**: none of the 22 steps depends on itself, even
  indirectly. The recursion of rule 10 always moves down the tree.
- **C3 justification (22)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (22)**: the 1 answer and the 21 things the steps use are
  each backed by a step.
- **C5 re-decision (3)**: the 3 calculations, 2 × 3 = 6, 10 − 4 = 6 and
  6 + 6 = 12, were done again by the checker, with the same results.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (23)**: the 1 answer answers the question, and all 22 steps
  serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 22 steps, 19 verified against the program and 3
recomputed, none taken on trust, for 1 claim. The verdict is **checked**: the
formula's value 12 follows from the program. As the last comment says, it
confirms this answer; it does not by itself say there is no other.

---

## Try it

```sh
eyemind examples/expression-eval.js
eyemind --proof examples/expression-eval.js
eyemind -c examples/expression-eval.js
eyemind --check-proof examples/proof/expression-eval.js examples/expression-eval.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=expression-eval).

Change `fact(literal('n4', 4))` to `fact(literal('n4', 1))` and run again:
the difference becomes 9 and the answer `result('example', 15)`. Change
`'add'` to `'mul'` in the `total` node: the answer becomes
`result('example', 36)`. Change it to `'div'` instead: no rule says what
`'div'` means, so eyemind reports no answers.
