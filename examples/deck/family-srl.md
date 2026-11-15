# Ancestry by forward closure

*Recursive forward ancestry over a three-generation family tree.*

[family-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/family-srl.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/family-srl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/family-srl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/family-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=family-srl)

---

## The question

Which ancestor links follow from a family chain three generations long?

---

## What the program says

`family-srl.srl`:

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
// Checked answers: these follow from the input program and are every answer of its questions.
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

The proof holds the nine claims, 15 steps and a certificate. The rules are
forward rules, so each derived fact has a step citing the clause of the
compiled program that fired. A DATA triple is clause 1, 3 or 5 and rests on
nothing; Ann's ancestry of Cid comes from the recursive rule, clause 8:

```js
step(rdf(iri('http://example.org/family#ann'), iri('http://example.org/family#parentOf'), iri('http://example.org/family#bob')), clause(1), {}, [])
step(inf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#cid')), clause(8), {X: iri('http://example.org/family#ann'), Y: iri('http://example.org/family#bob'), Z: iri('http://example.org/family#cid')}, [rdf(iri('http://example.org/family#ann'), iri('http://example.org/family#parentOf'), iri('http://example.org/family#bob')), rdf(iri('http://example.org/family#bob'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#cid'))])
```

The certificate has two **listings**, `derived(inf(A, B, C), [...])` and
`derived(rdf(A, B, C), [...])`, every fact the rules derived, and five
**call tables**, such as the one showing that Dee is an ancestor of no one:

```js
called(rdf(iri('http://example.org/family#dee'), iri('http://example.org/family#ancestorOf'), F), [])
```

The checker requires each listing to be closed under the rules, replays the
step of every listed fact from its source rule, checks each table by
expanding its call one level, and requires the claims to be exactly the
answers. It never calls the reasoner. The saved report ends with
`verdict('checked')`: the nine triples follow from the rules, and they are
every answer of the program's questions.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/family-srl.srl
node bin/eyemind.js --proof examples/family-srl.srl
node bin/eyemind.js --check-proof examples/proof/family-srl.js examples/family-srl.srl
```
