// Checked answers: these follow from the input program.
type_answer('id', fun('t0', 't0'))
type_answer('const', fun('t0', fun('t1', 't0')))
type_answer('apply_id', 'int')
type_answer('compose', fun(fun('t1', 't2'), fun(fun('t0', 't1'), fun('t0', 't2'))))
type_answer('branch', 'int')
type_answer('first_of_pair', 'bool')
type_reason('compose', 'application unifies f with t1 -> t2 and g with t0 -> t1')
type_reason('apply_id', 'the identity function\'s parameter type is unified with int')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 49)
condition('C2', 'well_founded', 'ok', 53)
condition('C3', 'justification', 'ok', 53)
condition('C4', 'coverage', 'ok', 57)
condition('C5', 're_decision', 'ok', 4)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 61)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(53)
verified(49)
recomputed(4)
composed(0)
trusted(0)
claims(8)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
