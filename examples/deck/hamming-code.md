# Recover four data bits after one bit flips

*Parity checks locate an error in a seven-bit word.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/hamming-code.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/hamming-code.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/hamming-code.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/hamming-code.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=hamming-code)

---

## The question

A Hamming(7,4) word stores data at positions 3, 5, 6 and 7. Positions 1, 2
and 4 hold parity bits. Given the received word `[1, 0, 1, 1, 1, 1, 0]`,
can we find a single flipped bit and recover the original data?

---

## What we tell eyemind

Each check adds its positions and takes the result modulo 2:

- S1 checks positions 1, 3, 5 and 7;
- S2 checks positions 2, 3, 6 and 7;
- S4 checks positions 4, 5, 6 and 7.

The syndrome is **S1 + 2S2 + 4S4**. Zero leaves the word unchanged; otherwise
the correction rule flips that numbered position.

---

## What eyemind concludes

```js
decoded('damaged', 5, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])
decoded('intact', 0, [1, 0, 1, 1, 0, 1, 0], [1, 0, 1, 0])
decoded('last_bit', 7, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0])
```

The damaged packet has S1 = 1, S2 = 0 and S4 = 1, giving syndrome 5.
Flipping position 5 recovers payload `[1, 0, 1, 0]`.

---

## Why the assumption matters

Correction assumes that the transmitted word was a valid codeword and that
at most one bit flipped. Multiple errors can produce a plausible syndrome
and be miscorrected. This seven-bit code has no extra overall parity bit
for distinguishing every double-bit error from a single-bit error.

---

## What the proof establishes

Verdict: **checked**, with no trusted boundaries. The checker recomputes
the parity arithmetic and verifies the list reconstruction and extraction.
It certifies the decoder's result, subject to the channel assumption above.

The example's regression test covers all 16 payloads with no error and with
each of the seven possible single-bit errors: 128 cases.

---

## Try it

```sh
eyemind --goal "decode([0, 0, 1, 0, 0, 0, 0], S, C, D)" examples/hamming-code.js
```

The syndrome is 3; correction recovers the all-zero word and payload.
