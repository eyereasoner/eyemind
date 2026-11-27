# Euclid's algorithm in Logical English

*Greatest common divisors by recursion, least common multiples, coprime pairs and fractions in lowest terms.*

[euclid-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/euclid-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/euclid-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/euclid-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/euclid-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=euclid-le)

---

## The question

What are the greatest common divisor and the least common multiple of 1071 and
462, of 35 and 64, and of 48 and 180? Which of these pairs are coprime, and
what are 84/126, 1071/462, 17/51 and 10/7 in lowest terms?

---

## What we tell eyemind

Euclid's algorithm, from Book VII of the *Elements*, is two rules: the greatest
common divisor of A and 0 is A, and that of A and B is the greatest common
divisor of B and `A mod B`. The recursion ends because the remainder shrinks
to 0. The least common multiple is `A * B // G`, a pair is coprime when its
divisor is 1, and a fraction reduces by dividing both parts by their divisor.

---

## What eyemind concludes

```text
% query pairs with scenario numbers
the pair 1071 and 462 has greatest common divisor 21 and least common multiple 23562.
the pair 35 and 64 has greatest common divisor 1 and least common multiple 2240.
the pair 48 and 180 has greatest common divisor 12 and least common multiple 720.

% query coprime with scenario numbers
35 and 64 are coprime.

% query fractions with scenario numbers
84 over 126 reduces to 2 over 3.
1071 over 462 reduces to 51 over 22.
17 over 51 reduces to 1 over 3.
10 over 7 reduces to 10 over 7.
```

```js
struct('le:answer', 'pairs', 'numbers', 1071, 462, 21, 23562)
struct('le:answer', 'coprime', 'numbers', 35, 64)
```

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program; integers are
exact, so every remainder and quotient is too. `--explain` shows the steps of
the algorithm:

```text
84 over 126 reduces to 2 over 3
    because 84 over 126 is a fraction
    and the greatest common divisor of 84 and 126 is 42
        because 126 > 0
        and 84 = 84 mod 126
        and the greatest common divisor of 126 and 84 is 42
            because 84 > 0
            and 42 = 126 mod 84
            and the greatest common divisor of 84 and 42 is 42
                because 42 > 0
                and 0 = 84 mod 42
                and the greatest common divisor of 42 and 0 is 42
                    because 42 > 0
    and 2 = 84 // 42
    and 3 = 126 // 42.
```

---

## Try it

```sh
node bin/eyemind.js examples/euclid-le.le
node bin/eyemind.js --program examples/euclid-le.le > /tmp/euclid-le.js
node bin/eyemind.js --proof examples/euclid-le.le
node bin/eyemind.js --check-proof examples/proof/euclid-le.js examples/euclid-le.le
node bin/eyemind.js --explain examples/euclid-le.le
```

Add `12 and 18 are a pair.`: their greatest common divisor is 6 and their least
common multiple 36, and the output reports that the pairs are not as expected
until the expectation lists them.
