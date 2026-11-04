// SPEC 4: programs, statements, names, rejected clauses and stratification.

conformance('an inline forward template has local universal variables and activation evidence', [
  spec('4.6, 10.2'),
  args('--proof program.js'),
  file('program.js', [
    "fact(cat('minka'))",
    "fact(dog('charly'))",
    "implies(cat(X), forward(dog(Y), test('yes')))",
  ]),
  stdout([
    "test('yes')",
    '',
    "clause(1, fact(cat('minka')))",
    "clause(2, fact(dog('charly')))",
    'clause(3, implies(cat(X), activated(4, [])))',
    "clause(4, implies([activated(4, []), dog(Y)], test('yes')))",
    '',
    "step(test('yes'), clause(4), {Y: 'charly'}, [activated(4, []), dog('charly')])",
    "step(activated(4, []), clause(3), {X: 'minka'}, [cat('minka')])",
    "step(cat('minka'), clause(1), {}, [])",
    "step(dog('charly'), clause(2), {}, [])",
  ]),
])

conformance('a backward template captures inverse names and keeps endpoints local', [
  spec('4.6'),
  file('program.js', [
    "fact(inverse('parent', 'child'))",
    "fact(t('alice', 'parent', 'bob'))",
    'implies(inverse(P, Q), backward(t(X, Q, Y), t(Y, P, X)))',
    "implies(t(X, 'child', Y), parent(X, Y))",
  ]),
  stdout(["parent('bob', 'alice')"]),
])

conformance('template bodies heads and generators support conjunctions', [
  spec('4.6'),
  file('program.js', [
    "fact(p('a'), p('b'), q('a'))",
    "implies('true', [ready('yes'), forward([p(X), q(X)], [r(X), s(X)]), backward([u(X), v(X)], [r(X), s(X)])])",
    'query([u(X), v(X)])',
  ]),
  stdout(["and(u('a'), v('a'))"]),
])

conformance('a variable shared only by sibling templates is local to each', [
  spec('4.6'),
  file('program.js', [
    "fact(p('a'), q('b'))",
    "implies('true', [forward(p(X), r(X)), backward(s(X), q(X))])",
    'query([r(X), s(Y)])',
  ]),
  stdout(["and(r('a'), s('b'))"]),
])

conformance('an inactive generator supplies neither forward nor backward conclusions', [
  spec('4.6'),
  file('program.js', [
    "fact(p('a'))",
    "implies(enabled('yes'), [forward(p(X), q(X)), backward(r(X), p(X))])",
    'query(or(q(X), r(X)))',
  ]),
  stdout([]),
])

conformance('negation and collection wait for an enabled template to finish', [
  spec('4.5, 4.6, 7.2'),
  file('program.js', [
    "fact(seed('a'))",
    'implies(findall(X, item(X), L), items(L))',
    "implies(not(item('a')), missing('a'))",
    "implies(enabled('yes'), forward(seed(X), item(X)))",
    "implies('true', enabled('yes'))",
  ]),
  stdout(["enabled('yes')", "item('a')", "items(['a'])"]),
])

conformance('a closed cycle through a forward template is rejected', [
  spec('4.5, 4.6'),
  exit(1),
  file('program.js', ["implies(not(p('a')), forward('true', p('a')))"]),
  stdout([]),
  stderr(prefix('eyemind: unstratified negation or collection dependency')),
])

conformance('a closed cycle through a backward template is rejected', [
  spec('4.5, 4.6'),
  exit(1),
  file('program.js', ["implies(findall(X, p(X), L), backward(p('a'), 'true'))"]),
  stdout([]),
  stderr(prefix('eyemind: unstratified negation or collection dependency')),
])

conformance('a variable call in a generated backward body is rejected', [
  spec('4.6'),
  exit(1),
  file('program.js', ["implies('true', backward(p(X), call(G)))"]),
  stdout([]),
  stderr(prefix('eyemind: line 1: generated rule bodies require statically named calls')),
])

conformance('a source program cannot state its own activation fact', [
  spec('4.6'),
  exit(1),
  file('program.js', ['fact(activated(2, []))']),
  stdout([]),
  stderr(prefix('eyemind: line 1: activated/2 is reserved for generated rules')),
])

conformance('fact states one fact per argument, numbered in order', [
  spec('4.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1), p(2))',
    'implies(p(X), q(X))',
  ]),
  stdout([
    'q(1)',
    'q(2)',
    '',
    'clause(1, fact(p(1)))',
    'clause(2, fact(p(2)))',
    'clause(3, implies(p(X), q(X)))',
    '',
    'step(q(1), clause(3), {X: 1}, [p(1)])',
    'step(p(1), clause(1), {}, [])',
    'step(q(2), clause(3), {X: 2}, [p(2)])',
    'step(p(2), clause(2), {}, [])',
  ]),
])

conformance('a forward rule may conclude several heads joined with &', [
  spec('4.2'),
  args('--proof program.js'),
  file('program.js', [
    'fact(p(1))',
    'implies(p(X), [a(X), b(X)])',
  ]),
  stdout([
    'a(1)',
    'b(1)',
    '',
    'clause(1, fact(p(1)))',
    'clause(2, implies(p(X), [a(X), b(X)]))',
    '',
    'step(a(1), clause(2), {X: 1}, [p(1)])',
    'step(p(1), clause(1), {}, [])',
    'step(b(1), clause(2), {X: 1}, [p(1)])',
  ]),
])

conformance('a backward rule without a body is a fact', [
  spec('4.2'),
  args("--proof --goal 'p(X)' program.js"),
  file('program.js', [
    'fact(p(1))',
  ]),
  stdout([
    'p(1)',
    '',
    'clause(1, fact(p(1)))',
    '',
    'step(p(1), clause(1), {}, [])',
  ]),
])

conformance('a body conjunction is split into its goals', [
  spec('4.2'),
  args("--proof --goal 'r(X)' program.js"),
  file('program.js', [
    'fact(p(1), q(1))',
    'implied_by(r(X), [p(X), q(X)])',
  ]),
  stdout([
    'r(1)',
    '',
    'clause(1, fact(p(1)))',
    'clause(2, fact(q(1)))',
    'clause(3, implied_by(r(X), [p(X), q(X)]))',
    '',
    'step(r(1), clause(3), {X: 1}, [p(1), q(1)])',
    'step(p(1), clause(1), {}, [])',
    'step(q(1), clause(2), {}, [])',
  ]),
])

conformance('query publishes each instance of its body', [
  spec('4.2'),
  file('program.js', [
    'fact(p(1), p(2), q(2))',
    'query(p(X), q(X))',
  ]),
  stdout([
    'and(p(2), q(2))',
  ]),
])

conformance('contradiction stops with exit code 65', [
  spec('4.2, 7.5'),
  exit(65),
  file('program.js', [
    "fact(account('bob', -5))",
    'contradiction(account(Owner, Balance), lt(Balance, 0))',
  ]),
  stdout([
    "'false'",
  ]),
])

conformance('facts_from states every expression of a document as a fact', [
  spec('4.2, 9'),
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
    "edge('a', 'b')",
    "edge('a', [1, 2.5, -3])",
  ]),
])

conformance('facts_from reads text too', [
  spec('4.2'),
  file('program.js', [
    "facts_from({text: 'score(\\'ann\\', 3)\\nscore(\\'bob\\', 5)\\n'})",
    'query(score(Who, S), gt(S, 4))',
  ]),
  stdout([
    "and(score('bob', 5), gt(5, 4))",
  ]),
])

conformance('several program files form one program, numbered in order', [
  spec('4.1'),
  args('--proof a.js b.js'),
  file('a.js', [
    'fact(p(1))',
  ]),
  file('b.js', [
    'implies(p(X), q(X))',
  ]),
  stdout([
    'q(1)',
    '',
    'clause(1, fact(p(1)))',
    'clause(2, implies(p(X), q(X)))',
    '',
    'step(q(1), clause(2), {X: 1}, [p(1)])',
    'step(p(1), clause(1), {}, [])',
  ]),
])

conformance('undefined lowercase names are predicates', [
  spec('4.3'),
  file('program.js', [
    "fact(type('socrates', 'human'))",
    "fact(sum(1, 2), id(7), max('x'))",
    'query(type(X, Y), sum(1, Z), id(I), max(M))',
  ]),
  stdout([
    "and(type('socrates', 'human'), sum(1, 2), id(7), max('x'))",
  ]),
])

conformance('undefined names starting with a capital or _ are variables', [
  spec('4.3'),
  file('program.js', [
    'fact(pair(1, 2))',
    'query(pair(First, _Second))',
  ]),
  stdout([
    'pair(1, 2)',
  ]),
])

conformance('kept globals keep their JavaScript meaning', [
  spec('4.3'),
  file('program.js', [
    'for (let i = 0; i < 3; i++) {',
    '  fact(n(i, JSON.stringify(i * 10).length))',
    '}',
    'query(n(I, L))',
  ]),
  stdout([
    'n(0, 1)',
    'n(1, 2)',
    'n(2, 2)',
  ]),
])

conformance('other JavaScript globals are predicates and variables', [
  spec('4.3'),
  file('program.js', [
    "fact(eval(1), name('x'), born(1990))",
    'query(eval(E))',
    'query(name(N))',
    'query(born(Date))',
  ]),
  stdout([
    'eval(1)',
    "name('x')",
    'born(1990)',
  ]),
])

conformance("an error in a program's own JavaScript code is reported at its line", [
  spec('4.1, 14'),
  exit(1),
  stderr(prefix('eyemind: line 2:')),
  file('program.js', [
    'fact(p(1))',
    "JSON.parse('{')",
  ]),
  stdout([]),
])

conformance('a program may name a kept global as a predicate', [
  spec('4.3'),
  file('program.js', [
    "const isFinite = preds('isFinite')",
    "fact(isFinite('parent_of', 'person'))",
    'query(isFinite(P, C))',
  ]),
  stdout([
    "isFinite('parent_of', 'person')",
  ]),
])

conformance('preds and vars name predicates and variables explicitly', [
  spec('4.3'),
  file('program.js', [
    "const [p, q] = preds('p q')",
    "const A = vars('A')",
    'fact(p(1))',
    'implies(p(A), q(A))',
  ]),
  stdout([
    'q(1)',
  ]),
])

conformance('helper functions see the names a program leaves undefined', [
  spec('4.3'),
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
    'path(0, 1)',
    'path(0, 2)',
    'path(0, 3)',
  ]),
])

conformance('a predicate called on its own states nothing and is an error', [
  spec('4.3'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'fact(p(1))',
    'fcat(p(2))',
  ]),
  stdout([]),
])

conformance('a predicate name used uncalled is its atom', [
  spec('4.3'),
  file('program.js', [
    'fact(ready)',
    'query(ready, not(blocked))',
  ]),
  stdout([
    "and('ready', not('blocked'))",
  ]),
])

conformance('every _ in a clause is a variable of its own', [
  spec('4.4'),
  args("program.js --goal 'pair(1, 2)'"),
  file('program.js', [
    'fact(pair(_, _))',
  ]),
  stdout([
    'pair(1, 2)',
  ]),
])

conformance('struct builds a compound with any name', [
  spec('4.4'),
  args('program.js --goal \'struct(\'"\'"\'hello world\'"\'"\', X)\' --goal \'from(Y)\''),
  file('program.js', [
    "fact(struct('hello world', 1))",
    "fact(struct('from', 'here'))",
  ]),
  stdout([
    "struct('hello world', 1)",
    "from('here')",
  ]),
])

conformance('struct with only a name is the atom', [
  spec('4.4'),
  args("program.js --goal 'p(X)'"),
  file('program.js', [
    "fact(p(struct('lonely')))",
  ]),
  stdout([
    "p('lonely')",
  ]),
])

conformance('arithmetic terms are built by calls', [
  spec('4.4'),
  file('program.js', [
    'query(unify(T, add(mul(X, 2), 1)), unify(X, 3))',
  ]),
  stdout([
    'and(unify(add(mul(3, 2), 1), add(mul(3, 2), 1)), unify(3, 3))',
  ]),
])

conformance('[H, *T] is a list with head H and tail T', [
  spec('4.4'),
  args("program.js --goal 'split([1, 2, 3], H, T)'"),
  file('program.js', [
    'fact(split([H, ...T], H, T))',
  ]),
  stdout([
    'split([1, 2, 3], 1, [2, 3])',
  ]),
])

conformance('a term used as a truth value is an error', [
  spec('4.4'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'implies([q(X), X > 1], p(X))',
  ]),
  stdout([]),
])

conformance('a head of step/4 is reserved', [
  spec('4.2'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "fact(struct('step', 1, 2, 3, 4))",
  ]),
  stdout([]),
])

conformance('a head of clause/2 is reserved', [
  spec('4.2'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "fact(struct('clause', 1, 2))",
  ]),
  stdout([]),
])

conformance('a primitive cannot be a head', [
  spec('4.2'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'fact(unify(1, 1))',
  ]),
  stdout([]),
])

conformance('a control cannot be a head', [
  spec('4.2'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "implied_by(call('a'), 'true')",
  ]),
  stdout([]),
])

conformance('true and false are not the conclusion of a backward rule', [
  spec('4.2'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    "implied_by('true', p(1))",
  ]),
  stdout([]),
])

conformance('implies cannot conclude true or false: query and contradiction do', [
  spec('4.2'),
  exit(1),
  stderr(prefix("eyemind: line 2: implies() cannot conclude 'true' or 'false'")),
  file('program.js', [
    'fact(p(1))',
    "implies(p(X), [q(X), 'false'])",
  ]),
  stdout([]),
])

conformance('query and contradiction need a goal', [
  spec('4.2'),
  exit(1),
  stderr(prefix('eyemind: line 1: query() needs at least one goal')),
  file('program.js', [
    'query()',
  ]),
  stdout([]),
])

conformance('a number cannot be a head', [
  spec('4.2'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'clause(42)',
  ]),
  stdout([]),
])

conformance('an empty array is not a goal', [
  spec('4.2'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'implied_by(p, [])',
  ]),
  stdout([]),
])

conformance('a number is not a goal', [
  spec('4.2'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'implied_by(p, 1)',
  ]),
  stdout([]),
])

conformance('a forward rule needs a premise', [
  spec('4.2'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'implies(p(1))',
  ]),
  stdout([]),
])

conformance('negation through a cycle is unstratified', [
  spec('4.5'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'implies(not(q), p)',
    'implies(p, q)',
  ]),
  stdout([]),
])

conformance('collection through a cycle is unstratified', [
  spec('4.5'),
  exit(1),
  stderr('nonempty'),
  file('program.js', [
    'implies(findall(Y, p(Y), L), p(L))',
  ]),
  stdout([]),
])

conformance('a forward rule cannot reach a call of a variable', [
  spec('4.5'),
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
  spec('4.5'),
  args('program.js --goal \'apply(p(\'"\'"\'a\'"\'"\'))\''),
  file('program.js', [
    "fact(p('a'))",
    'implied_by(apply(G), call(G))',
  ]),
  stdout([
    "apply(p('a'))",
  ]),
])

conformance('negation runs after the closure it inspects', [
  spec('4.5, 7.2'),
  file('program.js', [
    "fact(seed('a'), seed('b'))",
    'implies([seed(X), not(blocked(X))], clear(X))',
    'implies([seed(X), danger(X)], blocked(X))',
    "fact(danger('b'))",
  ]),
  stdout([
    "blocked('b')",
    "clear('a')",
  ]),
])

conformance('strata compare whole terms, not just names', [
  spec('4.5'),
  file('program.js', [
    "fact(t('a', 'seed', 'true'))",
    "implies([t(X, 'seed', 'true'), not(t(X, 'blocked', 'true'))], t(X, 'allowed', 'true'))",
    "implies(t(X, 'seed', 'true'), t(X, 'blocked', 'true'))",
  ]),
  stdout([
    "t('a', 'blocked', 'true')",
  ]),
])
