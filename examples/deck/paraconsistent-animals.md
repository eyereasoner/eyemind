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
is 158 lines: the 50 conclusions, 50 steps, 11 listings and 46 call tables.
Here are its opening, the complete steps behind two decisions, Falco flies
safely and Tweety's flight is undecided, and the certificate lines they lean
on. The
[full proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/paraconsistent-animals.js)
is online.

```js
// Conclusions: the facts the program derives, in the order derived.
flies('tweety', 'true')
flies('falco', 'true')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(flies('falco', 'true'), clause(10), {X: 'falco'}, [bird('falco')])
step(flight_status('falco', 'true_only'), clause(18), {X: 'falco'}, [flies('falco', 'true'), not(flies('falco', 'false'))])
step(flies_safely('falco', 'true'), clause(25), {X: 'falco'}, [flight_status('falco', 'true_only')])
step(flies('tweety', 'true'), clause(10), {X: 'tweety'}, [bird('tweety')])
step(flies('tweety', 'false'), clause(12), {X: 'tweety'}, [penguin('tweety')])
step(flight_status('tweety', 'both'), clause(17), {X: 'tweety'}, [flies('tweety', 'true'), flies('tweety', 'false')])
step(flies_safely('tweety', 'undecided'), clause(27), {X: 'tweety'}, [flight_status('tweety', 'both')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(flies(A, B), [flies('tweety', 'true'), flies('falco', 'true'), flies('mythic', 'true'), flies('tweety', 'false'), flies('opus', 'false'), flies('batsy', 'true'), flies('mythic', 'false')])
called(flies('tweety', 'false'), [flies('tweety', 'false')])
called(flies('falco', 'false'), [])
called(flight_status(H, 'both'), [flight_status('tweety', 'both'), flight_status('mythic', 'both')])
called(flies_safely(R, 'true'), [flies_safely('falco', 'true'), flies_safely('batsy', 'true')])
```

It has three parts:

- **The claims**: the 50 conclusions the proof is about.
- **The steps**: one per derived fact. A step reads
  `step(what, by which clause, with which values, using what)`. Clauses are
  numbered 1 to 33 in the order they appear in the program: the 9 facts,
  then the 24 rules. The facts about each animal, such as `bird('falco')`,
  need no steps: the program itself answers them.
- **The certificate**: *listings*, `derived(...)`, of every fact the rules
  derived for each relation, such as `flies`, and *call tables*,
  `called(...)`, of every answer of each call the questions make, including
  the calls the negations make. `called(flies('falco', 'false'), [])` records
  that the call *Falco does not fly* has no answers at all.

Falco's decision:

1. *Falco flies* — by rule 10, with `X` being Falco, because Falco is a bird
   (fact 3).
2. *Falco's flight status is "true only"* — by rule 18, because Falco flies
   and nothing says he does not. That negation has no step of its own: it is
   settled by the empty call table of `flies('falco', 'false')`.
3. *Falco flies safely* — by rule 25, because his status is "true only".

Tweety's decision:

1. *Tweety flies* — by rule 10, because she is a bird (fact 1).
2. *Tweety does not fly* — by rule 12, because she is a penguin (fact 2).
3. *Tweety's flight status is "both"* — by rule 17, because both were
   concluded.
4. *Tweety's flight is undecided* — by rule 27, because her status is
   "both". No negation is involved here: both sides were found.

The other 43 steps follow the same patterns for the other animals and
properties.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the questions.** It expands each query one level against the
  program, answering each inner call from its call table, and checks each
  table it consults the same way. Expanding `flies('falco', 'false')`, for
  instance, finds no listed fact for Falco and no rule that adds one, so
  the empty table is right.
- **It checks the listings are closed.** Running every rule over the
  certificate gives no fact a listing leaves out.
- **It replays each listed fact.** It re-runs each step's rule from no
  bindings and must get exactly the recorded step. A negation is decided
  from the table of its call as it stood when the negation ran.
- **It compares the claims with the answers.** Every claim is an answer, and
  every answer is claimed. Every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
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

verdict('checked')
```

The report repeats the 50 conclusions, now checked answers. The seven
negations the decisions lean on are, in plain words: nothing says Falco or
Batsy cannot fly, nothing says Opus can fly, nothing says Tweety, Falco or
Mythic lack wings, and nothing says Nemo has wings. None is taken on trust:
each is decided from a call table the checker confirms against the program
and the listings. The listings, in turn, are supported by replayed firings,
closed under the rules and consistent with every negation decided from them,
and this program has only one such set of facts. Each negation holds only
relative to this program: it is true of what the program states, not
necessarily of the real world.

The verdict is **checked**: every conclusion follows from the program, and
these are every answer of its questions.

---

## Try it

```sh
eyemind examples/paraconsistent-animals.js            # the answers
eyemind --proof examples/paraconsistent-animals.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=paraconsistent-animals).
Delete the line `fact(observed('mythic', 'flies', 'false'))` and run again:
the conflict disappears, and you get `flies_safely('mythic', 'true')` and
`moves_by('mythic', 'flying')`. The proof then settles eight negations
instead of seven: the new one is `not(flies('mythic', 'false'))`, decided by
an empty call table, which Mythic's decision now relies on.

---

## Takeaway

Contradictions in data are not a reason to give up or to guess. Kept local
and labelled, they become a to-do list for a human, while everything that
is clear-cut still gets decided.
