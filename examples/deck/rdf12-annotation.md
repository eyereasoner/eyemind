# Annotation

*Who said it, and when.*

[rdf12-annotation.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-annotation.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/rdf12-annotation.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rdf12-annotation.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/rdf12-annotation.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=rdf12-annotation)

---

## The question

The data says Alice's name is "Alice". It also has a **reifier**, `claim1`,
that stands for that statement through `rdf:reifies` and records that Carol
stated it on 15 January 2025. That is how RDF 1.2 annotates a triple.

**Can we recover the statement together with its annotations?**

---

## What we tell eyemind

```js
implies(
  [
    rdf(S, P, O, 'default_graph'),                                // asserted
    rdf(Reifier, iri(reifies), triple(S, P, O), 'default_graph'), // and reified
    rdf(Reifier, iri(ex + 'statedBy'), Source, 'default_graph'),
    rdf(Reifier, iri(ex + 'recorded'), Date, 'default_graph'),
  ],
  annotated_claim(S, P, O, Reifier, Source, Date),
)
```

A second rule writes each annotated claim back as four quads.

RDF values are ordinary terms: `iri(Text)` for an IRI,
`literal(Text, datatype(IRI))` or `literal(Text, lang(Tag))` for a literal,
`triple(S, P, O)` for a triple term, and `rdf(S, P, O, Graph)` for a quad
in a graph, `'default_graph'` or `iri(Name)`.

The date stays `literal('2025-01-15', datatype(xsd + 'date'))`: its text and
its datatype travel together, so it returns to RDF unchanged.

---

## What eyemind concludes

The triple with its reifier and both annotations:

```js
result_rdf(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string')), 'default_graph')
result_rdf(iri('https://example.org/claim1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/alice'), iri('https://example.org/name'), literal('Alice', datatype('http://www.w3.org/2001/XMLSchema#string'))), 'default_graph')
result_rdf(iri('https://example.org/claim1'), iri('https://example.org/statedBy'), iri('https://example.org/carol'), 'default_graph')
result_rdf(iri('https://example.org/claim1'), iri('https://example.org/recorded'), literal('2025-01-15', datatype('http://www.w3.org/2001/XMLSchema#date')), 'default_graph')
```

---

## Why: the proof in plain words

1. Alice's name is "Alice", claim1 reifies that triple, Carol stated it and it
   was recorded on 2025-01-15 — *facts 1 to 4*.
2. So it is an annotated claim — *rule 5, which needs the triple to be
   asserted as well as reified*.
3. So the four quads follow — *rule 6*.

Each step names the exact line of the program it used, and the values it
filled in.

---

## Checked, not just claimed

The proof is a document of its own, and a separate checker reads it against
the program. It confirms that every step is an instance of the line it cites,
that nothing is assumed the program does not say, that no step depends on
itself, and that every step serves one of the results.

Verdict: **checked**. All 9 steps verified, and nothing taken on trust.

---

## Try it

```sh
eyemind examples/rdf12-annotation.js                        # the results as quads
eyemind --proof examples/rdf12-annotation.js                # with their proof
eyemind examples/rdf12-annotation.js > out.js && eyemind-to-rdf out.js -o out.ttl
```

`eyemind-to-rdf` and `rdf-to-eyemind` come with
[rdf-interchange](https://github.com/eyereasoner/rdf-interchange);
they turn eyemind's quads into RDF and RDF into quads.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=rdf12-annotation).
Remove the asserted name triple and run again: the reifier alone is not enough, and nothing follows.

---

## Takeaway

An annotation is data about a statement, and rules can insist that the
statement itself holds before they use it.
