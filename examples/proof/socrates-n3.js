// Conclusions: the facts the program derives, in the order derived.
rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Mortal'))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Human'))))
clause(2, fact(rdf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), iri('http://example.org/socrates#Mortal'))))
clause(3, implies([rdf(S, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), A), rdf(A, iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), B)], rdf(S, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), B)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Mortal')), clause(3), {S: iri('http://example.org/socrates#Socrates'), A: iri('http://example.org/socrates#Human'), B: iri('http://example.org/socrates#Mortal')}, [rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Human')), rdf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), iri('http://example.org/socrates#Mortal'))])
step(rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Human')), clause(1), {}, [])
step(rdf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), iri('http://example.org/socrates#Mortal')), clause(2), {}, [])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
derived(rdf(A, B, C), [rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Mortal'))])
called(rdf(A, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), B), [rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Mortal')), rdf(iri('http://example.org/socrates#Socrates'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/socrates#Human'))])
called(rdf(iri('http://example.org/socrates#Mortal'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), C), [])
called(rdf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), C), [rdf(iri('http://example.org/socrates#Human'), iri('http://www.w3.org/2000/01/rdf-schema#subClassOf'), iri('http://example.org/socrates#Mortal'))])
