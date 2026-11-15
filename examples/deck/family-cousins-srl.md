# Cousins across family branches

*Bounded generations and inherited branch labels identify cousins across a family tree.*

[family-cousins-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/family-cousins-srl.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/family-cousins-srl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/family-cousins-srl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/family-cousins-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=family-cousins-srl)

---

## The question

Which people share a generation while belonging to different family branches?

---

## What the program says

`family-cousins-srl.srl`:

```srl
# A four-generation family has two labelled branches. Bounded property
# paths assign generations, a recursive rule carries branch labels, and
# people at the same generation in different branches become cousins.

PREFIX : <http://example.org/family-cousins#>

DATA {
  :Adam :parentOf :Bob, :Carol .
  :Bob :parentOf :Dave, :Eve .
  :Carol :parentOf :Frank, :Grace .
  :Dave :parentOf :Heidi .
  :Eve :parentOf :Ivan .
  :Frank :parentOf :Judy .

  :Dave :branch :b .
  :Eve :branch :b .
  :Frank :branch :c .
  :Grace :branch :c .

  :b :differentFrom :c .
  :c :differentFrom :b .
}

RULE { :Adam :generation 0 } WHERE { }

RULE { ?child :generation 1 }
WHERE { :Adam :parentOf ?child }

RULE { ?grandchild :generation 2 }
WHERE { :Adam :parentOf/:parentOf ?grandchild }

RULE { ?greatGrandchild :generation 3 }
WHERE { :Adam :parentOf/:parentOf/:parentOf ?greatGrandchild }

RULE { ?child :branch ?branch }
WHERE {
  ?parent :parentOf ?child .
  ?parent :branch ?branch .
}

RULE { ?x :cousin ?y }
WHERE {
  ?x :generation ?generation .
  ?y :generation ?generation .
  ?x :branch ?branchX .
  ?y :branch ?branchY .
  ?branchX :differentFrom ?branchY .
}
```

---

## What eyemind concludes

The Turtle output contains the supplied DATA and the rule conclusions:

```ttl
PREFIX : <http://example.org/family-cousins#>

:Adam :parentOf :Bob .
:Adam :parentOf :Carol .
:Bob :parentOf :Dave .
:Bob :parentOf :Eve .
:Carol :parentOf :Frank .
:Carol :parentOf :Grace .
:Dave :parentOf :Heidi .
:Eve :parentOf :Ivan .
:Frank :parentOf :Judy .
:Dave :branch :b .
:Eve :branch :b .
:Frank :branch :c .
:Grace :branch :c .
:b :differentFrom :c .
:c :differentFrom :b .
:Adam :generation 0 .
:Bob :generation 1 .
:Carol :generation 1 .
:Dave :generation 2 .
:Eve :generation 2 .
:Frank :generation 2 .
:Grace :generation 2 .
:Heidi :generation 3 .
:Ivan :generation 3 .
:Judy :generation 3 .
:Heidi :branch :b .
:Ivan :branch :b .
:Judy :branch :c .
:Dave :cousin :Frank .
:Dave :cousin :Grace .
:Eve :cousin :Frank .
:Eve :cousin :Grace .
:Frank :cousin :Dave .
:Frank :cousin :Eve .
:Grace :cousin :Dave .
:Grace :cousin :Eve .
:Heidi :cousin :Judy .
:Ivan :cousin :Judy .
:Judy :cousin :Heidi .
:Judy :cousin :Ivan .
```

Bounded parent paths assign generations 0 through 3. Branch labels pass to descendants. The second generation produces eight directed cousin links across its two branches; the third produces four, including Heidi and Judy in both directions.

The check report records, among its claims:

```js
inf(iri('http://example.org/family-cousins#Adam'), iri('http://example.org/family-cousins#generation'), 0)
inf(iri('http://example.org/family-cousins#Heidi'), iri('http://example.org/family-cousins#cousin'), iri('http://example.org/family-cousins#Judy'))
inf(iri('http://example.org/family-cousins#Judy'), iri('http://example.org/family-cousins#cousin'), iri('http://example.org/family-cousins#Heidi'))
```

---

## What the proof establishes

The proof holds the 40 claims, 65 steps and a certificate. Every derived
triple has a step citing the clause of the compiled program that concluded
it: a DATA triple rests on nothing, a generation on the bounded parent-path
rules, and a cousin link on clause 36, with the two people, their shared
generation and their different branches as bindings.

The certificate lists the derived `inf` and `rdf` facts and holds 28 call
tables, one for each search the questions make. The checker requires each
listing to be closed under the rules, so no generation, branch or cousin link
can be left out; replays every listed fact's step from its source rule;
checks each table by expanding its call one level; and requires the claims to be exactly the
answers. It never calls the reasoner.

The saved report ends with `verdict('checked')`: the 40 triples follow from
the rules, and they are every answer of the program's questions.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/family-cousins-srl.srl
node bin/eyemind.js --proof examples/family-cousins-srl.srl
node bin/eyemind.js --check-proof examples/proof/family-cousins-srl.js examples/family-cousins-srl.srl
```
