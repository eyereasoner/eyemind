// Checked answers: these follow from the input program and are every answer of its questions.
inf(skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o1')]), iri('http://example.org/orders#billedTo'), iri('http://example.org/orders#alice'))
inf(skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o1')]), iri('http://example.org/orders#total'), 25)
inf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#invoice'), skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o1')]))
inf(skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o2')]), iri('http://example.org/orders#billedTo'), iri('http://example.org/orders#alice'))
inf(skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o2')]), iri('http://example.org/orders#total'), 25)
inf(iri('http://example.org/orders#o2'), iri('http://example.org/orders#invoice'), skolem(9, 'Bb1', [iri('http://example.org/orders#alice'), 25, iri('http://example.org/orders#o2')]))
inf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#customer'), iri('http://example.org/orders#alice'))
inf(iri('http://example.org/orders#o1'), iri('http://example.org/orders#amount'), 25)
inf(iri('http://example.org/orders#o2'), iri('http://example.org/orders#customer'), iri('http://example.org/orders#alice'))
inf(iri('http://example.org/orders#o2'), iri('http://example.org/orders#amount'), 25)

verdict('checked')
