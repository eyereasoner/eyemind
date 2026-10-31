# Annotated claims

*Two sources disagree. Which one do we follow, and why?*

[rdf12-annotated-claims.js](https://github.com/eyereasoner/eyecode/blob/main/examples/rdf12-annotated-claims.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/rdf12-annotated-claims.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/rdf12-annotated-claims.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/rdf12-annotated-claims.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground#example=rdf12-annotated-claims)

---

## The question

The transport authority says the bridge is **closed**, with confidence 98.
An anonymous post says it is **open**, with confidence 35. The authority's
trust score is 95, the post's 20. Each claim is an RDF 1.2 reifier of its
status triple.

**Should we cross the bridge?**

---

## What we tell eyecode

- A claim is an asserted status, a reifier of it, its source, and a score:
  confidence times trust.
- A claim's rank is one more than the number of claims that score higher.
- The top claim decides, but only when its score reaches 8000; otherwise the
  bridge must be checked by hand.

Numbers in RDF are typed literals whose value is text. `number_chars` reads
the text as a number, and spells a computed number back as text:

```js
implied_by(integer_value(literal(Text, datatype(integer)), N),
           [atom_chars(Text, Chars), number_chars(N, Chars)])
```

RDF values are ordinary terms: `iri(Text)` for an IRI,
`literal(Text, datatype(IRI))` or `literal(Text, lang(Tag))` for a literal,
`triple(S, P, O)` for a triple term, and `rdf(S, P, O, Graph)` for a quad
in a graph, `'default_graph'` or `iri(Name)`.

---

## What eyecode concludes

The decision, and the ranked evidence behind it:

```js
result_rdf(iri('https://example.org/bridge'), iri('https://example.org/decision'), iri('https://example.org/avoid_bridge'), 'default_graph')
result_rdf(iri('https://example.org/bridge'), iri('https://example.org/trustedSource'), iri('https://example.org/transportAuthority'), 'default_graph')
result_rdf(iri('https://example.org/bridge'), iri('https://example.org/score'), literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/closed'), iri('https://example.org/rank'), literal('1', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/closed'), iri('https://example.org/assertedBy'), iri('https://example.org/transportAuthority'), 'default_graph')
result_rdf(iri('https://example.org/closed'), iri('https://example.org/score'), literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/open'), iri('https://example.org/rank'), literal('2', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/open'), iri('https://example.org/assertedBy'), iri('https://example.org/anonymousPost'), 'default_graph')
result_rdf(iri('https://example.org/open'), iri('https://example.org/score'), literal('700', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
```

---

## Why: the proof in plain words

1. The authority's claim scores 98 × 95 = 9310; the post's 35 × 20 = 700 —
   *the claim rule, with the multiplications recomputed*.
2. No claim scores higher than 9310, so *closed* ranks first; one does for
   700, so *open* ranks second — *the rank rule*.
3. 9310 reaches 8000, and *closed* means avoid the bridge — *the decision
   rule*.

Each step names the exact line of the program it used, and the values it
filled in.

---

## Checked, with obligations

- **60 steps** for 9 results: 36 verified against the program lines they
  cite, and 22 calculations, comparisons and number readings recomputed.
- **2 steps are taken on trust**: the two **`collected`** obligations, the
  lists of higher scores used for each rank, `[]` for 9310 and `[9310]` for
  700. That each list is complete is recorded, not proved.
- The checker tries to refute both against the evidence and finds no
  contradiction.

Verdict: **checked_with_obligations**.

---

## Try it

```sh
eyecode examples/rdf12-annotated-claims.js                  # the results as quads
eyecode --proof examples/rdf12-annotated-claims.js          # with their proof
eyecode examples/rdf12-annotated-claims.js > out.js && eyecode-to-rdf out.js -o out.ttl
```

`eyecode-to-rdf` and `rdf-to-eyecode` come with
[rdf-interchange](https://github.com/eyereasoner/rdf-interchange);
they turn eyecode's quads into RDF and RDF into quads.
Or open it in the [playground](https://eyereasoner.github.io/eyecode/playground#example=rdf12-annotated-claims).
Lower the authority's confidence to 80 and run again: 7600 is below the threshold, and the decision becomes `verify_manually`.

---

## Takeaway

When sources conflict, the reasons for following one of them can be written
down, computed, ranked and checked, not just asserted.
