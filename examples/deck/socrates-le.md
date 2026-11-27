# Socrates in Logical English

*Templates, a rule and a query in Logical English, compiled to LS.*

[socrates-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/socrates-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/socrates-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/socrates-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/socrates-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=socrates-le)

## The question

Socrates is human. Every human is mortal. Which thing is mortal?

## What we tell eyemind

The input is [Logical English](https://eyereasoner.github.io/eyemind/LE-SPEC),
the controlled natural language of Robert Kowalski and his colleagues. The
templates `*a thing* is human` and `*a thing* is mortal` declare the two
sentence patterns. The rule `a person is mortal if the person is human` uses
them: `a person` introduces a variable and `the person` refers back to it.
The query `which thing is mortal` asks for every value of `which thing`.

## What eyemind concludes

The default output is another `.le` file, with the query's answers as
sentences:

```text
% query mortal
Socrates is mortal.
```

The JavaScript check report holds the same answer as an LS term:

```js
struct('le:answer', 'mortal', 'Socrates')
```

## What the proof establishes

The saved proof is **checked** against the compiled LS program, in which the
rule is a backward rule `is_mortal(Person)` with the body `is_human(Person)`.
That the compilation reads the English as intended is a matter of the
compiler and its tests; the proof establishes the answer under the rule and
fact.

## Try it

```sh
node bin/eyemind.js examples/socrates-le.le
node bin/eyemind.js --program examples/socrates-le.le > /tmp/socrates-le.js
node bin/eyemind.js --proof examples/socrates-le.le
node bin/eyemind.js --check-proof examples/proof/socrates-le.js examples/socrates-le.le
node bin/eyemind.js --explain examples/socrates-le.le
```

Add the template `*a thing* is an animal` and the rule
`a thing is an animal if the thing is mortal.`, then ask
`which thing is an animal.`
