# Inventory Invoice

*Adding up a shopping bill, and being honest about what "all the lines" means.*

[inventory.js](https://github.com/eyereasoner/eyemind/blob/main/examples/inventory.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/inventory.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/inventory.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/inventory.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=inventory)

---

## The question

You buy three kinds of fruit:

- 3 apples at 2 each,
- 4 pears at 3 each,
- 2 plums at 5 each.

All prices are in the same currency. Each line of the invoice is quantity
times price, and the invoice adds up all the lines. Easy for a person; the
interesting part is how a computer shows its work, including the step "I
added up *all* the lines".

**What is the total on the invoice?**

---

## What we tell eyemind

```js
// item(Name, Quantity, UnitPrice)
fact(item('apple', 3, 2))
fact(item('pear', 4, 3))
fact(item('plum', 2, 5))
implies([item(Name, Quantity, Price), is(Total, mul(Quantity, Price))], line_total(Name, Total))
// sum(Numbers, Total): Total is the sum of the list Numbers.
fact(sum([], 0))
implied_by(sum([X, ...Xs], Total), [sum(Xs, Rest), is(Total, add(X, Rest))])
implies([findall(Amount, line_total(_, Amount), Amounts), sum(Amounts, Total)], invoice(Total))
query(invoice(Total))
```

- The three `fact` lines are the items: name, quantity, unit price.
  Capitalized names such as `Quantity` are variables, placeholders for any
  value.
- `implies(premise, conclusion)` is a forward rule: whenever the premise
  holds, conclude the conclusion. The first rule makes one `line_total` per
  item. `is(Total, mul(Quantity, Price))` is a **built-in calculation**:
  eyemind multiplies and puts the result in `Total`.
- `sum` adds up a list, one number at a time. The fact says the sum of the
  empty list `[]` is 0. The `implied_by(conclusion, premise)` line is a
  backward rule, used on demand: the sum of a list whose first number is `X`
  and whose rest is `Xs` is `X` plus the sum of the rest.
- The last rule uses `findall(Amount, line_total(_, Amount), Amounts)`: it
  **collects** every line total into one list, `Amounts`. The `_` means "any
  item, we don't care which". Then `sum` adds the list up.
- `query(invoice(Total))` asks for the invoice total.

The collection must see every line total, so eyemind runs the `findall` rule
only after all line totals have been derived: it puts that rule in a later
*stratum*, a later stage of reasoning.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
invoice(28)
```

The line totals are 3 × 2 = 6, 4 × 3 = 12 and 2 × 5 = 10, and
6 + 12 + 10 = **28**.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
invoice(28)

// Clauses: the program clauses the steps cite, by clause number.
clause(5, fact(sum([], 0)))
clause(6, implied_by(sum([X, ...Xs], Total), [sum(Xs, Rest), is(Total, add(X, Rest))]))
clause(7, implies([findall(Amount, line_total(_0, Amount), Amounts), sum(Amounts, Total)], invoice(Total)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(invoice(28), clause(7), {Amount: A, _0: B, Amounts: [6, 12, 10], Total: 28}, [findall(A, line_total(B, A), [6, 12, 10]), sum([6, 12, 10], 28)])
step(findall(A, line_total(B, A), [6, 12, 10]), 'collected', {}, [])
step(sum([6, 12, 10], 28), clause(6), {X: 6, Xs: [12, 10], Total: 28, Rest: 22}, [sum([12, 10], 22), is(28, add(6, 22))])
step(sum([12, 10], 22), clause(6), {X: 12, Xs: [10], Total: 22, Rest: 10}, [sum([10], 10), is(22, add(12, 10))])
step(sum([10], 10), clause(6), {X: 10, Xs: [], Total: 10, Rest: 0}, [sum([], 0), is(10, add(10, 0))])
step(sum([], 0), clause(5), {}, [])
step(is(10, add(10, 0)), 'builtin', {}, [])
step(is(22, add(12, 10)), 'builtin', {}, [])
step(is(28, add(6, 22)), 'builtin', {}, [])
```

It has three parts:

- **The claim**: the answer the proof is about.
- **The clauses**: the program lines the steps cite, numbered by their place
  in the program (the three items are lines 1 to 3, the line-total rule is
  line 4). Only lines 5, 6 and 7 are cited. The `_` of the program is shown
  as `_0`, so that it can be given a value like any other variable.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable of the cited line stood for. `A` and `B` in
  the first two steps are not values: they are the open placeholders of the
  collection, "every amount of any item".

Read the steps as sentences:

1. *The invoice is 28* — by rule 7, because the collected line totals are
   `[6, 12, 10]` and their sum is 28.
2. *The line totals are exactly `[6, 12, 10]`* — **collected**: eyemind
   gathered every line total it had derived. This step is taken on trust (see
   below).
3. *The sum of `[6, 12, 10]` is 28* — by rule 6, with `X` = 6 and the rest
   `[12, 10]` adding up to 22, because 6 + 22 = 28.
4. *The sum of `[12, 10]` is 22* — by rule 6, because the sum of `[10]` is 10
   and 12 + 10 = 22.
5. *The sum of `[10]` is 10* — by rule 6, because the sum of `[]` is 0 and
   10 + 0 = 10.
6. *The sum of `[]` is 0* — fact 5.
7. *10 + 0 = 10* — **builtin**: a calculation, which the checker redoes
   itself rather than trusting.
8. *12 + 10 = 22* — builtin.
9. *28 = 6 + 22* — builtin.

Two kinds of justification appear besides program lines. A `'builtin'` step
is a calculation; anyone can redo it. A `'collected'` step is different: it
says a list is *complete*. Each number in it is a line total, but "there are
no others" is something eyemind knows only because it searched everything
it had derived. A proof cannot point at a missing line. The checker can
confirm some collected lists from a search certificate, but not one over
facts a forward rule derived, as these line totals are: the list gives them
in the order they were derived, which the checker cannot confirm. So this
step is taken on trust.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
invoice(28)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 5)
condition('C2', 'well_founded', 'ok', 9)
condition('C3', 'justification', 'ok', 9)
condition('C4', 'coverage', 'ok', 9)
condition('C5', 're_decision', 'ok', 3)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 10)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, line_total(B, A), [6, 12, 10]))

// Proof statistics: recorded steps and how they were checked.
steps(9)
verified(5)
recomputed(3)
composed(0)
trusted(1)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (5)**: the 5 steps that cite a program line (the invoice
  rule, three uses of the sum rule, and the sum fact) really are instances of
  that line with the values shown.
- **C2 well-founded (9)**: none of the 9 steps depends on itself, even
  indirectly.
- **C3 justification (9)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (9)**: the 1 claim and the 8 things the steps use are each
  backed by a step.
- **C5 re-decision (3)**: the checker redid the 3 additions and got the same
  results.
- **C6 boundary consistency (0)**: the checker had nothing to confront the
  1 collection with. Line totals come from a rule, not from facts, and the
  proof records no `line_total` step, so nothing could show a total missing
  from the list. It is left undecided and stays an obligation taken on
  trust.
- **C7 relevance (10)**: the 1 claim answers the query, and all 9 steps
  serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics: 9 steps, 5 verified against the program, 3 recomputed, 1
trusted, 1 claim.

The `obligation` line names what was taken on trust: the list `[6, 12, 10]`
is *all* the line totals. `'theory_scoped'` means "complete with respect to
this program": add another item and the list would change. The verdict is
**checked with obligations**: the invoice of 28 follows from the program,
provided that list is complete. The verdict does not say the program has no
other conclusions.

---

## Try it

```sh
eyemind examples/inventory.js            # the answers
eyemind --proof examples/inventory.js    # answers with their proof
eyemind --goal 'line_total(Name, Total)' examples/inventory.js
```

The last command asks for the line totals, which the query does not show:
`line_total('apple', 6)`, `line_total('pear', 12)` and
`line_total('plum', 10)`.

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=inventory).
Add `fact(item('fig', 5, 1))` and run again: the invoice becomes
`invoice(33)`, because the collection now gathers four line totals.

---

## Takeaway

A total is only right if no line was left out. eyemind does not hide that
assumption: the report names it, so you know exactly what you are trusting.
