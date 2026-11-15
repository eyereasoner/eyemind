// Answers: each instance of a query() that holds.
invoice(28)

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(invoice(28), clause(7), {Amount: A, _0: B, Amounts: [6, 10, 12], Total: 28}, [findall_sorted(A, line_total(B, A), [6, 10, 12]), sum([6, 10, 12], 28)])
step(line_total('apple', 6), clause(4), {Name: 'apple', Quantity: 3, Price: 2, Total: 6}, [item('apple', 3, 2), is(6, mul(3, 2))])
step(line_total('pear', 12), clause(4), {Name: 'pear', Quantity: 4, Price: 3, Total: 12}, [item('pear', 4, 3), is(12, mul(4, 3))])
step(line_total('plum', 10), clause(4), {Name: 'plum', Quantity: 2, Price: 5, Total: 10}, [item('plum', 2, 5), is(10, mul(2, 5))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(invoice(C), [invoice(28)])
derived(line_total(C, D), [line_total('apple', 6), line_total('pear', 12), line_total('plum', 10)])
called(invoice(A), [invoice(28)])
called(line_total(_1, C), [line_total('apple', 6), line_total('pear', 12), line_total('plum', 10)])
called(sum([6, 10, 12], D), [sum([6, 10, 12], 28)])
called(sum([10, 12], E), [sum([10, 12], 22)])
called(sum([12], F), [sum([12], 12)])
called(sum([], G), [sum([], 0)])
