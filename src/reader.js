// Reading terms back from JavaScript source, without executing it.
//
// Conclusions, proofs and check reports are written as JavaScript
// expressions, one statement each (writer.js). This module parses them with
// its own small grammar and builds terms, so a document is data and never code
// that runs: only string and number literals, names, calls of a plain name,
// arrays, objects of bindings and a minus sign on a number are accepted.
import { EMPTY, EyemindError, Struct, Var, nonfinite } from './terms.js';
import { CHAINED, RESERVED_WORDS, decodeName } from './writer.js';

// Names that a program reads as JavaScript values, so a document may not use them.

// The name of the variable an identifier writes: names starting VAR_ are
// encoded (Section 9.2).
function variableName(text, line) {
  if (!text.startsWith('VAR_')) return text;
  const name = decodeName(text);
  if (name === null) throw new EyemindError(`line ${line}: ${text} is not the encoding of a variable name`);
  return name;
}

// Numbers and names of any length, matched where the scan stands.
const NUMBER = /(?:([0-9]+)n|((?:[0-9]+\.[0-9]*|\.[0-9]+)(?:[eE][+-]?[0-9]+)?|[0-9]+[eE][+-]?[0-9]+)|([0-9]+))/y;

const SIMPLE_ESCAPES = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', 0: '\0', "'": "'", '"': '"', '\\': '\\' };

const isDigit = (code) => code >= 48 && code <= 57;
const isNameStart = (code) => (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 95 || code === 36;
const isNamePart = (code) => isNameStart(code) || isDigit(code);

// The tokens of a text, read one ahead of the parser as it asks for them, so
// a large document is never held as tokens all at once.
class Tokens {
  constructor(text) {
    this.text = text;
    this.pos = 0;
    this.line = 1;
    this.current = this.read();
  }

  error(message, line = this.line) {
    return new EyemindError(`line ${line}: ${message}`);
  }

  // The token at this.pos, moving past it.
  read() {
    const { text } = this;
    const n = text.length;
    let { pos, line } = this;
    try {
      while (pos < n) {
        const ch = text[pos];
        const code = ch.charCodeAt(0);
        if (ch === '\n') {
          pos++;
          line++;
          return { kind: 'newline', text: '\n', line: line - 1 };
        } else if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\ufeff') {
          pos++;
        } else if (ch === '/' && text[pos + 1] === '/') {
          while (pos < n && text[pos] !== '\n') pos++;
        } else if (ch === '/' && text[pos + 1] === '*') {
          const end = text.indexOf('*/', pos + 2);
          if (end < 0) throw this.error('unterminated comment', line);
          for (let i = pos; i < end; i++) if (text[i] === '\n') line++;
          pos = end + 2;
        } else if (ch === "'" || ch === '"') {
          const [value, next] = this.string(pos, line);
          pos = next;
          return { kind: 'string', text: value, line };
        } else if (isDigit(code) || (ch === '.' && isDigit(text.charCodeAt(pos + 1)))) {
          NUMBER.lastIndex = pos;
          const match = NUMBER.exec(text);
          const after = text.charCodeAt(pos + match[0].length);
          if (isNamePart(after) || after === 46) throw this.error(`malformed number ${text.slice(pos, pos + match[0].length + 1)}`, line);
          pos += match[0].length;
          if (match[1] !== undefined || match[3] !== undefined) {
            const digits = match[1] !== undefined ? match[1] : match[3];
            if (digits.length > 1 && digits[0] === '0') throw this.error(`an integer has no leading zero: ${digits}`, line);
            return { kind: 'int', text: digits, line };
          }
          return { kind: 'float', text: match[2], line };
        } else if (isNameStart(code)) {
          const start = pos;
          pos++;
          while (pos < n && isNamePart(text.charCodeAt(pos))) pos++;
          return { kind: 'name', text: text.slice(start, pos), line };
        } else if (ch === '.' && text[pos + 1] === '.' && text[pos + 2] === '.') {
          pos += 3;
          return { kind: 'punct', text: '...', line };
        } else if ('()[]{},:;-'.includes(ch)) {
          pos++;
          return { kind: 'punct', text: ch, line };
        } else {
          throw this.error(`unexpected character ${JSON.stringify(ch)}`, line);
        }
      }
      return { kind: 'end', text: '', line };
    } finally {
      this.pos = pos;
      this.line = line;
    }
  }

  string(start, line) {
    const { text } = this;
    const quote = text[start];
    let pos = start + 1;
    let out = '';
    while (true) {
      if (pos >= text.length || text[pos] === '\n' || text[pos] === '\r') {
        throw this.error('unterminated string', line);
      }
      const ch = text[pos];
      if (ch === quote) return [out, pos + 1];
      // A document spells control characters as escapes, as the writer does.
      if (ch < ' ' && ch !== '\t') throw this.error('a control character in a string must be escaped', line);
      if (ch !== '\\') {
        // A run of plain characters at once.
        let end = pos + 1;
        while (end < text.length) {
          const code = text.charCodeAt(end);
          if (code < 32 || code === 92 || text[end] === quote) break;
          end++;
        }
        out += text.slice(pos, end);
        pos = end;
        continue;
      }
      const next = text[pos + 1];
      if (next === 'x') {
        const hex = text.slice(pos + 2, pos + 4);
        if (!/^[0-9a-fA-F]{2}$/.test(hex)) throw this.error('malformed \\x escape', line);
        out += String.fromCharCode(parseInt(hex, 16));
        pos += 4;
      } else if (next === 'u' && text[pos + 2] === '{') {
        const end = text.indexOf('}', pos + 3);
        const hex = end < 0 ? '' : text.slice(pos + 3, end);
        if (!/^[0-9a-fA-F]{1,6}$/.test(hex) || parseInt(hex, 16) > 0x10ffff) throw this.error('malformed \\u escape', line);
        out += String.fromCodePoint(parseInt(hex, 16));
        pos = end + 1;
      } else if (next === 'u') {
        const hex = text.slice(pos + 2, pos + 6);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw this.error('malformed \\u escape', line);
        out += String.fromCharCode(parseInt(hex, 16));
        pos += 6;
      } else if (next !== undefined && SIMPLE_ESCAPES[next] !== undefined && !(next === '0' && /[0-9]/.test(text[pos + 2] || ''))) {
        out += SIMPLE_ESCAPES[next];
        pos += 2;
      } else {
        throw this.error(`unsupported escape \\${next ?? ''}`, line);
      }
    }
  }

  peek() {
    return this.current;
  }

  next() {
    const token = this.current;
    if (token.kind !== 'end') this.current = this.read();
    return token;
  }

  // Newlines inside brackets are layout.
  skipNewlines() {
    while (this.current.kind === 'newline') this.current = this.read();
  }

  at(text) {
    const token = this.current;
    return token.kind === 'punct' && token.text === text;
  }

  expect(text) {
    this.skipNewlines();
    const token = this.next();
    if (token.kind !== 'punct' || token.text !== text) {
      throw this.error(`expected ${text}, found ${describe(token)}`, token.line);
    }
  }
}

function describe(token) {
  if (token.kind === 'end') return 'the end of the text';
  if (token.kind === 'newline') return 'the end of the line';
  if (token.kind === 'string') return 'a string';
  return JSON.stringify(token.text);
}

export class Reader {
  constructor() {
    this.anonymous = 0;
  }

  // One expression, with the tokens positioned at its start. Long lists and
  // deep expressions are read with an explicit stack rather than recursion.
  expression(tokens) {
    const values = [];
    // Each frame collects the items of one open bracket.
    const frames = [];
    let state = 'value';
    while (true) {
      if (state === 'value') {
        tokens.skipNewlines();
        const token = tokens.next();
        if (token.kind === 'string') {
          values.push(token.text);
          state = 'after';
        } else if (token.kind === 'int') {
          values.push(BigInt(token.text));
          state = 'after';
        } else if (token.kind === 'float') {
          values.push(this.float(token.text, token.line));
          state = 'after';
        } else if (token.kind === 'punct' && token.text === '-') {
          const number = tokens.next();
          if (number.kind === 'int') values.push(-BigInt(number.text));
          else if (number.kind === 'float') values.push(-this.float(number.text, number.line));
          else throw tokens.error('a minus sign applies only to a number', token.line);
          state = 'after';
        } else if (token.kind === 'name') {
          if (RESERVED_WORDS.has(token.text) || token.text.includes('$')) {
            throw tokens.error(`${token.text} is not a term`, token.line);
          }
          if (tokens.at('(')) {
            tokens.next();
            frames.push({ kind: 'call', name: token.text, line: token.line, start: values.length });
            tokens.skipNewlines();
            if (tokens.at(')')) {
              tokens.next();
              frames.pop();
              values.push(this.call(token.text, [], token.line));
              state = 'after';
            }
          } else {
            values.push(this.variable(token.text, token.line));
            state = 'after';
          }
        } else if (token.kind === 'punct' && token.text === '[') {
          frames.push({ kind: 'list', line: token.line, start: values.length, tail: null });
          tokens.skipNewlines();
          if (tokens.at(']')) {
            tokens.next();
            frames.pop();
            values.push(EMPTY);
            state = 'after';
          } else if (tokens.at('...')) {
            // [...T] is T itself.
            tokens.next();
            frames[frames.length - 1].tail = values.length;
          }
        } else if (token.kind === 'punct' && token.text === '{') {
          frames.push({ kind: 'object', line: token.line, start: values.length });
          tokens.skipNewlines();
          if (tokens.at('}')) {
            tokens.next();
            frames.pop();
            values.push(EMPTY);
            state = 'after';
          } else {
            this.key(tokens, values);
          }
        } else if (token.kind === 'punct' && token.text === '(') {
          frames.push({ kind: 'group', line: token.line, start: values.length });
        } else {
          throw tokens.error(`expected a term, found ${describe(token)}`, token.line);
        }
        continue;
      }
      // state 'after': one value is complete; close or continue its bracket.
      if (!frames.length) return values.pop();
      const frame = frames[frames.length - 1];
      tokens.skipNewlines();
      const token = tokens.next();
      if (frame.kind === 'group') {
        if (token.kind !== 'punct' || token.text !== ')') throw tokens.error(`expected ), found ${describe(token)}`, token.line);
        frames.pop();
        continue;
      }
      const close = frame.kind === 'call' ? ')' : frame.kind === 'list' ? ']' : '}';
      if (token.kind === 'punct' && token.text === ',') {
        tokens.skipNewlines();
        if (tokens.at(close)) {
          tokens.next();
          this.finish(frames.pop(), values);
          continue;
        }
        if (frame.kind === 'list' && frame.tail !== null) {
          throw tokens.error('only the last list item can be spread', token.line);
        }
        if (frame.kind === 'list' && tokens.at('...')) {
          tokens.next();
          frame.tail = values.length;
        } else if (frame.kind === 'object') {
          this.key(tokens, values);
        }
        state = 'value';
        continue;
      }
      if (token.kind === 'punct' && token.text === close) {
        this.finish(frames.pop(), values);
        continue;
      }
      throw tokens.error(`expected , or ${close}, found ${describe(token)}`, token.line);
    }
  }

  key(tokens, values) {
    tokens.skipNewlines();
    const token = tokens.next();
    if (token.kind === 'string' || (token.kind === 'name' && !token.text.includes('$'))) {
      values.push(token.text);
    } else {
      throw tokens.error(`a binding name must be a name or a string, found ${describe(token)}`, token.line);
    }
    tokens.expect(':');
  }

  finish(frame, values) {
    const items = values.splice(frame.start);
    if (frame.kind === 'call') {
      values.push(this.call(frame.name, items, frame.line));
    } else if (frame.kind === 'list') {
      let result = EMPTY;
      let count = items.length;
      if (frame.tail !== null) {
        result = items[count - 1];
        count--;
      }
      for (let i = count - 1; i >= 0; i--) result = new Struct('.', [items[i], result]);
      values.push(result);
    } else {
      // Bindings: {X: Value, ...} reads as a list of '='(Name, Value).
      let result = EMPTY;
      for (let i = items.length - 2; i >= 0; i -= 2) {
        result = new Struct('.', [new Struct('=', [items[i], items[i + 1]]), result]);
      }
      values.push(result);
    }
  }

  float(text, line) {
    const value = Number(text);
    if (!Number.isFinite(value)) throw nonfinite(value, `line ${line}: `);
    return value;
  }

  variable(text, line) {
    if (text === '_') {
      this.anonymous++;
      return new Var(`_#${this.anonymous - 1}`);
    }
    return new Var(variableName(text, line));
  }

  call(name, args, line) {
    if (name === 'struct') {
      if (!args.length || typeof args[0] !== 'string') {
        throw new EyemindError(`line ${line}: struct() needs a name string first`);
      }
      return args.length > 1 ? new Struct(args[0], args.slice(1)) : args[0];
    }
    if (!args.length) return name;
    if (CHAINED.has(name) && args.length > 2) {
      // and(A, B, C) is the chain and(and(A, B), C).
      let result = args[0];
      for (let i = 1; i < args.length; i++) result = new Struct(name, [result, args[i]]);
      return result;
    }
    return new Struct(name, args);
  }
}

// One term, such as a goal given on the command line.
export function readTerm(text) {
  const tokens = new Tokens(text);
  const reader = new Reader();
  tokens.skipNewlines();
  if (tokens.peek().kind === 'end') throw new EyemindError('line 1: expected a term, found the end of the text');
  const term = reader.expression(tokens);
  tokens.skipNewlines();
  if (tokens.at(';')) {
    tokens.next();
    tokens.skipNewlines();
  }
  const rest = tokens.peek();
  if (rest.kind !== 'end') throw tokens.error(`expected the end of the term, found ${describe(rest)}`, rest.line);
  return term;
}

// The terms of a document, one expression statement each, with their lines.
// Statements end at a line end outside brackets, or at a semicolon.
export function readTerms(text) {
  const tokens = new Tokens(text);
  const reader = new Reader();
  const out = [];
  while (true) {
    while (tokens.peek().kind === 'newline' || tokens.at(';')) tokens.next();
    const token = tokens.peek();
    if (token.kind === 'end') return out;
    const term = reader.expression(tokens);
    out.push([term, token.line]);
    const after = tokens.peek();
    if (after.kind === 'punct' && after.text === ';') {
      tokens.next();
    } else if (after.kind !== 'newline' && after.kind !== 'end') {
      throw tokens.error(`expected the end of the statement, found ${describe(after)}`, after.line);
    }
  }
}
