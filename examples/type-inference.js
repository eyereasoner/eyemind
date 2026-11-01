// Checking types in a small expression language with functions, function
// calls, integer addition, conditionals and pairs. Six programs are given as
// syntax trees, and rules work out the type of each, bottom up: the identity
// function has type fun(t0, t0), a function from t0 to t0; const has type
// fun(t0, fun(t1, t0)); applying an integer identity to 42 gives int;
// composing f and g gives fun(fun(t1, t2), fun(fun(t0, t1), fun(t0, t2)));
// the conditional and the first item of a pair give int and bool. Two
// programs also get a short reason in words.
// Each function parameter carries its type, and the rules check that every
// use agrees. t0, t1 and t2 are ordinary atoms naming placeholder types, not
// logic variables, so this is type checking against stated annotations, not
// general type inference. An environment is a list of [Name, Type] pairs,
// innermost first, so an inner parameter hides an outer one of the same name.
// One backward rule per kind of expression shows how typing rules read as
// logic: a function call is typed by matching the argument's type against
// the function's.

// The syntax trees. ref(Name) uses a variable and cond(C, Then, Else) is a
// conditional (var and if are JavaScript keywords).
fact(program('id', lam('x', 't0', ref('x'))))
fact(program('const', lam('x', 't0', lam('y', 't1', ref('x')))))
fact(program('apply_id', app(lam('x', 'int', ref('x')), int_lit(42))))
fact(
  program(
    'compose',
    lam(
      'f',
      fun('t1', 't2'),
      lam('g', fun('t0', 't1'), lam('x', 't0', app(ref('f'), app(ref('g'), ref('x'))))),
    ),
  ),
)
fact(program('branch', cond(bool_lit('true'), add(int_lit(20), int_lit(22)), int_lit(0))))
fact(program('first_of_pair', fst(pair(bool_lit('true'), int_lit(7)))))

// lookup(Name, Env, Type): the innermost binding of Name in Env has Type.
fact(lookup(Name, [[Name, Type], ..._], Type))
implied_by(lookup(Name, [[Other, _], ...Rest], Type), [not_identical(Name, Other), lookup(Name, Rest, Type)])

// type_expr(Env, Expr, Type): in Env, Expr has Type. Each rule is called on a
// smaller part of the expression, so the search ends.
fact(type_expr(_, int_lit(_), 'int'))
fact(type_expr(_, bool_lit(_), 'bool'))
implied_by(type_expr(Env, ref(Name), Type), lookup(Name, Env, Type))
// A function's body is typed with its parameter added to the environment.
implied_by(
  type_expr(Env, lam(Name, ArgType, Body), fun(ArgType, BodyType)),
  type_expr([[Name, ArgType], ...Env], Body, BodyType),
)
// A call needs a function whose parameter type is the argument's type; the
// shared variable ArgType makes the two agree.
implied_by(
  type_expr(Env, app(Fn, Arg), ResultType),
  [type_expr(Env, Fn, fun(ArgType, ResultType)), type_expr(Env, Arg, ArgType)],
)
implied_by(type_expr(Env, add(Left, Right), 'int'), [type_expr(Env, Left, 'int'), type_expr(Env, Right, 'int')])
// Both branches of a conditional must have the same type.
implied_by(
  type_expr(Env, cond(Cond, Then, Else), Type),
  [type_expr(Env, Cond, 'bool'), type_expr(Env, Then, Type), type_expr(Env, Else, Type)],
)
implied_by(
  type_expr(Env, pair(Left, Right), pair(LeftType, RightType)),
  [type_expr(Env, Left, LeftType), type_expr(Env, Right, RightType)],
)
// fst and snd take the first and the second item of a pair. No program here
// uses snd; its rule completes the language.
implied_by(type_expr(Env, fst(Pair), LeftType), type_expr(Env, Pair, pair(LeftType, _)))
implied_by(type_expr(Env, snd(Pair), RightType), type_expr(Env, Pair, pair(_, RightType)))

// A program's type is the type of its expression in the empty environment.
implied_by(type_answer(Name, Type), [program(Name, Expr), type_expr([], Expr, Type)])
implied_by(type_reason('compose', 'application unifies f with t1 -> t2 and g with t0 -> t1'), type_answer('compose', _))
implied_by(type_reason('apply_id', "the identity function's parameter type is unified with int"), type_answer('apply_id', 'int'))

query(type_answer(Name, Type))
query(type_reason(Name, Reason))
