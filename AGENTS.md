# Working on eyemind

eyemind is a dependency-free JavaScript rule language with forward and
backward reasoning and checkable proofs. Programs are JavaScript scripts;
conclusions, proofs and check reports are JavaScript expressions that a
reader turns back into terms without running them. It runs as a command-line
program, a JavaScript library, and a browser application. Describe what it
implements as it currently is, distinguish demonstrated behavior from design
goals, and keep error messages specific and user-facing text direct.

## Repository map

- `src/`: every source file lives directly here, with no subdirectories.
  - `terms.js`: terms, unification with the occurs check, the trail, the
    standard order. `writer.js`, `reader.js`: the canonical text, and
    reading documents back without executing them.
  - `lang.js`: stating programs in JavaScript (the implicit-name scope,
    statements, line numbers). `goals.js`: arrays as conjunctions.
  - `program.js`: clause validation, indexing and stratification.
    `templates.js`: potential derived clauses, scopes and generator links.
    `builtins.js`, `arith.js`: primitives and arithmetic.
  - `engine.js`: backward search as an explicit machine, semi-naive forward
    rounds, Skolem terms, proof recording, search certificates, unused
    clauses.
  - `proof.js`: proof rendering and the C1–C8 checker, which never calls
    the engine. `closure.js`: settling negations and collections by their
    search certificate, one call expanded one level at a time.
  - `cli.js`: the command line, with no Node imports so the playground's
    worker runs it too. `node.js`: Node's file access for it. `index.js`:
    library API. `version.js`: the version, synced from `package.json`.
- `bin/eyemind.js`: the `eyemind` command.
- `playground/index.html`: hand-written browser playground; it runs `src/`
  in a module worker, with no build step. `playground.html` redirects older
  shared links to the directory URL, preserving their query and fragment.
  `playground/conformance.html` and `conformance/worker.js` run the shared suite in a browser.
- `_config.yml`, `_layouts/default.html`, `assets/docs.css`: GitHub Pages
  renders the Markdown documents with one masthead (Guide, Playground,
  Specification, Conformance, Repository), the same nav the playground shows.
- `examples/*.js`: runnable programs, listed in `examples/manifest.json` with
  their description, halt code and proof obligations. `examples/output/`,
  `examples/proof/` and `examples/check/` hold each one's saved conclusions,
  proof and check report; `examples/deck/` a card deck per example.
- `conformance/`: the black-box suite of SPEC.md. Each case file is an
  eyemind document of `conformance(Name, [Setting, ...])` terms, read by
  `conformance/run.js`; `conformance/README.md` describes the format.
- `test/`: `run.js` runs every `*.test.js` module, the conformance suite and
  the playground tests of `playground.js` in a headless Chrome that
  `chrome.js` starts; `browser.mjs` runs those alone and can take screenshots.
- `tools/`: `update-examples.js` regenerates the example artifacts,
  `corpus.js` evaluates the corpus, `version.js` syncs the version.
- `README.md` (short entry point), `GUIDE.md` (CLI, language, proofs,
  playground, library, development), `SPEC.md` (RFC-style specification:
  terms, programs, arithmetic, reasoning, canonical text, proof documents and
  the C1–C8 checks).
- `release`, `.github/workflows/`, `.zenodo.json`: releases, CI, Pages,
  GitHub releases, npm publishing and Zenodo archiving.

## Commands

```sh
node bin/eyemind.js examples/socrates.js
node bin/eyemind.js --proof examples/socrates.js > /tmp/proof.js
node bin/eyemind.js --check-proof /tmp/proof.js examples/socrates.js
node bin/eyemind.js --unused examples/graphs.js
npm test                                              # unit, examples, conformance, command line, playground
npm test -- unit conformance                          # only these sections
npm test -- -k skolem                                 # only tests whose line contains "skolem"
npm test -- playground                                # the playground in a headless Chrome
EYEMIND_PROPERTY_SCALE=20 npm test -- -k properties   # deeper generated tests
EYEMIND_CLI_ALL=1 npm test -- cli                     # every case through the command, as CI runs it
node conformance/run.js 11-checking.js -v
node tools/update-examples.js [NAME ...]
git diff --check
```

This machine has little memory and has frozen under heavy jobs. Run the full
suite and large examples under a cap with no swap, and never start a second
heavy job alongside one already running:
`systemd-run --user --scope -q -p MemoryMax=3G -p MemorySwapMax=0 -- npm test`.
Large examples such as `deep-taxonomy-100000` and `path-discovery` produce
very large proofs; redirect them to a file and inspect focused parts.

## Language and examples

- Read the relevant section of `SPEC.md` before changing language behavior,
  and Sections 10–12 before changing proofs. Keep the implementation, SPEC,
  GUIDE, examples, conformance cases and tests consistent.
- Operators never build terms: `add(X, 1)`, `gt(X, 1)`, and an array for a
  conjunction. A term used with an operator must raise an error that says
  what to write instead.
- In a program an integral number is an integer and `float(N)` a float;
  integers are BigInts and exact. Do not coerce between integers and floats.
- Documents are data: the reader accepts only the forms of SPEC Section 9
  and must never execute text.
- Every example starts with `//` header comments for a wide audience saying
  what situation it models, what it concludes, and which feature it shows.
  Describe the example as it is. Keep credits to external sources (authors,
  papers, puzzles, standards) in the program and its deck, but never
  mention sibling projects.
- When adding an example, register it in `examples/manifest.json`, write its
  deck in `examples/deck/`, and generate its artifacts. The playground lists
  examples from the manifest.
- Ordinary test runs only read the saved artifacts. After an intentional
  change, run `node tools/update-examples.js` and review the diff: no
  artifact should change unless intended.
- Expected conformance outputs come from the specification, not from running
  eyemind. When a case and eyemind disagree, SPEC.md decides which is wrong.

## Implementation and verification

Match the surrounding JavaScript: its naming, comment density, and comments
that say why. Align the inline comments of consecutive lines in one column,
in code and in documentation code blocks alike. Prefer small, direct changes over new machinery, add no
dependencies, and fix the code that produces a wrong result rather than
patching its output.

Derived rule instances carry their generator's captured values and evidence;
never reevaluate a generator under a backward caller's bindings. Analyze all
potential rules and their generator dependencies before evaluating negation
or collection, including rules whose generator never succeeds. Certificates
cite generator premises directly and check witnesses in every enclosing scope.

Proof checking must stay sound: a forged proof must never report `checked`.
The checker follows the certificate and never calls the engine to fill a gap;
the source program, not a proof's clause displays, is the authority.
Primitives are re-decided (C5); absences and collections are settled by the
proof's search certificate, whose tables the checker expands one level each
and whose listings must be closed, or else stay obligations that evidence may
refute (C6); a variable only a rule's conclusion mentions must be
the Skolem term of that firing, recomputed from its uses (C8). Every proof the engine generates is checked before
it is returned. For every new check, add a forged proof the checker rejects,
and confirm that all saved example proofs still check. `test/properties.test.js`
forges proofs at random and catches a checker with C1, C2, C4, C5 or C8
switched off; after changing the checker, run it with a larger
`EYEMIND_PROPERTY_SCALE`.

SPEC.md and the conformance suite are written for implementations by
independent parties: interoperability comes from them, not from keeping
another implementation's code in sync. Decide behavior from the
specification, keep the suite free of anything only eyemind can run, and put
what another implementer needs in SPEC.md rather than only in eyemind's code.
Floats from a host's math library (`exp`, `log`, trigonometry, `pow`) may
differ in the last place between implementations; SPEC Section 14 allows it,
and C5 accepts such a result within 4 units (Section 11.6). eyeron, eyeling
and eyepl are related projects of the same family.

Run focused tests while working, then the full suite before finishing code
changes. Add a regression test for each behavior change, in the style of the
file it joins. Browser changes need a test in `test/playground.js`, which npm
test runs in Chrome at desktop and phone widths; `node test/browser.mjs DIR`
also saves screenshots of both. Documentation describes the
current behavior, not how it came to be; documentation-only edits need a
review and `git diff --check`.

## Versions and releases

Commit directly to `main`. Do not use closing keywords such as `Fixes #N` in
commit messages; issues are closed by hand. Follow the user's instructions
about committing, pushing, and releasing.

`package.json` is the version source; never bump it by hand. Releases are cut
with the release script:

```sh
./release patch "Improve reasoning and broaden conformance coverage"
./release minor "Add rule inspection"
./release major "Describe the incompatible language change"
```

Every release message must describe what changed; never use only
`Release vX.Y.Z` or a version number. Pass the message explicitly to the
release script. It becomes the release commit subject, annotated tag message,
GitHub release description and Actions run title for the release, publishing,
CI and Pages workflows. Check the Actions titles and publication after a
release. The script rejects empty and version-only messages before doing work.

The script requires a clean working tree, switches to `main`, pulls with
`--ff-only`, runs `npm test` under a memory cap, bumps the version with
`npm version`, writes it into `src/version.js` and SPEC.md with
`node tools/version.js`, commits, creates an annotated `v*` tag, and pushes
the branch and tag atomically. A push to `main` runs CI and deploys GitHub
Pages; a `v*` tag creates the GitHub release (which Zenodo archives) and
publishes the npm package `eyemind` through
`.github/workflows/publish-npm.yml`, only through npm trusted publishing. See
the guide for existing-tag dispatch.
