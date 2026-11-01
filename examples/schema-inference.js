// A small schema, in the style of RDF Schema, lets a reasoner fill in facts
// nobody stated. Cats are mammals and mammals are animals, so Koko the cat is
// also a mammal and an animal, and a cat is an animal. Being a parent of
// someone is a way of being related to them, so Alice, parent of Bob, is
// related to Bob. Whoever is a parent, and whoever has one, is a person, so
// Alice and Bob are both people.
// Five forward rules apply the schema until nothing new follows; with no
// query, the output lists the six derived facts.

// The schema: class and property hierarchies, and the class of the subject
// (domain) and of the object (codomain) of parent_of.
fact(subclass('cat', 'mammal'))
fact(subclass('mammal', 'animal'))
fact(subproperty('parent_of', 'related_to'))
fact(domain('parent_of', 'person'))
fact(codomain('parent_of', 'person'))
// The data: a typed individual and one relationship, written as a triple.
fact(type('koko', 'cat'))
fact(triple('alice', 'parent_of', 'bob'))
// Subclass is transitive, and a member of a class is a member of its superclasses.
implies([subclass(A, B), subclass(B, C)], subclass(A, C))
implies([type(X, A), subclass(A, B)], type(X, B))
// A relationship also holds under every broader property.
implies([triple(S, P, O), subproperty(P, Q)], triple(S, Q, O))
// Using a property classifies its subject and its object.
implies([triple(S, P, _), domain(P, Class)], type(S, Class))
implies([triple(_, P, O), codomain(P, Class)], type(O, Class))
