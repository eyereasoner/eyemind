# Which temperature evidence drives a quarantine?

*Keep the message boundary, the evidence policy and the resulting task visible.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/cold-chain-recall.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/cold-chain-recall.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/cold-chain-recall.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/cold-chain-recall.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=cold-chain-recall)

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
  current_reading(Id, Sample, Batch, Sensor, Temperature))                                                                   // 12
implies([
  current_reading(_, Sample, Batch, _, Low), current_reading(_, Sample, Batch, _, High),
  temperature_limit(Limit), le(Low, Limit), gt(High, Limit),
], conflicting_sample(Sample, Batch))                                                                                        // 13
implies([
  current_reading(Id, Sample, Batch, Sensor, _), current_reading(_, Sample, Batch, OtherSensor, _),
  sensor_priority(Sensor, Priority), sensor_priority(OtherSensor, OtherPriority), gt(OtherPriority, Priority),
], superseded(Id))                                                                                                           // 14
implies([current_reading(Id, _, Batch, _, Temperature), not(superseded(Id))], selected_reading(Id, Batch, Temperature))      // 15
implies([selected_reading(Id, Batch, Temperature), temperature_limit(Limit), gt(Temperature, Limit)], quarantine(Batch, Id)) // 16
implies([quarantine(Batch, _), destination(Batch, Site)], notify(Site, Batch))                                               // 17
implies(quarantine(Batch, Evidence), inspection_task(Batch, Evidence, Task))                                                 // 18
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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(selected_reading('logger_a', 'batch_a', 94), clause(15), {Id: 'logger_a', _0: 'handover_a', Batch: 'batch_a', _1: 'calibrated_logger', Temperature: 94}, [current_reading('logger_a', 'handover_a', 'batch_a', 'calibrated_logger', 94), not(superseded('logger_a'))])
step(current_reading('logger_a', 'handover_a', 'batch_a', 'calibrated_logger', 94), clause(12), {Id: 'logger_a', Sample: 'handover_a', Batch: 'batch_a', Sequence: 44, Sensor: 'calibrated_logger', Temperature: 94, Committed: 42}, [observation('logger_a', 'handover_a', 'batch_a', 44, 'calibrated_logger', 94), checkpoint(42), gt(44, 42)])
step(selected_reading('logger_b', 'batch_b', 75), clause(15), {Id: 'logger_b', _0: 'handover_b', Batch: 'batch_b', _1: 'calibrated_logger', Temperature: 75}, [current_reading('logger_b', 'handover_b', 'batch_b', 'calibrated_logger', 75), not(superseded('logger_b'))])
step(current_reading('logger_b', 'handover_b', 'batch_b', 'calibrated_logger', 75), clause(12), {Id: 'logger_b', Sample: 'handover_b', Batch: 'batch_b', Sequence: 45, Sensor: 'calibrated_logger', Temperature: 75, Committed: 42}, [observation('logger_b', 'handover_b', 'batch_b', 45, 'calibrated_logger', 75), checkpoint(42), gt(45, 42)])
step(current_reading('handheld_a', 'handover_a', 'batch_a', 'handheld', 72), clause(12), {Id: 'handheld_a', Sample: 'handover_a', Batch: 'batch_a', Sequence: 43, Sensor: 'handheld', Temperature: 72, Committed: 42}, [observation('handheld_a', 'handover_a', 'batch_a', 43, 'handheld', 72), checkpoint(42), gt(43, 42)])
step(superseded('handheld_a'), clause(14), {Id: 'handheld_a', Sample: 'handover_a', Batch: 'batch_a', Sensor: 'handheld', _0: 72, _1: 'logger_a', OtherSensor: 'calibrated_logger', _2: 94, Priority: 1, OtherPriority: 2}, [current_reading('handheld_a', 'handover_a', 'batch_a', 'handheld', 72), current_reading('logger_a', 'handover_a', 'batch_a', 'calibrated_logger', 94), sensor_priority('handheld', 1), sensor_priority('calibrated_logger', 2), gt(2, 1)])
step(conflicting_sample('handover_a', 'batch_a'), clause(13), {_0: 'handheld_a', Sample: 'handover_a', Batch: 'batch_a', _1: 'handheld', Low: 72, _2: 'logger_a', _3: 'calibrated_logger', High: 94, Limit: 80}, [current_reading('handheld_a', 'handover_a', 'batch_a', 'handheld', 72), current_reading('logger_a', 'handover_a', 'batch_a', 'calibrated_logger', 94), temperature_limit(80), le(72, 80), gt(94, 80)])
step(quarantine('batch_a', 'logger_a'), clause(16), {Id: 'logger_a', Batch: 'batch_a', Temperature: 94, Limit: 80}, [selected_reading('logger_a', 'batch_a', 94), temperature_limit(80), gt(94, 80)])
step(notify('north_depot', 'batch_a'), clause(17), {Batch: 'batch_a', _0: 'logger_a', Site: 'north_depot'}, [quarantine('batch_a', 'logger_a'), destination('batch_a', 'north_depot')])
step(notify('station_shop', 'batch_a'), clause(17), {Batch: 'batch_a', _0: 'logger_a', Site: 'station_shop'}, [quarantine('batch_a', 'logger_a'), destination('batch_a', 'station_shop')])
step(inspection_task('batch_a', 'logger_a', skolem(18, 'Task', ['batch_a', 'logger_a'])), clause(18), {Batch: 'batch_a', Evidence: 'logger_a', Task: skolem(18, 'Task', ['batch_a', 'logger_a'])}, [quarantine('batch_a', 'logger_a')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(selected_reading(A, B, C), [selected_reading('logger_a', 'batch_a', 94), selected_reading('logger_b', 'batch_b', 75)])
derived(current_reading(A, B, C, D, E), [current_reading('handheld_a', 'handover_a', 'batch_a', 'handheld', 72), current_reading('logger_a', 'handover_a', 'batch_a', 'calibrated_logger', 94), current_reading('logger_b', 'handover_b', 'batch_b', 'calibrated_logger', 75)])
derived(superseded(A), [superseded('handheld_a')])
derived(conflicting_sample(A, B), [conflicting_sample('handover_a', 'batch_a')])
derived(quarantine(A, B), [quarantine('batch_a', 'logger_a')])
derived(notify(A, B), [notify('north_depot', 'batch_a'), notify('station_shop', 'batch_a')])
derived(inspection_task(A, B, C), [inspection_task('batch_a', 'logger_a', skolem(18, 'Task', ['batch_a', 'logger_a']))])
called(selected_reading(A, B, C), [selected_reading('logger_a', 'batch_a', 94), selected_reading('logger_b', 'batch_b', 75)])
called(current_reading(D, _4, F, _6, H), [current_reading('handheld_a', 'handover_a', 'batch_a', 'handheld', 72), current_reading('logger_a', 'handover_a', 'batch_a', 'calibrated_logger', 94), current_reading('logger_b', 'handover_b', 'batch_b', 'calibrated_logger', 75)])
called(superseded('handheld_a'), [superseded('handheld_a')])
called(superseded('logger_a'), [])
called(superseded('logger_b'), [])
called(current_reading(I, J, K, L, _12), [current_reading('handheld_a', 'handover_a', 'batch_a', 'handheld', 72), current_reading('logger_a', 'handover_a', 'batch_a', 'calibrated_logger', 94), current_reading('logger_b', 'handover_b', 'batch_b', 'calibrated_logger', 75)])
called(current_reading(_13, 'handover_a', 'batch_a', O, _15), [current_reading('handheld_a', 'handover_a', 'batch_a', 'handheld', 72), current_reading('logger_a', 'handover_a', 'batch_a', 'calibrated_logger', 94)])
called(current_reading(_13, 'handover_b', 'batch_b', O, _15), [current_reading('logger_b', 'handover_b', 'batch_b', 'calibrated_logger', 75)])
called(conflicting_sample(Q, R), [conflicting_sample('handover_a', 'batch_a')])
called(current_reading(_18, T, U, _21, W), [current_reading('handheld_a', 'handover_a', 'batch_a', 'handheld', 72), current_reading('logger_a', 'handover_a', 'batch_a', 'calibrated_logger', 94), current_reading('logger_b', 'handover_b', 'batch_b', 'calibrated_logger', 75)])
called(current_reading(_23, 'handover_a', 'batch_a', _24, Z), [current_reading('handheld_a', 'handover_a', 'batch_a', 'handheld', 72), current_reading('logger_a', 'handover_a', 'batch_a', 'calibrated_logger', 94)])
called(current_reading(_23, 'handover_b', 'batch_b', _24, Z), [current_reading('logger_b', 'handover_b', 'batch_b', 'calibrated_logger', 75)])
called(quarantine(A1, B1), [quarantine('batch_a', 'logger_a')])
called(notify(C1, D1), [notify('north_depot', 'batch_a'), notify('station_shop', 'batch_a')])
called(quarantine(E1, _31), [quarantine('batch_a', 'logger_a')])
called(inspection_task(G1, H1, I1), [inspection_task('batch_a', 'logger_a', skolem(18, 'Task', ['batch_a', 'logger_a']))])
```

It has three parts:

- **The claims**: the seven answers the proof is about.
- **The steps**: one per fact a forward rule derived. A step reads
  `step(what, by which rule, with which values, using what)`. Each cites
  `clause(N)`, rule N of the program, and lists the goals of that rule's
  body as they were met. Source facts and comparisons such as `gt(44, 42)`
  get no step: the checker looks up the one and calculates the other.
- **The certificate**: the `derived(Pattern, Facts)` **listings** give every
  fact the rules derived for a relation, and the `called(Call, Answers)`
  **call tables** give every answer of each call made while answering the
  questions.

Read the steps as sentences:

1. *The logger reading of batch A is selected*: by rule 15, because it is
   current (step 2) and `not(superseded('logger_a'))` holds.
2. *The logger reading (9.4°C) is current*: by rule 12, because of its
   observation, the checkpoint 42 and 44 > 42.
3. *The logger reading of batch B (7.5°C) is selected*: by rule 15, because
   it is current (step 4) and not superseded.
4. *The logger reading of batch B is current*: by rule 12, with 45 > 42.
5. *The handheld reading (7.2°C) is current*: by rule 12, with 43 > 42.
6. *The handheld reading is superseded*: by rule 14, because the logger
   read the same sample and the logger's priority, 2, is higher than the
   handheld's, 1.
7. *The handover of batch A is a conflicting sample*: by rule 13, with
   `Low` = 72, `High` = 94 and `Limit` = 80, because 72 ≤ 80 and 94 > 80.
8. *Batch A is quarantined on the evidence of `logger_a`*: by rule 16,
   because that reading is selected (step 1) and 94 > 80.
9. –10. *North depot and station shop are notified about batch A*: by rule
   17, because batch A is quarantined and goes to both.
11. *Batch A has the inspection task `skolem(18, 'Task', ['batch_a',
    'logger_a'])`*: by rule 18, because batch A is quarantined. `Task` is
    bound to the invented name.

No answer is about the handheld being superseded, yet step 6 is there: the
listing `derived(superseded(A), [superseded('handheld_a')])` holds every
reading the rules set aside, and each listed fact needs a step of its own.

The call tables record the searches. `called(superseded('logger_a'), [])`
and `called(superseded('logger_b'), [])` say that neither logger reading is
superseded: those calls have no answers. The `current_reading` tables record
which current readings there are, and which belong to the same sample.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it follows the
certificate. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
conflicting_sample('handover_a', 'batch_a')
selected_reading('logger_a', 'batch_a', 94)
selected_reading('logger_b', 'batch_b', 75)
quarantine('batch_a', 'logger_a')
notify('north_depot', 'batch_a')
notify('station_shop', 'batch_a')
inspection_task('batch_a', 'logger_a', skolem(18, 'Task', ['batch_a', 'logger_a']))

verdict('checked')
```

The checker does three things:

- **It answers the questions from the tables.** Each `query()` is searched
  one level against the program, with every inner call answered from its
  call table, and each table is checked the same way, so a table with a
  missing or an extra answer shows up as a disagreement.
- **It requires each listing to be closed.** Rule 14, run over the listed
  current readings and the priority facts, supersedes a reading only when a
  sensor with a higher priority read the same sample; for handover A that is
  just the handheld reading, and batch B's sample has no other reading at
  all. So the listing of superseded readings is complete, and the empty
  tables for `superseded('logger_a')` and `superseded('logger_b')` agree with
  it. Neither absence is taken on trust.
- **It replays each listed fact.** Each step's rule is run again from no
  bindings: the comparisons are calculated, the negation is decided from the
  tables at the bindings it had, and `Task` is bound to the Skolem term the
  checker recomputes from rule 18, the variable `Task` and the values batch A
  and `logger_a`. The step must then match exactly.

A step, table or listing the check does not use would fail it. The claim is
about what this program says, not about the world. The verdict is
**checked**: the answers follow from the program, and they are every
answer of the original questions.

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
