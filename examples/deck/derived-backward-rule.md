# Derived backward rule

*An inverse relation becomes a rule that answers questions.*

[derived-backward-rule.js](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-backward-rule.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/derived-backward-rule.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/derived-backward-rule.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/derived-backward-rule.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=derived-backward-rule)

---

## The question

"Parent of" and "child of" are two sides of the same relationship: if Alice
is Bob's parent, then Bob is Alice's child. Such a pair is called an
*inverse* pair. We tell eyemind that the two relations are inverses, and that
Alice is Bob's parent. We never say that Bob is Alice's child.

**Can eyemind turn the inverse pair into a rule of its own, and use it to
find out who Bob's parent is?**

---

## What we tell eyemind

```js
fact(inv_of('parentOf', 'childOf'))
fact(t('alice', 'parentOf', 'bob'))

// For each pair of inverse relations, a rule that reverses one into the other.
implies(inv_of(P, Q),
  implied_by(t(X, Q, Y), t(Y, P, X)))

// A child has its parent as a parent.
implies(t(X, 'childOf', Y), t(X, 'hasParent', Y))
```

- `fact(…)` states something plainly true. `t(subject, relation, object)` is
  a simple sentence: `t('alice', 'parentOf', 'bob')` reads *Alice is parent
  of Bob*.
- Capitalized names such as `P`, `Q`, `X` and `Y` are variables: placeholders
  that take whatever values make the rule fit.
- `implies(condition, conclusion)` is a **forward rule**: whenever the
  condition holds, eyemind adds the conclusion.
- `implied_by(conclusion, condition)` is a **backward rule**: a definition
  that eyemind consults only when a question needs it.

The first rule is special: its conclusion is itself a backward rule. It reads
*for every inverse pair P and Q, X stands in relation Q to Y whenever Y
stands in relation P to X*. `P` and `Q` are filled in from the inverse pair
when the outer rule fires; `X` and `Y` appear only inside the new rule, so
they stay free and can stand for any two people each time it answers a
question.

The last rule says: *if X is a child of Y, then X has Y as a parent*.

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
t('bob', 'hasParent', 'alice')
```

The first line is a comment saying what follows. The one conclusion is that
Bob has Alice as a parent. To reach it, the last rule had to ask *is Bob a
child of anyone?* No fact says so; the backward rule made from the inverse
pair answered it by turning *Alice is parent of Bob* around.

---

## How eyemind reads the rule inside a rule

Before reasoning starts, eyemind rewrites the program so that every rule is
visible up front. The inner rule becomes rule 5 with an extra condition, a
switch, and the outer rule becomes the rule that flips that switch:

```js
implies(inv_of(P, Q), activated(5, [Q, P]))                 // rule 3
implied_by(t(X, Q, Y), [activated(5, [Q, P]), t(Y, P, X)])  // rule 5
```

`activated(5, [Q, P])` reads *"rule 5 is switched on, for these values of Q
and P"*. The `5` is the number of the rule it switches on; the list `[Q, P]`
holds the values the outer rule hands over to the inner one, here the two
relation names. So rule 5 only answers `childOf` questions, by reversing
`parentOf` sentences, after the inverse-pair fact has switched it on for
exactly that pair. No rule is ever invented while the program runs, so
eyemind can check the whole program, generated rules included, before it
starts.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
t('bob', 'hasParent', 'alice')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(inv_of('parentOf', 'childOf')))
clause(2, fact(t('alice', 'parentOf', 'bob')))
clause(3, implies(inv_of(P, Q), activated(5, [Q, P])))
clause(4, implies(t(X, 'childOf', Y), t(X, 'hasParent', Y)))
clause(5, implied_by(t(X, Q, Y), [activated(5, [Q, P]), t(Y, P, X)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(t('bob', 'hasParent', 'alice'), clause(4), {X: 'bob', Y: 'alice'}, [t('bob', 'childOf', 'alice')])
step(t('bob', 'childOf', 'alice'), clause(5), {X: 'bob', Q: 'childOf', Y: 'alice', P: 'parentOf'}, [activated(5, ['childOf', 'parentOf']), t('alice', 'parentOf', 'bob')])
step(activated(5, ['childOf', 'parentOf']), clause(3), {P: 'parentOf', Q: 'childOf'}, [inv_of('parentOf', 'childOf')])
step(inv_of('parentOf', 'childOf'), clause(1), {}, [])
step(t('alice', 'parentOf', 'bob'), clause(2), {}, [])
```

It has three parts:

- **The claim**: the conclusion the proof is about.
- **The clauses**: the program's two facts and three rules, numbered as
  above, with the rule inside a rule already rewritten.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *Bob has Alice as a parent* — by rule 4, with `X` being Bob and `Y` being
   Alice, because Bob is a child of Alice.
2. *Bob is a child of Alice* — by rule 5, with `Q` being childOf and `P`
   being parentOf, because rule 5 is switched on for that pair and Alice is
   parent of Bob.
3. *Rule 5 is switched on for childOf and parentOf* — by rule 3, because
   parentOf and childOf are inverses.
4. *parentOf and childOf are inverses* — fact 1; it uses nothing.
5. *Alice is parent of Bob* — fact 2; it uses nothing.

Every step leans only on steps listed below it, down to the two facts.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
t('bob', 'hasParent', 'alice')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 5)
condition('C2', 'well_founded', 'ok', 5)
condition('C3', 'justification', 'ok', 5)
condition('C4', 'coverage', 'ok', 5)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 6)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(5)
verified(5)
recomputed(0)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (5)**: each of the 5 steps really is an instance of the
  rule or fact it cites. The checker compares against the rules it rewrites
  from the source program itself, not against the clause lines the proof
  displays, so a proof cannot switch rule 5 on without the inverse-pair fact.
- **C2 well-founded (5)**: no step depends on itself, even indirectly.
- **C3 justification (5)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (5)**: the 1 claim and the 4 things the steps use are each
  backed by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (6)**: the 1 claim answers what the program asks, and all 5
  steps serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 5 steps, all 5 verified against the program, none
taken on trust. The verdict is **checked**: Bob has Alice as a parent follows
from the program. It confirms this claim; it does not say the program has no
other conclusions.

---

## Try it

```sh
eyemind examples/derived-backward-rule.js
eyemind --proof examples/derived-backward-rule.js
eyemind -c examples/derived-backward-rule.js
eyemind --check-proof examples/proof/derived-backward-rule.js examples/derived-backward-rule.js
```

Remove the inverse-pair fact: rule 5 is never switched on, nobody is known to
be anyone's child, and eyemind reports no conclusions. Add
`fact(t('alice', 'parentOf', 'carol'))` instead: the same derived rule now
also concludes `t('carol', 'hasParent', 'alice')`.

---

## Takeaway

A rule can teach eyemind a new way to answer questions. The new rule is part
of the program from the start, so every answer it gives comes with steps the
checker can trace back to the rule that created it.
