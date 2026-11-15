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
writes the search down instead, in its **certificate**:

- `derived(Pattern, Facts)` is a **listing**: every fact the forward rules
  derived for one relation, such as every `better_map_option` there is.
  Each listed fact has a step of its own.
- `called(Call, Answers)` is a **call table**: one call and every answer it
  has. `called(better_map_option('ada', 'centrum'), [])` says no better map
  option for Ada's Centrum exists.

The checker never re-runs the reasoner: it never reasons by itself. It
verifies each table by expanding its call one level against the program,
as a search would, answering every inner call from its own table or from
the listings, so no table vouches for itself. It accepts a listing only
when it is **closed**, when no rule, applied to the listed facts, derives
a fact the listing leaves out, and when each listed fact replays its
recorded firing. A negation is then decided from the table of its call: if
the listings held `better_map_option('ada', 'centrum')`, its table could not
be empty, and the proof would be rejected.

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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(provisional('ada', 'centrum'), clause(14), {Student: 'ada', School: 'centrum', _0: 600, _1: 3600, _2: 2}, [candidate('ada', 'centrum', 600, 3600, 2), not(better_map_option('ada', 'centrum'))])
step(provisional('bjorn', 'centrum'), clause(14), {Student: 'bjorn', School: 'centrum', _0: 1100, _1: 3100, _2: 1}, [candidate('bjorn', 'centrum', 1100, 3100, 1), not(better_map_option('bjorn', 'centrum'))])
step(provisional('clara', 'haga'), clause(14), {Student: 'clara', School: 'haga', _0: 650, _1: 800, _2: 1}, [candidate('clara', 'haga', 650, 800, 1), not(better_map_option('clara', 'haga'))])
step(provisional('davi', 'centrum'), clause(14), {Student: 'davi', School: 'centrum', _0: 1000, _1: 2800, _2: 2}, [candidate('davi', 'centrum', 1000, 2800, 2), not(better_map_option('davi', 'centrum'))])
step(better_map_option('ada', 'lindholmen'), clause(12), {Student: 'ada', School: 'lindholmen', Straight: 1200, _0: 1800, _1: 1, _2: 'centrum', Other: 600, _3: 3600, _4: 2}, [candidate('ada', 'lindholmen', 1200, 1800, 1), candidate('ada', 'centrum', 600, 3600, 2), lt(600, 1200)])
step(better_map_option('ada', 'haga'), clause(12), {Student: 'ada', School: 'haga', Straight: 1800, _0: 2200, _1: 3, _2: 'centrum', Other: 600, _3: 3600, _4: 2}, [candidate('ada', 'haga', 1800, 2200, 3), candidate('ada', 'centrum', 600, 3600, 2), lt(600, 1800)])
step(better_map_option('bjorn', 'backa'), clause(12), {Student: 'bjorn', School: 'backa', Straight: 1400, _0: 2000, _1: 2, _2: 'centrum', Other: 1100, _3: 3100, _4: 1}, [candidate('bjorn', 'backa', 1400, 2000, 2), candidate('bjorn', 'centrum', 1100, 3100, 1), lt(1100, 1400)])
step(better_map_option('clara', 'centrum'), clause(12), {Student: 'clara', School: 'centrum', Straight: 900, _0: 1400, _1: 2, _2: 'haga', Other: 650, _3: 800, _4: 1}, [candidate('clara', 'centrum', 900, 1400, 2), candidate('clara', 'haga', 650, 800, 1), lt(650, 900)])
step(better_map_option('davi', 'haga'), clause(12), {Student: 'davi', School: 'haga', Straight: 1300, _0: 1600, _1: 1, _2: 'centrum', Other: 1000, _3: 2800, _4: 2}, [candidate('davi', 'haga', 1300, 1600, 1), candidate('davi', 'centrum', 1000, 2800, 2), lt(1000, 1300)])
step(recommended('ada', 'lindholmen', 1800), clause(17), {Student: 'ada', School: 'lindholmen', Score: 1800}, [route_score('ada', 'lindholmen', 1800), not(better_route_option('ada', 'lindholmen'))])
step(route_score('ada', 'lindholmen', 1800), clause(15), {Student: 'ada', School: 'lindholmen', _0: 1200, Walking: 1800, Rank: 1, Limit: 2500, Penalty: 600, Score: 1800}, [candidate('ada', 'lindholmen', 1200, 1800, 1), max_walking_meters(2500), le(1800, 2500), preference_penalty_meters(600), is(1800, add(1800, mul(600, sub(1, 1))))])
step(recommended('bjorn', 'backa', 2600), clause(17), {Student: 'bjorn', School: 'backa', Score: 2600}, [route_score('bjorn', 'backa', 2600), not(better_route_option('bjorn', 'backa'))])
step(route_score('bjorn', 'backa', 2600), clause(15), {Student: 'bjorn', School: 'backa', _0: 1400, Walking: 2000, Rank: 2, Limit: 2500, Penalty: 600, Score: 2600}, [candidate('bjorn', 'backa', 1400, 2000, 2), max_walking_meters(2500), le(2000, 2500), preference_penalty_meters(600), is(2600, add(2000, mul(600, sub(2, 1))))])
step(recommended('clara', 'haga', 800), clause(17), {Student: 'clara', School: 'haga', Score: 800}, [route_score('clara', 'haga', 800), not(better_route_option('clara', 'haga'))])
step(route_score('clara', 'haga', 800), clause(15), {Student: 'clara', School: 'haga', _0: 650, Walking: 800, Rank: 1, Limit: 2500, Penalty: 600, Score: 800}, [candidate('clara', 'haga', 650, 800, 1), max_walking_meters(2500), le(800, 2500), preference_penalty_meters(600), is(800, add(800, mul(600, sub(1, 1))))])
step(recommended('davi', 'haga', 1600), clause(17), {Student: 'davi', School: 'haga', Score: 1600}, [route_score('davi', 'haga', 1600), not(better_route_option('davi', 'haga'))])
step(route_score('davi', 'haga', 1600), clause(15), {Student: 'davi', School: 'haga', _0: 1300, Walking: 1600, Rank: 1, Limit: 2500, Penalty: 600, Score: 1600}, [candidate('davi', 'haga', 1300, 1600, 1), max_walking_meters(2500), le(1600, 2500), preference_penalty_meters(600), is(1600, add(1600, mul(600, sub(1, 1))))])
step(route_score('ada', 'haga', 3400), clause(15), {Student: 'ada', School: 'haga', _0: 1800, Walking: 2200, Rank: 3, Limit: 2500, Penalty: 600, Score: 3400}, [candidate('ada', 'haga', 1800, 2200, 3), max_walking_meters(2500), le(2200, 2500), preference_penalty_meters(600), is(3400, add(2200, mul(600, sub(3, 1))))])
step(route_score('clara', 'centrum', 2000), clause(15), {Student: 'clara', School: 'centrum', _0: 900, Walking: 1400, Rank: 2, Limit: 2500, Penalty: 600, Score: 2000}, [candidate('clara', 'centrum', 900, 1400, 2), max_walking_meters(2500), le(1400, 2500), preference_penalty_meters(600), is(2000, add(1400, mul(600, sub(2, 1))))])
step(better_route_option('ada', 'haga'), clause(16), {Student: 'ada', School: 'haga', Score: 3400, _0: 'lindholmen', Other: 1800}, [route_score('ada', 'haga', 3400), route_score('ada', 'lindholmen', 1800), lt(1800, 3400)])
step(better_route_option('clara', 'centrum'), clause(16), {Student: 'clara', School: 'centrum', Score: 2000, _0: 'haga', Other: 800}, [route_score('clara', 'centrum', 2000), route_score('clara', 'haga', 800), lt(800, 2000)])
step(audit_flag('ada', 'walking_limit_exceeded'), clause(18), {Student: 'ada', School: 'centrum', _0: 600, Walking: 3600, _1: 2, Limit: 2500}, [provisional('ada', 'centrum'), candidate('ada', 'centrum', 600, 3600, 2), max_walking_meters(2500), gt(3600, 2500)])
step(audit_flag('bjorn', 'walking_limit_exceeded'), clause(18), {Student: 'bjorn', School: 'centrum', _0: 1100, Walking: 3100, _1: 1, Limit: 2500}, [provisional('bjorn', 'centrum'), candidate('bjorn', 'centrum', 1100, 3100, 1), max_walking_meters(2500), gt(3100, 2500)])
step(audit_flag('davi', 'walking_limit_exceeded'), clause(18), {Student: 'davi', School: 'centrum', _0: 1000, Walking: 2800, _1: 2, Limit: 2500}, [provisional('davi', 'centrum'), candidate('davi', 'centrum', 1000, 2800, 2), max_walking_meters(2500), gt(2800, 2500)])
step(audit_flag('ada', 'assignment_differs'), clause(19), {Student: 'ada', School: 'centrum', _0: 'lindholmen', _1: 1800, _2: A}, [provisional('ada', 'centrum'), recommended('ada', 'lindholmen', 1800), not(recommended('ada', 'centrum', A))])
step(audit_flag('bjorn', 'assignment_differs'), clause(19), {Student: 'bjorn', School: 'centrum', _0: 'backa', _1: 2600, _2: A}, [provisional('bjorn', 'centrum'), recommended('bjorn', 'backa', 2600), not(recommended('bjorn', 'centrum', A))])
step(audit_flag('davi', 'assignment_differs'), clause(19), {Student: 'davi', School: 'centrum', _0: 'haga', _1: 1600, _2: A}, [provisional('davi', 'centrum'), recommended('davi', 'haga', 1600), not(recommended('davi', 'centrum', A))])
step(hidden_detour('ada', 3000), clause(20), {Student: 'ada', School: 'centrum', Straight: 600, Walking: 3600, _0: 2, Detour: 3000}, [provisional('ada', 'centrum'), candidate('ada', 'centrum', 600, 3600, 2), is(3000, sub(3600, 600))])
step(hidden_detour('bjorn', 2000), clause(20), {Student: 'bjorn', School: 'centrum', Straight: 1100, Walking: 3100, _0: 1, Detour: 2000}, [provisional('bjorn', 'centrum'), candidate('bjorn', 'centrum', 1100, 3100, 1), is(2000, sub(3100, 1100))])
step(hidden_detour('clara', 150), clause(20), {Student: 'clara', School: 'haga', Straight: 650, Walking: 800, _0: 1, Detour: 150}, [provisional('clara', 'haga'), candidate('clara', 'haga', 650, 800, 1), is(150, sub(800, 650))])
step(hidden_detour('davi', 1800), clause(20), {Student: 'davi', School: 'centrum', Straight: 1000, Walking: 2800, _0: 2, Detour: 1800}, [provisional('davi', 'centrum'), candidate('davi', 'centrum', 1000, 2800, 2), is(1800, sub(2800, 1000))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(provisional(B, C), [provisional('ada', 'centrum'), provisional('bjorn', 'centrum'), provisional('clara', 'haga'), provisional('davi', 'centrum')])
derived(better_map_option(B, C), [better_map_option('ada', 'lindholmen'), better_map_option('ada', 'haga'), better_map_option('bjorn', 'backa'), better_map_option('clara', 'centrum'), better_map_option('davi', 'haga')])
derived(recommended(B, C, D), [recommended('ada', 'lindholmen', 1800), recommended('bjorn', 'backa', 2600), recommended('clara', 'haga', 800), recommended('davi', 'haga', 1600)])
derived(route_score(B, C, D), [route_score('ada', 'lindholmen', 1800), route_score('ada', 'haga', 3400), route_score('bjorn', 'backa', 2600), route_score('clara', 'haga', 800), route_score('clara', 'centrum', 2000), route_score('davi', 'haga', 1600)])
derived(better_route_option(B, C), [better_route_option('ada', 'haga'), better_route_option('clara', 'centrum')])
derived(audit_flag(B, C), [audit_flag('ada', 'walking_limit_exceeded'), audit_flag('bjorn', 'walking_limit_exceeded'), audit_flag('davi', 'walking_limit_exceeded'), audit_flag('ada', 'assignment_differs'), audit_flag('bjorn', 'assignment_differs'), audit_flag('davi', 'assignment_differs')])
derived(hidden_detour(B, C), [hidden_detour('ada', 3000), hidden_detour('bjorn', 2000), hidden_detour('clara', 150), hidden_detour('davi', 1800)])
called(provisional(A, B), [provisional('ada', 'centrum'), provisional('bjorn', 'centrum'), provisional('clara', 'haga'), provisional('davi', 'centrum')])
called(better_map_option('ada', 'centrum'), [])
called(better_map_option('ada', 'lindholmen'), [better_map_option('ada', 'lindholmen')])
called(better_map_option('ada', 'haga'), [better_map_option('ada', 'haga')])
called(better_map_option('bjorn', 'centrum'), [])
called(better_map_option('bjorn', 'backa'), [better_map_option('bjorn', 'backa')])
called(better_map_option('clara', 'haga'), [])
called(better_map_option('clara', 'centrum'), [better_map_option('clara', 'centrum')])
called(better_map_option('davi', 'centrum'), [])
called(better_map_option('davi', 'haga'), [better_map_option('davi', 'haga')])
called(recommended(C, D, E), [recommended('ada', 'lindholmen', 1800), recommended('bjorn', 'backa', 2600), recommended('clara', 'haga', 800), recommended('davi', 'haga', 1600)])
called(route_score(F, G, H), [route_score('ada', 'lindholmen', 1800), route_score('ada', 'haga', 3400), route_score('bjorn', 'backa', 2600), route_score('clara', 'haga', 800), route_score('clara', 'centrum', 2000), route_score('davi', 'haga', 1600)])
called(better_route_option('ada', 'lindholmen'), [])
called(better_route_option('ada', 'haga'), [better_route_option('ada', 'haga')])
called(better_route_option('bjorn', 'backa'), [])
called(better_route_option('clara', 'haga'), [])
called(better_route_option('clara', 'centrum'), [better_route_option('clara', 'centrum')])
called(better_route_option('davi', 'haga'), [])
called(route_score('ada', _8, J), [route_score('ada', 'lindholmen', 1800), route_score('ada', 'haga', 3400)])
called(route_score('bjorn', _8, J), [route_score('bjorn', 'backa', 2600)])
called(route_score('clara', _8, J), [route_score('clara', 'haga', 800), route_score('clara', 'centrum', 2000)])
called(route_score('davi', _8, J), [route_score('davi', 'haga', 1600)])
called(audit_flag(K, L), [audit_flag('ada', 'walking_limit_exceeded'), audit_flag('bjorn', 'walking_limit_exceeded'), audit_flag('davi', 'walking_limit_exceeded'), audit_flag('ada', 'assignment_differs'), audit_flag('bjorn', 'assignment_differs'), audit_flag('davi', 'assignment_differs')])
called(recommended('ada', _12, _13), [recommended('ada', 'lindholmen', 1800)])
called(recommended('ada', 'centrum', _14), [])
called(recommended('bjorn', _12, _13), [recommended('bjorn', 'backa', 2600)])
called(recommended('bjorn', 'centrum', _14), [])
called(recommended('clara', _12, _13), [recommended('clara', 'haga', 800)])
called(recommended('clara', 'haga', _14), [recommended('clara', 'haga', 800)])
called(recommended('davi', _12, _13), [recommended('davi', 'haga', 1600)])
called(recommended('davi', 'centrum', _14), [])
called(hidden_detour(P, Q), [hidden_detour('ada', 3000), hidden_detour('bjorn', 2000), hidden_detour('clara', 150), hidden_detour('davi', 1800)])
```

It has three parts:

- **The claims**: the 18 conclusions the proof is about.
- **The steps**: one per fact the forward rules derived that the checks
  consult. A step reads `step(what, by which clause, with which values,
  using what)`, citing the clause by its position in the program. The
  program's lone `_` placeholders are given distinct names `_0`, `_1`, `_2`,
  so each can be shown with its value.
- **The certificate**: the listings and call tables explained in the
  previous card. With no `query()` in the program, the questions are the
  rules' conclusions: `provisional(A, B)`, `recommended(C, D, E)`,
  `audit_flag(K, L)` and `hidden_detour(P, Q)`, each with its table.

Read Ada's steps as sentences:

1. *Ada is provisionally placed at Centrum* — by rule 14, because Centrum is
   one of her candidates (600 m on the map, 3600 m on foot, rank 2) and
   `not(better_map_option('ada', 'centrum'))` holds: its table is empty.
   Nothing is nearer (Lindholmen is 1200 m, Haga 1800 m).
2. *The audit recommends Lindholmen for Ada, score 1800* — by rule 17,
   because Lindholmen's route score is 1800 and the table for
   `better_route_option('ada', 'lindholmen')` is empty.
3. *Lindholmen's route score is 1800* — by rule 15: it is her candidate,
   the walking limit is 2500, 1800 ≤ 2500, the penalty is 600, and
   1800 + 600 × (1 − 1) = 1800.
4. *Ada's placement exceeds the walking limit* — by rule 18: she is placed at
   Centrum, walks 3600 m there, and 3600 > 2500.
5. *Ada's placement differs from the audit* — by rule 19: she is placed at
   Centrum, Lindholmen is recommended, and no recommendation for Centrum
   exists with any score: `called(recommended('ada', 'centrum', _14), [])`.
   In the step, `A` stands for "any score".
6. *Ada's hidden detour is 3000 m* — by rule 20, from her placement at
   Centrum and 3600 − 600 = 3000.

Bjorn, Clara and Davi follow the same pattern. Clara has no flag steps
because no rule produces a flag for her: her walk to Haga is 800 m, and Haga
is also her recommendation. The candidates, the walking limit and the
penalty are stated facts, and the comparisons and sums are computed again
by the checker, so none of them needs a step.

Some steps answer no question. They derive the other facts the listings
hold: the five better map options (Centrum beats Lindholmen and Haga for
Ada, for example), the two better route options, and the route scores they
need, such as Haga's 3400 for Ada. With those listed, the tables show that
nothing beats the placed and recommended schools: `better_map_option` for
Ada holds for Lindholmen and Haga, but not for Centrum.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the questions.** Each of the four questions is answered from
  its listing, and every call table is checked by expanding its call one
  level against the program.
- **It checks the listings are closed.** Applying rules 12 to 20 to the
  listed facts derives nothing any listing leaves out: no missing better
  option, route score, placement, recommendation, flag or detour.
- **It replays each listed fact.** Each step's rule is re-run from scratch:
  every comparison and calculation is computed again, and each negation is
  decided from the table of its call at the values it had when the rule
  ran, such as `recommended('ada', 'centrum', _14)` once Ada's placement is
  known.
- **It compares the claims with the answers.** The 18 claims are exactly
  the answers of the four questions, and every step, listing and table was
  used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
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

verdict('checked')
```

The 11 negations behind the answers are, in plain words: *for each placed
school no better map option exists*, *for each recommended school no better
route option exists*, and *Ada, Bjorn and Davi have no recommendation at
Centrum*. Each is meant relative to this program: the absence is true if
the program's rules cannot produce the missing conclusion.

The verdict is **checked**: every claim follows from the program, and the
claims are every answer of its questions. The checker did not search for
the absences itself; it verified the written record of the search.

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
