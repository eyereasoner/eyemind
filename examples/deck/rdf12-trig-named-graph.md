# Named graph

*Keeping conclusions where they belong.*

[rdf12-trig-named-graph.js](https://github.com/eyereasoner/eyecode/blob/main/examples/rdf12-trig-named-graph.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/rdf12-trig-named-graph.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/rdf12-trig-named-graph.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/rdf12-trig-named-graph.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground#example=rdf12-trig-named-graph)

---

## The question

A TriG document has a **named graph**, `family`, saying that Alice is Bob's
parent and Bob is Carol's.

**Who are the ancestors, and in which graph do we say so?**

---

## What we tell eyecode

```js
fact(
  rdf(iri(ex + 'alice'), iri(ex + 'parent'), iri(ex + 'bob'), iri(ex + 'family')),
  rdf(iri(ex + 'bob'), iri(ex + 'parent'), iri(ex + 'carol'), iri(ex + 'family')),
)

implies(rdf(S, iri(ex + 'parent'), O, G), result_rdf(S, iri(ex + 'ancestor'), O, G))
implies([rdf(S, iri(ex + 'parent'), M, G), rdf(M, iri(ex + 'parent'), O, G)],
        result_rdf(S, iri(ex + 'ancestor'), O, G))
```

RDF values are ordinary terms: `iri(Text)` for an IRI,
`literal(Text, datatype(IRI))` or `literal(Text, lang(Tag))` for a literal,
`triple(S, P, O)` for a triple term, and `rdf(S, P, O, Graph)` for a quad
in a graph, `'default_graph'` or `iri(Name)`.

The graph `G` is shared by the premises and the conclusion, so the
conclusions stay in the family graph.

---

## What eyecode concludes

Three ancestor links, all in the family graph:

```js
result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/bob'), iri('https://example.org/family'))
result_rdf(iri('https://example.org/bob'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family'))
result_rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/carol'), iri('https://example.org/family'))
```

---

## Why: the proof in plain words

1. Alice is Bob's parent and Bob is Carol's — *facts 1 and 2*.
2. So Alice and Bob are ancestors of their children — *rule 3*.
3. And Alice is Carol's ancestor — *rule 4, through Bob, within one graph*.

Each step names the exact line of the program it used, and the values it
filled in.

---

## Checked, not just claimed

The proof is a document of its own, and a separate checker reads it against
the program. It confirms that every step is an instance of the line it cites,
that nothing is assumed the program does not say, that no step depends on
itself, and that every step serves one of the results.

Verdict: **checked**. All 5 steps verified, and nothing taken on trust.

---

## Try it

```sh
eyecode examples/rdf12-trig-named-graph.js                  # the results as quads
eyecode --proof examples/rdf12-trig-named-graph.js          # with their proof
eyecode examples/rdf12-trig-named-graph.js > out.js && eyecode-to-rdf out.js -o out.trig
```

`eyecode-to-rdf` and `rdf-to-eyecode` come with
[rdf-prolog-interchange](https://github.com/eyereasoner/rdf-prolog-interchange);
they turn eyecode's quads into RDF and RDF into quads.
Or open it in the [playground](https://eyereasoner.github.io/eyecode/playground#example=rdf12-trig-named-graph).
Put Bob's parent link in another graph and run again: Alice is no longer Carol's ancestor, because the rule joins within one graph.

---

## Takeaway

A graph is context. Rules that carry it along keep each conclusion in the
context its evidence came from.
