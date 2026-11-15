// Answers: each instance of a query() that holds.
t('alice', 'name', 'Alice')
t('alice', 'age', 30)

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(t('alice', 'name', 'Alice'), clause(5), {S: 'alice', Source: 'source_name', O: 'Alice', Target: 'name'}, [t('alice', 'source_name', 'Alice'), maps('source_name', 'name')])
step(t('alice', 'source_name', 'Alice'), clause(1), {}, [])
step(t('alice', 'age', 30), clause(5), {S: 'alice', Source: 'source_age', O: 30, Target: 'age'}, [t('alice', 'source_age', 30), maps('source_age', 'age')])
step(t('alice', 'source_age', 30), clause(2), {}, [])

// Certificate: the derived facts and every answer of each call the questions make.
derived(t(A, B, C), [t('alice', 'name', 'Alice'), t('alice', 'age', 30)])
called(t('alice', 'name', A), [t('alice', 'name', 'Alice')])
called(t(B, C, D), [t('alice', 'name', 'Alice'), t('alice', 'age', 30), t('alice', 'source_name', 'Alice'), t('alice', 'source_age', 30)])
called(t('alice', 'age', E), [t('alice', 'age', 30)])
