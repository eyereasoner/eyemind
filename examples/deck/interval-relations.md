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

`eyemind --proof` writes down how it reached each answer. The proof has 214
steps and is about 31 KB; the
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/interval-relations.js)
is linked above. Here are its opening comment and first claims, its
clauses, the complete chain for `relation('a', 'before', 'i')` (steps
1–12), and the step for its reverse:

```js
// Answers: each instance of a query() that holds.
relation('a', 'before', 'i')
relation('a', 'before', 'j')
relation('a', 'before', 'b')
// … 97 more claims, 100 in all

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(interval('a', 600, 720)))
clause(2, fact(interval('b', 780, 900)))
clause(3, fact(interval('c', 720, 840)))
clause(4, fact(interval('d', 660, 780)))
clause(5, fact(interval('e', 600, 720)))
clause(6, fact(interval('f', 600, 660)))
clause(7, fact(interval('g', 660, 720)))
clause(8, fact(interval('h', 540, 960)))
clause(9, fact(start_duration('i', 960, 120)))
clause(10, fact(end_duration('j', 960, 60)))
clause(11, implies([start_duration(I, S, D), gt(D, 0), is(E, add(S, D))], interval(I, S, E)))
clause(12, implies([end_duration(I, E, D), gt(D, 0), is(S, sub(E, D))], interval(I, S, E)))
clause(13, implied_by(valid_interval(I, S, E), [interval(I, S, E), lt(S, E)]))
clause(14, implied_by(pair(I, J, SI, EI, SJ, EJ), [valid_interval(I, SI, EI), valid_interval(J, SJ, EJ)]))
clause(15, implies([pair(I, J, SI, EI, SJ, EJ), lt(EI, SJ)], relation(I, 'before', J)))
clause(16, implies([pair(I, J, SI, EI, SJ, EJ), eq(EI, SJ)], relation(I, 'meets', J)))
clause(17, implies([pair(I, J, SI, EI, SJ, EJ), lt(SI, SJ), lt(SJ, EI), lt(EI, EJ)], relation(I, 'overlaps', J)))
clause(18, implies([pair(I, J, SI, EI, SJ, EJ), eq(SI, SJ), lt(EI, EJ)], relation(I, 'starts', J)))
clause(19, implies([pair(I, J, SI, EI, SJ, EJ), lt(SJ, SI), lt(EI, EJ)], relation(I, 'during', J)))
clause(20, implies([pair(I, J, SI, EI, SJ, EJ), lt(SJ, SI), eq(EI, EJ)], relation(I, 'finishes', J)))
clause(21, implies([pair(I, J, SI, EI, SJ, EJ), eq(SI, SJ), eq(EI, EJ)], relation(I, 'equals', J)))
clause(22, implies(relation(I, 'before', J), relation(J, 'after', I)))
clause(23, implies(relation(I, 'meets', J), relation(J, 'met_by', I)))
clause(24, implies(relation(I, 'overlaps', J), relation(J, 'overlapped_by', I)))
clause(25, implies(relation(I, 'starts', J), relation(J, 'started_by', I)))
clause(26, implies(relation(I, 'during', J), relation(J, 'contains', I)))
clause(27, implies(relation(I, 'finishes', J), relation(J, 'finished_by', I)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(relation('a', 'before', 'i'), clause(15), {I: 'a', J: 'i', SI: 600, EI: 720, SJ: 960, EJ: 1080}, [pair('a', 'i', 600, 720, 960, 1080), lt(720, 960)])
step(pair('a', 'i', 600, 720, 960, 1080), clause(14), {I: 'a', J: 'i', SI: 600, EI: 720, SJ: 960, EJ: 1080}, [valid_interval('a', 600, 720), valid_interval('i', 960, 1080)])
step(valid_interval('a', 600, 720), clause(13), {I: 'a', S: 600, E: 720}, [interval('a', 600, 720), lt(600, 720)])
step(interval('a', 600, 720), clause(1), {}, [])
step(lt(600, 720), 'builtin', {}, [])
step(valid_interval('i', 960, 1080), clause(13), {I: 'i', S: 960, E: 1080}, [interval('i', 960, 1080), lt(960, 1080)])
step(interval('i', 960, 1080), clause(11), {I: 'i', S: 960, D: 120, E: 1080}, [start_duration('i', 960, 120), gt(120, 0), is(1080, add(960, 120))])
step(start_duration('i', 960, 120), clause(9), {}, [])
step(gt(120, 0), 'builtin', {}, [])
step(is(1080, add(960, 120)), 'builtin', {}, [])
step(lt(960, 1080), 'builtin', {}, [])
step(lt(720, 960), 'builtin', {}, [])
// … steps 13–170
step(relation('i', 'after', 'a'), clause(22), {I: 'a', J: 'i'}, [relation('a', 'before', 'i')])
// … steps 172–214
```

It has three parts:

- **The claims**: the 100 answers.
- **The clauses**: the program's 27 lines, numbered by position.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`. A `'builtin'`
  step is a calculation or comparison the checker redoes itself.

Read the chain as sentences:

1. *a is before i* — by rule 15, with a running 600–720 and i 960–1080,
   because (a, i) is a valid pair and 720 < 960.
2. *(a, i) is a pair of valid slots* — by rule 14, because both are valid.
3. *a is valid* — by rule 13, because a runs 600–720 and 600 < 720.
4. *a runs 600–720* — fact 1.
5. *600 < 720* — builtin.
6. *i is valid* — by rule 13, because i runs 960–1080 and 960 < 1080.
7. *i runs 960–1080* — by rule 11, because i starts at 960 and lasts 120,
   120 > 0, and 960 + 120 = 1080.
8. *i starts at 960 and lasts 120* — fact 9.
9. *120 > 0* — builtin.
10. *960 + 120 = 1080* — builtin.
11. *960 < 1080* — builtin.
12. *720 < 960* — builtin: a ends before i starts.

And step 171: *i is after a* — by rule 22, the reverse of *before*, because
a is before i (step 1). Each later answer reuses what is already proved:
a's and i's validity are shown once and cited again.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
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

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 178)
condition('C2', 'well_founded', 'ok', 214)
condition('C3', 'justification', 'ok', 214)
condition('C4', 'coverage', 'ok', 427)
condition('C5', 're_decision', 'ok', 36)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 314)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(214)
verified(178)
recomputed(36)
composed(0)
trusted(0)
claims(100)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (178)**: the 178 steps that cite a program line really are
  instances of it with the values shown.
- **C2 well-founded (214)**: none of the 214 steps depends on itself, even
  indirectly: the reverse relations rest on the forward ones, never the
  other way round.
- **C3 justification (214)**: every step says how it was justified, in a
  form the checker understands.
- **C4 coverage (427)**: the 100 claims and the 327 things the steps use are
  each backed by a step.
- **C5 re-decision (36)**: the checker **recomputed** all 36 builtin steps,
  the two endpoint sums and every comparison of times, and got the same
  results.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of something, so there is nothing to confront.
- **C7 relevance (314)**: the 100 claims answer the query, and all 214 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing.
- **C9 search closure (0)**: there was no absence or collection to
  settle, so no search certificate to check.

The statistics repeat this: 214 steps, 178 verified against the program, 36
recomputed, none taken on trust. The verdict is **checked**: all 100
relations follow from the times given. It does not say the list of
relations is complete.

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
