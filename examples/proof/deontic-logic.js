// Answers: each instance of a query() that holds.
violation('alice', missed_obligation('obtain_consent'))
violation('alice', prohibited_action('share_record'))
compensation('alice', compensation('share_record', 'notify_dpo'))
status('alice', 'requires_review')

// Clauses: the program clauses the steps cite, by clause number.
clause(1, fact(obliged('alice', 'obtain_consent')))
clause(2, fact(prohibited('alice', 'share_record')))
clause(3, fact(compensates('share_record', 'notify_dpo')))
clause(4, fact(performed('alice', 'share_record')))
clause(5, fact(performed('alice', 'notify_dpo')))
clause(6, fact(not_performed('alice', 'obtain_consent')))
clause(8, implies([obliged(Actor, Action), not_performed(Actor, Action)], violation(Actor, missed_obligation(Action))))
clause(9, implies([prohibited(Actor, Action), performed(Actor, Action)], violation(Actor, prohibited_action(Action))))
clause(10, implies([violation(Actor, prohibited_action(Action)), compensates(Action, Compensation), performed(Actor, Compensation)], compensation(Actor, compensation(Action, Compensation))))
clause(11, implies(violation(Actor, missed_obligation(Action)), uncompensated_violation(Actor, missed_obligation(Action))))
clause(13, implies(uncompensated_violation(Actor, _0), status(Actor, 'requires_review')))

// Steps: each goal, what justifies it (a clause, a builtin, a control, an
// absence or a collection), the bindings and the goals it uses.
step(violation('alice', missed_obligation('obtain_consent')), clause(8), {Actor: 'alice', Action: 'obtain_consent'}, [obliged('alice', 'obtain_consent'), not_performed('alice', 'obtain_consent')])
step(obliged('alice', 'obtain_consent'), clause(1), {}, [])
step(not_performed('alice', 'obtain_consent'), clause(6), {}, [])
step(violation('alice', prohibited_action('share_record')), clause(9), {Actor: 'alice', Action: 'share_record'}, [prohibited('alice', 'share_record'), performed('alice', 'share_record')])
step(prohibited('alice', 'share_record'), clause(2), {}, [])
step(performed('alice', 'share_record'), clause(4), {}, [])
step(compensation('alice', compensation('share_record', 'notify_dpo')), clause(10), {Actor: 'alice', Action: 'share_record', Compensation: 'notify_dpo'}, [violation('alice', prohibited_action('share_record')), compensates('share_record', 'notify_dpo'), performed('alice', 'notify_dpo')])
step(compensates('share_record', 'notify_dpo'), clause(3), {}, [])
step(performed('alice', 'notify_dpo'), clause(5), {}, [])
step(status('alice', 'requires_review'), clause(13), {Actor: 'alice', _0: missed_obligation('obtain_consent')}, [uncompensated_violation('alice', missed_obligation('obtain_consent'))])
step(uncompensated_violation('alice', missed_obligation('obtain_consent')), clause(11), {Actor: 'alice', Action: 'obtain_consent'}, [violation('alice', missed_obligation('obtain_consent'))])

// Search certificate: derived facts and complete answers used to check
// negations, collections and the original questions.
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
