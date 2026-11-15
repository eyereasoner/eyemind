// Conclusions: the facts the program derives, in the order derived.
t('bob', 'child_of', 'alice')
t('carol', 'child_of', 'alice')
allowed('carol')
children('alice', ['bob', 'carol'])

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(t('bob', 'child_of', 'alice'), clause(5), {P: 'alice', C: 'bob'}, [t('alice', 'parent_of', 'bob')])
step(t('alice', 'parent_of', 'bob'), clause(4), {S: 'alice', P: 'parent_of', O: 'bob'}, [base('alice', 'parent_of', 'bob')])
step(t('carol', 'child_of', 'alice'), clause(5), {P: 'alice', C: 'carol'}, [t('alice', 'parent_of', 'carol')])
step(t('alice', 'parent_of', 'carol'), clause(4), {S: 'alice', P: 'parent_of', O: 'carol'}, [base('alice', 'parent_of', 'carol')])
step(allowed('carol'), clause(6), {C: 'carol'}, [t('carol', 'child_of', 'alice'), not(t('carol', 'blocked', 'true'))])
step(children('alice', ['bob', 'carol']), clause(7), {P: 'alice', _0: 'bob', C: A, Children: ['bob', 'carol']}, [base('alice', 'parent_of', 'bob'), findall_sorted(A, t(A, 'child_of', 'alice'), ['bob', 'carol'])])

// Certificate: the derived facts and every answer of each call the questions make.
derived(t(B, C, D), [t('bob', 'child_of', 'alice'), t('carol', 'child_of', 'alice')])
derived(allowed(B), [allowed('carol')])
derived(children(B, C), [children('alice', ['bob', 'carol'])])
called(t(A, 'child_of', B), [t('bob', 'child_of', 'alice'), t('carol', 'child_of', 'alice')])
called(t(C, 'parent_of', D), [t('alice', 'parent_of', 'bob'), t('alice', 'parent_of', 'carol')])
called(allowed(E), [allowed('carol')])
called(t(F, 'child_of', 'alice'), [t('bob', 'child_of', 'alice'), t('carol', 'child_of', 'alice')])
called(t('bob', 'blocked', 'true'), [t('bob', 'blocked', 'true')])
called(t('carol', 'blocked', 'true'), [])
called(children(G, H), [children('alice', ['bob', 'carol'])])
