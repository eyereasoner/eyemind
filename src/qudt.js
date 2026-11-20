// Offline QUDT/CDT normalization. Metadata facts are a small, explicit selection
// from QUDT.org (CC BY 4.0), https://qudt.org/vocab/unit/ . Input metadata can
// extend or override it; there is no ontology download during compilation.
const Q = 'http://qudt.org/schema/qudt/';
const U = 'http://qudt.org/vocab/unit/';
const C = 'https://eyereasoner.github.io/eyemind/qudt#';
const D = 'http://qudt.org/vocab/dimensionvector/';
const dimensions = {
  length: 'A0E0L1I0M0H0T0D0', area: 'A0E0L2I0M0H0T0D0', volume: 'A0E0L3I0M0H0T0D0',
  time: 'A0E0L0I0M0H0T1D0', mass: 'A0E0L0I0M1H0T0D0', speed: 'A0E0L1I0M0H0T-1D0',
  acceleration: 'A0E0L1I0M0H0T-2D0', temperature: 'A0E0L0I0M0H1T0D0',
  pressure: 'A0E0L-1I0M1H0T-2D0', energy: 'A0E0L2I0M1H0T-2D0', power: 'A0E0L2I0M1H0T-3D0',
  dimensionless: 'A0E0L0I0M0H0T0D1', current: 'A0E1L0I0M0H0T0D0', amountOfSubstance: 'A1E0L0I0M0H0T0D0',
  massDensity: 'A0E0L-3I0M1H0T0D0',
};
const units = [
  ['M', 'length', 1, 0, ['m']], ['CentiM', 'length', 0.01, 0, ['cm']], ['MilliM', 'length', 0.001, 0, ['mm']],
  ['KiloM', 'length', 1000, 0, ['km']], ['IN', 'length', 0.0254, 0, ['[in_i]', 'in']],
  ['FT', 'length', 0.3048, 0, ['[ft_i]', 'ft']], ['MI', 'length', 1609.344, 0, ['[mi_i]', 'mi']],
  ['SEC', 'time', 1, 0, ['s']], ['MIN', 'time', 60, 0, ['min']], ['HR', 'time', 3600, 0, ['h']], ['DAY', 'time', 86400, 0, ['d']],
  ['KiloGM', 'mass', 1, 0, ['kg']], ['GM', 'mass', 0.001, 0, ['g']], ['MilliGM', 'mass', 0.000001, 0, ['mg']],
  ['LB', 'mass', 0.45359237, 0, ['[lb_av]', 'lb']], ['OZ', 'mass', 0.028349523125, 0, ['[oz_av]', 'oz']],
  ['OZ_TROY', 'mass', 0.0311034768, 0, ['[oz_tr]']], ['TONNE', 'mass', 1000, 0, ['t']],
  ['KiloTONNE', 'mass', 1e6, 0, ['kt']], ['MegaTONNE', 'mass', 1e9, 0, ['Mt']],
  ['M-PER-SEC', 'speed', 1, 0, ['m/s', 'm.s-1']], ['KiloM-PER-HR', 'speed', 1 / 3.6, 0, ['km/h', 'km.h-1']],
  ['MI-PER-HR', 'speed', 0.44704, 0, ['[mi_i]/h', 'mph']], ['KN', 'speed', 1852 / 3600, 0, ['[kn_i]', 'kn']],
  ['M-PER-SEC2', 'acceleration', 1, 0, ['m/s2', 'm.s-2']],
  ['K', 'temperature', 1, 0, ['K']], ['DEG_C', 'temperature', 1, 273.15, ['Cel', '°C']],
  ['DEG_F', 'temperature', 5 / 9, 459.67, ['[degF]', '°F']],
  ['M2', 'area', 1, 0, ['m2']], ['CentiM2', 'area', 0.0001, 0, ['cm2']],
  ['M3', 'volume', 1, 0, ['m3']], ['L', 'volume', 0.001, 0, ['L', 'l']], ['MilliL', 'volume', 0.000001, 0, ['mL']],
  ['BBL', 'volume', 0.1589873, 0, ['[bbl_us]']],
  ['PA', 'pressure', 1, 0, ['Pa']], ['HectoPA', 'pressure', 100, 0, ['hPa']], ['KiloPA', 'pressure', 1000, 0, ['kPa']],
  ['MilliBAR', 'pressure', 100, 0, ['mbar']], ['BAR', 'pressure', 100000, 0, ['bar']],
  ['J', 'energy', 1, 0, ['J']], ['KiloJ', 'energy', 1000, 0, ['kJ']], ['MegaJ', 'energy', 1e6, 0, ['MJ']],
  ['W-HR', 'energy', 3600, 0, ['W.h']], ['KiloW-HR', 'energy', 3.6e6, 0, ['kW.h']], ['MegaW-HR', 'energy', 3.6e9, 0, ['MW.h']],
  ['BTU_IT', 'energy', 1055.05585262, 0, ['[Btu_IT]']], ['MegaBTU_IT', 'energy', 1055055852.62, 0, ['M[Btu_IT]']],
  ['W', 'power', 1, 0, ['W']], ['KiloW', 'power', 1000, 0, ['kW']], ['MegaW', 'power', 1e6, 0, ['MW']],
  ['UNITLESS', 'dimensionless', 1, 0, ['1']], ['NUM', 'dimensionless', 1, 0, []], ['PERCENT', 'dimensionless', 0.01, 0, ['%']],
  ['PPTH', 'dimensionless', 0.001, 0, ['[ppth]']], ['PPM', 'dimensionless', 1e-6, 0, ['[ppm]']],
  ['PPB', 'dimensionless', 1e-9, 0, ['[ppb]']],
  ['KiloGM-PER-M3', 'massDensity', 1, 0, ['kg/m3']], ['GM-PER-M3', 'massDensity', 0.001, 0, ['g/m3']],
  ['MilliGM-PER-M3', 'massDensity', 1e-6, 0, ['mg/m3']], ['MicroGM-PER-M3', 'massDensity', 1e-9, 0, ['ug/m3', 'µg/m3']],
  ['A', 'current', 1, 0, ['A']], ['MOL', 'amountOfSubstance', 1, 0, ['mol']],
];
const targets = [['length', 'M', 'm'], ['area', 'M2', 'm2'], ['volume', 'M3', 'm3'], ['time', 'SEC', 's'],
  ['mass', 'KiloGM', 'kg'], ['speed', 'M-PER-SEC', 'm/s'], ['acceleration', 'M-PER-SEC2', 'm/s2'],
  ['temperature', 'K', 'K'], ['pressure', 'PA', 'Pa'], ['energy', 'J', 'J'], ['power', 'W', 'W'],
  ['dimensionless', 'UNITLESS', '1'], ['current', 'A', 'A'], ['amountOfSubstance', 'MOL', 'mol'],
  // CDT has no datatype for mass density: its values are cdt:ucum literals.
  ['massDensity', 'KiloGM-PER-M3', 'kg/m3', 'ucum']];
const text = (s) => JSON.stringify(s);
const iri = (s) => `iri(${text(s)})`;
const number = (n) => `float(${n})`;
const definitions = [];
for (const [name, dim, mult, offset, tokens] of units) {
  definitions.push(`fact(qu_builtin(${iri(U + name)}, ${iri(D + dimensions[dim])}, ${number(mult)}, ${number(offset)}));`);
  for (const token of tokens) definitions.push(`fact(qu_builtin_token(${text(token)}, ${iri(U + name)}));`);
}
for (const [dt, unit, code, cdt = dt === 'current' ? 'electricCurrent' : dt] of targets) {
  const profile = C + dt[0].toUpperCase() + dt.slice(1) + 'Profile';
  definitions.push(`fact(qu_builtin_profile(${iri(profile)}, ${text('https://w3id.org/cdt/' + cdt)}, ${iri(U + unit)}, ${text(code)}));`);
}
for (const [name, base, exponent, code] of [['B', 10, 1, 'B'], ['DeciB', 10, 0.1, 'dB'],
  ['NP', Math.E, 1, 'Np'], ['OCT', 2, 1, 'oct'], ['DECADE', 10, 1, 'dec'], ['PH', 10, -1, '[pH]']]) {
  definitions.push(`fact(qu_builtin_log(${iri(U + name)}, ${number(base)}, ${number(exponent)}));`);
  definitions.push(`fact(qu_builtin_token(${text(code)}, ${iri(U + name)}));`);
}

export const qudtRules = '\n' + definitions.join('\n') + String.raw`
const qu = (n) => iri('http://qudt.org/schema/qudt/' + n);
const qc = (n) => iri('https://eyereasoner.github.io/eyemind/qudt#' + n);
const quDouble = 'http://www.w3.org/2001/XMLSchema#double';
const quString = 'http://www.w3.org/2001/XMLSchema#string';
implied_by(qu_float(T, F), [rv_valid(T), srl_num(T, _, N), srl_float_value(N, F), is_float(F)]);
implied_by(qu_custom(U, G), ent_base(U, qu('conversionMultiplier'), _, G));
implied_by(qu_unit(U, G, D, M, O), [qu_builtin(U, D, M, O), not(qu_custom(U, G))]);
implied_by(qu_unit(U, G, D, M, O), [ent_base(U, qu('hasDimensionVector'), D, G), ent_base(U, qu('conversionMultiplier'), T, G), qu_float(T, M), ne(M, 0.0), qu_offset(U, G, O)]);
implied_by(qu_offset(U, G, O), [ent_base(U, qu('conversionOffset'), T, G), qu_float(T, O)]);
implied_by(qu_offset(U, G, float(0)), not(ent_base(U, qu('conversionOffset'), _, G)));
implied_by(qu_log(U, G, B, E), [qu_builtin_log(U, B, E), not(ent_base(U, qc('logBase'), _, G))]);
implied_by(qu_log(U, G, B, E), [ent_base(U, qc('logBase'), BT, G), ent_base(U, qc('logExponentMultiplier'), ET, G), qu_float(BT, B), gt(B, 0.0), ne(B, 1.0), qu_float(ET, E), ne(E, 0.0)]);
implied_by(qu_dimension(U, G, D), qu_unit(U, G, D, _, _));
implied_by(qu_dimension(U, G, iri('http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H0T0D1')), qu_log(U, G, _, _));
implied_by(qu_token(T, U, G), qu_builtin_token(T, U));
for (const p of ['symbol', 'ucumCode', 'expression']) implied_by(qu_token(T, U, G), [ent_base(U, qu(p), L, G), srl_str(L, literal(T, datatype(quString)))]);
implied_by(qu_align(U, U, G), qu_dimension(U, G, _));
for (const p of [iri('http://www.w3.org/2002/07/owl#sameAs'), iri('http://www.w3.org/2004/02/skos/core#exactMatch'), qc('alignedQudtUnit')]) {
  implied_by(qu_align(Local, U, G), [rdf(Local, p, U, G), qu_dimension(U, G, _)]);
}
implied_by(qu_custom_profile(P, G), ent_base(P, qc('targetUnit'), _, G));
implied_by(qu_profile(P, DT, U, Code, G), [qu_builtin_profile(P, DT, U, Code), not(qu_custom_profile(P, G))]);
implied_by(qu_profile(P, DT, U, Code, G), [ent_base(P, qc('targetUnit'), U, G), ent_base(P, qc('datatype'), iri(DT), G), ent_base(P, qc('targetUcumCode'), L, G), srl_str(L, literal(Code, datatype(quString)))]);
implied_by(qu_datatype(P, DT, U, Code, G), qu_profile(P, DT, U, Code, G));
implied_by(qu_datatype(P, Old, U, Code, G), [qu_profile(P, DT, U, Code, G), atom_concat('https://w3id.org/cdt/', Name, DT), atom_concat('http://w3id.org/lindt/custom_datatypes#', Name, Old)]);
// Default selection must be unambiguous by dimension. A property contract wins.
implied_by(qu_default(P, DT, U, Code, D, G), [qu_profile(P, DT, U, Code, G), qu_dimension(U, G, D), not(qu_ambiguous(P, D, G))]);
implied_by(qu_ambiguous(P, D, G), [qu_profile(Q, _, V, _, G), not_identical(P, Q), qu_dimension(V, G, D)]);
implied_by(qu_selected(Property, P, DT, U, Code, D, G), [ent_base(Property, qc('normalizationProfile'), P, G), qu_profile(P, DT, U, Code, G), qu_dimension(U, G, D)]);
implied_by(qu_selected(Property, P, DT, U, Code, D, G), [not(ent_base(Property, qc('normalizationProfile'), _, G)), qu_default(P, DT, U, Code, D, G)]);
implied_by(qu_parsed(L, U, G, V), [regex_find('^\\s*([+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?)\\s+(.+?)\\s*$', L, [_, N, Token]), float64('parse', N, 0, V), is_float(V), qu_token(Token, Local, G), qu_align(Local, U, G)]);
implied_by(qu_generic('https://w3id.org/cdt/ucum'), 'true');
implied_by(qu_generic('http://w3id.org/lindt/custom_datatypes#ucum'), 'true');
// Only input measurements are normalized, so generated results cannot recursively
// become new measurements. Inferred OWL/SKOS unit alignments are still consulted.
implied_by(qu_contract(Property, Profile, G), not(ent_base(Property, qc('normalizationProfile'), _, G)));
implied_by(qu_contract(Property, Profile, G), ent_base(Property, qc('normalizationProfile'), Profile, G));
implies([ent_base(S, P, literal(L, datatype(DT)), G), not(qu_generic(DT)), qu_parsed(L, U, G, V), qu_datatype(Profile, DT, _, _, G), qu_contract(P, Profile, G), qu_profile(Profile, Specific, T, Code, G), qu_dimension(U, G, Dim), qu_dimension(T, G, Dim)], qu_input(S, P, literal(L, datatype(DT)), qc('sourceLiteral'), U, V, T, Code, Specific, G));
implies([ent_base(S, P, literal(L, datatype(DT)), G), qu_generic(DT), qu_parsed(L, U, G, V), qu_dimension(U, G, Dim), qu_selected(P, Profile, Specific, T, Code, Dim, G)], qu_input(S, P, literal(L, datatype(DT)), qc('sourceLiteral'), U, V, T, Code, Specific, G));
implies([ent_base(S, P, Q, G), rdf(Q, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), qu('QuantityValue'), G), rdf(Q, qu('numericValue'), Value, G), rdf(Q, qu('unit'), Local, G), qu_float(Value, V), qu_align(Local, U, G), qu_dimension(U, G, Dim), qu_selected(P, Profile, DT, T, Code, Dim, G)], qu_input(S, P, Q, qc('sourceQuantity'), U, V, T, Code, DT, G));
// QUDT's offset is applied before its multiplier; this matters for Fahrenheit.
implied_by(qu_ratio(V, U, G, R), [qu_unit(U, G, _, M, O), float64('add', V, O, A), float64('mul', A, M, R), is_float(R)]);
implied_by(qu_ratio(V, U, G, R), [qu_log(U, G, B, E), float64('mul', V, E, X), is_float(X), is(LB, log(B)), float64('mul', X, LB, Ln), is_float(Ln), lt(Ln, float(709.782712893384)), is(R, pow(B, X))]);
implied_by(qu_from_ratio(R, T, G, V), [qu_unit(T, G, _, M, O), float64('div', R, M, A), float64('sub', A, O, V), is_float(V)]);
implied_by(qu_from_ratio(R, T, G, V), [qu_log(T, G, B, E), gt(R, 0.0), is(LR, log(R)), is(LB, log(B)), float64('div', LR, LB, A), float64('div', A, E, V), is_float(V)]);
implies([qu_input(S, P, Q, Kind, U, V, T, Code, DT, G), qu_ratio(V, U, G, R), qu_from_ratio(R, T, G, N), srl_make('double', N, Number), number_chars(N, Cs), atom_chars(L, Cs), atom_concat(L, ' ', A), atom_concat(A, Code, Lexical)], [
  rdf(S, qc('normalizedQuantity'), B, G), rdf(S, qc('normalizedUcumLiteral'), literal(Lexical, datatype('https://w3id.org/cdt/ucum')), G),
  rdf(S, qc('normalizedCdtLiteral'), literal(Lexical, datatype(DT)), G),
  rdf(B, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), qu('QuantityValue'), G),
  rdf(B, qu('numericValue'), Number, G), rdf(B, qu('unit'), T, G), rdf(B, qc('sourceProperty'), P, G), rdf(B, Kind, Q, G), rdf(B, qc('sourceUnit'), U, G)
]);
`;
