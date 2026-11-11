# Accepting a claim

*An RDF 1.2 triple term: a claim names a triple without asserting it, and accepting the claim asserts it.*

[data/triple-term.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/data/triple-term.ttl) · [triple-term.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/triple-term.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/triple-term.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/triple-term.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/triple-term.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=triple-term)

---

## The question

Which relationship follows when a claim about who knows whom is accepted?

---

## What the program says

`data/triple-term.ttl`:

```ttl
# Alice claims that Bob knows Carol without asserting it. Accepting the
# claim concludes the relationship; a triple-term pattern reaches inside it.
@prefix : <https://example.org/> .

:alice :claims <<( :bob :knows :carol )>> .
```

`triple-term.n3`:

```n3
# Alice claims that Bob knows Carol without asserting it. Accepting the
# claim concludes the relationship; a triple-term pattern reaches inside it.
@prefix : <https://example.org/> .

{ ?claimant :claims <<( ?s :knows ?o )>> } => { ?s :knows ?o } .
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```n3
@prefix : <https://example.org/> .

:bob :knows :carol .
```

The rule matches the subject and object inside the triple term. Mentioning the triple in the data does not assert it; the rule derives that assertion.

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
node bin/eyemind.js examples/data/triple-term.ttl examples/triple-term.n3
node bin/eyemind.js --proof examples/data/triple-term.ttl examples/triple-term.n3
node bin/eyemind.js --check-proof examples/proof/triple-term.n3 examples/data/triple-term.ttl examples/triple-term.n3
```
