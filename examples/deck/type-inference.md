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
if-then-else. `t0`, `t1`, `t2` are just names for placeholder types.

---

## What we tell eyemind: the typing rules

```js
fact(lookup(Name, [[Name, Type], ..._], Type))
implied_by(lookup(Name, [[Other, _], ...Rest], Type), [not_identical(Name, Other), lookup(Name, Rest, Type)])

implied_by(type_expr(Env, ref(Name), Type), lookup(Name, Env, Type))
implied_by(
  type_expr(Env, lam(Name, ArgType, Body), fun(ArgType, BodyType)),
  type_expr([[Name, ArgType], ...Env], Body, BodyType),
)
implied_by(
  type_expr(Env, app(Fn, Arg), ResultType),
  [type_expr(Env, Fn, fun(ArgType, ResultType)), type_expr(Env, Arg, ArgType)],
)
// … and one rule each for literals, add, cond, pair, fst and snd
```

The environment `Env` lists the parameters in scope, innermost first.
`implied_by` means "this holds if that holds": a call is well typed when the
function's parameter type and the argument's type are *the same* — the
shared variable `ArgType` makes them agree.

---

## What eyemind concludes

```js
type_answer('id', fun('t0', 't0'))
type_answer('const', fun('t0', fun('t1', 't0')))
type_answer('apply_id', 'int')
type_answer('compose', fun(fun('t1', 't2'), fun(fun('t0', 't1'), fun('t0', 't2'))))
type_answer('branch', 'int')
type_answer('first_of_pair', 'bool')
type_reason('compose', 'application unifies f with t1 -> t2 and g with t0 -> t1')
type_reason('apply_id', 'the identity function\'s parameter type is unified with int')
```

Six programs, six types, and a short reason in words for two of them.

---

## Why: the proof in plain words

For `compose`, which takes `f` and `g` and returns "`f` after `g`":

1. Inside the three functions, `x` has type `t0`, `g` has `fun(t0, t1)` and
   `f` has `fun(t1, t2)` — found by looking up each name in the
   environment, skipping the names that differ (`not_identical`).
2. `g` takes a `t0` and `x` is one, so `g(x)` is a `t1` — *rule 13*.
3. `f` takes a `t1`, so `f(g(x))` is a `t2` — *rule 13* again.
4. Wrapping the three parameters back around it, one by one — *rule 12* —
   gives the full type.

The proof spells out every lookup and every rule application along the way.

---

## Checked, not just claimed

A separate checker read all 53 proof steps against the program:

- **49 steps** verified as exact instances of the rules and facts they cite;
- **4 name comparisons** (`not_identical('f', 'x')` and the like)
  **recomputed** by the checker itself and found to hold;
- no circular reasoning, and every step serves one of the 8 conclusions.

**0** steps taken on trust. Verdict: **checked**.

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

---

## Takeaway

Typing rules are usually written as logic on paper. Written as eyemind
rules, they run as a type checker — and every type it reports comes with a
checked derivation, the same kind a textbook would draw by hand.
