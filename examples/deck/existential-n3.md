# A Skolem mother for each person

*Named witnesses, with classifications and reciprocal child relations.*

[N3 source](https://github.com/eyereasoner/eyemind/blob/main/examples/existential-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/existential-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/existential-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/existential-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=existential-n3)

---

## The question

Ann and Bob each need a mother in the model. Can a rule name those mothers
deterministically and use the same names in later inferences?

---

## What the N3 says

```n3
@prefix : <http://example.org/people#>.
@prefix log: <http://www.w3.org/2000/10/swap/log#>.

:ann a :Person.
:bob a :Person.

{ ?p a :Person. (:mother ?p) log:skolem ?m } => { ?p :mother ?m. ?m a :Woman }.
{ ?p :mother ?m } => { ?m :hasChild ?p }.
```

The naming key `(:mother ?p)` contains a role and a person. `log:skolem`
binds `?m` to the corresponding IRI before the rule concludes the mother
link and the `:Woman` classification. The next rule uses that same IRI to
add the reciprocal `:hasChild` link.

These are explicit named witnesses, chosen by the rule. They do not claim
to identify a person's real mother. An ordinary forward rule computes the
name; there is no restricted firing with a conclusion blank node.

---

## What eyemind concludes

Ann and Bob have different mother IRIs. Each mother is classified as a
woman and has the corresponding child link. The same IRI occurs in all
three triples about that mother.

The check report writes the claims as terms:

```js
// Checked answers: these follow from the input program.
rdf(iri('http://example.org/people#ann'), iri('http://example.org/people#mother'), iri('https://eyereasoner.github.io/.well-known/genid/ee2956d8f5822f2cb3b208c5b988d2d006eedc4b3785315b961306ac4e4059b1'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/ee2956d8f5822f2cb3b208c5b988d2d006eedc4b3785315b961306ac4e4059b1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman'))
rdf(iri('http://example.org/people#bob'), iri('http://example.org/people#mother'), iri('https://eyereasoner.github.io/.well-known/genid/bd71c82d337e4be11be5babdab1403beb35f509f069848b543dbfca97f131ddf'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/bd71c82d337e4be11be5babdab1403beb35f509f069848b543dbfca97f131ddf'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/people#Woman'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/ee2956d8f5822f2cb3b208c5b988d2d006eedc4b3785315b961306ac4e4059b1'), iri('http://example.org/people#hasChild'), iri('http://example.org/people#ann'))
rdf(iri('https://eyereasoner.github.io/.well-known/genid/bd71c82d337e4be11be5babdab1403beb35f509f069848b543dbfca97f131ddf'), iri('http://example.org/people#hasChild'), iri('http://example.org/people#bob'))
```

---

## What the proof establishes

C1 checks both rules and their uses. C5 re-decides the construction of
the mother IRIs, and C10 checks the original calls and answer completeness.
The checker follows the supplied certificate without invoking the reasoning
engine. The names are premise computations, rather than C8 witnesses.

The verdict is **checked**, with zero obligations. The saved native N3
proof carries the complete compiled certificate, whose clauses can be
compared with `--program` output.

---

## Try it

```sh
node bin/eyemind.js examples/existential-n3.n3
node bin/eyemind.js --strict-proof -c examples/existential-n3.n3
node bin/eyemind.js --strict-proof --check-proof examples/proof/existential-n3.js examples/existential-n3.n3
```

Add `:cy a :Person .` to a copy. The rules give Cy a mother IRI and the two
associated classification and child triples.
