# Socrates in Logical English

*A class rule, compiled into the same LS proof machinery.*

[socrates-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/socrates-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/socrates-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/socrates-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/socrates-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=socrates-le)

## The question

Socrates is a human. Every human is mortal. The question asks for every mortal.

## What we tell eyemind

The input uses [Logical English](https://eyereasoner.github.io/eyemind/LE-SPEC).
Its fixed grammar gives the sentences an explicit LS meaning. Variables are
declared in each sentence; class and relation names retain their spelling.
The source file's comments explain the rule and question.

## What eyemind concludes

The default output is another `.le` file:

```text
Socrates is a mortal.
```

The JavaScript check report includes:

```js
mortal('Socrates')
```

The LE output can supply facts to another LE program. The standalone compilation
uses the filename `socrates-le.js`; proofs and check reports also keep the example's
name with `.js` in their respective directories.

## What the proof establishes

The saved proof is **checked** against the compiled LS program. The same proof
checks against the standalone JavaScript compilation. This establishes the
answers under those facts and rules; the grammar and compiler tests establish
the intended English-to-LS translation. A witness is an LS term, without an
assertion that it denotes a distinct real-world individual.

## Try it

```sh
node bin/eyemind.js examples/socrates-le.le
node bin/eyemind.js --program examples/socrates-le.le > /tmp/socrates-le.js
node bin/eyemind.js --to le /tmp/socrates-le.js
node bin/eyemind.js --proof examples/socrates-le.le
node bin/eyemind.js --check-proof examples/proof/socrates-le.js examples/socrates-le.le
```

Change the class rule to `Every human is animal.` and ask for animals instead.
