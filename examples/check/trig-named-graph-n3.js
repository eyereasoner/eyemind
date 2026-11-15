// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('https://example.org/family'), iri('https://eyereasoner.github.io/eyemind/graph#content'), graph([rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/bob'))]))
rdf(iri('https://example.org/family'), iri('https://eyereasoner.github.io/eyemind/graph#content'), graph([rdf(iri('https://example.org/bob'), iri('https://example.org/ancestor'), iri('https://example.org/carol'))]))
rdf(iri('https://example.org/family'), iri('https://eyereasoner.github.io/eyemind/graph#content'), graph([rdf(iri('https://example.org/alice'), iri('https://example.org/ancestor'), iri('https://example.org/carol'))]))

verdict('checked')
