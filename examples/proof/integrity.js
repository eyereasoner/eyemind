// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.
'false'

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step('false', clause(3), {Owner: 'bob', Balance: -5}, [account('bob', -5), lt(-5, 0)])
