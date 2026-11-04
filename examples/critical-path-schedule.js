// Scheduling a software launch: eleven tasks, each with a duration and the
// tasks that must finish before it can start. With unlimited staff, every task
// starts as soon as its last prerequisite finishes, so the launch is done at
// time 23. Seven tasks form the critical path: the chain of tasks where any
// delay would delay the launch.
//
// Backward rules walk each list of prerequisites to find its latest finish;
// forward rules then trace back from the launch through every prerequisite
// that finishes exactly then, including ties. Durations are in arbitrary time
// units, and no task depends on itself, directly or through others.

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
