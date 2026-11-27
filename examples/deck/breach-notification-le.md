# Breach notification in Logical English

*GDPR Articles 33 and 34 as rules with exceptions, applied to four breaches.*

[breach-notification-le.le](https://github.com/eyereasoner/eyemind/blob/main/examples/breach-notification-le.le) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/breach-notification-le.le) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/breach-notification-le.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/breach-notification-le.js) · [playground](https://eyereasoner.github.io/eyemind/playground/#example=breach-notification-le)

---

## The question

A web shop handles four personal data breaches: a lost laptop with encrypted
email addresses, a database leak of health data, a ransomware attack and a
misdirected email. Under Article 33 of the GDPR the shop, as controller,
notifies the supervisory authority within 72 hours of becoming aware of a
breach, unless the breach is unlikely to result in a risk; a later notice
must give the reasons for the delay. Under Article 34 it also tells the people
affected of a high risk, unless the data was encrypted. Its hosting processor
must alert it without undue delay, which their processing agreement sets at 24
hours. Which breaches need which notices, and who breaches which article?

---

## What we tell eyemind

Each provision is a rule, and each exception an `it is not the case that`
condition on its own indented line. A breach must be notified unless it is
unlikely to result in a risk, which holds for a low risk; a high risk must be
communicated to the data subjects unless the breach concerns encrypted data.
The hours count from the moment the shop became aware of the breach and are
compared with `N <= 72` and `N > 72`.

The breaches are named with definite phrases such as `the database leak`. A
definite phrase that refers back to no variable is a name, the same one in
every sentence. The risk levels are the shop's assessments, given as facts.

---

## What eyemind concludes

```text
% query notify with scenario web shop
the lost laptop must be notified to the supervisory authority.
the database leak must be notified to the supervisory authority.
the ransomware attack must be notified to the supervisory authority.

% query timely with scenario web shop
the lost laptop is notified in time.

% query late with scenario web shop
the database leak is notified late.

% query communicate with scenario web shop
the database leak must be communicated to the data subjects.

% query breaches with scenario web shop
the controller breaches Article 33(1) for the ransomware attack.
the controller breaches Article 34(1) for the database leak.
the processor breaches Article 33(2) for the database leak.
```

The misdirected email has a low risk and needs no notice. The database leak
was notified after 90 hours, but with recorded reasons, so the late notice
itself breaches nothing; not telling the people whose health data leaked does.
The ransomware attack was never notified.

```js
struct('le:answer', 'breaches', 'web shop', 'the controller', 'Article 33(1)', 'the ransomware attack')
struct('le:answer', 'breaches', 'web shop', 'the processor', 'Article 33(2)', 'the database leak')
```

---

## What the proof establishes

The saved proof is **checked** against the compiled LS program. It establishes
each decision from the stated assessments and hours, including every absence
an exception rests on. It does not establish that the risk assessments are
right or that encryption made the data unintelligible.

---

## Try it

```sh
node bin/eyemind.js examples/breach-notification-le.le
node bin/eyemind.js --program examples/breach-notification-le.le > /tmp/breach-notification-le.js
node bin/eyemind.js --proof examples/breach-notification-le.le
node bin/eyemind.js --check-proof examples/proof/breach-notification-le.js examples/breach-notification-le.le
node bin/eyemind.js --explain examples/breach-notification-le.le
```

Change the processor's alert on the database leak to 20 hours: the processor
breaches nothing. Add `the controller informed the data subjects of the
database leak.`: Article 34(1) is no longer breached.
