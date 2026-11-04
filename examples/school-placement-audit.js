// Checking school placements against the walk children actually face. Each
// child has candidate schools, each with a straight-line map distance, a
// walking distance and the family's preference rank (1 is the first choice).
// The provisional placement is the school nearest on the map, with ties broken
// by preference. The audit instead recommends the school with the best route
// score, the walking distance plus 600 m for each step down the family's
// preference list, among schools within the 2500 m walking limit.
//
// Ada, Bjorn and Davi are flagged: each was placed at centrum, more than
// 2500 m away on foot, and the audit recommends another school. Clara's
// placement at haga agrees with the audit. The output also gives each
// placement's hidden detour, walking minus map distance. The figures are
// illustrative, and schools have unlimited places: each child's options are
// judged alone, rather than seats being shared out between children.
//
// It shows choosing the best option with stratified negation: an option is
// best when no better one is found, so options that tie for best are all kept.

fact(max_walking_meters(2500), preference_penalty_meters(600))
// candidate(Student, School, StraightMeters, WalkingMeters, PreferenceRank)
fact(candidate('ada', 'centrum', 600, 3600, 2))
fact(candidate('ada', 'lindholmen', 1200, 1800, 1))
fact(candidate('ada', 'haga', 1800, 2200, 3))
fact(candidate('bjorn', 'centrum', 1100, 3100, 1))
fact(candidate('bjorn', 'backa', 1400, 2000, 2))
fact(candidate('clara', 'haga', 650, 800, 1))
fact(candidate('clara', 'centrum', 900, 1400, 2))
fact(candidate('davi', 'centrum', 1000, 2800, 2))
fact(candidate('davi', 'haga', 1300, 1600, 1))

// The map choice: no other school is nearer on the map, or equally near and
// higher on the family's list.
implies([candidate(Student, School, Straight, _, _), candidate(Student, _, Other, _, _), lt(Other, Straight)],
  better_map_option(Student, School))
implies([candidate(Student, School, Straight, _, Rank), candidate(Student, _, Straight, _, OtherRank), lt(OtherRank, Rank)],
  better_map_option(Student, School))
implies([candidate(Student, School, _, _, _), not(better_map_option(Student, School))], provisional(Student, School))

// The audit's choice: the lowest route score among walkable schools.
implies([
  candidate(Student, School, _, Walking, Rank), max_walking_meters(Limit), le(Walking, Limit),
  preference_penalty_meters(Penalty), is(Score, add(Walking, mul(Penalty, sub(Rank, 1)))),
], route_score(Student, School, Score))
implies([route_score(Student, School, Score), route_score(Student, _, Other), lt(Other, Score)],
  better_route_option(Student, School))
implies([route_score(Student, School, Score), not(better_route_option(Student, School))], recommended(Student, School, Score))

// A placement is flagged when its walk exceeds the limit or the audit
// recommends a different school; its hidden detour is the walk beyond the
// map distance.
implies([
  provisional(Student, School), candidate(Student, School, _, Walking, _), max_walking_meters(Limit), gt(Walking, Limit),
], audit_flag(Student, 'walking_limit_exceeded'))
implies([provisional(Student, School), recommended(Student, _, _), not(recommended(Student, School, _))],
  audit_flag(Student, 'assignment_differs'))
implies([provisional(Student, School), candidate(Student, School, Straight, Walking, _), is(Detour, sub(Walking, Straight))],
  hidden_detour(Student, Detour))
query(provisional(Student, School))
query(recommended(Student, School, Score))
query(audit_flag(Student, Reason))
query(hidden_detour(Student, Meters))
