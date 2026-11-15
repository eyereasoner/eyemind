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

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(found(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))), clause(5), {G: graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), T: triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))}, [quoted(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])), includes(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))))])
step(witness(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])])), clause(6), {X: graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), W: skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])])}, [quoted(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(found(A), [found(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))))])
derived(witness(A, B), [witness(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])]))])
called(found(A), [found(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))))])
called(includes(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), B), [includes(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))))])
called(member_of(C, [triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), [member_of(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))), [triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])])
called(member_of(D, []), [])
called(witness(E, F), [witness(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])]))])
```

The lines are long because the whole triple is written out each time. It has
three parts:

- **The claims**: the two conclusions the proof is about.
- **The steps**: one per derived fact. A step reads
  `step(what, by which clause, with which values, using what)`, citing a
  program line by its place in the program. The values in curly braces say
  what each variable of the cited line stood for.
- **The certificate**: a *listing*, `derived(...)`, of the facts each forward
  rule derived, and the *call tables*, `called(call, answers)`, each with
  every answer of that call. With no `query()`, the questions are the forward
  rules' heads, `found(T)` and `witness(X, W)`; the tables in between answer
  the calls rule 5 makes to `includes` and `member_of`.

Write *the graph* for the quoted graph and *the triple* for the "hello"
triple, and the lines read:

1. *The triple is found* — by rule 5, with `G` = the graph and `T` = the
   triple, because the graph is quoted and includes the triple.
2. *There is a witness for the graph, named `skolem(6, 'W', [the graph])`* —
   by rule 6, with `X` = the graph and `W` = that invented name, because the
   graph is quoted.
3. *The graph includes exactly one triple, the triple* — the table for
   `includes(the graph, B)`, answered by rule 4 from the table below it.
4. *The triple is the only member of the graph's list* — the first item
   matches line 2 of the program, and line 3 looks in the rest of the list,
   `[]`, which has no members: its table is empty.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms the proof against them in one procedure:

- **It answers the questions from the tables.** It expands each call one
  level against the program, answering inner calls from their own tables, and
  requires the result to equal the table: `member_of(D, [])` matches no line,
  so its empty table is right.
- **It checks the listings are closed.** Firing rules 5 and 6 on everything
  known gives only the listed facts.
- **It replays each listed fact.** It re-runs each rule from scratch against
  its step. For step 2 it rebuilds `skolem(6, 'W', [the graph])` itself from
  rule 6 and the graph, and the name matches; a proof could not slip in some
  other name there.
- **It compares the claims with the answers.** Every claim is an answer and
  every answer is claimed; every step, listing and table was used.

This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
found(triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en'))))
witness(graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))]), skolem(6, 'W', [graph([triple(iri('https://example.org/s'), iri('https://example.org/p'), literal('hello', lang('en')))])]))

verdict('checked')
```

The verdict is **checked**: both conclusions follow from the program, and
they are every answer of the original questions.

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
