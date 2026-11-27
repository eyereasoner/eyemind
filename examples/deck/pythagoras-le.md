# The Pythagorean theorem in Logical English

*Right, acute and obtuse triangles, whole hypotenuses, and the primitive Pythagorean triples.*

[pythagoras-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/pythagoras-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/pythagoras-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/pythagoras-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/pythagoras-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=pythagoras-le)

---

## The question

In a right-angled triangle, the square on the longest side is the sum of the
squares on the other two, and only then. Which of six triangles are
right-angled, acute or obtuse, and which are no triangle at all? Which pairs of
legs have a whole-number hypotenuse? And which primitive Pythagorean triples,
whose three numbers share no common factor, does Euclid's formula give?

---

## What we tell eyemind

A triangle is a sentence such as `t5 has sides 2 and 3 and longest side 4.` Three
rules compare `A * A + B * B` with `C * C`, with `=`, `>` and `<` between the
two formulas, after checking that `A + B > C`; lengths that fail that test are no
triangle.

A hypotenuse is whole when `C = round(sqrt(S))` squares back to the sum of the
squares `S`; otherwise `it is not the case that` the legs have one.

Euclid's formula takes `M` and `N` from short lists with `is in`, keeps
`M > N` of opposite parity, `(M - N) mod 2 = 1`, and coprime, by Euclid's
algorithm, and gives `M * M - N * N`, `2 * M * N` and `M * M + N * N`. A count
gathers the triples up to a hypotenuse.

---

## What eyemind concludes

```text
% query right with scenario geometry
t1 is right-angled.
t2 is right-angled.
t3 is right-angled.

% query acute with scenario geometry
t4 is acute.

% query obtuse with scenario geometry
t5 is obtuse.

% query degenerate with scenario geometry
t6 is no triangle.

% query hypotenuses with scenario geometry
legs 20 and 21 have hypotenuse 29.
legs 9 and 40 have hypotenuse 41.

% query irrational with scenario geometry
legs 1 and 1 have no whole hypotenuse.
legs 2 and 3 have no whole hypotenuse.

% query triples with scenario geometry
3 and 4 and 5 is a primitive Pythagorean triple.
5 and 12 and 13 is a primitive Pythagorean triple.
8 and 15 and 17 is a primitive Pythagorean triple.
7 and 24 and 25 is a primitive Pythagorean triple.
20 and 21 and 29 is a primitive Pythagorean triple.
9 and 40 and 41 is a primitive Pythagorean triple.
12 and 35 and 37 is a primitive Pythagorean triple.
11 and 60 and 61 is a primitive Pythagorean triple.
28 and 45 and 53 is a primitive Pythagorean triple.
33 and 56 and 65 is a primitive Pythagorean triple.
13 and 84 and 85 is a primitive Pythagorean triple.

% query counts with scenario geometry
4 primitive triples have a hypotenuse of at most 25.
7 primitive triples have a hypotenuse of at most 50.
```

The check report holds the answers as terms:

```js
struct('le:answer', 'triples', 'geometry', 3, 4, 5)
struct('le:answer', 'right', 'geometry', 't1')
```

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. The squares are
exact integers, and the square root is only a guess that the check `C * C = S`
confirms. A missing hypotenuse rests on a negation the checker decides from a
complete table, and the counts on every generated triple. `--explain` shows a
triple's derivation:

```text
20 and 21 and 29 is a primitive Pythagorean triple
    because 5 is in [2, 3, 4, 5, 6, 7]
    and 2 is in [1, 2, 3, 4, 5, 6]
    and 5 > 2
    and 1 = (5 - 2) mod 2
    and the greatest common divisor of 5 and 2 is 1
        because 2 > 0
        and 1 = 5 mod 2
        and the greatest common divisor of 2 and 1 is 1
            because 1 > 0
            and 0 = 2 mod 1
            and the greatest common divisor of 1 and 0 is 1
                because 1 > 0
    and 21 = 5 * 5 - 2 * 2
    and 20 = 2 * 5 * 2
    and 29 = 5 * 5 + 2 * 2
    and the minimum of 21 and 20 is 20
    and the maximum of 21 and 20 is 21.
```

---

## Try it

```sh
node bin/eyemind.js examples/pythagoras-le.le
node bin/eyemind.js --program examples/pythagoras-le.le > /tmp/pythagoras-le.js
node bin/eyemind.js --proof examples/pythagoras-le.le
node bin/eyemind.js --check-proof examples/proof/pythagoras-le.js examples/pythagoras-le.le
node bin/eyemind.js --explain examples/pythagoras-le.le
```

Add `legs 12 and 16 are given.`: they have hypotenuse 20, four times 3-4-5, and
the output reports the hypotenuses as not expected until the expectation lists
them.
