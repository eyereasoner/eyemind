# French cities

*Which cities can reach Nantes through a small network of one-way links?*

[N3 source](https://github.com/eyereasoner/eyemind/blob/main/examples/french-cities.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/french-cities.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/french-cities.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/french-cities.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=french-cities)

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
// Answers: each instance of a query() that holds.
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

The saved report ends with `verdict('checked')`, with four claims and no
obligations. C1 checks the path derivations; C10 checks the original query
against the positive forward closure. The verdict certifies the four
reported positive answers. It does not certify a list of negative claims
about the other cities, nor establish answer completeness.

---

## Try it

```sh
node bin/eyemind.js examples/french-cities.n3
node bin/eyemind.js --to eyemind examples/french-cities.n3
node bin/eyemind.js --strict-proof --check-proof examples/proof/french-cities.n3 examples/french-cities.n3
```

To inspect the compilation:

```sh
node bin/eyemind.js --program examples/french-cities.n3 > /tmp/french-cities.js
node bin/eyemind.js --proof /tmp/french-cities.js
```

Add `:tours :oneway :nantes .` to a copy of the N3 source and recompile.
The new link makes the Tours fuse fire. The compiled program exits with
halt code 65; the ordinary N3 command reports the fuse with exit status 2.
