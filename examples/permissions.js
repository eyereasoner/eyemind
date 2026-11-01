// Access control from roles: alice and carol are editors, who may read and
// write, and bob is a viewer, who may only read. carol is suspended. The
// program first derives the candidate permissions each role suggests, then
// keeps only those of users who are not suspended: alice may read and write,
// bob may read, and carol gets nothing.
//
// It shows negation as failure under the closed-world assumption: a user
// counts as unsuspended when no suspended fact for that user exists.

fact(role('alice', 'editor'))
fact(role('bob', 'viewer'))
fact(role('carol', 'editor'))
fact(permits('editor', 'read'))
fact(permits('editor', 'write'))
fact(permits('viewer', 'read'))
fact(suspended('carol'))
implies([role(User, Role), permits(Role, Action)], candidate(User, Action))
implies([candidate(User, Action), not(suspended(User))], allowed(User, Action))
query(allowed(User, Action))
