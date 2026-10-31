# Directional language

*Arabic runs right to left. The data should say so.*

[rdf12-directional-language.js](https://github.com/eyereasoner/eyecode/blob/main/examples/rdf12-directional-language.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/rdf12-directional-language.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/rdf12-directional-language.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/rdf12-directional-language.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground#example=rdf12-directional-language)

---

## The question

A welcome label exists in Arabic, مرحبا, and in English, *Welcome*. Arabic
is written right to left, English left to right. RDF 1.2 lets a language
string carry that **base direction**: `"مرحبا"@ar--rtl`.

**Can a rule derive display labels without losing the direction?**

---

## What we tell eyecode

```js
fact(
  rdf(iri(ex + 'welcome'), iri(ex + 'label'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph'),
  rdf(iri(ex + 'welcome'), iri(ex + 'label'), literal('Welcome', lang('en', 'ltr')), 'default_graph'),
)

implies(rdf(S, iri(ex + 'label'), Label, G), result_rdf(S, iri(ex + 'displayLabel'), Label, G))
```

RDF values are ordinary terms: `iri(Text)` for an IRI,
`literal(Text, datatype(IRI))` or `literal(Text, lang(Tag))` for a literal,
`triple(S, P, O)` for a triple term, and `rdf(S, P, O, Graph)` for a quad
in a graph, `'default_graph'` or `iri(Name)`. A directional string is `literal(Text, lang(Tag, Direction))`.

---

## What eyecode concludes

Two display labels, each with its language and direction:

```js
result_rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph')
result_rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')), 'default_graph')
```

---

## Why: the proof in plain words

1. The Arabic label is right to left — *fact 1* — so it is a display label —
   *rule 3*.
2. The English label is left to right — *fact 2* — so it is one too —
   *rule 3*.

Each step names the exact line of the program it used, and the values it
filled in.

---

## Checked, not just claimed

The proof is a document of its own, and a separate checker reads it against
the program. It confirms that every step is an instance of the line it cites,
that nothing is assumed the program does not say, that no step depends on
itself, and that every step serves one of the results.

Verdict: **checked**. All 4 steps verified, and nothing taken on trust.

---

## Try it

```sh
eyecode examples/rdf12-directional-language.js              # the results as quads
eyecode --proof examples/rdf12-directional-language.js      # with their proof
eyecode examples/rdf12-directional-language.js > out.js && eyecode-to-rdf out.js -o out.ttl
```

`eyecode-to-rdf` and `rdf-to-eyecode` come with
[rdf-interchange](https://github.com/eyereasoner/rdf-interchange);
they turn eyecode's quads into RDF and RDF into quads.
Or open it in the [playground](https://eyereasoner.github.io/eyecode/playground#example=rdf12-directional-language).
Add a Hebrew label, `literal('ברוכים הבאים', lang('he', 'rtl'))`, and run again.

---

## Takeaway

A rule that passes a value on whole cannot lose part of it: the direction
arrives on the screen as it left the data.
