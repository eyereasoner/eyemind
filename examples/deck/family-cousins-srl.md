# Cousins across family branches

*Bounded generations and inherited branch labels identify cousins across a family tree.*

[family-cousins.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/family-cousins.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/family-cousins.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/family-cousins.srl) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/family-cousins-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=family-cousins-srl)

---

## The question

Which people share a generation while belonging to different family branches?

---

## What the program says

`family-cousins.srl`:

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

The saved report ends with `verdict('checked')`. The report has no remaining obligations.
C1 checks inference steps against the compiled source clauses; C5 checks
primitive computations; C8 checks fresh witnesses; C10 checks the original
questions against the recorded call tables. The checker follows the
certificate without calling the reasoning engine.

The verdict describes the displayed claims and any listed obligations. It
does not assert that an arbitrary certificate lists every possible answer.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/family-cousins.srl
node bin/eyemind.js --proof examples/family-cousins.srl
node bin/eyemind.js --check-proof examples/proof/family-cousins.srl examples/family-cousins.srl
```
