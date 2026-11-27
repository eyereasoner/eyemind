// Answers: each instance of a query() that holds.
struct('le:answer', 'beautiful')

// Certificate: the derived facts and every answer of each call the questions make.
called(struct('le:answer', 'beautiful'), [struct('le:answer', 'beautiful')])
called(is_beautiful('beetle'), [is_beautiful('beetle')])
called(has_property_or('beetle', A, B), [has_property_or('beetle', 'green', 'blue')])
