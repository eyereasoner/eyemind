# Directional language

*Arabic runs right to left. The data should say so.*

[rdf12-directional-language.js](https://github.com/eyereasoner/eyemind/blob/main/examples/rdf12-directional-language.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/rdf12-directional-language.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/rdf12-directional-language.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/rdf12-directional-language.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=rdf12-directional-language)

---

## The question

A website has a welcome label in Arabic, مرحبا, and in English, *Welcome*.
Arabic is written right to left, English left to right. A screen that does
not know the direction can garble the text, especially when it is mixed with
numbers or punctuation.

**RDF** is a standard way to publish data on the web as simple statements:
*this thing* has *this property* with *this value*. Version 1.2 of RDF lets a
piece of text carry both its language and its **base direction**, written
`"مرحبا"@ar--rtl` ("Arabic, right to left").

**When a rule turns every label into a display label, do the language and the
direction survive?**

---

## What we tell eyemind

```js
const ex = 'https://example.org/'

fact(
  rdf(iri(ex + 'welcome'), iri(ex + 'label'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph'),
  rdf(iri(ex + 'welcome'), iri(ex + 'label'), literal('Welcome', lang('en', 'ltr')), 'default_graph'),
)

// Every label is also a display label, with its language and direction.
implies(rdf(S, iri(ex + 'label'), Label, G), result_rdf(S, iri(ex + 'displayLabel'), Label, G))
query(result_rdf(S, P, O, G))
```

An eyemind program is JavaScript, so `const ex = ...` simply names a piece of
text, and `ex + 'welcome'` glues two pieces together into
`https://example.org/welcome`.

The data is written as ordinary terms:

- `rdf(Subject, Property, Value, Graph)` is one RDF statement. The graph says
  which collection of statements it belongs to; here the main one,
  `'default_graph'`.
- `iri(Text)` is a web address that names a thing or a property.
- `literal(Text, lang(Tag, Direction))` is text with its language (`'ar'` for
  Arabic, `'en'` for English) and its direction (`'rtl'` right to left,
  `'ltr'` left to right).

One `fact(...)` holds two statements here, so they become facts 1 and 2: the
Arabic label and the English label.

The `implies(premise, conclusion)` line is a **rule**, number 3: whenever the
premise holds, eyemind concludes the conclusion. Capitalized names (`S`,
`Label`, `G`) are **variables**, blanks that stand for whatever fits. The rule
says: whatever `S` has as a label, it has as a display label too, in the same
graph. `Label` stands for the *whole* text value, language and direction
included, so the rule passes it on untouched. `result_rdf` marks the
statements that are results. The `query` asks for all of them.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph')
result_rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')), 'default_graph')
```

Two display labels for the welcome page. The Arabic one still says `'ar'`,
`'rtl'`; the English one still says `'en'`, `'ltr'`. A screen can lay out
each text the right way.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
result_rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph')
result_rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')), 'default_graph')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph')))
clause(2, fact(rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('Welcome', lang('en', 'ltr')), 'default_graph')))
clause(3, implies(rdf(S, iri('https://example.org/label'), Label, G), result_rdf(S, iri('https://example.org/displayLabel'), Label, G)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(result_rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph'), clause(3), {S: iri('https://example.org/welcome'), Label: literal('مرحبا', lang('ar', 'rtl')), G: 'default_graph'}, [rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph')])
step(rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph'), clause(1), {}, [])
step(result_rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')), 'default_graph'), clause(3), {S: iri('https://example.org/welcome'), Label: literal('Welcome', lang('en', 'ltr')), G: 'default_graph'}, [rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('Welcome', lang('en', 'ltr')), 'default_graph')])
step(rdf(iri('https://example.org/welcome'), iri('https://example.org/label'), literal('Welcome', lang('en', 'ltr')), 'default_graph'), clause(2), {}, [])
```

It has three parts:

- **The claims**: the two answers the proof is about.
- **The clauses**: the three program lines the proof relies on, with `ex`
  already filled in as the full web address.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *The welcome page has the Arabic display label, right to left*: by rule 3,
   with `S` = the welcome page, `Label` = the whole Arabic text value and
   `G` = the default graph, because the welcome page has that label.
2. *The welcome page has the Arabic label*: fact 1; it uses nothing.
3. *The welcome page has the English display label, left to right*: by
   rule 3, with `Label` = the whole English text value, because the welcome
   page has that label.
4. *The welcome page has the English label*: fact 2.

The value of `Label` in steps 1 and 3 is the whole literal, direction and
all. That is why the direction cannot be lost: the rule never takes the value
apart.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
result_rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('مرحبا', lang('ar', 'rtl')), 'default_graph')
result_rdf(iri('https://example.org/welcome'), iri('https://example.org/displayLabel'), literal('Welcome', lang('en', 'ltr')), 'default_graph')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 4)
condition('C2', 'well_founded', 'ok', 4)
condition('C3', 'justification', 'ok', 4)
condition('C4', 'coverage', 'ok', 4)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 6)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(4)
verified(4)
recomputed(0)
composed(0)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (4)**: each of the 4 steps really is an instance of the
  rule or fact it cites. Filling the values of step 1 into rule 3 gives
  exactly the Arabic display label, `'rtl'` included.
- **C2 well-founded (4)**: no step depends on itself, even indirectly.
- **C3 justification (4)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (4)**: the 2 claims and the 2 labels the rule steps use are
  each backed by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (6)**: the 2 claims answer the query, and all 4 steps serve
  them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 4 steps, all 4 verified against the program, none
taken on trust, for 2 claims. The verdict is **checked**: both display labels,
with their directions, follow from the program. As the last comment says, it
confirms these answers; it does not say there are no others.

---

## Try it

```sh
eyemind examples/rdf12-directional-language.js              # the results as quads
eyemind --proof examples/rdf12-directional-language.js      # with their proof
eyemind examples/rdf12-directional-language.js > out.js && eyemind-to-rdf out.js -o out.ttl
```

`eyemind-to-rdf` and `rdf-to-eyemind` come with
[rdf-interchange](https://github.com/eyereasoner/rdf-interchange);
they turn eyemind's quads into RDF and RDF into quads.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=rdf12-directional-language).

Add a Hebrew label to the facts,
`rdf(iri(ex + 'welcome'), iri(ex + 'label'), literal('ברוכים הבאים', lang('he', 'rtl')), 'default_graph')`,
and run again: a third display label appears, still marked `'he'`, `'rtl'`.

---

## Takeaway

A rule that passes a value on whole cannot lose part of it: the direction
arrives on the screen as it left the data.
