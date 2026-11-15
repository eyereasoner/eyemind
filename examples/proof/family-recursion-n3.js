// Answers: each instance of a query() that holds.
result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#bob'))
result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#cat'))
result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#dan'))

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#bob')), clause(6), {Who: iri('http://example.org/family#bob')}, [rdf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#bob'))])
step(result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#cat')), clause(6), {Who: iri('http://example.org/family#cat')}, [rdf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#cat'))])
step(result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#dan')), clause(6), {Who: iri('http://example.org/family#dan')}, [rdf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#dan'))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(result(A, B, C), [result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#bob')), result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#cat')), result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#dan'))])
called(result(A, B, C), [result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#bob')), result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#cat')), result(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#dan'))])
called(rdf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), D), [rdf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#bob')), rdf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#cat')), rdf(iri('http://example.org/family#ann'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#dan'))])
called(rdf(iri('http://example.org/family#ann'), iri('http://example.org/family#parent'), E), [rdf(iri('http://example.org/family#ann'), iri('http://example.org/family#parent'), iri('http://example.org/family#bob'))])
called(rdf(iri('http://example.org/family#bob'), iri('http://example.org/family#ancestor'), F), [rdf(iri('http://example.org/family#bob'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#cat')), rdf(iri('http://example.org/family#bob'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#dan'))])
called(rdf(iri('http://example.org/family#bob'), iri('http://example.org/family#parent'), G), [rdf(iri('http://example.org/family#bob'), iri('http://example.org/family#parent'), iri('http://example.org/family#cat'))])
called(rdf(iri('http://example.org/family#cat'), iri('http://example.org/family#ancestor'), H), [rdf(iri('http://example.org/family#cat'), iri('http://example.org/family#ancestor'), iri('http://example.org/family#dan'))])
called(rdf(iri('http://example.org/family#cat'), iri('http://example.org/family#parent'), I), [rdf(iri('http://example.org/family#cat'), iri('http://example.org/family#parent'), iri('http://example.org/family#dan'))])
called(rdf(iri('http://example.org/family#dan'), iri('http://example.org/family#ancestor'), J), [])
called(rdf(iri('http://example.org/family#dan'), iri('http://example.org/family#parent'), K), [])
