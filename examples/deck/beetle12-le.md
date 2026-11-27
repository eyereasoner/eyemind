# Beetle with nested alternatives in Logical English

*Nine terminal cases all entail beauty.*

[beetle12-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/beetle12-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/beetle12-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/beetle12-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/beetle12-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=beetle12-le)

## The question

The beetle is a car, so it is green or blue. Blue entails beauty. Green
leads to nice or pretty, and each of those branches twice more. Does every
possible case entail beauty?

## What we tell eyemind

The `has property … or …` and `entails … or …` templates record pairs of
alternatives. Blue and the eight terminal properties under green entail
beauty directly. The recursive rule gives a property a guarantee of beauty
when both alternatives it entails have that guarantee. The beetle is
beautiful when both of its possible colours guarantee beauty. See
[disjunction elimination](https://en.wikipedia.org/wiki/Disjunction_elimination).

## What eyemind concludes

```text
% query beautiful
beetle is beautiful.
```

The checked answer is an LS term.

```js
struct('le:answer', 'beautiful')
```

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It derives
guarantees at the leaves before deriving them at the forks. For example,
`nice21` and `nice22` support `nice2`, which together with `nice1` supports
`nice`. The `--explain` output follows the chain through both the nice and
pretty branches to establish the guarantee from green.

## Try it

```sh
node bin/eyemind.js examples/beetle12-le.le
node bin/eyemind.js --program examples/beetle12-le.le > /tmp/beetle12-le.js
node bin/eyemind.js --proof examples/beetle12-le.le
node bin/eyemind.js --check-proof examples/proof/beetle12-le.js examples/beetle12-le.le
node bin/eyemind.js --explain examples/beetle12-le.le
```

Remove `nice22 entails beauty.` The query has no answer because that leaf
leaves the green alternative without a guarantee.
