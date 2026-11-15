# Teleportation

*Sending a quantum state with two ordinary bits, checked for every case.*

[teleportation.js](https://github.com/eyereasoner/eyemind/blob/main/examples/teleportation.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/teleportation.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/teleportation.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/teleportation.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=teleportation)

---

## The question

In *quantum teleportation*, Alice wants to give Bob a *qubit* (a quantum
bit) without sending the qubit itself. They share a linked (*entangled*)
pair of qubits in advance: Alice holds one half, Bob the other. Alice makes a
measurement on her qubit and her half of the pair, tells Bob the outcome (one
of four, 0 to 3, which fits in two ordinary bits), and Bob applies a
correction that depends on the outcome. Neither of them ever learns the
state itself.

**Does Bob always end up with exactly the state Alice had, for every state
and every outcome?**

---

## A simplified quantum world

Real quantum mechanics uses complex numbers. This program uses *discrete
quantum theory*, a toy version where each possible value is simply "there"
or "not there". A qubit's state is the list of its values that are there:
`zero` is `['false']`, `one` is `['true']`, and `plus` is both,
`['false', 'true']` (a *superposition*).

What decides whether a value is there is counting: eyemind lists every
*path*, every way the protocol can lead from Alice's state to one of Bob's
values. A value survives only if it is reached an **odd** number of ways;
two ways to the same value cancel each other out (*interference*).

For example, when Alice sends `one` and the outcome is 0, Bob's `'false'`
is reached by 2 paths and cancels, while `'true'` is reached by 1 path and
survives. So Bob holds `['true']`: exactly `one`.

---

## What we tell eyemind

The program states the three test states, the shared pair, three basic
operations (`id` leaves a value alone, `g` flips it, `k` sends `'true'` to
both values), Alice's four measurement outcomes and Bob's four corrections,
all as facts and small rules. Then the heart of it:

```js
// One way for Alice's state S to end as Bob's basis value Z after outcome M.
implied_by(path(S, M, Z, [A, X, Y]), [state(S, A), r(X, Y), alice(M, [A, X]), bob(M, Y, Z)])

// Bob's qubit has amplitude 1 on Z when an odd number of ways lead there.
implied_by(received(S, M, Z), [qubit(Z), findall(Path, path(S, M, Z, Path), Paths), odd(Paths)])

// What Bob holds after each outcome, for each state Alice could send.
implies(
  [name(S), outcome(M), findall(Z, received(S, M, Z), Received)],
  teleported(S, M, Received),
)

// Bob must hold exactly the state Alice sent, whatever the outcome.
implied_by(sent(S, Sent), findall(A, state(S, A), Sent))
contradiction(teleported(S, _, Received), sent(S, Sent), not_identical(Received, Sent))

query(teleported(_, _, _))
```

`implied_by(head, body)` is a backward rule (*"the head holds if the body
holds"*), and `implies(premise, conclusion)` a forward rule (*"whenever the
premise holds, conclude this"*). An array means *all of these*. Capitalized
names are variables, placeholders for any value; `_` is one whose value does
not matter.

`findall(X, goal, List)` is a built-in **collector**: it finds every way the
goal can succeed and gathers each `X` into a list. So `received` collects
every path to `Z` and keeps `Z` only if the list is odd in length, and the
forward rule collects every value Bob receives into his state.

`contradiction(...)` is a safety alarm: if its conditions ever all hold, here
*"Bob holds something other than what Alice sent"*, the run stops with exit
code 65.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
teleported('zero', 0, ['false'])
teleported('zero', 1, ['false'])
teleported('zero', 2, ['false'])
teleported('zero', 3, ['false'])
teleported('one', 0, ['true'])
teleported('one', 1, ['true'])
teleported('one', 2, ['true'])
teleported('one', 3, ['true'])
teleported('plus', 0, ['false', 'true'])
teleported('plus', 1, ['false', 'true'])
teleported('plus', 2, ['false', 'true'])
teleported('plus', 3, ['false', 'true'])
```

The first line is a comment saying what follows. Then 12 answers, one per
state and outcome: `teleported(state, outcome, what Bob holds)`.

| Alice sends | outcome 0 | outcome 1 | outcome 2 | outcome 3 |
|---|---|---|---|---|
| `zero` | `['false']` | `['false']` | `['false']` | `['false']` |
| `one` | `['true']` | `['true']` | `['true']` | `['true']` |
| `plus` | both | both | both | both |

In every case Bob holds exactly what Alice sent, and the alarm never fires.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. Here is the
proof with all its steps; of its 85 call tables only those for the first
case are shown, and the
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/teleportation.js)
is online:

```js
// Answers: each instance of a query() that holds.
teleported('zero', 0, ['false'])
teleported('zero', 1, ['false'])
teleported('zero', 2, ['false'])
teleported('zero', 3, ['false'])
teleported('one', 0, ['true'])
teleported('one', 1, ['true'])
teleported('one', 2, ['true'])
teleported('one', 3, ['true'])
teleported('plus', 0, ['false', 'true'])
teleported('plus', 1, ['false', 'true'])
teleported('plus', 2, ['false', 'true'])
teleported('plus', 3, ['false', 'true'])

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(teleported('zero', 0, ['false']), clause(37), {S: 'zero', M: 0, Z: A, Received: ['false']}, [name('zero'), outcome(0), findall(A, received('zero', 0, A), ['false'])])
step(teleported('zero', 1, ['false']), clause(37), {S: 'zero', M: 1, Z: A, Received: ['false']}, [name('zero'), outcome(1), findall(A, received('zero', 1, A), ['false'])])
step(teleported('zero', 2, ['false']), clause(37), {S: 'zero', M: 2, Z: A, Received: ['false']}, [name('zero'), outcome(2), findall(A, received('zero', 2, A), ['false'])])
step(teleported('zero', 3, ['false']), clause(37), {S: 'zero', M: 3, Z: A, Received: ['false']}, [name('zero'), outcome(3), findall(A, received('zero', 3, A), ['false'])])
step(teleported('one', 0, ['true']), clause(37), {S: 'one', M: 0, Z: A, Received: ['true']}, [name('one'), outcome(0), findall(A, received('one', 0, A), ['true'])])
step(teleported('one', 1, ['true']), clause(37), {S: 'one', M: 1, Z: A, Received: ['true']}, [name('one'), outcome(1), findall(A, received('one', 1, A), ['true'])])
step(teleported('one', 2, ['true']), clause(37), {S: 'one', M: 2, Z: A, Received: ['true']}, [name('one'), outcome(2), findall(A, received('one', 2, A), ['true'])])
step(teleported('one', 3, ['true']), clause(37), {S: 'one', M: 3, Z: A, Received: ['true']}, [name('one'), outcome(3), findall(A, received('one', 3, A), ['true'])])
step(teleported('plus', 0, ['false', 'true']), clause(37), {S: 'plus', M: 0, Z: A, Received: ['false', 'true']}, [name('plus'), outcome(0), findall(A, received('plus', 0, A), ['false', 'true'])])
step(teleported('plus', 1, ['false', 'true']), clause(37), {S: 'plus', M: 1, Z: A, Received: ['false', 'true']}, [name('plus'), outcome(1), findall(A, received('plus', 1, A), ['false', 'true'])])
step(teleported('plus', 2, ['false', 'true']), clause(37), {S: 'plus', M: 2, Z: A, Received: ['false', 'true']}, [name('plus'), outcome(2), findall(A, received('plus', 2, A), ['false', 'true'])])
step(teleported('plus', 3, ['false', 'true']), clause(37), {S: 'plus', M: 3, Z: A, Received: ['false', 'true']}, [name('plus'), outcome(3), findall(A, received('plus', 3, A), ['false', 'true'])])

// Certificate: the derived facts and every answer of each call the questions make.
derived(teleported(B, C, D), [teleported('zero', 0, ['false']), teleported('zero', 1, ['false']), teleported('zero', 2, ['false']), teleported('zero', 3, ['false']), teleported('one', 0, ['true']), teleported('one', 1, ['true']), teleported('one', 2, ['true']), teleported('one', 3, ['true']), teleported('plus', 0, ['false', 'true']), teleported('plus', 1, ['false', 'true']), teleported('plus', 2, ['false', 'true']), teleported('plus', 3, ['false', 'true'])])
called(teleported(_0, _1, _2), [teleported('zero', 0, ['false']), teleported('zero', 1, ['false']), teleported('zero', 2, ['false']), teleported('zero', 3, ['false']), teleported('one', 0, ['true']), teleported('one', 1, ['true']), teleported('one', 2, ['true']), teleported('one', 3, ['true']), teleported('plus', 0, ['false', 'true']), teleported('plus', 1, ['false', 'true']), teleported('plus', 2, ['false', 'true']), teleported('plus', 3, ['false', 'true'])])
called(received('zero', 0, D), [received('zero', 0, 'false')])
called(path('zero', 0, 'false', E), [path('zero', 0, 'false', ['false', 'true', 'true'])])
called(alice(0, ['false', 'false']), [])
called(gk('false', 'false'), [])
called(alice(0, ['false', 'true']), [alice(0, ['false', 'true'])])
called(gk('false', 'true'), [gk('false', 'true')])
called(bob(0, 'true', 'false'), [bob(0, 'true', 'false')])
called(kg('true', 'false'), [kg('true', 'false')])
called(odd([['false', 'true', 'true']]), [odd([['false', 'true', 'true']])])
called(path('zero', 0, 'true', E), [])
called(bob(0, 'true', 'true'), [])
called(kg('true', 'true'), [])
called(odd([]), [])
// … 71 more called lines for the other 11 cases
```

It has three parts:

- **The claims**: the 12 answers the proof is about.
- **The steps**: one per derived fact. A step reads
  `step(what, by which clause, with which values, using what)`. Clause 37,
  numbered by its position in the program, is the forward rule that
  collects what Bob receives. `A` stands for "a value Bob receives" inside
  each collection.
- **The certificate**: the *listing* `derived(teleported(B, C, D), ...)` of
  the 12 facts the rule derived, and the *call tables*, each written
  `called(call, answers)` with every answer that call has, in the order the
  calls were first met. The first table answers the query; the others are
  the calls the collections make, down to the paths and the odd-or-even
  counting.

The first step reads: *sending `zero` with outcome 0 leaves Bob holding
`['false']`* — by rule 37, with `S` being `zero`, `M` being 0 and `Received`
being `['false']`, because `zero` is a state name, 0 is an outcome, and
collecting what Bob receives gives `['false']`. The other 11 steps follow
the same pattern. `name` and `outcome` come only from stated facts, so they
need no steps of their own.

Everything quantum happens inside the collections, and the call tables
write that work down. For the first case they read: Bob receives `'false'`,
because exactly one way leads there (`zero` with Alice's pair
`['false', 'true']` and Bob's correction to `'false'`), and one is odd. He
does not receive `'true'`: no way leads there, and an empty list is not
odd. So the claim that each list holds **all** the values Bob receives, and
nothing else, can be checked.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It checks every call table.** It expands each call one level against
  the program, as a search would, and answers every inner call from that
  call's own table, or from the facts when only facts define the relation.
  No table vouches for itself, and a table with a value missing or added
  would disagree with its expansion. So the path counting is checked too,
  not taken on trust.
- **It checks the listing is closed.** Firing rule 37 for every state and
  outcome gives exactly the 12 listed facts.
- **It replays each listed fact.** It re-runs rule 37 from scratch against
  each step, taking each `findall` from the table of
  `received(S, M, Z)` with `S` and `M` bound as they were when the
  collection ran.
- **It compares the claims with the answers.** The query's table must hold
  exactly the claims, and every step, listing and table must be used.

"Every value" means every value within this program's rules. This is the
complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
teleported('zero', 0, ['false'])
teleported('zero', 1, ['false'])
teleported('zero', 2, ['false'])
teleported('zero', 3, ['false'])
teleported('one', 0, ['true'])
teleported('one', 1, ['true'])
teleported('one', 2, ['true'])
teleported('one', 3, ['true'])
teleported('plus', 0, ['false', 'true'])
teleported('plus', 1, ['false', 'true'])
teleported('plus', 2, ['false', 'true'])
teleported('plus', 3, ['false', 'true'])

verdict('checked')
```

The verdict is **checked**: each answer follows from the program, and there
are no other answers to the original questions.

---

## Try it

```sh
eyemind examples/teleportation.js            # the answers
eyemind --proof examples/teleportation.js    # answers with their proof
```

Break Bob's correction for outcome 0: in `implied_by(bob(0, Y, Z), kg(Y, Z))`
replace `kg(Y, Z)` with `id(Y, Z)`. Now outcome 0 leaves Bob with the wrong
state: `zero` arrives as `['true']`, `one` as both values, and `plus` as
`['false']`. The alarm fires, so after the facts derived so far eyemind
prints `'false'` and exits with code 65.

To see the interference for yourself, ask for the paths with
`--goal "path('one', 0, Z, P)"`: `'false'` is reached twice and cancels,
`'true'` once and survives.

---

## Takeaway

Even a quantum protocol can be checked case by case with a few rules. eyemind
covers all 12 cases, and its call tables let the checker confirm
the "all answers" lists too.
