// A cat's presence enables a rule about every dog.
// Minka is a cat and Charly is a dog, so the enabled rule concludes a test fact.
// The inline forward template has its own local variable Y.

fact(type('Minka', 'Cat'))
fact(type('Charly', 'Dog'))

implies(type(X, 'Cat'),
  forward(type(Y, 'Dog'), t('test', 'is', 'true')))
