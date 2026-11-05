# Derived forward rule

*A rule that creates another rule, and a proof that shows both at work.*

[derived-rule.js](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-rule.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/derived-rule.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/derived-rule.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/derived-rule.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=derived-rule)

---

## The question

Minka is a cat. Charly is a dog. We want a rule that only comes into play
once a cat is around: *"if there is a cat, then from now on, whenever there
is a dog, conclude that the test is true."*

**Does the rule get switched on, and does it then draw its conclusion?**

---

## What we tell eyemind

```js
fact(type('Minka', 'Cat'))     // Minka is a cat
fact(type('Charly', 'Dog'))    // Charly is a dog

implies(type(X, 'Cat'),
  implies(type(Y, 'Dog'), t('test', 'is', 'true')))
```

`implies(premise, conclusion)` is a forward rule: whenever the premise holds,
eyemind concludes the conclusion. Here the conclusion of the outer rule is
itself a rule. So the outer rule does not add a fact; it **adds a rule**.

Capitalized names are variables. `X` belongs to the outer rule: it stands for
whichever cat is found. `Y` appears only inside the inner rule, so it belongs
to that rule alone: it stands for whichever dog is found, every time the
inner rule is used.

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
t('test', 'is', 'true')
```

The first line is a comment saying what follows. The one conclusion is the
test fact: Minka switched the inner rule on, and Charly satisfied it. Nobody
typed this fact in.

---

## How eyemind reads the rule inside a rule

Before reasoning starts, eyemind rewrites the program so that every rule is
visible up front. The inner rule becomes rule 4 with an extra condition, a
switch, and the outer rule becomes the rule that flips that switch:

```js
implies(type(X, 'Cat'), activated(4, []))                             // rule 3
implies([activated(4, []), type(Y, 'Dog')], t('test', 'is', 'true'))  // rule 4
```

`activated(4, [])` reads *"rule 4 is switched on"*. The `4` is the number of
the rule it switches on; the empty list `[]` holds the values the outer rule
hands over to the inner one. Here there are none, because the inner rule does
not mention `X`. No rule is ever invented while the program runs, so eyemind
can check the whole program, generated rules included, before it starts.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
t('test', 'is', 'true')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(type('Minka', 'Cat')))
clause(2, fact(type('Charly', 'Dog')))
clause(3, implies(type(X, 'Cat'), activated(4, [])))
clause(4, implies([activated(4, []), type(Y, 'Dog')], t('test', 'is', 'true')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(t('test', 'is', 'true'), clause(4), {Y: 'Charly'}, [activated(4, []), type('Charly', 'Dog')])
step(activated(4, []), clause(3), {X: 'Minka'}, [type('Minka', 'Cat')])
step(type('Minka', 'Cat'), clause(1), {}, [])
step(type('Charly', 'Dog'), clause(2), {}, [])
```

It has three parts:

- **The claim**: the conclusion the proof is about.
- **The clauses**: the four program rules and facts the proof relies on,
  numbered as above.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *The test is true* — by rule 4, with `Y` being Charly, because rule 4 is
   switched on and Charly is a dog.
2. *Rule 4 is switched on* — by rule 3, with `X` being Minka, because Minka is
   a cat.
3. *Minka is a cat* — fact 1; it uses nothing.
4. *Charly is a dog* — fact 2; it uses nothing.

Every step leans only on steps listed below it, down to the two facts.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
t('test', 'is', 'true')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 4)
condition('C2', 'well_founded', 'ok', 4)
condition('C3', 'justification', 'ok', 4)
condition('C4', 'coverage', 'ok', 4)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 5)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(4)
verified(4)
recomputed(0)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (4)**: each of the 4 steps really is an instance of the
  rule or fact it cites. Step 1 is rule 4 with `Y` = Charly, and step 2 is
  rule 3 with `X` = Minka.
- **C2 well-founded (4)**: no step depends on itself, even indirectly.
- **C3 justification (4)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (4)**: the 1 claim and the 3 things the steps use are each
  backed by a step: nothing is taken for granted.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (5)**: the 1 claim answers what the program asks, and all 4
  steps serve it. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 4 steps, all 4 verified against the program, none
taken on trust. The verdict is **checked**: the test fact follows from the
program. As the last comment says, this confirms the claim; it does not say
the program has no other conclusions.

---

## Try it

```sh
eyemind examples/derived-rule.js
eyemind --proof examples/derived-rule.js
eyemind -c examples/derived-rule.js
eyemind --check-proof examples/proof/derived-rule.js examples/derived-rule.js
```

Remove Minka's fact: no cat, so rule 4 is never switched on, and there is no
conclusion. Remove Charly's fact instead: rule 4 is switched on but finds no
dog. Change `'Cat'` to `'Dog'` in the outer rule: now Charly switches the
rule on *and* satisfies it.

---

## Takeaway

A rule can switch other rules on. Because eyemind writes the switched rule
down before it starts, the proof can show exactly when it was switched on and
why, and the checker can confirm both steps against the program.
