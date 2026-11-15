# Variable Predicates

*One rule that renames many fields at once, driven by a small mapping table.*

[variable-predicates.js](https://github.com/eyereasoner/eyemind/blob/main/examples/variable-predicates.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/variable-predicates.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/variable-predicates.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/variable-predicates.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=variable-predicates)

---

## The question

Data often arrives with someone else's field names. A source system sends
Alice's record with fields called `source_name` and `source_age`; we want
them called `name` and `age`.

**Can we translate the field names with a lookup table, instead of writing
one rule per field, and still see where each translated value came from?**

---

## Facts as triples

Here every fact is a *triple*: a subject, a property, and a value.

```js
fact(t('alice', 'source_name', 'Alice'))
```

reads *alice has source_name 'Alice'*.

The trick is that the property in the middle is just data, so a rule can put
a variable there and treat the property name like any other value.

---

## What we tell eyemind

```js
// t(Subject, Property, Value) statements, and the source-to-target mapping.
fact(t('alice', 'source_name', 'Alice'))
fact(t('alice', 'source_age', 30))
fact(maps('source_name', 'name'))
fact(maps('source_age', 'age'))
implies([t(S, Source, O), maps(Source, Target)], t(S, Target, O))
query(t('alice', 'name', Name))
query(t('alice', 'age', Age))
```

- `fact(…)` states something plainly true: two fields of Alice's record, and
  two rows of the mapping table (`maps('source_name', 'name')` reads
  *source_name is renamed to name*).
- `implies(conditions, conclusion)` is a **forward rule**: whenever all the
  conditions in the square brackets hold, eyemind adds the conclusion.
- Capitalized names such as `S`, `Source`, `O` and `Target` are variables:
  placeholders that take whatever values make the rule fit. `Source` sits in
  the property position, so it can match any field name.
- `query(…)` asks a question; `Name` and `Age` are the blanks to fill in.

The rule reads: *if S has value O under the Source name, and Source maps to
Target, then S has value O under the Target name.* One rule covers every row
of the mapping table.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
t('alice', 'name', 'Alice')
t('alice', 'age', 30)
```

The first line is a comment saying what follows: the answers to the two
queries. Alice's name and age are now under the field names we wanted. The
original facts are left as they were.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. This is the
complete proof:

```js
// Answers: each instance of a query() that holds.
t('alice', 'name', 'Alice')
t('alice', 'age', 30)

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(t('alice', 'name', 'Alice'), clause(5), {S: 'alice', Source: 'source_name', O: 'Alice', Target: 'name'}, [t('alice', 'source_name', 'Alice'), maps('source_name', 'name')])
step(t('alice', 'source_name', 'Alice'), clause(1), {}, [])
step(t('alice', 'age', 30), clause(5), {S: 'alice', Source: 'source_age', O: 30, Target: 'age'}, [t('alice', 'source_age', 30), maps('source_age', 'age')])
step(t('alice', 'source_age', 30), clause(2), {}, [])

// Certificate: the derived facts and every answer of each call the questions make.
derived(t(A, B, C), [t('alice', 'name', 'Alice'), t('alice', 'age', 30)])
called(t('alice', 'name', A), [t('alice', 'name', 'Alice')])
called(t(B, C, D), [t('alice', 'name', 'Alice'), t('alice', 'age', 30), t('alice', 'source_name', 'Alice'), t('alice', 'source_age', 30)])
called(t('alice', 'age', E), [t('alice', 'age', 30)])
```

It has three parts:

- **The claims**: the two answers the proof is about.
- **The steps**: one per derived fact, and for each use of `t` the rule
  rests on. A step reads
  `step(what, by which clause, with which values, using what)`. Clauses are
  numbered in program order: the four facts 1 to 4 and the rule as clause 5.
- **The certificate**: the *listing* `derived(t(A, B, C), ...)` of every `t`
  fact the rule derived, and three *call tables*, each with every answer of
  its call: the two queries, and the call `t(S, Source, O)` the rule's body
  makes when the checker closes the listing.

Read the lines as sentences:

1. *alice has name 'Alice'* — by rule 5, with `S` = alice, `Source` =
   source_name, `O` = 'Alice' and `Target` = name, because alice has
   source_name 'Alice' and source_name maps to name.
2. *alice has source_name 'Alice'* — fact 1. It gets a step because the rule
   concludes `t` facts, so a `t` goal it uses is followed to how it was
   established. `maps` comes only from facts, so it needs no step.
3. *alice has age 30* — by rule 5 again, now with `Source` = source_age and
   `Target` = age, because alice has source_age 30 and source_age maps to
   age.
4. *alice has source_age 30* — fact 2.
5. *The rule derived exactly two `t` facts*, and *each query has exactly one
   answer*. The table for `t(B, C, D)` lists all four `t` facts: the two
   derived ones first, then the two stated ones.

The values in steps 1 and 3 show which mapping row produced each answer.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure. It
answers each query one level against the program: the listed facts, then
facts 1 and 2. It checks that the listing is closed: applying rule 5 to
every `t` fact in the table for `t(B, C, D)` and every mapping gives only
the two listed facts, because no mapping applies to `name` or `age`. It
replays each listed fact, re-running rule 5 from scratch against its step;
filling it with the values of step 1 gives exactly *alice has name 'Alice'*.
Finally the claims must be exactly the answers, and every step, listing and
table must have been used. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
t('alice', 'name', 'Alice')
t('alice', 'age', 30)

verdict('checked')
```

The verdict is **checked**: both answers follow from the program, and they
are every answer of the original questions.

---

## Try it

```sh
eyemind examples/variable-predicates.js            # the answers
eyemind --proof examples/variable-predicates.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=variable-predicates).
Add a new field and a mapping row, `fact(t('alice', 'source_city', 'Gent'))`
and `fact(maps('source_city', 'city'))`, plus the question
`query(t('alice', 'city', _))`. The same rule answers
`t('alice', 'city', 'Gent')`. Or add a second person,
`fact(t('bob', 'source_age', 41))`, and ask `t(Who, 'age', Age)` with
`--goal`: the answers are Alice's 30 and Bob's 41, from the same mapping row.

---

## Takeaway

When relation names are data, one general rule plus a table can replace a
pile of special cases — and the proof still tells you exactly which table
row was used.
