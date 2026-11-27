# International data transfers in Logical English

*GDPR Chapter V: a legal basis for each transfer, and the exceptions that block one.*

[data-transfers-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/data-transfers-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/data-transfers-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/data-transfers-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/data-transfers-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=data-transfers-le)

---

## The question

A Belgian HR software company plans six transfers of employee data to
providers outside the European Economic Area. Under Chapter V of the GDPR a
transfer needs a legal basis: an adequacy decision for the destination
(Article 45), appropriate safeguards such as standard contractual clauses
(Article 46), or, for an occasional transfer, a derogation such as the
employees' explicit consent (Article 49(1)(a)). The company assesses the
impact of every transfer that relies on the clauses, and never transfers a
special category of data. Which transfers may go ahead?

---

## What we tell eyemind

Each basis is a rule. The US decision, the Data Privacy Framework, covers only
certified recipients, so the adequacy basis has two rules: one for a decision
that covers every recipient, `it is not the case that the decision covers only
certified recipients`, and one that requires the certification.

A transfer is allowed when one of the three bases holds, and it is not the case
that the transfer is prohibited. The three alternatives are indented below the
first condition, so they belong together, and the exception joins them at the
indentation of the rule's first line.

Providers, transfers and decisions are named with definite phrases such as
`the analytics transfer`, which are names when they refer to no variable. The
adequacy decisions are facts of the scenario, not a register of the decisions
in force.

---

## What eyemind concludes

```text
% query allowed with scenario planned transfers
the payroll transfer is allowed.
the pension transfer is allowed.
the support transfer is allowed.
the relocation transfer is allowed.

% query prohibited with scenario planned transfers
the analytics transfer is prohibited.

% query pending with scenario planned transfers
the helpdesk transfer awaits a transfer impact assessment.

% query unfounded with scenario planned transfers
the archive transfer has no legal basis.
```

Japan and Switzerland have adequacy decisions; the US support desk is
certified under the Data Privacy Framework; the one-off relocation rests on
explicit consent. The analytics transfer has assessed clauses, but it carries
health data. The Indian helpdesk relies on clauses whose impact is not yet
assessed, and the regular bulk archive in Brazil has no basis at all.

```js
struct('le:answer', 'allowed', 'planned transfers', 'the support transfer')
struct('le:answer', 'prohibited', 'planned transfers', 'the analytics transfer')
```

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. Each allowed
transfer follows from one basis, and the checker replays the absence of a
prohibition; the pending and unfounded transfers rest on recorded absences of
an assessment and of every basis. It does not establish that the adequacy
decisions are in force or that the clauses were signed.

---

## Try it

```sh
node bin/eyemind.js examples/data-transfers-le.le
node bin/eyemind.js --program examples/data-transfers-le.le > /tmp/data-transfers-le.js
node bin/eyemind.js --proof examples/data-transfers-le.le
node bin/eyemind.js --check-proof examples/proof/data-transfers-le.js examples/data-transfers-le.le
node bin/eyemind.js --explain examples/data-transfers-le.le
```

Add `the transfer impact of the helpdesk transfer is assessed.`: the helpdesk
transfer is allowed. Remove `the support desk is certified under the Data
Privacy Framework.`: the support transfer has no legal basis.
