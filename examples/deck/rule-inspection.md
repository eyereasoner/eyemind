# Reasoning about a rule

*The rule itself can be evidence.*

[rule-inspection.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rule-inspection.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/rule-inspection.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rule-inspection.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/rule-inspection.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=rule-inspection)

---

## The question

Usually a program uses its rules to draw conclusions. Sometimes we want to
talk *about* a rule instead: "which rules does this program contain, and what
do they say?" The program here has one ordinary rule: *anything that is `a`
is also `c`*.

**Can a second rule look that rule up and report it, keeping the link between
its two halves?**

---

## What we tell eyemind

```js
fact(a('b'))
implies(a(X), c(X))

implies(implies(X, Y), test(X, Y))
query(test(X, Y))
```

`fact(...)` states something true: `b` is `a`. `implies(premise,
conclusion)` is a forward rule: whenever the premise holds, eyemind concludes
the conclusion. Capitalized names such as `X` are variables, placeholders
that stand for any value. So line 2 reads *"whatever `X` is, if `X` is `a`
then `X` is `c`."*

The third line is the unusual one. Its premise is itself `implies(X, Y)`.
Inside a premise, `implies` does not prove anything: it **looks up** the
forward rules written in the program, and sets `X` to a rule's premise and
`Y` to its conclusion. This is called *rule inspection*. (`implied_by(Head,
Body)` does the same for backward rules.)

`query(test(X, Y))` asks eyemind to report every `test(...)` it can
establish.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
test(a(A), c(A))
```

The first line is a comment saying what follows. The answer is the rule from
line 2 written as data: its premise `a(A)` and its conclusion `c(A)`. The
same `A` appears in both halves, so the answer still says *"the same thing"*
on both sides: the link between premise and conclusion is kept. The `A` is a
fresh variable, a copy of the rule's own `X`.

Forward reasoning also derives `c('b')` from the first two lines, but the
query only asks for `test(...)`. Inspection does not need the fact `a('b')`:
it reads the rule, not the facts.

---

## Which rules can be inspected

The inspecting rule could in principle find itself, which would make no
sense. To avoid that, eyemind only offers a fixed list of ordinary rules
written in the program. Facts, queries, constraints, rules that eyemind
generates internally, and rules that themselves inspect rules are left out.
So here the only rule the third line can find is line 2. Each time a rule is
inspected its variables are copied fresh, so two inspections never get
tangled up.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
test(a(A), c(A))

// Clauses: the program clauses the steps cite, by clause number.
clause(2, implies(a(X), c(X)))
clause(3, implies(implies(X, Y), test(X, Y)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(test(a(A), c(A)), clause(3), {X: a(A), Y: c(A)}, [implies(a(A), c(A))])
step(implies(a(A), c(A)), source(2), {}, [])
```

It has three parts:

- **The claim**: the answer the proof is about.
- **The clauses**: the program lines the proof relies on, numbered by their
  position in the program (the fact is clause 1, the ordinary rule clause 2,
  the inspecting rule clause 3).
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`.

Read the steps as sentences:

1. *`test(a(A), c(A))` holds* — by clause 3, with `X` being `a(A)` and `Y`
   being `c(A)`, because the program contains the rule
   `implies(a(A), c(A))`.
2. *The program contains the rule `implies(a(A), c(A))`* — justified by
   `source(2)`: this is not a fact or a calculation but a quotation of
   clause 2 of the program itself. It uses nothing else.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
test(a(A), c(A))

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 2)
condition('C2', 'well_founded', 'ok', 2)
condition('C3', 'justification', 'ok', 2)
condition('C4', 'coverage', 'ok', 2)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 3)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(2)
verified(2)
recomputed(0)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (2)**: both steps match the program. Step 1 is clause 3
  with the values shown. For step 2, the checker takes clause 2 from the
  program it was given (not from the proof's own copy) and confirms that it
  is a forward rule with premise `a(...)`, conclusion `c(...)`, and the same
  variable in both.
- **C2 well-founded (2)**: neither step depends on itself, even indirectly.
- **C3 justification (2)**: both justifications (`clause(3)` and
  `source(2)`) are of a kind the checker understands.
- **C4 coverage (2)**: the 1 claim and the 1 thing a step uses (the
  inspected rule) are each backed by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of something, so there is nothing to confront.
- **C7 relevance (3)**: the 1 claim answers the query, and both steps serve
  it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.

The statistics repeat this: 2 steps, both verified against the program, none
taken on trust. The verdict is **checked**: the reported rule really is in
the program, and the answer follows from it. It does not say the program has
no other answers.

---

## Try it

```sh
eyemind examples/rule-inspection.js
eyemind --proof examples/rule-inspection.js
eyemind -c examples/rule-inspection.js
eyemind --check-proof examples/proof/rule-inspection.js examples/rule-inspection.js
```

Replace `c(X)` with `d(X)` in the ordinary rule: the answer becomes
`test(a(A), d(A))`, following the rule as written. Delete the fact `a('b')`:
the answer stays `test(a(A), c(A))`, because inspection reads the rule, not
the facts. Add a second rule `implies(b(X), d(X))`: the query then reports
both rules, `test(a(A), c(A))` and `test(b(B), d(B))`.

---

## Takeaway

Rules are not only instructions; they can also be facts to look at. When a
rule reports on another rule, the proof points to the exact rule it read,
and the checker confirms the report matches it.
