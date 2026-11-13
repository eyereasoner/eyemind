# A Unicode directory

*Directory listings, initials and language information from Unicode names.*

[strings-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/strings-srl.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/strings-srl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/strings-srl.srl) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/strings-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=strings-srl)

---

## The question

How can names yield directory listings, initials and language information?

---

## What the program says

`strings-srl.srl`:

```srl
# Names are tidied for a directory listing: an upper-case surname, initials,
# and a sort key; names in other scripts keep their language tag. Shows
# string functions, CONCAT, and the language of a literal.
PREFIX : <http://example.org/people#>

DATA {
  :p1 :given "Ada" ; :family "Lovelace" .
  :p2 :given "Alan" ; :family "Turing" .
  :p3 :name "Ἀριστοτέλης"@grc .
}

RULE { ?p :listing ?listing ; :initial ?i }
WHERE {
  ?p :given ?g ; :family ?f
  SET(?i := SUBSTR(?g, 1, 1))
  SET(?listing := CONCAT(UCASE(?f), ", ", ?g))
}
RULE { ?p :script ?lang ; :length ?n } WHERE { ?p :name ?name SET(?lang := LANG(?name)) SET(?n := STRLEN(?name)) }
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```ttl
PREFIX : <http://example.org/people#>

:p1 :given "Ada" .
:p1 :family "Lovelace" .
:p2 :given "Alan" .
:p2 :family "Turing" .
:p3 :name "Ἀριστοτέλης"@grc .
:p1 :listing "LOVELACE, Ada" .
:p1 :initial "A" .
:p2 :listing "TURING, Alan" .
:p2 :initial "A" .
:p3 :script "grc" .
:p3 :length 11 .
```

SUBSTR extracts initials and UCASE plus CONCAT writes the listings. LANG preserves the Greek language tag as information; STRLEN counts the name’s characters. SRL output includes the given names.

The check report records the corresponding claims as JavaScript expressions:

```js
// Answers checked subject to the obligations below.
inf(iri('http://example.org/people#p1'), iri('http://example.org/people#listing'), literal('LOVELACE, Ada', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p1'), iri('http://example.org/people#initial'), literal('A', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p2'), iri('http://example.org/people#listing'), literal('TURING, Alan', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p2'), iri('http://example.org/people#initial'), literal('A', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p3'), iri('http://example.org/people#script'), literal('grc', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p3'), iri('http://example.org/people#length'), 11)
inf(iri('http://example.org/people#p1'), iri('http://example.org/people#given'), literal('Ada', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p1'), iri('http://example.org/people#family'), literal('Lovelace', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p2'), iri('http://example.org/people#given'), literal('Alan', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p2'), iri('http://example.org/people#family'), literal('Turing', datatype('http://www.w3.org/2001/XMLSchema#string')))
inf(iri('http://example.org/people#p3'), iri('http://example.org/people#name'), literal('Ἀριστοτέλης', lang('grc')))
```

---

## What the proof establishes

The saved report ends with `verdict('checked_with_obligations')`. The report lists `call_fidelity` obligations. Strict checking rejects these remaining obligations.
C1 checks each inference against the compiled source clauses, C5 re-decides
primitive computations, C8 checks any fresh witness, and C10 checks the
original questions against the proof's call tables. The checker follows the
certificate without calling the reasoning engine.

The verdict certifies the displayed claims; it does not assert that an
arbitrary proof lists every possible answer.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/strings-srl.srl
node bin/eyemind.js --proof examples/strings-srl.srl
node bin/eyemind.js --check-proof examples/proof/strings-srl.srl examples/strings-srl.srl
```
