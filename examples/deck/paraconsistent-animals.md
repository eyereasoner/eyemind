# Paraconsistent Animals

*When the facts disagree, say so, instead of pretending they don't.*

[paraconsistent-animals.js](https://github.com/eyereasoner/eyemind/blob/main/examples/paraconsistent-animals.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/paraconsistent-animals.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/paraconsistent-animals.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/paraconsistent-animals.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=paraconsistent-animals)

---

## The question

Birds fly. Penguins don't. Tweety is a bird *and* a penguin. Does Tweety fly?

Real data is often like this: two rules, or a rule and an observation, point
in opposite directions. Ordinary logic breaks down here: from a contradiction
it lets you conclude anything at all.

**Paraconsistent** reasoning keeps working when the data contains
contradictions. It keeps each conflict contained and visible. Our animals are
Tweety (a bird and a penguin), Falco (a bird), Opus (a penguin), Batsy (a
mammal and a bat), Nemo (a fish) and Mythic (a bird that was seen not
flying).

**Which animals can we safely say fly, or have wings, and which conflicts
need a human to look at them?**

---

## What we tell eyemind: animals and rules

```js
fact(bird('tweety'))
fact(penguin('tweety'))
fact(bird('falco'))
fact(penguin('opus'))
fact(mammal('batsy'))
fact(bat('batsy'))
fact(fish('nemo'))
fact(bird('mythic'))
// An explicit observation that contradicts the rule for birds.
fact(observed('mythic', 'flies', 'false'))
implies(bird(X), flies(X, 'true'))
implies(bird(X), wings(X, 'true'))
implies(penguin(X), flies(X, 'false'))
implies(mammal(X), wings(X, 'false'))
implies(bat(X), [flies(X, 'true'), wings(X, 'true')])
// …
```

- `fact(…)` states something plainly true: Tweety is a bird, and so on.
- `implies(condition, conclusion)` is a **forward rule**: whenever the
  condition holds, eyemind adds the conclusion. `X` is a variable, a
  placeholder for whichever animal fits. A list in square brackets means
  "all of these".
- Two more rules say fish swim and have no wings, and that an observation
  counts as a conclusion.

Conclusions are written as `flies(X, 'true')` or `flies(X, 'false')`, so both
can be recorded side by side without the program falling over.

---

## What we tell eyemind: summaries

Each property gets a local summary per animal: *true only*, *false only*, or
*both*.

```js
// Local summaries. These inspect the rule conclusions, so they run only after
// the stratum above has reached its fixpoint.
implies([flies(X, 'true'), flies(X, 'false')], flight_status(X, 'both'))
implies([flies(X, 'true'), not(flies(X, 'false'))], flight_status(X, 'true_only'))
// …
implies(flight_status(X, 'true_only'), flies_safely(X, 'true'))
implies(flight_status(X, 'both'), flies_safely(X, 'undecided'))
```

`not(…)` means "not found": nothing eyemind knows says so. Because the
summaries look at what the animal rules concluded, eyemind runs them only
after those rules have finished. The program is cut into layers, called
*strata*, and each layer waits until the one before it is complete; this is
*stratified negation*. So a "not found" is never premature.

Further rules turn a `'both'` summary into `inconsistent` and `needs_review`
flags. Decisions such as `flies_safely`, `wings_safely`, `moves_by` and
`migrates` read only the summary, so a conflict leads to *undecided*, never
to both answers.

---

## What eyemind concludes

50 conclusions in all. The interesting ones:

```js
// Conclusions: the facts the program derives, in the order derived.
inconsistent('tweety', 'flies')
needs_review('tweety', 'flies')
inconsistent('mythic', 'flies')
inconsistent('batsy', 'wings')
flies_safely('tweety', 'undecided')
flies_safely('falco', 'true')
flies_safely('opus', 'false')
moves_by('opus', 'walking')
```

| Animal | Flies? | Wings? |
|---|---|---|
| Tweety | undecided: needs review | yes |
| Mythic | undecided: needs review | yes |
| Batsy | yes, moves by flying | undecided: needs review |
| Falco | yes, moves by flying | yes |
| Opus | no, walks | no conclusion |
| Nemo | no conclusion | no |

Tweety (bird and penguin) and Mythic (a bird seen not flying) are flagged
for review on flight. Batsy the bat has wings by one rule and none by the
mammal rule. Nothing is concluded about properties with no evidence: no rule
says whether Nemo flies, or whether Opus has wings, so they get no decision
there at all.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. The full proof
is 155 lines with 66 steps, so here is its opening, a selection of its
clauses, and the complete steps behind two decisions: Falco flies safely, and
Tweety's flight is undecided. The
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/paraconsistent-animals.js)
is online.

```js
// Conclusions: the facts the program derives, in the order derived.
flies('tweety', 'true')
flies('falco', 'true')
// … 48 more conclusions

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(bird('tweety')))
clause(2, fact(penguin('tweety')))
clause(3, fact(bird('falco')))
// … clauses 4 to 9: the other facts
clause(10, implies(bird(X), flies(X, 'true')))
// … clause 11
clause(12, implies(penguin(X), flies(X, 'false')))
// … clauses 13 to 16
clause(17, implies([flies(X, 'true'), flies(X, 'false')], flight_status(X, 'both')))
clause(18, implies([flies(X, 'true'), not(flies(X, 'false'))], flight_status(X, 'true_only')))
// … clauses 19 to 24
clause(25, implies(flight_status(X, 'true_only'), flies_safely(X, 'true')))
// … clause 26
clause(27, implies(flight_status(X, 'both'), flies_safely(X, 'undecided')))
// … clauses 28 to 33

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(flies('tweety', 'true'), clause(10), {X: 'tweety'}, [bird('tweety')])
step(bird('tweety'), clause(1), {}, [])
step(flies('falco', 'true'), clause(10), {X: 'falco'}, [bird('falco')])
step(bird('falco'), clause(3), {}, [])
// … 5 steps
step(flies('tweety', 'false'), clause(12), {X: 'tweety'}, [penguin('tweety')])
step(penguin('tweety'), clause(2), {}, [])
// … 12 steps
step(flight_status('tweety', 'both'), clause(17), {X: 'tweety'}, [flies('tweety', 'true'), flies('tweety', 'false')])
// … 8 steps
step(flies_safely('tweety', 'undecided'), clause(27), {X: 'tweety'}, [flight_status('tweety', 'both')])
// … 6 steps
step(flight_status('falco', 'true_only'), clause(18), {X: 'falco'}, [flies('falco', 'true'), not(flies('falco', 'false'))])
step(not(flies('falco', 'false')), 'absent', {}, [])
// … 12 steps
step(flies_safely('falco', 'true'), clause(25), {X: 'falco'}, [flight_status('falco', 'true_only')])
// … 12 more steps, 66 in total
```

It has three parts:

- **The claims**: the 50 conclusions the proof is about.
- **The clauses**: the program's 9 facts and 24 rules, numbered 1 to 33 in
  the order they appear in the program.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.

Falco's decision, read from the bottom up:

1. *Falco is a bird* — fact 3; it uses nothing.
2. *Falco flies* — by rule 10, with `X` being Falco, because Falco is a bird.
3. *Nothing says Falco does not fly* — justified by `'absent'`: eyemind
   searched everything it had concluded and found no `flies('falco',
   'false')`. This step is not derived from a rule; it is taken on trust, and
   the check report lists it as an obligation.
4. *Falco's flight status is "true only"* — by rule 18, because Falco flies
   and nothing says he does not.
5. *Falco flies safely* — by rule 25, because his status is "true only".

Tweety's decision:

1. *Tweety is a bird* — fact 1. *Tweety is a penguin* — fact 2.
2. *Tweety flies* — by rule 10, because she is a bird.
3. *Tweety does not fly* — by rule 12, because she is a penguin.
4. *Tweety's flight status is "both"* — by rule 17, because both were
   concluded.
5. *Tweety's flight is undecided* — by rule 27, because her status is
   "both". No `'absent'` step is needed here: both sides were found.

The other 55 steps follow the same patterns for the other animals and
properties.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Answers checked subject to the obligations below.
flies('tweety', 'true')
flies('falco', 'true')
flies('mythic', 'true')
wings('tweety', 'true')
wings('falco', 'true')
wings('mythic', 'true')
flies('tweety', 'false')
flies('opus', 'false')
wings('batsy', 'false')
flies('batsy', 'true')
wings('batsy', 'true')
swims('nemo', 'true')
wings('nemo', 'false')
flies('mythic', 'false')
flight_status('tweety', 'both')
flight_status('mythic', 'both')
wing_status('batsy', 'both')
inconsistent('tweety', 'flies')
needs_review('tweety', 'flies')
inconsistent('mythic', 'flies')
needs_review('mythic', 'flies')
inconsistent('batsy', 'wings')
needs_review('batsy', 'wings')
flies_safely('tweety', 'undecided')
flies_safely('mythic', 'undecided')
wings_safely('batsy', 'undecided')
moves_by('tweety', 'unknown')
migrates('tweety', 'undecided')
moves_by('mythic', 'unknown')
migrates('mythic', 'undecided')
flight_status('falco', 'true_only')
flight_status('batsy', 'true_only')
flight_status('opus', 'false_only')
wing_status('tweety', 'true_only')
wing_status('falco', 'true_only')
wing_status('mythic', 'true_only')
wing_status('nemo', 'false_only')
flies_safely('falco', 'true')
flies_safely('batsy', 'true')
flies_safely('opus', 'false')
wings_safely('tweety', 'true')
wings_safely('falco', 'true')
wings_safely('mythic', 'true')
wings_safely('nemo', 'false')
moves_by('falco', 'flying')
migrates('falco', 'true')
moves_by('batsy', 'flying')
migrates('batsy', 'true')
moves_by('opus', 'walking')
migrates('opus', 'false')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 59)
condition('C2', 'well_founded', 'ok', 66)
condition('C3', 'justification', 'ok', 66)
condition('C4', 'coverage', 'ok', 110)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 7)
condition('C7', 'relevance', 'ok', 116)
condition('C8', 'witness_integrity', 'ok', 0)

// Obligations: absence and collection completeness are taken on trust.
obligation('absent', 'theory_scoped', not(flies('falco', 'false')))
obligation('absent', 'theory_scoped', not(flies('batsy', 'false')))
obligation('absent', 'theory_scoped', not(flies('opus', 'true')))
obligation('absent', 'theory_scoped', not(wings('tweety', 'false')))
obligation('absent', 'theory_scoped', not(wings('falco', 'false')))
obligation('absent', 'theory_scoped', not(wings('mythic', 'false')))
obligation('absent', 'theory_scoped', not(wings('nemo', 'true')))

// Proof statistics: recorded steps and how they were checked.
steps(66)
verified(59)
recomputed(0)
composed(0)
trusted(7)
claims(50)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked_with_obligations')
```

The report first repeats the 50 conclusions, "checked subject to the
obligations below". Each `condition` line then names a check, says `'ok'`,
and counts what it looked at:

- **C1 resolution (59)**: the 59 steps that cite a rule or fact really are
  instances of it, with `X` being the animal shown.
- **C2 well-founded (66)**: none of the 66 steps depends on itself, even
  indirectly.
- **C3 justification (66)**: every step says how it was justified, in a form
  the checker understands, including the 7 `'absent'` steps.
- **C4 coverage (110)**: the 50 claims and the 60 things the steps use are
  each backed by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (7)**: the 7 "not found" steps were each
  confronted with the proof's own evidence, and none is contradicted: for
  example, no step in the proof concludes `flies('falco', 'false')`.
- **C7 relevance (116)**: the 50 claims are the program's conclusions, and
  all 66 steps serve at least one of them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The seven `obligation` lines are the "not found" facts the decisions lean on,
in plain words: nothing says Falco or Batsy cannot fly, nothing says Opus
can fly, nothing says Tweety, Falco or Mythic lack wings, and nothing says
Nemo has wings. `'theory_scoped'` means each holds only relative to this
program: it is true of what the program states, not necessarily of the real
world.

The statistics repeat this: 66 steps, 59 verified against the program, 7
taken on trust. The verdict is **checked with obligations**: every conclusion
follows from the program, *provided* those seven absences hold. The checker
cannot prove an absence; it only confirms that nothing in the proof
contradicts one. It also does not establish that the program has no other
conclusions.

---

## Try it

```sh
eyemind examples/paraconsistent-animals.js            # the answers
eyemind --proof examples/paraconsistent-animals.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=paraconsistent-animals).
Delete the line `fact(observed('mythic', 'flies', 'false'))` and run again:
the conflict disappears, and you get `flies_safely('mythic', 'true')` and
`moves_by('mythic', 'flying')`. The check report then lists eight
obligations instead of seven: the new one is `not(flies('mythic', 'false'))`,
the absence that Mythic's decision now relies on.

---

## Takeaway

Contradictions in data are not a reason to give up or to guess. Kept local
and labelled, they become a to-do list for a human, while everything that
is clear-cut still gets decided.
