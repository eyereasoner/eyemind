// An audit of editors' consent, where each statement is only true within the
// record it comes from. Two records are kept as quoted graphs, lists of
// triples held as data rather than asserted as facts: the 'approved' record
// says Alice is an editor and has consented; the 'incomplete' record says Bob
// is an editor and says nothing about consent. The program concludes that
// Alice consented within 'approved' and that Bob needs review within
// 'incomplete': a fact in one record never fills a gap in another.
// The review rule uses negation as failure, not(...), scoped to one graph:
// it asks whether that graph lacks a consent triple, not whether any is
// known anywhere.

fact(
  context(
    'approved',
    graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]),
  ),
)
fact(context('incomplete', graph([triple('bob', 'role', 'editor')])))
// List membership, and a triple's membership of a graph.
fact(member(X, [X, ..._]))
implied_by(member(X, [_, ...Xs]), member(X, Xs))
implied_by(includes(graph(Triples), Triple), member(Triple, Triples))
implies(
  [context(Context, Graph), includes(Graph, triple(Person, 'consent', 'yes'))],
  consented(Context, Person),
)
// An editor whose own graph records no consent needs review.
implies(
  [
    context(Context, Graph),
    includes(Graph, triple(Person, 'role', 'editor')),
    not(includes(Graph, triple(Person, 'consent', 'yes'))),
  ],
  needs_review(Context, Person),
)
