# Permissions

*Who may read and write, and why a suspended editor may not.*

[permissions.js](https://github.com/eyereasoner/eyemind/blob/main/examples/permissions.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/permissions.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/permissions.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/permissions.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=permissions)

---

## The question

Many computer systems hand out rights through *roles*: editors may read and
write documents, viewers may only read them. On top of that, a person can be
*suspended*, and a suspended person may do nothing at all.

Alice and Carol are editors, Bob is a viewer, and Carol is suspended.

**Who is allowed to do what?**

---

## What we tell eyemind

```js
fact(role('alice', 'editor'))
fact(role('bob', 'viewer'))
fact(role('carol', 'editor'))
fact(permits('editor', 'read'))
fact(permits('editor', 'write'))
fact(permits('viewer', 'read'))
fact(suspended('carol'))
implies([role(User, Role), permits(Role, Action)], candidate(User, Action))
implies([candidate(User, Action), not(suspended(User))], allowed(User, Action))
query(allowed(User, Action))
```

The seven `fact(...)` lines are the data, numbered 1 to 7 in program order:
who has which role, what each role permits, and who is suspended.

The two `implies(premise, conclusion)` lines are **rules**, numbered 8 and 9:
whenever the premise holds, eyemind concludes the conclusion. Capitalized
names (`User`, `Role`, `Action`) are **variables**, blanks that stand for
whatever fits; square brackets around several conditions mean *all of these*.

- Rule 8: if a user has a role, and that role permits an action, the user is
  a *candidate* for that action.
- Rule 9: a candidate is *allowed* the action, provided the user is not
  suspended.

`not(suspended(User))` means "the program contains no `suspended` fact for
this user". This is called **negation as failure**: something counts as false
when it cannot be found. It assumes a **closed world**, in which the program
is taken to contain everything that is true.

The last line is the question: list every `allowed(User, Action)` that holds.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
allowed('alice', 'read')
allowed('alice', 'write')
allowed('bob', 'read')
```

Alice may read and write, and Bob may read. Carol is a candidate for reading
and writing, as an editor, but she is suspended, so she gets nothing.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
allowed('alice', 'read')
allowed('alice', 'write')
allowed('bob', 'read')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(role('alice', 'editor')))
clause(2, fact(role('bob', 'viewer')))
clause(4, fact(permits('editor', 'read')))
clause(5, fact(permits('editor', 'write')))
clause(6, fact(permits('viewer', 'read')))
clause(8, implies([role(User, Role), permits(Role, Action)], candidate(User, Action)))
clause(9, implies([candidate(User, Action), not(suspended(User))], allowed(User, Action)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(allowed('alice', 'read'), clause(9), {User: 'alice', Action: 'read'}, [candidate('alice', 'read'), not(suspended('alice'))])
step(candidate('alice', 'read'), clause(8), {User: 'alice', Role: 'editor', Action: 'read'}, [role('alice', 'editor'), permits('editor', 'read')])
step(role('alice', 'editor'), clause(1), {}, [])
step(permits('editor', 'read'), clause(4), {}, [])
step(not(suspended('alice')), 'absent', {}, [])
step(allowed('alice', 'write'), clause(9), {User: 'alice', Action: 'write'}, [candidate('alice', 'write'), not(suspended('alice'))])
step(candidate('alice', 'write'), clause(8), {User: 'alice', Role: 'editor', Action: 'write'}, [role('alice', 'editor'), permits('editor', 'write')])
step(permits('editor', 'write'), clause(5), {}, [])
step(allowed('bob', 'read'), clause(9), {User: 'bob', Action: 'read'}, [candidate('bob', 'read'), not(suspended('bob'))])
step(candidate('bob', 'read'), clause(8), {User: 'bob', Role: 'viewer', Action: 'read'}, [role('bob', 'viewer'), permits('viewer', 'read')])
step(role('bob', 'viewer'), clause(2), {}, [])
step(permits('viewer', 'read'), clause(6), {}, [])
step(not(suspended('bob')), 'absent', {}, [])
```

It has three parts:

- **The claims**: the three answers the proof is about.
- **The clauses**: the program lines the steps rely on, by their number.
  Facts 3 and 7 (Carol's role and her suspension) are missing: no answer
  rests on them.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *Alice may read*: by rule 9 with `User` = alice and `Action` = read,
   because she is a candidate to read and she is not suspended.
2. *Alice is a candidate to read*: by rule 8 with `Role` = editor, because
   she is an editor and editors may read.
3. *Alice is an editor*: fact 1.
4. *Editors may read*: fact 4.
5. *Alice is not suspended*: justified as `'absent'`. eyemind looked for
   `suspended('alice')` and found nothing.
6. *Alice may write*: by rule 9, because she is a candidate to write and not
   suspended (step 5 serves again).
7. *Alice is a candidate to write*: by rule 8, because she is an editor
   (step 3 serves again) and editors may write.
8. *Editors may write*: fact 5.
9. *Bob may read*: by rule 9, because he is a candidate to read and not
   suspended.
10. *Bob is a candidate to read*: by rule 8 with `Role` = viewer.
11. *Bob is a viewer*: fact 2.
12. *Viewers may read*: fact 6.
13. *Bob is not suspended*: `'absent'`, like step 5.

Steps 5 and 13 are different in kind. They do not point at a program line;
they point at a line that is *missing*. A proof cannot show something
missing, but the checker can look for it: `suspended` is defined only by
facts, so it reads those facts itself and confirms that none is about Alice
or Bob.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
allowed('alice', 'read')
allowed('alice', 'write')
allowed('bob', 'read')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 11)
condition('C2', 'well_founded', 'ok', 13)
condition('C3', 'justification', 'ok', 13)
condition('C4', 'coverage', 'ok', 15)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 2)
condition('C7', 'relevance', 'ok', 16)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(13)
verified(11)
recomputed(0)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (11)**: the 11 steps that cite a program line really are
  instances of it. Step 2, for example, is rule 8 with `User` = alice,
  `Role` = editor and `Action` = read.
- **C2 well-founded (13)**: none of the 13 steps depends on itself, even
  indirectly.
- **C3 justification (13)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (15)**: the 3 answers and the 12 things the steps use are
  each backed by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (2)**: the 2 absences were confronted with the
  evidence. Nothing in the proof shows Alice or Bob suspended, so neither is
  refuted.
- **C7 relevance (16)**: the 3 answers each answer the question, and all 13
  steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

Neither absence is taken on trust. Because no rule concludes `suspended`,
the checker settles "Alice is not suspended" and "Bob is not suspended" by
scanning the program's facts directly, so the proof needs no search
certificate and the report lists no obligations. The absence holds *within
this program*: these are the facts we gave, and nobody outside it was asked.

The statistics: 13 steps, 11 verified against the program and the 2 absences
settled from the facts, none trusted, for 3 claims. The verdict is
**checked**: the three answers follow from the program. If Bob were in fact
suspended somewhere the program does not know about, the answer for Bob
would be wrong, but that is a question about the data, not about the
proof. And as the last comment says, the verdict confirms these
answers; it does not say they are the only ones.

---

## Try it

```sh
eyemind examples/permissions.js
eyemind --check-proof examples/proof/permissions.js examples/permissions.js
```

Delete the line `fact(suspended('carol'))` and run again: Carol is now
allowed to read and write, like Alice. Add `fact(suspended('bob'))` instead:
Bob's answer disappears, and only Alice's two remain.

---

## Takeaway

"Allowed unless excluded" decisions rest on what is *not* in the data.
eyemind makes those absences visible, so you know exactly what you are
trusting when you grant access.
