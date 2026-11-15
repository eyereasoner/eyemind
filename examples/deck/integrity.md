# Integrity

*A rule that should never fire, and a clear alarm when it does.*

[integrity.js](https://github.com/eyereasoner/eyemind/blob/main/examples/integrity.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/integrity.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/integrity.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/integrity.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=integrity)

---

## The question

A bank keeps a simple promise: no account may have a negative balance. Alice
has 30 in her account; Bob has −5.

A rule like that is an *integrity constraint*: not a way to derive new
facts, but a condition the data must never break. If it is broken, we want
to know at once, and know *which* record broke it.

**Does the data keep the promise, and if not, who breaks it?**

---

## What we tell eyemind

Two accounts and the constraint:

```js
fact(account('alice', 30))
fact(account('bob', -5))
contradiction(account(Owner, Balance), lt(Balance, 0))
```

- `fact(…)` states something plainly true: Alice's account holds 30, Bob's
  holds −5.
- `Owner` and `Balance` are variables: placeholders that take whatever
  values make the rule fit.
- `lt(Balance, 0)` is a **built-in** test, a calculation the language does
  itself: "is Balance less than 0?"
- `contradiction(condition, test)` is a rule whose conclusion is `'false'`:
  *if some Owner has a Balance below 0, the data contradicts itself*. When
  its conditions hold, it stops the run, like a fuse.

---

## What eyemind concludes

```js
// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.
'false'
```

The first line is a comment saying what follows: the run was halted because a
contradiction holds, and it lists what was derived up to that moment, ending
with `'false'`. Here nothing else was derived first, so `'false'` is the only
line.

The program also stops with **exit code 65**. An exit code is the number a
program hands back to whatever started it; 0 means "all fine". eyemind uses
65 to say "a `'false'` was derived: the data breaks a constraint". A script
or pipeline can notice that and stop.

---

## The proof, line by line

Even an alarm comes with its reason. `eyemind --proof` writes it down; this is
the complete proof:

```js
// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.
'false'

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step('false', clause(3), {Owner: 'bob', Balance: -5}, [account('bob', -5), lt(-5, 0)])
```

It has two parts:

- **The claim**: `'false'`, the alarm.
- **The step**: how the claim was derived. A step reads
  `step(what, by which clause, with which values, using what)`. Clauses are
  cited by their number in the program; Alice's fact, clause 1, plays no part.

Read the step as a sentence: *the data contradicts itself, by rule 3, with
`Owner` being Bob and `Balance` being −5, because Bob's account holds −5 and
−5 is less than 0.* Bob's account is a stated fact and −5 < 0 a calculation,
so neither needs a step of its own: the checker looks the fact up in the
program and redoes the calculation. A halted run has no certificate, since
it stopped before answering any question.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. For a halted run, it
replays the recorded firing of each claim: it takes rule 3 from the program,
runs its body from no bindings, finds `account('bob', -5)` among the program's
facts, recomputes −5 < 0, and confirms that the rule's head is `'false'`. A
step the check does not use fails it. This is the complete report:

```js
// Checked claims: these follow from the input program, which halted.
'false'

verdict('checked')
```

The verdict is **checked**: the alarm really follows from the data. The
proof is sound; it is the *data* that is wrong. For a halted run, the verdict
establishes only that its claims follow, not that they are every answer: it
does not say Bob's is the only bad account, since eyemind stops at the first
violation it finds.

---

## Try it

```sh
eyemind examples/integrity.js; echo "exit code: $?"
eyemind --proof examples/integrity.js
```

Change Bob's balance to `fact(account('bob', 5))` and run again: eyemind
prints only `// No conclusions: the program derives no facts.`, and the exit
code is 0. Make Alice's balance −30 as well: the run still halts with
`'false'`, but now the proof points at Alice, the first account eyemind
checks; Bob's case is never reached.

---

## Takeaway

A good constraint fails loudly and explains itself. Here the run stops with a
distinct exit code, and the checked proof points straight at Bob's −5.
