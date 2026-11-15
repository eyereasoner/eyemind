# Two derived backward rules

*One rule that creates two others, and a proof that shows all three at work.*

[derived-backward-rule-2.js](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-backward-rule-2.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/derived-backward-rule-2.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/derived-backward-rule-2.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/derived-backward-rule-2.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=derived-backward-rule-2)

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
])                                                           // rule 1
implied_by(type('Socrates', 'Human'), ['true', 'true'])      // rule 4
implied_by(subclass_of('Human', 'Mortal'), ['true', 'true']) // rule 5
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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(type('Socrates', 'Mortal'), clause(2), {S: 'Socrates', A: 'Human', B: 'Mortal'}, [type('Socrates', 'Human'), subclass_of('Human', 'Mortal')])
step(type('Socrates', 'Human'), clause(4), {}, ['true', 'true'])
step(t('test', 'is', 'true'), clause(3), {}, [type('Socrates', 'Mortal')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(type(A, B), [type('Socrates', 'Mortal')])
derived(t(A, B, C), [t('test', 'is', 'true')])
called(type(A, B), [type('Socrates', 'Mortal'), type('Socrates', 'Human')])
called(subclass_of('Mortal', C), [])
called(subclass_of('Human', C), [subclass_of('Human', 'Mortal')])
called(t('test', 'is', 'true'), [t('test', 'is', 'true')])
called(type('Socrates', 'Mortal'), [type('Socrates', 'Mortal')])
```

It has three parts:

- **The claims**: the two conclusions the proof is about.
- **The steps**: the firings behind the derived facts. A step reads
  `step(what, by which clause, with which values, using what)`, citing the
  rules by the numbers above.
- **The certificate**: the **listings** `derived(Pattern, Facts)` hold every
  fact forward rules derived for `type` and `t`, and each **call table**
  `called(Call, Answers)` every answer of a call made while answering the
  questions. `called(subclass_of('Mortal', C), [])` says that Mortal is a
  subclass of nothing, so the class rule has nothing more to add.

Read the steps as sentences:

1. *Socrates is mortal*: by rule 2, because Socrates is human and Human is
   a subclass of Mortal.
2. *Socrates is human*: by rule 4, using the generator's `true` premise and
   the inner rule's `true` premise.
3. *The test is true*: by rule 3, because Socrates is mortal.

`type` is a relation forward rules conclude, so the call that found
*Socrates is human* rests on derived facts, and its goal gets a step.
`subclass_of` is defined by rule 5 alone; its call table answers it, and the
checker re-runs `true` itself.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the two
questions, the heads of rules 2 and 3, from their call tables, checks each
table by applying the program one level, requires both listings to be closed
under the forward rules, and replays the step of each listed fact against
the source rules. A step or table the check does not use fails it. This is
the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
type('Socrates', 'Mortal')
t('test', 'is', 'true')

verdict('checked')
```

The verdict is **checked**: the recorded claims follow from the source
program, and they are every answer of the original questions. Rules 4 and 5
are read from the program, so each answers only through a solution of its
generating premise.

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
