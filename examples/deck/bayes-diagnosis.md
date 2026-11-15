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
implies([findall_sorted(W, weight(Fault, W), Weights), sum_weights(Weights, Total)], total(Total))
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
- `findall_sorted(W, weight(Fault, W), Weights)` **collects** every weight
  into one list, sorted in the standard order of terms (for numbers,
  smallest first). eyemind runs this rule only after all weights exist.
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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(posterior('paper_jam', 18000, 37200, 0.4838709677419355), clause(8), {Fault: 'paper_jam', Numerator: 18000, Denominator: 37200, Probability: 0.4838709677419355}, [weight('paper_jam', 18000), total(37200), gt(37200, 0), is(0.4838709677419355, div(18000, 37200))])
step(weight('paper_jam', 18000), clause(4), {Fault: 'paper_jam', Prior: 20, Jam: 90, Offline: 10, Weight: 18000}, [fault('paper_jam', 20, 90, 10), is(18000, mul(mul(20, 90), 10))])
step(total(37200), clause(7), {W: A, Fault: B, Weights: [4950, 14250, 18000], Total: 37200}, [findall_sorted(A, weight(B, A), [4950, 14250, 18000]), sum_weights([4950, 14250, 18000], 37200)])
step(posterior('network_loss', 14250, 37200, 0.38306451612903225), clause(8), {Fault: 'network_loss', Numerator: 14250, Denominator: 37200, Probability: 0.38306451612903225}, [weight('network_loss', 14250), total(37200), gt(37200, 0), is(0.38306451612903225, div(14250, 37200))])
step(weight('network_loss', 14250), clause(4), {Fault: 'network_loss', Prior: 30, Jam: 5, Offline: 95, Weight: 14250}, [fault('network_loss', 30, 5, 95), is(14250, mul(mul(30, 5), 95))])
step(posterior('power_loss', 4950, 37200, 0.13306451612903225), clause(8), {Fault: 'power_loss', Numerator: 4950, Denominator: 37200, Probability: 0.13306451612903225}, [weight('power_loss', 4950), total(37200), gt(37200, 0), is(0.13306451612903225, div(4950, 37200))])
step(weight('power_loss', 4950), clause(4), {Fault: 'power_loss', Prior: 50, Jam: 1, Offline: 99, Weight: 4950}, [fault('power_loss', 50, 1, 99), is(4950, mul(mul(50, 1), 99))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(posterior(C, D, E, F), [posterior('paper_jam', 18000, 37200, 0.4838709677419355), posterior('network_loss', 14250, 37200, 0.38306451612903225), posterior('power_loss', 4950, 37200, 0.13306451612903225)])
derived(weight(C, D), [weight('paper_jam', 18000), weight('network_loss', 14250), weight('power_loss', 4950)])
derived(total(C), [total(37200)])
called(posterior(A, B, C, D), [posterior('paper_jam', 18000, 37200, 0.4838709677419355), posterior('network_loss', 14250, 37200, 0.38306451612903225), posterior('power_loss', 4950, 37200, 0.13306451612903225)])
called(weight(E, F), [weight('paper_jam', 18000), weight('network_loss', 14250), weight('power_loss', 4950)])
called(total(G), [total(37200)])
called(sum_weights([4950, 14250, 18000], H), [sum_weights([4950, 14250, 18000], 37200)])
called(sum_weights([14250, 18000], I), [sum_weights([14250, 18000], 32250)])
called(sum_weights([18000], J), [sum_weights([18000], 18000)])
called(sum_weights([], K), [sum_weights([], 0)])
```

It has three parts:

- **The claims**: the three answers the proof is about.
- **The steps**: one for each fact a forward rule derived. A step reads
  `step(what, by what, with which values, using what)`; the rule is named by
  its position in the program (rule 4 the weight, rule 7 the total, rule 8
  the posterior). The values in curly braces say what each variable of the
  rule stood for. `A` and `B` in the collection are not values: they are its
  open placeholders, "any weight of any fault".
- **The certificate**: the **listings**, `derived(Pattern, Facts)`, give
  every fact the forward rules derived for each relation; the **call
  tables**, `called(Call, Answers)`, give every answer of each call made
  while answering the query.

Read the steps as sentences. For the paper jam:

- *The paper jam's posterior is 18000 / 37200 ≈ 0.484* — by rule 8, because
  its weight is 18000, the total is 37200, 37200 > 0, and the division gives
  that number.
- *The paper jam's weight is 18000* — by rule 4, from its numbers 20, 90 and
  10 (fact 1) and the product 20 × 90 × 10.
- *The total is 37200* — by rule 7, because the collected weights, sorted,
  are `[4950, 14250, 18000]` and they sum to 37200.

The other four steps do the same for network loss and power loss. The
products, sums, comparison and divisions are not written as steps: the
checker computes them itself. Neither is the sum of the weights: `sum_weights`
is a backward rule, so its answers are in the four `sum_weights` call tables,
adding the first number to the sum of the rest down to the empty list.

The collection says a list is *complete*. Each number in it is a weight, but
"there are no others" is something eyemind knows only because it searched
everything it derived. It matters here: a fourth fault would change the
total, and every posterior with it. A proof cannot point at a missing weight,
so the certificate lists the weights the forward rule derived,
`derived(weight(C, D), [...])`, and what the call behind the collection
found, `called(weight(E, F), [...])`. That listing proves *which* weights
were derived, not in what order. A plain `findall` lists its items in the
order they were found, so over derived facts it could not be certified.
`findall_sorted` sorts the weights, so its list depends only on which
weights there are, and the checker can settle it.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the query by
expanding each call one level against the program, taking the answer of every
inner call from its table and recomputing each calculation, so a wrong table
shows up as a disagreement. It requires each listing to be closed under the
forward rules, and **replays** each listed fact's step: it re-runs the cited
rule, with the collection taken from its table. A step, table or listing the
check does not use fails it. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
posterior('paper_jam', 18000, 37200, 0.4838709677419355)
posterior('network_loss', 14250, 37200, 0.38306451612903225)
posterior('power_loss', 4950, 37200, 0.13306451612903225)

verdict('checked')
```

The collection is settled by the certificate. The checker expands
`weight(E, F)` one level against the program: weights come only from rule 4,
so the call is matched against the `derived` listing. That listing is
accepted because each of its three weights replays its step and because it
is closed: rule 4, run over the three faults, derives no weight it leaves
out. Sorting the three weights gives `[4950, 14250, 18000]`, the list in the
step for the total.

The list `[4950, 14250, 18000]` is *every* weight with respect to this
program. The verdict is **checked**: the three posteriors follow from the
program, and they are every answer of the query. It does not say that the
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
multiplication, sum and division is on the record and recomputed, and the
claim that the list of weights is complete is settled by the record of what
eyemind derived.
