# Nested triple terms

*A claim inside a review, and the fact inside the claim.*

[rdf12-nested-triple-term.js](https://github.com/eyereasoner/eyecode/blob/main/examples/rdf12-nested-triple-term.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/rdf12-nested-triple-term.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/rdf12-nested-triple-term.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/rdf12-nested-triple-term.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground#example=rdf12-nested-triple-term)

---

## The question

An auditor reviews Alice's claim that Bob knows Carol. That is a triple term
inside a triple term: the review is about the claim, and the claim is about
the relationship. None of it is asserted: the data only says that the auditor
reviews something.

**Can one rule reach the relationship two levels down?**

---

## What we tell eyecode

```js
fact(rdf(iri(ex + 'auditor'), iri(ex + 'reviews'),
         triple(iri(ex + 'alice'), iri(ex + 'claims'),
                triple(iri(ex + 'bob'), iri(ex + 'knows'), iri(ex + 'carol'))),
         'default_graph'))

implies(
  rdf(_, iri(ex + 'reviews'), triple(_, iri(ex + 'claims'), triple(S, iri(ex + 'knows'), O)), G),
  result_rdf(S, iri(ex + 'knows'), O, G),
)
```

RDF values are ordinary terms: `iri(Text)` for an IRI,
`literal(Text, datatype(IRI))` or `literal(Text, lang(Tag))` for a literal,
`triple(S, P, O)` for a triple term, and `rdf(S, P, O, Graph)` for a quad
in a graph, `'default_graph'` or `iri(Name)`.

Triple terms nest like any other terms, so one pattern can describe the whole
shape.

---

## What eyecode concludes

The innermost relationship, asserted:

```js
result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), 'default_graph')
```

---

## Why: the proof in plain words

1. The auditor reviews Alice's claim that Bob knows Carol — *fact 1*.
2. So Bob knows Carol — *rule 2, matching through both levels at once*.

Each step names the exact line of the program it used, and the values it
filled in.

---

## Checked, not just claimed

The proof is a document of its own, and a separate checker reads it against
the program. It confirms that every step is an instance of the line it cites,
that nothing is assumed the program does not say, that no step depends on
itself, and that every step serves one of the results.

Verdict: **checked**. All 2 steps verified, and nothing taken on trust.

---

## Try it

```sh
eyecode examples/rdf12-nested-triple-term.js                # the results as quads
eyecode --proof examples/rdf12-nested-triple-term.js        # with their proof
eyecode examples/rdf12-nested-triple-term.js > out.js && eyecode-to-rdf out.js -o out.ttl
```

`eyecode-to-rdf` and `rdf-to-eyecode` come with
[rdf-interchange](https://github.com/eyereasoner/rdf-interchange);
they turn eyecode's quads into RDF and RDF into quads.
Or open it in the [playground](https://eyereasoner.github.io/eyecode/playground#example=rdf12-nested-triple-term).
Change the inner triple to say that Bob knows Dave, and the conclusion follows the change.

---

## Takeaway

Nesting is no obstacle: the shape of the data is the shape of the pattern.
