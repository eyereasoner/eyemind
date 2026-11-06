# Age

*Is someone over 80? A calendar question, answered with every day counted.*

[age.js](https://github.com/eyereasoner/eyemind/blob/main/examples/age.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/age.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/age.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/age.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=age)

---

## The question

Pat was born on 21 August 1944. Some benefits, discounts or rules start
"after your 80th birthday". It sounds easy, but calendars have leap years,
months of different lengths and birthdays on 29 February, and we want an
answer that shows its arithmetic.

**On 1 October 2026, is Pat older than 80?**

---

## What we tell eyemind

Two facts: a birth date, and the date we ask about. Writing the date down
(instead of reading the computer's clock) means the answer and its proof are
the same tomorrow.

```js
fact(birth_date('pat_h', date(1944, 8, 21)))
fact(as_of(date(2026, 10, 1)))

// Without an explicit date, the reference date as_of/1 is used.
implied_by(age_above(Person, Duration), [as_of(Date), age_above(Person, Duration, Date)])

query(age_above(Person, years(80)))
```

A `fact(...)` is something we state as true; `date(1944, 8, 21)` is a date
written as year, month, day. Capitalized names such as `Person` and `Date`
are variables: placeholders for any value.

`implied_by(conclusion, premise)` is a backward rule, used on demand when a
question needs it: *a person's age is above a duration if, on the `as_of`
date, it is above that duration.* A premise in square brackets needs all of
its parts.

The last line is the question: *find every `Person` whose age is above 80
years.*

---

## How the program counts

The rule for "older than N years on a date", quoted from the program:

```js
implied_by(
  age_above(Person, years(Years), Date),
  [
    is_int(Years),
    ge(Years, 0),
    birth_date(Person, Birth),
    date_day(Birth, Born),
    date_day(Date, Today),
    ge(Today, Born),
    anniversary(Birth, Years, Anniversary),
    date_day(Anniversary, Threshold),
    gt(Today, Threshold),
  ],
)
```

In words: the number of years must be a whole number, 0 or more; turn the
birth date and the date into *day numbers*; the date must not be before the
birth; find the anniversary that many years after the birth; and the date
must come strictly after it. `is_int`, `ge` ("greater than or equal") and
`gt` ("greater than") are **built-in tests** that eyemind evaluates
directly. Strictly: on the 80th birthday itself Pat is exactly 80, not above
it.

`date_day` gives each date its number in the Gregorian calendar, counting
1 January of year 1 as day 1. It adds up:

- 365 days for each earlier year, plus one for each earlier leap year
  (divisible by 4, but not by 100 unless also by 400);
- the days of the earlier months of this year (`month_offset`, a table of
  twelve facts);
- one more day after February in a leap year (`leap_extra`);
- the day of the month.

`anniversary` adds the years to the birth year, and clips the day to the
month's length (`month_days`), so a 29 February birthday falls on
28 February in a common year. All arithmetic is exact whole-number
arithmetic, written as terms such as `add`, `sub`, `mul`, `floordiv`
(division rounded down), `mod` (remainder) and `min`, and worked out by
`is(Result, calculation)`.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
age_above('pat_h', years(80))
```

Yes: Pat is older than 80 on 1 October 2026.

| date | day number |
|---|---|
| 21 August 1944, Pat's birth | 709899 |
| 21 August 2024, Pat's 80th birthday | 739119 |
| 1 October 2026, the reference date | 739890 |

739890 is greater than 739119, so the 80th birthday has passed.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
age_above('pat_h', years(80))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(birth_date('pat_h', date(1944, 8, 21))))
clause(2, fact(as_of(date(2026, 10, 1))))
clause(3, implied_by(age_above(Person, Duration), [as_of(Date), age_above(Person, Duration, Date)]))
clause(4, implied_by(age_above(Person, years(Years), Date), [is_int(Years), ge(Years, 0), birth_date(Person, Birth), date_day(Birth, Born), date_day(Date, Today), ge(Today, Born), anniversary(Birth, Years, Anniversary), date_day(Anniversary, Threshold), gt(Today, Threshold)]))
clause(7, implied_by(anniversary(date(Y, M, D), Years, date(Year, M, Day)), [is(Year, add(Y, Years)), month_days(Year, M, Maximum), is(Day, min(D, Maximum))]))
clause(8, implied_by(date_day(date(Y, M, D), Ordinal), [is_int(Y), is_int(M), is_int(D), ge(Y, 1), month_days(Y, M, Maximum), ge(D, 1), le(D, Maximum), month_offset(M, Offset), leap_extra(Y, M, Extra), is(Previous, sub(Y, 1)), is(Ordinal, add(add(add(add(sub(add(mul(365, Previous), floordiv(Previous, 4)), floordiv(Previous, 100)), floordiv(Previous, 400)), Offset), Extra), D))]))
clause(11, implied_by(month_days(_0, M, Days), ordinary_month(M, Days)))
clause(18, fact(ordinary_month(8, 31)))
clause(20, fact(ordinary_month(10, 31)))
clause(24, implied_by(leap_year(Y), [eq(0, mod(Y, 4)), ne(0, mod(Y, 100))]))
clause(25, implied_by(common_year(Y), ne(0, mod(Y, 4))))
clause(28, implied_by(leap_extra(Y, M, 1), [gt(M, 2), leap_year(Y)]))
clause(29, implied_by(leap_extra(Y, M, 0), [gt(M, 2), common_year(Y)]))
clause(37, fact(month_offset(8, 212)))
clause(39, fact(month_offset(10, 273)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(age_above('pat_h', years(80)), clause(3), {Person: 'pat_h', Duration: years(80), Date: date(2026, 10, 1)}, [as_of(date(2026, 10, 1)), age_above('pat_h', years(80), date(2026, 10, 1))])
step(as_of(date(2026, 10, 1)), clause(2), {}, [])
step(age_above('pat_h', years(80), date(2026, 10, 1)), clause(4), {Person: 'pat_h', Years: 80, Date: date(2026, 10, 1), Birth: date(1944, 8, 21), Born: 709899, Today: 739890, Anniversary: date(2024, 8, 21), Threshold: 739119}, [is_int(80), ge(80, 0), birth_date('pat_h', date(1944, 8, 21)), date_day(date(1944, 8, 21), 709899), date_day(date(2026, 10, 1), 739890), ge(739890, 709899), anniversary(date(1944, 8, 21), 80, date(2024, 8, 21)), date_day(date(2024, 8, 21), 739119), gt(739890, 739119)])
step(is_int(80), 'builtin', {}, [])
step(ge(80, 0), 'builtin', {}, [])
step(birth_date('pat_h', date(1944, 8, 21)), clause(1), {}, [])
step(date_day(date(1944, 8, 21), 709899), clause(8), {Y: 1944, M: 8, D: 21, Ordinal: 709899, Maximum: 31, Offset: 212, Extra: 1, Previous: 1943}, [is_int(1944), is_int(8), is_int(21), ge(1944, 1), month_days(1944, 8, 31), ge(21, 1), le(21, 31), month_offset(8, 212), leap_extra(1944, 8, 1), is(1943, sub(1944, 1)), is(709899, add(add(add(add(sub(add(mul(365, 1943), floordiv(1943, 4)), floordiv(1943, 100)), floordiv(1943, 400)), 212), 1), 21))])
step(is_int(1944), 'builtin', {}, [])
step(is_int(8), 'builtin', {}, [])
step(is_int(21), 'builtin', {}, [])
step(ge(1944, 1), 'builtin', {}, [])
step(month_days(1944, 8, 31), clause(11), {_0: 1944, M: 8, Days: 31}, [ordinary_month(8, 31)])
step(ordinary_month(8, 31), clause(18), {}, [])
step(ge(21, 1), 'builtin', {}, [])
step(le(21, 31), 'builtin', {}, [])
step(month_offset(8, 212), clause(37), {}, [])
step(leap_extra(1944, 8, 1), clause(28), {Y: 1944, M: 8}, [gt(8, 2), leap_year(1944)])
step(gt(8, 2), 'builtin', {}, [])
step(leap_year(1944), clause(24), {Y: 1944}, [eq(0, mod(1944, 4)), ne(0, mod(1944, 100))])
step(eq(0, mod(1944, 4)), 'builtin', {}, [])
step(ne(0, mod(1944, 100)), 'builtin', {}, [])
step(is(1943, sub(1944, 1)), 'builtin', {}, [])
step(is(709899, add(add(add(add(sub(add(mul(365, 1943), floordiv(1943, 4)), floordiv(1943, 100)), floordiv(1943, 400)), 212), 1), 21)), 'builtin', {}, [])
step(date_day(date(2026, 10, 1), 739890), clause(8), {Y: 2026, M: 10, D: 1, Ordinal: 739890, Maximum: 31, Offset: 273, Extra: 0, Previous: 2025}, [is_int(2026), is_int(10), is_int(1), ge(2026, 1), month_days(2026, 10, 31), ge(1, 1), le(1, 31), month_offset(10, 273), leap_extra(2026, 10, 0), is(2025, sub(2026, 1)), is(739890, add(add(add(add(sub(add(mul(365, 2025), floordiv(2025, 4)), floordiv(2025, 100)), floordiv(2025, 400)), 273), 0), 1))])
step(is_int(2026), 'builtin', {}, [])
step(is_int(10), 'builtin', {}, [])
step(is_int(1), 'builtin', {}, [])
step(ge(2026, 1), 'builtin', {}, [])
step(month_days(2026, 10, 31), clause(11), {_0: 2026, M: 10, Days: 31}, [ordinary_month(10, 31)])
step(ordinary_month(10, 31), clause(20), {}, [])
step(ge(1, 1), 'builtin', {}, [])
step(le(1, 31), 'builtin', {}, [])
step(month_offset(10, 273), clause(39), {}, [])
step(leap_extra(2026, 10, 0), clause(29), {Y: 2026, M: 10}, [gt(10, 2), common_year(2026)])
step(gt(10, 2), 'builtin', {}, [])
step(common_year(2026), clause(25), {Y: 2026}, [ne(0, mod(2026, 4))])
step(ne(0, mod(2026, 4)), 'builtin', {}, [])
step(is(2025, sub(2026, 1)), 'builtin', {}, [])
step(is(739890, add(add(add(add(sub(add(mul(365, 2025), floordiv(2025, 4)), floordiv(2025, 100)), floordiv(2025, 400)), 273), 0), 1)), 'builtin', {}, [])
step(ge(739890, 709899), 'builtin', {}, [])
step(anniversary(date(1944, 8, 21), 80, date(2024, 8, 21)), clause(7), {Y: 1944, M: 8, D: 21, Years: 80, Year: 2024, Day: 21, Maximum: 31}, [is(2024, add(1944, 80)), month_days(2024, 8, 31), is(21, min(21, 31))])
step(is(2024, add(1944, 80)), 'builtin', {}, [])
step(month_days(2024, 8, 31), clause(11), {_0: 2024, M: 8, Days: 31}, [ordinary_month(8, 31)])
step(is(21, min(21, 31)), 'builtin', {}, [])
step(date_day(date(2024, 8, 21), 739119), clause(8), {Y: 2024, M: 8, D: 21, Ordinal: 739119, Maximum: 31, Offset: 212, Extra: 1, Previous: 2023}, [is_int(2024), is_int(8), is_int(21), ge(2024, 1), month_days(2024, 8, 31), ge(21, 1), le(21, 31), month_offset(8, 212), leap_extra(2024, 8, 1), is(2023, sub(2024, 1)), is(739119, add(add(add(add(sub(add(mul(365, 2023), floordiv(2023, 4)), floordiv(2023, 100)), floordiv(2023, 400)), 212), 1), 21))])
step(is_int(2024), 'builtin', {}, [])
step(ge(2024, 1), 'builtin', {}, [])
step(leap_extra(2024, 8, 1), clause(28), {Y: 2024, M: 8}, [gt(8, 2), leap_year(2024)])
step(leap_year(2024), clause(24), {Y: 2024}, [eq(0, mod(2024, 4)), ne(0, mod(2024, 100))])
step(eq(0, mod(2024, 4)), 'builtin', {}, [])
step(ne(0, mod(2024, 100)), 'builtin', {}, [])
step(is(2023, sub(2024, 1)), 'builtin', {}, [])
step(is(739119, add(add(add(add(sub(add(mul(365, 2023), floordiv(2023, 4)), floordiv(2023, 100)), floordiv(2023, 400)), 212), 1), 21)), 'builtin', {}, [])
step(gt(739890, 739119), 'builtin', {}, [])
```

It has three parts:

- **The claim**: the answer the proof is about.
- **The clauses**: the program lines the steps cite, numbered by their place
  in the program. Only 15 of its 41 rules and facts are needed: for example the
  `ordinary_month` facts for August (18) and October (20), and the
  `month_offset` facts for August (37) and October (39). The `_` of the
  program is shown as `_0`, so it can be given a value like any other
  variable.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable of the cited line stood for.

There are two kinds of justification. `clause(N)` means "by line N of the
program". `'builtin'` means a test or calculation, such as `ge(80, 0)` or
`is(1943, sub(1944, 1))`; the checker does not take it on trust, it redoes
it. Read the 54 steps as sentences:

- **Steps 1 and 2.** *Pat's age is above 80 years* — by rule 3, because the
  reference date is 1 October 2026 (fact 2) and on that date Pat is above
  80.
- **Step 3.** *On 1 October 2026 Pat is above 80* — by rule 4, with Pat
  born on day 709899, the date being day 739890, and the 80th anniversary,
  21 August 2024, being day 739119. It uses the nine things checked next.
- **Steps 4 to 6.** *80 is a whole number*, *80 ≥ 0* (builtin), and *Pat was
  born on 21 August 1944* (fact 1).
- **Steps 7 to 23.** *21 August 1944 is day 709899* — by rule 8: 1944, 8 and
  21 are whole numbers and 1944 ≥ 1 (builtin); August has 31 days (rule 11
  and fact 18), and 1 ≤ 21 ≤ 31; 212 days come before August (fact 37); 1944
  is a leap year (rule 24: 1944 is divisible by 4 and not by 100), so a leap
  day is added after February (rule 28, since 8 > 2); 1944 − 1 = 1943; and
  365 × 1943 + 485 − 19 + 4 + 212 + 1 + 21 = 709899, where 485, 19 and 4 are
  1943 divided by 4, 100 and 400, rounded down.
- **Steps 24 to 39.** *1 October 2026 is day 739890* — by rule 8, in the same
  way: October has 31 days (fact 20), 273 days come before October
  (fact 39), and 2026 is a common year (rule 25: it is not divisible by 4),
  so no leap day is added (rule 29).
- **Step 40.** *739890 ≥ 709899*: the date is not before Pat's birth —
  builtin.
- **Steps 41 to 44.** *The 80th anniversary of 21 August 1944 is 21 August
  2024* — by rule 7: 1944 + 80 = 2024, August 2024 has 31 days, and the
  smaller of 21 and 31 is 21.
- **Steps 45 to 53.** *21 August 2024 is day 739119* — by rule 8. Facts
  already shown (that 8 and 21 are whole numbers, August's 31 days, the 212
  earlier days) are reused rather than repeated; 2024 is a leap year (rule
  24), so a leap day is added (rule 28).
- **Step 54.** *739890 > 739119*: the date is after the 80th birthday —
  builtin.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
age_above('pat_h', years(80))

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 21)
condition('C2', 'well_founded', 'ok', 54)
condition('C3', 'justification', 'ok', 54)
condition('C4', 'coverage', 'ok', 62)
condition('C5', 're_decision', 'ok', 33)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 55)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(54)
verified(21)
recomputed(33)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (21)**: the 21 steps that cite a program line really are
  instances of that line with the values shown. For example, step 7 is rule 8
  with `Y` = 1944, `M` = 8 and `D` = 21.
- **C2 well-founded (54)**: none of the 54 steps depends on itself, even
  indirectly.
- **C3 justification (54)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (62)**: the 1 claim and the 61 things the steps use are each
  backed by a step.
- **C5 re-decision (33)**: the checker redid all 33 built-in tests and
  calculations (whole-number checks, comparisons, remainders, subtractions
  and the three day-number sums) and got the same results.
- **C6 boundary consistency (0)**: nothing was concluded from the absence of
  a fact, so there is nothing to confront.
- **C7 relevance (55)**: the 1 claim answers the query, and all 54 steps
  serve it.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics: 54 steps, 21 verified against the program, 33 recomputed,
none taken on trust, 1 claim. The verdict is **checked**: Pat's age is above
80 on 1 October 2026, down to the last day. As the last comment says, this
confirms the claim; it does not say the program has no other conclusions.

---

## Try it

```sh
eyemind examples/age.js
eyemind --goal "age_above('pat_h', years(80), date(2024, 8, 22))" examples/age.js
eyemind --goal "age_days('pat_h', date(2026, 10, 1), Days)" examples/age.js
```

The second asks about 22 August 2024, the day after the 80th birthday: it
holds. The last one counts days and answers
`age_days('pat_h', date(2026, 10, 1), 29991)`: 739890 − 709899.

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=age).
Change `as_of` to `date(2024, 8, 21)`, the 80th birthday itself: there is no
answer, because on that day Pat is exactly 80, not *above* 80. Change it to
`date(2024, 8, 22)`, one day later, and the answer comes back.

---

## Takeaway

Date arithmetic is where small mistakes hide. Here each day number, each
leap-year decision and each comparison is written down and rechecked, so a
"yes" can be audited down to the last day.
