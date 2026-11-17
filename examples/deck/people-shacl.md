# Validate a directory

[source](https://github.com/eyereasoner/eyemind/blob/main/examples/people-shacl.ttl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/people-shacl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/people-shacl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/people-shacl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=people-shacl)

---

## The question

Does each person have one string name and an integer age of at least eighteen?

## What we tell eyemind

Reusable name and age property shapes target the people in the same Turtle snapshot. The constraints follow [W3C SHACL](https://www.w3.org/TR/shacl/).

## What eyemind concludes

Alice conforms. Bob yields two validation results: a missing name and an age below eighteen. The report has `sh:conforms false`; each result records its focus, source shape, component, path, severity and supplied message.

One conclusion in the JavaScript check report is:

```js
result_rdf(…, iri('http://www.w3.org/ns/shacl#conforms'), literal('false', datatype('http://www.w3.org/2001/XMLSchema#boolean')), 'default_graph')
```

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It establishes
the reported conclusions from the supplied data and rules. Validation and
conflict reports are conclusions too; exit code 0 means evaluation completed.

## Try it

```sh
node bin/eyemind.js --shacl examples/people-shacl.ttl
node bin/eyemind.js --shacl --program examples/people-shacl.ttl > /tmp/people-shacl.js
node bin/eyemind.js --to turtle /tmp/people-shacl.js
node bin/eyemind.js --shacl --check-proof examples/proof/people-shacl.js examples/people-shacl.ttl
```

Give Bob a name and change his age to 18: the report conforms. These are required-field checks over the completed snapshot; a missing field is a validation result.
