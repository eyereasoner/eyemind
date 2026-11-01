// Ways to travel from Paris: a train to Brussels and a bus to Lille. A route
// is either one, so route/2 has two alternative clauses.
//
// The program shows three ways to express a choice. Asking for a route from
// Paris finds both destinations, one answer per clause. or(A, B) succeeds when
// either goal holds; here both do. once(Goal) keeps only the first answer, the
// train to Brussels, because the train clause comes first.

fact(train('paris', 'brussels'))
fact(bus('paris', 'lille'))
// Two alternative clauses: a route is a train or a bus connection.
implied_by(route(From, To), train(From, To))
implied_by(route(From, To), bus(From, To))
query(route('paris', To))
query(or(train('paris', 'brussels'), bus('paris', 'lille')))
query(once(route('paris', To)))
