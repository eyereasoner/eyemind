# Witnesses

*When a rule creates something new, give it a name that says where it came from.*

[witnesses.js](https://github.com/eyereasoner/eyemind/blob/main/examples/witnesses.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/witnesses.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/witnesses.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/witnesses.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=witnesses)

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
*"the `R` that rule 3 made for Alice."* When it replays the firing, the checker
recomputes each such name and requires exactly the one that firing must
produce.

Writing the witness out, as this program does, has the same effect with a
name you choose: it says which rule made it and for whom, it is stable
across runs, and firing the rule twice for Alice still gives one record, not
two. Because nothing is invented, the checker has no Skolem term to recompute
here.

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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(has_record('alice', record('person_rule', 'alice')), clause(3), {Name: 'alice'}, [person('alice')])
step(has_record('bob', record('person_rule', 'bob')), clause(3), {Name: 'bob'}, [person('bob')])
step(record_owner(record('person_rule', 'alice'), 'alice'), clause(3), {Name: 'alice'}, [person('alice')])
step(record_owner(record('person_rule', 'bob'), 'bob'), clause(3), {Name: 'bob'}, [person('bob')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(has_record(A, B), [has_record('alice', record('person_rule', 'alice')), has_record('bob', record('person_rule', 'bob'))])
derived(record_owner(A, B), [record_owner(record('person_rule', 'alice'), 'alice'), record_owner(record('person_rule', 'bob'), 'bob')])
called(has_record(A, record('person_rule', A)), [has_record('alice', record('person_rule', 'alice')), has_record('bob', record('person_rule', 'bob'))])
called(record_owner(record('person_rule', B), B), [record_owner(record('person_rule', 'alice'), 'alice'), record_owner(record('person_rule', 'bob'), 'bob')])
```

It has three parts:

- **The claims**: the four conclusions the proof is about.
- **The steps**: one per derived fact. A step reads
  `step(what, by which clause, with which values, using what)`; clause 3 is
  the rule, after the two facts.
- **The certificate**: a *listing*, `derived(...)`, of every fact the rule
  derived for each of its two relations, and a *call table*, `called(...)`,
  for each original question. With no `query()`, the questions are the
  rule's two heads, `has_record(Name, record('person_rule', Name))` and
  `record_owner(record('person_rule', Name), Name)`, with their variables
  renamed.

Read the steps as sentences:

1. *Alice has the record `record('person_rule', 'alice')`* — by rule 3, with
   `Name` being Alice, because Alice is a person.
2. *Bob has the record `record('person_rule', 'bob')`* — by rule 3, with
   `Name` being Bob, because Bob is a person.
3. *That first record's owner is Alice* — rule 3 again, with the same value
   for `Name`, because Alice is a person.
4. *That second record's owner is Bob* — rule 3 again, same value, because
   Bob is a person.

The two facts a single firing concludes show up as two steps citing the same
rule with the same value for `Name`. `person` comes only from stated facts,
so the program itself answers those uses and they need no steps of their
own.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure. It
answers each question one level against the program, which gives exactly
the two answers of each call table. It checks that both listings are closed:
firing rule 3 for each person gives only listed facts. It replays each
listed fact from scratch against its step: `person(Name)` is answered from
facts 1 and 2, and the heads come out exactly as recorded. Finally, the
claims must be exactly the answers, and every step, listing and table must
have been used. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
has_record('alice', record('person_rule', 'alice'))
record_owner(record('person_rule', 'alice'), 'alice')
has_record('bob', record('person_rule', 'bob'))
record_owner(record('person_rule', 'bob'), 'bob')

verdict('checked')
```

The verdict is **checked**: all four facts follow from the program, and they
are every answer of the original questions.

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
`skolem(3, 'R', ['bob'])`, which the checker recomputes from `Name` when
it replays each firing.

---

## Takeaway

A good name carries its own history. By building the witness from the rule
and the binding, every new thing eyemind concludes can be traced to where it
came from — even before you look at the proof.
