// A licensing rule based on how many dogs someone owns: an owner of more than
// four dogs needs a dog license. Alice owns five dogs and Bob two, so the
// program concludes that only Alice requires a license. The threshold is this
// example's own, not taken from any jurisdiction's rules.
//
// It shows counting with findall: all of an owner's dogs are collected into a
// list, whose length is the count the threshold is applied to.

fact(owns('alice', 'dog1'))
fact(owns('alice', 'dog2'))
fact(owns('alice', 'dog3'))
fact(owns('alice', 'dog4'))
fact(owns('alice', 'dog5'))
fact(owns('bob', 'dog6'))
fact(owns('bob', 'dog7'))
fact(owner('alice'))
fact(owner('bob'))
// The length of a list, counted recursively.
fact(length([], 0))
implied_by(length([_, ...Xs], N), [length(Xs, Before), is(N, add(Before, 1))])
implies(
  [owner(Owner), findall(Dog, owns(Owner, Dog), Dogs), length(Dogs, N)],
  dog_count(Owner, N),
)
implies([dog_count(Owner, N), gt(N, 4)], requires(Owner, 'dog_license'))
