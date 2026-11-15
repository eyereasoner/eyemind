// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#bob'))
inf(iri('http://example.org/family#bob'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#cid'))
inf(iri('http://example.org/family#cid'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#dee'))
inf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#cid'))
inf(iri('http://example.org/family#bob'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#dee'))
inf(iri('http://example.org/family#ann'), iri('http://example.org/family#parentOf'), iri('http://example.org/family#bob'))
inf(iri('http://example.org/family#bob'), iri('http://example.org/family#parentOf'), iri('http://example.org/family#cid'))
inf(iri('http://example.org/family#cid'), iri('http://example.org/family#parentOf'), iri('http://example.org/family#dee'))
inf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestorOf'), iri('http://example.org/family#dee'))

verdict('checked')
