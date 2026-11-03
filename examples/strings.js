// Building and taking apart text. Atoms, written as quoted strings, are the
// text values of eyemind, and built-in predicates handle them in ordinary
// rules, with no special syntax for text: atom_concat joins 'hello_' and
// 'alice' into 'hello_alice'; atom_chars and atom_length split 'café' into
// its 4 characters; atom_codes gives the Unicode code point of an emoji,
// 128512. Characters are counted as Unicode code points, so é counts as one
// character and the emoji as one code, not as two UTF-16 units.

implied_by(label(Name, Label), atom_concat('hello_', Name, Label))
implied_by(
  characters(Text, Chars, Length),
  [atom_chars(Text, Chars), atom_length(Text, Length)],
)
implied_by(unicode_codes(Text, Codes), atom_codes(Text, Codes))
query(label('alice', Label))
query(characters('café', Chars, Length))
query(unicode_codes('😀', Codes))
