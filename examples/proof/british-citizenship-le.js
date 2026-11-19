// Answers: each instance of a query() that holds.
britishCitizen('Anna')
britishCitizen('Eve')
britishCitizen('Gwen')
qualifyingParent('Farid', 'Anna')
qualifyingParent('Gwen', 'Hugo')
britishCitizen('Ben')
qualifyingParent('Anna', 'Ben')
qualifyingParent('Anna', 'Jo')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(britishCitizen('Anna'), clause(29), {P: 'Anna', D: 19900512, C: 19830101, Q: 'Farid'}, [birthPlace('Anna', 'unitedKingdom'), birthDate('Anna', 19900512), commencement(19830101), ge(19900512, 19830101), qualifyingParent('Farid', 'Anna')])
step(qualifyingParent('Farid', 'Anna'), clause(28), {Q: 'Farid', P: 'Anna', D: 19900512, S: 19750301}, [parent('Farid', 'Anna'), birthDate('Anna', 19900512), settledSince('Farid', 19750301), le(19750301, 19900512)])
step(britishCitizen('Eve'), clause(30), {P: 'Eve', D: 20200601, C: 19830101}, [foundling('Eve'), foundIn('Eve', 'unitedKingdom'), foundDate('Eve', 20200601), commencement(19830101), ge(20200601, 19830101), not(contraryShown('Eve'))])
step(britishCitizen('Ben'), clause(29), {P: 'Ben', D: 20150820, C: 19830101, Q: 'Anna'}, [birthPlace('Ben', 'unitedKingdom'), birthDate('Ben', 20150820), commencement(19830101), ge(20150820, 19830101), qualifyingParent('Anna', 'Ben')])
step(qualifyingParent('Anna', 'Ben'), clause(27), {Q: 'Anna', P: 'Ben'}, [parent('Anna', 'Ben'), britishCitizen('Anna')])
step(qualifyingParent('Gwen', 'Hugo'), clause(27), {Q: 'Gwen', P: 'Hugo'}, [parent('Gwen', 'Hugo'), britishCitizen('Gwen')])
step(britishCitizen('Gwen'), clause(12), {}, [])
step(qualifyingParent('Anna', 'Jo'), clause(27), {Q: 'Anna', P: 'Jo'}, [parent('Anna', 'Jo'), britishCitizen('Anna')])

// Certificate: the derived facts and every answer of each call the questions make.
derived(britishCitizen(A), [britishCitizen('Anna'), britishCitizen('Eve'), britishCitizen('Ben')])
derived(qualifyingParent(A, B), [qualifyingParent('Farid', 'Anna'), qualifyingParent('Gwen', 'Hugo'), qualifyingParent('Anna', 'Ben'), qualifyingParent('Anna', 'Jo')])
called(britishCitizen(A), [britishCitizen('Anna'), britishCitizen('Eve'), britishCitizen('Ben'), britishCitizen('Gwen')])
called(qualifyingParent(B, 'Anna'), [qualifyingParent('Farid', 'Anna')])
called(qualifyingParent(B, 'Ben'), [qualifyingParent('Anna', 'Ben')])
called(qualifyingParent(B, 'Dara'), [])
called(britishCitizen('Farid'), [])
called(britishCitizen('Anna'), [britishCitizen('Anna')])
called(britishCitizen('Gwen'), [britishCitizen('Gwen')])
called(britishCitizen('Ivan'), [])
called(qualifyingParent(C, D), [qualifyingParent('Farid', 'Anna'), qualifyingParent('Gwen', 'Hugo'), qualifyingParent('Anna', 'Ben'), qualifyingParent('Anna', 'Jo')])
