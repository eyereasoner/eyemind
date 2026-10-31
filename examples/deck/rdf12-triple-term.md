# Triple term

*Talking about a statement without making it.*

[rdf12-triple-term.js](https://github.com/eyereasoner/eyecode/blob/main/examples/rdf12-triple-term.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/rdf12-triple-term.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/rdf12-triple-term.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/rdf12-triple-term.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground#example=rdf12-triple-term)

---

## The question

Alice claims that Bob knows Carol. RDF 1.2 can say that with a **triple
term**, `<<( bob knows carol )>>`: the triple is named, the way a quoted
sentence is, but not asserted.

**If we accept Alice's claims, what do we learn?**

---

## What we tell eyecode

```js
const ex = 'https://example.org/'

fact(rdf(iri(ex + 'alice'), iri(ex + 'claims'),
         triple(iri(ex + 'bob'), iri(ex + 'knows'), iri(ex + 'carol')), 'default_graph'))

implies(rdf(_, iri(ex + 'claims'), triple(S, iri(ex + 'knows'), O), G),
        result_rdf(S, iri(ex + 'knows'), O, G))
```

RDF values are ordinary terms: `iri(Text)` for an IRI,
`literal(Text, datatype(IRI))` or `literal(Text, lang(Tag))` for a literal,
`triple(S, P, O)` for a triple term, and `rdf(S, P, O, Graph)` for a quad
in a graph, `'default_graph'` or `iri(Name)`.

The rule looks *inside* the triple term with an ordinary pattern: no special
syntax, just unification.

---

## What eyecode concludes

Bob knows Carol, now as a statement of its own:

```js
result_rdf(iri('https://example.org/bob'), iri('https://example.org/knows'), iri('https://example.org/carol'), 'default_graph')
```

---

## Why: the proof in plain words

1. Alice claims the triple *bob knows carol* — *fact 1*.
2. So Bob knows Carol — *rule 2, with S = bob, O = carol, G = the default
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
eyecode examples/rdf12-triple-term.js                       # the results as quads
eyecode --proof examples/rdf12-triple-term.js               # with their proof
eyecode examples/rdf12-triple-term.js > out.js && eyecode-to-rdf out.js -o out.ttl
```

`eyecode-to-rdf` and `rdf-to-eyecode` come with
[rdf-prolog-interchange](https://github.com/eyereasoner/rdf-prolog-interchange);
they turn eyecode's quads into RDF and RDF into quads.
Or open it in the [playground](https://eyereasoner.github.io/eyecode/playground#example=rdf12-triple-term).
Add a second claim about who knows whom and run again: the rule asserts it too.

---

## Takeaway

A claim and a fact are different things, and RDF 1.2 can keep them apart.
Which claims to accept is a rule you write down, and the proof shows it.
