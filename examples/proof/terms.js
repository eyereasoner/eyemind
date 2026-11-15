// Conclusions: the facts the program derives, in the order derived.
found(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))))
witness(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])]))

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(found(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))), clause(5), {G: graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), T: triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))}, [quoted(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])), includes(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))))])
step(witness(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])])), clause(6), {X: graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), W: skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])])}, [quoted(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(found(A), [found(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))))])
derived(witness(A, B), [witness(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])]))])
called(found(A), [found(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))))])
called(includes(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), B), [includes(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))))])
called(member_of(C, [triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), [member_of(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))), [triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])])
called(member_of(D, []), [])
called(witness(E, F), [witness(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])]))])
