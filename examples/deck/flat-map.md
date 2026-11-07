# Flat Map

*Gather every matching value from a list of things, and be honest about what "every" means.*

[flat-map.js](https://github.com/eyereasoner/eyemind/blob/main/examples/flat-map.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/flat-map.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/flat-map.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/flat-map.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=flat-map)

---

## The question

Imagine a small table of facts, each saying *subject, property, value*: a book
has an author, a person has a phone number. Some subjects have one value for a
property, some have several, some have none.

We want to take a list of subjects and collect all their values for one
property into a single flat list, in order. Programmers call this a *flat
map*. What happens with a subject that has two values? One that has none? A
property nobody uses?

**For a list of subjects, what are all their values for one property?**

---

## What we tell eyemind

```js
fact(t('s1', 'p1', 'o1'))
fact(t('s2', 'p1', 'o2'))
fact(t('s3', 'p1', 'o3'))
fact(t('s3', 'p1', 'o4'))
// append(Xs, Ys, Zs): Zs is Xs followed by Ys.
fact(append([], Ys, Ys))
implied_by(append([X, ...Xs], Ys, [X, ...Zs]), append(Xs, Ys, Zs))
// flat_map(Subjects, Predicate, Objects)
fact(flat_map([], _, []))
implied_by(
  flat_map([S, ...Subjects], P, Objects),
  [findall(O, t(S, P, O), Here), flat_map(Subjects, P, Rest), append(Here, Rest, Objects)],
)
query(flat_map(['s1', 's2', 's3'], 'p1', Objects))
query(flat_map(['missing'], 'p1', Objects))
query(flat_map(['s1'], 'p2', Objects))
```

- The four `t(Subject, Property, Value)` facts are the table; `s3` has two
  values for `p1`. Capitalized names such as `S`, `P` and `Objects` are
  variables, placeholders for any value; `_` means "anything, we don't care
  what".
- `append` joins two lists end to end. Joining the empty list `[]` to a list
  gives that list. The `implied_by(conclusion, premise)` line is a backward
  rule, used on demand: to put a list starting with `X` in front of `Ys`, keep
  `X` first and join the rest. `[X, ...Xs]` means "a list whose first item is
  `X` and whose remaining items are `Xs`".
- `flat_map` walks the list of subjects. For no subjects the result is `[]`.
  Otherwise, for the first subject `S`, `findall(O, t(S, P, O), Here)`
  **collects** every value `O` it has for property `P` into a list `Here`
  (possibly empty); the rest of the subjects give `Rest`; and `Here` followed
  by `Rest` is the answer.
- The three `query` lines ask the three questions.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
flat_map(['s1', 's2', 's3'], 'p1', ['o1', 'o2', 'o3', 'o4'])
flat_map(['missing'], 'p1', [])
flat_map(['s1'], 'p2', [])
```

- `s3` contributes two values, `o3` and `o4`, in order.
- A subject with no facts gives an empty list `[]`, not a failure.
- A property nobody uses gives `[]` too.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
flat_map(['s1', 's2', 's3'], 'p1', ['o1', 'o2', 'o3', 'o4'])
flat_map(['missing'], 'p1', [])
flat_map(['s1'], 'p2', [])

// Clauses: the program clauses the steps cite, by clause number.
clause(5, fact(append([], Ys, Ys)))
clause(6, implied_by(append([X, ...Xs], Ys, [X, ...Zs]), append(Xs, Ys, Zs)))
clause(7, fact(flat_map([], _0, [])))
clause(8, implied_by(flat_map([S, ...Subjects], P, Objects), [findall(O, t(S, P, O), Here), flat_map(Subjects, P, Rest), append(Here, Rest, Objects)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(flat_map(['s1', 's2', 's3'], 'p1', ['o1', 'o2', 'o3', 'o4']), clause(8), {S: 's1', Subjects: ['s2', 's3'], P: 'p1', Objects: ['o1', 'o2', 'o3', 'o4'], O: A, Here: ['o1'], Rest: ['o2', 'o3', 'o4']}, [findall(A, t('s1', 'p1', A), ['o1']), flat_map(['s2', 's3'], 'p1', ['o2', 'o3', 'o4']), append(['o1'], ['o2', 'o3', 'o4'], ['o1', 'o2', 'o3', 'o4'])])
step(findall(A, t('s1', 'p1', A), ['o1']), 'collected', {}, [])
step(flat_map(['s2', 's3'], 'p1', ['o2', 'o3', 'o4']), clause(8), {S: 's2', Subjects: ['s3'], P: 'p1', Objects: ['o2', 'o3', 'o4'], O: B, Here: ['o2'], Rest: ['o3', 'o4']}, [findall(B, t('s2', 'p1', B), ['o2']), flat_map(['s3'], 'p1', ['o3', 'o4']), append(['o2'], ['o3', 'o4'], ['o2', 'o3', 'o4'])])
step(findall(B, t('s2', 'p1', B), ['o2']), 'collected', {}, [])
step(flat_map(['s3'], 'p1', ['o3', 'o4']), clause(8), {S: 's3', Subjects: [], P: 'p1', Objects: ['o3', 'o4'], O: C, Here: ['o3', 'o4'], Rest: []}, [findall(C, t('s3', 'p1', C), ['o3', 'o4']), flat_map([], 'p1', []), append(['o3', 'o4'], [], ['o3', 'o4'])])
step(findall(C, t('s3', 'p1', C), ['o3', 'o4']), 'collected', {}, [])
step(flat_map([], 'p1', []), clause(7), {_0: 'p1'}, [])
step(append(['o3', 'o4'], [], ['o3', 'o4']), clause(6), {X: 'o3', Xs: ['o4'], Ys: [], Zs: ['o4']}, [append(['o4'], [], ['o4'])])
step(append(['o4'], [], ['o4']), clause(6), {X: 'o4', Xs: [], Ys: [], Zs: []}, [append([], [], [])])
step(append([], [], []), clause(5), {Ys: []}, [])
step(append(['o2'], ['o3', 'o4'], ['o2', 'o3', 'o4']), clause(6), {X: 'o2', Xs: [], Ys: ['o3', 'o4'], Zs: ['o3', 'o4']}, [append([], ['o3', 'o4'], ['o3', 'o4'])])
step(append([], ['o3', 'o4'], ['o3', 'o4']), clause(5), {Ys: ['o3', 'o4']}, [])
step(append(['o1'], ['o2', 'o3', 'o4'], ['o1', 'o2', 'o3', 'o4']), clause(6), {X: 'o1', Xs: [], Ys: ['o2', 'o3', 'o4'], Zs: ['o2', 'o3', 'o4']}, [append([], ['o2', 'o3', 'o4'], ['o2', 'o3', 'o4'])])
step(append([], ['o2', 'o3', 'o4'], ['o2', 'o3', 'o4']), clause(5), {Ys: ['o2', 'o3', 'o4']}, [])
step(flat_map(['missing'], 'p1', []), clause(8), {S: 'missing', Subjects: [], P: 'p1', Objects: [], O: D, Here: [], Rest: []}, [findall(D, t('missing', 'p1', D), []), flat_map([], 'p1', []), append([], [], [])])
step(findall(D, t('missing', 'p1', D), []), 'collected', {}, [])
step(flat_map(['s1'], 'p2', []), clause(8), {S: 's1', Subjects: [], P: 'p2', Objects: [], O: E, Here: [], Rest: []}, [findall(E, t('s1', 'p2', E), []), flat_map([], 'p2', []), append([], [], [])])
step(findall(E, t('s1', 'p2', E), []), 'collected', {}, [])
step(flat_map([], 'p2', []), clause(7), {_0: 'p2'}, [])
```

It has three parts:

- **The claims**: the three answers the proof is about.
- **The clauses**: the program lines the steps cite, numbered by their place
  in the program (the four `t` facts are lines 1 to 4; no step cites them,
  see below). The `_` of the program is shown as `_0`, so that it can be
  given a value like any other variable.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable of the cited line stood for. The capital
  letters `A` to `E` in the collection steps are not values: each is the open
  placeholder of one collection, "any value".

Read the steps as sentences:

1. *The flat map of `s1`, `s2`, `s3` is `['o1', 'o2', 'o3', 'o4']`* — by
   rule 8: the values of `s1` are `['o1']`, the flat map of the rest is
   `['o2', 'o3', 'o4']`, and joining them gives the answer.
2. *All `p1` values of `s1` are `['o1']`* — **collected**: everything eyemind
   found. The checker confirms it is complete (see below).
3. *The flat map of `s2`, `s3` is `['o2', 'o3', 'o4']`* — by rule 8, in the
   same way.
4. *All `p1` values of `s2` are `['o2']`* — collected.
5. *The flat map of `s3` alone is `['o3', 'o4']`* — by rule 8, with nothing
   left after `s3`.
6. *All `p1` values of `s3` are `['o3', 'o4']`* — collected.
7. *The flat map of no subjects is `[]`* — fact 7.
8. *`['o3', 'o4']` followed by `[]` is `['o3', 'o4']`* — by rule 6, keeping
   `o3` in front.
9. *`['o4']` followed by `[]` is `['o4']`* — by rule 6.
10. *`[]` followed by `[]` is `[]`* — fact 5.
11. *`['o2']` followed by `['o3', 'o4']` is `['o2', 'o3', 'o4']`* — by rule 6.
12. *`[]` followed by `['o3', 'o4']` is `['o3', 'o4']`* — fact 5.
13. *`['o1']` followed by `['o2', 'o3', 'o4']` is the whole list* — by rule 6.
14. *`[]` followed by `['o2', 'o3', 'o4']` is that list* — fact 5.
15. *The flat map of `missing` is `[]`* — by rule 8: it has no values, nothing
    follows it, and `[]` followed by `[]` is `[]` (steps 7 and 10, reused).
16. *All `p1` values of `missing` are `[]`* — collected: none were found.
17. *The flat map of `s1` for `p2` is `[]`* — by rule 8, the same way.
18. *All `p2` values of `s1` are `[]`* — collected.
19. *The flat map of no subjects for `p2` is `[]`* — fact 7.

Why do no steps cite the `t` facts? A `'collected'` step stands for the whole
search behind a `findall`. The part that matters, "there are no other
values", can only come from having searched everything. A proof cannot point
at a missing value, but here the checker does not need one: `t` is defined
only by facts, so the checker scans those facts itself and finds exactly the
values in each list, in the same order.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
flat_map(['s1', 's2', 's3'], 'p1', ['o1', 'o2', 'o3', 'o4'])
flat_map(['missing'], 'p1', [])
flat_map(['s1'], 'p2', [])

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 14)
condition('C2', 'well_founded', 'ok', 19)
condition('C3', 'justification', 'ok', 19)
condition('C4', 'coverage', 'ok', 22)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 22)
condition('C8', 'witness_integrity', 'ok', 0)
condition('C9', 'search_closure', 'ok', 5)

// Proof statistics: recorded steps and how they were checked.
steps(19)
verified(14)
recomputed(0)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (14)**: the 14 steps that cite a program line really are
  instances of that line with the values shown.
- **C2 well-founded (19)**: none of the 19 steps depends on itself, even
  indirectly.
- **C3 justification (19)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (22)**: the 3 claims and the 19 things the steps use are each
  backed by a step.
- **C5 re-decision (0)**: there was no calculation to redo.
- **C6 boundary consistency (0)**: no boundary was left to the evidence:
  C9 settled all 5 collections.
- **C7 relevance (22)**: the 3 claims answer the queries, and all 19 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.
- **C9 search closure (5)**: all 5 collected lists were settled by scanning
  the `t` facts, which give exactly these lists, so no value is missing from
  any of them.

The statistics: 19 steps, 14 verified against the program and the 5
collections settled from the facts, none trusted, 3 claims.

None of the five collections is taken on trust: for example that `s3` has
exactly `['o3', 'o4']` and that `missing` has nothing at all. Because only
facts define `t`, the proof needs no search certificate; the checker reads
the facts. "Complete" means complete with respect to this program: if
someone adds a fact, these lists could change. The verdict is **checked**:
the three answers follow from the program. The verdict does not say the
program has no other conclusions. A stricter check, `--strict-proof`,
rejects any proof that leans on trust; this one passes it.

---

## Try it

```sh
eyemind examples/flat-map.js
eyemind --goal "flat_map(['s3', 's1'], 'p1', Objects)" examples/flat-map.js
```

The second gives `['o3', 'o4', 'o1']`: the order follows the subject list.
Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=flat-map).

Add the fact `fact(t('s2', 'p1', 'o5'))` and run again: the first answer
becomes `['o1', 'o2', 'o5', 'o3', 'o4']`.

---

## Takeaway

"Here are all the matches" is a stronger statement than "here are some
matches". eyemind gives you the answer, the proof marks precisely where it relied on
having seen everything, and the checker confirms that nothing was missed.
