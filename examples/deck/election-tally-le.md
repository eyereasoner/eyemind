# Election tally in Logical English

*Eligible voters, spoiled votes, a tie for the most votes and a quorum.*

[election-tally-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/election-tally-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/election-tally-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/election-tally-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/election-tally-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=election-tally-le)

---

## The question

Three candidates stand in a plurality election. Registered voters may vote,
and provisional voters once verified. A voter who chooses two different
candidates spoils their vote; a repeated ballot for the same candidate counts
once. Who wins, and do enough eligible voters take part to meet a quorum of
half?

---

## What we tell eyemind

Each ballot is a sentence such as `v6 casts ballot 6 for Hana.` A voter is
eligible when registered, or provisional and verified; the second alternative
is indented below the `or`, so that its two conditions belong together.

Logical English counts every solution it finds, so the rules say which ballot
counts: an eligible voter's ballot for a candidate counts unless the voter
spoils their vote, and unless the voter cast an earlier ballot for that
candidate. v6's second ballot for Hana therefore adds nothing. In the same way
a voter takes part with their first ballot.

The winners are the candidates whose count equals the maximum of all counts,
so a tie keeps both.

---

## What eyemind concludes

```text
% query votes with scenario count
Hana receives 3 votes.
Ravi receives 3 votes.
Sven receives 1 votes.

% query spoiled with scenario count
v7 spoils their vote.

% query winners with scenario count
Hana wins.
Ravi wins.

% query quorum with scenario count
the quorum is met.
```

Eight of the eleven eligible voters take part, v7 among them although the vote
is spoiled. v10 is provisional and not verified, so their ballot for Sven does
not count.

```js
struct('le:answer', 'winners', 'count', 'Hana')
struct('le:answer', 'winners', 'count', 'Ravi')
struct('le:answer', 'quorum', 'count')
```

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. The counts are
collections decided from complete tables of ballots and eligible voters, and
each excluded ballot rests on a negation the checker replays. The winners
follow from comparing each count with the maximum over all counts, so the tie
is part of the checked result.

---

## Try it

```sh
node bin/eyemind.js examples/election-tally-le.le
node bin/eyemind.js --program examples/election-tally-le.le > /tmp/election-tally-le.js
node bin/eyemind.js --proof examples/election-tally-le.le
node bin/eyemind.js --check-proof examples/proof/election-tally-le.js examples/election-tally-le.le
node bin/eyemind.js --explain examples/election-tally-le.le
```

Add `v10 is verified.`: Sven's count rises to 2, but Hana and Ravi still tie.
Remove v7's ballot for Sven and Hana wins alone with four votes.
