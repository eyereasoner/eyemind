// Is a person older than a given age? This age checker uses an explicit
// reference date instead of the clock, so its answers and proofs stay
// reproducible. Pat was born on 21 August 1944, and the program concludes that
// on 1 October 2026 Pat is older than 80 years.
//
// Change as_of/1 or query age_above(Person, years(N), date(Y, M, D)).
// Thresholds are strictly exceeded: on the birthday that reaches the age, the
// person is exactly that age, not above it. A leap-day anniversary falls on
// February 28 in a non-leap year. days(N) instead measures exact elapsed whole
// days. The calendar is worked out by backward rules that turn each date into
// a day number, with exact integer arithmetic, so dates compare as numbers.

fact(birth_date('pat_h', date(1944, 8, 21)))
fact(as_of(date(2026, 10, 1)))

// Without an explicit date, the reference date as_of/1 is used.
implied_by(age_above(Person, Duration), [as_of(Date), age_above(Person, Duration, Date)])
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
implied_by(
  age_above(Person, days(Days), Date),
  [is_int(Days), ge(Days, 0), age_days(Person, Date, Age), gt(Age, Days)],
)
implied_by(
  age_days(Person, Date, Days),
  [
    birth_date(Person, Birth),
    date_day(Birth, Born),
    date_day(Date, Today),
    ge(Today, Born),
    is(Days, sub(Today, Born)),
  ],
)
// The date Years after a birth date, with the day clipped to the month's length.
implied_by(
  anniversary(date(Y, M, D), Years, date(Year, M, Day)),
  [is(Year, add(Y, Years)), month_days(Year, M, Maximum), is(Day, min(D, Maximum))],
)

// Proleptic Gregorian calendar; dates have integer years >= 1.
// date_day numbers the days from 1 January of year 1, which is day 1: the days
// of all earlier years (365 each, plus one per leap year), then the days of
// earlier months this year, one more after February in a leap year, and D.
implied_by(
  date_day(date(Y, M, D), Ordinal),
  [
    is_int(Y),
    is_int(M),
    is_int(D),
    ge(Y, 1),
    month_days(Y, M, Maximum),
    ge(D, 1),
    le(D, Maximum),
    month_offset(M, Offset),
    leap_extra(Y, M, Extra),
    is(Previous, sub(Y, 1)),
    is(
      Ordinal,
      add(
        add(
          add(
            add(
              sub(add(mul(365, Previous), floordiv(Previous, 4)), floordiv(Previous, 100)),
              floordiv(Previous, 400),
            ),
            Offset,
          ),
          Extra,
        ),
        D,
      ),
    ),
  ],
)
// Days in each month; February depends on the year.
implied_by(month_days(Y, 2, 29), leap_year(Y))
implied_by(month_days(Y, 2, 28), common_year(Y))
implied_by(month_days(_, M, Days), ordinary_month(M, Days))
fact(ordinary_month(1, 31))
fact(ordinary_month(3, 31))
fact(ordinary_month(4, 30))
fact(ordinary_month(5, 31))
fact(ordinary_month(6, 30))
fact(ordinary_month(7, 31))
fact(ordinary_month(8, 31))
fact(ordinary_month(9, 30))
fact(ordinary_month(10, 31))
fact(ordinary_month(11, 30))
fact(ordinary_month(12, 31))
// A leap year is divisible by 4, but not by 100 unless also by 400.
implied_by(leap_year(Y), eq(0, mod(Y, 400)))
implied_by(leap_year(Y), [eq(0, mod(Y, 4)), ne(0, mod(Y, 100))])
implied_by(common_year(Y), ne(0, mod(Y, 4)))
implied_by(common_year(Y), [eq(0, mod(Y, 100)), ne(0, mod(Y, 400))])
// The leap day counts only for dates after February.
implied_by(leap_extra(_, M, 0), le(M, 2))
implied_by(leap_extra(Y, M, 1), [gt(M, 2), leap_year(Y)])
implied_by(leap_extra(Y, M, 0), [gt(M, 2), common_year(Y)])
// Days before the first of each month in a common year.
fact(month_offset(1, 0))
fact(month_offset(2, 31))
fact(month_offset(3, 59))
fact(month_offset(4, 90))
fact(month_offset(5, 120))
fact(month_offset(6, 151))
fact(month_offset(7, 181))
fact(month_offset(8, 212))
fact(month_offset(9, 243))
fact(month_offset(10, 273))
fact(month_offset(11, 304))
fact(month_offset(12, 334))

query(age_above(Person, years(80)))
