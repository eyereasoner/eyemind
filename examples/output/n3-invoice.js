// Conclusions: the facts the program derives, in the order derived.
rdf(iri('https://example.org/invoice#invoice1'), iri('https://example.org/invoice#total'), 245)
rdf(iri('https://example.org/invoice#invoice2'), iri('https://example.org/invoice#total'), 25)
rdf(iri('https://example.org/invoice#invoice3'), iri('https://example.org/invoice#total'), 0)
rdf(iri('https://example.org/invoice#invoice1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('https://example.org/invoice#LargeInvoice'))
