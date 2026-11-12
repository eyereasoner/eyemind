# Shared existential

*Someone everybody loves: one witness for all.*

[shared-existential.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/shared-existential.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/shared-existential.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/shared-existential.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/shared-existential.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=shared-existential)

---

## The question

"There is someone whom everybody loves" puts the existential outside the
universal. Asked whom Bob loves and whom Liz loves, the answer must be the
same unnamed individual. Does eyemind keep that witness shared?

---

## What the N3 says

```n3
@forSome :y .
{} => {
    @forAll :x .
    :x :loves :y
} .

{ :bob :loves ?beloved } => { :bob :beloved ?beloved } .
{ :liz :loves ?beloved } => { :liz :beloved ?beloved } .
```

`:y` is declared for the whole document; `:x` only inside the rule's
conclusion. The conclusion therefore says that *everything* loves the one
`:y`.

---

## What gets compiled

```js
implied_by(rdf(X, iri("http://example.org/loves"), bnode('n3', "y")), 'true')
```

A conclusion with universals of its own is a backward rule: it answers
`:loves` questions about any subject. The document's existential is one
constant individual, the same in every rule that mentions it.

---

## What eyemind concludes

```n3
:bob :beloved _:b0 .
:liz :beloved _:b0 .
```

The check report records both answers with the same witness term, as the
source requires:

```js
rdf(iri('http://example.org/bob'), iri('http://example.org/beloved'), bnode('n3', 'y'))
rdf(iri('http://example.org/liz'), iri('http://example.org/beloved'), bnode('n3', 'y'))
```

---

## What the proof establishes

The report ends with `verdict('checked_with_obligations')`. C1 checks both
forward steps and the backward rule instances they use. The two
`call_fidelity` obligations remain because the answers come from backward
search with no call tables for C10, as for other backward-rule examples.

---

## Try it

```sh
node bin/eyemind.js examples/shared-existential.n3
node bin/eyemind.js --program examples/shared-existential.n3 > /tmp/shared-existential.js
node bin/eyemind.js --check-proof examples/proof/shared-existential.n3 examples/shared-existential.n3
```
