// Checked answers: these follow from the input program.
derivative('square', add(mul(num(1), sym('x')), mul(sym('x'), num(1))))
derivative('linear_plus_const', add(num(1), num(0)))
derivative('product', add(mul(add(num(1), num(0)), mul(add(pow(sym('x'), 2), num(2)), add(pow(sym('x'), 3), num(3)))), mul(add(sym('x'), num(1)), add(mul(add(mul(mul(num(2), pow(sym('x'), 1)), num(1)), num(0)), add(pow(sym('x'), 3), num(3))), mul(add(pow(sym('x'), 2), num(2)), add(mul(mul(num(3), pow(sym('x'), 2)), num(1)), num(0)))))))
derivative('nested_log', divide(divide(num(1), sym('x')), log(sym('x'))))
d(divide(sym('y'), sub(sym('x'), num(1))), 'x', divide(sub(mul(num(0), sub(sym('x'), num(1))), mul(sym('y'), sub(num(1), num(0)))), pow(sub(sym('x'), num(1)), 2)))

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 26)
condition('C2', 'well_founded', 'ok', 29)
condition('C3', 'justification', 'ok', 29)
condition('C4', 'coverage', 'ok', 38)
condition('C5', 're_decision', 'ok', 3)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 34)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(29)
verified(26)
recomputed(3)
composed(0)
trusted(0)
claims(5)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
