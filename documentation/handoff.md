# Handoff

Where the project stands, what is unfinished, and how to confirm both. Update
this when you leave work in a state someone else has to pick up.

**Last updated:** 2026-08-27, after the audit response.

## Confirming the state yourself

```bash
npm run install:all
npm run verify        # typecheck ×3, lint, 90 tests
```

At the time of writing: 63 server tests, 27 client tests, 83% statement
coverage on the server, no known vulnerabilities in either application, no
lint errors. CI runs the same three jobs on every pull request.

## What changed most recently

The last body of work answered an external audit. It is written up in
[`../AUDIT-RESPONSE.md`](../AUDIT-RESPONSE.md) with the reasoning, and the
areas it touched:

| Area | What happened |
|---|---|
| `server/src/controllers/worker.controller.ts` | Every id lookup scoped by company; three defects fixed that the audit had not found |
| `server/src/config/`, `server/src/middleware/` | Environment validated at startup; error handling moved out of `app.ts` |
| `server/src/routes/auth.routes.ts` | Rate limiting; responses no longer reveal which addresses are registered |
| `server/src/tests/` | The suite, from nothing to 63 tests |
| `.github/workflows/` | Checks on every pull request; releases by tag; mobile publishing behind a gate |

## Unfinished, in the order I would pick it up

1. **Four product defects** listed under "Known defects" in
   [`../CONTRIBUTING.md`](../CONTRIBUTING.md). Truncated hours is the one that
   costs people money.
2. **No end-to-end tests.** Nothing drives a browser through a full manager
   and worker journey.
3. **`client/src/pages/ManagerShiftsPage.tsx`** is around 1100 lines. It needs
   splitting, and it needs the end-to-end tests first — otherwise the split
   breaks things quietly.
4. **101 capped lint warnings** in the client, mostly `any`. The cap in
   `client/package.json` only moves down.
5. **No transactions** on the two-collection writes — see
   [decision 4](decisions/0004-defer-transactions.md).
6. **The mobile app has no tests** and is not released to anyone.

## Before changing anything

Read [`../CONTRIBUTING.md`](../CONTRIBUTING.md) for the rules that are easy to
break by accident, and [`decisions/`](decisions/) for why things that look odd
are the way they are — particularly company scoping, the 404, and the frozen
lint budget.

## Outside the repository

Two settings are not in version control and have to stay switched on: branch
protection requiring the three checks on `main`, and the `mobile-production`
environment the OTA workflow publishes through.
