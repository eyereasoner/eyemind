# An inconsistent door

*A locked and open door triggers an integrity violation.*

[fuse-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/fuse-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/fuse-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/fuse-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/fuse-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=fuse-n3)

---

## The question

What happens when the same door is both locked and open?

---

## What the program says

`fuse-n3.n3`:

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

The check report records the corresponding claim as a JavaScript expression:

```js
// Checked claims: these follow from the input program, which halted.
'false'
```

---

## What the proof establishes

The run halted, so the proof holds its one claim, `'false'`, and one step:

```js
step('false', clause(3), {D: iri('http://example.org/door#door')}, [rdf(iri('http://example.org/door#door'), iri('http://example.org/door#state'), iri('http://example.org/door#locked')), rdf(iri('http://example.org/door#door'), iri('http://example.org/door#state'), iri('http://example.org/door#open'))])
```

It reads: *`'false'` holds by clause 3 of the compiled program, the fuse,
with `D` the door, because the door is both locked and open.* The checker
replays that firing against the source program: it runs the fuse from no
bindings, finds both state triples among the program's facts, and obtains
`'false'` again. The saved report ends with `verdict('checked')`.

For a halted run this establishes that its claim follows from the program,
not that the claims are every answer: the run stopped at the contradiction,
so there are no questions to answer.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/fuse-n3.n3
node bin/eyemind.js --proof examples/fuse-n3.n3
node bin/eyemind.js --check-proof examples/proof/fuse-n3.js examples/fuse-n3.n3
```
