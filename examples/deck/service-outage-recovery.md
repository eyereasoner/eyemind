# Restoring checkout after an outage

*Choose repairs from their effects on business functions.*

[program](https://github.com/eyereasoner/eyemind/blob/main/examples/service-outage-recovery.js) · [output](https://github.com/eyereasoner/eyemind/blob/main/examples/output/service-outage-recovery.js) · [proof](https://github.com/eyereasoner/eyemind/blob/main/examples/proof/service-outage-recovery.js) · [check](https://github.com/eyereasoner/eyemind/blob/main/examples/check/service-outage-recovery.js) · [playground](https://eyereasoner.github.io/eyemind/playground#example=service-outage-recovery)

---

## The question

The shop's website and mobile app both need checkout. Checkout needs a catalog
and payments; payments need a bank and a risk assessment. Both catalog
providers and both banks are down. Which repairs restore both functions most
cheaply?

---

## What we tell eyemind

Each node lists the provider groups it requires. Every group needs one working
provider, so replicas are alternatives rather than additional requirements.
The four repair prices are 3, 2, 4 and 1, in illustrative cost units.

A backward rule enumerates all 16 subsets of repair candidates. Forward rules
derive which nodes operate under each plan, requiring every listed group.

---

## What eyemind concludes

```js
best_repair(['catalog_replica', 'bank_backup'], 3)
restored_function('place_order')
restored_function('mobile_checkout')
```

Both functions are unavailable before repair. The selected plan costs 2 + 1.

---

## Why the plan works

1. Repairing the replica provides the catalog.
2. Repairing the backup provides the bank.
3. The working risk cache supports the risk engine.
4. Payments, checkout, the website and the app can then operate.

The risk engine can also depend on payments. That cycle cannot establish its
own availability: the independent cache supplies the starting evidence.

---

## What the proof establishes

The checker verifies the repair costs and the availability derivation.
The verdict is **checked_with_obligations**: two absences describe the initial
outage, and another says no cheaper feasible plan exists. The checker follows
the certificate; it does not repeat the search over every repair plan.

The result assumes the supplied hardware states and dependency model. It
proposes repairs without performing them.

---

## Try it

```sh
eyemind examples/service-outage-recovery.js
eyemind --proof examples/service-outage-recovery.js
```

Change the risk cache's state from `'up'` to `'down'`. No repair plan now
restores checkout: the listed repair choices cannot restore that cache, and
the payment/risk cycle has no independent support.
