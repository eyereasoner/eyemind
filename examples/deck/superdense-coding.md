# Superdense Coding

*Two bits through one qubit — a quantum protocol, reasoned out by counting paths.*

[superdense-coding.js](https://github.com/eyereasoner/eyemind/blob/main/examples/superdense-coding.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/superdense-coding.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/superdense-coding.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/superdense-coding.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=superdense-coding)

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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(sdcoding(0, 0), clause(35), {N: 0, M: 0, Path: A, Paths: [['true', 'true', 'true']]}, [message(0), message(0), findall(A, path(0, 0, A), [['true', 'true', 'true']]), odd([['true', 'true', 'true']])])
step(sdcoding(1, 1), clause(35), {N: 1, M: 1, Path: A, Paths: [['false', 'false', 'true']]}, [message(1), message(1), findall(A, path(1, 1, A), [['false', 'false', 'true']]), odd([['false', 'false', 'true']])])
step(sdcoding(2, 2), clause(35), {N: 2, M: 2, Path: A, Paths: [['true', 'true', 'false']]}, [message(2), message(2), findall(A, path(2, 2, A), [['true', 'true', 'false']]), odd([['true', 'true', 'false']])])
step(sdcoding(3, 3), clause(35), {N: 3, M: 3, Path: A, Paths: [['false', 'false', 'false']]}, [message(3), message(3), findall(A, path(3, 3, A), [['false', 'false', 'false']]), odd([['false', 'false', 'false']])])

// Certificate: the derived facts and every answer of each call the questions make.
derived(sdcoding(B, C), [sdcoding(0, 0), sdcoding(1, 1), sdcoding(2, 2), sdcoding(3, 3)])
called(sdcoding(_0, _1), [sdcoding(0, 0), sdcoding(1, 1), sdcoding(2, 2), sdcoding(3, 3)])
called(path(0, 0, C), [path(0, 0, ['true', 'true', 'true'])])
called(alice(0, ['false', D]), [alice(0, ['false', 'false'])])
called(bob(['false', 'false'], 0), [])
called(gk('false', 'false'), [])
called(alice(0, ['true', D]), [alice(0, ['true', 'true'])])
called(bob(['true', 'true'], 0), [bob(['true', 'true'], 0)])
called(gk('true', 'true'), [gk('true', 'true')])
called(odd([['true', 'true', 'true']]), [odd([['true', 'true', 'true']])])
called(path(0, 1, C), [path(0, 1, ['false', 'false', 'false']), path(0, 1, ['true', 'true', 'true'])])
called(bob(['false', 'false'], 1), [bob(['false', 'false'], 1)])
called(bob(['true', 'true'], 1), [bob(['true', 'true'], 1)])
called(odd([['false', 'false', 'false'], ['true', 'true', 'true']]), [])
called(odd([]), [])
called(path(0, 2, C), [])
called(bob(['false', 'false'], 2), [])
called(bob(['true', 'true'], 2), [])
called(path(0, 3, C), [path(0, 3, ['false', 'false', 'false']), path(0, 3, ['true', 'true', 'true'])])
called(bob(['false', 'false'], 3), [bob(['false', 'false'], 3)])
called(bob(['true', 'true'], 3), [bob(['true', 'true'], 3)])
called(path(1, 0, C), [path(1, 0, ['false', 'false', 'true']), path(1, 0, ['true', 'true', 'false'])])
called(alice(1, ['false', E]), [alice(1, ['false', 'true'])])
called(bob(['true', 'false'], 0), [bob(['true', 'false'], 0)])
called(gk('true', 'false'), [gk('true', 'false')])
called(alice(1, ['true', E]), [alice(1, ['true', 'false'])])
called(bob(['false', 'true'], 0), [bob(['false', 'true'], 0)])
called(gk('false', 'true'), [gk('false', 'true')])
called(odd([['false', 'false', 'true'], ['true', 'true', 'false']]), [])
called(path(1, 1, C), [path(1, 1, ['false', 'false', 'true'])])
called(bob(['true', 'false'], 1), [bob(['true', 'false'], 1)])
called(bob(['false', 'true'], 1), [])
called(odd([['false', 'false', 'true']]), [odd([['false', 'false', 'true']])])
called(path(1, 2, C), [path(1, 2, ['false', 'false', 'true']), path(1, 2, ['true', 'true', 'false'])])
called(bob(['true', 'false'], 2), [bob(['true', 'false'], 2)])
called(bob(['false', 'true'], 2), [bob(['false', 'true'], 2)])
called(path(1, 3, C), [])
called(bob(['true', 'false'], 3), [])
called(bob(['false', 'true'], 3), [])
called(path(2, 0, C), [path(2, 0, ['true', 'true', 'false']), path(2, 0, ['true', 'true', 'true'])])
called(alice(2, ['false', F]), [alice(2, ['false', 'false'])])
called(alice(2, ['true', F]), [alice(2, ['true', 'false']), alice(2, ['true', 'true'])])
called(odd([['true', 'true', 'false'], ['true', 'true', 'true']]), [])
called(path(2, 1, C), [path(2, 1, ['false', 'false', 'false']), path(2, 1, ['true', 'true', 'true'])])
called(path(2, 2, C), [path(2, 2, ['true', 'true', 'false'])])
called(odd([['true', 'true', 'false']]), [odd([['true', 'true', 'false']])])
called(path(2, 3, C), [path(2, 3, ['false', 'false', 'false']), path(2, 3, ['true', 'true', 'true'])])
called(path(3, 0, C), [path(3, 0, ['false', 'false', 'true']), path(3, 0, ['true', 'true', 'false'])])
called(alice(3, ['false', G]), [alice(3, ['false', 'false']), alice(3, ['false', 'true'])])
called(kg('false', H), [kg('false', 'false'), kg('false', 'true')])
called(alice(3, ['true', G]), [alice(3, ['true', 'false'])])
called(kg('true', I), [kg('true', 'false')])
called(path(3, 1, C), [path(3, 1, ['false', 'false', 'false']), path(3, 1, ['false', 'false', 'true'])])
called(odd([['false', 'false', 'false'], ['false', 'false', 'true']]), [])
called(path(3, 2, C), [path(3, 2, ['false', 'false', 'true']), path(3, 2, ['true', 'true', 'false'])])
called(path(3, 3, C), [path(3, 3, ['false', 'false', 'false'])])
called(odd([['false', 'false', 'false']]), [odd([['false', 'false', 'false']])])
```

It has three parts:

- **The claims**: the four answers.
- **The steps**: one per fact the forward rule derived. A step reads
  `step(what, by which clause, with which values, using what)`, citing the
  program line by its number: here always rule 35.
- **The certificate**: a **listing**, `derived(...)`, of every `sdcoding`
  fact rule 35 derived, and **call tables**, `called(call, answers)`, each
  giving every answer of one call, in the order the calls were first met.
  The question's `_` blanks are written `_0` and `_1`.

Read the step for message 0 as a sentence: *message 0 arrives as 0*, by rule
35 with `N` = 0, `M` = 0 and `Paths` = a list of one way,
`[['true', 'true', 'true']]`, because 0 is a message (twice, as sender's and
as reader's message), the list of all ways from 0 to 0 is that list, and it
is odd. (`Path: A` just says the collecting variable stays a blank.) The
other three steps say the same for messages 1, 2 and 3, each with exactly
one way: `['false', 'false', 'true']`, `['true', 'true', 'false']` and
`['false', 'false', 'false']`.

The call tables hold the searches behind the collections. The first, for
the question, lists all four answers. The next seven are the search for the
ways from 0 to 0. A way needs a shared pair `[X, Y]`, Alice's operation for
message 0 on X, and Bob's reading 0 of the result. With X false, Alice gives
`['false', 'false']`, but Bob cannot read `['false', 'false']` as 0
(`gk('false', 'false')` has no answers). With X true, Alice gives
`['true', 'true']`, and Bob does read that as 0. So the table
`called(path(0, 0, C), ...)` has exactly one way. The tables for the other
pairs show why no other message-reading pair comes out: `path(0, 1, C)` has
two ways, and `odd` of a two-item list has no answers, while `path(0, 2,
C)` has none.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the rules from
the program and confirms the proof against them in one procedure:

- **It checks every table.** Each call is expanded one level against the
  program, with every inner call answered from its own table, or from the
  facts when only facts define the relation. So no table vouches for itself,
  and a list of ways with one missing or added would disagree with the
  expansion and fail the check. That matters here more than usual: a single
  missing or extra way would flip an odd count to even, and the answer would
  change.
- **It checks the listing is closed.** Applying rule 35 to all sixteen
  message pairs, with each `findall` taken from its table, gives only the
  four listed facts.
- **It replays each listed fact.** Each step's firing of rule 35 is re-run
  from scratch, the collection taken from the table of its call at the
  values `N` and `M` had then, and it gives exactly the recorded step.
- **It compares the claims with the answers.** The four claims are exactly
  the question's answers, and every step, listing and table was used.

"All the ways" means all within this program. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
sdcoding(0, 0)
sdcoding(1, 1)
sdcoding(2, 2)
sdcoding(3, 3)

verdict('checked')
```

The verdict is **checked**: each answer follows from the program, and the
answers are every answer of the question, so no message arrives as a
*different* one.

---

## Try it

```sh
eyemind examples/superdense-coding.js                          # the answers
eyemind --proof examples/superdense-coding.js                  # answers with their proof
eyemind --goal "path(0, M, P)" examples/superdense-coding.js   # every way for message 0
```

The last lists every way message 0 can travel: one to reading 0, two to
reading 1, two to reading 3. Or open it in the
[playground](https://eyereasoner.github.io/eyemind/playground/#example=superdense-coding).

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
count the ways, keep the odd ones. eyemind shows each answer's ways, and its
call tables let the checker confirm that these are all the ways.
