# Dog license

*A rule that depends on counting, and an honest note about the count.*

[dog-license.js](https://github.com/eyereasoner/eyemind/blob/main/examples/dog-license.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/dog-license.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/dog-license.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/dog-license.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=dog-license)

---

## The question

Imagine a town rule: anyone who owns more than four dogs needs a dog license.
The threshold is made up for this example, not taken from any real town's
rules.

Alice owns five dogs, Bob owns two. To apply the rule we must *count* each
person's dogs, and counting means being sure we saw every dog.

**Who needs a dog license?**

---

## What we tell eyemind

```js
fact(owns('alice', 'dog1'))
fact(owns('alice', 'dog2'))
fact(owns('alice', 'dog3'))
fact(owns('alice', 'dog4'))
fact(owns('alice', 'dog5'))
fact(owns('bob', 'dog6'))
fact(owns('bob', 'dog7'))
fact(owner('alice'))
fact(owner('bob'))
// The length of a list, counted recursively.
fact(length([], 0))
implied_by(length([_, ...Xs], N), [length(Xs, Before), is(N, add(Before, 1))])
implies(
  [owner(Owner), findall(Dog, owns(Owner, Dog), Dogs), length(Dogs, N)],
  dog_count(Owner, N),
)
implies([dog_count(Owner, N), gt(N, 4)], requires(Owner, 'dog_license'))
```

- The `fact` lines say who owns which dog, and who the owners are.
  Capitalized names such as `Owner`, `Dog` and `N` are variables:
  placeholders for any value.
- `length` counts a list. The empty list `[]` has length 0. The
  `implied_by(conclusion, premise)` line is a backward rule, used on demand: a
  list made of a first item (`_`, "any item, we don't care which") followed by
  the rest `Xs` is one longer than the rest. `is(N, add(Before, 1))` is a
  **built-in calculation**: eyemind adds 1.
- `implies(premise, conclusion)` is a forward rule: whenever the premise
  holds, conclude the conclusion; a premise in square brackets needs all its
  parts. The first one uses `findall(Dog, owns(Owner, Dog), Dogs)`: it
  **collects** every dog of that owner into one list, `Dogs`, whose length is
  the count.
- The last rule applies the threshold: `gt(N, 4)` is another built-in test,
  "N is greater than 4".

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
dog_count('alice', 5)
dog_count('bob', 2)
requires('alice', 'dog_license')
```

The program has no query, so eyemind lists every fact it derived. Alice has
5 dogs and needs a license. Bob has 2 and does not: since 2 is not more than
4, no license conclusion is drawn for him.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
dog_count('alice', 5)
dog_count('bob', 2)
requires('alice', 'dog_license')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(dog_count('alice', 5), clause(12), {Owner: 'alice', Dog: A, Dogs: ['dog1', 'dog2', 'dog3', 'dog4', 'dog5'], N: 5}, [owner('alice'), findall(A, owns('alice', A), ['dog1', 'dog2', 'dog3', 'dog4', 'dog5']), length(['dog1', 'dog2', 'dog3', 'dog4', 'dog5'], 5)])
step(dog_count('bob', 2), clause(12), {Owner: 'bob', Dog: A, Dogs: ['dog6', 'dog7'], N: 2}, [owner('bob'), findall(A, owns('bob', A), ['dog6', 'dog7']), length(['dog6', 'dog7'], 2)])
step(requires('alice', 'dog_license'), clause(13), {Owner: 'alice', N: 5}, [dog_count('alice', 5), gt(5, 4)])

// Certificate: the derived facts and every answer of each call the questions make.
derived(dog_count(B, C), [dog_count('alice', 5), dog_count('bob', 2)])
derived(requires(B, C), [requires('alice', 'dog_license')])
called(dog_count(A, B), [dog_count('alice', 5), dog_count('bob', 2)])
called(length(['dog1', 'dog2', 'dog3', 'dog4', 'dog5'], C), [length(['dog1', 'dog2', 'dog3', 'dog4', 'dog5'], 5)])
called(length(['dog2', 'dog3', 'dog4', 'dog5'], D), [length(['dog2', 'dog3', 'dog4', 'dog5'], 4)])
called(length(['dog3', 'dog4', 'dog5'], E), [length(['dog3', 'dog4', 'dog5'], 3)])
called(length(['dog4', 'dog5'], F), [length(['dog4', 'dog5'], 2)])
called(length(['dog5'], G), [length(['dog5'], 1)])
called(length([], H), [length([], 0)])
called(length(['dog6', 'dog7'], C), [length(['dog6', 'dog7'], 2)])
called(length(['dog7'], I), [length(['dog7'], 1)])
called(requires(J, 'dog_license'), [requires('alice', 'dog_license')])
```

It has three parts:

- **The claims**: the three conclusions the proof is about.
- **The steps**: one per derived fact, recording the firing behind it. A
  step reads `step(what, by which rule, with which values, using what)`.
  Rules are cited by their place in the program: the seven `owns` facts are
  lines 1 to 7, the owners 8 and 9, the `length` lines 10 and 11, and the two
  forward rules 12 and 13. The values in curly braces say what each variable
  of the rule stood for. The `A` in the collections is not a value: it is the
  open placeholder, "any dog".
- **The certificate**: the **listings** `derived(Pattern, Facts)` hold every
  `dog_count` and `requires` fact the forward rules derived, and the **call
  tables** `called(Call, Answers)` every answer of each call made while
  answering the questions: the counts, the license question and each
  `length` call, one dog shorter each time.

Read the steps as sentences:

- **Step 1.** *Alice has 5 dogs* — by rule 12, because Alice is an owner,
  her collected dogs are `dog1` to `dog5`, and that list has length 5.
- **Step 2.** *Bob has 2 dogs* — by rule 12, in the same way.
- **Step 3.** *Alice requires a dog license* — by rule 13, because she has
  5 dogs and 5 is greater than 4.

The owners, the collections, the lengths and the comparison have no steps of
their own. Owners are stated facts. Each `length` call is answered by its
table, and the additions of 1 in between are computed by the checker. The
collection is the interesting part: "Alice's dogs are exactly `dog1` to
`dog5`" includes "there are no other dogs", which no list of steps could
show. Here none is needed: `owns` is defined only by facts, so the checker
scans those facts itself and finds exactly the dogs in the list, in the same
order.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers each question
from its call table and checks each table by applying the program one level,
computing the additions itself. It requires each listing to be closed under
the forward rules: every count and license the rules give must be listed.
And it replays each listed fact's step from its rule, re-running the
`findall` over the `owns` facts and the test 5 > 4. A step, table or listing
the check does not use fails it. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
dog_count('alice', 5)
dog_count('bob', 2)
requires('alice', 'dog_license')

verdict('checked')
```

Neither collection is taken on trust: the checker reads the facts and
confirms that Alice's dogs are exactly `dog1` to `dog5`, and Bob's exactly
`dog6` and `dog7`. "Complete" means complete with respect to this program:
add a dog and the list changes. The verdict is **checked**: the conclusions
follow from the program, and they are every answer of the original
questions.

---

## Try it

```sh
eyemind examples/dog-license.js
eyemind --check-proof examples/proof/dog-license.js examples/dog-license.js
```

The second command checks the saved proof and prints the report above,
ending with `verdict('checked')`.

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=dog-license).
Add `fact(owns('bob', 'dog8'))`, `fact(owns('bob', 'dog9'))` and
`fact(owns('bob', 'dog10'))`, and run again: Bob's count becomes 5 and he
needs a license too. Or lower the threshold by changing `gt(N, 4)` to
`gt(N, 1)`: Bob's two dogs are then enough.

---

## Takeaway

Counting is a claim about *everything* you know. eyemind does the count, shows
it, and tells you plainly which part rests on "that was the full list".
