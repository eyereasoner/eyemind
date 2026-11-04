# Type Inference

*Working out the type of each small program, from the types of its parts.*

[type-inference.js](https://github.com/eyereasoner/eyemind/blob/main/examples/type-inference.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/type-inference.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/type-inference.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/type-inference.js) · [try it in the playground](https://eyereasoner.github.io/eyemind/playground#example=type-inference)

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
fact(lookup(Name, [[Name, Type], ..._], Type))                                   // clause 7
implied_by(lookup(Name, [[Other, _], ...Rest], Type), [not_identical(Name, Other), lookup(Name, Rest, Type)])   // 8

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
53 steps and is 14 KB of long lines ([read it all](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/type-inference.js)).
Below are its claims, all its clauses, and the complete chains for the first
three answers, verbatim:

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

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(program('id', lam('x', 't0', ref('x')))))
clause(2, fact(program('const', lam('x', 't0', lam('y', 't1', ref('x'))))))
clause(3, fact(program('apply_id', app(lam('x', 'int', ref('x')), int_lit(42)))))
clause(4, fact(program('compose', lam('f', fun('t1', 't2'), lam('g', fun('t0', 't1'), lam('x', 't0', app(ref('f'), app(ref('g'), ref('x')))))))))
clause(5, fact(program('branch', cond(bool_lit('true'), add(int_lit(20), int_lit(22)), int_lit(0)))))
clause(6, fact(program('first_of_pair', fst(pair(bool_lit('true'), int_lit(7))))))
clause(7, fact(lookup(Name, [[Name, Type], ..._0], Type)))
clause(8, implied_by(lookup(Name, [[Other, _0], ...Rest], Type), [not_identical(Name, Other), lookup(Name, Rest, Type)]))
clause(9, fact(type_expr(_0, int_lit(_1), 'int')))
clause(10, fact(type_expr(_0, bool_lit(_1), 'bool')))
clause(11, implied_by(type_expr(Env, ref(Name), Type), lookup(Name, Env, Type)))
clause(12, implied_by(type_expr(Env, lam(Name, ArgType, Body), fun(ArgType, BodyType)), type_expr([[Name, ArgType], ...Env], Body, BodyType)))
clause(13, implied_by(type_expr(Env, app(Fn, Arg), ResultType), [type_expr(Env, Fn, fun(ArgType, ResultType)), type_expr(Env, Arg, ArgType)]))
clause(14, implied_by(type_expr(Env, add(Left, Right), 'int'), [type_expr(Env, Left, 'int'), type_expr(Env, Right, 'int')]))
clause(15, implied_by(type_expr(Env, cond(Cond, Then, Else), Type), [type_expr(Env, Cond, 'bool'), type_expr(Env, Then, Type), type_expr(Env, Else, Type)]))
clause(16, implied_by(type_expr(Env, pair(Left, Right), pair(LeftType, RightType)), [type_expr(Env, Left, LeftType), type_expr(Env, Right, RightType)]))
clause(17, implied_by(type_expr(Env, fst(Pair), LeftType), type_expr(Env, Pair, pair(LeftType, _0))))
clause(19, implied_by(type_answer(Name, Type), [program(Name, Expr), type_expr([], Expr, Type)]))
clause(20, implied_by(type_reason('compose', 'application unifies f with t1 -> t2 and g with t0 -> t1'), type_answer('compose', _0)))
clause(21, implied_by(type_reason('apply_id', 'the identity function\'s parameter type is unified with int'), type_answer('apply_id', 'int')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(type_answer('id', fun('t0', 't0')), clause(19), {Name: 'id', Type: fun('t0', 't0'), Expr: lam('x', 't0', ref('x'))}, [program('id', lam('x', 't0', ref('x'))), type_expr([], lam('x', 't0', ref('x')), fun('t0', 't0'))])
step(program('id', lam('x', 't0', ref('x'))), clause(1), {}, [])
step(type_expr([], lam('x', 't0', ref('x')), fun('t0', 't0')), clause(12), {Env: [], Name: 'x', ArgType: 't0', Body: ref('x'), BodyType: 't0'}, [type_expr([['x', 't0']], ref('x'), 't0')])
step(type_expr([['x', 't0']], ref('x'), 't0'), clause(11), {Env: [['x', 't0']], Name: 'x', Type: 't0'}, [lookup('x', [['x', 't0']], 't0')])
step(lookup('x', [['x', 't0']], 't0'), clause(7), {Name: 'x', Type: 't0', _0: []}, [])
step(type_answer('const', fun('t0', fun('t1', 't0'))), clause(19), {Name: 'const', Type: fun('t0', fun('t1', 't0')), Expr: lam('x', 't0', lam('y', 't1', ref('x')))}, [program('const', lam('x', 't0', lam('y', 't1', ref('x')))), type_expr([], lam('x', 't0', lam('y', 't1', ref('x'))), fun('t0', fun('t1', 't0')))])
step(program('const', lam('x', 't0', lam('y', 't1', ref('x')))), clause(2), {}, [])
step(type_expr([], lam('x', 't0', lam('y', 't1', ref('x'))), fun('t0', fun('t1', 't0'))), clause(12), {Env: [], Name: 'x', ArgType: 't0', Body: lam('y', 't1', ref('x')), BodyType: fun('t1', 't0')}, [type_expr([['x', 't0']], lam('y', 't1', ref('x')), fun('t1', 't0'))])
step(type_expr([['x', 't0']], lam('y', 't1', ref('x')), fun('t1', 't0')), clause(12), {Env: [['x', 't0']], Name: 'y', ArgType: 't1', Body: ref('x'), BodyType: 't0'}, [type_expr([['y', 't1'], ['x', 't0']], ref('x'), 't0')])
step(type_expr([['y', 't1'], ['x', 't0']], ref('x'), 't0'), clause(11), {Env: [['y', 't1'], ['x', 't0']], Name: 'x', Type: 't0'}, [lookup('x', [['y', 't1'], ['x', 't0']], 't0')])
step(lookup('x', [['y', 't1'], ['x', 't0']], 't0'), clause(8), {Name: 'x', Other: 'y', _0: 't1', Rest: [['x', 't0']], Type: 't0'}, [not_identical('x', 'y'), lookup('x', [['x', 't0']], 't0')])
step(not_identical('x', 'y'), 'builtin', {}, [])
step(type_answer('apply_id', 'int'), clause(19), {Name: 'apply_id', Type: 'int', Expr: app(lam('x', 'int', ref('x')), int_lit(42))}, [program('apply_id', app(lam('x', 'int', ref('x')), int_lit(42))), type_expr([], app(lam('x', 'int', ref('x')), int_lit(42)), 'int')])
step(program('apply_id', app(lam('x', 'int', ref('x')), int_lit(42))), clause(3), {}, [])
step(type_expr([], app(lam('x', 'int', ref('x')), int_lit(42)), 'int'), clause(13), {Env: [], Fn: lam('x', 'int', ref('x')), Arg: int_lit(42), ResultType: 'int', ArgType: 'int'}, [type_expr([], lam('x', 'int', ref('x')), fun('int', 'int')), type_expr([], int_lit(42), 'int')])
step(type_expr([], lam('x', 'int', ref('x')), fun('int', 'int')), clause(12), {Env: [], Name: 'x', ArgType: 'int', Body: ref('x'), BodyType: 'int'}, [type_expr([['x', 'int']], ref('x'), 'int')])
step(type_expr([['x', 'int']], ref('x'), 'int'), clause(11), {Env: [['x', 'int']], Name: 'x', Type: 'int'}, [lookup('x', [['x', 'int']], 'int')])
step(lookup('x', [['x', 'int']], 'int'), clause(7), {Name: 'x', Type: 'int', _0: []}, [])
step(type_expr([], int_lit(42), 'int'), clause(9), {_0: [], _1: 42}, [])
// … 34 more steps: compose (steps 20-38), branch (39-46),
// first_of_pair (47-51) and the two reasons (52-53); 53 steps in all.
```

It has three parts:

- **The claims**: the eight answers the proof is about.
- **The clauses**: the program clauses the proof relies on, by number.
  Clause 18, the rule for `snd`, is missing because no program uses it.
  Each don't-care `_` gets a name (`_0`, `_1`) so a step can say what it
  stood for.
- **The steps**: one per thing established. A step reads
  `step(what, by what, with which values, using what)`.

Two kinds of justification occur:

- `clause(N)`: the step is an instance of program clause N, with the
  variables standing for the values shown.
- `'builtin'`: a built-in test, here `not_identical`. It cites no clause and
  uses nothing; the checker simply decides it again.

Read the shown steps as sentences:

1. *`id` has type `fun('t0', 't0')`*: by rule 19, because of the next two
   steps.
2. *`id` is the program `lam('x', 't0', ref('x'))`*: fact 1.
3. *In the empty environment, that function has type `fun('t0', 't0')`*:
   by rule 12, with `BodyType` = `t0`, because its body has type `t0` once
   `x : t0` is in the environment.
4. *With `x : t0` in scope, `ref('x')` has type `t0`*: by rule 11, because
   looking up `x` gives `t0`.
5. *Looking up `x` in `[['x', 't0']]` gives `t0`*: fact 7, since `x` is
   the first pair.
6. *`const` has type `fun('t0', fun('t1', 't0'))`*: by rule 19.
7. *`const` is its program*: fact 2.
8. *In the empty environment, `const`'s function has that type*: by rule
   12, with `x : t0` added.
9. *With `x : t0` in scope, the inner function has type `fun('t1', 't0')`*:
   by rule 12, with `y : t1` added in front.
10. *With `y : t1` and `x : t0` in scope, `ref('x')` has type `t0`*: by
    rule 11.
11. *Looking up `x` in `[['y', 't1'], ['x', 't0']]` gives `t0`*: by rule 8,
    skipping `y` because `x` and `y` differ, then reusing step 5.
12. *`x` and `y` are different*: a built-in test.
13. *`apply_id` has type `int`*: by rule 19.
14. *`apply_id` is its program*: fact 3.
15. *Calling the integer identity on 42 has type `int`*: by rule 13, with
    `ArgType` = `int`, because the function has type `fun('int', 'int')`
    and the argument has type `int`. This is where the two types are made
    to agree.
16. *The integer identity has type `fun('int', 'int')`*: by rule 12.
17. *With `x : int` in scope, `ref('x')` has type `int`*: by rule 11.
18. *Looking up `x` in `[['x', 'int']]` gives `int`*: fact 7.
19. *`42` has type `int`*: fact 9, with `_1` = 42.

The steps left out go the same way. For `compose`, the lookups of `f` and
`g` skip the names in front of them with three more `not_identical` tests,
and rule 13 is used twice: `g` takes a `t0` and `x` is one, so `g(x)` is a
`t1`; `f` takes a `t1`, so `f(g(x))` is a `t2`. The last two steps derive the
reasons by rules 20 and 21 from the answers for `compose` and `apply_id`.

---

## Checked: what the report says

A proof is only worth something if someone else can check it. `eyemind -c`
generates the proof and checks it against the program; `--check-proof` checks
a saved proof. The checker never reasons by itself: it only confirms each step
against the program. This is the complete report:

```js
// Checked answers: these follow from the input program.
type_answer('id', fun('t0', 't0'))
type_answer('const', fun('t0', fun('t1', 't0')))
type_answer('apply_id', 'int')
type_answer('compose', fun(fun('t1', 't2'), fun(fun('t0', 't1'), fun('t0', 't2'))))
type_answer('branch', 'int')
type_answer('first_of_pair', 'bool')
type_reason('compose', 'application unifies f with t1 -> t2 and g with t0 -> t1')
type_reason('apply_id', 'the identity function\'s parameter type is unified with int')

// C1-C8: resolution, acyclicity, justification, coverage,
// re-decision, boundary consistency, relevance and witness integrity.
condition('C1', 'resolution', 'ok', 49)
condition('C2', 'well_founded', 'ok', 53)
condition('C3', 'justification', 'ok', 53)
condition('C4', 'coverage', 'ok', 57)
condition('C5', 're_decision', 'ok', 4)
condition('C6', 'boundary_consistency', 'ok', 0)
condition('C7', 'relevance', 'ok', 61)
condition('C8', 'witness_integrity', 'ok', 0)

// Proof statistics: recorded steps and how they were checked.
steps(53)
verified(49)
recomputed(4)
composed(0)
trusted(0)
claims(8)

// This verdict applies to the claims above; it does not establish completeness.
verdict('checked')
```

Each `condition` line names a check, says `'ok'`, and counts what it looked
at:

- **C1 resolution (49)**: the 49 clause steps really are instances of the
  rules and facts they cite, with the values shown. For step 15 this means
  the checker confirms that the function's parameter type and the
  argument's type really are the same `int`.
- **C2 well-founded (53)**: none of the 53 steps depends on itself, even
  indirectly.
- **C3 justification (53)**: all 53 steps say how they were justified, in a
  form the checker understands.
- **C4 coverage (57)**: the 8 claims and the 49 things the steps use are
  each backed by a step: nothing is taken for granted.
- **C5 re-decision (4)**: the 4 name comparisons (`not_identical('x', 'y')`
  in `const`, and `('f', 'x')`, `('f', 'g')` and `('g', 'x')` in `compose`)
  were decided again by the checker itself, and they hold.
- **C6 boundary consistency (0)**: nothing was concluded from the *absence*
  of a fact, so there is nothing to confront.
- **C7 relevance (61)**: the 8 claims answer the queries, and all 53 steps
  serve them. There is no padding.
- **C8 witness integrity (0)**: no rule invented a new, unnamed thing, so
  there is no invented name to verify.

The statistics repeat this: 53 steps, 49 verified against the program, 4
recomputed, none taken on trust. The verdict is **checked**: all eight
answers follow from the program. As the last comment says, this confirms the
claims; it does not say the program has no other answers, nor that a
program without an answer is badly typed.

---

## Try it

```sh
eyemind examples/type-inference.js            # the types
eyemind --proof examples/type-inference.js    # with their proof
```

Or open it in the [playground](https://eyereasoner.github.io/eyemind/playground#example=type-inference).

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
