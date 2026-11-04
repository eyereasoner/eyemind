// An online shop's website and mobile app both need checkout, which needs the
// product catalog and payment; payment needs the bank and a risk check. Both
// catalog servers and both bank connections are down. Which repairs restore
// checkout at the lowest cost? Of the 16 possible repair plans, the cheapest
// that works repairs the catalog replica and the bank backup, at cost 3, and
// restores ordering on both the website and the app.
//
// Forward rules work out what runs under each plan, where any one of several
// providers will do and a dependency cycle (payment needs the risk check, which
// can use payment) must not keep itself running; backward rules over lists
// build the plans and check every requirement, and a negation picks the
// cheapest. Costs are illustrative; repairs are proposed, not carried out.

// node(Name, HardwareState, RequiredProviderGroups): a node needs, for each
// group it requires, one provider of that group to be operating.
fact(node('catalog_primary', 'down', []), node('catalog_replica', 'down', []))
fact(node('bank_primary', 'down', []), node('bank_backup', 'down', []))
fact(node('risk_cache', 'up', []))
fact(node('risk_engine', 'up', ['risk_signal']))
fact(node('payment_service', 'up', ['bank', 'risk']))
fact(node('checkout_api', 'up', ['catalog', 'payment']))
fact(node('web_store', 'up', ['checkout']), node('mobile_app', 'up', ['checkout']))
fact(provider('catalog', 'catalog_primary'), provider('catalog', 'catalog_replica'))
fact(provider('bank', 'bank_primary'), provider('bank', 'bank_backup'))
fact(provider('risk', 'risk_engine'))
fact(provider('risk_signal', 'risk_cache'), provider('risk_signal', 'payment_service'))
fact(provider('payment', 'payment_service'), provider('checkout', 'checkout_api'))
fact(repair_candidates(['catalog_primary', 'catalog_replica', 'bank_primary', 'bank_backup']))
fact(repair_price('catalog_primary', 3), repair_price('catalog_replica', 2))
fact(repair_price('bank_primary', 4), repair_price('bank_backup', 1))
fact(critical_services(['web_store', 'mobile_app']))
fact(business_function('place_order', 'web_store'), business_function('mobile_checkout', 'mobile_app'))

fact(member(X, [X, ..._]))
implied_by(member(X, [_, ...Rest]), member(X, Rest))
// Every subset of the repair candidates is a plan, costing the sum of its
// repair prices.
fact(subset([], []))
implied_by(subset([X, ...Rest], [X, ...Chosen]), subset(Rest, Chosen))
implied_by(subset([_, ...Rest], Chosen), subset(Rest, Chosen))
fact(repair_cost([], 0))
implied_by(repair_cost([Node, ...Rest], Cost),
  [repair_price(Node, Own), repair_cost(Rest, Tail), is(Cost, add(Own, Tail))])
implies([repair_candidates(All), subset(All, Plan), repair_cost(Plan, Cost)], repair_plan(Plan, Cost))

// Under a plan, a node's hardware works when it is up or the plan repairs it.
implies([repair_plan(Plan, _), node(Node, 'up', _)], hardware_ready(Plan, Node))
implies([repair_plan(Plan, _), node(Node, 'down', _), member(Node, Plan)], hardware_ready(Plan, Node))
fact(all_groups([], _))
implied_by(all_groups([Group, ...Rest], Plan),
  [provider(Group, Node), operating(Plan, Node), all_groups(Rest, Plan)])

// A node operates when its hardware works and each group it needs has a
// provider operating. Forward rules derive only what is supported, so a cycle
// cannot start itself: the risk check needs the risk cache.
implies([hardware_ready(Plan, Node), node(Node, _, Groups), all_groups(Groups, Plan)], operating(Plan, Node))
fact(all_operating([], _))
implied_by(all_operating([Node, ...Rest], Plan), [operating(Plan, Node), all_operating(Rest, Plan)])
// A plan is feasible when every critical service operates, and best when no
// feasible plan is cheaper.
implies([repair_plan(Plan, Cost), critical_services(Required), all_operating(Required, Plan)],
  feasible_repair(Plan, Cost))
implied_by(cheaper_repair(Cost), [feasible_repair(_, Other), lt(Other, Cost)])
implies([feasible_repair(Plan, Cost), not(cheaper_repair(Cost))], best_repair(Plan, Cost))

// A function is affected when its node does not operate without repairs, and
// restored when it operates under the best plan.
implies([business_function(Function, Node), not(operating([], Node))], affected_function(Function))
implies([best_repair(Plan, _), business_function(Function, Node), operating(Plan, Node)], restored_function(Function))
query(affected_function(Function))
query(best_repair(Plan, Cost))
query(restored_function(Function))
