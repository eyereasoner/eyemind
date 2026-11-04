// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.
'false'

// Clauses: the program clauses the steps cite, by clause number.
clause(2, fact(account('bob', -5)))
clause(3, contradiction(account(Owner, Balance), lt(Balance, 0)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step('false', clause(3), {Owner: 'bob', Balance: -5}, [account('bob', -5), lt(-5, 0)])
step(account('bob', -5), clause(2), {}, [])
step(lt(-5, 0), 'builtin', {}, [])
