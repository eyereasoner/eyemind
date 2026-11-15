// Conclusions: the facts the program derives, in the order derived.
rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl')))
rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')))

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl'))), clause(3), {S: iri('https://example.org/welcome'), Label: literal('مرحبا', lang('ar', 'rtl'))}, [rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('مرحبا', lang('ar', 'rtl')))])
step(rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('مرحبا', lang('ar', 'rtl'))), clause(1), {}, [])
step(rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr'))), clause(3), {S: iri('https://example.org/welcome'), Label: literal('Welcome', lang('en', 'ltr'))}, [rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('Welcome', lang('en', 'ltr')))])
step(rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('Welcome', lang('en', 'ltr'))), clause(2), {}, [])

// Certificate: the derived facts and every answer of each call the questions make.
derived(rdf(A, B, C), [rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl'))), rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')))])
called(rdf(A, iri('https://example.org/displayLabel'), B), [rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl'))), rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')))])
called(rdf(C, iri('https://example.org/label'), D), [rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('مرحبا', lang('ar', 'rtl'))), rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('Welcome', lang('en', 'ltr')))])
