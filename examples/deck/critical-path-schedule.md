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

`eyemind --proof` writes down how it reached each answer. The whole proof
has 78 steps; see the [full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/critical-path-schedule.js).
Here are its claims, all its clauses, and the complete chain of 24 steps
behind `schedule('backend', 9, 15)`, which also proves the schedules of the
four tasks before it:

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

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(task('requirements', 2, [])))
clause(2, fact(task('architecture', 3, ['requirements'])))
clause(3, fact(task('api_design', 2, ['requirements'])))
clause(4, fact(task('database', 4, ['architecture'])))
clause(5, fact(task('backend', 6, ['api_design', 'database'])))
clause(6, fact(task('frontend', 5, ['api_design'])))
clause(7, fact(task('auth', 3, ['architecture'])))
clause(8, fact(task('integration', 4, ['backend', 'frontend', 'auth'])))
clause(9, fact(task('security_review', 3, ['integration'])))
clause(10, fact(task('load_test', 2, ['integration'])))
clause(11, fact(task('launch', 1, ['security_review', 'load_test'])))
clause(12, fact(project_end('launch')))
clause(13, fact(member(X, [X, ..._0])))
clause(14, implied_by(member(X, [_0, ...Rest]), member(X, Rest)))
clause(15, fact(latest_finish([], 0)))
clause(16, implied_by(latest_finish([Task, ...Rest], Latest), [schedule(Task, _0, Finish), latest_finish(Rest, Remaining), is(Latest, max(Finish, Remaining))]))
clause(17, implied_by(schedule(Task, Start, Finish), [task(Task, Duration, Parents), latest_finish(Parents, Start), is(Finish, add(Start, Duration))]))
clause(18, implied_by(critical_predecessor(Task, Parent), [task(Task, _0, Parents), member(Parent, Parents), schedule(Parent, _1, Finish), schedule(Task, Finish, _2)]))
clause(19, implies([project_end(Task), schedule(Task, _0, Finish)], project_finish(Finish)))
clause(20, implies(project_end(Task), critical_task(Task)))
clause(21, implies([critical_task(Task), critical_predecessor(Task, Parent)], critical_task(Parent)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(schedule('requirements', 0, 2), clause(17), {Task: 'requirements', Start: 0, Finish: 2, Duration: 2, Parents: []}, [task('requirements', 2, []), latest_finish([], 0), is(2, add(0, 2))])
step(task('requirements', 2, []), clause(1), {}, [])
step(latest_finish([], 0), clause(15), {}, [])
step(is(2, add(0, 2)), 'builtin', {}, [])
step(schedule('architecture', 2, 5), clause(17), {Task: 'architecture', Start: 2, Finish: 5, Duration: 3, Parents: ['requirements']}, [task('architecture', 3, ['requirements']), latest_finish(['requirements'], 2), is(5, add(2, 3))])
step(task('architecture', 3, ['requirements']), clause(2), {}, [])
step(latest_finish(['requirements'], 2), clause(16), {Task: 'requirements', Rest: [], Latest: 2, _0: 0, Finish: 2, Remaining: 0}, [schedule('requirements', 0, 2), latest_finish([], 0), is(2, max(2, 0))])
step(is(2, max(2, 0)), 'builtin', {}, [])
step(is(5, add(2, 3)), 'builtin', {}, [])
step(schedule('api_design', 2, 4), clause(17), {Task: 'api_design', Start: 2, Finish: 4, Duration: 2, Parents: ['requirements']}, [task('api_design', 2, ['requirements']), latest_finish(['requirements'], 2), is(4, add(2, 2))])
step(task('api_design', 2, ['requirements']), clause(3), {}, [])
step(is(4, add(2, 2)), 'builtin', {}, [])
step(schedule('database', 5, 9), clause(17), {Task: 'database', Start: 5, Finish: 9, Duration: 4, Parents: ['architecture']}, [task('database', 4, ['architecture']), latest_finish(['architecture'], 5), is(9, add(5, 4))])
step(task('database', 4, ['architecture']), clause(4), {}, [])
step(latest_finish(['architecture'], 5), clause(16), {Task: 'architecture', Rest: [], Latest: 5, _0: 2, Finish: 5, Remaining: 0}, [schedule('architecture', 2, 5), latest_finish([], 0), is(5, max(5, 0))])
step(is(5, max(5, 0)), 'builtin', {}, [])
step(is(9, add(5, 4)), 'builtin', {}, [])
step(schedule('backend', 9, 15), clause(17), {Task: 'backend', Start: 9, Finish: 15, Duration: 6, Parents: ['api_design', 'database']}, [task('backend', 6, ['api_design', 'database']), latest_finish(['api_design', 'database'], 9), is(15, add(9, 6))])
step(task('backend', 6, ['api_design', 'database']), clause(5), {}, [])
step(latest_finish(['api_design', 'database'], 9), clause(16), {Task: 'api_design', Rest: ['database'], Latest: 9, _0: 2, Finish: 4, Remaining: 9}, [schedule('api_design', 2, 4), latest_finish(['database'], 9), is(9, max(4, 9))])
step(latest_finish(['database'], 9), clause(16), {Task: 'database', Rest: [], Latest: 9, _0: 5, Finish: 9, Remaining: 0}, [schedule('database', 5, 9), latest_finish([], 0), is(9, max(9, 0))])
step(is(9, max(9, 0)), 'builtin', {}, [])
step(is(9, max(4, 9)), 'builtin', {}, [])
step(is(15, add(9, 6)), 'builtin', {}, [])
// … 54 more steps, 78 in total, schedule the remaining tasks, prove the
// finish time, and trace the critical tasks back from the launch.
```

It has three parts:

- **The claims**: the 19 answers.
- **The clauses**: every line of the program, numbered 1 to 21 in order. The
  `_` marks are shown as `_0`, `_1` and `_2`, so they can be given values
  like any other variable.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable of the cited line stood for. `clause(N)`
  means "by line N of the program"; `'builtin'` means a calculation that the
  checker redoes itself rather than trusting.

The 24 steps say:

1. *Requirements runs from 0 to 2* — by rule 17: it takes 2 (fact 1), it has
   no prerequisites so it starts at 0 (fact 15), and 0 + 2 = 2.
2. *Requirements takes 2 and needs nothing* — fact 1.
3. *The latest finish of no tasks is 0* — fact 15.
4. *0 + 2 = 2* — builtin.
5. *Architecture runs from 2 to 5* — by rule 17: it waits for requirements.
6. *Architecture takes 3 and needs requirements* — fact 2.
7. *The latest finish of `['requirements']` is 2* — by rule 16: requirements
   finishes at 2, nothing else is in the list, and the larger of 2 and 0 is
   2.
8. *max(2, 0) = 2* — builtin.
9. *2 + 3 = 5* — builtin.
10. *API design runs from 2 to 4* — by rule 17, also waiting for
    requirements (step 7, reused).
11. *API design takes 2 and needs requirements* — fact 3.
12. *2 + 2 = 4* — builtin.
13. *Database runs from 5 to 9* — by rule 17: it waits for architecture.
14. *Database takes 4 and needs architecture* — fact 4.
15. *The latest finish of `['architecture']` is 5* — by rule 16.
16. *max(5, 0) = 5* — builtin.
17. *5 + 4 = 9* — builtin.
18. *Backend runs from 9 to 15* — by rule 17: it waits for API design and
    database.
19. *Backend takes 6 and needs API design and database* — fact 5.
20. *The latest finish of `['api_design', 'database']` is 9* — by rule 16:
    API design finishes at 4, the rest of the list at 9, and the larger is 9.
21. *The latest finish of `['database']` is 9* — by rule 16.
22. *max(9, 0) = 9* — builtin.
23. *max(4, 9) = 9* — builtin.
24. *9 + 6 = 15* — builtin.

The remaining steps work the same way. The critical tasks are traced
backward with rules 20, 21 and 18: the launch is critical (it is the project
end); the security review is a critical predecessor of the launch, because it
is in the launch's list (fact 13) and finishes at 22, exactly when the launch
starts; and so on, back to requirements.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
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

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 56)
condition('C2', 'well_founded', 'ok', 78)
condition('C3', 'justification', 'ok', 78)
condition('C4', 'coverage', 'ok', 125)
condition('C5', 're_decision', 'ok', 22)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 97)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(78)
verified(56)
recomputed(22)
composed(0)
trusted(0)
claims(19)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (56)**: the 56 steps that cite a program line really are
  instances of that line with the values shown.
- **C2 well-founded (78)**: none of the 78 steps depends on itself, even
  indirectly.
- **C3 justification (78)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (125)**: the 19 claims and the 106 things the steps use are
  each backed by a step.
- **C5 re-decision (22)**: the checker redid the 22 calculations (11
  additions and 11 maxima over the prerequisite lists) and got the same
  results.
- **C6 boundary consistency (0)**: nothing was concluded from the absence of
  a fact, so there is nothing to confront.
- **C7 relevance (97)**: the 19 claims answer the queries, and all 78 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics: 78 steps, 56 verified against the program, 22 recomputed,
none taken on trust, 19 claims. The verdict is **checked**: the schedule,
the finish time and the seven critical tasks follow from the program. As the
last comment says, this confirms the claims; it does not say the program has
no other conclusions. It also establishes only the supplied precedence
schedule: shared staffing limits, calendar dates and uncertainty in durations
are outside this model.

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
Showing that chain step by step tells you which tasks to watch, and which
ones have room to slip.
