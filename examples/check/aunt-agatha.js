// Checked answers: these follow from the input program and are every answer of its questions.
witness('agatha', world(richer('no', 'yes', 'yes'), hates('yes', 'no', 'yes', 'yes', 'no', 'yes', 'no', 'yes', 'no')))
models('agatha', 4)
models('butler', 0)
models('charles', 0)
entailed(killed('agatha', 'agatha'))

verdict('checked')
