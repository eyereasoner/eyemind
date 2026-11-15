// Answers: each instance of a query() that holds.
result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob'))
result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara'))

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob')), clause(5), {Who: iri('https://example.org/family#bob')}, [rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob'))])
step(result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara')), clause(5), {Who: iri('https://example.org/family#cara')}, [rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara'))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(result(A, B, C), [result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob')), result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara'))])
called(result(A, B, C), [result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob')), result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara'))])
called(rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), D), [rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob')), rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara'))])
called(rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#parent'), E), [rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#parent'), iri('https://example.org/family#bob'))])
called(rdf(iri('https://example.org/family#bob'), iri('https://example.org/family#ancestor'), F), [rdf(iri('https://example.org/family#bob'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara'))])
called(rdf(iri('https://example.org/family#bob'), iri('https://example.org/family#parent'), G), [rdf(iri('https://example.org/family#bob'), iri('https://example.org/family#parent'), iri('https://example.org/family#cara'))])
called(rdf(iri('https://example.org/family#cara'), iri('https://example.org/family#ancestor'), H), [])
called(rdf(iri('https://example.org/family#cara'), iri('https://example.org/family#parent'), I), [])
