# Chain stratification

*No strata, yet one intended result.*

[chain-stratification.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/chain-stratification.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/chain-stratification.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/chain-stratification.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/chain-stratification.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=chain-stratification)

---

## The question

Teachers of a course who are not students examine it. The negation must
wait until every student is known, but the subproperty rule
`{ ?p rdfs:subPropertyOf ?q . ?x ?p ?y } => { ?x ?q ?y }` can derive a
triple of any predicate, `rdf:type` included, from a fact of any predicate,
the examiner relation included. So the rules have no strata: whether a
teacher is a student might depend on who examines. N. Küchenmeister,
A. Ivliev, D. Arndt and M. Krötzsch, "Stratified Negation in RDF Rules: A
Correct Approach" (arXiv:2607.28778), show that three constraints remove
every way that could happen. Can eyemind accept these rules?

---

## What the N3 says

```n3
:c1 :participant :ann .
:c1 :teacher :ann, :tim .
:teacher rdfs:subPropertyOf :staff .

{ ?c :participant ?p } => { ?p a :Student } .
{ ?c :teacher ?p . [] log:notIncludes { ?p a :Student } } => { ?c :examiner ?p } .
{ ?p rdfs:subPropertyOf ?q . ?q rdfs:subPropertyOf ?r } => { ?p rdfs:subPropertyOf ?r } .
{ ?p rdfs:subPropertyOf ?q . ?x ?p ?y } => { ?x ?q ?y } .

{ :examiner rdfs:subPropertyOf :participant } => false .
{ :examiner rdfs:subPropertyOf rdfs:subPropertyOf } => false .
{ :examiner rdfs:subPropertyOf rdf:type } => false .
```

---

## What gets compiled

The examiner rule compiles to a forward rule with a negation:

```js
implies([rdf(C, iri("http://example.org/teacher"), P), not(rdf(P, iri("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), iri("http://example.org/Student")))], rdf(C, iri("http://example.org/examiner"), P))
```

Its negated goal unifies with the subproperty rule's head `rdf(X, Q, Y)`,
which depends on the examiner rule's own head, so ordinary stratification
fails. eyemind then follows every chain of rule applications that starts
with an examiner fact. A chain reaches `rdf(P, type, Student)` only by
making the examiner relation a subproperty of participation, of
subPropertyOf or of `rdf:type`, and each of those satisfies a constraint.
The examiner rule therefore runs in a rank of its own, after the others.

---

## What eyemind concludes

```n3
:ann a :Student .
:c1 :staff :ann .
:c1 :staff :tim .
:c1 :examiner :tim .
```

The check report records the examiner:

```js
rdf(iri('http://example.org/c1'), iri('http://example.org/examiner'), iri('http://example.org/tim'))
```

Ann participates, so she is a student and no examiner. Both teachers are
staff, through the subproperty. Tim examines.

---

## What the proof establishes

The report ends with `verdict('checked_with_obligations')`. The negation
that Tim is no student is settled by the search certificate against the
derived facts, as for any program. The remaining obligations are
`call_fidelity`, since a forward rule with a negation leaves call fidelity
unproved, and the manifest lists them as trusted. Delete one of the three
constraints and eyemind rejects the rules as unstratified: a chain then
makes a teacher a student.

---

## Try it

```sh
node bin/eyemind.js examples/chain-stratification.n3
node bin/eyemind.js --program examples/chain-stratification.n3 > /tmp/chain-stratification.js
node bin/eyemind.js --check-proof examples/proof/chain-stratification.n3 examples/chain-stratification.n3
```
