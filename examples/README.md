# Examples

Each example comes with a short card deck that explains it for a wide audience: the question it asks, what the program says, what eyemind concludes, why, and what the proof checker confirms. Cards are separated by `---`, so a deck reads as plain Markdown here and works as slides in Markdown slide tools such as Marp.

For practical decisions, try [outage recovery](https://eyereasoner.github.io/eyemind/examples/deck/service-outage-recovery),
[project scheduling](https://eyereasoner.github.io/eyemind/examples/deck/critical-path-schedule), [battery dispatch](https://eyereasoner.github.io/eyemind/examples/deck/battery-dispatch),
[cold-chain evidence](https://eyereasoner.github.io/eyemind/examples/deck/cold-chain-recall), or [school placement audits](https://eyereasoner.github.io/eyemind/examples/deck/school-placement-audit).
For mathematical calculations, try [Bézout certificates](https://eyereasoner.github.io/eyemind/examples/deck/gcd-bezout-identity),
[Pell equations](https://eyereasoner.github.io/eyemind/examples/deck/pell-equation), [binomial identities](https://eyereasoner.github.io/eyemind/examples/deck/binomial-vandermonde),
[least-squares regression](https://eyereasoner.github.io/eyemind/examples/deck/least-squares-regression), or [Hamming codes](https://eyereasoner.github.io/eyemind/examples/deck/hamming-code).

Run a source, generate its proof, or check its saved proof:

```sh
eyemind examples/socrates.js
eyemind -c examples/socrates.js
eyemind --proof examples/socrates.js
eyemind --check-proof examples/proof/socrates.js examples/socrates.js
```

Each program has a matching conclusion file in `output/`, a certificate in
`proof/`, and a C1-C8 verification report in `check/`, each written as JavaScript
expressions, one per line. The names match the source: `lists.js` has
`output/lists.js`, `proof/lists.js` and `check/lists.js`.

| Example (deck) | Source | Demonstrates |
| --- | --- | --- |
| [ackermann](https://eyereasoner.github.io/eyemind/examples/deck/ackermann) | [ackermann.js](https://github.com/eyereasoner/eyemind/blob/main/examples/ackermann.js) | The Ackermann function through the hyperoperation sequence, exactly |
| [age](https://eyereasoner.github.io/eyemind/examples/deck/age) | [age.js](https://github.com/eyereasoner/eyemind/blob/main/examples/age.js) | Calendar-year and elapsed-day age checks at an explicit reference date |
| [alternatives](https://eyereasoner.github.io/eyemind/examples/deck/alternatives) | [alternatives.js](https://github.com/eyereasoner/eyemind/blob/main/examples/alternatives.js) | Alternative routes, disjunction and once |
| [audited-grants](https://eyereasoner.github.io/eyemind/examples/deck/audited-grants) | [audited-grants.js](https://github.com/eyereasoner/eyemind/blob/main/examples/audited-grants.js) | A grant policy whose own proof and check report are read back as facts and audited, in the same language |
| [aunt-agatha](https://eyereasoner.github.io/eyemind/examples/deck/aunt-agatha) | [aunt-agatha.js](https://github.com/eyereasoner/eyemind/blob/main/examples/aunt-agatha.js) | Who killed Aunt Agatha? A conclusion entailed by holding in every model of the premises |
| [backward](https://eyereasoner.github.io/eyemind/examples/deck/backward) | [backward.js](https://github.com/eyereasoner/eyemind/blob/main/examples/backward.js) | Backward definitions inside forward bodies |
| [battery-dispatch](https://eyereasoner.github.io/eyemind/examples/deck/battery-dispatch) | [battery-dispatch.js](https://github.com/eyereasoner/eyemind/blob/main/examples/battery-dispatch.js) | Cheapest four-slot battery schedule under energy and power limits |
| [bayes-diagnosis](https://eyereasoner.github.io/eyemind/examples/deck/bayes-diagnosis) | [bayes-diagnosis.js](https://github.com/eyereasoner/eyemind/blob/main/examples/bayes-diagnosis.js) | Normalized probabilities for illustrative printer faults |
| [binomial-vandermonde](https://eyereasoner.github.io/eyemind/examples/deck/binomial-vandermonde) | [binomial-vandermonde.js](https://github.com/eyereasoner/eyemind/blob/main/examples/binomial-vandermonde.js) | Exact binomial coefficients and finite checks of Vandermonde and Pascal row sums |
| [cold-chain-recall](https://eyereasoner.github.io/eyemind/examples/deck/cold-chain-recall) | [cold-chain-recall.js](https://github.com/eyereasoner/eyemind/blob/main/examples/cold-chain-recall.js) | Conflicting temperature evidence, checkpoint filtering and a witnessed inspection task |
| [collatz](https://eyereasoner.github.io/eyemind/examples/deck/collatz) | [collatz.js](https://github.com/eyereasoner/eyemind/blob/main/examples/collatz.js) | Parity-based recursive trajectories over a range of starts |
| [complex](https://eyereasoner.github.io/eyemind/examples/deck/complex) | [complex.js](https://github.com/eyereasoner/eyemind/blob/main/examples/complex.js) | Complex arithmetic, exact over Gaussian integers and polar beyond them |
| [control-system](https://eyereasoner.github.io/eyemind/examples/deck/control-system) | [control-system.js](https://github.com/eyereasoner/eyemind/blob/main/examples/control-system.js) | Feedforward and nonlinear feedback commands for two actuators |
| [critical-path-schedule](https://eyereasoner.github.io/eyemind/examples/deck/critical-path-schedule) | [critical-path-schedule.js](https://github.com/eyereasoner/eyemind/blob/main/examples/critical-path-schedule.js) | Earliest task times and every critical predecessor in a launch schedule |
| [data-value-right](https://eyereasoner.github.io/eyemind/examples/deck/data-value-right) | [data-value-right.js](https://github.com/eyereasoner/eyemind/blob/main/examples/data-value-right.js) | A right to the value of personal data in the age of AI: how it fits existing EU law, and how it could become an autonomous right |
| [deep-taxonomy-10](https://eyereasoner.github.io/eyemind/examples/deck/deep-taxonomy-10) | [deep-taxonomy-10.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-10.js) | A ten-level subclass chain with branches that lead nowhere |
| [deep-taxonomy-100](https://eyereasoner.github.io/eyemind/examples/deck/deep-taxonomy-100) | [deep-taxonomy-100.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-100.js) | The same taxonomy benchmark at a hundred levels |
| [deep-taxonomy-1000](https://eyereasoner.github.io/eyemind/examples/deck/deep-taxonomy-1000) | [deep-taxonomy-1000.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-1000.js) | The same taxonomy benchmark at a thousand levels |
| [deep-taxonomy-10000](https://eyereasoner.github.io/eyemind/examples/deck/deep-taxonomy-10000) | [deep-taxonomy-10000.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-10000.js) | The same taxonomy benchmark at ten thousand levels |
| [deep-taxonomy-100000](https://eyereasoner.github.io/eyemind/examples/deck/deep-taxonomy-100000) | [deep-taxonomy-100000.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-100000.js) | The same taxonomy benchmark at a hundred thousand levels |
| [delfour](https://eyereasoner.github.io/eyemind/examples/deck/delfour) | [delfour.js](https://github.com/eyereasoner/eyemind/blob/main/examples/delfour.js) | A store scanner gives low-sugar advice from a signed, scoped insight, without learning the household's diabetes |
| [deontic-logic](https://eyereasoner.github.io/eyemind/examples/deck/deontic-logic) | [deontic-logic.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deontic-logic.js) | Obligations, prohibitions and compensation that does not erase a violation |
| [derived-backward-rule](https://eyereasoner.github.io/eyemind/examples/deck/derived-backward-rule) | [derived-backward-rule.js](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-backward-rule.js) | A captured inverse pair enables a reusable backward rule |
| [derived-backward-rule-2](https://eyereasoner.github.io/eyemind/examples/deck/derived-backward-rule-2) | [derived-backward-rule-2.js](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-backward-rule-2.js) | A conjunction of backward templates supplies premises for forward reasoning |
| [derived-rule](https://eyereasoner.github.io/eyemind/examples/deck/derived-rule) | [derived-rule.js](https://github.com/eyereasoner/eyemind/blob/main/examples/derived-rule.js) | An inline forward rule enabled by a cat and applied to a dog |
| [dijkstra](https://eyereasoner.github.io/eyemind/examples/deck/dijkstra) | [dijkstra.js](https://github.com/eyereasoner/eyemind/blob/main/examples/dijkstra.js) | Dijkstra's shortest route over a cost-ordered queue, with every step checked |
| [dog-license](https://eyereasoner.github.io/eyemind/examples/deck/dog-license) | [dog-license.js](https://github.com/eyereasoner/eyemind/blob/main/examples/dog-license.js) | A licensing threshold based on collected dog counts |
| [easter](https://eyereasoner.github.io/eyemind/examples/deck/easter) | [easter.js](https://github.com/eyereasoner/eyemind/blob/main/examples/easter.js) | Easter Sunday by the anonymous Gregorian algorithm, 2021 to 2050 |
| [existential-rules](https://eyereasoner.github.io/eyemind/examples/deck/existential-rules) | [existential-rules.js](https://github.com/eyereasoner/eyemind/blob/main/examples/existential-rules.js) | Existential rules: a fresh witness per activation, never a clash |
| [expression-eval](https://eyereasoner.github.io/eyemind/examples/deck/expression-eval) | [expression-eval.js](https://github.com/eyereasoner/eyemind/blob/main/examples/expression-eval.js) | Recursive expression graphs used in forward inference |
| [family-cousins](https://eyereasoner.github.io/eyemind/examples/deck/family-cousins) | [family-cousins.js](https://github.com/eyereasoner/eyemind/blob/main/examples/family-cousins.js) | Generations, family branches and cousin relationships |
| [fibonacci](https://eyereasoner.github.io/eyemind/examples/deck/fibonacci) | [fibonacci.js](https://github.com/eyereasoner/eyemind/blob/main/examples/fibonacci.js) | Fast doubling for exact Fibonacci numbers, and the golden ratio |
| [flat-map](https://eyereasoner.github.io/eyemind/examples/deck/flat-map) | [flat-map.js](https://github.com/eyereasoner/eyemind/blob/main/examples/flat-map.js) | Predicate-based mapping with multiple or missing values |
| [four-color](https://eyereasoner.github.io/eyemind/examples/deck/four-color) | [four-color.js](https://github.com/eyereasoner/eyemind/blob/main/examples/four-color.js) | Four-colouring the map of the European Union |
| [gcd-bezout-identity](https://eyereasoner.github.io/eyemind/examples/deck/gcd-bezout-identity) | [gcd-bezout-identity.js](https://github.com/eyereasoner/eyemind/blob/main/examples/gcd-bezout-identity.js) | Exact extended Euclidean certificates for positive, negative and zero inputs |
| [goldbach](https://eyereasoner.github.io/eyemind/examples/deck/goldbach) | [goldbach.js](https://github.com/eyereasoner/eyemind/blob/main/examples/goldbach.js) | Goldbach splits of every power of two up to 2^25 |
| [good-cobbler](https://eyereasoner.github.io/eyemind/examples/deck/good-cobbler) | [good-cobbler.js](https://github.com/eyereasoner/eyemind/blob/main/examples/good-cobbler.js) | Trade-specific classification from structured descriptions |
| [gps](https://eyereasoner.github.io/eyemind/examples/deck/gps) | [gps.js](https://github.com/eyereasoner/eyemind/blob/main/examples/gps.js) | Goal-driven parallel sequences: routes to a goal state within duration, cost, belief and comfort limits |
| [graphs](https://eyereasoner.github.io/eyemind/examples/deck/graphs) | [graphs.js](https://github.com/eyereasoner/eyemind/blob/main/examples/graphs.js) | Base data, negation and collection |
| [group-inverse-uniqueness](https://eyereasoner.github.io/eyemind/examples/deck/group-inverse-uniqueness) | [group-inverse-uniqueness.js](https://github.com/eyereasoner/eyemind/blob/main/examples/group-inverse-uniqueness.js) | Uniqueness of group inverses derived from the associativity, identity and inverse laws |
| [hamming-code](https://eyereasoner.github.io/eyemind/examples/deck/hamming-code) | [hamming-code.js](https://github.com/eyereasoner/eyemind/blob/main/examples/hamming-code.js) | Parity syndromes and correction of a single flipped bit in Hamming(7,4) |
| [hanoi](https://eyereasoner.github.io/eyemind/examples/deck/hanoi) | [hanoi.js](https://github.com/eyereasoner/eyemind/blob/main/examples/hanoi.js) | Recursive construction of a disk-move sequence |
| [integrity](https://eyereasoner.github.io/eyemind/examples/deck/integrity) | [integrity.js](https://github.com/eyereasoner/eyemind/blob/main/examples/integrity.js) | A provable integrity violation |
| [interval-relations](https://eyereasoner.github.io/eyemind/examples/deck/interval-relations) | [interval-relations.js](https://github.com/eyereasoner/eyemind/blob/main/examples/interval-relations.js) | All thirteen interval relations and endpoint completion |
| [inventory](https://eyereasoner.github.io/eyemind/examples/deck/inventory) | [inventory.js](https://github.com/eyereasoner/eyemind/blob/main/examples/inventory.js) | An invoice from collected line totals |
| [kaprekar](https://eyereasoner.github.io/eyemind/examples/deck/kaprekar) | [kaprekar.js](https://github.com/eyereasoner/eyemind/blob/main/examples/kaprekar.js) | Every four-digit Kaprekar routine reaches 6174 within seven steps |
| [knapsack-optimization](https://eyereasoner.github.io/eyemind/examples/deck/knapsack-optimization) | [knapsack-optimization.js](https://github.com/eyereasoner/eyemind/blob/main/examples/knapsack-optimization.js) | The 0/1 knapsack problem: the most valuable pack within a weight limit |
| [least-squares-regression](https://eyereasoner.github.io/eyemind/examples/deck/least-squares-regression) | [least-squares-regression.js](https://github.com/eyereasoner/eyemind/blob/main/examples/least-squares-regression.js) | Straight-line fits from exact sufficient statistics, with explicit degenerate cases |
| [lists](https://eyereasoner.github.io/eyemind/examples/deck/lists) | [lists.js](https://github.com/eyereasoner/eyemind/blob/main/examples/lists.js) | Concatenation, mapping and summation |
| [lldm](https://eyereasoner.github.io/eyemind/examples/deck/lldm) | [lldm.js](https://github.com/eyereasoner/eyemind/blob/main/examples/lldm.js) | Leg length discrepancy measured from radiograph landmarks, with an alarm and its reason |
| [monkey-bananas](https://eyereasoner.github.io/eyemind/examples/deck/monkey-bananas) | [monkey-bananas.js](https://github.com/eyereasoner/eyemind/blob/main/examples/monkey-bananas.js) | Every plan of up to five moves that gets the monkey the bananas |
| [nixon-diamond](https://eyereasoner.github.io/eyemind/examples/deck/nixon-diamond) | [nixon-diamond.js](https://github.com/eyereasoner/eyemind/blob/main/examples/nixon-diamond.js) | A default guarded by negation, so a contrary rule takes priority |
| [owl-property-chain](https://eyereasoner.github.io/eyemind/examples/deck/owl-property-chain) | [owl-property-chain.js](https://github.com/eyereasoner/eyemind/blob/main/examples/owl-property-chain.js) | A property chain declared as data, followed by one general rule |
| [package-holiday](https://eyereasoner.github.io/eyemind/examples/deck/package-holiday) | [package-holiday.js](https://github.com/eyereasoner/eyemind/blob/main/examples/package-holiday.js) | Package holiday cancellations under the tour operator's ODRL terms and the 2015 and revised EU Package Travel Directive |
| [paraconsistent-animals](https://eyereasoner.github.io/eyemind/examples/deck/paraconsistent-animals) | [paraconsistent-animals.js](https://github.com/eyereasoner/eyemind/blob/main/examples/paraconsistent-animals.js) | Local summaries of conflicting observations |
| [path-discovery](https://eyereasoner.github.io/eyemind/examples/deck/path-discovery) | [path-discovery.js](https://github.com/eyereasoner/eyemind/blob/main/examples/path-discovery.js) | Full airport network with configurable endpoints and maximum stopovers |
| [peano](https://eyereasoner.github.io/eyemind/examples/deck/peano) | [peano.js](https://github.com/eyereasoner/eyemind/blob/main/examples/peano.js) | Symbolic arithmetic, relational addition and a chained derivation |
| [peasant](https://eyereasoner.github.io/eyemind/examples/deck/peasant) | [peasant.js](https://github.com/eyereasoner/eyemind/blob/main/examples/peasant.js) | Peasant multiplication and exponentiation by halving and doubling |
| [pell-equation](https://eyereasoner.github.io/eyemind/examples/deck/pell-equation) | [pell-equation.js](https://github.com/eyereasoner/eyemind/blob/main/examples/pell-equation.js) | Exact Pell solutions through step 50, checked against the defining equation |
| [permissions](https://eyereasoner.github.io/eyemind/examples/deck/permissions) | [permissions.js](https://github.com/eyereasoner/eyemind/blob/main/examples/permissions.js) | Role permissions with exclusions |
| [policy-risk](https://eyereasoner.github.io/eyemind/examples/deck/policy-risk) | [policy-risk.js](https://github.com/eyereasoner/eyemind/blob/main/examples/policy-risk.js) | Ranked findings with explanations and suggested mitigations |
| [polynomial](https://eyereasoner.github.io/eyemind/examples/deck/polynomial) | [polynomial.js](https://github.com/eyereasoner/eyemind/blob/main/examples/polynomial.js) | Complex roots of polynomials up to degree 4 by Cardan and Lagrange |
| [queens](https://eyereasoner.github.io/eyemind/examples/deck/queens) | [queens.js](https://github.com/eyereasoner/eyemind/blob/main/examples/queens.js) | Configurable N-queens search with diagonal constraints |
| [rdf12-annotated-claims](https://eyereasoner.github.io/eyemind/examples/deck/rdf12-annotated-claims) | [rdf12-annotated-claims.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-annotated-claims.js) | Conflicting RDF 1.2 annotated claims ranked by confidence and trust, with typed literals read as numbers |
| [rdf12-annotation](https://eyereasoner.github.io/eyemind/examples/deck/rdf12-annotation) | [rdf12-annotation.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-annotation.js) | An RDF 1.2 annotation: an asserted triple recovered with the reifier that records who stated it and when |
| [rdf12-directional-language](https://eyereasoner.github.io/eyemind/examples/deck/rdf12-directional-language) | [rdf12-directional-language.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-directional-language.js) | RDF 1.2 directional language strings keep their base direction through a display rule |
| [rdf12-nested-triple-term](https://eyereasoner.github.io/eyemind/examples/deck/rdf12-nested-triple-term) | [rdf12-nested-triple-term.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-nested-triple-term.js) | Nested RDF 1.2 triple terms: one pattern reaches the triple inside a claim inside a review |
| [rdf12-trig-graph-join](https://eyereasoner.github.io/eyemind/examples/deck/rdf12-trig-graph-join) | [rdf12-trig-graph-join.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-trig-graph-join.js) | Data about a named graph in the default graph joined with data inside that graph |
| [rdf12-trig-named-graph](https://eyereasoner.github.io/eyemind/examples/deck/rdf12-trig-named-graph) | [rdf12-trig-named-graph.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-trig-named-graph.js) | Ancestors derived within a TriG named graph, each conclusion kept in its graph |
| [rdf12-trig-triple-term](https://eyereasoner.github.io/eyemind/examples/deck/rdf12-trig-triple-term) | [rdf12-trig-triple-term.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-trig-triple-term.js) | A triple term inside a named graph, asserted in the graph that holds the claim |
| [rdf12-triple-term](https://eyereasoner.github.io/eyemind/examples/deck/rdf12-triple-term) | [rdf12-triple-term.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-triple-term.js) | An RDF 1.2 triple term: a claim names a triple without asserting it, and accepting the claim asserts it |
| [reachability](https://eyereasoner.github.io/eyemind/examples/deck/reachability) | [reachability.js](https://github.com/eyereasoner/eyemind/blob/main/examples/reachability.js) | Finite closure in a graph containing a cycle |
| [research-portal](https://eyereasoner.github.io/eyemind/examples/deck/research-portal) | [research-portal.js](https://github.com/eyereasoner/eyemind/blob/main/examples/research-portal.js) | A hospital research portal combines ODRL/DPV policy decisions with Digital Omnibus device consent and breach plans |
| [schema-inference](https://eyereasoner.github.io/eyemind/examples/deck/schema-inference) | [schema-inference.js](https://github.com/eyereasoner/eyemind/blob/main/examples/schema-inference.js) | Subclasses, subproperties, domains and ranges |
| [school-placement-audit](https://eyereasoner.github.io/eyemind/examples/deck/school-placement-audit) | [school-placement-audit.js](https://github.com/eyereasoner/eyemind/blob/main/examples/school-placement-audit.js) | Walking-route and preference scores audit provisional school placements |
| [scoped-audit](https://eyereasoner.github.io/eyemind/examples/deck/scoped-audit) | [scoped-audit.js](https://github.com/eyereasoner/eyemind/blob/main/examples/scoped-audit.js) | Presence and absence within separate quoted graphs |
| [service-outage-recovery](https://eyereasoner.github.io/eyemind/examples/deck/service-outage-recovery) | [service-outage-recovery.js](https://github.com/eyereasoner/eyemind/blob/main/examples/service-outage-recovery.js) | Least-cost repairs that restore checkout through redundant providers and a dependency cycle |
| [shortest-path](https://eyereasoner.github.io/eyemind/examples/deck/shortest-path) | [shortest-path.js](https://github.com/eyereasoner/eyemind/blob/main/examples/shortest-path.js) | Weighted paths and stratified minimum selection |
| [sieve](https://eyereasoner.github.io/eyemind/examples/deck/sieve) | [sieve.js](https://github.com/eyereasoner/eyemind/blob/main/examples/sieve.js) | The sieve of Eratosthenes over an explicit list of integers |
| [socrates](https://eyereasoner.github.io/eyemind/examples/deck/socrates) | [socrates.js](https://github.com/eyereasoner/eyemind/blob/main/examples/socrates.js) | Class membership derived through a subclass rule |
| [state-transitions](https://eyereasoner.github.io/eyemind/examples/deck/state-transitions) | [state-transitions.js](https://github.com/eyereasoner/eyemind/blob/main/examples/state-transitions.js) | Account balances from an ordered event log |
| [strings](https://eyereasoner.github.io/eyemind/examples/deck/strings) | [strings.js](https://github.com/eyereasoner/eyemind/blob/main/examples/strings.js) | Text construction and Unicode inspection |
| [superdense-coding](https://eyereasoner.github.io/eyemind/examples/deck/superdense-coding) | [superdense-coding.js](https://github.com/eyereasoner/eyemind/blob/main/examples/superdense-coding.js) | Superdense coding in discrete quantum theory, with interference as odd path counts |
| [symbolic-derivative](https://eyereasoner.github.io/eyemind/examples/deck/symbolic-derivative) | [symbolic-derivative.js](https://github.com/eyereasoner/eyemind/blob/main/examples/symbolic-derivative.js) | Symbolic differentiation of structured formulas by the sum, product, quotient, power and chain rules |
| [teleportation](https://eyereasoner.github.io/eyemind/examples/deck/teleportation) | [teleportation.js](https://github.com/eyereasoner/eyemind/blob/main/examples/teleportation.js) | Quantum teleportation in discrete quantum theory, checked for every state and outcome |
| [terms](https://eyereasoner.github.io/eyemind/examples/deck/terms) | [terms.js](https://github.com/eyereasoner/eyemind/blob/main/examples/terms.js) | Quoted graphs, triple terms and residual witnesses |
| [turing](https://eyereasoner.github.io/eyemind/examples/deck/turing) | [turing.js](https://github.com/eyereasoner/eyemind/blob/main/examples/turing.js) | A Turing machine interpreter running a binary incrementer |
| [type-inference](https://eyereasoner.github.io/eyemind/examples/deck/type-inference) | [type-inference.js](https://github.com/eyereasoner/eyemind/blob/main/examples/type-inference.js) | Typing rules for a small expression language, run as a checker |
| [unification](https://eyereasoner.github.io/eyemind/examples/deck/unification) | [unification.js](https://github.com/eyereasoner/eyemind/blob/main/examples/unification.js) | Open lists and repeated-variable constraints |
| [variable-predicates](https://eyereasoner.github.io/eyemind/examples/deck/variable-predicates) | [variable-predicates.js](https://github.com/eyereasoner/eyemind/blob/main/examples/variable-predicates.js) | Relations selected and renamed through data bindings |
| [witnesses](https://eyereasoner.github.io/eyemind/examples/deck/witnesses) | [witnesses.js](https://github.com/eyereasoner/eyemind/blob/main/examples/witnesses.js) | Structured witnesses and shared multi-head conclusions |
| [wolf-goat-cabbage](https://eyereasoner.github.io/eyemind/examples/deck/wolf-goat-cabbage) | [wolf-goat-cabbage.js](https://github.com/eyereasoner/eyemind/blob/main/examples/wolf-goat-cabbage.js) | The river crossing, with seven crossings shown to be minimal |
| [zebra](https://eyereasoner.github.io/eyemind/examples/deck/zebra) | [zebra.js](https://github.com/eyereasoner/eyemind/blob/main/examples/zebra.js) | The zebra puzzle solved by narrowing five partially known houses |

The [derived forward rule](deck/derived-rule), [derived backward rule](deck/derived-backward-rule),
and [conjunction of backward templates](deck/derived-backward-rule-2) show
rules enabled by other rules. Inline `forward(Body, Head)` and
`backward(Head, Body)` templates capture their generating context and keep
their other variables local. Arrays can join templates or the goals within
one template. Each generated rule has a proved activation; its dependencies
are visible to stratification before reasoning starts.

`audited-grants.js` shows what one language makes possible. It states an
energy grant policy as a program of its own, has eyemind prove the decisions,
and then reads that proof and its check report back as ordinary facts, with
`eyemind.readTerms` and `facts_from`, to audit the reasoning: the data each decision
rests on, the assumptions it took on trust, and the decisions at risk because
they rest on self-declared income. Rules, data, conclusions, proof and report
are all the same terms, so the audit needs no export format, no parser and no
second tool, and its own conclusions come with a checked proof too.

`integrity.js` intentionally exits with code 65 because it concludes `false`.
Its proof-check report is valid: the certificate explains why the constraint was
violated. Negation and collection examples list their `absent` and `collected`
obligations in the check report; `--strict-proof` rejects those obligations.
Every check file includes `condition(...)` facts for C1-C8, verification counts and
a `verdict(...)` fact. Reports with failures include `failure(...)`; reports with
trusted boundaries include `obligation(...)`. Add `--json` to the check command
for JSON output instead.

`fibonacci.js` answers F(0), F(1), F(10), F(100), F(1000) and F(10000), the
last a 2090-digit integer, then divides successive values to watch the ratio
converge on the golden ratio. It uses fast doubling, which halves the index at
each recursive step and fits within the default reasoning limits. Its saved
proof records the arithmetic and recursive clause instances without trusted
obligations.

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
eyemind --strict-proof --check-proof /tmp/route-proof.js --goal "$goal" examples/path-discovery.js
```

`--goal` replaces the default goal, so checking that proof names the same goal. Zero stopovers allows only direct flights;
N stopovers allows at most N+1 flights. Routes follow the recorded direction
and never repeat an airport. Equal endpoints and unknown names return no
routes. Negative or noninteger limits also return no routes. You can leave
`From` or `To` as a variable to discover endpoints; keep `MaxStopovers` bound.
List the available names with `--goal "airport(Id, Name)"`. These are historical
network records, rather than current flight schedules. The search uses explicit
disequalities to prevent cycles, so its proofs have no trusted obligations.
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
round trip is visible: the sine of the arcsine of 2 comes back as 2. The example
passes strict proof checking, so every component of every conclusion is
recomputed by the checker:

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

A list of all roots is a completed collection, so the default certificate is
small: four steps, with the arithmetic inside two `collected` obligations. Ask
for one root at a time and every arithmetic step is in the certificate
instead. For a cubic it passes strict checking:

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
clause, so the strict certificate recomputes each one.

`bayes-diagnosis.js` models printer faults using illustrative priors and two
conditionally independent observations. It keeps exact integer likelihood
weights and their collected total alongside a floating-point probability.
`policy-risk.js` reports a rank, clause, clamped score, severity, reason and
mitigation. Rank 1 has the highest score; equal scores share a rank. Output
follows inference order, with ranks recorded explicitly. Adding the missing
safeguards removes the affected findings. Both examples expose their collection
obligations, and policy findings also expose absence obligations.

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
condition of the terms is checked one by one, so the proof passes
`--strict-proof` with no trusted steps.

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
neither "diabetes" nor "medical" are absences, listed as obligations. The
signature is accepted because the input says it was verified upstream; the
rules do not recompute the HMAC.

`deontic-logic.js` states duties as plain relations: alice was obliged to
obtain consent and prohibited from sharing a record. Observations say what she
did and, explicitly, what she did not do; a missed obligation is read only
from an explicit `not_performed` fact, never from a missing observation.
Notifying the data protection officer compensates the sharing, but the
violation stays on record. Nothing compensates the missed consent, so alice's
status is `requires_review`, and the proof needs no trusted obligations.

`nixon-diamond.js` sets two defaults against each other: Quakers are pacifists
and Republicans are nonpacifists, and nixon is both. The pacifist default is
guarded by `not(nonpacifist(Person))`, so the Republican rule takes priority,
and stratification runs the default only after the nonpacifist rule has
finished. nixon is classified as a nonpacifist and not as a pacifist, while
ada, only a Quaker, gets the default. The proof rests on one `absent`
obligation: that nothing concludes ada is a nonpacifist.

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
than clock readings, and the example passes strict proof checking.

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
certificate passes strict checking. Stages are counted as changes of map plus
one, where the original stops counting at two.

`superdense-coding.js` sends two classical bits through one qubit in discrete
quantum theory, where amplitudes come from a finite field and the merge of
alternative branches is exclusive: an answer survives when it is reached an odd
number of times. The original toggles asserted facts to get that parity; here
each of Alice's messages N and Bob's readings M collects its ways through the
shared entangled pair and keeps the pair when their number is odd. Every
message arrives as itself by exactly one way, and every wrong reading by two
ways that cancel or by none, so Bob reads 0 to 3 exactly as Alice sent them.
The parity depends on all the ways, so the certificate carries the four
collections behind its answers as obligations.

`teleportation.js` runs the companion protocol in the same theory, with the
same relations. Alice measures the qubit to send together with her half of the
entangled pair, in the four-state basis Bob decodes with in superdense coding,
and sends him the outcome. Bob applies the inverse of that basis relation, which
turns out to be one of Alice's four operations from superdense coding, to his
half. For each of the three nonzero states over the two-element field and each
of the four outcomes, Bob ends up holding exactly the state Alice sent, and a
`contradiction(...)` rule would stop the run with exit code 65 if he did not. The
protocol was written for this collection, not taken from a sibling project.

Certificates that lean on a completed search say so. In `kaprekar.js` the whole
verification sits inside one negation, so its certificate is two steps plus an
`absent` obligation: the exhaustive check over 705 digit multisets is exactly
what the obligation names. `four-color.js` collects the countries with
`findall` and rules out conflicts with negation, so it carries both kinds.

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
The proof recomputes every sum and comparison and trusts one thing: that the
collected list of values is complete.

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
name, description, expected halt code (if any) and proof obligations in
[manifest.json](https://github.com/eyereasoner/eyemind/blob/main/examples/manifest.json), then generate its artifacts.
