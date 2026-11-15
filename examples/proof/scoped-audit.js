// Conclusions: the facts the program derives, in the order derived.
consented('approved', 'alice')
needs_review('incomplete', 'bob')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(consented('approved', 'alice'), clause(6), {Context: 'approved', Graph: graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), Person: 'alice'}, [context('approved', graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')])), includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple('alice', 'consent', 'yes'))])
step(needs_review('incomplete', 'bob'), clause(7), {Context: 'incomplete', Graph: graph([triple('bob', 'role', 'editor')]), Person: 'bob'}, [context('incomplete', graph([triple('bob', 'role', 'editor')])), includes(graph([triple('bob', 'role', 'editor')]), triple('bob', 'role', 'editor')), not(includes(graph([triple('bob', 'role', 'editor')]), triple('bob', 'consent', 'yes')))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(consented(A, B), [consented('approved', 'alice')])
derived(needs_review(A, B), [needs_review('incomplete', 'bob')])
called(consented(A, B), [consented('approved', 'alice')])
called(includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple(C, 'consent', 'yes')), [includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple('alice', 'consent', 'yes'))])
called(member(triple(D, 'consent', 'yes'), [triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), [member(triple('alice', 'consent', 'yes'), [triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')])])
called(member(triple(E, 'consent', 'yes'), [triple('alice', 'consent', 'yes')]), [member(triple('alice', 'consent', 'yes'), [triple('alice', 'consent', 'yes')])])
called(member(triple(F, 'consent', 'yes'), []), [])
called(includes(graph([triple('bob', 'role', 'editor')]), triple(C, 'consent', 'yes')), [])
called(member(triple(G, 'consent', 'yes'), [triple('bob', 'role', 'editor')]), [])
called(needs_review(H, I), [needs_review('incomplete', 'bob')])
called(includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple(J, 'role', 'editor')), [includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple('alice', 'role', 'editor'))])
called(member(triple(K, 'role', 'editor'), [triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), [member(triple('alice', 'role', 'editor'), [triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')])])
called(member(triple(L, 'role', 'editor'), [triple('alice', 'consent', 'yes')]), [])
called(member(triple(M, 'role', 'editor'), []), [])
called(includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple('alice', 'consent', 'yes')), [includes(graph([triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), triple('alice', 'consent', 'yes'))])
called(member(triple('alice', 'consent', 'yes'), [triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')]), [member(triple('alice', 'consent', 'yes'), [triple('alice', 'role', 'editor'), triple('alice', 'consent', 'yes')])])
called(member(triple('alice', 'consent', 'yes'), [triple('alice', 'consent', 'yes')]), [member(triple('alice', 'consent', 'yes'), [triple('alice', 'consent', 'yes')])])
called(member(triple('alice', 'consent', 'yes'), []), [])
called(includes(graph([triple('bob', 'role', 'editor')]), triple(J, 'role', 'editor')), [includes(graph([triple('bob', 'role', 'editor')]), triple('bob', 'role', 'editor'))])
called(member(triple(N, 'role', 'editor'), [triple('bob', 'role', 'editor')]), [member(triple('bob', 'role', 'editor'), [triple('bob', 'role', 'editor')])])
called(includes(graph([triple('bob', 'role', 'editor')]), triple('bob', 'consent', 'yes')), [])
called(member(triple('bob', 'consent', 'yes'), [triple('bob', 'role', 'editor')]), [])
called(member(triple('bob', 'consent', 'yes'), []), [])
