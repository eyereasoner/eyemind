# Describing quoted graphs with lists

*Closed lists of quoted triples yield graph metadata through recursive list traversal.*

[graph-term-emulation-srl.srl](https://github.com/eyereasoner/eyemind/blob/main/examples/graph-term-emulation-srl.srl) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/graph-term-emulation-srl.ttl) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/graph-term-emulation-srl.srl) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/graph-term-emulation-srl.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=graph-term-emulation-srl)

---

## The question

Which quoted graph describes social links, and whom does each quoted graph mention?

---

## What the program says

`graph-term-emulation-srl.srl`:

```srl
# Two graph descriptions store their quoted triples in closed RDF lists.
# Recursive list traversal finds social graphs and the resources each graph
# mentions. Conclusions describe the graph descriptions while their quoted
# triple lists retain their original contents.

PREFIX : <http://example.org/graph-term-list#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

DATA {
  :g1 a :GraphTerm ;
      :quotedTriples (
        <<(:alice :knows :bob)>>
        <<(:bob :knows :carol)>>
      ) .

  :g2 a :GraphTerm ;
      :quotedTriples (
        <<(:alice :likes :tea)>>
      ) .

  :note1 :aboutGraphTerm :g1 .
}

RULE { ?g :listCell ?cell }
WHERE {
  ?g :quotedTriples ?cell .
}

RULE { ?g :listCell ?rest }
WHERE {
  ?g :listCell ?cell .
  ?cell rdf:rest ?rest .
}

RULE { ?g a :SocialGraphTerm }
WHERE {
  ?g a :GraphTerm ;
     :listCell ?cell .
  ?cell rdf:first <<(?s :knows ?o)>> .
}

RULE { ?g :mentions ?s }
WHERE {
  ?g a :GraphTerm ;
     :listCell ?cell .
  ?cell rdf:first <<(?s ?p ?o)>> .
}

RULE { ?g :mentions ?o }
WHERE {
  ?g a :GraphTerm ;
     :listCell ?cell .
  ?cell rdf:first <<(?s ?p ?o)>> .
}
```

---

## What eyemind concludes

The Turtle output contains the supplied DATA and the rule conclusions:

```ttl
PREFIX : <http://example.org/graph-term-list#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

:g1 a :GraphTerm .
_:b0 rdf:first <<( :alice :knows :bob )>> .
_:b0 rdf:rest _:b1 .
_:b1 rdf:first <<( :bob :knows :carol )>> .
_:b1 rdf:rest rdf:nil .
:g1 :quotedTriples _:b0 .
:g2 a :GraphTerm .
_:b2 rdf:first <<( :alice :likes :tea )>> .
_:b2 rdf:rest rdf:nil .
:g2 :quotedTriples _:b2 .
:note1 :aboutGraphTerm :g1 .
:g1 :listCell _:b0 .
:g2 :listCell _:b2 .
:g1 :listCell _:b1 .
:g2 :listCell rdf:nil .
:g1 a :SocialGraphTerm .
:g1 :mentions :alice .
:g1 :mentions :bob .
:g2 :mentions :alice .
:g1 :mentions :carol .
:g2 :mentions :tea .
:g1 :listCell rdf:nil .
```

Graph g1 lists Alice knowing Bob and Bob knowing Carol. It becomes a SocialGraphTerm and mentions Alice, Bob and Carol. Graph g2 lists Alice liking tea, so it mentions Alice and tea. The recursive rule indexes existing list cells; its conclusions leave the quoted triples and list links as supplied.

The check report records, among its claims:

```js
inf(iri('http://example.org/graph-term-list#g1'), iri('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'), iri('http://example.org/graph-term-list#SocialGraphTerm'))
inf(iri('http://example.org/graph-term-list#g1'), iri('http://example.org/graph-term-list#mentions'), iri('http://example.org/graph-term-list#alice'))
inf(iri('http://example.org/graph-term-list#g1'), iri('http://example.org/graph-term-list#mentions'), iri('http://example.org/graph-term-list#bob'))
inf(iri('http://example.org/graph-term-list#g2'), iri('http://example.org/graph-term-list#mentions'), iri('http://example.org/graph-term-list#alice'))
inf(iri('http://example.org/graph-term-list#g1'), iri('http://example.org/graph-term-list#mentions'), iri('http://example.org/graph-term-list#carol'))
inf(iri('http://example.org/graph-term-list#g2'), iri('http://example.org/graph-term-list#mentions'), iri('http://example.org/graph-term-list#tea'))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`. The report has no remaining obligations.
C1 checks inference steps against the compiled source clauses; C5 checks
primitive computations; C8 checks fresh witnesses; C10 checks the original
questions against the recorded call tables. The checker follows the
certificate without calling the reasoning engine.

The verdict describes the displayed claims and any listed obligations. It
does not assert that an arbitrary certificate lists every possible answer.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/graph-term-emulation-srl.srl
node bin/eyemind.js --proof examples/graph-term-emulation-srl.srl
node bin/eyemind.js --check-proof examples/proof/graph-term-emulation-srl.srl examples/graph-term-emulation-srl.srl
```
