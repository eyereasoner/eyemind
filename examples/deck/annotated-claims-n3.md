# Choosing between reports

*Conflicting RDF 1.2 annotated claims ranked by confidence and trust, with typed literals read as numbers.*

[data/annotated-claims-n3.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/data/annotated-claims-n3.ttl) · [annotated-claims-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/annotated-claims-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/annotated-claims-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/annotated-claims-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/annotated-claims-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=annotated-claims-n3)

---

## The question

Should a traveller cross the bridge when reports disagree?

---

## What the program says

`data/annotated-claims-n3.ttl`:

```ttl
# Conflicting reports say a bridge is closed or open. Confidence times source
# trust ranks each claim; the top claim decides only at a score of at least
# 8000. The authority's 9310 beats the anonymous post's 700, so the result is
# avoid_bridge, with both ranks and sources. Collection counts higher scores.
@prefix : <https://example.org/> .

:bridge :status :closed ~ :authorityClaim .
:authorityClaim :assertedBy :transportAuthority ;
  :confidence 98 .

:bridge :status :open ~ :socialClaim .
:socialClaim :assertedBy :anonymousPost ;
  :confidence 35 .

:transportAuthority :trustScore 95 .
:anonymousPost :trustScore 20 .
```

`annotated-claims-n3.n3`:

```n3
# Conflicting reports say a bridge is closed or open. Confidence times source
# trust ranks each claim; the top claim decides only at a score of at least
# 8000. The authority's 9310 beats the anonymous post's 700, so the result is
# avoid_bridge, with both ranks and sources. Collection counts higher scores.
@prefix : <https://example.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .
@prefix math: <http://www.w3.org/2000/10/swap/math#> .
@prefix list: <http://www.w3.org/2000/10/swap/list#> .

{
  :bridge :status ?status .
  ?reifier rdf:reifies <<( :bridge :status ?status )>> ;
    :assertedBy ?source ; :confidence ?confidence .
  ?source :trustScore ?trust .
  (?confidence ?trust) math:product ?score .
} => { (?status ?source ?score) a :Claim } .

{ (?score ?other) a :HigherScore } <= {
  (?status ?source ?other) a :Claim .
  ?other math:greaterThan ?score .
} .

{
  (?status ?source ?score) a :Claim .
  (?other { (?score ?other) a :HigherScore } ?higher) log:collectAllIn ?SCOPE .
  ?higher list:length ?count .
  (?count 1) math:sum ?rank .
} => { (?rank ?status ?source ?score) a :RankedClaim } .

:policy :threshold 8000 .
:closed :action :avoid_bridge .
:open :action :cross_bridge .

{
  (1 ?status ?source ?score) a :RankedClaim .
  :policy :threshold ?limit .
  ?score math:notLessThan ?limit .
  ?status :action ?action .
} => { (?action ?source ?score) a :Decision } .

{
  (1 ?status ?source ?score) a :RankedClaim .
  :policy :threshold ?limit .
  ?score math:lessThan ?limit .
} => { (:verify_manually :noTrustedSource ?score) a :Decision } .

{ (?action ?source ?score) a :Decision } log:query {
  :bridge :decision ?action ; :trustedSource ?source ; :score ?score .
} .
{ (?rank ?status ?source ?score) a :RankedClaim } log:query {
  ?status :rank ?rank ; :assertedBy ?source ; :score ?score .
} .
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```n3
@prefix : <https://example.org/> .

:bridge :decision :avoid_bridge .
:bridge :trustedSource :transportAuthority .
:bridge :score 9310 .
:closed :rank 1 .
:closed :assertedBy :transportAuthority .
:closed :score 9310 .
:open :rank 2 .
:open :assertedBy :anonymousPost .
:open :score 700 .
```

Confidence times trust gives the authority 9310 and the anonymous post 700. Collection counts higher scores to determine ranks. The top score passes the threshold of 8000, so the decision is avoid_bridge. The output also identifies the trusted source and both claims with their ranks and scores.

The check report records the corresponding claims as JavaScript expressions:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
result(iri('https://example.org/bridge'), iri('https://example.org/decision'), iri('https://example.org/avoid_bridge'))
result(iri('https://example.org/bridge'), iri('https://example.org/trustedSource'), iri('https://example.org/transportAuthority'))
result(iri('https://example.org/bridge'), iri('https://example.org/score'), 9310)
result(iri('https://example.org/closed'), iri('https://example.org/rank'), 1)
result(iri('https://example.org/closed'), iri('https://example.org/assertedBy'), iri('https://example.org/transportAuthority'))
result(iri('https://example.org/closed'), iri('https://example.org/score'), 9310)
result(iri('https://example.org/open'), iri('https://example.org/rank'), 2)
result(iri('https://example.org/open'), iri('https://example.org/assertedBy'), iri('https://example.org/anonymousPost'))
result(iri('https://example.org/open'), iri('https://example.org/score'), 700)
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`. The proof holds the nine
claims, 26 steps recording the firings behind the derived facts, and a
certificate: `derived(...)` listings of the facts the forward rules derived
and `called(...)` tables of every answer of each call the questions make.

The collected list of higher scores is used only by `list:length`, and
counting does not depend on order, so `log:collectAllIn` compiles to
`findall_sorted`. Its answers come from the call tables, at the bindings the
collection had when it ran. No score is higher than the authority's:

```js
called(rdf([9310, O1], iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://example.org/HigherScore')), [])
```

The scores are facts forward rules derived, so the table rests on a listing,
which the checker requires to be closed under the rules; the sorted list does
not depend on the order in which those facts were derived. The checker
answers each question from the tables, expanding every call one level against
the compiled program, computes the arithmetic itself, and replays each listed
fact's recorded firing. It follows the certificate without calling the
reasoning engine.

The verdict **checked** establishes that the nine claims follow from the
program and are every answer of its questions.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/data/annotated-claims-n3.ttl examples/annotated-claims-n3.n3
node bin/eyemind.js --proof examples/data/annotated-claims-n3.ttl examples/annotated-claims-n3.n3
node bin/eyemind.js --check-proof examples/proof/annotated-claims-n3.js examples/data/annotated-claims-n3.ttl examples/annotated-claims-n3.n3
```
