# N3 family queries

*Write ancestry in Notation3, run it in eyemind, and write the answers back as N3.*

[N3 source](https://github.com/eyereasoner/eyemind/blob/main/examples/family-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/family-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/family-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/family-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=family-n3)

---

## The question

Ann is Bob's parent, and Bob is Cara's parent. Who descends from Ann?
The answer needs both a direct connection and a chain of connections.

The playground and command line run the N3 file directly. Use
`eyemind --program examples/family-n3.n3` to inspect the eyemind rules
it compiles.

---

## What the N3 says

```n3
@prefix : <https://example.org/family#> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

:ann :parent :bob .
:bob :parent :cara .

{ ?person :ancestor ?descendant } <= { ?person :parent ?descendant } .
{ ?person :ancestor ?descendant } <= {
  ?person :parent ?child .
  ?child :ancestor ?descendant .
} .

{ :ann :ancestor ?who } log:query { :ann :ancestor ?who } .
```

`<=` defines a backward rule: solve its right side when its left side is
asked. The second definition asks about a child's descendants recursively.
`log:query` selects Ann's answers for output.

---

## What gets compiled

An N3 triple becomes `rdf(Subject, Predicate, Object)`. IRIs, the names of
the people and properties, become `iri(...)` terms. N3 variables such as
`?person` become eyemind variables such as `Person`.

The two backward definitions become `implied_by` clauses. The query
becomes a forward rule that writes `result(...)` terms and a
`query(result(S, P, O))` that reports them. This keeps reporting separate
from the ancestry relation being searched.

---

## What eyemind concludes

The check report records these answers as terms:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob'))
result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara'))
```

Converted back to N3, they read:

```turtle
@prefix : <https://example.org/family#> .

:ann :ancestor :bob .
:ann :ancestor :cara .
```

Bob follows from the first parent fact. Cara follows from both parent
facts and the recursive definition. These are the two reported answers;
the original parent facts are not repeated in this output.

---

## What the proof establishes

The proof holds the two claims, two steps and a certificate. Each step
records how the query rule, clause 5 of the compiled program, concluded an
answer from an ancestry triple:

```js
step(result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob')), clause(5), {Who: iri('https://example.org/family#bob')}, [rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob'))])
```

The certificate lists the derived `result` facts and holds a call table for
each ancestry search. The table for Bob's ancestry shows that his parent
Cara is his only descendant, and the one for Cara shows she has none:

```js
called(rdf(iri('https://example.org/family#bob'), iri('https://example.org/family#ancestor'), F), [rdf(iri('https://example.org/family#bob'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara'))])
called(rdf(iri('https://example.org/family#cara'), iri('https://example.org/family#ancestor'), H), [])
```

The checker expands each of these calls one level against the two backward
rules, answering the inner calls from their tables, and so confirms every
table; it replays both steps, and requires the claims to be exactly the
answers of the query. The saved report ends with `verdict('checked')`: the
two answers follow from the N3 source, and they are every answer of its
query.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/family-n3.n3
node bin/eyemind.js --program examples/family-n3.n3 > /tmp/family.js
node bin/eyemind.js /tmp/family.js
```

Check the saved proof against the N3 source:

```sh
node bin/eyemind.js --check-proof examples/proof/family-n3.js examples/family-n3.n3
```

Add `:cara :parent :dan .` to a copy of the N3 source, then compile and run
it: Dan becomes a third answer.
