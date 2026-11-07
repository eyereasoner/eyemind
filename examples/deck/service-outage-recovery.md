# Restoring checkout after an outage

*Choose repairs from their effects on business functions.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/service-outage-recovery.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/service-outage-recovery.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/service-outage-recovery.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/service-outage-recovery.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=service-outage-recovery)

---

## The question

An online shop sells through a website and a mobile app. Both need the
checkout service. Checkout needs the product catalog and the payment
service; payment needs a bank connection and a risk check (is this payment
fraudulent?). The risk check needs a risk signal, which comes from a risk
cache or from the payment service itself.

```text
website ─┐
         ├─▶ checkout ─▶ catalog (primary or replica)
app ─────┘       │
                 └─▶ payment ─▶ bank (primary or backup)
                         └────▶ risk check ─▶ risk cache, or payment
```

Both catalog servers and both bank connections are down. Repairing them
costs 3 (catalog primary), 2 (catalog replica), 4 (bank primary) and 1 (bank
backup), in made-up cost units.

**Which repairs bring ordering back on both the website and the app at the
lowest cost?**

---

## What we tell eyemind

The situation, as facts (two per line where two are given):

```js
// node(Name, HardwareState, RequiredProviderGroups)
fact(node('catalog_primary', 'down', []), node('catalog_replica', 'down', []))
fact(node('bank_primary', 'down', []), node('bank_backup', 'down', []))
fact(node('risk_cache', 'up', []))
fact(node('risk_engine', 'up', ['risk_signal']))
fact(node('payment_service', 'up', ['bank', 'risk']))
fact(node('checkout_api', 'up', ['catalog', 'payment']))
fact(node('web_store', 'up', ['checkout']), node('mobile_app', 'up', ['checkout']))
fact(provider('catalog', 'catalog_primary'), provider('catalog', 'catalog_replica'))
// … the other providers, the repair candidates and prices, the two
// critical services and the two business functions (facts 13–27)
```

Each `node` is a part of the system with its hardware state and the
*groups* of services it needs. Each `provider` fact says which node can serve
a group. A group needs only *one* working provider, so the two catalog
servers are alternatives, not both required. One `fact(...)` may hold
several facts; they are numbered 1 to 27 in order.

Then the reasoning, in clauses 28 to 47. In outline:

- **Plans.** Every subset of the four repair candidates is a plan, 16 in all,
  costing the sum of its prices (`subset`, `repair_cost`, rule 35).
- **What runs.** Under a plan, a node's hardware works if it is up or the
  plan repairs it (rules 36 and 37). A node *operates* when its hardware
  works and each group it needs has an operating provider (rules 39 and 40).
- **The best plan.** A plan is *feasible* when both critical services
  operate (rule 43). It is *best* when it is feasible and
  `not(cheaper_repair(Cost))`: no feasible plan is cheaper (rules 44 and 45).
- **Effects.** A business function is *affected* when its node does not
  operate with no repairs, `not(operating([], Node))`, and *restored* when it
  operates under the best plan (rules 46 and 47).

`implies(premise, conclusion)` is a **forward rule**: whenever the premise
holds, eyemind adds the conclusion to what it knows. `implied_by(conclusion,
conditions)` is a **backward rule**, used on demand. Capitalized names are
**variables**, blanks to fill; a lone `_` is a blank nobody cares about.
`not(...)` means "this cannot be found": **negation as failure**, which
treats the program as the whole truth.

The risk check and payment depend on each other. Forward rules only derive
what is already supported, so this circle cannot switch itself on: the risk
cache has to supply the first risk signal.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
affected_function('place_order')
affected_function('mobile_checkout')
best_repair(['catalog_replica', 'bank_backup'], 3)
restored_function('place_order')
restored_function('mobile_checkout')
```

Before any repair, ordering on the website (`'place_order'`) and on the app
(`'mobile_checkout'`) is down. The cheapest plan that works repairs the
catalog replica and the bank backup, for 2 + 1 = 3, and it restores both.
The repairs are proposed, not carried out.

Why the plan works:

1. Repairing the replica provides the catalog.
2. Repairing the backup provides the bank.
3. The working risk cache supplies the risk signal, so the risk check runs.
4. Payment, then checkout, then the website and the app can operate.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The full proof has
494 steps and a search certificate of 377 `searched` lines; see the
[proof file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/service-outage-recovery.js).
Below are its claims, its clauses, and the complete chain of 61 steps behind
the main answer, `best_repair(['catalog_replica', 'bank_backup'], 3)`. The
`// …` lines mark the 6 steps for the two affected functions and the 2 for
the restored ones, then the 425 steps behind the certificate, and all but
a few lines of the certificate itself.

```js
// Answers: each instance of a query() that holds.
affected_function('place_order')
affected_function('mobile_checkout')
best_repair(['catalog_replica', 'bank_backup'], 3)
restored_function('place_order')
restored_function('mobile_checkout')

// Clauses: the program clauses the steps cite, by clause number.
clause(2, fact(node('catalog_replica', 'down', [])))
clause(4, fact(node('bank_backup', 'down', [])))
clause(5, fact(node('risk_cache', 'up', [])))
clause(6, fact(node('risk_engine', 'up', ['risk_signal'])))
clause(7, fact(node('payment_service', 'up', ['bank', 'risk'])))
clause(8, fact(node('checkout_api', 'up', ['catalog', 'payment'])))
clause(9, fact(node('web_store', 'up', ['checkout'])))
clause(10, fact(node('mobile_app', 'up', ['checkout'])))
clause(12, fact(provider('catalog', 'catalog_replica')))
clause(14, fact(provider('bank', 'bank_backup')))
clause(15, fact(provider('risk', 'risk_engine')))
clause(16, fact(provider('risk_signal', 'risk_cache')))
clause(18, fact(provider('payment', 'payment_service')))
clause(19, fact(provider('checkout', 'checkout_api')))
clause(20, fact(repair_candidates(['catalog_primary', 'catalog_replica', 'bank_primary', 'bank_backup'])))
clause(22, fact(repair_price('catalog_replica', 2)))
clause(24, fact(repair_price('bank_backup', 1)))
clause(25, fact(critical_services(['web_store', 'mobile_app'])))
clause(26, fact(business_function('place_order', 'web_store')))
clause(27, fact(business_function('mobile_checkout', 'mobile_app')))
clause(28, fact(member(X, [X, ..._0])))
clause(29, implied_by(member(X, [_0, ...Rest]), member(X, Rest)))
clause(30, fact(subset([], [])))
clause(31, implied_by(subset([X, ...Rest], [X, ...Chosen]), subset(Rest, Chosen)))
clause(32, implied_by(subset([_0, ...Rest], Chosen), subset(Rest, Chosen)))
clause(33, fact(repair_cost([], 0)))
clause(34, implied_by(repair_cost([Node, ...Rest], Cost), [repair_price(Node, Own), repair_cost(Rest, Tail), is(Cost, add(Own, Tail))]))
clause(35, implies([repair_candidates(All), subset(All, Plan), repair_cost(Plan, Cost)], repair_plan(Plan, Cost)))
clause(36, implies([repair_plan(Plan, _0), node(Node, 'up', _1)], hardware_ready(Plan, Node)))
clause(37, implies([repair_plan(Plan, _0), node(Node, 'down', _1), member(Node, Plan)], hardware_ready(Plan, Node)))
clause(38, fact(all_groups([], _0)))
clause(39, implied_by(all_groups([Group, ...Rest], Plan), [provider(Group, Node), operating(Plan, Node), all_groups(Rest, Plan)]))
clause(40, implies([hardware_ready(Plan, Node), node(Node, _0, Groups), all_groups(Groups, Plan)], operating(Plan, Node)))
clause(41, fact(all_operating([], _0)))
clause(42, implied_by(all_operating([Node, ...Rest], Plan), [operating(Plan, Node), all_operating(Rest, Plan)]))
clause(43, implies([repair_plan(Plan, Cost), critical_services(Required), all_operating(Required, Plan)], feasible_repair(Plan, Cost)))
clause(45, implies([feasible_repair(Plan, Cost), not(cheaper_repair(Cost))], best_repair(Plan, Cost)))
clause(46, implies([business_function(Function, Node), not(operating([], Node))], affected_function(Function)))
clause(47, implies([best_repair(Plan, _0), business_function(Function, Node), operating(Plan, Node)], restored_function(Function)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
// … 6 steps left out
step(best_repair(['catalog_replica', 'bank_backup'], 3), clause(45), {Plan: ['catalog_replica', 'bank_backup'], Cost: 3}, [feasible_repair(['catalog_replica', 'bank_backup'], 3), not(cheaper_repair(3))])
step(feasible_repair(['catalog_replica', 'bank_backup'], 3), clause(43), {Plan: ['catalog_replica', 'bank_backup'], Cost: 3, Required: ['web_store', 'mobile_app']}, [repair_plan(['catalog_replica', 'bank_backup'], 3), critical_services(['web_store', 'mobile_app']), all_operating(['web_store', 'mobile_app'], ['catalog_replica', 'bank_backup'])])
step(repair_plan(['catalog_replica', 'bank_backup'], 3), clause(35), {All: ['catalog_primary', 'catalog_replica', 'bank_primary', 'bank_backup'], Plan: ['catalog_replica', 'bank_backup'], Cost: 3}, [repair_candidates(['catalog_primary', 'catalog_replica', 'bank_primary', 'bank_backup']), subset(['catalog_primary', 'catalog_replica', 'bank_primary', 'bank_backup'], ['catalog_replica', 'bank_backup']), repair_cost(['catalog_replica', 'bank_backup'], 3)])
step(repair_candidates(['catalog_primary', 'catalog_replica', 'bank_primary', 'bank_backup']), clause(20), {}, [])
step(subset(['catalog_primary', 'catalog_replica', 'bank_primary', 'bank_backup'], ['catalog_replica', 'bank_backup']), clause(32), {_0: 'catalog_primary', Rest: ['catalog_replica', 'bank_primary', 'bank_backup'], Chosen: ['catalog_replica', 'bank_backup']}, [subset(['catalog_replica', 'bank_primary', 'bank_backup'], ['catalog_replica', 'bank_backup'])])
step(subset(['catalog_replica', 'bank_primary', 'bank_backup'], ['catalog_replica', 'bank_backup']), clause(31), {X: 'catalog_replica', Rest: ['bank_primary', 'bank_backup'], Chosen: ['bank_backup']}, [subset(['bank_primary', 'bank_backup'], ['bank_backup'])])
step(subset(['bank_primary', 'bank_backup'], ['bank_backup']), clause(32), {_0: 'bank_primary', Rest: ['bank_backup'], Chosen: ['bank_backup']}, [subset(['bank_backup'], ['bank_backup'])])
step(subset(['bank_backup'], ['bank_backup']), clause(31), {X: 'bank_backup', Rest: [], Chosen: []}, [subset([], [])])
step(subset([], []), clause(30), {}, [])
step(repair_cost(['catalog_replica', 'bank_backup'], 3), clause(34), {Node: 'catalog_replica', Rest: ['bank_backup'], Cost: 3, Own: 2, Tail: 1}, [repair_price('catalog_replica', 2), repair_cost(['bank_backup'], 1), is(3, add(2, 1))])
step(repair_price('catalog_replica', 2), clause(22), {}, [])
step(repair_cost(['bank_backup'], 1), clause(34), {Node: 'bank_backup', Rest: [], Cost: 1, Own: 1, Tail: 0}, [repair_price('bank_backup', 1), repair_cost([], 0), is(1, add(1, 0))])
step(repair_price('bank_backup', 1), clause(24), {}, [])
step(repair_cost([], 0), clause(33), {}, [])
step(is(1, add(1, 0)), 'builtin', {}, [])
step(is(3, add(2, 1)), 'builtin', {}, [])
step(critical_services(['web_store', 'mobile_app']), clause(25), {}, [])
step(all_operating(['web_store', 'mobile_app'], ['catalog_replica', 'bank_backup']), clause(42), {Node: 'web_store', Rest: ['mobile_app'], Plan: ['catalog_replica', 'bank_backup']}, [operating(['catalog_replica', 'bank_backup'], 'web_store'), all_operating(['mobile_app'], ['catalog_replica', 'bank_backup'])])
step(operating(['catalog_replica', 'bank_backup'], 'web_store'), clause(40), {Plan: ['catalog_replica', 'bank_backup'], Node: 'web_store', _0: 'up', Groups: ['checkout']}, [hardware_ready(['catalog_replica', 'bank_backup'], 'web_store'), node('web_store', 'up', ['checkout']), all_groups(['checkout'], ['catalog_replica', 'bank_backup'])])
step(hardware_ready(['catalog_replica', 'bank_backup'], 'web_store'), clause(36), {Plan: ['catalog_replica', 'bank_backup'], _0: 3, Node: 'web_store', _1: ['checkout']}, [repair_plan(['catalog_replica', 'bank_backup'], 3), node('web_store', 'up', ['checkout'])])
step(node('web_store', 'up', ['checkout']), clause(9), {}, [])
step(all_groups(['checkout'], ['catalog_replica', 'bank_backup']), clause(39), {Group: 'checkout', Rest: [], Plan: ['catalog_replica', 'bank_backup'], Node: 'checkout_api'}, [provider('checkout', 'checkout_api'), operating(['catalog_replica', 'bank_backup'], 'checkout_api'), all_groups([], ['catalog_replica', 'bank_backup'])])
step(provider('checkout', 'checkout_api'), clause(19), {}, [])
step(operating(['catalog_replica', 'bank_backup'], 'checkout_api'), clause(40), {Plan: ['catalog_replica', 'bank_backup'], Node: 'checkout_api', _0: 'up', Groups: ['catalog', 'payment']}, [hardware_ready(['catalog_replica', 'bank_backup'], 'checkout_api'), node('checkout_api', 'up', ['catalog', 'payment']), all_groups(['catalog', 'payment'], ['catalog_replica', 'bank_backup'])])
step(hardware_ready(['catalog_replica', 'bank_backup'], 'checkout_api'), clause(36), {Plan: ['catalog_replica', 'bank_backup'], _0: 3, Node: 'checkout_api', _1: ['catalog', 'payment']}, [repair_plan(['catalog_replica', 'bank_backup'], 3), node('checkout_api', 'up', ['catalog', 'payment'])])
step(node('checkout_api', 'up', ['catalog', 'payment']), clause(8), {}, [])
step(all_groups(['catalog', 'payment'], ['catalog_replica', 'bank_backup']), clause(39), {Group: 'catalog', Rest: ['payment'], Plan: ['catalog_replica', 'bank_backup'], Node: 'catalog_replica'}, [provider('catalog', 'catalog_replica'), operating(['catalog_replica', 'bank_backup'], 'catalog_replica'), all_groups(['payment'], ['catalog_replica', 'bank_backup'])])
step(provider('catalog', 'catalog_replica'), clause(12), {}, [])
step(operating(['catalog_replica', 'bank_backup'], 'catalog_replica'), clause(40), {Plan: ['catalog_replica', 'bank_backup'], Node: 'catalog_replica', _0: 'down', Groups: []}, [hardware_ready(['catalog_replica', 'bank_backup'], 'catalog_replica'), node('catalog_replica', 'down', []), all_groups([], ['catalog_replica', 'bank_backup'])])
step(hardware_ready(['catalog_replica', 'bank_backup'], 'catalog_replica'), clause(37), {Plan: ['catalog_replica', 'bank_backup'], _0: 3, Node: 'catalog_replica', _1: []}, [repair_plan(['catalog_replica', 'bank_backup'], 3), node('catalog_replica', 'down', []), member('catalog_replica', ['catalog_replica', 'bank_backup'])])
step(node('catalog_replica', 'down', []), clause(2), {}, [])
step(member('catalog_replica', ['catalog_replica', 'bank_backup']), clause(28), {X: 'catalog_replica', _0: ['bank_backup']}, [])
step(all_groups([], ['catalog_replica', 'bank_backup']), clause(38), {_0: ['catalog_replica', 'bank_backup']}, [])
step(all_groups(['payment'], ['catalog_replica', 'bank_backup']), clause(39), {Group: 'payment', Rest: [], Plan: ['catalog_replica', 'bank_backup'], Node: 'payment_service'}, [provider('payment', 'payment_service'), operating(['catalog_replica', 'bank_backup'], 'payment_service'), all_groups([], ['catalog_replica', 'bank_backup'])])
step(provider('payment', 'payment_service'), clause(18), {}, [])
step(operating(['catalog_replica', 'bank_backup'], 'payment_service'), clause(40), {Plan: ['catalog_replica', 'bank_backup'], Node: 'payment_service', _0: 'up', Groups: ['bank', 'risk']}, [hardware_ready(['catalog_replica', 'bank_backup'], 'payment_service'), node('payment_service', 'up', ['bank', 'risk']), all_groups(['bank', 'risk'], ['catalog_replica', 'bank_backup'])])
step(hardware_ready(['catalog_replica', 'bank_backup'], 'payment_service'), clause(36), {Plan: ['catalog_replica', 'bank_backup'], _0: 3, Node: 'payment_service', _1: ['bank', 'risk']}, [repair_plan(['catalog_replica', 'bank_backup'], 3), node('payment_service', 'up', ['bank', 'risk'])])
step(node('payment_service', 'up', ['bank', 'risk']), clause(7), {}, [])
step(all_groups(['bank', 'risk'], ['catalog_replica', 'bank_backup']), clause(39), {Group: 'bank', Rest: ['risk'], Plan: ['catalog_replica', 'bank_backup'], Node: 'bank_backup'}, [provider('bank', 'bank_backup'), operating(['catalog_replica', 'bank_backup'], 'bank_backup'), all_groups(['risk'], ['catalog_replica', 'bank_backup'])])
step(provider('bank', 'bank_backup'), clause(14), {}, [])
step(operating(['catalog_replica', 'bank_backup'], 'bank_backup'), clause(40), {Plan: ['catalog_replica', 'bank_backup'], Node: 'bank_backup', _0: 'down', Groups: []}, [hardware_ready(['catalog_replica', 'bank_backup'], 'bank_backup'), node('bank_backup', 'down', []), all_groups([], ['catalog_replica', 'bank_backup'])])
step(hardware_ready(['catalog_replica', 'bank_backup'], 'bank_backup'), clause(37), {Plan: ['catalog_replica', 'bank_backup'], _0: 3, Node: 'bank_backup', _1: []}, [repair_plan(['catalog_replica', 'bank_backup'], 3), node('bank_backup', 'down', []), member('bank_backup', ['catalog_replica', 'bank_backup'])])
step(node('bank_backup', 'down', []), clause(4), {}, [])
step(member('bank_backup', ['catalog_replica', 'bank_backup']), clause(29), {X: 'bank_backup', _0: 'catalog_replica', Rest: ['bank_backup']}, [member('bank_backup', ['bank_backup'])])
step(member('bank_backup', ['bank_backup']), clause(28), {X: 'bank_backup', _0: []}, [])
step(all_groups(['risk'], ['catalog_replica', 'bank_backup']), clause(39), {Group: 'risk', Rest: [], Plan: ['catalog_replica', 'bank_backup'], Node: 'risk_engine'}, [provider('risk', 'risk_engine'), operating(['catalog_replica', 'bank_backup'], 'risk_engine'), all_groups([], ['catalog_replica', 'bank_backup'])])
step(provider('risk', 'risk_engine'), clause(15), {}, [])
step(operating(['catalog_replica', 'bank_backup'], 'risk_engine'), clause(40), {Plan: ['catalog_replica', 'bank_backup'], Node: 'risk_engine', _0: 'up', Groups: ['risk_signal']}, [hardware_ready(['catalog_replica', 'bank_backup'], 'risk_engine'), node('risk_engine', 'up', ['risk_signal']), all_groups(['risk_signal'], ['catalog_replica', 'bank_backup'])])
step(hardware_ready(['catalog_replica', 'bank_backup'], 'risk_engine'), clause(36), {Plan: ['catalog_replica', 'bank_backup'], _0: 3, Node: 'risk_engine', _1: ['risk_signal']}, [repair_plan(['catalog_replica', 'bank_backup'], 3), node('risk_engine', 'up', ['risk_signal'])])
step(node('risk_engine', 'up', ['risk_signal']), clause(6), {}, [])
step(all_groups(['risk_signal'], ['catalog_replica', 'bank_backup']), clause(39), {Group: 'risk_signal', Rest: [], Plan: ['catalog_replica', 'bank_backup'], Node: 'risk_cache'}, [provider('risk_signal', 'risk_cache'), operating(['catalog_replica', 'bank_backup'], 'risk_cache'), all_groups([], ['catalog_replica', 'bank_backup'])])
step(provider('risk_signal', 'risk_cache'), clause(16), {}, [])
step(operating(['catalog_replica', 'bank_backup'], 'risk_cache'), clause(40), {Plan: ['catalog_replica', 'bank_backup'], Node: 'risk_cache', _0: 'up', Groups: []}, [hardware_ready(['catalog_replica', 'bank_backup'], 'risk_cache'), node('risk_cache', 'up', []), all_groups([], ['catalog_replica', 'bank_backup'])])
step(hardware_ready(['catalog_replica', 'bank_backup'], 'risk_cache'), clause(36), {Plan: ['catalog_replica', 'bank_backup'], _0: 3, Node: 'risk_cache', _1: []}, [repair_plan(['catalog_replica', 'bank_backup'], 3), node('risk_cache', 'up', [])])
step(node('risk_cache', 'up', []), clause(5), {}, [])
step(all_operating(['mobile_app'], ['catalog_replica', 'bank_backup']), clause(42), {Node: 'mobile_app', Rest: [], Plan: ['catalog_replica', 'bank_backup']}, [operating(['catalog_replica', 'bank_backup'], 'mobile_app'), all_operating([], ['catalog_replica', 'bank_backup'])])
step(operating(['catalog_replica', 'bank_backup'], 'mobile_app'), clause(40), {Plan: ['catalog_replica', 'bank_backup'], Node: 'mobile_app', _0: 'up', Groups: ['checkout']}, [hardware_ready(['catalog_replica', 'bank_backup'], 'mobile_app'), node('mobile_app', 'up', ['checkout']), all_groups(['checkout'], ['catalog_replica', 'bank_backup'])])
step(hardware_ready(['catalog_replica', 'bank_backup'], 'mobile_app'), clause(36), {Plan: ['catalog_replica', 'bank_backup'], _0: 3, Node: 'mobile_app', _1: ['checkout']}, [repair_plan(['catalog_replica', 'bank_backup'], 3), node('mobile_app', 'up', ['checkout'])])
step(node('mobile_app', 'up', ['checkout']), clause(10), {}, [])
step(all_operating([], ['catalog_replica', 'bank_backup']), clause(41), {_0: ['catalog_replica', 'bank_backup']}, [])
step(not(cheaper_repair(3)), 'absent', {}, [])
// … 2 steps left out
// … 425 more steps derive every other plan and what operates under it

// Search certificate: every fact derived for each relation the searches behind
// negations and collections consult, and every answer of each call they made, in order.
// … four derived(...) listings: every operating, hardware_ready, repair_plan
// and feasible_repair fact the rules derived
searched(operating([], 'web_store'), [])
// … 315 searched lines
searched(operating([], 'mobile_app'), [])
searched(cheaper_repair(3), [])
// … 59 more searched lines
```

It has four parts:

- **The claims**: the five answers.
- **The clauses**: the program lines the steps cite, by their number. Lines
  no step needs, such as the catalog primary's facts, are left out. The `_`
  blanks are shown as `_0`, `_1`, ... so a step can name them.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.
- **The search certificate**: the facts and searches behind the three
  absences: each `derived(...)` line lists every fact the forward rules
  derived for one relation, and each `searched(call, answers)` line records
  one search with every answer it gave.

Read the chain as sentences, grouped where steps repeat a pattern:

1. *The best plan is the replica and the backup, at cost 3*: by rule 45,
   because that plan is feasible and no cheaper repair exists.
2. *That plan is feasible*: by rule 43, because it is a plan costing 3, the
   critical services are the website and the app, and both operate under it.
3. *It is a plan costing 3*: by rule 35, because it is a subset of the four
   candidates (fact 20) and its repairs cost 3.
4. Steps 4–9: the four candidates (fact 20), and the subset, by rules 31
   and 32: skip the catalog primary, take the replica, skip the bank primary,
   take the backup, end with the empty list (fact 30).
5. Steps 10–16: the cost, by rule 34 and facts 22, 24 and 33: the backup costs
   1 + 0 = 1, and the replica 2 + 1 = 3. The two sums are `'builtin'`:
   calculations the checker does again itself.
6. Step 17: the critical services are the website and the app (fact 25).
7. Steps 18–60: both operate. Each node that operates is shown the same way,
   by rule 40: its hardware is ready (rule 36 because it is up, or rule 37
   because it is down but in the plan, which `member`, rules 28 and 29,
   confirms), and each group it needs has a provider that operates. So the
   website rests on checkout; checkout on the repaired replica and on payment;
   payment on the repaired backup and on the risk engine; the risk engine on
   the risk cache, which is up and needs nothing. Then the app rests on the
   same checkout, already shown.
8. Step 61: *no repair costs less than 3*: justified as `'absent'`. eyemind
   searched for a cheaper feasible plan and found none. The proof cannot show
   something missing, so the search certificate backs it:
   `searched(cheaper_repair(3), [])`.

Two more steps of the same kind are among those left out: `not(operating([],
'web_store'))` and `not(operating([], 'mobile_app'))`, "with no repairs, the
website and the app do not run". They justify the two `affected_function`
answers, and the certificate backs them with
`searched(operating([], 'web_store'), [])` and
`searched(operating([], 'mobile_app'), [])`, with the searches for each
node they depend on.

The 425 extra steps answer no question. They prove every fact the
`derived` listings name: each of the 16 repair plans with its cost, the 9
feasible ones, and which nodes operate under each. Each listed fact needs
steps of its own, so that the checker can trust the listing.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
affected_function('place_order')
affected_function('mobile_checkout')
best_repair(['catalog_replica', 'bank_backup'], 3)
restored_function('place_order')
restored_function('mobile_checkout')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 476)
condition('C2', 'well_founded', 'ok', 494)
condition('C3', 'justification', 'ok', 494)
condition('C4', 'coverage', 'ok', 1018)
condition('C5', 're_decision', 'ok', 15)
condition('C6', 'boundary_consistency', 'ok', 3)
condition('C7', 'relevance', 'ok', 499)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(494)
verified(476)
recomputed(15)
composed(0)
trusted(0)
claims(5)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (476)**: the 476 steps that cite a program line really are
  instances of it with the values shown.
- **C2 well-founded (494)**: none of the 494 steps depends on itself, even
  indirectly. This is where the payment and risk circle matters: payment
  operating rests on the risk engine, which rests on the risk cache, never
  back on payment.
- **C3 justification (494)**: every step says how it was justified, in a
  form the checker understands.
- **C4 coverage (1018)**: the 5 answers and the 1013 things the steps use
  are each backed by a step.
- **C5 re-decision (15)**: the 15 sums, such as 1 + 0 = 1 and 2 + 1 = 3 for
  the chosen plan, were done again by the checker.
- **C6 boundary consistency (3)**: the 3 absences were confronted with the
  evidence at hand: the proof shows nodes operating under many plans, but
  the website and the app never with no repairs, and no feasible plan
  costing less than 3. The search certificate settles all three.
- **C7 relevance (499)**: the 5 answers each answer one of the three
  questions, and all 494 steps serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The three settled absences are: with no repairs, the website does not
operate; with no repairs, the app does not operate; and no feasible plan
costs less than 3. These hold *within this program*. The checker never
repeats the search over every repair plan: it expands each `searched` call
one level against the program, as a search would, answers every inner call
from that call's own line, and reads relations the forward rules derive
from the `derived` listings, which it accepts because each listed fact has
its own steps and no rule derives a fact they leave out. The statistics:
494 steps, 476 verified, 15 recomputed and the 3 absences settled, none
trusted, for 5 claims.

The verdict is **checked**. The plan works and costs 3, and that it is the
*cheapest* is checked too. The result also assumes the supplied hardware
states and dependency model, and, as the last comment says, it does not
establish completeness.

---

## Try it

```sh
eyemind examples/service-outage-recovery.js
eyemind --proof examples/service-outage-recovery.js
eyemind -c examples/service-outage-recovery.js
eyemind --check-proof examples/proof/service-outage-recovery.js examples/service-outage-recovery.js
eyemind --goal 'feasible_repair(Plan, Cost)' examples/service-outage-recovery.js
```

The last command lists every plan that works: 9 of the 16, from cost 3 up to
10 for repairing everything.

Change the risk cache's state from `'up'` to `'down'`. No repair plan now
restores checkout: the listed repair choices cannot restore that cache, and
the payment/risk cycle has no independent support. Or make the bank primary
free, `repair_price('bank_primary', 0)`: the best plan becomes the replica and
the bank primary, at cost 2.

---

## Takeaway

Repairs are worth what they bring back. Reasoning from what each business
function needs turns a list of broken parts into a choice you can justify,
and check.
