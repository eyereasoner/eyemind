# The critical path of a house build in Logical English

*Earliest and latest starts through a maximum and a minimum, slack, and the tasks that cannot slip.*

[critical-path-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/critical-path-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/critical-path-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/critical-path-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/critical-path-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=critical-path-le)

---

## The question

A house is built in seven tasks: foundation, framing, roofing, plumbing,
electrics, drywall and painting. Each takes a number of days, and some come
after others. When can each task start at the earliest, when is the house
finished, how many days can each task slip without delaying it, and which tasks
are critical?

---

## What we tell eyemind

The forward pass is two rules: a task that comes after no other starts on day 0,
and any other starts on `the max of each F such that the task comes after a
previous task and the previous task can finish on day F`. A task finishes its
duration later, and the house when its last task does.

The backward pass mirrors it: a task that no other comes after must finish by
the day the house is finished, and any other by `the min of each X such that a
next task comes after the task and the next task must start by day X`. The
slack is the latest start minus the earliest, and a task with none is
critical. Both passes recurse through an aggregate, which eyemind unfolds into
levels.

---

## What eyemind concludes

```text
% query finish with scenario house
the house is finished on day 31.

% query starts with scenario house
foundation can start on day 0.
framing can start on day 5.
roofing can start on day 15.
plumbing can start on day 15.
electrics can start on day 15.
drywall can start on day 21.
painting can start on day 28.

% query slack with scenario house
foundation has 0 days of slack.
framing has 0 days of slack.
roofing has 9 days of slack.
plumbing has 0 days of slack.
electrics has 1 days of slack.
drywall has 0 days of slack.
painting has 0 days of slack.

% query critical with scenario house
foundation is critical.
framing is critical.
plumbing is critical.
drywall is critical.
painting is critical.
```

Drywall waits for plumbing, the longer of the two tasks after framing it comes
after, so plumbing is critical and the electrics can slip a day. Roofing only
has to be done before painting starts on day 28.

```js
struct('le:answer', 'finish', 'house', 31)
struct('le:answer', 'critical', 'house', 'plumbing')
```

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. Each start and
each deadline rests on the complete table of the tasks before or after it, so
no predecessor is overlooked:

```text
electrics has 1 days of slack
    because electrics can start on day 15
        because electrics comes after framing
        and 15 is the max of each F such that electrics comes after a previous task and the previous task can finish on day F, namely 15
    and electrics must start by day 16
        because electrics must finish by day 21
            because drywall comes after electrics
            and 21 is the min of each X such that a next task comes after electrics and the next task must start by day X, namely 21
        and electrics takes 5 days
        and 16 = 21 - 5
    and 1 = 16 - 15.
```

---

## Try it

```sh
node bin/eyemind.js examples/critical-path-le.le
node bin/eyemind.js --program examples/critical-path-le.le > /tmp/critical-path-le.js
node bin/eyemind.js --proof examples/critical-path-le.le
node bin/eyemind.js --check-proof examples/proof/critical-path-le.js examples/critical-path-le.le
node bin/eyemind.js --explain examples/critical-path-le.le
```

Let plumbing take 8 days instead of 6 and the house is finished on day 33, the
electrics have 3 days of slack, and the output reports the changed answers as
not expected.
