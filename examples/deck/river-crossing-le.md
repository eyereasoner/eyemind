# River crossing in Logical English

*A finite planning problem with states as lists and guarded moves.*

[river-crossing-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/river-crossing-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/river-crossing-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/river-crossing-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/river-crossing-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=river-crossing-le)

## The question

A farmer must take a wolf, a goat and a cabbage across a river in a boat that
holds the farmer and one item. Left alone, the wolf eats the goat and the goat
eats the cabbage. Which plans bring everyone to the left bank within seven
crossings?

## What we tell eyemind

A state lists the banks of the farmer, the wolf, the goat and the cabbage, as
in `[right, right, right, right]`. A move matches a pattern with a repeated
variable: `the state = [F, F, G, C]` holds when the wolf is on the farmer's
bank, so the farmer can carry it. A state is safe when the farmer is with the
goat, or the goat is with neither the wolf nor the cabbage; the indentation
groups the second alternative's two conditions.

A plan is the list of what each crossing carries. It is empty at the goal, and
otherwise one safe move followed by a plan from the next state, with one
crossing fewer to spend.

## What eyemind concludes

```text
% query plans
[goat, nothing, wolf, goat, cabbage, nothing, goat] takes the crew from [right, right, right, right] to the left bank in at most 7 crossings.
[goat, nothing, cabbage, goat, wolf, nothing, goat] takes the crew from [right, right, right, right] to the left bank in at most 7 crossings.
```

```js
struct('le:answer', 'plans', ['goat', 'nothing', 'wolf', 'goat', 'cabbage', 'nothing', 'goat'])
```

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It establishes
the complete answers within the seven-crossing bound under the stated safety
and boat rules. Every shorter plan is also within that bound, and none
succeeds. The model has exactly two banks and does not account for travel
times or other cargo.

## Try it

```sh
node bin/eyemind.js examples/river-crossing-le.le
node bin/eyemind.js --program examples/river-crossing-le.le > /tmp/river-crossing-le.js
node bin/eyemind.js --proof examples/river-crossing-le.le
node bin/eyemind.js --check-proof examples/proof/river-crossing-le.js examples/river-crossing-le.le
```

Reduce the crossing limit to 6: the query has no answers. Increase it to 9:
additional plans with wasted crossings appear. The bound limits the recursive
search rather than merely hiding a long output.
