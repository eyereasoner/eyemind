// Checked answers: these follow from the input program and are every answer of its questions.
t('bob', 'child_of', 'alice')
t('carol', 'child_of', 'alice')
allowed('carol')
children('alice', ['bob', 'carol'])

verdict('checked')
