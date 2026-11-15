// Answers: each instance of a query() that holds.
allowed('alice', 'read')
allowed('alice', 'write')
allowed('bob', 'read')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(allowed('alice', 'read'), clause(9), {User: 'alice', Action: 'read'}, [candidate('alice', 'read'), not(suspended('alice'))])
step(candidate('alice', 'read'), clause(8), {User: 'alice', Role: 'editor', Action: 'read'}, [role('alice', 'editor'), permits('editor', 'read')])
step(allowed('alice', 'write'), clause(9), {User: 'alice', Action: 'write'}, [candidate('alice', 'write'), not(suspended('alice'))])
step(candidate('alice', 'write'), clause(8), {User: 'alice', Role: 'editor', Action: 'write'}, [role('alice', 'editor'), permits('editor', 'write')])
step(allowed('bob', 'read'), clause(9), {User: 'bob', Action: 'read'}, [candidate('bob', 'read'), not(suspended('bob'))])
step(candidate('bob', 'read'), clause(8), {User: 'bob', Role: 'viewer', Action: 'read'}, [role('bob', 'viewer'), permits('viewer', 'read')])
step(candidate('carol', 'read'), clause(8), {User: 'carol', Role: 'editor', Action: 'read'}, [role('carol', 'editor'), permits('editor', 'read')])
step(candidate('carol', 'write'), clause(8), {User: 'carol', Role: 'editor', Action: 'write'}, [role('carol', 'editor'), permits('editor', 'write')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(allowed(A, B), [allowed('alice', 'read'), allowed('alice', 'write'), allowed('bob', 'read')])
derived(candidate(A, B), [candidate('alice', 'read'), candidate('alice', 'write'), candidate('bob', 'read'), candidate('carol', 'read'), candidate('carol', 'write')])
called(allowed(A, B), [allowed('alice', 'read'), allowed('alice', 'write'), allowed('bob', 'read')])
called(candidate(C, D), [candidate('alice', 'read'), candidate('alice', 'write'), candidate('bob', 'read'), candidate('carol', 'read'), candidate('carol', 'write')])
