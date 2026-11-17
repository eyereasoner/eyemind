# A family with OWL 2 RL

*A property chain discovers a grandparent; equality exposes a contradiction.*

[family-owl2rl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/family-owl2rl.ttl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/family-owl2rl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/family-owl2rl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/family-owl2rl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=family-owl2rl)

## The question

Alice is Bob's parent. Bob has two named fathers, Charles and Charlie, and
the father property is functional. The graph also states that Charles and
Charlie are different individuals.

Which relationships follow, and which assertions conflict?

## What we tell eyemind

One Turtle file supplies the family data and ontology. A father is a parent,
child is the inverse of parent, and two parent steps form a grandparent
relationship. `--owl2rl` adds the inference and conflict rules as LS.

The rules follow the [W3C OWL 2 RL/RDF rule tables](https://www.w3.org/TR/owl2-profiles/#Reasoning_in_OWL_2_RL_and_RDF_Graphs).
The implemented coverage and datatype limits are described in the
[guide](https://eyereasoner.github.io/eyemind/#owl-2-rl).

## What eyemind concludes

```turtle
:Alice :grandparent :Charles, :Charlie .
:Bob :child :Alice .
:Charles owl:sameAs :Charlie .
```

These include the LS conclusion:

```js
result_rdf(iri('https://example.org/family#Alice'), iri('https://example.org/family#grandparent'), iri('https://example.org/family#Charles'), 'default_graph')
```

Functional properties infer equality between their values. Two different
names alone would be consistent; the explicit `owl:differentFrom` assertion
creates the contradiction. Turtle conflict nodes have type `ent:Conflict`,
rule `"eq-diff1"` and links `ent:focus`, `ent:left` and `ent:right` to their
arguments. Equality substitution exposes further instances of that conflict.
The report retains them all, along with the inferences.

## What the proof establishes

The saved proof is **checked** against the input facts and compiled rules.
It establishes both the relationships and the detected contradiction. A
checked report containing a conflict does not establish a consistent ontology.
Conflict reporting continues to the fixpoint; it does not halt at the first
conflict or derive arbitrary statements from inconsistency. Exit code 0 means
the report completed.

## Try it

```sh
node bin/eyemind.js --owl2rl examples/family-owl2rl.ttl
node bin/eyemind.js --owl2rl --program examples/family-owl2rl.ttl > /tmp/family-owl2rl.js
node bin/eyemind.js --to turtle /tmp/family-owl2rl.js
node bin/eyemind.js --owl2rl --proof examples/family-owl2rl.ttl
node bin/eyemind.js --owl2rl --check-proof examples/proof/family-owl2rl.js examples/family-owl2rl.ttl
```

Remove the `owl:differentFrom` assertion: equality and the family relationships
still follow, but the conflict records disappear.
