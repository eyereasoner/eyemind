// Answers: each instance of a query() that holds.
inf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Mortal'))
inf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Human'))
inf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), iri('http://example.org/socrates#Mortal'))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Human'))))
clause(2, fact(inf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Human'))))
clause(3, fact(rdf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), iri('http://example.org/socrates#Mortal'))))
clause(4, fact(inf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), iri('http://example.org/socrates#Mortal'))))
clause(5, implies([rdf(X, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), Class), rdf(Class, iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), Super)], [rdf(X, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), Super), inf(X, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), Super)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(inf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Mortal')), clause(5), {X: iri('http://example.org/socrates#Socrates'), Class: iri('http://example.org/socrates#Human'), Super: iri('http://example.org/socrates#Mortal')}, [rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Human')), rdf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), iri('http://example.org/socrates#Mortal'))])
step(rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Human')), clause(1), {}, [])
step(rdf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), iri('http://example.org/socrates#Mortal')), clause(3), {}, [])
step(inf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Human')), clause(2), {}, [])
step(inf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), iri('http://example.org/socrates#Mortal')), clause(4), {}, [])
step(rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Mortal')), clause(5), {X: iri('http://example.org/socrates#Socrates'), Class: iri('http://example.org/socrates#Human'), Super: iri('http://example.org/socrates#Mortal')}, [rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Human')), rdf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), iri('http://example.org/socrates#Mortal'))])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(inf(A, B, C), [inf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Mortal'))])
derived(rdf(A, B, C), [rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Mortal'))])
called(inf(A, B, C), [inf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Mortal')), inf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Human')), inf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), iri('http://example.org/socrates#Mortal'))])
called(rdf(D, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), E), [rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Mortal')), rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Human'))])
called(rdf(iri('http://example.org/socrates#Mortal'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), F), [])
called(rdf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), F), [rdf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), iri('http://example.org/socrates#Mortal'))])
