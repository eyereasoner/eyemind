// Evaluating an arithmetic expression stored as a graph of named nodes.
// Literal nodes hold numbers; expression nodes name an operation (add, sub or
// mul) and their left and right child nodes. The sample expression is
// 2 * 3 + (10 - 4), and the program concludes result('example', 12).
//
// Backward rules evaluate a node by first evaluating its children, so the
// recursion follows the shape of the graph; a forward rule then asks for the
// value of the root node and records it as a result.

// the leaves: literal(Node, Number)
fact(literal('n2', 2))
fact(literal('n3', 3))
fact(literal('n10', 10))
fact(literal('n4', 4))
// the inner nodes: expression(Node, Operation, Left, Right)
fact(expression('product', 'mul', 'n2', 'n3'))
fact(expression('difference', 'sub', 'n10', 'n4'))
fact(expression('total', 'add', 'product', 'difference'))
fact(root('example', 'total'))

// A node's value is its literal, or its operation applied to its children's values.
implied_by(value(Node, Value), literal(Node, Value))
implied_by(
  value(Node, Value),
  [
    expression(Node, Operation, Left, Right),
    value(Left, L),
    value(Right, R),
    calculate(Operation, L, R, Value),
  ],
)
// One clause per operation name.
implied_by(calculate('add', L, R, Value), is(Value, add(L, R)))
implied_by(calculate('sub', L, R, Value), is(Value, sub(L, R)))
implied_by(calculate('mul', L, R, Value), is(Value, mul(L, R)))
implies([root(Name, Node), value(Node, Value)], result(Name, Value))
query(result(Name, Value))
