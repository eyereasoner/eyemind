// eyemind: reasoning you can see, in JavaScript.
//
// Logic Script (LS) states facts, rules and queries in JavaScript syntax.
// Forward rules materialize conclusions until a fixpoint; backward rules are
// decided when a goal asks for them. A separate checker verifies proofs
// against the program, using their call tables and recorded firings.
export { VERSION } from './version.js';
export { Result, run, unusedClauses } from './engine.js';
export { readGoal } from './goals.js';
export { FloatLiteral, build, loadSources, loadText, toTerm } from './lang.js';
export { Program } from './program.js';
export { checkProof, checkReport, publicReport, verdictText } from './proof.js';
export { readTerm, readTerms } from './reader.js';
export { EyemindError, Struct, Var } from './terms.js';
export { write } from './writer.js';
export { RdfMessageReader, parseRdfMessages } from './messages.js';
export { compileLe, writeLe } from './le.js';
export { explainLe } from './le-explain.js';
