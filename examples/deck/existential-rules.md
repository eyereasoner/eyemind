# Existential rules

*Saying that something exists, without knowing what it is, and without mixing it up with anything else.*

[existential-rules.js](https://github.com/eyereasoner/eyemind/blob/main/examples/existential-rules.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/existential-rules.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/existential-rules.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/existential-rules.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=existential-rules)

---

## The question

Some rules conclude that something exists without saying what it is:

- every person has a parent, even when nobody knows who;
- every customer who ordered something has an invoice, not yet numbered;
- two colleagues meet, at some meeting.

**How can a reasoner keep track of such unknowns** without confusing one
with another, or with anything it already knows?

---

## What we tell eyemind

```js
fact(person('ann'), person('bob'))                                    // clauses 1, 2
implies(person(X), has_parent(X, P))                                  // clause 3

fact(has_parent('dan', 'eve'), has_parent('fay', 'eve'))                           // clauses 4, 5
implies([has_parent(X, P), has_parent(Y, P), not_identical(X, Y)], sibling(X, Y))  // clause 6

fact(ordered('carl', 'lamp'), ordered('carl', 'desk'), ordered('dora', 'chair'))  // clauses 7, 8, 9
implies(ordered(C, Item), invoice_for(C, I))                                      // clause 10
implies(invoice_for(C, I), sent(I))                                               // clause 11

fact(colleagues('ann', 'dora'))                                       // clause 12
implies(colleagues(X, Y), [meeting(M), attends(M, X), attends(M, Y)]) // clause 13
```

- `fact(...)` states things true outright; one `fact` line with several
  items gives one numbered **clause** per item.
- `implies(premise, conclusion)` is a **forward rule**: whenever the premise
  holds, eyemind adds the conclusion. A premise or conclusion in square
  brackets is a list of parts that go together.
- Capitalized names are **variables**: they stand for whatever value makes
  the rule fit.
- `not_identical(X, Y)` is a **built-in test**: eyemind decides it itself
  (are X and Y different?) instead of looking it up in facts.

A variable that appears in a rule's conclusion but not in its premise is an
unknown: an *existential*. In rule 3, `P` is *some* parent of `X`; in rule
10, `I` is *some* invoice for `C`; in rule 13, `M` is *some* meeting of `X`
and `Y`. In rule 11, by contrast, `I` comes from the premise, so it is not
an unknown.

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
has_parent('ann', skolem(3, 'P', ['ann']))
has_parent('bob', skolem(3, 'P', ['bob']))
sibling('dan', 'fay')
sibling('fay', 'dan')
invoice_for('carl', skolem(10, 'I', ['carl']))
invoice_for('dora', skolem(10, 'I', ['dora']))
sent(skolem(10, 'I', ['carl']))
sent(skolem(10, 'I', ['dora']))
meeting(skolem(13, 'M', ['ann', 'dora']))
attends(skolem(13, 'M', ['ann', 'dora']), 'ann')
attends(skolem(13, 'M', ['ann', 'dora']), 'dora')
```

Each unknown became a **Skolem term**, a made-up name for "the one that
exists here", written `skolem(Rule, Variable, Values)`.
`skolem(3, 'P', ['ann'])` reads *the `P` of rule 3, for Ann*. The values
are those of the conclusion's other variables when the rule fired: for rule
10 only `C` (Carl), not the item he ordered; for rule 13 both `X` and `Y`.
Such an invented name is also called a *witness*: it stands witness for the
thing that exists.

---

## One witness per firing

Each time a rule applies to particular values is called a *firing*.

- **Ann and Bob each get a parent of their own**, the `P` of rule 3 for Ann
  and for Bob. Had they shared one, the sibling rule would have made them
  siblings by accident. Only Dan and Fay, whose parent the data names, are
  siblings.
- **Carl ordered twice, and gets one invoice.** The invoice depends on Carl
  alone, not on what he ordered, so both orders give the same term.
- **The meeting is one meeting.** The three conclusions of one firing
  share their witness, the `M` of rule 13 for Ann and Dora.
- **Invented values are values.** The `sent` rule uses the invoices like any
  other value. Whenever a rule meets the same values again, it gives back
  the same term, so reasoning comes to an end.

---

## Never a clash

A Skolem term names the rule and the unknown it stands for, and the values it
depends on, so it cannot be mistaken for anything else:

- not for a name in your data, which says nothing of rule 3's `P`;
- not for another unknown, which belongs to another rule, another variable or
  other values.

And it is the same in every run: run the program twice, or read one run's
output into another, and the same unknown has the same name.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
has_parent('ann', skolem(3, 'P', ['ann']))
has_parent('bob', skolem(3, 'P', ['bob']))
sibling('dan', 'fay')
sibling('fay', 'dan')
invoice_for('carl', skolem(10, 'I', ['carl']))
invoice_for('dora', skolem(10, 'I', ['dora']))
sent(skolem(10, 'I', ['carl']))
sent(skolem(10, 'I', ['dora']))
meeting(skolem(13, 'M', ['ann', 'dora']))
attends(skolem(13, 'M', ['ann', 'dora']), 'ann')
attends(skolem(13, 'M', ['ann', 'dora']), 'dora')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(person('ann')))
clause(2, fact(person('bob')))
clause(3, implies(person(X), has_parent(X, P)))
clause(4, fact(has_parent('dan', 'eve')))
clause(5, fact(has_parent('fay', 'eve')))
clause(6, implies([has_parent(X, P), has_parent(Y, P), not_identical(X, Y)], sibling(X, Y)))
clause(7, fact(ordered('carl', 'lamp')))
clause(9, fact(ordered('dora', 'chair')))
clause(10, implies(ordered(C, Item), invoice_for(C, I)))
clause(11, implies(invoice_for(C, I), sent(I)))
clause(12, fact(colleagues('ann', 'dora')))
clause(13, implies(colleagues(X, Y), [meeting(M), attends(M, X), attends(M, Y)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(has_parent('ann', skolem(3, 'P', ['ann'])), clause(3), {X: 'ann', P: skolem(3, 'P', ['ann'])}, [person('ann')])
step(person('ann'), clause(1), {}, [])
step(has_parent('bob', skolem(3, 'P', ['bob'])), clause(3), {X: 'bob', P: skolem(3, 'P', ['bob'])}, [person('bob')])
step(person('bob'), clause(2), {}, [])
step(sibling('dan', 'fay'), clause(6), {X: 'dan', P: 'eve', Y: 'fay'}, [has_parent('dan', 'eve'), has_parent('fay', 'eve'), not_identical('dan', 'fay')])
step(has_parent('dan', 'eve'), clause(4), {}, [])
step(has_parent('fay', 'eve'), clause(5), {}, [])
step(not_identical('dan', 'fay'), 'builtin', {}, [])
step(sibling('fay', 'dan'), clause(6), {X: 'fay', P: 'eve', Y: 'dan'}, [has_parent('fay', 'eve'), has_parent('dan', 'eve'), not_identical('fay', 'dan')])
step(not_identical('fay', 'dan'), 'builtin', {}, [])
step(invoice_for('carl', skolem(10, 'I', ['carl'])), clause(10), {C: 'carl', Item: 'lamp', I: skolem(10, 'I', ['carl'])}, [ordered('carl', 'lamp')])
step(ordered('carl', 'lamp'), clause(7), {}, [])
step(invoice_for('dora', skolem(10, 'I', ['dora'])), clause(10), {C: 'dora', Item: 'chair', I: skolem(10, 'I', ['dora'])}, [ordered('dora', 'chair')])
step(ordered('dora', 'chair'), clause(9), {}, [])
step(sent(skolem(10, 'I', ['carl'])), clause(11), {C: 'carl', I: skolem(10, 'I', ['carl'])}, [invoice_for('carl', skolem(10, 'I', ['carl']))])
step(sent(skolem(10, 'I', ['dora'])), clause(11), {C: 'dora', I: skolem(10, 'I', ['dora'])}, [invoice_for('dora', skolem(10, 'I', ['dora']))])
step(meeting(skolem(13, 'M', ['ann', 'dora'])), clause(13), {X: 'ann', Y: 'dora', M: skolem(13, 'M', ['ann', 'dora'])}, [colleagues('ann', 'dora')])
step(colleagues('ann', 'dora'), clause(12), {}, [])
step(attends(skolem(13, 'M', ['ann', 'dora']), 'ann'), clause(13), {X: 'ann', Y: 'dora', M: skolem(13, 'M', ['ann', 'dora'])}, [colleagues('ann', 'dora')])
step(attends(skolem(13, 'M', ['ann', 'dora']), 'dora'), clause(13), {X: 'ann', Y: 'dora', M: skolem(13, 'M', ['ann', 'dora'])}, [colleagues('ann', 'dora')])
```

It has three parts:

- **The claims**: the 11 conclusions the proof is about.
- **The clauses**: the program clauses the proof relies on, by number.
  Clause 8, Carl's desk order, is missing: it would only give Carl the same
  invoice again, so no step needs it (`eyemind --unused` reports it).
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. In the values, an
  invented thing is an ordinary value: `P: skolem(3, 'P', ['ann'])`.

Two kinds of justification occur:

- `clause(N)`: the step is an instance of program clause N, with the
  variables standing for the values shown.
- `'builtin'`: a built-in test, here `not_identical`. It cites no clause and
  uses nothing; the checker simply decides it again.

Read the steps as sentences:

1. *Ann has the parent `skolem(3, 'P', ['ann'])`*: by rule 3, with `X` =
   Ann and `P` that invented name, because Ann is a person.
2. *Ann is a person*: fact 1.
3. *Bob has the parent `skolem(3, 'P', ['bob'])`*: by rule 3, because Bob
   is a person.
4. *Bob is a person*: fact 2.
5. *Dan and Fay are siblings*: by rule 6, with `P` = Eve, because both have
   Eve as parent and Dan and Fay are different.
6. *Dan's parent is Eve*: fact 4.
7. *Fay's parent is Eve*: fact 5.
8. *Dan and Fay are different*: a built-in test.
9. *Fay and Dan are siblings*: by rule 6 the other way round, reusing steps
   7 and 6.
10. *Fay and Dan are different*: a built-in test.
11. *Carl has the invoice `skolem(10, 'I', ['carl'])`*: by rule 10, with
    `Item` = lamp, because Carl ordered a lamp.
12. *Carl ordered a lamp*: fact 7.
13. *Dora has the invoice `skolem(10, 'I', ['dora'])`*: by rule 10, because
    Dora ordered a chair.
14. *Dora ordered a chair*: fact 9.
15. *Carl's invoice is sent*: by rule 11, because of step 11.
16. *Dora's invoice is sent*: by rule 11, because of step 13.
17. *There is the meeting `skolem(13, 'M', ['ann', 'dora'])`*: by rule 13,
    because Ann and Dora are colleagues.
18. *Ann and Dora are colleagues*: fact 12.
19. *Ann attends that meeting*: by rule 13, the same firing.
20. *Dora attends that meeting*: by rule 13, the same firing.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
has_parent('ann', skolem(3, 'P', ['ann']))
has_parent('bob', skolem(3, 'P', ['bob']))
sibling('dan', 'fay')
sibling('fay', 'dan')
invoice_for('carl', skolem(10, 'I', ['carl']))
invoice_for('dora', skolem(10, 'I', ['dora']))
sent(skolem(10, 'I', ['carl']))
sent(skolem(10, 'I', ['dora']))
meeting(skolem(13, 'M', ['ann', 'dora']))
attends(skolem(13, 'M', ['ann', 'dora']), 'ann')
attends(skolem(13, 'M', ['ann', 'dora']), 'dora')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 18)
condition('C2', 'well_founded', 'ok', 20)
condition('C3', 'justification', 'ok', 20)
condition('C4', 'coverage', 'ok', 26)
condition('C5', 're_decision', 'ok', 2)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 31)
condition('C8', 'witness_integrity', 'ok', 7)

// Proof statistics: recorded steps and how they were checked.
steps(20)
verified(18)
recomputed(2)
composed(0)
trusted(0)
claims(11)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (18)**: the 18 clause steps really are instances of the
  clauses they cite, with the values shown.
- **C2 well-founded (20)**: none of the 20 steps depends on itself, even
  indirectly.
- **C3 justification (20)**: all 20 steps say how they were justified, in a
  form the checker understands.
- **C4 coverage (26)**: the 11 claims and the 15 things the steps use are
  each backed by a step: nothing is taken for granted.
- **C5 re-decision (2)**: the 2 `not_identical` tests were decided again by
  the checker itself, and they hold.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (31)**: the 11 claims are what the program concludes, and
  all 20 steps serve them. There is no padding.
- **C8 witness integrity (7)**: the 7 steps that invent a name (steps 1, 3,
  11, 13, 17, 19 and 20) were checked. For each, the checker recomputes the
  Skolem term from the rule, the variable and the values it depends on, and
  confirms that the step uses exactly that name. A proof cannot slip in a
  real name, or another firing's witness, where an unknown belongs.

The statistics repeat this: 20 steps, 18 verified against the program, 2
recomputed, none taken on trust. The verdict is **checked**: all 11
conclusions follow from the program. As the last comment says, this confirms
the claims; it does not say the program has no other conclusions.

---

## Try it

```sh
eyemind examples/existential-rules.js            # the conclusions
eyemind --proof examples/existential-rules.js    # with the proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=existential-rules).
Add `person('dan')` to the first `fact` line and run again: Dan gets a
parent witness of his own as well, beside Eve, because the rule says only
that some parent exists. Every later clause moves up one number, so the
names change too: Dan's parent is `skolem(4, 'P', ['dan'])`, and Carl's
invoice becomes `skolem(11, 'I', ['carl'])`.

---

## Takeaway

An existential rule says that something exists. eyemind names each such
something by a Skolem function of what the rule knew: the same activation
always gives the same name, and the name can never be mistaken for anything
else.
