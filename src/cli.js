// The eyemind command line.
import { COMPILED_LIMITS, run, unusedClauses } from './engine.js';
import { OUTPUT_FORMATS, RDF_PROFILES, defaultFormat, inputKind, loadInputs, loadMessageReasoner, rdfMessageFormat, scopeOf, writeConclusions } from './formats.js';
import { explainLe } from './le-explain.js';
import { isRdfMessageLog, replayMessages, RdfMessageReader } from './messages.js';
import { checkProof, checkReport, publicReport } from './proof.js';
import { writeRdf } from './rdf.js';
import { programText } from './specialize.js';
import { EyemindError } from './terms.js';
import { VERSION } from './version.js';
import { srlContextFromProof } from './srl.js';

export const HELP = `Usage: eyemind [OPTION ...] [FILE ...]
Logic Script (LS) programs use JavaScript syntax. Forward rules run to a fixpoint.
Files are read by extension: .js as LS, .ttl, .trig, .nt, .nq, .rdf (RDF/XML),
.jsonld (JSON-LD) and .ndjson (NDJSON-LD log) as RDF 1.2 data, .n3 as Notation3,
.srl as SPARQL 1.2 RL and .le as Logical English, all compiled to LS.
  -p, --proof             Print a proof of the conclusions
  -c, --prove-and-check   Generate a proof and check it against the input program
      --check-proof FILE  Check a proof and print its answers and verdict (- for stdin)
      --json              Print the check report as JSON instead
      --goal GOAL         Ask a backward goal after forward reasoning; with
                          --check-proof, the goal the proof answers
      --unused            List the clauses that make no difference to the conclusions
      --explain           Explain each Logical English answer in English, from its
                          checked proof
      --stats             Print reasoning statistics to stderr
      --max-depth N       Bound backward recursion (default 1000000)
      --max-iterations N  Bound forward rounds per stratum (default 1000)
      --max-inferences N  Bound reasoning work (default 1000000)
      --to FORMAT         Write the conclusions as turtle, trig, n-triples, n-quads,
                          rdf-xml, json-ld, n3, le or eyemind (default: le for LE, n3 for N3, turtle
                          for SRL, ODRL or RDF logic profiles, eyemind otherwise or with --goal)
      --all               With RDF or N3 output, write the given data too
      --program           Print the program the inputs compile to
      --odrl              Add ODRL validation and evaluation to one Turtle snapshot
      --owl2rl            Add OWL 2 RL inference, including RDFS, and conflict rules
      --qudt              Normalize QUDT quantities and CDT unit literals
      --skos              Add positive SKOS Core entailments
      --shacl             Compile SHACL Core shapes into LS validation rules
      --base IRI          Resolve relative IRIs of the inputs against IRI
      --stream-messages   Run the rules independently for each RDF Message
      --shacl-in FILE     With --stream-messages and a profile, specialize the
                          rules to the messages SHACL shapes in FILE describe
      --shacl-out FILE    With a profile, keep and write only the triples
                          SHACL shapes in FILE describe
  -v, --version           Print the version
  -h, --help              Print this help
Source defaults to stdin; multiple files form one program.
Exit codes: 0 success, 1 error, 2 invalid proof, 65 contradiction.
`;

const LIMITS = { '--max-depth': 'maxDepth', '--max-iterations': 'maxIterations', '--max-inferences': 'maxInferences' };
const ALIASES = new Map([['-p', '--proof'], ['-c', '--prove-and-check'], ['-v', '--version'], ['-h', '--help']]);

const RDF_FORMATS = ['turtle', 'trig', 'n-triples', 'n-quads'];

class UsageError extends Error {}

function readSource(path, io) {
  return path === '-' ? io.stdin() : io.readFile(path);
}

// Run the command line; returns the exit code. io writes and reads: stdout,
// stderr, stdin and readFile, and may check syntax (see node.js).
export function main(argv, io) {
  const stdout = (text) => io.stdout(text);
  const stderr = (text) => io.stderr(text);
  try {
    const files = [];
    const options = {};
    const goals = [];
    let proofFile = null;
    let stats = false;
    let asJson = false;
    let unused = false;
    let explain = false;
    let proveAndCheck = false;
    let format = null;
    let all = false;
    let printProgram = false;
    let base = null;
    let streamMessages = false;
    let odrl = false;
    const rdfLogic = {};
    const shapeFiles = { shaclIn: [], shaclOut: [] };
    const filePositions = new Set();
    for (let i = 0; i < argv.length; i++) {
      const arg = ALIASES.get(argv[i]) ?? argv[i];
      if (arg === '--help') {
        stdout(HELP);
        return 0;
      }
      if (arg === '--version') {
        stdout(`eyemind v${VERSION}\n`);
        return 0;
      }
      if (arg === '--proof') {
        options.proof = true;
      } else if (arg === '--prove-and-check') {
        proveAndCheck = true;
      } else if (arg === '--stats') {
        stats = true;
      } else if (arg === '--json') {
        asJson = true;
      } else if (arg === '--unused') {
        unused = true;
      } else if (arg === '--explain') {
        explain = true;
      } else if (arg === '--all') {
        all = true;
      } else if (arg === '--program') {
        printProgram = true;
      } else if (arg === '--odrl') {
        odrl = true;
      } else if (arg.startsWith('--') && RDF_PROFILES.includes(arg.slice(2))) {
        rdfLogic[arg.slice(2)] = true;
      } else if (arg === '--stream-messages') {
        streamMessages = true;
      } else if (arg === '--check-proof' || arg === '--goal' || arg === '--to' || arg === '--base' || arg === '--shacl-in' || arg === '--shacl-out' || Object.hasOwn(LIMITS, arg)) {
        i++;
        if (i >= argv.length) throw new UsageError(`${arg} needs a value`);
        const value = argv[i];
        // An option in the value's place means the value was left out, as in
        // --check-proof --json proof.js; reading the option as a file
        // name would only fail later with a puzzling message.
        if (/^--./.test(value) || ALIASES.has(value)) {
          throw new UsageError(`${arg} needs a value right after it, not the option ${value}`);
        }
        if (arg === '--check-proof') {
          proofFile = value;
        } else if (arg === '--to') {
          if (!OUTPUT_FORMATS.includes(value)) throw new UsageError(`--to takes one of ${OUTPUT_FORMATS.join(', ')}, not ${value}`);
          format = value;
        } else if (arg === '--base') {
          base = value;
        } else if (arg === '--goal') {
          goals.push(value);
        } else if (arg === '--shacl-in' || arg === '--shacl-out') {
          shapeFiles[arg === '--shacl-in' ? 'shaclIn' : 'shaclOut'].push(value);
        } else {
          const number = /^[0-9]+$/.test(value.trim()) ? Number(value.trim()) : 0;
          if (!Number.isSafeInteger(number) || number < 1) throw new UsageError(`${arg} needs a positive safe integer`);
          options[LIMITS[arg]] = number;
        }
      } else if (arg.startsWith('-') && arg !== '-') {
        throw new UsageError(`unknown option ${arg}`);
      } else {
        files.push(arg);
        filePositions.add(i);
      }
    }
    if (asJson && proofFile === null && !proveAndCheck) throw new UsageError('--json requires --check-proof or --prove-and-check');
    if (proveAndCheck && (proofFile !== null || options.proof)) {
      throw new UsageError('--prove-and-check cannot be combined with --proof or --check-proof');
    }
    if (proofFile !== null && options.proof) throw new UsageError('--check-proof cannot be combined with --proof');
    if (unused && (proofFile !== null || options.proof || proveAndCheck)) {
      throw new UsageError('--unused cannot be combined with --proof, --check-proof or --prove-and-check');
    }
    if (explain && (proofFile !== null || options.proof || proveAndCheck || unused || goals.length || format !== null || streamMessages)) {
      throw new UsageError('--explain writes Logical English explanations; it cannot be combined with --proof, --check-proof, --prove-and-check, --unused, --goal, --to or --stream-messages');
    }
    if (proofFile === '-' && (!files.length || files.includes('-'))) {
      throw new UsageError('stdin holds the proof; name the program as files');
    }
    const shaped = shapeFiles.shaclIn.length || shapeFiles.shaclOut.length;
    if (shaped && !RDF_PROFILES.some((p) => rdfLogic[p])) throw new UsageError('--shacl-in and --shacl-out need an RDF logic profile, such as --owl2rl');
    if (shapeFiles.shaclIn.length && !streamMessages) throw new UsageError('--shacl-in describes RDF Messages and needs --stream-messages');
    // The shapes are contracts for the run, not inputs of the program.
    const shapes = Object.fromEntries(Object.entries(shapeFiles).map(([option, names]) =>
      [option, names.length ? names.map((name) => [readSource(name, io), name]) : null]));
    if (!files.length) files.push('-');
    if (files.filter((file) => file === '-').length > 1) throw new UsageError('stdin can only be read once');
    if (streamMessages) {
      const profiles = RDF_PROFILES.filter((p) => rdfLogic[p]);
      if (odrl) throw new UsageError('--odrl cannot be combined with --stream-messages');
      if (proofFile !== null || options.proof || proveAndCheck || unused || (printProgram && !profiles.length)) {
        throw new UsageError('--stream-messages cannot be combined with --proof, --check-proof, --prove-and-check or --unused, ' +
          'nor with --program without an RDF logic profile; replay the whole log to prove its conclusions');
      }
      if (profiles.length && format !== null && !RDF_FORMATS.includes(format)) {
        throw new UsageError(`--stream-messages with ${profiles.map((p) => '--' + p).join(' ')} writes ${RDF_FORMATS.join(', ')}, not ${format}`);
      }
      const args = argv.filter((arg, i) => arg !== '--stream-messages' && !filePositions.has(i));
      let messageNumber = 0;
      // The logic profiles close the other inputs once and reason over each
      // message with rules specialized to its shape (rdf-logic.js).
      let reasoner = null;
      const infer = (inputs, message) => {
        reasoner ??= loadMessageReasoner(inputs.map(([path, text]) => [text, path === '-' ? '<stdin>' : path]), io, { base, ...rdfLogic, ...shapes, limits: { ...COMPILED_LIMITS, ...options } });
        const result = reasoner.infer(message.quads, { ...COMPILED_LIMITS, ...options });
        messageNumber++;
        if (printProgram) {
          if (result.sources) stdout(`// The rules specialized for message ${message.index} and those shaped like it, without their facts.\n${programText(result.sources)}`);
          else if (!result.specialized && messageNumber === 1) stdout(`// These rules are not specialized: ${reasoner.reason ?? 'a message has a shape they cannot be specialized to'}.\n`);
          return 0;
        }
        stdout(writeRdf(result.quads, { format: format ?? 'turtle', prefixes: { ...reasoner.prefixes, ...message.prefixes }, blankNodePrefix: `m${messageNumber}_` }));
        if (stats) stderr(`${JSON.stringify({ message: message.index, specialized: result.specialized, dropped: result.dropped, conforms: result.conforms, ...result.stats })}\n`);
        return result.haltCode || 0;
      };
      const request = {
        files, base,
        scope: (name, index = files.indexOf(name)) => scopeOf(files.map((f) => ['', f]), name, index),
        run: (inputs, name, replay, message) => profiles.length ? infer(inputs, message) : main([...args, ...inputs.map(([path]) => path), name], {
          ...io,
          // Each result is serialized separately; keep its blank labels
          // distinct without retaining nodes from previous messages.
          blankNodePrefix: `m${++messageNumber}_`,
          messageInputs: new Map([[name === '-' ? '<stdin>' : name, replay]]),
          readFile: (path) => path === name ? '' : inputs.find(([p]) => p === path)?.[1] ?? io.readFile(path),
          stdin: () => name === '-' ? '' : io.stdin(),
        }),
      };
      if (io.streamMessages) return io.streamMessages(request, io);
      // Hosts such as the playground already hold their inputs as text.
      // Node supplies the incremental file/HTTP implementation instead.
      const sources = files.map((name, index) => ({ name, index, text: readSource(name, io) }));
      const logs = sources.filter(({ name, text }) => rdfMessageFormat(name) === 'ndjson-ld' || isRdfMessageLog(text));
      if (!logs.length) throw new UsageError('--stream-messages needs an RDF Message Log: VERSION "*-messages", an rdfm:MessageLog in RDF/XML, or NDJSON-LD (.ndjson)');
      const inputs = sources.filter((source) => !logs.includes(source)).map(({ name, text }) => [name, text]);
      for (const { name, text, index } of logs) {
        let code = 0;
        const scope = request.scope(name, index);
        const reader = new RdfMessageReader({ format: rdfMessageFormat(name), base: base ?? io.fileIri?.(name), scope, onMessage: (message) => {
          code = request.run(inputs, name, replayMessages([message], { scope }), message);
          return code === 0;
        } });
        reader.write(text);
        reader.finish();
        if (code) return code;
      }
      return 0;
    }
    const document = proofFile === null ? null : readSource(proofFile, io);
    const loaded = loadInputs(files.map((file) => [readSource(file, io), file === '-' ? '<stdin>' : file]), io,
      { base, messageInputs: io.messageInputs, odrl, ...rdfLogic, shaclOut: shapes.shaclOut,
        srlContext: document !== null && (rdfLogic.shacl || files.some((file) => inputKind(file) === 'srl')) ? srlContextFromProof(document) : null });
    const program = loaded.program;
    if (printProgram) {
      stdout(loaded.text);
      return 0;
    }
    // N3, SRL and the RDF logic extensions have larger default bounds.
    if (!['js', 'le'].includes(loaded.kind)) for (const [name, value] of Object.entries(COMPILED_LIMITS)) options[name] ??= value;
    if (proofFile !== null) {
      const report = checkProof(program, document, { goals });
      stdout(asJson ? `${JSON.stringify(publicReport(report), null, 2)}\n` : checkReport(report));
      // An invalid proof is a result, not an error: it has its own exit code.
      return report.valid ? 0 : 2;
    }
    if (unused) {
      stdout(unusedClauses(program, { goals, ...options }));
      return 0;
    }
    if (explain) {
      if (loaded.kind !== 'le') throw new UsageError('--explain explains the answers of Logical English (.le) inputs');
      // The explanations are read from the proof, which is checked first.
      const result = run(program, { ...options, proof: true });
      stdout(explainLe(loaded, result.proof));
      if (stats) stderr(`${JSON.stringify(result.stats)}\n`);
      return result.haltCode || 0;
    }
    const result = run(program, { goals, ...options, proof: options.proof || proveAndCheck });
    if (proveAndCheck) {
      // Check the rendered certificate against the input, just as a saved
      // proof is checked; no second reasoning run supplies missing evidence.
      const report = checkProof(program, result.proof, { goals });
      stdout(asJson ? `${JSON.stringify(publicReport(report), null, 2)}\n` : checkReport(report));
      if (stats) stderr(`${JSON.stringify(result.stats)}\n`);
      return report.valid ? result.haltCode || 0 : 2;
    }
    // Answers to goals are eyemind terms unless an output format is asked.
    const written = options.proof ? result.proof : writeConclusions(loaded, result, {
      format: format ?? (goals.length ? 'eyemind' : defaultFormat(loaded.kind)), all, blankNodePrefix: io.blankNodePrefix,
    });
    stdout(written ?? result.stdout);
    if (stats) stderr(`${JSON.stringify(result.stats)}\n`);
    return result.haltCode || 0;
  } catch (error) {
    if (error instanceof UsageError || error instanceof EyemindError) {
      stderr(`eyemind: ${error.message}\n`);
      return 1;
    }
    if (error && (error.code === 'ENOENT' || error.code === 'EISDIR' || error.code === 'EACCES')) {
      stderr(`eyemind: ${error.message}\n`);
      return 1;
    }
    throw error;
  }
}
