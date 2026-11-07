// Checked answers: these follow from the input program.
provisional('ada', 'centrum')
provisional('bjorn', 'centrum')
provisional('clara', 'haga')
provisional('davi', 'centrum')
recommended('ada', 'lindholmen', 1800)
recommended('bjorn', 'backa', 2600)
recommended('clara', 'haga', 800)
recommended('davi', 'haga', 1600)
hidden_detour('ada', 3000)
hidden_detour('bjorn', 2000)
hidden_detour('clara', 150)
hidden_detour('davi', 1800)
audit_flag('ada', 'walking_limit_exceeded')
audit_flag('bjorn', 'walking_limit_exceeded')
audit_flag('davi', 'walking_limit_exceeded')
audit_flag('ada', 'assignment_differs')
audit_flag('bjorn', 'assignment_differs')
audit_flag('davi', 'assignment_differs')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 42)
condition('C2', 'well_founded', 'ok', 79)
condition('C3', 'justification', 'ok', 79)
condition('C4', 'coverage', 'ok', 118)
condition('C5', 're_decision', 'ok', 26)
condition('C6', 'boundary_consistency', 'ok', 11)
condition('C7', 'relevance', 'ok', 97)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(79)
verified(42)
recomputed(26)
composed(0)
trusted(0)
claims(18)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
