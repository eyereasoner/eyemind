# Election tally in Logical English

*Eligible voters, spoiled votes, a tie for the most votes and a quorum.*

[election-tally-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/election-tally-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/election-tally-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/election-tally-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/election-tally-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=election-tally-le)

---

## The question

Twelve people hold a vote for Hana, Ravi or Sven: ten registered voters and two
provisional voters, only one of whom is verified. One voter cast two ballots
for Hana; another voted for both Hana and Sven. Who wins, and did enough
people vote?

---

## What we tell eyemind

A voter is eligible when registered, *or* provisional and verified. A choice
records which candidate a voter chose, dropping the ballot identifier, so two
ballots for one candidate are one choice. A participant is an eligible voter
who made a choice.

A participant with two or more different choices spoils their vote:

```text
N is the number of C such that choice(V, C) and N is at least 2
```

A candidate's vote count is the number of eligible voters who chose them and
of whom *it is not known that* they spoiled their vote. The absence test sits
inside the aggregate's condition, after the premise that supplies the voter.

Every candidate whose count equals the maximum count wins. The quorum is met
when twice the number of participants is at least the number of eligible
voters.

---

## What eyemind concludes

```js
voteCount(3, 'Hana')
voteCount(3, 'Ravi')
voteCount(1, 'Sven')
spoiledVoter('v7')
winner('Hana')
winner('Ravi')
'quorumMet'
```

Hana's votes come from v1, v2 and v6, whose two ballots count once. Ravi's come
from v3, v4 and the verified provisional voter v9. Sven keeps only v5: v7
spoiled their vote and v10 is not eligible. The tie leaves two winners. Eight
of the eleven eligible voters took part, so the quorum is met.

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. The counts are
collections decided from complete tables of choices and eligible voters, and
the excluded spoiled vote rests on the counted choices of v7. The winners
follow from comparing each count with the maximum over all counts, so the tie
is part of the checked result.

---

## Try it

```sh
node bin/eyemind.js examples/election-tally-le.le
node bin/eyemind.js --program examples/election-tally-le.le > /tmp/election-tally-le.js
node bin/eyemind.js --proof examples/election-tally-le.le
node bin/eyemind.js --check-proof examples/proof/election-tally-le.js examples/election-tally-le.le
```

Add `v10 is verified.`: Sven's count rises to 2, but Hana and Ravi still tie.
Remove v7's ballot for Sven and Hana wins alone with four votes.
