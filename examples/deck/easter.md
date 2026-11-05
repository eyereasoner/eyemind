# Easter

*Thirty years of Easter Sundays, worked out by pure arithmetic.*

[easter.js](https://github.com/eyereasoner/eyemind/blob/main/examples/easter.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/easter.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/easter.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/easter.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=easter)

---

## The question

Easter moves around: it falls on the first Sunday after a church-defined
"full moon" in spring, so it can land anywhere from late March to late April.

Long before computers, people found a way to get the date with nothing but
whole-number arithmetic on the year. One famous recipe is the **anonymous
Gregorian algorithm** (also known as Meeus/Jones/Butcher). **Computus** is the
traditional name for computing the date of Easter.

**When is Easter Sunday in each year from 2021 to 2050?**

---

## What we tell eyemind: the recipe

```js
implied_by(
  computus(Year, [Month, Day]),
  [
    // the year's place in the 19-year cycle of moon phases
    is(A, mod(Year, 19)),
    // century and year within the century
    is(B, floordiv(Year, 100)),
    is(C, mod(Year, 100)),
    // roughly the days from 21 March to the paschal full moon, with the
    // Gregorian century corrections
    is(
      D,
      mod(
        add(
          sub(
            sub(add(mul(19, A), B), floordiv(B, 4)),
            floordiv(add(sub(B, floordiv(add(B, 8), 25)), 1), 3),
          ),
          15,
        ),
        30,
      ),
    ),
    // the weekday correction that moves the date on to a Sunday
    is(
      E,
      mod(sub(sub(add(add(32, mul(2, mod(B, 4))), mul(2, floordiv(C, 4))), D), mod(C, 4)), 7),
    ),
    // the date as Month * 31 + (Day - 1); the 451 term moves the few dates
    // that would come out too late back one week
    is(F, add(sub(add(D, E), mul(7, floordiv(add(add(A, mul(11, D)), mul(22, E)), 451))), 114)),
    is(Month, floordiv(F, 31)),
    is(Day, add(mod(F, 31), 1)),
  ],
)
```

`implied_by(conclusion, conditions)` is a **backward rule**: to establish the
conclusion, eyemind works through the conditions in the list, in order. It is
used on demand, when some other rule asks for it.

Capitalized names (`Year`, `A`, `B`, …) are variables: placeholders that get a
value as the rule is used. `is(A, …)` computes the expression and names the
result `A`. Arithmetic is written as words: `add`, `sub` and `mul` are +, −
and ×, `floordiv` is whole-number division (dropping the remainder) and `mod`
is the remainder. Every number is a whole number, so every step is exact.

`[Month, Day]` is a list of two numbers: `[4, 4]` means April 4. F packs the
month and day into one number, Month × 31 + (Day − 1), which the last two
lines unpack.

---

## What we tell eyemind: which years

```js
// in_range(Low, High, N) gives each integer N from Low through High.
implied_by(in_range(Low, High, Low), le(Low, High))
implied_by(
  in_range(Low, High, N),
  [lt(Low, High), is(Next, add(Low, 1)), in_range(Next, High, N)],
)

implies([in_range(2021, 2050, Year), computus(Year, Date)], easter(Year, Date))
```

`in_range` produces the years one at a time, by counting:

- the first rule says *Low itself is in the range, if Low ≤ High*
  (`le` is "less than or equal");
- the second says *N is in the range from Low if Low < High* (`lt` is "less
  than") *and N is in the range that starts one year later*.

The last line is a **forward rule**, `implies(conditions, conclusion)`: for
every year in the range, it asks the recipe for the date and adds the fact
`easter(Year, Date)`.

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
easter(2021, [4, 4])
easter(2022, [4, 17])
easter(2023, [4, 9])
easter(2024, [3, 31])
easter(2025, [4, 20])
easter(2026, [4, 5])
// …
easter(2050, [4, 10])
```

One line per year, 30 in all. `[4, 4]` means April 4; `[3, 31]` means
March 31. The earliest date in this period is March 25 (2035 and 2046) and the
latest April 25 (2038).

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. The full proof
has 858 lines and 818 steps
([proof/easter.js](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/easter.js)).
Here are its claims, its four clauses, and the complete chains of steps for
2021 and 2022:

```js
// Conclusions: the facts the program derives, in the order derived.
easter(2021, [4, 4])
easter(2022, [4, 17])
// … 28 more claims, one per year up to 2050
easter(2050, [4, 10])

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(computus(Year, [Month, Day]), [is(A, mod(Year, 19)), is(B, floordiv(Year, 100)), is(C, mod(Year, 100)), is(D, mod(add(sub(sub(add(mul(19, A), B), floordiv(B, 4)), floordiv(add(sub(B, floordiv(add(B, 8), 25)), 1), 3)), 15), 30)), is(E, mod(sub(sub(add(add(32, mul(2, mod(B, 4))), mul(2, floordiv(C, 4))), D), mod(C, 4)), 7)), is(F, add(sub(add(D, E), mul(7, floordiv(add(add(A, mul(11, D)), mul(22, E)), 451))), 114)), is(Month, floordiv(F, 31)), is(Day, add(mod(F, 31), 1))]))
clause(2, implied_by(in_range(Low, High, Low), le(Low, High)))
clause(3, implied_by(in_range(Low, High, N), [lt(Low, High), is(Next, add(Low, 1)), in_range(Next, High, N)]))
clause(4, implies([in_range(2021, 2050, Year), computus(Year, Date)], easter(Year, Date)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(easter(2021, [4, 4]), clause(4), {Year: 2021, Date: [4, 4]}, [in_range(2021, 2050, 2021), computus(2021, [4, 4])])
step(in_range(2021, 2050, 2021), clause(2), {Low: 2021, High: 2050}, [le(2021, 2050)])
step(le(2021, 2050), 'builtin', {}, [])
step(computus(2021, [4, 4]), clause(1), {Year: 2021, Month: 4, Day: 4, A: 7, B: 20, C: 21, D: 7, E: 6, F: 127}, [is(7, mod(2021, 19)), is(20, floordiv(2021, 100)), is(21, mod(2021, 100)), is(7, mod(add(sub(sub(add(mul(19, 7), 20), floordiv(20, 4)), floordiv(add(sub(20, floordiv(add(20, 8), 25)), 1), 3)), 15), 30)), is(6, mod(sub(sub(add(add(32, mul(2, mod(20, 4))), mul(2, floordiv(21, 4))), 7), mod(21, 4)), 7)), is(127, add(sub(add(7, 6), mul(7, floordiv(add(add(7, mul(11, 7)), mul(22, 6)), 451))), 114)), is(4, floordiv(127, 31)), is(4, add(mod(127, 31), 1))])
step(is(7, mod(2021, 19)), 'builtin', {}, [])
step(is(20, floordiv(2021, 100)), 'builtin', {}, [])
step(is(21, mod(2021, 100)), 'builtin', {}, [])
step(is(7, mod(add(sub(sub(add(mul(19, 7), 20), floordiv(20, 4)), floordiv(add(sub(20, floordiv(add(20, 8), 25)), 1), 3)), 15), 30)), 'builtin', {}, [])
step(is(6, mod(sub(sub(add(add(32, mul(2, mod(20, 4))), mul(2, floordiv(21, 4))), 7), mod(21, 4)), 7)), 'builtin', {}, [])
step(is(127, add(sub(add(7, 6), mul(7, floordiv(add(add(7, mul(11, 7)), mul(22, 6)), 451))), 114)), 'builtin', {}, [])
step(is(4, floordiv(127, 31)), 'builtin', {}, [])
step(is(4, add(mod(127, 31), 1)), 'builtin', {}, [])
step(easter(2022, [4, 17]), clause(4), {Year: 2022, Date: [4, 17]}, [in_range(2021, 2050, 2022), computus(2022, [4, 17])])
step(in_range(2021, 2050, 2022), clause(3), {Low: 2021, High: 2050, N: 2022, Next: 2022}, [lt(2021, 2050), is(2022, add(2021, 1)), in_range(2022, 2050, 2022)])
step(lt(2021, 2050), 'builtin', {}, [])
step(is(2022, add(2021, 1)), 'builtin', {}, [])
step(in_range(2022, 2050, 2022), clause(2), {Low: 2022, High: 2050}, [le(2022, 2050)])
step(le(2022, 2050), 'builtin', {}, [])
step(computus(2022, [4, 17]), clause(1), {Year: 2022, Month: 4, Day: 17, A: 8, B: 20, C: 22, D: 26, E: 0, F: 140}, [is(8, mod(2022, 19)), is(20, floordiv(2022, 100)), is(22, mod(2022, 100)), is(26, mod(add(sub(sub(add(mul(19, 8), 20), floordiv(20, 4)), floordiv(add(sub(20, floordiv(add(20, 8), 25)), 1), 3)), 15), 30)), is(0, mod(sub(sub(add(add(32, mul(2, mod(20, 4))), mul(2, floordiv(22, 4))), 26), mod(22, 4)), 7)), is(140, add(sub(add(26, 0), mul(7, floordiv(add(add(8, mul(11, 26)), mul(22, 0)), 451))), 114)), is(4, floordiv(140, 31)), is(17, add(mod(140, 31), 1))])
step(is(8, mod(2022, 19)), 'builtin', {}, [])
step(is(20, floordiv(2022, 100)), 'builtin', {}, [])
step(is(22, mod(2022, 100)), 'builtin', {}, [])
step(is(26, mod(add(sub(sub(add(mul(19, 8), 20), floordiv(20, 4)), floordiv(add(sub(20, floordiv(add(20, 8), 25)), 1), 3)), 15), 30)), 'builtin', {}, [])
step(is(0, mod(sub(sub(add(add(32, mul(2, mod(20, 4))), mul(2, floordiv(22, 4))), 26), mod(22, 4)), 7)), 'builtin', {}, [])
step(is(140, add(sub(add(26, 0), mul(7, floordiv(add(add(8, mul(11, 26)), mul(22, 0)), 451))), 114)), 'builtin', {}, [])
step(is(4, floordiv(140, 31)), 'builtin', {}, [])
step(is(17, add(mod(140, 31), 1)), 'builtin', {}, [])
// … 791 more steps for 2023 to 2050, built the same way (818 steps in all)
```

It has three parts:

- **The claims**: the 30 conclusions the proof is about.
- **The clauses**: the program's three backward rules and its forward rule,
  numbered 1 to 4.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.

Two kinds of justification occur:

- **`clause(N)`**: the step is an instance of rule N, with the variables set
  to the values shown between `{ }`.
- **`'builtin'`**: a calculation or comparison, such as
  `is(7, mod(2021, 19))` ("the remainder of 2021 divided by 19 is 7"). It
  needs no rule: the checker simply redoes the arithmetic.

Read the steps for 2021 as sentences:

1. *Easter 2021 is April 4* — by rule 4, with `Year` = 2021, because 2021 is
   in the range and the recipe gives `[4, 4]` for 2021.
2. *2021 is in the range from 2021 to 2050* — by rule 2, because 2021 ≤ 2050.
3. *2021 ≤ 2050* — a calculation.
4. *The recipe gives April 4 for 2021* — by rule 1, with A = 7, B = 20,
   C = 21, D = 7, E = 6, F = 127, Month = 4 and Day = 4.
5. The eight calculations of the recipe, each with the numbers filled in:
   2021 mod 19 = 7, 2021 ÷ 100 = 20, 2021 mod 100 = 21, then D = 7, E = 6,
   F = 127, Month = 127 ÷ 31 = 4, and Day = (127 mod 31) + 1 = 4.

And for 2022:

1. *Easter 2022 is April 17* — by rule 4, with `Year` = 2022.
2. *2022 is in the range from 2021* — by rule 3, because 2021 < 2050,
   2021 + 1 = 2022, and 2022 is in the range from 2022.
3. Two calculations confirm 2021 < 2050 and 2021 + 1 = 2022.
4. *2022 is in the range from 2022* — by rule 2, because 2022 ≤ 2050, which
   is the next calculation.
5. *The recipe gives April 17 for 2022* — by rule 1, followed by its eight
   calculations, ending with F = 140, Month = 4 and Day = 17.

Each later year counts up from 2021 again: 2050 needs 30 counting steps. That
is why the proof has 465 counting steps, plus 30 rule-4 steps and 30 recipe
steps. Calculations that already appear, such as 2021 < 2050, are not
repeated.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
easter(2021, [4, 4])
easter(2022, [4, 17])
easter(2023, [4, 9])
easter(2024, [3, 31])
easter(2025, [4, 20])
easter(2026, [4, 5])
easter(2027, [3, 28])
easter(2028, [4, 16])
easter(2029, [4, 1])
easter(2030, [4, 21])
easter(2031, [4, 13])
easter(2032, [3, 28])
easter(2033, [4, 17])
easter(2034, [4, 9])
easter(2035, [3, 25])
easter(2036, [4, 13])
easter(2037, [4, 5])
easter(2038, [4, 25])
easter(2039, [4, 10])
easter(2040, [4, 1])
easter(2041, [4, 21])
easter(2042, [4, 6])
easter(2043, [3, 29])
easter(2044, [4, 17])
easter(2045, [4, 9])
easter(2046, [3, 25])
easter(2047, [4, 14])
easter(2048, [4, 5])
easter(2049, [4, 18])
easter(2050, [4, 10])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 525)
condition('C2', 'well_founded', 'ok', 818)
condition('C3', 'justification', 'ok', 818)
condition('C4', 'coverage', 'ok', 1665)
condition('C5', 're_decision', 'ok', 293)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 848)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(818)
verified(525)
recomputed(293)
composed(0)
trusted(0)
claims(30)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (525)**: each of the 525 rule steps (30 Easter dates, 30
  recipe runs, 465 counting steps) really is an instance of the rule it cites
  with the values shown. For 2021, rule 1 with A = 7, …, F = 127 is checked
  against the program's own text of the recipe.
- **C2 well-founded (818)**: none of the 818 steps depends on itself, even
  indirectly.
- **C3 justification (818)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (1665)**: the 30 claims and the 1635 things the steps use
  are each backed by a step: nothing is taken for granted.
- **C5 re-decision (293)**: the checker redid all 293 calculations and
  comparisons itself, and every result agreed with the proof's numbers.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (848)**: the 30 claims are conclusions of the program, and
  all 818 steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 818 steps, 525 verified against the program, 293
recomputed, none taken on trust. The verdict is **checked**: all 30 dates
follow from the program. As the last comment says, this confirms the claims;
it does not say the program has no other conclusions. Nor does it say the
recipe matches the church calendar: it says the dates follow from *this*
recipe.

---

## Try it

```sh
eyemind examples/easter.js            # the 30 dates
eyemind --proof examples/easter.js    # with every calculation
eyemind -c examples/easter.js
eyemind --check-proof examples/proof/easter.js examples/easter.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=easter).

- Change the range in the last line to `in_range(2000, 2000, Year)` and run
  again: you get `easter(2000, [4, 23])`, April 23.
- Try `in_range(1818, 1818, Year)`: `easter(1818, [3, 22])`, March 22, the
  earliest date Easter can fall on.
- Swap the bounds to `in_range(2050, 2021, Year)`: the range is empty, so
  there are no conclusions at all.

---

## Takeaway

A centuries-old calendar recipe becomes a list of dates where each one comes
with its own worked arithmetic, recomputed by an independent checker.
