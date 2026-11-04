// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/sensor1'), iri('https://example.org/reportedBy'), iri('https://example.org/station7'), 'default_graph')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/sensorGraph'), iri('https://example.org/reportedBy'), iri('https://example.org/station7'), 'default_graph')))
clause(2, fact(rdf(iri('https://example.org/sensor1'), iri('https://example.org/temperature'), literal('21.5', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('https://example.org/sensorGraph'))))
clause(3, implies([rdf(iri('https://example.org/sensorGraph'), iri('https://example.org/reportedBy'), Station, 'default_graph'), rdf(S, iri('https://example.org/temperature'), _0, iri('https://example.org/sensorGraph'))], result_rdf(S, iri('https://example.org/reportedBy'), Station, 'default_graph')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(result_rdf(iri('https://example.org/sensor1'), iri('https://example.org/reportedBy'), iri('https://example.org/station7'), 'default_graph'), clause(3), {Station: iri('https://example.org/station7'), S: iri('https://example.org/sensor1'), _0: literal('21.5', datatype('http://www.w3.org/2001/XMLSchema#string'))}, [rdf(iri('https://example.org/sensorGraph'), iri('https://example.org/reportedBy'), iri('https://example.org/station7'), 'default_graph'), rdf(iri('https://example.org/sensor1'), iri('https://example.org/temperature'), literal('21.5', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('https://example.org/sensorGraph'))])
step(rdf(iri('https://example.org/sensorGraph'), iri('https://example.org/reportedBy'), iri('https://example.org/station7'), 'default_graph'), clause(1), {}, [])
step(rdf(iri('https://example.org/sensor1'), iri('https://example.org/temperature'), literal('21.5', datatype('http://www.w3.org/2001/XMLSchema#string')), iri('https://example.org/sensorGraph')), clause(2), {}, [])
