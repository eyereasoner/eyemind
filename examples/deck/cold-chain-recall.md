# Which temperature evidence drives a quarantine?

*Keep the message boundary, the evidence policy and the resulting task visible.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/cold-chain-recall.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/cold-chain-recall.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/cold-chain-recall.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/cold-chain-recall.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=cold-chain-recall)

---

## The question

A distributor of chilled food receives a temperature reading each time one
of its batches changes hands. At the handover of batch A, two sensors
disagree: a handheld thermometer reports 7.2°C and a calibrated logger
reports 9.4°C. The limit, chosen for illustration, is 8°C. Batch B was
handed over at 7.5°C.

Messages arrive numbered in sequence. The distributor has already processed
everything up to message 42 (its *checkpoint*), so only later messages count.

**Which reading should drive the decision, which batch must be quarantined,
and which destinations need notice?**

---

## What we tell eyemind: the data

```js
fact(checkpoint(42), temperature_limit(80))                                    // clauses 1, 2
fact(sensor_priority('handheld', 1), sensor_priority('calibrated_logger', 2))  // 3, 4
// observation(Id, Sample, Batch, Sequence, Sensor, TemperatureTenthC)
fact(observation('old_b', 'old_handover', 'batch_b', 41, 'calibrated_logger', 120))  // 5
fact(observation('handheld_a', 'handover_a', 'batch_a', 43, 'handheld', 72))         // 6
fact(observation('logger_a', 'handover_a', 'batch_a', 44, 'calibrated_logger', 94))  // 7
fact(observation('logger_b', 'handover_b', 'batch_b', 45, 'calibrated_logger', 75))  // 8
fact(destination('batch_a', 'north_depot'), destination('batch_a', 'station_shop'))  // 9, 10
fact(destination('batch_b', 'south_depot'))                                          // 11
```

Each `fact` states something true outright, and each item is a numbered
**clause** of the program. Temperatures are whole numbers in tenths of a
degree, so 80 means 8.0°C and 94 means 9.4°C. Each observation has an
identifier, the sample it measured, the batch, its message number, the
sensor and the temperature. The calibrated logger has the higher priority.
Message 41 (an old 12°C reading of batch B) falls before the checkpoint.

---

## What we tell eyemind: the rules

```js
implies([observation(Id, Sample, Batch, Sequence, Sensor, Temperature), checkpoint(Committed), gt(Sequence, Committed)],
  current_reading(Id, Sample, Batch, Sensor, Temperature))                                  // 12
implies([
  current_reading(_, Sample, Batch, _, Low), current_reading(_, Sample, Batch, _, High),
  temperature_limit(Limit), le(Low, Limit), gt(High, Limit),
], conflicting_sample(Sample, Batch))                                                       // 13
implies([
  current_reading(Id, Sample, Batch, Sensor, _), current_reading(_, Sample, Batch, OtherSensor, _),
  sensor_priority(Sensor, Priority), sensor_priority(OtherSensor, OtherPriority), gt(OtherPriority, Priority),
], superseded(Id))                                                                          // 14
implies([current_reading(Id, _, Batch, _, Temperature), not(superseded(Id))], selected_reading(Id, Batch, Temperature))   // 15
implies([selected_reading(Id, Batch, Temperature), temperature_limit(Limit), gt(Temperature, Limit)], quarantine(Batch, Id))   // 16
implies([quarantine(Batch, _), destination(Batch, Site)], notify(Site, Batch))              // 17
implies(quarantine(Batch, Evidence), inspection_task(Batch, Evidence, Task))                // 18
```

- `implies(premise, conclusion)` is a **forward rule**: whenever everything
  in the premise list holds, eyemind adds the conclusion.
- Capitalized names are **variables**: they stand for whatever value makes
  the rule fit. `_` is a variable we do not care about.
- `gt(A, B)` (A greater than B) and `le(A, B)` (A less than or equal to B)
  are **built-in comparisons**: eyemind calculates them itself instead of
  looking them up in facts.
- `not(...)` means "it cannot be found". eyemind decides it by searching:
  if the goal inside cannot be shown, `not` succeeds.

In words: rule 12 keeps only messages after the checkpoint. Rule 13 flags a
sample with one reading within the limit and another above it. Rule 14 sets
a reading aside when a higher-priority sensor read the same sample. Rule 15
selects every current reading that is not set aside. Rule 16 quarantines a
batch whose selected reading is above the limit, rule 17 notifies each of
its destinations, and rule 18 opens an inspection task for each quarantine.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
conflicting_sample('handover_a', 'batch_a')
selected_reading('logger_a', 'batch_a', 94)
selected_reading('logger_b', 'batch_b', 75)
quarantine('batch_a', 'logger_a')
notify('north_depot', 'batch_a')
notify('station_shop', 'batch_a')
inspection_task('batch_a', 'logger_a', skolem(18, 'Task', ['batch_a', 'logger_a']))
```

The handover of batch A is a conflict: 7.2°C is within the limit and 9.4°C
is above it. The logger's 9.4°C is selected, since it outranks the
handheld, so batch A is quarantined and its two destinations are notified.
Batch B's selected reading is 7.5°C, so it passes; its older 12°C
observation is outside the uncommitted tail of messages.

---

## A task that has an identity

Rule 18 concludes `inspection_task(Batch, Evidence, Task)`. Its last
variable, `Task`, appears nowhere in the premise: the rule says only that
*some* task exists. eyemind gives such an unknown a made-up name, a
**Skolem term**, written `skolem(Rule, Variable, Values)`:
`skolem(18, 'Task', ['batch_a', 'logger_a'])` reads *the `Task` of rule 18
for batch A and evidence `logger_a`*. Repeating the same firing (the same
rule with the same values) names the same task, and the name can never be
mistaken for anything else. Such an invented name is also called a
*witness*.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
conflicting_sample('handover_a', 'batch_a')
selected_reading('logger_a', 'batch_a', 94)
selected_reading('logger_b', 'batch_b', 75)
quarantine('batch_a', 'logger_a')
notify('north_depot', 'batch_a')
notify('station_shop', 'batch_a')
inspection_task('batch_a', 'logger_a', skolem(18, 'Task', ['batch_a', 'logger_a']))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(checkpoint(42)))
clause(2, fact(temperature_limit(80)))
clause(6, fact(observation('handheld_a', 'handover_a', 'batch_a', 43, 'handheld', 72)))
clause(7, fact(observation('logger_a', 'handover_a', 'batch_a', 44, 'calibrated_logger', 94)))
clause(8, fact(observation('logger_b', 'handover_b', 'batch_b', 45, 'calibrated_logger', 75)))
clause(9, fact(destination('batch_a', 'north_depot')))
clause(10, fact(destination('batch_a', 'station_shop')))
clause(12, implies([observation(Id, Sample, Batch, Sequence, Sensor, Temperature), checkpoint(Committed), gt(Sequence, Committed)], current_reading(Id, Sample, Batch, Sensor, Temperature)))
clause(13, implies([current_reading(_0, Sample, Batch, _1, Low), current_reading(_2, Sample, Batch, _3, High), temperature_limit(Limit), le(Low, Limit), gt(High, Limit)], conflicting_sample(Sample, Batch)))
clause(15, implies([current_reading(Id, _0, Batch, _1, Temperature), not(superseded(Id))], selected_reading(Id, Batch, Temperature)))
clause(16, implies([selected_reading(Id, Batch, Temperature), temperature_limit(Limit), gt(Temperature, Limit)], quarantine(Batch, Id)))
clause(17, implies([quarantine(Batch, _0), destination(Batch, Site)], notify(Site, Batch)))
clause(18, implies(quarantine(Batch, Evidence), inspection_task(Batch, Evidence, Task)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(conflicting_sample('handover_a', 'batch_a'), clause(13), {_0: 'handheld_a', Sample: 'handover_a', Batch: 'batch_a', _1: 'handheld', Low: 72, _2: 'logger_a', _3: 'calibrated_logger', High: 94, Limit: 80}, [current_reading('handheld_a', 'handover_a', 'batch_a', 'handheld', 72), current_reading('logger_a', 'handover_a', 'batch_a', 'calibrated_logger', 94), temperature_limit(80), le(72, 80), gt(94, 80)])
step(current_reading('handheld_a', 'handover_a', 'batch_a', 'handheld', 72), clause(12), {Id: 'handheld_a', Sample: 'handover_a', Batch: 'batch_a', Sequence: 43, Sensor: 'handheld', Temperature: 72, Committed: 42}, [observation('handheld_a', 'handover_a', 'batch_a', 43, 'handheld', 72), checkpoint(42), gt(43, 42)])
step(observation('handheld_a', 'handover_a', 'batch_a', 43, 'handheld', 72), clause(6), {}, [])
step(checkpoint(42), clause(1), {}, [])
step(gt(43, 42), 'builtin', {}, [])
step(current_reading('logger_a', 'handover_a', 'batch_a', 'calibrated_logger', 94), clause(12), {Id: 'logger_a', Sample: 'handover_a', Batch: 'batch_a', Sequence: 44, Sensor: 'calibrated_logger', Temperature: 94, Committed: 42}, [observation('logger_a', 'handover_a', 'batch_a', 44, 'calibrated_logger', 94), checkpoint(42), gt(44, 42)])
step(observation('logger_a', 'handover_a', 'batch_a', 44, 'calibrated_logger', 94), clause(7), {}, [])
step(gt(44, 42), 'builtin', {}, [])
step(temperature_limit(80), clause(2), {}, [])
step(le(72, 80), 'builtin', {}, [])
step(gt(94, 80), 'builtin', {}, [])
step(selected_reading('logger_a', 'batch_a', 94), clause(15), {Id: 'logger_a', _0: 'handover_a', Batch: 'batch_a', _1: 'calibrated_logger', Temperature: 94}, [current_reading('logger_a', 'handover_a', 'batch_a', 'calibrated_logger', 94), not(superseded('logger_a'))])
step(not(superseded('logger_a')), 'absent', {}, [])
step(selected_reading('logger_b', 'batch_b', 75), clause(15), {Id: 'logger_b', _0: 'handover_b', Batch: 'batch_b', _1: 'calibrated_logger', Temperature: 75}, [current_reading('logger_b', 'handover_b', 'batch_b', 'calibrated_logger', 75), not(superseded('logger_b'))])
step(current_reading('logger_b', 'handover_b', 'batch_b', 'calibrated_logger', 75), clause(12), {Id: 'logger_b', Sample: 'handover_b', Batch: 'batch_b', Sequence: 45, Sensor: 'calibrated_logger', Temperature: 75, Committed: 42}, [observation('logger_b', 'handover_b', 'batch_b', 45, 'calibrated_logger', 75), checkpoint(42), gt(45, 42)])
step(observation('logger_b', 'handover_b', 'batch_b', 45, 'calibrated_logger', 75), clause(8), {}, [])
step(gt(45, 42), 'builtin', {}, [])
step(not(superseded('logger_b')), 'absent', {}, [])
step(quarantine('batch_a', 'logger_a'), clause(16), {Id: 'logger_a', Batch: 'batch_a', Temperature: 94, Limit: 80}, [selected_reading('logger_a', 'batch_a', 94), temperature_limit(80), gt(94, 80)])
step(notify('north_depot', 'batch_a'), clause(17), {Batch: 'batch_a', _0: 'logger_a', Site: 'north_depot'}, [quarantine('batch_a', 'logger_a'), destination('batch_a', 'north_depot')])
step(destination('batch_a', 'north_depot'), clause(9), {}, [])
step(notify('station_shop', 'batch_a'), clause(17), {Batch: 'batch_a', _0: 'logger_a', Site: 'station_shop'}, [quarantine('batch_a', 'logger_a'), destination('batch_a', 'station_shop')])
step(destination('batch_a', 'station_shop'), clause(10), {}, [])
step(inspection_task('batch_a', 'logger_a', skolem(18, 'Task', ['batch_a', 'logger_a'])), clause(18), {Batch: 'batch_a', Evidence: 'logger_a', Task: skolem(18, 'Task', ['batch_a', 'logger_a'])}, [quarantine('batch_a', 'logger_a')])
```

It has three parts:

- **The claims**: the seven answers the proof is about.
- **The clauses**: the program clauses the proof relies on, by number. Each
  don't-care `_` gets a name (`_0`, `_1`, …) so a step can say what it stood
  for. Rule 14, which sets readings aside, is not cited: no claim needs to
  show that a reading *is* superseded.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.

Three kinds of justification occur:

- `clause(N)`: the step is an instance of program clause N, with the
  variables standing for the values shown.
- `'builtin'`: a built-in comparison such as `gt(43, 42)`. It cites no
  clause and uses nothing; the checker simply calculates it again.
- `'absent'`: the step holds because something could **not** be found. A
  proof cannot point at a missing thing, so this step is taken on trust and
  listed as an *obligation* (something the reader must accept or verify
  separately).

Read the steps as sentences:

1. *The handover of batch A is a conflicting sample*: by rule 13, with
   `Low` = 72, `High` = 94 and `Limit` = 80, because of the two current
   readings below, the limit, and 72 ≤ 80 and 94 > 80.
2. *The handheld reading (7.2°C) is current*: by rule 12, because of
   observation 6, the checkpoint 42 and 43 > 42.
3. *The handheld observation*: fact 6.
4. *The checkpoint is 42*: fact 1.
5. *43 > 42*: a built-in comparison.
6. *The logger reading (9.4°C) is current*: by rule 12, because of
   observation 7, the checkpoint and 44 > 42.
7. *The logger observation*: fact 7.
8. *44 > 42*: a built-in comparison.
9. *The limit is 80*: fact 2.
10. *72 ≤ 80*: a built-in comparison.
11. *94 > 80*: a built-in comparison.
12. *The logger reading of batch A is selected*: by rule 15, because it is
    current (step 6) and not superseded.
13. *The logger reading of batch A is not superseded*: `'absent'`; no
    higher-priority sensor read that sample.
14. *The logger reading of batch B (7.5°C) is selected*: by rule 15,
    because it is current and not superseded.
15. *The logger reading of batch B is current*: by rule 12, because of
    observation 8, the checkpoint and 45 > 42.
16. *The batch B observation*: fact 8.
17. *45 > 42*: a built-in comparison.
18. *The logger reading of batch B is not superseded*: `'absent'`.
19. *Batch A is quarantined on the evidence of `logger_a`*: by rule 16,
    because that reading is selected (step 12), the limit is 80 and 94 > 80
    (steps 9 and 11).
20. *North depot is notified about batch A*: by rule 17, because batch A is
    quarantined and goes to north depot.
21. *Batch A goes to north depot*: fact 9.
22. *Station shop is notified about batch A*: by rule 17, likewise.
23. *Batch A goes to station shop*: fact 10.
24. *Batch A has the inspection task `skolem(18, 'Task', ['batch_a',
    'logger_a'])`*: by rule 18, because batch A is quarantined. `Task` is
    bound to the invented name.

Steps that were already established are reused rather than repeated: the
checkpoint (step 4), the limit (step 9) and 94 > 80 (step 11) each appear
once.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
conflicting_sample('handover_a', 'batch_a')
selected_reading('logger_a', 'batch_a', 94)
selected_reading('logger_b', 'batch_b', 75)
quarantine('batch_a', 'logger_a')
notify('north_depot', 'batch_a')
notify('station_shop', 'batch_a')
inspection_task('batch_a', 'logger_a', skolem(18, 'Task', ['batch_a', 'logger_a']))

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 17)
condition('C2', 'well_founded', 'ok', 24)
condition('C3', 'justification', 'ok', 24)
condition('C4', 'coverage', 'ok', 33)
condition('C5', 're_decision', 'ok', 5)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 31)
condition('C8', 'witness_integrity', 'ok', 1)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not(superseded('logger_a')))
obligation('absent', 'theory_scoped', not(superseded('logger_b')))

// Proof statistics: recorded steps and how they were checked.
steps(24)
verified(17)
recomputed(5)
composed(0)
trusted(2)
claims(7)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (17)**: the 17 clause steps really are instances of the
  clauses they cite, with the values shown.
- **C2 well-founded (24)**: none of the 24 steps depends on itself, even
  indirectly.
- **C3 justification (24)**: all 24 steps say how they were justified, in a
  form the checker understands.
- **C4 coverage (33)**: the 7 claims and the 26 things the steps use are
  each backed by a step: nothing is taken for granted.
- **C5 re-decision (5)**: the 5 comparisons (43 > 42, 44 > 42, 72 ≤ 80,
  94 > 80 and 45 > 42) were calculated again by the checker, and they hold.
- **C6 boundary consistency (0)**: the checker had nothing to confront the
  2 absences with. `superseded` is only a rule: no program fact and no step
  of the proof is a `superseded` statement about any reading, so nothing
  could refute "`logger_a` is not superseded" or "`logger_b` is not
  superseded". Both are left undecided and stay obligations taken on
  trust.
- **C7 relevance (31)**: the 7 claims answer the queries, and all 24 steps
  serve them. There is no padding.
- **C8 witness integrity (1)**: the 1 step that invents a name (step 24)
  was checked: the checker recomputes the Skolem term from rule 18, the
  variable `Task` and the values batch A and `logger_a`, and confirms that
  the step uses exactly that name.

The two `obligation` lines say, in plain words: *it is taken on trust that
the logger readings of batch A and of batch B are not superseded*, that is,
that no higher-priority sensor read the same samples. `'theory_scoped'`
means the claim is about what this program says, not about the world.

The statistics repeat this: 24 steps, 17 verified against the program, 5
recomputed, 2 trusted. The verdict is **checked_with_obligations**: the
answers follow from the program, provided the two absences are accepted. It
does not establish that eyemind found every answer, and the absences
themselves were taken on trust rather than proved.

The supplied priorities express an evidence policy; they do not establish
sensor calibration in the real world. Equal priorities can leave multiple
readings selected. The program reports actions without executing them.

---

## Try it

```sh
eyemind examples/cold-chain-recall.js
eyemind --proof examples/cold-chain-recall.js
eyemind -c examples/cold-chain-recall.js
```

Advance the checkpoint to 44. Only the batch B reading remains in the new
tail, so this run derives no quarantine or inspection task. It does not
reconstruct decisions from earlier runs.

Give the handheld priority 2, the same as the logger: neither reading
supersedes the other, so both `selected_reading('handheld_a', 'batch_a', 72)`
and the logger's reading are selected. Batch A is still quarantined, on the
logger's evidence. Or lower the logger's reading from 94 to 79: no reading
is above the limit, so there is no conflict, no quarantine and no task.

---

## Takeaway

A recall decision is only as good as the reading it rests on. Writing down
which reading counts, and why, makes the decision one you can trace from the
thermometer to the notice, and check.
