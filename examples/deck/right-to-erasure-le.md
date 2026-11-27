# Right to erasure in Logical English

*GDPR Article 17 with its exemptions, Article 21's marketing objection and Article 19's notice.*

[right-to-erasure-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/right-to-erasure-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/right-to-erasure-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/right-to-erasure-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/right-to-erasure-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=right-to-erasure-le)

---

## The question

A customer asks a web shop to erase their personal data. Under Article 17 of
the GDPR the shop erases it, unless an exemption applies: it keeps the invoices
while the tax retention period runs (Article 17(3)(b)) and the support tickets
under a litigation hold (Article 17(3)(e)). The customer has also withdrawn
consent for direct marketing, so the marketing list goes (Article 21(3)), and
the recipients of erased data are told (Article 19). What happens to each
record?

---

## What we tell eyemind

Article 17(1) is one rule with two exceptions on their own indented lines:
`it is not the case that the record must be kept under an article`, where
`an article` is any article, and `it is not the case that the record awaits
its retention period`. Each exemption is a rule that concludes the article as a
quoted name, such as `"Article 17(3)(b)"`.

A retention period applies to the invoices and to the backup archive, but only
the invoices' remaining years are recorded. A rule notes that the backup
archive waits for that fact, so its erasure is neither ordered nor refused.
Direct marketing is a kind of marketing, so withdrawing consent for it erases
the marketing list whether or not the customer asked.

---

## What eyemind concludes

```text
% query erase with scenario erasure request
the profile must be erased.
the marketing list must be erased.

% query keep with scenario erasure request
the invoices must be kept under Article 17(3)(b).
the support tickets must be kept under Article 17(3)(e).

% query pending with scenario erasure request
the backup archive awaits its retention period.

% query inform with scenario erasure request
the recipients of the marketing list must be informed.
```

The recipients of the profile were already informed; those of the marketing
list still have to be.

```js
struct('le:answer', 'keep', 'erasure request', 'the invoices', 'Article 17(3)(b)')
struct('le:answer', 'inform', 'erasure request', 'the marketing list')
```

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. Each erasure
rests on the checked absence of an exemption, and the pending backup archive
on the absence of its remaining years. It does not establish that the
retention period or the litigation hold were correctly recorded.

---

## Try it

```sh
node bin/eyemind.js examples/right-to-erasure-le.le
node bin/eyemind.js --program examples/right-to-erasure-le.le > /tmp/right-to-erasure-le.js
node bin/eyemind.js --proof examples/right-to-erasure-le.le
node bin/eyemind.js --check-proof examples/proof/right-to-erasure-le.js examples/right-to-erasure-le.le
node bin/eyemind.js --explain examples/right-to-erasure-le.le
```

Add `the retention period of the backup archive has 0 years left.`: the backup
archive must be erased. Remove the litigation hold and the support tickets
must be erased too.
