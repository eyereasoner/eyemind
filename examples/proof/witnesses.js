// Conclusions: the facts the program derives, in the order derived.
has_record('alice', record('person_rule', 'alice'))
record_owner(record('person_rule', 'alice'), 'alice')
has_record('bob', record('person_rule', 'bob'))
record_owner(record('person_rule', 'bob'), 'bob')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(person('alice')))
clause(2, fact(person('bob')))
clause(3, implies(person(Name), [has_record(Name, record('person_rule', Name)), record_owner(record('person_rule', Name), Name)]))

// Steps: each goal, what justifies it (a clause, a builtin, a control, or an
// absence or collection taken on trust), the bindings and the goals it uses.
step(has_record('alice', record('person_rule', 'alice')), clause(3), {Name: 'alice'}, [person('alice')])
step(person('alice'), clause(1), {}, [])
step(record_owner(record('person_rule', 'alice'), 'alice'), clause(3), {Name: 'alice'}, [person('alice')])
step(has_record('bob', record('person_rule', 'bob')), clause(3), {Name: 'bob'}, [person('bob')])
step(person('bob'), clause(2), {}, [])
step(record_owner(record('person_rule', 'bob'), 'bob'), clause(3), {Name: 'bob'}, [person('bob')])
