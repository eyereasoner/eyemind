# OWL Property Chain

*A relationship defined as a chain of others, and the links that follow from it.*

[owl-property-chain.js](https://github.com/eyereasoner/eyemind/blob/main/examples/owl-property-chain.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/owl-property-chain.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/owl-property-chain.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/owl-property-chain.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=owl-property-chain)

---

## The question

A family tree records only who is whose parent: Alice is Bob's parent, Bob
is Carol's, and Carol is Dave's.

Nobody wrote down grandparents. But a grandparent is just *a parent of a
parent*. The web's ontology language OWL calls such a definition a
**property chain**: one relationship spelled out as a sequence of others.

**Given the chain, who is whose grandparent?** And can each answer show the
links it walked?

---

## What we tell eyemind: the data

```js
// grandparent is the chain parent, parent.
fact(property_chain('grandparent', ['parent', 'parent']))
fact(triple('alice', 'parent', 'bob'))
fact(triple('bob', 'parent', 'carol'))
fact(triple('carol', 'parent', 'dave'))
```

A relationship is written as a triple: subject, property, object. The chain
is a plain list of property names, so it is data, just like the triples.

---

## What we tell eyemind: following a chain

```js
implies(
  [property_chain(P, [First, ...Rest]), triple(S, First, M), follow_chain(Rest, M, E)],
  triple(S, P, E),
)
fact(follow_chain([], N, N))
implied_by(follow_chain([P, ...Rest], S, E), [triple(S, P, M), follow_chain(Rest, M, E)])

query(triple(Person, 'grandparent', Grandchild))
```

- The `implies` rule takes the first property of a chain, finds a first
  link, and asks `follow_chain` to walk the rest.
- `follow_chain` takes one link per remaining property; an empty list means
  "you have arrived".
- `[First, ...Rest]` splits a list into its first item and the rest. Each
  step shortens the list, so the walk always ends.

Nothing in the rules mentions `grandparent` or `parent`: they work for any
declared chain, of any length.

---

## What eyemind concludes

```js
triple('alice', 'grandparent', 'carol')
triple('bob', 'grandparent', 'dave')
```

Two grandparent links. Alice and Dave are *three* parent links apart, so
Alice is not concluded to be Dave's grandparent.

---

## Why: the proof in plain words

For Alice and Carol:

1. The chain for `grandparent` is `parent`, `parent` — *fact 1*.
2. Alice is Bob's parent — *fact 2* — the first link.
3. Bob is Carol's parent — *fact 3* — so from Bob, one `parent` link
   reaches Carol — *rule 7* — and then the empty rest of the chain leaves
   us at Carol — *fact 6*.
4. So Alice is Carol's grandparent — *rule 5*.

Bob and Dave go the same way, through facts 3 and 4.

---

## Checked, not just claimed

A separate checker read all 10 proof steps against the program and
confirmed that:

- each step is an exact instance of the rule or fact it cites (10 of 10);
- no conclusion depends on itself in a circle;
- every step serves one of the 2 conclusions, and nothing extra is included.

Verdict: **checked**. Nothing taken on trust.

---

## Try it

```sh
eyemind examples/owl-property-chain.js            # the grandparents
eyemind --proof examples/owl-property-chain.js    # with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=owl-property-chain).

Declare a longer chain and ask for it:

```js
fact(property_chain('great_grandparent', ['parent', 'parent', 'parent']))
query(triple(Person, 'great_grandparent', G))
```

Run again: Alice is now also Dave's great-grandparent, with no new rule.
The chain `['parent', 'grandparent']` gives the same answer, since a chain
can use a relationship that was itself derived.

---

## Takeaway

When a definition is data rather than code, one general rule covers every
definition of its kind. Adding a relationship means adding one line, and
every link it produces still comes with the exact path that was walked.
