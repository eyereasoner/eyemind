# Inheritance without a will in Logical English

*Estates divided by branch through generations, a spouse's usufruct or quarter, and totals that prove nothing was lost or counted twice.*

[intestate-succession-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/intestate-succession-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/intestate-succession-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/intestate-succession-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/intestate-succession-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=intestate-succession-le)

---

## The question

Marie leaves 240000 and Jan leaves 90000, neither with a will. Under the
[French Code civil](https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070721),
who inherits how much from each? Some of their children died first, one
renounced, and one was convicted of killing her mother. Marie's husband and
Jan's wife both chose the usufruct of the estate.

The program is a simplified model of descendants and a spouse only: it leaves
out wills, the reserved portion, other relatives and earlier gifts.

---

## What we tell eyemind

- **Article 726**: whoever is convicted of killing the deceased is unworthy to
  inherit.
- **Article 805**: a renouncer is deemed never to have been an heir. So a
  person does not inherit in person who died first, is unworthy or renounced.
- **Articles 751 to 755**: such a person is represented by their own
  descendants, to any depth, and the share is split by branch. A child with
  no heir in person anywhere below them is cut off, and the others share
  their part.
- **Article 757**: the spouse chooses the usufruct of the whole estate or a
  quarter of it, but takes the quarter when a child is not the spouse's.
- **Article 735**: what the spouse does not own is split equally among the
  branches.

Passing a share down is recursive: a represented person passes on what their
parent passed on, divided by
`the count of each child such that the child is a branch of the parent in the estate of the deceased`.
A last rule adds up every
heir's share and the spouse's quarter with two sums, and each scenario expects
the estate back.

---

## What eyemind concludes

```text
% query heirs with scenario Marie
Anne inherits 80000 from Marie.
Chloe inherits 40000 from Marie.
David inherits 40000 from Marie.
Emma inherits 80000 from Marie.

% query usufruct with scenario Marie
Paul has the usufruct of the estate of Marie.

% query represented with scenario Marie
Bruno is represented in the estate of Marie.
Claire is represented in the estate of Marie.

% query totals with scenario Marie
the shares of the estate of Marie add up to 240000.

% query heirs with scenario Jan
Kim inherits 33750 from Jan.
Uma inherits 16875 from Jan.
Wim inherits 16875 from Jan.

% query spouse with scenario Jan
Lea receives 22500 from Jan as surviving spouse.

% query represented with scenario Jan
Tom is represented in the estate of Jan.
Vic is represented in the estate of Jan.

% query totals with scenario Jan
the shares of the estate of Jan add up to 90000.
```

Marie's estate has three branches: Anne, Bruno through his children, and the
unworthy Claire through her daughter Emma. Denis renounced and Fabien died
first, both without descendants, so they are cut off. Paul keeps the
usufruct, and the four heirs inherit the bare ownership.

Lea chose the usufruct too, but Tom is not her son, so she takes a quarter.
Tom's 33750 goes half to Uma and half through Vic, who also died first, to
Wim.

The check report holds the answers as terms:

```js
struct('le:answer', 'heirs', 'Jan', 'Wim', 16875, 'Jan')
struct('le:answer', 'totals', 'Marie', 'Marie', 240000)
```

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. Who is cut
off, who has the usufruct and who inherits in person rest on negations, and
the shares on counts and sums; the checker decides each from complete tables.
So the totals rest on every share there is: a share counted twice, such as
that of a child of both spouses found through each parent, or a branch left
out, would change them.

---

## Try it

```sh
node bin/eyemind.js examples/intestate-succession-le.le
node bin/eyemind.js --program examples/intestate-succession-le.le > /tmp/intestate-succession-le.js
node bin/eyemind.js --proof examples/intestate-succession-le.le
node bin/eyemind.js --check-proof examples/proof/intestate-succession-le.js examples/intestate-succession-le.le
node bin/eyemind.js --explain examples/intestate-succession-le.le
```

Add
`Wim renounced the estate of Jan.`
and Vic's branch is cut off: Uma inherits all of Tom's 33750. Remove
`Lea chose the usufruct.` and nothing changes, since Tom is not hers. The
first change makes the output report that the heirs are not as expected.
