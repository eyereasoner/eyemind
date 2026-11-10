# Notation3 Test Cases

A compliance test suite of strict Notation3 test cases agains the [Notation3 spec](https://w3c.github.io/N3/spec/). 

- The tests interpret the argument modes of built-ins according to the instantiation state of any variables involved.
- The tests do not exercise the evaluation order of built-ins, as there is this underspecified currently.
- The tests focus on compliance against the Notation3 spec, but do not try to exercise validity, soundness, or completeness of the reasoner's inference process.

## Install

```
npm i
```

## Run

```
REASONER="myreasoner -option" npm run test
```

Or, run tests for specific reasoners

```
npm run test:cwm
npm run test:eye
npm run test:eyeling
npm run test:jen3
npm run test:juliett
```

To skip tests that require networkin set the environmental variable `NETWORKING=0`.

## Reports

See [reports](reports/report.md) for an overview of challenges against different Notation3 implementations for spec compliance.

## Generate tests

```
npm run generate
```

## Notes and Warnings

Although the `notation3tests` suite contains more than 1000 test cases, implementers should be aware of the following notes and warnings.

This suite contains test cases for which there is a normative agreement in the Notation3 specs:

- [Notation3 Language](https://w3c-cg.github.io/N3/spec/)
- [Notation3 Builtin Functions](https://w3c-cg.github.io/n3Builtins/)
- [Notation3 Semantics](https://w3c-cg.github.io/N3/spec/semantics.html)

For some tests the Notation3 specs refer to other spec such as:

- [XPath and XQuery Functions and Operators 3.1](https://www.w3.org/TR/xpath-functions)
- [RDF 1.1 Turtle](https://www.w3.org/TR/turtle/)
- [RFC 3986: STD 66: Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986)

The test suite does not contain tests (or the tests are limited) for Notation3 features for which there is no agreement. This includes:

- Dedicated casting/numeric-promotion
    - The XPath 3.1.4 promotion chain (`xs:integer < xs:decimal < xs:float < xs:double`) shows up implicity in the corpus but is not directly asserted:
        - For mathematical built-ins the spec does not provide explicit guidance what the expected datatype is of operations such as:
            - `(1 1.0) math:sum ?X`
            - `(1 1.0e0) math:sum ?X`
            - `(2 0.5) math:exponentiation ?X` is an `xs:decimal` (an *exact* finite decimal expansion allowed) for `sqrt(2)`?
            - `1 math:notEqualTo 1.0` (the spec says "same number" but what does that mean?)
- For string built-ins the spec does not provide guidance on the regex flavor an implementation must accept.
- Blank-node scoping inside quoted formulas.
    - E.g. What does the `_:x` and `_:y` bind to in the example below.

```
:test1 :value { :x :a :b . :y :b :a }.
{
    :test1 :value { _:x :a :b . _:y :b :a }.
    :test1 :value { _:y :a :b . _:x :b :a }.
}
=> 
{
    ...
}
```

- Existential head blanks (skolemization) in forward rules. How many blank nodes a forward rule does mint when encountering a head with `_:b`.
- Rules with `false` in the conclusion.
    - There is no agreement what an implementation should produce when encountering contraductions.
- Backward rules `<=`.
    - No test at all, since there is no guidance from the specs.
- For log:notIncludes the spec does not fix which snapshot of the subject the builtin consults.

For some tests the suite is stricter than the spec.

- The mathematical spec demonstate that `xs:integer` input is allowed. However, such datatype is not part of the written schema.
- The spec is unclear what the `math:remainder` should produce given negative number input. The test is following the XQuery/SPARQL spec.

There are still open cases that need more tests:

- `log:collectAllIn`/`log:forAllIn` scope semantics.
- More negative `fail-*.n3` cases.
