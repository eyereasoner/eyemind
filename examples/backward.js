// Forward and backward reasoning in one program. A forward rule concludes
// that 5 is indeed more interesting than 3, provided its body holds. That body
// is not a stored fact: more_interesting/2 is defined by a backward rule, which
// the forward rule calls like a subroutine, and which in turn tests the
// arithmetic comparison gt(5, 3). The program concludes
// indeed_more_interesting(5, 3).

implied_by(more_interesting(X, Y), gt(X, Y))
implies(more_interesting(5, 3), indeed_more_interesting(5, 3))
