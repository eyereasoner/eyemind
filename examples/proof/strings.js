// Answers: each instance of a query() that holds.
label('alice', 'hello_alice')
characters('café', ['c', 'a', 'f', 'é'], 4)
unicode_codes('😀', [128512])

// Certificate: the derived facts and every answer of each call the questions make.
called(label('alice', A), [label('alice', 'hello_alice')])
called(characters('café', B, C), [characters('café', ['c', 'a', 'f', 'é'], 4)])
called(unicode_codes('😀', D), [unicode_codes('😀', [128512])])
