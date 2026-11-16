# Squares in Mathematical English

*Bound variables connect exact arithmetic to relational conclusions.*

[squares-me.me](https://github.com/eyereasoner/eyemind/blob/main/examples/squares-me.me) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/squares-me.me) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/squares-me.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/squares-me.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=squares-me)

## The question

The supplied integers are -3, 0 and 4. The rule computes a square for each; it does not enumerate the integers.

## What we tell eyemind

The input uses [controlled Mathematical English](https://eyereasoner.github.io/eyemind/MATHEMATICAL-ENGLISH).
Its fixed grammar gives the sentences an explicit LS meaning. Variables are
declared in each sentence; class and relation names retain their spelling.
The source file's comments explain the rule and question.

## What eyemind concludes

The default output is another `.me` file:

```text
9 is a square of -3.
0 is a square of 0.
16 is a square of 4.
```

The JavaScript check report includes:

```js
square(9, -3)
```

The ME output can supply facts to another ME program. The standalone compilation
uses the filename `squares-me.js`; proofs and check reports also keep the example's
name with `.js` in their respective directories.

## What the proof establishes

The saved proof is **checked** against the compiled LS program. The same proof
checks against the standalone JavaScript compilation. This establishes the
answers under those facts and rules; the grammar and compiler tests establish
the intended English-to-LS translation. A witness is an LS term, without an
assertion that it denotes a distinct real-world individual.

## Try it

```sh
node bin/eyemind.js examples/squares-me.me
node bin/eyemind.js --program examples/squares-me.me > /tmp/squares-me.js
node bin/eyemind.js --to me /tmp/squares-me.js
node bin/eyemind.js --proof examples/squares-me.me
node bin/eyemind.js --check-proof examples/proof/squares-me.js examples/squares-me.me
```

Add another integer fact to compute its square. Integer multiplication stays exact even above the exact integer range of a double.
