# Reasoning about a rule

*The rule itself can be evidence.*

[rule-inspection.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rule-inspection.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/rule-inspection.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rule-inspection.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/rule-inspection.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=rule-inspection)

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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(test(a(B), c(B)), clause(3), {X: a(B), Y: c(B)}, [implies(a(B), c(B))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(test(C, D), [test(a(B), c(B))])
called(test(A, B), [test(a(C), c(C))])
```

It has three parts:

- **The claim**: the answer the proof is about.
- **The step**: one, for the one derived fact. A step reads
  `step(what, by which clause, with which values, using what)`, with clauses
  numbered by their position in the program (the fact is clause 1, the
  ordinary rule clause 2, the inspecting rule clause 3).
- **The certificate**: `derived(test(C, D), ...)` lists every `test` fact
  the rules derive, here the one pattern, and `called(test(A, B), ...)`
  every answer of the query. The answer keeps its variable: it is a pattern
  that holds for every value of its variable, and listings, tables and steps
  compare patterns up to the renaming of their variables, so `test(a(A),
  c(A))` and `test(a(B), c(B))` are the same answer.

Read the step as a sentence: *`test(a(B), c(B))` holds* — by clause 3, with
`X` being `a(B)` and `Y` being `c(B)`, because the program contains the rule
`implies(a(B), c(B))`. That use needs no step of its own: it is not a fact
or a calculation but a quotation of clause 2 of the program itself, which
the checker reads from the program.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the question.** It expands `test(X, Y)` one level: the
  listed pattern gives the table's one answer.
- **It checks the listing is closed.** It answers the inspection
  `implies(X, Y)` from the program's catalogue of inspectable rules, in
  source order, each renamed apart. The catalogue holds only clause 2, so
  clause 3 gives only `test(a(X), c(X))`, which is listed up to the
  renaming of its variable.
- **It replays the listed fact.** It re-runs clause 3 from no bindings: the
  inspection is answered from the catalogue, from the program it was given
  and not from the proof, and gives exactly the recorded step.
- **It compares the claim with the answer.** The claim is the answer, up to
  the renaming of its variable, and every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
test(a(A), c(A))

verdict('checked')
```

The verdict is **checked**: the reported rule really is in the program, the
answer follows from it, and it is every answer of the query.

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
