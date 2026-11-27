# Beetle with impossible alternatives in Logical English

*Two successive eliminations show that the beetle is nice.*

[beetle6-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/beetle6-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/beetle6-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/beetle6-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/beetle6-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=beetle6-le)

## The question

Every car is green or blue. Green things are nice or pretty, and blue and
pretty things are beautiful. Cars cannot be beautiful. Does it follow that
the beetle is nice? Which properties does the beetle have?

## What we tell eyemind

The `has property … or …` template keeps the two alternatives together in a
rule conclusion. The `cannot have property` template records an explicit
impossibility. If a property entails an impossible consequence, that
property is impossible too. Either alternative follows once the other has
been ruled out. See [disjunctive syllogism](https://en.wikipedia.org/wiki/Disjunctive_syllogism).

## What eyemind concludes

```text
% query nice
beetle is nice.

% query properties
beetle has property green.
beetle has property nice.
```

The checked answers are LS terms.

```js
struct('le:answer', 'properties', 'green')
struct('le:answer', 'nice')
struct('le:answer', 'properties', 'nice')
```

## What the proof establishes

The saved proof is **checked** against the compiled LS program. The fact
that the beetle is a car makes beauty impossible. Blue entails beauty, so
the first disjunction forces green. Green gives the further alternatives
nice or pretty. Pretty also entails beauty, leaving nice as the remaining
alternative.

## Try it

```sh
node bin/eyemind.js examples/beetle6-le.le
node bin/eyemind.js --program examples/beetle6-le.le > /tmp/beetle6-le.js
node bin/eyemind.js --proof examples/beetle6-le.le
node bin/eyemind.js --check-proof examples/proof/beetle6-le.js examples/beetle6-le.le
node bin/eyemind.js --explain examples/beetle6-le.le
```

Remove `pretty entails beautiful.` The first elimination still proves that
the beetle is green, but `nice` loses its answer and leaves the property
list, because pretty remains possible.
