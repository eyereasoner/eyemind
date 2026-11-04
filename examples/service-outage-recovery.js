// An online shop has lost its catalog and bank providers. Which repairs
// restore checkout for the website and mobile app at the lowest cost?
// The cheapest plan repairs the catalog replica and bank backup, costing 3.
// Forward availability rules handle alternative providers and a dependency
// cycle; backward list rules test all requirements of each of 16 repair plans.
// Costs and availability are illustrative. Repairs are proposed, not executed.

// node(Name, HardwareState, RequiredProviderGroups)
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
fact(subset([], []))
implied_by(subset([X, ...Rest], [X, ...Chosen]), subset(Rest, Chosen))
implied_by(subset([_, ...Rest], Chosen), subset(Rest, Chosen))
fact(repair_cost([], 0))
implied_by(repair_cost([Node, ...Rest], Cost),
  [repair_price(Node, Own), repair_cost(Rest, Tail), is(Cost, add(Own, Tail))])
implies([repair_candidates(All), subset(All, Plan), repair_cost(Plan, Cost)], repair_plan(Plan, Cost))

implies([repair_plan(Plan, _), node(Node, 'up', _)], hardware_ready(Plan, Node))
implies([repair_plan(Plan, _), node(Node, 'down', _), member(Node, Plan)], hardware_ready(Plan, Node))
fact(all_groups([], _))
implied_by(all_groups([Group, ...Rest], Plan),
  [provider(Group, Node), operating(Plan, Node), all_groups(Rest, Plan)])

// Only supported availability is derived: a cycle cannot start itself.
implies([hardware_ready(Plan, Node), node(Node, _, Groups), all_groups(Groups, Plan)], operating(Plan, Node))
fact(all_operating([], _))
implied_by(all_operating([Node, ...Rest], Plan), [operating(Plan, Node), all_operating(Rest, Plan)])
implies([repair_plan(Plan, Cost), critical_services(Required), all_operating(Required, Plan)],
  feasible_repair(Plan, Cost))
implied_by(cheaper_repair(Cost), [feasible_repair(_, Other), lt(Other, Cost)])
implies([feasible_repair(Plan, Cost), not(cheaper_repair(Cost))], best_repair(Plan, Cost))

implies([business_function(Function, Node), not(operating([], Node))], affected_function(Function))
implies([best_repair(Plan, _), business_function(Function, Node), operating(Plan, Node)], restored_function(Function))
query(affected_function(Function))
query(best_repair(Plan, Cost))
query(restored_function(Function))
