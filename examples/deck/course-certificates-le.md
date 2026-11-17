# Course certificates in Logical English

*Recursive requirements and layered witnesses with shared references.*

[course-certificates-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/course-certificates-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/course-certificates-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/course-certificates-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/course-certificates-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=course-certificates-le)

## The question

Alice, Bob and Carol enroll in robotics. The course requires control and
safety, and control itself requires algebra. Can prior learning satisfy a
requirement, and which students can receive certificates with an auditable dossier?

## What we tell eyemind

Requirement closure includes prerequisites recursively. A sufficient prior-learning
grade supplies a completed module before missing-module tests run. An enrollee
is complete only when there is no missing required module: a finite universal
condition expressed as absence of a counterexample.

A complete student receives a dossier and an audit entry in one existential
firing. A second rule creates a certificate referring to that existing dossier.
Its explicit enrollee guard limits this rule to students. The final conjunctive
question joins the certificate and audit through the same dossier.

## What eyemind concludes

Alice and Carol each have a certificate whose attestation and audit share one
dossier. Carol's prior-learning grade of 90 satisfies control; Bob lacks safety.
The missing-module answer in the checked LS report is:

```js
missing('Bob', 'Robotics', 'Safety')
```

The other two answers are conjunctions containing the actual witness terms.
A certificate witness contains its dossier witness as an argument. Distinct
existential variables supply the dossier and audit, while repeated references
to one variable retain exactly the same term. No handwritten witness names
are supplied in the input.

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It establishes
the completed requirements, the missing-module answer, and the shared witness
references in both certificate answers. The same proof checks against the
standalone JavaScript compilation. Witnesses identify rule firings; they do not
assert globally unique external identifiers or distinct real-world objects.

## Try it

```sh
node bin/eyemind.js examples/course-certificates-le.le
node bin/eyemind.js --program examples/course-certificates-le.le > /tmp/course-certificates-le.js
node bin/eyemind.js --to le /tmp/course-certificates-le.js
node bin/eyemind.js --proof examples/course-certificates-le.le
node bin/eyemind.js --check-proof examples/proof/course-certificates-le.js examples/course-certificates-le.le
```

Lower Carol's prior-learning grade from 90 to 84: control becomes missing and
she receives no dossier or certificate. Add Bob's completed safety module to
make all three students eligible. These outcomes follow from ordinary LE rules,
without a built-in course or certificate vocabulary.
