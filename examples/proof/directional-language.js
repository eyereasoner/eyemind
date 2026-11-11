// Conclusions: the facts the program derives, in the order derived.
rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl')))
rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('مرحبا', lang('ar', 'rtl')))))
clause(2, fact(rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('Welcome', lang('en', 'ltr')))))
clause(3, implies(rdf(S, iri('https://example.org/label'), Label), rdf(S, iri('https://example.org/displayLabel'), Label)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl'))), clause(3), {S: iri('https://example.org/welcome'), Label: literal('مرحبا', lang('ar', 'rtl'))}, [rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('مرحبا', lang('ar', 'rtl')))])
step(rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('مرحبا', lang('ar', 'rtl'))), clause(1), {}, [])
step(rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr'))), clause(3), {S: iri('https://example.org/welcome'), Label: literal('Welcome', lang('en', 'ltr'))}, [rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('Welcome', lang('en', 'ltr')))])
step(rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('Welcome', lang('en', 'ltr'))), clause(2), {}, [])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(rdf(A, B, C), [rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl'))), rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')))])
called(rdf(A, iri('https://example.org/displayLabel'), B), [rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl'))), rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')))])
called(rdf(C, iri('https://example.org/label'), D), [rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('مرحبا', lang('ar', 'rtl'))), rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('Welcome', lang('en', 'ltr')))])
