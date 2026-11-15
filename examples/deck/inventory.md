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
implies([findall_sorted(Amount, line_total(_, Amount), Amounts), sum(Amounts, Total)], invoice(Total))
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
- The last rule uses `findall_sorted(Amount, line_total(_, Amount), Amounts)`:
  it **collects** every line total into one list, `Amounts`, sorted in the
  standard order of terms (for numbers, smallest first). The `_` means "any
  item, we don't care which". Then `sum` adds the list up.
- `query(invoice(Total))` asks for the invoice total.

The collection must see every line total, so eyemind runs the `findall_sorted` rule
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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(invoice(28), clause(7), {Amount: A, _0: B, Amounts: [6, 10, 12], Total: 28}, [findall_sorted(A, line_total(B, A), [6, 10, 12]), sum([6, 10, 12], 28)])
step(line_total('apple', 6), clause(4), {Name: 'apple', Quantity: 3, Price: 2, Total: 6}, [item('apple', 3, 2), is(6, mul(3, 2))])
step(line_total('pear', 12), clause(4), {Name: 'pear', Quantity: 4, Price: 3, Total: 12}, [item('pear', 4, 3), is(12, mul(4, 3))])
step(line_total('plum', 10), clause(4), {Name: 'plum', Quantity: 2, Price: 5, Total: 10}, [item('plum', 2, 5), is(10, mul(2, 5))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(invoice(C), [invoice(28)])
derived(line_total(C, D), [line_total('apple', 6), line_total('pear', 12), line_total('plum', 10)])
called(invoice(A), [invoice(28)])
called(line_total(_1, C), [line_total('apple', 6), line_total('pear', 12), line_total('plum', 10)])
called(sum([6, 10, 12], D), [sum([6, 10, 12], 28)])
called(sum([10, 12], E), [sum([10, 12], 22)])
called(sum([12], F), [sum([12], 12)])
called(sum([], G), [sum([], 0)])
```

It has three parts:

- **The claim**: the answer the proof is about.
- **The steps**: one per derived fact. A step reads
  `step(what, by which clause, with which values, using what)`. Clauses are
  numbered by their place in the program: the three items are clauses 1 to
  3, the line-total rule is clause 4, the two sum clauses are 5 and 6, and
  the invoice rule is 7. The values in curly braces say what each variable
  of the cited rule stood for. The `_` of the program is shown as `_0`.
  `A` and `B` in the first step are not values: they are the open
  placeholders of the collection, "every amount of any item".
- **The certificate**: the *listings*, `derived(...)`, of every `invoice`
  and every `line_total` fact the forward rules derived, and the *call
  tables*, `called(...)`, of every answer of each call: the query
  `invoice(X)`, the collection's call `line_total(_, Amount)`, and the four
  calls of the backward `sum` rule.

Read the lines as sentences:

1. *The invoice is 28* — by rule 7, because the line totals, collected and
   sorted, are `[6, 10, 12]` and their sum is 28.
2. *The apple line totals 6* — by rule 4, because the apple item has
   quantity 3 and price 2, and 3 × 2 = 6.
3. *The pear line totals 12* — by rule 4, because 4 × 3 = 12.
4. *The plum line totals 10* — by rule 4, because 2 × 5 = 10.
5. *The derived line totals are exactly 6, 12 and 10*, and *the derived
   invoice is exactly 28*: the two listings.
6. *The query has the one answer `invoice(28)`; the collection's call has
   the three line totals; and the sums of `[6, 10, 12]`, `[10, 12]`, `[12]`
   and `[]` are 28, 22, 12 and 0*: the call tables.

The multiplications and additions have no steps: the checker computes them
itself. Neither does the sum: it is a backward rule over stated facts, so
its call tables are checked directly against clauses 5 and 6.

The collection is the interesting part. Each number in `[6, 10, 12]` is a
line total, but "there are no others" is something eyemind knows only
because it searched everything it had derived. A proof cannot point at a
missing line, so the listing states every line total the forward rule
derived, and the call table states every answer of the collection's call.
The listing proves *which* line totals were derived, not in what order. A
plain `findall` lists its items in the order they were found, so over
derived facts it could not be certified. `findall_sorted` sorts the totals,
so its list depends only on which totals there are, and the checker can
settle it.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the query.** It searches `invoice(X)` one level against the
  program: the listed `invoice(28)` is its only answer, as its table says.
  Each other table is checked the same way: `line_total(_, C)` expands to
  the three listed totals, and each `sum` call to one application of clause
  5 or 6, its inner `sum` call answered from the next table.
- **It checks the listings are closed.** Rule 4, run over the three items,
  derives no line total the listing leaves out, and rule 7 derives no
  invoice but 28.
- **It replays each listed fact.** It re-runs rule 4 for each line total,
  computing each product, and rule 7 for the invoice: the collection is
  taken from the `line_total` table and sorted to `[6, 10, 12]`, and the sum
  of 28 from the `sum` table. Each result matches its recorded step.
- **It compares the claims with the answers.** `invoice(28)` is an answer,
  and the only one. Every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
invoice(28)

verdict('checked')
```

The list `[6, 10, 12]` is *all* the line totals with respect to this
program: add another item and the list would change. The verdict is
**checked**: the invoice of 28 follows from the program, and it is the only
answer of the query.

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

A total is only right if no line was left out. eyemind writes down which
line totals it derived, and because the collection is sorted, the checker
can confirm from that record that the list holds every one of them.
