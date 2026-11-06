// SPEC 3 and 6: programs, statements, names, rejected clauses and stratification.

conformance('an inline forward template has local universal variables and direct generator evidence', [
  spec('6.2, 10.2'),
  args('--proof program.js'),
  file('program.js', [
    "fact(cat('minka'))",
    "fact(dog('charly'))",
    "implies(cat(X), implies(dog(Y), test('yes')))",
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "test('yes')",
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    "clause(1, fact(cat('minka')))",
    "clause(2, fact(dog('charly')))",
    "clause(3, implies(cat(X), implies(dog(Y), test('yes'))))",
    "clause(4, implies([cat(X), dog(Y)], test('yes')))",
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(test('yes'), clause(4), {X: 'minka', Y: 'charly'}, [cat('minka'), dog('charly')])",
    "step(cat('minka'), clause(1), {}, [])",
    "step(dog('charly'), clause(2), {}, [])",
  ]),
])

conformance('a backward template captures inverse names and keeps endpoints local', [
  spec('6.2'),
  file('program.js', [
    "fact(inverse('parent', 'child'))",
    "fact(t('alice', 'parent', 'bob'))",
    'implies(inverse(P, Q), implied_by(t(X, Q, Y), t(Y, P, X)))',
    "implies(t(X, 'child', Y), parent(X, Y))",
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "parent('bob', 'alice')",
  ]),
])

conformance('template bodies heads and generators support conjunctions', [
  spec('6.2'),
  file('program.js', [
    "fact(p('a'), p('b'), q('a'))",
    "implies('true', [ready('yes'), implies([p(X), q(X)], [r(X), s(X)]), implied_by([u(X), v(X)], [r(X), s(X)])])",
    'query([u(X), v(X)])',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "and(u('a'), v('a'))",
  ]),
])

conformance('a variable shared only by sibling templates is local to each', [
  spec('6.2'),
  file('program.js', [
    "fact(p('a'), q('b'))",
    "implies('true', [implies(p(X), r(X)), implied_by(s(X), q(X))])",
    'query([r(X), s(Y)])',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "and(r('a'), s('b'))",
  ]),
])

conformance('an inactive generator supplies neither forward nor backward conclusions', [
  spec('6.2'),
  file('program.js', [
    "fact(p('a'))",
    "implies(enabled('yes'), [implies(p(X), q(X)), implied_by(r(X), p(X))])",
    'query(or(q(X), r(X)))',
  ]),
  stdout([
    '// No answers: no query() instance holds.',
  ]),
])

conformance('negation and collection wait for an enabled template to finish', [
  spec('6.1, 6.2, 8.2'),
  file('program.js', [
    "fact(seed('a'))",
    'implies(findall(X, item(X), L), items(L))',
    "implies(not(item('a')), missing('a'))",
    "implies(enabled('yes'), implies(seed(X), item(X)))",
    "implies('true', enabled('yes'))",
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "enabled('yes')",
    "item('a')",
    "items(['a'])",
  ]),
])

conformance('a closed cycle through a forward template is rejected', [
  spec('6.1, 6.2'),
  exit(1),
  file('program.js', ["implies(not(p('a')), implies('true', p('a')))"]),
  stdout([]),
  stderr(prefix('eyemind: unstratified negation or collection dependency')),
])

conformance('a closed cycle through a backward template is rejected', [
  spec('6.1, 6.2'),
  exit(1),
  file('program.js', ["implies(findall(X, p(X), L), implied_by(p('a'), 'true'))"]),
  stdout([]),
  stderr(prefix('eyemind: unstratified negation or collection dependency')),
])

conformance('a variable call in a generated backward body is rejected', [
  spec('6.2'),
  exit(1),
  file('program.js', ["implies('true', implied_by(p(X), call(G)))"]),
  stdout([]),
  stderr(prefix('eyemind: line 1: generated rule bodies require statically named calls')),
])

conformance('a forward rule with a variable body goal is rejected', [
  spec('6.1'),
  exit(1),
  file('program.js', [
    "fact(p(q('a')), q('a'))",
    'implies([p(G), G], holds(G))',
  ]),
  stdout([]),
  stderr(prefix('eyemind: forward dependencies require statically named calls')),
])

conformance('a forward rule reaching a variable goal through a backward rule is rejected', [
  spec('6.1'),
  exit(1),
  file('program.js', [
    "fact(p(q('a')), q('a'))",
    'implied_by(holds(G), [p(G), G])',
    'implies(holds(G), seen(G))',
  ]),
  stdout([]),
  stderr(prefix('eyemind: forward dependencies require statically named calls')),
])

conformance('a variable goal no forward rule reaches is allowed', [
  spec('6.1'),
  args("--goal 'holds(G)' program.js"),
  file('program.js', [
    "fact(p(q('a')), p(r('b')), q('a'))",
    'implied_by(holds(G), [p(G), G])',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "holds(q('a'))",
  ]),
])

conformance('a rule value inside an ordinary body goal is rejected', [
  spec('6.2'),
  exit(1),
  file('program.js', [
    "fact(p('a'))",
    'query(p(box(implies(a(X), b(X)))))',
  ]),
  stdout([]),
  stderr(prefix('eyemind: line 2: ')),
])

conformance('a rule value as the template of findall is rejected', [
  spec('6.2'),
  exit(1),
  file('program.js', [
    "fact(p('a'))",
    'query(findall(implies(a(X), b(X)), p(Y), L))',
  ]),
  stdout([]),
  stderr(prefix('eyemind: line 2: ')),
])

conformance('a source program cannot state the reserved enabling predicate', [
  spec('6.2'),
  exit(1),
  file('program.js', ['fact(activated(2, []))']),
  stdout([]),
  stderr(prefix('eyemind: line 1: activated/2 is reserved')),
])

conformance('fact states one fact per argument, numbered in order', [
  spec('3.4, 3.5'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1), p(2))',
    'implies(p(X), q(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'q(1)',
    'q(2)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, fact(p(2)))',
    'clause(3, implies(p(X), q(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(q(1), clause(3), {X: 1}, [p(1)])',
    'step(p(1), clause(1), {}, [])',
    'step(q(2), clause(3), {X: 2}, [p(2)])',
    'step(p(2), clause(2), {}, [])',
  ]),
])

conformance('a forward rule may conclude several heads joined with &', [
  spec('3.4, 3.5'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), [a(X), b(X)])',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'a(1)',
    'b(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, implies(p(X), [a(X), b(X)]))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(a(1), clause(2), {X: 1}, [p(1)])',
    'step(p(1), clause(1), {}, [])',
    'step(b(1), clause(2), {X: 1}, [p(1)])',
  ]),
])

conformance('a backward rule without a body is a fact', [
  spec('3.4'),
  args("--proof --goal 'p(X)' program.js"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(p(1), clause(1), {}, [])',
  ]),
])

conformance('a body conjunction is split into its goals', [
  spec('3.4, 3.5'),
  args("--proof --goal 'r(X)' program.js"),
  file('program.js', [
    'fact(p(1), q(1))',
    'implied_by(r(X), [p(X), q(X)])',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'r(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, fact(q(1)))',
    'clause(3, implied_by(r(X), [p(X), q(X)]))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(r(1), clause(3), {X: 1}, [p(1), q(1)])',
    'step(p(1), clause(1), {}, [])',
    'step(q(1), clause(2), {}, [])',
  ]),
])

conformance('query publishes each instance of its body', [
  spec('3.4'),
  file('program.js', [
    'fact(p(1), p(2), q(2))',
    'query(p(X), q(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'and(p(2), q(2))',
  ]),
])

conformance('contradiction stops with exit code 65', [
  spec('3.4, 8.5'),
  exit(65),
  file('program.js', [
    "fact(account('bob', -5))",
    'contradiction(account(Owner, Balance), lt(Balance, 0))',
  ]),
  stdout([
    "// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.",
    "'false'",
  ]),
])

conformance('facts_from states every expression of a document as a fact', [
  spec('3.4, 9.1'),
  file('program.js', [
    "facts_from('data.js')",
    "query(edge('a', X))",
  ]),
  file('data.js', [
    "edge('a', 'b')",
    "edge('b', 'c')",
    '',
    "edge('a', [1, 2.5, -3])",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "edge('a', 'b')",
    "edge('a', [1, 2.5, -3])",
  ]),
])

conformance('facts_from reads text too', [
  spec('3.4'),
  file('program.js', [
    "facts_from({text: 'score(\\'ann\\', 3)\\nscore(\\'bob\\', 5)\\n'})",
    'query(score(Who, S), gt(S, 4))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "and(score('bob', 5), gt(5, 4))",
  ]),
])

conformance('several program files form one program, numbered in order', [
  spec('3.1'),
  args('--proof a.js b.js'),
  file('a.js', [
    'fact(p(1))',
  ]),
  file('b.js', [
    'implies(p(X), q(X))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'q(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, implies(p(X), q(X)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'step(p(1), clause(1), {}, [])',
  ]),
])

conformance('undefined lowercase names are predicates', [
  spec('3.2'),
  file('program.js', [
    "fact(type('socrates', 'human'))",
    "fact(sum(1, 2), id(7), max('x'))",
    'query(type(X, Y), sum(1, Z), id(I), max(M))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "and(type('socrates', 'human'), sum(1, 2), id(7), max('x'))",
  ]),
])

conformance('undefined names starting with a capital or _ are variables', [
  spec('3.2'),
  file('program.js', [
    'fact(pair(1, 2))',
    'query(pair(First, _Second))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'pair(1, 2)',
  ]),
])

conformance('kept globals keep their JavaScript meaning', [
  spec('3.2'),
  file('program.js', [
    'for (let i = 0; i < 3; i++) {',
    '  fact(n(i, JSON.stringify(i * 10).length))',
    '}',
    'query(n(I, L))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'n(0, 1)',
    'n(1, 2)',
    'n(2, 2)',
  ]),
])

conformance('other JavaScript globals are predicates and variables', [
  spec('3.2'),
  file('program.js', [
    "fact(eval(1), name('x'), born(1990))",
    'query(eval(E))',
    'query(name(N))',
    'query(born(Date))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'eval(1)',
    "name('x')",
    'born(1990)',
  ]),
])

conformance("an error in a program's own JavaScript code is reported at its line", [
  spec('3.1, 13.1'),
  exit(1),
  stderr(prefix('eyemind: line 2:')),
  file('program.js', [
    'fact(p(1))',
    "JSON.parse('{')",
  ]),
  stdout([]),
])

conformance('a program may name a kept global as a predicate', [
  spec('3.2'),
  file('program.js', [
    "const isFinite = preds('isFinite')",
    "fact(isFinite('parent_of', 'person'))",
    'query(isFinite(P, C))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "isFinite('parent_of', 'person')",
  ]),
])

conformance('preds and vars name predicates and variables explicitly', [
  spec('3.2'),
  file('program.js', [
    "const [p, q] = preds('p q')",
    "const A = vars('A')",
    'fact(p(1))',
    'implies(p(A), q(A))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'q(1)',
  ]),
])

conformance('helper functions see the names a program leaves undefined', [
  spec('3.2'),
  file('program.js', [
    'function chain(n) {',
    '  for (let i = 0; i < n; i++) fact(edge(i, i + 1))',
    '}',
    '',
    'chain(3)',
    'implies(edge(X, Y), path(X, Y))',
    'implies([path(X, Y), edge(Y, Z)], path(X, Z))',
    'query(path(0, W))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'path(0, 1)',
    'path(0, 2)',
    'path(0, 3)',
  ]),
])

conformance('a predicate called on its own states nothing and is an error', [
  spec('3.2'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'fact(p(1))',
    'fcat(p(2))',
  ]),
  stdout([]),
])

conformance('a predicate name used uncalled is its atom', [
  spec('3.2'),
  file('program.js', [
    'fact(ready)',
    'query(ready, not(blocked))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "and('ready', not('blocked'))",
  ]),
])

conformance('every _ in a clause is a variable of its own', [
  spec('3.3'),
  args("program.js --goal 'pair(1, 2)'"),
  file('program.js', [
    'fact(pair(_, _))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'pair(1, 2)',
  ]),
])

conformance('struct builds a compound with any name', [
  spec('3.3'),
  args('program.js --goal \'struct(\'"\'"\'hello world\'"\'"\', X)\' --goal \'from(Y)\''),
  file('program.js', [
    "fact(struct('hello world', 1))",
    "fact(struct('from', 'here'))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "struct('hello world', 1)",
    "from('here')",
  ]),
])

conformance('struct with only a name is the atom', [
  spec('3.3'),
  args("program.js --goal 'p(X)'"),
  file('program.js', [
    "fact(p(struct('lonely')))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "p('lonely')",
  ]),
])

conformance('arithmetic terms are built by calls', [
  spec('3.3'),
  file('program.js', [
    'query(unify(T, add(mul(X, 2), 1)), unify(X, 3))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'and(unify(add(mul(3, 2), 1), add(mul(3, 2), 1)), unify(3, 3))',
  ]),
])

conformance('[H, *T] is a list with head H and tail T', [
  spec('3.3'),
  args("program.js --goal 'split([1, 2, 3], H, T)'"),
  file('program.js', [
    'fact(split([H, ...T], H, T))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'split([1, 2, 3], 1, [2, 3])',
  ]),
])

conformance('a term used as a truth value is an error', [
  spec('3.3'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'implies([q(X), X > 1], p(X))',
  ]),
  stdout([]),
])

conformance('a head of step/4 is reserved', [
  spec('3.4, 3.5'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "fact(struct('step', 1, 2, 3, 4))",
  ]),
  stdout([]),
])

conformance('a head of clause/2 is reserved', [
  spec('3.4, 3.5'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "fact(struct('clause', 1, 2))",
  ]),
  stdout([]),
])

conformance('a primitive cannot be a head', [
  spec('3.4, 3.5'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'fact(unify(1, 1))',
  ]),
  stdout([]),
])

conformance('a control cannot be a head', [
  spec('3.4, 3.5'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "implied_by(call('a'), 'true')",
  ]),
  stdout([]),
])

conformance('true and false are not the conclusion of a backward rule', [
  spec('3.4'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "implied_by('true', p(1))",
  ]),
  stdout([]),
])

conformance('implies cannot conclude true or false: query and contradiction do', [
  spec('3.4'),
  exit(1),
  stderr(prefix("eyemind: line 2: implies() cannot conclude 'true' or 'false'")),
  file('program.js', [
    'fact(p(1))',
    "implies(p(X), [q(X), 'false'])",
  ]),
  stdout([]),
])

conformance('query and contradiction need a goal', [
  spec('3.4'),
  exit(1),
  stderr(prefix('eyemind: line 1: query() needs at least one goal')),
  file('program.js', [
    'query()',
  ]),
  stdout([]),
])

conformance('a number cannot be a head', [
  spec('3.4, 3.5'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'clause(42)',
  ]),
  stdout([]),
])

conformance('an empty array is not a goal', [
  spec('3.4, 3.5'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'implied_by(p, [])',
  ]),
  stdout([]),
])

conformance('a number is not a goal', [
  spec('3.4, 3.5'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'implied_by(p, 1)',
  ]),
  stdout([]),
])

conformance('a forward rule needs a premise', [
  spec('3.4, 3.5'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'implies(p(1))',
  ]),
  stdout([]),
])

conformance('negation through a cycle is unstratified', [
  spec('6.1'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'implies(not(q), p)',
    'implies(p, q)',
  ]),
  stdout([]),
])

conformance('collection through a cycle is unstratified', [
  spec('6.1'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'implies(findall(Y, p(Y), L), p(L))',
  ]),
  stdout([]),
])

conformance('a forward rule cannot reach a call of a variable', [
  spec('6.1'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "fact(p('a'))",
    'implied_by(apply(G), call(G))',
    "implies(apply(p('a')), q)",
  ]),
  stdout([]),
])

conformance('a backward rule may call a variable goal when asked from outside', [
  spec('6.1'),
  args('program.js --goal \'apply(p(\'"\'"\'a\'"\'"\'))\''),
  file('program.js', [
    "fact(p('a'))",
    'implied_by(apply(G), call(G))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "apply(p('a'))",
  ]),
])

conformance('negation runs after the closure it inspects', [
  spec('6.1, 8.2'),
  file('program.js', [
    "fact(seed('a'), seed('b'))",
    'implies([seed(X), not(blocked(X))], clear(X))',
    'implies([seed(X), danger(X)], blocked(X))',
    "fact(danger('b'))",
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "blocked('b')",
    "clear('a')",
  ]),
])

conformance('strata compare whole terms, not just names', [
  spec('6.1'),
  file('program.js', [
    "fact(t('a', 'seed', 'true'))",
    "implies([t(X, 'seed', 'true'), not(t(X, 'blocked', 'true'))], t(X, 'allowed', 'true'))",
    "implies(t(X, 'seed', 'true'), t(X, 'blocked', 'true'))",
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    "t('a', 'blocked', 'true')",
  ]),
])

conformance('a helper-returned rule value can be reused without a standalone rule', [
  spec('3.4, 6.2'),
  file('program.js', [
    "fact(dog('a'))",
    'function rule() { return implies(dog(Y), tagged(Y)) }',
    'const template = rule()',
    'implies(cat(X), template)',
    'implies(tame(X), template)',
    'query(tagged(Y))',
  ]),
  stdout([
    '// No answers: no query() instance holds.',
  ]),
])

conformance('an unembedded rule return value still states its clause', [
  spec('3.4, 6.2'),
  file('program.js', [
    "fact(p('a'))",
    'const direct = implies(p(X), q(X))',
    'const backward = implied_by(r(X), q(X))',
    'query(r(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "r('a')",
  ]),
])

conformance('anonymous variables of nested rules do not capture the generator', [
  spec('3.3, 6.2'),
  file('program.js', [
    "fact(p('a'), q('b'))",
    'implies(p(_), implied_by(r(_), q(_)))',
    "query(r('z'))",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "r('z')",
  ]),
])

conformance('pure template constructors have the same guarded behavior', [
  spec('6.2'),
  file('program.js', [
    "fact(p('a'))",
    "implies('true', [forward(p(X), q(X)), backward(r(X), q(X))])",
    'query(r(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "r('a')",
  ]),
])

conformance('source rule inspection excludes its own inspecting rule', [
  spec('6.3'),
  file('program.js', [
    "fact(a('b'))",
    'implies(a(X), c(X))',
    'implies(implies(X, Y), test(X, Y))',
    'query(test(X, Y))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'test(a(A), c(A))',
  ]),
])

conformance('backward rule inspection preserves a conjunction and shared variables', [
  spec('6.3'),
  file('program.js', [
    'implied_by(c(X), [a(X), b(X)])',
    'implies(implied_by(H, B), inspected(H, B))',
  ]),
  stdout([
    '// Conclusions: the facts the program derives, in the order derived.',
    'inspected(c(A), and(a(A), b(A)))',
  ]),
])

// Additional boundary and specification-coverage cases.

conformance("explicit predicate names reject the reserved name step", [
  spec("3.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "preds('step')",
  ]),
  stdout([
  ]),
])

conformance("explicit predicate names reject the reserved name clause", [
  spec("3.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "preds('clause')",
  ]),
  stdout([
  ]),
])

conformance("explicit predicate names reject the reserved name activated", [
  spec("3.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "preds('activated')",
  ]),
  stdout([
  ]),
])

conformance("explicit predicate names reject the reserved name forward", [
  spec("3.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "preds('forward')",
  ]),
  stdout([
  ]),
])

conformance("explicit predicate names reject the reserved name backward", [
  spec("3.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "preds('backward')",
  ]),
  stdout([
  ]),
])

conformance("explicit predicate names reject the reserved name struct", [
  spec("3.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "preds('struct')",
  ]),
  stdout([
  ]),
])

conformance("explicit predicate names reject the reserved name implies", [
  spec("3.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "preds('implies')",
  ]),
  stdout([
  ]),
])

conformance("explicit predicate names reject the reserved name implied_by", [
  spec("3.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "preds('implied_by')",
  ]),
  stdout([
  ]),
])

conformance("explicit predicate names reject the reserved name unify", [
  spec("3.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "preds('unify')",
  ]),
  stdout([
  ]),
])

conformance("explicit predicate names reject the reserved name not", [
  spec("3.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "preds('not')",
  ]),
  stdout([
  ]),
])

conformance("explicit names reject preds('a-b')", [
  spec("3.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "preds('a-b')",
  ]),
  stdout([
  ]),
])

conformance("explicit names reject vars('1X')", [
  spec("3.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "vars('1X')",
  ]),
  stdout([
  ]),
])

conformance("explicit names reject vars('class')", [
  spec("3.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "vars('class')",
  ]),
  stdout([
  ]),
])

conformance("struct requires an atom name", [
  spec("3.3"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "fact(struct(1, 2))",
  ]),
  stdout([
  ]),
])

conformance("implies rejects 1 statement arguments", [
  spec("3.4"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "implies(p)",
  ]),
  stdout([
  ]),
])

conformance("implies rejects 3 statement arguments", [
  spec("3.4"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "implies(p, q, r)",
  ]),
  stdout([
  ]),
])

conformance("implied_by rejects 1 statement arguments", [
  spec("3.4"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "implied_by(p)",
  ]),
  stdout([
  ]),
])

conformance("implied_by rejects 3 statement arguments", [
  spec("3.4"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "implied_by(p, q, r)",
  ]),
  stdout([
  ]),
])

conformance("an open body list is not a conjunction", [
  spec("3.5, 4.1"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "implied_by(p, [q, ...T])",
  ]),
  stdout([
  ]),
])

conformance("fact with no arguments states no clauses", [
  spec("3.4, 3.5"),
  stderr('empty'),
  file('program.js', [
    "fact()",
  ]),
  stdout([
    "// No conclusions: the program derives no facts.",
  ]),
])

conformance("a backward outer rule cannot generate a forward template", [
  spec("6.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "implied_by(implies(p(X), q(X)), enabled)",
  ]),
  stdout([
  ]),
])

conformance("a backward outer rule cannot generate a backward template", [
  spec("6.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "implied_by(implied_by(q(X), p(X)), enabled)",
  ]),
  stdout([
  ]),
])

conformance("an inactive nested generator cannot hide a collection dependency cycle", [
  spec("6.1, 6.2"),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "implies(enabled('off'), implies(findall(X, p(X), L), implied_by(p('a'), 'true')))",
  ]),
  stdout([
  ]),
])

// Scripts (3.1).

conformance('clauses are numbered in the order their statement calls run', [
  spec('3.1, 3.5'),
  args("--proof --goal 'p(2)' program.js"),
  file('program.js', [
    'function later() { fact(p(2)) }',
    'fact(p(1))',
    'later()',
    'fact(p(3))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(2)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(2, fact(p(2)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(p(2), clause(2), {}, [])',
  ]),
])

conformance('scripts are processed in command-line order, not by name', [
  spec('3.1, 3.5'),
  args("--proof --goal 'p(X)' b.js a.js"),
  file('a.js', [
    'fact(p(1))',
  ]),
  file('b.js', [
    'fact(q(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(2, fact(p(1)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(p(1), clause(2), {}, [])',
  ]),
])

conformance('a program is a non-strict script', [
  spec('3.1, 3.2'),
  args("program.js --goal 'p(X, Y)'"),
  file('program.js', [
    'count = 2',
    'fact(p(count, 010))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(2, 8)',
  ]),
])

conformance('the supplied name fail is the atom fail', [
  spec('3.1'),
  file('program.js', [
    'fact(p(1))',
    'query(or(fail, p(X)))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    "or('fail', p(1))",
  ]),
])

// Names (3.2).

conformance('Math keeps its JavaScript meaning', [
  spec('3.2, 3.3'),
  args("program.js --goal 'p(X, Y)'"),
  file('program.js', [
    'fact(p(Math.max(2, 5), Math.sqrt(2)))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(5, 1.4142135623730951)',
  ]),
])

conformance('BigInt keeps its JavaScript meaning', [
  spec('3.2, 3.3'),
  args("program.js --goal 'p(X)'"),
  file('program.js', [
    "fact(p(BigInt('123456789012345678901234567890')))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(123456789012345678901234567890)',
  ]),
])

conformance('parseInt and parseFloat keep their JavaScript meaning', [
  spec('3.2, 3.3'),
  args("program.js --goal 'p(X, Y)'"),
  file('program.js', [
    "fact(p(parseInt('42', 10), parseFloat('2.5')))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(42, 2.5)',
  ]),
])

conformance('globalThis reaches a global whose bare name is a variable', [
  spec('3.2'),
  args("program.js --goal 'p(T, 1)'"),
  file('program.js', [
    'fact(p(typeof globalThis.Date, Date))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "p('function', 1)",
  ]),
])

conformance('Map and Object are logic variables', [
  spec('3.2'),
  file('program.js', [
    'query(unify(Map, 1), unify(Object, Map))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'and(unify(1, 1), unify(1, 1))',
  ]),
])

conformance('an underscore followed by a lowercase letter names a variable', [
  spec('3.2'),
  args("program.js --goal 'pair(1, 2)' --goal 'pair(3, 3)'"),
  file('program.js', [
    'fact(pair(_x, _x))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'pair(3, 3)',
  ]),
])

conformance('a name starting with a non-ASCII capital is a predicate', [
  spec('3.2'),
  args("program.js --goal \"struct('Été', X)\""),
  file('program.js', [
    'fact(Été(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "struct('Été', 1)",
  ]),
])

conformance('vars names a variable that starts with a lowercase letter', [
  spec('3.2'),
  args("program.js --goal 'pair(1, 2)' --goal 'pair(3, 3)'"),
  file('program.js', [
    "const x = vars('x')",
    'fact(pair(x, x))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'pair(3, 3)',
  ]),
])

conformance('preds accepts names separated by commas', [
  spec('3.2'),
  args("program.js --goal 'alpha(X)' --goal 'beta(Y)'"),
  file('program.js', [
    "const [p1, p2] = preds('alpha,beta')",
    'fact(p1(1), p2(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'alpha(1)',
    'beta(2)',
  ]),
])

conformance('preds may name a predicate after a supplied statement', [
  spec('3.2'),
  args("program.js --goal 'query(X)'"),
  file('program.js', [
    "const asked = preds('query')",
    "fact(asked('x'))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "query('x')",
  ]),
])

conformance('explicit predicate names reject the primitive fail', [
  spec('3.2'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "preds('fail')",
  ]),
  stdout([]),
])

conformance('explicit predicate names reject a reserved JavaScript word', [
  spec('3.2'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "preds('delete')",
  ]),
  stdout([]),
])

conformance('explicit predicate names must be ASCII identifiers', [
  spec('3.2'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "preds('été')",
  ]),
  stdout([]),
])

conformance('a misspelled statement without arguments is an error', [
  spec('3.2'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(1))',
    'fcat()',
  ]),
  stdout([]),
])

// Term construction (3.3).

conformance('JavaScript arithmetic can lose integer precision before a term exists', [
  spec('3.3'),
  args("program.js --goal 'p(X)'"),
  file('program.js', [
    'fact(p(2 ** 60 + 1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(1152921504606846976)',
  ]),
])

conformance('the program number 2.0 is the integer 2', [
  spec('3.3'),
  args("program.js --goal 'p(2)' --goal 'p(2.0)'"),
  file('program.js', [
    'fact(p(2.0))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(2)',
  ]),
])

conformance('a large integral JavaScript number is an integer', [
  spec('3.3'),
  args("program.js --goal 'p(X)'"),
  file('program.js', [
    'fact(p(1e22))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(10000000000000000000000)',
  ]),
])

conformance('JavaScript negative zero is the integer 0', [
  spec('3.3'),
  args("program.js --goal 'p(X)'"),
  file('program.js', [
    'fact(p(-0))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(0)',
  ]),
])

conformance('float makes integral values and signed zero floats', [
  spec('3.3, 9.2'),
  args("program.js --goal 'p(A, B, C, D)'"),
  file('program.js', [
    'fact(p(float(2), float(-0), float(1e22), float(0.00001)))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p(2.0, -0.0, 1e+22, 1e-05)',
  ]),
])

conformance('the sum of two halves is the integer 1', [
  spec('3.3'),
  file('program.js', [
    'query(is_int(0.5 + 0.5))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'is_int(1)',
  ]),
])

conformance('operators on plain JavaScript values are evaluated first', [
  spec('3.3'),
  args("program.js --goal 'p(X, Y)'"),
  file('program.js', [
    "fact(p(3 + 4, 'a' + 'b'))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "p(7, 'ab')",
  ]),
])

conformance('adding to a variable is an error', [
  spec('3.3'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'implies(q(X), p(X + 1))',
  ]),
  stdout([]),
])

conformance('multiplying a compound is an error', [
  spec('3.3'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(f(1) * 2))',
  ]),
  stdout([]),
])

conformance('an operator on a predicate constructor is an error', [
  spec('3.3'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(q + 1))',
  ]),
  stdout([]),
])

conformance('negating a variable with a minus sign is an error', [
  spec('3.3'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'implies(q(X), p(-X))',
  ]),
  stdout([]),
])

conformance('concatenating a string with a variable is an error', [
  spec('3.3'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "implies(q(X), p('id-' + X))",
  ]),
  stdout([]),
])

conformance('struct rejects a predicate constructor as its name', [
  spec('3.3'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(struct(q, 1))',
  ]),
  stdout([]),
])

conformance("struct('[]') is the empty list", [
  spec('2.2, 3.3'),
  file('program.js', [
    "query(identical(struct('[]'), []))",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'identical([], [])',
  ]),
])

conformance("struct('.', H, T) builds a list cell", [
  spec('2.2, 3.3'),
  file('program.js', [
    "query(identical(struct('.', 1, [2]), [1, 2]))",
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'identical([1, 2], [1, 2])',
  ]),
])

conformance('a spread JavaScript array supplies its elements', [
  spec('3.3'),
  args("program.js --goal 'p(L)'"),
  file('program.js', [
    'fact(p([...[1, 2], 3, ...[4]]))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p([1, 2, 3, 4])',
  ]),
])

conformance('a spread string supplies its characters', [
  spec('3.3'),
  args("program.js --goal 'p(L)'"),
  file('program.js', [
    "fact(p(['a', ...'b𐀀']))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "p(['a', 'b', '𐀀'])",
  ]),
])

conformance('a spread compound supplies the tail', [
  spec('2.2, 3.3'),
  args("program.js --goal 'p(L)'"),
  file('program.js', [
    'fact(p([1, ...f(2)]))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'p([1, ...f(2)])',
  ]),
])

conformance('anonymous variable names restart in every clause', [
  spec('3.3, 10.2, 10.3'),
  args("--proof --goal 'q(1)' program.js"),
  file('program.js', [
    "fact(p(_, 'x'))",
    'implied_by(q(_), p(_, _))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'q(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    "clause(1, fact(p(_0, 'x')))",
    'clause(2, implied_by(q(_0), p(_1, _2)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(q(1), clause(2), {_0: 1, _1: A, _2: 'x'}, [p(A, 'x')])",
    "step(p(A, 'x'), clause(1), {_0: A}, [])",
  ]),
])

conformance('a predicate called with no arguments is its atom', [
  spec('3.3'),
  args('program.js --goal "\'done\'"'),
  file('program.js', [
    'fact(done())',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "'done'",
  ]),
])

// Statements (3.4).

conformance('contradiction needs a goal', [
  spec('3.4'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'contradiction()',
  ]),
  stdout([]),
])

conformance('contradiction with several goals is one conjunction', [
  spec('3.4'),
  file('program.js', [
    'fact(p(1), q(2))',
    'contradiction(p(X), q(X))',
  ]),
  stdout([
    '// No conclusions: the program derives no facts.',
  ]),
])

conformance('contradiction accepts an array as one conjunction', [
  spec('3.4, 8.5'),
  exit(65),
  file('program.js', [
    'fact(p(1), q(1))',
    'contradiction([p(X), q(X)])',
  ]),
  stdout([
    "// Halted: a contradiction() holds; the facts derived until then, ending with 'false'.",
    "'false'",
  ]),
])

conformance('implies rejects an empty array of premises', [
  spec('3.4, 3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'implies([], p)',
  ]),
  stdout([]),
])

conformance('implies rejects an empty array of heads', [
  spec('3.4, 3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'implies(p, [])',
  ]),
  stdout([]),
])

conformance("implies cannot conclude 'true'", [
  spec('3.4, 3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "implies(p, 'true')",
  ]),
  stdout([]),
])

conformance('facts_from reads bare names as variables', [
  spec('3.4, 9.1'),
  args("program.js --goal 'likes(X, Y)'"),
  file('program.js', [
    "facts_from({text: 'likes(alice, bob)'})",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'likes(A, B)',
  ]),
])

conformance('facts_from reads 2.0 as a float, unlike a program', [
  spec('3.3, 3.4, 9.1'),
  file('program.js', [
    "facts_from({text: 'p(2.0)\\np(2)'})",
    'query(p(X), is_float(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'and(p(2.0), is_float(2.0))',
  ]),
])

conformance('facts_from rejects an operator rather than evaluating it', [
  spec('3.4, 9.1'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "facts_from({text: 'p(1 + 2)'})",
  ]),
  stdout([]),
])

conformance('facts_from with empty text states nothing', [
  spec('3.4'),
  file('program.js', [
    "facts_from({text: ''})",
  ]),
  stdout([
    '// No conclusions: the program derives no facts.',
  ]),
])

conformance('facts_from of a missing file is an error', [
  spec('3.4'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "facts_from('missing.js')",
  ]),
  stdout([]),
])

conformance('facts_from reads an object literal as a list of pairs', [
  spec('3.4, 9.1'),
  args("program.js --goal 'p(L)'"),
  file('program.js', [
    "facts_from({text: 'p({a: 1, \"b c\": [2]})'})",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    "p([struct('=', 'a', 1), struct('=', 'b c', [2])])",
  ]),
])

// Clause constraints and numbering (3.5).

conformance('a query takes a clause number', [
  spec('3.5'),
  args("--proof --goal 'q(X)' program.js"),
  file('program.js', [
    'fact(p(1))',
    'query(p(X))',
    'fact(q(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'q(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(3, fact(q(1)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(q(1), clause(3), {}, [])',
  ]),
])

conformance('an embedded rule call takes no clause number', [
  spec('3.5, 6.2'),
  args("--proof --goal 'q(X)' program.js"),
  file('program.js', [
    'implies(p(X), implies(q(Y), r(Y)))',
    'fact(q(2))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'q(2)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(2, fact(q(2)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(q(2), clause(2), {}, [])',
  ]),
])

conformance('facts read by facts_from are numbered where the call stands', [
  spec('3.4, 3.5'),
  args("--proof --goal 'c(X)' program.js"),
  file('program.js', [
    'fact(a(1))',
    "facts_from({text: 'b(1)\\nb(2)'})",
    'fact(c(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'c(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(4, fact(c(1)))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(c(1), clause(4), {}, [])',
  ]),
])

conformance('a clause records the line where its statement call begins', [
  spec('3.5, 13.2'),
  args('--unused program.js'),
  file('program.js', [
    'fact(p(1))',
    '',
    'fact(',
    '  q(2),',
    '  r(3)',
    ')',
  ]),
  stdout([
    'unused(line(1), fact(p(1)))',
    'unused(line(3), fact(q(2)))',
    'unused(line(3), fact(r(3)))',
  ]),
])

conformance('facts read by facts_from record the line of the call', [
  spec('3.5, 13.2'),
  args('--unused program.js'),
  file('program.js', [
    '// data',
    "facts_from({text: 'p(1)\\n\\np(2)'})",
  ]),
  stdout([
    'unused(line(2), fact(p(1)))',
    'unused(line(2), fact(p(2)))',
  ]),
])

conformance('a variable cannot be a head', [
  spec('3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'implied_by(X, p(X))',
  ]),
  stdout([]),
])

conformance('the primitive fail cannot be a head', [
  spec('3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(fail)',
  ]),
  stdout([]),
])

conformance('the control or cannot be a head', [
  spec('3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'implied_by(or(p, q), r)',
  ]),
  stdout([]),
])

conformance('implies cannot conclude a primitive', [
  spec('3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), unify(X, 1))',
  ]),
  stdout([]),
])

conformance('step and clause of other arities are ordinary predicates', [
  spec('3.5'),
  args("program.js --goal 'step(A, B, C)' --goal 'clause(X)'"),
  file('program.js', [
    "fact(struct('step', 1, 2, 3), struct('clause', 1))",
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'step(1, 2, 3)',
    'clause(1)',
  ]),
])

conformance('activated of another arity is an ordinary predicate', [
  spec('3.5'),
  args("program.js --goal 'activated(X)'"),
  file('program.js', [
    'fact(activated(1))',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'activated(1)',
  ]),
])

conformance('an improper list is not a goal', [
  spec('3.5, 4.1'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    "implied_by(p, struct('.', q, 'r'))",
  ]),
  stdout([]),
])

conformance('an empty array inside not is not a goal', [
  spec('3.5, 4.1'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'query(not([]))',
  ]),
  stdout([]),
])

conformance('nested conjunction arrays in a body are flattened', [
  spec('3.5, 10.2'),
  args("--proof --goal 'r(X)' program.js"),
  file('program.js', [
    'fact(p(1), q(1), s(1))',
    'implied_by(r(X), [[p(X), q(X)], s(X)])',
  ]),
  stdout([
    '// Answers: each instance of a goal that holds.',
    'r(1)',
    '',
    '// Clauses: the program clauses the steps cite, by clause number.',
    'clause(1, fact(p(1)))',
    'clause(2, fact(q(1)))',
    'clause(3, fact(s(1)))',
    'clause(4, implied_by(r(X), [p(X), q(X), s(X)]))',
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    'step(r(1), clause(4), {X: 1}, [p(1), q(1), s(1)])',
    'step(p(1), clause(1), {}, [])',
    'step(q(1), clause(2), {}, [])',
    'step(s(1), clause(3), {}, [])',
  ]),
])

// Behaviors the specification settles explicitly (resolved gaps).

conformance('scripts share no declarations', [
  spec('3.1'),
  args('a.js b.js'),
  file('a.js', [
    'const K = 3',
  ]),
  file('b.js', [
    'fact(p(K))',
    'query(p(X))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'p(A)',
  ]),
])

conformance('float of a BigInt is the arithmetic function float/1', [
  spec('3.3'),
  file('program.js', [
    'fact(p(float(2n)))',
    'query(p(X))',
    'query(is(Y, float(2n)))',
  ]),
  stdout([
    '// Answers: each instance of a query() that holds.',
    'p(float(2))',
    'is(2.0, float(2))',
  ]),
])

conformance('a list cannot be the head of a backward rule', [
  spec('3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'implied_by([p, q], r)',
  ]),
  stdout([
  ]),
])

conformance('a list cannot be a fact', [
  spec('3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact([1])',
  ]),
  stdout([
  ]),
])

conformance('the empty list cannot be a fact', [
  spec('3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact([])',
  ]),
  stdout([
  ]),
])

conformance('a list cannot be a forward head conjunct', [
  spec('3.5'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(a)',
    'implies(a, [b, [1]])',
  ]),
  stdout([
  ]),
])

conformance('spreading a variable before the last item is an error', [
  spec('2.2, 3.3'),
  exit(1),
  stderr(prefix('eyemind:')),
  file('program.js', [
    'fact(p([...T, 1]))',
  ]),
  stdout([
  ]),
])
