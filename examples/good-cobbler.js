// Keeping a description tied to a trade. A good cobbler is good at cobbling,
// not good in general, so each description is a structured pair [Quality,
// Trade] rather than a separate "good" property of the person. Joe is a good
// cobbler, Jane a good carpenter, and Sam a novice cobbler.
//
// Two forward rules look inside the description. Whatever the quality, the
// trade classifies the person, so Joe and Sam are cobblers and Jane is a
// carpenter. Only the quality 'good' makes someone good at a trade, and only
// at that trade: Joe at cobbling and Jane at carpentry, but not Sam, and
// nobody is concluded to be good in general.

fact(description('joe', ['good', 'cobbler']))
fact(description('jane', ['good', 'carpenter']))
fact(description('sam', ['novice', 'cobbler']))
// Any quality: a novice cobbler is still a cobbler.
implies(description(Person, [_, Trade]), classified_as(Person, Trade))
// Only 'good', and only for the trade it describes.
implies(description(Person, ['good', Trade]), good_at(Person, Trade))
query(good_at(Person, Trade))
query(classified_as(Person, Trade))
