# A policy that enables a rule

*An active policy derives and reports a membership rule.*

[derived-rule-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-rule-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/derived-rule-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/derived-rule-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/derived-rule-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=derived-rule-n3)

---

## The question

Who may read the report when the membership policy is active?

---

## What the program says

`derived-rule-n3.n3`:

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
// Checked answers: these follow from the input program and are every answer of its questions.
rdf(graph([rdf(qvar('x'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/policy#Member'))]), iri('http://www.w3.org/2000/10/swap/log#implies'), graph([rdf(qvar('x'), iri('http://example.org/policy#mayRead'), iri('http://example.org/policy#report'))]))
rdf(iri('http://example.org/policy#alice'), iri('http://example.org/policy#mayRead'), iri('http://example.org/policy#report'))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`. The proof cites the
program compiled from the N3 rules: rule 3 is the policy rule, whose
conclusion is the derived rule as a formula triple, and rule 4 the derived
membership rule, whose step uses the policy triple and Alice's membership.
The listing `derived(rdf(A, B, C), [...])` holds both derived triples, and
the call tables hold every answer of each call the questions make.

The checker follows this certificate without calling the reasoning engine.
It checks each call table by applying the compiled rules one level, requires
the listing to be closed under the forward rules, and replays each listed
triple's firing from the source. The verdict establishes that the displayed
claims follow from the program and are every answer of its questions.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/derived-rule-n3.n3
node bin/eyemind.js --proof examples/derived-rule-n3.n3
node bin/eyemind.js --check-proof examples/proof/derived-rule-n3.js examples/derived-rule-n3.n3
```
