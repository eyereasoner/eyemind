// Answers checked subject to the obligations below.
colors('mapEU', [['Belgium', 'yellow'], ['Netherlands', 'green'], ['Luxemburg', 'green'], ['France', 'blue'], ['Germany', 'red'], ['Italy', 'red'], ['Denmark', 'green'], ['Ireland', 'red'], ['Greece', 'red'], ['Spain', 'green'], ['Portugal', 'red'], ['Austria', 'yellow'], ['Sweden', 'green'], ['Finland', 'red'], ['Cyprus', 'red'], ['Malta', 'red'], ['Poland', 'blue'], ['Hungary', 'blue'], ['Czech Republic', 'green'], ['Slovakia', 'red'], ['Slovenia', 'green'], ['Estonia', 'red'], ['Latvia', 'green'], ['Lithuania', 'red'], ['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']])

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 66)
condition('C2', 'well_founded', 'ok', 95)
condition('C3', 'justification', 'ok', 95)
condition('C4', 'coverage', 'ok', 118)
condition('C5', 're_decision', 'ok', 1)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 96)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 28)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection, original-call or all-answers evidence remains unproved.
obligation('call_fidelity', 'original_call', colors('mapEU', [['Belgium', 'yellow'], ['Netherlands', 'green'], ['Luxemburg', 'green'], ['France', 'blue'], ['Germany', 'red'], ['Italy', 'red'], ['Denmark', 'green'], ['Ireland', 'red'], ['Greece', 'red'], ['Spain', 'green'], ['Portugal', 'red'], ['Austria', 'yellow'], ['Sweden', 'green'], ['Finland', 'red'], ['Cyprus', 'red'], ['Malta', 'red'], ['Poland', 'blue'], ['Hungary', 'blue'], ['Czech Republic', 'green'], ['Slovakia', 'red'], ['Slovenia', 'green'], ['Estonia', 'red'], ['Latvia', 'green'], ['Lithuania', 'red'], ['Bulgaria', 'green'], ['Romania', 'red'], ['Croatia', 'red']]))
obligation('call_fidelity', 'all_answers', colors('mapEU', A))

// Proof statistics: recorded steps and how they were checked.
steps(95)
verified(66)
recomputed(0)
composed(1)
trusted(2)
claims(1)

// This verdict applies to the claims above; it does not establish that they are every answer.
verdict('checked_with_obligations')
