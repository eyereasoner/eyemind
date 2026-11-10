// Deciding between conflicting reports about a bridge, stated in RDF, the web's
// data format: every fact is a triple of subject, property and value, named
// by web addresses (IRIs) or given as text values (literals), here written
// rdf(Subject, Property, Value, Graph). The transport authority says the
// bridge is closed, with confidence 98, and an anonymous post says it is
// open, with confidence 35. Each report is a reifier, a node that stands for
// the status triple it is about and carries its source and confidence (a
// feature of RDF 1.2), and each source has a trust score.
//
// The claims are ranked by confidence times trust, and the top claim decides,
// but only when its score reaches 8000: the authority's 9310 does, against
// the post's 700, so the decision, written back as RDF, is to avoid the
// bridge. The Turtle input supplies integer confidence and trust scores.
// The rules rank the claims with findall and write the decision as RDF.

const ex = 'https://example.org/'
const reifies = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'
const integer = 'http://www.w3.org/2001/XMLSchema#integer'

// Write a computed integer as a typed RDF literal.
implied_by(integer_literal(N, literal(Text, datatype(integer))), [number_chars(N, Chars), atom_chars(Text, Chars)])

// A claim: an asserted status, a reifier of it with its source, and a score.
implies(
  [
    rdf(iri(ex + 'bridge'), iri(ex + 'status'), Status, 'default_graph'),
    rdf(Reifier, iri(reifies), triple(iri(ex + 'bridge'), iri(ex + 'status'), Status), 'default_graph'),
    rdf(Reifier, iri(ex + 'assertedBy'), Source, 'default_graph'),
    rdf(Reifier, iri(ex + 'confidence'), Confidence, 'default_graph'),
    is_int(Confidence),
    rdf(Source, iri(ex + 'trustScore'), Trust, 'default_graph'),
    is_int(Trust),
    is(Score, mul(Confidence, Trust)),
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
