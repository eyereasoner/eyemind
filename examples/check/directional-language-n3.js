// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl')))
rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')))

verdict('checked')
