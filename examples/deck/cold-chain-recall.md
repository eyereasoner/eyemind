# Which temperature evidence drives a quarantine?

*Keep the message boundary, the evidence policy and the resulting task visible.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/cold-chain-recall.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/cold-chain-recall.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/cold-chain-recall.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/cold-chain-recall.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=cold-chain-recall)

---

## The question

A chilled-food handover has two readings: a handheld reports 7.2°C and a
calibrated logger reports 9.4°C. The illustrative limit is 8°C. Which reading
should drive the distributor's decision, and which destinations need notice?

---

## What we tell eyemind

Messages through sequence 42 are already committed. New observations retain
their sample, batch and sensor identifiers. For the same sample and batch,
the calibrated logger has higher priority than the handheld.

The rules detect conflicting classifications, set aside readings with a
higher-priority alternative, and quarantine a batch when selected evidence
exceeds the limit.

---

## What eyemind concludes

```js
selected_reading('logger_a', 'batch_a', 94)
quarantine('batch_a', 'logger_a')
notify('north_depot', 'batch_a')
notify('station_shop', 'batch_a')
```

Temperatures are integer tenths of a degree. Batch B's selected reading is
7.5°C; its older 12°C observation is outside the uncommitted tail.

---

## A task that has an identity

The rule also concludes `inspection_task(Batch, Evidence, Task)`. Its last
variable is not bound by the premise, so eyemind creates a Skolem witness
specific to this batch and evidence. Repeating the same firing names the
same task.

---

## What the proof establishes

The checker verifies the threshold comparisons and the task witness (C8).
Verdict: **checked_with_obligations**, because selected readings depend on
the absence of higher-priority evidence.

The supplied priorities express an evidence policy; they do not establish
sensor calibration in the real world. Equal priorities can leave multiple
readings selected. The program reports actions without executing them.

---

## Try it

```sh
eyemind examples/cold-chain-recall.js
```

Advance the checkpoint to 44. Only the batch B reading remains in the new
tail, so this run derives no quarantine or inspection task. It does not
reconstruct decisions from earlier runs.
