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
346 steps, 7 listings and 389 call tables, about 200 KB; see the
[proof file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/service-outage-recovery.js).
Below are its claims and the lines behind the main answer,
`best_repair(['catalog_replica', 'bank_backup'], 3)`. The `// …` lines mark
what is left out.

```js
// Answers: each instance of a query() that holds.
affected_function('place_order')
affected_function('mobile_checkout')
best_repair(['catalog_replica', 'bank_backup'], 3)
restored_function('place_order')
restored_function('mobile_checkout')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(affected_function('place_order'), clause(46), {Function: 'place_order', Node: 'web_store'}, [business_function('place_order', 'web_store'), not(operating([], 'web_store'))])
step(affected_function('mobile_checkout'), clause(46), {Function: 'mobile_checkout', Node: 'mobile_app'}, [business_function('mobile_checkout', 'mobile_app'), not(operating([], 'mobile_app'))])
// … the plans, what is ready and what operates under each
step(repair_plan(['catalog_replica', 'bank_backup'], 3), clause(35), {All: ['catalog_primary', 'catalog_replica', 'bank_primary', 'bank_backup'], Plan: ['catalog_replica', 'bank_backup'], Cost: 3}, [repair_candidates(['catalog_primary', 'catalog_replica', 'bank_primary', 'bank_backup']), subset(['catalog_primary', 'catalog_replica', 'bank_primary', 'bank_backup'], ['catalog_replica', 'bank_backup']), repair_cost(['catalog_replica', 'bank_backup'], 3)])
// … more of the same
step(operating(['catalog_replica', 'bank_backup'], 'web_store'), clause(40), {Plan: ['catalog_replica', 'bank_backup'], Node: 'web_store', _0: 'up', Groups: ['checkout']}, [hardware_ready(['catalog_replica', 'bank_backup'], 'web_store'), node('web_store', 'up', ['checkout']), all_groups(['checkout'], ['catalog_replica', 'bank_backup'])])
// … more of the same
step(best_repair(['catalog_replica', 'bank_backup'], 3), clause(45), {Plan: ['catalog_replica', 'bank_backup'], Cost: 3}, [feasible_repair(['catalog_replica', 'bank_backup'], 3), not(cheaper_repair(3))])
step(feasible_repair(['catalog_replica', 'bank_backup'], 3), clause(43), {Plan: ['catalog_replica', 'bank_backup'], Cost: 3, Required: ['web_store', 'mobile_app']}, [repair_plan(['catalog_replica', 'bank_backup'], 3), critical_services(['web_store', 'mobile_app']), all_operating(['web_store', 'mobile_app'], ['catalog_replica', 'bank_backup'])])
step(all_operating(['web_store', 'mobile_app'], ['catalog_replica', 'bank_backup']), clause(42), {Node: 'web_store', Rest: ['mobile_app'], Plan: ['catalog_replica', 'bank_backup']}, [operating(['catalog_replica', 'bank_backup'], 'web_store'), all_operating(['mobile_app'], ['catalog_replica', 'bank_backup'])])
step(all_operating(['mobile_app'], ['catalog_replica', 'bank_backup']), clause(42), {Node: 'mobile_app', Rest: [], Plan: ['catalog_replica', 'bank_backup']}, [operating(['catalog_replica', 'bank_backup'], 'mobile_app'), all_operating([], ['catalog_replica', 'bank_backup'])])
// … the other feasible plans and the restored functions
step(restored_function('place_order'), clause(47), {Plan: ['catalog_replica', 'bank_backup'], _0: 3, Function: 'place_order', Node: 'web_store'}, [best_repair(['catalog_replica', 'bank_backup'], 3), business_function('place_order', 'web_store'), operating(['catalog_replica', 'bank_backup'], 'web_store')])
step(restored_function('mobile_checkout'), clause(47), {Plan: ['catalog_replica', 'bank_backup'], _0: 3, Function: 'mobile_checkout', Node: 'mobile_app'}, [best_repair(['catalog_replica', 'bank_backup'], 3), business_function('mobile_checkout', 'mobile_app'), operating(['catalog_replica', 'bank_backup'], 'mobile_app')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(affected_function(A), [affected_function('place_order'), affected_function('mobile_checkout')])
// … the operating, hardware_ready and repair_plan listings
derived(best_repair(A, B), [best_repair(['catalog_replica', 'bank_backup'], 3)])
// … the feasible_repair listing
derived(restored_function(A), [restored_function('place_order'), restored_function('mobile_checkout')])
called(affected_function(A), [affected_function('place_order'), affected_function('mobile_checkout')])
called(operating([], 'web_store'), [])
called(operating([], 'mobile_app'), [])
// … tables for every node under every plan
called(best_repair(T, U), [best_repair(['catalog_replica', 'bank_backup'], 3)])
called(feasible_repair(V, W), [feasible_repair(['catalog_primary', 'catalog_replica', 'bank_primary', 'bank_backup'], 10), feasible_repair(['catalog_primary', 'catalog_replica', 'bank_primary'], 9), feasible_repair(['catalog_primary', 'catalog_replica', 'bank_backup'], 6), feasible_repair(['catalog_primary', 'bank_primary', 'bank_backup'], 8), feasible_repair(['catalog_primary', 'bank_primary'], 7), feasible_repair(['catalog_primary', 'bank_backup'], 4), feasible_repair(['catalog_replica', 'bank_primary', 'bank_backup'], 7), feasible_repair(['catalog_replica', 'bank_primary'], 6), feasible_repair(['catalog_replica', 'bank_backup'], 3)])
called(cheaper_repair(10), [cheaper_repair(10), cheaper_repair(10), cheaper_repair(10), cheaper_repair(10), cheaper_repair(10), cheaper_repair(10), cheaper_repair(10), cheaper_repair(10)])
called(feasible_repair(_23, Y), [feasible_repair(['catalog_primary', 'catalog_replica', 'bank_primary', 'bank_backup'], 10), feasible_repair(['catalog_primary', 'catalog_replica', 'bank_primary'], 9), feasible_repair(['catalog_primary', 'catalog_replica', 'bank_backup'], 6), feasible_repair(['catalog_primary', 'bank_primary', 'bank_backup'], 8), feasible_repair(['catalog_primary', 'bank_primary'], 7), feasible_repair(['catalog_primary', 'bank_backup'], 4), feasible_repair(['catalog_replica', 'bank_primary', 'bank_backup'], 7), feasible_repair(['catalog_replica', 'bank_primary'], 6), feasible_repair(['catalog_replica', 'bank_backup'], 3)])
called(cheaper_repair(9), [cheaper_repair(9), cheaper_repair(9), cheaper_repair(9), cheaper_repair(9), cheaper_repair(9), cheaper_repair(9), cheaper_repair(9)])
called(cheaper_repair(6), [cheaper_repair(6), cheaper_repair(6)])
called(cheaper_repair(8), [cheaper_repair(8), cheaper_repair(8), cheaper_repair(8), cheaper_repair(8), cheaper_repair(8), cheaper_repair(8)])
called(cheaper_repair(7), [cheaper_repair(7), cheaper_repair(7), cheaper_repair(7), cheaper_repair(7)])
called(cheaper_repair(4), [cheaper_repair(4)])
called(cheaper_repair(3), [])
// … the remaining tables
called(restored_function(B1), [restored_function('place_order'), restored_function('mobile_checkout')])
called(best_repair(C1, _29), [best_repair(['catalog_replica', 'bank_backup'], 3)])
```

It has three parts:

- **The claims**: the five answers.
- **The steps**: one per fact the forward rules derived, plus the steps of
  goals whose answers rest on derived facts, such as `all_operating` and
  `all_groups`. A step reads `step(what, by which clause, with which values,
  using what)`, citing the clause by its number in the program. The `_`
  blanks are shown as `_0`, `_1`, ... so a step can name them.
- **The certificate**: seven **listings**, `derived(...)`, each holding every
  fact the forward rules derived for one relation, and the **call tables**,
  `called(call, answers)`, each holding every answer of one call. With no
  `query()`, the questions are the conclusions of the program's rules, such
  as `best_repair(T, U)`.

Read the main lines as sentences:

1. *The best plan is the replica and the backup, at cost 3*: by rule 45,
   because that plan is feasible and `not(cheaper_repair(3))` holds.
2. *That plan is feasible*: by rule 43, because it is a plan costing 3, the
   critical services are the website and the app, and all of them operate
   under it.
3. *It is a plan costing 3*: by rule 35, because it is a subset of the four
   candidates and its repairs cost 3. The subset and the cost come from
   backward rules over stated facts, and their call tables answer them, so
   they need no steps.
4. *The website operates under it*: by rule 40: its hardware is ready, and
   each group it needs has a provider that operates. Each node is shown the
   same way: the website rests on checkout; checkout on the repaired replica
   and on payment; payment on the repaired backup and on the risk engine;
   the risk engine on the risk cache, which is up and needs nothing.
5. *No repair costs less than 3*: `called(cheaper_repair(3), [])`.
   `cheaper_repair(Cost)` asks for a feasible plan cheaper than `Cost`, and
   the tables above it show how many beat each other cost: eight plans beat
   10, one beats 4, none beats 3.

The two `affected_function` steps rest on `not(operating([], 'web_store'))`
and `not(operating([], 'mobile_app'))`, "with no repairs, the website and
the app do not run", backed by the empty tables for those calls.

Most steps answer no question directly. They derive every fact the listings
hold: each of the 16 repair plans with its cost, the 9 feasible ones, and
which nodes are ready and operate under each. Each listed fact needs a step,
so that the checker can replay it.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the questions.** Each question is answered from the program
  one level deep, with every inner call answered from its own table, and
  each table is checked the same way. The tables cannot rest on themselves
  through a cycle. This is where the payment and risk circle matters:
  payment operating rests on the risk engine, which rests on the risk
  cache, never back on payment.
- **It checks the listings are closed.** Applying the forward rules to the
  listed facts derives nothing a listing leaves out: no other plan, ready
  node or operating node.
- **It replays each listed fact.** Each step's rule is re-run from scratch,
  the sums of the repair costs computed again, and each negation decided
  from the table of its call at the values it had when the rule ran.
- **It compares the claims with the answers.** The five claims are exactly
  the answers of the questions, and every step, listing and table was used.

The three negations are: with no repairs, the website does not operate;
with no repairs, the app does not operate; and no feasible plan costs less
than 3. These hold *within this program*. The checker never repeats the
search over every repair plan: it confirms each written-down table against
the program. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
affected_function('place_order')
affected_function('mobile_checkout')
best_repair(['catalog_replica', 'bank_backup'], 3)
restored_function('place_order')
restored_function('mobile_checkout')

verdict('checked')
```

The verdict is **checked**. The plan works and costs 3, that it is the
*cheapest* is checked too, and the claims are every answer of the
questions. The result also assumes the supplied hardware states and
dependency model.

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
