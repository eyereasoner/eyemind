// Matching by shape. Unification, the matching that makes two terms equal
// by binding their variables, answers three small questions here. Asked which
// two lists append to ['a', 'b'], append runs backwards and gives all three
// splits: [] and ['a', 'b'], ['a'] and ['b'], ['a', 'b'] and []. The pattern
// pair(X, X) uses one variable twice, so it only matches a pair of equal
// values, such as pair('same', 'same'). The open list [Head, ...Tail] splits
// ['a', 'b', 'c'] into its first item 'a' and the rest ['b', 'c'].

fact(append([], Ys, Ys))
implied_by(append([X, ...Xs], Ys, [X, ...Zs]), append(Xs, Ys, Zs))
fact(matching_pair(pair(X, X)))
fact(head_tail([Head, ...Tail], Head, Tail))
query(append(Prefix, Suffix, ['a', 'b']))
query(matching_pair(pair('same', 'same')))
query(head_tail(['a', 'b', 'c'], Head, Tail))
