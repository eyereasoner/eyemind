# A trade inside a list

*RDF list patterns extract a trade from a structured description.*

[good-cobbler-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/good-cobbler-srl.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/good-cobbler-srl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/good-cobbler-srl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/good-cobbler-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=good-cobbler-srl)

---

## The question

Which trade can the rules extract from Joe’s structured description?

---

## What the program says

`good-cobbler-srl.srl`:

```srl
# Joe is described by the RDF list (good Cobbler). Rules extract his trade
# and classify him as a cobbler, showing a variable inside a list pattern.

PREFIX : <http://example.org/good-cobbler#>

DATA {
  :joe :is ( :good :Cobbler ) .
}

RULE { :test :goodAt ?trade }
WHERE { ?person :is ( :good ?trade ) }

RULE { ?person :classifiedAs ?trade }
WHERE { ?person :is ( :good ?trade ) }
```

---

## What eyemind concludes

The Turtle output contains the supplied DATA and the rule conclusions:

```ttl
PREFIX : <http://example.org/good-cobbler#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

_:b0 rdf:first :good .
_:b0 rdf:rest _:b1 .
_:b1 rdf:first :Cobbler .
_:b1 rdf:rest rdf:nil .
:joe :is _:b0 .
:test :goodAt :Cobbler .
:joe :classifiedAs :Cobbler .
```

Joe’s description is the two-item RDF list (good Cobbler). A list pattern binds its second item to Cobbler, producing both the extracted goodAt value and Joe’s classification.

The check report records, among its claims:

```js
inf(iri('http://example.org/good-cobbler#test'), iri('http://example.org/good-cobbler#goodAt'), iri('http://example.org/good-cobbler#Cobbler'))
inf(iri('http://example.org/good-cobbler#joe'), iri('http://example.org/good-cobbler#classifiedAs'), iri('http://example.org/good-cobbler#Cobbler'))
```

---

## What the proof establishes

The proof is a JavaScript document over the compiled program. Its claims are
the inferred triples, written `inf(S, P, O)`; 9 steps record the firings
of the compiled rules behind the derived triples; and its certificate holds
2 `derived` listings, every fact the rules derived, and 6 `called`
tables, every answer of each call the questions make. The checker answers
the questions from those tables, expanding each call one level against the
compiled clauses, requires each listing to be closed under the rules, and
replays each listed triple's recorded firing, recomputing primitives. It
follows the certificate without calling the reasoning engine, and a step,
table or listing it does not use fails the check.

The saved report ends with `verdict('checked')`: the claims follow from the
rules and data, and they are every answer of the rule set's questions.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/good-cobbler-srl.srl
node bin/eyemind.js --proof examples/good-cobbler-srl.srl
node bin/eyemind.js --check-proof examples/proof/good-cobbler-srl.js examples/good-cobbler-srl.srl
```
