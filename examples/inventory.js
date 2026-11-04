// Calculating an invoice from three items. Each item has a quantity and a unit
// price, all prices in the same unspecified currency unit. A forward rule
// multiplies quantity by price for each line (6, 12 and 10), and a second
// forward rule collects the line totals with findall and adds them up: the
// invoice totals 28.
//
// The collection must see every line total, so eyemind runs it only after
// the line totals have all been derived: the findall rule sits in a later
// stratum, a later stage of reasoning, than the rule that makes line totals.

// item(Name, Quantity, UnitPrice)
fact(item('apple', 3, 2))
fact(item('pear', 4, 3))
fact(item('plum', 2, 5))
implies([item(Name, Quantity, Price), is(Total, mul(Quantity, Price))], line_total(Name, Total))
// sum(Numbers, Total): Total is the sum of the list Numbers.
fact(sum([], 0))
implied_by(sum([X, ...Xs], Total), [sum(Xs, Rest), is(Total, add(X, Rest))])
implies([findall(Amount, line_total(_, Amount), Amounts), sum(Amounts, Total)], invoice(Total))
query(invoice(Total))
