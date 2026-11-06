# A right to the value of personal data

*How such a right fits existing EU law, and how it could become a right of its own.*

[data-value-right.js](https://github.com/eyereasoner/eyemind/blob/main/examples/data-value-right.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/data-value-right.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/data-value-right.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/data-value-right.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=data-value-right)

---

## The question

AI systems are trained on, and earn money with, personal data. Do the people
the data is about (the *data subjects*) have a **right to the value** it
creates?

A researcher studying this combines two methods:

- **Legal analysis:** how would such a right fit within existing EU law?
  Which parts of it does the law already provide, fully or in part, and which
  parts does it not provide at all?
- **Policy evaluation:** of several ways to develop the right, which one
  covers what is missing, without treating personal data as a commodity that
  can be sold off (in tension with data protection as a fundamental right,
  art. 8 of the EU Charter), and while giving the data subject a claim of
  their own?

This example writes that research design down as a program, so that every
step from the law to the recommendation can be followed and checked.

**Which parts of the right are missing from existing law, and which way of
developing it meets no objection?**

*It is a model of a research design, with provisions summarized for
illustration, not legal advice.*

---

## What we tell eyemind

The program starts from a working hypothesis: the right has seven
components.

| Component | What it means |
| --- | --- |
| `value_transparency` | knowing that and how one's data creates value, including in AI training |
| `use_control` | deciding on the uses through which one's data creates value |
| `value_mobility` | taking one's data elsewhere, to have value created there |
| `value_recognition` | the law acknowledging that personal data has economic value |
| `collective_exercise` | exercising the right together, through an intermediary |
| `individual_enforcement` | enforcing the right oneself, before a court |
| `value_share` | receiving a share of the value one's data creates |

Nine existing provisions are recorded with the component each anchors, how
far (`'full'` or `'partial'`), and why. Four of them:

```js
['GDPR art. 13-15', 'value_transparency', 'partial',
  'information on purposes and recipients, not on the value created'],
['AI Act art. 53(1)(d)', 'value_transparency', 'partial',
  'a public summary of the content used to train general-purpose AI models, not per data subject'],
['Directive 2019/770 art. 3(1)', 'value_recognition', 'full',
  'personal data recognized as what a consumer may provide in exchange for digital content'],
['GDPR art. 79 and 82', 'individual_enforcement', 'full',
  'a judicial remedy and compensation for the data subject'],
```

Five options for developing the right are listed with the components each
delivers and how it frames the right: extending portability (a *right*), a
data dividend (a *levy*), data ownership (*property*), and an autonomous,
*inalienable right* that delivers all seven. The fifth, interpreting existing
law, is given no components: a rule derives them from the analysis, because
interpretation can only strengthen what the law already anchors.

These tables are plain JavaScript; a short loop turns every row into a fact
such as `fact(anchor('GDPR art. 20', 'value_mobility', 'partial', '…'))`.
Two more facts say which framings give the data subject a claim of their own
(`right`, `inalienable_right`, `property`) and which treat data as a
commodity (`property`).

### The legal analysis, as rules

```js
implies(anchor(P, C, D, W), anchored(C))
implies(anchor(P, C, 'full', W), fully_anchored(C))
implies([component(C, Description), not(anchored(C))], gap(C))

implies(fully_anchored(C), fit(C, 'in existing law'))
implies([anchored(C), not(fully_anchored(C))], fit(C, 'by interpretation'))
implies(gap(C), fit(C, 'needs an autonomous right'))

implies(
  [component(C, Meaning), fit(C, How), findall(P, anchor(P, C, D, W), Provisions)],
  analysis(C, Meaning, How, Provisions),
)
```

`implies(conditions, conclusion)` is a rule: when the conditions hold, the
conclusion holds. Capitalized letters are variables, placeholders each use of
a rule fills in: `C` a component, `P` a provision, `D` a degree, `W` a
reason. In words: a component with any anchoring provision is *anchored*;
with a `'full'` one, *fully anchored*. A component with no anchor at all is a
**gap**. Fully anchored means it is already *in existing law*; anchored only
in part, it can be developed *by interpretation*; a gap *needs an autonomous
right*.

Two features do the work:

- `not(...)` holds when eyemind cannot find what is inside it: "no provision
  anchors this component". eyemind only asks such a question after it has
  derived everything that could answer it.
- `findall(P, anchor(P, C, D, W), Provisions)` **collects** into the list
  `Provisions` every provision `P` that anchors component `C`.

### The policy evaluation, as rules

```js
implies(anchored(C), delivers('interpret_existing_law', C))

implies([component(C, Meaning), not(fully_anchored(C))], needs_development(C))
implies([option(O, F), needs_development(C), not(delivers(O, C))], objection(O, unaddressed(C)))
implies([option(O, F), commodifies(F)], objection(O, 'treats personal data as a commodity'))
implies(
  [option(O, F), not(own_claim(F))],
  objection(O, 'gives the data subject no claim of their own'),
)

implies(objection(O, Why), objectionable(O))
implies([option(O, F), not(objectionable(O))], recommended(O))
implies(
  [option(O, F), findall(C, delivers(O, C), Delivered), findall(Why, objection(O, Why), Objections)],
  evaluation(O, Delivered, Objections),
)
```

A component *needs development* unless the law anchors it fully. An option
`O` with framing `F` meets an **objection** for each such component it leaves
undelivered, when its framing treats data as a commodity, or when its framing
gives the data subject no claim of their own. An option with no objection at
all is **recommended**. Each evaluation collects what an option delivers and
the objections it meets.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
analysis('value_transparency', 'knowing that and how one\'s data creates value, including in AI training', 'by interpretation', ['GDPR art. 13-15', 'AI Act art. 53(1)(d)'])
analysis('use_control', 'deciding on the uses through which one\'s data creates value', 'by interpretation', ['GDPR art. 7(3)', 'GDPR art. 21'])
analysis('value_mobility', 'taking one\'s data elsewhere, to have value created there', 'by interpretation', ['GDPR art. 20', 'DMA art. 6(9)'])
analysis('value_recognition', 'the law acknowledging that personal data has economic value', 'in existing law', ['Directive 2019/770 art. 3(1)'])
analysis('collective_exercise', 'exercising the right together, through an intermediary', 'by interpretation', ['DGA ch. III'])
analysis('individual_enforcement', 'enforcing the right oneself, before a court', 'in existing law', ['GDPR art. 79 and 82'])
analysis('value_share', 'receiving a share of the value one\'s data creates', 'needs an autonomous right', [])
evaluation('interpret_existing_law', ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement'], [unaddressed('value_share')])
evaluation('extend_portability', ['value_mobility', 'value_transparency'], [unaddressed('use_control'), unaddressed('collective_exercise'), unaddressed('value_share')])
evaluation('data_dividend', ['value_share', 'collective_exercise'], [unaddressed('value_transparency'), unaddressed('use_control'), unaddressed('value_mobility'), 'gives the data subject no claim of their own'])
evaluation('data_ownership', ['value_share', 'use_control', 'value_mobility', 'individual_enforcement'], ['treats personal data as a commodity', unaddressed('value_transparency'), unaddressed('collective_exercise')])
evaluation('autonomous_right', ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement', 'value_share'], [])
recommended('autonomous_right')
```

The legal analysis: two components are already **in existing law**
(recognition of value, and individual enforcement), four can be developed
**by interpretation**, and one, **a share of the value**, has no anchor at
all (its list of provisions is empty `[]`), so it **needs an autonomous
right**.

The policy evaluation:

| Option | Objections |
| --- | --- |
| interpret existing law | leaves the value share unaddressed |
| extend portability | leaves use control, collective exercise and the value share unaddressed |
| data dividend | leaves transparency, use control and mobility unaddressed; no claim of the data subject's own |
| data ownership | treats data as a commodity; leaves transparency and collective exercise unaddressed |
| autonomous right | none |

Only the **autonomous right** meets no objection, so it is the one
recommended.

---

## How eyemind justifies "missing" and "all of them"

Two kinds of conclusion cannot be shown by pointing at a fact:

- **An absence**, such as `not(anchored('value_share'))`: *no provision
  anchors the value share*. eyemind concluded it because a search found
  nothing. The proof records such a step as **`'absent'`**.
- **A collected list**, such as the provisions anchoring a component, or the
  objections to an option. eyemind gathered it by searching everything. The
  proof records it as **`'collected'`**: the list is taken as given, complete
  only on trust.

The checker never searches by itself, so it cannot confirm these outright.
It lists each as an **obligation**: a point taken on trust, which anyone may
challenge by showing the missing thing. It does confront each with the
evidence it has, the program's facts and the proof's own steps: if, say, the
program had an `anchor` fact for the value share, the absence and the empty
list would be refuted and the proof rejected.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. The proof has
68 steps and is too long to show whole ([full file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/data-value-right.js)).
Below are its claims, all its clauses, and two complete chains: the analysis
of the value share, and the evaluation and recommendation of the autonomous
right. Comment lines starting with `// …` mark what is left out:

```js
// Answers: each instance of a query() that holds.
analysis('value_transparency', 'knowing that and how one\'s data creates value, including in AI training', 'by interpretation', ['GDPR art. 13-15', 'AI Act art. 53(1)(d)'])
analysis('use_control', 'deciding on the uses through which one\'s data creates value', 'by interpretation', ['GDPR art. 7(3)', 'GDPR art. 21'])
analysis('value_mobility', 'taking one\'s data elsewhere, to have value created there', 'by interpretation', ['GDPR art. 20', 'DMA art. 6(9)'])
analysis('value_recognition', 'the law acknowledging that personal data has economic value', 'in existing law', ['Directive 2019/770 art. 3(1)'])
analysis('collective_exercise', 'exercising the right together, through an intermediary', 'by interpretation', ['DGA ch. III'])
analysis('individual_enforcement', 'enforcing the right oneself, before a court', 'in existing law', ['GDPR art. 79 and 82'])
analysis('value_share', 'receiving a share of the value one\'s data creates', 'needs an autonomous right', [])
evaluation('interpret_existing_law', ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement'], [unaddressed('value_share')])
evaluation('extend_portability', ['value_mobility', 'value_transparency'], [unaddressed('use_control'), unaddressed('collective_exercise'), unaddressed('value_share')])
evaluation('data_dividend', ['value_share', 'collective_exercise'], [unaddressed('value_transparency'), unaddressed('use_control'), unaddressed('value_mobility'), 'gives the data subject no claim of their own'])
evaluation('data_ownership', ['value_share', 'use_control', 'value_mobility', 'individual_enforcement'], ['treats personal data as a commodity', unaddressed('value_transparency'), unaddressed('collective_exercise')])
evaluation('autonomous_right', ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement', 'value_share'], [])
recommended('autonomous_right')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(component('value_transparency', 'knowing that and how one\'s data creates value, including in AI training')))
clause(2, fact(component('use_control', 'deciding on the uses through which one\'s data creates value')))
clause(3, fact(component('value_mobility', 'taking one\'s data elsewhere, to have value created there')))
clause(4, fact(component('value_recognition', 'the law acknowledging that personal data has economic value')))
clause(5, fact(component('collective_exercise', 'exercising the right together, through an intermediary')))
clause(6, fact(component('individual_enforcement', 'enforcing the right oneself, before a court')))
clause(7, fact(component('value_share', 'receiving a share of the value one\'s data creates')))
clause(8, fact(anchor('GDPR art. 13-15', 'value_transparency', 'partial', 'information on purposes and recipients, not on the value created')))
clause(10, fact(anchor('GDPR art. 7(3)', 'use_control', 'partial', 'consent can be withdrawn at any time, where processing rests on consent')))
clause(12, fact(anchor('GDPR art. 20', 'value_mobility', 'partial', 'portability of data the data subject provided, on consent or contract')))
clause(14, fact(anchor('Directive 2019/770 art. 3(1)', 'value_recognition', 'full', 'personal data recognized as what a consumer may provide in exchange for digital content')))
clause(15, fact(anchor('DGA ch. III', 'collective_exercise', 'partial', 'data intermediation services, without bargaining over value')))
clause(16, fact(anchor('GDPR art. 79 and 82', 'individual_enforcement', 'full', 'a judicial remedy and compensation for the data subject')))
clause(17, fact(option('interpret_existing_law', 'right')))
clause(18, fact(option('extend_portability', 'right')))
clause(21, fact(option('data_dividend', 'levy')))
clause(24, fact(option('data_ownership', 'property')))
clause(29, fact(option('autonomous_right', 'inalienable_right')))
clause(41, implies(anchor(P, C, D, W), anchored(C)))
clause(42, implies(anchor(P, C, 'full', W), fully_anchored(C)))
clause(43, implies([component(C, Description), not(anchored(C))], gap(C)))
clause(44, implies(fully_anchored(C), fit(C, 'in existing law')))
clause(45, implies([anchored(C), not(fully_anchored(C))], fit(C, 'by interpretation')))
clause(46, implies(gap(C), fit(C, 'needs an autonomous right')))
clause(47, implies([component(C, Meaning), fit(C, How), findall(P, anchor(P, C, D, W), Provisions)], analysis(C, Meaning, How, Provisions)))
clause(55, implies([option(O, F), not(objectionable(O))], recommended(O)))
clause(56, implies([option(O, F), findall(C, delivers(O, C), Delivered), findall(Why, objection(O, Why), Objections)], evaluation(O, Delivered, Objections)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
// … the proof has 68 steps; 12 are shown. Left out here: 40 steps for the
// first six analyses, which follow the same pattern per component.
step(analysis('value_share', 'receiving a share of the value one\'s data creates', 'needs an autonomous right', []), clause(47), {C: 'value_share', Meaning: 'receiving a share of the value one\'s data creates', How: 'needs an autonomous right', P: A, D: B, W: C, Provisions: []}, [component('value_share', 'receiving a share of the value one\'s data creates'), fit('value_share', 'needs an autonomous right'), findall(A, anchor(A, 'value_share', B, C), [])])
step(component('value_share', 'receiving a share of the value one\'s data creates'), clause(7), {}, [])
step(fit('value_share', 'needs an autonomous right'), clause(46), {C: 'value_share'}, [gap('value_share')])
step(gap('value_share'), clause(43), {C: 'value_share', Description: 'receiving a share of the value one\'s data creates'}, [component('value_share', 'receiving a share of the value one\'s data creates'), not(anchored('value_share'))])
step(not(anchored('value_share')), 'absent', {}, [])
step(findall(A, anchor(A, 'value_share', B, C), []), 'collected', {}, [])
// … 16 steps for the evaluations of the other four options
step(evaluation('autonomous_right', ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement', 'value_share'], []), clause(56), {O: 'autonomous_right', F: 'inalienable_right', C: D, Delivered: ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement', 'value_share'], Why: E, Objections: []}, [option('autonomous_right', 'inalienable_right'), findall(D, delivers('autonomous_right', D), ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement', 'value_share']), findall(E, objection('autonomous_right', E), [])])
step(option('autonomous_right', 'inalienable_right'), clause(29), {}, [])
step(findall(D, delivers('autonomous_right', D), ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement', 'value_share']), 'collected', {}, [])
step(findall(E, objection('autonomous_right', E), []), 'collected', {}, [])
step(recommended('autonomous_right'), clause(55), {O: 'autonomous_right', F: 'inalienable_right'}, [option('autonomous_right', 'inalienable_right'), not(objectionable('autonomous_right'))])
step(not(objectionable('autonomous_right')), 'absent', {}, [])
```

It has three parts:

- **The claims**: the 13 conclusions the proof is about.
- **The clauses**: the program facts and rules the steps cite, numbered in
  program order (the loops' facts come first, then the rules; the queries
  count too). Many numbers are skipped. Only one anchoring provision per
  component is cited, because one is enough to make it *anchored*; the
  others, such as the AI Act, appear only inside collected lists. The
  `delivers` facts and all objection rules are skipped for the same reason:
  they only feed collected lists.
- **The steps**: one per thing established. A step reads
  `step(what, justified by, with which values, using what)`.

Three kinds of justification occur:

- `clause(N)`: an instance of program clause N, with the values in `{...}`.
  A fact cites itself and uses nothing.
- `'absent'`: concluded because a search found nothing.
- `'collected'`: a list gathered by searching, taken as given.

In the values, letters such as `A`, `B`, `C`, `D` and `E` stand for "any
value": `findall(A, anchor(A, 'value_share', B, C), [])` reads *the
provisions A that anchor the value share, to any degree B, for any reason C:
none*.

Read the two chains as sentences:

1. *The value share needs an autonomous right, with no provisions* — by rule
   47, because it is a component, its fit is "needs an autonomous right", and
   the collected list of its provisions is empty.
2. *The value share is a component* — fact 7.
3. *Its fit is "needs an autonomous right"* — by rule 46, because it is a
   gap.
4. *The value share is a gap* — by rule 43, because it is a component and
   it is not anchored.
5. *No provision anchors the value share* — absent.
6. *Its provisions are `[]`* — collected.
7. *The autonomous right delivers all seven components and meets no
   objection* — by rule 56, because it is an option framed as an inalienable
   right, the collected list of what it delivers has all seven components,
   and the collected list of its objections is empty.
8. *The autonomous right is an option, framed as an inalienable right* — fact
   29.
9. *What it delivers* — collected.
10. *Its objections: none* — collected.
11. *The autonomous right is recommended* — by rule 55, because it is an
    option and it is not objectionable.
12. *The autonomous right is not objectionable* — absent.

The left-out steps follow the same patterns: for each other component, an
`anchored` or `fully_anchored` step resting on one provision fact, an absence
where the component is not fully anchored, and a collected list of its
provisions; for each other option, its fact and two collected lists.

Notice what the proof does *not* show: the objection lists are collected, so
no step derives an individual objection. The proof's guarantee for the
policy evaluation therefore rests mostly on trust; the legal analysis is
covered by verified steps down to the provisions.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
analysis('value_transparency', 'knowing that and how one\'s data creates value, including in AI training', 'by interpretation', ['GDPR art. 13-15', 'AI Act art. 53(1)(d)'])
analysis('use_control', 'deciding on the uses through which one\'s data creates value', 'by interpretation', ['GDPR art. 7(3)', 'GDPR art. 21'])
analysis('value_mobility', 'taking one\'s data elsewhere, to have value created there', 'by interpretation', ['GDPR art. 20', 'DMA art. 6(9)'])
analysis('value_recognition', 'the law acknowledging that personal data has economic value', 'in existing law', ['Directive 2019/770 art. 3(1)'])
analysis('collective_exercise', 'exercising the right together, through an intermediary', 'by interpretation', ['DGA ch. III'])
analysis('individual_enforcement', 'enforcing the right oneself, before a court', 'in existing law', ['GDPR art. 79 and 82'])
analysis('value_share', 'receiving a share of the value one\'s data creates', 'needs an autonomous right', [])
evaluation('interpret_existing_law', ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement'], [unaddressed('value_share')])
evaluation('extend_portability', ['value_mobility', 'value_transparency'], [unaddressed('use_control'), unaddressed('collective_exercise'), unaddressed('value_share')])
evaluation('data_dividend', ['value_share', 'collective_exercise'], [unaddressed('value_transparency'), unaddressed('use_control'), unaddressed('value_mobility'), 'gives the data subject no claim of their own'])
evaluation('data_ownership', ['value_share', 'use_control', 'value_mobility', 'individual_enforcement'], ['treats personal data as a commodity', unaddressed('value_transparency'), unaddressed('collective_exercise')])
evaluation('autonomous_right', ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement', 'value_share'], [])
recommended('autonomous_right')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 45)
condition('C2', 'well_founded', 'ok', 68)
condition('C3', 'justification', 'ok', 68)
condition('C4', 'coverage', 'ok', 70)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 17)
condition('C7', 'relevance', 'ok', 81)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not(fully_anchored('value_transparency')))
obligation('collected', 'theory_scoped', findall(A, anchor(A, 'value_transparency', B, C), ['GDPR art. 13-15', 'AI Act art. 53(1)(d)']))
obligation('absent', 'theory_scoped', not(fully_anchored('use_control')))
obligation('collected', 'theory_scoped', findall(A, anchor(A, 'use_control', B, C), ['GDPR art. 7(3)', 'GDPR art. 21']))
obligation('absent', 'theory_scoped', not(fully_anchored('value_mobility')))
obligation('collected', 'theory_scoped', findall(A, anchor(A, 'value_mobility', B, C), ['GDPR art. 20', 'DMA art. 6(9)']))
obligation('collected', 'theory_scoped', findall(A, anchor(A, 'value_recognition', B, C), ['Directive 2019/770 art. 3(1)']))
obligation('absent', 'theory_scoped', not(fully_anchored('collective_exercise')))
obligation('collected', 'theory_scoped', findall(A, anchor(A, 'collective_exercise', B, C), ['DGA ch. III']))
obligation('collected', 'theory_scoped', findall(A, anchor(A, 'individual_enforcement', B, C), ['GDPR art. 79 and 82']))
obligation('absent', 'theory_scoped', not(anchored('value_share')))
obligation('collected', 'theory_scoped', findall(A, anchor(A, 'value_share', B, C), []))
obligation('collected', 'theory_scoped', findall(A, delivers('interpret_existing_law', A), ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement']))
obligation('collected', 'theory_scoped', findall(A, objection('interpret_existing_law', A), [unaddressed('value_share')]))
obligation('collected', 'theory_scoped', findall(A, delivers('extend_portability', A), ['value_mobility', 'value_transparency']))
obligation('collected', 'theory_scoped', findall(A, objection('extend_portability', A), [unaddressed('use_control'), unaddressed('collective_exercise'), unaddressed('value_share')]))
obligation('collected', 'theory_scoped', findall(A, delivers('data_dividend', A), ['value_share', 'collective_exercise']))
obligation('collected', 'theory_scoped', findall(A, objection('data_dividend', A), [unaddressed('value_transparency'), unaddressed('use_control'), unaddressed('value_mobility'), 'gives the data subject no claim of their own']))
obligation('collected', 'theory_scoped', findall(A, delivers('data_ownership', A), ['value_share', 'use_control', 'value_mobility', 'individual_enforcement']))
obligation('collected', 'theory_scoped', findall(A, objection('data_ownership', A), ['treats personal data as a commodity', unaddressed('value_transparency'), unaddressed('collective_exercise')]))
obligation('collected', 'theory_scoped', findall(A, delivers('autonomous_right', A), ['value_transparency', 'use_control', 'value_mobility', 'value_recognition', 'collective_exercise', 'individual_enforcement', 'value_share']))
obligation('collected', 'theory_scoped', findall(A, objection('autonomous_right', A), []))
obligation('absent', 'theory_scoped', not(objectionable('autonomous_right')))

// Proof statistics: recorded steps and how they were checked.
steps(68)
verified(45)
recomputed(0)
composed(0)
trusted(23)
claims(13)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (45)**: the 45 steps that cite a clause really are
  instances of it with the values shown; for example, the gap step is rule
  43 with `C` = the value share.
- **C2 well-founded (68)**: none of the 68 steps depends on itself, even
  indirectly.
- **C3 justification (68)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (70)**: the 13 claims and the 57 things the steps use are
  each backed by a step: nothing is taken for granted silently.
- **C5 re-decision (0)**: there is no arithmetic or other built-in
  calculation to recompute.
- **C6 boundary consistency (17)**: the checker tries to refute each
  trusted step with the program's facts and the proof's steps. 17 could be
  confronted: the 5 absences about anchoring (the program has `anchor` facts
  and the proof has `anchored` and `fully_anchored` steps), the 7 lists of
  anchoring provisions and the 5 lists of what each option delivers (the
  program has `anchor` and `delivers` facts). None is contradicted: for
  instance, each list of anchoring provisions contains every `anchor` fact
  the program has for that component. The other 6 are left undecided: the
  absence "the autonomous right is not objectionable" and the 5 lists of
  objections, because no fact or step of `objectionable` or `objection`
  exists, so nothing could refute them. All 23 stay obligations.
- **C7 relevance (81)**: the 13 claims each answer one of the program's
  queries, and all 68 steps serve a claim.
- **C8 witness integrity (0)**: no rule invents a new, unnamed thing, so
  there is no invented name to verify.

The statistics: 68 steps, 45 verified against the program, 23 trusted, none
recomputed or composed; 13 claims.

The 23 `obligation` lines are the trusted steps, in plain words: four
components are *not fully anchored*, the value share is *not anchored at
all*, the autonomous right is *not objectionable*, and 17 lists (the
provisions per component, and what each option delivers and meets as
objections) are *complete*. `'theory_scoped'` means each is meant relative to
this program.

The verdict is **checked with obligations**: every claim follows from the
program, provided those 23 absences and lists hold. As the last comment says,
it also does not establish completeness: it does not say these are all the
conclusions the program has.

`eyemind --unused` lists nothing for this program: every provision,
component and rule makes a difference to some conclusion. Nothing in the
model is decoration.

---

## Try it

```sh
eyemind examples/data-value-right.js            # the analysis and the evaluation
eyemind --proof examples/data-value-right.js    # with the proof
eyemind --unused examples/data-value-right.js   # nothing is decoration
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=data-value-right).

Add a provision that anchors `value_share`, even only in part, to the
`ANCHORS` table and run again: the value share now fits "by interpretation",
interpreting existing law delivers all seven components and meets no
objection, and it is recommended next to the autonomous right.

Change `data_ownership`'s framing from `'property'` to `'inalienable_right'`:
the objection "treats personal data as a commodity" disappears, but data
ownership still leaves transparency and collective exercise unaddressed, so
the autonomous right remains the only recommendation.

Legal analysis and policy evaluation become one chain of reasoning, from
each provision to the recommendation. Change an assumption, a provision or a
criterion, and the whole chain follows, with a proof of every step.

---

## Takeaway

Legal analysis and policy evaluation become one chain of reasoning, from
each provision to the recommendation. Change an assumption, a provision or a
criterion, and the whole chain follows, with a proof of every step.
