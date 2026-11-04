# Witnesses

*When a rule creates something new, give it a name that says where it came from.*

[witnesses.js](https://github.com/eyereasoner/eyemind/blob/main/examples/witnesses.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/witnesses.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/witnesses.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/witnesses.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=witnesses)

---

## The question

Suppose a rule says: *every person has a record*. For Alice and Bob, that
means two records exist. But what are they called? And how do we keep each
record tied to its owner?

A name for something a rule brings into existence is called a *witness*: it
stands as evidence that the thing exists.

**Can we give each record a name that says which rule made it and for whom,
and state two facts about it at once?**

---

## What we tell eyemind

```js
fact(person('alice'))
fact(person('bob'))
implies(
  person(Name),
  [
    has_record(Name, record('person_rule', Name)),
    record_owner(record('person_rule', Name), Name),
  ],
)
```

`fact(...)` states something true: Alice and Bob are persons.
`implies(premise, conclusion)` is a forward rule: whenever the premise holds,
eyemind concludes the conclusion. `Name` is a variable, a placeholder that
stands for whichever person is found.

The conclusion is an array holding *two* facts, and a rule may conclude
several facts at once. Both mention the same term,
`record('person_rule', Name)`: a record labelled with the rule and the person
it was made for. That term is the witness. Because it is built from the
person's name, it is the same every time the rule fires for Alice, and
different for Bob.

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
has_record('alice', record('person_rule', 'alice'))
record_owner(record('person_rule', 'alice'), 'alice')
has_record('bob', record('person_rule', 'bob'))
record_owner(record('person_rule', 'bob'), 'bob')
```

The first line is a comment saying what follows. There is no `query`, so
eyemind lists every fact it derived: two per person. Alice's record is
`record('person_rule', 'alice')`: readable, the same from run to run, and
impossible to mix up with Bob's.

---

## Why not let eyemind invent names?

If a rule's conclusion mentions a variable its premise never fills in, say
`has_record(Name, R)`, eyemind invents a name for `R` itself. That invented
name is called a *Skolem term* and looks like `skolem(3, 'R', ['alice'])`:
*"the `R` that rule 3 made for Alice."* The checker then verifies, under C8,
that each such name is exactly the one that firing must produce.

Writing the witness out, as this program does, has the same effect with a
name you choose: it says which rule made it and for whom, it is stable
across runs, and firing the rule twice for Alice still gives one record, not
two. Because nothing is invented, there is nothing for C8 to check here.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
has_record('alice', record('person_rule', 'alice'))
record_owner(record('person_rule', 'alice'), 'alice')
has_record('bob', record('person_rule', 'bob'))
record_owner(record('person_rule', 'bob'), 'bob')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(person('alice')))
clause(2, fact(person('bob')))
clause(3, implies(person(Name), [has_record(Name, record('person_rule', Name)), record_owner(record('person_rule', Name), Name)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(has_record('alice', record('person_rule', 'alice')), clause(3), {Name: 'alice'}, [person('alice')])
step(person('alice'), clause(1), {}, [])
step(record_owner(record('person_rule', 'alice'), 'alice'), clause(3), {Name: 'alice'}, [person('alice')])
step(has_record('bob', record('person_rule', 'bob')), clause(3), {Name: 'bob'}, [person('bob')])
step(person('bob'), clause(2), {}, [])
step(record_owner(record('person_rule', 'bob'), 'bob'), clause(3), {Name: 'bob'}, [person('bob')])
```

It has three parts:

- **The claims**: the four conclusions the proof is about.
- **The clauses**: the two facts and the rule, numbered as in the program.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`.

Read the steps as sentences:

1. *Alice has the record `record('person_rule', 'alice')`* — by rule 3, with
   `Name` being Alice, because Alice is a person.
2. *Alice is a person* — fact 1; it uses nothing.
3. *That record's owner is Alice* — rule 3 again, with the same value for
   `Name`, because Alice is a person.
4. *Bob has the record `record('person_rule', 'bob')`* — by rule 3, with
   `Name` being Bob, because Bob is a person.
5. *Bob is a person* — fact 2; it uses nothing.
6. *That record's owner is Bob* — rule 3 again, same value, because Bob is a
   person.

The two facts a single firing concludes show up as two steps citing the same
rule with the same value for `Name`.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
has_record('alice', record('person_rule', 'alice'))
record_owner(record('person_rule', 'alice'), 'alice')
has_record('bob', record('person_rule', 'bob'))
record_owner(record('person_rule', 'bob'), 'bob')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 6)
condition('C2', 'well_founded', 'ok', 6)
condition('C3', 'justification', 'ok', 6)
condition('C4', 'coverage', 'ok', 8)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 10)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(6)
verified(6)
recomputed(0)
composed(0)
trusted(0)
claims(4)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (6)**: each of the 6 steps really is an instance of the
  rule or fact it cites: four are rule 3 (twice with `Name` = Alice, twice
  with Bob) and two are the facts.
- **C2 well-founded (6)**: no step depends on itself, even indirectly.
- **C3 justification (6)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (8)**: the 4 claims and the 4 things the steps use (each
  rule step uses one `person(...)` fact) are each backed by a step.
- **C5 re-decision (0)**: no arithmetic or other built-in calculation needed
  recomputing.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (10)**: the 4 claims are what the program derives, and all
  6 steps serve them.
- **C8 witness integrity (0)**: no invented Skolem names, because the
  program writes its witnesses out itself.

The statistics repeat this: 6 steps, all 6 verified against the program,
none taken on trust. The verdict is **checked**: all four facts follow from
the program. It does not say the program has no other conclusions.

---

## Try it

```sh
eyemind examples/witnesses.js            # the four facts
eyemind --proof examples/witnesses.js    # with their proof
```

Add `fact(person('carol'))`: two more facts appear, with the witness
`record('person_rule', 'carol')`. Add `fact(person('alice'))` a second time:
the output stays the same four facts, because Alice's record has one name.
Replace both `record('person_rule', Name)` with a bare variable `R`: eyemind
invents the names itself, `skolem(3, 'R', ['alice'])` and
`skolem(3, 'R', ['bob'])`, and the check report's C8 line now counts 4 such
names.
