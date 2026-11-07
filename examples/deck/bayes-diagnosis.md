# Bayes Diagnosis

*A printer shows two symptoms. Which fault is most likely, and by how much?*

[bayes-diagnosis.js](https://github.com/eyereasoner/eyemind/blob/main/examples/bayes-diagnosis.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/bayes-diagnosis.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/bayes-diagnosis.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/bayes-diagnosis.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=bayes-diagnosis)

---

## The question

A printer reports a **paper jam** and it is also **offline**. Three faults
could be behind it: a real paper jam, a lost network connection, or a power
problem. The numbers in this example are made up to illustrate the method;
they are not real fault statistics.

**How likely is each fault, given what we see, and can the computer show
every number it used?**

---

## The idea: weigh each explanation

This is *Bayes' rule*, a standard way to update beliefs with evidence:

- Start with how common each fault is (the **prior**).
- Multiply by how likely each symptom is *if* that fault were the cause (the
  **likelihoods**). The result is the fault's **weight**.
- Divide each weight by the sum of all of them, so the chances add up to 1.
  The result is the **posterior**: the chance after seeing the evidence.

The example is *naive* Bayes: it treats the two symptoms as independent
clues, so their chances can simply be multiplied. Dividing by the sum also
assumes these three faults are the only possible causes.

---

## What we tell eyemind

```js
// fault(Name, Prior, P(jam | fault), P(offline | fault)), all in percent.
fact(fault('paper_jam', 20, 90, 10))
fact(fault('network_loss', 30, 5, 95))
fact(fault('power_loss', 50, 1, 99))
implies(
  [fault(Fault, Prior, Jam, Offline), is(Weight, mul(mul(Prior, Jam), Offline))],
  weight(Fault, Weight),
)
// The total weight of all faults normalizes the posteriors.
fact(sum_weights([], 0))
implied_by(sum_weights([W, ...Ws], Sum), [sum_weights(Ws, Rest), is(Sum, add(W, Rest))])
implies([findall(W, weight(Fault, W), Weights), sum_weights(Weights, Total)], total(Total))
implies(
  [
    weight(Fault, Numerator),
    total(Denominator),
    gt(Denominator, 0),
    is(Probability, div(Numerator, Denominator)),
  ],
  posterior(Fault, Numerator, Denominator, Probability),
)
query(posterior(Fault, Numerator, Denominator, Probability))
```

- Each `fault` line reads: name, prior, chance of a jam, chance of being
  offline, all in whole percentages. A paper jam happens 20% of the time and
  shows a jam 90% of the time.
- Capitalized names such as `Fault` and `Weight` are variables, placeholders
  for any value.
- `implies(premise, conclusion)` is a forward rule: whenever the premise
  holds, conclude the conclusion. A premise in square brackets needs all its
  parts.
- Arithmetic is written as terms and worked out by **built-in
  calculations**: `is(Weight, mul(...))` multiplies, `add` adds, `div`
  divides, and `gt(Denominator, 0)` tests "greater than 0".
- `sum_weights` adds up a list: the empty list sums to 0, and the
  `implied_by(conclusion, premise)` line, a backward rule used on demand,
  adds the first number `W` to the sum of the rest `Ws`.
- `findall(W, weight(Fault, W), Weights)` **collects** every weight into one
  list. eyemind runs this rule only after all weights exist.
- The last rule divides each weight by the total; the `query` asks for every
  posterior.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
posterior('paper_jam', 18000, 37200, 0.4838709677419355)
posterior('network_loss', 14250, 37200, 0.38306451612903225)
posterior('power_loss', 4950, 37200, 0.13306451612903225)
```

| fault | weight | posterior |
|---|---|---|
| paper jam | 20 × 90 × 10 = 18000 | 18000 / 37200 ≈ 48% |
| network loss | 30 × 5 × 95 = 14250 | 14250 / 37200 ≈ 38% |
| power loss | 50 × 1 × 99 = 4950 | 4950 / 37200 ≈ 13% |

A paper jam is the best explanation, at about 48%. Power loss was the most
common fault beforehand (50%), but it rarely shows up as a jam, so it drops to
about 13%. The weights stay exact whole numbers; only the final division
gives a decimal.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
posterior('paper_jam', 18000, 37200, 0.4838709677419355)
posterior('network_loss', 14250, 37200, 0.38306451612903225)
posterior('power_loss', 4950, 37200, 0.13306451612903225)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(fault('paper_jam', 20, 90, 10)))
clause(2, fact(fault('network_loss', 30, 5, 95)))
clause(3, fact(fault('power_loss', 50, 1, 99)))
clause(4, implies([fault(Fault, Prior, Jam, Offline), is(Weight, mul(mul(Prior, Jam), Offline))], weight(Fault, Weight)))
clause(5, fact(sum_weights([], 0)))
clause(6, implied_by(sum_weights([W, ...Ws], Sum), [sum_weights(Ws, Rest), is(Sum, add(W, Rest))]))
clause(7, implies([findall(W, weight(Fault, W), Weights), sum_weights(Weights, Total)], total(Total)))
clause(8, implies([weight(Fault, Numerator), total(Denominator), gt(Denominator, 0), is(Probability, div(Numerator, Denominator))], posterior(Fault, Numerator, Denominator, Probability)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(posterior('paper_jam', 18000, 37200, 0.4838709677419355), clause(8), {Fault: 'paper_jam', Numerator: 18000, Denominator: 37200, Probability: 0.4838709677419355}, [weight('paper_jam', 18000), total(37200), gt(37200, 0), is(0.4838709677419355, div(18000, 37200))])
step(weight('paper_jam', 18000), clause(4), {Fault: 'paper_jam', Prior: 20, Jam: 90, Offline: 10, Weight: 18000}, [fault('paper_jam', 20, 90, 10), is(18000, mul(mul(20, 90), 10))])
step(fault('paper_jam', 20, 90, 10), clause(1), {}, [])
step(is(18000, mul(mul(20, 90), 10)), 'builtin', {}, [])
step(total(37200), clause(7), {W: A, Fault: B, Weights: [18000, 14250, 4950], Total: 37200}, [findall(A, weight(B, A), [18000, 14250, 4950]), sum_weights([18000, 14250, 4950], 37200)])
step(findall(A, weight(B, A), [18000, 14250, 4950]), 'collected', {}, [])
step(sum_weights([18000, 14250, 4950], 37200), clause(6), {W: 18000, Ws: [14250, 4950], Sum: 37200, Rest: 19200}, [sum_weights([14250, 4950], 19200), is(37200, add(18000, 19200))])
step(sum_weights([14250, 4950], 19200), clause(6), {W: 14250, Ws: [4950], Sum: 19200, Rest: 4950}, [sum_weights([4950], 4950), is(19200, add(14250, 4950))])
step(sum_weights([4950], 4950), clause(6), {W: 4950, Ws: [], Sum: 4950, Rest: 0}, [sum_weights([], 0), is(4950, add(4950, 0))])
step(sum_weights([], 0), clause(5), {}, [])
step(is(4950, add(4950, 0)), 'builtin', {}, [])
step(is(19200, add(14250, 4950)), 'builtin', {}, [])
step(is(37200, add(18000, 19200)), 'builtin', {}, [])
step(gt(37200, 0), 'builtin', {}, [])
step(is(0.4838709677419355, div(18000, 37200)), 'builtin', {}, [])
step(posterior('network_loss', 14250, 37200, 0.38306451612903225), clause(8), {Fault: 'network_loss', Numerator: 14250, Denominator: 37200, Probability: 0.38306451612903225}, [weight('network_loss', 14250), total(37200), gt(37200, 0), is(0.38306451612903225, div(14250, 37200))])
step(weight('network_loss', 14250), clause(4), {Fault: 'network_loss', Prior: 30, Jam: 5, Offline: 95, Weight: 14250}, [fault('network_loss', 30, 5, 95), is(14250, mul(mul(30, 5), 95))])
step(fault('network_loss', 30, 5, 95), clause(2), {}, [])
step(is(14250, mul(mul(30, 5), 95)), 'builtin', {}, [])
step(is(0.38306451612903225, div(14250, 37200)), 'builtin', {}, [])
step(posterior('power_loss', 4950, 37200, 0.13306451612903225), clause(8), {Fault: 'power_loss', Numerator: 4950, Denominator: 37200, Probability: 0.13306451612903225}, [weight('power_loss', 4950), total(37200), gt(37200, 0), is(0.13306451612903225, div(4950, 37200))])
step(weight('power_loss', 4950), clause(4), {Fault: 'power_loss', Prior: 50, Jam: 1, Offline: 99, Weight: 4950}, [fault('power_loss', 50, 1, 99), is(4950, mul(mul(50, 1), 99))])
step(fault('power_loss', 50, 1, 99), clause(3), {}, [])
step(is(4950, mul(mul(50, 1), 99)), 'builtin', {}, [])
step(is(0.13306451612903225, div(4950, 37200)), 'builtin', {}, [])
```

It has three parts:

- **The claims**: the three answers the proof is about.
- **The clauses**: every rule and fact of the program, numbered 1 to 8 in
  order (the query is a question, not a reason, so it is not listed).
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable of the cited line stood for. `A` and `B` in
  the collection are not values: they are its open placeholders, "any weight
  of any fault".

Read the steps as sentences. For the paper jam:

- **Step 1.** *The paper jam's posterior is 18000 / 37200 ≈ 0.484* — by
  rule 8, because its weight is 18000, the total is 37200, 37200 > 0, and the
  division gives that number.
- **Step 2.** *The paper jam's weight is 18000* — by rule 4, from its numbers
  and the product.
- **Step 3.** *The paper jam's numbers are 20, 90 and 10* — fact 1.
- **Step 4.** *20 × 90 × 10 = 18000* — **builtin**: a calculation the checker
  redoes itself.
- **Step 5.** *The total is 37200* — by rule 7, because the collected weights
  are `[18000, 14250, 4950]` and they sum to 37200.
- **Step 6.** *The weights are exactly `[18000, 14250, 4950]`* —
  **collected**: every weight eyemind derived. Taken on trust as complete
  (see below).
- **Steps 7 to 10.** *The sum of all three is 37200*, *of `[14250, 4950]` is
  19200*, *of `[4950]` is 4950* — each by rule 6, adding the first number to
  the sum of the rest — and *the sum of `[]` is 0* — fact 5.
- **Steps 11 to 13.** *4950 + 0 = 4950*, *14250 + 4950 = 19200*,
  *18000 + 19200 = 37200* — builtin.
- **Step 14.** *37200 > 0* — builtin.
- **Step 15.** *18000 / 37200 = 0.4838709677419355* — builtin.

Steps 16 to 20 do the same for network loss and steps 21 to 25 for power
loss: posterior (rule 8), weight (rule 4), fault fact, product and division.
They reuse the total and the test 37200 > 0 from above.

A `'collected'` step says a list is *complete*. Each number in it is a
weight, but "there are no others" is something eyemind knows only because
it searched everything it derived. A proof cannot point at a missing weight,
and since the weights are facts a forward rule derived, listed in the order
they were derived, the checker cannot confirm the list from a search
certificate either. So this step is taken on trust. It matters here: a fourth fault would change
the total, and every posterior with it.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
posterior('paper_jam', 18000, 37200, 0.4838709677419355)
posterior('network_loss', 14250, 37200, 0.38306451612903225)
posterior('power_loss', 4950, 37200, 0.13306451612903225)

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 14)
condition('C2', 'well_founded', 'ok', 25)
condition('C3', 'justification', 'ok', 25)
condition('C4', 'coverage', 'ok', 29)
condition('C5', 're_decision', 'ok', 10)
condition('C6', 'boundary_consistency', 'ok', 1)
condition('C7', 'relevance', 'ok', 28)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, weight(B, A), [18000, 14250, 4950]))

// Proof statistics: recorded steps and how they were checked.
steps(25)
verified(14)
recomputed(10)
composed(0)
trusted(1)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (14)**: the 14 steps that cite a program line really are
  instances of that line with the values shown.
- **C2 well-founded (25)**: none of the 25 steps depends on itself, even
  indirectly.
- **C3 justification (25)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (29)**: the 3 claims and the 26 things the steps use are each
  backed by a step.
- **C5 re-decision (10)**: the checker redid all 10 calculations (3
  products, 3 additions, the comparison and 3 divisions) and got the same
  results.
- **C6 boundary consistency (1)**: the 1 collection, which no certificate
  settled, was confronted with the evidence: every weight the proof shows is
  in the list.
- **C7 relevance (28)**: the 3 claims answer the query, and all 25 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (0)**: the proof carries no search certificate for
  the collection, so nothing settles it as complete.

The statistics: 25 steps, 14 verified against the program, 10 recomputed, 1
trusted, 3 claims.

The `obligation` line is the collection taken on trust: `[18000, 14250,
4950]` is *every* weight there is. `'theory_scoped'` means "complete with
respect to this program". The verdict is **checked with obligations**: the
three posteriors follow from the program, provided that list is complete. The
verdict does not say the program has no other conclusions, nor that the
invented numbers describe real printers.

---

## Try it

```sh
eyemind examples/bayes-diagnosis.js            # the answers
eyemind --proof examples/bayes-diagnosis.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=bayes-diagnosis).
Make paper jams twice as common: change its prior from `20` to `40`. Its
weight doubles to 36000, the total becomes 55200, and the paper jam rises to
about 65% (0.6521739130434783), while network loss falls to about 26% and
power loss to about 9%.

---

## Takeaway

A probability is only as trustworthy as the arithmetic behind it. Here every
multiplication, sum and division is on the record and recomputed, and the one
thing taken on trust — that the list of weights is complete — is named
rather than hidden.
