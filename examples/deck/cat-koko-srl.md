# Two rules, two fresh witnesses

*Separate head blank nodes create distinct witnesses that pass an identity filter.*

[cat-koko-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/cat-koko-srl.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/cat-koko-srl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/cat-koko-srl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/cat-koko-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=cat-koko-srl)

---

## The question

Do separate rule heads create distinct witnesses when they have the same premise?

---

## What the program says

`cat-koko-srl.srl`:

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

The saved report ends with `verdict('checked')`. The proof holds the claims,
a step for each fact the rules derived, and a certificate: one listing per
derived relation and a call table for every call the questions make. The
steps for the Cat and BritishShortHair facts cite their rules with `Bcat` and
`Bbsh` bound to Skolem terms such as `skolem(3, 'Bcat', [])`; the checker
replays each firing and recomputes those terms itself, so a proof cannot name
an invented node of its own choosing. The FILTER rests on call tables:
`srl_ne` of the two Skolem terms gives true, because `srl_equal` gives false.
The checker expands each table one level against the compiled program and
computes the primitives itself, without calling the reasoning engine.

The verdict establishes the displayed claims and that they are every answer
of the original questions.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/cat-koko-srl.srl
node bin/eyemind.js --proof examples/cat-koko-srl.srl
node bin/eyemind.js --check-proof examples/proof/cat-koko-srl.js examples/cat-koko-srl.srl
```
