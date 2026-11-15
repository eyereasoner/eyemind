// Conclusions: the facts the program derives, in the order derived.
rdf(iri('http://example.org/bob'), iri('http://example.org/beloved'), bnode('n3', 'y'))
rdf(iri('http://example.org/liz'), iri('http://example.org/beloved'), bnode('n3', 'y'))

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(rdf(iri('http://example.org/bob'), iri('http://example.org/beloved'), bnode('n3', 'y')), clause(2), {Beloved: bnode('n3', 'y')}, [rdf(iri('http://example.org/bob'), iri('http://example.org/loves'), bnode('n3', 'y'))])
step(rdf(iri('http://example.org/bob'), iri('http://example.org/loves'), bnode('n3', 'y')), clause(1), {X: iri('http://example.org/bob')}, ['true'])
step(rdf(iri('http://example.org/liz'), iri('http://example.org/beloved'), bnode('n3', 'y')), clause(3), {Beloved: bnode('n3', 'y')}, [rdf(iri('http://example.org/liz'), iri('http://example.org/loves'), bnode('n3', 'y'))])
step(rdf(iri('http://example.org/liz'), iri('http://example.org/loves'), bnode('n3', 'y')), clause(1), {X: iri('http://example.org/liz')}, ['true'])

// Certificate: the derived facts and every answer of each call the questions make.
derived(rdf(A, B, C), [rdf(iri('http://example.org/bob'), iri('http://example.org/beloved'), bnode('n3', 'y')), rdf(iri('http://example.org/liz'), iri('http://example.org/beloved'), bnode('n3', 'y'))])
called(rdf(iri('http://example.org/bob'), iri('http://example.org/beloved'), A), [rdf(iri('http://example.org/bob'), iri('http://example.org/beloved'), bnode('n3', 'y'))])
called(rdf(iri('http://example.org/bob'), iri('http://example.org/loves'), B), [rdf(iri('http://example.org/bob'), iri('http://example.org/loves'), bnode('n3', 'y'))])
called(rdf(iri('http://example.org/liz'), iri('http://example.org/loves'), C), [rdf(iri('http://example.org/liz'), iri('http://example.org/loves'), bnode('n3', 'y'))])
called(rdf(iri('http://example.org/liz'), iri('http://example.org/beloved'), D), [rdf(iri('http://example.org/liz'), iri('http://example.org/beloved'), bnode('n3', 'y'))])
