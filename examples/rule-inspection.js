// Rules can be examined as data without proving their premises.
// The answer reports the a-to-c rule with its shared variable intact.
// Rule inspection cites the source clause and excludes inspecting rules.

fact(a('b'))
implies(a(X), c(X))

implies(implies(X, Y), test(X, Y))
query(test(X, Y))
