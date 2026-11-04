# Derived forward rule

*One fact enables a reusable rule.*

[derived-rule.js](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-rule.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/derived-rule.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/derived-rule.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/derived-rule.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=derived-rule)

---

## The question

Minka is a cat. Charly is a dog. If a cat is present, enable a rule that
concludes a test fact whenever a dog is present.

**Does the enabled rule produce its conclusion?**

---

## What we tell eyemind

```js
fact(type('Minka', 'Cat'))
fact(type('Charly', 'Dog'))

implies(type(X, 'Cat'),
  implies(type(Y, 'Dog'), t('test', 'is', 'true')))
```

The inner `implies(Body, Head)` is a rule template. `X` belongs to the
generator; `Y`, which appears only inside the template, belongs to the
generated rule. It can match any dog.

---

## What eyemind concludes

```js
t('test', 'is', 'true')
```

Minka enables the rule. Charly satisfies its premise. The conclusion follows.

---

## What the proof establishes

Verdict: **checked**. The proof includes Minka's class membership, the
rule's activation, and Charly's class membership. Removing the activation's
justification leaves an incomplete proof.

The template is compiled to a guarded clause before reasoning, so all its
dependencies are known when the program is stratified. Negation and
collections still carry their usual explicit proof obligations.

---

## Try it

```sh
eyemind examples/derived-rule.js
eyemind --proof examples/derived-rule.js
eyemind -c examples/derived-rule.js
eyemind --check-proof examples/proof/derived-rule.js examples/derived-rule.js
```

Remove Minka's fact: the rule is never enabled and there is no conclusion.
