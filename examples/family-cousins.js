// Finding cousins in a labelled family tree. Adam has two children, Bob and
// Carol; their children carry a branch label, 'b' for Bob's line and 'c' for
// Carol's. In this model two people are cousins when they are in the same
// generation and belong to different branches. This is a classification for
// the given tree, not a general calculation of cousin degree.
//
// Forward rules pass generation numbers and branch labels down the tree, and
// a third rule compares them, with not_unify to require different branches.
// The program concludes that Dave and Eve are cousins of Frank and Grace, and
// that Heidi and Ivan are cousins of Judy, each pair in both directions.

// parent(Parent, Child)
fact(parent('adam', 'bob'))
fact(parent('adam', 'carol'))
fact(parent('bob', 'dave'))
fact(parent('bob', 'eve'))
fact(parent('carol', 'frank'))
fact(parent('carol', 'grace'))
fact(parent('dave', 'heidi'))
fact(parent('eve', 'ivan'))
fact(parent('frank', 'judy'))
// Adam is generation 0; the branch labels start with the grandchildren.
fact(generation('adam', 0))
fact(branch('dave', 'b'))
fact(branch('eve', 'b'))
fact(branch('frank', 'c'))
fact(branch('grace', 'c'))
// A child is one generation below its parent and inherits its branch.
implies(
  [parent(Parent, Child), generation(Parent, N), is(Next, add(N, 1))],
  generation(Child, Next),
)
implies([parent(Parent, Child), branch(Parent, Branch)], branch(Child, Branch))
implies(
  [generation(X, N), generation(Y, N), branch(X, A), branch(Y, B), not_unify(A, B)],
  cousin(X, Y),
)
