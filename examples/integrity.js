// An integrity constraint on account balances: no balance may be negative.
// Alice has 30 and Bob has -5. A contradiction(...) statement is a rule that
// concludes 'false' when its body holds and so stops the run, like a fuse.
// Bob's balance violates it, so the output is 'false' and the eyecode command
// exits with code 65.

fact(account('alice', 30))
fact(account('bob', -5))
contradiction(account(Owner, Balance), lt(Balance, 0))
