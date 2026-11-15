# French cities

*Which cities can reach Nantes through a small network of one-way links?*

[N3 source](https://github.com/eyereasoner/eyemind/blob/main/examples/french-cities-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/french-cities-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/french-cities-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/french-cities-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=french-cities-n3)

---

## The network

```n3
:paris :oneway :orleans, :chartres, :amiens .
:orleans :oneway :blois, :bourges .
:blois :oneway :tours .
:chartres :oneway :lemans .
:lemans :oneway :angers, :tours .
:angers :oneway :nantes .

:oneway rdfs:subPropertyOf :path .
:path a owl:TransitiveProperty .
```

There are ten directed links. One branch from Paris continues through
Chartres, Le Mans and Angers to Nantes. The branches through Orléans and
Amiens have no onward connection to Nantes in this graph.

The schema vocabulary comes from
[RDF Schema](https://www.w3.org/TR/rdf-schema/#ch_subpropertyof) and
[OWL](https://www.w3.org/TR/owl-ref/#TransitiveProperty-def).
Its meaning here is supplied by the three explicit rules below.

---

## The schema rules

```n3
{ ?property rdfs:subPropertyOf ?super . ?from ?property ?to }
  => { ?from ?super ?to } .
{ ?property rdfs:subPropertyOf ?middle . ?middle rdfs:subPropertyOf ?super }
  => { ?property rdfs:subPropertyOf ?super } .
{ ?property a owl:TransitiveProperty . ?from ?property ?via . ?via ?property ?to }
  => { ?from ?property ?to } .

{ ?city :path :nantes } log:query { ?city :canReach :nantes } .
```

The first rule makes every one-way link a path. The second propagates
subproperty declarations. The third chains paths because the data declares
`:path` transitive. The query reports only paths ending at Nantes.

eyemind compiles
the schema rules to `implies` clauses. Their property variables become
variables in the predicate position of `rdf(Subject, Predicate, Object)`.
The program implements these stated schema rules.

---

## What eyemind concludes

The check report records these answers as terms:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
result(iri('https://example.org/french-cities#angers'), iri('https://example.org/french-cities#canReach'), iri('https://example.org/french-cities#nantes'))
result(iri('https://example.org/french-cities#lemans'), iri('https://example.org/french-cities#canReach'), iri('https://example.org/french-cities#nantes'))
result(iri('https://example.org/french-cities#chartres'), iri('https://example.org/french-cities#canReach'), iri('https://example.org/french-cities#nantes'))
result(iri('https://example.org/french-cities#paris'), iri('https://example.org/french-cities#canReach'), iri('https://example.org/french-cities#nantes'))
```

Converted back to N3, they read:

```turtle
@prefix : <https://example.org/french-cities#> .

:angers :canReach :nantes .
:lemans :canReach :nantes .
:chartres :canReach :nantes .
:paris :canReach :nantes .
```

| City | A route to Nantes |
| --- | --- |
| Angers | Angers → Nantes |
| Le Mans | Le Mans → Angers → Nantes |
| Chartres | Chartres → Le Mans → Angers → Nantes |
| Paris | Paris → Chartres → Le Mans → Angers → Nantes |

Transitivity creates paths with one or more links. No rule adds a
zero-length path, so Nantes is not an answer merely for being the target.

---

## What the proof establishes

The N3 source has five integrity fuses, one for each of Orléans, Amiens,
Bourges, Blois and Tours. For example:

```n3
{ :orleans :path :nantes } => false .
```

If a path from one of those cities to Nantes is derived, the run halts.
None of these fuses fires for the supplied graph.

The proof holds the four claims, 37 steps and a certificate. Every path is
derived by forward rules, so each derived `:path` triple has a step citing
the subproperty or transitivity rule that concluded it, and each answer one
citing the query rule, clause 24. The certificate lists the derived `result`
and `rdf` facts and holds a call table for each search the questions make.
The tables for the cities without a way onward are empty, for example:

```js
called(rdf(iri('https://example.org/french-cities#amiens'), iri('https://example.org/french-cities#path'), M), [])
called(rdf(iri('https://example.org/french-cities#nantes'), iri('https://example.org/french-cities#path'), M), [])
```

The checker requires both listings to be closed under the rules, so no path
can be left out; replays every listed fact's step from its source rule;
checks each table by expanding its call one level; and requires the claims
to be exactly the answers. The saved report ends with `verdict('checked')`:
the four answers follow from the N3 source, and they are every answer of the
query, so no other city reaches Nantes.

---

## Try it

```sh
node bin/eyemind.js examples/french-cities-n3.n3
node bin/eyemind.js --to eyemind examples/french-cities-n3.n3
node bin/eyemind.js --check-proof examples/proof/french-cities-n3.js examples/french-cities-n3.n3
```

To inspect the compilation:

```sh
node bin/eyemind.js --program examples/french-cities-n3.n3 > /tmp/french-cities.js
node bin/eyemind.js --proof /tmp/french-cities.js
```

Add `:tours :oneway :nantes .` to a copy of the N3 source and recompile.
The new link makes the Tours fuse fire. The compiled program exits with
halt code 65; the ordinary N3 command reports the fuse with exit status 2.
