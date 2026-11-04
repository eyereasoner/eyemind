// Answers: each instance of a query() that holds.
t('alice', 'name', 'Alice')
t('alice', 'age', 30)

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(t('alice', 'source_name', 'Alice')))
clause(2, fact(t('alice', 'source_age', 30)))
clause(3, fact(maps('source_name', 'name')))
clause(4, fact(maps('source_age', 'age')))
clause(5, implies([t(S, Source, O), maps(Source, Target)], t(S, Target, O)))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(t('alice', 'name', 'Alice'), clause(5), {S: 'alice', Source: 'source_name', O: 'Alice', Target: 'name'}, [t('alice', 'source_name', 'Alice'), maps('source_name', 'name')])
step(t('alice', 'source_name', 'Alice'), clause(1), {}, [])
step(maps('source_name', 'name'), clause(3), {}, [])
step(t('alice', 'age', 30), clause(5), {S: 'alice', Source: 'source_age', O: 30, Target: 'age'}, [t('alice', 'source_age', 30), maps('source_age', 'age')])
step(t('alice', 'source_age', 30), clause(2), {}, [])
step(maps('source_age', 'age'), clause(4), {}, [])
