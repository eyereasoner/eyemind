// Answers: each instance of a query() that holds.
result('example', 12)

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(result('example', 12), clause(14), {Name: 'example', Node: 'total', Value: 12}, [root('example', 'total'), value('total', 12)])

// Certificate: the derived facts and every answer of each call the questions make.
derived(result(A, B), [result('example', 12)])
called(result(A, B), [result('example', 12)])
called(value('total', C), [value('total', 12)])
called(value('product', D), [value('product', 6)])
called(value('n2', E), [value('n2', 2)])
called(value('n3', F), [value('n3', 3)])
called(calculate('mul', 2, 3, G), [calculate('mul', 2, 3, 6)])
called(value('difference', H), [value('difference', 6)])
called(value('n10', I), [value('n10', 10)])
called(value('n4', J), [value('n4', 4)])
called(calculate('sub', 10, 4, K), [calculate('sub', 10, 4, 6)])
called(calculate('add', 6, 6, L), [calculate('add', 6, 6, 12)])
