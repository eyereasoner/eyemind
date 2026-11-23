# Examples

[Run Socrates in the Playground](https://eyereasoner.github.io/eyemind/playground/#example=socrates-le), or open a topic below.
Each example's deck explains the result and links to the source and Playground.

<nav class="example-contents" aria-label="Contents" markdown="block">

- [Rules and proofs](#reasoning)
- [Operations and decisions](#operations)
- [Policy, rights and privacy](#policy)
- [Puzzles, plans and routes](#plans)
- [Mathematics and computing](#mathematics)
- [People and places](#people)
- [Linked data and evidence](#linked-data)
- [Science and measurements](#science)

</nav>

<details class="example-group" markdown="block">
<summary>Rules and proofs</summary>

<div id="reasoning"></div>

- [Socrates](https://eyereasoner.github.io/eyemind/examples/deck/socrates) (Logic Script) — Class membership derived through a subclass rule
- [Socrates in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/socrates-le) (Logical English) — Logical English class facts and an every-rule conclude that Socrates is mortal
- [Socrates in Notation3](https://eyereasoner.github.io/eyemind/examples/deck/socrates-n3) (Notation3) — Class membership follows the subclass hierarchy in Notation3
- [Socrates in SPARQL rules](https://eyereasoner.github.io/eyemind/examples/deck/socrates-srl) (SPARQL 1.2 RL) — Class membership follows the subclass hierarchy in SPARQL 1.2 RL
- [Backward](https://eyereasoner.github.io/eyemind/examples/deck/backward) (Logic Script) — Backward definitions inside forward bodies
- [Graphs](https://eyereasoner.github.io/eyemind/examples/deck/graphs) (Logic Script) — Base data, negation and collection
- [Terms](https://eyereasoner.github.io/eyemind/examples/deck/terms) (Logic Script) — Quoted graphs, triple terms and residual witnesses
- [Existential rules](https://eyereasoner.github.io/eyemind/examples/deck/existential-rules) (Logic Script) — Existential rules: a fresh witness per activation, never a clash
- [Witnesses](https://eyereasoner.github.io/eyemind/examples/deck/witnesses) (Logic Script) — Structured witnesses and shared multi-head conclusions
- [Integrity](https://eyereasoner.github.io/eyemind/examples/deck/integrity) (Logic Script) — A provable integrity violation
- [Unification](https://eyereasoner.github.io/eyemind/examples/deck/unification) (Logic Script) — Open lists and repeated-variable constraints
- [Schema Inference](https://eyereasoner.github.io/eyemind/examples/deck/schema-inference) (Logic Script) — Subclasses, subproperties, domains and ranges
- [Flat Map](https://eyereasoner.github.io/eyemind/examples/deck/flat-map) (Logic Script) — Predicate-based mapping with multiple or missing values
- [Scoped audit](https://eyereasoner.github.io/eyemind/examples/deck/scoped-audit) (Logic Script) — Presence and absence within separate quoted graphs
- [Variable Predicates](https://eyereasoner.github.io/eyemind/examples/deck/variable-predicates) (Logic Script) — Relations selected and renamed through data bindings
- [Paraconsistent Animals](https://eyereasoner.github.io/eyemind/examples/deck/paraconsistent-animals) (Logic Script) — Local summaries of conflicting observations
- [Nixon Diamond](https://eyereasoner.github.io/eyemind/examples/deck/nixon-diamond) (Logic Script) — A default guarded by negation, so a contrary rule takes priority
- [Records in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/records-le) (Logical English) — Explicit absence and an existential conclusion give Alice a fresh record while Bob is blocked
- [Derived forward rule](https://eyereasoner.github.io/eyemind/examples/deck/derived-rule) (Logic Script) — An inline forward rule enabled by a cat and applied to a dog
- [Derived backward rule](https://eyereasoner.github.io/eyemind/examples/deck/derived-backward-rule) (Logic Script) — A captured inverse pair enables a reusable backward rule
- [Two derived backward rules](https://eyereasoner.github.io/eyemind/examples/deck/derived-backward-rule-2) (Logic Script) — A conjunction of backward templates supplies premises for forward reasoning
- [Reasoning about a rule](https://eyereasoner.github.io/eyemind/examples/deck/rule-inspection) (Logic Script) — Inspecting a source rule as data while preserving its shared variable
- [A policy that enables a rule](https://eyereasoner.github.io/eyemind/examples/deck/derived-rule-n3) (Notation3) — An active policy derives and reports a membership rule
- [Universal instances](https://eyereasoner.github.io/eyemind/examples/deck/universal-instances-n3) (Notation3) — @forAll statements hold of every individual, and @forSome inside them gives each its own witness
- [Shared existential](https://eyereasoner.github.io/eyemind/examples/deck/shared-existential-n3) (Notation3) — A top-level @forSome witness is the one individual a universal conclusion talks about
- [Explicit variables and Skolem mothers](https://eyereasoner.github.io/eyemind/examples/deck/explicit-existential-rule-n3) (Notation3) — Explicit @forAll variables and a computed Skolem mother IRI for each human
- [Quantifier scopes](https://eyereasoner.github.io/eyemind/examples/deck/quantifier-scopes-n3) (Notation3) — An @forSome of the document reaches into quoted formulas, and an inner declaration shadows it
- [Chain stratification](https://eyereasoner.github.io/eyemind/examples/deck/chain-stratification-n3) (Notation3) — Rules with no strata, whose negation every chain of rule applications reaching it breaks a constraint for
- [Guarded Skolem fathers](https://eyereasoner.github.io/eyemind/examples/deck/restricted-chase-n3) (Notation3) — Reuse supplied fathers and generate a Skolem father IRI only where none is supplied
- [Graph terms](https://eyereasoner.github.io/eyemind/examples/deck/graph-terms-n3) (Notation3) — Quoted formulas as opaque graph terms: unquoting, identity up to renaming, and universals inside quotes
- [Two rules, two fresh witnesses](https://eyereasoner.github.io/eyemind/examples/deck/cat-koko-srl) (SPARQL 1.2 RL) — Separate head blank nodes create distinct witnesses that pass an identity filter
- [An inconsistent door](https://eyereasoner.github.io/eyemind/examples/deck/fuse-n3) (Notation3) — A locked and open door triggers an integrity violation
- [Deep Taxonomy (10 levels)](https://eyereasoner.github.io/eyemind/examples/deck/deep-taxonomy-10) (Logic Script) — A ten-level subclass chain with branches that lead nowhere
- [Deep taxonomy (100 levels)](https://eyereasoner.github.io/eyemind/examples/deck/deep-taxonomy-100) (Logic Script) — The same taxonomy benchmark at a hundred levels
- [Deep Taxonomy 1000](https://eyereasoner.github.io/eyemind/examples/deck/deep-taxonomy-1000) (Logic Script) — The same taxonomy benchmark at a thousand levels
- [Deep Taxonomy 10000](https://eyereasoner.github.io/eyemind/examples/deck/deep-taxonomy-10000) (Logic Script) — The same taxonomy benchmark at ten thousand levels
- [Deep Taxonomy 100000](https://eyereasoner.github.io/eyemind/examples/deck/deep-taxonomy-100000) (Logic Script) — The same taxonomy benchmark at a hundred thousand levels

</details>

<details class="example-group" markdown="block">
<summary>Operations and decisions</summary>

<div id="operations"></div>

- [Restoring checkout after an outage](https://eyereasoner.github.io/eyemind/examples/deck/service-outage-recovery) (Logic Script) — Least-cost repairs that restore checkout through redundant providers and a dependency cycle
- [Which tasks determine the launch date?](https://eyereasoner.github.io/eyemind/examples/deck/critical-path-schedule) (Logic Script) — Earliest task times and every critical predecessor in a launch schedule
- [When should the battery charge?](https://eyereasoner.github.io/eyemind/examples/deck/battery-dispatch) (Logic Script) — Cheapest four-slot battery schedule under energy and power limits
- [Which temperature evidence drives a quarantine?](https://eyereasoner.github.io/eyemind/examples/deck/cold-chain-recall) (Logic Script) — Conflicting temperature evidence, checkpoint filtering and a witnessed inspection task
- [A school can look close on a map](https://eyereasoner.github.io/eyemind/examples/deck/school-placement-audit) (Logic Script) — Walking-route and preference scores audit provisional school placements
- [Inventory Invoice](https://eyereasoner.github.io/eyemind/examples/deck/inventory) (Logic Script) — An invoice from collected line totals
- [State transitions](https://eyereasoner.github.io/eyemind/examples/deck/state-transitions) (Logic Script) — Account balances from an ordered event log
- [Stock across locations](https://eyereasoner.github.io/eyemind/examples/deck/inventory-srl) (SPARQL 1.2 RL) — Grouped stock records yield location counts, totals, minimums and maximums
- [One invoice per order](https://eyereasoner.github.io/eyemind/examples/deck/orders-srl) (SPARQL 1.2 RL) — Each order gets its own invoice with a customer and total
- [Can this component deploy?](https://eyereasoner.github.io/eyemind/examples/deck/deployment-srl) (SPARQL 1.2 RL) — Service dependencies propagate severe vulnerabilities and safe deployment decisions
- [N3 invoice collection](https://eyereasoner.github.io/eyemind/examples/deck/invoice-n3) (Notation3) — Notation3 collection totals invoices, including an empty invoice
- [Adding invoice lines](https://eyereasoner.github.io/eyemind/examples/deck/invoice-totals-n3) (Notation3) — Collected line amounts produce invoice totals and a large-invoice classification
- [A text invoice](https://eyereasoner.github.io/eyemind/examples/deck/report-n3) (Notation3) — A formatted text report of fruit quantities, prices and costs
- [Shipping without a hold](https://eyereasoner.github.io/eyemind/examples/deck/closed-world-n3) (Notation3) — Paid orders ship when no hold is on record
- [N3 scoped negation](https://eyereasoner.github.io/eyemind/examples/deck/scoped-negation-n3) (Notation3) — Notation3 scoped negation waits for a derived order hold
- [N3 delivery witnesses](https://eyereasoner.github.io/eyemind/examples/deck/witnesses-n3) (Notation3) — Deterministic Skolem IRIs give each paid order its own ready delivery record
- [Library fines in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/library-fines-le) (Logical English) — Late fees and replacement costs are summed, counted and maximized per member, charging a damaged and lost loan once
- [Election tally in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/election-tally-le) (Logical English) — Eligible voters' choices are counted once each, spoiled votes are excluded and a tie gives two winners
- [Exact invoice totals and floating measurements](https://eyereasoner.github.io/eyemind/examples/deck/exact-decimals-srl) (SPARQL 1.2 RL) — Exact decimal invoice totals and division alongside binary64 double arithmetic

</details>

<details class="example-group" markdown="block">
<summary>Policy, rights and privacy</summary>

<div id="policy"></div>

- [Research scope and duties in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/research-snapshot-le) (Logical English) — An ODRL snapshot checks a compound constraint over DPV purpose and data categories and looks for request-local duty evidence
- [Research access in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/research-access-le) (Logical English) — Logical English joins ODRL permission, prohibition and duty facts with DPV process descriptions to decide three research requests
- [A research portal under two rulebooks](https://eyereasoner.github.io/eyemind/examples/deck/research-portal) (Logic Script) — A hospital research portal combines ODRL/DPV policy decisions with Digital Omnibus device consent and breach plans
- [A package holiday under two rulebooks](https://eyereasoner.github.io/eyemind/examples/deck/package-holiday) (Logic Script) — Package holiday cancellations under the tour operator's ODRL terms and the 2015 and revised EU Package Travel Directive
- [A right to the value of personal data](https://eyereasoner.github.io/eyemind/examples/deck/data-value-right) (Logic Script) — A right to the value of personal data in the age of AI: how it fits existing EU law, and how it could become an autonomous right
- [Audited grants](https://eyereasoner.github.io/eyemind/examples/deck/audited-grants) (Logic Script) — A grant policy whose own proof and check report are read back as facts and audited, in the same language
- [Handicap card](https://eyereasoner.github.io/eyemind/examples/deck/handicap-card) (RDF) — One ODRL and SOTW snapshot allows Alice's handicap card and reports the conflict that blocks Bob's
- [Handicap card in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/handicap-card-le) (Logical English) — An LE snapshot reuses the ODRL evaluator to allow Alice's card and retain Bob's policy conflict
- [British citizenship in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/british-citizenship-le) (Logical English) — Section 1 of the British Nationality Act 1981 grants citizenship by birth to a citizen or settled parent, or to a foundling unless the contrary is shown
- [Permissions](https://eyereasoner.github.io/eyemind/examples/deck/permissions) (Logic Script) — Role permissions with exclusions
- [Policy Risk](https://eyereasoner.github.io/eyemind/examples/deck/policy-risk) (Logic Script) — Ranked findings with explanations and suggested mitigations
- [Deontic Logic](https://eyereasoner.github.io/eyemind/examples/deck/deontic-logic) (Logic Script) — Obligations, prohibitions and compensation that does not erase a violation
- [Dog license](https://eyereasoner.github.io/eyemind/examples/deck/dog-license) (Logic Script) — A licensing threshold based on collected dog counts
- [Delfour](https://eyereasoner.github.io/eyemind/examples/deck/delfour) (Logic Script) — A store scanner gives low-sugar advice from a signed, scoped insight, without learning the household's diabetes

</details>

<details class="example-group" markdown="block">
<summary>Puzzles, plans and routes</summary>

<div id="plans"></div>

- [Shortest Path](https://eyereasoner.github.io/eyemind/examples/deck/shortest-path) (Logic Script) — Weighted paths and stratified minimum selection
- [Shortest paths in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/shortest-path-le) (Logical English) — Bounded recursive paths retain both cheapest routes through a graph containing a cycle
- [Dijkstra](https://eyereasoner.github.io/eyemind/examples/deck/dijkstra) (Logic Script) — Dijkstra's shortest route over a cost-ordered queue, with every step checked
- [The cheapest listed routes](https://eyereasoner.github.io/eyemind/examples/deck/dijkstra-srl) (SPARQL 1.2 RL) — Listed candidate routes receive total costs and the cheapest alternatives survive stratified negation
- [Path discovery](https://eyereasoner.github.io/eyemind/examples/deck/path-discovery) (Logic Script) — Full airport network with configurable endpoints and maximum stopovers
- [Alternatives](https://eyereasoner.github.io/eyemind/examples/deck/alternatives) (Logic Script) — Alternative routes, disjunction and once
- [Reachability](https://eyereasoner.github.io/eyemind/examples/deck/reachability) (Logic Script) — Finite closure in a graph containing a cycle
- [Knapsack Optimization](https://eyereasoner.github.io/eyemind/examples/deck/knapsack-optimization) (Logic Script) — The 0/1 knapsack problem: the most valuable pack within a weight limit
- [Tower of Hanoi](https://eyereasoner.github.io/eyemind/examples/deck/hanoi) (Logic Script) — Recursive construction of a disk-move sequence
- [Eight queens](https://eyereasoner.github.io/eyemind/examples/deck/queens) (Logic Script) — Configurable N-queens search with diagonal constraints
- [Zebra](https://eyereasoner.github.io/eyemind/examples/deck/zebra) (Logic Script) — The zebra puzzle solved by narrowing five partially known houses
- [Who Killed Aunt Agatha?](https://eyereasoner.github.io/eyemind/examples/deck/aunt-agatha) (Logic Script) — Who killed Aunt Agatha? A conclusion entailed by holding in every model of the premises
- [Four colours](https://eyereasoner.github.io/eyemind/examples/deck/four-color) (Logic Script) — Four-colouring the map of the European Union
- [Wolf, goat and cabbage](https://eyereasoner.github.io/eyemind/examples/deck/wolf-goat-cabbage) (Logic Script) — The river crossing, with seven crossings shown to be minimal
- [River crossing in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/river-crossing-le) (Logical English) — Compound states and safety constraints find both seven-crossing wolf, goat and cabbage plans
- [Monkey and bananas](https://eyereasoner.github.io/eyemind/examples/deck/monkey-bananas) (Logic Script) — Every plan of up to five moves that gets the monkey the bananas
- [GPS: goal-driven routes](https://eyereasoner.github.io/eyemind/examples/deck/gps) (Logic Script) — Goal-driven parallel sequences: routes to a goal state within duration, cost, belief and comfort limits

</details>

<details class="example-group" markdown="block">
<summary>Mathematics and computing</summary>

<div id="mathematics"></div>

- [Fibonacci](https://eyereasoner.github.io/eyemind/examples/deck/fibonacci) (Logic Script) — Fast doubling for exact Fibonacci numbers, and the golden ratio
- [Lists](https://eyereasoner.github.io/eyemind/examples/deck/lists) (Logic Script) — Concatenation, mapping and summation
- [Strings](https://eyereasoner.github.io/eyemind/examples/deck/strings) (Logic Script) — Text construction and Unicode inspection
- [Peano](https://eyereasoner.github.io/eyemind/examples/deck/peano) (Logic Script) — Symbolic arithmetic, relational addition and a chained derivation
- [Expression Evaluation](https://eyereasoner.github.io/eyemind/examples/deck/expression-eval) (Logic Script) — Recursive expression graphs used in forward inference
- [Complex numbers](https://eyereasoner.github.io/eyemind/examples/deck/complex) (Logic Script) — Complex arithmetic, exact over Gaussian integers and polar beyond them
- [Polynomial Roots](https://eyereasoner.github.io/eyemind/examples/deck/polynomial) (Logic Script) — Complex roots of polynomials up to degree 4 by Cardan and Lagrange
- [Interval Relations](https://eyereasoner.github.io/eyemind/examples/deck/interval-relations) (Logic Script) — All thirteen interval relations and endpoint completion
- [Collatz](https://eyereasoner.github.io/eyemind/examples/deck/collatz) (Logic Script) — Parity-based recursive trajectories over a range of starts
- [Ackermann](https://eyereasoner.github.io/eyemind/examples/deck/ackermann) (Logic Script) — The Ackermann function through the hyperoperation sequence, exactly
- [Peasant Arithmetic](https://eyereasoner.github.io/eyemind/examples/deck/peasant) (Logic Script) — Peasant multiplication and exponentiation by halving and doubling
- [The Sieve of Eratosthenes](https://eyereasoner.github.io/eyemind/examples/deck/sieve) (Logic Script) — The sieve of Eratosthenes over an explicit list of integers
- [Goldbach](https://eyereasoner.github.io/eyemind/examples/deck/goldbach) (Logic Script) — Goldbach splits of every power of two up to 2^25
- [Kaprekar's 6174](https://eyereasoner.github.io/eyemind/examples/deck/kaprekar) (Logic Script) — Every four-digit Kaprekar routine reaches 6174 within seven steps
- [A Turing Machine](https://eyereasoner.github.io/eyemind/examples/deck/turing) (Logic Script) — A Turing machine interpreter running a binary incrementer
- [Type Inference](https://eyereasoner.github.io/eyemind/examples/deck/type-inference) (Logic Script) — Typing rules for a small expression language, run as a checker
- [Symbolic Derivative](https://eyereasoner.github.io/eyemind/examples/deck/symbolic-derivative) (Logic Script) — Symbolic differentiation of structured formulas by the sum, product, quotient, power and chain rules
- [Symbolic differentiation in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/symbolic-derivative-le) (Logical English) — Structural rules differentiate a cubic expression and evaluate the resulting tree at two points
- [Group Inverse Uniqueness](https://eyereasoner.github.io/eyemind/examples/deck/group-inverse-uniqueness) (Logic Script) — Uniqueness of group inverses derived from the associativity, identity and inverse laws
- [A greatest common divisor with coefficients](https://eyereasoner.github.io/eyemind/examples/deck/gcd-bezout-identity) (Logic Script) — Exact extended Euclidean certificates for positive, negative and zero inputs
- [Pell solutions beyond machine-sized integers](https://eyereasoner.github.io/eyemind/examples/deck/pell-equation) (Logic Script) — Exact Pell solutions through step 50, checked against the defining equation
- [Pell equations in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/pell-equation-le) (Logical English) — An exact recurrence generates large Pell solutions and checks each polynomial identity
- [Count the same selection in two ways](https://eyereasoner.github.io/eyemind/examples/deck/binomial-vandermonde) (Logic Script) — Exact binomial coefficients and finite checks of Vandermonde and Pascal row sums
- [Fit a line and explain when fitting fails](https://eyereasoner.github.io/eyemind/examples/deck/least-squares-regression) (Logic Script) — Straight-line fits from exact sufficient statistics, with explicit degenerate cases
- [Recover four data bits after one bit flips](https://eyereasoner.github.io/eyemind/examples/deck/hamming-code) (Logic Script) — Parity syndromes and correction of a single flipped bit in Hamming(7,4)
- [Squares in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/squares-le) (Logical English) — Logical English computes exact squares of three supplied integers

</details>

<details class="example-group" markdown="block">
<summary>People and places</summary>

<div id="people"></div>

- [Age](https://eyereasoner.github.io/eyemind/examples/deck/age) (Logic Script) — Calendar-year and elapsed-day age checks at an explicit reference date
- [Easter](https://eyereasoner.github.io/eyemind/examples/deck/easter) (Logic Script) — Easter Sunday by the anonymous Gregorian algorithm, 2021 to 2050
- [Family cousins](https://eyereasoner.github.io/eyemind/examples/deck/family-cousins) (Logic Script) — Generations, family branches and cousin relationships
- [N3 family queries](https://eyereasoner.github.io/eyemind/examples/deck/family-n3) (Notation3) — Notation3 backward ancestry and log:query compiled to Logic Script
- [Ancestry on demand](https://eyereasoner.github.io/eyemind/examples/deck/family-recursion-n3) (Notation3) — Recursive backward ancestry selected by a query
- [Ancestry by forward closure](https://eyereasoner.github.io/eyemind/examples/deck/family-srl) (SPARQL 1.2 RL) — Recursive forward ancestry over a three-generation family tree
- [Cousins across family branches](https://eyereasoner.github.io/eyemind/examples/deck/family-cousins-srl) (SPARQL 1.2 RL) — Bounded generations and inherited branch labels identify cousins across a family tree
- [A family with OWL 2 RL](https://eyereasoner.github.io/eyemind/examples/deck/family-owl2rl) (RDF) — OWL 2 RL chains infer grandparents and functional properties expose a sameAs/differentFrom conflict
- [People with OWL 2 RL](https://eyereasoner.github.io/eyemind/examples/deck/people-owl2rl) (RDF) — OWL 2 RL includes RDFS class and property rules to infer people's types and a broader contact relation
- [Validate a directory](https://eyereasoner.github.io/eyemind/examples/deck/people-shacl) (RDF) — SHACL reports a missing name and an underage directory entry with standard validation results
- [French cities](https://eyereasoner.github.io/eyemind/examples/deck/french-cities-n3) (Notation3) — French cities that can reach Nantes through one-way links and explicit schema rules
- [Grandparents and reverse links](https://eyereasoner.github.io/eyemind/examples/deck/property-paths-srl) (SPARQL 1.2 RL) — Sequential and inverse property paths derive grandparent and child-to-parent links
- [Completing route distances](https://eyereasoner.github.io/eyemind/examples/deck/distances-srl) (SPARQL 1.2 RL) — Missing kilometre distances are converted from miles without replacing base data
- [A Unicode directory](https://eyereasoner.github.io/eyemind/examples/deck/strings-srl) (SPARQL 1.2 RL) — Directory listings, initials and language information from Unicode names
- [Course certificates in Logical English](https://eyereasoner.github.io/eyemind/examples/deck/course-certificates-le) (Logical English) — Recursive course requirements and prior learning lead to shared dossiers, audits and nested certificate witnesses
- [The Good Cobbler](https://eyereasoner.github.io/eyemind/examples/deck/good-cobbler) (Logic Script) — Trade-specific classification from structured descriptions
- [A trade inside a list](https://eyereasoner.github.io/eyemind/examples/deck/good-cobbler-srl) (SPARQL 1.2 RL) — RDF list patterns extract a trade from a structured description
- [A Skolem mother for each person](https://eyereasoner.github.io/eyemind/examples/deck/existential-n3) (Notation3) — Skolem mother IRIs and reciprocal child relations for each person

</details>

<details class="example-group" markdown="block">
<summary>Linked data and evidence</summary>

<div id="linked-data"></div>

- [Who supplied a statement?](https://eyereasoner.github.io/eyemind/examples/deck/annotation-evidence-srl) (SPARQL 1.2 RL) — A named reifier links an asserted statement to its author and recording date
- [Choosing between reports](https://eyereasoner.github.io/eyemind/examples/deck/annotated-claims-n3) (Notation3) — Conflicting RDF 1.2 annotated claims ranked by confidence and trust, with typed literals read as numbers
- [Who stated it, and when?](https://eyereasoner.github.io/eyemind/examples/deck/annotation-n3) (Notation3) — An RDF 1.2 annotation: an asserted triple recovered with the reifier that records who stated it and when
- [Accepting a claim](https://eyereasoner.github.io/eyemind/examples/deck/triple-term-n3) (Notation3) — An RDF 1.2 triple term: a claim names a triple without asserting it, and accepting the claim asserts it
- [A reviewed claim](https://eyereasoner.github.io/eyemind/examples/deck/nested-triple-term-n3) (Notation3) — Nested RDF 1.2 triple terms: one pattern reaches the triple inside a claim inside a review
- [Labels that keep their direction](https://eyereasoner.github.io/eyemind/examples/deck/directional-language-n3) (Notation3) — RDF 1.2 directional language strings keep their base direction through a display rule
- [Ancestors in a named graph](https://eyereasoner.github.io/eyemind/examples/deck/trig-named-graph-n3) (Notation3) — Ancestors derived within a TriG named graph, each conclusion kept in its named-graph formula
- [Accepting a named-graph claim](https://eyereasoner.github.io/eyemind/examples/deck/trig-triple-term-n3) (Notation3) — A triple term inside a named graph, asserted in a formula named for the graph that holds the claim
- [Joining a graph and its reporter](https://eyereasoner.github.io/eyemind/examples/deck/trig-graph-join-n3) (Notation3) — Data about a named graph in the default graph joined with data inside that graph
- [Strong links and their sources](https://eyereasoner.github.io/eyemind/examples/deck/provenance-srl) (SPARQL 1.2 RL) — Strong annotated links yield connections and source-attributed triple terms
- [Reading a nested collection](https://eyereasoner.github.io/eyemind/examples/deck/collection-nesting-srl) (SPARQL 1.2 RL) — Property paths read nested RDF lists and a blank node property
- [Describing quoted graphs with lists](https://eyereasoner.github.io/eyemind/examples/deck/graph-term-emulation-srl) (SPARQL 1.2 RL) — Closed lists of quoted triples yield graph metadata through recursive list traversal
- [Messages keep their boundaries](https://eyereasoner.github.io/eyemind/examples/deck/message-boundaries-n3) (Notation3) — Ordered RDF Messages preserve an empty heartbeat and distinguish reused blank-node labels
- [A named graph inside a message](https://eyereasoner.github.io/eyemind/examples/deck/message-provenance-n3) (Notation3) — Reporters and named-graph readings join within each message without crossing its boundary
- [A time and identifiers for each order](https://eyereasoner.github.io/eyemind/examples/deck/execution-identifiers-srl) (SPARQL 1.2 RL) — Orders share one execution time and receive distinct UUID IRIs and strings
- [OWL Property Chain](https://eyereasoner.github.io/eyemind/examples/deck/owl-property-chain) (Logic Script) — A property chain declared as data, followed by one general rule
- [A transport thesaurus](https://eyereasoner.github.io/eyemind/examples/deck/thesaurus-skos) (RDF) — SKOS closes concept hierarchies, exact mappings and ordered collection membership
- [Exact OWL numeric values](https://eyereasoner.github.io/eyemind/examples/deck/datatypes-owl2rl) (RDF) — OWL exact numeric values substitute across lexical forms and an invalid byte range yields a conflict

</details>

<details class="example-group" markdown="block">
<summary>Science and measurements</summary>

<div id="science"></div>

- [Normalize, then validate](https://eyereasoner.github.io/eyemind/examples/deck/measurement-shacl) (RDF) — QUDT converts speed readings before SHACL checks a sequence path against a numeric limit
- [QUDT quantities](https://eyereasoner.github.io/eyemind/examples/deck/quantities-qudt) (RDF) — QUDT normalizes CDT literals, Fahrenheit, decibels and a locally defined length unit
- [Composed QUDT units](https://eyereasoner.github.io/eyemind/examples/deck/composed-units-qudt) (RDF) — QUDT composes units from factor units, prefixes and prefixed names, normalizes any dimension to SI and reports a currency
- [Control System](https://eyereasoner.github.io/eyemind/examples/deck/control-system) (Logic Script) — Feedforward and nonlinear feedback commands for two actuators
- [Leg Length Discrepancy](https://eyereasoner.github.io/eyemind/examples/deck/lldm) (Logic Script) — Leg length discrepancy measured from radiograph landmarks, with an alarm and its reason
- [Bayes Diagnosis](https://eyereasoner.github.io/eyemind/examples/deck/bayes-diagnosis) (Logic Script) — Normalized probabilities for illustrative printer faults
- [Superdense Coding](https://eyereasoner.github.io/eyemind/examples/deck/superdense-coding) (Logic Script) — Superdense coding in discrete quantum theory, with interference as odd path counts
- [Teleportation](https://eyereasoner.github.io/eyemind/examples/deck/teleportation) (Logic Script) — Quantum teleportation in discrete quantum theory, checked for every state and outcome
- [An alert belongs to one observation](https://eyereasoner.github.io/eyemind/examples/deck/message-alerts-n3) (Notation3) — Independent sensor messages raise an alert only for the observation above the temperature threshold
- [Sensor messages become SOSA observations](https://eyereasoner.github.io/eyemind/examples/deck/observations-owl2rl) (RDF) — Streamed sensor messages each yield the SOSA triples an output contract asks for, through rules specialized once to the shape of the messages
- [Shapes plan the rules for sensor messages](https://eyereasoner.github.io/eyemind/examples/deck/shape-planning-owl2rl) (RDF) — SHACL input and output shapes let streamed sensor messages run rules specialized before the first message and yield only the SOSA triples asked for

</details>

<details class="example-group" markdown="block">
<summary>Running from the command line</summary>

<div id="running-the-examples"></div>

To run this Logic Script (LS) example from the repository, use the commands below.

```sh
eyemind examples/socrates.js
eyemind -c examples/socrates.js
eyemind --proof examples/socrates.js
eyemind --check-proof examples/proof/socrates.js examples/socrates.js
```

Saved conclusions are in `output/`, proofs in `proof/`, and check reports in
`check/`. Streamed examples save their conclusions only. See the
[command-line guide](https://eyereasoner.github.io/eyemind/#command-line)
for input formats and options.

</details>
