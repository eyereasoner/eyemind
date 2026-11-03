// Giving each person a record that says where it came from. For every
// person, one forward rule concludes two facts, since a head may be an array
// of conclusions: the person has a record, and the record is owned by that
// person. The record is a structured term, record('person_rule', Name),
// built from a label for the rule and the person's name, so it is the same
// each time the rule fires for that person and different for each person:
// Alice and Bob each get their own. The rule writes this witness out itself,
// rather than leaving a head variable unbound for eyemind to fill with a
// Skolem term. With no query, the output lists the four derived facts.

fact(person('alice'))
fact(person('bob'))
implies(
  person(Name),
  [
    has_record(Name, record('person_rule', Name)),
    record_owner(record('person_rule', Name), Name),
  ],
)
