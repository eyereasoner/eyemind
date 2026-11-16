# Socrates in Mathematical English

*A class rule, compiled into the same LS proof machinery.*

[socrates-me.me](https://github.com/eyereasoner/eyemind/blob/main/examples/socrates-me.me) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/socrates-me.me) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/socrates-me.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/socrates-me.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=socrates-me)

## The question

Socrates is a human. Every human is mortal. The question asks for every mortal.

## What we tell eyemind

The input uses [controlled Mathematical English](https://eyereasoner.github.io/eyemind/MATHEMATICAL-ENGLISH).
Its fixed grammar gives the sentences an explicit LS meaning. Variables are
declared in each sentence; class and relation names retain their spelling.
The source file's comments explain the rule and question.

## What eyemind concludes

The default output is another `.me` file:

```text
Socrates is a mortal.
```

The JavaScript check report includes:

```js
mortal('Socrates')
```

The ME output can supply facts to another ME program. The standalone compilation
uses the filename `socrates-me.js`; proofs and check reports also keep the example's
name with `.js` in their respective directories.

## What the proof establishes

The saved proof is **checked** against the compiled LS program. The same proof
checks against the standalone JavaScript compilation. This establishes the
answers under those facts and rules; the grammar and compiler tests establish
the intended English-to-LS translation. A witness is an LS term, without an
assertion that it denotes a distinct real-world individual.

## Try it

```sh
node bin/eyemind.js examples/socrates-me.me
node bin/eyemind.js --program examples/socrates-me.me > /tmp/socrates-me.js
node bin/eyemind.js --to me /tmp/socrates-me.js
node bin/eyemind.js --proof examples/socrates-me.me
node bin/eyemind.js --check-proof examples/proof/socrates-me.js examples/socrates-me.me
```

Change the class rule to `Every human is animal.` and ask for animals instead.
