# Squares

*A forward rule binds a square by arithmetic, then concludes a relation.*

[squares.js](https://github.com/eyereasoner/eyemind/blob/main/examples/squares.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/squares.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/squares.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/squares.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=squares)

## The question

The supplied integers are −3, 0 and 4. What is the square of each? The rule
computes a square for each supplied integer; it does not enumerate the
integers.

## What we tell eyemind

Three facts and one forward rule:

```js
fact(integer(-3), integer(0), integer(4))
implies([integer(X), is(Y, mul(X, X))], square(Y, X))
query(square(Y, X))
```

`is(Y, mul(X, X))` evaluates the product and binds `Y`, so the conclusion is
ground. In Logical English, with the templates `*a number* is an integer` and
`*a number* is the square of *a number*`, the same rule reads
`a number Y is the square of a number X if X is an integer and Y = X * X.`

## What eyemind concludes

```js
square(9, -3)
square(0, 0)
square(16, 4)
```

## What the proof establishes

The saved proof is **checked** against the program. It establishes each
square from the supplied facts and the rule, with exact integer
multiplication.

## Try it

```sh
node bin/eyemind.js examples/squares.js
node bin/eyemind.js --check-proof examples/proof/squares.js examples/squares.js
```

Add `fact(integer(9007199254740993n))`: its square,
81129638414606699710187514626049, is computed exactly. An integer beyond
2^53 needs the `n` of a JavaScript BigInt literal in an LS program, since
without it JavaScript rounds the literal before eyemind sees it; Logical
English reads `9007199254740993` exactly as written.
