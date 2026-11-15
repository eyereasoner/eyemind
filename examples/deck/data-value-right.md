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
  [component(C, Meaning), fit(C, How), findall_sorted(P, anchor(P, C, D, W), Provisions)],
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
- `findall_sorted(P, anchor(P, C, D, W), Provisions)` **collects** into the
  list `Provisions` every provision `P` that anchors component `C`, sorted
  in the standard order of terms. Names are compared character by character
  by code point, so `'GDPR art. 21'` comes before `'GDPR art. 7(3)'`.

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
  [
    option(O, F),
    findall_sorted(C, delivers(O, C), Delivered),
    findall_sorted(Why, objection(O, Why), Objections),
  ],
  evaluation(O, Delivered, Objections),
)
```

A component *needs development* unless the law anchors it fully. An option
`O` with framing `F` meets an **objection** for each such component it leaves
undelivered, when its framing treats data as a commodity, or when its framing
gives the data subject no claim of their own. An option with no objection at
all is **recommended**. Each evaluation collects what an option delivers and
the objections it meets, each list sorted.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
analysis('value_transparency', 'knowing that and how one\'s data creates value, including in AI training', 'by interpretation', ['AI Act art. 53(1)(d)', 'GDPR art. 13-15'])
analysis('use_control', 'deciding on the uses through which one\'s data creates value', 'by interpretation', ['GDPR art. 21', 'GDPR art. 7(3)'])
analysis('value_mobility', 'taking one\'s data elsewhere, to have value created there', 'by interpretation', ['DMA art. 6(9)', 'GDPR art. 20'])
analysis('value_recognition', 'the law acknowledging that personal data has economic value', 'in existing law', ['Directive 2019/770 art. 3(1)'])
analysis('collective_exercise', 'exercising the right together, through an intermediary', 'by interpretation', ['DGA ch. III'])
analysis('individual_enforcement', 'enforcing the right oneself, before a court', 'in existing law', ['GDPR art. 79 and 82'])
analysis('value_share', 'receiving a share of the value one\'s data creates', 'needs an autonomous right', [])
evaluation('interpret_existing_law', ['collective_exercise', 'individual_enforcement', 'use_control', 'value_mobility', 'value_recognition', 'value_transparency'], [unaddressed('value_share')])
evaluation('extend_portability', ['value_mobility', 'value_transparency'], [unaddressed('collective_exercise'), unaddressed('use_control'), unaddressed('value_share')])
evaluation('data_dividend', ['collective_exercise', 'value_share'], ['gives the data subject no claim of their own', unaddressed('use_control'), unaddressed('value_mobility'), unaddressed('value_transparency')])
evaluation('data_ownership', ['individual_enforcement', 'use_control', 'value_mobility', 'value_share'], ['treats personal data as a commodity', unaddressed('collective_exercise'), unaddressed('value_transparency')])
evaluation('autonomous_right', ['collective_exercise', 'individual_enforcement', 'use_control', 'value_mobility', 'value_recognition', 'value_share', 'value_transparency'], [])
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
  nothing.
- **A collected list**, such as the provisions anchoring a component, or the
  objections to an option. eyemind gathered it by searching everything.

The checker never searches by itself. Instead the proof ends with a
**certificate**: `derived(Pattern, Facts)` lists every fact the forward
rules derived for one relation, each with a step of its own, and
`called(Call, Answers)` records one call with every answer it gave. The
checker verifies each `called` table by expanding its call one level against
the program, as a search would, answering every inner call from that call's
own table, from the `derived` listings, or from the facts, so no table
vouches for itself. It requires each listing to be closed under the forward
rules, so a fact the rules would derive cannot be left out. An absence is
then an empty table, such as `called(anchored('value_share'), [])`, and a
collected list is the answers of its goal's table, both decided at the
bindings they had when the rule ran.

A `derived` listing proves *which* facts were derived, not in what order. A
plain `findall` list gives its items in the order they were found, so over
derived facts it could not be certified, and `--proof` would report an
error. `findall_sorted` sorts its list, and these items contain no
variables, so the list depends only on which facts there are, and the
certificate settles it. If, say, the program had an `anchor` fact for the
value share, the empty table for its anchoring would disagree with the
expansion, and the check would fail.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. The proof is
154 lines: the 13 claims, 55 steps, 11 listings and 69 call tables, too long
to show whole ([full file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/data-value-right.js)).
Below are its claims, the steps of two chains, the analysis of the value
share and the recommendation of the autonomous right, and a few of the call
tables. Comment lines starting with `// …` mark what is left out:

```js
// Answers: each instance of a query() that holds.
analysis('value_transparency', 'knowing that and how one\'s data creates value, including in AI training', 'by interpretation', ['AI Act art. 53(1)(d)', 'GDPR art. 13-15'])
analysis('use_control', 'deciding on the uses through which one\'s data creates value', 'by interpretation', ['GDPR art. 21', 'GDPR art. 7(3)'])
analysis('value_mobility', 'taking one\'s data elsewhere, to have value created there', 'by interpretation', ['DMA art. 6(9)', 'GDPR art. 20'])
analysis('value_recognition', 'the law acknowledging that personal data has economic value', 'in existing law', ['Directive 2019/770 art. 3(1)'])
analysis('collective_exercise', 'exercising the right together, through an intermediary', 'by interpretation', ['DGA ch. III'])
analysis('individual_enforcement', 'enforcing the right oneself, before a court', 'in existing law', ['GDPR art. 79 and 82'])
analysis('value_share', 'receiving a share of the value one\'s data creates', 'needs an autonomous right', [])
evaluation('interpret_existing_law', ['collective_exercise', 'individual_enforcement', 'use_control', 'value_mobility', 'value_recognition', 'value_transparency'], [unaddressed('value_share')])
evaluation('extend_portability', ['value_mobility', 'value_transparency'], [unaddressed('collective_exercise'), unaddressed('use_control'), unaddressed('value_share')])
evaluation('data_dividend', ['collective_exercise', 'value_share'], ['gives the data subject no claim of their own', unaddressed('use_control'), unaddressed('value_mobility'), unaddressed('value_transparency')])
evaluation('data_ownership', ['individual_enforcement', 'use_control', 'value_mobility', 'value_share'], ['treats personal data as a commodity', unaddressed('collective_exercise'), unaddressed('value_transparency')])
evaluation('autonomous_right', ['collective_exercise', 'individual_enforcement', 'use_control', 'value_mobility', 'value_recognition', 'value_share', 'value_transparency'], [])
recommended('autonomous_right')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
// … 18 steps for the first six analyses
step(analysis('value_share', 'receiving a share of the value one\'s data creates', 'needs an autonomous right', []), clause(47), {C: 'value_share', Meaning: 'receiving a share of the value one\'s data creates', How: 'needs an autonomous right', P: A, D: B, W: C, Provisions: []}, [component('value_share', 'receiving a share of the value one\'s data creates'), fit('value_share', 'needs an autonomous right'), findall_sorted(A, anchor(A, 'value_share', B, C), [])])
step(fit('value_share', 'needs an autonomous right'), clause(46), {C: 'value_share'}, [gap('value_share')])
step(gap('value_share'), clause(43), {C: 'value_share', Description: 'receiving a share of the value one\'s data creates'}, [component('value_share', 'receiving a share of the value one\'s data creates'), not(anchored('value_share'))])
// … 6 steps for the anchored components and the first four evaluations
step(evaluation('autonomous_right', ['collective_exercise', 'individual_enforcement', 'use_control', 'value_mobility', 'value_recognition', 'value_share', 'value_transparency'], []), clause(56), {O: 'autonomous_right', F: 'inalienable_right', C: D, Delivered: ['collective_exercise', 'individual_enforcement', 'use_control', 'value_mobility', 'value_recognition', 'value_share', 'value_transparency'], Why: E, Objections: []}, [option('autonomous_right', 'inalienable_right'), findall_sorted(D, delivers('autonomous_right', D), ['collective_exercise', 'individual_enforcement', 'use_control', 'value_mobility', 'value_recognition', 'value_share', 'value_transparency']), findall_sorted(E, objection('autonomous_right', E), [])])
// … 22 steps for delivers, objection and needs_development facts
step(recommended('autonomous_right'), clause(55), {O: 'autonomous_right', F: 'inalienable_right'}, [option('autonomous_right', 'inalienable_right'), not(objectionable('autonomous_right'))])
// … 4 steps for objectionable facts

// Certificate: the derived facts and every answer of each call the questions make.
// … 11 derived(...) listings, and 7 call tables
called(fit('value_share', E), [fit('value_share', 'needs an autonomous right')])
// … 8 call tables
called(gap(H), [gap('value_share')])
// … 6 call tables
called(anchored('value_share'), [])
// … 9 call tables
called(delivers('autonomous_right', L), [delivers('autonomous_right', 'value_transparency'), delivers('autonomous_right', 'use_control'), delivers('autonomous_right', 'value_mobility'), delivers('autonomous_right', 'value_recognition'), delivers('autonomous_right', 'collective_exercise'), delivers('autonomous_right', 'individual_enforcement'), delivers('autonomous_right', 'value_share')])
called(objection('autonomous_right', M), [])
// … 27 call tables
called(recommended(O), [recommended('autonomous_right')])
// … 4 call tables
called(objectionable('autonomous_right'), [])
// … 1 more call table
```

It has three parts:

- **The claims**: the 13 conclusions the proof is about.
- **The steps**: one per fact the forward rules derived, as the listings
  show it. A step reads `step(what, by which rule, with which values, using
  what)`; `clause(N)` is program clause N, numbered in program order (the
  loops' facts come first, then the rules; the queries count too). The
  provision and component facts get no step: the checker reads them from
  the program.
- **The certificate**: the listings and call tables explained in the
  previous card.

In the values, letters such as `A`, `B`, `C`, `D` and `E` stand for "any
value": `findall_sorted(A, anchor(A, 'value_share', B, C), [])` reads *the
provisions A that anchor the value share, to any degree B, for any reason C:
none*.

Read the two chains as sentences:

1. *The value share needs an autonomous right, with no provisions* — by rule
   47, because it is a component, its fit is "needs an autonomous right", and
   the sorted list of its provisions is empty.
2. *Its fit is "needs an autonomous right"* — by rule 46, because it is a
   gap.
3. *The value share is a gap* — by rule 43, because it is a component and
   `not(anchored('value_share'))` holds.
4. *The autonomous right delivers all seven components and meets no
   objection* — by rule 56, because it is an option framed as an inalienable
   right, the sorted list of what it delivers has all seven components, and
   the sorted list of its objections is empty.
5. *The autonomous right is recommended* — by rule 55, because it is an
   option and `not(objectionable('autonomous_right'))` holds.

The call tables say what the searches found: the only fit of the value share
is "needs an autonomous right"; the only gap is the value share; nothing
anchors the value share (`[]`); the autonomous right delivers seven
components and meets no objection (`[]`); only the autonomous right is
recommended; and it is not objectionable (`[]`).

Many steps answer no question directly. They derive the facts the listings
hold, such as each objection: `objection('extend_portability',
unaddressed('use_control'))` holds because use control needs development
and extending portability does not deliver it. Every listed fact has its
step, so the checker can confirm that each option's lists of deliveries and
objections are complete.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it follows the
certificate. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
analysis('value_transparency', 'knowing that and how one\'s data creates value, including in AI training', 'by interpretation', ['AI Act art. 53(1)(d)', 'GDPR art. 13-15'])
analysis('use_control', 'deciding on the uses through which one\'s data creates value', 'by interpretation', ['GDPR art. 21', 'GDPR art. 7(3)'])
analysis('value_mobility', 'taking one\'s data elsewhere, to have value created there', 'by interpretation', ['DMA art. 6(9)', 'GDPR art. 20'])
analysis('value_recognition', 'the law acknowledging that personal data has economic value', 'in existing law', ['Directive 2019/770 art. 3(1)'])
analysis('collective_exercise', 'exercising the right together, through an intermediary', 'by interpretation', ['DGA ch. III'])
analysis('individual_enforcement', 'enforcing the right oneself, before a court', 'in existing law', ['GDPR art. 79 and 82'])
analysis('value_share', 'receiving a share of the value one\'s data creates', 'needs an autonomous right', [])
evaluation('interpret_existing_law', ['collective_exercise', 'individual_enforcement', 'use_control', 'value_mobility', 'value_recognition', 'value_transparency'], [unaddressed('value_share')])
evaluation('extend_portability', ['value_mobility', 'value_transparency'], [unaddressed('collective_exercise'), unaddressed('use_control'), unaddressed('value_share')])
evaluation('data_dividend', ['collective_exercise', 'value_share'], ['gives the data subject no claim of their own', unaddressed('use_control'), unaddressed('value_mobility'), unaddressed('value_transparency')])
evaluation('data_ownership', ['individual_enforcement', 'use_control', 'value_mobility', 'value_share'], ['treats personal data as a commodity', unaddressed('collective_exercise'), unaddressed('value_transparency')])
evaluation('autonomous_right', ['collective_exercise', 'individual_enforcement', 'use_control', 'value_mobility', 'value_recognition', 'value_share', 'value_transparency'], [])
recommended('autonomous_right')

verdict('checked')
```

The checker answered the three queries from the call tables, expanding each
call one level against the program, and checked every table it consulted the
same way. It required the 11 listings to be closed under the forward rules,
and replayed each listed fact: each step's rule was run again from
no bindings, its negations and sorted lists taken from the tables at the
bindings they had at that point. The 7 lists of anchoring provisions are
read from the `anchor` facts; the lists of what each option delivers and the
objections it meets rest on facts that forward rules derived, and are
settled because they are sorted. A step, table or listing the check did not
use would have failed it.

So these are settled, each relative to this program: four components are
*not fully anchored*, the value share is *not anchored at all*, the
autonomous right is *not objectionable*, each option leaves the listed
components undelivered, the 7 lists of provisions per component are
complete, and for each of the five options, so are the list of what it
delivers and the list of objections it meets.

`eyemind --unused` lists nothing for this program: every provision,
component and rule makes a difference to some conclusion. Nothing in the
model is decoration.

The verdict is **checked**: every claim follows from the program, and the
claims are every answer of the three queries.

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
