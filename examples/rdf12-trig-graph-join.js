// A join across graphs: the default graph says which station reported the
// sensor graph, and the sensor graph holds a temperature reading. The rule
// joins the two and concludes, in the default graph, that the sensor's reading
// was reported by station 7.
//
// A graph's name is an IRI like any other, so data about a graph and data in
// that graph meet in one rule.

const ex = 'https://example.org/'
const xsd = 'http://www.w3.org/2001/XMLSchema#'

fact(
  rdf(iri(ex + 'sensorGraph'), iri(ex + 'reportedBy'), iri(ex + 'station7'), 'default_graph'),
  rdf(iri(ex + 'sensor1'), iri(ex + 'temperature'), literal('21.5', datatype(xsd + 'string')), iri(ex + 'sensorGraph')),
)

// Whoever reported a graph reported every sensor that has a reading in it.
implies(
  [
    rdf(iri(ex + 'sensorGraph'), iri(ex + 'reportedBy'), Station, 'default_graph'),
    rdf(S, iri(ex + 'temperature'), _, iri(ex + 'sensorGraph')),
  ],
  result_rdf(S, iri(ex + 'reportedBy'), Station, 'default_graph'),
)
query(result_rdf(S, P, O, G))
