# A witness for each person

*Each person gets a distinct mother and a reciprocal child relation.*

[existential.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/existential.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/existential.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/existential.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/existential.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=existential)

---

## The question

How can a rule state that each person has a mother without naming her?

---

## What the program says

`existential.n3`:

```n3
# Something exists: every person has a mother, a blank node in the rule's
# conclusion. Each firing names its own node, so ann and bob get different
# mothers, and a second rule reasons about them.
@prefix : <http://example.org/people#>.

:ann a :Person.
:bob a :Person.

{ ?p a :Person } => { ?p :mother _:m. _:m a :Woman }.
{ ?p :mother ?m } => { ?m :hasChild ?p }.
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```n3
@prefix : <http://example.org/people#> .

:ann :mother _:b0 .
_:b0 a :Woman .
:bob :mother _:b1 .
_:b1 a :Woman .
_:b0 :hasChild :ann .
_:b1 :hasChild :bob .
```

Ann and Bob each trigger a rule with a conclusion blank node. They get different witnesses, each classified as a woman. A second rule adds the reciprocal hasChild link.

The check report records the corresponding claims as JavaScript expressions:

```js
// Checked answers: these follow from the input program.
rdf(iri('http://example.org/people#ann'), iri('http://example.org/people#mother'), skolem(3, 'Bm', [iri('http://example.org/people#ann')]))
rdf(skolem(3, 'Bm', [iri('http://example.org/people#ann')]), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman'))
rdf(iri('http://example.org/people#bob'), iri('http://example.org/people#mother'), skolem(3, 'Bm', [iri('http://example.org/people#bob')]))
rdf(skolem(3, 'Bm', [iri('http://example.org/people#bob')]), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman'))
rdf(skolem(3, 'Bm', [iri('http://example.org/people#ann')]), iri('http://example.org/people#hasChild'), iri('http://example.org/people#ann'))
rdf(skolem(3, 'Bm', [iri('http://example.org/people#bob')]), iri('http://example.org/people#hasChild'), iri('http://example.org/people#bob'))
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
node bin/eyemind.js examples/existential.n3
node bin/eyemind.js --proof examples/existential.n3
node bin/eyemind.js --check-proof examples/proof/existential.js examples/existential.n3
```
