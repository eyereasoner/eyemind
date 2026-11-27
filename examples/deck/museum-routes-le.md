# Museum routes in Logical English

*A guarantee of access follows from two levels of route alternatives.*

[museum-routes-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/museum-routes-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/museum-routes-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/museum-routes-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/museum-routes-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=museum-routes-le)

## The question

Alex holds a day pass. From the entrance, the route can lead through the
courtyard or the gallery. Both can lead to the west hall, while the courtyard
can also lead to the east hall and the gallery can also lead to the atrium.
Does every possible route give Alex access to the exhibit?

## What we tell eyemind

The three route rules conclude sentences such as `the entrance leads to the
courtyard or to the gallery`. The words `or to` are part of a declared LE
template. The template compiles to one Logic Script relation that records both
destinations together.

A hall entails access when it has an open door to the exhibit, stated by
facts such as `the east hall has an open door to the exhibit`. A place with a
fork entails access when both destinations entail it. The same rule applies again when a destination
is itself a fork. The west hall supports both the courtyard and the gallery.
See [disjunction elimination](https://en.wikipedia.org/wiki/Disjunction_elimination).

## What eyemind concludes

```text
% query routes with scenario all doors open
the entrance leads to the courtyard or to the gallery.
the courtyard leads to the east hall or to the west hall.
the gallery leads to the west hall or to the atrium.

% query access with scenario all doors open
alex is guaranteed to reach the exhibit.

% query routes with scenario atrium door closed
the entrance leads to the courtyard or to the gallery.
the courtyard leads to the east hall or to the west hall.
the gallery leads to the west hall or to the atrium.

% query access with scenario atrium door closed
% no answers
```

The check report gives the route pairs and the access answer as LS terms.

```js
struct('le:answer', 'routes', 'all doors open', 'the entrance', 'the courtyard', 'the gallery')
struct('le:answer', 'access', 'all doors open')
```

## What the proof establishes

The saved proof is **checked** against the compiled LS program. In the first
scenario the hall facts support the courtyard and gallery, and those two
entail access from the entrance. In the second scenario the atrium door is
closed: nothing states that it is open. The gallery and the entrance therefore have no access guarantee.

`--explain` shows the premise for each pair of alternatives. The entrance
pair follows from the entrance being open.

```text
the entrance leads to the courtyard or to the gallery
    because the entrance is open.
```

## Try it

```sh
node bin/eyemind.js examples/museum-routes-le.le
node bin/eyemind.js --program examples/museum-routes-le.le > /tmp/museum-routes-le.js
node bin/eyemind.js --proof examples/museum-routes-le.le
node bin/eyemind.js --check-proof examples/proof/museum-routes-le.js examples/museum-routes-le.le
node bin/eyemind.js --explain examples/museum-routes-le.le
```

Close the west hall door by removing `the west hall has an open door to the
exhibit.` Neither fork is then covered, and Alex loses the guarantee in both
scenarios.
