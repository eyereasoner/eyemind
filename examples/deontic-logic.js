// Obligations, prohibitions and compensation in a data-handling case. alice
// was obliged to obtain consent and prohibited from sharing a record. The
// observations say she shared the record, notified the data protection
// officer, and did not obtain consent. Notifying the officer is accepted as
// compensation for sharing.
//
// The result: alice has two violations, a missed obligation (consent) and a
// prohibited action (sharing). The sharing violation is compensated by the
// notification, but compensation does not erase it, and nothing compensates
// the missed consent, so alice's status is 'requires_review'. Explicitly not
// deleting an unneeded copy is no violation, since nothing obliged it.
//
// The rulebook is illustrative and says nothing about legal compliance. It
// shows deontic notions (what someone is obliged or prohibited to do) as
// plain relations, and stratified negation: a violation counts as
// uncompensated when no compensation was concluded for it, which eyemind
// decides only after the compensation rule has finished.

// The norms.
fact(obliged('alice', 'obtain_consent'))
fact(prohibited('alice', 'share_record'))
fact(compensates('share_record', 'notify_dpo'))

// The observations. not_performed records an explicit observation that an
// action did not happen; an action with no observation at all is not assumed
// either way, so missed obligations are read only from not_performed facts.
fact(performed('alice', 'share_record'))
fact(performed('alice', 'notify_dpo'))
fact(not_performed('alice', 'obtain_consent'))
// No rule uses this one: nothing obliged alice to delete the copy, so not
// deleting it breaks no norm.
fact(not_performed('alice', 'delete_unneeded_copy'))

// Violations: an obligation observed not met, a prohibition observed broken.
implies(
  [obliged(Actor, Action), not_performed(Actor, Action)],
  violation(Actor, missed_obligation(Action))
)
implies(
  [prohibited(Actor, Action), performed(Actor, Action)],
  violation(Actor, prohibited_action(Action))
)

// A prohibited action is compensated when its compensating action was
// performed too. The violation itself stays on record.
implies(
  [violation(Actor, prohibited_action(Action)), compensates(Action, Compensation), performed(Actor, Compensation)],
  compensation(Actor, compensation(Action, Compensation))
)

// Nothing compensates a missed obligation in this rulebook. A prohibited
// action stays uncompensated when no compensation was concluded for it.
implies(
  violation(Actor, missed_obligation(Action)),
  uncompensated_violation(Actor, missed_obligation(Action))
)
implies(
  [violation(Actor, prohibited_action(Action)), not(compensation(Actor, compensation(Action, _)))],
  uncompensated_violation(Actor, prohibited_action(Action))
)

// One uncompensated violation is enough to require a review.
implies(uncompensated_violation(Actor, _), status(Actor, 'requires_review'))

query(violation(Actor, Violation))
query(compensation(Actor, Compensation))
query(status(Actor, Status))
