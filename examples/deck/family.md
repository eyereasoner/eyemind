# N3 family queries

*Write ancestry in Notation3, run it in eyemind, and write the answers back as N3.*

[N3 source](https://github.com/eyereasoner/eyemind/blob/main/examples/family.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/family.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/family.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/family.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=family)

---

## The question

Ann is Bob's parent, and Bob is Cara's parent. Who descends from Ann?
The answer needs both a direct connection and a chain of connections.

The playground and command line run the N3 file directly. Use
`eyemind --program examples/family.n3` to inspect the eyemind rules
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

The proof records these answers as terms:

```js
// Answers: each instance of a query() that holds.
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

The saved report ends with `verdict('checked')`: there are no obligations.
C1 checks the ancestry derivations against the compiled source clauses.
C10 checks both reported answers against the original query using the
proof's `called/2` tables and supported forward listings.

The proof certifies these answers. Its verdict does not assert that an
arbitrary proof has listed every answer.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/family.n3
node bin/eyemind.js --program examples/family.n3 > /tmp/family.js
node bin/eyemind.js /tmp/family.js
```

Check the saved proof against the N3 source:

```sh
node bin/eyemind.js --strict-proof --check-proof examples/proof/family.js examples/family.n3
```

Add `:cara :parent :dan .` to a copy of the N3 source, then compile and run
it: Dan becomes a third answer.
