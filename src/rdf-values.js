// Datatype tests and value arithmetic are ordinary LS. Exact decimals reuse
// the SPARQL library, so certificates do not trust JavaScript conversions.
import { libraryText } from './srl-functions.js';

const XSD = 'http://www.w3.org/2001/XMLSchema#';
const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const bounds = [
  ['integer', null, null], ['long', '-9223372036854775808', '9223372036854775807'],
  ['int', '-2147483648', '2147483647'], ['short', '-32768', '32767'], ['byte', '-128', '127'],
  ['nonNegativeInteger', '0', null], ['positiveInteger', '1', null],
  ['nonPositiveInteger', null, '0'], ['negativeInteger', null, '-1'],
  ['unsignedLong', '0', '18446744073709551615'], ['unsignedInt', '0', '4294967295'],
  ['unsignedShort', '0', '65535'], ['unsignedByte', '0', '255'],
];
export const RDF_DATATYPES = new Set([...bounds.map(([n]) => XSD + n), ...['decimal', 'float', 'double', 'boolean', 'string',
  'normalizedString', 'token', 'language', 'Name', 'NCName', 'NMTOKEN', 'anyURI', 'date', 'dateTime', 'dateTimeStamp', 'time',
  'hexBinary', 'base64Binary'].map((n) => XSD + n), RDF + 'langString', RDF + 'dirLangString', RDF + 'PlainLiteral', RDF + 'XMLLiteral']);

const integerRules = bounds.map(([name, min, max]) => {
  // BigInt literals: as JavaScript numbers, bounds beyond 2^53 would round.
  const facets = `${min === null ? '' : `, ge(N, ${min}n)`}${max === null ? '' : `, le(N, ${max}n)`}`;
  return `implied_by(rv_lexical('${XSD}${name}', L), [srl_read_number('integer', L, N)${facets}]);\n` +
    `implied_by(rv_member(T, iri('${XSD}${name}')), [rv_integer_value(T, N)${facets}]);\n` +
    `fact(rv_integer_datatype(iri('${XSD}${name}')));`;
}).join('\n');

const dateRules = String.raw`
// Calendar and timezone checks use LS arithmetic, never a host clock.
implied_by(rv_digits(S, N), [atom_chars(S, Cs), number_chars(N, Cs)]);
fact(rv_zone('Z', 'utc', 0), rv_zone('', 'local', 0));
implied_by(rv_zone(Z, 'utc', N), [regex_find('^([+-])([0-9]{2}):([0-9]{2})$', Z, [_, S, H0, M0]), rv_digits(H0, H), rv_digits(M0, M), le(H, 14), lt(M, 60), or(lt(H, 14), eq(M, 0)), is(A, add(mul(H, 3600), mul(M, 60))), rv_zone_sign(S, A, N)]);
fact(rv_zone_sign('+', N, N));
implied_by(rv_zone_sign('-', N, M), is(M, neg(N)));
implied_by(rv_leap(Y), [eq(mod(Y, 4), 0), or(ne(mod(Y, 100), 0), eq(mod(Y, 400), 0))]);
${[31,28,31,30,31,30,31,31,30,31,30,31].map((n,i)=>`fact(rv_month(${i+1}, ${n}));`).join('\n')}
implied_by(rv_day(Y, M, D, N), [rv_month(M, Base), rv_month_days(Y, M, Base, Days), ge(D, 1), le(D, Days), is(A, sub(Y, 1)), is(B, add(sub(add(mul(365, A), floordiv(A, 4)), floordiv(A, 100)), floordiv(A, 400))), rv_month_offset(Y, M, O), is(N, add(add(B, O), sub(D, 1)))]);
implied_by(rv_month_days(Y, 2, 28, 29), rv_leap(Y));
implied_by(rv_month_days(Y, 2, 28, 28), not(rv_leap(Y)));
implied_by(rv_month_days(_, M, N, N), ne(M, 2));
${[0,31,59,90,120,151,181,212,243,273,304,334].map((n,i)=>`fact(rv_month_base(${i+1}, ${n}));`).join('\n')}
implied_by(rv_month_offset(Y, M, O), [rv_month_base(M, B), gt(M, 2), rv_leap(Y), is(O, add(B, 1))]);
implied_by(rv_month_offset(Y, M, B), [rv_month_base(M, B), or(le(M, 2), not(rv_leap(Y)))]);
implied_by(rv_clock(H, M, decimal(S, Scale), decimal(N, Scale)), [ge(H, 0), le(H, 24), ge(M, 0), lt(M, 60), is(P, pow(10, Scale)), ge(S, 0), lt(S, mul(60, P)), or(lt(H, 24), and(eq(M, 0), eq(S, 0))), is(N, add(mul(add(mul(H, 3600), mul(M, 60)), P), S))]);
implied_by(rv_date(L, Kind, N), [regex_find('^[ \\t\\r\\n]*(-?(?:[0-9]{4}|[1-9][0-9]{4,}))-([0-9]{2})-([0-9]{2})(Z|[+-][0-9]{2}:[0-9]{2})?[ \\t\\r\\n]*$', L, [_, Y0, M0, D0, Z]), not_identical(Y0, '-0000'), rv_digits(Y0, Y), rv_digits(M0, M), rv_digits(D0, D), rv_day(Y, M, D, Day), rv_zone(Z, Kind, Offset), is(N, sub(mul(Day, 86400), Offset))]);
implied_by(rv_datetime(L, Kind, N), [regex_find('^[ \\t\\r\\n]*(-?(?:[0-9]{4}|[1-9][0-9]{4,})-[0-9]{2}-[0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2}(?:\\.[0-9]+)?)(Z|[+-][0-9]{2}:[0-9]{2})?[ \\t\\r\\n]*$', L, [_, Day, H0, M0, S0, Z]), rv_date(Day, 'local', D), rv_digits(H0, H), rv_digits(M0, M), srl_decimal_text(S0, S), rv_clock(H, M, S, Time), rv_zone(Z, Kind, Offset), is(Base, sub(D, Offset)), srl_calculate('add', decimal(Base, 0), Time, N)]);
implied_by(rv_time(L, Kind, N), [regex_find('^[ \\t\\r\\n]*([0-9]{2}):([0-9]{2}):([0-9]{2}(?:\\.[0-9]+)?)(Z|[+-][0-9]{2}:[0-9]{2})?[ \\t\\r\\n]*$', L, [_, H0, M0, S0, Z]), rv_digits(H0, H), rv_digits(M0, M), srl_decimal_text(S0, S), rv_clock(H, M, S, decimal(Time, Scale)), rv_zone(Z, Kind, Offset), is(P, pow(10, Scale)), is(C, sub(mod(Time, mul(86400, P)), mul(Offset, P))), unify(N, decimal(C, Scale))]);
implied_by(rv_lexical(rvXsd + 'date', L), rv_date(L, _, _));
implied_by(rv_lexical(rvXsd + 'dateTime', L), rv_datetime(L, _, _));
implied_by(rv_lexical(rvXsd + 'dateTimeStamp', L), rv_datetime(L, 'utc', _));
implied_by(rv_lexical(rvXsd + 'time', L), rv_time(L, _, _));
implied_by(rv_temporal(literal(L, datatype(rvXsd + 'date')), 'date', K, N), rv_date(L, K, N));
implied_by(rv_temporal(literal(L, datatype(rvXsd + 'dateTime')), 'dateTime', K, N), rv_datetime(L, K, N));
implied_by(rv_temporal(literal(L, datatype(rvXsd + 'dateTimeStamp')), 'dateTime', 'utc', N), rv_datetime(L, 'utc', N));
implied_by(rv_temporal(literal(L, datatype(rvXsd + 'time')), 'time', K, N), rv_time(L, K, N));
implied_by(rv_order(A, B, O), [rv_temporal(A, T, K, X), rv_temporal(B, T, K, Y), srl_decimal_value(X, A0), srl_decimal_value(Y, B0), srl_value_compare(A0, B0, O)]);
implied_by(rv_member(T, iri(rvXsd + 'dateTime')), [rv_datatype(T, iri(rvXsd + 'dateTimeStamp')), rv_valid(T)]);
`;

// The SPARQL definitions the value rules use; a profile may add more.
const VALUE_LIBRARY = ['srl_num', 'srl_make', 'srl_add', 'srl_sub', 'srl_mul', 'srl_div', 'srl_order', 'srl_str', 'srl_lang'];
export const rdfValueRules = (extra = []) => '\n' + libraryText(new Set([...VALUE_LIBRARY, ...extra])) + '\n' + VALUE_RULES;
const VALUE_RULES = String.raw`
const rvXsd = 'http://www.w3.org/2001/XMLSchema#';
const rvRdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
implied_by(rv_datatype(N, iri(rvXsd + 'integer')), is_int(N));
fact(rv_datatype(literal(_, datatype(D)), iri(D)));
fact(rv_datatype(literal(_, lang(_)), iri(rvRdf + 'langString')));
fact(rv_datatype(literal(_, lang(_, _)), iri(rvRdf + 'dirLangString')));
implied_by(rv_literal(T), rv_datatype(T, _));
implied_by(rv_valid(T), [rv_datatype(T, D), rv_valid_as(T, D)]);
implied_by(rv_valid_as(T, iri(rvXsd + 'integer')), is_int(T));
implied_by(rv_valid_as(literal(L, datatype(D)), iri(D)), rv_lexical(D, L));
fact(rv_valid_as(literal(_, lang(_)), iri(rvRdf + 'langString')));
fact(rv_valid_as(literal(_, lang(_, _)), iri(rvRdf + 'dirLangString')));
implied_by(rv_lexical(rvXsd + 'decimal', L), srl_decimal_text(L, _));
implied_by(rv_lexical(D, L), [rv_binary_type(D), regex_match('^[ \\t\\r\\n]*(?:[+-]?(?:(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?|INF)|NaN)[ \\t\\r\\n]*$', L), rv_binary_range(D, L)]);
// A finite lexical form whose value overflows the type, or is nonzero and
// rounds to zero in it, denotes no value of the type.
implied_by(rv_binary_range(D, L), or(regex_match('INF|NaN', L), [float64('parse', L, 0, V), is_float(V), float64('abs', V, 0, A),
  rv_binary_limits(D, Max, Min), float64('compare', A, Max, O1), not_identical(O1, '>'), or(not(regex_match('^[^eE]*[1-9]', L)), [float64('compare', A, Min, O2), identical(O2, '>')])]));
fact(rv_binary_limits(rvXsd + 'double', float(1.7976931348623157e308), float(0)), rv_binary_limits(rvXsd + 'float', float(3.4028235677973366e38), float(7.006492321624085e-46)));
fact(rv_binary_type(rvXsd + 'float'), rv_binary_type(rvXsd + 'double'));
implied_by(rv_lexical(rvXsd + 'boolean', L), regex_match('^[ \\t\\r\\n]*(true|false|0|1)[ \\t\\r\\n]*$', L));
implied_by(rv_lexical(D, L), [rv_text_type(D), is_atom(L)]);
fact(rv_text_type(rvXsd + 'string'));
// An IRI reference: a colon before any /, ? or # ends a scheme, which starts
// with a letter; spaces, <>"{}|\^ and the backquote are excluded.
implied_by(rv_lexical(rvXsd + 'anyURI', L), [not(regex_match('[\\s<>"{}|\\\\^\\x60]', L)),
  or(not(regex_match('^[^/?#]*:', L)), regex_match('^[A-Za-z][A-Za-z0-9+.\\-]*:', L))]);
// The lexical spaces of the string types derived by restriction exclude what
// their whitespace facets would remove: a literal is not normalized first.
implied_by(rv_lexical(rvXsd + 'normalizedString', L), not(regex_match('[\\t\\r\\n]', L)));
implied_by(rv_lexical(rvXsd + 'token', L), not(regex_match('[\\t\\r\\n]|^ | $|  ', L)));
implied_by(rv_lexical(rvXsd + 'language', L), regex_match('^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*$', L));
implied_by(rv_lexical(rvXsd + 'Name', L), regex_match('^[\\p{L}_:][\\p{L}\\p{N}._:\\-]*$', L));
implied_by(rv_lexical(rvXsd + 'NCName', L), regex_match('^[\\p{L}_][\\p{L}\\p{N}._\\-]*$', L));
implied_by(rv_lexical(rvXsd + 'NMTOKEN', L), regex_match('^[\\p{L}\\p{N}._:\\-]+$', L));
// rdf:PlainLiteral: text, then @ and an empty or well-formed language tag.
implied_by(rv_lexical(rvRdf + 'PlainLiteral', L), regex_match('@(?:[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*)?$', L));
implied_by(rv_lexical(rvRdf + 'XMLLiteral', L), rv_xml(L));
// A well-formed XML fragment, as far as its tags: each opened tag closes in
// order, and no markup character is left outside a tag.
implied_by(rv_xml(L), [findall([C, N, E], regex_find('<(/?)([\\p{L}_:][\\p{L}\\p{N}._:\\-]*)(?:\\s[^<>]*?)?(/?)>', L, [_, C, N, E]), Tags),
  regex_replace('<(/?)([\\p{L}_:][\\p{L}\\p{N}._:\\-]*)(?:\\s[^<>]*?)?(/?)>', L, '', Rest), not(regex_match('[<>]', Rest)), rv_xml_balanced(Tags, [])]);
fact(rv_xml_balanced([], []));
implied_by(rv_xml_balanced([['', _, '/'], ...T], S), rv_xml_balanced(T, S));
implied_by(rv_xml_balanced([['', N, ''], ...T], S), rv_xml_balanced(T, [N, ...S]));
implied_by(rv_xml_balanced([['/', N, ''], ...T], [N, ...S]), rv_xml_balanced(T, S));
implied_by(rv_lexical(rvXsd + 'hexBinary', L), regex_match('^[ \\t\\r\\n]*(?:[0-9A-Fa-f]{2})*[ \\t\\r\\n]*$', L));
implied_by(rv_lexical(rvXsd + 'base64Binary', L), [regex_replace('[ \\t\\r\\n]', L, '', S), regex_match('^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/][AQgw]==|[A-Za-z0-9+/]{2}[AEIMQUYcgkosw048]=)?$', S)]);
implied_by(rv_exact(T), [rv_valid(T), srl_num(T, K, _), rv_exact_kind(K)]);
fact(rv_exact_kind('integer'), rv_exact_kind('decimal'));
implied_by(rv_same(A, B), [rv_exact(A), rv_exact(B), srl_order(A, B, '=')]);
implied_by(rv_different(A, B), [rv_exact(A), rv_exact(B), srl_order(A, B, O), not_identical(O, '=')]);
implied_by(rv_same(A, B), [rv_boolean(A, V), rv_boolean(B, V)]);
implied_by(rv_different(A, B), [rv_boolean(A, V), rv_boolean(B, W), not_identical(V, W)]);
implied_by(rv_boolean(literal(L, datatype(rvXsd + 'boolean')), V), [regex_find('^[ \\t\\r\\n]*(true|false|0|1)[ \\t\\r\\n]*$', L, [_, S]), rv_boolean_text(S, V)]);
fact(rv_boolean_text('true', 'true'), rv_boolean_text('1', 'true'), rv_boolean_text('false', 'false'), rv_boolean_text('0', 'false'));
implied_by(rv_same(A, B), [rv_text_value(A, S), rv_text_value(B, S)]);
implied_by(rv_different(A, B), [rv_text_value(A, S), rv_text_value(B, T), not_identical(S, T)]);
fact(rv_text_value(literal(L, datatype(rvXsd + 'string')), L));
// A valid literal of a string type derived by restriction is its own value.
implied_by(rv_text_value(literal(L, datatype(D)), L), [rv_string_type(D), rv_lexical(D, L)]);
fact(rv_string_type(rvXsd + 'normalizedString'), rv_string_type(rvXsd + 'token'), rv_string_type(rvXsd + 'language'),
  rv_string_type(rvXsd + 'Name'), rv_string_type(rvXsd + 'NCName'), rv_string_type(rvXsd + 'NMTOKEN'));
implied_by(rv_text_value(literal(L, datatype(rvRdf + 'PlainLiteral')), S), regex_find('^([\\s\\S]*)@$', L, [_, S]));
// The other value spaces: binary floats and doubles, temporal values, binary
// data, URIs, language-tagged text and XML. Values of different spaces are
// neither the same nor, here, different.
implied_by(rv_value(T, Space, V), [rv_valid(T), rv_datatype(T, D), rv_value_of(D, T, Space, V)]);
implied_by(rv_value_of(iri(D), T, D, V), [rv_binary_type(D), srl_num(T, _, V), is_float(V)]);
implied_by(rv_value_of(_, T, temporal(Type, Kind), V), rv_temporal(T, Type, Kind, V));
implied_by(rv_value_of(iri(rvXsd + 'hexBinary'), literal(L, _), 'hexBinary', V), [regex_replace('[ \\t\\r\\n]', L, '', S), atom_upper(S, V)]);
implied_by(rv_value_of(iri(rvXsd + 'base64Binary'), literal(L, _), 'base64Binary', V), regex_replace('[ \\t\\r\\n]', L, '', V));
fact(rv_value_of(iri(rvXsd + 'anyURI'), literal(L, _), 'anyURI', L));
fact(rv_value_of(iri(rvRdf + 'XMLLiteral'), literal(L, _), 'XMLLiteral', L));
implied_by(rv_value_of(iri(rvRdf + 'langString'), literal(S, lang(L)), 'lang', [S, T]), atom_lower(L, T));
implied_by(rv_value_of(iri(rvRdf + 'PlainLiteral'), literal(L, _), 'lang', [S, T]), [regex_find('^([\\s\\S]*)@([^@]+)$', L, [_, S, Tag]), atom_lower(Tag, T)]);
implied_by(rv_same(A, B), [rv_value(A, Space, V), rv_value(B, Space, W), rv_value_compare(Space, V, W, '=')]);
implied_by(rv_different(A, B), [rv_value(A, Space, V), rv_value(B, Space, W), rv_value_compare(Space, V, W, O), not_identical(O, '='), not_identical(O, 'unordered')]);
implied_by(rv_value_compare(Space, V, W, O), [rv_binary_type(Space), float64('compare', V, W, O)]);
implied_by(rv_value_compare(temporal(_, _), V, W, O), [srl_decimal_value(V, A), srl_decimal_value(W, B), srl_value_compare(A, B, O)]);
implied_by(rv_value_compare(Space, V, W, O), [rv_identity_space(Space), or([identical(V, W), unify(O, '=')], [not_identical(V, W), unify(O, '<>')])]);
fact(rv_identity_space('hexBinary'), rv_identity_space('base64Binary'), rv_identity_space('anyURI'), rv_identity_space('XMLLiteral'), rv_identity_space('lang'));
implied_by(rv_order(A, B, O), [rv_valid(A), rv_valid(B), srl_pair(A, B, _, X, Y), srl_value_compare(X, Y, O)]);
implied_by(rv_order(A, B, O), [rv_text_value(A, S), rv_text_value(B, T), compare(O, S, T)]);
implied_by(rv_integer_value(T, N), [rv_exact(T), srl_num(T, _, V), srl_decimal_value(V, decimal(C, S)), is(P, pow(10, S)), eq(mod(C, P), 0), is(N, floordiv(C, P))]);
implied_by(rv_member(T, iri(rvXsd + 'decimal')), rv_exact(T));
// Every string-family value is a string, and strings and language-tagged
// strings are rdf:PlainLiteral values.
implied_by(rv_member(T, iri(rvXsd + 'string')), rv_text_value(T, _));
// A string value belongs to each string type derived by restriction whose
// lexical space holds it: an NCName is also a Name, a token and so on.
implied_by(rv_member(T, iri(D)), [rv_text_value(T, S), rv_string_type(D), rv_lexical(D, S)]);
implied_by(rv_member(T, iri(rvRdf + 'PlainLiteral')), or(rv_text_value(T, _), rv_value(T, 'lang', _)));
implied_by(rv_member(T, D), rv_valid_as(T, D));
` + integerRules + '\n' + [...RDF_DATATYPES].map((d) => `fact(rv_supported(iri('${d}')));`).join('\n') + dateRules;
