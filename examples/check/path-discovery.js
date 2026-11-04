// Checked answers: these follow from the input program.
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Heraklion International Nikos Kazantzakis Airport', 'Václav Havel Airport Prague'])
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Diagoras Airport', 'Václav Havel Airport Prague'])
path_discovery('Ostend-Bruges International Airport', 'Václav Havel Airport Prague', 2, ['Ostend-Bruges International Airport', 'Liège Airport', 'Palma De Mallorca Airport', 'Václav Havel Airport Prague'])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 53)
condition('C2', 'well_founded', 'ok', 76)
condition('C3', 'justification', 'ok', 76)
condition('C4', 'coverage', 'ok', 110)
condition('C5', 're_decision', 'ok', 23)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 79)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(76)
verified(53)
recomputed(23)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
