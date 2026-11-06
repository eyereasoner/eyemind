# <img src="assets/eye.png" alt="" width="48" height="48" align="absmiddle"> eyemind

[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.23824021-blue.svg)](https://doi.org/10.5281/zenodo.23824021)
[![npm](https://img.shields.io/npm/v/eyemind.svg)](https://www.npmjs.com/package/eyemind)

eyemind is a **JavaScript rule language** with forward and backward reasoning
and checkable proofs. You write facts and rules in plain JavaScript; eyemind
draws conclusions, and every conclusion can come with a proof that a separate
checker verifies against your program. It runs as a command-line program, a
JavaScript library, and a browser application, with no dependencies.

- **[Playground](https://eyereasoner.github.io/eyemind/playground/)**: run
  programs in your browser.
- **[Guide](https://eyereasoner.github.io/eyemind/GUIDE)**: run programs,
  write rules, check proofs, use the library, and develop eyemind.
- **[Specification](https://eyereasoner.github.io/eyemind/SPEC)**: the
  language, its canonical text, the proof format, and the C1–C8 checks.
- **[Examples](https://eyereasoner.github.io/eyemind/examples/)**:
  94 runnable programs, each with a card deck and saved conclusions, proofs
  and check reports.
- **[Conformance suite](conformance/)**: 1201 cases that test any
  implementation of the specification through its command line.
  Run the suite [in your browser](https://eyereasoner.github.io/eyemind/playground/conformance).

```js
fact(type('socrates', 'human'))
fact(subclass_of('human', 'mortal'))
implies([type(S, A), subclass_of(A, B)], type(S, B))
query(type(X, Y))
```

```sh
node bin/eyemind.js examples/socrates.js
node bin/eyemind.js -c examples/socrates.js
node bin/eyemind.js --proof examples/socrates.js > /tmp/proof.js
node bin/eyemind.js --check-proof /tmp/proof.js examples/socrates.js
```

MIT licensed; see [LICENSE.md](LICENSE.md).
