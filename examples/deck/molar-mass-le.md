# Molar masses in Logical English

*Molar masses summed exactly from atomic weights, each element's share, and the heaviest compound.*

[molar-mass-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/molar-mass-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/molar-mass-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/molar-mass-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/molar-mass-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=molar-mass-le)

---

## The question

A compound's molar mass is the sum of the atomic weights of its atoms. With
standard atomic weights in whole milligrams per mole, so that every sum is
exact, what are the molar masses of water, carbon dioxide, methane, ammonia,
sodium chloride and glucose? How much of each is oxygen, which is the
heaviest, and which weigh less than water?

---

## What we tell eyemind

A formula is a set of sentences such as `glucose has 6 atoms of carbon.` The
molar mass is an aggregate with a product in its condition:

```text
the mass is the sum of each part such that
    the compound has a number N atoms of an element E
    and E has an atomic weight of a number W mg per mole
    and the part = N * W.
```

An element's share is `1000 * N * W // the mass`, in per mille rounded down by
integer division. The heaviest compound weighs `the max of each M such that
the molar mass of a compound is M mg per mole`.

---

## What eyemind concludes

```text
% query masses with scenario lab
the molar mass of water is 18015 mg per mole.
the molar mass of carbon dioxide is 44009 mg per mole.
the molar mass of methane is 16043 mg per mole.
the molar mass of ammonia is 17031 mg per mole.
the molar mass of sodium chloride is 58443 mg per mole.
the molar mass of glucose is 180156 mg per mole.

% query oxygen with scenario lab
oxygen makes up 888 per mille of water.
oxygen makes up 727 per mille of carbon dioxide.
oxygen makes up 532 per mille of glucose.

% query heaviest with scenario lab
glucose is the heaviest compound.

% query lighter with scenario lab
methane is lighter than water.
ammonia is lighter than water.
```

Glucose, C6H12O6, weighs 6 × 12011 + 12 × 1008 + 6 × 15999 = 180156 mg/mol,
that is 180.156 g/mol. The check report holds the answers as terms:

```js
struct('le:answer', 'masses', 'lab', 'water', 18015)
struct('le:answer', 'heaviest', 'lab', 'glucose')
```

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. Each molar mass
collects every part of its formula, which the checker decides from complete
tables, and the integers make every sum and share exact:

```text
the molar mass of glucose is 180156 mg per mole
    because glucose has 6 atoms of carbon
    and 180156 is the sum of each part such that glucose has N atoms of E and E has an atomic weight of W mg per mole and the part = N * W, namely 12096, 72066 and 95994.
```

---

## Try it

```sh
node bin/eyemind.js examples/molar-mass-le.le
node bin/eyemind.js --program examples/molar-mass-le.le > /tmp/molar-mass-le.js
node bin/eyemind.js --proof examples/molar-mass-le.le
node bin/eyemind.js --check-proof examples/proof/molar-mass-le.js examples/molar-mass-le.le
node bin/eyemind.js --explain examples/molar-mass-le.le
```

Add `ethanol has 2 atoms of carbon.`, `ethanol has 6 atoms of hydrogen.` and
`ethanol has 1 atoms of oxygen.`: ethanol weighs 46069 mg/mol, and the output
reports that the masses are not as expected until ethanol joins them.
