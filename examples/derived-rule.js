// A rule that creates another rule. Minka is a cat and Charly is a dog. The
// outer rule says: once some cat is known, add a new rule that concludes the
// test fact t('test', 'is', 'true') whenever some dog is known. Minka enables
// that rule, Charly satisfies it, and the program concludes the test fact.
// It shows a rule template: an implies(...) written as the conclusion of
// another rule. Y appears only inside the template, so it is the new rule's
// own variable and can match any dog.

fact(type('Minka', 'Cat'))
fact(type('Charly', 'Dog'))

implies(type(X, 'Cat'),
  implies(type(Y, 'Dog'), t('test', 'is', 'true')))
