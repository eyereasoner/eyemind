# Easter

*Thirty years of Easter Sundays, worked out by pure arithmetic.*

[easter.js](https://github.com/eyereasoner/eyemind/blob/main/examples/easter.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/easter.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/easter.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/easter.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=easter)

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
has 128 lines: the 30 claims, 30 steps and a certificate of one listing and
61 call tables
([proof/easter.js](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/easter.js)).
Here are its first and last claims, the steps for 2021 and 2022, and some of
the call tables:

```js
// Conclusions: the facts the program derives, in the order derived.
easter(2021, [4, 4])
easter(2022, [4, 17])
// … 27 more claims, one per year up to 2049
easter(2050, [4, 10])

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(easter(2021, [4, 4]), clause(4), {Year: 2021, Date: [4, 4]}, [in_range(2021, 2050, 2021), computus(2021, [4, 4])])
step(easter(2022, [4, 17]), clause(4), {Year: 2022, Date: [4, 17]}, [in_range(2021, 2050, 2022), computus(2022, [4, 17])])
// … 28 more steps, one per year up to 2050

// Certificate: the derived facts and every answer of each call the questions make.
// … the listing of all 30 easter facts, and the tables of easter(A, B) and of
// in_range from 2021 up to 2047
called(in_range(2048, 2050, D1), [in_range(2048, 2050, 2048), in_range(2048, 2050, 2049), in_range(2048, 2050, 2050)])
called(in_range(2049, 2050, E1), [in_range(2049, 2050, 2049), in_range(2049, 2050, 2050)])
called(in_range(2050, 2050, F1), [in_range(2050, 2050, 2050)])
called(computus(2021, G1), [computus(2021, [4, 4])])
called(computus(2022, G1), [computus(2022, [4, 17])])
// … the computus tables for 2023 to 2050
```

It has three parts:

- **The claims**: the 30 conclusions the proof is about.
- **The steps**: one per Easter date, recording the firing of the forward
  rule behind it. A step reads `step(what, by which rule, with which values,
  using what)`. Rules are numbered by their place in the program: the
  recipe `computus` is rule 1, the two `in_range` rules are 2 and 3, and the
  forward rule that concludes `easter` is rule 4.
- **The certificate**: the **listing** `derived(easter(A, B), [...])` holds
  all 30 dates the forward rule derived, in the order derived. Each **call
  table** `called(Call, Answers)` holds every answer of a call made while
  answering the question.

Read the step for 2021 as a sentence: *Easter 2021 is April 4, by rule 4, with
`Year` = 2021, because 2021 is in the range from 2021 to 2050 and the recipe
gives `[4, 4]` for 2021.* The step for 2022 reads the same way.

The tables say what those uses stand on. `in_range(2048, 2050, D1)` has
exactly the answers 2048, 2049 and 2050; each range table counts up one year
from the next, and `in_range(2050, 2050, F1)` has 2050 alone. The table of
`computus(2021, G1)` has exactly one answer, `[4, 4]`. The recipe's eight
calculations, 2021 mod 19 = 7, 2021 ÷ 100 = 20, 2021 mod 100 = 21, then
D = 7, E = 6, F = 127, Month = 127 ÷ 31 = 4 and Day = (127 mod 31) + 1 = 4,
are not written down at all: the checker computes them itself.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It checks each call table
by applying the program one level against the tables below it, redoing every
calculation and comparison of the recipe and the counting; a table with a
wrong date or a missing year shows up as a disagreement. It requires the
listing to be closed under rule 4: every year in the range, with its recipe
date, must be listed. It replays each step from rule 4, and requires the
claims to be exactly the answers of the question `easter(Year, Date)`. A
step, table or listing the check does not use fails it. This is the
complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
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

verdict('checked')
```

The verdict is **checked**: all 30 dates follow from the program, and they are
every answer of the original question. It does not say the recipe matches
the church calendar: it says the dates follow from *this* recipe.

---

## Try it

```sh
eyemind examples/easter.js            # the 30 dates
eyemind --proof examples/easter.js    # with the proof
eyemind -c examples/easter.js
eyemind --check-proof examples/proof/easter.js examples/easter.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=easter).

- Change the range in the last line to `in_range(2000, 2000, Year)` and run
  again: you get `easter(2000, [4, 23])`, April 23.
- Try `in_range(1818, 1818, Year)`: `easter(1818, [3, 22])`, March 22, the
  earliest date Easter can fall on.
- Swap the bounds to `in_range(2050, 2021, Year)`: the range is empty, so
  there are no conclusions at all.

---

## Takeaway

A centuries-old calendar recipe becomes a list of dates where each one comes
with its own recipe call, whose arithmetic an independent checker recomputes.
