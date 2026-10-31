# Triple term in a graph

*A claim, kept in the graph that holds it.*

[rdf12-trig-triple-term.js](https://github.com/eyereasoner/eyecode/blob/main/examples/rdf12-trig-triple-term.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/rdf12-trig-triple-term.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/rdf12-trig-triple-term.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/rdf12-trig-triple-term.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground#example=rdf12-trig-triple-term)

---

## The question

The claims graph records that Alice claims Bob knows Carol, as an RDF 1.2
triple term.

**If we accept the claim, where does the new statement go?**

---

## What we tell eyecode

```js
fact(rdf(iri(ex + 'alice'), iri(ex + 'claims'),
         triple(iri(ex + 'bob'), iri(ex + 'knows'), iri(ex + 'carol')),
         iri(ex + 'claimsGraph')))

implies(rdf(_, iri(ex + 'claims'), triple(S, iri(ex + 'knows'), O), G),
        result_rdf(S, iri(ex + 'knows'), O, G))
```

RDF values are ordinary terms: `iri(Text)` for an IRI,
`literal(Text, datatype(IRI))` or `literal(Text, lang(Tag))` for a literal,
`triple(S, P, O)` for a triple term, and `rdf(S, P, O, Graph)` for a quad
in a graph, `'default_graph'` or `iri(Name)`.

The graph is a variable like the subject and the object, so the same rule
serves every graph.

---

## What eyecode concludes

Bob knows Carol, in the claims graph:

```js
result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), iri('https://example.org/claimsGraph'))
```

---

## Why: the proof in plain words

1. In the claims graph, Alice claims the triple *bob knows carol* — *fact 1*.
2. So, in that same graph, Bob knows Carol — *rule 2, with G = the claims
   graph*.

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
eyecode examples/rdf12-trig-triple-term.js                  # the results as quads
eyecode --proof examples/rdf12-trig-triple-term.js          # with their proof
eyecode examples/rdf12-trig-triple-term.js > out.js && eyecode-to-rdf out.js -o out.trig
```

`eyecode-to-rdf` and `rdf-to-eyecode` come with
[rdf-prolog-interchange](https://github.com/eyereasoner/rdf-prolog-interchange);
they turn eyecode's quads into RDF and RDF into quads.
Or open it in the [playground](https://eyereasoner.github.io/eyecode/playground#example=rdf12-trig-triple-term).
Move the claim to the default graph and run again: the conclusion moves with it.

---

## Takeaway

Accepted claims stay apart from the default graph, so you can always tell
what was concluded from claims.
