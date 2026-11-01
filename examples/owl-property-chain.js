// A relationship defined as a chain of others. Alice is Bob's parent, Bob is
// Carol's parent, and Carol is Dave's parent. A declaration, in the style of
// an OWL property chain, says that a grandparent link is a parent link
// followed by another parent link. Following the declared chain, the program
// concludes that Alice is Carol's grandparent and Bob is Dave's grandparent;
// Alice and Dave, three links apart, are not linked.
// The chain is a list of property names, ordinary data in the triples, so one
// forward rule serves every declared chain of any length: it starts with the
// first property and hands the rest of the list to a backward rule that walks
// it, one link per property. Only this kind of declaration is implemented,
// not the rest of OWL.

// grandparent is the chain parent, parent.
fact(property_chain('grandparent', ['parent', 'parent']))
fact(triple('alice', 'parent', 'bob'))
fact(triple('bob', 'parent', 'carol'))
fact(triple('carol', 'parent', 'dave'))

// A chained property links the start of its first link to the end of the
// rest of the chain.
implies(
  [property_chain(P, [First, ...Rest]), triple(S, First, M), follow_chain(Rest, M, E)],
  triple(S, P, E),
)
// follow_chain(Properties, Start, End): from Start, one link per property in
// turn reaches End. The list shrinks at each step, so the walk ends.
fact(follow_chain([], N, N))
implied_by(follow_chain([P, ...Rest], S, E), [triple(S, P, M), follow_chain(Rest, M, E)])

query(triple(Person, 'grandparent', Grandchild))
