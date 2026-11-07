# Derived forward rule

*A rule that creates another rule, and a proof that shows both at work.*

[derived-rule.js](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-rule.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/derived-rule.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/derived-rule.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/derived-rule.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=derived-rule)

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

Before reasoning starts, eyemind compiles the potential inner rule as rule
4 and checks all its dependencies. Its certificate body includes the outer
premise:

```js
implies(type(X, 'Cat'), implies(type(Y, 'Dog'), t('test', 'is', 'true'))) // rule 3
implies([type(X, 'Cat'), type(Y, 'Dog')], t('test', 'is', 'true'))        // rule 4
```

When the outer premise succeeds for Minka, rule 4 gets an instance with that
evidence. `Y` stays local and is fresh whenever the instance is used. The
proof cites Minka's cat fact and Charly's dog fact directly; there is no
intermediate enabling fact. Negation and collection still use the complete
dependency graph built before reasoning starts.

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
clause(3, implies(type(X, 'Cat'), implies(type(Y, 'Dog'), t('test', 'is', 'true'))))
clause(4, implies([type(X, 'Cat'), type(Y, 'Dog')], t('test', 'is', 'true')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(t('test', 'is', 'true'), clause(4), {X: 'Minka', Y: 'Charly'}, [type('Minka', 'Cat'), type('Charly', 'Dog')])
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

1. *The test is true* — by rule 4, with `X` being Minka and `Y` being
   Charly, because Minka is a cat and Charly is a dog.
2. *Minka is a cat* — fact 1; it uses nothing.
3. *Charly is a dog* — fact 2; it uses nothing.

The generator's evidence is a direct premise of the conclusion. The checker
can verify it from the source without reconstructing a reasoning run.

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
condition('C1', 'resolution', 'ok', 3)
condition('C2', 'well_founded', 'ok', 3)
condition('C3', 'justification', 'ok', 3)
condition('C4', 'coverage', 'ok', 3)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 4)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(3)
verified(3)
recomputed(0)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each condition reports what the checker verified:

- **C1 resolution (3)**: each rule or fact step matches the compiled
  source clause, including every generating premise.
- **C2 well-foundedness (3)**: no step depends on itself.
- **C3 justification (3)**: each step uses a recognized justification.
- **C4 coverage (3)**: all 1 claims and 2 premise uses have evidence.
- **C5 re-decision (0)**: there are no primitive calculations to repeat.
- **C6 boundary consistency (0)**: no absence or collection is taken on trust.
- **C7 relevance (4)**: the 1 claims answer the program and all 3 steps
  serve those claims.
- **C8 witness integrity (0)**: this example introduces no existential witness.

The report records 3 steps, 3 verified against program clauses. The verdict is **checked**: the recorded claims follow from
the source program. It establishes no completeness claim.

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

A rule can derive another rule. Every potential rule is checked before
reasoning, and every use cites the creating condition and its own premises.
The checker verifies this evidence directly against the source program.
