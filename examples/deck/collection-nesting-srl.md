# Reading a nested collection

*Property paths read nested RDF lists and a blank node property.*

[collection-nesting-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/collection-nesting-srl.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/collection-nesting-srl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/collection-nesting-srl.srl) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/collection-nesting-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=collection-nesting-srl)

---

## The question

What can a rule recover from a list containing a number, a described blank node and another list?

---

## What the program says

`collection-nesting-srl.srl`:

```srl
# A nested RDF list holds a number, a described blank node and another list.
# Property paths recover the first item, the blank node property and the
# number in the inner list, showing list cells and nested collection syntax.

PREFIX : <http://example.org/collection-nesting#>

DATA {
  :root :nested ( 1 [ :p :q ] ( 2 ) ) .
}

RULE { :test :first ?first }
WHERE { :root :nested/rdf:first ?first }

RULE { :test :second ?second }
WHERE { :root :nested/rdf:rest/rdf:first ?second }

RULE { :test :secondProperty ?object }
WHERE { :root :nested/rdf:rest/rdf:first/:p ?object }

RULE { :test :thirdFirst ?item }
WHERE { :root :nested/rdf:rest/rdf:rest/rdf:first/rdf:first ?item }
```

---

## What eyemind concludes

The Turtle output contains the supplied DATA and the rule conclusions:

```ttl
PREFIX : <http://example.org/collection-nesting#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

_:b0 rdf:first 1 .
_:b0 rdf:rest _:b1 .
_:b2 :p :q .
_:b1 rdf:first _:b2 .
_:b1 rdf:rest _:b3 .
_:b4 rdf:first 2 .
_:b4 rdf:rest rdf:nil .
_:b3 rdf:first _:b4 .
_:b3 rdf:rest rdf:nil .
:root :nested _:b0 .
:test :first 1 .
:test :second _:b2 .
:test :secondProperty :q .
:test :thirdFirst 2 .
```

The first item is 1. The second is a blank node whose p property is q. The third item is itself a list whose first item is 2. Property paths follow the RDF first and rest links to each value.

The check report records, among its claims:

```js
inf(iri('http://example.org/collection-nesting#test'), iri('http://example.org/collection-nesting#first'), 1)
inf(iri('http://example.org/collection-nesting#test'), iri('http://example.org/collection-nesting#secondProperty'), iri('http://example.org/collection-nesting#q'))
inf(iri('http://example.org/collection-nesting#test'), iri('http://example.org/collection-nesting#thirdFirst'), 2)
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`. The report has no remaining obligations.
C1 checks inference steps against the compiled source clauses; C5 checks
primitive computations; C8 checks fresh witnesses; C10 checks the original
questions against the recorded call tables. The checker follows the
certificate without calling the reasoning engine.

The verdict describes the displayed claims and any listed obligations. It
does not assert that an arbitrary certificate lists every possible answer.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/collection-nesting-srl.srl
node bin/eyemind.js --proof examples/collection-nesting-srl.srl
node bin/eyemind.js --check-proof examples/proof/collection-nesting-srl.srl examples/collection-nesting-srl.srl
```
