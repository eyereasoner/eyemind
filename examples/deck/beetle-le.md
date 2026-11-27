# Beetle in Logical English

*A car is beautiful in either of its two possible colours.*

[beetle-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/beetle-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/beetle-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/beetle-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/beetle-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=beetle-le)

## The question

The beetle is a car, and every car is green or blue. Green things are
beautiful, and blue things are beautiful. Is the beetle beautiful?

## What we tell eyemind

The rule for cars concludes `beetle has property green or blue` using the
`has property … or …` template. The facts `green entails beauty` and
`blue entails beauty` cover both alternatives, so either colour is enough to
prove beauty. See
[disjunction elimination](https://en.wikipedia.org/wiki/Disjunction_elimination).

## What eyemind concludes

```text
% query beautiful
beetle is beautiful.
```

The check report records the yes-or-no answer as an LS term.

```js
struct('le:answer', 'beautiful')
```

## What the proof establishes

The saved proof is **checked** against the compiled LS program. The
explanation shows where the possibilities come from and why each one is
sufficient.

```text
% query beautiful
beetle is beautiful
    because beetle has property green or blue
        because beetle is a car
    and green entails beauty
    and blue entails beauty.
```

## Try it

```sh
node bin/eyemind.js examples/beetle-le.le
node bin/eyemind.js --program examples/beetle-le.le > /tmp/beetle-le.js
node bin/eyemind.js --proof examples/beetle-le.le
node bin/eyemind.js --check-proof examples/proof/beetle-le.js examples/beetle-le.le
node bin/eyemind.js --explain examples/beetle-le.le
```

Remove either colour's entailment. The query then has no answers because
the remaining fact covers only one possibility.
