# A school can look close on a map

*Audit a provisional choice using walking routes and preferences.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/school-placement-audit.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/school-placement-audit.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/school-placement-audit.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/school-placement-audit.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=school-placement-audit)

---

## The question

A provisional placement uses straight-line distance, breaking distance ties
by family preference rank. Is that also a good choice when walking routes
and preferences are considered together?

The program computes both choices from nine candidate records for four
children. The audited recommendations are derived, rather than supplied.

---

## The illustrative audit policy

Eligible routes require at most 2500 m of walking. Their score is:

**walking metres + 600 × (preference rank − 1)**.

The lowest score wins; all exact ties remain recommendations. The audit flags
a provisional route above the walking limit or a provisional school outside
the set of recommendations.

---

## What eyemind concludes

| Child | Provisional | Recommended | Audited score |
| --- | --- | --- | ---: |
| Ada | Centrum | Lindholmen | 1800 |
| Bjorn | Centrum | Backa | 2600 |
| Clara | Haga | Haga | 800 |
| Davi | Centrum | Haga | 1600 |

Ada, Bjorn and Davi each receive both audit flags. Clara receives neither.
Bjorn's 2600 is a score: his actual walk is 2000 m and meets the limit.

---

## Why the map missed the problem

Ada's provisional school is only 600 m away in a straight line but requires
a 3600 m walk: a hidden detour of 3000 m. The program also reports the detours
for the other children, so the route assumption can be inspected.

---

## What the proof establishes

The checker recomputes scores and comparisons. Verdict:
**checked_with_obligations**, because the selected minima and the absence
of a matching recommendation depend on searching the supplied alternatives.

This policy is illustrative. There are no school-capacity limits, sibling
priorities or shared-seat allocation; each child's options are evaluated
independently.

---

## Try it

```sh
eyemind examples/school-placement-audit.js
```

Change Ada's Centrum route to 1800 m and preference rank 1. It ties Lindholmen,
so both schools are recommended and Ada receives no audit flag.
