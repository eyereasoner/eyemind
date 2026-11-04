// Two unconditional backward rules supply class membership and a subclass.
// Together they let forward reasoning conclude that Socrates is mortal,
// then conclude a test fact. The generating conclusion is a conjunction.

implies('true', [
  implied_by(type('Socrates', 'Human'), 'true'),
  implied_by(subclass_of('Human', 'Mortal'), 'true'),
])

implies([type(S, A), subclass_of(A, B)], type(S, B))
implies(type('Socrates', 'Mortal'), t('test', 'is', 'true'))
