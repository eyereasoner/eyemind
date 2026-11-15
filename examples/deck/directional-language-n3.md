# Labels that keep their direction

*RDF 1.2 directional language strings keep their base direction through a display rule.*

[data/directional-language-n3.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/data/directional-language-n3.ttl) · [directional-language-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/directional-language-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/directional-language-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/directional-language-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/directional-language-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=directional-language-n3)

---

## The question

Can display labels preserve Arabic and English writing directions?

---

## What the program says

`data/directional-language-n3.ttl`:

```ttl
# Arabic and English welcome labels carry a language and writing direction.
# The display rule concludes new labels while preserving both annotations.
@prefix : <https://example.org/> .

:welcome :label "مرحبا"@ar--rtl, "Welcome"@en--ltr .
```

`directional-language-n3.n3`:

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
// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl')))
rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`. The proof cites the program
compiled from the data and the N3 rule: clauses 1 and 2 are the two label
triples and clause 3 the display rule. Each display label has a step citing
clause 3, with the literal bound whole, language and direction included,
and each label it uses has a step citing its data triple, since the call on
`rdf` rests on derived triples. The listing `derived(rdf(A, B, C), [...])`
holds both derived triples, and the call tables every answer of the calls
on `:displayLabel` and `:label`.

The checker follows this certificate without calling the reasoning engine.
It checks each call table by applying the compiled program one level,
requires the listing to be closed under the rule, and replays each listed
triple's firing from the source. The verdict establishes that both display
labels follow from the program and are every answer of its question.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/data/directional-language-n3.ttl examples/directional-language-n3.n3
node bin/eyemind.js --proof examples/data/directional-language-n3.ttl examples/directional-language-n3.n3
node bin/eyemind.js --check-proof examples/proof/directional-language-n3.js examples/data/directional-language-n3.ttl examples/directional-language-n3.n3
```
