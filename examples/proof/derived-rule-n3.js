// Conclusions: the facts the program derives, in the order derived.
rdf(graph([rdf(qvar('x'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/policy#Member'))]), iri('http://www.w3.org/2000/10/swap/log#implies'), graph([rdf(qvar('x'), iri('http://example.org/policy#mayRead'), iri('http://example.org/policy#report'))]))
rdf(iri('http://example.org/policy#alice'), iri('http://example.org/policy#mayRead'), iri('http://example.org/policy#report'))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('http://example.org/policy#policy'), iri('http://example.org/policy#status'), iri('http://example.org/policy#active'))))
clause(2, fact(rdf(iri('http://example.org/policy#alice'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/policy#Member'))))
clause(3, implies(rdf(iri('http://example.org/policy#policy'), iri('http://example.org/policy#status'), iri('http://example.org/policy#active')), [implies(rdf(X, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/policy#Member')), rdf(X, iri('http://example.org/policy#mayRead'), iri('http://example.org/policy#report'))), rdf(graph([rdf(qvar('x'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/policy#Member'))]), iri('http://www.w3.org/2000/10/swap/log#implies'), graph([rdf(qvar('x'), iri('http://example.org/policy#mayRead'), iri('http://example.org/policy#report'))]))]))
clause(4, implies([rdf(iri('http://example.org/policy#policy'), iri('http://example.org/policy#status'), iri('http://example.org/policy#active')), rdf(X, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/policy#Member'))], rdf(X, iri('http://example.org/policy#mayRead'), iri('http://example.org/policy#report'))))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(rdf(graph([rdf(qvar('x'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/policy#Member'))]), iri('http://www.w3.org/2000/10/swap/log#implies'), graph([rdf(qvar('x'), iri('http://example.org/policy#mayRead'), iri('http://example.org/policy#report'))])), clause(3), {}, [rdf(iri('http://example.org/policy#policy'), iri('http://example.org/policy#status'), iri('http://example.org/policy#active'))])
step(rdf(iri('http://example.org/policy#policy'), iri('http://example.org/policy#status'), iri('http://example.org/policy#active')), clause(1), {}, [])
step(rdf(iri('http://example.org/policy#alice'), iri('http://example.org/policy#mayRead'), iri('http://example.org/policy#report')), clause(4), {X: iri('http://example.org/policy#alice')}, [rdf(iri('http://example.org/policy#policy'), iri('http://example.org/policy#status'), iri('http://example.org/policy#active')), rdf(iri('http://example.org/policy#alice'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/policy#Member'))])
step(rdf(iri('http://example.org/policy#alice'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/policy#Member')), clause(2), {}, [])
