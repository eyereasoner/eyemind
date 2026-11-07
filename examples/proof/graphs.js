// Conclusions: the facts the program derives, in the order derived.
t('bob', 'child_of', 'alice')
t('carol', 'child_of', 'alice')
allowed('carol')
children('alice', ['bob', 'carol'])

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(base('alice', 'parent_of', 'bob')))
clause(2, fact(base('alice', 'parent_of', 'carol')))
clause(4, implied_by(t(S, P, O), base(S, P, O)))
clause(5, implies(t(P, 'parent_of', C), t(C, 'child_of', P)))
clause(6, implies([t(C, 'child_of', 'alice'), not(t(C, 'blocked', 'true'))], allowed(C)))
clause(7, implies([base(P, 'parent_of', _0), findall(C, t(C, 'child_of', P), Children)], children(P, Children)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(t('bob', 'child_of', 'alice'), clause(5), {P: 'alice', C: 'bob'}, [t('alice', 'parent_of', 'bob')])
step(t('alice', 'parent_of', 'bob'), clause(4), {S: 'alice', P: 'parent_of', O: 'bob'}, [base('alice', 'parent_of', 'bob')])
step(base('alice', 'parent_of', 'bob'), clause(1), {}, [])
step(t('carol', 'child_of', 'alice'), clause(5), {P: 'alice', C: 'carol'}, [t('alice', 'parent_of', 'carol')])
step(t('alice', 'parent_of', 'carol'), clause(4), {S: 'alice', P: 'parent_of', O: 'carol'}, [base('alice', 'parent_of', 'carol')])
step(base('alice', 'parent_of', 'carol'), clause(2), {}, [])
step(allowed('carol'), clause(6), {C: 'carol'}, [t('carol', 'child_of', 'alice'), not(t('carol', 'blocked', 'true'))])
step(not(t('carol', 'blocked', 'true')), 'absent', {}, [])
step(children('alice', ['bob', 'carol']), clause(7), {P: 'alice', _0: 'bob', C: A, Children: ['bob', 'carol']}, [base('alice', 'parent_of', 'bob'), findall(A, t(A, 'child_of', 'alice'), ['bob', 'carol'])])
step(findall(A, t(A, 'child_of', 'alice'), ['bob', 'carol']), 'collected', {}, [])

// Search certificate: every fact derived for each relation the searches behind
// negations and collections consult, and every answer of each call they made, in order.
derived(t(B, C, D), [t('bob', 'child_of', 'alice'), t('carol', 'child_of', 'alice')])
searched(t('carol', 'blocked', 'true'), [])
searched(t(E, 'parent_of', F), [t('alice', 'parent_of', 'bob'), t('alice', 'parent_of', 'carol')])
