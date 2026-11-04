# Two derived backward rules

*A conjunction can enable several rules at once.*

[derived-backward-rule-2.js](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-backward-rule-2.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/derived-backward-rule-2.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/derived-backward-rule-2.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/derived-backward-rule-2.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=derived-backward-rule-2)

---

## The question

Enable two backward rules: Socrates is human, and every human is mortal.
**Can ordinary forward reasoning use both to establish mortality?**

---

## What we tell eyemind

```js
implies('true', [
  backward(type('Socrates', 'Human'), 'true'),
  backward(subclass_of('Human', 'Mortal'), 'true'),
])

implies([type(S, A), subclass_of(A, B)], type(S, B))
implies(type('Socrates', 'Mortal'), t('test', 'is', 'true'))
```

The array is a conjunction of rule templates. Both are enabled by the same
unconditional generator. Their bodies are `'true'`, so each answers once
its activation is established.

---

## What eyemind concludes

```js
type('Socrates', 'Mortal')
t('test', 'is', 'true')
```

The two backward answers satisfy the subclass rule's conjunction. Its
conclusion then satisfies the final test rule.

---

## What the proof establishes

Verdict: **checked**. Both backward answers cite their guarded clauses and
their activations. The mortality step uses both answers; the test step uses
mortality. The checker follows these recorded steps without running the
reasoner to supply missing evidence.

---

## Try it

```sh
eyemind examples/derived-backward-rule-2.js
eyemind --proof examples/derived-backward-rule-2.js
eyemind -c examples/derived-backward-rule-2.js
eyemind --check-proof examples/proof/derived-backward-rule-2.js examples/derived-backward-rule-2.js
```

Remove either backward template: neither displayed conclusion can then be
derived.
