# Package holiday terms with ODRL and SHACL

*A tour operator's cancellation terms as an ODRL snapshot, with its state of the world validated.*

[package-holiday-odrl.ttl](https://github.com/eyereasoner/eyemind/blob/main/examples/package-holiday-odrl.ttl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/package-holiday-odrl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/package-holiday-odrl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/package-holiday-odrl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=package-holiday-odrl)

---

## The question

A tour operator lets the lead traveller cancel a package before departure.
The [package holiday](https://eyereasoner.github.io/eyemind/examples/deck/package-holiday)
example decides eight cancellations under these terms (gate 1) and then under
two versions of the EU Package Travel Directive (gate 2). This example runs
gate 1 alone, as an ODRL snapshot.

Which cancellations do the terms allow?

---

## What we tell eyemind

The permission's constraint is an `odrl:and` of two conditions: the requester
is the booking's lead traveller, and more than zero days are left before
departure. Each request's state records the requester's role in that booking
and the days left. The operator's offer is written as an `odrl:Set`, the
policy type the snapshot profile reads; the cancellation fee and the
directive's rules stay with gate 2.

SHACL shapes in the same file check that state: one role from a closed list
and one integer number of days per state. With `--shacl`, the validation
report joins the ODRL report.

---

## What eyemind concludes

```turtle
_:b0 sh:conforms true .
:r1 eval:decision eval:Allowed .
:r7 eval:decision eval:NotApplicable .
:r8 eval:decision eval:NotApplicable .
```

In LS form:

```js
rdf(iri('https://example.org/package-holiday#r1'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#Allowed'))
rdf(iri('https://example.org/package-holiday#r7'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#NotApplicable'))
rdf(iri('https://example.org/package-holiday#r8'), iri('https://eyereasoner.github.io/eyemind/odrl#decision'), iri('https://eyereasoner.github.io/eyemind/odrl#NotApplicable'))
rdf(iri('https://example.org/package-holiday#r7'), iri('https://eyereasoner.github.io/eyemind/odrl#unmetConstraint'), iri('https://example.org/package-holiday#conditions'))
```

Requests r1 to r6 are allowed. r7 comes two days after departure and r8 from
someone other than the lead traveller, so `:conditions` is unmet for both.
This matches gate 1 of the package holiday example, where r7 and r8 are
refused by the terms under both versions of the directive.

---

## What the proof establishes

The proof covers both reports: the SHACL validation of the states and the
ODRL decisions. The saved proof's verdict is **checked**. It establishes what
the operator's terms allow for these requests, not what the directive grants
or which fee is owed.

---

## Try it

```sh
node bin/eyemind.js --odrl --shacl examples/package-holiday-odrl.ttl
node bin/eyemind.js --odrl --shacl --proof examples/package-holiday-odrl.ttl
node bin/eyemind.js --odrl --shacl --check-proof examples/proof/package-holiday-odrl.js examples/package-holiday-odrl.ttl
```

Give r8 the role `:leadTraveller` and it is allowed. Give r2 a second
`:daysBeforeDeparture` value: SHACL reports a `sh:maxCount` violation, and the
snapshot finds the observation ambiguous, leaving r2 undetermined.
