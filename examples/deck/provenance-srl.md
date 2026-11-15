# Strong links and their sources

*Strong annotated links yield connections and source-attributed triple terms.*

[provenance-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/provenance-srl.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/provenance-srl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/provenance-srl.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/provenance-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=provenance-srl)

---

## The question

Which places connect through strong evidence, and who reported each link?

---

## What the program says

`provenance-srl.srl`:

```srl
# Statements carry their source as RDF 1.2 annotations: who said that a link
# exists and how strong it is. Only strong links connect places, and
# connection is transitive. Shows reifiers, annotation syntax and triple terms.
PREFIX : <http://example.org/links#>

DATA {
  :a :link :b ~:l1 {| :weight 9 ; :source :survey |} .
  :b :link :c ~:l2 {| :weight 2 ; :source :rumour |} .
  :b :link :d ~:l3 {| :weight 7 ; :source :survey |} .
}

RULE { ?x :connected ?y } WHERE { ?x :link ?y ~?r {| :weight ?w |} FILTER(?w > 5) }
RULE { ?x :connected ?z } WHERE { ?x :connected ?y . ?y :connected ?z }
RULE { ?s :reported <<( ?x :link ?y )>> } WHERE { ?r rdf:reifies <<( ?x :link ?y )>> ; :source ?s }
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```ttl
PREFIX : <http://example.org/links#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

:a :link :b .
:l1 rdf:reifies <<( :a :link :b )>> .
:l1 :weight 9 .
:l1 :source :survey .
:b :link :c .
:l2 rdf:reifies <<( :b :link :c )>> .
:l2 :weight 2 .
:l2 :source :rumour .
:b :link :d .
:l3 rdf:reifies <<( :b :link :d )>> .
:l3 :weight 7 .
:l3 :source :survey .
:a :connected :b .
:b :connected :d .
:a :connected :d .
:survey :reported <<( :a :link :b )>> .
:rumour :reported <<( :b :link :c )>> .
:survey :reported <<( :b :link :d )>> .
```

Only links with weight greater than 5 create connections. Transitivity connects a to d through b. A separate rule reports every source’s original link as an RDF 1.2 triple term, including the weak rumour.

The check report records the corresponding claims as JavaScript expressions:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
inf(iri('http://example.org/links#a'), iri('http://example.org/links#connected'), iri('http://example.org/links#b'))
inf(iri('http://example.org/links#b'), iri('http://example.org/links#connected'), iri('http://example.org/links#d'))
inf(iri('http://example.org/links#a'), iri('http://example.org/links#connected'), iri('http://example.org/links#d'))
inf(iri('http://example.org/links#survey'), iri('http://example.org/links#reported'), triple(iri('http://example.org/links#a'), iri('http://example.org/links#link'), iri('http://example.org/links#b')))
inf(iri('http://example.org/links#rumour'), iri('http://example.org/links#reported'), triple(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#c')))
inf(iri('http://example.org/links#survey'), iri('http://example.org/links#reported'), triple(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#d')))
inf(iri('http://example.org/links#a'), iri('http://example.org/links#link'), iri('http://example.org/links#b'))
inf(iri('http://example.org/links#l1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('http://example.org/links#a'), iri('http://example.org/links#link'), iri('http://example.org/links#b')))
inf(iri('http://example.org/links#l1'), iri('http://example.org/links#weight'), 9)
inf(iri('http://example.org/links#l1'), iri('http://example.org/links#source'), iri('http://example.org/links#survey'))
inf(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#c'))
inf(iri('http://example.org/links#l2'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#c')))
inf(iri('http://example.org/links#l2'), iri('http://example.org/links#weight'), 2)
inf(iri('http://example.org/links#l2'), iri('http://example.org/links#source'), iri('http://example.org/links#rumour'))
inf(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#d'))
inf(iri('http://example.org/links#l3'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies'), triple(iri('http://example.org/links#b'), iri('http://example.org/links#link'), iri('http://example.org/links#d')))
inf(iri('http://example.org/links#l3'), iri('http://example.org/links#weight'), 7)
inf(iri('http://example.org/links#l3'), iri('http://example.org/links#source'), iri('http://example.org/links#survey'))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`.

The checker reads the clauses from the compiled program, not from the
proof, and never calls the reasoning engine. It answers the original
questions from the proof's call tables, checking each table by expanding its
call one level against the program; it requires each `derived` listing to be
closed under the forward rules; and it replays the recorded firing of each
listed fact, computing primitives again. A step, table or listing the check
does not use fails it.

The verdict establishes that the displayed claims follow from the compiled
program and are every answer of its original questions.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/provenance-srl.srl
node bin/eyemind.js --proof examples/provenance-srl.srl
node bin/eyemind.js --check-proof examples/proof/provenance-srl.js examples/provenance-srl.srl
```
