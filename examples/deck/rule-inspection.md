# Reasoning about a rule

*The rule itself can be evidence.*

[rule-inspection.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rule-inspection.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/rule-inspection.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rule-inspection.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/rule-inspection.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=rule-inspection)

---

## The question

We know that `a` implies `c`. **Can we report that relationship while
preserving the variable shared between its premise and conclusion?**

---

## What we tell eyemind

```js
fact(a('b'))
implies(a(X), c(X))

implies(implies(X, Y), test(X, Y))
query(test(X, Y))
```

In a premise, `implies(X, Y)` inspects ordinary forward source rules.
Here it binds `X` to `a(A)` and `Y` to `c(A)`. The `A` belongs to the
inspected rule and stays shared. `implied_by(Head, Body)` similarly inspects
backward source rules.

---

## What eyemind concludes

```js
test(a(A), c(A))
```

The query selects the inspection result. Forward reasoning also derives
`c('b')` from the first two statements. Inspection itself does not need the
fact `a('b')`: removing that fact still leaves the reported rule pattern.

---

## What the proof establishes

Verdict: **checked**. The inspection step cites `source(2)`. The checker
matches the rule pattern against that source clause, checking its direction,
terms and variable sharing. The final step applies the inspecting rule.

The fixed catalogue excludes facts, queries, constraints, template-generating
rules, generated rules, and rules containing inspection goals. This keeps
the inspecting rule from reporting itself. Variables of each inspected rule
are fresh on every use. Existential conclusions require any inspected
variables used in the conclusion to be bound first.

---

## Try it

```sh
eyemind examples/rule-inspection.js
eyemind --proof examples/rule-inspection.js
eyemind -c examples/rule-inspection.js
eyemind --check-proof examples/proof/rule-inspection.js examples/rule-inspection.js
```

Replace `c(X)` with `d(X)` in the ordinary rule: the reported conclusion
changes with the source rule.
