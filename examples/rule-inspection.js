// Reading a rule as data. The program has a fact a('b') and a forward rule
// saying a(X) implies c(X). A second rule has implies(X, Y) as its premise:
// in a premise, implies does not prove anything, it looks up the forward rules
// written in the program and binds X and Y to a rule's premise and conclusion.
// The query answers test(a(A), c(A)): the variable the two parts share stays
// shared. The proof cites the inspected rule, and a rule that inspects rules
// is never itself among the rules it can find.

fact(a('b'))
implies(a(X), c(X))

implies(implies(X, Y), test(X, Y))
query(test(X, Y))
