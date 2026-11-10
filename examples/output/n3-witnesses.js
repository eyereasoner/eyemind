// Conclusions: the facts the program derives, in the order derived.
rdf(iri('https://example.org/delivery#order1'), iri('https://example.org/delivery#delivery'), skolem(3, 'Bdelivery', [iri('https://example.org/delivery#order1')]))
rdf(skolem(3, 'Bdelivery', [iri('https://example.org/delivery#order1')]), iri('https://example.org/delivery#status'), iri('https://example.org/delivery#ready'))
rdf(iri('https://example.org/delivery#order2'), iri('https://example.org/delivery#delivery'), skolem(3, 'Bdelivery', [iri('https://example.org/delivery#order2')]))
rdf(skolem(3, 'Bdelivery', [iri('https://example.org/delivery#order2')]), iri('https://example.org/delivery#status'), iri('https://example.org/delivery#ready'))
