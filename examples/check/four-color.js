// Checked answers: these follow from the input program.
colors('mapEU', [['Belgium', 'yellow'], ['Netherlands', 'green'], ['Luxemburg', 'green'], ['France', 'blue'], ['Germany', 'red'], ['Italy', 'red'], ['Denmark', 'green'], ['Ireland', 'red'], ['Greece', 'red'], ['Spain', 'green'], ['Portugal', 'red'], ['Austria', 'yellow'], ['Sweden', 'green'], ['Finland', 'red'], ['Cyprus', 'red'], ['Malta', 'red'], ['Poland', 'blue'], ['Hungary', 'blue'], ['Czech Republic', 'green'], ['Slovakia', 'red'], ['Slovenia', 'green'], ['Estonia', 'red'], ['Latvia', 'green'], ['Lithuania', 'red'], ['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']])

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 381)
condition('C2', 'well_founded', 'ok', 442)
condition('C3', 'justification', 'ok', 442)
condition('C4', 'coverage', 'ok', 466)
condition('C5', 're_decision', 'ok', 30)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 443)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 31)
condition('C10', 'call_fidelity', 'ok', 2)

// Proof statistics: recorded steps and how they were checked.
steps(442)
verified(381)
recomputed(0)
composed(30)
trusted(0)
claims(1)

// This verdict also establishes that the claims above are every answer of the original questions.
verdict('checked')
