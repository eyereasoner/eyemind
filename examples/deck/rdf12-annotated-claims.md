# Annotated claims

*Two sources disagree. Which one do we follow, and why?*

[rdf12-annotated-claims.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-annotated-claims.ttl) · [rules/rdf12-annotated-claims.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rules/rdf12-annotated-claims.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/rdf12-annotated-claims.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rdf12-annotated-claims.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/rdf12-annotated-claims.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=rdf12-annotated-claims)

---

## The question

Two reports about a bridge disagree. The transport authority says the bridge
is **closed**, and is 98% sure. An anonymous social-media post says it is
**open**, and is 35% sure. We also trust the sources differently: the
authority gets a trust score of 95, the anonymous post 20.

A sensible rule: score each report as *confidence × trust*, follow the report
with the highest score, but only if that score reaches 8000. If even the best
report scores lower, nobody should decide automatically: someone must check
the bridge by hand.

**Should we cross the bridge?**

---

## What we tell eyemind

The Turtle file contains both reports and the sources' trust scores.
Each `~` names a reifier for the status triple. The reifier records who
made the report and how confident they were.

```turtle
@prefix : <https://example.org/> .

:bridge :status :closed ~ :authorityClaim .
:authorityClaim :assertedBy :transportAuthority ;
  :confidence 98 .

:bridge :status :open ~ :socialClaim .
:socialClaim :assertedBy :anonymousPost ;
  :confidence 35 .

:transportAuthority :trustScore 95 .
:anonymousPost :trustScore 20 .
```

eyemind reads the statements as `rdf(Subject, Property, Value, Graph)`
facts and reads the canonical integer literals as exact integers.

Then the rules. `implies(conditions, conclusion)` is a forward rule: when
every condition holds, the conclusion holds. `implied_by(conclusion,
conditions)` says the same thing in the other direction, for a rule eyemind
uses only when it needs that conclusion. Capitalized names are variables:
placeholders each use of a rule fills in; `_` means "any value".

```js
// Write a computed integer as a typed RDF literal.
implied_by(integer_literal(N, literal(Text, datatype(integer))), [number_chars(N, Chars), atom_chars(Text, Chars)])

// A claim: an asserted status, a reifier of it with its source, and a score.
implies([ /* status, reifier, source, confidence and trust */ …, is(Score, mul(Confidence, Trust))],
  claim(Status, Source, Score))

// A claim's rank is one more than the number of claims that score higher.
implied_by(higher(Score, Other), [claim(_, _, Other), gt(Other, Score)])
fact(count([], 0))
implied_by(count([_, ...Rest], N), [count(Rest, Before), is(N, add(Before, 1))])
implies(
  [claim(Status, Source, Score), findall(Other, higher(Score, Other), Higher), count(Higher, Count), is(Rank, add(Count, 1))],
  ranked(Rank, Status, Source, Score),
)

// The top claim decides when its score reaches the threshold.
fact(threshold(8000))
fact(status_action(iri(ex + 'closed'), 'avoid_bridge'), status_action(iri(ex + 'open'), 'cross_bridge'))
implies(
  [ranked(1, Status, Source, Score), threshold(Limit), ge(Score, Limit), status_action(Status, Action)],
  decision(Action, Source, Score),
)
// … a second rule decides 'verify_manually' when the top score is below 8000,
// and two more write the decision and the ranking back as RDF (result_rdf).
```

In plain words:

- **Reading numbers.** The Turtle input gives confidence and trust as
  integers. `integer_literal` writes a computed integer as an RDF literal
  for the result.
- **Scoring.** A claim's score is confidence × trust (`mul` multiplies).
- **Ranking.** `findall(Other, higher(Score, Other), Higher)` *collects* into
  the list `Higher` every score that beats this one. Counting that list and
  adding 1 gives the rank.
- **Deciding.** The rank-1 claim decides when its score is at least (`ge`)
  8000; a closed bridge means *avoid*, an open one *cross*.

---

## What eyemind concludes

The decision, and the ranked evidence behind it, written back as RDF:

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/bridge'), iri('https://example.org/decision'), iri('https://example.org/avoid_bridge'), 'default_graph')
result_rdf(iri('https://example.org/bridge'), iri('https://example.org/trustedSource'), iri('https://example.org/transportAuthority'), 'default_graph')
result_rdf(iri('https://example.org/bridge'), iri('https://example.org/score'), literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/closed'), iri('https://example.org/rank'), literal('1', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/closed'), iri('https://example.org/assertedBy'), iri('https://example.org/transportAuthority'), 'default_graph')
result_rdf(iri('https://example.org/closed'), iri('https://example.org/score'), literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/open'), iri('https://example.org/rank'), literal('2', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/open'), iri('https://example.org/assertedBy'), iri('https://example.org/anonymousPost'), 'default_graph')
result_rdf(iri('https://example.org/open'), iri('https://example.org/score'), literal('700', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
```

| Status | Rank | Asserted by | Score |
| --- | ---: | --- | ---: |
| closed | 1 | transport authority | 98 × 95 = 9310 |
| open | 2 | anonymous post | 35 × 20 = 700 |

The decision is **avoid the bridge**, on the transport authority's word, with
score 9310: the top claim, and above the 8000 threshold. The anonymous post
ranks second. Because the results are RDF triples again, any RDF tool can
read the decision and the reasons behind it.

---

## How a collected list is justified

A rank depends on a *complete* list: "the scores higher than 9310 are
`[]`, none at all". eyemind built this list by searching every claim. A proof
can show that each listed item belongs, but it cannot show that nothing was
missed without searching again, and the checker never searches by itself.
A search certificate can stand in for that search in some proofs, but not
here: the scores belong to claims a forward rule derived, and the order in
which derived facts arose is not something the checker can confirm.

So the proof records such a list as **`'collected'`**: gathered by a search
and complete only on trust. The checker reports it as an **obligation**, a
point taken on trust that anyone may challenge by finding a missing item. It
would confront the list with the evidence at hand: if the program or the
proof contained a `higher` statement showing a score above 9310, the list
`[]` would be refuted and the proof rejected. Here neither contains any
`higher` statement, so there is nothing to confront it with, and the list
simply stays on trust.

---

## The proof, line by line

The proof has 52 steps. The excerpt shows the nine claims, the cited clauses
and the 22 steps that justify the decision.

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/bridge'), iri('https://example.org/decision'), iri('https://example.org/avoid_bridge'), 'default_graph')
result_rdf(iri('https://example.org/bridge'), iri('https://example.org/trustedSource'), iri('https://example.org/transportAuthority'), 'default_graph')
result_rdf(iri('https://example.org/bridge'), iri('https://example.org/score'), literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/closed'), iri('https://example.org/rank'), literal('1', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/closed'), iri('https://example.org/assertedBy'), iri('https://example.org/transportAuthority'), 'default_graph')
result_rdf(iri('https://example.org/closed'), iri('https://example.org/score'), literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/open'), iri('https://example.org/rank'), literal('2', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/open'), iri('https://example.org/assertedBy'), iri('https://example.org/anonymousPost'), 'default_graph')
result_rdf(iri('https://example.org/open'), iri('https://example.org/score'), literal('700', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/bridge'), iri('https://example.org/status'), iri('https://example.org/closed'), 'default_graph')))
clause(2, fact(rdf(iri('https://example.org/authorityClaim'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/bridge'), iri('https://example.org/status'), iri('https://example.org/closed')), 'default_graph')))
clause(3, fact(rdf(iri('https://example.org/authorityClaim'), iri('https://example.org/assertedBy'), iri('https://example.org/transportAuthority'), 'default_graph')))
clause(4, fact(rdf(iri('https://example.org/authorityClaim'), iri('https://example.org/confidence'), 98, 'default_graph')))
clause(5, fact(rdf(iri('https://example.org/bridge'), iri('https://example.org/status'), iri('https://example.org/open'), 'default_graph')))
clause(6, fact(rdf(iri('https://example.org/socialClaim'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/bridge'), iri('https://example.org/status'), iri('https://example.org/open')), 'default_graph')))
clause(7, fact(rdf(iri('https://example.org/socialClaim'), iri('https://example.org/assertedBy'), iri('https://example.org/anonymousPost'), 'default_graph')))
clause(8, fact(rdf(iri('https://example.org/socialClaim'), iri('https://example.org/confidence'), 35, 'default_graph')))
clause(9, fact(rdf(iri('https://example.org/transportAuthority'), iri('https://example.org/trustScore'), 95, 'default_graph')))
clause(10, fact(rdf(iri('https://example.org/anonymousPost'), iri('https://example.org/trustScore'), 20, 'default_graph')))
clause(11, implied_by(integer_literal(N, literal(Text, datatype('http://www.w3.org/2001/XMLSchema#integer'))), [number_chars(N, Chars), atom_chars(Text, Chars)]))
clause(12, implies([rdf(iri('https://example.org/bridge'), iri('https://example.org/status'), Status, 'default_graph'), rdf(Reifier, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/bridge'), iri('https://example.org/status'), Status), 'default_graph'), rdf(Reifier, iri('https://example.org/assertedBy'), Source, 'default_graph'), rdf(Reifier, iri('https://example.org/confidence'), Confidence, 'default_graph'), is_int(Confidence), rdf(Source, iri('https://example.org/trustScore'), Trust, 'default_graph'), is_int(Trust), is(Score, mul(Confidence, Trust))], claim(Status, Source, Score)))
clause(14, fact(count([], 0)))
clause(15, implied_by(count([_0, ...Rest], N), [count(Rest, Before), is(N, add(Before, 1))]))
clause(16, implies([claim(Status, Source, Score), findall(Other, higher(Score, Other), Higher), count(Higher, Count), is(Rank, add(Count, 1))], ranked(Rank, Status, Source, Score)))
clause(17, fact(threshold(8000)))
clause(18, fact(status_action(iri('https://example.org/closed'), 'avoid_bridge')))
clause(20, implies([ranked(1, Status, Source, Score), threshold(Limit), ge(Score, Limit), status_action(Status, Action)], decision(Action, Source, Score)))
clause(22, implies([decision(Action, Source, Score), atom_concat('https://example.org/', Action, ActionIri), integer_literal(Score, ScoreText)], [result_rdf(iri('https://example.org/bridge'), iri('https://example.org/decision'), iri(ActionIri), 'default_graph'), result_rdf(iri('https://example.org/bridge'), iri('https://example.org/trustedSource'), Source, 'default_graph'), result_rdf(iri('https://example.org/bridge'), iri('https://example.org/score'), ScoreText, 'default_graph')]))
clause(23, implies([ranked(Rank, Status, Source, Score), integer_literal(Rank, RankText), integer_literal(Score, ScoreText)], [result_rdf(Status, iri('https://example.org/rank'), RankText, 'default_graph'), result_rdf(Status, iri('https://example.org/assertedBy'), Source, 'default_graph'), result_rdf(Status, iri('https://example.org/score'), ScoreText, 'default_graph')]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(result_rdf(iri('https://example.org/bridge'), iri('https://example.org/decision'), iri('https://example.org/avoid_bridge'), 'default_graph'), clause(22), {Action: 'avoid_bridge', Source: iri('https://example.org/transportAuthority'), Score: 9310, ActionIri: 'https://example.org/avoid_bridge', ScoreText: literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer'))}, [decision('avoid_bridge', iri('https://example.org/transportAuthority'), 9310), atom_concat('https://example.org/', 'avoid_bridge', 'https://example.org/avoid_bridge'), integer_literal(9310, literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer')))])
step(decision('avoid_bridge', iri('https://example.org/transportAuthority'), 9310), clause(20), {Status: iri('https://example.org/closed'), Source: iri('https://example.org/transportAuthority'), Score: 9310, Limit: 8000, Action: 'avoid_bridge'}, [ranked(1, iri('https://example.org/closed'), iri('https://example.org/transportAuthority'), 9310), threshold(8000), ge(9310, 8000), status_action(iri('https://example.org/closed'), 'avoid_bridge')])
step(ranked(1, iri('https://example.org/closed'), iri('https://example.org/transportAuthority'), 9310), clause(16), {Status: iri('https://example.org/closed'), Source: iri('https://example.org/transportAuthority'), Score: 9310, Other: A, Higher: [], Count: 0, Rank: 1}, [claim(iri('https://example.org/closed'), iri('https://example.org/transportAuthority'), 9310), findall(A, higher(9310, A), []), count([], 0), is(1, add(0, 1))])
step(claim(iri('https://example.org/closed'), iri('https://example.org/transportAuthority'), 9310), clause(12), {Status: iri('https://example.org/closed'), Reifier: iri('https://example.org/authorityClaim'), Source: iri('https://example.org/transportAuthority'), Confidence: 98, Trust: 95, Score: 9310}, [rdf(iri('https://example.org/bridge'), iri('https://example.org/status'), iri('https://example.org/closed'), 'default_graph'), rdf(iri('https://example.org/authorityClaim'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/bridge'), iri('https://example.org/status'), iri('https://example.org/closed')), 'default_graph'), rdf(iri('https://example.org/authorityClaim'), iri('https://example.org/assertedBy'), iri('https://example.org/transportAuthority'), 'default_graph'), rdf(iri('https://example.org/authorityClaim'), iri('https://example.org/confidence'), 98, 'default_graph'), is_int(98), rdf(iri('https://example.org/transportAuthority'), iri('https://example.org/trustScore'), 95, 'default_graph'), is_int(95), is(9310, mul(98, 95))])
step(rdf(iri('https://example.org/bridge'), iri('https://example.org/status'), iri('https://example.org/closed'), 'default_graph'), clause(1), {}, [])
step(rdf(iri('https://example.org/authorityClaim'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/bridge'), iri('https://example.org/status'), iri('https://example.org/closed')), 'default_graph'), clause(2), {}, [])
step(rdf(iri('https://example.org/authorityClaim'), iri('https://example.org/assertedBy'), iri('https://example.org/transportAuthority'), 'default_graph'), clause(3), {}, [])
step(rdf(iri('https://example.org/authorityClaim'), iri('https://example.org/confidence'), 98, 'default_graph'), clause(4), {}, [])
step(is_int(98), 'builtin', {}, [])
step(rdf(iri('https://example.org/transportAuthority'), iri('https://example.org/trustScore'), 95, 'default_graph'), clause(9), {}, [])
step(is_int(95), 'builtin', {}, [])
step(is(9310, mul(98, 95)), 'builtin', {}, [])
step(findall(A, higher(9310, A), []), 'collected', {}, [])
step(count([], 0), clause(14), {}, [])
step(is(1, add(0, 1)), 'builtin', {}, [])
step(threshold(8000), clause(17), {}, [])
step(ge(9310, 8000), 'builtin', {}, [])
step(status_action(iri('https://example.org/closed'), 'avoid_bridge'), clause(18), {}, [])
step(atom_concat('https://example.org/', 'avoid_bridge', 'https://example.org/avoid_bridge'), 'builtin', {}, [])
step(integer_literal(9310, literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer'))), clause(11), {N: 9310, Text: '9310', Chars: ['9', '3', '1', '0']}, [number_chars(9310, ['9', '3', '1', '0']), atom_chars('9310', ['9', '3', '1', '0'])])
step(number_chars(9310, ['9', '3', '1', '0']), 'builtin', {}, [])
step(atom_chars('9310', ['9', '3', '1', '0']), 'builtin', {}, [])
// … the remaining steps and search certificate are in the saved proof.
```

The decision quad cites rule 22, which uses the decision from rule 20.
Rule 16 ranks the closed claim first because its list of higher scores is
empty. Rule 12 uses the asserted status, the reifier, the source, and its
integer confidence and trust scores to compute 98 × 95 = 9310. The checker
recomputes the multiplication, the rank sum and the threshold comparison.
The empty list remains an obligation.

The second collected list, `findall(A, higher(700, A), [9310])`, gives the
open claim rank 2. [Full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rdf12-annotated-claims.js)

---

## Checked: what the report says

`eyemind -c` generates and checks the proof. `--check-proof` checks
the saved proof against the Turtle file and rule script.

```js
// Answers checked subject to the obligations below.
result_rdf(iri('https://example.org/bridge'), iri('https://example.org/decision'), iri('https://example.org/avoid_bridge'), 'default_graph')
result_rdf(iri('https://example.org/bridge'), iri('https://example.org/trustedSource'), iri('https://example.org/transportAuthority'), 'default_graph')
result_rdf(iri('https://example.org/bridge'), iri('https://example.org/score'), literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/closed'), iri('https://example.org/rank'), literal('1', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/closed'), iri('https://example.org/assertedBy'), iri('https://example.org/transportAuthority'), 'default_graph')
result_rdf(iri('https://example.org/closed'), iri('https://example.org/score'), literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/open'), iri('https://example.org/rank'), literal('2', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')
result_rdf(iri('https://example.org/open'), iri('https://example.org/assertedBy'), iri('https://example.org/anonymousPost'), 'default_graph')
result_rdf(iri('https://example.org/open'), iri('https://example.org/score'), literal('700', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')

// C1-C10: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity, search closure and call fidelity.
condition('C1', 'resolution', 'ok', 32)
condition('C2', 'well_founded', 'ok', 52)
condition('C3', 'justification', 'ok', 52)
condition('C4', 'coverage', 'ok', 74)
condition('C5', 're_decision', 'ok', 18)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 61)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 0)
condition('C10', 'call_fidelity', 'ok', 0)

// Obligations: absence, collection or original-call evidence remains unproved.
obligation('collected', 'theory_scoped', findall(A, higher(9310, A), []))
obligation('collected', 'theory_scoped', findall(A, higher(700, A), [9310]))
obligation('call_fidelity', 'original_call', result_rdf(iri('https://example.org/bridge'), iri('https://example.org/decision'), iri('https://example.org/avoid_bridge'), 'default_graph'))
obligation('call_fidelity', 'original_call', result_rdf(iri('https://example.org/bridge'), iri('https://example.org/trustedSource'), iri('https://example.org/transportAuthority'), 'default_graph'))
obligation('call_fidelity', 'original_call', result_rdf(iri('https://example.org/bridge'), iri('https://example.org/score'), literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph'))
obligation('call_fidelity', 'original_call', result_rdf(iri('https://example.org/closed'), iri('https://example.org/rank'), literal('1', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph'))
obligation('call_fidelity', 'original_call', result_rdf(iri('https://example.org/closed'), iri('https://example.org/assertedBy'), iri('https://example.org/transportAuthority'), 'default_graph'))
obligation('call_fidelity', 'original_call', result_rdf(iri('https://example.org/closed'), iri('https://example.org/score'), literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph'))
obligation('call_fidelity', 'original_call', result_rdf(iri('https://example.org/open'), iri('https://example.org/rank'), literal('2', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph'))
obligation('call_fidelity', 'original_call', result_rdf(iri('https://example.org/open'), iri('https://example.org/assertedBy'), iri('https://example.org/anonymousPost'), 'default_graph'))
obligation('call_fidelity', 'original_call', result_rdf(iri('https://example.org/open'), iri('https://example.org/score'), literal('700', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph'))

// Proof statistics: recorded steps and how they were checked.
steps(52)
verified(32)
recomputed(18)
composed(0)
trusted(11)
claims(9)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

The verdict is **checked with obligations**. The report leaves two
collections and nine original calls as obligations. The collections say
that no score beats 9310 and that 9310 is the only score that beats 700.
`--strict-proof` rejects proofs with these obligations.

---

## Try it

```sh
eyemind examples/rdf12-annotated-claims.ttl examples/rules/rdf12-annotated-claims.js          # the results as quads
eyemind --proof examples/rdf12-annotated-claims.ttl examples/rules/rdf12-annotated-claims.js  # with their proof
eyemind --to turtle examples/rdf12-annotated-claims.ttl examples/rules/rdf12-annotated-claims.js > out.ttl
```

`--to` writes eyemind's quads as RDF, and eyemind reads `.ttl`, `.trig`,
`.nt` and `.nq` files as quads.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=rdf12-annotated-claims).

Lower the authority's confidence from `98` to `80` and run again: its
score becomes 80 × 95 = 7600, still the best but below the threshold, so the
decision becomes `verify_manually` with `noTrustedSource`.

Raise the anonymous post's trust score from `20` to `290`: it now scores
35 × 290 = 10150, beats the authority, and the decision becomes
`cross_bridge` on the post's word. The rule follows the numbers, so the
numbers you give it matter.

---

## Takeaway

When sources conflict, the reasons for following one of them can be written
down, computed, ranked and checked, not just asserted.
