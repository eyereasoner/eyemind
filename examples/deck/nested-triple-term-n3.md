# A reviewed claim

*Nested RDF 1.2 triple terms: one pattern reaches the triple inside a claim inside a review.*

[data/nested-triple-term-n3.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/data/nested-triple-term-n3.ttl) · [nested-triple-term-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/nested-triple-term-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/nested-triple-term-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/nested-triple-term-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/nested-triple-term-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=nested-triple-term-n3)

---

## The question

Which relationship sits inside the claim inside the review?

---

## What the program says

`data/nested-triple-term-n3.ttl`:

```ttl
# An auditor reviews a claim about who knows whom. A nested triple-term
# pattern concludes the innermost relationship without asserting the claim.
@prefix : <https://example.org/> .

:auditor :reviews <<( :alice :claims <<( :bob :knows :carol )>> )>> .
```

`nested-triple-term-n3.n3`:

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
// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`.
The checker reads the clauses from the compiled program, not from the
proof, and never calls the reasoning engine. It answers the original
questions from the proof's call tables, checking each table by expanding its
call one level against the program; it requires each `derived` listing to be
closed under the forward rules; and it replays the recorded firing of each
listed fact, computing primitives again. A step, table or listing the check
does not use fails it.

The verdict establishes that the displayed claims follow from the compiled
program and are every answer of its original questions.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/data/nested-triple-term-n3.ttl examples/nested-triple-term-n3.n3
node bin/eyemind.js --proof examples/data/nested-triple-term-n3.ttl examples/nested-triple-term-n3.n3
node bin/eyemind.js --check-proof examples/proof/nested-triple-term-n3.js examples/data/nested-triple-term-n3.ttl examples/nested-triple-term-n3.n3
```
