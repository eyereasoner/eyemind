// Answers: each instance of a query() that holds.
struct('le:answer', 'properties', 'green')
struct('le:answer', 'nice')
struct('le:answer', 'properties', 'nice')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(has_property('beetle', 'green'), clause(8), {Thing: 'beetle', Property: 'green', ExcludedProperty: 'blue'}, [has_property_or('beetle', 'green', 'blue'), cannot_have_property('beetle', 'blue')])
step(has_property_or('beetle', 'green', 'blue'), clause(2), {Car: 'beetle'}, [is_a_car('beetle')])
step(cannot_have_property('beetle', 'blue'), clause(7), {Property: 'blue', Consequence: 'beautiful', Thing: 'beetle'}, [entails('blue', 'beautiful'), cannot_have_property('beetle', 'beautiful')])
step(cannot_have_property('beetle', 'beautiful'), clause(6), {Car: 'beetle'}, [is_a_car('beetle')])
step(has_property('beetle', 'nice'), clause(8), {Thing: 'beetle', Property: 'nice', ExcludedProperty: 'pretty'}, [has_property_or('beetle', 'nice', 'pretty'), cannot_have_property('beetle', 'pretty')])
step(has_property_or('beetle', 'nice', 'pretty'), clause(10), {Thing: 'beetle', KnownProperty: 'green', FirstProperty: 'nice', SecondProperty: 'pretty'}, [has_property('beetle', 'green'), entails_or('green', 'nice', 'pretty')])
step(cannot_have_property('beetle', 'pretty'), clause(7), {Property: 'pretty', Consequence: 'beautiful', Thing: 'beetle'}, [entails('pretty', 'beautiful'), cannot_have_property('beetle', 'beautiful')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(has_property(A, B), [has_property('beetle', 'green'), has_property('beetle', 'nice')])
derived(has_property_or(A, B, C), [has_property_or('beetle', 'green', 'blue'), has_property_or('beetle', 'nice', 'pretty')])
derived(cannot_have_property(A, B), [cannot_have_property('beetle', 'beautiful'), cannot_have_property('beetle', 'pretty'), cannot_have_property('beetle', 'blue')])
called(struct('le:answer', 'nice'), [struct('le:answer', 'nice')])
called(is_nice('beetle'), [is_nice('beetle')])
called(has_property('beetle', 'nice'), [has_property('beetle', 'nice')])
called(has_property_or(A, B, C), [has_property_or('beetle', 'green', 'blue'), has_property_or('beetle', 'nice', 'pretty')])
called(cannot_have_property('beetle', 'blue'), [cannot_have_property('beetle', 'blue')])
called(cannot_have_property('beetle', 'pretty'), [cannot_have_property('beetle', 'pretty')])
called(cannot_have_property('beetle', 'green'), [])
called(cannot_have_property('beetle', 'nice'), [])
called(has_property(D, E), [has_property('beetle', 'green'), has_property('beetle', 'nice')])
called(cannot_have_property(F, 'beautiful'), [cannot_have_property('beetle', 'beautiful')])
called(struct('le:answer', 'properties', G), [struct('le:answer', 'properties', 'green'), struct('le:answer', 'properties', 'nice')])
called(has_property('beetle', H), [has_property('beetle', 'green'), has_property('beetle', 'nice')])
