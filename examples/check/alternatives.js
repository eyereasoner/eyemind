// Checked answers: these follow from the input program and are every answer of its questions.
route('paris', 'brussels')
route('paris', 'lille')
or(train('paris', 'brussels'), bus('paris', 'lille'))
once(route('paris', 'brussels'))

verdict('checked')
