// A software launch has eleven tasks with durations and prerequisites.
// The earliest completion is time 23; seven tasks lie on its critical chain.
// Backward list folds calculate the latest prerequisite finish, while forward
// rules trace every predecessor attaining it, including ties. Durations use
// arbitrary time units; the finite dependency graph is acyclic and resources
// are unlimited. This is a precedence schedule, with no staffing constraints.

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

fact(member(X, [X, ..._]))
implied_by(member(X, [_, ...Rest]), member(X, Rest))
fact(latest_finish([], 0))
implied_by(latest_finish([Task, ...Rest], Latest),
  [schedule(Task, _, Finish), latest_finish(Rest, Remaining), is(Latest, max(Finish, Remaining))])
implied_by(schedule(Task, Start, Finish),
  [task(Task, Duration, Parents), latest_finish(Parents, Start), is(Finish, add(Start, Duration))])
implied_by(critical_predecessor(Task, Parent),
  [task(Task, _, Parents), member(Parent, Parents), schedule(Parent, _, Finish), schedule(Task, Finish, _)])

implies([project_end(Task), schedule(Task, _, Finish)], project_finish(Finish))
implies(project_end(Task), critical_task(Task))
implies([critical_task(Task), critical_predecessor(Task, Parent)], critical_task(Parent))
query(schedule(Task, Start, Finish))
query(project_finish(Finish))
query(critical_task(Task))
