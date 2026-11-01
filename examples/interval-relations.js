// Comparing time intervals: for every pair of intervals, say whether one is
// before the other, meets it at an endpoint, overlaps it, starts it, falls
// during it, finishes it, or equals it, and give each relation's converse
// (after, met_by, overlapped_by, started_by, contains, finished_by). These are
// the thirteen relations of Allen's interval algebra.
//
// Intervals are half-open, [Start, End): they include their start and exclude
// their end, so adjacent intervals meet without overlapping. Times are integer
// minutes. Most intervals are given by start and end; i is given by its start
// and duration and j by its end and duration, and forward rules compute their
// missing endpoint. For example, f [600, 660) starts a [600, 720), a meets
// c [720, 840), and h [540, 960) contains every interval from a to g. Every
// interval equals itself, and a equals e.

// interval(Name, Start, End)
fact(interval('a', 600, 720))
fact(interval('b', 780, 900))
fact(interval('c', 720, 840))
fact(interval('d', 660, 780))
fact(interval('e', 600, 720))
fact(interval('f', 600, 660))
fact(interval('g', 660, 720))
fact(interval('h', 540, 960))
fact(start_duration('i', 960, 120))
fact(end_duration('j', 960, 60))
// start_duration(Name, Start, Duration) and end_duration(Name, End, Duration)
implies([start_duration(I, S, D), gt(D, 0), is(E, add(S, D))], interval(I, S, E))
implies([end_duration(I, E, D), gt(D, 0), is(S, sub(E, D))], interval(I, S, E))
// Only nonempty intervals take part, and every ordered pair of them is compared.
implied_by(valid_interval(I, S, E), [interval(I, S, E), lt(S, E)])
implied_by(pair(I, J, SI, EI, SJ, EJ), [valid_interval(I, SI, EI), valid_interval(J, SJ, EJ)])
// the seven basic relations of I to J
implies([pair(I, J, SI, EI, SJ, EJ), lt(EI, SJ)], relation(I, 'before', J))
implies([pair(I, J, SI, EI, SJ, EJ), eq(EI, SJ)], relation(I, 'meets', J))
implies(
  [pair(I, J, SI, EI, SJ, EJ), lt(SI, SJ), lt(SJ, EI), lt(EI, EJ)],
  relation(I, 'overlaps', J),
)
implies([pair(I, J, SI, EI, SJ, EJ), eq(SI, SJ), lt(EI, EJ)], relation(I, 'starts', J))
implies([pair(I, J, SI, EI, SJ, EJ), lt(SJ, SI), lt(EI, EJ)], relation(I, 'during', J))
implies([pair(I, J, SI, EI, SJ, EJ), lt(SJ, SI), eq(EI, EJ)], relation(I, 'finishes', J))
implies([pair(I, J, SI, EI, SJ, EJ), eq(SI, SJ), eq(EI, EJ)], relation(I, 'equals', J))
// and their converses
implies(relation(I, 'before', J), relation(J, 'after', I))
implies(relation(I, 'meets', J), relation(J, 'met_by', I))
implies(relation(I, 'overlaps', J), relation(J, 'overlapped_by', I))
implies(relation(I, 'starts', J), relation(J, 'started_by', I))
implies(relation(I, 'during', J), relation(J, 'contains', I))
implies(relation(I, 'finishes', J), relation(J, 'finished_by', I))
query(relation(I, Relation, J))
