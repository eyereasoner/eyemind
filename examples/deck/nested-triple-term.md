# A reviewed claim

*Nested RDF 1.2 triple terms: one pattern reaches the triple inside a claim inside a review.*

[data/nested-triple-term.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/data/nested-triple-term.ttl) · [nested-triple-term.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/nested-triple-term.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/nested-triple-term.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/nested-triple-term.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/nested-triple-term.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=nested-triple-term)

---

## The question

Which relationship sits inside the claim inside the review?

---

## What the program says

`data/nested-triple-term.ttl`:

```ttl
# An auditor reviews a claim about who knows whom. A nested triple-term
# pattern concludes the innermost relationship without asserting the claim.
@prefix : <https://example.org/> .

:auditor :reviews <<( :alice :claims <<( :bob :knows :carol )>> )>> .
```

`nested-triple-term.n3`:

```n3
# An auditor reviews a claim about who knows whom. A nested triple-term
# pattern concludes the innermost relationship without asserting the claim.
@prefix : <https://example.org/> .

{ ?reviewer :reviews <<( ?claimant :claims <<( ?s :knows ?o )>> )>> }
  => { ?s :knows ?o } .
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```n3
@prefix : <https://example.org/> .

:bob :knows :carol .
```

Unification matches both nested triple terms in a single premise. The conclusion states only the innermost relationship.

The check report records the corresponding claims as JavaScript expressions:

```js
// Checked answers: these follow from the input program.
rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))
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
node bin/eyemind.js examples/data/nested-triple-term.ttl examples/nested-triple-term.n3
node bin/eyemind.js --proof examples/data/nested-triple-term.ttl examples/nested-triple-term.n3
node bin/eyemind.js --check-proof examples/proof/nested-triple-term.js examples/data/nested-triple-term.ttl examples/nested-triple-term.n3
```
