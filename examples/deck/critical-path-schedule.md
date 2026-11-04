# Which tasks determine the launch date?

*Follow the longest prerequisite chain, including ties.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/critical-path-schedule.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/critical-path-schedule.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/critical-path-schedule.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/critical-path-schedule.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=critical-path-schedule)

---

## The question

A launch has eleven tasks. Some can run together; others must wait for several
predecessors. When can launch finish, and which tasks determine that time?

Time units are arbitrary. The dependency graph is acyclic, and the model
assumes enough people and equipment to run independent tasks together.

---

## What we tell eyemind

```js
fact(task('backend', 6, ['api_design', 'database']))
fact(task('integration', 4, ['backend', 'frontend', 'auth']))
```

A task starts at the maximum finish time of its listed prerequisites.
Its finish is that start plus its duration. A backward list fold computes
the maximum; forward rules trace every predecessor that attains it.

---

## What eyemind concludes

```js
schedule('integration', 15, 19)
schedule('launch', 22, 23)
project_finish(23)
```

The seven critical tasks are requirements, architecture, database, backend,
integration, security review and launch. Their durations sum to 23.

---

## Why frontend is not critical here

Frontend finishes at time 9, while backend finishes at 15. Integration must
wait for backend. A small frontend delay therefore leaves the launch date
unchanged, provided frontend still finishes by 15.

---

## What the proof establishes

Verdict: **checked**, with no trusted absence or collection. The checker
recomputes the additions and maxima over the explicit prerequisite lists.

This establishes the supplied precedence schedule. Shared staffing limits,
calendar dates and uncertainty in durations are outside this model.

---

## Try it

```sh
eyemind examples/critical-path-schedule.js
```

Change frontend's duration from 5 to 11. It then finishes at 15, tying backend.
Both branches become critical, and the program reports nine critical tasks
while the finish time remains 23.
