# Explicit existential rule

*Each human has some mother, a fresh one per firing.*

[explicit-existential-rule.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/explicit-existential-rule.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/explicit-existential-rule.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/explicit-existential-rule.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/explicit-existential-rule.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=explicit-existential-rule)

---

## The question

A rule written with explicit quantifiers says that every human has some
mother. Tom and Ann are humans. Does each get a mother of their own?

---

## What the N3 says

```n3
@forAll :x .
{ :x a :Human } => {
    @forSome :y .
    :x :hasMother :y
} .

:tom a :Human .
:ann a :Human .
```

`:x` is universal for the document, so in the rule it is a rule variable,
as `?x` would be. `:y` is existential in the conclusion, like a blank node
written there.

---

## What gets compiled

```js
restricted(rdf(X, iri("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), iri("http://example.org/Human")),
  rdf(X, iri("http://example.org/hasMother"), By))
```

`By` occurs only in the conclusion, so each firing binds it to a Skolem
witness of that firing. The rule is restricted: it fires only for a human
with no known mother.

---

## What eyemind concludes

```n3
:tom :hasMother _:b0 .
:ann :hasMother _:b1 .
```

The check report shows the witnesses:

```js
rdf(iri('http://example.org/tom'), iri('http://example.org/hasMother'), skolem(3, 'By', [iri('http://example.org/tom')]))
rdf(iri('http://example.org/ann'), iri('http://example.org/hasMother'), skolem(3, 'By', [iri('http://example.org/ann')]))
```

---

## What the proof establishes

The report ends with `verdict('checked_with_obligations')`. C8 recomputes
each Skolem witness from the rule and the firing that produced it, so a
proof giving Ann Tom's mother fails. The two `call_fidelity` obligations
come from the restriction: which firings a restricted rule makes can depend
on the order of rule applications, so C10 does not vouch for the original
questions' answers, and the manifest lists the obligation as trusted.

---

## Try it

```sh
node bin/eyemind.js examples/explicit-existential-rule.n3
node bin/eyemind.js --program examples/explicit-existential-rule.n3 > /tmp/explicit-existential-rule.js
node bin/eyemind.js --check-proof examples/proof/explicit-existential-rule.n3 examples/explicit-existential-rule.n3
```
