// Conflicting RDF 1.2 annotated claims: the transport authority says the
// bridge is closed, with confidence 98, and an anonymous post says it is
// open, with confidence 35. Each claim is a reifier of its status triple, and
// each source has a trust score. The claims are ranked by confidence times
// trust, and the top claim decides, but only when its score reaches 8000:
// the authority's 9310 does, so the decision is to avoid the bridge.
//
// Numbers in RDF are typed literals whose value is text; number_chars reads
// '98' as the integer 98, and spells a computed score back as text.

const ex = 'https://example.org/'
const reifies = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'
const integer = 'http://www.w3.org/2001/XMLSchema#integer'
const bridgeStatus = (status) => triple(iri(ex + 'bridge'), iri(ex + 'status'), iri(ex + status))

fact(
  rdf(iri(ex + 'bridge'), iri(ex + 'status'), iri(ex + 'closed'), 'default_graph'),
  rdf(iri(ex + 'authorityClaim'), iri(reifies), bridgeStatus('closed'), 'default_graph'),
  rdf(iri(ex + 'authorityClaim'), iri(ex + 'assertedBy'), iri(ex + 'transportAuthority'), 'default_graph'),
  rdf(iri(ex + 'authorityClaim'), iri(ex + 'confidence'), literal('98', datatype(integer)), 'default_graph'),
  rdf(iri(ex + 'bridge'), iri(ex + 'status'), iri(ex + 'open'), 'default_graph'),
  rdf(iri(ex + 'socialClaim'), iri(reifies), bridgeStatus('open'), 'default_graph'),
  rdf(iri(ex + 'socialClaim'), iri(ex + 'assertedBy'), iri(ex + 'anonymousPost'), 'default_graph'),
  rdf(iri(ex + 'socialClaim'), iri(ex + 'confidence'), literal('35', datatype(integer)), 'default_graph'),
  rdf(iri(ex + 'transportAuthority'), iri(ex + 'trustScore'), literal('95', datatype(integer)), 'default_graph'),
  rdf(iri(ex + 'anonymousPost'), iri(ex + 'trustScore'), literal('20', datatype(integer)), 'default_graph'),
)

// The value of an integer literal, and an integer written as a literal.
implied_by(integer_value(literal(Text, datatype(integer)), N), [atom_chars(Text, Chars), number_chars(N, Chars)])
implied_by(integer_literal(N, literal(Text, datatype(integer))), [number_chars(N, Chars), atom_chars(Text, Chars)])

// A claim: an asserted status, a reifier of it with its source, and a score.
implies(
  [
    rdf(iri(ex + 'bridge'), iri(ex + 'status'), Status, 'default_graph'),
    rdf(Reifier, iri(reifies), triple(iri(ex + 'bridge'), iri(ex + 'status'), Status), 'default_graph'),
    rdf(Reifier, iri(ex + 'assertedBy'), Source, 'default_graph'),
    rdf(Reifier, iri(ex + 'confidence'), Confidence, 'default_graph'),
    integer_value(Confidence, C),
    rdf(Source, iri(ex + 'trustScore'), Trust, 'default_graph'),
    integer_value(Trust, T),
    is(Score, mul(C, T)),
  ],
  claim(Status, Source, Score),
)

// A claim's rank is one more than the number of claims that score higher.
implied_by(higher(Score, Other), [claim(_, _, Other), gt(Other, Score)])
fact(count([], 0))
implied_by(count([_, ...Rest], N), [count(Rest, Before), is(N, add(Before, 1))])
implies(
  [claim(Status, Source, Score), findall(Other, higher(Score, Other), Higher), count(Higher, Count), is(Rank, add(Count, 1))],
  ranked(Rank, Status, Source, Score),
)

// The top claim decides when its score reaches the threshold; otherwise the
// bridge has to be checked by hand.
fact(threshold(8000))
fact(status_action(iri(ex + 'closed'), 'avoid_bridge'), status_action(iri(ex + 'open'), 'cross_bridge'))
implies(
  [ranked(1, Status, Source, Score), threshold(Limit), ge(Score, Limit), status_action(Status, Action)],
  decision(Action, Source, Score),
)
implies(
  [ranked(1, _, _, Score), threshold(Limit), lt(Score, Limit)],
  decision('verify_manually', iri(ex + 'noTrustedSource'), Score),
)

// The decision and the ranked evidence as RDF.
implies(
  [decision(Action, Source, Score), atom_concat(ex, Action, ActionIri), integer_literal(Score, ScoreText)],
  [
    result_rdf(iri(ex + 'bridge'), iri(ex + 'decision'), iri(ActionIri), 'default_graph'),
    result_rdf(iri(ex + 'bridge'), iri(ex + 'trustedSource'), Source, 'default_graph'),
    result_rdf(iri(ex + 'bridge'), iri(ex + 'score'), ScoreText, 'default_graph'),
  ],
)
implies(
  [ranked(Rank, Status, Source, Score), integer_literal(Rank, RankText), integer_literal(Score, ScoreText)],
  [
    result_rdf(Status, iri(ex + 'rank'), RankText, 'default_graph'),
    result_rdf(Status, iri(ex + 'assertedBy'), Source, 'default_graph'),
    result_rdf(Status, iri(ex + 'score'), ScoreText, 'default_graph'),
  ],
)
query(result_rdf(S, P, O, G))
