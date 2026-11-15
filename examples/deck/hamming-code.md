# Recover four data bits after one bit flips

*Parity checks locate an error in a seven-bit word.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/hamming-code.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/hamming-code.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/hamming-code.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/hamming-code.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=hamming-code)

---

## The question

Bits sent over a wire or stored on a disk sometimes flip: a 0 arrives as a
1, or the other way round. A **Hamming(7,4) code** protects four data bits
by sending seven. Data sits at positions 3, 5, 6 and 7. Positions 1, 2 and
4 hold **parity bits**: extra bits chosen so that certain groups of bits add
up to an even number. If one bit flips, some groups become odd, and *which*
groups are odd tells exactly which bit flipped.

Three packets arrive. The first, `[1, 0, 1, 1, 1, 1, 0]`, is damaged.

**Can we find the single flipped bit in each packet and recover the
original four data bits?**

---

## What we tell eyemind

Each check adds the bits at its positions and takes the remainder after
dividing by 2 (*modulo 2*): 0 if the sum is even, 1 if it is odd.

- S1 checks positions 1, 3, 5 and 7;
- S2 checks positions 2, 3, 6 and 7;
- S4 checks positions 4, 5, 6 and 7.

The **syndrome** is **S1 + 2S2 + 4S4**, a number from 0 to 7. Zero means no
error was found; any other value is the position of the flipped bit, which
the correction rule flips back. The program:

```js
fact(received('damaged', [1, 0, 1, 1, 1, 1, 0]))
fact(received('intact', [1, 0, 1, 1, 0, 1, 0]))
fact(received('last_bit', [0, 0, 0, 0, 0, 0, 1]))
// bits(Word): every item of Word is 0 or 1.
fact(bit(0), bit(1))
fact(bits([]))
implied_by(bits([B, ...Rest]), [bit(B), bits(Rest)])
// correct(Word, Position, Syndrome, Fixed): flip the bit whose position
// equals the syndrome and copy every other bit.
fact(correct([], _, _, []))
implied_by(correct([Bit, ...Rest], Position, Syndrome, [Fixed, ...Tail]), [
  correct_bit(Position, Syndrome, Bit, Fixed), is(Next, add(Position, 1)), correct(Rest, Next, Syndrome, Tail),
])
implied_by(correct_bit(Position, Syndrome, Bit, Fixed), [eq(Position, Syndrome), is(Fixed, sub(1, Bit))])
implied_by(correct_bit(Position, Syndrome, Bit, Bit), ne(Position, Syndrome))
// Parity bits sit at positions 1, 2 and 4; data bits at 3, 5, 6 and 7.
implied_by(decode([B1, B2, B3, B4, B5, B6, B7], Syndrome, Corrected, [D1, D2, D3, D4]), [
  bits([B1, B2, B3, B4, B5, B6, B7]),
  is(S1, mod(add(add(B1, B3), add(B5, B7)), 2)), is(S2, mod(add(add(B2, B3), add(B6, B7)), 2)),
  is(S4, mod(add(add(B4, B5), add(B6, B7)), 2)), is(Syndrome, add(S1, add(mul(2, S2), mul(4, S4)))),
  correct([B1, B2, B3, B4, B5, B6, B7], 1, Syndrome, Corrected),
  unify(Corrected, [_, _, D1, _, D2, D3, D4]),
])
implies([received(Name, Word), decode(Word, Syndrome, Corrected, Payload)], decoded(Name, Syndrome, Corrected, Payload))
query(decoded(Name, Syndrome, Corrected, Payload))
```

- `fact(...)` states something true outright; each item is a numbered
  **clause**: the three packets are clauses 1 to 3, `bit(0)` and `bit(1)`
  clauses 4 and 5, `bits([])` clause 6.
- `implied_by(conclusion, conditions)` is a **backward rule**: the
  conclusion holds whenever all the conditions hold. `implies(premise,
  conclusion)` (clause 13) is a **forward rule**: whenever the premise
  holds, eyemind adds the conclusion.
- Capitalized names are **variables**: they stand for whatever value makes
  the clause fit. `_` is a variable we do not care about.
- `[B, ...Rest]` splits a list into its first item and the rest. `bits`
  (clauses 6 and 7) checks that every item is 0 or 1, one item at a time.
  `correct` (clauses 8 and 9) walks the word position by position, and
  `correct_bit` flips the bit whose position equals the syndrome (clause 10)
  and copies every other bit (clause 11). A rule that calls itself on the
  rest of a list like this is called *recursion*.
- `is(X, add(...))`, `mod`, `mul`, `sub`, `eq` (equal) and `ne` (not equal)
  are **built-in operations**: eyemind calculates them itself. `unify(A, B)`
  makes two terms equal; here it picks the data bits out of the corrected
  word.
- `decode` (clause 12) checks the bits, computes S1, S2, S4 and the
  syndrome, corrects the word and extracts the data. Clause 13 decodes each
  received packet, and `query` asks for every result.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
decoded('damaged', 5, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])
decoded('intact', 0, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])
decoded('last_bit', 7, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0])
```

Each line gives the packet's name, its syndrome, the corrected word and the
four data bits.

- The damaged packet has S1 = 1, S2 = 0 and S4 = 1, giving syndrome 5.
  Flipping position 5 recovers payload `[1, 0, 1, 0]`.
- The intact packet has syndrome 0 and is left unchanged: the same word and
  payload.
- In the last packet bit 7 flipped; correcting it gives all zeros.

---

## Why the assumption matters

Correction assumes that the transmitted word was a valid codeword and that
at most one bit flipped. Multiple errors can produce a plausible syndrome
and be miscorrected. This seven-bit code has no extra overall parity bit
for distinguishing every double-bit error from a single-bit error.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The full proof has
82 lines and is 6 KB ([read it all](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/hamming-code.js)).
Below are its claims, its steps, and its certificate up to the end of the
damaged packet, verbatim:

```js
// Answers: each instance of a query() that holds.
decoded('damaged', 5, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])
decoded('intact', 0, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])
decoded('last_bit', 7, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0])

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(decoded('damaged', 5, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0]), clause(13), {Name: 'damaged', Word: [1, 0, 1, 1, 1, 1, 0], Syndrome: 5, Corrected: [1, 0, 1, 1, 0, 1, 0], Payload: [1, 0, 1, 0]}, [received('damaged', [1, 0, 1, 1, 1, 1, 0]), decode([1, 0, 1, 1, 1, 1, 0], 5, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])])
step(decoded('intact', 0, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0]), clause(13), {Name: 'intact', Word: [1, 0, 1, 1, 0, 1, 0], Syndrome: 0, Corrected: [1, 0, 1, 1, 0, 1, 0], Payload: [1, 0, 1, 0]}, [received('intact', [1, 0, 1, 1, 0, 1, 0]), decode([1, 0, 1, 1, 0, 1, 0], 0, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])])
step(decoded('last_bit', 7, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0]), clause(13), {Name: 'last_bit', Word: [0, 0, 0, 0, 0, 0, 1], Syndrome: 7, Corrected: [0, 0, 0, 0, 0, 0, 0], Payload: [0, 0, 0, 0]}, [received('last_bit', [0, 0, 0, 0, 0, 0, 1]), decode([0, 0, 0, 0, 0, 0, 1], 7, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0])])

// Certificate: the derived facts and every answer of each call the questions make.
derived(decoded(A, B, C, D), [decoded('damaged', 5, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0]), decoded('intact', 0, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0]), decoded('last_bit', 7, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0])])
called(decoded(A, B, C, D), [decoded('damaged', 5, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0]), decoded('intact', 0, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0]), decoded('last_bit', 7, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0])])
called(decode([1, 0, 1, 1, 1, 1, 0], E, F, G), [decode([1, 0, 1, 1, 1, 1, 0], 5, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])])
called(bits([1, 0, 1, 1, 1, 1, 0]), [bits([1, 0, 1, 1, 1, 1, 0])])
called(bits([0, 1, 1, 1, 1, 0]), [bits([0, 1, 1, 1, 1, 0])])
called(bits([1, 1, 1, 1, 0]), [bits([1, 1, 1, 1, 0])])
called(bits([1, 1, 1, 0]), [bits([1, 1, 1, 0])])
called(bits([1, 1, 0]), [bits([1, 1, 0])])
called(bits([1, 0]), [bits([1, 0])])
called(bits([0]), [bits([0])])
called(bits([]), [bits([])])
called(correct([1, 0, 1, 1, 1, 1, 0], 1, 5, H), [correct([1, 0, 1, 1, 1, 1, 0], 1, 5, [1, 0, 1, 1, 0, 1, 0])])
called(correct_bit(1, 5, 1, I), [correct_bit(1, 5, 1, 1)])
called(correct([0, 1, 1, 1, 1, 0], 2, 5, J), [correct([0, 1, 1, 1, 1, 0], 2, 5, [0, 1, 1, 0, 1, 0])])
called(correct_bit(2, 5, 0, K), [correct_bit(2, 5, 0, 0)])
called(correct([1, 1, 1, 1, 0], 3, 5, L), [correct([1, 1, 1, 1, 0], 3, 5, [1, 1, 0, 1, 0])])
called(correct_bit(3, 5, 1, M), [correct_bit(3, 5, 1, 1)])
called(correct([1, 1, 1, 0], 4, 5, N), [correct([1, 1, 1, 0], 4, 5, [1, 0, 1, 0])])
called(correct_bit(4, 5, 1, O), [correct_bit(4, 5, 1, 1)])
called(correct([1, 1, 0], 5, 5, P), [correct([1, 1, 0], 5, 5, [0, 1, 0])])
called(correct_bit(5, 5, 1, Q), [correct_bit(5, 5, 1, 0)])
called(correct([1, 0], 6, 5, R), [correct([1, 0], 6, 5, [1, 0])])
called(correct_bit(6, 5, 1, S), [correct_bit(6, 5, 1, 1)])
called(correct([0], 7, 5, T), [correct([0], 7, 5, [0])])
called(correct_bit(7, 5, 0, U), [correct_bit(7, 5, 0, 0)])
called(correct([], 8, 5, V), [correct([], 8, 5, [])])
```

It has three parts:

- **The claims**: the three answers the proof is about.
- **The steps**: one per derived fact. `decoded` is concluded by a forward
  rule, so each of its three facts has a step. A step reads
  `step(what, by which clause, with which values, using what)`; clauses are
  numbered by their place in the program, and rule 13 is the one that
  decodes each received packet.
- **The certificate**: the `derived` **listing** of every `decoded` fact,
  and 69 `called` **call tables**, one per call the search made, each
  with all of its answers. The capital letters are the unknowns still open
  when the call was made.

Read the damaged packet's part as sentences:

- **The step**: *The damaged packet decodes to syndrome 5, corrected word
  `[1, 0, 1, 1, 0, 1, 0]` and payload `[1, 0, 1, 0]`*: by rule 13, because
  the packet received is `[1, 0, 1, 1, 1, 1, 0]` (fact 1) and decoding it
  gives those results.
- **The `decode` table**: *decoding that word has exactly one answer*. Rule
  12 asks for the bit checks and the correction; the parity sums in
  between are not written down, since the checker computes them itself:
  S1 = 1, S2 = 0 and S4 = 1, so the syndrome is 1 + 2 × 0 + 4 × 1 = 5.
- **The `bits` tables**: *every item of the word is 0 or 1*, one table per
  remaining list, down to the empty list.
- **The `correct` and `correct_bit` tables**: *correcting from position 1
  with syndrome 5 gives the corrected word*, one position at a time. Each
  bit is kept, `correct_bit(P, 5, B, B)`, except at position 5, where
  `correct_bit(5, 5, 1, 0)` flips the 1 to 0. Correcting the empty rest
  from position 8 gives the empty list.

The other two packets go the same way, with syndrome 0 (nothing flipped)
and syndrome 7 (the last bit flipped).

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the question
`decoded(A, B, C, D)` from the listing, requires the listing to be closed
(rule 13 derives no `decoded` fact it leaves out), and replays each listed
fact's step: it runs rule 13 again, taking the answer of each `decode` call
from its table. Each table it consults is checked by expanding its call one
level against the program, with every parity sum, comparison and bit flip
calculated again and every inner call answered from its table. A table the
check does not use fails it. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
decoded('damaged', 5, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])
decoded('intact', 0, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])
decoded('last_bit', 7, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0])

verdict('checked')
```

The verdict is **checked**: the three decodings follow from the program,
and they are every answer of the original question. It certifies the
decoder's result, subject to the channel assumption above.

The example's regression test covers all 16 payloads with no error and with
each of the seven possible single-bit errors: 128 cases.


---

## Try it

```sh
eyemind examples/hamming-code.js
eyemind --proof examples/hamming-code.js
eyemind --goal "decode([0, 0, 1, 0, 0, 0, 0], S, C, D)" examples/hamming-code.js
```

The syndrome is 3; correction recovers the all-zero word and payload.

To see the single-error assumption fail, take the intact word and flip
*two* bits, 6 and 7: decoding `[1, 0, 1, 1, 0, 0, 1]` gives syndrome 1, so
eyemind "corrects" bit 1 and reports payload `[1, 0, 0, 1]` instead of the
true `[1, 0, 1, 0]`. A word containing anything but 0 and 1, such as
`[0, 0, 0, 0, 0, 0, 2]`, gets no answer at all.

---

## Takeaway

A few extra bits are enough to find and fix a single error. The proof shows
which checks failed and which bit they point to, so the correction is never
just "trust the decoder".
