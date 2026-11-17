# Symbolic differentiation in Logical English

*Rules transform an expression tree and evaluate the resulting derivative.*

[symbolic-derivative-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/symbolic-derivative-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/symbolic-derivative-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/symbolic-derivative-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/symbolic-derivative-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=symbolic-derivative-le)

## The question

For f(x) = x*x*x + 2*x, what symbolic derivative follows from the sum and product
rules, and what slopes does that derivative give at x = 0 and x = 3?

## What we tell eyemind

The input explicitly constructs a tree from `sum`, `product`, `variable` and
`constant` terms. Structural rules visit its subexpressions and build a
separate derivative tree. Differentiation is confined to the original tree;
new derivative terms are not fed back as new differentiation requests.

Evaluation visits the derivative's own finite tree. Every value carries its
variable and evaluation point, so values computed at zero cannot mix with
values computed at three. Exact integer addition and multiplication give
the slopes. The derivative tree is retained without algebraic simplification.

## What eyemind concludes

There are two answers. Abbreviating only the two tree arguments, their checked
LS forms are:

```js
analysis(…, …, 0, 2)
analysis(…, …, 3, 29)
```

The actual output retains both complete trees. The numeric results agree with
3*x*x + 2 at the stated points, while the unsimplified derivative records the
individual sum-rule and product-rule applications.

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It checks the
structural rule applications and both exact evaluations, and the same proof
checks against the standalone JavaScript compilation. It trusts the stated
calculus rules: this does not independently prove their mathematical validity.
The example handles its supplied polynomial tree; it does not parse algebraic
prose or implement a general computer algebra system.

## Try it

```sh
node bin/eyemind.js examples/symbolic-derivative-le.le
node bin/eyemind.js --program examples/symbolic-derivative-le.le > /tmp/symbolic-derivative-le.js
node bin/eyemind.js --to le /tmp/symbolic-derivative-le.js
node bin/eyemind.js --proof examples/symbolic-derivative-le.le
node bin/eyemind.js --check-proof examples/proof/symbolic-derivative-le.js examples/symbolic-derivative-le.le
```

Replace `point(x, 0) and point(x, 3)` with `point(x, 2)`: the numeric slope is
14. Add more evaluation points without changing the expression rules. Supporting
another expression constructor requires explicitly stating its traversal,
differentiation and evaluation rules.
