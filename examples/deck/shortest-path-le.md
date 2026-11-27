# Shortest paths in Logical English

*Two minimum-cost routes, built as lists, survive a cycle.*

[shortest-path-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/shortest-path-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/shortest-path-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/shortest-path-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/shortest-path-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=shortest-path-le)

## The question

A walker in the atrium can reach the harbor through the library, through the
garden or along a direct road. A return road from the library to the atrium
makes a cycle. Which routes take the least time?

## What we tell eyemind

A route is the list of places it passes, such as `[atrium, library, harbor]`.
One rule takes a single road; the other takes a road to a middle place and a
route from there, never returning to its start (`it is not the case that the
place is in the rest`), and puts the place in front of the rest with
`the route has the place as head before the rest`.

Logical English rules run backward, as Prolog runs them, so the number of
roads a route may use is part of the template and goes down by one on every
road. That bound ends the search around the cycle. A best route takes the
minimum time of all routes of at most four roads.

## What eyemind concludes

```text
% query best with scenario town
[atrium, library, harbor] is a best route from atrium to harbor in 10 minutes.
[atrium, garden, harbor] is a best route from atrium to harbor in 10 minutes.
```

```js
struct('le:answer', 'best', 'town', ['atrium', 'library', 'harbor'], 10)
struct('le:answer', 'best', 'town', ['atrium', 'garden', 'harbor'], 10)
```

The library and garden routes tie at ten minutes; the direct road takes
fifteen.

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It establishes
both minimum-time answers among the routes of at most four roads, including
the minimum over every such route. It does not establish an optimum for an
unbounded graph or for a different set of roads.

## Try it

```sh
node bin/eyemind.js examples/shortest-path-le.le
node bin/eyemind.js --program examples/shortest-path-le.le > /tmp/shortest-path-le.js
node bin/eyemind.js --proof examples/shortest-path-le.le
node bin/eyemind.js --check-proof examples/proof/shortest-path-le.js examples/shortest-path-le.le
node bin/eyemind.js --explain examples/shortest-path-le.le
```

Change the direct road's time from 15 to 5: it becomes the sole best route.
Change both limits of 4 roads to 1: the direct fifteen-minute route is the only
candidate.
