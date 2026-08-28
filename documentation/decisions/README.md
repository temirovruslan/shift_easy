# Decisions

Short records of choices that were not obvious, kept so the reasoning survives
the people who made it. Each one states what the situation was, what was
decided and what that costs.

They are not documentation of how the code works — that is
[`../../CONTRIBUTING.md`](../../CONTRIBUTING.md). They exist for the question
"why is it like this", which code cannot answer.

| # | Decision |
|---|---|
| [1](0001-scope-every-lookup-by-company.md) | A record lookup that is not scoped by company is a bug |
| [2](0002-freeze-lint-debt-rather-than-clear-it.md) | Freeze the existing lint debt instead of clearing or ignoring it |
| [3](0003-keep-the-mobile-app-gate-its-release.md) | Keep the mobile app, remove its automatic release — *superseded by 6* |
| [4](0004-defer-transactions.md) | Defer transactions on the two-collection writes |
| [5](0005-first-site-until-selection-exists.md) | A multi-site worker gets their first site until selection is built |
| [6](0006-remove-the-mobile-app.md) | Remove the mobile app from this repository |

Add one when a choice will look arbitrary later, or when you rejected an
option someone will reasonably propose again.
