# People with RDFS

*One Turtle graph supplies both the directory and its schema.*

[people-rdfs.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/people-rdfs.ttl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/people-rdfs.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/people-rdfs.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/people-rdfs.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=people-rdfs)

---

## The question

Alice is a researcher and Bob is her colleague. Researchers are employees,
employees are people, and the colleague property has employee domain and
person range. Every colleague relation is also a knows relation.

What types and relations follow from this directory?

## What we tell eyemind

The Turtle file contains the data and the schema. `--rdfs` adds the inference
rules; the vocabulary by itself does not enable reasoning. The rules follow
[W3C RDF Schema](https://www.w3.org/TR/rdf-schema/).

## What eyemind concludes

Alice is an employee and a person, Bob is a person, and Alice knows Bob:

```turtle
:Alice a :Employee, :Person ; :knows :Bob .
:Bob a :Person .
```

One of the conclusions in the JavaScript check report is:

```js
result_rdf(iri('https://example.org/people#Alice'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://example.org/people#Person'), 'default_graph')
```

The output also contains the class, property and resource consequences of
the RDFS rules. By default it omits triples already present in the input;
`--all` includes them.

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It establishes
the new triples from the directory and the supplied rules. RDFS domain and
range infer types; they do not reject a directory entry whose type was not
stated beforehand. Missing information is not a contradiction.

## Try it

```sh
node bin/eyemind.js --rdfs examples/people-rdfs.ttl
node bin/eyemind.js --rdfs --program examples/people-rdfs.ttl > /tmp/people-rdfs.js
node bin/eyemind.js --to turtle /tmp/people-rdfs.js
node bin/eyemind.js --rdfs --proof examples/people-rdfs.ttl
node bin/eyemind.js --rdfs --check-proof examples/proof/people-rdfs.js examples/people-rdfs.ttl
```

Remove Alice's explicit researcher type: the colleague property's domain
still establishes that she is an employee and a person.
