// Deep taxonomy: a classification 10000 levels deep. One individual, ind, is
// of class n0, and at every level K a member of class n(K-1) is also a member
// of three classes: nK, which continues the chain, and iK and jK, two siblings
// that lead nowhere. The program concludes type('ind', 'n10000'): reaching n10000
// means following the single productive branch the whole way down, one
// backward step per level, so it tests how deep goal-directed search and its
// proof can go. A JavaScript loop states the three rules of every level.

fact(type('ind', 'n0'))
for (let level = 1; level <= 10000; level++) {
  implied_by(type(X, `n${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `i${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `j${level}`), type(X, `n${level - 1}`))
}
query(type(X, 'n10000'))
