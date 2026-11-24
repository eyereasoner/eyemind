// Offline QUDT/CDT normalization. Metadata facts are a small, explicit selection
// from QUDT.org (CC BY 4.0), https://qudt.org/vocab/unit/ . Input metadata can
// extend or override it; there is no ontology download during compilation.
import { write } from './writer.js';
import { Struct } from './terms.js';
import { DIMENSIONS, KINDS, UNITS } from './qudt-catalog.js';

const Q = 'http://qudt.org/schema/qudt/';
const U = 'http://qudt.org/vocab/unit/';
const C = 'https://eyereasoner.github.io/eyemind/qudt#';
const D = 'http://qudt.org/vocab/dimensionvector/';
const K = 'http://qudt.org/vocab/quantitykind/';
const SAME_AS = 'http://www.w3.org/2002/07/owl#sameAs';
const EXACT_MATCH = 'http://www.w3.org/2004/02/skos/core#exactMatch';
const ALIGNED_UNIT = C + 'alignedQudtUnit';
const TARGET_UNIT = C + 'targetUnit';
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

const qudtCatalog = '\n' + definitions.join('\n') + String.raw`
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
for (const p of [iri('${SAME_AS}'), iri('${EXACT_MATCH}'), qc('alignedQudtUnit')]) {
  implied_by(qu_align(Local, U, G), [rdf(Local, p, U, G), qu_dimension(U, G, _)]);
}
// owl:sameAs and skos:exactMatch are symmetric, so a known unit can name its
// local alias without --owl2rl or --skos; qconv:alignedQudtUnit is directed.
for (const p of [iri('${SAME_AS}'), iri('${EXACT_MATCH}')]) {
  implied_by(qu_align(Local, U, G), [rdf(U, p, Local, G), qu_dimension(U, G, _)]);
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
// A unit of a dimension without a CDT datatype normalizes to the coherent SI
// unit qudtUnits chose for it, as a cdt:ucum literal, unless a profile covers
// its dimension or the property has a contract.
implied_by(qu_unit_target(P, U, T, Code, G), [qu_builtin_target(U, T, Code), not(ent_base(P, qc('normalizationProfile'), _, G)), qu_dimension(U, G, D), not(qu_selected(P, _, _, _, _, D, G))]);
implies([ent_base(S, P, literal(L, datatype(DT)), G), qu_generic(DT), qu_parsed(L, U, G, V), qu_unit_target(P, U, T, Code, G)], qu_input(S, P, literal(L, datatype(DT)), qc('sourceLiteral'), U, V, T, Code, 'https://w3id.org/cdt/ucum', G));
implies([ent_base(S, P, Q, G), rdf(Q, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), qu('QuantityValue'), G), rdf(Q, qu('numericValue'), Value, G), rdf(Q, qu('unit'), Local, G), qu_float(Value, V), qu_align(Local, U, G), qu_unit_target(P, U, T, Code, G)], qu_input(S, P, Q, qc('sourceQuantity'), U, V, T, Code, 'https://w3id.org/cdt/ucum', G));
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
// Units composed in the input from factor units or a prefix (qudtUnits).
implied_by(qu_unit(U, G, D, M, float(0)), [qu_derived(U, G, D, M), not(qu_custom(U, G))]);
// A quantity whose unit is not known, composed or aligned is reported.
implied_by(qu_resolved(L, G), qu_align(L, _, G));
implies([ent_base(S, P, Q, G), rdf(Q, iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), qu('QuantityValue'), G), rdf(Q, qu('unit'), L, G), not(qu_resolved(L, G))], ent_report(Q, qc('unresolvedUnit'), L, G));
`;

// The dimension exponents of a QUDT dimension vector, in its order.
const BASES = ['A', 'E', 'L', 'I', 'M', 'H', 'T'];
const vector = (name) => {
  const match = /^A(-?[0-9.]+)E(-?[0-9.]+)L(-?[0-9.]+)I(-?[0-9.]+)M(-?[0-9.]+)H(-?[0-9.]+)T(-?[0-9.]+)D[01]$/.exec(name);
  return match ? match.slice(1).map(Number) : null;
};
const vectorName = (exponents) => BASES.map((base, i) => base + (exponents[i] + 0)).join('') + (exponents.every((e) => e === 0) ? 'D1' : 'D0');
// The coherent SI unit of a dimension, in UCUM: kg, m, s, A, K, mol and cd.
const UCUM = [['M', 'kg'], ['L', 'm'], ['T', 's'], ['E', 'A'], ['H', 'K'], ['A', 'mol'], ['I', 'cd']];
// Positive exponents come first, as in cd.m-2.
const ucumOf = (exponents) => {
  const factors = UCUM.map(([base, code]) => [code, exponents[BASES.indexOf(base)]]).filter(([, e]) => e !== 0);
  return [...factors.filter(([, e]) => e > 0), ...factors.filter(([, e]) => e < 0)]
    .map(([code, e]) => code + (e === 1 ? '' : e)).join('.') || '1';
};
// The SI prefixes of QUDT's prefix vocabulary, for a prefix the input does
// not give a qudt:prefixMultiplier.
const PREFIXES = { Quecto: 1e-30, Ronto: 1e-27, Yocto: 1e-24, Zepto: 1e-21, Atto: 1e-18, Femto: 1e-15, Pico: 1e-12, Nano: 1e-9,
  Micro: 1e-6, Milli: 1e-3, Centi: 1e-2, Deci: 1e-1, Deca: 1e1, Hecto: 1e2, Kilo: 1e3, Mega: 1e6, Giga: 1e9, Tera: 1e12,
  Peta: 1e15, Exa: 1e18, Zetta: 1e21, Yotta: 1e24, Ronna: 1e27, Quetta: 1e30 };
// A product of multipliers without the rounding error of the
// multiplications when it is a short decimal, as 1e-12 for a nanogram.
const exact = (n) => {
  const rounded = Number(n.toPrecision(15));
  return rounded.toExponential().replace(/e.*$/, '').replace(/[-.]/g, '').length <= 12 ? rounded : n;
};
const usableMultiplier = (n) => Number.isFinite(n) && n !== 0;
// QUDT's units with a fixed conversion (qudt-catalog.js), read on first use:
// each one's dimension vector, multiplier, offset, whether it is a coherent
// SI unit and its UCUM code; and the units a UCUM code names, when it names
// one, or several with one conversion.
let catalog = null;
const catalogUnits = () => {
  if (catalog !== null) return catalog;
  const units = new Map(), byCode = new Map();
  for (const line of UNITS.split('\n')) {
    const [name, mult, offset, dim, coherent, codes, kinds] = line.split('\t');
    const unit = { exponents: vector(DIMENSIONS[Number(dim)]), mult: Number(mult), offset: Number(offset), coherent: coherent === '1',
      code: codes ? codes.split(' ')[0] : null, kinds: kinds ? kinds.split(' ').map((i) => KINDS[Number(i)]) : [] };
    units.set(U + name, unit);
    for (const code of codes ? codes.split(' ') : []) {
      const other = byCode.get(code);
      if (other === undefined) byCode.set(code, U + name);
      else if (other !== null && !same(units.get(other), unit)) byCode.set(code, null);
    }
  }
  return catalog = { units, byCode };
};
const same = (a, b) => a.mult === b.mult && a.offset === b.offset && vectorName(a.exponents) === vectorName(b.exponents);
const builtin = new Map(units.map(([name, dim, mult, offset, tokens]) => [U + name, { exponents: vector(dimensions[dim]), mult, offset, code: tokens[0] ?? null }]));
const profiled = new Set(targets.map(([dim]) => dimensions[dim]));
const builtinTokens = new Set(units.flatMap(([, , , , tokens]) => tokens));

// Facts for the units of these quads that QUDT composes from other units:
// qudt:hasFactorUnit with qudt:hasUnit and qudt:exponent, or qudt:prefix
// with qudt:scalingOf. The conversion multiplier is the product of the
// factors' multipliers raised to their exponents, times qudt:factorUnitScalar
// if given. The dimension is the sum of the factors' scaled dimensions.
// A factor's offset does not carry over, but a unit that is one factor with
// an offset is not a new one.
// The QUDT units the quads use and the catalog of builtin units lacks, by
// IRI or by the UCUM code of a CDT literal, come from QUDT's catalog.
export function qudtUnits(quads) {
  const about = new Map();
  for (const quad of quads) {
    if (quad[0]?.name !== 'iri' && quad[0]?.name !== 'bnode') continue;
    const id = write(quad[0]);
    if (!about.has(id)) about.set(id, []);
    about.get(id).push(quad);
  }
  const values = (node, property) => (about.get(write(node)) ?? []).filter((q) => q[1].args?.[0] === Q + property).map((q) => q[2]);
  const numberOf = (term) => typeof term === 'bigint' ? Number(term)
    : term?.name === 'literal' && /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(term.args[0]) ? Number(term.args[0]) : null;
  const known = new Map(), derived = [];
  // The graph of a unit's metadata.
  const graphOf = (unit) => write(about.get(write(unit))[0][3]);
  const resolve = (unit, seen = new Set()) => {
    if (unit?.name !== 'iri') return null;
    const id = unit.args[0];
    if (known.has(id)) return known.get(id);
    if (seen.has(id)) return null;
    seen.add(id);
    let found = null;
    const multiplier = numberOf(values(unit, 'conversionMultiplier')[0]);
    const exponents = vector(values(unit, 'hasDimensionVector')[0]?.args?.[0]?.slice(D.length));
    if (multiplier !== null && exponents !== null) {
      const offset = values(unit, 'conversionOffset')[0];
      const offsetValue = offset === undefined ? 0 : numberOf(offset);
      if (usableMultiplier(multiplier) && Number.isFinite(offsetValue) && exponents.every(Number.isFinite)) {
        found = { exponents, mult: multiplier, offset: offsetValue };
      }
    } else if (builtin.has(id)) {
      found = builtin.get(id);
    } else if (catalogUnits().units.has(id)) {
      found = catalogUnits().units.get(id);
      derived.push(`fact(qu_builtin(${iri(id)}, ${iri(D + vectorName(found.exponents))}, ${number(found.mult)}, ${number(found.offset)}));`);
    } else {
      const factors = values(unit, 'hasFactorUnit');
      const prefix = values(unit, 'prefix')[0], base = values(unit, 'scalingOf')[0];
      let parts = null;
      if (factors.length) parts = factors.map((f) => [values(f, 'hasUnit')[0], numberOf(values(f, 'exponent')[0])]);
      else if (prefix && base) {
        const stated = values(prefix, 'prefixMultiplier')[0];
        const scale = stated === undefined ? PREFIXES[prefix.args?.[0]?.slice('http://qudt.org/vocab/prefix/'.length)] : numberOf(stated);
        if (usableMultiplier(scale)) parts = [[base, 1, scale]];
      }
      const scalar = factors.length ? values(unit, 'factorUnitScalar')[0] : undefined;
      const factor = scalar === undefined ? 1 : numberOf(scalar);
      if (usableMultiplier(factor) && parts?.every(([u, e]) => u && Number.isFinite(e))) {
        const resolved = parts.map(([u, e, scale = 1]) => [resolve(u, seen), e, scale]);
        if (resolved.every(([r]) => r) && (factors.length > 1 || resolved[0][1] !== 1 || resolved[0][0].offset === 0)) {
          const powers = BASES.map((_, i) => resolved.reduce((sum, [r, e]) => sum + r.exponents[i] * e, 0));
          const mult = exact(factor * resolved.reduce((product, [r, e, scale]) => product * scale * r.mult ** e, 1));
          const dim = vectorName(powers);
          if (usableMultiplier(mult) && vector(dim)) {
            found = { exponents: powers, mult, offset: 0 };
            derived.push(`fact(qu_derived(${iri(id)}, ${graphOf(unit)}, ${iri(D + dim)}, ${number(mult)}));`);
          }
        }
      }
    }
    known.set(id, found);
    return found;
  };
  for (const id of about.keys()) {
    const subject = about.get(id)[0][0];
    if (['hasFactorUnit', 'scalingOf', 'hasDimensionVector'].some((p) => values(subject, p).length)) resolve(subject);
  }
  for (const [, predicate, unit] of quads) {
    const p = predicate.args?.[0];
    if (p === Q + 'unit' || p === TARGET_UNIT) resolve(unit);
  }
  // An alignment can be the only mention of a catalog unit, for example
  // when a CDT literal uses a local symbol. OWL and SKOS can reverse it.
  const resolveCatalog = (unit) => {
    if (unit?.name === 'iri' && unit.args[0].startsWith(U)) resolve(unit);
  };
  for (const [subject, predicate, object] of quads) {
    const p = predicate.args?.[0];
    if (p === SAME_AS || p === EXACT_MATCH) resolveCatalog(subject);
    if (p === SAME_AS || p === EXACT_MATCH || p === ALIGNED_UNIT) resolveCatalog(object);
  }
  // The units of CDT literals by their UCUM codes.
  const tokens = [];
  for (const quad of quads) {
    const [lexical, datatype] = quad[2]?.name === 'literal' ? quad[2].args : [];
    if (typeof lexical !== 'string' || !/^(https:\/\/w3id\.org\/cdt\/|http:\/\/w3id\.org\/lindt\/custom_datatypes#)/.test(datatype?.args?.[0])) continue;
    const code = /^\s*\S+\s+(.+?)\s*$/.exec(lexical)?.[1];
    const unit = code && !builtinTokens.has(code) ? catalogUnits().byCode.get(code) : null;
    if (unit && resolve(new Struct('iri', [unit]))) tokens.push(`fact(qu_builtin_token(${text(code)}, ${iri(unit)}));`);
  }
  // Each unit of a dimension without a CDT datatype normalizes to the target
  // targetUnit chooses from its dimension and quantity kinds alone, so
  // separate runs agree; the input's own kinds of a unit replace QUDT's.
  const targets = [], declared = new Set();
  for (const [id, unit] of known) {
    const dim = unit && vectorName(unit.exponents);
    if (!unit || profiled.has(dim)) continue;
    const stated = [...values(new Struct('iri', [id]), 'hasQuantityKind'), ...values(new Struct('iri', [id]), 'unitForQuantityKind')]
      .map((kind) => kind?.args?.[0]).filter((kind) => typeof kind === 'string').map((kind) => kind.startsWith(K) ? kind.slice(K.length) : kind);
    const { target, code } = targetUnit(dim, stated.length ? stated : kindsOf(id));
    if (!declared.has(target)) {
      declared.add(target);
      if (target.startsWith(C)) targets.push(`fact(qu_builtin(${iri(target)}, ${iri(D + dim)}, ${number(1)}, ${number(0)}));`);
      else resolve(new Struct('iri', [target]));
      targets.push(`fact(qu_builtin_token(${text(code)}, ${iri(target)}));`);
    }
    targets.push(`fact(qu_builtin_target(${iri(id)}, ${iri(target)}, ${text(code)}));`);
  }
  return [...derived, ...tokens, ...targets].map((line) => line + '\n').join('');
}

// The quantity kinds QUDT gives a unit, by their names in quantitykind:.
const kindsOf = (unit) => catalogUnits().units.get(unit)?.kinds ?? [];

// The coherent SI unit a unit of dimension dim with these quantity kinds
// normalizes to, and its UCUM code: a coherent SI unit of QUDT's catalog,
// preferring one that shares a quantity kind, then the one of SI base units,
// as PER-SEC for s-1, then the one with the fewest UCUM factors, as W-PER-M2
// over W-PER-M2-SR, then the first by name; or else the one eyemind names by
// its UCUM code, as K.s-1.
const targetUnit = (dim, kinds) => {
  const base = ucumOf(vector(dim));
  const candidates = [...catalogUnits().units].filter(([, u]) => u.coherent && u.code && vectorName(u.exponents) === dim);
  const rank = ([id, u]) => [u.kinds.some((k) => kinds.includes(k)) ? 0 : 1, u.code === base ? 0 : 1, u.code.split('.').length, id];
  const order = (a, b) => {
    const [x, y] = [rank(a), rank(b)];
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
    return 0;
  };
  const best = candidates.sort(order)[0];
  return best ? { target: best[0], code: best[1].code } : { target: C + 'unit-' + base, code: base };
};

export const qudtRules = (quads) => qudtCatalog + qudtUnits(quads);

// The conversion from one QUDT unit to another, both given by IRI, as a
// value in the second unit = value in the first × scale + offset; with the
// dimension vector they share and the quantity kinds both have, so a caller
// can refuse a conversion between kinds. Null when either unit is not in the
// catalog, has no fixed conversion, or the dimensions differ.
export function unitConversion(from, to) {
  const unitOf = (id) => catalogUnits().units.get(id) ?? builtin.get(id) ?? null;
  const [a, b] = [unitOf(from), unitOf(to)];
  if (!a || !b || vectorName(a.exponents) !== vectorName(b.exponents)) return null;
  // QUDT converts to SI as (value + offset) × multiplier.
  const scale = exact(a.mult / b.mult);
  const offset = exact(a.offset * a.mult / b.mult - b.offset) + 0;
  const shared = kindsOf(from).filter((kind) => kindsOf(to).includes(kind));
  return { scale, offset, dimensionVector: D + vectorName(a.exponents), sharedQuantityKinds: shared.map((kind) => K + kind) };
}

// The quantity kinds QUDT gives a unit, by IRI.
export const quantityKinds = (unit) => kindsOf(unit).map((kind) => K + kind);
