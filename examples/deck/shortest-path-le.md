# Shortest paths in Logical English

*Two minimum-cost paths survive a cycle and a strictly-cheaper test.*

[shortest-path-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/shortest-path-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/shortest-path-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/shortest-path-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/shortest-path-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=shortest-path-le)

## The question

A walker must travel from the atrium to the harbor. The library and garden
routes both take ten minutes; the direct road takes fifteen. A return road
from the library to the atrium makes unrestricted path enumeration infinite.

## What we tell eyemind

Roads have exact integer costs. A recursive rule extends paths, retaining their
cost, number of roads and a nested history term. A four-road limit bounds the
construction even when a path revisits the atrium.

A second rule derives a counterexample for every cost that has a strictly
cheaper competitor to the same destination. Only after that relation is complete
does an absence test select the minimum costs. Equality does not eliminate a tie.

## What eyemind concludes

Both alternatives are retained in the checked LS answers:

```js
bestRoute('Harbor', 10, via(via(start('Atrium'), 'Library'), 'Harbor'))
bestRoute('Harbor', 10, via(via(start('Atrium'), 'Garden'), 'Harbor'))
```

The default output expresses the same terms in a `.le` document. It includes the
whole route, rather than just a claim that the harbor is reachable.

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It establishes
both minimum-cost answers among the routes of at most four roads, including
the absence of a cheaper candidate in that finite search. The same proof checks
against the standalone JavaScript compilation. It does not establish an optimum
for an unbounded graph or for a different set of roads.

## Try it

```sh
node bin/eyemind.js examples/shortest-path-le.le
node bin/eyemind.js --program examples/shortest-path-le.le > /tmp/shortest-path-le.js
node bin/eyemind.js --to le /tmp/shortest-path-le.js
node bin/eyemind.js --proof examples/shortest-path-le.le
node bin/eyemind.js --check-proof examples/proof/shortest-path-le.js examples/shortest-path-le.le
```

Change the direct road's cost from 15 to 5: it becomes the sole minimum.
Change the road limit from 4 to 1: the direct fifteen-minute route is the only
candidate. Removing the limit can make cyclic path construction continue forever.
