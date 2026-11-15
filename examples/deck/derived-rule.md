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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(t('test', 'is', 'true'), clause(4), {X: 'Minka', Y: 'Charly'}, [type('Minka', 'Cat'), type('Charly', 'Dog')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(t(A, B, C), [t('test', 'is', 'true')])
called(t('test', 'is', 'true'), [t('test', 'is', 'true')])
```

It has three parts:

- **The claim**: the conclusion the proof is about.
- **The step**: the firing behind the derived fact. A step reads
  `step(what, by which clause, with which values, using what)`.
- **The certificate**: the **listing** `derived(t(A, B, C), [...])` holds
  every `t` fact forward rules derived, and the **call table**
  `called(t('test', 'is', 'true'), [...])` every answer of the program's
  question, which is the head of the forward rule.

Read the step as a sentence: *the test is true, by rule 4, with `X` being
Minka and `Y` being Charly, because Minka is a cat and Charly is a dog.*
Rule 4 is the compiled inner rule, numbered as above. The cat and dog facts
are stated in the program, so they need no step of their own. The
generator's evidence is a direct premise of the conclusion.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the question
from its call table, checks that table by applying the program one level,
requires the listing to be closed under the forward rules, and replays the
step: it runs rule 4 again from the source, finding Minka's and Charly's
facts in the program. A step or table the check does not use fails it. This
is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
t('test', 'is', 'true')

verdict('checked')
```

The verdict is **checked**: the recorded claim follows from the source
program, and it is every answer of the original question. The checker reads
rule 4 from the program, not from the proof, so the derived rule's instance
is checked against its generating premise as written.

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
