# Examples

Pick a question, run the program, and see what its proof establishes.
[Browse all examples by topic](#browse-by-topic).

## Start with a question

<div class="example-starters">
  <section class="example-starter">
    <span class="example-language">Logical English</span>
    <h3><a href="https://eyereasoner.github.io/eyemind/examples/deck/socrates-le">Why is Socrates mortal?</a></h3>
    <p>Run a single rule and check the proof of its conclusion.</p>
    <a class="example-run" href="https://eyereasoner.github.io/eyemind/playground/#example=socrates-le" aria-label="Run Socrates in Logical English in the playground">Run example <span aria-hidden="true">→</span></a>
  </section>
  <section class="example-starter">
    <span class="example-language">Logic Script</span>
    <h3><a href="https://eyereasoner.github.io/eyemind/examples/deck/service-outage-recovery">What would bring checkout back?</a></h3>
    <p>Choose the least-cost repair through a network of failing services.</p>
    <a class="example-run" href="https://eyereasoner.github.io/eyemind/playground/#example=service-outage-recovery" aria-label="Run Restoring checkout after an outage in the playground">Run example <span aria-hidden="true">→</span></a>
  </section>
  <section class="example-starter">
    <span class="example-language">Logical English</span>
    <h3><a href="https://eyereasoner.github.io/eyemind/examples/deck/research-snapshot-le">Can the archive share its directory?</a></h3>
    <p>Check research purpose, personal-data categories, and an attribution duty.</p>
    <a class="example-run" href="https://eyereasoner.github.io/eyemind/playground/#example=research-snapshot-le" aria-label="Run Research scope and duties in Logical English in the playground">Run example <span aria-hidden="true">→</span></a>
  </section>
</div>

## Browse by topic

<nav class="example-topics" aria-label="Example topics">
  <a href="#reasoning">Rules and proofs</a>
  <a href="#operations">Operations and decisions</a>
  <a href="#policy">Policy, rights and privacy</a>
  <a href="#plans">Puzzles, plans and routes</a>
  <a href="#mathematics">Mathematics and computing</a>
  <a href="#people">People and places</a>
  <a href="#linked-data">Linked data and evidence</a>
  <a href="#science">Science and measurements</a>
</nav>

<form class="example-filters" role="search" aria-label="Filter examples" hidden>
  <label>Search examples <input type="search" name="query"></label>
  <label>Input language
    <select name="language">
      <option value="">All languages</option>
      <option>Logic Script</option>
      <option>Logical English</option>
      <option>Notation3</option>
      <option>SPARQL 1.2 RL</option>
      <option>RDF</option>
    </select>
  </label>
  <button type="reset">Clear filters</button>
  <p class="example-count" role="status"></p>
</form>

<h3 class="example-topic" id="reasoning">Rules and proofs</h3>

Start with a single rule, then explore witnesses, absence, and rules that derive other rules.

| Example (deck) | Input language | Demonstrates | Source |
| --- | --- | --- | --- |
| [Socrates](https://eyereasoner.github.io/eyemind/examples/deck/socrates) | Logic Script | Class membership derived through a subclass rule | [socrates.js](https://github.com/eyereasoner/eyemind/blob/main/examples/socrates.js) |
| [Socrates in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/socrates-le) | Logical English | Logical English class facts and an every-rule conclude that Socrates is mortal | [socrates-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/socrates-le.le) |
| [Socrates in Notation3](https://eyereasoner.github.io/eyemind/examples/deck/socrates-n3) | Notation3 | Class membership follows the subclass hierarchy in Notation3 | [socrates-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/socrates-n3.n3) |
| [Socrates in SPARQL rules](https://eyereasoner.github.io/eyemind/examples/deck/socrates-srl) | SPARQL 1.2 RL | Class membership follows the subclass hierarchy in SPARQL 1.2 RL | [socrates-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/socrates-srl.srl) |
| [Backward](https://eyereasoner.github.io/eyemind/examples/deck/backward) | Logic Script | Backward definitions inside forward bodies | [backward.js](https://github.com/eyereasoner/eyemind/blob/main/examples/backward.js) |
| [Graphs](https://eyereasoner.github.io/eyemind/examples/deck/graphs) | Logic Script | Base data, negation and collection | [graphs.js](https://github.com/eyereasoner/eyemind/blob/main/examples/graphs.js) |
| [Terms](https://eyereasoner.github.io/eyemind/examples/deck/terms) | Logic Script | Quoted graphs, triple terms and residual witnesses | [terms.js](https://github.com/eyereasoner/eyemind/blob/main/examples/terms.js) |
| [Existential rules](https://eyereasoner.github.io/eyemind/examples/deck/existential-rules) | Logic Script | Existential rules: a fresh witness per activation, never a clash | [existential-rules.js](https://github.com/eyereasoner/eyemind/blob/main/examples/existential-rules.js) |
| [Witnesses](https://eyereasoner.github.io/eyemind/examples/deck/witnesses) | Logic Script | Structured witnesses and shared multi-head conclusions | [witnesses.js](https://github.com/eyereasoner/eyemind/blob/main/examples/witnesses.js) |
| [Integrity](https://eyereasoner.github.io/eyemind/examples/deck/integrity) | Logic Script | A provable integrity violation | [integrity.js](https://github.com/eyereasoner/eyemind/blob/main/examples/integrity.js) |
| [Unification](https://eyereasoner.github.io/eyemind/examples/deck/unification) | Logic Script | Open lists and repeated-variable constraints | [unification.js](https://github.com/eyereasoner/eyemind/blob/main/examples/unification.js) |
| [Schema Inference](https://eyereasoner.github.io/eyemind/examples/deck/schema-inference) | Logic Script | Subclasses, subproperties, domains and ranges | [schema-inference.js](https://github.com/eyereasoner/eyemind/blob/main/examples/schema-inference.js) |
| [Flat Map](https://eyereasoner.github.io/eyemind/examples/deck/flat-map) | Logic Script | Predicate-based mapping with multiple or missing values | [flat-map.js](https://github.com/eyereasoner/eyemind/blob/main/examples/flat-map.js) |
| [Scoped audit](https://eyereasoner.github.io/eyemind/examples/deck/scoped-audit) | Logic Script | Presence and absence within separate quoted graphs | [scoped-audit.js](https://github.com/eyereasoner/eyemind/blob/main/examples/scoped-audit.js) |
| [Variable Predicates](https://eyereasoner.github.io/eyemind/examples/deck/variable-predicates) | Logic Script | Relations selected and renamed through data bindings | [variable-predicates.js](https://github.com/eyereasoner/eyemind/blob/main/examples/variable-predicates.js) |
| [Paraconsistent Animals](https://eyereasoner.github.io/eyemind/examples/deck/paraconsistent-animals) | Logic Script | Local summaries of conflicting observations | [paraconsistent-animals.js](https://github.com/eyereasoner/eyemind/blob/main/examples/paraconsistent-animals.js) |
| [Nixon Diamond](https://eyereasoner.github.io/eyemind/examples/deck/nixon-diamond) | Logic Script | A default guarded by negation, so a contrary rule takes priority | [nixon-diamond.js](https://github.com/eyereasoner/eyemind/blob/main/examples/nixon-diamond.js) |
| [Records in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/records-le) | Logical English | Explicit absence and an existential conclusion give Alice a fresh record while Bob is blocked | [records-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/records-le.le) |
| [Derived forward rule](https://eyereasoner.github.io/eyemind/examples/deck/derived-rule) | Logic Script | An inline forward rule enabled by a cat and applied to a dog | [derived-rule.js](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-rule.js) |
| [Derived backward rule](https://eyereasoner.github.io/eyemind/examples/deck/derived-backward-rule) | Logic Script | A captured inverse pair enables a reusable backward rule | [derived-backward-rule.js](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-backward-rule.js) |
| [Two derived backward rules](https://eyereasoner.github.io/eyemind/examples/deck/derived-backward-rule-2) | Logic Script | A conjunction of backward templates supplies premises for forward reasoning | [derived-backward-rule-2.js](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-backward-rule-2.js) |
| [Reasoning about a rule](https://eyereasoner.github.io/eyemind/examples/deck/rule-inspection) | Logic Script | Inspecting a source rule as data while preserving its shared variable | [rule-inspection.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rule-inspection.js) |
| [A policy that enables a rule](https://eyereasoner.github.io/eyemind/examples/deck/derived-rule-n3) | Notation3 | An active policy derives and reports a membership rule | [derived-rule-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-rule-n3.n3) |
| [Universal instances](https://eyereasoner.github.io/eyemind/examples/deck/universal-instances-n3) | Notation3 | @forAll statements hold of every individual, and @forSome inside them gives each its own witness | [universal-instances-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/universal-instances-n3.n3) |
| [Shared existential](https://eyereasoner.github.io/eyemind/examples/deck/shared-existential-n3) | Notation3 | A top-level @forSome witness is the one individual a universal conclusion talks about | [shared-existential-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/shared-existential-n3.n3) |
| [Explicit variables and Skolem mothers](https://eyereasoner.github.io/eyemind/examples/deck/explicit-existential-rule-n3) | Notation3 | Explicit @forAll variables and a computed Skolem mother IRI for each human | [explicit-existential-rule-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/explicit-existential-rule-n3.n3) |
| [Quantifier scopes](https://eyereasoner.github.io/eyemind/examples/deck/quantifier-scopes-n3) | Notation3 | An @forSome of the document reaches into quoted formulas, and an inner declaration shadows it | [quantifier-scopes-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/quantifier-scopes-n3.n3) |
| [Chain stratification](https://eyereasoner.github.io/eyemind/examples/deck/chain-stratification-n3) | Notation3 | Rules with no strata, whose negation every chain of rule applications reaching it breaks a constraint for | [chain-stratification-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/chain-stratification-n3.n3) |
| [Guarded Skolem fathers](https://eyereasoner.github.io/eyemind/examples/deck/restricted-chase-n3) | Notation3 | Reuse supplied fathers and generate a Skolem father IRI only where none is supplied | [restricted-chase-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/restricted-chase-n3.n3) |
| [Graph terms](https://eyereasoner.github.io/eyemind/examples/deck/graph-terms-n3) | Notation3 | Quoted formulas as opaque graph terms: unquoting, identity up to renaming, and universals inside quotes | [graph-terms-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/graph-terms-n3.n3) |
| [Two rules, two fresh witnesses](https://eyereasoner.github.io/eyemind/examples/deck/cat-koko-srl) | SPARQL 1.2 RL | Separate head blank nodes create distinct witnesses that pass an identity filter | [cat-koko-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/cat-koko-srl.srl) |
| [An inconsistent door](https://eyereasoner.github.io/eyemind/examples/deck/fuse-n3) | Notation3 | A locked and open door triggers an integrity violation | [fuse-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/fuse-n3.n3) |
| [Deep Taxonomy (10 levels)](https://eyereasoner.github.io/eyemind/examples/deck/deep-taxonomy-10) | Logic Script | A ten-level subclass chain with branches that lead nowhere | [deep-taxonomy-10.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-10.js) |
| [Deep taxonomy (100 levels)](https://eyereasoner.github.io/eyemind/examples/deck/deep-taxonomy-100) | Logic Script | The same taxonomy benchmark at a hundred levels | [deep-taxonomy-100.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-100.js) |
| [Deep Taxonomy 1000](https://eyereasoner.github.io/eyemind/examples/deck/deep-taxonomy-1000) | Logic Script | The same taxonomy benchmark at a thousand levels | [deep-taxonomy-1000.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-1000.js) |
| [Deep Taxonomy 10000](https://eyereasoner.github.io/eyemind/examples/deck/deep-taxonomy-10000) | Logic Script | The same taxonomy benchmark at ten thousand levels | [deep-taxonomy-10000.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-10000.js) |
| [Deep Taxonomy 100000](https://eyereasoner.github.io/eyemind/examples/deck/deep-taxonomy-100000) | Logic Script | The same taxonomy benchmark at a hundred thousand levels | [deep-taxonomy-100000.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-100000.js) |

<h3 class="example-topic" id="operations">Operations and decisions</h3>

Restore a service, schedule a launch, charge a battery, or explain a decision from the evidence.

| Example (deck) | Input language | Demonstrates | Source |
| --- | --- | --- | --- |
| [Restoring checkout after an outage](https://eyereasoner.github.io/eyemind/examples/deck/service-outage-recovery) | Logic Script | Least-cost repairs that restore checkout through redundant providers and a dependency cycle | [service-outage-recovery.js](https://github.com/eyereasoner/eyemind/blob/main/examples/service-outage-recovery.js) |
| [Which tasks determine the launch date?](https://eyereasoner.github.io/eyemind/examples/deck/critical-path-schedule) | Logic Script | Earliest task times and every critical predecessor in a launch schedule | [critical-path-schedule.js](https://github.com/eyereasoner/eyemind/blob/main/examples/critical-path-schedule.js) |
| [When should the battery charge?](https://eyereasoner.github.io/eyemind/examples/deck/battery-dispatch) | Logic Script | Cheapest four-slot battery schedule under energy and power limits | [battery-dispatch.js](https://github.com/eyereasoner/eyemind/blob/main/examples/battery-dispatch.js) |
| [Which temperature evidence drives a quarantine?](https://eyereasoner.github.io/eyemind/examples/deck/cold-chain-recall) | Logic Script | Conflicting temperature evidence, checkpoint filtering and a witnessed inspection task | [cold-chain-recall.js](https://github.com/eyereasoner/eyemind/blob/main/examples/cold-chain-recall.js) |
| [A school can look close on a map](https://eyereasoner.github.io/eyemind/examples/deck/school-placement-audit) | Logic Script | Walking-route and preference scores audit provisional school placements | [school-placement-audit.js](https://github.com/eyereasoner/eyemind/blob/main/examples/school-placement-audit.js) |
| [Inventory Invoice](https://eyereasoner.github.io/eyemind/examples/deck/inventory) | Logic Script | An invoice from collected line totals | [inventory.js](https://github.com/eyereasoner/eyemind/blob/main/examples/inventory.js) |
| [State transitions](https://eyereasoner.github.io/eyemind/examples/deck/state-transitions) | Logic Script | Account balances from an ordered event log | [state-transitions.js](https://github.com/eyereasoner/eyemind/blob/main/examples/state-transitions.js) |
| [Stock across locations](https://eyereasoner.github.io/eyemind/examples/deck/inventory-srl) | SPARQL 1.2 RL | Grouped stock records yield location counts, totals, minimums and maximums | [inventory-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/inventory-srl.srl) |
| [One invoice per order](https://eyereasoner.github.io/eyemind/examples/deck/orders-srl) | SPARQL 1.2 RL | Each order gets its own invoice with a customer and total | [orders-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/orders-srl.srl) |
| [Can this component deploy?](https://eyereasoner.github.io/eyemind/examples/deck/deployment-srl) | SPARQL 1.2 RL | Service dependencies propagate severe vulnerabilities and safe deployment decisions | [deployment-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/deployment-srl.srl) |
| [N3 invoice collection](https://eyereasoner.github.io/eyemind/examples/deck/invoice-n3) | Notation3 | Notation3 collection totals invoices, including an empty invoice | [invoice-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/invoice-n3.n3) |
| [Adding invoice lines](https://eyereasoner.github.io/eyemind/examples/deck/invoice-totals-n3) | Notation3 | Collected line amounts produce invoice totals and a large-invoice classification | [invoice-totals-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/invoice-totals-n3.n3) |
| [A text invoice](https://eyereasoner.github.io/eyemind/examples/deck/report-n3) | Notation3 | A formatted text report of fruit quantities, prices and costs | [report-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/report-n3.n3) |
| [Shipping without a hold](https://eyereasoner.github.io/eyemind/examples/deck/closed-world-n3) | Notation3 | Paid orders ship when no hold is on record | [closed-world-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/closed-world-n3.n3) |
| [N3 scoped negation](https://eyereasoner.github.io/eyemind/examples/deck/scoped-negation-n3) | Notation3 | Notation3 scoped negation waits for a derived order hold | [scoped-negation-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/scoped-negation-n3.n3) |
| [N3 delivery witnesses](https://eyereasoner.github.io/eyemind/examples/deck/witnesses-n3) | Notation3 | Deterministic Skolem IRIs give each paid order its own ready delivery record | [witnesses-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/witnesses-n3.n3) |
| [Library fines in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/library-fines-le) | Logical English | Late fees and replacement costs are summed, counted and maximized per member, charging a damaged and lost loan once | [library-fines-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/library-fines-le.le) |
| [Election tally in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/election-tally-le) | Logical English | Eligible voters' choices are counted once each, spoiled votes are excluded and a tie gives two winners | [election-tally-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/election-tally-le.le) |
| [Exact invoice totals and floating measurements](https://eyereasoner.github.io/eyemind/examples/deck/exact-decimals-srl) | SPARQL 1.2 RL | Exact decimal invoice totals and division alongside binary64 double arithmetic | [exact-decimals-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/exact-decimals-srl.srl) |

<h3 class="example-topic" id="policy">Policy, rights and privacy</h3>

Check permissions, duties, eligibility, and the evidence that a policy decision depends on.

| Example (deck) | Input language | Demonstrates | Source |
| --- | --- | --- | --- |
| [Research scope and duties in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/research-snapshot-le) | Logical English | An ODRL snapshot checks a compound constraint over DPV purpose and data categories and looks for request-local duty evidence | [research-snapshot-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/research-snapshot-le.le) |
| [Research access in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/research-access-le) | Logical English | Logical English joins ODRL permission, prohibition and duty facts with DPV process descriptions to decide three research requests | [research-access-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/research-access-le.le) |
| [A research portal under two rulebooks](https://eyereasoner.github.io/eyemind/examples/deck/research-portal) | Logic Script | A hospital research portal combines ODRL/DPV policy decisions with Digital Omnibus device consent and breach plans | [research-portal.js](https://github.com/eyereasoner/eyemind/blob/main/examples/research-portal.js) |
| [A package holiday under two rulebooks](https://eyereasoner.github.io/eyemind/examples/deck/package-holiday) | Logic Script | Package holiday cancellations under the tour operator's ODRL terms and the 2015 and revised EU Package Travel Directive | [package-holiday.js](https://github.com/eyereasoner/eyemind/blob/main/examples/package-holiday.js) |
| [A right to the value of personal data](https://eyereasoner.github.io/eyemind/examples/deck/data-value-right) | Logic Script | A right to the value of personal data in the age of AI: how it fits existing EU law, and how it could become an autonomous right | [data-value-right.js](https://github.com/eyereasoner/eyemind/blob/main/examples/data-value-right.js) |
| [Audited grants](https://eyereasoner.github.io/eyemind/examples/deck/audited-grants) | Logic Script | A grant policy whose own proof and check report are read back as facts and audited, in the same language | [audited-grants.js](https://github.com/eyereasoner/eyemind/blob/main/examples/audited-grants.js) |
| [Handicap card](https://eyereasoner.github.io/eyemind/examples/deck/handicap-card) | RDF | One ODRL and SOTW snapshot allows Alice's handicap card and reports the conflict that blocks Bob's | [handicap-card.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/handicap-card.ttl) |
| [Handicap card in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/handicap-card-le) | Logical English | An LE snapshot reuses the ODRL evaluator to allow Alice's card and retain Bob's policy conflict | [handicap-card-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/handicap-card-le.le) |
| [British citizenship in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/british-citizenship-le) | Logical English | Section 1 of the British Nationality Act 1981 grants citizenship by birth to a citizen or settled parent, or to a foundling unless the contrary is shown | [british-citizenship-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/british-citizenship-le.le) |
| [Permissions](https://eyereasoner.github.io/eyemind/examples/deck/permissions) | Logic Script | Role permissions with exclusions | [permissions.js](https://github.com/eyereasoner/eyemind/blob/main/examples/permissions.js) |
| [Policy Risk](https://eyereasoner.github.io/eyemind/examples/deck/policy-risk) | Logic Script | Ranked findings with explanations and suggested mitigations | [policy-risk.js](https://github.com/eyereasoner/eyemind/blob/main/examples/policy-risk.js) |
| [Deontic Logic](https://eyereasoner.github.io/eyemind/examples/deck/deontic-logic) | Logic Script | Obligations, prohibitions and compensation that does not erase a violation | [deontic-logic.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deontic-logic.js) |
| [Dog license](https://eyereasoner.github.io/eyemind/examples/deck/dog-license) | Logic Script | A licensing threshold based on collected dog counts | [dog-license.js](https://github.com/eyereasoner/eyemind/blob/main/examples/dog-license.js) |
| [Delfour](https://eyereasoner.github.io/eyemind/examples/deck/delfour) | Logic Script | A store scanner gives low-sugar advice from a signed, scoped insight, without learning the household's diabetes | [delfour.js](https://github.com/eyereasoner/eyemind/blob/main/examples/delfour.js) |

<h3 class="example-topic" id="plans">Puzzles, plans and routes</h3>

Find a route, prove that a plan is minimal, or narrow down a solution to a puzzle.

| Example (deck) | Input language | Demonstrates | Source |
| --- | --- | --- | --- |
| [Shortest Path](https://eyereasoner.github.io/eyemind/examples/deck/shortest-path) | Logic Script | Weighted paths and stratified minimum selection | [shortest-path.js](https://github.com/eyereasoner/eyemind/blob/main/examples/shortest-path.js) |
| [Shortest paths in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/shortest-path-le) | Logical English | Bounded recursive paths retain both cheapest routes through a graph containing a cycle | [shortest-path-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/shortest-path-le.le) |
| [Dijkstra](https://eyereasoner.github.io/eyemind/examples/deck/dijkstra) | Logic Script | Dijkstra's shortest route over a cost-ordered queue, with every step checked | [dijkstra.js](https://github.com/eyereasoner/eyemind/blob/main/examples/dijkstra.js) |
| [The cheapest listed routes](https://eyereasoner.github.io/eyemind/examples/deck/dijkstra-srl) | SPARQL 1.2 RL | Listed candidate routes receive total costs and the cheapest alternatives survive stratified negation | [dijkstra-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/dijkstra-srl.srl) |
| [Path discovery](https://eyereasoner.github.io/eyemind/examples/deck/path-discovery) | Logic Script | Full airport network with configurable endpoints and maximum stopovers | [path-discovery.js](https://github.com/eyereasoner/eyemind/blob/main/examples/path-discovery.js) |
| [Alternatives](https://eyereasoner.github.io/eyemind/examples/deck/alternatives) | Logic Script | Alternative routes, disjunction and once | [alternatives.js](https://github.com/eyereasoner/eyemind/blob/main/examples/alternatives.js) |
| [Reachability](https://eyereasoner.github.io/eyemind/examples/deck/reachability) | Logic Script | Finite closure in a graph containing a cycle | [reachability.js](https://github.com/eyereasoner/eyemind/blob/main/examples/reachability.js) |
| [Knapsack Optimization](https://eyereasoner.github.io/eyemind/examples/deck/knapsack-optimization) | Logic Script | The 0/1 knapsack problem: the most valuable pack within a weight limit | [knapsack-optimization.js](https://github.com/eyereasoner/eyemind/blob/main/examples/knapsack-optimization.js) |
| [Tower of Hanoi](https://eyereasoner.github.io/eyemind/examples/deck/hanoi) | Logic Script | Recursive construction of a disk-move sequence | [hanoi.js](https://github.com/eyereasoner/eyemind/blob/main/examples/hanoi.js) |
| [Eight queens](https://eyereasoner.github.io/eyemind/examples/deck/queens) | Logic Script | Configurable N-queens search with diagonal constraints | [queens.js](https://github.com/eyereasoner/eyemind/blob/main/examples/queens.js) |
| [Zebra](https://eyereasoner.github.io/eyemind/examples/deck/zebra) | Logic Script | The zebra puzzle solved by narrowing five partially known houses | [zebra.js](https://github.com/eyereasoner/eyemind/blob/main/examples/zebra.js) |
| [Who Killed Aunt Agatha?](https://eyereasoner.github.io/eyemind/examples/deck/aunt-agatha) | Logic Script | Who killed Aunt Agatha? A conclusion entailed by holding in every model of the premises | [aunt-agatha.js](https://github.com/eyereasoner/eyemind/blob/main/examples/aunt-agatha.js) |
| [Four colours](https://eyereasoner.github.io/eyemind/examples/deck/four-color) | Logic Script | Four-colouring the map of the European Union | [four-color.js](https://github.com/eyereasoner/eyemind/blob/main/examples/four-color.js) |
| [Wolf, goat and cabbage](https://eyereasoner.github.io/eyemind/examples/deck/wolf-goat-cabbage) | Logic Script | The river crossing, with seven crossings shown to be minimal | [wolf-goat-cabbage.js](https://github.com/eyereasoner/eyemind/blob/main/examples/wolf-goat-cabbage.js) |
| [River crossing in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/river-crossing-le) | Logical English | Compound states and safety constraints find both seven-crossing wolf, goat and cabbage plans | [river-crossing-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/river-crossing-le.le) |
| [Monkey and bananas](https://eyereasoner.github.io/eyemind/examples/deck/monkey-bananas) | Logic Script | Every plan of up to five moves that gets the monkey the bananas | [monkey-bananas.js](https://github.com/eyereasoner/eyemind/blob/main/examples/monkey-bananas.js) |
| [GPS: goal-driven routes](https://eyereasoner.github.io/eyemind/examples/deck/gps) | Logic Script | Goal-driven parallel sequences: routes to a goal state within duration, cost, belief and comfort limits | [gps.js](https://github.com/eyereasoner/eyemind/blob/main/examples/gps.js) |

<h3 class="example-topic" id="mathematics">Mathematics and computing</h3>

Compute exact values, reason about programs, or check an algebraic claim.

| Example (deck) | Input language | Demonstrates | Source |
| --- | --- | --- | --- |
| [Fibonacci](https://eyereasoner.github.io/eyemind/examples/deck/fibonacci) | Logic Script | Fast doubling for exact Fibonacci numbers, and the golden ratio | [fibonacci.js](https://github.com/eyereasoner/eyemind/blob/main/examples/fibonacci.js) |
| [Lists](https://eyereasoner.github.io/eyemind/examples/deck/lists) | Logic Script | Concatenation, mapping and summation | [lists.js](https://github.com/eyereasoner/eyemind/blob/main/examples/lists.js) |
| [Strings](https://eyereasoner.github.io/eyemind/examples/deck/strings) | Logic Script | Text construction and Unicode inspection | [strings.js](https://github.com/eyereasoner/eyemind/blob/main/examples/strings.js) |
| [Peano](https://eyereasoner.github.io/eyemind/examples/deck/peano) | Logic Script | Symbolic arithmetic, relational addition and a chained derivation | [peano.js](https://github.com/eyereasoner/eyemind/blob/main/examples/peano.js) |
| [Expression Evaluation](https://eyereasoner.github.io/eyemind/examples/deck/expression-eval) | Logic Script | Recursive expression graphs used in forward inference | [expression-eval.js](https://github.com/eyereasoner/eyemind/blob/main/examples/expression-eval.js) |
| [Complex numbers](https://eyereasoner.github.io/eyemind/examples/deck/complex) | Logic Script | Complex arithmetic, exact over Gaussian integers and polar beyond them | [complex.js](https://github.com/eyereasoner/eyemind/blob/main/examples/complex.js) |
| [Polynomial Roots](https://eyereasoner.github.io/eyemind/examples/deck/polynomial) | Logic Script | Complex roots of polynomials up to degree 4 by Cardan and Lagrange | [polynomial.js](https://github.com/eyereasoner/eyemind/blob/main/examples/polynomial.js) |
| [Interval Relations](https://eyereasoner.github.io/eyemind/examples/deck/interval-relations) | Logic Script | All thirteen interval relations and endpoint completion | [interval-relations.js](https://github.com/eyereasoner/eyemind/blob/main/examples/interval-relations.js) |
| [Collatz](https://eyereasoner.github.io/eyemind/examples/deck/collatz) | Logic Script | Parity-based recursive trajectories over a range of starts | [collatz.js](https://github.com/eyereasoner/eyemind/blob/main/examples/collatz.js) |
| [Ackermann](https://eyereasoner.github.io/eyemind/examples/deck/ackermann) | Logic Script | The Ackermann function through the hyperoperation sequence, exactly | [ackermann.js](https://github.com/eyereasoner/eyemind/blob/main/examples/ackermann.js) |
| [Peasant Arithmetic](https://eyereasoner.github.io/eyemind/examples/deck/peasant) | Logic Script | Peasant multiplication and exponentiation by halving and doubling | [peasant.js](https://github.com/eyereasoner/eyemind/blob/main/examples/peasant.js) |
| [The Sieve of Eratosthenes](https://eyereasoner.github.io/eyemind/examples/deck/sieve) | Logic Script | The sieve of Eratosthenes over an explicit list of integers | [sieve.js](https://github.com/eyereasoner/eyemind/blob/main/examples/sieve.js) |
| [Goldbach](https://eyereasoner.github.io/eyemind/examples/deck/goldbach) | Logic Script | Goldbach splits of every power of two up to 2^25 | [goldbach.js](https://github.com/eyereasoner/eyemind/blob/main/examples/goldbach.js) |
| [Kaprekar's 6174](https://eyereasoner.github.io/eyemind/examples/deck/kaprekar) | Logic Script | Every four-digit Kaprekar routine reaches 6174 within seven steps | [kaprekar.js](https://github.com/eyereasoner/eyemind/blob/main/examples/kaprekar.js) |
| [A Turing Machine](https://eyereasoner.github.io/eyemind/examples/deck/turing) | Logic Script | A Turing machine interpreter running a binary incrementer | [turing.js](https://github.com/eyereasoner/eyemind/blob/main/examples/turing.js) |
| [Type Inference](https://eyereasoner.github.io/eyemind/examples/deck/type-inference) | Logic Script | Typing rules for a small expression language, run as a checker | [type-inference.js](https://github.com/eyereasoner/eyemind/blob/main/examples/type-inference.js) |
| [Symbolic Derivative](https://eyereasoner.github.io/eyemind/examples/deck/symbolic-derivative) | Logic Script | Symbolic differentiation of structured formulas by the sum, product, quotient, power and chain rules | [symbolic-derivative.js](https://github.com/eyereasoner/eyemind/blob/main/examples/symbolic-derivative.js) |
| [Symbolic differentiation in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/symbolic-derivative-le) | Logical English | Structural rules differentiate a cubic expression and evaluate the resulting tree at two points | [symbolic-derivative-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/symbolic-derivative-le.le) |
| [Group Inverse Uniqueness](https://eyereasoner.github.io/eyemind/examples/deck/group-inverse-uniqueness) | Logic Script | Uniqueness of group inverses derived from the associativity, identity and inverse laws | [group-inverse-uniqueness.js](https://github.com/eyereasoner/eyemind/blob/main/examples/group-inverse-uniqueness.js) |
| [A greatest common divisor with coefficients](https://eyereasoner.github.io/eyemind/examples/deck/gcd-bezout-identity) | Logic Script | Exact extended Euclidean certificates for positive, negative and zero inputs | [gcd-bezout-identity.js](https://github.com/eyereasoner/eyemind/blob/main/examples/gcd-bezout-identity.js) |
| [Pell solutions beyond machine-sized integers](https://eyereasoner.github.io/eyemind/examples/deck/pell-equation) | Logic Script | Exact Pell solutions through step 50, checked against the defining equation | [pell-equation.js](https://github.com/eyereasoner/eyemind/blob/main/examples/pell-equation.js) |
| [Pell equations in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/pell-equation-le) | Logical English | An exact recurrence generates large Pell solutions and checks each polynomial identity | [pell-equation-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/pell-equation-le.le) |
| [Count the same selection in two ways](https://eyereasoner.github.io/eyemind/examples/deck/binomial-vandermonde) | Logic Script | Exact binomial coefficients and finite checks of Vandermonde and Pascal row sums | [binomial-vandermonde.js](https://github.com/eyereasoner/eyemind/blob/main/examples/binomial-vandermonde.js) |
| [Fit a line and explain when fitting fails](https://eyereasoner.github.io/eyemind/examples/deck/least-squares-regression) | Logic Script | Straight-line fits from exact sufficient statistics, with explicit degenerate cases | [least-squares-regression.js](https://github.com/eyereasoner/eyemind/blob/main/examples/least-squares-regression.js) |
| [Recover four data bits after one bit flips](https://eyereasoner.github.io/eyemind/examples/deck/hamming-code) | Logic Script | Parity syndromes and correction of a single flipped bit in Hamming(7,4) | [hamming-code.js](https://github.com/eyereasoner/eyemind/blob/main/examples/hamming-code.js) |
| [Squares in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/squares-le) | Logical English | Logical English computes exact squares of three supplied integers | [squares-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/squares-le.le) |

<h3 class="example-topic" id="people">People and places</h3>

Follow family trees, calculate dates and distances, or reason over a directory.

| Example (deck) | Input language | Demonstrates | Source |
| --- | --- | --- | --- |
| [Age](https://eyereasoner.github.io/eyemind/examples/deck/age) | Logic Script | Calendar-year and elapsed-day age checks at an explicit reference date | [age.js](https://github.com/eyereasoner/eyemind/blob/main/examples/age.js) |
| [Easter](https://eyereasoner.github.io/eyemind/examples/deck/easter) | Logic Script | Easter Sunday by the anonymous Gregorian algorithm, 2021 to 2050 | [easter.js](https://github.com/eyereasoner/eyemind/blob/main/examples/easter.js) |
| [Family cousins](https://eyereasoner.github.io/eyemind/examples/deck/family-cousins) | Logic Script | Generations, family branches and cousin relationships | [family-cousins.js](https://github.com/eyereasoner/eyemind/blob/main/examples/family-cousins.js) |
| [N3 family queries](https://eyereasoner.github.io/eyemind/examples/deck/family-n3) | Notation3 | Notation3 backward ancestry and log:query compiled to Logic Script | [family-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/family-n3.n3) |
| [Ancestry on demand](https://eyereasoner.github.io/eyemind/examples/deck/family-recursion-n3) | Notation3 | Recursive backward ancestry selected by a query | [family-recursion-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/family-recursion-n3.n3) |
| [Ancestry by forward closure](https://eyereasoner.github.io/eyemind/examples/deck/family-srl) | SPARQL 1.2 RL | Recursive forward ancestry over a three-generation family tree | [family-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/family-srl.srl) |
| [Cousins across family branches](https://eyereasoner.github.io/eyemind/examples/deck/family-cousins-srl) | SPARQL 1.2 RL | Bounded generations and inherited branch labels identify cousins across a family tree | [family-cousins-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/family-cousins-srl.srl) |
| [A family with OWL 2 RL](https://eyereasoner.github.io/eyemind/examples/deck/family-owl2rl) | RDF | OWL 2 RL chains infer grandparents and functional properties expose a sameAs/differentFrom conflict | [family-owl2rl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/family-owl2rl.ttl) |
| [People with OWL 2 RL](https://eyereasoner.github.io/eyemind/examples/deck/people-owl2rl) | RDF | OWL 2 RL includes RDFS class and property rules to infer people's types and a broader contact relation | [people-owl2rl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/people-owl2rl.ttl) |
| [Validate a directory](https://eyereasoner.github.io/eyemind/examples/deck/people-shacl) | RDF | SHACL reports a missing name and an underage directory entry with standard validation results | [people-shacl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/people-shacl.ttl) |
| [French cities](https://eyereasoner.github.io/eyemind/examples/deck/french-cities-n3) | Notation3 | French cities that can reach Nantes through one-way links and explicit schema rules | [french-cities-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/french-cities-n3.n3) |
| [Grandparents and reverse links](https://eyereasoner.github.io/eyemind/examples/deck/property-paths-srl) | SPARQL 1.2 RL | Sequential and inverse property paths derive grandparent and child-to-parent links | [property-paths-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/property-paths-srl.srl) |
| [Completing route distances](https://eyereasoner.github.io/eyemind/examples/deck/distances-srl) | SPARQL 1.2 RL | Missing kilometre distances are converted from miles without replacing base data | [distances-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/distances-srl.srl) · [data/distances-srl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/data/distances-srl.ttl) |
| [A Unicode directory](https://eyereasoner.github.io/eyemind/examples/deck/strings-srl) | SPARQL 1.2 RL | Directory listings, initials and language information from Unicode names | [strings-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/strings-srl.srl) |
| [Course certificates in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/course-certificates-le) | Logical English | Recursive course requirements and prior learning lead to shared dossiers, audits and nested certificate witnesses | [course-certificates-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/course-certificates-le.le) |
| [The Good Cobbler](https://eyereasoner.github.io/eyemind/examples/deck/good-cobbler) | Logic Script | Trade-specific classification from structured descriptions | [good-cobbler.js](https://github.com/eyereasoner/eyemind/blob/main/examples/good-cobbler.js) |
| [A trade inside a list](https://eyereasoner.github.io/eyemind/examples/deck/good-cobbler-srl) | SPARQL 1.2 RL | RDF list patterns extract a trade from a structured description | [good-cobbler-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/good-cobbler-srl.srl) |
| [A Skolem mother for each person](https://eyereasoner.github.io/eyemind/examples/deck/existential-n3) | Notation3 | Skolem mother IRIs and reciprocal child relations for each person | [existential-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/existential-n3.n3) |

<h3 class="example-topic" id="linked-data">Linked data and evidence</h3>

Trace a claim to its source, join named graphs, or reason across an RDF vocabulary.

| Example (deck) | Input language | Demonstrates | Source |
| --- | --- | --- | --- |
| [Who supplied a statement?](https://eyereasoner.github.io/eyemind/examples/deck/annotation-evidence-srl) | SPARQL 1.2 RL | A named reifier links an asserted statement to its author and recording date | [annotation-evidence-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/annotation-evidence-srl.srl) |
| [Choosing between reports](https://eyereasoner.github.io/eyemind/examples/deck/annotated-claims-n3) | Notation3 | Conflicting RDF 1.2 annotated claims ranked by confidence and trust, with typed literals read as numbers | [data/annotated-claims-n3.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/data/annotated-claims-n3.ttl) · [annotated-claims-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/annotated-claims-n3.n3) |
| [Who stated it, and when?](https://eyereasoner.github.io/eyemind/examples/deck/annotation-n3) | Notation3 | An RDF 1.2 annotation: an asserted triple recovered with the reifier that records who stated it and when | [data/annotation-n3.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/data/annotation-n3.ttl) · [annotation-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/annotation-n3.n3) |
| [Accepting a claim](https://eyereasoner.github.io/eyemind/examples/deck/triple-term-n3) | Notation3 | An RDF 1.2 triple term: a claim names a triple without asserting it, and accepting the claim asserts it | [data/triple-term-n3.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/data/triple-term-n3.ttl) · [triple-term-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/triple-term-n3.n3) |
| [A reviewed claim](https://eyereasoner.github.io/eyemind/examples/deck/nested-triple-term-n3) | Notation3 | Nested RDF 1.2 triple terms: one pattern reaches the triple inside a claim inside a review | [data/nested-triple-term-n3.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/data/nested-triple-term-n3.ttl) · [nested-triple-term-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/nested-triple-term-n3.n3) |
| [Labels that keep their direction](https://eyereasoner.github.io/eyemind/examples/deck/directional-language-n3) | Notation3 | RDF 1.2 directional language strings keep their base direction through a display rule | [data/directional-language-n3.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/data/directional-language-n3.ttl) · [directional-language-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/directional-language-n3.n3) |
| [Ancestors in a named graph](https://eyereasoner.github.io/eyemind/examples/deck/trig-named-graph-n3) | Notation3 | Ancestors derived within a TriG named graph, each conclusion kept in its named-graph formula | [data/trig-named-graph-n3.trig](https://github.com/eyereasoner/eyemind/blob/main/examples/data/trig-named-graph-n3.trig) · [trig-named-graph-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/trig-named-graph-n3.n3) |
| [Accepting a named-graph claim](https://eyereasoner.github.io/eyemind/examples/deck/trig-triple-term-n3) | Notation3 | A triple term inside a named graph, asserted in a formula named for the graph that holds the claim | [data/trig-triple-term-n3.trig](https://github.com/eyereasoner/eyemind/blob/main/examples/data/trig-triple-term-n3.trig) · [trig-triple-term-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/trig-triple-term-n3.n3) |
| [Joining a graph and its reporter](https://eyereasoner.github.io/eyemind/examples/deck/trig-graph-join-n3) | Notation3 | Data about a named graph in the default graph joined with data inside that graph | [data/trig-graph-join-n3.trig](https://github.com/eyereasoner/eyemind/blob/main/examples/data/trig-graph-join-n3.trig) · [trig-graph-join-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/trig-graph-join-n3.n3) |
| [Strong links and their sources](https://eyereasoner.github.io/eyemind/examples/deck/provenance-srl) | SPARQL 1.2 RL | Strong annotated links yield connections and source-attributed triple terms | [provenance-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/provenance-srl.srl) |
| [Reading a nested collection](https://eyereasoner.github.io/eyemind/examples/deck/collection-nesting-srl) | SPARQL 1.2 RL | Property paths read nested RDF lists and a blank node property | [collection-nesting-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/collection-nesting-srl.srl) |
| [Describing quoted graphs with lists](https://eyereasoner.github.io/eyemind/examples/deck/graph-term-emulation-srl) | SPARQL 1.2 RL | Closed lists of quoted triples yield graph metadata through recursive list traversal | [graph-term-emulation-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/graph-term-emulation-srl.srl) |
| [Messages keep their boundaries](https://eyereasoner.github.io/eyemind/examples/deck/message-boundaries-n3) | Notation3 | Ordered RDF Messages preserve an empty heartbeat and distinguish reused blank-node labels | [message-boundaries-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/message-boundaries-n3.n3) · [data/message-boundaries-n3.trig](https://github.com/eyereasoner/eyemind/blob/main/examples/data/message-boundaries-n3.trig) |
| [A named graph inside a message](https://eyereasoner.github.io/eyemind/examples/deck/message-provenance-n3) | Notation3 | Reporters and named-graph readings join within each message without crossing its boundary | [message-provenance-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/message-provenance-n3.n3) · [data/message-provenance-n3.trig](https://github.com/eyereasoner/eyemind/blob/main/examples/data/message-provenance-n3.trig) |
| [A time and identifiers for each order](https://eyereasoner.github.io/eyemind/examples/deck/execution-identifiers-srl) | SPARQL 1.2 RL | Orders share one execution time and receive distinct UUID IRIs and strings | [execution-identifiers-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/execution-identifiers-srl.srl) |
| [OWL Property Chain](https://eyereasoner.github.io/eyemind/examples/deck/owl-property-chain) | Logic Script | A property chain declared as data, followed by one general rule | [owl-property-chain.js](https://github.com/eyereasoner/eyemind/blob/main/examples/owl-property-chain.js) |
| [A transport thesaurus](https://eyereasoner.github.io/eyemind/examples/deck/thesaurus-skos) | RDF | SKOS closes concept hierarchies, exact mappings and ordered collection membership | [thesaurus-skos.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/thesaurus-skos.ttl) |
| [Exact OWL numeric values](https://eyereasoner.github.io/eyemind/examples/deck/datatypes-owl2rl) | RDF | OWL exact numeric values substitute across lexical forms and an invalid byte range yields a conflict | [datatypes-owl2rl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/datatypes-owl2rl.ttl) |

<h3 class="example-topic" id="science">Science and measurements</h3>

Normalize units, reason about observations, or check a model in engineering and physics.

| Example (deck) | Input language | Demonstrates | Source |
| --- | --- | --- | --- |
| [Normalize, then validate](https://eyereasoner.github.io/eyemind/examples/deck/measurement-shacl) | RDF | QUDT converts speed readings before SHACL checks a sequence path against a numeric limit | [measurement-shacl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/measurement-shacl.ttl) |
| [QUDT quantities](https://eyereasoner.github.io/eyemind/examples/deck/quantities-qudt) | RDF | QUDT normalizes CDT literals, Fahrenheit, decibels and a locally defined length unit | [quantities-qudt.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/quantities-qudt.ttl) |
| [Composed QUDT units](https://eyereasoner.github.io/eyemind/examples/deck/composed-units-qudt) | RDF | QUDT composes units from factor units, prefixes and prefixed names, normalizes any dimension to SI and reports a currency | [composed-units-qudt.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/composed-units-qudt.ttl) |
| [Control System](https://eyereasoner.github.io/eyemind/examples/deck/control-system) | Logic Script | Feedforward and nonlinear feedback commands for two actuators | [control-system.js](https://github.com/eyereasoner/eyemind/blob/main/examples/control-system.js) |
| [Leg Length Discrepancy](https://eyereasoner.github.io/eyemind/examples/deck/lldm) | Logic Script | Leg length discrepancy measured from radiograph landmarks, with an alarm and its reason | [lldm.js](https://github.com/eyereasoner/eyemind/blob/main/examples/lldm.js) |
| [Bayes Diagnosis](https://eyereasoner.github.io/eyemind/examples/deck/bayes-diagnosis) | Logic Script | Normalized probabilities for illustrative printer faults | [bayes-diagnosis.js](https://github.com/eyereasoner/eyemind/blob/main/examples/bayes-diagnosis.js) |
| [Superdense Coding](https://eyereasoner.github.io/eyemind/examples/deck/superdense-coding) | Logic Script | Superdense coding in discrete quantum theory, with interference as odd path counts | [superdense-coding.js](https://github.com/eyereasoner/eyemind/blob/main/examples/superdense-coding.js) |
| [Teleportation](https://eyereasoner.github.io/eyemind/examples/deck/teleportation) | Logic Script | Quantum teleportation in discrete quantum theory, checked for every state and outcome | [teleportation.js](https://github.com/eyereasoner/eyemind/blob/main/examples/teleportation.js) |
| [An alert belongs to one observation](https://eyereasoner.github.io/eyemind/examples/deck/message-alerts-n3) | Notation3 | Independent sensor messages raise an alert only for the observation above the temperature threshold | [message-alerts-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/message-alerts-n3.n3) · [data/message-alerts-n3.nt](https://github.com/eyereasoner/eyemind/blob/main/examples/data/message-alerts-n3.nt) |
| [Sensor messages become SOSA observations](https://eyereasoner.github.io/eyemind/examples/deck/observations-owl2rl) | RDF | Streamed sensor messages each yield the SOSA triples an output contract asks for, through rules specialized once to the shape of the messages | [observations-owl2rl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/observations-owl2rl.ttl) · [observations-owl2rl.js](https://github.com/eyereasoner/eyemind/blob/main/examples/observations-owl2rl.js) · [data/observations-owl2rl.trig](https://github.com/eyereasoner/eyemind/blob/main/examples/data/observations-owl2rl.trig) |
| [Shapes plan the rules for sensor messages](https://eyereasoner.github.io/eyemind/examples/deck/shape-planning-owl2rl) | RDF | SHACL input and output shapes let streamed sensor messages run rules specialized before the first message and yield only the SOSA triples asked for | [shape-planning-owl2rl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/shape-planning-owl2rl.ttl) · [shape-planning-owl2rl-shacl-in.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/shape-planning-owl2rl-shacl-in.ttl) · [shape-planning-owl2rl-shacl-out.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/shape-planning-owl2rl-shacl-out.ttl) · [data/shape-planning-owl2rl.trig](https://github.com/eyereasoner/eyemind/blob/main/examples/data/shape-planning-owl2rl.trig) |

## Running the examples


Native examples are Logic Script (LS) programs in `.js` files. eyemind also
runs N3, SPARQL 1.2 RL, Logical English and ODRL snapshot examples by compiling them to LS.

Each example comes with a short card deck that explains it for a wide audience: the question it asks, what the program says, what eyemind concludes, why, and what the proof checker confirms. Cards are separated by `---`, so a deck reads as plain Markdown here and works as slides in Markdown slide tools such as Marp.

For practical decisions, try [outage recovery](https://eyereasoner.github.io/eyemind/examples/deck/service-outage-recovery),
[project scheduling](https://eyereasoner.github.io/eyemind/examples/deck/critical-path-schedule), [battery dispatch](https://eyereasoner.github.io/eyemind/examples/deck/battery-dispatch),
[cold-chain evidence](https://eyereasoner.github.io/eyemind/examples/deck/cold-chain-recall), or [school placement audits](https://eyereasoner.github.io/eyemind/examples/deck/school-placement-audit).
For mathematical calculations, try [Bézout certificates](https://eyereasoner.github.io/eyemind/examples/deck/gcd-bezout-identity),
[Pell equations](https://eyereasoner.github.io/eyemind/examples/deck/pell-equation), [binomial identities](https://eyereasoner.github.io/eyemind/examples/deck/binomial-vandermonde),
[least-squares regression](https://eyereasoner.github.io/eyemind/examples/deck/least-squares-regression), or [Hamming codes](https://eyereasoner.github.io/eyemind/examples/deck/hamming-code).
For Notation3, try [family queries](https://eyereasoner.github.io/eyemind/examples/deck/family-n3),
[scoped negation](https://eyereasoner.github.io/eyemind/examples/deck/scoped-negation-n3),
[invoice totals](https://eyereasoner.github.io/eyemind/examples/deck/invoice-n3),
[French cities](https://eyereasoner.github.io/eyemind/examples/deck/french-cities-n3), or
[delivery witnesses](https://eyereasoner.github.io/eyemind/examples/deck/witnesses-n3).
Run the `.n3` files directly in the playground or on the command line.
Use `eyemind --program NAME.n3` to inspect the compiled rules. The RDF 1.2
examples use data in `data/` with companion N3 rules in this directory.
TriG named graphs become quoted `graph:content` formulas, as described in
the [guide](https://eyereasoner.github.io/eyemind/#notation3).
For SPARQL 1.2 RL, try [property paths](https://eyereasoner.github.io/eyemind/examples/deck/property-paths-srl),
[nested collections](https://eyereasoner.github.io/eyemind/examples/deck/collection-nesting-srl),
[statement evidence](https://eyereasoner.github.io/eyemind/examples/deck/annotation-evidence-srl),
[candidate routes](https://eyereasoner.github.io/eyemind/examples/deck/dijkstra-srl),
[exact decimals and doubles](https://eyereasoner.github.io/eyemind/examples/deck/exact-decimals-srl),
or [execution times and UUIDs](https://eyereasoner.github.io/eyemind/examples/deck/execution-identifiers-srl).
These `.srl` programs write Turtle output.
For ODRL policies and a state-of-the-world snapshot in one Turtle file, try
[handicap-card issuance](https://eyereasoner.github.io/eyemind/examples/deck/handicap-card).
With `--odrl`, the compiled LS includes validation and evaluation; the result is one Turtle report.
The [LE counterpart](https://eyereasoner.github.io/eyemind/examples/deck/handicap-card-le)
selects the same evaluator from its source and writes an equivalent LE report.
For Logical English, try [Socrates](https://eyereasoner.github.io/eyemind/examples/deck/socrates-le),
[integer squares](https://eyereasoner.github.io/eyemind/examples/deck/squares-le),
[record creation](https://eyereasoner.github.io/eyemind/examples/deck/records-le),
[British citizenship](https://eyereasoner.github.io/eyemind/examples/deck/british-citizenship-le) with
alternative premises, or [library fines](https://eyereasoner.github.io/eyemind/examples/deck/library-fines-le)
and an [election tally](https://eyereasoner.github.io/eyemind/examples/deck/election-tally-le) with aggregates.
Their sources and conclusions use `NAME-le.le`; proofs and check reports use `NAME-le.js`.
For OWL 2 RL inference, including RDFS, try the [people directory](https://eyereasoner.github.io/eyemind/examples/deck/people-owl2rl)
and the [family ontology](https://eyereasoner.github.io/eyemind/examples/deck/family-owl2rl)
with `--owl2rl`. Both compile to standalone LS and write new triples as Turtle;
the family example also reports an equality conflict.
For RDF Messages, try [message boundaries and heartbeats](https://eyereasoner.github.io/eyemind/examples/deck/message-boundaries-n3),
[independent alerts](https://eyereasoner.github.io/eyemind/examples/deck/message-alerts-n3),
or [named-graph provenance](https://eyereasoner.github.io/eyemind/examples/deck/message-provenance-n3).
[Sensor observations](https://eyereasoner.github.io/eyemind/examples/deck/observations-owl2rl) stream
messages through `--owl2rl` rules specialized to their shape and pruned to a Logic Script output
contract; [shape planning](https://eyereasoner.github.io/eyemind/examples/deck/shape-planning-owl2rl)
plans the same rules from SHACL input and output shapes before the first message.
Streamed runs save output only.

For quantity normalization, try [QUDT quantities](https://eyereasoner.github.io/eyemind/examples/deck/quantities-qudt)
with `--qudt`, and [composed units](https://eyereasoner.github.io/eyemind/examples/deck/composed-units-qudt)
for units built from QUDT units. The [transport thesaurus](https://eyereasoner.github.io/eyemind/examples/deck/thesaurus-skos)
uses `--skos`. The [directory](https://eyereasoner.github.io/eyemind/examples/deck/people-shacl)
uses `--shacl`, and [speed readings](https://eyereasoner.github.io/eyemind/examples/deck/measurement-shacl)
combine `--qudt --shacl` to validate normalized values.

Run a source, generate its proof, or check its saved proof:

```sh
eyemind examples/socrates.js
eyemind -c examples/socrates.js
eyemind --proof examples/socrates.js
eyemind --check-proof examples/proof/socrates.js examples/socrates.js
```

Each program has a matching conclusion file in `output/`, a certificate in
`proof/`, and its check report in `check/`. JavaScript examples
save term documents as `.js`; N3 examples save `.n3` output, SRL examples
save Turtle as `.ttl`, LE examples save `.le`, and the text report saves `.txt`. Proofs and check
reports are JavaScript expressions read as data, saved as `.js` for every
example except a streamed one, which runs each RDF Message independently and
saves its output only. Every file of an example is named after the
example, and the name of an N3 or SRL example ends in `-n3` or `-srl`:
`socrates.js`, `socrates-n3.n3` and `socrates-srl.srl` are the examples
`socrates`, `socrates-n3` and `socrates-srl`, with outputs
`output/socrates.js`, `output/socrates-n3.n3` and `output/socrates-srl.ttl`,
proofs `proof/socrates.js`, `proof/socrates-n3.js` and
`proof/socrates-srl.js`, check reports `check/socrates.js`,
`check/socrates-n3.js` and `check/socrates-srl.js`, and decks in `deck/`
under the same names. Data files follow the rule too, as
`data/annotation-n3.ttl` beside `annotation-n3.n3`. The same command checks each proof against its
original inputs.

## Notes on selected examples

The [derived forward rule](https://eyereasoner.github.io/eyemind/examples/deck/derived-rule), [derived backward rule](https://eyereasoner.github.io/eyemind/examples/deck/derived-backward-rule),
and [conjunction of backward templates](https://eyereasoner.github.io/eyemind/examples/deck/derived-backward-rule-2) show
rules enabled by other rules. Inline `implies(Body, Head)` and
`implied_by(Head, Body)` templates capture their generating context and keep
their other variables local. Arrays can join templates or the goals within
one template. Each generated rule has a proved activation; its dependencies
are visible to stratification before reasoning starts.

`audited-grants.js` shows what one language makes possible. It states an
energy grant policy as a program of its own, has eyemind prove the decisions,
and then reads that proof and its check report back as ordinary facts, with
`eyemind.readTerms` and `facts_from`, to audit the reasoning: the data each decision
rests on, the absences it assumes, and the decisions at risk because
they rest on self-declared income. Rules, data, conclusions, proof and report
are all the same terms, so the audit needs no export format, no parser and no
second tool, and its own conclusions come with a checked proof too.

`integrity.js` intentionally exits with code 65 because it concludes `false`.
Its proof-check report is valid: the proof shows the firings that make the
constraint fail. A halted run's proof establishes that its claims follow, not
that they are every answer.

A proof ends with its certificate: `called(Call, Answers)` records every
answer of one call the original questions make, and `derived(Pattern, Facts)`
every fact the forward rules derived for one relation those searches
consulted. The checker answers each question by expanding it one level
against the program, with every inner call answered from its table, checks
each table the same way, and requires each listing to be closed under the
rules; calls over relations only facts define need no table. Each listed fact
replays the firing its step records, so negations, collections and first
answers are decided as the search decided them. The claims must then be
exactly the answers: a check establishes that they follow from the program
and that none is missing.

Every check file lists the claims and ends with a `verdict(...)` fact; a
failed check also lists its `failure(...)` facts. Add `--json` to the check
command for JSON output instead.

`fibonacci.js` answers F(0), F(1), F(10), F(100), F(1000) and F(10000), the
last a 2090-digit integer, then divides successive values to watch the ratio
converge on the golden ratio. It uses fast doubling, which halves the index at
each recursive step and fits within the default reasoning limits. Its saved
proof is checked by recomputing that arithmetic as the call tables are
expanded.

The `deep-taxonomy` examples are the deep-taxonomy benchmark: one individual, a
chain of subclass rules, and two sibling branches at every level that lead
nowhere. The goal has to follow the single productive branch the whole way
down, so the chain length is also the backward recursion depth. The five sizes
run from ten to a hundred thousand levels, and each costs exactly one
resolution step per level, which `--stats` reports and the saved check report
confirms: `deep-taxonomy-100000` verifies 100001 steps. Each program states
its rules with a JavaScript loop rather than one by one, which keeps even the
largest a few lines long instead of 14 MB. Backward search is an explicit
machine, so the depth costs heap rather than host stack.

```sh
eyemind --stats examples/deep-taxonomy-10000.js
```

Time, proof size and checking all grow linearly with the depth, so a longer
chain only costs proportionally more; the ten-thousand-level certificate is
about 1.4 MB, since a certificate records every step it claims.

`path-discovery.js` contains 7,698 airport records and 37,505 directed
connections. Its default goal finds three routes from Ostend to Prague with
at most two stopovers. Use any airport-name atoms and a nonnegative integer
limit with `path_discovery(From, To, MaxStopovers, Path)`:

```sh
eyemind --goal "path_discovery('Liège Airport', 'Václav Havel Airport Prague', 1, Path)" examples/path-discovery.js
goal="path_discovery('Ostend-Bruges International Airport', 'Liège Airport', 0, Path)"
eyemind --proof --goal "$goal" examples/path-discovery.js > /tmp/route-proof.js
eyemind --check-proof /tmp/route-proof.js --goal "$goal" examples/path-discovery.js
```

`--goal` replaces the default goal, so checking that proof names the same goal. Zero stopovers allows only direct flights;
N stopovers allows at most N+1 flights. Routes follow the recorded direction
and never repeat an airport. Equal endpoints and unknown names return no
routes. Negative or noninteger limits also return no routes. You can leave
`From` or `To` as a variable to discover endpoints; keep `MaxStopovers` bound.
List the available names with `--goal "airport(Id, Name)"`. These are historical
network records, rather than current flight schedules. The search uses explicit
disequalities to prevent cycles.
Large bounds on a dense network may still reach the configured reasoning limits.

`peano.js` represents natural numbers as `'zero'`, `s('zero')`, and so on. Its
addition goal enumerates every split of a known sum, and a second goal chains
all three relations: `(1*2)+3` is 5, whose factorial is 120 nested successors.
`expression-eval.js` evaluates a graph for `(2*3)+(10-4)` and emits
`result('example', 12)`.

`complex.js` adds a numeric domain the engine knows nothing about. A complex
number is the ordinary term `complex(Real, Imaginary)`, and addition,
multiplication, conjugation, division, norm, modulus and integer powers are all
ordinary clauses over integer arithmetic. Sums, products, conjugates, norms and
integer powers stay exact integers. Division uses `div`, which is true
division: dividing `complex(-5, 10)` by `complex(1, 2)` recovers
`complex(3.0, 4.0)`, and the same division applied to `complex(3, 4)` yields
`complex(2.2, -0.4)`.
The example also derives `i*i = -1` from the multiplication clause rather than
assuming it, confirms that the Gaussian norm is multiplicative, and raises
`complex(1, 1)` to the eighth power by repeated squaring.

Polar form then leaves the integers altogether, so a complex number can be
raised to a complex power. The square root of -1 is `i`, `e` to the power `i*pi`
is -1, `i` to the power `i` is the real number 0.20787957635076193, and the
inverse sine and cosine of 2 are complex. Logarithm, sine, cosine, tangent and
arctangent follow, each applied to the answer of its own inverse so the
round trip is visible: the sine of the arcsine of 2 comes back as 2. The
checker recomputes each primitive calculation of its proof:

```sh
eyemind --goal "complex_power(complex(1, 1), 16, Result)" examples/complex.js
eyemind --goal "complex_div(complex(1, 0), complex(0, 1), Inverse)" examples/complex.js
```

`polynomial.js` is Alain Colmerauer's solver for polynomial equations up to
degree 4, with complex coefficients and roots as `[Re, Im]` pairs. Degree 3
follows Cardan's formula and degree 4 Lagrange's method, which solves a cubic
on the way. Its default goals find the roots of (x-1)(x-2)(x-3)(x-4) and of a
quartic with complex coefficients whose roots are 3+2i, 5+i, i and 1+i, each
up to rounding. The original evaluates expressions by building calls with
`=..` (here `univ`); here each operation has its own clause, and the zero tests compare
numbers instead of cutting. Lagrange's step collects the roots of a cubic with
a predicate of its own, so that collection depends only on a lower degree.

A list of all roots is a completed collection, so the default proof has no
steps: its call tables answer the goals, and the checker recomputes the
arithmetic as it expands them. One root at a time can be proved too:

```sh
eyemind --proof --goal "racine([[1, 0], [-6, 0], [11, 0], [-6, 0]], Z)" examples/polynomial.js
```

`queens.js` returns the first solution for an 8x8 board by default; another
goal enumerates other board sizes:

```sh
eyemind --goal "queens(4, Columns)" examples/queens.js
eyemind --goal "add(A, B, s(s(s('zero'))))" examples/peano.js
```

`interval-relations.js` uses half-open intervals with integer-minute endpoints.
It completes endpoints from durations and classifies each valid interval pair
into exactly one of thirteen relations. Empty and reversed intervals are
excluded from classification.

`control-system.js` computes two actuator commands. The first is a
proportional part on a conditioned measurement minus a feedforward
compensation, the base-10 logarithm of a measured disturbance. The second is
a proportional, nonlinear differential feedback controller on the error
between a target and an output. The results are ordinary floats, and the proof
recomputes every arithmetic step. Guards keep every input from stopping the
run: the logarithm is taken only of a positive disturbance, and the nonlinear
factor, which divides by the error, is left out when the output is on target.

`lldm.js` measures a leg length discrepancy from four landmarks on a
radiograph. Two landmarks fix a reference line, and each leg runs from one of
the other two to its perpendicular projection on that line. With a 1.25 cm
threshold the measured legs, 21.55 cm and 23.46 cm, raise an alarm, printed
with the lengths, the discrepancy, the threshold and the reason. The reason
names the side of the threshold that fired; the version this was adapted from
gave the same reason for both. Every intermediate value is a separate `val/3`
clause, so checking its proof recomputes each one.

`bayes-diagnosis.js` models printer faults using illustrative priors and two
conditionally independent observations. It keeps exact integer likelihood
weights and their collected total alongside a floating-point probability.
`policy-risk.js` reports a rank, clause, clamped score, severity, reason and
mitigation. Rank 1 has the highest score; equal scores share a rank. Output
follows inference order, with ranks recorded explicitly. Adding the missing
safeguards removes the affected findings. The checker decides their
collections, and the absences behind the policy findings, from the proofs'
call tables.

`research-portal.js` evaluates a hospital research portal under two rulebooks.
An ODRL/DPV policy decides research access first, then the baseline or
original Digital Omnibus rulebook decides the device-consent step. Eleven
sessions produce permits with planned deletion duties, pending device consent,
or explicit policy and device refusals. Three incidents have notification
plans under both regimes, always retaining internal documentation. Changes
compare final plans; a device exemption never overrides withdrawn research
consent or a prohibition.

`package-holiday.js` is the same pattern in the domain of leisure. A tour
operator's cancellation terms, written as an ODRL offer, decide first who may
cancel and at what fee; then the EU Package Travel Directive, in its 2015
version and as revised in 2026, decides when a cancellation is free and how
the money comes back. Eight cancellations and two complaints are decided
under both versions, with fees and refunds computed in euro. The revision
makes a cancellation free when floods close the departure airport, gives
accepted vouchers statutory guarantees, and sets complaint deadlines. Every
condition of the terms has its derivation checked, and the check establishes
that the decisions are every answer.

`delfour.js` shares a conclusion instead of the data behind it, in the
scenario of Ruben Verborgh's
[*Inside the insight economy*](https://ruben.verborgh.org/blog/2025/08/12/inside-the-insight-economy/).
A shopper's phone turns a household's diabetes into a neutral low-sugar
insight, restricted to the Delfour supermarket and its self-scanner, expiring
in two hours, wrapped with an ODRL policy and signed; the post leaves those
details open, and the example fills them in. The scanner reasons only from
that insight: it shows the sugar per serving of each product scanned, flags
the 12 g biscuits against the 10 g threshold, and suggests the 3 g biscuits
in aisle 7. Ten checks pass, among them
that the shared text names no condition, found by searching it with
`atom_concat`. That no other biscuit has less sugar and that the text holds
neither "diabetes" nor "medical" are absences, which the proof's call tables
decide. The
signature is accepted because the input says it was verified upstream; the
rules do not recompute the HMAC.

`deontic-logic.js` states duties as plain relations: alice was obliged to
obtain consent and prohibited from sharing a record. Observations say what she
did and, explicitly, what she did not do; a missed obligation is read only
from an explicit `not_performed` fact, never from a missing observation.
Notifying the data protection officer compensates the sharing, but the
violation stays on record. Nothing compensates the missed consent, so alice's
status is `requires_review`. Its proof checks: every status
follows from the program, and none is missing.

`nixon-diamond.js` sets two defaults against each other: Quakers are pacifists
and Republicans are nonpacifists, and nixon is both. The pacifist default is
guarded by `not(nonpacifist(Person))`, so the Republican rule takes priority,
and stratification runs the default only after the nonpacifist rule has
finished. nixon is classified as a nonpacifist and not as a pacifist, while
ada, only a Quaker, gets the default. The proof rests on one negation, that
nothing concludes ada is a nonpacifist, which its call tables and the closed
listing of nonpacifists decide.

`owl-property-chain.js` defines grandparent as a chain of two parent links,
stored as a plain list of property names next to the triples. One forward rule
takes a chain's first property and hands the rest of the list to a backward
rule, `follow_chain`, which takes one link per property; the list gets shorter
at each step, so the walk always ends. The program concludes that Alice is
Carol's grandparent and Bob is Dave's. Declaring a longer chain needs no new
rule.

`age.js` checks whether a person's age strictly exceeds `years(N)` or `days(N)`.
It uses `as_of(date(2026, 10, 1))` for reproducible output and proofs. Edit that
fact to change the default date, or pass a reference date directly:

```sh
eyemind examples/age.js
eyemind --goal "age_above('pat_h', years(80), date(2024, 8, 22))" examples/age.js
eyemind --goal "age_days('pat_h', date(2026, 10, 1), Days)" examples/age.js
```

Exactly on the threshold anniversary, `age_above` fails; it succeeds on the
following day. A February 29 anniversary falls on February 28 in a non-leap
year. Elapsed days follow the Gregorian calendar, including century leap-year
rules. Invalid dates, future births, unknown people, and negative or noninteger
thresholds return no answers. Reference dates are explicit source data rather
than clock readings, so its proof checks the same on any day.

The classics from `ackermann.js` to `teleportation.js` are written without a
library. Relations such as `between`, `member` or `length` are defined in
each program as ordinary clauses, and a search commits with `once`, or with
guards that make its alternatives exclusive.

`ackermann.js` computes A(4, 2), a number with 19,729 digits, through the
hyperoperation sequence: addition, multiplication and exponentiation have closed
forms, and every higher level is the one below it iterated. `peasant.js`
multiplies and raises to powers using only halving, doubling and addition.
`sieve.js` lists the primes below 100 by striking out multiples from an
explicit list; it stops there because its certificate records every
intermediate list, which grows far faster than the answer.

`goldbach.js` splits every power of two from 4 to 2^25 into two primes, taking
the split with the smallest prime. `easter.js` dates Easter Sunday for 2021 to
2050 with the anonymous Gregorian algorithm, every step integer arithmetic on
the year. `turing.js` is a Turing machine interpreter running a machine that
adds one to a binary number.

`zebra.js` solves Einstein's riddle by narrowing a list of five partially known
houses with unification alone. `aunt-agatha.js` is Pelletier's problem 55
(TPTP PUZ001), a classic test for theorem provers: nine premises about the
three residents of Dreadbury Mansion, and the claim that Agatha killed
herself. A puzzle like the zebra asks for one solution; this one asks what
follows, which is what holds in every situation the premises allow. The
premises leave open who hates whom and who is richer than whom, so the program
enumerates every model of them: Agatha is the killer in four, the butler and
Charles in none. A full model is printed as a witness, with a proof that each
premise holds in it. `four-color.js` colours the 27 countries of the
European Union so that no neighbours share a colour. `wolf-goat-cabbage.js`
shows that a safe crossing takes seven trips and that no shorter one exists,
then prints both seven-trip plans. `monkey-bananas.js` lists every plan of up
to five moves that gets the monkey the bananas, shortest first.

`gps.js` is goal-driven parallel sequences: it finds sequences of actions from
the current state to a goal state, here driving from Gent to Oostende on a
partial map of Belgium. Duration and cost add up along a path and belief and
comfort multiply, and each must stay within its limit, as must the number of
stages, runs of steps in the same map. Two routes qualify, directly through
Brugge and the longer one through Kortrijk. The original keeps the current
state in the database, reading transitions with `clause/2` and asserting and
retracting fluents as it moves; here the state is a list of fluents passed
along the search, so every step is an ordinary clause instance and the
proof checks. Stages are counted as changes of map plus
one, where the original stops counting at two.

`superdense-coding.js` sends two classical bits through one qubit in discrete
quantum theory, where amplitudes come from a finite field and the merge of
alternative branches is exclusive: an answer survives when it is reached an odd
number of times. The original toggles asserted facts to get that parity; here
each of Alice's messages N and Bob's readings M collects its ways through the
shared entangled pair and keeps the pair when their number is odd. Every
message arrives as itself by exactly one way, and every wrong reading by two
ways that cancel or by none, so Bob reads 0 to 3 exactly as Alice sent them.
The parity depends on all the ways, so the proof's call tables record the
collections behind its answers, and the checker decides them.

`teleportation.js` runs the companion protocol in the same theory, with the
same relations. Alice measures the qubit to send together with her half of the
entangled pair, in the four-state basis Bob decodes with in superdense coding,
and sends him the outcome. Bob applies the inverse of that basis relation, which
turns out to be one of Alice's four operations from superdense coding, to his
half. For each of the three nonzero states over the two-element field and each
of the four outcomes, Bob ends up holding exactly the state Alice sent, and a
`contradiction(...)` rule would stop the run with exit code 65 if he did not. The
protocol was written for this collection.

Proofs that lean on a completed search write that search down. In
`kaprekar.js` the whole verification sits inside one negation, so its proof
is 13,556 call tables: the exhaustive check over 705 digit multisets, which
the checker confirms table by table. `four-color.js` collects the countries
with `findall` and rules out conflicts with negation, and its call tables
decide both.

Run `npm test` for the full suite, or `npm test -- examples` for this corpus;
`npm test -- -k socrates` limits it to the tests that mention socrates. Every example
runs through the API, and a few through all three CLI modes. Tests compare
results with saved artifacts and do not overwrite them.

`dijkstra.js` finds a shortest route with Dijkstra's algorithm on six places
joined by nine two-way roads. It keeps a queue of partial routes sorted by
cost, always extends the cheapest one, and settles each place the first time
it leaves the queue. The route from a to f is a, c, b, d, e, f with length 13,
the way back is the same route reversed, and a to a costs 0; a road list with
a negative length is rejected. The cases of the search exclude each other
through `not_unify` and a list walk instead of `not(...)`, so the proof takes
nothing on trust.

`knapsack-optimization.js` chooses an expedition pack worth the most within a
weight limit of 15 from eight items, each taken once or left out. A backward
rule lists all 256 subsets and a forward rule keeps the 113 that fit;
`findall` gathers their values into one list, whose length is the number of
packs that fit and whose maximum, 40, is the best value. The only pack worth
40 takes the atlas, battery, camera, medkit and sensor, weighing exactly 15.
Checking the proof recomputes every sum and comparison, and its call tables
show that the collected list of values is complete.

`type-inference.js` works out the types of six small programs written as
syntax trees: functions with typed parameters, calls, integer addition,
conditionals and pairs. Each kind of expression has one backward typing rule,
and an environment of `[Name, Type]` pairs, innermost first, handles parameter
lookup and shadowing. A call is well typed when a shared variable makes the
function's parameter type and the argument's type agree. Compose gets the type
`fun(fun(t1, t2), fun(fun(t0, t1), fun(t0, t2)))`, and the proof records every
lookup and rule application.

`symbolic-derivative.js` differentiates formulas held as terms, such as
`mul(sym('x'), sym('x'))`, with one backward rule per form: sum, difference,
product, quotient, power and logarithm. Results stay unsimplified, so `x*x`
gives `1*x + x*1` and `log(log(x))` gives `(1/x)/log(x)`; a product of three
factors shows the whole product-rule expansion, and a last goal differentiates
`y/(x-1)`, treating `y` as a constant.

`group-inverse-uniqueness.js` proves that an element of a group has only one
inverse. It assumes x has two inverses, i and j, and states the identity,
inverse and associativity laws as forward rules over a product relation
`product(A, B, AB)`; associativity alone concludes `equal(Left, Right)`. The
program derives `same_inverse('x', 'i', 'j')` and its mirror, and the checked
proof is the textbook chain i = (j·x)·i = j·(x·i) = j·e = j.

After an intentional behavior change, run `node tools/update-examples.js` and review
the source and artifact changes together. When adding an example, register its
name, description and expected halt code (if any) in
[manifest.json](https://github.com/eyereasoner/eyemind/blob/main/examples/manifest.json), then generate its artifacts.
