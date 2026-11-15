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

// Certificate: the derived facts and every answer of each call the questions make.
called(flat_map(['s1', 's2', 's3'], 'p1', A), [flat_map(['s1', 's2', 's3'], 'p1', ['o1', 'o2', 'o3', 'o4'])])
called(flat_map(['s2', 's3'], 'p1', B), [flat_map(['s2', 's3'], 'p1', ['o2', 'o3', 'o4'])])
called(flat_map(['s3'], 'p1', C), [flat_map(['s3'], 'p1', ['o3', 'o4'])])
called(flat_map([], 'p1', D), [flat_map([], 'p1', [])])
called(append(['o3', 'o4'], [], E), [append(['o3', 'o4'], [], ['o3', 'o4'])])
called(append(['o4'], [], F), [append(['o4'], [], ['o4'])])
called(append([], [], G), [append([], [], [])])
called(append(['o2'], ['o3', 'o4'], H), [append(['o2'], ['o3', 'o4'], ['o2', 'o3', 'o4'])])
called(append([], ['o3', 'o4'], I), [append([], ['o3', 'o4'], ['o3', 'o4'])])
called(append(['o1'], ['o2', 'o3', 'o4'], J), [append(['o1'], ['o2', 'o3', 'o4'], ['o1', 'o2', 'o3', 'o4'])])
called(append([], ['o2', 'o3', 'o4'], K), [append([], ['o2', 'o3', 'o4'], ['o2', 'o3', 'o4'])])
called(flat_map(['missing'], 'p1', L), [flat_map(['missing'], 'p1', [])])
called(flat_map(['s1'], 'p2', M), [flat_map(['s1'], 'p2', [])])
called(flat_map([], 'p2', N), [flat_map([], 'p2', [])])
```

It has two parts:

- **The claims**: the three answers the proof is about.
- **The certificate**: here only **call tables**. `called(Call, Answers)`
  says: *this call, made while answering the questions, has exactly these
  answers*. The capital letters in a call (`A`, `B`, …) are the unknowns
  still open when it was made.

Both rules are backward rules, worked out only when asked, so the proof has
no `step(...)` records: those describe facts derived by forward rules. Read
the tables as sentences:

1. *The flat map of `s1`, `s2`, `s3` for `p1` is exactly
   `['o1', 'o2', 'o3', 'o4']`* — rule 8 collects the values of `s1`, asks
   for the flat map of the rest, and joins them.
2. *The flat map of `s2`, `s3` is exactly `['o2', 'o3', 'o4']`.*
3. *The flat map of `s3` alone is exactly `['o3', 'o4']`.*
4. *The flat map of no subjects is exactly `[]`* — fact 7.
5. –7. *`['o3', 'o4']` followed by `[]` is `['o3', 'o4']`*, by rule 6 keeping
   `o3` and then `o4` in front, down to *`[]` followed by `[]` is `[]`*,
   fact 5.
8. –9. *`['o2']` followed by `['o3', 'o4']` is `['o2', 'o3', 'o4']`.*
10. –11. *`['o1']` followed by `['o2', 'o3', 'o4']` is the whole list.*
12. *The flat map of `missing` is exactly `[]`*: it has no values, nothing
    follows it, and `[]` followed by `[]` is `[]` (line 7, reused).
13. *The flat map of `s1` for `p2` is exactly `[]`*, the same way.
14. *The flat map of no subjects for `p2` is exactly `[]`* — fact 7.

There is no table for the `findall` collections, nor for `t`. `t` is defined
only by facts, so the checker scans those facts itself and finds exactly the
values of each list, in the same order: that `s3` has exactly
`['o3', 'o4']`, and that `missing` has nothing at all.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers each question
by applying the program's rules one level at a time: each `findall` is run
over the `t` facts, and every `flat_map` or `append` call inside is answered
from its table. Each table it consults is checked the same way, so a wrong
table shows up as a disagreement, and a table the check does not use fails
it. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
flat_map(['s1', 's2', 's3'], 'p1', ['o1', 'o2', 'o3', 'o4'])
flat_map(['missing'], 'p1', [])
flat_map(['s1'], 'p2', [])

verdict('checked')
```

The verdict is **checked**: the three answers follow from the program, and
they are every answer of the original questions. "Complete" means complete
with respect to this program: if someone adds a fact, these lists could
change.

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
matches". eyemind gives you the answer, and the checker, scanning the same
facts itself, confirms that nothing was missed.
