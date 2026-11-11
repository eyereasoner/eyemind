# Labels that keep their direction

*RDF 1.2 directional language strings keep their base direction through a display rule.*

[data/directional-language.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/data/directional-language.ttl) · [directional-language.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/directional-language.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/directional-language.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/directional-language.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/directional-language.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=directional-language)

---

## The question

Can display labels preserve Arabic and English writing directions?

---

## What the program says

`data/directional-language.ttl`:

```ttl
# Arabic and English welcome labels carry a language and writing direction.
# The display rule concludes new labels while preserving both annotations.
@prefix : <https://example.org/> .

:welcome :label "مرحبا"@ar--rtl, "Welcome"@en--ltr .
```

`directional-language.n3`:

```n3
# Arabic and English welcome labels carry a language and writing direction.
# The display rule concludes new labels while preserving both annotations.
@prefix : <https://example.org/> .

{ ?s :label ?label } => { ?s :displayLabel ?label } .
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```n3
@prefix : <https://example.org/> .

:welcome :displayLabel "مرحبا"@ar--rtl .
:welcome :displayLabel "Welcome"@en--ltr .
```

The rule passes the entire literal through. Both the language and the rtl or ltr direction survive in the display label.

The check report records the corresponding claims as JavaScript expressions:

```js
// Checked answers: these follow from the input program.
rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl')))
rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')))
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
node bin/eyemind.js examples/data/directional-language.ttl examples/directional-language.n3
node bin/eyemind.js --proof examples/data/directional-language.ttl examples/directional-language.n3
node bin/eyemind.js --check-proof examples/proof/directional-language.n3 examples/data/directional-language.ttl examples/directional-language.n3
```
