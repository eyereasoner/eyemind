// Finding Easter Sunday in the Gregorian calendar for every year from 2021
// through 2050, by the anonymous Gregorian algorithm.
// Each answer is a [Month, Day] pair: easter(2024, [3, 31]) says that Easter
// 2024 fell on 31 March, and easter(2025, [4, 20]) on 20 April.
//
// Every step is exact integer arithmetic on the year (floordiv and mod). A
// backward rule computes one date, a backward in_range rule counts through the
// years, and one forward rule turns each year into an easter/2 conclusion.

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

// in_range(Low, High, N) gives each integer N from Low through High.
implied_by(in_range(Low, High, Low), le(Low, High))
implied_by(
  in_range(Low, High, N),
  [lt(Low, High), is(Next, add(Low, 1)), in_range(Next, High, N)],
)

implies([in_range(2021, 2050, Year), computus(Year, Date)], easter(Year, Date))
