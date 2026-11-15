// Conclusions: the facts the program derives, in the order derived.
dog_count('alice', 5)
dog_count('bob', 2)
requires('alice', 'dog_license')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(dog_count('alice', 5), clause(12), {Owner: 'alice', Dog: A, Dogs: ['dog1', 'dog2', 'dog3', 'dog4', 'dog5'], N: 5}, [owner('alice'), findall(A, owns('alice', A), ['dog1', 'dog2', 'dog3', 'dog4', 'dog5']), length(['dog1', 'dog2', 'dog3', 'dog4', 'dog5'], 5)])
step(dog_count('bob', 2), clause(12), {Owner: 'bob', Dog: A, Dogs: ['dog6', 'dog7'], N: 2}, [owner('bob'), findall(A, owns('bob', A), ['dog6', 'dog7']), length(['dog6', 'dog7'], 2)])
step(requires('alice', 'dog_license'), clause(13), {Owner: 'alice', N: 5}, [dog_count('alice', 5), gt(5, 4)])

// Certificate: the derived facts and every answer of each call the questions make.
derived(dog_count(B, C), [dog_count('alice', 5), dog_count('bob', 2)])
derived(requires(B, C), [requires('alice', 'dog_license')])
called(dog_count(A, B), [dog_count('alice', 5), dog_count('bob', 2)])
called(length(['dog1', 'dog2', 'dog3', 'dog4', 'dog5'], C), [length(['dog1', 'dog2', 'dog3', 'dog4', 'dog5'], 5)])
called(length(['dog2', 'dog3', 'dog4', 'dog5'], D), [length(['dog2', 'dog3', 'dog4', 'dog5'], 4)])
called(length(['dog3', 'dog4', 'dog5'], E), [length(['dog3', 'dog4', 'dog5'], 3)])
called(length(['dog4', 'dog5'], F), [length(['dog4', 'dog5'], 2)])
called(length(['dog5'], G), [length(['dog5'], 1)])
called(length([], H), [length([], 0)])
called(length(['dog6', 'dog7'], C), [length(['dog6', 'dog7'], 2)])
called(length(['dog7'], I), [length(['dog7'], 1)])
called(requires(J, 'dog_license'), [requires('alice', 'dog_license')])
