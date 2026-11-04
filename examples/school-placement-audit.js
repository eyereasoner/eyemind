// A school-placement audit compares map distance with actual walking routes
// and family preferences. Ada, Bjorn and Davi are flagged; Clara's placement
// agrees with the audit. Forward rules compute scores and use stratified
// negation to retain all tied minima. Distances, the 2500 m walking limit and
// the 600 m preference penalty are illustrative. Schools have unlimited places;
// this evaluates each child's options, rather than allocating shared seats.

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

implies([candidate(Student, School, Straight, _, _), candidate(Student, _, Other, _, _), lt(Other, Straight)],
  better_map_option(Student, School))
implies([candidate(Student, School, Straight, _, Rank), candidate(Student, _, Straight, _, OtherRank), lt(OtherRank, Rank)],
  better_map_option(Student, School))
implies([candidate(Student, School, _, _, _), not(better_map_option(Student, School))], provisional(Student, School))

implies([
  candidate(Student, School, _, Walking, Rank), max_walking_meters(Limit), le(Walking, Limit),
  preference_penalty_meters(Penalty), is(Score, add(Walking, mul(Penalty, sub(Rank, 1)))),
], route_score(Student, School, Score))
implies([route_score(Student, School, Score), route_score(Student, _, Other), lt(Other, Score)],
  better_route_option(Student, School))
implies([route_score(Student, School, Score), not(better_route_option(Student, School))], recommended(Student, School, Score))

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
