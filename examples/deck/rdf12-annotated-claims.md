# Annotated claims

*Two sources disagree. Which one do we follow, and why?*

[rdf12-annotated-claims.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-annotated-claims.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/rdf12-annotated-claims.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rdf12-annotated-claims.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/rdf12-annotated-claims.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=rdf12-annotated-claims)

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

The reports are written in **RDF**, the web's format for data. In RDF every
statement is a *triple*: a subject, a property and a value, such as *bridge —
status — closed*. Things are named by web addresses (IRIs, written
`iri('https://example.org/bridge')`), and plain values such as numbers are
*literals*: text with a type, such as `literal('98', datatype(integer))`.
eyemind writes each statement as `rdf(Subject, Property, Value, Graph)`;
`'default_graph'` just means "the main collection of statements".

To say *who* claims something and *how sure* they are, RDF 1.2 lets a node
stand for a statement. Such a node is a **reifier**: `authorityClaim`
*reifies* the triple *bridge — status — closed*, and then carries its own
properties: who asserted it and with what confidence. The triple it is about
is written `triple(S, P, O)`. Here is the authority's report:

```js
fact(
  rdf(iri(ex + 'bridge'), iri(ex + 'status'), iri(ex + 'closed'), 'default_graph'),
  rdf(iri(ex + 'authorityClaim'), iri(reifies), bridgeStatus('closed'), 'default_graph'),
  rdf(iri(ex + 'authorityClaim'), iri(ex + 'assertedBy'), iri(ex + 'transportAuthority'), 'default_graph'),
  rdf(iri(ex + 'authorityClaim'), iri(ex + 'confidence'), literal('98', datatype(integer)), 'default_graph'),
  // … the same four statements for the anonymous post's 'open', confidence 35
  rdf(iri(ex + 'transportAuthority'), iri(ex + 'trustScore'), literal('95', datatype(integer)), 'default_graph'),
  rdf(iri(ex + 'anonymousPost'), iri(ex + 'trustScore'), literal('20', datatype(integer)), 'default_graph'),
)
```

`ex`, `reifies` and `integer` are abbreviations for long web addresses,
defined at the top of the file. `bridgeStatus('closed')` is shorthand for the
triple term *bridge — status — closed*.

Then the rules. `implies(conditions, conclusion)` is a forward rule: when
every condition holds, the conclusion holds. `implied_by(conclusion,
conditions)` says the same thing in the other direction, for a rule eyemind
uses only when it needs that conclusion. Capitalized names are variables:
placeholders each use of a rule fills in; `_` means "any value".

```js
// The value of an integer literal, and an integer written as a literal.
implied_by(integer_value(literal(Text, datatype(integer)), N), [atom_chars(Text, Chars), number_chars(N, Chars)])
implied_by(integer_literal(N, literal(Text, datatype(integer))), [number_chars(N, Chars), atom_chars(Text, Chars)])

// A claim: an asserted status, a reifier of it with its source, and a score.
implies([ /* status, reifier, source, confidence C, trust T */ …, is(Score, mul(C, T))],
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

- **Reading numbers.** RDF stores 98 as the text `'98'`. `atom_chars` splits
  text into characters (`'98'` into `['9', '8']`) and `number_chars` reads
  characters as a number, so `integer_value` turns `'98'` into the number
  98. `integer_literal` does the reverse, to write a computed score back
  as RDF text.
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

So the proof records such a list as **`'collected'`**: gathered by a search
and complete only on trust. The checker reports it as an **obligation**, a
point taken on trust that anyone may challenge by finding a missing item. It
does confront the list with the evidence in the proof: if the proof itself
contained a claim scoring above 9310, the list `[]` would be refuted and the
proof rejected.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. The proof has
60 steps and is too long to show whole ([full file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rdf12-annotated-claims.js)).
Below are its claims, all its clauses, and the complete chain of 26 steps for
the first claim, the decision; the last comment line marks what is left out:

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
clause(4, fact(rdf(iri('https://example.org/authorityClaim'), iri('https://example.org/confidence'), literal('98', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')))
clause(5, fact(rdf(iri('https://example.org/bridge'), iri('https://example.org/status'), iri('https://example.org/open'), 'default_graph')))
clause(6, fact(rdf(iri('https://example.org/socialClaim'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/bridge'), iri('https://example.org/status'), iri('https://example.org/open')), 'default_graph')))
clause(7, fact(rdf(iri('https://example.org/socialClaim'), iri('https://example.org/assertedBy'), iri('https://example.org/anonymousPost'), 'default_graph')))
clause(8, fact(rdf(iri('https://example.org/socialClaim'), iri('https://example.org/confidence'), literal('35', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')))
clause(9, fact(rdf(iri('https://example.org/transportAuthority'), iri('https://example.org/trustScore'), literal('95', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')))
clause(10, fact(rdf(iri('https://example.org/anonymousPost'), iri('https://example.org/trustScore'), literal('20', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph')))
clause(11, implied_by(integer_value(literal(Text, datatype('http://www.w3.org/2001/XMLSchema#integer')), N), [atom_chars(Text, Chars), number_chars(N, Chars)]))
clause(12, implied_by(integer_literal(N, literal(Text, datatype('http://www.w3.org/2001/XMLSchema#integer'))), [number_chars(N, Chars), atom_chars(Text, Chars)]))
clause(13, implies([rdf(iri('https://example.org/bridge'), iri('https://example.org/status'), Status, 'default_graph'), rdf(Reifier, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/bridge'), iri('https://example.org/status'), Status), 'default_graph'), rdf(Reifier, iri('https://example.org/assertedBy'), Source, 'default_graph'), rdf(Reifier, iri('https://example.org/confidence'), Confidence, 'default_graph'), integer_value(Confidence, C), rdf(Source, iri('https://example.org/trustScore'), Trust, 'default_graph'), integer_value(Trust, T), is(Score, mul(C, T))], claim(Status, Source, Score)))
clause(15, fact(count([], 0)))
clause(16, implied_by(count([_0, ...Rest], N), [count(Rest, Before), is(N, add(Before, 1))]))
clause(17, implies([claim(Status, Source, Score), findall(Other, higher(Score, Other), Higher), count(Higher, Count), is(Rank, add(Count, 1))], ranked(Rank, Status, Source, Score)))
clause(18, fact(threshold(8000)))
clause(19, fact(status_action(iri('https://example.org/closed'), 'avoid_bridge')))
clause(21, implies([ranked(1, Status, Source, Score), threshold(Limit), ge(Score, Limit), status_action(Status, Action)], decision(Action, Source, Score)))
clause(23, implies([decision(Action, Source, Score), atom_concat('https://example.org/', Action, ActionIri), integer_literal(Score, ScoreText)], [result_rdf(iri('https://example.org/bridge'), iri('https://example.org/decision'), iri(ActionIri), 'default_graph'), result_rdf(iri('https://example.org/bridge'), iri('https://example.org/trustedSource'), Source, 'default_graph'), result_rdf(iri('https://example.org/bridge'), iri('https://example.org/score'), ScoreText, 'default_graph')]))
clause(24, implies([ranked(Rank, Status, Source, Score), integer_literal(Rank, RankText), integer_literal(Score, ScoreText)], [result_rdf(Status, iri('https://example.org/rank'), RankText, 'default_graph'), result_rdf(Status, iri('https://example.org/assertedBy'), Source, 'default_graph'), result_rdf(Status, iri('https://example.org/score'), ScoreText, 'default_graph')]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(result_rdf(iri('https://example.org/bridge'), iri('https://example.org/decision'), iri('https://example.org/avoid_bridge'), 'default_graph'), clause(23), {Action: 'avoid_bridge', Source: iri('https://example.org/transportAuthority'), Score: 9310, ActionIri: 'https://example.org/avoid_bridge', ScoreText: literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer'))}, [decision('avoid_bridge', iri('https://example.org/transportAuthority'), 9310), atom_concat('https://example.org/', 'avoid_bridge', 'https://example.org/avoid_bridge'), integer_literal(9310, literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer')))])
step(decision('avoid_bridge', iri('https://example.org/transportAuthority'), 9310), clause(21), {Status: iri('https://example.org/closed'), Source: iri('https://example.org/transportAuthority'), Score: 9310, Limit: 8000, Action: 'avoid_bridge'}, [ranked(1, iri('https://example.org/closed'), iri('https://example.org/transportAuthority'), 9310), threshold(8000), ge(9310, 8000), status_action(iri('https://example.org/closed'), 'avoid_bridge')])
step(ranked(1, iri('https://example.org/closed'), iri('https://example.org/transportAuthority'), 9310), clause(17), {Status: iri('https://example.org/closed'), Source: iri('https://example.org/transportAuthority'), Score: 9310, Other: A, Higher: [], Count: 0, Rank: 1}, [claim(iri('https://example.org/closed'), iri('https://example.org/transportAuthority'), 9310), findall(A, higher(9310, A), []), count([], 0), is(1, add(0, 1))])
step(claim(iri('https://example.org/closed'), iri('https://example.org/transportAuthority'), 9310), clause(13), {Status: iri('https://example.org/closed'), Reifier: iri('https://example.org/authorityClaim'), Source: iri('https://example.org/transportAuthority'), Confidence: literal('98', datatype('http://www.w3.org/2001/XMLSchema#integer')), C: 98, Trust: literal('95', datatype('http://www.w3.org/2001/XMLSchema#integer')), T: 95, Score: 9310}, [rdf(iri('https://example.org/bridge'), iri('https://example.org/status'), iri('https://example.org/closed'), 'default_graph'), rdf(iri('https://example.org/authorityClaim'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/bridge'), iri('https://example.org/status'), iri('https://example.org/closed')), 'default_graph'), rdf(iri('https://example.org/authorityClaim'), iri('https://example.org/assertedBy'), iri('https://example.org/transportAuthority'), 'default_graph'), rdf(iri('https://example.org/authorityClaim'), iri('https://example.org/confidence'), literal('98', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph'), integer_value(literal('98', datatype('http://www.w3.org/2001/XMLSchema#integer')), 98), rdf(iri('https://example.org/transportAuthority'), iri('https://example.org/trustScore'), literal('95', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph'), integer_value(literal('95', datatype('http://www.w3.org/2001/XMLSchema#integer')), 95), is(9310, mul(98, 95))])
step(rdf(iri('https://example.org/bridge'), iri('https://example.org/status'), iri('https://example.org/closed'), 'default_graph'), clause(1), {}, [])
step(rdf(iri('https://example.org/authorityClaim'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('https://example.org/bridge'), iri('https://example.org/status'), iri('https://example.org/closed')), 'default_graph'), clause(2), {}, [])
step(rdf(iri('https://example.org/authorityClaim'), iri('https://example.org/assertedBy'), iri('https://example.org/transportAuthority'), 'default_graph'), clause(3), {}, [])
step(rdf(iri('https://example.org/authorityClaim'), iri('https://example.org/confidence'), literal('98', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph'), clause(4), {}, [])
step(integer_value(literal('98', datatype('http://www.w3.org/2001/XMLSchema#integer')), 98), clause(11), {Text: '98', N: 98, Chars: ['9', '8']}, [atom_chars('98', ['9', '8']), number_chars(98, ['9', '8'])])
step(atom_chars('98', ['9', '8']), 'builtin', {}, [])
step(number_chars(98, ['9', '8']), 'builtin', {}, [])
step(rdf(iri('https://example.org/transportAuthority'), iri('https://example.org/trustScore'), literal('95', datatype('http://www.w3.org/2001/XMLSchema#integer')), 'default_graph'), clause(9), {}, [])
step(integer_value(literal('95', datatype('http://www.w3.org/2001/XMLSchema#integer')), 95), clause(11), {Text: '95', N: 95, Chars: ['9', '5']}, [atom_chars('95', ['9', '5']), number_chars(95, ['9', '5'])])
step(atom_chars('95', ['9', '5']), 'builtin', {}, [])
step(number_chars(95, ['9', '5']), 'builtin', {}, [])
step(is(9310, mul(98, 95)), 'builtin', {}, [])
step(findall(A, higher(9310, A), []), 'collected', {}, [])
step(count([], 0), clause(15), {}, [])
step(is(1, add(0, 1)), 'builtin', {}, [])
step(threshold(8000), clause(18), {}, [])
step(ge(9310, 8000), 'builtin', {}, [])
step(status_action(iri('https://example.org/closed'), 'avoid_bridge'), clause(19), {}, [])
step(atom_concat('https://example.org/', 'avoid_bridge', 'https://example.org/avoid_bridge'), 'builtin', {}, [])
step(integer_literal(9310, literal('9310', datatype('http://www.w3.org/2001/XMLSchema#integer'))), clause(12), {N: 9310, Text: '9310', Chars: ['9', '3', '1', '0']}, [number_chars(9310, ['9', '3', '1', '0']), atom_chars('9310', ['9', '3', '1', '0'])])
step(number_chars(9310, ['9', '3', '1', '0']), 'builtin', {}, [])
step(atom_chars('9310', ['9', '3', '1', '0']), 'builtin', {}, [])
// … 34 more steps (60 in total) establish the other eight results: the
// remaining decision triples, and the rank, source and score of each claim.
```

It has three parts:

- **The claims**: the 9 results the proof is about.
- **The clauses**: the program facts and rules the steps cite, numbered by
  position in the program, with the abbreviations spelled out. Numbers are
  skipped where nothing cites a clause: the `higher` rule (14) is only used
  inside the collected search, and the `'open'` action (20) and the
  manual-check rule (22) play no part in these results. In displays a lone
  `_` becomes a named placeholder such as `_0`.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`.

Three kinds of justification occur:

- `clause(N)`: an instance of program clause N, with the values in `{...}`.
  A fact cites itself and uses nothing.
- `'builtin'`: a calculation or comparison, such as `is(9310, mul(98, 95))`,
  `ge(9310, 8000)` or `number_chars(98, ['9', '8'])`. The checker recomputes
  it.
- `'collected'`: a list gathered by searching, as explained above. `A` in
  `findall(A, higher(9310, A), [])` stands for "any score".

Read the chain for the decision as sentences:

1. *The bridge's decision is avoid_bridge* — by rule 23, because the decision
   is `avoid_bridge` from the authority with score 9310, and the web address
   for that action and the text `'9310'` are built from it.
2. *The decision is avoid_bridge, from the authority, score 9310* — by rule
   21: the closed claim ranks first, the threshold is 8000, 9310 ≥ 8000, and a
   closed bridge means avoid it.
3. *The closed claim ranks first* — by rule 17: the claim scores 9310, the
   collected list of higher scores is empty, its count is 0 (fact 15), and
   0 + 1 = 1.
4. *The authority claims closed, with score 9310* — by rule 13: the bridge's
   status is closed (fact 1), `authorityClaim` reifies that triple (fact 2),
   was asserted by the authority (fact 3) with confidence `'98'` (fact 4),
   which reads as 98; the authority's trust is `'95'` (fact 9), which reads
   as 95; and 98 × 95 = 9310.
5. Facts 1 to 4 each stand on their own.
6. *`'98'` is the number 98* — by rule 11: `'98'` splits into `['9', '8']`,
   and those characters read as 98 (both recomputed). The same goes for
   `'95'`, after fact 9.
7. *98 × 95 = 9310* — recomputed.
8. *No score is higher than 9310* — collected: `[]`, taken on trust.
9. *An empty list has 0 items* — fact 15; *0 + 1 = 1* — recomputed.
10. *The threshold is 8000* — fact 18; *9310 ≥ 8000* — recomputed;
    *closed means avoid_bridge* — fact 19.
11. *The action's web address is `https://example.org/avoid_bridge`* — the
    two texts joined (`atom_concat`), recomputed.
12. *9310 is written `'9310'`* — by rule 12, with its two character
    conversions recomputed.

Each step leans only on steps listed below it. The 34 steps left out work the
same way for the other results; among them is the second collected list,
`findall(A, higher(700, A), [9310])`: one score, 9310, beats 700, so the open
claim ranks 1 + 1 = 2.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

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

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 36)
condition('C2', 'well_founded', 'ok', 60)
condition('C3', 'justification', 'ok', 60)
condition('C4', 'coverage', 'ok', 82)
condition('C5', 're_decision', 'ok', 22)
condition('C6', 'boundary_consistency', 'ok', 2)
condition('C7', 'relevance', 'ok', 69)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('collected', 'theory_scoped', findall(A, higher(9310, A), []))
obligation('collected', 'theory_scoped', findall(A, higher(700, A), [9310]))

// Proof statistics: recorded steps and how they were checked.
steps(60)
verified(36)
recomputed(22)
composed(0)
trusted(2)
claims(9)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (36)**: the 36 steps that cite a clause really are
  instances of it with the values shown; for example, the claim step is rule
  13 with `C` = 98, `T` = 95 and `Score` = 9310.
- **C2 well-founded (60)**: none of the 60 steps depends on itself, even
  indirectly.
- **C3 justification (60)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (82)**: the 9 claims and the 73 things the steps use are each
  backed by a step: nothing is taken for granted silently.
- **C5 re-decision (22)**: the 22 calculations were recomputed and agree: the
  two multiplications, the rank sums, the `ge` comparison, the joined web
  address, and the character conversions between numbers and text.
- **C6 boundary consistency (2)**: the 2 collected lists were confronted with
  the evidence in the proof, and none is contradicted: the proof has no
  claim scoring above 9310, and the only claim scoring above 700 is the
  9310 that the second list contains.
- **C7 relevance (69)**: the 9 claims each answer the program's query, and all
  60 steps serve a claim.
- **C8 witness integrity (0)**: no rule invents a new, unnamed thing, so
  there is no invented name to verify.

The statistics: 60 steps, of which 36 were verified against the program, 22
recomputed and 2 trusted; none composed from parts; 9 claims.

The two `obligation` lines say, in plain words: *no claim scores higher than
9310*, and *the only score higher than 700 is 9310*. Both are complete only
on trust; `'theory_scoped'` means they are meant relative to this program.

The verdict is **checked with obligations**: the decision follows from the
program, provided those two lists are complete. As the last comment says, the
verdict also does not establish completeness of the results: it does not say
these are all the conclusions the program has.

---

## Try it

```sh
eyemind examples/rdf12-annotated-claims.js                  # the results as quads
eyemind --proof examples/rdf12-annotated-claims.js          # with their proof
eyemind examples/rdf12-annotated-claims.js > out.js && eyemind-to-rdf out.js -o out.ttl
```

`eyemind-to-rdf` and `rdf-to-eyemind` come with
[rdf-interchange](https://github.com/eyereasoner/rdf-interchange);
they turn eyemind's quads into RDF and RDF into quads.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=rdf12-annotated-claims).

Lower the authority's confidence from `'98'` to `'80'` and run again: its
score becomes 80 × 95 = 7600, still the best but below the threshold, so the
decision becomes `verify_manually` with `noTrustedSource`.

Raise the anonymous post's trust score from `'20'` to `'290'`: it now scores
35 × 290 = 10150, beats the authority, and the decision becomes
`cross_bridge` on the post's word. The rule follows the numbers, so the
numbers you give it matter.
