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
115 steps and is 15 KB ([read it all](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/hamming-code.js)).
Below are its claims, all its clauses, and the complete chain for the
damaged packet, verbatim:

```js
// Answers: each instance of a query() that holds.
decoded('damaged', 5, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])
decoded('intact', 0, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])
decoded('last_bit', 7, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0])

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(received('damaged', [1, 0, 1, 1, 1, 1, 0])))
clause(2, fact(received('intact', [1, 0, 1, 1, 0, 1, 0])))
clause(3, fact(received('last_bit', [0, 0, 0, 0, 0, 0, 1])))
clause(4, fact(bit(0)))
clause(5, fact(bit(1)))
clause(6, fact(bits([])))
clause(7, implied_by(bits([B, ...Rest]), [bit(B), bits(Rest)]))
clause(8, fact(correct([], _0, _1, [])))
clause(9, implied_by(correct([Bit, ...Rest], Position, Syndrome, [Fixed, ...Tail]), [correct_bit(Position, Syndrome, Bit, Fixed), is(Next, add(Position, 1)), correct(Rest, Next, Syndrome, Tail)]))
clause(10, implied_by(correct_bit(Position, Syndrome, Bit, Fixed), [eq(Position, Syndrome), is(Fixed, sub(1, Bit))]))
clause(11, implied_by(correct_bit(Position, Syndrome, Bit, Bit), ne(Position, Syndrome)))
clause(12, implied_by(decode([B1, B2, B3, B4, B5, B6, B7], Syndrome, Corrected, [D1, D2, D3, D4]), [bits([B1, B2, B3, B4, B5, B6, B7]), is(S1, mod(add(add(B1, B3), add(B5, B7)), 2)), is(S2, mod(add(add(B2, B3), add(B6, B7)), 2)), is(S4, mod(add(add(B4, B5), add(B6, B7)), 2)), is(Syndrome, add(S1, add(mul(2, S2), mul(4, S4)))), correct([B1, B2, B3, B4, B5, B6, B7], 1, Syndrome, Corrected), unify(Corrected, [_0, _1, D1, _2, D2, D3, D4])]))
clause(13, implies([received(Name, Word), decode(Word, Syndrome, Corrected, Payload)], decoded(Name, Syndrome, Corrected, Payload)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(decoded('damaged', 5, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0]), clause(13), {Name: 'damaged', Word: [1, 0, 1, 1, 1, 1, 0], Syndrome: 5, Corrected: [1, 0, 1, 1, 0, 1, 0], Payload: [1, 0, 1, 0]}, [received('damaged', [1, 0, 1, 1, 1, 1, 0]), decode([1, 0, 1, 1, 1, 1, 0], 5, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])])
step(received('damaged', [1, 0, 1, 1, 1, 1, 0]), clause(1), {}, [])
step(decode([1, 0, 1, 1, 1, 1, 0], 5, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0]), clause(12), {B1: 1, B2: 0, B3: 1, B4: 1, B5: 1, B6: 1, B7: 0, Syndrome: 5, Corrected: [1, 0, 1, 1, 0, 1, 0], D1: 1, D2: 0, D3: 1, D4: 0, S1: 1, S2: 0, S4: 1, _0: 1, _1: 0, _2: 1}, [bits([1, 0, 1, 1, 1, 1, 0]), is(1, mod(add(add(1, 1), add(1, 0)), 2)), is(0, mod(add(add(0, 1), add(1, 0)), 2)), is(1, mod(add(add(1, 1), add(1, 0)), 2)), is(5, add(1, add(mul(2, 0), mul(4, 1)))), correct([1, 0, 1, 1, 1, 1, 0], 1, 5, [1, 0, 1, 1, 0, 1, 0]), unify([1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 1, 0, 1, 0])])
step(bits([1, 0, 1, 1, 1, 1, 0]), clause(7), {B: 1, Rest: [0, 1, 1, 1, 1, 0]}, [bit(1), bits([0, 1, 1, 1, 1, 0])])
step(bit(1), clause(5), {}, [])
step(bits([0, 1, 1, 1, 1, 0]), clause(7), {B: 0, Rest: [1, 1, 1, 1, 0]}, [bit(0), bits([1, 1, 1, 1, 0])])
step(bit(0), clause(4), {}, [])
step(bits([1, 1, 1, 1, 0]), clause(7), {B: 1, Rest: [1, 1, 1, 0]}, [bit(1), bits([1, 1, 1, 0])])
step(bits([1, 1, 1, 0]), clause(7), {B: 1, Rest: [1, 1, 0]}, [bit(1), bits([1, 1, 0])])
step(bits([1, 1, 0]), clause(7), {B: 1, Rest: [1, 0]}, [bit(1), bits([1, 0])])
step(bits([1, 0]), clause(7), {B: 1, Rest: [0]}, [bit(1), bits([0])])
step(bits([0]), clause(7), {B: 0, Rest: []}, [bit(0), bits([])])
step(bits([]), clause(6), {}, [])
step(is(1, mod(add(add(1, 1), add(1, 0)), 2)), 'builtin', {}, [])
step(is(0, mod(add(add(0, 1), add(1, 0)), 2)), 'builtin', {}, [])
step(is(5, add(1, add(mul(2, 0), mul(4, 1)))), 'builtin', {}, [])
step(correct([1, 0, 1, 1, 1, 1, 0], 1, 5, [1, 0, 1, 1, 0, 1, 0]), clause(9), {Bit: 1, Rest: [0, 1, 1, 1, 1, 0], Position: 1, Syndrome: 5, Fixed: 1, Tail: [0, 1, 1, 0, 1, 0], Next: 2}, [correct_bit(1, 5, 1, 1), is(2, add(1, 1)), correct([0, 1, 1, 1, 1, 0], 2, 5, [0, 1, 1, 0, 1, 0])])
step(correct_bit(1, 5, 1, 1), clause(11), {Position: 1, Syndrome: 5, Bit: 1}, [ne(1, 5)])
step(ne(1, 5), 'builtin', {}, [])
step(is(2, add(1, 1)), 'builtin', {}, [])
step(correct([0, 1, 1, 1, 1, 0], 2, 5, [0, 1, 1, 0, 1, 0]), clause(9), {Bit: 0, Rest: [1, 1, 1, 1, 0], Position: 2, Syndrome: 5, Fixed: 0, Tail: [1, 1, 0, 1, 0], Next: 3}, [correct_bit(2, 5, 0, 0), is(3, add(2, 1)), correct([1, 1, 1, 1, 0], 3, 5, [1, 1, 0, 1, 0])])
step(correct_bit(2, 5, 0, 0), clause(11), {Position: 2, Syndrome: 5, Bit: 0}, [ne(2, 5)])
step(ne(2, 5), 'builtin', {}, [])
step(is(3, add(2, 1)), 'builtin', {}, [])
step(correct([1, 1, 1, 1, 0], 3, 5, [1, 1, 0, 1, 0]), clause(9), {Bit: 1, Rest: [1, 1, 1, 0], Position: 3, Syndrome: 5, Fixed: 1, Tail: [1, 0, 1, 0], Next: 4}, [correct_bit(3, 5, 1, 1), is(4, add(3, 1)), correct([1, 1, 1, 0], 4, 5, [1, 0, 1, 0])])
step(correct_bit(3, 5, 1, 1), clause(11), {Position: 3, Syndrome: 5, Bit: 1}, [ne(3, 5)])
step(ne(3, 5), 'builtin', {}, [])
step(is(4, add(3, 1)), 'builtin', {}, [])
step(correct([1, 1, 1, 0], 4, 5, [1, 0, 1, 0]), clause(9), {Bit: 1, Rest: [1, 1, 0], Position: 4, Syndrome: 5, Fixed: 1, Tail: [0, 1, 0], Next: 5}, [correct_bit(4, 5, 1, 1), is(5, add(4, 1)), correct([1, 1, 0], 5, 5, [0, 1, 0])])
step(correct_bit(4, 5, 1, 1), clause(11), {Position: 4, Syndrome: 5, Bit: 1}, [ne(4, 5)])
step(ne(4, 5), 'builtin', {}, [])
step(is(5, add(4, 1)), 'builtin', {}, [])
step(correct([1, 1, 0], 5, 5, [0, 1, 0]), clause(9), {Bit: 1, Rest: [1, 0], Position: 5, Syndrome: 5, Fixed: 0, Tail: [1, 0], Next: 6}, [correct_bit(5, 5, 1, 0), is(6, add(5, 1)), correct([1, 0], 6, 5, [1, 0])])
step(correct_bit(5, 5, 1, 0), clause(10), {Position: 5, Syndrome: 5, Bit: 1, Fixed: 0}, [eq(5, 5), is(0, sub(1, 1))])
step(eq(5, 5), 'builtin', {}, [])
step(is(0, sub(1, 1)), 'builtin', {}, [])
step(is(6, add(5, 1)), 'builtin', {}, [])
step(correct([1, 0], 6, 5, [1, 0]), clause(9), {Bit: 1, Rest: [0], Position: 6, Syndrome: 5, Fixed: 1, Tail: [0], Next: 7}, [correct_bit(6, 5, 1, 1), is(7, add(6, 1)), correct([0], 7, 5, [0])])
step(correct_bit(6, 5, 1, 1), clause(11), {Position: 6, Syndrome: 5, Bit: 1}, [ne(6, 5)])
step(ne(6, 5), 'builtin', {}, [])
step(is(7, add(6, 1)), 'builtin', {}, [])
step(correct([0], 7, 5, [0]), clause(9), {Bit: 0, Rest: [], Position: 7, Syndrome: 5, Fixed: 0, Tail: [], Next: 8}, [correct_bit(7, 5, 0, 0), is(8, add(7, 1)), correct([], 8, 5, [])])
step(correct_bit(7, 5, 0, 0), clause(11), {Position: 7, Syndrome: 5, Bit: 0}, [ne(7, 5)])
step(ne(7, 5), 'builtin', {}, [])
step(is(8, add(7, 1)), 'builtin', {}, [])
step(correct([], 8, 5, []), clause(8), {_0: 8, _1: 5}, [])
step(unify([1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 1, 0, 1, 0]), 'builtin', {}, [])
// … 68 more steps: the intact packet (steps 48-80) and the last_bit
// packet (steps 81-115); 115 steps in all.
```

It has three parts:

- **The claims**: the three answers the proof is about.
- **The clauses**: all 13 program clauses, numbered as above. Each
  don't-care `_` gets a name (`_0`, `_1`, `_2`) so a step can say what it
  stood for.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.

Two kinds of justification occur:

- `clause(N)`: the step is an instance of program clause N, with the
  variables standing for the values shown.
- `'builtin'`: a calculation by a built-in operation, such as
  `is(5, add(1, add(mul(2, 0), mul(4, 1))))`. It cites no clause and uses
  nothing; the checker simply calculates it again.

Read the damaged packet's 47 steps as sentences:

- **Step 1**: *The damaged packet decodes to syndrome 5, corrected word
  `[1, 0, 1, 1, 0, 1, 0]` and payload `[1, 0, 1, 0]`*: by rule 13, because
  of the next two steps.
- **Step 2**: *The damaged packet is `[1, 0, 1, 1, 1, 1, 0]`*: fact 1.
- **Step 3**: *Decoding that word gives those results*: by rule 12, with S1 = 1,
  S2 = 0 and S4 = 1, because all seven items are bits, the three checks
  and the syndrome calculate as shown, the correction gives the corrected
  word, and the data bits are positions 3, 5, 6 and 7 of it.
- **Steps 4 to 13**: *Every item of the word is 0 or 1*: rule 7 once per item, using
  facts 5 (`bit(1)`) and 4 (`bit(0)`), down to the empty list, fact 6.
  Facts already shown are not repeated.
- **Step 14**: *S1 = (1 + 1) + (1 + 0) modulo 2 = 1*: a built-in calculation. S4
  happens to be the very same sum for this word (positions 4, 5, 6 and 7
  hold 1, 1, 1, 0), so this one step serves both.
- **Step 15**: *S2 = (0 + 1) + (1 + 0) modulo 2 = 0*: a built-in calculation.
- **Step 16**: *The syndrome is 1 + 2 × 0 + 4 × 1 = 5*: a built-in calculation.
- **Step 17**: *Correcting from position 1 with syndrome 5 gives the corrected word*:
  by rule 9, because bit 1 is kept, the next position is 2, and the rest
  is corrected from position 2.
- **Step 18**: *Bit 1 is kept*: by rule 11, because 1 ≠ 5 (step 19, a built-in test).
- **Step 20**: *1 + 1 = 2*: a built-in calculation.
- **Steps 21 to 32**: Positions 2, 3 and 4 go the same way: each bit is kept because
  its position is not 5, and the position goes up by one.
- **Step 33**: *Correcting from position 5 gives `[0, 1, 0]`*: by rule 9.
- **Step 34**: *Bit 5 is flipped from 1 to 0*: by rule 10, because 5 = 5 (step 35)
  and 1 − 1 = 0 (step 36).
- **Step 37**: *5 + 1 = 6*: a built-in calculation.
- **Steps 38 to 45**: Positions 6 and 7 are kept, as before.
- **Step 46**: *Correcting the empty rest from position 8 gives the empty list*:
  fact 8.
- **Step 47**: *The corrected word matches `[_, _, D1, _, D2, D3, D4]` with data
  `[1, 0, 1, 0]`*: a built-in `unify`.

The other two packets go the same way, with syndrome 0 (nothing flipped)
and syndrome 7 (the last bit flipped).

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
decoded('damaged', 5, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])
decoded('intact', 0, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])
decoded('last_bit', 7, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0])

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 76)
condition('C2', 'well_founded', 'ok', 115)
condition('C3', 'justification', 'ok', 115)
condition('C4', 'coverage', 'ok', 154)
condition('C5', 're_decision', 'ok', 39)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 118)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(115)
verified(76)
recomputed(39)
composed(0)
trusted(0)
claims(3)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (76)**: the 76 clause steps really are instances of the
  clauses they cite, with the values shown: every bit check, every
  position of every correction, and the three decodings.
- **C2 well-founded (115)**: none of the 115 steps depends on itself, even
  indirectly.
- **C3 justification (115)**: all 115 steps say how they were justified, in
  a form the checker understands.
- **C4 coverage (154)**: the 3 claims and the 151 things the steps use are
  each backed by a step: nothing is taken for granted.
- **C5 re-decision (39)**: the 39 built-in calculations (parity sums,
  syndromes, position counts, comparisons, bit flips and the final `unify`)
  were calculated again by the checker itself, and they agree.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (118)**: the 3 claims answer the query, and all 115 steps
  serve them. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 115 steps, 76 verified against the program, 39
recomputed, none taken on trust. The verdict is **checked**: the three
decodings follow from the program. It certifies the decoder's result,
subject to the channel assumption above; as the last comment says, it does
not say the program has no other answers.

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
