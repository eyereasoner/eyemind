// Representing Semantic Web data with ordinary terms. IRIs, literals with a
// language tag, triples and quoted graphs (formulas) need no extra syntax or
// engine support: they are plain compound terms such as iri(...),
// literal('hello', lang('en')), triple(S, P, O) and graph([...]), and rules
// match them by unification like any other data.
// One quoted graph holding one triple is stored as data, not asserted. The
// program concludes found(...) for the triple inside it, and witness(...)
// for the graph. The witness rule's head has a variable W that its body
// never mentions, which states that something exists; eyecode names that
// something with a Skolem term, skolem(6, 'W', [...]), built from the rule's
// clause number (6), the variable's name and the graph it was made for.

fact(
  quoted(
    graph(
      [
        triple(
          iri('https://example.org/s'),
          iri('https://example.org/p'),
          literal('hello', lang('en')),
        ),
      ],
    ),
  ),
)
// List membership, and a triple's membership of a graph.
fact(member_of(X, [X, ..._]))
implied_by(member_of(X, [_, ...Xs]), member_of(X, Xs))
implied_by(includes(graph(Triples), Triple), member_of(Triple, Triples))
implies([quoted(G), includes(G, T)], found(T))
// W occurs only in the head: one fresh Skolem term per quoted graph.
implies(quoted(X), witness(X, W))
