# Two derived backward rules

*One rule that creates two others, and a proof that shows all three at work.*

[derived-backward-rule-2.js](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-backward-rule-2.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/derived-backward-rule-2.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/derived-backward-rule-2.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/derived-backward-rule-2.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=derived-backward-rule-2)

---

## The question

The old textbook argument: Socrates is human, every human is mortal, so
Socrates is mortal. Here neither starting point is typed in as a plain fact.
Instead, one rule that always applies *creates* two new rules: one that says
"Socrates is human" and one that says "Human is a kind of Mortal". An ordinary
rule about kinds must then pick them up.

**Do the two created rules come into play, and is Socrates found to be
mortal?**

---

## What we tell eyemind

```js
implies('true', [
  implied_by(type('Socrates', 'Human'), 'true'),
  implied_by(subclass_of('Human', 'Mortal'), 'true'),
])

// A member of a class is also a member of its superclasses.
implies([type(S, A), subclass_of(A, B)], type(S, B))
implies(type('Socrates', 'Mortal'), t('test', 'is', 'true'))
```

There are two kinds of rule here:

- `implies(premise, conclusion)` is a **forward rule**: whenever the premise
  holds, eyemind concludes the conclusion and adds it to what it knows.
- `implied_by(conclusion, condition)` is a **backward rule**: it is used on
  demand. When eyemind needs to know whether the conclusion holds, it tries
  to show the condition.

The first rule's premise is `'true'`, which always holds, so it always fires.
Its conclusion is not a fact but a list of two backward rules; square
brackets around several items mean *all of these*. So the first rule adds
two rules to the program. Each has the condition `'true'`, so once added it
simply answers yes: "Socrates is human", and "Human is a subclass of Mortal".

Capitalized names are **variables**, blanks that stand for whatever fits. The
second forward rule says: if `S` is of kind `A`, and `A` is a subclass of
`B`, then `S` is also of kind `B`. The last rule turns "Socrates is mortal"
into a test fact, `t('test', 'is', 'true')`.

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
type('Socrates', 'Mortal')
t('test', 'is', 'true')
```

The first line is a comment saying what follows. Socrates is mortal, and so
the test fact holds. Neither was typed in: both came from the rules the first
rule created.

---

## How eyemind reads a rule that creates rules

Before reasoning starts, eyemind compiles both potential backward rules,
numbered 4 and 5 after the three stated rules:

```js
implies('true', [
  implied_by(type('Socrates', 'Human'), 'true'),
  implied_by(subclass_of('Human', 'Mortal'), 'true'),
])                                                                    // rule 1
implied_by(type('Socrates', 'Human'), ['true', 'true'])                  // rule 4
implied_by(subclass_of('Human', 'Mortal'), ['true', 'true'])             // rule 5
```

The generator succeeds unconditionally and derives both rule instances.
Each certificate body contains the generator's premise followed by the
inner body's premise. Both are `true` here, so the same primitive evidence
serves twice. There are no intermediate enabling facts or proof steps. All
potential rules participate in dependency analysis before reasoning starts.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
type('Socrates', 'Mortal')
t('test', 'is', 'true')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implies('true', [implied_by(type('Socrates', 'Human'), 'true'), implied_by(subclass_of('Human', 'Mortal'), 'true')]))
clause(2, implies([type(S, A), subclass_of(A, B)], type(S, B)))
clause(3, implies(type('Socrates', 'Mortal'), t('test', 'is', 'true')))
clause(4, implied_by(type('Socrates', 'Human'), ['true', 'true']))
clause(5, implied_by(subclass_of('Human', 'Mortal'), ['true', 'true']))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(type('Socrates', 'Mortal'), clause(2), {S: 'Socrates', A: 'Human', B: 'Mortal'}, [type('Socrates', 'Human'), subclass_of('Human', 'Mortal')])
step(type('Socrates', 'Human'), clause(4), {}, ['true', 'true'])
step('true', 'builtin', {}, [])
step(subclass_of('Human', 'Mortal'), clause(5), {}, ['true', 'true'])
step(t('test', 'is', 'true'), clause(3), {}, [type('Socrates', 'Mortal')])
```

It has three parts:

- **The claims**: the two conclusions the proof is about.
- **The clauses**: the five rules the proof relies on, numbered as above.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *Socrates is mortal*: by rule 2, because Socrates is human and Human is
   a subclass of Mortal.
2. *Socrates is human*: by rule 4, using the generator's `true` premise and
   the inner rule's `true` premise.
3. *`true` holds*: the primitive succeeds, and the checker decides it again.
4. *Human is a subclass of Mortal*: by rule 5, using the same two premises.
5. *The test is true*: by rule 3, because Socrates is mortal.

The `true` step is written once and serves every use of that primitive.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
type('Socrates', 'Mortal')
t('test', 'is', 'true')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 4)
condition('C2', 'well_founded', 'ok', 5)
condition('C3', 'justification', 'ok', 5)
condition('C4', 'coverage', 'ok', 9)
condition('C5', 're_decision', 'ok', 1)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 7)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(5)
verified(4)
recomputed(1)
composed(0)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each condition reports what the checker verified:

- **C1 resolution (4)**: each rule or fact step matches the compiled
  source clause, including every generating premise.
- **C2 well-foundedness (5)**: no step depends on itself.
- **C3 justification (5)**: each step uses a recognized justification.
- **C4 coverage (9)**: all 2 claims and 7 premise uses have evidence.
- **C5 re-decision (1)**: the primitive `true` is decided again.
- **C6 boundary consistency (0)**: no absence or collection is taken on trust.
- **C7 relevance (7)**: the 2 claims answer the program and all 5 steps
  serve those claims.
- **C8 witness integrity (0)**: this example introduces no existential witness.

The report records 5 steps, 4 verified against program clauses and one
primitive recomputed. The verdict is **checked**: the recorded claims follow from
the source program. It establishes no completeness claim.

---

## Try it

```sh
eyemind examples/derived-backward-rule-2.js
eyemind --proof examples/derived-backward-rule-2.js
eyemind -c examples/derived-backward-rule-2.js
eyemind --check-proof examples/proof/derived-backward-rule-2.js examples/derived-backward-rule-2.js
```

Remove either of the two created rules, for instance the `subclass_of` one:
the class rule then has nothing to combine, and eyemind reports no
conclusions at all. Change `'Mortal'` to `'Philosopher'` in that created
rule instead: eyemind concludes `type('Socrates', 'Philosopher')`, but the
test fact no longer follows, because it asks for a mortal Socrates.

---

## Takeaway

One rule can set up several others at once. Each created rule still has to
earn its place: its proof cites the creating condition directly, and the
checker verifies those premises against the source.
