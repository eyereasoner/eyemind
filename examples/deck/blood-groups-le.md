# ABO blood groups in Logical English

*Genotypes from blood types, a child's possible types, and the men a child's type excludes as its father.*

[blood-groups-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/blood-groups-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/blood-groups-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/blood-groups-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/blood-groups-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=blood-groups-le)

---

## The question

Each person has two ABO alleles, one from each parent: A, B or O. A and B are
dominant over O and codominant with each other, so the genotypes AA and AO
give type A, BB and BO type B, AB type AB and OO type O. Maria has type A, and
her children Lucas and Eva have types B and O. Tom (O), Sam (AB) and Ken (B)
each might be a father. Which genotypes can Maria and Sam have, which types can
a child of Maria and Tom have, and which men does each child's type exclude?

---

## What we tell eyemind

Dominance is two facts, `A is dominant over O.` and `B is dominant over O.`,
and four rules turn a pair of alleles into a blood type. A person *can have*
each pair of alleles from `A`, `B` and `O` that gives their observed type,
so a type A person can be AA or AO (in either order). A child of two people can
have every type that one allele of each parent's possible genotypes gives,
taken with `an allele X is in [M1, M2]`.

A man is excluded as a child's father when `it is not the case that` a child
of the mother and him can have the child's type: every combination has to fail.

---

## What eyemind concludes

```text
% query mother with scenario paternity
Maria can have the alleles A and A.
Maria can have the alleles A and O.
Maria can have the alleles O and A.

% query sam with scenario paternity
Sam can have the alleles A and B.
Sam can have the alleles B and A.

% query children with scenario paternity
a child of Maria and Tom can have blood type A.
a child of Maria and Tom can have blood type O.

% query excluded with scenario paternity
Tom is excluded as the father of Lucas.
Sam is excluded as the father of Eva.
```

Lucas has type B, but Maria has no B allele and Tom, type O, has none either:
Tom is excluded. Eva has type O and needs an O allele from her father, which
Sam, type AB, does not have. Ken, type B, can be BO and is excluded for neither
child. The check report holds the answers as terms:

```js
struct('le:answer', 'excluded', 'paternity', 'Tom', 'Lucas')
struct('le:answer', 'children', 'paternity', 'A')
```

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. An exclusion
rests on a negation, which the checker decides from the complete table of the
types a child of the mother and the man can have; `--explain` shows it:

```text
Tom is excluded as the father of Lucas
    because Maria is the mother of Lucas
    and Lucas has blood type B
    and Tom is male
    and Tom has blood type O
    and it is not the case that a child of Maria and Tom can have blood type B.
```

A blood type can exclude a man, but never prove that he is the father.

---

## Try it

```sh
node bin/eyemind.js examples/blood-groups-le.le
node bin/eyemind.js --program examples/blood-groups-le.le > /tmp/blood-groups-le.js
node bin/eyemind.js --proof examples/blood-groups-le.le
node bin/eyemind.js --check-proof examples/proof/blood-groups-le.js examples/blood-groups-le.le
node bin/eyemind.js --explain examples/blood-groups-le.le
```

Make Tom type B and he is no longer excluded as Lucas's father. Either way, the
output reports whether the answers are as expected.
