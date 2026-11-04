// Checked answers: these follow from the input program.
solution(0, 1, 0)
solution(1, 3, 2)
solution(5, 3363, 2378)
solution(8, 665857, 470832)
solution(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772)
equation_holds(0)
equation_holds(1)
equation_holds(5)
equation_holds(8)
equation_holds(50)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 66)
condition('C2', 'well_founded', 'ok', 271)
condition('C3', 'justification', 'ok', 271)
condition('C4', 'coverage', 'ok', 280)
condition('C5', 're_decision', 'ok', 205)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 281)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(271)
verified(66)
recomputed(205)
composed(0)
trusted(0)
claims(10)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
