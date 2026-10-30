# Permissions

*Who may read and write, and why a suspended editor may not.*

[permissions.js](https://github.com/eyereasoner/eyelit/blob/main/examples/permissions.js) · [output](https://github.com/eyereasoner/eyelit/blob/main/examples/output/permissions.js) · [proof](https://github.com/eyereasoner/eyelit/blob/main/examples/proof/permissions.js) · [check](https://github.com/eyereasoner/eyelit/blob/main/examples/check/permissions.js) · [try it in the playground](https://eyereasoner.github.io/eyelit/playground/#example=permissions)

---

## The question

Many systems give people *roles*: editors may read and write, viewers may
only read. On top of that, someone can be *suspended*, and then they may do
nothing.

Alice and Carol are editors, Bob is a viewer, and Carol is suspended.
**Who is allowed to do what?**

---

## What we tell eyelit

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

First work out what each role *would* allow, then remove anyone suspended.
`not(...)` means "it is not the case that".

---

## What eyelit concludes

```js
allowed('alice', 'read')
allowed('alice', 'write')
allowed('bob', 'read')
```

Carol is a candidate for reading and writing, but she is suspended, so she
gets nothing.

---

## Why: the proof in plain words

For Alice writing:

1. Alice is an editor — *fact 1*.
2. Editors may write — *fact 5*.
3. So Alice is a candidate to write — *rule 8*.
4. Alice is not suspended — *searched, nothing found*.
5. So Alice is allowed to write — *rule 9*.

Step 4 is different in kind: it is not a fact we gave, but the *absence*
of one.

---

## "Not suspended": a claim about absence

eyelit works under a *closed world*: if the program does not say Alice is
suspended, it takes her to be not suspended. That is what we want here — but
it is a claim about what is *missing* from the data, and a proof cannot point
at something missing.

So the checker does not pretend to prove it. It records it as an
**obligation**.

---

## Checked, not just claimed

- **11** steps are confirmed as instances of the program lines they cite.
- **2** steps are taken on trust as *absent* obligations: "Alice is not
  suspended" and "Bob is not suspended". eyelit searched everything it knows
  and found nothing.
- The checker looked for evidence against both (a `suspended('alice')` fact,
  say) and found none.

Verdict: **checked_with_obligations**. 13 steps, 2 on trust.

---

## Try it

```sh
eyelit examples/permissions.js
eyelit --check-proof examples/proof/permissions.js examples/permissions.js
```

Delete the line `fact(suspended('carol'))` and run again: Carol is now allowed to
read and write, like Alice.

---

## Takeaway

"Allowed unless excluded" decisions rest on what is *not* in the data.
eyelit makes those absences visible, so you know exactly what you are
trusting when you grant access.
