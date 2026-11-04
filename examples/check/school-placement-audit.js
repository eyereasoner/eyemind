// Answers checked subject to the obligations below.
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
condition('C1', 'resolution', 'ok', 31)
condition('C2', 'well_founded', 'ok', 57)
condition('C3', 'justification', 'ok', 57)
condition('C4', 'coverage', 'ok', 87)
condition('C5', 're_decision', 'ok', 15)
condition('C6', 'boundary_consistency', 'ok', 11)
condition('C7', 'relevance', 'ok', 75)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not(better_map_option('ada', 'centrum')))
obligation('absent', 'theory_scoped', not(better_map_option('bjorn', 'centrum')))
obligation('absent', 'theory_scoped', not(better_map_option('clara', 'haga')))
obligation('absent', 'theory_scoped', not(better_map_option('davi', 'centrum')))
obligation('absent', 'theory_scoped', not(better_route_option('ada', 'lindholmen')))
obligation('absent', 'theory_scoped', not(better_route_option('bjorn', 'backa')))
obligation('absent', 'theory_scoped', not(better_route_option('clara', 'haga')))
obligation('absent', 'theory_scoped', not(better_route_option('davi', 'haga')))
obligation('absent', 'theory_scoped', not(recommended('ada', 'centrum', A)))
obligation('absent', 'theory_scoped', not(recommended('bjorn', 'centrum', A)))
obligation('absent', 'theory_scoped', not(recommended('davi', 'centrum', A)))

// Proof statistics: recorded steps and how they were checked.
steps(57)
verified(31)
recomputed(15)
composed(0)
trusted(11)
claims(18)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
