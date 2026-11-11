# The cheapest listed routes

*Listed candidate routes receive total costs and the cheapest alternatives survive stratified negation.*

[dijkstra.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/dijkstra.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/dijkstra.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/dijkstra.srl) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/dijkstra-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=dijkstra-srl)

---

## The question

Which supplied candidates have the least cost among routes with the same endpoints?

---

## What the program says

`dijkstra.srl`:

```srl
# A route planner has named candidate paths with supplied segment costs.
# SET totals each candidate, a comparison marks dominated alternatives, and
# stratified NOT marks the cheapest listed paths for each pair of endpoints.

PREFIX : <http://example.org/dijkstra#>

DATA {
  :ab a :Path ; :from :A ; :to :B ; :cost 2 .
  :ac a :Path ; :from :A ; :to :C ; :cost 5 .
  :abc a :CandidatePath ; :from :A ; :via :B ; :to :C ; :leftCost 2 ; :rightCost 1 .
  :abd a :CandidatePath ; :from :A ; :via :B ; :to :D ; :leftCost 2 ; :rightCost 7 .
  :acd a :CandidatePath ; :from :A ; :via :C ; :to :D ; :leftCost 5 ; :rightCost 2 .
  :abcd a :CandidatePath ; :from :A ; :via :B ; :to :D ; :leftCost 2 ; :rightCost 3 .
}

RULE { ?path a :Path ; :cost ?total }
WHERE {
  ?path a :CandidatePath ; :leftCost ?left ; :rightCost ?right .
  SET(?total := ?left + ?right)
}

RULE { ?path :dominated true }
WHERE {
  ?path a :Path ; :from ?from ; :to ?to ; :cost ?cost .
  ?better a :Path ; :from ?from ; :to ?to ; :cost ?betterCost .
  FILTER(?betterCost < ?cost)
}

RULE { ?path :best true }
WHERE {
  ?path a :Path .
  NOT { ?path :dominated true }
}
```

---

## What eyemind concludes

The Turtle output contains the supplied DATA and the rule conclusions:

```ttl
PREFIX : <http://example.org/dijkstra#>

:ab a :Path .
:ab :from :A .
:ab :to :B .
:ab :cost 2 .
:ac a :Path .
:ac :from :A .
:ac :to :C .
:ac :cost 5 .
:abc a :CandidatePath .
:abc :from :A .
:abc :via :B .
:abc :to :C .
:abc :leftCost 2 .
:abc :rightCost 1 .
:abd a :CandidatePath .
:abd :from :A .
:abd :via :B .
:abd :to :D .
:abd :leftCost 2 .
:abd :rightCost 7 .
:acd a :CandidatePath .
:acd :from :A .
:acd :via :C .
:acd :to :D .
:acd :leftCost 5 .
:acd :rightCost 2 .
:abcd a :CandidatePath .
:abcd :from :A .
:abcd :via :B .
:abcd :to :D .
:abcd :leftCost 2 .
:abcd :rightCost 3 .
:abc a :Path .
:abc :cost 3 .
:abd a :Path .
:abd :cost 9 .
:acd a :Path .
:acd :cost 7 .
:abcd a :Path .
:abcd :cost 5 .
:abd :dominated true .
:acd :dominated true .
:ac :dominated true .
:abc :best true .
:abcd :best true .
:ab :best true .
```

The supplied costs give abc a total of 3 and the D-bound candidates abd, acd and abcd totals of 9, 7 and 5. Comparisons mark ac, abd and acd as dominated. After that relation settles, NOT selects ab, abc and abcd as the best listed routes for their endpoints.

The check report records, among its claims:

```js
inf(iri('http://example.org/dijkstra#abc'), iri('http://example.org/dijkstra#best'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))
inf(iri('http://example.org/dijkstra#abcd'), iri('http://example.org/dijkstra#best'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))
inf(iri('http://example.org/dijkstra#ab'), iri('http://example.org/dijkstra#best'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))
```

---

## What the proof establishes

The saved report ends with `verdict('checked_with_obligations')`. The report lists `call_fidelity` obligations. These claims depend on the listed obligations, and strict checking rejects them.
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
node bin/eyemind.js examples/dijkstra.srl
node bin/eyemind.js --proof examples/dijkstra.srl
node bin/eyemind.js --check-proof examples/proof/dijkstra.srl examples/dijkstra.srl
```
