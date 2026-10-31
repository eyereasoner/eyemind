# <img src="assets/eye.png" alt="" width="48" height="48" align="absmiddle"> eyecode

[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.23824021-blue.svg)](https://doi.org/10.5281/zenodo.23824021)
[![npm](https://img.shields.io/npm/v/@josd/eyecode.svg)](https://www.npmjs.com/package/@josd/eyecode)

eyecode is a **JavaScript rule language** with forward and backward reasoning
and checkable proofs. You write facts and rules in plain JavaScript; eyecode
draws conclusions, and every conclusion can come with a proof that a separate
checker verifies against your program. It runs as a command-line program, a
JavaScript library, and a browser application, with no dependencies.

- **[Playground](https://eyereasoner.github.io/eyecode/playground)**: run
  programs in your browser.
- **[Guide](https://eyereasoner.github.io/eyecode/GUIDE)**: run programs,
  write rules, check proofs, use the library, and develop eyecode.
- **[Specification](https://eyereasoner.github.io/eyecode/SPEC)**: the
  language, its canonical text, the proof format, and the C1–C8 checks.
- **[Examples](examples/)**: 63 runnable programs, with their conclusions,
  proofs and check reports, and a
  [card deck](https://eyereasoner.github.io/eyecode/examples/deck/) for each.
- **[Conformance suite](conformance/)**: 321 cases that test any
  implementation of the specification through its command line.

```js
fact(type('socrates', 'human'))
fact(subclass_of('human', 'mortal'))
implies([type(S, A), subclass_of(A, B)], type(S, B))
query(type(X, Y))
```

```sh
node bin/eyecode.js examples/socrates.js
node bin/eyecode.js --proof examples/socrates.js > /tmp/proof.js
node bin/eyecode.js --check-proof /tmp/proof.js examples/socrates.js
```

MIT licensed; see [LICENSE.md](LICENSE.md).
