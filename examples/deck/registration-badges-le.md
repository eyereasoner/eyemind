# Registration badges in Logical English

*A registered visitor's name determines their badge.*

[registration-badges-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/registration-badges-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/registration-badges-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/registration-badges-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/registration-badges-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=registration-badges-le)

## The question

Alice and Bob are registered. Which badge belongs to each visitor? Does
Alice have a blue badge?

## What we tell eyemind

The rule concludes `a visitor has badge ["badge", the visitor]` if the
visitor is registered. The badge is an explicit witness. Its first list
item is the literal name `badge`, and its second item is the same visitor
that the rule checks for registration. Each name therefore determines a
badge that a later query can name directly. For automatic witness generation
in Logic Script, see [Existential rules](https://eyereasoner.github.io/eyemind/examples/deck/existential-rules).

## What eyemind concludes

```text
% query badges
alice has badge [badge, alice].
bob has badge [badge, bob].

% query blue_badge
% no answers
```

The checked answers contain the badge lists as LS terms.

```js
struct('le:answer', 'badges', 'alice', ['badge', 'alice'])
struct('le:answer', 'badges', 'bob', ['badge', 'bob'])
```

## What the proof establishes

The saved proof is **checked** against the compiled LS program. Each list
matches the conclusion of the badge rule with the same visitor as the
registration fact. The query for a blue badge has no answers because
`blue` cannot match that list.

## Try it

```sh
node bin/eyemind.js examples/registration-badges-le.le
node bin/eyemind.js --program examples/registration-badges-le.le > /tmp/registration-badges-le.js
node bin/eyemind.js --proof examples/registration-badges-le.le
node bin/eyemind.js --check-proof examples/proof/registration-badges-le.js examples/registration-badges-le.le
node bin/eyemind.js --explain examples/registration-badges-le.le
```

Add `casey is registered.` to get the additional answer
`casey has badge [badge, casey].`
