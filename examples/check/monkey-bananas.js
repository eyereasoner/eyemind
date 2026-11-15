// Checked answers: these follow from the input program and are every answer of its questions.
plan([go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc1'), go('loc3'), push('loc1'), 'climb_on', 'grab'])
plan([go('loc3'), push('loc1'), 'climb_on', 'grab', 'climb_off'])
plan([go('loc3'), push('loc2'), push('loc1'), 'climb_on', 'grab'])

verdict('checked')
