# Two rules, two fresh witnesses

*Separate head blank nodes create distinct witnesses that pass an identity filter.*

[cat-koko.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/cat-koko.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/cat-koko.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/cat-koko.srl) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/cat-koko.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=cat-koko)

---

## The question

Do separate rule heads create distinct witnesses when they have the same premise?

---

## What the program says

`cat-koko.srl`:

```srl
# Koko's Animal fact enables separate Cat and BritishShortHair witnesses.
# A final rule confirms they are different, showing per-rule head blank
# nodes and a FILTER comparison.

PREFIX : <https://eyereasoner.github.io/ns#>

DATA {
  :Koko a :Animal .
}

RULE { _:cat a :Cat }
WHERE {
  :Koko a :Animal .
}

RULE { _:bsh a :BritishShortHair }
WHERE {
  :Koko a :Animal .
}

RULE { :test :is true }
WHERE {
  ?X a :Cat .
  ?Y a :BritishShortHair .
  FILTER(?X != ?Y)
}
```

---

## What eyemind concludes

The Turtle output contains the supplied DATA and the rule conclusions:

```ttl
PREFIX : <https://eyereasoner.github.io/ns#>

:Koko a :Animal .
_:b0 a :Cat .
_:b1 a :BritishShortHair .
:test :is true .
```

Koko’s Animal fact enables both rules. One creates a Cat witness and the other a BritishShortHair witness. Their blank nodes are distinct, so the final FILTER comparison succeeds and derives test is true.

The check report records, among its claims:

```js
inf(iri('https://eyereasoner.github.io/ns#test'), iri('https://eyereasoner.github.io/ns#is'), literal('true', datatype('http://www.w3.org/2001/XMLSchema#boolean')))
```

---

## What the proof establishes

The saved report ends with `verdict('checked_with_obligations')`. The report lists `call_fidelity` obligations. These claims depend on the listed obligations, and strict checking rejects them.
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
node bin/eyemind.js examples/cat-koko.srl
node bin/eyemind.js --proof examples/cat-koko.srl
node bin/eyemind.js --check-proof examples/proof/cat-koko.srl examples/cat-koko.srl
```
