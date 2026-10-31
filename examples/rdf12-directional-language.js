// RDF 1.2 directional language strings: a welcome label in Arabic, written
// right to left, and in English, written left to right. A display rule turns
// every label into a display label and keeps the base direction, so a screen
// can lay out each text the right way.
//
// literal(Text, lang(Tag, Direction)) carries the direction 'ltr' or 'rtl';
// a rule that passes the literal on whole cannot lose it.

const ex = 'https://example.org/'

fact(
  rdf(iri(ex + 'welcome'), iri(ex + 'label'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph'),
  rdf(iri(ex + 'welcome'), iri(ex + 'label'), literal('Welcome', lang('en', 'ltr')), 'default_graph'),
)

// Every label is also a display label, with its language and direction.
implies(rdf(S, iri(ex + 'label'), Label, G), result_rdf(S, iri(ex + 'displayLabel'), Label, G))
query(result_rdf(S, P, O, G))
