# Superdense Coding

*Two bits through one qubit — a quantum protocol, reasoned out by counting paths.*

[superdense-coding.js](https://github.com/eyereasoner/eyemind/blob/main/examples/superdense-coding.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/superdense-coding.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/superdense-coding.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/superdense-coding.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=superdense-coding)

---

## The question

A *bit* is a 0 or a 1. Two bits give four possible messages: 0, 1, 2, 3.
Normally, sending two bits means sending two things.

*Superdense coding* is a quantum trick: if Alice and Bob already share a
specially linked (*entangled*) pair of qubits — quantum bits — Alice can
send Bob **two bits by handing him just one qubit**.

**Does Bob always read exactly the message Alice sent?**

---

## Quantum, with whole numbers

This example uses *discrete quantum theory*: a simplified version of
quantum mechanics where amplitudes are not complex numbers but values in
a tiny number system with only 0 and 1.

It keeps the key quantum effect, *interference*: two ways of reaching the
same result can cancel out. Here that becomes a simple rule:

> An outcome happens if it can be reached in an **odd** number of ways.
> Two ways cancel; one way, or three, survive.

---

## What we tell eyemind

The shared pair, Alice's four operations and Bob's four readings are
small tables of facts (omitted here). Then:

```js
// One way for Alice's message N to arrive as Bob's M: the shared pair |R), her
// operation on her half, and his measurement of both halves.
implied_by(path(N, M, [X, Y, B]), [r(X, Y), alice(N, [X, B]), bob([B, Y], M)])

implies(
  [message(N), message(M), findall(Path, path(N, M, Path), Paths), odd(Paths)],
  sdcoding(N, M),
)
```

A `path` is one way for Alice's message N to reach Bob as reading M:
through the shared pair `r`, her operation on her half, which she then sends
him, and his measurement of both halves. `'false'` and `'true'` stand for
the qubit values 0 and 1.
`findall` collects *all* such ways; `odd` keeps the pair if their number
is odd.

---

## What eyemind concludes

```js
sdcoding(0, 0)
sdcoding(1, 1)
sdcoding(2, 2)
sdcoding(3, 3)
```

Every message arrives as itself, and no message arrives as anything else.

For example, message 0 reaches reading 0 by one way, but reaches readings 1
and 3 by two ways each — which cancel — and reading 2 by none.

---

## Why: the proof in plain words

For message 0, read as 0:

1. 0 is one of the messages — *fact 29*.
2. All the ways from 0 to 0: exactly one, `['true', 'true', 'true']` —
   *collected by searching*.
3. A list of one way is odd — *fact 33*.
4. So Bob reads 0 when Alice sends 0 — *rule 35*.

The other three answers have the same shape, each with exactly one way.

---

## Checked, with obligations

The checker matched **12** of the proof's 16 steps to their program lines.
Verdict: **checked_with_obligations**.

The 4 obligations are all `collected`: each says a list holds *all* the
ways from one message to its reading — for 0 to 0, that
`['true', 'true', 'true']` is the only way. A proof can show that a way
exists; "and there are no others" comes from eyemind having searched
everything it knows. The checker records that as an obligation, and
confirmed that nothing in the program or the proof contradicts any of the
4 lists.

This matters here: an odd count could turn even if a way were missing.

---

## Try it

```sh
eyemind examples/superdense-coding.js                          # the answers
eyemind --proof examples/superdense-coding.js                  # answers with their proof
eyemind --goal "path(0, M, P)" examples/superdense-coding.js   # every way for message 0
```

The last lists every way message 0 can travel: one to reading 0, two to
reading 1, two to reading 3. Or open it in the
[playground](https://eyereasoner.github.io/eyemind/playground#example=superdense-coding).

Its sibling, [teleportation.js](https://github.com/eyereasoner/eyemind/blob/main/examples/teleportation.js), runs the companion
protocol, quantum teleportation, in the same theory with the same relations.

---

## Takeaway

Quantum interference can be expressed as ordinary rules plus one twist:
count the ways, keep the odd ones. eyemind shows each answer's ways, and is
upfront that "these are all the ways" is the one thing taken on trust.
