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

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(item('apple', 3, 2)))
clause(2, fact(item('pear', 4, 3)))
clause(3, fact(item('plum', 2, 5)))
clause(4, implies([item(Name, Quantity, Price), is(Total, mul(Quantity, Price))], line_total(Name, Total)))
clause(5, fact(sum([], 0)))
clause(6, implied_by(sum([X, ...Xs], Total), [sum(Xs, Rest), is(Total, add(X, Rest))]))
clause(7, implies([findall_sorted(Amount, line_total(_0, Amount), Amounts), sum(Amounts, Total)], invoice(Total)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(invoice(28), clause(7), {Amount: A, _0: B, Amounts: [6, 10, 12], Total: 28}, [findall_sorted(A, line_total(B, A), [6, 10, 12]), sum([6, 10, 12], 28)])
step(findall_sorted(A, line_total(B, A), [6, 10, 12]), 'collected', {}, [])
step(sum([6, 10, 12], 28), clause(6), {X: 6, Xs: [10, 12], Total: 28, Rest: 22}, [sum([10, 12], 22), is(28, add(6, 22))])
step(sum([10, 12], 22), clause(6), {X: 10, Xs: [12], Total: 22, Rest: 12}, [sum([12], 12), is(22, add(10, 12))])
step(sum([12], 12), clause(6), {X: 12, Xs: [], Total: 12, Rest: 0}, [sum([], 0), is(12, add(12, 0))])
step(sum([], 0), clause(5), {}, [])
step(is(12, add(12, 0)), 'builtin', {}, [])
step(is(22, add(10, 12)), 'builtin', {}, [])
step(is(28, add(6, 22)), 'builtin', {}, [])
step(line_total('apple', 6), clause(4), {Name: 'apple', Quantity: 3, Price: 2, Total: 6}, [item('apple', 3, 2), is(6, mul(3, 2))])
step(item('apple', 3, 2), clause(1), {}, [])
step(is(6, mul(3, 2)), 'builtin', {}, [])
step(line_total('pear', 12), clause(4), {Name: 'pear', Quantity: 4, Price: 3, Total: 12}, [item('pear', 4, 3), is(12, mul(4, 3))])
step(item('pear', 4, 3), clause(2), {}, [])
step(is(12, mul(4, 3)), 'builtin', {}, [])
step(line_total('plum', 10), clause(4), {Name: 'plum', Quantity: 2, Price: 5, Total: 10}, [item('plum', 2, 5), is(10, mul(2, 5))])
step(item('plum', 2, 5), clause(3), {}, [])
step(is(10, mul(2, 5)), 'builtin', {}, [])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(line_total(C, D), [line_total('apple', 6), line_total('pear', 12), line_total('plum', 10)])
derived(invoice(C), [invoice(28)])
searched(line_total(E, F), [line_total('apple', 6), line_total('pear', 12), line_total('plum', 10)])
called(invoice(A), [invoice(28)])
called(line_total(_1, C), [line_total('apple', 6), line_total('pear', 12), line_total('plum', 10)])
called(sum([6, 10, 12], D), [sum([6, 10, 12], 28)])
called(sum([10, 12], E), [sum([10, 12], 22)])
called(sum([12], F), [sum([12], 12)])
called(sum([], G), [sum([], 0)])
```

It has four parts:

- **The claim**: the answer the proof is about.
- **The clauses**: the program lines the steps cite, numbered by their place
  in the program (the three items are lines 1 to 3, the line-total rule is
  line 4). All seven are cited. The `_` of the program is shown as `_0`, so
  that it can be given a value like any other variable.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable of the cited line stood for. `A` and `B` in
  the first two steps are not values: they are the open placeholders of the
  collection, "every amount of any item".
- **The search certificate**: the line totals the forward rule derived, the
  search behind the collection, and the answers of each call the query
  made.

Read the steps as sentences:

1. *The invoice is 28* — by rule 7, because the collected line totals are
   `[6, 10, 12]` and their sum is 28.
2. *The line totals, sorted, are exactly `[6, 10, 12]`* — **collected**:
   eyemind gathered every line total it had derived. The checker settles
   this from the search certificate (see below).
3. *The sum of `[6, 10, 12]` is 28* — by rule 6, with `X` = 6 and the rest
   `[10, 12]` adding up to 22, because 6 + 22 = 28.
4. *The sum of `[10, 12]` is 22* — by rule 6, because the sum of `[12]` is 12
   and 10 + 12 = 22.
5. *The sum of `[12]` is 12* — by rule 6, because the sum of `[]` is 0 and
   12 + 0 = 12.
6. *The sum of `[]` is 0* — fact 5.
7. *12 + 0 = 12* — **builtin**: a calculation, which the checker redoes
   itself rather than trusting.
8. *10 + 12 = 22* — builtin.
9. *28 = 6 + 22* — builtin.
10. *The apple line totals 6* — by rule 4, because the apple item has
    quantity 3 and price 2, and 3 × 2 = 6.
11. *The apple item* — fact 1.
12. *6 = 3 × 2* — builtin.

Steps 13 to 15 do the same for the pear (4 × 3 = 12) and steps 16 to 18 for
the plum (2 × 5 = 10).

Two kinds of justification appear besides program lines. A `'builtin'` step
is a calculation; anyone can redo it. A `'collected'` step is different: it
says a list is *complete*. Each number in it is a line total, but "there are
no others" is something eyemind knows only because it searched everything
it had derived. A proof cannot point at a missing line, so the search
certificate lists what the forward rule derived, `derived(line_total(C, D),
[...])`, and what the search behind the collection found,
`searched(line_total(E, F), [...])`. The listing proves *which* line totals
were derived, not in what order. A plain `findall` lists its items in the
order they were found, so over derived facts it could not be settled.
`findall_sorted` sorts the totals, so its list depends only on which totals
there are, and the checker can settle it.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
invoice(28)

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 11)
condition('C2', 'well_founded', 'ok', 18)
condition('C3', 'justification', 'ok', 18)
condition('C4', 'coverage', 'ok', 15)
condition('C5', 're_decision', 'ok', 6)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 19)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 1)
condition('C10', 'call_fidelity', 'ok', 2)

// Proof statistics: recorded steps and how they were checked.
steps(18)
verified(11)
recomputed(6)
composed(0)
trusted(0)
claims(1)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (11)**: the 11 steps that cite a program line (the
  invoice rule, three uses of the sum rule, the sum fact, three uses of the
  line-total rule and the three items) really are instances of that line
  with the values shown.
- **C2 well-founded (18)**: none of the 18 steps depends on itself, even
  indirectly.
- **C3 justification (18)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (15)**: the 1 claim and the 14 things the steps use are each
  backed by a step.
- **C5 re-decision (6)**: the checker redid the 3 additions and the 3
  multiplications and got the same results.
- **C6 boundary consistency (0)**: no boundary was left to the evidence:
  C9 settled the collection.
- **C7 relevance (19)**: the 1 claim answers the query, and all 18 steps
  serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (1)**: the collection was settled by the search
  certificate. The checker expands `line_total(E, F)` one level against the
  program: line totals come only from rule 4, so the call is matched
  against the `derived` listing. That listing is accepted because each of
  its three totals has steps of its own and because it is closed: rule 4,
  run over the three items, derives no line total it leaves out. Sorting
  the three totals gives `[6, 10, 12]`, the list in the step.
- **C10 call fidelity (2)**: the 1 claim and the 1 original question were
  checked against the `called` tables.

The statistics: 18 steps, 11 verified against the program, 6 recomputed,
the collection settled by the certificate, none trusted, 1 claim.

The list `[6, 10, 12]` is *all* the line totals with respect to this
program: add another item and the list would change. C10 certifies the
original question: `invoice(28)` is an answer, and it is the only one. The
verdict is **checked**, also under `--strict-proof`: the invoice of 28
follows from the program.


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
