# Age

*Is someone over 80? A calendar question, answered with every day counted.*

[age.js](https://github.com/eyereasoner/eyecode/blob/main/examples/age.js) · [output](https://github.com/eyereasoner/eyecode/blob/main/examples/output/age.js) · [proof](https://github.com/eyereasoner/eyecode/blob/main/examples/proof/age.js) · [check](https://github.com/eyereasoner/eyecode/blob/main/examples/check/age.js) · [try it in the playground](https://eyereasoner.github.io/eyecode/playground#example=age)

---

## The question

Pat was born on 21 August 1944. Some benefits, discounts or rules start
"after your 80th birthday".

**On 1 October 2026, is Pat older than 80?** It sounds easy, but calendars
have leap years, months of different lengths and birthdays on 29 February.
We want an answer that shows its arithmetic.

---

## What we tell eyecode

Two facts: a birth date, and the date we ask about. Writing the date down
(instead of reading the computer's clock) means the answer is the same
tomorrow.

```js
fact(birth_date('pat_h', date(1944, 8, 21)))
fact(as_of(date(2026, 10, 1)))

query(age_above(Person, years(80)))
```

The last line is the question: *find every Person whose age is above 80
years.* `query` means "work this out and report what follows". With no date
in the question, the `as_of` date is used.

---

## How the program counts

The rule for "older than N years", quoted from the program:

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

In words: turn each date into a *day number*, find the 80th birthday, and
check that today is strictly later (`gt` is "greater than", `ge` "greater
than or equal"). Strictly: on the 80th birthday itself Pat is exactly 80, not
above it.

`date_day` is defined in the same file, leap-year rules included. Day 1 is
1 January of year 1 in the Gregorian calendar; a date's number adds the days
of all earlier years, of earlier months this year (one more after February
in a leap year), and the day of the month. Someone born on 29 February has
their anniversary on 28 February in a common year.

---

## What eyecode concludes

```js
age_above('pat_h', years(80))
```

Yes: Pat is older than 80 on 1 October 2026.

---

## Why: the proof in plain words

The proof records every number it used:

1. Pat's birthday, 21 August 1944, is day **709899**.
2. The reference date, 1 October 2026, is day **739890**.
3. The 80th birthday is 21 August 2024, day **739119**.
4. 739890 is greater than 739119, so the threshold has been passed.

Along the way it shows *why* 1944 and 2024 are leap years (divisible by 4,
not by 100) and why 2026 is not.

---

## Checked, not just claimed

A separate checker reads the proof against the program:

- each of the **21** reasoning steps really is an instance of the program
  line it cites;
- each of the **33** calculations (comparisons, additions, `mod`) is
  recomputed by the checker and agrees;
- nothing depends on itself in a circle, and every step serves the answer.

Verdict: **checked**. All 54 steps accounted for, nothing taken on trust.

---

## Try it

```sh
eyecode examples/age.js
eyecode --goal "age_above('pat_h', years(80), date(2024, 8, 22))" examples/age.js
eyecode --goal "age_days('pat_h', date(2026, 10, 1), Days)" examples/age.js
```

The last one answers `age_days('pat_h', date(2026, 10, 1), 29991)`. Change `as_of` to `date(2024, 8, 21)`,
the 80th birthday itself: there is no answer, because on that day Pat is
exactly 80, not *above* 80. One day later, the answer comes back.

---

## Takeaway

Date arithmetic is where small mistakes hide. Here each day number, each
leap-year decision and each comparison is written down and rechecked, so a
"yes" can be audited down to the last day.
