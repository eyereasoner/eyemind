# Which tasks determine the launch date?

*Follow the longest prerequisite chain, including ties.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/critical-path-schedule.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/critical-path-schedule.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/critical-path-schedule.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/critical-path-schedule.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=critical-path-schedule)

---

## The question

A software launch has eleven tasks. Each takes a known time, and some must
wait until others are finished: the backend, for example, needs both the API
design and the database. Tasks that do not wait on each other can run at the
same time; the model assumes enough people and equipment for that. Time units
are arbitrary, and no task waits on itself, directly or through others.

The *critical path* is the chain of tasks where any delay would delay the
launch.

**When can the launch finish, and which tasks determine that time?**

---

## What we tell eyemind: the tasks

```js
fact(task('requirements', 2, []))
fact(task('architecture', 3, ['requirements']))
fact(task('api_design', 2, ['requirements']))
fact(task('database', 4, ['architecture']))
fact(task('backend', 6, ['api_design', 'database']))
fact(task('frontend', 5, ['api_design']))
fact(task('auth', 3, ['architecture']))
fact(task('integration', 4, ['backend', 'frontend', 'auth']))
fact(task('security_review', 3, ['integration']))
fact(task('load_test', 2, ['integration']))
fact(task('launch', 1, ['security_review', 'load_test']))
fact(project_end('launch'))
```

Each `task` fact gives a name, a duration, and the list of tasks that must
finish first (its *prerequisites*). The launch is the last task.

---

## What we tell eyemind: the rules

```js
// member(X, List): X is an element of List.
fact(member(X, [X, ..._]))
implied_by(member(X, [_, ...Rest]), member(X, Rest))
// latest_finish(Tasks, Latest): the latest finish among Tasks, 0 for none.
fact(latest_finish([], 0))
implied_by(latest_finish([Task, ...Rest], Latest),
  [schedule(Task, _, Finish), latest_finish(Rest, Remaining), is(Latest, max(Finish, Remaining))])
// A task starts when its prerequisites have all finished.
implied_by(schedule(Task, Start, Finish),
  [task(Task, Duration, Parents), latest_finish(Parents, Start), is(Finish, add(Start, Duration))])
// A critical predecessor of a task finishes exactly when that task starts.
implied_by(critical_predecessor(Task, Parent),
  [task(Task, _, Parents), member(Parent, Parents), schedule(Parent, _, Finish), schedule(Task, Finish, _)])

implies([project_end(Task), schedule(Task, _, Finish)], project_finish(Finish))
// The last task is critical, and so is every critical predecessor of a
// critical task.
implies(project_end(Task), critical_task(Task))
implies([critical_task(Task), critical_predecessor(Task, Parent)], critical_task(Parent))
query(schedule(Task, Start, Finish))
query(project_finish(Finish))
query(critical_task(Task))
```

- Capitalized names such as `Task` and `Finish` are variables, placeholders
  for any value; `_` means "anything, we don't care what". `[Task, ...Rest]`
  is a list whose first item is `Task`, followed by the items `Rest`.
- `implied_by(conclusion, premise)` is a backward rule, used on demand. A
  premise in square brackets needs all its parts.
- `schedule(Task, Start, Finish)`: a task starts at the latest finish of its
  prerequisites, and finishes its duration later. `latest_finish` walks the
  list of prerequisites, keeping the largest finish time (0 for none).
  `max` and `add` are **built-in calculations**, worked out by `is`.
- A *critical predecessor* of a task is a prerequisite that finishes exactly
  when the task starts: delay it, and the task is delayed too.
- `implies(premise, conclusion)` is a forward rule: whenever the premise
  holds, conclude the conclusion. The project finishes when the launch
  does. The launch is critical, and every critical predecessor of a critical
  task is critical too, ties included.
- The three `query` lines ask for every schedule, the finish time and every
  critical task.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
schedule('requirements', 0, 2)
schedule('architecture', 2, 5)
schedule('api_design', 2, 4)
schedule('database', 5, 9)
schedule('backend', 9, 15)
schedule('frontend', 4, 9)
schedule('auth', 5, 8)
schedule('integration', 15, 19)
schedule('security_review', 19, 22)
schedule('load_test', 19, 21)
schedule('launch', 22, 23)
project_finish(23)
critical_task('launch')
critical_task('security_review')
critical_task('integration')
critical_task('backend')
critical_task('database')
critical_task('architecture')
critical_task('requirements')
```

| task | start | finish | critical |
|---|---|---|---|
| requirements | 0 | 2 | yes |
| architecture | 2 | 5 | yes |
| api_design | 2 | 4 | |
| database | 5 | 9 | yes |
| backend | 9 | 15 | yes |
| frontend | 4 | 9 | |
| auth | 5 | 8 | |
| integration | 15 | 19 | yes |
| security_review | 19 | 22 | yes |
| load_test | 19 | 21 | |
| launch | 22 | 23 | yes |

The launch finishes at time **23**. The seven critical tasks are
requirements, architecture, database, backend, integration, security review
and launch; their durations, 2 + 3 + 4 + 6 + 4 + 3 + 1, sum to 23.

---

## Why frontend is not critical here

Frontend finishes at time 9, while backend finishes at 15. Integration must
wait for backend. A small frontend delay therefore leaves the launch date
unchanged, provided frontend still finishes by 15. The same holds for auth
(finishing at 8) and load testing (21, while the security review finishes at
22).

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The whole proof is
99 lines: the 19 claims, 8 steps, 2 listings and 64 call tables; see the
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/critical-path-schedule.js).
Here are its steps and listings, and the call tables behind
`schedule('backend', 9, 15)` and behind integration's critical predecessor:

```js
// … the 19 claims

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(project_finish(23), clause(19), {Task: 'launch', _0: 22, Finish: 23}, [project_end('launch'), schedule('launch', 22, 23)])
step(critical_task('launch'), clause(20), {Task: 'launch'}, [project_end('launch')])
step(critical_task('security_review'), clause(21), {Task: 'launch', Parent: 'security_review'}, [critical_task('launch'), critical_predecessor('launch', 'security_review')])
step(critical_task('integration'), clause(21), {Task: 'security_review', Parent: 'integration'}, [critical_task('security_review'), critical_predecessor('security_review', 'integration')])
step(critical_task('backend'), clause(21), {Task: 'integration', Parent: 'backend'}, [critical_task('integration'), critical_predecessor('integration', 'backend')])
step(critical_task('database'), clause(21), {Task: 'backend', Parent: 'database'}, [critical_task('backend'), critical_predecessor('backend', 'database')])
step(critical_task('architecture'), clause(21), {Task: 'database', Parent: 'architecture'}, [critical_task('database'), critical_predecessor('database', 'architecture')])
step(critical_task('requirements'), clause(21), {Task: 'architecture', Parent: 'requirements'}, [critical_task('architecture'), critical_predecessor('architecture', 'requirements')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(project_finish(A), [project_finish(23)])
derived(critical_task(A), [critical_task('launch'), critical_task('security_review'), critical_task('integration'), critical_task('backend'), critical_task('database'), critical_task('architecture'), critical_task('requirements')])
// … the table of every schedule, and those of requirements and architecture
called(latest_finish(['api_design', 'database'], D), [latest_finish(['api_design', 'database'], 9)])
called(schedule('api_design', _8, J), [schedule('api_design', 2, 4)])
called(latest_finish(['database'], K), [latest_finish(['database'], 9)])
called(schedule('database', _11, M), [schedule('database', 5, 9)])
called(latest_finish(['api_design'], D), [latest_finish(['api_design'], 4)])
// … the tables for the later tasks and the critical tasks before integration
called(critical_predecessor('integration', G1), [critical_predecessor('integration', 'backend')])
called(member(N1, ['backend', 'frontend', 'auth']), [member('backend', ['backend', 'frontend', 'auth']), member('frontend', ['backend', 'frontend', 'auth']), member('auth', ['backend', 'frontend', 'auth'])])
called(member(O1, ['frontend', 'auth']), [member('frontend', ['frontend', 'auth']), member('auth', ['frontend', 'auth'])])
called(member(P1, ['auth']), [member('auth', ['auth'])])
called(schedule('integration', 15, _42), [schedule('integration', 15, 19)])
called(latest_finish(['backend', 'frontend', 'auth'], 15), [latest_finish(['backend', 'frontend', 'auth'], 15)])
called(schedule('integration', 9, _42), [])
called(latest_finish(['backend', 'frontend', 'auth'], 9), [])
called(schedule('integration', 8, _42), [])
called(latest_finish(['backend', 'frontend', 'auth'], 8), [])
// … the tables for the critical predecessors of backend, database, architecture and requirements
```

It has three parts:

- **The claims**: the 19 answers.
- **The steps**: one per fact a forward rule derived, here the finish time
  and the seven critical tasks. A step reads
  `step(what, by which rule, with which values, using what)`; `clause(N)`
  means "by line N of the program", and the values in curly braces say what
  each variable of that line stood for.
- **The certificate**: the `derived(Pattern, Facts)` **listings** give every
  fact the forward rules derived, and the `called(Call, Answers)` **call
  tables** give every answer of each call made while answering the queries.
  The schedules come from backward rules, worked out on demand, so they
  appear only in call tables.

The steps say:

1. *The project finishes at 23* — by rule 19: the launch is the project end
   and runs from 22 to 23.
2. *The launch is critical* — by rule 20: it is the project end.
3. –8. *Security review, integration, backend, database, architecture and
   requirements are critical* — each by rule 21, because the task before it
   in this list is critical and it is that task's critical predecessor.

The call tables behind backend's schedule say: *the latest finish of
`['api_design', 'database']` is 9*; *API design runs from 2 to 4*; *the latest finish of `['database']` is 9*; *database runs from 5 to 9*;
*the latest finish of `['api_design']` is 4*. Rule 16 takes the larger of
the finish times, so backend waits until 9, and rule 17 adds its duration 6
to finish at 15.

The tables behind integration's critical predecessor say: integration has
three prerequisites, backend, frontend and auth (the `member` tables);
integration starts at 15, when backend finishes, so
`schedule('integration', 15, _42)` has an answer; but it does not start at
9, when frontend finishes, nor at 8, when auth does, so those tables are
empty. Only backend is a critical predecessor of integration.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it follows the
certificate. It answers the three queries one level at a time from the call
tables, and checks each table the same way, redoing the 11 additions and 11
maxima itself, so a wrong start or finish time shows up as a disagreement. It
requires the listing of critical tasks to be closed: rule 21, run over the
listed tasks, finds no critical predecessor that is not listed, and
requirements has none at all. It replays each step's rule from no bindings.
The claims must be exactly the answers, and a step, table or listing the
check does not use fails it. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
schedule('requirements', 0, 2)
schedule('architecture', 2, 5)
schedule('api_design', 2, 4)
schedule('database', 5, 9)
schedule('backend', 9, 15)
schedule('frontend', 4, 9)
schedule('auth', 5, 8)
schedule('integration', 15, 19)
schedule('security_review', 19, 22)
schedule('load_test', 19, 21)
schedule('launch', 22, 23)
project_finish(23)
critical_task('launch')
critical_task('security_review')
critical_task('integration')
critical_task('backend')
critical_task('database')
critical_task('architecture')
critical_task('requirements')

verdict('checked')
```

The verdict is **checked**: the schedule, the finish time and the seven
critical tasks follow from the program, and they are every answer of the
original questions. It establishes only the supplied precedence schedule:
shared staffing limits, calendar dates and uncertainty in durations are
outside this model.

---

## Try it

```sh
eyemind examples/critical-path-schedule.js
eyemind --proof examples/critical-path-schedule.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=critical-path-schedule).
Change frontend's duration from 5 to 11. It then finishes at 15, tying backend.
Both branches become critical, and the program reports nine critical tasks
while the finish time remains 23: frontend and API design join the seven. Make
it 12 instead, and frontend alone sets the pace: the finish moves to 24, and
backend, database and architecture are no longer critical.

---

## Takeaway

A deadline is set by the longest chain of tasks that wait on each other.
Showing that chain, and checking it, tells you which tasks to watch, and which
ones have room to slip.
