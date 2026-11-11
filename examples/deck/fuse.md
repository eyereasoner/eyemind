# An inconsistent door

*A locked and open door triggers an integrity violation.*

[fuse.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/fuse.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/fuse.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/fuse.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/fuse.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=fuse)

---

## The question

What happens when the same door is both locked and open?

---

## What the program says

`fuse.n3`:

```n3
# An inference fuse: { ... } => false stops the run when its premise holds,
# here a door that is both locked and open. eyemind exits with status 65.
@prefix : <http://example.org/door#>.

:door :state :locked, :open.

{ ?d :state :locked, :open } => false.
```

---

## What eyemind concludes

The N3 output is empty because false is a contradiction, not an RDF triple.

```n3

```

The conjunction holds, so the inference fuse concludes false and the command exits with status 65. The proof records that contradiction; the native N3 writer emits no triple for false.

The check report records the corresponding claims as JavaScript expressions:

```js
// Checked answers: these follow from the input program.
'false'
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`. The report has no remaining obligations.
C1 checks each inference against the compiled source clauses, C5 re-decides
primitive computations, C8 checks any fresh witness, and C10 checks the
original questions against the proof's call tables. The checker follows the
certificate without calling the reasoning engine.

The verdict certifies the displayed claims; it does not assert that an
arbitrary proof lists every possible answer.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/fuse.n3
node bin/eyemind.js --proof examples/fuse.n3
node bin/eyemind.js --check-proof examples/proof/fuse.n3 examples/fuse.n3
```
