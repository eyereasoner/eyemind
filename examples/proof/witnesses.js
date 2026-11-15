// Conclusions: the facts the program derives, in the order derived.
has_record('alice', record('person_rule', 'alice'))
record_owner(record('person_rule', 'alice'), 'alice')
has_record('bob', record('person_rule', 'bob'))
record_owner(record('person_rule', 'bob'), 'bob')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(has_record('alice', record('person_rule', 'alice')), clause(3), {Name: 'alice'}, [person('alice')])
step(has_record('bob', record('person_rule', 'bob')), clause(3), {Name: 'bob'}, [person('bob')])
step(record_owner(record('person_rule', 'alice'), 'alice'), clause(3), {Name: 'alice'}, [person('alice')])
step(record_owner(record('person_rule', 'bob'), 'bob'), clause(3), {Name: 'bob'}, [person('bob')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(has_record(A, B), [has_record('alice', record('person_rule', 'alice')), has_record('bob', record('person_rule', 'bob'))])
derived(record_owner(A, B), [record_owner(record('person_rule', 'alice'), 'alice'), record_owner(record('person_rule', 'bob'), 'bob')])
called(has_record(A, record('person_rule', A)), [has_record('alice', record('person_rule', 'alice')), has_record('bob', record('person_rule', 'bob'))])
called(record_owner(record('person_rule', B), B), [record_owner(record('person_rule', 'alice'), 'alice'), record_owner(record('person_rule', 'bob'), 'bob')])
