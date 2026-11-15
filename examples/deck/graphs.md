# Graphs

*Who is a child of whom, who is allowed, and how a "no" is handled honestly.*

[graphs.js](https://github.com/eyereasoner/eyemind/blob/main/examples/graphs.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/graphs.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/graphs.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/graphs.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=graphs)

---

## The question

We have a small family record from an outside source, which we may read but
not change: Alice is the parent of Bob and of Carol, and Bob is blocked (say,
from some service).

- **Who is a child of Alice?**
- **Which of Alice's children are allowed**, that is, not blocked?
- **What is the full list of Alice's children?**

The last two need something new: saying "not" and saying "all".

---

## What we tell eyemind

The data is written as *triples*: subject, relation, object.

```js
fact(base('alice', 'parent_of', 'bob'))
fact(base('alice', 'parent_of', 'carol'))
fact(base('bob', 'blocked', 'true'))
// Every base triple is also a t triple.
implied_by(t(S, P, O), base(S, P, O))
implies(t(P, 'parent_of', C), t(C, 'child_of', P))
implies([t(C, 'child_of', 'alice'), not(t(C, 'blocked', 'true'))], allowed(C))
implies(
  [base(P, 'parent_of', _), findall_sorted(C, t(C, 'child_of', P), Children)],
  children(P, Children),
)
```

- `base` holds the outside data, left untouched. `t` is a combined view: every
  `base` triple, plus the triples the rules derive.
- Capitalized names such as `S`, `P` and `C` are variables, placeholders for
  any value; `_` means "anything, we don't care what".
- `implied_by(conclusion, premise)` is a backward rule, used on demand: a `t`
  triple holds if the same `base` triple holds.
- `implies(premise, conclusion)` is a forward rule: whenever the premise
  holds, conclude the conclusion. A premise in square brackets needs all of
  its parts.
- The second rule turns every *parent of* into a *child of*.
- The third rule uses `not(...)`: Carol is allowed if she is a child of Alice
  **and** eyemind cannot find that she is blocked.
- The fourth rule uses `findall_sorted(C, ..., Children)`: it **collects**
  every `C` that is a child of `P` into one list, `Children`, sorted in the
  standard order of terms (here, alphabetically).

---

## What eyemind concludes

```js
// Conclusions: the facts the program derives, in the order derived.
t('bob', 'child_of', 'alice')
t('carol', 'child_of', 'alice')
allowed('carol')
children('alice', ['bob', 'carol'])
```

The program has no query, so eyemind lists every fact it derived. Bob and
Carol are Alice's children. Only Carol is allowed, because Bob is blocked.
And the list of Alice's children is `['bob', 'carol']`.

---

## Two claims about what is missing

`not` and `findall_sorted` are claims about what is *missing*:

- **"Carol is not blocked"** is concluded because eyemind searched everything
  it knows and found nothing. That is an **absence**, and a proof cannot point
  at an absence the way it points at a fact.
- **"The children are exactly Bob and Carol"** says the list is *complete*.
  Each name in it can be proven; that no one is missing cannot. That is a
  **collection**.

eyemind does not hide this. Its proof ends with a **certificate**: for each
relation the forward rules conclude, the complete list of facts they
derived, and for each call the searches make, the complete list of its
answers. The checker can confirm both lists against the program, so it can
confirm what is missing too. Both are safe to conclude because eyemind first
finishes everything that could make Carol blocked or add a child, and only
then looks for what is missing.

The order of a collection matters as well. The children are `child_of`
triples that a forward rule derived, and the certificate shows which
triples were derived but not in what order. A plain `findall` lists its
items in the order they were found, so over derived facts it could not be
certified, and `--proof` would report an error. `findall_sorted` sorts its
list, and its items are plain names, so the list depends only on which
children there are: the certificate settles it.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each conclusion. This is the
complete proof:

```js
// Conclusions: the facts the program derives, in the order derived.
t('bob', 'child_of', 'alice')
t('carol', 'child_of', 'alice')
allowed('carol')
children('alice', ['bob', 'carol'])

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(t('bob', 'child_of', 'alice'), clause(5), {P: 'alice', C: 'bob'}, [t('alice', 'parent_of', 'bob')])
step(t('alice', 'parent_of', 'bob'), clause(4), {S: 'alice', P: 'parent_of', O: 'bob'}, [base('alice', 'parent_of', 'bob')])
step(t('carol', 'child_of', 'alice'), clause(5), {P: 'alice', C: 'carol'}, [t('alice', 'parent_of', 'carol')])
step(t('alice', 'parent_of', 'carol'), clause(4), {S: 'alice', P: 'parent_of', O: 'carol'}, [base('alice', 'parent_of', 'carol')])
step(allowed('carol'), clause(6), {C: 'carol'}, [t('carol', 'child_of', 'alice'), not(t('carol', 'blocked', 'true'))])
step(children('alice', ['bob', 'carol']), clause(7), {P: 'alice', _0: 'bob', C: A, Children: ['bob', 'carol']}, [base('alice', 'parent_of', 'bob'), findall_sorted(A, t(A, 'child_of', 'alice'), ['bob', 'carol'])])

// Certificate: the derived facts and every answer of each call the questions make.
derived(t(B, C, D), [t('bob', 'child_of', 'alice'), t('carol', 'child_of', 'alice')])
derived(allowed(B), [allowed('carol')])
derived(children(B, C), [children('alice', ['bob', 'carol'])])
called(t(A, 'child_of', B), [t('bob', 'child_of', 'alice'), t('carol', 'child_of', 'alice')])
called(t(C, 'parent_of', D), [t('alice', 'parent_of', 'bob'), t('alice', 'parent_of', 'carol')])
called(allowed(E), [allowed('carol')])
called(t(F, 'child_of', 'alice'), [t('bob', 'child_of', 'alice'), t('carol', 'child_of', 'alice')])
called(t('bob', 'blocked', 'true'), [t('bob', 'blocked', 'true')])
called(t('carol', 'blocked', 'true'), [])
called(children(G, H), [children('alice', ['bob', 'carol'])])
```

It has three parts:

- **The claims**: the four conclusions the proof is about.
- **The steps**: how each derived fact the answers rest on was derived. A
  step reads `step(what, by which clause, with which values, using what)`.
  Clauses are cited by their place in the program; the values in curly
  braces say what each variable of the cited line stood for. The `_` of rule
  7 is named `_0`, so it can be given a value like any other variable. The
  `A` in the last step is not a value: it is the open placeholder of the
  collection, "every child".
- **The certificate**: the `derived` **listings** of what the forward rules
  derived, and the `called` **call tables** of every call the questions
  make, each with all of its answers.

Read the steps as sentences:

1. *Bob is a child of Alice* — by rule 5, with `P` = alice and `C` = bob,
   because Alice is a parent of Bob in the view `t`.
2. *Alice is a parent of Bob, in the view* — by rule 4, because it is a base
   triple, fact 1.
3. *Carol is a child of Alice* — by rule 5, because Alice is a parent of
   Carol in the view.
4. *Alice is a parent of Carol, in the view* — by rule 4, from fact 2.
5. *Carol is allowed* — by rule 6, because she is a child of Alice and she
   is not blocked.
6. *Alice's children are `['bob', 'carol']`* — by rule 7, because Alice is a
   parent of someone (Bob, which fills the `_0`) and the sorted collection
   of her children is that list.

Facts stated in the program, like fact 1, need no step: the checker reads
them from the program. Nor do the absence and the collection: the
certificate settles them.

The certificate reads:

- `derived(t(B, C, D), [...])`: the only `t` triples the forward rules
  derived are the two `child_of` triples, for Bob and for Carol. The
  `derived` lines for `allowed` and `children` list the other two
  conclusions in the same way.
- `called(t('carol', 'blocked', 'true'), [])`: asking "is Carol blocked?"
  gives no answer. This is the table rule 6 consults for its negation.
- `called(t('bob', 'blocked', 'true'), [...])`: Bob is blocked, so rule 6
  does not fire for him.
- `called(t(F, 'child_of', 'alice'), [...])`: the search behind the
  collection gives Bob and Carol.
- The other tables answer the original questions. Without a query, these
  are the heads of the forward rules: `t(C, 'child_of', P)`, `allowed(C)`
  and `children(P, Children)`.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it follows the
certificate. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
t('bob', 'child_of', 'alice')
t('carol', 'child_of', 'alice')
allowed('carol')
children('alice', ['bob', 'carol'])

verdict('checked')
```

The checker did four things:

- **Answered the questions.** It searched each original question one level
  against the program, answering every inner call from its table, and
  checked each table it consulted the same way. *Carol is not blocked*: a
  `t` triple is either a base triple, and no base fact says Carol is
  blocked, or one the forward rules derived, and the `derived` listing has
  none about blocking. That agrees with
  `called(t('carol', 'blocked', 'true'), [])`.
- **Required the listings to be closed.** Given the `parent_of` triples, the
  rules derive no `t`, `allowed` or `children` fact the listings leave out.
- **Replayed each listed fact.** Each fact's recorded firing runs again from
  its rule. For `children`, the collection takes its answers from the table
  of `t(F, 'child_of', 'alice')`, Bob and Carol, and sorting those two names
  gives `['bob', 'carol']`, the list in the step, whatever order the triples
  were derived in.
- **Compared claims and answers.** The four claims are exactly the answers
  of the three questions. A step, table or listing the check did not use
  would have failed it.

The verdict is **checked**: the four conclusions follow from the program,
and they are every answer of those three questions. The claim about Alice's
children is about this program: a new fact could change it.


---

## Try it

```sh
eyemind examples/graphs.js            # the answers
eyemind --proof examples/graphs.js    # with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=graphs).
Change `fact(base('bob', 'blocked', 'true'))` to
`fact(base('carol', 'blocked', 'true'))` and run again: now `allowed('bob')`
appears instead of `allowed('carol')`. Or add
`fact(base('alice', 'parent_of', 'dan'))`: Dan becomes a child of Alice and
allowed, and the list grows to `['bob', 'carol', 'dan']`.

---

## Takeaway

"Not" and "all" are claims about what is *missing*, and a proof cannot
display a missing thing. eyemind still uses them, writes down every answer
its searches found so the checker can confirm the absence, and sorts the
collection so the checker can confirm that too.
