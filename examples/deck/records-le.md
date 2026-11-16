# Records in Logical English

*Explicit absence selects a person; an existential conclusion supplies a record.*

[records-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/records-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/records-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/records-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/records-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=records-le)

## The question

Alice and Bob are people, but Bob has a recorded block. The rule gives an unblocked person a fresh record and an ownership link.

## What we tell eyemind

The input uses [Logical English](https://eyereasoner.github.io/eyemind/LOGICAL-ENGLISH).
Its fixed grammar gives the sentences an explicit LS meaning. Variables are
declared in each sentence; class and relation names retain their spelling.
The source file's comments explain the rule and question.

## What eyemind concludes

The default output is another `.le` file:

```text
Alice is an owner of witness(rule 4, Y, Alice).
```

The JavaScript check report includes:

```js
owner('Alice', skolem(4, 'Y', ['Alice']))
```

The LE output can supply facts to another LE program. The standalone compilation
uses the filename `records-le.js`; proofs and check reports also keep the example's
name with `.js` in their respective directories.
The functional term names the witness for `Y` from rule 4 with Alice as its
argument. Reading it back retains the same LS witness shown in the check report.

## What the proof establishes

The saved proof is **checked** against the compiled LS program. The same proof
checks against the standalone JavaScript compilation. This establishes the
answers under those facts and rules; the grammar and compiler tests establish
the intended English-to-LS translation. A witness is an LS term, without an
assertion that it denotes a distinct real-world individual.

## Try it

```sh
node bin/eyemind.js examples/records-le.le
node bin/eyemind.js --program examples/records-le.le > /tmp/records-le.js
node bin/eyemind.js --to le /tmp/records-le.js
node bin/eyemind.js --proof examples/records-le.le
node bin/eyemind.js --check-proof examples/proof/records-le.js examples/records-le.le
```

Add `Alice is blocked.`: the question has no answers. The absence test is a statement about this program's evidence, rather than a claim that no real-world block exists.
