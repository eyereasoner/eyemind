# Grandparents and reverse links

*Sequential and inverse property paths derive grandparent and child-to-parent links.*

[property-paths-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/property-paths-srl.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/property-paths-srl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/property-paths-srl.srl) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/property-paths-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=property-paths-srl)

---

## The question

How can the same two parent edges give both a grandparent relation and child-to-parent links?

---

## What the program says

`property-paths-srl.srl`:

```srl
# A three-generation family gets grandparent and inverse parent links.
# Sequential and inverse property paths match two hops or reverse one edge.

PREFIX : <http://example.org/property-paths#>

DATA {
  :alice :parentOf :bob .
  :bob :parentOf :carol .
}

RULE { ?x :grandparentOf ?z }
WHERE { ?x :parentOf/:parentOf ?z }

RULE { ?child :hasParent ?parent }
WHERE { ?child ^:parentOf ?parent }
```

---

## What eyemind concludes

The Turtle output contains the supplied DATA and the rule conclusions:

```ttl
PREFIX : <http://example.org/property-paths#>

:alice :parentOf :bob .
:bob :parentOf :carol .
:alice :grandparentOf :carol .
:bob :hasParent :alice .
:carol :hasParent :bob .
```

Alice is Bob’s parent, and Bob is Carol’s parent. A two-edge path therefore makes Alice Carol’s grandparent. The inverse path produces Bob-to-Alice and Carol-to-Bob parent links.

The check report records, among its claims:

```js
inf(iri('http://example.org/property-paths#alice'), iri('http://example.org/property-paths#grandparentOf'), iri('http://example.org/property-paths#carol'))
inf(iri('http://example.org/property-paths#bob'), iri('http://example.org/property-paths#hasParent'), iri('http://example.org/property-paths#alice'))
inf(iri('http://example.org/property-paths#carol'), iri('http://example.org/property-paths#hasParent'), iri('http://example.org/property-paths#bob'))
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
node bin/eyemind.js examples/property-paths-srl.srl
node bin/eyemind.js --proof examples/property-paths-srl.srl
node bin/eyemind.js --check-proof examples/proof/property-paths-srl.srl examples/property-paths-srl.srl
```
