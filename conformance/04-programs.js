// SPEC 3 and 6: programs, statements, names, rejected clauses and stratification.

conformance('an inline forward template has local universal variables and activation evidence', [
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
    'clause(3, implies(cat(X), activated(4, [])))',
    "clause(4, implies([activated(4, []), dog(Y)], test('yes')))",
    '',
    '// Steps: each goal, what justifies it (a clause, a builtin, a control, or an',
    '// absence or collection taken on trust), the bindings and the goals it uses.',
    "step(test('yes'), clause(4), {Y: 'charly'}, [activated(4, []), dog('charly')])",
    "step(activated(4, []), clause(3), {X: 'minka'}, [cat('minka')])",
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

conformance('a source program cannot state its own activation fact', [
  spec('6.2'),
  exit(1),
  file('program.js', ['fact(activated(2, []))']),
  stdout([]),
  stderr(prefix('eyemind: line 1: activated/2 is reserved for generated rules')),
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
