# Ancestors in a named graph

*Ancestors derived within a TriG named graph, each conclusion kept in its named-graph formula.*

[data/trig-named-graph-n3.trig](https://github.com/eyereasoner/eyemind/blob/main/examples/data/trig-named-graph-n3.trig) · [trig-named-graph-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/trig-named-graph-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/trig-named-graph-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/trig-named-graph-n3.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/trig-named-graph-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=trig-named-graph-n3)

---

## The question

How can ancestor conclusions stay attached to their family graph?

---

## What the program says

`data/trig-named-graph-n3.trig`:

```trig
# Alice is Bob's parent and Bob is Carol's in the family named graph.
# The loader represents its contents as a quoted graph:content formula.
# Two rules conclude the three ancestor links in formulas with the same name;
# none of those links is asserted in the default graph.
@prefix : <https://example.org/> .

:family {
  :alice :parent :bob .
  :bob :parent :carol .
}
```

`trig-named-graph-n3.n3`:

```n3
# Alice is Bob's parent and Bob is Carol's in the family named graph.
# The loader represents its contents as a quoted graph:content formula.
# Two rules conclude the three ancestor links in formulas with the same name;
# none of those links is asserted in the default graph.
@prefix : <https://example.org/> .
@prefix graph: <https://eyereasoner.github.io/eyemind/graph#> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

{
  ?g graph:content ?data .
  ?data log:includes { ?s :parent ?o } .
} => { ?g graph:content { ?s :ancestor ?o } } .

{
  ?g graph:content ?data .
  ?data log:includes { ?s :parent ?m . ?m :parent ?o } .
} => { ?g graph:content { ?s :ancestor ?o } } .
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```n3
@prefix : <https://example.org/> .
@prefix graph: <https://eyereasoner.github.io/eyemind/graph#> .

:family graph:content { :alice :ancestor :bob } .
:family graph:content { :bob :ancestor :carol } .
:family graph:content { :alice :ancestor :carol } .
```

The loader writes the TriG family graph as a graph:content formula. log:includes matches parent links only inside that formula. Each conclusion is a new formula with the same graph name: Alice is an ancestor of Bob and Carol, and Bob of Carol. These formulas describe named-graph content; their enclosed triples are not default-graph assertions.

The check report records the corresponding claims as JavaScript expressions:

```js
// Answers checked subject to the obligations below.
rdf(iri('https://example.org/family'), iri('https://eyereasoner.github.io/eyemind/graph#content'), graph([rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/bob'))]))
rdf(iri('https://example.org/family'), iri('https://eyereasoner.github.io/eyemind/graph#content'), graph([rdf(iri('https://example.org/bob'), iri('https://example.org/ancestor'), iri('https://example.org/carol'))]))
rdf(iri('https://example.org/family'), iri('https://eyereasoner.github.io/eyemind/graph#content'), graph([rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/carol'))]))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`. C10 certifies the original questions, so the claims are every answer, and strict checking accepts the proof.
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
node bin/eyemind.js examples/data/trig-named-graph-n3.trig examples/trig-named-graph-n3.n3
node bin/eyemind.js --proof examples/data/trig-named-graph-n3.trig examples/trig-named-graph-n3.n3
node bin/eyemind.js --check-proof examples/proof/trig-named-graph-n3.n3 examples/data/trig-named-graph-n3.trig examples/trig-named-graph-n3.n3
```
