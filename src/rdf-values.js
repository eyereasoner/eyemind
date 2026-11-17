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
  'normalizedString', 'token', 'language', 'anyURI', 'date', 'dateTime', 'dateTimeStamp', 'time',
  'hexBinary', 'base64Binary'].map((n) => XSD + n), RDF + 'langString', RDF + 'dirLangString']);

const integerRules = bounds.map(([name, min, max]) => {
  const facets = `${min === null ? '' : `, ge(N, ${min})`}${max === null ? '' : `, le(N, ${max})`}`;
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
implied_by(rv_lexical(D, L), [rv_binary_type(D), regex_match('^[ \\t\\r\\n]*(?:[+-]?(?:(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?|INF)|NaN)[ \\t\\r\\n]*$', L)]);
fact(rv_binary_type(rvXsd + 'float'), rv_binary_type(rvXsd + 'double'));
implied_by(rv_lexical(rvXsd + 'boolean', L), regex_match('^[ \\t\\r\\n]*(true|false|0|1)[ \\t\\r\\n]*$', L));
implied_by(rv_lexical(D, L), [rv_text_type(D), is_atom(L)]);
fact(rv_text_type(rvXsd + 'string'), rv_text_type(rvXsd + 'normalizedString'), rv_text_type(rvXsd + 'token'), rv_text_type(rvXsd + 'anyURI'));
implied_by(rv_lexical(rvXsd + 'language', L), regex_match('^[ \\t\\r\\n]*[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*[ \\t\\r\\n]*$', L));
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
implied_by(rv_text_value(literal(L, datatype(rvXsd + 'normalizedString')), S), regex_replace('[\\t\\r\\n]', L, ' ', S));
implied_by(rv_text_value(literal(L, datatype(rvXsd + 'token')), S), [regex_replace('[ \\t\\r\\n]+', L, ' ', A), regex_replace('^ | $', A, '', S)]);
implied_by(rv_order(A, B, O), [rv_valid(A), rv_valid(B), srl_pair(A, B, _, X, Y), srl_value_compare(X, Y, O)]);
implied_by(rv_order(A, B, O), [rv_text_value(A, S), rv_text_value(B, T), compare(O, S, T)]);
implied_by(rv_integer_value(T, N), [rv_exact(T), srl_num(T, _, V), srl_decimal_value(V, decimal(C, S)), is(P, pow(10, S)), eq(mod(C, P), 0), is(N, floordiv(C, P))]);
implied_by(rv_member(T, iri(rvXsd + 'decimal')), rv_exact(T));
implied_by(rv_member(T, D), rv_valid_as(T, D));
` + integerRules + '\n' + [...RDF_DATATYPES].map((d) => `fact(rv_supported(iri('${d}')));`).join('\n') + dateRules;
