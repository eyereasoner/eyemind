# Restricted chase

*A new father only where no known one fits.*

[restricted-chase-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/restricted-chase-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/restricted-chase-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/restricted-chase-n3.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/restricted-chase-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=restricted-chase-n3)

---

## The question

Every human has some father who is a man. Jo's father Bob is known, Ann's
is not. Should a reasoner invent a father for Jo? N. Küchenmeister,
A. Ivliev, D. Arndt and M. Krötzsch, "Stratified Negation in RDF Rules: A
Correct Approach" (arXiv:2607.28778), use these rules to show that the
answer changes what a negation concludes: with an invented father, a rule
that flags two fathers not known to be equal flags Bob and the invention.

---

## What the N3 says

```n3
:jo a :Human .
:jo :father :bob .
:ann a :Human .

{ ?x a :Human } => { ?x :father _:1 . _:1 a :Man } .
{ ?x :father ?y } => { ?y a :Man } .
{ ?x :father ?y } => { ?y :eq ?y } .
{
    ?x :father ?y1 .
    ?x :father ?y2 .
    [] log:notIncludes { ?y1 :eq ?y2 }
} => {
    ?y1 :nef ?y2
} .
```

---

## What gets compiled

The first rule has a blank node in its conclusion, so it becomes a
restricted rule:

```js
restricted(rdf(X, iri("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), iri("http://example.org/Human")), [rdf(X, iri("http://example.org/father"), B1), rdf(B1, iri("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), iri("http://example.org/Man"))])
```

Its guard asks whether a father who is a man is already known. The other
rules of its stratum run first, so the guard sees that Bob is a man.

---

## What eyemind concludes

```n3
:bob a :Man .
:bob :eq :bob .
:ann :father _:b0 .
_:b0 a :Man .
_:b0 :eq _:b0 .
```

The check report records the new father with the witness of Ann's firing:

```js
rdf(iri('http://example.org/ann'), iri('http://example.org/father'), skolem(4, 'B1', [iri('http://example.org/ann')]))
rdf(skolem(4, 'B1', [iri('http://example.org/ann')]), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/Man'))
```

Bob already satisfies the rule for Jo, so Jo gets no new father, and no
two fathers are flagged. Ann has no known father, so she gets one.

---

## What the proof establishes

The report ends with `verdict('checked_with_obligations')`. C8 recomputes
Ann's witness, and the search certificate settles the guard of her firing
against the derived facts: no other father who is a man is known for Ann,
so the new one is needed. A proof that also invents a father for Jo fails,
because Bob refutes that firing's guard. Which firings a restricted rule
makes can depend on the order of rule applications, so C10 leaves
`call_fidelity` obligations, which the manifest lists as trusted.

---

## Try it

```sh
node bin/eyemind.js examples/restricted-chase-n3.n3
node bin/eyemind.js --program examples/restricted-chase-n3.n3 > /tmp/restricted-chase.js
node bin/eyemind.js --check-proof examples/proof/restricted-chase-n3.n3 examples/restricted-chase-n3.n3
```
