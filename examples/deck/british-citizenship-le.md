# British citizenship in Logical English

*Section 1 of the British Nationality Act 1981, with alternatives and a rebuttable presumption.*

[british-citizenship-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/british-citizenship-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/british-citizenship-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/british-citizenship-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/british-citizenship-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=british-citizenship-le)

---

## The question

Section 1 of the British Nationality Act 1981 makes a person a British citizen
by birth in the United Kingdom after the Act's commencement, when a parent was
then a British citizen or settled there. A new-born infant found abandoned in
the United Kingdom is treated the same way, unless the contrary is shown. Which
of eight people are citizens under these two subsections?

The formalization follows the logic program of Sergot, Sadri, Kowalski,
Kriwaczek, Hammond and Cory, *The British Nationality Act as a Logic Program*
(Communications of the ACM, 1986), the classic example of legislation as rules.

---

## What we tell eyemind

Dates are integers of the form YYYYMMDD, so the Act's commencement is
`19830101` and comparisons such as `D is at least C` order dates. Each person
has a birth place and date, or a place and date where they were found.

A parent qualifies when they are a British citizen, or were settled on or
before the birth. A person is a citizen when born in the United Kingdom after
commencement to a qualifying parent, or when found there as a new-born after
commencement and *it is not known that* the contrary is shown. Both
alternatives are joined with `or`; `and` binds more tightly, so each
alternative is one conjunction and compiles to its own LS rule.

Gwen is a citizen under earlier law, stated as a fact, because the program
models only section 1. Citizenship by descent (section 2), registration and
naturalisation are outside it.

---

## What eyemind concludes

```js
britishCitizen('Anna')
britishCitizen('Ben')
britishCitizen('Eve')
britishCitizen('Gwen')
```

Anna's father Farid had been settled since 1975, so Anna, born in 1990, is a
citizen. Ben is a citizen through Anna: her citizenship is itself derived, and
it qualifies her as a parent. Eve is a foundling with nothing shown to the
contrary.

Hugo was born before commencement, so section 1 does not apply although his
mother Gwen is a citizen. Dara was born in 2001, before her father settled in
2005. Jo was born in France. For the foundling Finn the contrary is shown.

```js
qualifyingParent('Anna', 'Jo')
```

Anna is a qualifying parent of Jo, but Jo was not born in the United Kingdom,
so this alone gives no citizenship.

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. Each citizen
follows from one of the two alternatives of the section 1 rule, Ben's through
Anna's derived citizenship. The absence of Eve's contrary evidence is decided
from a complete table of the recorded facts. The proof checks the compiled
rules; that they match the Act is a matter of reading the program.

---

## Try it

```sh
node bin/eyemind.js examples/british-citizenship-le.le
node bin/eyemind.js --program examples/british-citizenship-le.le > /tmp/british-citizenship-le.js
node bin/eyemind.js --proof examples/british-citizenship-le.le
node bin/eyemind.js --check-proof examples/proof/british-citizenship-le.js examples/british-citizenship-le.le
```

Change Ivan's settlement date to `19990101`: he was then settled at Dara's
birth, and Dara becomes a citizen. Remove `Finn is a contraryShown.` to make
Finn a citizen too.
