# River crossing in Logical English

*A finite planning problem with compound states and guarded transitions.*

[river-crossing-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/river-crossing-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/river-crossing-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/river-crossing-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/river-crossing-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=river-crossing-le)

## The question

In the traditional wolf, goat and cabbage puzzle, a farmer must take all three
across a river. The boat carries the farmer and at most one item. The wolf
cannot remain with the goat without the farmer, and neither can the goat
remain with the cabbage. What legal plans use at most seven crossings?

## What we tell eyemind

A `state(Farmer, Wolf, Goat, Cabbage)` term records four banks. Repeated variables
match animals on the same bank. Two rules mark unattended dangerous states;
stratified absence classifies the remaining states as safe.

Four transition rules cover crossing alone or with one item. Their patterns
require the transported item to start beside the farmer and require both
states to be safe. Recursive plan terms record every move, up to seven steps.

## What eyemind concludes

There are two answers, both with seven crossings. One checked LS answer is:

```js
plan(7, state('right', 'right', 'right', 'right'),
  step(step(step(step(step(step(step('start', 'goat'), 'alone'), 'wolf'), 'goat'), 'cabbage'), 'alone'), 'goat'))
```

Reading the nested history from the innermost step gives: goat, alone, wolf,
goat, cabbage, alone, goat. The second plan exchanges wolf and cabbage.
The farmer returns with the goat in the middle; a move name records the cargo,
while the successive states determine the direction.

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It establishes
the complete answers within the seven-step bound under the stated safety and
boat rules. Every shorter plan is also within that bound, and none succeeds.
The same proof checks against the standalone JavaScript compilation. The model
has exactly two banks and does not account for travel times or other cargo.

## Try it

```sh
node bin/eyemind.js examples/river-crossing-le.le
node bin/eyemind.js --program examples/river-crossing-le.le > /tmp/river-crossing-le.js
node bin/eyemind.js --to le /tmp/river-crossing-le.js
node bin/eyemind.js --proof examples/river-crossing-le.le
node bin/eyemind.js --check-proof examples/proof/river-crossing-le.js examples/river-crossing-le.le
```

Reduce the crossing limit to 6: the question has no answers. Increase it to 9:
additional plans with wasted crossings appear. The finite bound controls
recursive history construction, rather than merely hiding a long output.
