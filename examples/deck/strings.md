# Strings

*Building and taking apart text, accents and emoji included.*

[strings.js](https://github.com/eyereasoner/eyemind/blob/main/examples/strings.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/strings.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/strings.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/strings.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=strings)

---

## The question

Programs handle text all the time: making a label, counting letters,
looking up the code behind a symbol. Three small jobs:

- **Make a label** by putting `hello_` in front of a name.
- **Split `café` into its letters**, and count them.
- **Find the number** a computer uses for the emoji 😀.

The catch: é and 😀 are not plain English letters.

**Does eyemind handle them correctly, and can the checker confirm it?**

---

## A word on Unicode

Computers store every character as a number. **Unicode** is the worldwide
list that gives each character (Latin, Greek, Chinese, emoji) its own
number, called a *code point*.

Some characters take several bytes to store, which is why naive programs
sometimes count `café` as 5 letters instead of 4. eyemind counts code
points: `é` is one character, and 😀 is one code, not the two 16-bit units
JavaScript itself stores it as.

---

## What we tell eyemind

```js
implied_by(label(Name, Label), atom_concat('hello_', Name, Label))
implied_by(
  characters(Text, Chars, Length),
  [atom_chars(Text, Chars), atom_length(Text, Length)],
)
implied_by(unicode_codes(Text, Codes), atom_codes(Text, Codes))
query(label('alice', Label))
query(characters('café', Chars, Length))
query(unicode_codes('😀', Codes))
```

- `implied_by(conclusion, condition)` is a **backward rule**: *the
  conclusion holds whenever the condition holds*. Rule 1 reads *"the label
  of Name is Label if joining `hello_` and Name gives Label"*.
- Capitalized names (`Name`, `Label`, `Text`, …) are **variables**: they
  stand for whatever value makes the rule fit.
- A list in square brackets is a list of conditions that must all hold, so
  rule 2 needs both `atom_chars` and `atom_length`.
- A piece of text like `'alice'` is called an *atom*. `atom_concat`,
  `atom_chars`, `atom_length` and `atom_codes` are **built-in operations**
  (built-ins): eyemind computes them itself instead of looking them up in
  facts. They join atoms, split them into characters, measure them and give
  their code points. They are used in ordinary rules; there is no special
  syntax for text.
- Each `query` is a question; eyemind answers it by working backward
  through the rules.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
label('alice', 'hello_alice')
characters('café', ['c', 'a', 'f', 'é'], 4)
unicode_codes('😀', [128512])
```

The comment line says what follows: one answer for each query.

- The label is `hello_alice`.
- `café` is four characters, with `é` as one of them.
- 😀 is a single character, code point 128512.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
label('alice', 'hello_alice')
characters('café', ['c', 'a', 'f', 'é'], 4)
unicode_codes('😀', [128512])

// Clauses: the program clauses the steps cite, by clause number.
clause(1, implied_by(label(Name, Label), atom_concat('hello_', Name, Label)))
clause(2, implied_by(characters(Text, Chars, Length), [atom_chars(Text, Chars), atom_length(Text, Length)]))
clause(3, implied_by(unicode_codes(Text, Codes), atom_codes(Text, Codes)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(label('alice', 'hello_alice'), clause(1), {Name: 'alice', Label: 'hello_alice'}, [atom_concat('hello_', 'alice', 'hello_alice')])
step(atom_concat('hello_', 'alice', 'hello_alice'), 'builtin', {}, [])
step(characters('café', ['c', 'a', 'f', 'é'], 4), clause(2), {Text: 'café', Chars: ['c', 'a', 'f', 'é'], Length: 4}, [atom_chars('café', ['c', 'a', 'f', 'é']), atom_length('café', 4)])
step(atom_chars('café', ['c', 'a', 'f', 'é']), 'builtin', {}, [])
step(atom_length('café', 4), 'builtin', {}, [])
step(unicode_codes('😀', [128512]), clause(3), {Text: '😀', Codes: [128512]}, [atom_codes('😀', [128512])])
step(atom_codes('😀', [128512]), 'builtin', {}, [])
```

It has three parts:

- **The claims**: the three answers the proof is about.
- **The clauses**: the three program rules, numbered as in the program.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.

Two kinds of justification occur:

- `clause(N)`: the step is an instance of program rule N, with the
  variables standing for the values shown.
- `'builtin'`: the step is a calculation by a built-in operation. It cites
  no rule and uses nothing; the checker simply does the calculation again.

Read the steps as sentences:

1. *The label of alice is `hello_alice`*: by rule 1, with `Name` being
   alice and `Label` being `hello_alice`, because joining `hello_` and
   `alice` gives `hello_alice`.
2. *Joining `hello_` and `alice` gives `hello_alice`*: a built-in
   calculation.
3. *`café` has the characters c, a, f, é and length 4*: by rule 2, because
   of the next two steps.
4. *`café` splits into c, a, f, é*: a built-in calculation.
5. *`café` has length 4*: a built-in calculation.
6. *The codes of 😀 are [128512]*: by rule 3, because of the next step.
7. *The code point of 😀 is 128512*: a built-in calculation.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
label('alice', 'hello_alice')
characters('café', ['c', 'a', 'f', 'é'], 4)
unicode_codes('😀', [128512])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 3)
condition('C2', 'well_founded', 'ok', 7)
condition('C3', 'justification', 'ok', 7)
condition('C4', 'coverage', 'ok', 7)
condition('C5', 're_decision', 'ok', 4)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 10)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(7)
verified(3)
recomputed(4)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (3)**: the 3 rule steps (1, 3 and 6) really are instances
  of the rules they cite, with the values shown.
- **C2 well-founded (7)**: none of the 7 steps depends on itself, even
  indirectly.
- **C3 justification (7)**: all 7 steps say how they were justified, in a
  form the checker understands.
- **C4 coverage (7)**: the 3 claims and the 4 things the rule steps use are
  each backed by a step: nothing is taken for granted.
- **C5 re-decision (4)**: the 4 built-in text calculations were
  **recomputed** by the checker itself, and they agree. So `café` really is
  4 characters, counted independently.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (10)**: the 3 claims answer the queries, and all 7 steps
  serve them. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 7 steps, 3 verified against the rules, 4
recomputed, none taken on trust. The verdict is **checked**: all three
answers follow from the program. As the last comment says, this confirms the
claims; it does not say the program has no other answers.

---

## Try it

```sh
eyemind examples/strings.js            # the answers
eyemind --proof examples/strings.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=strings).
Add `query(characters('Zoë', Chars, Length))` and run again: you get
`characters('Zoë', ['Z', 'o', 'ë'], 3)`. Add `query(label(Name, 'hello_bob'))`
to run rule 1 backward: `atom_concat` splits the label instead of joining,
and the answer is `label('bob', 'hello_bob')`.

---

## Takeaway

Text is data like any other: it can be built, split and measured with
plain rules — and the checker recounts the letters rather than taking the
program's word for it.
