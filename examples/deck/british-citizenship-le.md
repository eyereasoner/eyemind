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
(Communications of the ACM, 1986), the classic example of legislation as rules,
and it is written in Kowalski's Logical English.

---

## What we tell eyemind

The templates declare sentences such as
`*a person* is born in *a place* on *a date*`. Each subsection is one rule.
Subsection 1(2) ends with `it is not the case that the contrary is shown for
the person`, the rebuttable presumption, on its own indented line.

A parent qualifies as a British citizen, or as settled on or before the birth.
The rule writes the alternatives with indentation: the `or` line is deeper than
the `and` lines around it, and the lines deeper still belong to the second
alternative, so the rule reads *parent, and (citizen, or (born, settled, and
settled first))*. Dates such as `1983-01-01` compare in time order.

The families are one scenario. Gwen is a citizen under earlier law, stated as a
fact, because the program models only section 1. The scenario also states the
answers the two queries are expected to give.

---

## What eyemind concludes

```text
% query citizens with scenario families
Anna is a British citizen.
Ben is a British citizen.
Eve is a British citizen.
Gwen is a British citizen.

% query parents with scenario families
Farid is a qualifying parent of Anna.
Anna is a qualifying parent of Ben.
Anna is a qualifying parent of Jo.
Gwen is a qualifying parent of Hugo.
```

Anna's father Farid had been settled since 1975, so Anna, born in 1990, is a
citizen. Ben is a citizen through Anna: her citizenship is itself derived, and
it qualifies her as a parent. Eve is a foundling with nothing shown to the
contrary.

Hugo was born before commencement, so section 1 does not apply although his
mother Gwen is a citizen. Dara was born in 2001, before her father settled in
2005. Jo was born in France. For the foundling Finn the contrary is shown.

The answers agree with the expected ones; otherwise the output would add a
`% not as expected` line. In the check report each answer names its query and
scenario:

```js
struct('le:answer', 'citizens', 'families', 'Ben')
struct('le:answer', 'parents', 'families', 'Anna', 'Jo')
```

Anna is a qualifying parent of Jo, but Jo was not born in the United Kingdom,
so this alone gives no citizenship.

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. Each citizen
follows from one of the two section 1 rules, Ben's through Anna's derived
citizenship. The absence of Finn's and Eve's contrary evidence is decided from
the recorded facts. The proof checks the compiled rules; that they match the
Act is a matter of reading the program.

---

## Try it

```sh
node bin/eyemind.js examples/british-citizenship-le.le
node bin/eyemind.js --program examples/british-citizenship-le.le > /tmp/british-citizenship-le.js
node bin/eyemind.js --proof examples/british-citizenship-le.le
node bin/eyemind.js --check-proof examples/proof/british-citizenship-le.js examples/british-citizenship-le.le
```

Change Ivan's settlement date to `1999-01-01`: he was then settled at Dara's
birth, and Dara becomes a citizen. Remove `the contrary is shown for Finn.` to
make Finn a citizen too. Either change makes the output report that the
answers are not as expected.
