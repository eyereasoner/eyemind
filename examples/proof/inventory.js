// Answers: each instance of a query() that holds.
invoice(28)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(item('apple', 3, 2)))
clause(2, fact(item('pear', 4, 3)))
clause(3, fact(item('plum', 2, 5)))
clause(4, implies([item(Name, Quantity, Price), is(Total, mul(Quantity, Price))], line_total(Name, Total)))
clause(5, fact(sum([], 0)))
clause(6, implied_by(sum([X, ...Xs], Total), [sum(Xs, Rest), is(Total, add(X, Rest))]))
clause(7, implies([findall_sorted(Amount, line_total(_0, Amount), Amounts), sum(Amounts, Total)], invoice(Total)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(invoice(28), clause(7), {Amount: A, _0: B, Amounts: [6, 10, 12], Total: 28}, [findall_sorted(A, line_total(B, A), [6, 10, 12]), sum([6, 10, 12], 28)])
step(findall_sorted(A, line_total(B, A), [6, 10, 12]), 'collected', {}, [])
step(sum([6, 10, 12], 28), clause(6), {X: 6, Xs: [10, 12], Total: 28, Rest: 22}, [sum([10, 12], 22), is(28, add(6, 22))])
step(sum([10, 12], 22), clause(6), {X: 10, Xs: [12], Total: 22, Rest: 12}, [sum([12], 12), is(22, add(10, 12))])
step(sum([12], 12), clause(6), {X: 12, Xs: [], Total: 12, Rest: 0}, [sum([], 0), is(12, add(12, 0))])
step(sum([], 0), clause(5), {}, [])
step(is(12, add(12, 0)), 'builtin', {}, [])
step(is(22, add(10, 12)), 'builtin', {}, [])
step(is(28, add(6, 22)), 'builtin', {}, [])
step(line_total('apple', 6), clause(4), {Name: 'apple', Quantity: 3, Price: 2, Total: 6}, [item('apple', 3, 2), is(6, mul(3, 2))])
step(item('apple', 3, 2), clause(1), {}, [])
step(is(6, mul(3, 2)), 'builtin', {}, [])
step(line_total('pear', 12), clause(4), {Name: 'pear', Quantity: 4, Price: 3, Total: 12}, [item('pear', 4, 3), is(12, mul(4, 3))])
step(item('pear', 4, 3), clause(2), {}, [])
step(is(12, mul(4, 3)), 'builtin', {}, [])
step(line_total('plum', 10), clause(4), {Name: 'plum', Quantity: 2, Price: 5, Total: 10}, [item('plum', 2, 5), is(10, mul(2, 5))])
step(item('plum', 2, 5), clause(3), {}, [])
step(is(10, mul(2, 5)), 'builtin', {}, [])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(line_total(C, D), [line_total('apple', 6), line_total('pear', 12), line_total('plum', 10)])
derived(invoice(C), [invoice(28)])
searched(line_total(E, F), [line_total('apple', 6), line_total('pear', 12), line_total('plum', 10)])
called(invoice(A), [invoice(28)])
called(line_total(_1, C), [line_total('apple', 6), line_total('pear', 12), line_total('plum', 10)])
called(sum([6, 10, 12], D), [sum([6, 10, 12], 28)])
called(sum([10, 12], E), [sum([10, 12], 22)])
called(sum([12], F), [sum([12], 12)])
called(sum([], G), [sum([], 0)])
