// The eyelit command line.
import { run, unusedClauses } from './engine.js';
import { loadSources } from './lang.js';
import { checkProof, checkReport, publicReport } from './proof.js';
import { EyelitError } from './terms.js';
import { VERSION } from './version.js';

export const HELP = `Usage: eyelit [OPTION ...] [FILE ...]
Programs are JavaScript; forward rules run to a fixpoint.
  --proof             Print the claims with clause(...) and step(...) records
  --check-proof FILE  Print a C1-C7 check report of a proof (- for stdin)
  --json              Print the check report as JSON instead
  --goal GOAL         Ask a backward goal after forward reasoning; with
                      --check-proof, the goal the proof answers
  --strict-proof      Reject proofs relying on absence or collection
  --unused            List the clauses that make no difference to the conclusions
  --stats             Print reasoning statistics to stderr
  --max-depth N       Bound backward recursion (default 1000000)
  --max-iterations N  Bound forward rounds per stratum (default 1000)
  --max-inferences N  Bound reasoning work (default 1000000)
  --version           Print the version
  --help              Print this help
Source defaults to stdin; multiple files form one program.
Exit codes: 0 success, 1 error, 2 invalid proof, 65 contradiction.
`;

const LIMITS = { '--max-depth': 'maxDepth', '--max-iterations': 'maxIterations', '--max-inferences': 'maxInferences' };

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
    let strictProof = false;
    let asJson = false;
    let unused = false;
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === '--help' || arg === '-h') {
        stdout(HELP);
        return 0;
      }
      if (arg === '--version' || arg === '-v') {
        stdout(`eyelit v${VERSION}\n`);
        return 0;
      }
      if (arg === '--proof' || arg === '-p') {
        options.proof = true;
      } else if (arg === '--stats') {
        stats = true;
      } else if (arg === '--strict-proof') {
        strictProof = true;
      } else if (arg === '--json') {
        asJson = true;
      } else if (arg === '--unused') {
        unused = true;
      } else if (arg === '--check-proof' || arg === '--goal' || Object.hasOwn(LIMITS, arg)) {
        i++;
        if (i >= argv.length) throw new UsageError(`${arg} needs a value`);
        const value = argv[i];
        if (arg === '--check-proof') {
          proofFile = value;
        } else if (arg === '--goal') {
          goals.push(value);
        } else {
          const number = /^[0-9]+$/.test(value.trim()) ? Number(value.trim()) : 0;
          if (number < 1) throw new UsageError(`${arg} needs a positive integer`);
          options[LIMITS[arg]] = number;
        }
      } else if (arg.startsWith('-') && arg !== '-') {
        throw new UsageError(`unknown option ${arg}`);
      } else {
        files.push(arg);
      }
    }
    if (asJson && proofFile === null) throw new UsageError('--json requires --check-proof');
    if (strictProof && proofFile === null) throw new UsageError('--strict-proof requires --check-proof');
    if (proofFile !== null && options.proof) throw new UsageError('--check-proof cannot be combined with --proof');
    if (unused && (proofFile !== null || options.proof)) {
      throw new UsageError('--unused cannot be combined with --proof or --check-proof');
    }
    if (proofFile === '-' && (!files.length || files.includes('-'))) {
      throw new UsageError('stdin holds the proof; name the program as files');
    }
    if (!files.length) files.push('-');
    if (files.filter((file) => file === '-').length > 1) throw new UsageError('stdin can only be read once');
    const program = loadSources(files.map((file) => [readSource(file, io), file === '-' ? '<stdin>' : file]), io);
    if (proofFile !== null) {
      const document = readSource(proofFile, io);
      const report = checkProof(program, document, { goals, allowTrusted: !strictProof });
      stdout(asJson ? `${JSON.stringify(publicReport(report), null, 2)}\n` : checkReport(report));
      // An invalid proof is a result, not an error: it has its own exit code.
      return report.valid ? 0 : 2;
    }
    if (unused) {
      stdout(unusedClauses(program, { goals, ...options }));
      return 0;
    }
    const result = run(program, { goals, ...options });
    stdout(result.stdout);
    if (stats) stderr(`${JSON.stringify(result.stats)}\n`);
    return result.haltCode || 0;
  } catch (error) {
    if (error instanceof UsageError || error instanceof EyelitError) {
      stderr(`eyelit: ${error.message}\n`);
      return 1;
    }
    if (error && (error.code === 'ENOENT' || error.code === 'EISDIR' || error.code === 'EACCES')) {
      stderr(`eyelit: ${error.message}\n`);
      return 1;
    }
    throw error;
  }
}
