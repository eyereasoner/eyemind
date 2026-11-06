// Canonical term output, as JavaScript source.
//
// Every term has one spelling, and that spelling is a JavaScript expression
// that the reader in reader.js turns back into the same term: an atom is a
// string literal, a number a numeric literal, a variable a name, a compound
// term a call such as type('socrates', 'mortal'), and a list an array with
// ...T for an open tail. A conjunction or disjunction built left to right,
// and(and(A, B), C), is written and(A, B, C). A compound whose name is not a
// plain identifier is written struct('name', Arg, ...).
import { Struct, Var, deref } from './terms.js';

// Words a document cannot use as a plain name: JavaScript's reserved words,
// and the names of its values that are not terms (Section 9.1).
export const RESERVED_WORDS = new Set([
  'undefined', 'NaN', 'Infinity',
  'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete',
  'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if',
  'implements', 'import', 'in', 'instanceof', 'interface', 'let', 'new', 'null', 'package',
  'private', 'protected', 'public', 'return', 'static', 'super', 'switch', 'this', 'throw', 'true',
  'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
]);
// Calls to these names have a fixed meaning to the reader.
export const RESERVED_CALLS = new Set(['struct']);
// Left-nested chains of these binary compounds are written as one call.
export const CHAINED = new Set(['and', 'or']);

const PLAIN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function plainName(name) {
  return PLAIN.test(name) && !RESERVED_WORDS.has(name);
}

// Whether a compound with this name and arity is written name(...).
export function callableName(name, arity) {
  if (!plainName(name) || RESERVED_CALLS.has(name)) return false;
  // and(A, B, C) reads as a chain, so a compound and/3 is struct('and', ...).
  return !(CHAINED.has(name) && arity > 2);
}

export function validVariableName(name) {
  return plainName(name) && name !== '_' && !name.startsWith('VAR_');
}

// An injective identifier for a variable name that is not a valid one: X#12,
// the name a renamed-apart clause variable gets, becomes VAR_X_23_12. ASCII
// letters and digits stay, an underscore doubles and any other character
// becomes _hex_. Names already starting with the prefix are encoded too.
export function encodeName(name) {
  const out = ['VAR_'];
  for (const ch of name) {
    if (/^[A-Za-z0-9]$/.test(ch)) out.push(ch);
    else if (ch === '_') out.push('__');
    else out.push(`_${ch.codePointAt(0).toString(16)}_`);
  }
  return out.join('');
}

const ENCODED = /([A-Za-z0-9])|__|_([0-9a-f]+)_/y;

// The variable name an identifier written by encodeName stands for, or null
// when the identifier is not such an encoding.
export function decodeName(text) {
  const out = [];
  let position = 4;
  while (position < text.length) {
    ENCODED.lastIndex = position;
    const match = ENCODED.exec(text);
    if (match === null) return null;
    if (match[1]) {
      out.push(match[1]);
    } else if (match[2]) {
      const code = parseInt(match[2], 16);
      if (code > 0x10ffff) return null;
      out.push(String.fromCodePoint(code));
    } else {
      out.push('_');
    }
    position = ENCODED.lastIndex;
  }
  const name = out.join('');
  return encodeName(name) === text ? name : null;
}

export function variableText(name) {
  return validVariableName(name) ? name : encodeName(name);
}

const ESCAPES = { '\\': '\\\\', "'": "\\'", '\n': '\\n', '\r': '\\r', '\t': '\\t', '\b': '\\b', '\f': '\\f', '\v': '\\v' };

// An atom as a single-quoted string literal. Control characters, line
// separators and lone surrogates are escaped; any other character is written
// as it is.
export function quote(text) {
  let out = "'";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = text.charCodeAt(i);
    if (ESCAPES[ch] !== undefined) {
      out += ESCAPES[ch];
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length &&
               text.charCodeAt(i + 1) >= 0xdc00 && text.charCodeAt(i + 1) <= 0xdfff) {
      out += ch + text[i + 1];
      i++;
    } else if (code < 0x20 || (code >= 0x7f && code <= 0x9f) || code === 0x2028 || code === 0x2029 ||
               (code >= 0xd800 && code <= 0xdfff)) {
      out += `\\u${code.toString(16).padStart(4, '0')}`;
    } else {
      out += ch;
    }
  }
  return `${out}'`;
}

// A float as Python's repr spells it: the shortest digits that read back as
// the same value, in fixed notation from 1e-4 up to 1e16 and in scientific
// notation otherwise, always with a fraction or an exponent.
export function floatText(value) {
  if (value === 0) return Object.is(value, -0) ? '-0.0' : '0.0';
  const sign = value < 0 ? '-' : '';
  const [mantissa, exponentText] = Math.abs(value).toExponential().split('e');
  const digits = mantissa.replace('.', '');
  const exponent = Number(exponentText);
  if (exponent >= -4 && exponent < 16) {
    if (exponent < 0) return `${sign}0.${'0'.repeat(-exponent - 1)}${digits}`;
    const whole = digits.slice(0, exponent + 1).padEnd(exponent + 1, '0');
    const fraction = digits.slice(exponent + 1);
    return `${sign}${whole}.${fraction || '0'}`;
  }
  const lead = digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits;
  const magnitude = String(Math.abs(exponent)).padStart(2, '0');
  return `${sign}${lead}e${exponent < 0 ? '-' : '+'}${magnitude}`;
}

export function letterName(n) {
  return String.fromCharCode(65 + (n % 26)) + (n >= 26 ? String(Math.floor(n / 26)) : '');
}

// Names for write(): each variable met is named A, B, ..., Z, A1, ... in the
// order the writing meets it, across every write sharing the lettering.
export class Lettering {
  constructor() {
    this.names = new Map();
  }

  get(name) {
    let letter = this.names.get(name);
    if (letter === undefined) {
      letter = letterName(this.names.size);
      this.names.set(name, letter);
    }
    return letter;
  }
}

// Names for write() that spell variables as the program wrote them, for
// messages about a running goal: the renamed-apart X#12 is X again and each
// anonymous variable is _. Distinct variables that share a name are numbered,
// so a message never shows two of them as one.
export class SourceNaming {
  constructor() {
    this.names = new Map();
    this.taken = new Set();
  }

  get(name) {
    let shown = this.names.get(name);
    if (shown === undefined) {
      const hash = name.indexOf('#');
      const base = hash < 0 ? name : name.slice(0, hash);
      if (/^_[0-9]*$/.test(base)) {
        shown = '_';
      } else {
        shown = variableText(base);
        for (let n = 2; this.taken.has(shown); n++) shown = variableText(`${base}_${n}`);
        this.taken.add(shown);
      }
      this.names.set(name, shown);
    }
    return shown;
  }
}

// Names for write() that name nothing but notice a variable.
class Spy {
  constructor() {
    this.seen = false;
  }

  get() {
    this.seen = true;
    return undefined;
  }
}

const NO_NAMES = { get: () => undefined };

// The canonical text of a term, and whether it has a variable.
export function writeNotingVariables(term) {
  const spy = new Spy();
  const text = format(term, null, spy);
  return [text, spy.seen];
}

// The canonical spelling of a term. names maps variable names to the names
// to write, as a Lettering does.
export function write(term, env = null, names = NO_NAMES) {
  if (env !== null && env.isEmpty()) env = null;
  return format(term, env, names);
}

// Written with an explicit stack, so deeply nested terms and long lists need
// no host recursion. Each entry is a term to write or a string to emit.
function format(root, env, names) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    let term = stack.pop();
    if (term instanceof Text) {
      out.push(term.text);
      continue;
    }
    if (env !== null) term = deref(term, env);
    const type = typeof term;
    if (type === 'string') {
      out.push(term === '[]' ? '[]' : quote(term));
    } else if (type === 'bigint') {
      out.push(term.toString());
    } else if (type === 'number') {
      out.push(floatText(term));
    } else if (term instanceof Var) {
      const name = names.get(term.name);
      out.push(name !== undefined ? name : variableText(term.name));
    } else if (term.name === '.' && term.args.length === 2) {
      const items = [];
      let cursor = term;
      while (cursor instanceof Struct && cursor.name === '.' && cursor.args.length === 2) {
        items.push(cursor.args[0]);
        cursor = env === null ? cursor.args[1] : deref(cursor.args[1], env);
      }
      const parts = [OPEN_LIST];
      items.forEach((item, index) => {
        if (index) parts.push(COMMA);
        parts.push(item);
      });
      if (cursor !== '[]') parts.push(SPREAD, cursor);
      parts.push(CLOSE_LIST);
      for (let i = parts.length - 1; i >= 0; i--) stack.push(parts[i]);
    } else {
      let args = term.args;
      if (CHAINED.has(term.name) && args.length === 2) {
        // A left-nested chain is written as one call: and(A, B, C).
        const chain = [args[1]];
        let left = args[0];
        while (true) {
          const resolved = env === null ? left : deref(left, env);
          if (!(resolved instanceof Struct) || resolved.name !== term.name || resolved.args.length !== 2) break;
          chain.push(resolved.args[1]);
          left = resolved.args[0];
        }
        chain.push(left);
        args = chain.reverse();
      }
      const parts = [];
      if (callableName(term.name, term.args.length)) {
        parts.push(new Text(`${term.name}(`));
      } else {
        parts.push(new Text(`struct(${quote(term.name)}`));
        if (args.length) parts.push(COMMA);
      }
      args.forEach((arg, index) => {
        if (index) parts.push(COMMA);
        parts.push(arg);
      });
      parts.push(CLOSE_CALL);
      for (let i = parts.length - 1; i >= 0; i--) stack.push(parts[i]);
    }
  }
  return out.join('');
}

class Text {
  constructor(text) {
    this.text = text;
  }
}

const OPEN_LIST = new Text('[');
const CLOSE_LIST = new Text(']');
const CLOSE_CALL = new Text(')');
const COMMA = new Text(', ');
const SPREAD = new Text(', ...');
