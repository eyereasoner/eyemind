// Checked answers: these follow from the input program and are every answer of its questions.
result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#bob'))
result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#cat'))
result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#dan'))

verdict('checked')
