// Answers: each instance of a query() that holds.
derivative('square', add(mul(num(1), sym('x')), mul(sym('x'), num(1))))
derivative('linear_plus_const', add(num(1), num(0)))
derivative('product', add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0)))))))
derivative('nested_log', divide(divide(num(1), sym('x')), log(sym('x'))))
d(divide(sym('y'), sub(sym('x'), num(1))), 'x', divide(sub(mul(num(0), sub(sym('x'), num(1))), mul(sym('y'), sub(num(1), num(0)))), pow(sub(sym('x'), num(1)), 2)))
