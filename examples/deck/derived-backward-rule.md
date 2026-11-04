# Derived backward rule

*An inverse relation becomes a rule that answers questions.*

[derived-backward-rule.js](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-backward-rule.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/derived-backward-rule.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/derived-backward-rule.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/derived-backward-rule.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=derived-backward-rule)

---

## The question

`parentOf` and `childOf` are inverse relations. Alice is Bob's parent.
**Can a rule derived from that inverse pair establish who Bob's parent is?**

---

## What we tell eyemind

```js
fact(inv_of('parentOf', 'childOf'))
fact(t('alice', 'parentOf', 'bob'))

implies(inv_of(P, Q),
  implied_by(t(X, Q, Y), t(Y, P, X)))

implies(t(X, 'childOf', Y), t(X, 'hasParent', Y))
```

The nested `implied_by(Head, Body)` captures `P` and `Q` from the inverse pair.
`X` and `Y` are local variables: the enabled rule can answer questions about
any pair of people. The relation name is an argument of `t`, so the possible
call remains statically named `t/3`.

---

## What eyemind concludes

```js
t('bob', 'hasParent', 'alice')
```

The forward rule asks for `childOf`. The enabled backward rule answers it
by reversing the known `parentOf` fact.

---

## What the proof establishes

Verdict: **checked**. The certificate links the final conclusion to the
backward rule, its activation from the inverse pair, and the original
parent fact. A rule display in the proof cannot supply an activation that
the source program does not justify.

---

## Try it

```sh
eyemind examples/derived-backward-rule.js
eyemind --proof examples/derived-backward-rule.js
eyemind -c examples/derived-backward-rule.js
eyemind --check-proof examples/proof/derived-backward-rule.js examples/derived-backward-rule.js
```

Remove the inverse-pair fact: the backward rule cannot answer and the
forward conclusion disappears.
