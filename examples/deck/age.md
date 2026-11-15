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

// Certificate: the derived facts and every answer of each call the questions make.
called(age_above(A, years(80)), [age_above('pat_h', years(80))])
called(age_above(B, years(80), date(2026, 10, 1)), [age_above('pat_h', years(80), date(2026, 10, 1))])
called(date_day(date(1944, 8, 21), C), [date_day(date(1944, 8, 21), 709899)])
called(month_days(1944, 8, D), [month_days(1944, 8, 31)])
called(leap_extra(1944, 8, E), [leap_extra(1944, 8, 1)])
called(leap_year(1944), [leap_year(1944)])
called(common_year(1944), [])
called(date_day(date(2026, 10, 1), F), [date_day(date(2026, 10, 1), 739890)])
called(month_days(2026, 10, G), [month_days(2026, 10, 31)])
called(leap_extra(2026, 10, H), [leap_extra(2026, 10, 0)])
called(leap_year(2026), [])
called(common_year(2026), [common_year(2026)])
called(anniversary(date(1944, 8, 21), 80, I), [anniversary(date(1944, 8, 21), 80, date(2024, 8, 21))])
called(month_days(2024, 8, J), [month_days(2024, 8, 31)])
called(date_day(date(2024, 8, 21), K), [date_day(date(2024, 8, 21), 739119)])
called(leap_extra(2024, 8, L), [leap_extra(2024, 8, 1)])
called(leap_year(2024), [leap_year(2024)])
called(common_year(2024), [])
```

It has two parts:

- **The claim**: the answer the proof is about.
- **The certificate**: here only **call tables**. `called(Call, Answers)`
  says: *this call, made while answering the question, has exactly these
  answers*. The capital letters in a call are the values still unknown when
  it was made. An empty list says the call has no answer at all.

A proof can also hold `step(...)` records of how forward rules derived
facts, but every rule here is a backward rule, worked out only when asked,
so this proof has none. The tests and calculations, such as `ge(80, 0)` or
`is(1943, sub(1944, 1))`, are not written down either: the checker redoes
them itself. Read the 18 tables as sentences:

- **Tables 1 and 2.** *Pat is the only one whose age is above 80 years* —
  by rule 3, with the reference date 1 October 2026 (fact 2), which asks
  whether anyone is above 80 on that date: again only Pat, by rule 4.
- **Tables 3 to 7.** *21 August 1944 is day 709899* — by rule 8: August
  1944 has 31 days (rule 11 and fact 18); 212 days come before August (fact
  37); 1944 is a leap year (rule 24: it is divisible by 4 and not by 100)
  and not a common year, so a leap day is added after February (rule 28);
  and 365 × 1943 + 485 − 19 + 4 + 212 + 1 + 21 = 709899, where 485, 19 and
  4 are 1943 divided by 4, 100 and 400, rounded down.
- **Tables 8 to 12.** *1 October 2026 is day 739890* — by rule 8, in the
  same way: October has 31 days (fact 20), 273 days come before October
  (fact 39), and 2026 is not a leap year but a common year (rule 25: it is
  not divisible by 4), so no leap day is added (rule 29).
- **Tables 13 and 14.** *The 80th anniversary of 21 August 1944 is 21
  August 2024* — by rule 7: 1944 + 80 = 2024, August 2024 has 31 days, and
  the smaller of 21 and 31 is 21.
- **Tables 15 to 18.** *21 August 2024 is day 739119* — by rule 8; 2024 is
  a leap year (rule 24), so a leap day is added (rule 28).

Rule 4 then compares the day numbers itself: 739890 ≥ 709899, so the date
is not before Pat's birth, and 739890 > 739119, so it is after the 80th
birthday. Each distinct call has one table, so the 31 days of August 1944
and 2024 are two tables, while a call made twice is answered from the same
one.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the question
by applying the program's rules one level at a time, taking the answer of
every inner call from its table and redoing every test and calculation. Each
table it consults is checked the same way, so a wrong table, such as one
claiming 2026 is a leap year, shows up as a disagreement. A table the check
does not use fails it too. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
age_above('pat_h', years(80))

verdict('checked')
```

The verdict is **checked**: Pat's age is above 80 on 1 October 2026, down to
the last day, and that is every answer of the original question. Had the
proof claimed a wrong answer, or left one out, the report would list each
`failure(...)` and end with `verdict(failed(N))`.

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

Date arithmetic is where small mistakes hide. Here each day number and each
leap-year decision is written down in a call table and rechecked, and each
comparison is recomputed, so a "yes" can be audited down to the last day.
