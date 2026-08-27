# Response to the ShiftEasy audit

Twenty-six commits across seven branches, in priority order. Every branch builds
on the previous one, so they are reviewed and merged in the order listed.

`npm run verify` at the repository root typechecks all three applications,
lints the client and runs 90 tests. It passes on every commit.

| # | Branch | Commits | What it addresses |
|---|---|---|---|
| 1 | `docs/scrub-operational-details` | 2 | Operational data in tracked documentation |
| 2 | `fix/worker-company-scope` | 5 | Cross-company access, two bugs the audit did not find |
| 3 | `test/server-integration-suite` | 1 | No server tests at all |
| 4 | `ci/add-pipeline` | 3 | No checks on pull requests, ungated OTA release |
| 5 | `fix/auth-hardening` | 3 | No rate limiting, account enumeration |
| 6 | `refactor/config-and-error-handling` | 2 | Settings compiled into source, 500s for client mistakes |
| 7 | `chore/repo-hygiene` | 9 | Root commands, agent guide, dead code, client advisories, asset cleanup |

## The order, and why

The audit's own priorities were followed with one change. It ranked the OTA
supply chain risk as the single Critical and the company isolation failure as
High. I reversed them.

The OTA risk is real but conditional: it needs a dependency to be compromised
first. The isolation failure needed nothing. Any signed-in manager could read,
archive, restore, rename or re-invite a worker belonging to a different
company, using only that worker's id. It was reachable in production against
real customer data on the day the audit was written.

Both are fixed. Only the order changed.

## What the audit did not find

Three of these came from tracing requests through the layers rather than
reading files in isolation. A static pass sees each file as correct; the
defect is in how they meet.

**`siteId` was silently discarded when creating a worker.**
`worker.routes.ts` attaches `validate(workerSchema)`. `workerSchema` declared
`name`, `email` and `occupation`. The validate middleware assigns
`req.body = result.data`, and Zod strips anything the schema does not declare,
so `siteId` never reached the controller — which reads it to link the worker
to a site. Both clients send it.

The user-visible result: a manager fills in the create form, picks a site, and
gets a success message. The worker is assigned to nothing, and later cannot
start a shift, because `startShift` requires the site to be in their `sites`
array. Fixed in `6ddf75a`, with a regression test that ends by starting a
shift as the new worker.

**`PUT /api/worker/:id` did not exist.**
`client/src/api/worker.ts` and `mobile/src/api/manager.ts` both call it, and
the web client has a complete edit form behind it. The route was never
registered and the endpoint was absent from the OpenAPI document. Editing a
worker was broken in both clients, and the failure was invisible because
unrouted paths returned Express's HTML 404 rather than a JSON error. Fixed in
`2f55087`, and the HTML 404 that hid it is fixed in `29c5571`.

**`forgot-password` disclosed which addresses are registered.**
The endpoint used a deliberately vague message, but only on one branch: an
unknown address received `{ success, message }` and a registered one received
`{ success }`. The presence of the field was the answer, so the wording
protected nothing. Sign-in leaked the same information through timing, since
an unknown address returned before bcrypt ran. Both fixed in `73008ea`.

`assignWorker` also had no request validation at all, so `workerIds` was
whatever the client sent — noted in the audit as a scoping problem, but the
missing validation was separate.

**The password policy did not apply to changing a password.** Registration
requires eight characters and a digit. `POST /api/user/change-password` was
mounted without validation, so the rule could be stepped around in two
requests: register under it, then set the password to `1`. The rule had been
written out separately at each endpoint that accepts a password — four copies
in one schema file — which is how a fifth endpoint came to be written without
it. There is one `password` schema now and every door imports it. The same
route also answered `{ seccess: true }`, so a client reading `success` saw a
completed password change as a failure.

## Where I read the evidence differently

**No secrets were ever committed.** The tech health report rated
`documentation/SETUP.md` a High risk, which capped the overall score at 22.
The vulnerabilities report rated the same file Low and stated plainly that no
API keys, passwords or tokens were confirmed. Two reports, three levels apart,
on one file.

The file's first line read `WARNING: This file contains passwords and API
keys`, and it contains neither. Verified across the full history:

```bash
git log --all --diff-filter=A --name-only | grep -iE "(^|/)\.env"
# → server/.env.example only, an empty template

git grep -nIE "xkeysib-[A-Za-z0-9]{20,}|mongodb(\+srv)?://[^ ]*:[^ @]+@" $(git rev-list --all)
# → no matches
```

What did leak is different in kind: account owners, a personal phone number,
dashboard URLs carrying service and project identifiers, and the Atlas cluster
hostname with its replica set name. That is a map of the deployment and a list
of people to phish, not a credential. It is removed in `38653ac`, and no
rotation was required.

**`updateWorker` was less severe than it first appeared.** My own first
reading was that it allowed account takeover: it writes `email`, so rewriting
a worker's address and resending the invite would hand over the account. It
was not reachable — no route was mounted, which the dead code report had
already found as DC-001. So it was a latent vulnerability, not an exploitable
one. The fix is unchanged and the ordering follows from it: the scoping commit
lands before the commit that mounts the route, because mounting it first would
have created the very path described.

## Decisions worth stating

**404 rather than 403 for another company's records.** 403 means the record
exists and is not yours, which is itself the answer to "does this id exist".
Missing and out-of-company records are indistinguishable from outside.

**Assignment fails closed.** If any id in an assign request is not ours, the
whole request is refused rather than applied to the subset that matches. A
half-applied assignment is harder to notice than a rejected one.

**The linter was capped, not cleaned.** Turning ESLint on in CI meant deciding
what to do about 101 existing violations, 80 of them `any`. A gate that is red
on the day it is introduced gets switched off within a week, and clearing 101
by hand would have displaced the security and test work. Those rules are
warnings with the count capped at today's number: the debt is visible in every
run and can only shrink, since one more `any` fails the build. The single
genuine error was fixed rather than capped. The cap belongs at zero and comes
down as batches are cleared.

**OTA publishing is manual now.** The workflow released to installed apps on
every push touching `mobile/`, with no test, no typecheck and nobody deciding.
It is `workflow_dispatch`, behind a verify job and an environment gate, with
`npm ci`, `--ignore-scripts` and a pinned EAS version. Publishing to someone's
phone is a release; a release is something a person starts.

**The mobile app stays.** It is a working prototype with no released users.
Deleting it would raise every score in the audit and remove real work, so the
dangerous part — the automatic pipeline — was removed instead of the code.

## What I did not do

- **No transactions.** `assignWorker` and `createWorker` write to two
  collections; if the second write fails the link is one-sided. Mongo
  transactions need a replica set and the in-memory test server would need
  reconfiguring. Closing the access hole mattered more within the time.
- **No end-to-end tests.** The suites cover the API and client units. Nothing
  drives a browser through a full manager and worker journey.
- **No mobile tests.** Covering three surfaces properly was not achievable
  here. Mobile is typechecked in CI and nothing more.
- **`ManagerShiftsPage.tsx` is still about 1100 lines.** It mixes queries,
  filters, modal state and rendering. Splitting it is a real piece of work and
  a poor thing to attempt without the end-to-end tests that would prove it
  still behaves.
- **Existing files were not renormalised to LF.** `.gitattributes` stops the
  mixture spreading. Renormalising is one command and would have buried every
  other change under a whitespace commit.
- **`check-email` still answers whether an address is registered.** That is
  what the register form uses it for, and removing it means redesigning
  registration in two clients. It is rate limited to 15 per hour per client
  and recorded here as an accepted trade-off rather than an oversight.

## Verifying this

```bash
npm run install:all
npm run verify
```

To watch the tests fail against the original code, put the suite on `main`
without any of the fixes. Only test files, the vitest config and the manifest
that carries the test dependencies are taken across; every source file stays
as it was:

```bash
git checkout main
git checkout test/server-integration-suite -- \
  server/src/tests server/vitest.config.mts \
  server/package.json server/package-lock.json
npm --prefix server ci
npm --prefix server test
```

```
Tests  12 failed | 17 passed (29)
```

Eight failures are cross-company access — GET, PUT, DELETE, restore, invite
and both directions of assign. Four are the dropped `siteId`, including the
one that ends by starting a shift as the newly created worker.

The same files, unchanged, pass on branch 2. That is the whole argument: the
tests were written to fail first.

## On tooling

This work was done with Claude Code. I set the priorities and the scope, made
the decisions recorded above, and reviewed every diff before committing.

The parts that were mine rather than the agent's are the ones worth naming:
reversing the audit's Critical and High, finding the dropped `siteId` and the
unmounted route by tracing requests through the layers, downgrading my own
`updateWorker` finding once I checked reachability, choosing 404 over 403,
choosing to cap the linter rather than clear or ignore it, and deciding the
mobile app stays while its pipeline goes.

I also caught the agent's mistakes: a file rewritten from CRLF to LF that
turned a twenty line change into a four hundred line diff, and a `coverage/`
directory staged into a commit — the exact artefact this audit penalises.
Both are why `git diff --stat` before committing is in `AGENTS.md`.
