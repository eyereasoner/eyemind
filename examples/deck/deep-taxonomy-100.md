# Deep taxonomy (100 levels)

*A hundred-step chain of "every A is a B", with dead ends at every turn.*

[deep-taxonomy-100.js](https://github.com/eyereasoner/eyemind/blob/main/examples/deep-taxonomy-100.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/deep-taxonomy-100.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-100.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/deep-taxonomy-100.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=deep-taxonomy-100)

---

## The question

A **taxonomy** is a classification: a dog is a mammal, a mammal is an
animal, and so on. Each kind is called a *class*.

Imagine one that is a hundred levels deep. One individual, `ind`, belongs to
the top class `n0`. At every level the path splits three ways: a member of
`n0` is also a member of `n1`, `i1` and `j1`, but only `n1` leads further;
`i1` and `j1` are dead ends.

**Is `ind` also a member of class `n100`, a hundred levels down?**

---

## What we tell eyemind

One fact and 300 rules, three per level, which a loop states:

```js
fact(type('ind', 'n0'))
for (let level = 1; level <= 100; level++) {
  implied_by(type(X, `n${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `i${level}`), type(X, `n${level - 1}`))
  implied_by(type(X, `j${level}`), type(X, `n${level - 1}`))
}
query(type(X, 'n100'))
```

An eyemind program is JavaScript, so an ordinary `for` loop can state rules:
it runs with `level` = 1, 2, ..., 100, and `` `n${level}` `` spells the
class name, such as `n1`. The fact is clause 1; level 1 gives clauses 2, 3
and 4, level 2 gives clauses 5, 6 and 7, and so on up to clause 301.

`type(X, C)` says that `X` is a member of class `C`. `X` is a **variable**,
a blank that stands for whatever individual fits. Each
`implied_by(conclusion, condition)` is a **backward rule**: when eyemind
needs the conclusion, it tries to show the condition. So the first rule of
level 1 reads: *anything in `n0` is also in `n1`*.

The last line asks the question: which `X` is in `n100`?

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
type('ind', 'n100')
```

Yes: `ind` is a member of `n100`.

This is a **benchmark**, a standard test, for reasoners, from the
WellnessRules work cited in the file. It checks that a
reasoner can follow a long chain without getting lost in the side branches.
eyemind works backward from the question, one step per level, so the test is
how deep goal-directed search, and its proof, can go.

---

## The proof, line by line

`eyemind --proof` writes down how it reached the answer. This is the complete
proof, 105 lines: the claim, then one call table per level. See the
[proof file](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/deep-taxonomy-100.js)
for the same lines.

```js
// Answers: each instance of a query() that holds.
type('ind', 'n100')

// Certificate: the derived facts and every answer of each call the questions make.
called(type(A, 'n100'), [type('ind', 'n100')])
called(type(B, 'n99'), [type('ind', 'n99')])
called(type(C, 'n98'), [type('ind', 'n98')])
called(type(D, 'n97'), [type('ind', 'n97')])
called(type(E, 'n96'), [type('ind', 'n96')])
called(type(F, 'n95'), [type('ind', 'n95')])
called(type(G, 'n94'), [type('ind', 'n94')])
called(type(H, 'n93'), [type('ind', 'n93')])
called(type(I, 'n92'), [type('ind', 'n92')])
called(type(J, 'n91'), [type('ind', 'n91')])
called(type(K, 'n90'), [type('ind', 'n90')])
called(type(L, 'n89'), [type('ind', 'n89')])
called(type(M, 'n88'), [type('ind', 'n88')])
called(type(N, 'n87'), [type('ind', 'n87')])
called(type(O, 'n86'), [type('ind', 'n86')])
called(type(P, 'n85'), [type('ind', 'n85')])
called(type(Q, 'n84'), [type('ind', 'n84')])
called(type(R, 'n83'), [type('ind', 'n83')])
called(type(S, 'n82'), [type('ind', 'n82')])
called(type(T, 'n81'), [type('ind', 'n81')])
called(type(U, 'n80'), [type('ind', 'n80')])
called(type(V, 'n79'), [type('ind', 'n79')])
called(type(W, 'n78'), [type('ind', 'n78')])
called(type(X, 'n77'), [type('ind', 'n77')])
called(type(Y, 'n76'), [type('ind', 'n76')])
called(type(Z, 'n75'), [type('ind', 'n75')])
called(type(A1, 'n74'), [type('ind', 'n74')])
called(type(B1, 'n73'), [type('ind', 'n73')])
called(type(C1, 'n72'), [type('ind', 'n72')])
called(type(D1, 'n71'), [type('ind', 'n71')])
called(type(E1, 'n70'), [type('ind', 'n70')])
called(type(F1, 'n69'), [type('ind', 'n69')])
called(type(G1, 'n68'), [type('ind', 'n68')])
called(type(H1, 'n67'), [type('ind', 'n67')])
called(type(I1, 'n66'), [type('ind', 'n66')])
called(type(J1, 'n65'), [type('ind', 'n65')])
called(type(K1, 'n64'), [type('ind', 'n64')])
called(type(L1, 'n63'), [type('ind', 'n63')])
called(type(M1, 'n62'), [type('ind', 'n62')])
called(type(N1, 'n61'), [type('ind', 'n61')])
called(type(O1, 'n60'), [type('ind', 'n60')])
called(type(P1, 'n59'), [type('ind', 'n59')])
called(type(Q1, 'n58'), [type('ind', 'n58')])
called(type(R1, 'n57'), [type('ind', 'n57')])
called(type(S1, 'n56'), [type('ind', 'n56')])
called(type(T1, 'n55'), [type('ind', 'n55')])
called(type(U1, 'n54'), [type('ind', 'n54')])
called(type(V1, 'n53'), [type('ind', 'n53')])
called(type(W1, 'n52'), [type('ind', 'n52')])
called(type(X1, 'n51'), [type('ind', 'n51')])
called(type(Y1, 'n50'), [type('ind', 'n50')])
called(type(Z1, 'n49'), [type('ind', 'n49')])
called(type(A2, 'n48'), [type('ind', 'n48')])
called(type(B2, 'n47'), [type('ind', 'n47')])
called(type(C2, 'n46'), [type('ind', 'n46')])
called(type(D2, 'n45'), [type('ind', 'n45')])
called(type(E2, 'n44'), [type('ind', 'n44')])
called(type(F2, 'n43'), [type('ind', 'n43')])
called(type(G2, 'n42'), [type('ind', 'n42')])
called(type(H2, 'n41'), [type('ind', 'n41')])
called(type(I2, 'n40'), [type('ind', 'n40')])
called(type(J2, 'n39'), [type('ind', 'n39')])
called(type(K2, 'n38'), [type('ind', 'n38')])
called(type(L2, 'n37'), [type('ind', 'n37')])
called(type(M2, 'n36'), [type('ind', 'n36')])
called(type(N2, 'n35'), [type('ind', 'n35')])
called(type(O2, 'n34'), [type('ind', 'n34')])
called(type(P2, 'n33'), [type('ind', 'n33')])
called(type(Q2, 'n32'), [type('ind', 'n32')])
called(type(R2, 'n31'), [type('ind', 'n31')])
called(type(S2, 'n30'), [type('ind', 'n30')])
called(type(T2, 'n29'), [type('ind', 'n29')])
called(type(U2, 'n28'), [type('ind', 'n28')])
called(type(V2, 'n27'), [type('ind', 'n27')])
called(type(W2, 'n26'), [type('ind', 'n26')])
called(type(X2, 'n25'), [type('ind', 'n25')])
called(type(Y2, 'n24'), [type('ind', 'n24')])
called(type(Z2, 'n23'), [type('ind', 'n23')])
called(type(A3, 'n22'), [type('ind', 'n22')])
called(type(B3, 'n21'), [type('ind', 'n21')])
called(type(C3, 'n20'), [type('ind', 'n20')])
called(type(D3, 'n19'), [type('ind', 'n19')])
called(type(E3, 'n18'), [type('ind', 'n18')])
called(type(F3, 'n17'), [type('ind', 'n17')])
called(type(G3, 'n16'), [type('ind', 'n16')])
called(type(H3, 'n15'), [type('ind', 'n15')])
called(type(I3, 'n14'), [type('ind', 'n14')])
called(type(J3, 'n13'), [type('ind', 'n13')])
called(type(K3, 'n12'), [type('ind', 'n12')])
called(type(L3, 'n11'), [type('ind', 'n11')])
called(type(M3, 'n10'), [type('ind', 'n10')])
called(type(N3, 'n9'), [type('ind', 'n9')])
called(type(O3, 'n8'), [type('ind', 'n8')])
called(type(P3, 'n7'), [type('ind', 'n7')])
called(type(Q3, 'n6'), [type('ind', 'n6')])
called(type(R3, 'n5'), [type('ind', 'n5')])
called(type(S3, 'n4'), [type('ind', 'n4')])
called(type(T3, 'n3'), [type('ind', 'n3')])
called(type(U3, 'n2'), [type('ind', 'n2')])
called(type(V3, 'n1'), [type('ind', 'n1')])
called(type(W3, 'n0'), [type('ind', 'n0')])
```

It has two parts:

- **The claim**: the one answer the proof is about.
- **The certificate**: one **call table** per question asked along the way.
  `called(Call, Answers)` says: *this call has exactly these answers*. The
  variable in each call (`A`, `B`, …, `W3`) is the unknown still open when
  the call was made; the tables name them in order.

A proof can also hold `step(...)` records, for facts that forward rules
derive. Every rule here is a backward rule, worked out only when asked, so
this proof has none.

The tables read from the question down to the fact:

1. *Which X are in `n100`? Exactly `ind`.* Rule 299 asks this of `n99`.
2. *Which X are in `n99`? Exactly `ind`.* Rule 296 asks this of `n98`.
3. ... and so on, one level at a time, each call made by the rule of the
   level above ...
4. *Which X are in `n0`? Exactly `ind`*: fact 1.

That is 101 tables: one per level, plus the starting fact. None of the dead
ends appear: no question ever calls the `i` and `j` categories, so the proof
contains only what the answer needs.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself. It answers the query by
applying the program's rules one level at a time, taking the answer of every
inner call from its table, and checks each of the 101 tables it consults the
same way, down to the fact. A wrong or missing table shows up as a
disagreement, and a table the check does not use fails it too. This is the
complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
type('ind', 'n100')

verdict('checked')
```

The verdict is **checked**: `ind` being in `n100` follows from the program,
and, as the comment says, it is every answer of the question: `ind` is the
only member of `n100`.

---

## One of a family

The same benchmark comes in five sizes:

| Example | Levels | Call tables |
| --- | --- | --- |
| deep-taxonomy-10 | 10 | 11 |
| deep-taxonomy-100 | 100 | 101 |
| deep-taxonomy-1000 | 1,000 | 1,001 |
| deep-taxonomy-10000 | 10,000 | 10,001 |
| deep-taxonomy-100000 | 100,000 | 100,001 |

The cost grows in a straight line with the depth: each level costs exactly
one inference and one call table. `--stats` reports 101 inferences for
this one.

---

## Try it

```sh
eyemind examples/deep-taxonomy-100.js
eyemind --stats examples/deep-taxonomy-100.js
eyemind --proof examples/deep-taxonomy-100.js
eyemind -c examples/deep-taxonomy-100.js
eyemind --check-proof examples/proof/deep-taxonomy-100.js examples/deep-taxonomy-100.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=deep-taxonomy-100).

Change the last line to `query(type(X, 'n50'))`: the answer becomes
`type('ind', 'n50')`, and `--stats` drops to 51 inferences. Change it to
`query(type(X, Class))` to ask for every class of `ind`: there are 301
answers, `n0` plus the three classes of each of the 100 levels, dead ends
included.

---

## Takeaway

A long chain of simple reasons is still simple to check. However deep the
taxonomy, the proof is exactly as long as the path, and every link in it can
be verified.
