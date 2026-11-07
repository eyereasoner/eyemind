// Checked answers: these follow from the input program.
colors('mapEU', [['Belgium', 'yellow'], ['Netherlands', 'green'], ['Luxemburg', 'green'], ['France', 'blue'], ['Germany', 'red'], ['Italy', 'red'], ['Denmark', 'green'], ['Ireland', 'red'], ['Greece', 'red'], ['Spain', 'green'], ['Portugal', 'red'], ['Austria', 'yellow'], ['Sweden', 'green'], ['Finland', 'red'], ['Cyprus', 'red'], ['Malta', 'red'], ['Poland', 'blue'], ['Hungary', 'blue'], ['Czech Republic', 'green'], ['Slovakia', 'red'], ['Slovenia', 'green'], ['Estonia', 'red'], ['Latvia', 'green'], ['Lithuania', 'red'], ['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']])

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 66)
condition('C2', 'well_founded', 'ok', 95)
condition('C3', 'justification', 'ok', 95)
condition('C4', 'coverage', 'ok', 118)
condition('C5', 're_decision', 'ok', 1)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 96)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 28)

// Proof statistics: recorded steps and how they were checked.
steps(95)
verified(66)
recomputed(0)
composed(1)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
