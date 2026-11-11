# A policy that enables a rule

*An active policy derives and reports a membership rule.*

[derived-rule.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-rule.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/derived-rule.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/derived-rule.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/derived-rule-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=derived-rule-n3)

---

## The question

Who may read the report when the membership policy is active?

---

## What the program says

`derived-rule.n3`:

```n3
# A rule that writes a rule: when the policy is active, every member may read
# the report. The derived rule is applied, and also reported as a triple.
@prefix : <http://example.org/policy#>.

:policy :status :active.
:alice a :Member.

{ :policy :status :active } => { { ?x a :Member } => { ?x :mayRead :report } }.
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```n3
@prefix : <http://example.org/policy#> .

{ ?x a :Member } => { ?x :mayRead :report } .
:alice :mayRead :report .
```

The active policy derives a reusable rule for members. Alice is a member, so the rule grants her access. The output also reports the derived rule as an N3 formula triple.

The check report records the corresponding claims as JavaScript expressions:

```js
// Answers checked subject to the obligations below.
rdf(graph([rdf(qvar('x'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/policy#Member'))]), iri('http://www.w3.org/2000/10/swap/log#implies'), graph([rdf(qvar('x'), iri('http://example.org/policy#mayRead'), iri('http://example.org/policy#report'))]))
rdf(iri('http://example.org/policy#alice'), iri('http://example.org/policy#mayRead'), iri('http://example.org/policy#report'))
```

---

## What the proof establishes

The saved report ends with `verdict('checked_with_obligations')`. The report lists `call_fidelity` obligations. Strict checking rejects these remaining obligations.
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
node bin/eyemind.js examples/derived-rule.n3
node bin/eyemind.js --proof examples/derived-rule.n3
node bin/eyemind.js --check-proof examples/proof/derived-rule.n3 examples/derived-rule.n3
```
