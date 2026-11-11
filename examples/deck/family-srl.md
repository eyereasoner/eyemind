# Ancestry by forward closure

*Recursive forward ancestry over a three-generation family tree.*

[family.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/family.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/family.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/family-srl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/family-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=family-srl)

---

## The question

Which ancestor links follow from a family chain three generations long?

---

## What the program says

`family.srl`:

```srl
# A family tree: parents, and ancestors as parents of parents, to any depth.
# The recursive rule runs until nothing new follows, so Ann is found to be an
# ancestor of Dee three generations down. Shows recursion.
PREFIX : <http://example.org/family#>

DATA {
  :ann :parentOf :bob .
  :bob :parentOf :cid .
  :cid :parentOf :dee .
}

RULE { ?x :ancestorOf ?y } WHERE { ?x :parentOf ?y }
RULE { ?x :ancestorOf ?z } WHERE { ?x :parentOf ?y . ?y :ancestorOf ?z }
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```ttl
PREFIX : <http://example.org/family#>

:ann :parentOf :bob .
:bob :parentOf :cid .
:cid :parentOf :dee .
:ann :ancestorOf :bob .
:bob :ancestorOf :cid .
:cid :ancestorOf :dee .
:ann :ancestorOf :cid .
:bob :ancestorOf :dee .
:ann :ancestorOf :dee .
```

The first rule turns each parent link into ancestry. The recursive rule extends those links until no new ancestors follow. SRL output includes the three base parent links and six ancestor links.

The check report records the corresponding claims as JavaScript expressions:

```js
// Checked answers: these follow from the input program.
inf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#bob'))
inf(iri('http://example.org/family#bob'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#cid'))
inf(iri('http://example.org/family#cid'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#dee'))
inf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#cid'))
inf(iri('http://example.org/family#bob'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#dee'))
inf(iri('http://example.org/family#ann'), iri('http://example.org/family#parentOf'), iri('http://example.org/family#bob'))
inf(iri('http://example.org/family#bob'), iri('http://example.org/family#parentOf'), iri('http://example.org/family#cid'))
inf(iri('http://example.org/family#cid'), iri('http://example.org/family#parentOf'), iri('http://example.org/family#dee'))
inf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#dee'))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`. The report has no remaining obligations.
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
node bin/eyemind.js examples/family.srl
node bin/eyemind.js --proof examples/family.srl
node bin/eyemind.js --check-proof examples/proof/family-srl.js examples/family.srl
```
