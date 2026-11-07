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
proof with all its steps; of its 84-line search certificate only the
search for the first case is shown, and the
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

// Clauses: the program clauses the steps cite, by clause number.
clause(5, fact(name('zero')))
clause(6, fact(name('one')))
clause(7, fact(name('plus')))
clause(29, fact(outcome(0)))
clause(30, fact(outcome(1)))
clause(31, fact(outcome(2)))
clause(32, fact(outcome(3)))
clause(37, implies([name(S), outcome(M), findall(Z, received(S, M, Z), Received)], teleported(S, M, Received)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(teleported('zero', 0, ['false']), clause(37), {S: 'zero', M: 0, Z: A, Received: ['false']}, [name('zero'), outcome(0), findall(A, received('zero', 0, A), ['false'])])
step(name('zero'), clause(5), {}, [])
step(outcome(0), clause(29), {}, [])
step(findall(A, received('zero', 0, A), ['false']), 'collected', {}, [])
step(teleported('zero', 1, ['false']), clause(37), {S: 'zero', M: 1, Z: A, Received: ['false']}, [name('zero'), outcome(1), findall(A, received('zero', 1, A), ['false'])])
step(outcome(1), clause(30), {}, [])
step(findall(A, received('zero', 1, A), ['false']), 'collected', {}, [])
step(teleported('zero', 2, ['false']), clause(37), {S: 'zero', M: 2, Z: A, Received: ['false']}, [name('zero'), outcome(2), findall(A, received('zero', 2, A), ['false'])])
step(outcome(2), clause(31), {}, [])
step(findall(A, received('zero', 2, A), ['false']), 'collected', {}, [])
step(teleported('zero', 3, ['false']), clause(37), {S: 'zero', M: 3, Z: A, Received: ['false']}, [name('zero'), outcome(3), findall(A, received('zero', 3, A), ['false'])])
step(outcome(3), clause(32), {}, [])
step(findall(A, received('zero', 3, A), ['false']), 'collected', {}, [])
step(teleported('one', 0, ['true']), clause(37), {S: 'one', M: 0, Z: A, Received: ['true']}, [name('one'), outcome(0), findall(A, received('one', 0, A), ['true'])])
step(name('one'), clause(6), {}, [])
step(findall(A, received('one', 0, A), ['true']), 'collected', {}, [])
step(teleported('one', 1, ['true']), clause(37), {S: 'one', M: 1, Z: A, Received: ['true']}, [name('one'), outcome(1), findall(A, received('one', 1, A), ['true'])])
step(findall(A, received('one', 1, A), ['true']), 'collected', {}, [])
step(teleported('one', 2, ['true']), clause(37), {S: 'one', M: 2, Z: A, Received: ['true']}, [name('one'), outcome(2), findall(A, received('one', 2, A), ['true'])])
step(findall(A, received('one', 2, A), ['true']), 'collected', {}, [])
step(teleported('one', 3, ['true']), clause(37), {S: 'one', M: 3, Z: A, Received: ['true']}, [name('one'), outcome(3), findall(A, received('one', 3, A), ['true'])])
step(findall(A, received('one', 3, A), ['true']), 'collected', {}, [])
step(teleported('plus', 0, ['false', 'true']), clause(37), {S: 'plus', M: 0, Z: A, Received: ['false', 'true']}, [name('plus'), outcome(0), findall(A, received('plus', 0, A), ['false', 'true'])])
step(name('plus'), clause(7), {}, [])
step(findall(A, received('plus', 0, A), ['false', 'true']), 'collected', {}, [])
step(teleported('plus', 1, ['false', 'true']), clause(37), {S: 'plus', M: 1, Z: A, Received: ['false', 'true']}, [name('plus'), outcome(1), findall(A, received('plus', 1, A), ['false', 'true'])])
step(findall(A, received('plus', 1, A), ['false', 'true']), 'collected', {}, [])
step(teleported('plus', 2, ['false', 'true']), clause(37), {S: 'plus', M: 2, Z: A, Received: ['false', 'true']}, [name('plus'), outcome(2), findall(A, received('plus', 2, A), ['false', 'true'])])
step(findall(A, received('plus', 2, A), ['false', 'true']), 'collected', {}, [])
step(teleported('plus', 3, ['false', 'true']), clause(37), {S: 'plus', M: 3, Z: A, Received: ['false', 'true']}, [name('plus'), outcome(3), findall(A, received('plus', 3, A), ['false', 'true'])])
step(findall(A, received('plus', 3, A), ['false', 'true']), 'collected', {}, [])

// Search certificate: every fact derived for each relation the searches behind
// negations and collections consult, and every answer of each call they made, in order.
searched(received('zero', 0, B), [received('zero', 0, 'false')])
searched(path('zero', 0, 'false', C), [path('zero', 0, 'false', ['false', 'true', 'true'])])
searched(alice(0, ['false', 'false']), [])
searched(gk('false', 'false'), [])
searched(alice(0, ['false', 'true']), [alice(0, ['false', 'true'])])
searched(gk('false', 'true'), [gk('false', 'true')])
searched(bob(0, 'true', 'false'), [bob(0, 'true', 'false')])
searched(kg('true', 'false'), [kg('true', 'false')])
searched(odd([['false', 'true', 'true']]), [odd([['false', 'true', 'true']])])
searched(path('zero', 0, 'true', C), [])
searched(bob(0, 'true', 'true'), [])
searched(kg('true', 'true'), [])
searched(odd([]), [])
// … 71 more searched lines for the other 11 cases
```

It has four parts:

- **The claims**: the 12 answers the proof is about.
- **The clauses**: the facts naming the three states (clauses 5–7) and the
  four outcomes (clauses 29–32), and the forward rule (clause 37), numbered
  by their position in the program.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`. `A` stands for
  "a value Bob receives" inside each collection.
- **The search certificate**: every search the 12 collections made, each
  written `searched(call, answers)` with every answer it gave, in the order
  the calls were first met.

The first four steps, for `zero` and outcome 0, read:

1. *Sending `zero` with outcome 0 leaves Bob holding `['false']`* — by rule
   37, with `S` being `zero`, `M` being 0 and `Received` being `['false']`,
   because `zero` is a state name, 0 is an outcome, and collecting what Bob
   receives gives `['false']`.
2. *`zero` is a state name* — fact 5; it uses nothing.
3. *0 is an outcome* — fact 29; it uses nothing.
4. *Collecting every value Bob receives for `zero` and outcome 0 gives
   `['false']`* — justified by `'collected'`: eyemind ran the collection and
   recorded its result.

The other 11 cases follow the same pattern. A fact already established is
not repeated, so `name('zero')` appears once and is reused by the next three
cases; likewise each outcome fact appears once.

A `'collected'` step has no steps of its own. Everything quantum, the paths
and the odd-or-even counting, happens inside those collections, and the
search certificate writes that work down. For the first case it reads:
Bob receives `'false'`, because exactly one way leads there (`zero` with
Alice's pair `['false', 'true']` and Bob's correction to `'false'`), and one
is odd. He does not receive `'true'`: no way leads there, and an empty list
is not odd. So the claim that each list holds **all** the values Bob
receives, and nothing else, can be checked.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
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

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 19)
condition('C2', 'well_founded', 'ok', 31)
condition('C3', 'justification', 'ok', 31)
condition('C4', 'coverage', 'ok', 48)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 12)
condition('C7', 'relevance', 'ok', 43)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(31)
verified(19)
recomputed(0)
composed(0)
trusted(0)
claims(12)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (19)**: the 19 steps that cite a program line, the 12
  uses of rule 37 and the 7 facts, really are instances of it with the
  values shown. The 12 collected steps cite no line, so C1 does not apply.
- **C2 well-founded (31)**: none of the 31 steps depends on itself, even
  indirectly.
- **C3 justification (31)**: every step says how it was justified, in a form
  the checker understands (`clause(N)` or `'collected'`).
- **C4 coverage (48)**: the 12 claims and the 36 things the rule steps use
  (3 each) are each backed by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation
  appears as a step of its own.
- **C6 boundary consistency (12)**: the 12 collected lists were confronted
  with the evidence, and the search certificate settles all 12: each list
  holds exactly the values the searches found.
- **C7 relevance (43)**: the 12 claims answer the query, and all 31 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.

The checker verifies each `searched` line without searching itself: it
expands the call one level against the program, as a search would, and
answers every inner call from that call's own line, or from the facts when
only facts define the relation. No line vouches for itself, and a list with
a value missing or added would disagree with the expansion and fail the
check. So the path counting is checked too, not taken on trust. "Every
value" means every value within this program's rules.

The statistics: 31 steps, 19 verified against the program and the 12
collections settled by the certificate, none taken on trust. The verdict is
**checked**: each answer follows from the program. The verdict does not establish
that there are no other answers.

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
covers all 12 cases, and its search certificate lets the checker confirm
the "all answers" lists too.
