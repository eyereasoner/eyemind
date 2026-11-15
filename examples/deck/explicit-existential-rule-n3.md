# Explicit variables and Skolem mothers

*A universally quantified rule computes a named mother for each human.*

[N3 source](https://github.com/eyereasoner/eyemind/blob/main/examples/explicit-existential-rule-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/explicit-existential-rule-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/explicit-existential-rule-n3.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/explicit-existential-rule-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=explicit-existential-rule-n3)

---

## The question

Tom and Ann are humans. How can a rule with explicitly declared variables
give each a deterministically named mother?

---

## What the N3 says

```n3
@prefix : <http://example.org/> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

# The universal :x matches a human; the universal :y receives the computed IRI.
@forAll :x .
@forAll :y .
{
    :x a :Human .
    (:mother :x) log:skolem :y
} => {
    :x :hasMother :y
} .

# The humans.
:tom a :Human .
:ann a :Human .
```

Both `:x` and `:y` are declared with `@forAll`, so they are rule variables,
not constants. `:x` matches a human, and `(:mother :x) log:skolem :y` binds
`:y` to the chosen mother IRI. The conclusion uses these bound values.

This expresses the mother scenario with explicit Skolem naming. It does
not demonstrate an `@forSome` in a rule conclusion: there is no fresh
existential variable or restricted firing. Other examples, such as
[shared existentials](https://eyereasoner.github.io/eyemind/examples/deck/shared-existential-n3),
cover N3 existential declarations.

---

## What eyemind concludes

Tom and Ann each have a mother IRI, with different names because their
naming keys contain different people.

The check report writes the claims as terms:

```js
// Checked answers: these follow from the input program.
rdf(iri('http://example.org/tom'), iri('http://example.org/hasMother'), iri('https://eyereasoner.github.io/.well-known/genid/eb905bc2bb59e8e75a63d7c627a41516259fdb628ba0182bbe266c6adb9542e4'))
rdf(iri('http://example.org/ann'), iri('http://example.org/hasMother'), iri('https://eyereasoner.github.io/.well-known/genid/62678041c8482f38e049ccd244e1f97de558aabb64c58999bbe309f1d5c6291d'))
```

---

## What the proof establishes

C5 verifies the computed names, and C10 verifies both the original calls
and that every answer is claimed. No assumption about a restricted rule's
firing order is needed, because both conclusion variables were bound by
the premise.

The verdict is **checked**, with zero obligations. The saved native N3
proof carries the complete compiled certificate, whose clauses can be
compared with `--program` output.

---

## Try it

```sh
node bin/eyemind.js examples/explicit-existential-rule-n3.n3
node bin/eyemind.js --strict-proof -c examples/explicit-existential-rule-n3.n3
node bin/eyemind.js --strict-proof --check-proof examples/proof/explicit-existential-rule-n3.n3 examples/explicit-existential-rule-n3.n3
```

Add `:bob a :Human .` to a copy. The same universally quantified rule
computes another mother IRI.
