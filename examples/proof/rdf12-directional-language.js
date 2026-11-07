// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph')
result_rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')), 'default_graph')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph')))
clause(2, fact(rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('Welcome', lang('en', 'ltr')), 'default_graph')))
clause(3, implies(rdf(S, iri('https://example.org/label'), Label, G), result_rdf(S, iri('https://example.org/displayLabel'), Label, G)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(result_rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph'), clause(3), {S: iri('https://example.org/welcome'), Label: literal('مرحبا', lang('ar', 'rtl')), G: 'default_graph'}, [rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph')])
step(rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph'), clause(1), {}, [])
step(result_rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')), 'default_graph'), clause(3), {S: iri('https://example.org/welcome'), Label: literal('Welcome', lang('en', 'ltr')), G: 'default_graph'}, [rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('Welcome', lang('en', 'ltr')), 'default_graph')])
step(rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('Welcome', lang('en', 'ltr')), 'default_graph'), clause(2), {}, [])
