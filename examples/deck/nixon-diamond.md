# Nixon Diamond

*Two rules of thumb disagree about one person: which one wins, and why.*

[nixon-diamond.js](https://github.com/eyereasoner/eyemind/blob/main/examples/nixon-diamond.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/nixon-diamond.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/nixon-diamond.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/nixon-diamond.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=nixon-diamond)

---

## The question

A *default* is a rule of thumb: it holds unless something says otherwise.
In this fictional rulebook, Quakers are pacifists by default, and
Republicans are nonpacifists.

Nixon is both a Quaker and a Republican. Ada is only a Quaker.
**Is Nixon a pacifist? Is Ada?**

Drawn as a picture, Nixon sits at the bottom of a diamond with one path up
to *pacifist* and one to *nonpacifist*: hence the name.

---

## What we tell eyemind

```js
fact(quaker('nixon'))
fact(republican('nixon'))
fact(quaker('ada'))

implies([quaker(Person), not(nonpacifist(Person))], pacifist(Person))
implies(republican(Person), nonpacifist(Person))

implies(quaker(Person), classification(Person, 'quaker'))
implies(republican(Person), classification(Person, 'republican'))
implies(pacifist(Person), classification(Person, 'pacifist'))
implies(nonpacifist(Person), classification(Person, 'nonpacifist'))

query(classification(Person, Class))
```

The pacifist default carries a guard: `not(nonpacifist(Person))`, "nothing
concludes this person is a nonpacifist". That guard gives the Republican rule
priority.

---

## The default waits its turn

Because the default looks at what the nonpacifist rule concludes, eyemind
runs it only after that rule has finished. This is *stratified negation*:
the "not found" is never asked before all the contrary evidence is in.

---

## What eyemind concludes

```js
classification('nixon', 'quaker')
classification('ada', 'quaker')
classification('nixon', 'republican')
classification('nixon', 'nonpacifist')
classification('ada', 'pacifist')
```

Nixon is a nonpacifist, and *not* a pacifist: the guard blocked the default.
Ada, with nothing against her, gets the default and is a pacifist.

---

## Why: the proof in plain words

For Ada:

1. Ada is a Quaker — *fact 3*.
2. Ada is not a nonpacifist — *searched, nothing found*.
3. So Ada is a pacifist — *rule 4*.
4. So Ada is classified as a pacifist — *rule 8*.

For Nixon:

1. Nixon is a Republican — *fact 2*.
2. So Nixon is a nonpacifist — *rule 5*, which also blocks the default.

---

## Checked, not just claimed

- **11 steps**: **10** verified against the program lines they cite.
- **1** step taken on trust, as an obligation of the kind `absent`:

```js
obligation('absent', 'theory_scoped', not(nonpacifist('ada')))
```

eyemind searched everything it knows and found no reason to call Ada a
nonpacifist. The checker records that absence rather than proving it, and
confirmed that no step in the proof contradicts it.

Verdict: **checked_with_obligations**.

---

## Try it

```sh
eyemind examples/nixon-diamond.js
eyemind --check-proof examples/proof/nixon-diamond.js examples/nixon-diamond.js
```

Delete the line `fact(republican('nixon'))` and run again: nothing blocks the
default any more, and Nixon is classified as a pacifist, like Ada.

---

## Takeaway

When defaults conflict, decide which one wins and write it down. A guarded
default makes the priority explicit, and the proof shows exactly which
"nothing found" each conclusion leans on.
