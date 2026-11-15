// Checked answers: these follow from the input program and are every answer of its questions.
has_record('alice', record('person_rule', 'alice'))
record_owner(record('person_rule', 'alice'), 'alice')
has_record('bob', record('person_rule', 'bob'))
record_owner(record('person_rule', 'bob'), 'bob')

verdict('checked')
