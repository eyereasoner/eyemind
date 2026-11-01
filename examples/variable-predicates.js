// Renaming the fields of incoming data with a mapping table. Alice's record
// arrives with the field names source_name and source_age; a table maps them
// to name and age. Because each statement is stored as t(Subject, Property,
// Value), the property is ordinary data that a variable can match, so a
// single rule translates every mapped property at once. The queries find
// Alice's name, 'Alice', and age, 30, under the new names.

// t(Subject, Property, Value) statements, and the source-to-target mapping.
fact(t('alice', 'source_name', 'Alice'))
fact(t('alice', 'source_age', 30))
fact(maps('source_name', 'name'))
fact(maps('source_age', 'age'))
implies([t(S, Source, O), maps(Source, Target)], t(S, Target, O))
query(t('alice', 'name', Name))
query(t('alice', 'age', Age))
