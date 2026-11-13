# Quantifier scopes

*An existential of the document reaches into quoted formulas, unless one
declares its own.*

[quantifier-scopes-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/quantifier-scopes-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/quantifier-scopes-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/quantifier-scopes-n3.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/quantifier-scopes-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=quantifier-scopes-n3)

---

## The question

A report quotes that someone saw a comet, and the document asserts that
this someone is an astronomer. A rumor quotes that someone waved. Which
source quotes a known astronomer?

---

## What the N3 says

```n3
@forSome :someone .
:report :says { :someone :saw :comet } .
:someone a :Astronomer .

:rumor :says {
    @forSome :someone .
    :someone :waved :hello
} .

{ ?source :says { ?who :saw :comet } . ?who a :Astronomer }
    => { ?source :credibleObserver ?who } .
{ ?source :says { ?who :waved :hello } . ?who a :Astronomer }
    => { ?source :wavingAstronomer ?who } .
```

A declaration binds its IRI in its formula and in the formulas inside it.
The document's `:someone` is therefore one individual, quoted and asserted
alike. The rumor's formula declares `:someone` again, which shadows the
outer one: its waver is a different, local individual.

---

## What gets compiled

```js
fact(rdf(iri("http://example.org/report"), iri("http://example.org/says"), graph([rdf(bnode('n3', "someone"), iri("http://example.org/saw"), iri("http://example.org/comet"))])))
fact(rdf(bnode('n3', "someone"), iri("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), iri("http://example.org/Astronomer")))
fact(rdf(iri("http://example.org/rumor"), iri("http://example.org/says"), graph([rdf(qbnode("someone_2.2"), iri("http://example.org/waved"), iri("http://example.org/hello"))])))
```

The document's existential is one constant, `bnode('n3', "someone")`, in the
report's graph term and in the asserted fact. The rumor's own existential
is a variable of its graph term, `qbnode(...)`. A rule variable such as
`?who` never stands for a graph term's own variable, so the rumor's waver
cannot be named outside its quote.

---

## What eyemind concludes

```n3
:report :credibleObserver _:b0 .
```

The check report records the answer with the document's existential:

```js
rdf(iri('http://example.org/report'), iri('http://example.org/credibleObserver'), bnode('n3', 'someone'))
```

The rumor's waver is no known astronomer, so nothing follows about it.

---

## What the proof establishes

The report ends with `verdict('checked_with_obligations')`. C1 matches the
step's premises against the source facts, which share the term
`bnode('n3', 'someone')`; the graph term is matched by a helper that
answers through backward search, which leaves a `call_fidelity` obligation,
trusted in the manifest.

---

## Try it

```sh
node bin/eyemind.js examples/quantifier-scopes-n3.n3
node bin/eyemind.js --program examples/quantifier-scopes-n3.n3 > /tmp/quantifier-scopes.js
node bin/eyemind.js --check-proof examples/proof/quantifier-scopes-n3.n3 examples/quantifier-scopes-n3.n3
```
