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

// Certificate: the derived facts and every answer of each call the questions make.
called(label('alice', A), [label('alice', 'hello_alice')])
called(characters('café', B, C), [characters('café', ['c', 'a', 'f', 'é'], 4)])
called(unicode_codes('😀', D), [unicode_codes('😀', [128512])])
```

It has two parts:

- **The claims**: the three answers the proof is about.
- **The certificate**: one **call table** per query. A table reads
  `called(question, every answer)`; its variables are renamed `A`, `B`, …
  in order. `called(characters('café', B, C), [...])` says: asked for the
  characters and length of `café`, there is exactly one answer.

There are no `step(...)` lines. Steps record how forward rules derived
facts; this program has only backward rules and built-ins, so each table can
be confirmed directly from the program:

1. *The label of alice has one answer, `hello_alice`*: by rule 1, because
   joining `hello_` and `alice` gives `hello_alice`.
2. *`café` has one answer: the characters c, a, f, é and length 4*: by rule
   2, splitting the text and measuring it.
3. *The codes of 😀 have one answer, [128512]*: by rule 3, from its code
   point.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the rules from
the program and confirms each call table by expanding its call one level.

For `characters('café', Chars, Length)` it runs rule 2's body itself:
`atom_chars` and `atom_length` are **computed** by the checker, not taken
from the proof, and they give exactly the one answer the table lists. So
`café` really is 4 characters, counted independently. The other two tables
are confirmed the same way. Then the claims are compared with the answers:
each claim is an answer, no answer is left out, and every table was used.
This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
label('alice', 'hello_alice')
characters('café', ['c', 'a', 'f', 'é'], 4)
unicode_codes('😀', [128512])

verdict('checked')
```

The verdict is **checked**: all three answers follow from the program, and
they are every answer of its queries.

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
