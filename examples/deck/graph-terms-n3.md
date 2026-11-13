# Graph terms

*Quoted formulas are values: opaque, unquotable, and the same up to renaming.*

[graph-terms-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/graph-terms-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/graph-terms-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/graph-terms-n3.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/graph-terms-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=graph-terms-n3)

---

## The question

Notation3 quotes graphs with `{ ... }` and uses them as terms. D. Arndt and
P.-A. Champin, "Notation3: Graph Terms for RDF" (arXiv:2610.31266), give
these graph terms a semantics, with examples that this program states. When
does a quoted statement become true? Does `owl:sameAs` reach into a quote?
When are two graph terms the same? And whom does a `?x` inside a quote
stand for?

---

## What the N3 says

```n3
:bob :says { :alice :likes :pizza, :pasta } .
{ :bob :says ?x } => ?x .
{ ?x :likes :pasta } => { ?x :likes :spaghetti } .

:superman owl:sameAs :clarkKent .
:loisLane :knows { :superman :can :fly } .

:g1 :is { _:x :knows :p . :p :says { _:x a :Genius } } .
{ :g1 :is { _:y :knows :p . :p :says { _:x a :Genius } } } => { :g1 :isomorphicTo :g2 } .
{ :g1 :is { _:y :knows :p . :p :says { _:x a _:z } } } => { :g1 :isomorphicTo :g3 } .

?x :says { ?x :is :wise } .
{ :tom :says ?g } => { :tom :said ?g } .
```

The rule `{ :bob :says ?x } => ?x` concludes the graph its premise binds:
everything Bob says is true. Two further rules ask whether Lois Lane's
knowledge is about Clark Kent or about Superman.

---

## What gets compiled

```js
implies(rdf(iri("http://example.org/bob"), iri("http://example.org/says"), X), n3_unquote(X))
fact(rdf(X, iri("http://example.org/says"), graph([rdf(X, iri("http://example.org/is"), iri("http://example.org/wise"))])))
```

A rule whose conclusion is a variable asserts the triples of the formula it
is bound to. A `?x` of a fact belongs to the whole document, so the last
statement is a fact for everyone, inside its graph term too. A graph term in
a rule's premise matches a formula as a set of triples, its own blank nodes
mapped one to one to the formula's own blank nodes.

---

## What eyemind concludes

```n3
:loisLane :knowsAbout :superman .
:g1 :isomorphicTo :g2 .
:tom :said { :tom :is :wise } .
:alice :likes :pizza .
:alice :likes :pasta .
:bob :is :wise .
:alice :likes :spaghetti .
```

The check report records these among its answers:

```js
rdf(iri('http://example.org/loisLane'), iri('http://example.org/knowsAbout'), iri('http://example.org/superman'))
rdf(iri('http://example.org/g1'), iri('http://example.org/isomorphicTo'), iri('http://example.org/g2'))
rdf(iri('http://example.org/bob'), iri('http://example.org/is'), iri('http://example.org/wise'))
```

Alice likes pizza and pasta because Bob says so, and spaghetti because she
likes pasta. Lois Lane's knowledge stays about Superman: graph terms are
opaque, so `owl:sameAs` does not rewrite them. G1 and G2 differ only in the
names of their own blank nodes, so they are the same graph term; G3 has a
blank node where G1 has `:Genius`, so it is a different one. Bob is wise:
everyone says of themselves that they are wise, so Bob does, and everything
Bob says is true.

---

## What the proof establishes

The report ends with `verdict('checked_with_obligations')`. C1 checks each
step against the compiled rules, including the unquoting rule and the
matching of graph terms. The remaining obligations are `call_fidelity`: the
graph matching and unquoting helpers answer through backward search without
call tables for C10, and the manifest lists that obligation as trusted.

---

## Try it

```sh
node bin/eyemind.js examples/graph-terms-n3.n3
node bin/eyemind.js --program examples/graph-terms-n3.n3 > /tmp/graph-terms.js
node bin/eyemind.js --check-proof examples/proof/graph-terms-n3.n3 examples/graph-terms-n3.n3
```
