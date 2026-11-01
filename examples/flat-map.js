// Looking up one property for a list of subjects and joining all the values
// found into one list. Data is stored as triples t(Subject, Predicate,
// Object); a subject may have several values (s3 has two), one, or none.
//
// For each subject, findall collects every matching object, possibly none,
// and append joins the per-subject lists in order. The first query gives
// ['o1', 'o2', 'o3', 'o4']; an unknown subject or an unused predicate gives
// the empty list rather than failing.

fact(t('s1', 'p1', 'o1'))
fact(t('s2', 'p1', 'o2'))
fact(t('s3', 'p1', 'o3'))
fact(t('s3', 'p1', 'o4'))
// append(Xs, Ys, Zs): Zs is Xs followed by Ys.
fact(append([], Ys, Ys))
implied_by(append([X, ...Xs], Ys, [X, ...Zs]), append(Xs, Ys, Zs))
// flat_map(Subjects, Predicate, Objects)
fact(flat_map([], _, []))
implied_by(
  flat_map([S, ...Subjects], P, Objects),
  [findall(O, t(S, P, O), Here), flat_map(Subjects, P, Rest), append(Here, Rest, Objects)],
)
query(flat_map(['s1', 's2', 's3'], 'p1', Objects))
query(flat_map(['missing'], 'p1', Objects))
query(flat_map(['s1'], 'p2', Objects))
