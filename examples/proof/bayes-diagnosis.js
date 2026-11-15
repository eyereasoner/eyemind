// Answers: each instance of a query() that holds.
posterior('paper_jam', 18000, 37200, 0.4838709677419355)
posterior('network_loss', 14250, 37200, 0.38306451612903225)
posterior('power_loss', 4950, 37200, 0.13306451612903225)

// Steps: each derived fact and what it rests on: the clause or control that
// justifies it, the bindings and the goals it uses.
step(posterior('paper_jam', 18000, 37200, 0.4838709677419355), clause(8), {Fault: 'paper_jam', Numerator: 18000, Denominator: 37200, Probability: 0.4838709677419355}, [weight('paper_jam', 18000), total(37200), gt(37200, 0), is(0.4838709677419355, div(18000, 37200))])
step(weight('paper_jam', 18000), clause(4), {Fault: 'paper_jam', Prior: 20, Jam: 90, Offline: 10, Weight: 18000}, [fault('paper_jam', 20, 90, 10), is(18000, mul(mul(20, 90), 10))])
step(total(37200), clause(7), {W: A, Fault: B, Weights: [4950, 14250, 18000], Total: 37200}, [findall_sorted(A, weight(B, A), [4950, 14250, 18000]), sum_weights([4950, 14250, 18000], 37200)])
step(posterior('network_loss', 14250, 37200, 0.38306451612903225), clause(8), {Fault: 'network_loss', Numerator: 14250, Denominator: 37200, Probability: 0.38306451612903225}, [weight('network_loss', 14250), total(37200), gt(37200, 0), is(0.38306451612903225, div(14250, 37200))])
step(weight('network_loss', 14250), clause(4), {Fault: 'network_loss', Prior: 30, Jam: 5, Offline: 95, Weight: 14250}, [fault('network_loss', 30, 5, 95), is(14250, mul(mul(30, 5), 95))])
step(posterior('power_loss', 4950, 37200, 0.13306451612903225), clause(8), {Fault: 'power_loss', Numerator: 4950, Denominator: 37200, Probability: 0.13306451612903225}, [weight('power_loss', 4950), total(37200), gt(37200, 0), is(0.13306451612903225, div(4950, 37200))])
step(weight('power_loss', 4950), clause(4), {Fault: 'power_loss', Prior: 50, Jam: 1, Offline: 99, Weight: 4950}, [fault('power_loss', 50, 1, 99), is(4950, mul(mul(50, 1), 99))])

// Certificate: the derived facts and every answer of each call the questions make.
derived(posterior(C, D, E, F), [posterior('paper_jam', 18000, 37200, 0.4838709677419355), posterior('network_loss', 14250, 37200, 0.38306451612903225), posterior('power_loss', 4950, 37200, 0.13306451612903225)])
derived(weight(C, D), [weight('paper_jam', 18000), weight('network_loss', 14250), weight('power_loss', 4950)])
derived(total(C), [total(37200)])
called(posterior(A, B, C, D), [posterior('paper_jam', 18000, 37200, 0.4838709677419355), posterior('network_loss', 14250, 37200, 0.38306451612903225), posterior('power_loss', 4950, 37200, 0.13306451612903225)])
called(weight(E, F), [weight('paper_jam', 18000), weight('network_loss', 14250), weight('power_loss', 4950)])
called(total(G), [total(37200)])
called(sum_weights([4950, 14250, 18000], H), [sum_weights([4950, 14250, 18000], 37200)])
called(sum_weights([14250, 18000], I), [sum_weights([14250, 18000], 32250)])
called(sum_weights([18000], J), [sum_weights([18000], 18000)])
called(sum_weights([], K), [sum_weights([], 0)])
