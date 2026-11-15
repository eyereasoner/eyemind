# Expression Evaluation

*Working out (2 × 3) + (10 − 4), and showing every intermediate result.*

[expression-eval.js](https://github.com/eyereasoner/eyemind/blob/main/examples/expression-eval.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/expression-eval.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/expression-eval.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/expression-eval.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=expression-eval)

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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(result('example', 12), clause(14), {Name: 'example', Node: 'total', Value: 12}, [root('example', 'total'), value('total', 12)])

// Certificate: the derived facts and every answer of each call the questions make.
derived(result(A, B), [result('example', 12)])
called(result(A, B), [result('example', 12)])
called(value('total', C), [value('total', 12)])
called(value('product', D), [value('product', 6)])
called(value('n2', E), [value('n2', 2)])
called(value('n3', F), [value('n3', 3)])
called(calculate('mul', 2, 3, G), [calculate('mul', 2, 3, 6)])
called(value('difference', H), [value('difference', 6)])
called(value('n10', I), [value('n10', 10)])
called(value('n4', J), [value('n4', 4)])
called(calculate('sub', 10, 4, K), [calculate('sub', 10, 4, 6)])
called(calculate('add', 6, 6, L), [calculate('add', 6, 6, 12)])
```

It has three parts:

- **The claim**: the one answer the proof is about.
- **The step**: `result` is concluded by a forward rule, so its one fact has
  a step. It reads `step(what, by which clause, with which values, using
  what)`: *the formula `example` is 12, by rule 14 (the 14th clause of the
  program), with `Node` = total and `Value` = 12, because the root of
  `example` is `total` and `total` is 12.*
- **The certificate**: the **listing** `derived(result(A, B), [...])` says
  that `result('example', 12)` is every `result` fact the forward rules
  derived. Each **call table** `called(Call, Answers)` says that a call made
  while answering the question has exactly these answers.

Read the call tables as sentences, top down through the tree:

1. *Asking for any `result` gives exactly `result('example', 12)`.*
2. *Asking for the value of `total` gives exactly 12.* Rule 10 asks this
   while firing rule 14.
3. *`product` is 6*, by rule 10: it multiplies `n2` and `n3`.
4. –5. *`n2` is 2 and `n3` is 3*, by rule 9 from their numbers.
6. *Multiplying 2 and 3 gives 6*, by rule 13.
7. –10. *`difference` is 6*: `n10` is 10, `n4` is 4, and subtracting 4 from
   10 gives 6, by rule 12.
11. *Adding 6 and 6 gives 12*, by rule 11.

The facts of the tree (`literal`, `expression`, `root`) need no table: the
checker reads them from the program. The calculations 2 × 3, 10 − 4 and
6 + 6 are not written down at all: the checker computes them itself.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the question
by applying the program's rules one level at a time, taking the answer of
every inner call from its table and computing every calculation itself, and
checks each table it consults the same way, so a wrong table shows up as a
disagreement. It requires the listing to be closed under the forward rule and
replays the step: rule 14 is run again from no bindings, and must give
`result('example', 12)`. A step, table or listing the check does not use
fails it. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
result('example', 12)

verdict('checked')
```

The verdict is **checked**: the formula's value 12 follows from the program,
and it is every answer of the question. Had the proof claimed
`result('example', 13)`, or left the answer out, the report would list each
`failure(...)` and end with `verdict(failed(N))`.

---

## Try it

```sh
eyemind examples/expression-eval.js
eyemind --proof examples/expression-eval.js
eyemind -c examples/expression-eval.js
eyemind --check-proof examples/proof/expression-eval.js examples/expression-eval.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=expression-eval).

Change `fact(literal('n4', 4))` to `fact(literal('n4', 1))` and run again:
the difference becomes 9 and the answer `result('example', 15)`. Change
`'add'` to `'mul'` in the `total` node: the answer becomes
`result('example', 36)`. Change it to `'div'` instead: no rule says what
`'div'` means, so eyemind reports no answers.

---

## Takeaway

Even simple arithmetic is a chain of small steps. When each intermediate
result is written down and rechecked, a wrong input is easy to find, and a right answer is
easy to trust.
