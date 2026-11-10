// SPARQL expressions and aggregates as eyemind backward rules.
//
// An expression compiles to goals that bind its value; a function is a goal
// srl_<name>(Arguments..., Result) whose definition is written here in
// eyemind itself, so the compiled program is self-contained and every
// function step is an ordinary, checkable derivation. A SPARQL error is a
// goal that fails: FILTER then rejects the solution and SET drops it, as
// SPARQL 1.2 RL evaluates them. A definition lists the definitions it needs;
// the compiler copies those a program uses into it.
//
// Values are RDF terms as the compiler writes them: an xsd:integer with a
// canonical lexical form is an eyemind integer, every other literal is
// literal(Lexical, datatype(IRI)) or literal(Text, lang(Tag)). Decimals,
// floats and doubles are computed as binary64 floats and written back with
// their datatype.

const XSD = 'http://www.w3.org/2001/XMLSchema#';
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';

const INTEGER_TYPES = ['integer', 'int', 'long', 'short', 'byte', 'nonNegativeInteger', 'positiveInteger',
  'nonPositiveInteger', 'negativeInteger', 'unsignedLong', 'unsignedInt', 'unsignedShort', 'unsignedByte'];

const str = (text) => `literal(${text}, datatype('${XSD}string'))`;
const TRUE = `literal('true', datatype('${XSD}boolean'))`;
const FALSE = `literal('false', datatype('${XSD}boolean'))`;

// The test name_(Args) as a boolean: name_t(Args, T) gives T 'true' when
// the test holds and 'false' when it does not.
const tested = (name, args) => String.raw`
implied_by(${name}_t(${args}, T), or([${name}_(${args}), unify(T, 'true')], [not(${name}_(${args})), unify(T, 'false')]))`;

export const DEFINITIONS = {
  // Numbers.
  srl_num: {
    text: String.raw`
// srl_num(T, K, V): T is a number of kind K (integer, decimal, float or
// double) with value V; decimals, floats and doubles have float values.
implied_by(srl_num(T, 'integer', T), is_int(T))
implied_by(srl_num(literal(L, datatype(D)), K, V), [srl_numeric_type(D, K), atom_chars(L, Cs), number_chars(N, Cs), srl_num_value(K, N, V)])
${INTEGER_TYPES.map((t) => `fact(srl_numeric_type('${XSD}${t}', 'integer'))`).join('\n')}
fact(srl_numeric_type('${XSD}decimal', 'decimal'), srl_numeric_type('${XSD}float', 'float'), srl_numeric_type('${XSD}double', 'double'))
implied_by(srl_num_value('integer', N, N), is_int(N))
implied_by(srl_num_value(K, N, V), [srl_float_kind(K), is(V, float(N))])
fact(srl_float_kind('decimal'), srl_float_kind('float'), srl_float_kind('double'))
// Numeric type promotion: integer, decimal, float, double.
fact(srl_rank('integer', 0), srl_rank('decimal', 1), srl_rank('float', 2), srl_rank('double', 3))
implied_by(srl_promote(A, B, K), [srl_rank(A, I), srl_rank(B, J), is(M, max(I, J)), srl_rank(K, M)])`,
  },
  srl_make: {
    text: String.raw`
// srl_make(K, V, T): T is the term for the value V of kind K. A float is
// written as its shortest text; a decimal never has an exponent.
implied_by(srl_make('integer', V, V), is_int(V))
implied_by(srl_make(K, V, literal(L, datatype(D))), [srl_float_kind(K), srl_numeric_type(D, K), lt(abs(V), float(1.7976931348623157e308)), is(F, float(V)), number_chars(F, Cs), atom_chars(A, Cs), srl_float_text(K, A, L)])
implied_by(srl_float_text('double', A, A), 'true')
implied_by(srl_float_text('float', A, A), 'true')
implied_by(srl_float_text('decimal', A, A), not(regex_match('e', A)))
implied_by(srl_float_text('decimal', A, L), [regex_find('^(-?)(\\d+)(?:\\.(\\d+))?e([+-]?\\d+)$', A, [_, S, I, F, E]), atom_concat(I, F, Ds), atom_length(I, NI), atom_chars(E, ECs), number_chars(X, ECs), is(P, add(NI, X)), atom_length(Ds, ND), srl_point(Ds, ND, P, B), atom_concat(S, B, L)])
// srl_point(Ds, N, P, B): the N digits Ds with a decimal point after P of them.
implied_by(srl_point(Ds, N, P, B), [ge(P, N), is(Z, sub(P, N)), srl_zeros(Z, Zs), atom_concat(Ds, Zs, H), atom_concat(H, '.0', B)])
implied_by(srl_point(Ds, N, P, B), [le(P, 0), is(Z, neg(P)), srl_zeros(Z, Zs), atom_concat('0.', Zs, H), atom_concat(H, Ds, B)])
implied_by(srl_point(Ds, N, P, B), [gt(P, 0), lt(P, N), once([atom_concat(H, T, Ds), atom_length(H, P)]), atom_concat(H, '.', H1), atom_concat(H1, T, B)])
fact(srl_zeros(0, ''))
implied_by(srl_zeros(N, Z), [gt(N, 0), is(M, sub(N, 1)), srl_zeros(M, Z0), atom_concat('0', Z0, Z)])`,
    needs: ['srl_num'],
  },
  srl_finite: {
    text: String.raw`
// srl_finite(Op, X, Y): Op on X and Y has a finite result, so computing it
// raises no error; a float result that would overflow is a SPARQL error.
implied_by(srl_finite(Op, X, Y), once(srl_finite_(Op, X, Y)))
implied_by(srl_finite_(_, X, Y), [is_int(X), is_int(Y)])
implied_by(srl_finite_('add', X, Y), [lt(abs(X), 8e307), lt(abs(Y), 8e307)])
implied_by(srl_finite_('sub', X, Y), [lt(abs(X), 8e307), lt(abs(Y), 8e307)])
implied_by(srl_finite_('mul', X, Y), or(eq(X, 0), eq(Y, 0)))
implied_by(srl_finite_('mul', X, Y), [srl_magnitude(X, M), srl_magnitude(Y, N), lt(add(M, N), 308)])
implied_by(srl_finite_('div', X, Y), eq(X, 0))
implied_by(srl_finite_('div', X, Y), [srl_magnitude(X, M), srl_magnitude(Y, N), lt(sub(M, N), 308)])
implied_by(srl_magnitude(X, M), [ne(X, 0), lt(abs(X), 1e308), is(M, log10(abs(X)))])`,
  },
  srl_add: { text: arith('srl_add', 'add'), needs: ['srl_make', 'srl_finite'] },
  srl_sub: { text: arith('srl_sub', 'sub'), needs: ['srl_make', 'srl_finite'] },
  srl_mul: { text: arith('srl_mul', 'mul'), needs: ['srl_make', 'srl_finite'] },
  srl_div: {
    text: String.raw`
// Division by zero is an error; integers divide to a decimal.
implied_by(srl_div(A, B, R), [srl_num(A, KA, X), srl_num(B, KB, Y), ne(Y, 0), srl_promote(KA, KB, K0), srl_div_kind(K0, K), srl_finite('div', X, Y), is(V, div(X, Y)), srl_make(K, V, R)])
fact(srl_div_kind('integer', 'decimal'), srl_div_kind('decimal', 'decimal'), srl_div_kind('float', 'float'), srl_div_kind('double', 'double'))`,
    needs: ['srl_make', 'srl_finite'],
  },
  srl_neg: {
    text: String.raw`
implied_by(srl_neg(A, R), [srl_num(A, K, X), is(V, neg(X)), srl_make(K, V, R)])`,
    needs: ['srl_make'],
  },
  srl_pos: {
    text: String.raw`
implied_by(srl_pos(A, A), srl_num(A, _, _))`,
    needs: ['srl_num'],
  },

  // Booleans and effective boolean values.
  srl_bool: {
    text: String.raw`
// srl_bool(T, B): B is the xsd:boolean term for 'true' or 'false'.
fact(srl_bool('true', ${TRUE}), srl_bool('false', ${FALSE}))
fact(srl_flip('true', 'false'), srl_flip('false', 'true'))`,
  },
  srl_ebv: {
    text: String.raw`
// srl_ebv(T, B): the effective boolean value of T is B, 'true' or 'false';
// a term without one, such as an IRI, has none.
implied_by(srl_ebv(T, B), once(srl_ebv_(T, B)))
implied_by(srl_ebv_(literal(L, datatype('${XSD}boolean')), B), srl_boolean_text(L, B))
implied_by(srl_ebv_(T, B), [srl_num(T, _, V), or([eq(V, 0), unify(B, 'false')], [ne(V, 0), unify(B, 'true')])])
implied_by(srl_ebv_(literal(L, datatype('${XSD}string')), B), srl_nonempty(L, B))
implied_by(srl_ebv_(literal(L, lang(_)), B), srl_nonempty(L, B))
implied_by(srl_ebv_(literal(L, lang(_, _)), B), srl_nonempty(L, B))
implied_by(srl_nonempty(L, B), [atom_length(L, N), or([eq(N, 0), unify(B, 'false')], [gt(N, 0), unify(B, 'true')])])
// An invalid boolean lexical form has the value false.
implied_by(srl_boolean_text(L, B), once(or([srl_true_text(L), unify(B, 'true')], unify(B, 'false'))))
fact(srl_true_text('true'), srl_true_text('1'), srl_false_text('false'), srl_false_text('0'))
implied_by(srl_true(T), srl_ebv(T, 'true'))
// srl_ebv3(T, B): B is the effective boolean value, or 'error'.
implied_by(srl_ebv3(T, B), once(or(srl_ebv(T, B), unify(B, 'error'))))`,
    needs: ['srl_num'],
  },
  srl_not: {
    text: String.raw`
implied_by(srl_not(A, R), [srl_ebv(A, B), srl_flip(B, F), srl_bool(F, R)])`,
    needs: ['srl_ebv', 'srl_bool'],
  },
  srl_and: {
    text: String.raw`
// && and || over 'true', 'false' and 'error': an error is absorbed only by
// a value that decides the result alone.
implied_by(srl_and(A, B, R), [srl_and3(A, B, T), srl_bool(T, R)])
fact(srl_and3('true', 'true', 'true'), srl_and3('false', _, 'false'), srl_and3('true', 'false', 'false'), srl_and3('error', 'false', 'false'))`,
    needs: ['srl_bool'],
  },
  srl_or: {
    text: String.raw`
implied_by(srl_or(A, B, R), [srl_or3(A, B, T), srl_bool(T, R)])
fact(srl_or3('false', 'false', 'false'), srl_or3('true', _, 'true'), srl_or3('false', 'true', 'true'), srl_or3('error', 'true', 'true'))`,
    needs: ['srl_bool'],
  },

  // Comparison.
  srl_equal: {
    text: String.raw`
// srl_equal(A, B, T): T is 'true' when A and B are equal and 'false' when
// they are not; literals that cannot be compared have no answer, an error.
implied_by(srl_equal(A, B, T), once(srl_equal_(A, B, T)))
implied_by(srl_equal_(A, B, T), [srl_num(A, _, X), srl_num(B, _, Y), or([eq(X, Y), unify(T, 'true')], [ne(X, Y), unify(T, 'false')])])
implied_by(srl_equal_(A, B, 'true'), identical(A, B))
implied_by(srl_equal_(A, B, T), [srl_boolean(A, X), srl_boolean(B, Y), or([identical(X, Y), unify(T, 'true')], [not_identical(X, Y), unify(T, 'false')])])
implied_by(srl_equal_(A, B, 'false'), [srl_text_kind(A, _), srl_text_kind(B, _)])
implied_by(srl_equal_(A, B, 'false'), [srl_node(A), srl_term(B)])
implied_by(srl_equal_(A, B, 'false'), [srl_term(A), srl_node(B)])
implied_by(srl_equal_(literal(_, datatype(D)), literal(_, datatype(D)), 'false'), srl_ordered_type(D))
implied_by(srl_boolean(literal(L, datatype('${XSD}boolean')), 'true'), srl_true_text(L))
implied_by(srl_boolean(literal(L, datatype('${XSD}boolean')), 'false'), srl_false_text(L))
fact(srl_true_text('true'), srl_true_text('1'), srl_false_text('false'), srl_false_text('0'))
// A string-like literal: a simple string or a language-tagged string.
implied_by(srl_text_kind(literal(L, datatype('${XSD}string')), 'string'), 'true')
implied_by(srl_text_kind(literal(L, lang(T)), lang(T)), 'true')
implied_by(srl_text_kind(literal(L, lang(T, D)), lang(T, D)), 'true')
// IRIs, blank nodes and triple terms; srl_term is any RDF term.
implied_by(srl_node(iri(_)), 'true')
implied_by(srl_node(bnode(_, _)), 'true')
implied_by(srl_node(skolem(_, _, _)), 'true')
implied_by(srl_node(triple(_, _, _)), 'true')
implied_by(srl_term(T), is_number(T))
implied_by(srl_term(literal(_, _)), 'true')
implied_by(srl_term(T), srl_node(T))
${['dateTime', 'date', 'time', 'gYear', 'gYearMonth', 'gMonthDay', 'gMonth', 'gDay', 'duration', 'dayTimeDuration',
    'yearMonthDuration'].map((t) => `fact(srl_ordered_type('${XSD}${t}'))`).join('\n')}`,
    needs: ['srl_num'],
  },
  srl_eq: {
    text: String.raw`
implied_by(srl_eq(A, B, R), [srl_equal(A, B, T), srl_bool(T, R)])`,
    needs: ['srl_equal', 'srl_bool'],
  },
  srl_ne: {
    text: String.raw`
implied_by(srl_ne(A, B, R), [srl_equal(A, B, T), srl_flip(T, F), srl_bool(F, R)])`,
    needs: ['srl_equal', 'srl_bool'],
  },
  srl_order: {
    text: String.raw`
// srl_order(A, B, O): O is '<', '=' or '>' when A and B are ordered:
// numbers by value, simple strings by code point, booleans with false
// first, and date and time values of one datatype by their lexical forms.
implied_by(srl_order(A, B, O), once(srl_order_(A, B, O)))
implied_by(srl_order_(A, B, O), [srl_num(A, _, X), srl_num(B, _, Y), srl_compare(X, Y, O)])
implied_by(srl_order_(literal(X, datatype('${XSD}string')), literal(Y, datatype('${XSD}string')), O), compare(O, X, Y))
implied_by(srl_order_(A, B, O), [srl_boolean(A, X), srl_boolean(B, Y), compare(O, X, Y)])
implied_by(srl_order_(literal(X, datatype(D)), literal(Y, datatype(D)), O), [srl_ordered_type(D), compare(O, X, Y)])
implied_by(srl_compare(X, Y, O), or([lt(X, Y), unify(O, '<')], [eq(X, Y), unify(O, '=')], [gt(X, Y), unify(O, '>')]))
fact(srl_lt_('<', 'true'), srl_lt_('=', 'false'), srl_lt_('>', 'false'))
fact(srl_le_('<', 'true'), srl_le_('=', 'true'), srl_le_('>', 'false'))
fact(srl_gt_('<', 'false'), srl_gt_('=', 'false'), srl_gt_('>', 'true'))
fact(srl_ge_('<', 'false'), srl_ge_('=', 'true'), srl_ge_('>', 'true'))`,
    needs: ['srl_equal'],
  },
  srl_lt: { text: compare('srl_lt'), needs: ['srl_order', 'srl_bool'] },
  srl_le: { text: compare('srl_le'), needs: ['srl_order', 'srl_bool'] },
  srl_gt: { text: compare('srl_gt'), needs: ['srl_order', 'srl_bool'] },
  srl_ge: { text: compare('srl_ge'), needs: ['srl_order', 'srl_bool'] },
  srl_in: {
    text: String.raw`
// srl_eq3(A, B, T): T is 'true', 'false' or 'error'.
implied_by(srl_eq3(A, B, T), once(or(srl_equal(A, B, T), unify(T, 'error'))))
// IN is true when an item is equal, an error when none is and one is an
// error, and false otherwise; NOT IN is its negation.
implied_by(srl_in(Ts, R), [srl_in3(Ts, T), srl_bool(T, R)])
implied_by(srl_not_in(Ts, R), [srl_in3(Ts, T), srl_flip(T, F), srl_bool(F, R)])
implied_by(srl_in3(Ts, T), once(or([srl_member('true', Ts), unify(T, 'true')], [not(srl_member('error', Ts)), unify(T, 'false')])))`,
    needs: ['srl_equal', 'srl_bool', 'srl_member'],
  },
  srl_same_term: {
    text: String.raw`
implied_by(srl_same_term(A, B, R), [or([identical(A, B), unify(T, 'true')], [not_identical(A, B), unify(T, 'false')]), srl_bool(T, R)])`,
    needs: ['srl_bool'],
  },

  // Term tests and accessors.
  srl_kind_tests: {
    text: String.raw`
implied_by(srl_is_iri(T, R), [srl_is_iri_(T, B), srl_bool(B, R)])
implied_by(srl_is_iri_(T, B), once(or([unify(T, iri(_)), unify(B, 'true')], unify(B, 'false'))))
implied_by(srl_is_blank(T, R), [srl_is_blank_(T, B), srl_bool(B, R)])
implied_by(srl_is_blank_(T, B), once(or([or(unify(T, bnode(_, _)), unify(T, skolem(_, _, _))), unify(B, 'true')], unify(B, 'false'))))
implied_by(srl_is_literal(T, R), [srl_is_literal_(T, B), srl_bool(B, R)])
implied_by(srl_is_literal_(T, B), once(or([or(is_number(T), unify(T, literal(_, _))), unify(B, 'true')], unify(B, 'false'))))
implied_by(srl_is_numeric(T, R), [srl_is_numeric_(T, B), srl_bool(B, R)])
implied_by(srl_is_numeric_(T, B), once(or([srl_num(T, _, _), unify(B, 'true')], unify(B, 'false'))))
implied_by(srl_is_triple(T, R), [srl_is_triple_(T, B), srl_bool(B, R)])
implied_by(srl_is_triple_(T, B), once(or([unify(T, triple(_, _, _)), unify(B, 'true')], unify(B, 'false'))))
implied_by(srl_has_lang(T, R), [srl_term(T), srl_has_lang_(T, B), srl_bool(B, R)])
implied_by(srl_has_lang_(T, B), once(or([or(unify(T, literal(_, lang(_))), unify(T, literal(_, lang(_, _)))), unify(B, 'true')], unify(B, 'false'))))
implied_by(srl_has_langdir(T, R), [srl_term(T), srl_has_langdir_(T, B), srl_bool(B, R)])
implied_by(srl_has_langdir_(T, B), once(or([unify(T, literal(_, lang(_, _))), unify(B, 'true')], unify(B, 'false'))))`,
    needs: ['srl_bool', 'srl_num', 'srl_equal'],
  },
  srl_str: {
    text: String.raw`
// srl_str(T, R): the lexical form of a literal or the text of an IRI, as a
// simple string.
implied_by(srl_str(T, ${str('A')}), srl_text(T, A))
implied_by(srl_text(iri(A), A), 'true')
implied_by(srl_text(literal(A, _), A), 'true')
implied_by(srl_text(T, A), [is_int(T), number_chars(T, Cs), atom_chars(A, Cs)])`,
  },
  srl_lang: {
    text: String.raw`
implied_by(srl_lang(T, ${str('L')}), once(srl_lang_(T, L)))
implied_by(srl_lang_(literal(_, lang(L)), L), 'true')
implied_by(srl_lang_(literal(_, lang(L, _)), L), 'true')
implied_by(srl_lang_(literal(_, datatype(_)), ''), 'true')
implied_by(srl_lang_(T, ''), is_number(T))
implied_by(srl_langdir(T, ${str('D')}), once(srl_langdir_(T, D)))
implied_by(srl_langdir_(literal(_, lang(_, D)), D), 'true')
implied_by(srl_langdir_(literal(_, lang(_)), ''), 'true')
implied_by(srl_langdir_(literal(_, datatype(_)), ''), 'true')
implied_by(srl_langdir_(T, ''), is_number(T))`,
  },
  srl_langmatches: {
    text: String.raw`
// LANGMATCHES: * matches every non-empty tag; a range matches the tag
// itself and its subtags, ignoring case.
implied_by(srl_langmatches(${str('T')}, ${str('G')}, R), [atom_lower(T, LT), atom_lower(G, LG), or([srl_langmatches_(LT, LG), unify(B, 'true')], [not(srl_langmatches_(LT, LG)), unify(B, 'false')]), srl_bool(B, R)])
implied_by(srl_langmatches_(T, '*'), [atom_length(T, N), gt(N, 0)])
implied_by(srl_langmatches_(T, G), [not_identical(G, '*'), identical(T, G)])
implied_by(srl_langmatches_(T, G), [not_identical(G, '*'), atom_concat(G, '-', P), atom_concat(P, _, T)])`,
    needs: ['srl_bool'],
  },
  srl_datatype: {
    text: String.raw`
implied_by(srl_datatype(T, iri('${XSD}integer')), is_int(T))
implied_by(srl_datatype(literal(_, datatype(D)), iri(D)), 'true')
implied_by(srl_datatype(literal(_, lang(_)), iri('${RDF}langString')), 'true')
implied_by(srl_datatype(literal(_, lang(_, _)), iri('${RDF}dirLangString')), 'true')`,
  },
  srl_iri: {
    text: String.raw`
implied_by(srl_iri(iri(A), iri(A)), 'true')
implied_by(srl_iri(${str('A')}, iri(A)), 'true')`,
  },
  srl_strdt: {
    text: String.raw`
implied_by(srl_strdt(${str('L')}, iri(D), T), srl_typed(L, D, T))`,
    needs: ['srl_typed'],
  },
  srl_typed: {
    text: String.raw`
// srl_typed(L, D, T): T is the literal with lexical form L and datatype D;
// a canonical xsd:integer is an integer.
implied_by(srl_typed(L, D, T), once(srl_typed_(L, D, T)))
implied_by(srl_typed_(L, '${XSD}integer', N), [regex_match('^(?:0|-?[1-9][0-9]*)$', L), atom_chars(L, Cs), number_chars(N, Cs)])
implied_by(srl_typed_(L, D, literal(L, datatype(D))), 'true')`,
  },
  srl_strlang: {
    text: String.raw`
implied_by(srl_strlang(${str('L')}, ${str('T')}, literal(L, lang(G))), [atom_length(T, N), gt(N, 0), atom_lower(T, G)])
implied_by(srl_strlangdir(${str('L')}, ${str('T')}, ${str('D')}, literal(L, lang(G, D))), [atom_length(T, N), gt(N, 0), atom_lower(T, G), srl_direction(D)])
fact(srl_direction('ltr'), srl_direction('rtl'))`,
  },
  srl_triple: {
    text: String.raw`
implied_by(srl_triple(S, iri(P), O, triple(S, iri(P), O)), [srl_term(S), srl_term(O)])
implied_by(srl_subject(triple(S, _, _), S), 'true')
implied_by(srl_predicate(triple(_, P, _), P), 'true')
implied_by(srl_object(triple(_, _, O), O), 'true')`,
    needs: ['srl_equal'],
  },

  // Strings.
  srl_string: {
    text: String.raw`
// srl_string(T, A, K): T is a simple or language-tagged string with text A
// and annotation K.
implied_by(srl_string(literal(A, datatype('${XSD}string')), A, datatype('${XSD}string')), 'true')
implied_by(srl_string(literal(A, lang(T)), A, lang(T)), 'true')
implied_by(srl_string(literal(A, lang(T, D)), A, lang(T, D)), 'true')
// Two arguments are compatible when the second is a simple string or has
// the language tag of the first.
implied_by(srl_compatible(_, datatype('${XSD}string')), 'true')
implied_by(srl_compatible(K, K), not_identical(K, datatype('${XSD}string')))`,
  },
  srl_strlen: {
    text: String.raw`
implied_by(srl_strlen(T, N), [srl_string(T, A, _), atom_length(A, N)])`,
    needs: ['srl_string'],
  },
  srl_ucase: {
    text: String.raw`
implied_by(srl_ucase(T, literal(U, K)), [srl_string(T, A, K), atom_upper(A, U)])
implied_by(srl_lcase(T, literal(U, K)), [srl_string(T, A, K), atom_lower(A, U)])`,
    needs: ['srl_string'],
  },
  srl_strstarts: {
    text: String.raw`
${tested('srl_strstarts', 'A, B')}
implied_by(srl_strstarts_(A, B), atom_concat(B, _, A))
${tested('srl_strends', 'A, B')}
implied_by(srl_strends_(A, B), once(atom_concat(_, B, A)))
${tested('srl_contains', 'A, B')}
implied_by(srl_contains_(A, B), once([atom_concat(_, R, A), atom_concat(B, _, R)]))
implied_by(srl_strstarts(X, Y, R), [srl_string(X, A, K), srl_string(Y, B, L), srl_compatible(K, L), srl_strstarts_t(A, B, T), srl_bool(T, R)])
implied_by(srl_strends(X, Y, R), [srl_string(X, A, K), srl_string(Y, B, L), srl_compatible(K, L), srl_strends_t(A, B, T), srl_bool(T, R)])
implied_by(srl_contains(X, Y, R), [srl_string(X, A, K), srl_string(Y, B, L), srl_compatible(K, L), srl_contains_t(A, B, T), srl_bool(T, R)])`,
    needs: ['srl_string', 'srl_bool'],
  },
  srl_strbefore: {
    text: String.raw`
// STRBEFORE and STRAFTER: the text around the first match, keeping the
// first argument's tag; no match gives the empty simple string.
implied_by(srl_strbefore(X, Y, R), [srl_string(X, A, K), srl_string(Y, B, L), srl_compatible(K, L), once(or([atom_concat(H, Rest, A), atom_concat(B, _, Rest), unify(R, literal(H, K))], [not(srl_contains_(A, B)), unify(R, ${str("''")})]))])
implied_by(srl_strafter(X, Y, R), [srl_string(X, A, K), srl_string(Y, B, L), srl_compatible(K, L), once(or([atom_concat(_, Rest, A), atom_concat(B, T, Rest), unify(R, literal(T, K))], [not(srl_contains_(A, B)), unify(R, ${str("''")})]))])
implied_by(srl_contains_(A, B), once([atom_concat(_, R, A), atom_concat(B, _, R)]))`,
    needs: ['srl_string'],
  },
  srl_concat: {
    text: String.raw`
// CONCAT keeps a language tag all its arguments share.
implied_by(srl_concat(Ts, literal(A, K)), [srl_concat_(Ts, '', A, K0), srl_concat_kind(K0, K)])
fact(srl_concat_([], A, A, 'none'))
implied_by(srl_concat_([T, ...Ts], A0, A, K), [srl_string(T, B, K1), atom_concat(A0, B, A1), srl_concat_(Ts, A1, A, K2), srl_join_kind(K1, K2, K)])
implied_by(srl_join_kind(K, 'none', K), 'true')
implied_by(srl_join_kind(K, K, K), not_identical(K, 'none'))
implied_by(srl_join_kind(K1, K2, datatype('${XSD}string')), [not_identical(K2, 'none'), not_identical(K1, K2)])
implied_by(srl_concat_kind('none', datatype('${XSD}string')), 'true')
implied_by(srl_concat_kind(K, K), not_identical(K, 'none'))`,
    needs: ['srl_string'],
  },
  srl_substr: {
    text: String.raw`
// SUBSTR counts characters from 1, rounding its numeric arguments.
implied_by(srl_substr(T, S, literal(B, K)), [srl_string(T, A, K), srl_num(S, _, X), srl_round_half_up(X, I), atom_chars(A, Cs), atom_length(A, N), is(E, add(N, 1)), srl_slice(Cs, 1, I, E, Bs), atom_chars(B, Bs)])
implied_by(srl_substr(T, S, L, literal(B, K)), [srl_string(T, A, K), srl_num(S, _, X), srl_num(L, _, Y), srl_round_half_up(X, I), srl_round_half_up(Y, J), is(E, add(I, J)), atom_chars(A, Cs), srl_slice(Cs, 1, I, E, Bs), atom_chars(B, Bs)])
// srl_slice(Cs, P, I, E, Bs): Bs are the characters of Cs, the first at
// position P, whose positions are at least I and below E.
fact(srl_slice([], _, _, _, []))
implied_by(srl_slice([C, ...Cs], P, I, E, [C, ...Bs]), [ge(P, I), lt(P, E), is(Q, add(P, 1)), srl_slice(Cs, Q, I, E, Bs)])
implied_by(srl_slice([_, ...Cs], P, I, E, Bs), [or(lt(P, I), ge(P, E)), is(Q, add(P, 1)), srl_slice(Cs, Q, I, E, Bs)])
implied_by(srl_round_half_up(X, I), is(I, floor(add(X, float(0.5)))))`,
    needs: ['srl_string', 'srl_num'],
  },
  srl_replace: {
    text: String.raw`
implied_by(srl_replace(T, ${str('P')}, ${str('W')}, literal(U, K)), [srl_string(T, A, K), regex_replace(P, A, W, U)])
implied_by(srl_replace_i(T, ${str('P')}, ${str('W')}, literal(U, K)), [srl_string(T, A, K), atom_lower(A, L), regex_replace(P, L, W, U)])`,
    needs: ['srl_string'],
  },
  srl_regex: {
    text: String.raw`
implied_by(srl_regex(T, ${str('P')}, R), [srl_string(T, A, _), or([regex_match(P, A), unify(B, 'true')], [not(regex_match(P, A)), unify(B, 'false')]), srl_bool(B, R)])
implied_by(srl_regex_i(T, ${str('P')}, R), [srl_string(T, A, _), atom_lower(A, L), or([regex_match(P, L), unify(B, 'true')], [not(regex_match(P, L)), unify(B, 'false')]), srl_bool(B, R)])`,
    needs: ['srl_string', 'srl_bool'],
  },
  srl_encode_for_uri: {
    text: String.raw`
// ENCODE_FOR_URI percent-encodes the UTF-8 bytes of every character but
// the unreserved ones.
implied_by(srl_encode_for_uri(T, ${str('E')}), [srl_string(T, A, _), atom_codes(A, Cs), srl_encode_(Cs, Es), srl_atoms_concat(Es, E)])
fact(srl_encode_([], []))
implied_by(srl_encode_([C, ...Cs], [E, ...Es]), [srl_encode_code(C, E), srl_encode_(Cs, Es)])
implied_by(srl_encode_code(C, E), [srl_unreserved(C), atom_codes(E, [C])])
implied_by(srl_encode_code(C, E), [not(srl_unreserved(C)), srl_utf8(C, Bs), srl_percent(Bs, Ps), srl_atoms_concat(Ps, E)])
implied_by(srl_unreserved(C), or([ge(C, 65), le(C, 90)], [ge(C, 97), le(C, 122)], [ge(C, 48), le(C, 57)], eq(C, 45), eq(C, 46), eq(C, 95), eq(C, 126)))
implied_by(srl_utf8(C, [C]), lt(C, 128))
implied_by(srl_utf8(C, [A, B]), [ge(C, 128), lt(C, 2048), is(A, or(192, shr(C, 6))), is(B, or(128, and(C, 63)))])
implied_by(srl_utf8(C, [A, B, D]), [ge(C, 2048), lt(C, 65536), is(A, or(224, shr(C, 12))), is(B, or(128, and(shr(C, 6), 63))), is(D, or(128, and(C, 63)))])
implied_by(srl_utf8(C, [A, B, D, F]), [ge(C, 65536), is(A, or(240, shr(C, 18))), is(B, or(128, and(shr(C, 12), 63))), is(D, or(128, and(shr(C, 6), 63))), is(F, or(128, and(C, 63)))])
fact(srl_percent([], []))
implied_by(srl_percent([B, ...Bs], [P, ...Ps]), [is(H, shr(B, 4)), is(L, and(B, 15)), srl_hex(H, X), srl_hex(L, Y), atom_concat('%', X, P0), atom_concat(P0, Y, P), srl_percent(Bs, Ps)])
${[...'0123456789ABCDEF'].map((d, i) => `fact(srl_hex(${i}, '${d}'))`).join('\n')}`,
    needs: ['srl_string', 'srl_atoms_concat'],
  },
  srl_atoms_concat: {
    text: String.raw`
fact(srl_atoms_concat([], ''))
implied_by(srl_atoms_concat([A, ...As], C), [srl_atoms_concat(As, C0), atom_concat(A, C0, C)])`,
  },
  // Numeric functions.
  srl_abs: {
    text: String.raw`
implied_by(srl_abs(T, R), [srl_num(T, K, X), is(V, abs(X)), srl_make(K, V, R)])
implied_by(srl_ceil(T, R), [srl_num(T, K, X), is(V, ceil(X)), srl_make(K, V, R)])
implied_by(srl_floor(T, R), [srl_num(T, K, X), is(V, floor(X)), srl_make(K, V, R)])
// ROUND rounds halves up, toward positive infinity.
implied_by(srl_round(T, R), [srl_num(T, K, X), srl_round_(K, X, V), srl_make(K, V, R)])
implied_by(srl_round_('integer', X, X), 'true')
implied_by(srl_round_(K, X, V), [srl_float_kind(K), is(V, floor(add(X, float(0.5))))])`,
    needs: ['srl_make'],
  },

  // Dates and times.
  srl_datetime: {
    text: String.raw`
// The parts of an xsd:dateTime or xsd:date: [Year, Month, Day, Hours,
// Minutes, Seconds, Zone], each as text, '' where absent.
implied_by(srl_dt_parts(literal(L, datatype('${XSD}dateTime')), G), regex_find('^(-?\\d{4,})-(\\d\\d)-(\\d\\d)T(\\d\\d):(\\d\\d):(\\d\\d(?:\\.\\d+)?)(Z|[+-]\\d\\d:\\d\\d)?$', L, [_, ...G]))
implied_by(srl_dt_parts(literal(L, datatype('${XSD}date')), [Y, M, D, '', '', '', Z]), regex_find('^(-?\\d{4,})-(\\d\\d)-(\\d\\d)(Z|[+-]\\d\\d:\\d\\d)?$', L, [_, Y, M, D, Z]))
implied_by(srl_dt_int(T, I, N), [srl_dt_parts(T, G), srl_nth(I, G, A), atom_length(A, K), gt(K, 0), atom_chars(A, Cs), number_chars(N, Cs)])
implied_by(srl_year(T, N), srl_dt_int(T, 1, N))
implied_by(srl_month(T, N), srl_dt_int(T, 2, N))
implied_by(srl_day(T, N), srl_dt_int(T, 3, N))
implied_by(srl_hours(T, N), srl_dt_int(T, 4, N))
implied_by(srl_minutes(T, N), srl_dt_int(T, 5, N))
implied_by(srl_seconds(T, literal(S, datatype('${XSD}decimal'))), [srl_dt_parts(T, G), srl_nth(6, G, S), atom_length(S, K), gt(K, 0)])
implied_by(srl_tz(T, ${str('Z')}), [srl_dt_parts(T, G), srl_nth(7, G, Z)])
// TIMEZONE gives the offset as an xsd:dayTimeDuration.
implied_by(srl_timezone(T, literal(D, datatype('${XSD}dayTimeDuration'))), [srl_dt_parts(T, G), srl_nth(7, G, Z), srl_zone_duration(Z, D)])
implied_by(srl_zone_duration('Z', 'PT0S'), 'true')
implied_by(srl_zone_duration(Z, D), [regex_find('^([+-])(\\d\\d):(\\d\\d)$', Z, [_, S, H, M]), atom_chars(H, HC), number_chars(HN, HC), atom_chars(M, MC), number_chars(MN, MC), srl_zone_sign(S, P), srl_zone_text(HN, MN, B), atom_concat(P, B, D)])
fact(srl_zone_sign('+', ''), srl_zone_sign('-', '-'))
implied_by(srl_zone_text(0, 0, 'PT0S'), 'true')
implied_by(srl_zone_text(H, 0, D), [gt(H, 0), srl_int_text(H, A), atom_concat('PT', A, P), atom_concat(P, 'H', D)])
implied_by(srl_zone_text(0, M, D), [gt(M, 0), srl_int_text(M, A), atom_concat('PT', A, P), atom_concat(P, 'M', D)])
implied_by(srl_zone_text(H, M, D), [gt(H, 0), gt(M, 0), srl_int_text(H, A), srl_int_text(M, B), atom_concat('PT', A, P), atom_concat(P, 'H', Q), atom_concat(Q, B, R), atom_concat(R, 'M', D)])
implied_by(srl_int_text(N, A), [number_chars(N, Cs), atom_chars(A, Cs)])`,
    needs: ['srl_nth'],
  },

  // Casts to XSD datatypes.
  srl_cast: {
    text: String.raw`
// srl_cast(D, T, R): T cast to the XSD datatype D, as SPARQL casts.
implied_by(srl_cast(D, T, R), once(srl_cast_(D, T, R)))
implied_by(srl_cast_('${XSD}string', T, ${str('A')}), srl_cast_text(T, A))
implied_by(srl_cast_text(iri(A), A), 'true')
implied_by(srl_cast_text(literal(A, _), A), 'true')
implied_by(srl_cast_text(T, A), [is_int(T), number_chars(T, Cs), atom_chars(A, Cs)])
implied_by(srl_cast_('${XSD}integer', T, V), [srl_num(T, _, X), is(V, trunc(X))])
implied_by(srl_cast_('${XSD}integer', T, V), [srl_boolean(T, B), srl_bit(B, V)])
implied_by(srl_cast_('${XSD}integer', literal(L, datatype('${XSD}string')), V), [regex_match('^[+-]?[0-9]+$', L), atom_chars(L, Cs), number_chars(V, Cs)])
implied_by(srl_cast_(D, T, R), [srl_float_type(D, K), srl_num(T, _, X), srl_make(K, X, R)])
implied_by(srl_cast_(D, T, R), [srl_float_type(D, K), srl_boolean(T, B), srl_bit(B, V), srl_make(K, V, R)])
implied_by(srl_cast_('${XSD}decimal', literal(L, datatype('${XSD}string')), R), [regex_match('^[+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)$', L), atom_chars(L, Cs), number_chars(X, Cs), srl_make('decimal', X, R)])
implied_by(srl_cast_(D, literal(L, datatype('${XSD}string')), R), [srl_float_type(D, K), srl_float_kind_double(K), regex_match('^[+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?$', L), atom_chars(L, Cs), number_chars(X, Cs), srl_make(K, X, R)])
implied_by(srl_cast_('${XSD}boolean', T, R), [srl_boolean(T, B), srl_bool(B, R)])
implied_by(srl_cast_('${XSD}boolean', T, R), [srl_num(T, _, X), or([eq(X, 0), unify(B, 'false')], [ne(X, 0), unify(B, 'true')]), srl_bool(B, R)])
implied_by(srl_cast_('${XSD}boolean', literal(L, datatype('${XSD}string')), R), [or([srl_true_text(L), unify(B, 'true')], [srl_false_text(L), unify(B, 'false')]), srl_bool(B, R)])
implied_by(srl_cast_('${XSD}dateTime', literal(L, datatype(D)), literal(L, datatype('${XSD}dateTime'))), [srl_text_or_datetime(D), regex_match('^-?\\d{4,}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d(?:\\.\\d+)?(?:Z|[+-]\\d\\d:\\d\\d)?$', L)])
implied_by(srl_cast_('${XSD}date', literal(L, datatype(D)), literal(L, datatype('${XSD}date'))), [srl_text_or_date(D), regex_match('^-?\\d{4,}-\\d\\d-\\d\\d(?:Z|[+-]\\d\\d:\\d\\d)?$', L)])
fact(srl_text_or_datetime('${XSD}string'), srl_text_or_datetime('${XSD}dateTime'), srl_text_or_date('${XSD}string'), srl_text_or_date('${XSD}date'))
fact(srl_float_type('${XSD}decimal', 'decimal'), srl_float_type('${XSD}float', 'float'), srl_float_type('${XSD}double', 'double'))
fact(srl_float_kind_double('float'), srl_float_kind_double('double'))
fact(srl_bit('true', 1), srl_bit('false', 0))`,
    needs: ['srl_make', 'srl_equal', 'srl_bool'],
  },

  // Aggregates.
  srl_aggregates: {
    text: String.raw`
// Aggregates over a group's column of values, repeats included.
implied_by(srl_count(Vs, N), srl_length(Vs, N))
implied_by(srl_count_distinct(Vs, N), [srl_distinct(Vs, Ds), srl_length(Ds, N)])
implied_by(srl_sum(Vs, S), srl_sum_(Vs, 0, S))
fact(srl_sum_([], S, S))
implied_by(srl_sum_([V, ...Vs], A, S), [srl_add(A, V, B), srl_sum_(Vs, B, S)])
implied_by(srl_min([V, ...Vs], M), srl_extreme(Vs, '<', V, M))
implied_by(srl_max([V, ...Vs], M), srl_extreme(Vs, '>', V, M))
fact(srl_extreme([], _, M, M))
implied_by(srl_extreme([V, ...Vs], O, A, M), [srl_rank_order(V, A, P), srl_pick(P, O, V, A, B), srl_extreme(Vs, O, B, M)])
implied_by(srl_pick(P, P, V, _, V), 'true')
implied_by(srl_pick(P, O, _, A, A), not_identical(P, O))
// The order of ORDER BY: blank nodes, IRIs, then literals; comparable
// literals by value, others by their terms.
implied_by(srl_rank_order(A, B, O), once(or(srl_order(A, B, O), [srl_term_rank(A, I), srl_term_rank(B, J), or([ne(I, J), compare(O, I, J)], [eq(I, J), compare(O, A, B)])])))
implied_by(srl_term_rank(T, 0), or(unify(T, bnode(_, _)), unify(T, skolem(_, _, _))))
implied_by(srl_term_rank(iri(_), 1), 'true')
implied_by(srl_term_rank(T, 2), or(is_number(T), unify(T, literal(_, _))))
implied_by(srl_term_rank(triple(_, _, _), 3), 'true')`,
    needs: ['srl_add', 'srl_order', 'srl_length', 'srl_distinct'],
  },

  // Lists.
  srl_member: {
    text: String.raw`
fact(srl_member(X, [X, ..._]))
implied_by(srl_member(X, [_, ...T]), srl_member(X, T))`,
  },
  srl_length: {
    text: String.raw`
implied_by(srl_length(L, N), srl_length_(L, 0, N))
fact(srl_length_([], N, N))
implied_by(srl_length_([_, ...T], A, N), [is(B, add(A, 1)), srl_length_(T, B, N)])`,
  },
  srl_distinct: {
    text: String.raw`
// srl_distinct(L, D): the distinct terms of L, in order of first occurrence.
implied_by(srl_distinct(L, D), srl_distinct_(L, [], D))
fact(srl_distinct_([], _, []))
implied_by(srl_distinct_([X, ...T], Seen, D), or([srl_seen(X, Seen), srl_distinct_(T, Seen, D)], [not(srl_seen(X, Seen)), unify(D, [X, ...D1]), srl_distinct_(T, [X, ...Seen], D1)]))
implied_by(srl_seen(X, [Y, ..._]), identical(X, Y))
implied_by(srl_seen(X, [Y, ...T]), [not_identical(X, Y), srl_seen(X, T)])`,
  },
  srl_nth: {
    text: String.raw`
fact(srl_nth(1, [X, ..._], X))
implied_by(srl_nth(N, [_, ...T], X), [gt(N, 1), is(M, sub(N, 1)), srl_nth(M, T, X)])`,
  },
  srl_column: {
    text: String.raw`
// srl_column(Rows, I, Vs): the I-th value of each row.
fact(srl_column([], _, []))
implied_by(srl_column([R, ...Rs], I, [V, ...Vs]), [srl_nth(I, R, V), srl_column(Rs, I, Vs)])`,
    needs: ['srl_nth'],
  },
};

function arith(name, op) {
  return String.raw`
implied_by(${name}(A, B, R), [srl_num(A, KA, X), srl_num(B, KB, Y), srl_promote(KA, KB, K), srl_finite('${op}', X, Y), is(V, ${op}(X, Y)), srl_make(K, V, R)])`;
}

function compare(name) {
  return String.raw`
implied_by(${name}(A, B, R), [srl_order(A, B, O), ${name}_(O, T), srl_bool(T, R)])`;
}

// The text of the definitions a program needs, and of those they need.
export function libraryText(needed) {
  const done = new Set();
  const out = [];
  const seenLines = new Set();
  const visit = (name) => {
    if (done.has(name)) return;
    done.add(name);
    const entry = DEFINITIONS[name];
    if (!entry) throw new Error(`no definition ${name}`);
    for (const dep of entry.needs ?? []) visit(dep);
    // Small shared facts appear in several definitions; state each once.
    const lines = entry.text.trim().split('\n').filter((line) => line.startsWith('//') || !seenLines.has(line));
    lines.forEach((line) => seenLines.add(line));
    out.push(lines.join('\n'));
  };
  for (const name of [...needed].sort()) visit(name);
  return out.join('\n');
}
