# Ancestry on demand

*Recursive backward ancestry selected by a query.*

[family-recursion-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/family-recursion-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/family-recursion-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/family-recursion-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/family-recursion-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=family-recursion-n3)

---

## The question

Who descends from Ann along a chain of three parent links?

---

## What the program says

`family-recursion-n3.n3`:

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
// Checked answers: these follow from the input program and are every answer of its questions.
result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#bob'))
result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#cat'))
result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#dan'))
```

---

## What the proof establishes

The proof holds the three claims, one step for each, and a certificate. A
step records how the query rule, clause 6 of the compiled program, concluded
an answer from an ancestry triple. The certificate lists the derived
`result` facts and holds a call table for every ancestry and parent search
the backward rules make, down to Dan, who has no descendants:

```js
called(rdf(iri('http://example.org/family#cat'), iri('http://example.org/family#parent'), I), [rdf(iri('http://example.org/family#cat'), iri('http://example.org/family#parent'), iri('http://example.org/family#dan'))])
called(rdf(iri('http://example.org/family#dan'), iri('http://example.org/family#ancestor'), J), [])
```

The checker never calls the reasoner. It expands each call one level against
the two backward rules, taking inner answers from their tables, so a wrong or
incomplete table shows up as a disagreement; it replays the three steps and
requires the claims to be exactly the answers. The saved report ends with
`verdict('checked')`: Bob, Cat and Dan follow from the source, and they are
every answer of the query.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/family-recursion-n3.n3
node bin/eyemind.js --proof examples/family-recursion-n3.n3
node bin/eyemind.js --check-proof examples/proof/family-recursion-n3.js examples/family-recursion-n3.n3
```
