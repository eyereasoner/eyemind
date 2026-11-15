// Answers: each instance of a query() that holds.
violation('alice', missed_obligation('obtain_consent'))
violation('alice', prohibited_action('share_record'))
compensation('alice', compensation('share_record', 'notify_dpo'))
status('alice', 'requires_review')

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(violation('alice', missed_obligation('obtain_consent')), clause(8), {Actor: 'alice', Action: 'obtain_consent'}, [obliged('alice', 'obtain_consent'), not_performed('alice', 'obtain_consent')])
step(violation('alice', prohibited_action('share_record')), clause(9), {Actor: 'alice', Action: 'share_record'}, [prohibited('alice', 'share_record'), performed('alice', 'share_record')])
step(compensation('alice', compensation('share_record', 'notify_dpo')), clause(10), {Actor: 'alice', Action: 'share_record', Compensation: 'notify_dpo'}, [violation('alice', prohibited_action('share_record')), compensates('share_record', 'notify_dpo'), performed('alice', 'notify_dpo')])
step(status('alice', 'requires_review'), clause(13), {Actor: 'alice', _0: missed_obligation('obtain_consent')}, [uncompensated_violation('alice', missed_obligation('obtain_consent'))])
step(uncompensated_violation('alice', missed_obligation('obtain_consent')), clause(11), {Actor: 'alice', Action: 'obtain_consent'}, [violation('alice', missed_obligation('obtain_consent'))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(violation(A, B), [violation('alice', missed_obligation('obtain_consent')), violation('alice', prohibited_action('share_record'))])
derived(compensation(A, B), [compensation('alice', compensation('share_record', 'notify_dpo'))])
derived(status(A, B), [status('alice', 'requires_review')])
derived(uncompensated_violation(A, B), [uncompensated_violation('alice', missed_obligation('obtain_consent'))])
called(violation(A, B), [violation('alice', missed_obligation('obtain_consent')), violation('alice', prohibited_action('share_record'))])
called(compensation(C, D), [compensation('alice', compensation('share_record', 'notify_dpo'))])
called(violation(E, prohibited_action(F)), [violation('alice', prohibited_action('share_record'))])
called(status(G, H), [status('alice', 'requires_review')])
called(uncompensated_violation(I, _9), [uncompensated_violation('alice', missed_obligation('obtain_consent'))])
called(violation(K, missed_obligation(L)), [violation('alice', missed_obligation('obtain_consent'))])
called(compensation('alice', compensation('share_record', _12)), [compensation('alice', compensation('share_record', 'notify_dpo'))])
