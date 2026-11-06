// The case document grammar, comparisons and command-line quoting, shared
// by the Node runner and the browser worker. Documents are never executed.
import { readTerms } from '../src/reader.js';
import { EMPTY, Struct } from '../src/terms.js';

const WILDCARD = '…';

class Case {
  constructor(name, path, line) {
    this.name = name;
    this.path = path;
    this.line = line;
    this.spec = '';
    this.args = 'program.js';
    this.exit = 0;
    this.stderr = null; // null: not checked; 'empty', 'nonempty', 'json' or 'prefix ...'
    this.stdoutMode = 'exact';
    this.files = {};
    this.stdin = null;
    this.stdout = null;
  }

  get where() {
    return `${this.path.split(/[\\/]/).pop()}:${this.line}`;
  }
}

// The cases of one file, an eyemind document: one
// conformance(Name, [Setting, ...]) term per case, each block an array of
// its lines (see README.md). The document is read, never run.
export function parseCases(document, path = '<document>') {
  return readTerms(document).map(([term, line]) => {
    const where = `${path.split(/[\\/]/).pop()}:${line}`;
    if (!(term instanceof Struct) || term.name !== 'conformance' || term.args.length !== 2 || typeof term.args[0] !== 'string') {
      throw new Error(`${where}: expected conformance(Name, [Setting, ...])`);
    }
    const item = new Case(term.args[0], path, line);
    for (const setting of items(term.args[1], where)) {
      const [first, second] = setting instanceof Struct ? setting.args : [];
      const key = setting instanceof Struct ? `${setting.name}/${setting.args.length}` : String(setting);
      if (key === 'spec/1') item.spec = text(first, where);
      else if (key === 'args/1') item.args = text(first, where);
      else if (key === 'exit/1' && typeof first === 'bigint') item.exit = Number(first);
      else if (key === 'stderr/1' && first instanceof Struct && first.name === 'prefix') item.stderr = `prefix ${text(first.args[0], where)}`;
      else if (key === 'stderr/1') item.stderr = text(first, where);
      else if (key === 'file/2') item.files[text(first, where)] = block(second, where);
      else if (key === 'stdin/1') item.stdin = block(first, where);
      else if (key === 'stdout/1' && first === 'nonempty') item.stdoutMode = 'nonempty';
      else if (key === 'stdout/1') item.stdout = block(first, where);
      else if (key === 'stdout_json/1') {
        item.stdout = block(first, where);
        item.stdoutMode = 'json';
      } else if (key === 'stdout_text/1') item.stdout = text(first, where);
      else throw new Error(`${where}: unknown setting ${key}`);
    }
    return item;
  });
}

function text(term, where) {
  if (typeof term !== 'string') throw new Error(`${where}: expected a string`);
  return term;
}

function items(list, where) {
  const result = [];
  let term = list;
  while (term instanceof Struct && term.name === '.' && term.args.length === 2) {
    result.push(term.args[0]);
    term = term.args[1];
  }
  if (term !== EMPTY) throw new Error(`${where}: expected an array`);
  return result;
}

// A block's text: its lines, each ending with a line break.
function block(list, where) {
  return items(list, where).map((line) => `${text(line, where)}\n`).join('');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lineMatches(expected, actual) {
  if (!expected.includes(WILDCARD)) return expected === actual;
  const pattern = expected.split(WILDCARD).map(escapeRegExp).join('[\\s\\S]*');
  return new RegExp(`^${pattern}$`).test(actual);
}

function sameJson(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && sameJson(a[key], b[key]));
}

// null when the output is as expected, otherwise a description.
function compareStdout(item, actual) {
  if (item.stdoutMode === 'nonempty') return actual.trim() ? null : 'expected output on standard output';
  if (item.stdout === null) return null;
  if (item.stdoutMode === 'json') {
    let parsed;
    try {
      parsed = JSON.parse(actual);
    } catch (error) {
      return `standard output is not JSON: ${error.message}`;
    }
    if (sameJson(parsed, JSON.parse(item.stdout))) return null;
    return `JSON differs:\n  expected ${item.stdout.trim()}\n  actual   ${actual.trim()}`;
  }
  const expected = item.stdout.split('\n');
  const got = actual.split('\n');
  if (expected.length === got.length && expected.every((line, i) => lineMatches(line, got[i]))) return null;
  for (let i = 0; i < Math.min(expected.length, got.length); i++) {
    if (!lineMatches(expected[i], got[i])) return `line ${i + 1} differs:\n  expected ${expected[i]}\n  actual   ${got[i]}`;
  }
  return `expected ${expected.length - 1} lines, got ${got.length - 1}:\n  expected ${JSON.stringify(item.stdout)}\n  actual   ${JSON.stringify(actual)}`;
}

export function check(item, code, stdout, stderr) {
  const problems = [];
  if (code !== item.exit) {
    problems.push(`exit code ${code}, expected ${item.exit}${stderr.trim() ? `; stderr: ${stderr.trim().slice(0, 300)}` : ''}`);
  }
  const difference = compareStdout(item, stdout);
  if (difference) problems.push(difference);
  if (item.stderr === 'empty' && stderr) {
    problems.push(`expected no standard error, got: ${stderr.trim().slice(0, 300)}`);
  } else if (item.stderr === 'nonempty' && !stderr.trim()) {
    problems.push('expected a message on standard error');
  } else if (item.stderr && item.stderr.startsWith('prefix ')) {
    const prefix = item.stderr.slice('prefix '.length);
    if (!stderr.startsWith(prefix)) problems.push(`expected standard error to start with ${JSON.stringify(prefix)}, got: ${stderr.trim().slice(0, 300)}`);
  } else if (item.stderr === 'json') {
    try {
      JSON.parse(stderr);
    } catch {
      problems.push(`standard error is not JSON: ${stderr.trim().slice(0, 300)}`);
    }
  }
  return problems;
}

// Words of a command line, split as a POSIX shell splits them.
export function shellSplit(text) {
  const words = [];
  let word = null;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/\s/.test(ch)) {
      if (word !== null) words.push(word);
      word = null;
      i++;
    } else if (ch === "'") {
      const end = text.indexOf("'", i + 1);
      if (end < 0) throw new Error(`unterminated quote in ${text}`);
      word = (word ?? '') + text.slice(i + 1, end);
      i = end + 1;
    } else if (ch === '"') {
      let out = '';
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\' && i + 1 < text.length && '"\\$`\n'.includes(text[i + 1])) {
          out += text[i + 1];
          i += 2;
        } else {
          out += text[i];
          i++;
        }
      }
      if (i >= text.length) throw new Error(`unterminated quote in ${text}`);
      word = (word ?? '') + out;
      i++;
    } else if (ch === '\\' && i + 1 < text.length) {
      word = (word ?? '') + text[i + 1];
      i += 2;
    } else {
      word = (word ?? '') + ch;
      i++;
    }
  }
  if (word !== null) words.push(word);
  return words;
}

