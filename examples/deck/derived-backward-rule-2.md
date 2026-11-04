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

Before reasoning starts, eyemind rewrites the program so that every rule is
visible up front. Each created rule gets its own number and an extra
condition, a switch, and the creating rule becomes the rule that flips both
switches:

```js
implies('true', [activated(4, []), activated(5, [])])                        // rule 1
implied_by(type('Socrates', 'Human'), [activated(4, []), 'true'])            // rule 4
implied_by(subclass_of('Human', 'Mortal'), [activated(5, []), 'true'])       // rule 5
```

`activated(4, [])` reads *"rule 4 is switched on"*. The `4` is the number of
the rule it switches on; the empty list `[]` holds values the creating rule
would hand over, and here there are none. Rules 2 and 3 are the two ordinary
forward rules, in program order. No rule is ever invented while the program
runs, so eyemind can check the whole program, created rules included, before
it starts.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
type('Socrates', 'Mortal')
t('test', 'is', 'true')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implies('true', [activated(4, []), activated(5, [])]))
clause(2, implies([type(S, A), subclass_of(A, B)], type(S, B)))
clause(3, implies(type('Socrates', 'Mortal'), t('test', 'is', 'true')))
clause(4, implied_by(type('Socrates', 'Human'), [activated(4, []), 'true']))
clause(5, implied_by(subclass_of('Human', 'Mortal'), [activated(5, []), 'true']))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(type('Socrates', 'Mortal'), clause(2), {S: 'Socrates', A: 'Human', B: 'Mortal'}, [type('Socrates', 'Human'), subclass_of('Human', 'Mortal')])
step(type('Socrates', 'Human'), clause(4), {}, [activated(4, []), 'true'])
step(activated(4, []), clause(1), {}, ['true'])
step('true', 'builtin', {}, [])
step(subclass_of('Human', 'Mortal'), clause(5), {}, [activated(5, []), 'true'])
step(activated(5, []), clause(1), {}, ['true'])
step(t('test', 'is', 'true'), clause(3), {}, [type('Socrates', 'Mortal')])
```

It has three parts:

- **The claims**: the two conclusions the proof is about.
- **The clauses**: the five rules the proof relies on, numbered as above.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *Socrates is mortal*: by rule 2, with `S` = Socrates, `A` = Human and
   `B` = Mortal, because Socrates is human and Human is a subclass of Mortal.
2. *Socrates is human*: by rule 4, because rule 4 is switched on and
   `'true'` holds.
3. *Rule 4 is switched on*: by rule 1, because `'true'` holds.
4. *`'true'` holds*: justified as `'builtin'`, one of eyemind's own primitive
   tests rather than a program line. The checker does not take it on faith:
   it decides it again itself. For `'true'` that is trivial.
5. *Human is a subclass of Mortal*: by rule 5, because rule 5 is switched on
   and `'true'` holds.
6. *Rule 5 is switched on*: by rule 1, because `'true'` holds.
7. *The test is true*: by rule 3, because Socrates is mortal.

The step for `'true'` is written once and serves every place that uses it.
Every step leans only on steps listed elsewhere in the proof, down to that
one built-in test.

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
condition('C1', 'resolution', 'ok', 6)
condition('C2', 'well_founded', 'ok', 7)
condition('C3', 'justification', 'ok', 7)
condition('C4', 'coverage', 'ok', 11)
condition('C5', 're_decision', 'ok', 1)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 9)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(7)
verified(6)
recomputed(1)
composed(0)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (6)**: the 6 steps that cite a rule really are instances of
  it. Step 1 is rule 2 with `S` = Socrates, `A` = Human, `B` = Mortal; the
  others need no values.
- **C2 well-founded (7)**: none of the 7 steps depends on itself, even
  indirectly.
- **C3 justification (7)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (11)**: the 2 claims and the 9 things the steps use are each
  backed by a step: nothing is taken for granted.
- **C5 re-decision (1)**: the one built-in step, `'true'`, was decided again
  by the checker.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (9)**: the 2 claims are conclusions of the program, and all
  7 steps serve them. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 7 steps, 6 verified against program rules and 1
recomputed, none taken on trust, for 2 claims. The verdict is **checked**:
both conclusions follow from the program. As the last comment says, this
confirms the claims; it does not say the program has no other conclusions.

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
