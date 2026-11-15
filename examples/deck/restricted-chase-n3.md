# Guarded Skolem fathers

*Reuse supplied fathers and name a new one only where none is supplied.*

[N3 source](https://github.com/eyereasoner/eyemind/blob/main/examples/restricted-chase-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/restricted-chase-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/restricted-chase-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/restricted-chase-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=restricted-chase-n3)

---

## The question

Jo's father Bob is supplied, while Ann has no supplied father. Can the
rules keep Bob, generate one father for Ann, and avoid incorrectly flagging
two fathers for Jo?

This is a Skolem IRI adaptation of L8-L11 of N. Küchenmeister, A. Ivliev,
D. Arndt and M. Krötzsch, "Stratified Negation in RDF Rules: A Correct
Approach" (arXiv:2607.28778).

---

## What the N3 says

```n3
@prefix : <http://example.org/> .
@prefix log: <http://www.w3.org/2000/10/swap/log#> .

:jo a :Human .
:jo :knownFather :bob .
:ann a :Human .

# Reuse supplied fathers, and generate an IRI only where none is supplied.
{ ?x :knownFather ?father } => { ?x :father ?father } .
{
    ?x a :Human .
    [] log:notIncludes { ?x :knownFather [] } .
    (:father ?x) log:skolem ?father
} => { ?x :father ?father . ?father a :Man } .

# L9: a father is a man.
{ ?x :father ?y } => { ?y a :Man } .

# L10: every father equals himself.
{ ?x :father ?y } => { ?y :eq ?y } .

# L11: two fathers of one child not known to be equal.
{
    ?x :father ?y1 .
    ?x :father ?y2 .
    [] log:notIncludes { ?y1 :eq ?y2 }
} => {
    ?y1 :nef ?y2
} .
```

`:knownFather` records supplied links. A rule copies them to `:father`.
The generation rule first binds a human, then tests the absence of any
`:knownFather` for that human. Only then does `(:father ?x) log:skolem ?father`
compute a father IRI. The blank node in the negated pattern means any
supplied father; it creates no individual.

The absence test depends on a separate relation, so it is settled before
generation and cannot be made false by the generated `:father` link. The
remaining rules classify fathers as men, state their self-equality, and
flag pairs not known equal.

This example distinguishes supplied links from derived ones. It does not
implement the general restricted chase, whose guard inspects all current
conclusion matches, including fathers derived by arbitrary other rules.

---

## What eyemind concludes

Jo's father is Bob. Ann receives one generated father IRI. Both fathers
are classified as men and equal to themselves, and there are no `:nef`
flags. Jo's supplied link appears in the output because a rule copies it
from `:knownFather` to `:father`.

The check report writes the claims as terms:

```js
// Checked answers: these follow from the input program.
rdf(iri('http://example.org/jo'), iri('http://example.org/father'), iri('http://example.org/bob'))
rdf(iri('http://example.org/ann'), iri('http://example.org/father'), iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Man'))
rdf(iri('http://example.org/bob'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Man'))
rdf(iri('http://example.org/bob'), iri('http://example.org/eq'), iri('http://example.org/bob'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'), iri('http://example.org/eq'), iri('https://eyereasoner.github.io/.well-known/genid/277aa42c177ba05114fc60349a038157131415db9bec7275538a263eb9ef4b03'))
```

---

## What the proof establishes

C9 settles the absence of a supplied father for Ann and the absence tests
in the two-father rule. C5 re-decides the Skolem IRI computation, and C10
establishes that these are every answer. The explicit input relation keeps
the guard stratified; no restricted existential firing is involved.

The verdict is **checked**, with zero obligations. The saved native N3
proof carries the complete compiled certificate, whose clauses can be
compared with `--program` output.

---

## Try it

```sh
node bin/eyemind.js examples/restricted-chase-n3.n3
node bin/eyemind.js --strict-proof -c examples/restricted-chase-n3.n3
node bin/eyemind.js --strict-proof --check-proof examples/proof/restricted-chase-n3.js examples/restricted-chase-n3.n3
```

Add `:ann :knownFather :alice .` to a copy. Alice is reused, and no father
IRI is generated. Alternatively, add `:jo :knownFather :carl .`: the rules
then flag Bob and Carl in both directions because the two supplied fathers
are not known equal.
