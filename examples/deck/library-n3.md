# Who borrowed which book?

*A catalog in RDF/XML and loans in JSON-LD joined by N3 rules into who borrowed which title and which loans are overdue.*

[data/library-n3.rdf](https://github.com/eyereasoner/eyemind/blob/main/examples/data/library-n3.rdf) · [data/library-n3.jsonld](https://github.com/eyereasoner/eyemind/blob/main/examples/data/library-n3.jsonld) · [library-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/library-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/library-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/library-n3.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/library-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=library-n3)

---

## The question

A library keeps its catalog in RDF/XML and its loans in JSON-LD. Which member
has borrowed which title, and which loans are overdue on 28 November 2026?

---

## What the program says

`data/library-n3.rdf` describes three books, each with a title in its own
language. `xml:base` makes `rdf:about="dune"` the IRI
`https://example.org/books/dune`:

```xml
<?xml version="1.0"?>
<!-- A library catalog in RDF/XML, and loans in JSON-LD, read into one dataset.
     N3 rules join them: who has borrowed which title, and which loans are
     overdue on the reference day. Shows RDF/XML and JSON-LD inputs. -->

<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:dc="http://purl.org/dc/terms/"
         xmlns:lib="https://example.org/library#"
         xml:base="https://example.org/books/">

  <!-- Each book has a title in its own language, and a creator. -->
  <lib:Book rdf:about="dune">
    <dc:title xml:lang="en">Dune</dc:title>
    <dc:creator>Frank Herbert</dc:creator>
  </lib:Book>
  <lib:Book rdf:about="good-omens">
    <dc:title xml:lang="en">Good Omens</dc:title>
    <dc:creator>Terry Pratchett and Neil Gaiman</dc:creator>
  </lib:Book>
  <lib:Book rdf:about="solaris">
    <dc:title xml:lang="pl">Solaris</dc:title>
    <dc:creator>Stanisław Lem</dc:creator>
  </lib:Book>
</rdf:RDF>
```

`data/library-n3.jsonld` lists the loans. Its context maps the keys to the
library vocabulary, reads `book` and `borrower` as IRIs, against `@base`, and
`due` as an `xsd:date`:

```json
{
  "@context": {
    "@vocab": "https://example.org/library#",
    "@base": "https://example.org/",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "book": { "@type": "@id" },
    "borrower": { "@type": "@id" },
    "due": { "@type": "xsd:date" }
  },
  "@graph": [
    { "@id": "loans/1", "@type": "Loan", "book": "books/dune", "borrower": "members/ada", "due": "2026-11-20" },
    { "@id": "loans/2", "@type": "Loan", "book": "books/solaris", "borrower": "members/grace", "due": "2026-12-04" },
    { "@id": "loans/3", "@type": "Loan", "book": "books/good-omens", "borrower": "members/ada", "due": "2026-11-27" }
  ]
}
```

`library-n3.n3` joins the two files. Both are read into one dataset, so a
loan's book in the JSON-LD file is the same IRI as the book in the RDF/XML
catalog:

```n3
# A library catalog in RDF/XML, and loans in JSON-LD, read into one dataset.
# N3 rules join them: who has borrowed which title, and which loans are
# overdue on the reference day. Shows RDF/XML and JSON-LD inputs.

@prefix : <https://example.org/library#> .
@prefix dc: <http://purl.org/dc/terms/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix string: <http://www.w3.org/2000/10/swap/string#> .

# The day the overdue loans are counted on.
:library :today "2026-11-28"^^xsd:date .

# A loan joins a borrower to the title of the book, from the other file.
{ ?loan a :Loan ; :book ?book ; :borrower ?member . ?book dc:title ?title . }
  => { ?member :hasBorrowed ?title } .

# A loan is overdue when its due date is before today: xsd:date literals in
# their canonical form compare as strings.
{ ?loan a :Loan ; :due ?due ; :book ?book . ?book dc:title ?title .
  :library :today ?today . ?due string:lessThan ?today . }
  => { ?loan :overdue ?title } .
```

---

## What eyemind concludes

The command writes these conclusions in its native output format:

```n3
@prefix lib: <https://example.org/library#> .

<https://example.org/members/ada> lib:hasBorrowed "Dune"@en .
<https://example.org/members/grace> lib:hasBorrowed "Solaris"@pl .
<https://example.org/members/ada> lib:hasBorrowed "Good Omens"@en .
<https://example.org/loans/1> lib:overdue "Dune"@en .
<https://example.org/loans/3> lib:overdue "Good Omens"@en .
```

Ada has borrowed two books and Grace one. The loans of *Dune* and *Good Omens*
were due before 28 November, so they are overdue; *Solaris* is due in December.
The language tags of the RDF/XML titles carry through to the conclusions.

The check report records the corresponding claims as JavaScript expressions:

```js
// Checked answers: these follow from the input program and are every answer of its questions.
rdf(iri('https://example.org/members/ada'), iri('https://example.org/library#hasBorrowed'), literal('Dune', lang('en')))
rdf(iri('https://example.org/members/grace'), iri('https://example.org/library#hasBorrowed'), literal('Solaris', lang('pl')))
rdf(iri('https://example.org/members/ada'), iri('https://example.org/library#hasBorrowed'), literal('Good Omens', lang('en')))
rdf(iri('https://example.org/loans/1'), iri('https://example.org/library#overdue'), literal('Dune', lang('en')))
rdf(iri('https://example.org/loans/3'), iri('https://example.org/library#overdue'), literal('Good Omens', lang('en')))
```

---

## What the proof establishes

The saved report ends with `verdict('checked')`. The proof records the firing
of a rule behind each claim, from the facts both files contribute: the loan
facts of the JSON-LD file and the titles of the RDF/XML catalog. The checker
replays each recorded firing against the compiled program, including the
string comparison of the dates, without calling the reasoning engine.

The verdict **checked** establishes that the five claims follow from the
program and its two data files.

---

## Try it

From the repository root:

```sh
node bin/eyemind.js examples/data/library-n3.rdf examples/data/library-n3.jsonld examples/library-n3.n3
node bin/eyemind.js --proof examples/data/library-n3.rdf examples/data/library-n3.jsonld examples/library-n3.n3
node bin/eyemind.js --check-proof examples/proof/library-n3.js examples/data/library-n3.rdf examples/data/library-n3.jsonld examples/library-n3.n3
```

Change the day in `library-n3.n3` to `"2026-12-10"^^xsd:date`, and the loan
of *Solaris* is overdue too.
