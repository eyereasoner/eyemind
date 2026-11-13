# Who supplied a statement?

*A named reifier links an asserted statement to its author and recording date.*

[annotation-evidence-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/annotation-evidence-srl.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/annotation-evidence-srl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/annotation-evidence-srl.srl) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/annotation-evidence-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=annotation-evidence-srl)

---

## The question

Can the statement, its identifier, its author and its recording date all be recovered?

---

## What the program says

`annotation-evidence-srl.srl`:

```srl
# A named statement records who supplied Alice's name and on which date.
# Rules recover the reifier, its author and its date, showing RDF 1.2
# annotations and triple-term patterns alongside the asserted statement.

PREFIX : <http://example.org/annotation-evidence#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

DATA {
  :a :name "Alice" ~ :t {| :statedBy :bob ; :recorded "2021-07-07"^^xsd:date |} .
}

RULE { :test :hasStatement true }
WHERE { :a :name "Alice" }

RULE { :test :hasNamedStatement ?statement }
WHERE { ?statement rdf:reifies <<(:a :name "Alice")>> }

RULE { :test :statementAuthor ?who }
WHERE {
  ?statement rdf:reifies <<(:a :name "Alice")>> .
  ?statement :statedBy ?who .
}

RULE { :test :statementDate ?date }
WHERE {
  ?statement rdf:reifies <<(:a :name "Alice")>> .
  ?statement :recorded ?date .
}
```

---

## What eyemind concludes

The Turtle output contains the supplied DATA and the rule conclusions:

```ttl
PREFIX : <http://example.org/annotation-evidence#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

:a :name "Alice" .
:t rdf:reifies <<( :a :name "Alice" )>> .
:t :statedBy :bob .
:t :recorded "2021-07-07"^^xsd:date .
:test :hasStatement true .
:test :hasNamedStatement :t .
:test :statementAuthor :bob .
:test :statementDate "2021-07-07"^^xsd:date .
```

The name statement is asserted. The named reifier t identifies that statement and records Bob as its author and 7 July 2021 as its date. Triple-term patterns let the rules join those pieces of evidence.

The check report records, among its claims:

```js
inf(iri('http://example.org/annotation-evidence#test'), iri('http://example.org/annotation-evidence#hasNamedStatement'), iri('http://example.org/annotation-evidence#t'))
inf(iri('http://example.org/annotation-evidence#test'), iri('http://example.org/annotation-evidence#statementAuthor'), iri('http://example.org/annotation-evidence#bob'))
inf(iri('http://example.org/annotation-evidence#test'), iri('http://example.org/annotation-evidence#statementDate'), literal('2021-07-07', datatype('http://www.w3.org/2001/XMLSchema#date')))
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
node bin/eyemind.js examples/annotation-evidence-srl.srl
node bin/eyemind.js --proof examples/annotation-evidence-srl.srl
node bin/eyemind.js --check-proof examples/proof/annotation-evidence-srl.srl examples/annotation-evidence-srl.srl
```
