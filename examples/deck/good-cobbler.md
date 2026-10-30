# The Good Cobbler

*"Good at what?" A small lesson in not over-generalising.*

[good-cobbler.js](https://github.com/eyereasoner/eyelit/blob/main/examples/good-cobbler.js) · [output](https://github.com/eyereasoner/eyelit/blob/main/examples/output/good-cobbler.js) · [proof](https://github.com/eyereasoner/eyelit/blob/main/examples/proof/good-cobbler.js) · [check](https://github.com/eyereasoner/eyelit/blob/main/examples/check/good-cobbler.js) · [try it in the playground](https://eyereasoner.github.io/eyelit/playground/#example=good-cobbler)

---

## The question

Joe is a good cobbler. Does that make Joe a good person? Not necessarily.
"Good" here describes how he does his trade, not him in general.

Philosophers use this example to show that some words only make sense
together with the word they describe.

**Given short descriptions of three people, what can we safely conclude?**

---

## What we tell eyelit

Each person comes with a description, kept as a short list of words:

```js
fact(description('joe', ['good', 'cobbler']))
fact(description('jane', ['good', 'carpenter']))
fact(description('sam', ['novice', 'cobbler']))
implies(description(Person, ['good', Trade]), good_at(Person, Trade))
implies(description(Person, ['good', Trade]), classified_as(Person, Trade))
```

The rules only fire on the pattern `['good', Trade]`, and they tie "good" to
that trade. There is deliberately no rule that says someone is simply
`'good'`.

---

## What eyelit concludes

```js
good_at('joe', 'cobbler')
good_at('jane', 'carpenter')
classified_as('joe', 'cobbler')
classified_as('jane', 'carpenter')
```

- Joe is good at cobbling; Jane is good at carpentry.
- Sam is described as a *novice* cobbler, so nothing is concluded about him.
- And nowhere does it say anyone is "good" on its own.

---

## Why: the proof in plain words

Each conclusion traces back to one description:

1. Joe is good at cobbling — *the `good_at` rule, with Person = 'joe',
   Trade = 'cobbler'*, because of the fact
   `description('joe', ['good', 'cobbler'])`.
2. Joe is classified as a cobbler — *the `classified_as` rule*, from the
   same fact.
3. The same two steps for Jane, from her own description.

Six steps in all: four conclusions and the two facts they rest on.

---

## Checked, not just claimed

A separate checker read the proof against the program and confirmed that:

- every step is an exact instance of the rule or fact it cites;
- every conclusion rests on a description we actually gave;
- the proof answers the questions asked and contains nothing extra.

Verdict: **checked**. All 6 steps verified, nothing taken on trust.

---

## Try it

```sh
eyelit examples/good-cobbler.js
eyelit --proof examples/good-cobbler.js
```

Or open it in the [playground](https://eyereasoner.github.io/eyelit/playground/#example=good-cobbler).
Add `fact(description('ann', ['good', 'baker']))` and run again: Ann is now
good at baking and classified as a baker, with her own proof.

---

## Takeaway

What a computer concludes depends on exactly how the knowledge is written.
Keeping "good" attached to the trade stops the program from claiming more
than the facts say, and the proof shows it never did.
