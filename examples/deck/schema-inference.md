# Schema Inference

*A few general statements about categories and relations, and the facts that follow from them.*

[schema-inference.js](https://github.com/eyereasoner/eyemind/blob/main/examples/schema-inference.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/schema-inference.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/schema-inference.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/schema-inference.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=schema-inference)

---

## The question

Data on the web often comes with a *schema*: general statements about what
the data means. "Every cat is a mammal." "If someone is a parent of
someone, they are related." "Only people can be parents."

Given a schema and two plain facts (Koko is a cat; Alice is Bob's parent),
a reasoner can fill in facts nobody stated. Each of them should be traceable
to the statements it came from.

**What else can we safely conclude?**

---

## Four kinds of schema statement

- **Subclass**: every member of one category is in another. Every cat is a
  mammal.
- **Subproperty**: one relation implies a broader one. Being a `parent_of`
  someone is a way of being `related_to` them.
- **Domain**: whoever is *on the left* of a relation is of some kind.
  Whoever is a `parent_of` someone is a person.
- **Range** (here called `codomain`): whoever is *on the right* is of some
  kind. Whoever has a parent is a person.

These are the core ideas of RDF Schema, the schema language of the web's
data model, written here as ordinary rules.

---

## What we tell eyemind

```js
// The schema: class and property hierarchies, and the class of the subject
// (domain) and of the object (codomain) of parent_of.
fact(subclass('cat', 'mammal'))
fact(subclass('mammal', 'animal'))
fact(subproperty('parent_of', 'related_to'))
fact(domain('parent_of', 'person'))
fact(codomain('parent_of', 'person'))
// The data: a typed individual and one relationship, written as a triple.
fact(type('koko', 'cat'))
fact(triple('alice', 'parent_of', 'bob'))
// Subclass is transitive, and a member of a class is a member of its superclasses.
implies([subclass(A, B), subclass(B, C)], subclass(A, C))
implies([type(X, A), subclass(A, B)], type(X, B))
// A relationship also holds under every broader property.
implies([triple(S, P, O), subproperty(P, Q)], triple(S, Q, O))
// Using a property classifies its subject and its object.
implies([triple(S, P, _), domain(P, Class)], type(S, Class))
implies([triple(_, P, O), codomain(P, Class)], type(O, Class))
```

- The seven `fact` lines are the schema and the data. A relationship is
  written as a triple: subject, property, object, so
  `triple('alice', 'parent_of', 'bob')` reads "Alice is a parent of Bob", and
  `type('koko', 'cat')` reads "Koko is a cat".
- Capitalized names such as `A`, `X` and `Class` are variables, placeholders
  for any value; `_` means "anything, we don't care what".
- `implies(premise, conclusion)` is a forward rule: whenever the premise
  holds, conclude the conclusion. The premise is a list in square brackets,
  all of which must hold. eyemind keeps applying the rules until nothing new
  follows.
- The five rules, in order: subclasses chain (line 8); members of a class
  are members of its superclasses (9); relations hold under broader ones
  (10); the domain classifies the subject (11); the range classifies the
  object (12).

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
subclass('cat', 'animal')
type('koko', 'animal')
type('koko', 'mammal')
triple('alice', 'related_to', 'bob')
type('alice', 'person')
type('bob', 'person')
```

No question is asked, so eyemind lists every new fact, six in all, none of
them typed in:

- cats are animals, so Koko is a mammal *and* an animal;
- Alice is related to Bob;
- both Alice and Bob are people: nobody said so directly.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
subclass('cat', 'animal')
type('koko', 'animal')
type('koko', 'mammal')
triple('alice', 'related_to', 'bob')
type('alice', 'person')
type('bob', 'person')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(subclass('cat', 'mammal')))
clause(2, fact(subclass('mammal', 'animal')))
clause(3, fact(subproperty('parent_of', 'related_to')))
clause(4, fact(domain('parent_of', 'person')))
clause(5, fact(codomain('parent_of', 'person')))
clause(6, fact(type('koko', 'cat')))
clause(7, fact(triple('alice', 'parent_of', 'bob')))
clause(8, implies([subclass(A, B), subclass(B, C)], subclass(A, C)))
clause(9, implies([type(X, A), subclass(A, B)], type(X, B)))
clause(10, implies([triple(S, P, O), subproperty(P, Q)], triple(S, Q, O)))
clause(11, implies([triple(S, P, _0), domain(P, Class)], type(S, Class)))
clause(12, implies([triple(_0, P, O), codomain(P, Class)], type(O, Class)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(subclass('cat', 'animal'), clause(8), {A: 'cat', B: 'mammal', C: 'animal'}, [subclass('cat', 'mammal'), subclass('mammal', 'animal')])
step(subclass('cat', 'mammal'), clause(1), {}, [])
step(subclass('mammal', 'animal'), clause(2), {}, [])
step(type('koko', 'animal'), clause(9), {X: 'koko', A: 'cat', B: 'animal'}, [type('koko', 'cat'), subclass('cat', 'animal')])
step(type('koko', 'cat'), clause(6), {}, [])
step(type('koko', 'mammal'), clause(9), {X: 'koko', A: 'cat', B: 'mammal'}, [type('koko', 'cat'), subclass('cat', 'mammal')])
step(triple('alice', 'related_to', 'bob'), clause(10), {S: 'alice', P: 'parent_of', O: 'bob', Q: 'related_to'}, [triple('alice', 'parent_of', 'bob'), subproperty('parent_of', 'related_to')])
step(triple('alice', 'parent_of', 'bob'), clause(7), {}, [])
step(subproperty('parent_of', 'related_to'), clause(3), {}, [])
step(type('alice', 'person'), clause(11), {S: 'alice', P: 'parent_of', _0: 'bob', Class: 'person'}, [triple('alice', 'parent_of', 'bob'), domain('parent_of', 'person')])
step(domain('parent_of', 'person'), clause(4), {}, [])
step(type('bob', 'person'), clause(12), {_0: 'alice', P: 'parent_of', O: 'bob', Class: 'person'}, [triple('alice', 'parent_of', 'bob'), codomain('parent_of', 'person')])
step(codomain('parent_of', 'person'), clause(5), {}, [])
```

It has three parts:

- **The claims**: the six conclusions the proof is about.
- **The clauses**: every line of the program, numbered 1 to 12 in order; all
  of them are needed. The `_` of the program is shown as `_0`, so that it
  can be given a value like any other variable.
- **The steps**: one per thing established. A step reads
  `step(what, by which clause, with which values, using what)`. The values
  in curly braces say what each variable of the cited rule stood for.

Read the steps as sentences:

1. *Every cat is an animal* — by rule 8, with `A` = cat, `B` = mammal and
   `C` = animal, because every cat is a mammal and every mammal an animal.
2. *Every cat is a mammal* — fact 1.
3. *Every mammal is an animal* — fact 2.
4. *Koko is an animal* — by rule 9, because Koko is a cat and every cat is
   an animal (step 1: one conclusion feeds the next).
5. *Koko is a cat* — fact 6.
6. *Koko is a mammal* — by rule 9, because Koko is a cat and every cat is a
   mammal.
7. *Alice is related to Bob* — by rule 10, because Alice is a parent of Bob
   and `parent_of` is a kind of `related_to`.
8. *Alice is a parent of Bob* — fact 7.
9. *`parent_of` is a kind of `related_to`* — fact 3.
10. *Alice is a person* — by rule 11, because Alice is a parent of someone
    (Bob fills the `_0`) and whoever is a parent is a person.
11. *Whoever is a parent is a person* — fact 4.
12. *Bob is a person* — by rule 12, because someone (Alice fills the `_0`) is
    a parent of Bob and whoever has a parent is a person.
13. *Whoever has a parent is a person* — fact 5.

Facts already shown are not repeated: step 6 reuses steps 2 and 5, and steps
10 and 12 reuse step 8.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
subclass('cat', 'animal')
type('koko', 'animal')
type('koko', 'mammal')
triple('alice', 'related_to', 'bob')
type('alice', 'person')
type('bob', 'person')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 13)
condition('C2', 'well_founded', 'ok', 13)
condition('C3', 'justification', 'ok', 13)
condition('C4', 'coverage', 'ok', 18)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 19)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(13)
verified(13)
recomputed(0)
composed(0)
trusted(0)
claims(6)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (13)**: each of the 13 steps really is an instance of the
  rule or fact it cites, with the values shown.
- **C2 well-founded (13)**: no step depends on itself, even indirectly.
- **C3 justification (13)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (18)**: the 6 claims and the 12 things the six rule steps
  use (two each) are each backed by a step.
- **C5 re-decision (0)**: there was no calculation to redo.
- **C6 boundary consistency (0)**: nothing was concluded from the absence of
  a fact, so there is nothing to confront.
- **C7 relevance (19)**: the 6 claims are conclusions of the program, and all
  13 steps serve them. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics: 13 steps, all 13 verified against the program, none taken
on trust, 6 claims. The verdict is **checked**: all six conclusions follow
from the program. As the last comment says, this confirms the claims; it does
not say the program has no other conclusions.

---

## Try it

```sh
eyemind examples/schema-inference.js            # the new facts
eyemind --proof examples/schema-inference.js    # with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=schema-inference).

Add `fact(triple('bob', 'parent_of', 'carol'))` and run again: Bob becomes
related to Carol, and Carol is concluded to be a person. Or add
`fact(subclass('animal', 'living_thing'))`: the subclass rule chains further,
and Koko becomes a living thing too.

---

## Takeaway

A schema says a lot in a few lines. eyemind spells out what it implies, and
every implied fact comes with the exact statements that support it — so a
surprising conclusion can be traced to the schema line that caused it.
