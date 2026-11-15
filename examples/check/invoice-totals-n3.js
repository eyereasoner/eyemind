// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('http://example.org/invoice#inv1'), iri('http://example.org/invoice#total'), 245)
rdf(iri('http://example.org/invoice#inv2'), iri('http://example.org/invoice#total'), 25)
rdf(iri('http://example.org/invoice#inv1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/invoice#LargeInvoice'))

verdict('checked')
