// eyecode: reasoning you can see, in JavaScript.
//
// Facts and rules are JavaScript. Forward rules materialize conclusions until
// a fixpoint, backward rules are decided when a goal asks for them, and every
// answer can come with a proof that a separate checker verifies against the
// program, condition by condition (C1-C7).
export { VERSION } from './version.js';
export { Result, run, unusedClauses } from './engine.js';
export { readGoal } from './goals.js';
export { FloatLiteral, build, loadSources, loadText, toTerm } from './lang.js';
export { Program } from './program.js';
export { checkProof, checkReport, publicReport, strict, verdictText } from './proof.js';
export { readTerm, readTerms } from './reader.js';
export { EyecodeError, Struct, Var } from './terms.js';
export { write } from './writer.js';
