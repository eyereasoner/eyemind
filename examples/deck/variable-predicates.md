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

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(t('alice', 'source_name', 'Alice')))
clause(2, fact(t('alice', 'source_age', 30)))
clause(3, fact(maps('source_name', 'name')))
clause(4, fact(maps('source_age', 'age')))
clause(5, implies([t(S, Source, O), maps(Source, Target)], t(S, Target, O)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(t('alice', 'name', 'Alice'), clause(5), {S: 'alice', Source: 'source_name', O: 'Alice', Target: 'name'}, [t('alice', 'source_name', 'Alice'), maps('source_name', 'name')])
step(t('alice', 'source_name', 'Alice'), clause(1), {}, [])
step(maps('source_name', 'name'), clause(3), {}, [])
step(t('alice', 'age', 30), clause(5), {S: 'alice', Source: 'source_age', O: 30, Target: 'age'}, [t('alice', 'source_age', 30), maps('source_age', 'age')])
step(t('alice', 'source_age', 30), clause(2), {}, [])
step(maps('source_age', 'age'), clause(4), {}, [])
```

It has three parts:

- **The claims**: the two answers the proof is about.
- **The clauses**: the program's four facts and one rule, numbered 1 to 5 in
  the order they appear in the program.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *alice has name 'Alice'* — by rule 5, with `S` = alice, `Source` =
   source_name, `O` = 'Alice' and `Target` = name, because alice has
   source_name 'Alice' and source_name maps to name.
2. *alice has source_name 'Alice'* — fact 1; it uses nothing.
3. *source_name maps to name* — fact 3; it uses nothing.
4. *alice has age 30* — by rule 5 again, now with `Source` = source_age and
   `Target` = age, because alice has source_age 30 and source_age maps to
   age.
5. *alice has source_age 30* — fact 2; it uses nothing.
6. *source_age maps to age* — fact 4; it uses nothing.

The values in steps 1 and 4 show which mapping row produced each answer.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
t('alice', 'name', 'Alice')
t('alice', 'age', 30)

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 6)
condition('C2', 'well_founded', 'ok', 6)
condition('C3', 'justification', 'ok', 6)
condition('C4', 'coverage', 'ok', 6)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 8)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(6)
verified(6)
recomputed(0)
composed(0)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (6)**: each of the 6 steps really is an instance of the
  rule or fact it cites; filling rule 5 with the values of step 1 gives
  exactly *alice has name 'Alice'* from the two facts it uses.
- **C2 well-founded (6)**: no step depends on itself, even indirectly.
- **C3 justification (6)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (6)**: the 2 claims and the 4 facts the two rule steps use
  are each backed by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (8)**: the 2 claims answer the two queries, and all 6 steps
  serve them.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 6 steps, all 6 verified against the program,
none taken on trust. The verdict is **checked**: both answers follow from the
program. It confirms them; it does not say there are no other answers.

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
