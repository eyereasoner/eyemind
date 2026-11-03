// Two defaults that disagree about one person. In this fictional rulebook,
// Quakers are pacifists by default, and Republicans are nonpacifists. nixon
// is both a Quaker and a Republican; ada is only a Quaker. The rulebook gives
// the Republican rule priority: the pacifist default applies only when
// nothing concludes that the person is a nonpacifist.
//
// The result: nixon is classified as a Quaker, a Republican and a
// nonpacifist, but not as a pacifist; ada is classified as a Quaker and a
// pacifist. Group membership and the defaults are supplied assumptions, not
// claims about anyone's actual beliefs.
//
// It shows a default guarded by stratified negation: the pacifist rule reads
// not(nonpacifist(Person)), so eyemind runs it only after the nonpacifist
// rule has finished, and a default never fires before the contrary evidence
// is in.

fact(quaker('nixon'))
fact(republican('nixon'))
fact(quaker('ada'))

// The default, and the rule that overrides it. Being found a nonpacifist is
// positive evidence; not being found one only means none was concluded.
implies([quaker(Person), not(nonpacifist(Person))], pacifist(Person))
implies(republican(Person), nonpacifist(Person))

implies(quaker(Person), classification(Person, 'quaker'))
implies(republican(Person), classification(Person, 'republican'))
implies(pacifist(Person), classification(Person, 'pacifist'))
implies(nonpacifist(Person), classification(Person, 'nonpacifist'))

query(classification(Person, Class))
