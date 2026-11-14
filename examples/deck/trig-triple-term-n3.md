# Accepting a named-graph claim

*A triple term inside a named graph, asserted in a formula named for the graph that holds the claim.*

[data/trig-triple-term-n3.trig](https://github.com/eyereasoner/eyemind/blob/main/examples/data/trig-triple-term-n3.trig) · [trig-triple-term-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/trig-triple-term-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/trig-triple-term-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/trig-triple-term-n3.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/trig-triple-term-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=trig-triple-term-n3)

---

## The question

Where does an accepted claim belong when its source is a named graph?

---

## What the program says

`data/trig-triple-term-n3.trig`:

```trig
# The claims named graph records Alice's claim that Bob knows Carol.
# The loader quotes that graph in a graph:content formula. Accepting its
# claim concludes the relationship in another formula with the same graph
# name, preserving its separation from default-graph assertions.
@prefix : <https://example.org/> .

:claimsGraph {
  :alice :claims <<( :bob :knows :carol )>> .
}
```

`trig-triple-term-n3.n3`:

```n3
# The claims named graph records Alice's claim that Bob knows Carol.
# The loader quotes that graph in a graph:content formula. Accepting its
# claim concludes the relationship in another formula with the same graph
# name, preserving its separation from default-graph assertions.
@prefix : <https://example.org/> .
@prefix graph: <https://eyereasoner.github.io/eyemind/graph#> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

{
  ?g graph:content ?data .
  ?data log:includes { ?claimant :claims <<( ?s :knows ?o )>> } .
} => { ?g graph:content { ?s :knows ?o } } .
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```n3
@prefix : <https://example.org/> .
@prefix graph: <https://eyereasoner.github.io/eyemind/graph#> .

:claimsGraph graph:content { :bob :knows :carol } .
```

The loader quotes the claimsGraph contents as a graph:content formula. The rule matches the claim inside that formula and concludes Bob knows Carol in a new formula attached to claimsGraph. It preserves the graph name and does not assert the enclosed relationship in the default graph.

The check report records the corresponding claims as JavaScript expressions:

```js
// Answers checked subject to the obligations below.
rdf(iri('https://example.org/claimsGraph'), iri('https://eyereasoner.github.io/eyemind/graph#content'), graph([rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))]))
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
node bin/eyemind.js examples/data/trig-triple-term-n3.trig examples/trig-triple-term-n3.n3
node bin/eyemind.js --proof examples/data/trig-triple-term-n3.trig examples/trig-triple-term-n3.n3
node bin/eyemind.js --check-proof examples/proof/trig-triple-term-n3.n3 examples/data/trig-triple-term-n3.trig examples/trig-triple-term-n3.n3
```
