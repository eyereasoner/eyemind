// Conclusions: the facts the program derives, in the order derived.
subclass('cat', 'animal')
type('koko', 'animal')
type('koko', 'mammal')
triple('alice', 'related_to', 'bob')
type('alice', 'person')
type('bob', 'person')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(subclass('cat', 'animal'), clause(8), {A: 'cat', B: 'mammal', C: 'animal'}, [subclass('cat', 'mammal'), subclass('mammal', 'animal')])
step(subclass('cat', 'mammal'), clause(1), {}, [])
step(subclass('mammal', 'animal'), clause(2), {}, [])
step(type('koko', 'animal'), clause(9), {X: 'koko', A: 'cat', B: 'animal'}, [type('koko', 'cat'), subclass('cat', 'animal')])
step(type('koko', 'cat'), clause(6), {}, [])
step(type('koko', 'mammal'), clause(9), {X: 'koko', A: 'cat', B: 'mammal'}, [type('koko', 'cat'), subclass('cat', 'mammal')])
step(type('alice', 'person'), clause(11), {S: 'alice', P: 'parent_of', _0: 'bob', Class: 'person'}, [triple('alice', 'parent_of', 'bob'), domain('parent_of', 'person')])
step(triple('alice', 'parent_of', 'bob'), clause(7), {}, [])
step(type('bob', 'person'), clause(12), {_0: 'alice', P: 'parent_of', O: 'bob', Class: 'person'}, [triple('alice', 'parent_of', 'bob'), codomain('parent_of', 'person')])
step(triple('alice', 'related_to', 'bob'), clause(10), {S: 'alice', P: 'parent_of', O: 'bob', Q: 'related_to'}, [triple('alice', 'parent_of', 'bob'), subproperty('parent_of', 'related_to')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(subclass(A, B), [subclass('cat', 'animal')])
derived(type(A, B), [type('koko', 'animal'), type('koko', 'mammal'), type('alice', 'person'), type('bob', 'person')])
derived(triple(A, B, C), [triple('alice', 'related_to', 'bob')])
called(subclass(A, B), [subclass('cat', 'animal'), subclass('cat', 'mammal'), subclass('mammal', 'animal')])
called(subclass('animal', C), [])
called(subclass('mammal', C), [subclass('mammal', 'animal')])
called(type(D, E), [type('koko', 'animal'), type('koko', 'mammal'), type('alice', 'person'), type('bob', 'person'), type('koko', 'cat')])
called(subclass('person', F), [])
called(subclass('cat', F), [subclass('cat', 'animal'), subclass('cat', 'mammal')])
called(triple(G, H, _8), [triple('alice', 'related_to', 'bob'), triple('alice', 'parent_of', 'bob')])
called(triple(_9, K, L), [triple('alice', 'related_to', 'bob'), triple('alice', 'parent_of', 'bob')])
called(triple(M, N, O), [triple('alice', 'related_to', 'bob'), triple('alice', 'parent_of', 'bob')])
