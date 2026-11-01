// Combining stored data with derived data in one view. base/3 holds triples
// of immutable external data: Alice is the parent of Bob and Carol, and Bob
// is blocked. t/3 is the union view: every base triple, plus the triples the
// rules derive, here the child_of triple for each parent_of triple.
//
// The program concludes that Bob and Carol are children of Alice, that only
// Carol is allowed (not(...) excludes the blocked Bob), and, with findall,
// that Alice's children are ['bob', 'carol'].

fact(base('alice', 'parent_of', 'bob'))
fact(base('alice', 'parent_of', 'carol'))
fact(base('bob', 'blocked', 'true'))
// Every base triple is also a t triple.
implied_by(t(S, P, O), base(S, P, O))
implies(t(P, 'parent_of', C), t(C, 'child_of', P))
implies([t(C, 'child_of', 'alice'), not(t(C, 'blocked', 'true'))], allowed(C))
implies(
  [base(P, 'parent_of', _), findall(C, t(C, 'child_of', P), Children)],
  children(P, Children),
)
