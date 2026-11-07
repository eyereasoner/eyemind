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

// Clauses: the program clauses the steps cite, by clause number.
clause(2, fact(account('bob', -5)))
clause(3, contradiction(account(Owner, Balance), lt(Balance, 0)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step('false', clause(3), {Owner: 'bob', Balance: -5}, [account('bob', -5), lt(-5, 0)])
step(account('bob', -5), clause(2), {}, [])
step(lt(-5, 0), 'builtin', {}, [])
```

It has three parts:

- **The claim**: `'false'`, the alarm.
- **The clauses**: the program lines the proof relies on, by their number in
  the program. Alice's fact, clause 1, is not listed: it played no part in
  the violation.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.

Read the steps as sentences:

1. *The data contradicts itself* — by rule 3, with `Owner` being Bob and
   `Balance` being −5, because Bob's account holds −5 and −5 is less than 0.
2. *Bob's account holds −5* — fact 2; it uses nothing.
3. *−5 is less than 0* — `'builtin'`: a calculation, which anyone checking
   the proof simply redoes.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
'false'

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 2)
condition('C2', 'well_founded', 'ok', 3)
condition('C3', 'justification', 'ok', 3)
condition('C4', 'coverage', 'ok', 3)
condition('C5', 're_decision', 'ok', 1)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 4)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(3)
verified(2)
recomputed(1)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (2)**: the 2 steps that cite a program line really are
  instances of it: step 1 is rule 3 with `Owner` = Bob and `Balance` = −5,
  and step 2 is fact 2.
- **C2 well-founded (3)**: none of the 3 steps depends on itself, even
  indirectly.
- **C3 justification (3)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (3)**: the 1 claim and the 2 things step 1 uses are each
  backed by a step.
- **C5 re-decision (1)**: the one built-in step, −5 < 0, was recomputed and
  holds.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (4)**: the 1 claim is what the program concluded, and all 3
  steps serve it: the proof holds nothing beyond what explains the violation.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 3 steps, 2 verified against the program, 1
recomputed, none taken on trust. The verdict is **checked**: the alarm really
follows from the data. The proof is sound; it is the *data* that is wrong.
The verdict does not say Bob's is the only bad account: eyemind stops at the
first violation it finds.

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
