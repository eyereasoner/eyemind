// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('http://example.org/property-paths#alice'), iri('http://example.org/property-paths#grandparentOf'), iri('http://example.org/property-paths#carol'))
inf(iri('http://example.org/property-paths#bob'), iri('http://example.org/property-paths#hasParent'), iri('http://example.org/property-paths#alice'))
inf(iri('http://example.org/property-paths#carol'), iri('http://example.org/property-paths#hasParent'), iri('http://example.org/property-paths#bob'))
inf(iri('http://example.org/property-paths#alice'), iri('http://example.org/property-paths#parentOf'), iri('http://example.org/property-paths#bob'))
inf(iri('http://example.org/property-paths#bob'), iri('http://example.org/property-paths#parentOf'), iri('http://example.org/property-paths#carol'))

verdict('checked')
