# A time and identifiers for each order

*Do two orders share a recording time while keeping separate identifiers?*

[execution-identifiers-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/execution-identifiers-srl.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/execution-identifiers-srl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/execution-identifiers-srl.srl) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/execution-identifiers-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=execution-identifiers-srl)

---

## The question

Do two orders share a recording time while keeping separate identifiers?

---

## What the program says

```srl
# Two orders receive a recording time, a UUID IRI and a UUID string.
# Both orders share one NOW value and have distinct identifiers. Shows
# SPARQL 1.2 RL execution functions and their reproducible proof context.
PREFIX : <https://example.org/orders/>

DATA { :alice :order :first, :second }

RULE { ?order :recordedAt ?time ; :record ?iri ; :reference ?text } WHERE {
  :alice :order ?order
  SET(?time := NOW())
  SET(?iri := UUID())
  SET(?text := STRUUID())
}
```

These functions and numeric promotions follow [SPARQL 1.2 RL](https://www.w3.org/TR/sparql12-rl/), with the expression functions defined by SPARQL.

---

## What eyemind concludes

```ttl
PREFIX : <https://example.org/orders/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

:alice :order :first .
:alice :order :second .
:first :recordedAt "2026-11-12T00:00:00.000Z"^^xsd:dateTime .
:first :record <urn:uuid:567640d9-7825-4b1a-8670-72e7537e6d6d> .
:first :reference "ed94111c-4eb9-43b6-a4ae-b143045578d2" .
:second :recordedAt "2026-11-12T00:00:00.000Z"^^xsd:dateTime .
:second :record <urn:uuid:7fdb5e72-d210-4a7a-a1e7-cc9de9ec2761> .
:second :reference "a7fe6c89-42f0-465d-acf3-1e613fa697e1" .
```

Both orders have the same NOW timestamp. Each UUID() result is an IRI; each STRUUID() result is an xsd:string. All four identifiers are distinct. The manifest fixes the timestamp and seed for these saved artifacts. Running the source normally captures the current time and fresh entropy, so its concrete values change.

The check report records these claims:

```js
// Answers checked subject to the obligations below.
inf(iri('https://example.org/orders/first'), iri('https://example.org/orders/recordedAt'), literal('2026-11-12T00:00:00.000Z', datatype('http://www.w3.org/2001/XMLSchema#dateTime')))
inf(iri('https://example.org/orders/first'), iri('https://example.org/orders/record'), iri('urn:uuid:567640d9-7825-4b1a-8670-72e7537e6d6d'))
inf(iri('https://example.org/orders/first'), iri('https://example.org/orders/reference'), literal('ed94111c-4eb9-43b6-a4ae-b143045578d2', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('https://example.org/orders/second'), iri('https://example.org/orders/recordedAt'), literal('2026-11-12T00:00:00.000Z', datatype('http://www.w3.org/2001/XMLSchema#dateTime')))
inf(iri('https://example.org/orders/second'), iri('https://example.org/orders/record'), iri('urn:uuid:7fdb5e72-d210-4a7a-a1e7-cc9de9ec2761'))
inf(iri('https://example.org/orders/second'), iri('https://example.org/orders/reference'), literal('a7fe6c89-42f0-465d-acf3-1e613fa697e1', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('https://example.org/orders/alice'), iri('https://example.org/orders/order'), iri('https://example.org/orders/first'))
inf(iri('https://example.org/orders/alice'), iri('https://example.org/orders/order'), iri('https://example.org/orders/second'))
```

---

## What the proof establishes

The certificate records the execution context as a compiled source fact. Checking a saved proof restores that context before recompiling the rules, and checks the UUID hash, variant bits and other computations. This proves consequences of the recorded inputs; it does not attest a clock observation or seed randomness.

The saved report ends with `verdict('checked')`. C10 establishes the
original calls from closed call tables: the compiled rules compute the
identifiers only from bound inputs, so the claims are every answer of the
original questions, and strict checking accepts the proof. The checker
follows the certificate without calling the reasoning engine.

---

## Try it

```sh
node bin/eyemind.js --check-proof examples/proof/execution-identifiers-srl.srl examples/execution-identifiers-srl.srl
```

Run `node bin/eyemind.js examples/execution-identifiers-srl.srl` for fresh times
and identifiers, or `node bin/eyemind.js --proof examples/execution-identifiers-srl.srl`
for a proof of that new execution.
