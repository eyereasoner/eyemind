# Socrates in SPARQL rules

*Class membership follows the subclass hierarchy in SPARQL 1.2 RL.*

[socrates-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/socrates-srl.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/socrates-srl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/socrates-srl.srl) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/socrates-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=socrates-srl)

---

## The question

What follows from a human and a subclass relation in a DATA block?

---

## What the program says

`socrates-srl.srl`:

```srl
# Socrates is a human, and every human is mortal: a rule that follows the
# class hierarchy concludes that Socrates is mortal. Shows a DATA block and a
# forward rule; the result is the inference graph, the data included.
PREFIX : <http://example.org/socrates#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

DATA {
  :Socrates a :Human .
  :Human rdfs:subClassOf :Mortal .
}

RULE { ?x a ?super } WHERE { ?x a ?class . ?class rdfs:subClassOf ?super }
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```ttl
PREFIX : <http://example.org/socrates#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

:Socrates a :Human .
:Human rdfs:subClassOf :Mortal .
:Socrates a :Mortal .
```

The rule derives mortal class membership for Socrates. SRL’s inference graph includes both given triples and the derived membership.

The check report records the corresponding claims as JavaScript expressions:

```js
// Checked answers: these follow from the input program.
inf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Mortal'))
inf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Human'))
inf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), iri('http://example.org/socrates#Mortal'))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`. The report has no remaining obligations.
C1 checks each inference against the compiled source clauses, C5 re-decides
primitive computations, C8 checks any fresh witness, and C10 checks the
original questions against the proof's call tables. The checker follows the
certificate without calling the reasoning engine.

The verdict certifies the displayed claims; it does not assert that an
arbitrary proof lists every possible answer.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/socrates-srl.srl
node bin/eyemind.js --proof examples/socrates-srl.srl
node bin/eyemind.js --check-proof examples/proof/socrates-srl.srl examples/socrates-srl.srl
```
