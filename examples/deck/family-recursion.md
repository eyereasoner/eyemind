# Ancestry on demand

*Recursive backward ancestry selected by a query.*

[family-recursion.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/family-recursion.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/family-recursion.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/family-recursion.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/family-recursion.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=family-recursion)

---

## The question

Who descends from Ann along a chain of three parent links?

---

## What the program says

`family-recursion.n3`:

```n3
# Ancestors from parents: a backward rule (<=) defines ancestry recursively,
# decided when a forward rule asks, and log:query selects what to report.
@prefix : <http://example.org/family#>.

:ann :parent :bob.
:bob :parent :cat.
:cat :parent :dan.

{ ?x :ancestor ?y } <= { ?x :parent ?y }.
{ ?x :ancestor ?z } <= { ?x :parent ?y. ?y :ancestor ?z }.

{ :ann :ancestor ?who } log:query { :ann :ancestor ?who }.
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```n3
@prefix : <http://example.org/family#> .

:ann :ancestor :bob .
:ann :ancestor :cat .
:ann :ancestor :dan .
```

Backward ancestry first finds Bob directly, then Cat and Dan recursively. log:query reports only Ann’s ancestors, without repeating the parent facts.

The check report records the corresponding claims as JavaScript expressions:

```js
// Checked answers: these follow from the input program.
result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#bob'))
result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#cat'))
result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#dan'))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`. The report has no remaining obligations.
C1 checks each inference against the compiled source clauses, C5 re-decides
primitive computations, C8 checks any fresh witness, and C10 checks the
original questions against the proof's call tables. The checker follows the
certificate without calling the reasoning engine.

The verdict certifies the displayed claims; it does not assert that an
arbitrary proof lists every possible answer.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/family-recursion.n3
node bin/eyemind.js --proof examples/family-recursion.n3
node bin/eyemind.js --check-proof examples/proof/family-recursion.n3 examples/family-recursion.n3
```
