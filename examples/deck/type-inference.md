# Type Inference

*Working out the type of each small program, from the types of its parts.*

[type-inference.js](https://github.com/eyereasoner/eyemind/blob/main/examples/type-inference.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/type-inference.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/type-inference.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/type-inference.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground/#example=type-inference)

---

## The question

Programming languages give every expression a **type**: `42` is an integer,
`true` a boolean, and a function that turns a `t0` into a `t1` has type
"function from `t0` to `t1`", written here `fun('t0', 't1')`.

A **type checker** works out these types before a program runs, and refuses
programs whose parts do not fit together, such as adding `true` to `1`.

Given six small programs, **what is the type of each?** And why?

---

## What we tell eyemind: the programs

```js
fact(program('id', lam('x', 't0', ref('x'))))
fact(program('const', lam('x', 't0', lam('y', 't1', ref('x')))))
fact(program('apply_id', app(lam('x', 'int', ref('x')), int_lit(42))))
// compose: lam f, lam g, lam x, f(g(x)) …
fact(program('branch', cond(bool_lit('true'), add(int_lit(20), int_lit(22)), int_lit(0))))
fact(program('first_of_pair', fst(pair(bool_lit('true'), int_lit(7)))))
```

Each program is a syntax tree: `lam(x, Type, Body)` is a function with a
typed parameter, `ref(x)` uses it, `app(F, A)` calls `F` on `A`, `cond` is
if-then-else, `int_lit` and `bool_lit` are literal numbers and truth values,
and `pair`, `fst` and `add` build a pair, take its first item, and add.
`t0`, `t1`, `t2` are just names for placeholder types. Every parameter
carries its type, so strictly this is type *checking* against stated
types, not general type inference: the rules check that every use agrees.

---

## What we tell eyemind: the typing rules

```js
fact(lookup(Name, [[Name, Type], ..._], Type))                                                                // clause 7
implied_by(lookup(Name, [[Other, _], ...Rest], Type), [not_identical(Name, Other), lookup(Name, Rest, Type)]) // 8

fact(type_expr(_, int_lit(_), 'int'))                                            // 9
fact(type_expr(_, bool_lit(_), 'bool'))                                          // 10
implied_by(type_expr(Env, ref(Name), Type), lookup(Name, Env, Type))             // 11
implied_by(                                                                      // 12
  type_expr(Env, lam(Name, ArgType, Body), fun(ArgType, BodyType)),
  type_expr([[Name, ArgType], ...Env], Body, BodyType),
)
implied_by(                                                                      // 13
  type_expr(Env, app(Fn, Arg), ResultType),
  [type_expr(Env, Fn, fun(ArgType, ResultType)), type_expr(Env, Arg, ArgType)],
)
// … clauses 14 to 18: one rule each for add, cond, pair, fst and snd

implied_by(type_answer(Name, Type), [program(Name, Expr), type_expr([], Expr, Type)])   // 19
// … clauses 20 and 21: the two reasons in words
query(type_answer(Name, Type))
query(type_reason(Name, Reason))
```

- `fact(...)` states something true outright, and `implied_by(conclusion,
  condition)` is a **backward rule**: *the conclusion holds whenever the
  condition holds*. A condition in square brackets is a list that must all
  hold. Each fact and rule is a numbered **clause**; the six programs are
  clauses 1 to 6.
- Capitalized names (`Env`, `Name`, `Type`, …) are **variables**: they
  stand for whatever value makes the clause fit. `_` is a variable we do not
  care about. By contrast `'t0'` and `'int'` are fixed names.
- `type_expr(Env, Expr, Type)` reads *in environment Env, expression Expr
  has type Type*. The **environment** is the list of parameters in scope
  with their types, innermost first, as `[Name, Type]` pairs.
- `lookup` finds a name's type: clause 7 when it is the first pair of the
  list, clause 8 to skip a pair with a different name. `not_identical` is a
  **built-in test** that eyemind decides itself: are the two names
  different? Because the innermost pair comes first, an inner parameter
  hides an outer one with the same name.
- Rule 12: a function has type *from its parameter type to its body's
  type*, where the body is typed with the parameter added to the
  environment.
- Rule 13: a call is well typed when the function's parameter type and the
  argument's type are *the same*. The shared variable `ArgType` forces them
  to agree; making two terms equal by filling in variables like this is
  called **unification**.
- Rule 19: a program's type is the type of its expression in the empty
  environment `[]`.

eyemind answers the queries by working backward: to type a program, it
tries the rule for the kind of expression at the top, which asks for the
types of its parts, and so on down to literals and lookups.

---

## What eyemind concludes

```js
// Answers: each instance of a query() that holds.
type_answer('id', fun('t0', 't0'))
type_answer('const', fun('t0', fun('t1', 't0')))
type_answer('apply_id', 'int')
type_answer('compose', fun(fun('t1', 't2'), fun(fun('t0', 't1'), fun('t0', 't2'))))
type_answer('branch', 'int')
type_answer('first_of_pair', 'bool')
type_reason('compose', 'application unifies f with t1 -> t2 and g with t0 -> t1')
type_reason('apply_id', 'the identity function\'s parameter type is unified with int')
```

Six programs, six types, and a short reason in words for two of them:

- `id` takes a `t0` and returns it: `fun('t0', 't0')`.
- `const` takes a `t0`, then a `t1`, and returns the first:
  `fun('t0', fun('t1', 't0'))`.
- `apply_id` applies an integer identity to 42: `'int'`.
- `compose` takes `f` and `g` and returns "`f` after `g`".
- `branch` is an if-then-else whose two branches are integers: `'int'`.
- `first_of_pair` takes the first item of the pair (true, 7): `'bool'`.

---

## The proof, line by line

`eyemind --proof` writes down how it reached each answer. The full proof has
44 call tables and is 13 KB of long lines ([read it all](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/type-inference.js)).
Below are its claims and the complete tables for the first three answers,
verbatim:

```js
// Answers: each instance of a query() that holds.
type_answer('id', fun('t0', 't0'))
type_answer('const', fun('t0', fun('t1', 't0')))
type_answer('apply_id', 'int')
type_answer('compose', fun(fun('t1', 't2'), fun(fun('t0', 't1'), fun('t0', 't2'))))
type_answer('branch', 'int')
type_answer('first_of_pair', 'bool')
type_reason('compose', 'application unifies f with t1 -> t2 and g with t0 -> t1')
type_reason('apply_id', 'the identity function\'s parameter type is unified with int')

// Certificate: the derived facts and every answer of each call the questions make.
called(type_answer(A, B), [type_answer('id', fun('t0', 't0')), type_answer('const', fun('t0', fun('t1', 't0'))), type_answer('apply_id', 'int'), type_answer('compose', fun(fun('t1', 't2'), fun(fun('t0', 't1'), fun('t0', 't2')))), type_answer('branch', 'int'), type_answer('first_of_pair', 'bool')])
called(type_expr([], lam('x', 't0', ref('x')), C), [type_expr([], lam('x', 't0', ref('x')), fun('t0', 't0'))])
called(type_expr([['x', 't0']], ref('x'), D), [type_expr([['x', 't0']], ref('x'), 't0')])
called(lookup('x', [['x', 't0']], E), [lookup('x', [['x', 't0']], 't0')])
called(type_expr([], lam('x', 't0', lam('y', 't1', ref('x'))), C), [type_expr([], lam('x', 't0', lam('y', 't1', ref('x'))), fun('t0', fun('t1', 't0')))])
called(type_expr([['x', 't0']], lam('y', 't1', ref('x')), F), [type_expr([['x', 't0']], lam('y', 't1', ref('x')), fun('t1', 't0'))])
called(type_expr([['y', 't1'], ['x', 't0']], ref('x'), G), [type_expr([['y', 't1'], ['x', 't0']], ref('x'), 't0')])
called(lookup('x', [['y', 't1'], ['x', 't0']], H), [lookup('x', [['y', 't1'], ['x', 't0']], 't0')])
called(type_expr([], app(lam('x', 'int', ref('x')), int_lit(42)), C), [type_expr([], app(lam('x', 'int', ref('x')), int_lit(42)), 'int')])
called(type_expr([], lam('x', 'int', ref('x')), fun(I, J)), [type_expr([], lam('x', 'int', ref('x')), fun('int', 'int'))])
called(type_expr([['x', 'int']], ref('x'), K), [type_expr([['x', 'int']], ref('x'), 'int')])
called(lookup('x', [['x', 'int']], L), [lookup('x', [['x', 'int']], 'int')])
called(type_expr([], int_lit(42), 'int'), [type_expr([], int_lit(42), 'int')])
// … 31 more called lines: compose, branch, first_of_pair and the two
// reasons; 44 in all.
```

It has two parts:

- **The claims**: the eight answers the proof is about.
- **The certificate**: one *call table* per call the queries make, each
  written `called(call, answers)` with every answer that call has, in the
  order the calls were first met. Its variables, such as `C` or `fun(I, J)`,
  are the parts the call left open.

The type checker is written entirely with backward rules, so no forward
rule derives a fact: the proof needs no steps and no listings. Clauses are
numbered by their place in the program.

Read the shown tables as sentences:

1. *The programs and their types are exactly the six answers shown*: the
   table for the query `type_answer(Name, Type)`. Rule 19 builds each from
   a `program` fact and the table that types its expression.
2. *In the empty environment, `id`'s function has exactly one type,
   `fun('t0', 't0')`*: by rule 12, because its body has type `t0` once
   `x : t0` is in the environment.
3. *With `x : t0` in scope, `ref('x')` has type `t0`*: by rule 11, because
   looking up `x` gives `t0`, the first pair (fact 7).
4. *`const`'s function has type `fun('t0', fun('t1', 't0'))`*: by rule 12
   twice, adding `x : t0` and then `y : t1` in front.
5. *Looking up `x` in `[['y', 't1'], ['x', 't0']]` gives `t0`*: by rule 8,
   skipping `y` because `x` and `y` differ, then fact 7.
6. *Calling the integer identity on 42 has type `int`*: by rule 13, because
   the function has type `fun('int', 'int')` (its table) and the argument
   has type `int` (the last table, fact 9). This is where the two types are
   made to agree.

The tables left out go the same way. For `compose`, the lookups of `f` and
`g` skip the names in front of them, and rule 13 is used twice: `g` takes a
`t0` and `x` is one, so `g(x)` is a `t1`; `f` takes a `t1`, so `f(g(x))` is
a `t2`. The `type_reason(F1, G1)` table answers the second query by rules
20 and 21 from the tables for `compose` and `apply_id`.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it reads the clauses from
the program and confirms each table in one procedure. It expands the call
one level against the program, answering inner calls from their own tables
and `program` and `lookup` facts from the program, and requires the result
to equal the table: the same answers in the same order. Along the way it
decides each name comparison itself, such as `not_identical('x', 'y')` in
`const` and the three in `compose`, and for rule 13 it confirms that the
function's parameter type and the argument's type really are the same
`int`. No table may rest on itself through a cycle. Finally the claims must
be exactly the answers of the two queries, and every table must have been
used. This is the complete report:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
type_answer('id', fun('t0', 't0'))
type_answer('const', fun('t0', fun('t1', 't0')))
type_answer('apply_id', 'int')
type_answer('compose', fun(fun('t1', 't2'), fun(fun('t0', 't1'), fun('t0', 't2'))))
type_answer('branch', 'int')
type_answer('first_of_pair', 'bool')
type_reason('compose', 'application unifies f with t1 -> t2 and g with t0 -> t1')
type_reason('apply_id', 'the identity function\'s parameter type is unified with int')

verdict('checked')
```

The verdict is **checked**: all eight answers follow from the program, and
they are every answer of the original questions. It does not say that a
program without an answer is badly typed.

---

## Try it

```sh
eyemind examples/type-inference.js            # the types
eyemind --proof examples/type-inference.js    # with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground/#example=type-inference).

Add these programs and run again:

```js
fact(program('bad_add', add(bool_lit('true'), int_lit(1))))
fact(program('bad_branch', cond(bool_lit('true'), int_lit(1), bool_lit('false'))))
fact(program('second_of_pair', snd(pair(bool_lit('true'), int_lit(7)))))
fact(program('shadow', lam('x', 'bool', lam('x', 'int', ref('x')))))
```

The two `bad_` programs get no type at all: adding a boolean, and branches
of different types, do not fit. `second_of_pair` is `'int'`, and `shadow` is
`fun('bool', fun('int', 'int'))`: the inner `x` hides the outer one.

---

## Takeaway

Typing rules are usually written as logic on paper. Written as eyemind
rules, they run as a type checker — and every type it reports comes with a
checked derivation, the same kind a textbook would draw by hand.
