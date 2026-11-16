// Checked answers: these follow from the input program and are every answer of its questions.
breach_plan('in_force', 'b1', notify(authority('none'), people('none')), 'document_breach', basis(['GDPR Art. 33(1)', 'GDPR Art. 34(1)', 'GDPR Art. 33(5)']))
breach_plan('in_force', 'b2', notify(authority(within_hours(72)), people('none')), 'document_breach', basis(['GDPR Art. 33(1)', 'GDPR Art. 34(1)', 'GDPR Art. 33(5)']))
breach_plan('in_force', 'b3', notify(authority(within_hours(72)), people('without_undue_delay')), 'document_breach', basis(['GDPR Art. 33(1)', 'GDPR Art. 34(1)', 'GDPR Art. 33(5)']))
breach_plan('omnibus_proposal', 'b1', notify(authority('none'), people('none')), 'document_breach', basis(['GDPR Art. 33(1) as amended', 'GDPR Art. 34(1)', 'GDPR Art. 33(5)']))
breach_plan('omnibus_proposal', 'b2', notify(authority('none'), people('none')), 'document_breach', basis(['GDPR Art. 33(1) as amended', 'GDPR Art. 34(1)', 'GDPR Art. 33(5)']))
breach_plan('omnibus_proposal', 'b3', notify(authority(within_hours_via_single_entry_point(96)), people('without_undue_delay')), 'document_breach', basis(['GDPR Art. 33(1) as amended', 'GDPR Art. 34(1)', 'GDPR Art. 33(5)']))
changed(breach('b2'), from(notify(authority(within_hours(72)), people('none'))), to(notify(authority('none'), people('none'))))
changed(breach('b3'), from(notify(authority(within_hours(72)), people('without_undue_delay'))), to(notify(authority(within_hours_via_single_entry_point(96)), people('without_undue_delay'))))
policy_conflict('ex:r6', resolved_by('odrl:prohibit', 'ex:noTransferUS', overrides('ex:research')))
assessment('in_force', 'ex:r2', deny_policy(not_permitted([unmet('ex:forResearch', 'odrl:purpose', 'dpv:PersonalisedAdvertising', 'odrl:isA', 'dpv:ResearchAndDevelopment'), unmet('ex:underConsent', 'ex:legalBasis', 'dpv:LegitimateInterest', 'odrl:eq', 'dpv:Consent'), unmet('ex:consentGiven', 'ex:consentStatus', 'dpv:ConsentUnknown', 'odrl:eq', 'dpv:ConsentGiven')])), basis(['ex:policy']))
assessment('in_force', 'ex:r3', deny_policy(prohibited_by('ex:noMarketing')), basis(['ex:policy']))
assessment('in_force', 'ex:r4', deny_policy(not_permitted([unmet('ex:consentGiven', 'ex:consentStatus', 'dpv:ConsentWithdrawn', 'odrl:eq', 'dpv:ConsentGiven')])), basis(['ex:policy']))
assessment('in_force', 'ex:r5', deny_policy(not_permitted([unmet('ex:pseudonymised', 'ex:technicalMeasure', 'dpv:Encryption', 'odrl:eq', 'dpv:Pseudonymisation'), unmet('ex:before2027', 'odrl:dateTime', 20270301, 'odrl:lt', 20270101)])), basis(['ex:policy']))
assessment('in_force', 'ex:r6', deny_policy(prohibited_by('ex:noTransferUS')), basis(['ex:policy']))
assessment('in_force', 'ex:r11', deny_policy('no_matching_permission'), basis(['ex:policy']))
assessment('omnibus_proposal', 'ex:r2', deny_policy(not_permitted([unmet('ex:forResearch', 'odrl:purpose', 'dpv:PersonalisedAdvertising', 'odrl:isA', 'dpv:ResearchAndDevelopment'), unmet('ex:underConsent', 'ex:legalBasis', 'dpv:LegitimateInterest', 'odrl:eq', 'dpv:Consent'), unmet('ex:consentGiven', 'ex:consentStatus', 'dpv:ConsentUnknown', 'odrl:eq', 'dpv:ConsentGiven')])), basis(['ex:policy']))
assessment('omnibus_proposal', 'ex:r3', deny_policy(prohibited_by('ex:noMarketing')), basis(['ex:policy']))
assessment('omnibus_proposal', 'ex:r4', deny_policy(not_permitted([unmet('ex:consentGiven', 'ex:consentStatus', 'dpv:ConsentWithdrawn', 'odrl:eq', 'dpv:ConsentGiven')])), basis(['ex:policy']))
assessment('omnibus_proposal', 'ex:r5', deny_policy(not_permitted([unmet('ex:pseudonymised', 'ex:technicalMeasure', 'dpv:Encryption', 'odrl:eq', 'dpv:Pseudonymisation'), unmet('ex:before2027', 'odrl:dateTime', 20270301, 'odrl:lt', 20270101)])), basis(['ex:policy']))
assessment('omnibus_proposal', 'ex:r6', deny_policy(prohibited_by('ex:noTransferUS')), basis(['ex:policy']))
assessment('omnibus_proposal', 'ex:r11', deny_policy('no_matching_permission'), basis(['ex:policy']))
assessment('in_force', 'ex:r10', permit('ex:research'), basis(['ex:policy', 'ePrivacy Art. 5(3)']))
assessment('omnibus_proposal', 'ex:r1', permit('ex:research'), basis(['ex:policy', 'GDPR Art. 88a(3)(c)']))
assessment('omnibus_proposal', 'ex:r10', permit('ex:research'), basis(['ex:policy', 'GDPR Art. 88a(3)(b)']))
assessment('in_force', 'ex:r1', await_device_consent('ex:research'), basis(['ex:policy', 'ePrivacy Art. 5(3)']))
assessment('in_force', 'ex:r7', await_device_consent('ex:research'), basis(['ex:policy', 'ePrivacy Art. 5(3)']))
assessment('in_force', 'ex:r8', await_device_consent('ex:research'), basis(['ex:policy', 'ePrivacy Art. 5(3)']))
assessment('in_force', 'ex:r9', await_device_consent('ex:research'), basis(['ex:policy', 'ePrivacy Art. 5(3)']))
assessment('omnibus_proposal', 'ex:r9', await_device_consent('ex:research'), basis(['ex:policy', 'GDPR Art. 88a(1)', 'GDPR Art. 88a(4)(c)']))
assessment('omnibus_proposal', 'ex:r7', deny_device('refused_by_signal'), basis(['ex:policy', 'GDPR Art. 88a(1)', 'GDPR Art. 88b(1)-(2)']))
assessment('omnibus_proposal', 'ex:r8', deny_device('do_not_ask_again'), basis(['ex:policy', 'GDPR Art. 88a(1)', 'GDPR Art. 88a(4)(c)']))
planned_duty('in_force', 'ex:r10', 'odrl:delete', within_days(90))
planned_duty('omnibus_proposal', 'ex:r1', 'odrl:delete', within_days(90))
planned_duty('omnibus_proposal', 'ex:r10', 'odrl:delete', within_days(90))
changed(session('ex:r1'), from(await_device_consent('ex:research')), to(permit('ex:research')))
changed(session('ex:r7'), from(await_device_consent('ex:research')), to(deny_device('refused_by_signal')))
changed(session('ex:r8'), from(await_device_consent('ex:research')), to(deny_device('do_not_ask_again')))

// Proof check (SPEC 11.2-11.6):
// Questions: every claim is an answer, and every required answer is claimed.
// Call tables: every consulted table matches its one-level expansion against the program.
// Derived listings: every consulted listing is closed under the forward rules.
// Replay: every required firing replays from no bindings; primitives, controls and
// Skolem witnesses are checked at the bindings where they run.
// Evidence: every recorded step, call table and listing is used by the check.

verdict('checked')
