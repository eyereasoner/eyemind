// Answers: each instance of a query() that holds.
result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob'))
result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara'))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#parent'), iri('https://example.org/family#bob'))))
clause(2, fact(rdf(iri('https://example.org/family#bob'), iri('https://example.org/family#parent'), iri('https://example.org/family#cara'))))
clause(3, implied_by(rdf(Person, iri('https://example.org/family#ancestor'), Descendant), rdf(Person, iri('https://example.org/family#parent'), Descendant)))
clause(4, implied_by(rdf(Person, iri('https://example.org/family#ancestor'), Descendant), [rdf(Person, iri('https://example.org/family#parent'), Child), rdf(Child, iri('https://example.org/family#ancestor'), Descendant)]))
clause(5, implies(rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), Who), result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), Who)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob')), clause(5), {Who: iri('https://example.org/family#bob')}, [rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob'))])
step(rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob')), clause(3), {Person: iri('https://example.org/family#ann'), Descendant: iri('https://example.org/family#bob')}, [rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#parent'), iri('https://example.org/family#bob'))])
step(rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#parent'), iri('https://example.org/family#bob')), clause(1), {}, [])
step(result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara')), clause(5), {Who: iri('https://example.org/family#cara')}, [rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara'))])
step(rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara')), clause(4), {Person: iri('https://example.org/family#ann'), Descendant: iri('https://example.org/family#cara'), Child: iri('https://example.org/family#bob')}, [rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#parent'), iri('https://example.org/family#bob')), rdf(iri('https://example.org/family#bob'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara'))])
step(rdf(iri('https://example.org/family#bob'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara')), clause(3), {Person: iri('https://example.org/family#bob'), Descendant: iri('https://example.org/family#cara')}, [rdf(iri('https://example.org/family#bob'), iri('https://example.org/family#parent'), iri('https://example.org/family#cara'))])
step(rdf(iri('https://example.org/family#bob'), iri('https://example.org/family#parent'), iri('https://example.org/family#cara')), clause(2), {}, [])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(result(A, B, C), [result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob')), result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara'))])
called(result(A, B, C), [result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob')), result(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara'))])
called(rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), D), [rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#bob')), rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara'))])
called(rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#parent'), E), [rdf(iri('https://example.org/family#ann'), iri('https://example.org/family#parent'), iri('https://example.org/family#bob'))])
called(rdf(iri('https://example.org/family#bob'), iri('https://example.org/family#ancestor'), F), [rdf(iri('https://example.org/family#bob'), iri('https://example.org/family#ancestor'), iri('https://example.org/family#cara'))])
called(rdf(iri('https://example.org/family#bob'), iri('https://example.org/family#parent'), G), [rdf(iri('https://example.org/family#bob'), iri('https://example.org/family#parent'), iri('https://example.org/family#cara'))])
called(rdf(iri('https://example.org/family#cara'), iri('https://example.org/family#ancestor'), H), [])
called(rdf(iri('https://example.org/family#cara'), iri('https://example.org/family#parent'), I), [])
