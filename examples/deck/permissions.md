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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(allowed('alice', 'read'), clause(9), {User: 'alice', Action: 'read'}, [candidate('alice', 'read'), not(suspended('alice'))])
step(candidate('alice', 'read'), clause(8), {User: 'alice', Role: 'editor', Action: 'read'}, [role('alice', 'editor'), permits('editor', 'read')])
step(allowed('alice', 'write'), clause(9), {User: 'alice', Action: 'write'}, [candidate('alice', 'write'), not(suspended('alice'))])
step(candidate('alice', 'write'), clause(8), {User: 'alice', Role: 'editor', Action: 'write'}, [role('alice', 'editor'), permits('editor', 'write')])
step(allowed('bob', 'read'), clause(9), {User: 'bob', Action: 'read'}, [candidate('bob', 'read'), not(suspended('bob'))])
step(candidate('bob', 'read'), clause(8), {User: 'bob', Role: 'viewer', Action: 'read'}, [role('bob', 'viewer'), permits('viewer', 'read')])
step(candidate('carol', 'read'), clause(8), {User: 'carol', Role: 'editor', Action: 'read'}, [role('carol', 'editor'), permits('editor', 'read')])
step(candidate('carol', 'write'), clause(8), {User: 'carol', Role: 'editor', Action: 'write'}, [role('carol', 'editor'), permits('editor', 'write')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(allowed(A, B), [allowed('alice', 'read'), allowed('alice', 'write'), allowed('bob', 'read')])
derived(candidate(A, B), [candidate('alice', 'read'), candidate('alice', 'write'), candidate('bob', 'read'), candidate('carol', 'read'), candidate('carol', 'write')])
called(allowed(A, B), [allowed('alice', 'read'), allowed('alice', 'write'), allowed('bob', 'read')])
called(candidate(C, D), [candidate('alice', 'read'), candidate('alice', 'write'), candidate('bob', 'read'), candidate('carol', 'read'), candidate('carol', 'write')])
```

It has three parts:

- **The claims**: the three answers the proof is about.
- **The steps**: one per derived fact the answers rest on. A step reads
  `step(what, by which clause, with which values, using what)`, with clauses
  numbered in program order: the six role and permission facts are clauses
  1 to 6, Carol's suspension is fact 7, and the two rules are clauses 8 and 9.
- **The certificate**: the *listings*, `derived(...)`, of every `allowed` and
  every `candidate` fact the rules derive, and the *call tables*,
  `called(...)`, of every answer of each call the question makes: the
  question `allowed(X, Y)` itself, and the `candidate` call rule 9 makes when
  the checker answers it.

Read the steps as sentences:

1. *Alice may read*: by rule 9 with `User` = alice and `Action` = read,
   because she is a candidate to read and she is not suspended.
2. *Alice is a candidate to read*: by rule 8 with `Role` = editor, because
   she is an editor and editors may read.
3. *Alice may write*: by rule 9, because she is a candidate to write and not
   suspended.
4. *Alice is a candidate to write*: by rule 8, because she is an editor and
   editors may write.
5. *Bob may read*: by rule 9, because he is a candidate to read and not
   suspended.
6. *Bob is a candidate to read*: by rule 8 with `Role` = viewer.
7. *Carol is a candidate to read* and 8. *Carol is a candidate to write*: by
   rule 8, like steps 2 and 4.

The stated facts (`role`, `permits`) get no steps: no rule concludes them,
so the checker answers them from the program itself. Steps 7 and 8 answer
no question: they are the firings behind the two Carol facts the
`candidate` listing must hold to be complete.

The uses `not(suspended('alice'))` and `not(suspended('bob'))` have no step
either. A proof cannot show something missing, but the checker can look for
it: `suspended` is defined only by facts, so it searches those facts itself
and finds none about Alice or Bob.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the question.** It expands `allowed(X, Y)` one level: the
  listed `allowed` facts, which rule 9 derives, so the call `candidate(User,
  Action)` inside it is answered from its table. Each table must equal its
  own expansion, so the `candidate` table is checked against rule 8 and the
  facts in the same way.
- **It checks the listings are closed.** Applying rules 8 and 9 to everything
  known derives no `candidate` or `allowed` fact the listings leave out.
  For Carol, rule 9 meets `suspended('carol')`, fact 7, and does not fire.
- **It replays each listed fact.** It re-runs the cited rule from no bindings
  against each step: each `not(suspended(...))` is decided at the binding it
  had when it ran, against the stated facts.
- **It compares the claims with the answers.** Every claim is an answer,
  every answer is claimed, and every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
allowed('alice', 'read')
allowed('alice', 'write')
allowed('bob', 'read')

verdict('checked')
```

Neither absence is taken on trust: the checker decides "Alice is not
suspended" and "Bob is not suspended" from the program's facts. The absence
holds *within this program*: these are the facts we gave, and nobody outside
it was asked.

The verdict is **checked**: the three answers follow from the program, and
they are every answer of its question, so exactly these three permissions
are allowed. If Bob were in fact suspended somewhere the program does not
know about, the answer for Bob would be wrong, but that is a question about
the data, not about the proof.

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
