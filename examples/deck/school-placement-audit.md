# A school can look close on a map

*Audit a provisional choice using walking routes and preferences.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/school-placement-audit.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/school-placement-audit.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/school-placement-audit.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/school-placement-audit.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=school-placement-audit)

---

## The question

Four children, Ada, Bjorn, Clara and Davi, each have a few schools they could
attend. For every school we know three things: how far away it is in a
straight line on the map, how far the child would actually have to walk, and
where the family ranked it (1 is their first choice).

The provisional placement simply picks the school that is **nearest on the
map**, using the family's ranking only to break a tie. But a school can be
close as the crow flies and still be a long walk away, behind a river or a
motorway.

An audit looks at the walk instead. Walks over 2500 m do not count at all.
Among the rest, each school gets a score:

**walking metres + 600 × (preference rank − 1)**

so each step down the family's list costs as much as 600 m of extra walking.
The lowest score is recommended; schools that tie for lowest are all
recommended. A placement is flagged when its walk is over the limit, or when
the audit recommends a different school.

**Which placements survive the audit, and which are flagged?**

The figures are illustrative, and schools have unlimited places: each child's
options are judged alone, rather than seats being shared out.

---

## What we tell eyemind

The essential part of the program (the full file has nine candidate facts):

```js
fact(max_walking_meters(2500), preference_penalty_meters(600))
// candidate(Student, School, StraightMeters, WalkingMeters, PreferenceRank)
fact(candidate('ada', 'centrum', 600, 3600, 2))
fact(candidate('ada', 'lindholmen', 1200, 1800, 1))
fact(candidate('ada', 'haga', 1800, 2200, 3))
// … six more candidates for Bjorn, Clara and Davi

// The map choice: no other school is nearer, or equally near and preferred.
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

// Flags, and the hidden detour: the walk beyond the map distance.
implies([
  provisional(Student, School), candidate(Student, School, _, Walking, _), max_walking_meters(Limit), gt(Walking, Limit),
], audit_flag(Student, 'walking_limit_exceeded'))
implies([provisional(Student, School), recommended(Student, _, _), not(recommended(Student, School, _))],
  audit_flag(Student, 'assignment_differs'))
implies([provisional(Student, School), candidate(Student, School, Straight, Walking, _), is(Detour, sub(Walking, Straight))],
  hidden_detour(Student, Detour))
query(provisional(Student, School))
// … and three more queries: recommended, audit_flag and hidden_detour
```

`fact(...)` states something as true. `implies(conditions, conclusion)` is a
rule: when all the conditions in the list hold, the conclusion holds too.
Capitalized names such as `Student` and `Walking` are variables: placeholders
that each use of the rule fills in. A lone `_` means "some value, I don't
care which".

Three features carry this example:

- **Comparisons and arithmetic.** `lt` (less than), `le` (at most) and `gt`
  (greater than) compare numbers; `is(Score, add(...))` computes a number with
  `add`, `mul` (multiply) and `sub` (subtract).
- **"Best" as "nothing better".** A school is the map choice when *no*
  better map option exists: `not(better_map_option(...))`. `not(...)` holds
  when eyemind cannot find what is inside it. eyemind first works out every
  `better_map_option` completely, and only then asks what is missing; it orders
  the rules so that a question about absence is only asked once the answer can
  no longer change.
- **Ties are kept.** Because "best" means "nothing strictly better", two
  schools with the same lowest score are both recommended.

`query(...)` says which conclusions to print.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
provisional('ada', 'centrum')
provisional('bjorn', 'centrum')
provisional('clara', 'haga')
provisional('davi', 'centrum')
recommended('ada', 'lindholmen', 1800)
recommended('bjorn', 'backa', 2600)
recommended('clara', 'haga', 800)
recommended('davi', 'haga', 1600)
hidden_detour('ada', 3000)
hidden_detour('bjorn', 2000)
hidden_detour('clara', 150)
hidden_detour('davi', 1800)
audit_flag('ada', 'walking_limit_exceeded')
audit_flag('bjorn', 'walking_limit_exceeded')
audit_flag('davi', 'walking_limit_exceeded')
audit_flag('ada', 'assignment_differs')
audit_flag('bjorn', 'assignment_differs')
audit_flag('davi', 'assignment_differs')
```

| Child | Provisional | Recommended | Audited score |
| --- | --- | --- | ---: |
| Ada | Centrum | Lindholmen | 1800 |
| Bjorn | Centrum | Backa | 2600 |
| Clara | Haga | Haga | 800 |
| Davi | Centrum | Haga | 1600 |

Ada, Bjorn and Davi each receive both audit flags. Clara receives neither.

Three of the four children were placed at Centrum because it is nearest on
the map, yet each would walk more than 2500 m to get there, and the audit
recommends another school. Bjorn's 2600 is a score, not a walk: his walk to
Backa is 2000 m, within the limit, plus 600 because Backa is his second
choice.

The hidden detours show why the map misled: Ada's Centrum is 600 m away in a
straight line but 3600 m on foot, a detour of 3000 m. Clara's Haga adds only
150 m.

---

## How eyemind justifies "nothing better"

A conclusion like `provisional('ada', 'centrum')` rests on
`not(better_map_option('ada', 'centrum'))`: no nearer school was found. A
proof cannot point at a fact that shows something is missing. So the proof
records such a step as **`'absent'`**: "this was concluded because a search
found nothing".

The checker never re-runs that search: it never reasons by itself. Instead
the proof ends with a **search certificate** that writes the search down:

- `derived(Pattern, Facts)` lists every fact the forward rules derived for
  one relation, such as every `better_map_option` there is. Each listed
  fact has steps of its own.
- `searched(Call, Answers)` records one search and every answer it gave;
  `searched(better_map_option('ada', 'centrum'), [])` says no better map
  option for Ada's Centrum was found.

The checker verifies each `searched` line by expanding its call one level
against the program, as a search would, and answering every inner call
from that call's own line or from the `derived` listings, so no line
vouches for itself. It accepts a `derived` listing because each listed fact
has its own steps and, given the listings, no rule derives a fact they
leave out. An absence that passes is **settled**: checked, not taken on
trust. It also confronts each absence with the evidence the proof itself
contains: if some step had established `better_map_option('ada',
'centrum')`, the proof would be rejected.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
provisional('ada', 'centrum')
provisional('bjorn', 'centrum')
provisional('clara', 'haga')
provisional('davi', 'centrum')
recommended('ada', 'lindholmen', 1800)
recommended('bjorn', 'backa', 2600)
recommended('clara', 'haga', 800)
recommended('davi', 'haga', 1600)
hidden_detour('ada', 3000)
hidden_detour('bjorn', 2000)
hidden_detour('clara', 150)
hidden_detour('davi', 1800)
audit_flag('ada', 'walking_limit_exceeded')
audit_flag('bjorn', 'walking_limit_exceeded')
audit_flag('davi', 'walking_limit_exceeded')
audit_flag('ada', 'assignment_differs')
audit_flag('bjorn', 'assignment_differs')
audit_flag('davi', 'assignment_differs')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(max_walking_meters(2500)))
clause(2, fact(preference_penalty_meters(600)))
clause(3, fact(candidate('ada', 'centrum', 600, 3600, 2)))
clause(4, fact(candidate('ada', 'lindholmen', 1200, 1800, 1)))
clause(5, fact(candidate('ada', 'haga', 1800, 2200, 3)))
clause(6, fact(candidate('bjorn', 'centrum', 1100, 3100, 1)))
clause(7, fact(candidate('bjorn', 'backa', 1400, 2000, 2)))
clause(8, fact(candidate('clara', 'haga', 650, 800, 1)))
clause(9, fact(candidate('clara', 'centrum', 900, 1400, 2)))
clause(10, fact(candidate('davi', 'centrum', 1000, 2800, 2)))
clause(11, fact(candidate('davi', 'haga', 1300, 1600, 1)))
clause(12, implies([candidate(Student, School, Straight, _0, _1), candidate(Student, _2, Other, _3, _4), lt(Other, Straight)], better_map_option(Student, School)))
clause(14, implies([candidate(Student, School, _0, _1, _2), not(better_map_option(Student, School))], provisional(Student, School)))
clause(15, implies([candidate(Student, School, _0, Walking, Rank), max_walking_meters(Limit), le(Walking, Limit), preference_penalty_meters(Penalty), is(Score, add(Walking, mul(Penalty, sub(Rank, 1))))], route_score(Student, School, Score)))
clause(16, implies([route_score(Student, School, Score), route_score(Student, _0, Other), lt(Other, Score)], better_route_option(Student, School)))
clause(17, implies([route_score(Student, School, Score), not(better_route_option(Student, School))], recommended(Student, School, Score)))
clause(18, implies([provisional(Student, School), candidate(Student, School, _0, Walking, _1), max_walking_meters(Limit), gt(Walking, Limit)], audit_flag(Student, 'walking_limit_exceeded')))
clause(19, implies([provisional(Student, School), recommended(Student, _0, _1), not(recommended(Student, School, _2))], audit_flag(Student, 'assignment_differs')))
clause(20, implies([provisional(Student, School), candidate(Student, School, Straight, Walking, _0), is(Detour, sub(Walking, Straight))], hidden_detour(Student, Detour)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(provisional('ada', 'centrum'), clause(14), {Student: 'ada', School: 'centrum', _0: 600, _1: 3600, _2: 2}, [candidate('ada', 'centrum', 600, 3600, 2), not(better_map_option('ada', 'centrum'))])
step(candidate('ada', 'centrum', 600, 3600, 2), clause(3), {}, [])
step(not(better_map_option('ada', 'centrum')), 'absent', {}, [])
step(provisional('bjorn', 'centrum'), clause(14), {Student: 'bjorn', School: 'centrum', _0: 1100, _1: 3100, _2: 1}, [candidate('bjorn', 'centrum', 1100, 3100, 1), not(better_map_option('bjorn', 'centrum'))])
step(candidate('bjorn', 'centrum', 1100, 3100, 1), clause(6), {}, [])
step(not(better_map_option('bjorn', 'centrum')), 'absent', {}, [])
step(provisional('clara', 'haga'), clause(14), {Student: 'clara', School: 'haga', _0: 650, _1: 800, _2: 1}, [candidate('clara', 'haga', 650, 800, 1), not(better_map_option('clara', 'haga'))])
step(candidate('clara', 'haga', 650, 800, 1), clause(8), {}, [])
step(not(better_map_option('clara', 'haga')), 'absent', {}, [])
step(provisional('davi', 'centrum'), clause(14), {Student: 'davi', School: 'centrum', _0: 1000, _1: 2800, _2: 2}, [candidate('davi', 'centrum', 1000, 2800, 2), not(better_map_option('davi', 'centrum'))])
step(candidate('davi', 'centrum', 1000, 2800, 2), clause(10), {}, [])
step(not(better_map_option('davi', 'centrum')), 'absent', {}, [])
step(recommended('ada', 'lindholmen', 1800), clause(17), {Student: 'ada', School: 'lindholmen', Score: 1800}, [route_score('ada', 'lindholmen', 1800), not(better_route_option('ada', 'lindholmen'))])
step(route_score('ada', 'lindholmen', 1800), clause(15), {Student: 'ada', School: 'lindholmen', _0: 1200, Walking: 1800, Rank: 1, Limit: 2500, Penalty: 600, Score: 1800}, [candidate('ada', 'lindholmen', 1200, 1800, 1), max_walking_meters(2500), le(1800, 2500), preference_penalty_meters(600), is(1800, add(1800, mul(600, sub(1, 1))))])
step(candidate('ada', 'lindholmen', 1200, 1800, 1), clause(4), {}, [])
step(max_walking_meters(2500), clause(1), {}, [])
step(le(1800, 2500), 'builtin', {}, [])
step(preference_penalty_meters(600), clause(2), {}, [])
step(is(1800, add(1800, mul(600, sub(1, 1)))), 'builtin', {}, [])
step(not(better_route_option('ada', 'lindholmen')), 'absent', {}, [])
step(recommended('bjorn', 'backa', 2600), clause(17), {Student: 'bjorn', School: 'backa', Score: 2600}, [route_score('bjorn', 'backa', 2600), not(better_route_option('bjorn', 'backa'))])
step(route_score('bjorn', 'backa', 2600), clause(15), {Student: 'bjorn', School: 'backa', _0: 1400, Walking: 2000, Rank: 2, Limit: 2500, Penalty: 600, Score: 2600}, [candidate('bjorn', 'backa', 1400, 2000, 2), max_walking_meters(2500), le(2000, 2500), preference_penalty_meters(600), is(2600, add(2000, mul(600, sub(2, 1))))])
step(candidate('bjorn', 'backa', 1400, 2000, 2), clause(7), {}, [])
step(le(2000, 2500), 'builtin', {}, [])
step(is(2600, add(2000, mul(600, sub(2, 1)))), 'builtin', {}, [])
step(not(better_route_option('bjorn', 'backa')), 'absent', {}, [])
step(recommended('clara', 'haga', 800), clause(17), {Student: 'clara', School: 'haga', Score: 800}, [route_score('clara', 'haga', 800), not(better_route_option('clara', 'haga'))])
step(route_score('clara', 'haga', 800), clause(15), {Student: 'clara', School: 'haga', _0: 650, Walking: 800, Rank: 1, Limit: 2500, Penalty: 600, Score: 800}, [candidate('clara', 'haga', 650, 800, 1), max_walking_meters(2500), le(800, 2500), preference_penalty_meters(600), is(800, add(800, mul(600, sub(1, 1))))])
step(le(800, 2500), 'builtin', {}, [])
step(is(800, add(800, mul(600, sub(1, 1)))), 'builtin', {}, [])
step(not(better_route_option('clara', 'haga')), 'absent', {}, [])
step(recommended('davi', 'haga', 1600), clause(17), {Student: 'davi', School: 'haga', Score: 1600}, [route_score('davi', 'haga', 1600), not(better_route_option('davi', 'haga'))])
step(route_score('davi', 'haga', 1600), clause(15), {Student: 'davi', School: 'haga', _0: 1300, Walking: 1600, Rank: 1, Limit: 2500, Penalty: 600, Score: 1600}, [candidate('davi', 'haga', 1300, 1600, 1), max_walking_meters(2500), le(1600, 2500), preference_penalty_meters(600), is(1600, add(1600, mul(600, sub(1, 1))))])
step(candidate('davi', 'haga', 1300, 1600, 1), clause(11), {}, [])
step(le(1600, 2500), 'builtin', {}, [])
step(is(1600, add(1600, mul(600, sub(1, 1)))), 'builtin', {}, [])
step(not(better_route_option('davi', 'haga')), 'absent', {}, [])
step(hidden_detour('ada', 3000), clause(20), {Student: 'ada', School: 'centrum', Straight: 600, Walking: 3600, _0: 2, Detour: 3000}, [provisional('ada', 'centrum'), candidate('ada', 'centrum', 600, 3600, 2), is(3000, sub(3600, 600))])
step(is(3000, sub(3600, 600)), 'builtin', {}, [])
step(hidden_detour('bjorn', 2000), clause(20), {Student: 'bjorn', School: 'centrum', Straight: 1100, Walking: 3100, _0: 1, Detour: 2000}, [provisional('bjorn', 'centrum'), candidate('bjorn', 'centrum', 1100, 3100, 1), is(2000, sub(3100, 1100))])
step(is(2000, sub(3100, 1100)), 'builtin', {}, [])
step(hidden_detour('clara', 150), clause(20), {Student: 'clara', School: 'haga', Straight: 650, Walking: 800, _0: 1, Detour: 150}, [provisional('clara', 'haga'), candidate('clara', 'haga', 650, 800, 1), is(150, sub(800, 650))])
step(is(150, sub(800, 650)), 'builtin', {}, [])
step(hidden_detour('davi', 1800), clause(20), {Student: 'davi', School: 'centrum', Straight: 1000, Walking: 2800, _0: 2, Detour: 1800}, [provisional('davi', 'centrum'), candidate('davi', 'centrum', 1000, 2800, 2), is(1800, sub(2800, 1000))])
step(is(1800, sub(2800, 1000)), 'builtin', {}, [])
step(audit_flag('ada', 'walking_limit_exceeded'), clause(18), {Student: 'ada', School: 'centrum', _0: 600, Walking: 3600, _1: 2, Limit: 2500}, [provisional('ada', 'centrum'), candidate('ada', 'centrum', 600, 3600, 2), max_walking_meters(2500), gt(3600, 2500)])
step(gt(3600, 2500), 'builtin', {}, [])
step(audit_flag('bjorn', 'walking_limit_exceeded'), clause(18), {Student: 'bjorn', School: 'centrum', _0: 1100, Walking: 3100, _1: 1, Limit: 2500}, [provisional('bjorn', 'centrum'), candidate('bjorn', 'centrum', 1100, 3100, 1), max_walking_meters(2500), gt(3100, 2500)])
step(gt(3100, 2500), 'builtin', {}, [])
step(audit_flag('davi', 'walking_limit_exceeded'), clause(18), {Student: 'davi', School: 'centrum', _0: 1000, Walking: 2800, _1: 2, Limit: 2500}, [provisional('davi', 'centrum'), candidate('davi', 'centrum', 1000, 2800, 2), max_walking_meters(2500), gt(2800, 2500)])
step(gt(2800, 2500), 'builtin', {}, [])
step(audit_flag('ada', 'assignment_differs'), clause(19), {Student: 'ada', School: 'centrum', _0: 'lindholmen', _1: 1800, _2: A}, [provisional('ada', 'centrum'), recommended('ada', 'lindholmen', 1800), not(recommended('ada', 'centrum', A))])
step(not(recommended('ada', 'centrum', A)), 'absent', {}, [])
step(audit_flag('bjorn', 'assignment_differs'), clause(19), {Student: 'bjorn', School: 'centrum', _0: 'backa', _1: 2600, _2: A}, [provisional('bjorn', 'centrum'), recommended('bjorn', 'backa', 2600), not(recommended('bjorn', 'centrum', A))])
step(not(recommended('bjorn', 'centrum', A)), 'absent', {}, [])
step(audit_flag('davi', 'assignment_differs'), clause(19), {Student: 'davi', School: 'centrum', _0: 'haga', _1: 1600, _2: A}, [provisional('davi', 'centrum'), recommended('davi', 'haga', 1600), not(recommended('davi', 'centrum', A))])
step(not(recommended('davi', 'centrum', A)), 'absent', {}, [])
step(better_map_option('ada', 'lindholmen'), clause(12), {Student: 'ada', School: 'lindholmen', Straight: 1200, _0: 1800, _1: 1, _2: 'centrum', Other: 600, _3: 3600, _4: 2}, [candidate('ada', 'lindholmen', 1200, 1800, 1), candidate('ada', 'centrum', 600, 3600, 2), lt(600, 1200)])
step(lt(600, 1200), 'builtin', {}, [])
step(better_map_option('ada', 'haga'), clause(12), {Student: 'ada', School: 'haga', Straight: 1800, _0: 2200, _1: 3, _2: 'centrum', Other: 600, _3: 3600, _4: 2}, [candidate('ada', 'haga', 1800, 2200, 3), candidate('ada', 'centrum', 600, 3600, 2), lt(600, 1800)])
step(candidate('ada', 'haga', 1800, 2200, 3), clause(5), {}, [])
step(lt(600, 1800), 'builtin', {}, [])
step(better_map_option('bjorn', 'backa'), clause(12), {Student: 'bjorn', School: 'backa', Straight: 1400, _0: 2000, _1: 2, _2: 'centrum', Other: 1100, _3: 3100, _4: 1}, [candidate('bjorn', 'backa', 1400, 2000, 2), candidate('bjorn', 'centrum', 1100, 3100, 1), lt(1100, 1400)])
step(lt(1100, 1400), 'builtin', {}, [])
step(better_map_option('clara', 'centrum'), clause(12), {Student: 'clara', School: 'centrum', Straight: 900, _0: 1400, _1: 2, _2: 'haga', Other: 650, _3: 800, _4: 1}, [candidate('clara', 'centrum', 900, 1400, 2), candidate('clara', 'haga', 650, 800, 1), lt(650, 900)])
step(candidate('clara', 'centrum', 900, 1400, 2), clause(9), {}, [])
step(lt(650, 900), 'builtin', {}, [])
step(better_map_option('davi', 'haga'), clause(12), {Student: 'davi', School: 'haga', Straight: 1300, _0: 1600, _1: 1, _2: 'centrum', Other: 1000, _3: 2800, _4: 2}, [candidate('davi', 'haga', 1300, 1600, 1), candidate('davi', 'centrum', 1000, 2800, 2), lt(1000, 1300)])
step(lt(1000, 1300), 'builtin', {}, [])
step(better_route_option('ada', 'haga'), clause(16), {Student: 'ada', School: 'haga', Score: 3400, _0: 'lindholmen', Other: 1800}, [route_score('ada', 'haga', 3400), route_score('ada', 'lindholmen', 1800), lt(1800, 3400)])
step(route_score('ada', 'haga', 3400), clause(15), {Student: 'ada', School: 'haga', _0: 1800, Walking: 2200, Rank: 3, Limit: 2500, Penalty: 600, Score: 3400}, [candidate('ada', 'haga', 1800, 2200, 3), max_walking_meters(2500), le(2200, 2500), preference_penalty_meters(600), is(3400, add(2200, mul(600, sub(3, 1))))])
step(le(2200, 2500), 'builtin', {}, [])
step(is(3400, add(2200, mul(600, sub(3, 1)))), 'builtin', {}, [])
step(lt(1800, 3400), 'builtin', {}, [])
step(better_route_option('clara', 'centrum'), clause(16), {Student: 'clara', School: 'centrum', Score: 2000, _0: 'haga', Other: 800}, [route_score('clara', 'centrum', 2000), route_score('clara', 'haga', 800), lt(800, 2000)])
step(route_score('clara', 'centrum', 2000), clause(15), {Student: 'clara', School: 'centrum', _0: 900, Walking: 1400, Rank: 2, Limit: 2500, Penalty: 600, Score: 2000}, [candidate('clara', 'centrum', 900, 1400, 2), max_walking_meters(2500), le(1400, 2500), preference_penalty_meters(600), is(2000, add(1400, mul(600, sub(2, 1))))])
step(le(1400, 2500), 'builtin', {}, [])
step(is(2000, add(1400, mul(600, sub(2, 1)))), 'builtin', {}, [])
step(lt(800, 2000), 'builtin', {}, [])

// Search certificate: every fact derived for each relation the searches behind
// negations and collections consult, and every answer of each call they made, in order.
derived(better_map_option(B, C), [better_map_option('ada', 'lindholmen'), better_map_option('ada', 'haga'), better_map_option('bjorn', 'backa'), better_map_option('clara', 'centrum'), better_map_option('davi', 'haga')])
derived(better_route_option(B, C), [better_route_option('ada', 'haga'), better_route_option('clara', 'centrum')])
derived(route_score(B, C, D), [route_score('ada', 'lindholmen', 1800), route_score('ada', 'haga', 3400), route_score('bjorn', 'backa', 2600), route_score('clara', 'haga', 800), route_score('clara', 'centrum', 2000), route_score('davi', 'haga', 1600)])
derived(recommended(B, C, D), [recommended('ada', 'lindholmen', 1800), recommended('bjorn', 'backa', 2600), recommended('clara', 'haga', 800), recommended('davi', 'haga', 1600)])
searched(better_map_option('ada', 'centrum'), [])
searched(better_map_option('bjorn', 'centrum'), [])
searched(better_map_option('clara', 'haga'), [])
searched(better_map_option('davi', 'centrum'), [])
searched(better_route_option('ada', 'lindholmen'), [])
searched(route_score(E, F, G), [route_score('ada', 'lindholmen', 1800), route_score('ada', 'haga', 3400), route_score('bjorn', 'backa', 2600), route_score('clara', 'haga', 800), route_score('clara', 'centrum', 2000), route_score('davi', 'haga', 1600)])
searched(route_score('ada', H, I), [route_score('ada', 'lindholmen', 1800), route_score('ada', 'haga', 3400)])
searched(route_score('bjorn', H, I), [route_score('bjorn', 'backa', 2600)])
searched(route_score('clara', H, I), [route_score('clara', 'haga', 800), route_score('clara', 'centrum', 2000)])
searched(route_score('davi', H, I), [route_score('davi', 'haga', 1600)])
searched(better_route_option('bjorn', 'backa'), [])
searched(better_route_option('clara', 'haga'), [])
searched(better_route_option('davi', 'haga'), [])
searched(recommended('ada', 'centrum', J), [])
searched(better_route_option('ada', 'haga'), [better_route_option('ada', 'haga')])
searched(better_route_option('clara', 'centrum'), [better_route_option('clara', 'centrum')])
searched(recommended('bjorn', 'centrum', K), [])
searched(recommended('davi', 'centrum', L), [])
```

It has four parts:

- **The claims**: the 18 conclusions the proof is about.
- **The clauses**: the program facts and rules the steps cite, numbered by
  their position in the program. Numbers are missing where a clause is never
  cited: the second `better_map_option` rule (13), for example, derives
  nothing here, so no step uses it. In the displays the program's lone `_` placeholders are given
  distinct names `_0`, `_1`, `_2`, so each can be shown with its value.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`.
- **The search certificate**: the facts and searches behind the 11 absences,
  explained in the previous card.

Four kinds of justification occur:

- `clause(N)`: an instance of program clause N, with the values in `{...}`.
  A fact cites itself and uses nothing.
- `'builtin'`: a comparison or calculation, such as `le(1800, 2500)` or
  `is(2600, add(2000, mul(600, sub(2, 1))))`. The checker recomputes it.
- `'absent'`: something concluded because a search found nothing, explained
  in the previous card. In the last three steps, `A` stands for "any score":
  no recommendation for that child at Centrum exists with any score at all.

Read Ada's steps as sentences:

1. *Ada is provisionally placed at Centrum* — by rule 14, because Centrum is
   one of her candidates (600 m on the map, 3600 m on foot, rank 2) and no
   better map option was found.
2. *Centrum is Ada's candidate* — fact 3.
3. *No school beats Centrum on the map for Ada* — absent: nothing nearer
   (Lindholmen is 1200 m, Haga 1800 m) and nothing equally near.
4. *The audit recommends Lindholmen for Ada, score 1800* — by rule 17,
   because Lindholmen's route score is 1800 and nothing scores lower.
5. *Lindholmen's route score is 1800* — by rule 15: it is her candidate
   (fact 4), the walking limit is 2500 (fact 1), 1800 ≤ 2500 (recomputed),
   the penalty is 600 (fact 2), and 1800 + 600 × (1 − 1) = 1800
   (recomputed).
6. *No school beats Lindholmen on route score* — absent. Centrum is not even
   walkable (3600 m), and Haga scores 2200 + 600 × 2 = 3400.
7. *Ada's hidden detour is 3000 m* — by rule 20, from her placement at
   Centrum and 3600 − 600 = 3000.
8. *Ada's placement exceeds the walking limit* — by rule 18: she is placed at
   Centrum, walks 3600 m there, and 3600 > 2500.
9. *Ada's placement differs from the audit* — by rule 19: she is placed at
   Centrum, Lindholmen is recommended, and no recommendation for Centrum
   exists with any score (absent).

Bjorn, Clara and Davi follow the same pattern. Clara has no flag steps
because no rule produces a flag for her: her walk to Haga is 800 m, and Haga
is also her recommendation. Facts used again later (the walking limit, the
penalty, a candidate already shown) are established once and reused.

The last 22 steps answer no question. They prove the facts the certificate
lists: the five better map options (Centrum beats Lindholmen and Haga for
Ada, for example), the two better route options, and the route scores they
need, such as Haga's 3400 for Ada. With those in hand, the certificate's
`searched` lines show that nothing beats the placed and recommended schools:
`better_map_option` for Ada holds for Lindholmen and Haga, but not for
Centrum.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
provisional('ada', 'centrum')
provisional('bjorn', 'centrum')
provisional('clara', 'haga')
provisional('davi', 'centrum')
recommended('ada', 'lindholmen', 1800)
recommended('bjorn', 'backa', 2600)
recommended('clara', 'haga', 800)
recommended('davi', 'haga', 1600)
hidden_detour('ada', 3000)
hidden_detour('bjorn', 2000)
hidden_detour('clara', 150)
hidden_detour('davi', 1800)
audit_flag('ada', 'walking_limit_exceeded')
audit_flag('bjorn', 'walking_limit_exceeded')
audit_flag('davi', 'walking_limit_exceeded')
audit_flag('ada', 'assignment_differs')
audit_flag('bjorn', 'assignment_differs')
audit_flag('davi', 'assignment_differs')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 42)
condition('C2', 'well_founded', 'ok', 79)
condition('C3', 'justification', 'ok', 79)
condition('C4', 'coverage', 'ok', 118)
condition('C5', 're_decision', 'ok', 26)
condition('C6', 'boundary_consistency', 'ok', 11)
condition('C7', 'relevance', 'ok', 97)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(79)
verified(42)
recomputed(26)
composed(0)
trusted(0)
claims(18)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (42)**: the 42 steps that cite a clause really are
  instances of it with the values shown. For example, the route score step
  for Bjorn is rule 15 with `Walking` = 2000 and `Rank` = 2.
- **C2 well-founded (79)**: none of the 79 steps depends on itself, even
  indirectly.
- **C3 justification (79)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (118)**: the 18 claims and the 100 things the steps use are
  each backed by a step: nothing is taken for granted silently.
- **C5 re-decision (26)**: the 26 comparisons and calculations were
  recomputed and agree: the 15 behind the answers (four `le`, four score
  sums, four detours, three `gt`) and 11 more behind the certificate's
  facts.
- **C6 boundary consistency (11)**: all 11 absences were confronted with the
  evidence in the proof, and none is contradicted: the proof shows better
  map and route options, but none for a placed or recommended school, and
  no recommendation of Centrum to Ada, Bjorn or Davi. The search
  certificate settles all 11.
- **C7 relevance (97)**: the 18 claims each answer one of the program's
  queries, and all 79 steps serve a claim.
- **C8 witness integrity (0)**: no rule invents a new, unnamed thing, so
  there is no invented name to verify.

The statistics: 79 steps, of which 42 were verified against the program, 26
recomputed and 11 settled by the certificate; none was composed from parts
and none trusted; 18 claims.

The 11 settled absences are, in plain words: *for each placed school no
better map option exists*, *for each recommended school no better route
option exists*, and *Ada, Bjorn and Davi have no recommendation at
Centrum*. Each is meant relative to this program: the absence is true if
the program's rules cannot produce the missing conclusion.

The verdict is **checked**: every claim follows from the program. The
checker did not re-search for the absences; it verified the written record
of the search. As the last comment says, the
verdict also does not establish completeness: it does not say these are all
the conclusions the program has.

This policy is illustrative. There are no school-capacity limits, sibling
priorities or shared-seat allocation; each child's options are evaluated
independently.

---

## Try it

```sh
eyemind examples/school-placement-audit.js
```

Change Ada's Centrum route to 1800 m and preference rank 1. It ties
Lindholmen at a score of 1800, so both schools are recommended, Ada's
Centrum placement is among them, and Ada receives no audit flag.

Raise the walking limit from 2500 to 4000 m. The three
`walking_limit_exceeded` flags disappear, but the recommendations stay the
same: Ada's Centrum would now be allowed but scores 3600 + 600 = 4200, far
worse than Lindholmen, so the three `assignment_differs` flags remain.

---

## Takeaway

A choice that looks right on a map can be wrong on foot. Checking each
placement against walking distance and family preference shows exactly which
families the first choice let down, and why.
