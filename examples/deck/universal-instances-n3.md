# Universal instances

*"Everyone has a mother", but not the same one.*

[universal-instances-n3.n3](https://github.com/eyereasoner/eyemind/blob/main/examples/universal-instances-n3.n3) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/universal-instances-n3.n3) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/universal-instances-n3.n3) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/universal-instances-n3.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=universal-instances-n3)

---

## The question

Some statements are about everything at once: *everything has property p*,
or *everyone has a mother*. A particular case can be read off such a
statement: *s has property p*, *Bob has a mother*. "Everyone has a mother"
does not say that one person is everyone's mother, so Bob's mother and
Liz's mother must stay apart. Can eyemind read off the cases and keep the
mothers apart?

---

## What the N3 says

```n3
@forAll :x .
@forSome :y .
:x :p :o .
:x :hasMother :y .

{ :s :p :o } => { :universalInstance :holds true } .
{ :bob :hasMother ?mother } => { :bob :mother ?mother } .
{ :liz :hasMother ?mother } => { :liz :mother ?mother } .
```

`@forAll :x` says that `:x` in this document stands for *anything*;
`@forSome :y` that `:y` stands for *some* individual. Declared in the same
formula after `@forAll`, the existential lies in the universal's scope: for
every x there is some y, and which y may depend on x.

---

## What gets compiled

```js
fact(rdf(X, iri("http://example.org/p"), iri("http://example.org/o")))
fact(rdf(X, iri("http://example.org/hasMother"), bnode('n3', ["y", X])))
```

Both statements become eyemind facts with a variable: a fact states every
instance of its variables. The existential becomes a blank node that
carries the universal it depends on, so each x has its own witness.

---

## What eyemind concludes

```n3
:universalInstance :holds true .
:bob :mother _:b0 .
:liz :mother _:b1 .
```

The check report shows the two mothers as different terms:

```js
rdf(iri('http://example.org/bob'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/bob')]))
rdf(iri('http://example.org/liz'), iri('http://example.org/mother'), bnode('n3', ['y', iri('http://example.org/liz')]))
```

---

## What the proof establishes

The report ends with `verdict('checked_with_obligations')`. C1 checks each
step against an instance of the compiled facts and rules: Bob's mother is
the fact instance with `X` bound to `:bob`, so a proof claiming Liz's
witness for Bob fails. The three obligations are `call_fidelity`: an answer
found through a fact with variables has no call table for C10 to follow,
and the manifest lists that obligation as trusted.

---

## Try it

```sh
node bin/eyemind.js examples/universal-instances-n3.n3
node bin/eyemind.js --program examples/universal-instances-n3.n3 > /tmp/universal-instances.js
node bin/eyemind.js --check-proof examples/proof/universal-instances-n3.n3 examples/universal-instances-n3.n3
```
