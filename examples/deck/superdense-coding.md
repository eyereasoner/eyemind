# Superdense Coding

*Two bits through one qubit — a quantum protocol, reasoned out by counting paths.*

[superdense-coding.js](https://github.com/eyereasoner/eyemind/blob/main/examples/superdense-coding.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/superdense-coding.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/superdense-coding.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/superdense-coding.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=superdense-coding)

---

## The question

A *bit* is a 0 or a 1. Two bits give four possible messages: 0, 1, 2, 3.
Normally, sending two bits means sending two things.

*Superdense coding* is a quantum trick. Alice and Bob each hold one half of a
specially linked (*entangled*) pair of quantum bits, *qubits*. Alice applies
one of four operations to her half, one per message, and hands it to Bob. Bob
measures both halves and reads a message. So Alice sends **two bits by handing
over just one qubit**.

**Does Bob always read exactly the message Alice sent, and never another?**

---

## Quantum, with true and false

This example uses *discrete quantum theory*: a simplified version of quantum
mechanics in which the weights of a quantum state are not complex numbers but
just 0 or 1, added so that 1 + 1 = 0.

It keeps the key quantum effect, *interference*: two ways of reaching the
same result can cancel out. Here that becomes a simple rule:

> An outcome happens if it can be reached in an **odd** number of ways.
> Two ways cancel; one way, or three, survive.

So computing in this theory is ordinary rule-following plus counting.

---

## What we tell eyemind

The program starts with small tables of facts, numbered 1 to 17 (most are
left out here):

```js
// |R) = |0, 0) + |1, 1)
fact(r('false', 'false'))
fact(r('true', 'true'))
// … the states S, U and V (facts 3–10)

// G |0) = |1)
fact(g('false', 'true'))
// G |1) = |0)
fact(g('true', 'false'))
// … the operations ID and K (facts 11, 12 and 15–17)
```

`'false'` and `'true'` stand for the qubit values 0 and 1. A state with
several terms is a *superposition*: the shared pair `r` is "both 0, plus both
1", one fact per term. The operations are written as tables from input to
output: `g` flips a qubit; `id` leaves it alone; `k` maps 1 to "0 plus 1".

Then the protocol, as rules 18 to 35:

```js
// … the combined operations KG and GK (rules 18–19)
// Alice's encoding: message 0, 1, 2 or 3 applies ID, G, K or KG to her qubit.
implied_by(alice(0, [X, Y]), id(X, Y))
// … alice for messages 1–3 (rules 21–23), Bob's four readings (24–27)

implied_by(path(N, M, [X, Y, B]), [r(X, Y), alice(N, [X, B]), bob([B, Y], M)])

fact(message(0))
fact(message(1))
fact(message(2))
fact(message(3))

// odd(List): the list has an odd number of elements.
fact(odd([_]))
implied_by(odd([_, _, ...T]), odd(T))

implies(
  [message(N), message(M), findall(Path, path(N, M, Path), Paths), odd(Paths)],
  sdcoding(N, M),
)

// which messages arrive as which
query(sdcoding(_, _))
```

Capitalized names are **variables**, blanks that stand for whatever fits; a
lone `_` is a blank nobody cares about. Square brackets hold a list, or, as
the condition of a rule, several conditions that must *all* hold.

- `implied_by(conclusion, condition)` is a **backward rule**, used on demand.
  Rule 28 says what one `path` is: one way for Alice's message `N` to reach
  Bob as reading `M`. It goes through a term `X, Y` of the shared pair, her
  operation turning her half `X` into `B`, and his reading of `B` and `Y`.
  The way is recorded as the list `[X, Y, B]`.
- `odd` (facts 33 and rule 34): a list of one item is odd; dropping two items
  keeps a list odd.
- `implies(premise, conclusion)` is a **forward rule** (rule 35). Its
  premise uses `findall(Path, path(N, M, Path), Paths)`: *collect every
  `Path` that is a way from `N` to `M` into the list `Paths`*. If that list
  has an odd length, message `N` arrives as `M`.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
sdcoding(0, 0)
sdcoding(1, 1)
sdcoding(2, 2)
sdcoding(3, 3)
```

Every message arrives as itself, and no message arrives as anything else.

The cancellation is what makes this work. Message 0 reaches reading 0 by one
way, but readings 1 and 3 by two ways each, which cancel, and reading 2 by
none.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
sdcoding(0, 0)
sdcoding(1, 1)
sdcoding(2, 2)
sdcoding(3, 3)

// Clauses: the program clauses the steps cite, by clause number.
clause(29, fact(message(0)))
clause(30, fact(message(1)))
clause(31, fact(message(2)))
clause(32, fact(message(3)))
clause(33, fact(odd([_0])))
clause(35, implies([message(N), message(M), findall(Path, path(N, M, Path), Paths), odd(Paths)], sdcoding(N, M)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(sdcoding(0, 0), clause(35), {N: 0, M: 0, Path: A, Paths: [['true', 'true', 'true']]}, [message(0), message(0), findall(A, path(0, 0, A), [['true', 'true', 'true']]), odd([['true', 'true', 'true']])])
step(message(0), clause(29), {}, [])
step(findall(A, path(0, 0, A), [['true', 'true', 'true']]), 'collected', {}, [])
step(odd([['true', 'true', 'true']]), clause(33), {_0: ['true', 'true', 'true']}, [])
step(sdcoding(1, 1), clause(35), {N: 1, M: 1, Path: A, Paths: [['false', 'false', 'true']]}, [message(1), message(1), findall(A, path(1, 1, A), [['false', 'false', 'true']]), odd([['false', 'false', 'true']])])
step(message(1), clause(30), {}, [])
step(findall(A, path(1, 1, A), [['false', 'false', 'true']]), 'collected', {}, [])
step(odd([['false', 'false', 'true']]), clause(33), {_0: ['false', 'false', 'true']}, [])
step(sdcoding(2, 2), clause(35), {N: 2, M: 2, Path: A, Paths: [['true', 'true', 'false']]}, [message(2), message(2), findall(A, path(2, 2, A), [['true', 'true', 'false']]), odd([['true', 'true', 'false']])])
step(message(2), clause(31), {}, [])
step(findall(A, path(2, 2, A), [['true', 'true', 'false']]), 'collected', {}, [])
step(odd([['true', 'true', 'false']]), clause(33), {_0: ['true', 'true', 'false']}, [])
step(sdcoding(3, 3), clause(35), {N: 3, M: 3, Path: A, Paths: [['false', 'false', 'false']]}, [message(3), message(3), findall(A, path(3, 3, A), [['false', 'false', 'false']]), odd([['false', 'false', 'false']])])
step(message(3), clause(32), {}, [])
step(findall(A, path(3, 3, A), [['false', 'false', 'false']]), 'collected', {}, [])
step(odd([['false', 'false', 'false']]), clause(33), {_0: ['false', 'false', 'false']}, [])
```

It has three parts:

- **The claims**: the four answers.
- **The clauses**: the program lines the steps cite, by their number: the
  four messages (29–32), the odd fact (33) and the forward rule (35). The
  `_` of fact 33 is shown as `_0` so a step can name it.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps for message 0 as sentences:

1. *Message 0 arrives as 0*: by rule 35 with `N` = 0, `M` = 0 and `Paths` =
   a list of one way, `[['true', 'true', 'true']]`, because 0 is a message
   (twice, as sender's and as reader's message), the list of all ways from 0
   to 0 is that list, and it is odd. (`Path: A` just says the collecting
   variable stays a blank.)
2. *0 is a message*: fact 29.
3. *All the ways from 0 to 0 are `[['true', 'true', 'true']]`*: justified as
   `'collected'`. This step is not derived from the program within the
   proof. eyemind ran the search and recorded the resulting list, and the
   proof takes that list on trust: that these are the ways, and that there
   are no others.
4. *A list of one item is odd*: fact 33, with `_0` = the one way.

Steps 5–8, 9–12 and 13–16 say the same for messages 1, 2 and 3, each with
exactly one way: `['false', 'false', 'true']`, `['true', 'true', 'false']`
and `['false', 'false', 'false']`.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
sdcoding(0, 0)
sdcoding(1, 1)
sdcoding(2, 2)
sdcoding(3, 3)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 12)
condition('C2', 'well_founded', 'ok', 16)
condition('C3', 'justification', 'ok', 16)
condition('C4', 'coverage', 'ok', 20)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 20)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, path(0, 0, A), [['true', 'true', 'true']]))
obligation('collected', 'theory_scoped', findall(A, path(1, 1, A), [['false', 'false', 'true']]))
obligation('collected', 'theory_scoped', findall(A, path(2, 2, A), [['true', 'true', 'false']]))
obligation('collected', 'theory_scoped', findall(A, path(3, 3, A), [['false', 'false', 'false']]))

// Proof statistics: recorded steps and how they were checked.
steps(16)
verified(12)
recomputed(0)
composed(0)
trusted(4)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (12)**: the 12 steps that cite a program line really are
  instances of it. Step 1 is rule 35 with `N` = 0 and `M` = 0.
- **C2 well-founded (16)**: none of the 16 steps depends on itself, even
  indirectly.
- **C3 justification (16)**: every step says how it was justified, in a form
  the checker understands. The 4 `'collected'` steps, as required, have no
  values and use nothing.
- **C4 coverage (20)**: the 4 answers and the 16 things the steps use are
  each backed by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: the checker had nothing to confront the
  4 collected lists with. It would look for a `path` in the program's facts
  and the proof's steps that is missing from a list, but there are none to
  see: the ways are computed by rules, not listed as facts, and the proof
  does not record them. So the lists are left undecided: nothing refutes
  them, but nothing confirms them either.
- **C7 relevance (20)**: the 4 claims answer the question, and all 16 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The four `obligation` lines spell out what is taken on trust: for each
message, that its list holds *all* the ways to the matching reading.
`'theory_scoped'` means "all within this program". The statistics: 16 steps,
12 verified against the program, 4 trusted, for 4 claims.

The verdict is **checked with obligations**: each answer follows from the
program *provided* the four collected lists are right. This matters here more
than usual: a single missing or extra way would flip an odd count to even,
and the answer would change. The verdict also does not establish
completeness: that no message arrives as a *different* one rests on eyemind's
own search, which the proof does not record.

---

## Try it

```sh
eyemind examples/superdense-coding.js                          # the answers
eyemind --proof examples/superdense-coding.js                  # answers with their proof
eyemind --goal "path(0, M, P)" examples/superdense-coding.js   # every way for message 0
```

The last lists every way message 0 can travel: one to reading 0, two to
reading 1, two to reading 3. Or open it in the
[playground](https://eyereasoner.github.io/eyemind/playground#example=superdense-coding).

Switch off interference: replace `odd(Paths)` in rule 35 with
`not_identical(Paths, [])`, so any way at all counts. Now 14 of the 16
message-reading pairs come out, and Bob can no longer tell the messages
apart. Or delete the fact `r('true', 'true')`, so the two qubits are no
longer entangled: the four correct pairs give way to ten mixed-up ones, and
1 → 1 and 3 → 3 are the only messages still read as themselves.

Its sibling, [teleportation.js](https://github.com/eyereasoner/eyemind/blob/main/examples/teleportation.js), runs the companion
protocol, quantum teleportation, in the same theory with the same relations.

---

## Takeaway

Quantum interference can be expressed as ordinary rules plus one twist:
count the ways, keep the odd ones. eyemind shows each answer's ways, and is
upfront that "these are all the ways" is the one thing taken on trust.
