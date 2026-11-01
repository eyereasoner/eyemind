// Reviewing the clauses of a terms-of-service policy for risks. Six clauses
// permit or prohibit actions such as removing an account, changing the terms
// or sharing data. Rules flag risky clauses, score each finding, and rank the
// findings with a reason and a suggested change for each.
//
// Four findings result: c1 (account removal with no notice or safeguard,
// score 100, rank 1), c3 (data sharing without consent, 97), c2 (terms
// changed on 3 days' notice where 14 are required, 85), and c4 (data export
// prohibited, 70, moderate). c5 and c6 have their safeguards and are not
// reported. The rank of a finding is one more than the number of findings
// that score higher, counted with findall.
//
// This is a small illustrative policy model: the base scores, weights and
// thresholds are supplied choices, not a legal assessment.

// The clauses of the policy and their safeguards.

fact(permission('c1', 'remove_account'))
fact(permission('c2', 'change_terms'))
fact(permission('c3', 'share_data'))
fact(prohibition('c4', 'export_data'))
fact(notice_days('c2', 3))
fact(permission('c5', 'share_data'))
fact(safeguard('c5', 'consent'))
fact(permission('c6', 'change_terms'))
fact(notice_days('c6', 14))
// Weights added to the base score of each kind of finding.
fact(importance('retention', 20))
fact(importance('prior_notice', 15))
fact(importance('consent', 12))
fact(importance('portability', 10))
// Days of notice required before the terms change.
fact(required_notice(14))
implied_by(has_notice(Clause), [notice_days(Clause, Days), ge(Days, 0)])
// One rule per kind of risk; each finding's raw score is a base score
// (90, 70, 85, 60) plus the weight of the concern.
implies(
  [
    permission(Clause, 'remove_account'),
    importance('retention', Weight),
    not(has_notice(Clause)),
    not(safeguard(Clause, 'inform')),
    is(Raw, add(90, Weight)),
  ],
  finding(Clause, Raw, 'no_removal_safeguards', 'add_notice_and_inform'),
)
implies(
  [
    permission(Clause, 'change_terms'),
    notice_days(Clause, Days),
    required_notice(Required),
    lt(Days, Required),
    importance('prior_notice', Weight),
    is(Raw, add(70, Weight)),
  ],
  finding(Clause, Raw, short_notice(Days, Required), increase_notice(Required)),
)
implies(
  [
    permission(Clause, 'share_data'),
    not(safeguard(Clause, 'consent')),
    importance('consent', Weight),
    is(Raw, add(85, Weight)),
  ],
  finding(Clause, Raw, 'sharing_without_consent', 'require_consent'),
)
implies(
  [
    prohibition(Clause, 'export_data'),
    importance('portability', Weight),
    is(Raw, add(60, Weight)),
  ],
  finding(Clause, Raw, 'export_prohibited', 'permit_export'),
)
// Scores are capped at 100.
implies([finding(Clause, Raw, Why, Fix), gt(Raw, 100)], score(Clause, 100))
implies([finding(Clause, Raw, Why, Fix), le(Raw, 100)], score(Clause, Raw))
implied_by(severity(Score, 'high'), ge(Score, 80))
implied_by(severity(Score, 'moderate'), [ge(Score, 50), lt(Score, 80)])
implied_by(severity(Score, 'low'), lt(Score, 50))
// Other is the score of a clause that scores higher than Score.
implied_by(higher(Score, Other), [score(Clause, Other), gt(Other, Score)])
fact(count([], 0))
implied_by(count([_, ...Rest], N), [count(Rest, Before), is(N, add(Before, 1))])
implies(
  [
    score(Clause, Score),
    finding(Clause, Raw, Why, Fix),
    severity(Score, Severity),
    findall(Other, higher(Score, Other), Higher),
    count(Higher, Count),
    is(Rank, add(Count, 1)),
  ],
  report(Rank, Clause, Score, Severity, Why, Fix),
)
query(report(Rank, Clause, Score, Severity, Why, Fix))
