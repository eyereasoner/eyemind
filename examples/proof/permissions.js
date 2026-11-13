// Answers: each instance of a query() that holds.
allowed('alice', 'read')
allowed('alice', 'write')
allowed('bob', 'read')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(role('alice', 'editor')))
clause(2, fact(role('bob', 'viewer')))
clause(3, fact(role('carol', 'editor')))
clause(4, fact(permits('editor', 'read')))
clause(5, fact(permits('editor', 'write')))
clause(6, fact(permits('viewer', 'read')))
clause(8, implies([role(User, Role), permits(Role, Action)], candidate(User, Action)))
clause(9, implies([candidate(User, Action), not(suspended(User))], allowed(User, Action)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(allowed('alice', 'read'), clause(9), {User: 'alice', Action: 'read'}, [candidate('alice', 'read'), not(suspended('alice'))])
step(candidate('alice', 'read'), clause(8), {User: 'alice', Role: 'editor', Action: 'read'}, [role('alice', 'editor'), permits('editor', 'read')])
step(role('alice', 'editor'), clause(1), {}, [])
step(permits('editor', 'read'), clause(4), {}, [])
step(not(suspended('alice')), 'absent', {}, [])
step(allowed('alice', 'write'), clause(9), {User: 'alice', Action: 'write'}, [candidate('alice', 'write'), not(suspended('alice'))])
step(candidate('alice', 'write'), clause(8), {User: 'alice', Role: 'editor', Action: 'write'}, [role('alice', 'editor'), permits('editor', 'write')])
step(permits('editor', 'write'), clause(5), {}, [])
step(allowed('bob', 'read'), clause(9), {User: 'bob', Action: 'read'}, [candidate('bob', 'read'), not(suspended('bob'))])
step(candidate('bob', 'read'), clause(8), {User: 'bob', Role: 'viewer', Action: 'read'}, [role('bob', 'viewer'), permits('viewer', 'read')])
step(role('bob', 'viewer'), clause(2), {}, [])
step(permits('viewer', 'read'), clause(6), {}, [])
step(not(suspended('bob')), 'absent', {}, [])
step(candidate('carol', 'read'), clause(8), {User: 'carol', Role: 'editor', Action: 'read'}, [role('carol', 'editor'), permits('editor', 'read')])
step(role('carol', 'editor'), clause(3), {}, [])
step(candidate('carol', 'write'), clause(8), {User: 'carol', Role: 'editor', Action: 'write'}, [role('carol', 'editor'), permits('editor', 'write')])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(allowed(A, B), [allowed('alice', 'read'), allowed('alice', 'write'), allowed('bob', 'read')])
derived(candidate(A, B), [candidate('alice', 'read'), candidate('alice', 'write'), candidate('bob', 'read'), candidate('carol', 'read'), candidate('carol', 'write')])
called(allowed(A, B), [allowed('alice', 'read'), allowed('alice', 'write'), allowed('bob', 'read')])
called(candidate(C, D), [candidate('alice', 'read'), candidate('alice', 'write'), candidate('bob', 'read'), candidate('carol', 'read'), candidate('carol', 'write')])
