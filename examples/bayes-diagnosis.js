// Illustrative naive Bayes diagnosis of a printer that shows a paper jam and is
// offline. Three possible faults each have a prior probability and a
// probability of producing each of the two observations; the numbers are
// invented. A fault's weight is the product of its prior and both likelihoods,
// and its posterior probability is its weight divided by the sum of all
// weights, which assumes the faults are the only alternatives and the two
// observations are independent given the fault.
//
// The program concludes that a paper jam is the most likely fault (about
// 0.48), then network loss (0.38) and power loss (0.13). Weights are whole
// percentages, so the products stay exact integers until the final division.
// It shows forward rules, a collection with findall, and a recursive sum.

// fault(Name, Prior, P(jam | fault), P(offline | fault)), all in percent.
fact(fault('paper_jam', 20, 90, 10))
fact(fault('network_loss', 30, 5, 95))
fact(fault('power_loss', 50, 1, 99))
implies(
  [fault(Fault, Prior, Jam, Offline), is(Weight, mul(mul(Prior, Jam), Offline))],
  weight(Fault, Weight),
)
// The total weight of all faults normalizes the posteriors.
fact(sum_weights([], 0))
implied_by(sum_weights([W, ...Ws], Sum), [sum_weights(Ws, Rest), is(Sum, add(W, Rest))])
implies([findall(W, weight(Fault, W), Weights), sum_weights(Weights, Total)], total(Total))
implies(
  [
    weight(Fault, Numerator),
    total(Denominator),
    gt(Denominator, 0),
    is(Probability, div(Numerator, Denominator)),
  ],
  posterior(Fault, Numerator, Denominator, Probability),
)
query(posterior(Fault, Numerator, Denominator, Probability))
