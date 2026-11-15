# Accepting a claim

*An RDF 1.2 triple term: a claim names a triple without asserting it, and accepting the claim asserts it.*

[data/triple-term-n3.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/data/triple-term-n3.ttl) · [triple-term-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/triple-term-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/triple-term-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/triple-term-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/triple-term-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=triple-term-n3)

---

## The question

Which relationship follows when a claim about who knows whom is accepted?

---

## What the program says

`data/triple-term-n3.ttl`:

```ttl
# Alice claims that Bob knows Carol without asserting it. Accepting the
# claim concludes the relationship; a triple-term pattern reaches inside it.
@prefix : <https://example.org/> .

:alice :claims <<( :bob :knows :carol )>> .
```

`triple-term-n3.n3`:

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
node bin/eyemind.js examples/data/triple-term-n3.ttl examples/triple-term-n3.n3
node bin/eyemind.js --proof examples/data/triple-term-n3.ttl examples/triple-term-n3.n3
node bin/eyemind.js --check-proof examples/proof/triple-term-n3.js examples/data/triple-term-n3.ttl examples/triple-term-n3.n3
```
