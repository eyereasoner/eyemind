# Socrates in Notation3

*Class membership follows the subclass hierarchy in Notation3.*

[socrates-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/socrates-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/socrates-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/socrates-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/socrates-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=socrates-n3)

---

## The question

What follows when Socrates is human and humans are mortal?

---

## What the program says

`socrates-n3.n3`:

```n3
# Socrates is human, and every human is mortal: one forward rule concludes
# that Socrates is mortal. The smallest complete N3 program.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix : <http://example.org/socrates#>.

:Socrates a :Human.
:Human rdfs:subClassOf :Mortal.

{ ?S a ?A. ?A rdfs:subClassOf ?B } => { ?S a ?B }.
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```n3
@prefix : <http://example.org/socrates#> .

:Socrates a :Mortal .
```

A forward rule follows the subclass relation and concludes that Socrates is mortal. The default N3 output reports that new triple.

The check report records the corresponding claims as JavaScript expressions:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Mortal'))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`.
The checker reads the clauses from the compiled program, not from the
proof, and never calls the reasoning engine. It answers the original
questions from the proof's call tables, checking each table by expanding its
call one level against the program; it requires each `derived` listing to be
closed under the forward rules; and it replays the recorded firing of each
listed fact, computing primitives again. A step, table or listing the check
does not use fails it.

The verdict establishes that the displayed claims follow from the compiled
program and are every answer of its original questions.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/socrates-n3.n3
node bin/eyemind.js --proof examples/socrates-n3.n3
node bin/eyemind.js --check-proof examples/proof/socrates-n3.js examples/socrates-n3.n3
```
