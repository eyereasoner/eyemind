# Deep taxonomy (100 levels)

*A hundred-step chain of "every A is a B", with dead ends at every turn.*

[deep-taxonomy-100.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-100.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/deep-taxonomy-100.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-100.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/deep-taxonomy-100.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=deep-taxonomy-100)

---

## The question

A **taxonomy** is a classification: a dog is a mammal, a mammal is an
animal, and so on. Each kind is called a *class*.

Imagine one that is a hundred levels deep. One individual, `ind`, belongs to
the top class `n0`. At every level the path splits three ways: a member of
`n0` is also a member of `n1`, `i1` and `j1`, but only `n1` leads further;
`i1` and `j1` are dead ends.

**Is `ind` also a member of class `n100`, a hundred levels down?**

---

## What we tell eyemind

One fact and 300 rules, three per level, which a loop states:

```js
fact(type('ind', 'n0'))
for (let level = 1; level <= 100; level++) {
  implied_by(type(X, `n${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `i${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `j${level}`), type(X, `n${level - 1}`))
}
query(type(X, 'n100'))
```

An eyemind program is JavaScript, so an ordinary `for` loop can state rules:
it runs with `level` = 1, 2, ..., 100, and `` `n${level}` `` spells the
class name, such as `n1`. The fact is clause 1; level 1 gives clauses 2, 3
and 4, level 2 gives clauses 5, 6 and 7, and so on up to clause 301.

`type(X, C)` says that `X` is a member of class `C`. `X` is a **variable**,
a blank that stands for whatever individual fits. Each
`implied_by(conclusion, condition)` is a **backward rule**: when eyemind
needs the conclusion, it tries to show the condition. So the first rule of
level 1 reads: *anything in `n0` is also in `n1`*.

The last line asks the question: which `X` is in `n100`?

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
type('ind', 'n100')
```

Yes: `ind` is a member of `n100`.

This is a **benchmark**, a standard test, for reasoners, from the
WellnessRules work cited in the file. It checks that a
reasoner can follow a long chain without getting lost in the side branches.
eyemind works backward from the question, one step per level, so the test is
how deep goal-directed search, and its proof, can go.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. The proof has 209
lines; below are its claim, a selection of its clauses (the `// …` line marks
the 89 clauses left out, one per level from n4 to n92), and its complete chain
of 101 steps. See the
[proof file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-100.js)
for every line.

```js
// Answers: each instance of a query() that holds.
type('ind', 'n100')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(type('ind', 'n0')))
clause(2, implied_by(type(X, 'n1'), type(X, 'n0')))
clause(5, implied_by(type(X, 'n2'), type(X, 'n1')))
clause(8, implied_by(type(X, 'n3'), type(X, 'n2')))
// … 89 clauses left out, levels n4 to n92
clause(278, implied_by(type(X, 'n93'), type(X, 'n92')))
clause(281, implied_by(type(X, 'n94'), type(X, 'n93')))
clause(284, implied_by(type(X, 'n95'), type(X, 'n94')))
clause(287, implied_by(type(X, 'n96'), type(X, 'n95')))
clause(290, implied_by(type(X, 'n97'), type(X, 'n96')))
clause(293, implied_by(type(X, 'n98'), type(X, 'n97')))
clause(296, implied_by(type(X, 'n99'), type(X, 'n98')))
clause(299, implied_by(type(X, 'n100'), type(X, 'n99')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(type('ind', 'n100'), clause(299), {X: 'ind'}, [type('ind', 'n99')])
step(type('ind', 'n99'), clause(296), {X: 'ind'}, [type('ind', 'n98')])
step(type('ind', 'n98'), clause(293), {X: 'ind'}, [type('ind', 'n97')])
step(type('ind', 'n97'), clause(290), {X: 'ind'}, [type('ind', 'n96')])
step(type('ind', 'n96'), clause(287), {X: 'ind'}, [type('ind', 'n95')])
step(type('ind', 'n95'), clause(284), {X: 'ind'}, [type('ind', 'n94')])
step(type('ind', 'n94'), clause(281), {X: 'ind'}, [type('ind', 'n93')])
step(type('ind', 'n93'), clause(278), {X: 'ind'}, [type('ind', 'n92')])
step(type('ind', 'n92'), clause(275), {X: 'ind'}, [type('ind', 'n91')])
step(type('ind', 'n91'), clause(272), {X: 'ind'}, [type('ind', 'n90')])
step(type('ind', 'n90'), clause(269), {X: 'ind'}, [type('ind', 'n89')])
step(type('ind', 'n89'), clause(266), {X: 'ind'}, [type('ind', 'n88')])
step(type('ind', 'n88'), clause(263), {X: 'ind'}, [type('ind', 'n87')])
step(type('ind', 'n87'), clause(260), {X: 'ind'}, [type('ind', 'n86')])
step(type('ind', 'n86'), clause(257), {X: 'ind'}, [type('ind', 'n85')])
step(type('ind', 'n85'), clause(254), {X: 'ind'}, [type('ind', 'n84')])
step(type('ind', 'n84'), clause(251), {X: 'ind'}, [type('ind', 'n83')])
step(type('ind', 'n83'), clause(248), {X: 'ind'}, [type('ind', 'n82')])
step(type('ind', 'n82'), clause(245), {X: 'ind'}, [type('ind', 'n81')])
step(type('ind', 'n81'), clause(242), {X: 'ind'}, [type('ind', 'n80')])
step(type('ind', 'n80'), clause(239), {X: 'ind'}, [type('ind', 'n79')])
step(type('ind', 'n79'), clause(236), {X: 'ind'}, [type('ind', 'n78')])
step(type('ind', 'n78'), clause(233), {X: 'ind'}, [type('ind', 'n77')])
step(type('ind', 'n77'), clause(230), {X: 'ind'}, [type('ind', 'n76')])
step(type('ind', 'n76'), clause(227), {X: 'ind'}, [type('ind', 'n75')])
step(type('ind', 'n75'), clause(224), {X: 'ind'}, [type('ind', 'n74')])
step(type('ind', 'n74'), clause(221), {X: 'ind'}, [type('ind', 'n73')])
step(type('ind', 'n73'), clause(218), {X: 'ind'}, [type('ind', 'n72')])
step(type('ind', 'n72'), clause(215), {X: 'ind'}, [type('ind', 'n71')])
step(type('ind', 'n71'), clause(212), {X: 'ind'}, [type('ind', 'n70')])
step(type('ind', 'n70'), clause(209), {X: 'ind'}, [type('ind', 'n69')])
step(type('ind', 'n69'), clause(206), {X: 'ind'}, [type('ind', 'n68')])
step(type('ind', 'n68'), clause(203), {X: 'ind'}, [type('ind', 'n67')])
step(type('ind', 'n67'), clause(200), {X: 'ind'}, [type('ind', 'n66')])
step(type('ind', 'n66'), clause(197), {X: 'ind'}, [type('ind', 'n65')])
step(type('ind', 'n65'), clause(194), {X: 'ind'}, [type('ind', 'n64')])
step(type('ind', 'n64'), clause(191), {X: 'ind'}, [type('ind', 'n63')])
step(type('ind', 'n63'), clause(188), {X: 'ind'}, [type('ind', 'n62')])
step(type('ind', 'n62'), clause(185), {X: 'ind'}, [type('ind', 'n61')])
step(type('ind', 'n61'), clause(182), {X: 'ind'}, [type('ind', 'n60')])
step(type('ind', 'n60'), clause(179), {X: 'ind'}, [type('ind', 'n59')])
step(type('ind', 'n59'), clause(176), {X: 'ind'}, [type('ind', 'n58')])
step(type('ind', 'n58'), clause(173), {X: 'ind'}, [type('ind', 'n57')])
step(type('ind', 'n57'), clause(170), {X: 'ind'}, [type('ind', 'n56')])
step(type('ind', 'n56'), clause(167), {X: 'ind'}, [type('ind', 'n55')])
step(type('ind', 'n55'), clause(164), {X: 'ind'}, [type('ind', 'n54')])
step(type('ind', 'n54'), clause(161), {X: 'ind'}, [type('ind', 'n53')])
step(type('ind', 'n53'), clause(158), {X: 'ind'}, [type('ind', 'n52')])
step(type('ind', 'n52'), clause(155), {X: 'ind'}, [type('ind', 'n51')])
step(type('ind', 'n51'), clause(152), {X: 'ind'}, [type('ind', 'n50')])
step(type('ind', 'n50'), clause(149), {X: 'ind'}, [type('ind', 'n49')])
step(type('ind', 'n49'), clause(146), {X: 'ind'}, [type('ind', 'n48')])
step(type('ind', 'n48'), clause(143), {X: 'ind'}, [type('ind', 'n47')])
step(type('ind', 'n47'), clause(140), {X: 'ind'}, [type('ind', 'n46')])
step(type('ind', 'n46'), clause(137), {X: 'ind'}, [type('ind', 'n45')])
step(type('ind', 'n45'), clause(134), {X: 'ind'}, [type('ind', 'n44')])
step(type('ind', 'n44'), clause(131), {X: 'ind'}, [type('ind', 'n43')])
step(type('ind', 'n43'), clause(128), {X: 'ind'}, [type('ind', 'n42')])
step(type('ind', 'n42'), clause(125), {X: 'ind'}, [type('ind', 'n41')])
step(type('ind', 'n41'), clause(122), {X: 'ind'}, [type('ind', 'n40')])
step(type('ind', 'n40'), clause(119), {X: 'ind'}, [type('ind', 'n39')])
step(type('ind', 'n39'), clause(116), {X: 'ind'}, [type('ind', 'n38')])
step(type('ind', 'n38'), clause(113), {X: 'ind'}, [type('ind', 'n37')])
step(type('ind', 'n37'), clause(110), {X: 'ind'}, [type('ind', 'n36')])
step(type('ind', 'n36'), clause(107), {X: 'ind'}, [type('ind', 'n35')])
step(type('ind', 'n35'), clause(104), {X: 'ind'}, [type('ind', 'n34')])
step(type('ind', 'n34'), clause(101), {X: 'ind'}, [type('ind', 'n33')])
step(type('ind', 'n33'), clause(98), {X: 'ind'}, [type('ind', 'n32')])
step(type('ind', 'n32'), clause(95), {X: 'ind'}, [type('ind', 'n31')])
step(type('ind', 'n31'), clause(92), {X: 'ind'}, [type('ind', 'n30')])
step(type('ind', 'n30'), clause(89), {X: 'ind'}, [type('ind', 'n29')])
step(type('ind', 'n29'), clause(86), {X: 'ind'}, [type('ind', 'n28')])
step(type('ind', 'n28'), clause(83), {X: 'ind'}, [type('ind', 'n27')])
step(type('ind', 'n27'), clause(80), {X: 'ind'}, [type('ind', 'n26')])
step(type('ind', 'n26'), clause(77), {X: 'ind'}, [type('ind', 'n25')])
step(type('ind', 'n25'), clause(74), {X: 'ind'}, [type('ind', 'n24')])
step(type('ind', 'n24'), clause(71), {X: 'ind'}, [type('ind', 'n23')])
step(type('ind', 'n23'), clause(68), {X: 'ind'}, [type('ind', 'n22')])
step(type('ind', 'n22'), clause(65), {X: 'ind'}, [type('ind', 'n21')])
step(type('ind', 'n21'), clause(62), {X: 'ind'}, [type('ind', 'n20')])
step(type('ind', 'n20'), clause(59), {X: 'ind'}, [type('ind', 'n19')])
step(type('ind', 'n19'), clause(56), {X: 'ind'}, [type('ind', 'n18')])
step(type('ind', 'n18'), clause(53), {X: 'ind'}, [type('ind', 'n17')])
step(type('ind', 'n17'), clause(50), {X: 'ind'}, [type('ind', 'n16')])
step(type('ind', 'n16'), clause(47), {X: 'ind'}, [type('ind', 'n15')])
step(type('ind', 'n15'), clause(44), {X: 'ind'}, [type('ind', 'n14')])
step(type('ind', 'n14'), clause(41), {X: 'ind'}, [type('ind', 'n13')])
step(type('ind', 'n13'), clause(38), {X: 'ind'}, [type('ind', 'n12')])
step(type('ind', 'n12'), clause(35), {X: 'ind'}, [type('ind', 'n11')])
step(type('ind', 'n11'), clause(32), {X: 'ind'}, [type('ind', 'n10')])
step(type('ind', 'n10'), clause(29), {X: 'ind'}, [type('ind', 'n9')])
step(type('ind', 'n9'), clause(26), {X: 'ind'}, [type('ind', 'n8')])
step(type('ind', 'n8'), clause(23), {X: 'ind'}, [type('ind', 'n7')])
step(type('ind', 'n7'), clause(20), {X: 'ind'}, [type('ind', 'n6')])
step(type('ind', 'n6'), clause(17), {X: 'ind'}, [type('ind', 'n5')])
step(type('ind', 'n5'), clause(14), {X: 'ind'}, [type('ind', 'n4')])
step(type('ind', 'n4'), clause(11), {X: 'ind'}, [type('ind', 'n3')])
step(type('ind', 'n3'), clause(8), {X: 'ind'}, [type('ind', 'n2')])
step(type('ind', 'n2'), clause(5), {X: 'ind'}, [type('ind', 'n1')])
step(type('ind', 'n1'), clause(2), {X: 'ind'}, [type('ind', 'n0')])
step(type('ind', 'n0'), clause(1), {}, [])
```

It has three parts:

- **The claim**: the one answer the proof is about.
- **The clauses**: the program lines the steps cite, by their number: the
  fact and the 100 "n" rules, every third clause. The 200 dead-end rules for
  `i` and `j` are never cited.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

The chain reads from the answer back to the fact:

1. *`ind` is in `n100`*: by rule 299 with `X` = ind, because `ind` is in
   `n99`.
2. *`ind` is in `n99`*: by rule 296, because `ind` is in `n98`.
3. ... and so on, one level at a time, each step citing the rule of its
   level ...
4. *`ind` is in `n1`*: by rule 2, because `ind` is in `n0`.
5. *`ind` is in `n0`*: fact 1. It uses nothing.

That is 101 steps: one per level, plus the starting fact. None of the dead
ends appear; the proof contains only what the answer needs.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
type('ind', 'n100')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 101)
condition('C2', 'well_founded', 'ok', 101)
condition('C3', 'justification', 'ok', 101)
condition('C4', 'coverage', 'ok', 101)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 102)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(101)
verified(101)
recomputed(0)
composed(0)
trusted(0)
claims(1)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (101)**: each of the 101 steps really is an instance of the
  rule or fact it cites, with `X` = ind.
- **C2 well-founded (101)**: no step depends on itself: the chain bottoms out
  in the fact, with no circular reasoning.
- **C3 justification (101)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (101)**: the 1 claim and the 100 things the steps use (one
  per rule step) are each backed by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (102)**: the 1 claim answers the question, and all 101 steps
  serve it. Nothing is extra.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 101 steps, all 101 verified against the program,
none taken on trust, for 1 claim. The verdict is **checked**: `ind` being in
`n100` follows from the program. As the last comment says, this confirms the
claim; it does not say that `ind` is the only member of `n100`.

---

## One of a family

The same benchmark comes in five sizes:

| Example | Levels | Proof steps |
| --- | --- | --- |
| deep-taxonomy-10 | 10 | 11 |
| deep-taxonomy-100 | 100 | 101 |
| deep-taxonomy-1000 | 1,000 | 1,001 |
| deep-taxonomy-10000 | 10,000 | 10,001 |
| deep-taxonomy-100000 | 100,000 | 100,001 |

The cost grows in a straight line with the depth: each level costs exactly
one step. `--stats` reports 101 inferences for this one.

---

## Try it

```sh
eyemind examples/deep-taxonomy-100.js
eyemind --stats examples/deep-taxonomy-100.js
eyemind --proof examples/deep-taxonomy-100.js
eyemind -c examples/deep-taxonomy-100.js
eyemind --check-proof examples/proof/deep-taxonomy-100.js examples/deep-taxonomy-100.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=deep-taxonomy-100).

Change the last line to `query(type(X, 'n50'))`: the answer becomes
`type('ind', 'n50')`, and `--stats` drops to 51 inferences. Change it to
`query(type(X, Class))` to ask for every class of `ind`: there are 301
answers, `n0` plus the three classes of each of the 100 levels, dead ends
included.

---

## Takeaway

A long chain of simple reasons is still simple to check. However deep the
taxonomy, the proof is exactly as long as the path, and every link in it can
be verified.
