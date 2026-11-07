# Terms

*Web data, quoted statements and invented names, without any new syntax.*

[terms.js](https://github.com/eyereasoner/eyemind/blob/main/examples/terms.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/terms.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/terms.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/terms.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=terms)

---

## The question

Data on the web (the **Semantic Web**, with its data model RDF) is made of
small statements called **triples**: *subject, predicate, object*, such as
"this page, has title, hello". Names are web addresses (**IRIs**), and text
can carry a language tag ("hello", in English).

Sometimes you also want to talk *about* a group of statements without
claiming they are true: a **quoted graph**, like quoting someone's words.

**Can a small rule language handle all this without special features, and
what does it conclude about the quoted graph?**

---

## What we tell eyemind: the data

Everything is written as ordinary nested terms, names with parts in
brackets:

```js
fact(
  quoted(
    graph(
      [
        triple(
          iri('https://example.org/s'),
          iri('https://example.org/p'),
          literal('hello', lang('en')),
        ),
      ],
    ),
  ),
)
```

Read from the inside out:

- `iri(...)`: a web address used as a name;
- `literal('hello', lang('en'))`: the text "hello", tagged as English;
- `triple(S, P, O)`: one statement;
- `graph([...])`: a list of statements, in square brackets;
- `quoted(...)`: the graph is held as a quotation, as data, not asserted.

---

## What we tell eyemind: the rules

```js
// List membership, and a triple's membership of a graph.
fact(member_of(X, [X, ..._]))
implied_by(member_of(X, [_, ...Xs]), member_of(X, Xs))
implied_by(includes(graph(Triples), Triple), member_of(Triple, Triples))
implies([quoted(G), includes(G, T)], found(T))
// W occurs only in the head: one fresh Skolem term per quoted graph.
implies(quoted(X), witness(X, W))
```

- Capitalized names such as `X`, `G` and `T` are variables, placeholders for
  any value; `_` means "anything, we don't care what". `[X, ..._]` is a list
  whose first item is `X`, followed by anything.
- `member_of` finds an item in a list: an item is a member if it comes first
  (the fact), or if it is a member of the rest (the rule).
  `implied_by(conclusion, premise)` is a backward rule, used on demand.
- `includes` looks inside a graph: a graph includes a triple if the triple
  is a member of its list.
- `implies(premise, conclusion)` is a forward rule: whenever the premise
  holds, conclude the conclusion. A premise in square brackets needs all its
  parts. `found` lists every triple inside a quoted graph.
- `witness` has a `W` that the rule never fills in: it states that
  *something* exists for each quoted graph. See the next card.

Rules match these terms by *unification*: lining two terms up part by part
and filling in variables so they become equal. That works for web data as
for any other data; eyemind has no special support for it.

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
found(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))))
witness(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])]))
```

The program has no query, so eyemind lists every fact it derived.

- The one triple inside the quotation has been found. It is *found*, not
  asserted as true: the quotation stays data.
- The `witness` names the quoted graph and, in place of `W`, a new name:
  `skolem(6, 'W', [the graph])`.

---

## Naming what a rule says exists

The `witness` rule says: *for every quoted graph `X`, there is some `W`*. It
never says which. To write a conclusion down, eyemind needs a name for that
something, so it makes one up: a **Skolem term** (named after the logician
Thoralf Skolem).

`skolem(6, 'W', [the graph])` is built from three parts:

- `6`, the number of the rule that says the thing exists (the sixth line of
  the program);
- `'W'`, the name of the variable it stands for;
- `[the graph]`, the values the rule was used with, here the quoted graph.

So it reads *"the `W` that rule 6 says exists for this graph"*. The same rule
used for the same graph always gives the same name, and a different graph
would give a different one. That is why a checker can recompute it.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
found(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))))
witness(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])]))

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(quoted(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]))))
clause(2, fact(member_of(X, [X, ..._0])))
clause(4, implied_by(includes(graph(Triples), Triple), member_of(Triple, Triples)))
clause(5, implies([quoted(G), includes(G, T)], found(T)))
clause(6, implies(quoted(X), witness(X, W)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(found(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))), clause(5), {G: graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), T: triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))}, [quoted(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])), includes(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))))])
step(quoted(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])), clause(1), {}, [])
step(includes(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))), clause(4), {Triples: [triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))], Triple: triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))}, [member_of(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))), [triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])])
step(member_of(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))), [triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), clause(2), {X: triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))), _0: []}, [])
step(witness(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])])), clause(6), {X: graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), W: skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])])}, [quoted(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]))])
```

The lines are long because the whole triple is written out each time. It has
three parts:

- **The claims**: the two conclusions the proof is about.
- **The clauses**: the program lines the steps cite, numbered by their place
  in the program. Line 3 (the second `member_of` line) is not needed, because
  the triple is the first item of its list. The `_` of the program is shown
  as `_0`, so it can be given a value like any other variable.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`. The values in curly
  braces say what each variable of the cited line stood for.

Write *the graph* for the quoted graph and *the triple* for the "hello"
triple, and the steps read:

1. *The triple is found* — by rule 5, with `G` = the graph and `T` = the
   triple, because the graph is quoted and includes the triple.
2. *The graph is quoted* — fact 1.
3. *The graph includes the triple* — by rule 4, because the triple is a
   member of the graph's list.
4. *The triple is a member of that list* — fact 2: it is the first item, and
   the rest of the list (`_0`) is empty, `[]`.
5. *There is a witness for the graph, named `skolem(6, 'W', [the graph])`* —
   by rule 6, with `X` = the graph and `W` = that invented name, because the
   graph is quoted (step 2, reused).

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
found(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))))
witness(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])]))

// C1-C9: resolution, acyclicity, justification, coverage, re-decision,
// boundary consistency, relevance, witness integrity and search closure.
condition('C1', 'resolution', 'ok', 5)
condition('C2', 'well_founded', 'ok', 5)
condition('C3', 'justification', 'ok', 5)
condition('C4', 'coverage', 'ok', 6)
condition('C5', 're_decision', 'ok', 0)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 7)
condition('C8', 'witness_integrity', 'ok', 1)
condition('C9', 'search_closure', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(5)
verified(5)
recomputed(0)
composed(0)
trusted(0)
claims(2)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (5)**: each of the 5 steps really is an instance of the
  program line it cites, with the values shown.
- **C2 well-founded (5)**: no step depends on itself, even indirectly.
- **C3 justification (5)**: every step says how it was justified, in a form
  the checker understands.
- **C4 coverage (6)**: the 2 claims and the 4 things the steps use are each
  backed by a step.
- **C5 re-decision (0)**: there was no calculation to redo.
- **C6 boundary consistency (0)**: nothing was concluded from the absence of
  a fact, so there is nothing to confront.
- **C7 relevance (7)**: the 2 claims are conclusions of the program, and all
  5 steps serve them.
- **C8 witness integrity (1)**: the 1 firing of a rule that invents a name
  (step 5) uses exactly the name that firing must produce. The checker
  rebuilt `skolem(6, 'W', [the graph])` itself from rule 6 and the graph, and
  it matches; a proof could not slip in some other name there.
- **C9 search closure (0)**: there was no absence or collection to
  settle, so no search certificate to check.

The statistics: 5 steps, all 5 verified against the program, none taken on
trust, 2 claims. The verdict is **checked**: both conclusions follow from the
program. As the last comment says, this confirms the claims; it does not say
the program has no other conclusions.

---

## Try it

```sh
eyemind examples/terms.js            # the answers
eyemind --proof examples/terms.js    # answers with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=terms).
Add a second triple to the list, for example
`triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hallo', lang('nl')))`,
and run again: two `found` lines appear, one for "hello" in English and one
for "hallo" in Dutch. There is still one `witness`, because there is still
one quoted graph, but its Skolem term now holds the larger graph.

---

## Takeaway

Web addresses, language-tagged text, statements and quotations all fit into
plain terms, so the same simple, checkable reasoning works on them.
