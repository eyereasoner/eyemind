# Interval Relations

*Thirteen ways two time slots can relate, worked out for a whole schedule.*

[interval-relations.js](https://github.com/eyereasoner/eyemind/blob/main/examples/interval-relations.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/interval-relations.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/interval-relations.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/interval-relations.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=interval-relations)

---

## The question

Two meetings can sit in time in exactly one of **thirteen** ways: one is
*before* the other, one *meets* the other (ends exactly as it starts), they
*overlap*, one *starts* or *finishes* the other, one is *during* the other,
they are *equal*, plus the reverse of each (*after*, *met by*, *overlapped
by*, *started by*, *contains*, *finished by*).

This classification is known as **Allen's interval relations**, and it
underlies a lot of scheduling and planning software.

**Given a day's worth of time slots, how does every pair relate?**

---

## What we tell eyemind: the time slots

Times are in minutes after midnight: 600 is 10:00, 720 is 12:00.

```js
// interval(Name, Start, End)
fact(interval('a', 600, 720))
fact(interval('b', 780, 900))
// … five more like these
fact(interval('h', 540, 960))
fact(start_duration('i', 960, 120))
fact(end_duration('j', 960, 60))
// start_duration(Name, Start, Duration) and end_duration(Name, End, Duration)
```

`fact(...)` states something true. So a runs 10:00–12:00 and h
09:00–16:00. Slot i starts at 16:00 and lasts 120 minutes; slot j ends at
16:00 after 60 minutes.

Each slot is **half-open**: it includes its start minute but not its end, so
a slot ending at 12:00 and one starting at 12:00 touch without overlapping.

---

## What we tell eyemind: the rules

Missing endpoints are filled in, then each relation gets a rule:

```js
implies([start_duration(I, S, D), gt(D, 0), is(E, add(S, D))], interval(I, S, E))
implies([end_duration(I, E, D), gt(D, 0), is(S, sub(E, D))], interval(I, S, E))
// Only nonempty intervals take part, and every ordered pair of them is compared.
implied_by(valid_interval(I, S, E), [interval(I, S, E), lt(S, E)])
implied_by(pair(I, J, SI, EI, SJ, EJ), [valid_interval(I, SI, EI), valid_interval(J, SJ, EJ)])
// the seven basic relations of I to J
implies([pair(I, J, SI, EI, SJ, EJ), lt(EI, SJ)], relation(I, 'before', J))
implies([pair(I, J, SI, EI, SJ, EJ), eq(EI, SJ)], relation(I, 'meets', J))
implies([pair(I, J, SI, EI, SJ, EJ), lt(SJ, SI), lt(EI, EJ)], relation(I, 'during', J))
// … overlaps, starts, finishes, equals
// and their converses
implies(relation(I, 'before', J), relation(J, 'after', I))
// … and the other five reverse relations
query(relation(I, Relation, J))
```

`implies(premise, conclusion)` is a forward rule: whenever the premise
holds, eyemind concludes the conclusion. `implied_by(head, body)` is a
backward rule: *"the head holds if the body holds"*. An array means *all of
these*. Capitalized names are variables, placeholders for any value: `I` and
`J` are two slots, `SI`, `EI` the start and end of `I`, and `SJ`, `EJ` those
of `J`.

`lt`, `gt` and `eq` compare (less than, greater than, equal), and
`is(E, add(S, D))` computes E = S + D. These are **builtins**, operations
built into eyemind.

Only *valid* slots (start before end) are compared, so empty or backwards
slots are left out. Every ordered pair of valid slots is compared, a slot
with itself included. The query asks for every relation.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
relation('a', 'before', 'b')
relation('j', 'meets', 'i')
relation('a', 'overlaps', 'd')
relation('f', 'starts', 'a')
relation('a', 'during', 'h')
relation('g', 'finishes', 'a')
relation('a', 'equals', 'e')
relation('h', 'contains', 'a')
relation('i', 'after', 'a')
// … 100 relations in all
```

The first line is a comment saying what follows; then a selection of the
100 answers. Read `relation('f', 'starts', 'a')` as *f starts a*: both begin
at 10:00, and f ends first. The 100 answers by kind:

| Relation | Count | Reverse | Count |
|---|---:|---|---:|
| before | 18 | after | 18 |
| meets | 9 | met_by | 9 |
| overlaps | 4 | overlapped_by | 4 |
| starts | 3 | started_by | 3 |
| during | 7 | contains | 7 |
| finishes | 3 | finished_by | 3 |
| equals | 12 | (its own reverse) | |

Every slot *equals* itself, so lines like `relation('a', 'equals', 'a')`
are among them, and a equals e, since both run 10:00–12:00.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The proof has 176
steps and is about 40 KB; the
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/interval-relations.js)
is linked above. Here are its opening comment and first claims, the
complete chain for `relation('a', 'before', 'i')`, the step for its reverse,
and part of its certificate:

```js
// Answers: each instance of a query() that holds.
relation('a', 'before', 'i')
relation('a', 'before', 'j')
relation('a', 'before', 'b')
// … 97 more claims, 100 in all

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(relation('a', 'before', 'i'), clause(15), {I: 'a', J: 'i', SI: 600, EI: 720, SJ: 960, EJ: 1080}, [pair('a', 'i', 600, 720, 960, 1080), lt(720, 960)])
step(pair('a', 'i', 600, 720, 960, 1080), clause(14), {I: 'a', J: 'i', SI: 600, EI: 720, SJ: 960, EJ: 1080}, [valid_interval('a', 600, 720), valid_interval('i', 960, 1080)])
step(valid_interval('a', 600, 720), clause(13), {I: 'a', S: 600, E: 720}, [interval('a', 600, 720), lt(600, 720)])
step(interval('a', 600, 720), clause(1), {}, [])
step(valid_interval('i', 960, 1080), clause(13), {I: 'i', S: 960, E: 1080}, [interval('i', 960, 1080), lt(960, 1080)])
step(interval('i', 960, 1080), clause(11), {I: 'i', S: 960, D: 120, E: 1080}, [start_duration('i', 960, 120), gt(120, 0), is(1080, add(960, 120))])
// … the steps of the other answers
step(relation('i', 'after', 'a'), clause(22), {I: 'a', J: 'i'}, [relation('a', 'before', 'i')])
// … 43 more steps

// Certificate: the derived facts and every answer of each call the questions make.
// … the listing and call table for relation/3, 100 facts each
derived(interval(A, B, C), [interval('i', 960, 1080), interval('j', 900, 960)])
// … the tables for pair/6, valid_interval/3, interval/3, before and meets
called(relation(T, 'overlaps', U), [relation('a', 'overlaps', 'd'), relation('c', 'overlaps', 'b'), relation('d', 'overlaps', 'c'), relation('e', 'overlaps', 'd')])
called(relation(V, 'starts', W), [relation('f', 'starts', 'a'), relation('f', 'starts', 'e'), relation('g', 'starts', 'd')])
called(relation(X, 'during', Y), [relation('a', 'during', 'h'), relation('b', 'during', 'h'), relation('c', 'during', 'h'), relation('d', 'during', 'h'), relation('e', 'during', 'h'), relation('f', 'during', 'h'), relation('g', 'during', 'h')])
called(relation(Z, 'finishes', A1), [relation('j', 'finishes', 'h'), relation('g', 'finishes', 'a'), relation('g', 'finishes', 'e')])
```

It has three parts:

- **The claims**: the 100 answers.
- **The steps**: one per derived fact the answers rest on, and one for each
  goal a firing uses whose answer rests on derived facts. A step reads
  `step(what, by which clause, with which values, using what)`; clauses are
  numbered by their position in the program, facts included.
- **The certificate**: two *listings*, `derived(...)`, of every `relation`
  and every `interval` fact the forward rules derived, and ten *call
  tables*, `called(...)`, of every answer of a call: the query
  `relation(X, Y, Z)` itself, the `pair`, `valid_interval` and `interval`
  calls beneath it, and the call each of the reverse rules 22–27 makes, such
  as `relation(I, 'overlaps', J)`.

Read the chain as sentences:

1. *a is before i* — by rule 15, with a running 600–720 and i 960–1080,
   because (a, i) is a valid pair and 720 < 960.
2. *(a, i) is a pair of valid slots* — by rule 14, because both are valid.
3. *a is valid* — by rule 13, because a runs 600–720 and 600 < 720.
4. *a runs 600–720* — fact 1. It has a step because rules 11 and 12 also
   conclude `interval` facts, so an `interval` goal is followed to how it
   was established.
5. *i is valid* — by rule 13, because i runs 960–1080 and 960 < 1080.
6. *i runs 960–1080* — by rule 11, because i starts at 960 and lasts 120,
   120 > 0, and 960 + 120 = 1080.

The comparisons and the sum have no steps: the checker computes them
itself. `start_duration('i', 960, 120)` has none either: it comes only from
a stated fact, so the program answers it directly.

The step for `relation('i', 'after', 'a')` reads: *i is after a* — by rule
22, the reverse of *before*, because a is before i. Each later answer reuses
what is already proved: a's and i's validity are shown once and cited
again.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the query.** It searches `relation(X, Y, Z)` one level against
  the program, with every inner call answered from its call table, and
  checks each table the same way. Searching rule 14 for `pair`, for
  instance, must give exactly the 100 pairs of its table, in order.
- **It checks the listings are closed.** Applying rules 11–12 and 15–27 to
  everything the certificate holds gives only `interval` and `relation`
  facts that are listed: no relation is missing.
- **It replays each listed fact.** For every listed relation and interval, it
  re-runs the rule its step cites from no bindings: comparisons and the
  endpoint sums are computed, and every other goal comes from the tables or
  from the step of the goal it uses. The result must be the recorded step.
- **It compares the claims with the answers.** Every claim is an answer, and
  every answer is claimed. Every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
relation('a', 'before', 'i')
relation('a', 'before', 'j')
relation('a', 'before', 'b')
relation('b', 'before', 'i')
relation('c', 'before', 'i')
relation('c', 'before', 'j')
relation('d', 'before', 'i')
relation('d', 'before', 'j')
relation('e', 'before', 'i')
relation('e', 'before', 'j')
relation('e', 'before', 'b')
relation('f', 'before', 'i')
relation('f', 'before', 'j')
relation('f', 'before', 'b')
relation('f', 'before', 'c')
relation('g', 'before', 'i')
relation('g', 'before', 'j')
relation('g', 'before', 'b')
relation('j', 'meets', 'i')
relation('a', 'meets', 'c')
relation('b', 'meets', 'j')
relation('d', 'meets', 'b')
relation('e', 'meets', 'c')
relation('f', 'meets', 'd')
relation('f', 'meets', 'g')
relation('g', 'meets', 'c')
relation('h', 'meets', 'i')
relation('a', 'overlaps', 'd')
relation('c', 'overlaps', 'b')
relation('d', 'overlaps', 'c')
relation('e', 'overlaps', 'd')
relation('f', 'starts', 'a')
relation('f', 'starts', 'e')
relation('g', 'starts', 'd')
relation('a', 'during', 'h')
relation('b', 'during', 'h')
relation('c', 'during', 'h')
relation('d', 'during', 'h')
relation('e', 'during', 'h')
relation('f', 'during', 'h')
relation('g', 'during', 'h')
relation('j', 'finishes', 'h')
relation('g', 'finishes', 'a')
relation('g', 'finishes', 'e')
relation('i', 'equals', 'i')
relation('j', 'equals', 'j')
relation('a', 'equals', 'a')
relation('a', 'equals', 'e')
relation('b', 'equals', 'b')
relation('c', 'equals', 'c')
relation('d', 'equals', 'd')
relation('e', 'equals', 'a')
relation('e', 'equals', 'e')
relation('f', 'equals', 'f')
relation('g', 'equals', 'g')
relation('h', 'equals', 'h')
relation('i', 'after', 'a')
relation('j', 'after', 'a')
relation('b', 'after', 'a')
relation('i', 'after', 'b')
relation('i', 'after', 'c')
relation('j', 'after', 'c')
relation('i', 'after', 'd')
relation('j', 'after', 'd')
relation('i', 'after', 'e')
relation('j', 'after', 'e')
relation('b', 'after', 'e')
relation('i', 'after', 'f')
relation('j', 'after', 'f')
relation('b', 'after', 'f')
relation('c', 'after', 'f')
relation('i', 'after', 'g')
relation('j', 'after', 'g')
relation('b', 'after', 'g')
relation('i', 'met_by', 'j')
relation('c', 'met_by', 'a')
relation('j', 'met_by', 'b')
relation('b', 'met_by', 'd')
relation('c', 'met_by', 'e')
relation('d', 'met_by', 'f')
relation('g', 'met_by', 'f')
relation('c', 'met_by', 'g')
relation('i', 'met_by', 'h')
relation('d', 'overlapped_by', 'a')
relation('b', 'overlapped_by', 'c')
relation('c', 'overlapped_by', 'd')
relation('d', 'overlapped_by', 'e')
relation('a', 'started_by', 'f')
relation('e', 'started_by', 'f')
relation('d', 'started_by', 'g')
relation('h', 'contains', 'a')
relation('h', 'contains', 'b')
relation('h', 'contains', 'c')
relation('h', 'contains', 'd')
relation('h', 'contains', 'e')
relation('h', 'contains', 'f')
relation('h', 'contains', 'g')
relation('h', 'finished_by', 'j')
relation('a', 'finished_by', 'g')
relation('e', 'finished_by', 'g')

verdict('checked')
```

The verdict is **checked**: all 100 relations follow from the times given,
and the list is complete: they are every answer of the query.

---

## Try it

```sh
eyemind examples/interval-relations.js            # all 100 relations
eyemind --proof examples/interval-relations.js    # with their proofs
```

Add `fact(start_duration('k', 600, 60))` (10:00 for one hour): k gets 21
relations of its own, among them `relation('k', 'equals', 'f')`,
`relation('k', 'starts', 'a')` and `relation('k', 'meets', 'g')`. Swap b's
times to `interval('b', 900, 780)`: b is now backwards, not valid, and all
19 relations that mention b disappear.

---

## Takeaway

Thirteen precise definitions turn a vague "do these clash?" into exact
answers, each one traceable back to the start and end times it came from.
