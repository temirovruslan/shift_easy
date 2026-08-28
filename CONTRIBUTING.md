# Contributing to ShiftEasy

Shift management for construction teams. Managers create sites and invite
workers; workers clock in and out from their phone. Live at
[shifteasy.site](https://shifteasy.site).

## Layout

```
server/     Express REST API, MongoDB via Mongoose      — the source of truth
client/     React web app for managers and workers      — the product people use
```

`server/` decides what is allowed. `client/` is its only consumer.

## Verify a change

From the repository root:

```bash
npm run verify        # typecheck all three, lint the client, run every test
```

Per application:

| Application | Typecheck | Lint | Test |
|---|---|---|---|
| server | `npm --prefix server run typecheck` | — | `npm --prefix server test` |
| client | `npm --prefix client run typecheck` | `npm --prefix client run lint` | `npm --prefix client test` |

CI runs exactly these. A change is not done until `npm run verify` passes.

### What to run for which kind of change

`npm run verify` is always correct. This is the shorter path while working:

| Change | Run | Why |
|---|---|---|
| Web client only | `npm --prefix client run lint && npm --prefix client test && npm --prefix client run build` | `build` typechecks first |
| Server only | `npm --prefix server run lint && npm --prefix server run typecheck && npm --prefix server test` | |
| A schema, route or response shape | `npm run verify` | Two clients consume this API; a server change is a change to both |
| Anything in `.github/` | `npm run verify`, then watch the run on the pull request | Workflow behaviour cannot be checked locally |
| Dependencies | `npm run verify` and `npm audit` in the app you changed | |

If you touched the server and are unsure whether a client depends on it,
assume it does and run everything.

The server suite runs against an in-memory MongoDB, so it needs no running
database and no Docker. First run downloads a mongod binary.

## Rules that matter here

**Company scoping is the security model.** Every user belongs to a company.
`protect` proves someone is signed in and `requireManager` proves they are a
manager — neither proves the record they are asking about is theirs. Any query
that loads a record by id must also constrain it by
`company: req.user.company`, and answer 404, not 403, when it does not match:
403 confirms the record exists. See `findCompanyWorker` in
`server/src/controllers/worker.controller.ts`.

**Validation happens at the route.** Routes attach `validate(schema)` and the
middleware replaces `req.body` with the parsed result, so anything the schema
does not declare is discarded before the controller runs. A field read in a
controller but missing from its schema is always `undefined` — this has
already shipped as a bug once. Request body types come from `z.infer` of the
same schema.

**Configuration is validated at startup.** Read settings from
`server/src/config/env.ts`, never from `process.env`. Adding a setting means
adding it to the schema and to `.env.example`.

**Errors go through `AppError`.** Throw it with a status; the handler in
`server/src/middleware/error.middleware.ts` turns it into a response. Do not
build error responses in controllers.

## Domain rules

Rules the product depends on. Each is enforced in one place and proved by a
test — if you change the rule, the test tells you what else assumed it.

| Rule | Enforced in | Proved by |
|---|---|---|
| A worker has at most one shift running at a time | `shift.controller.ts` `startShift` | `refuses a second active shift` |
| A shift can only start on a site the worker is assigned to | `shift.controller.ts` `startShift` | `refuses a site the worker is not assigned to` |
| Start and end times come from the server, never from the request | `shift.controller.ts` `startShift` / `stopShift` | `completes the shift and records its duration` |
| Stopping a shift requires notes of at least ten characters | `shift.schema.ts` `stopShiftSchema` | `rejects a stop without usable notes` |
| Nothing is deleted — workers are archived, sites change status, shift history survives | `worker.controller.ts`, `site.controller.ts` | `refuses to archive another company's worker` and the site round-trip |
| Every record belongs to a company, and any lookup by id is scoped by it | `findCompanyWorker`, `site.controller.ts` | `worker.isolation.test.ts`, `site.isolation.test.ts` |
| A password must be at least eight characters and contain a digit, everywhere one is set | `schemas/common.ts` `password` | `user.profile.test.ts` |

Changing one of these is a product decision, not a refactor. Record it in
[`documentation/decisions/`](documentation/decisions/).

## Conventions

- Conventional Commits: `type(scope): imperative subject`. The body says why,
  not what.
- One commit, one idea.
- Branches: `fix/`, `feat/`, `chore/`, `ci/`, `test/`, `docs/`.
- Line endings are mixed and `.gitattributes` normalises new work to LF. Check
  `git diff --stat` before committing: a small change showing hundreds of
  changed lines means a tool rewrote the whole file.

## Releasing

Tag `vX.Y.Z` on `main` and push the tag. The release workflow re-verifies
the tagged commit and publishes the built bundles. Promotion and rollback for
each component are documented in
[`documentation/RELEASING.md`](documentation/RELEASING.md).

## Why things are the way they are

Choices that will look arbitrary without their reasoning are recorded in
[`documentation/decisions/`](documentation/decisions/) — company scoping and
the 404, the frozen lint budget, removing the mobile app, and deferring
transactions. Read the relevant one before
undoing something that looks odd.

Picking the project up after someone else? Start with
[`documentation/handoff.md`](documentation/handoff.md).

## Known state

- `client/` carries 101 linter warnings, capped in `package.json` so the count
  can only fall. Do not raise the cap.
- `assignWorker` and `createWorker` write to two collections without a
  transaction.
- `client/src/pages/ManagerShiftsPage.tsx` is about 1100 lines and mixes
  queries, filters, modal state and rendering. Extract from it when touching
  it; do not rewrite it wholesale as a side errand.

### Known defects

Carried over from a scratch list that used to sit in `documentation/`. They
are recorded here rather than dropped: none is fixed, and each one is
something a user can hit.

- ~~**A failed invite email looked like success.**~~ Fixed. Creating a worker
  and inviting them are separate outcomes now: the response carries
  `inviteSent`, the manager is told when the email did not go, and a failed
  resend answers 502 rather than 200.
- ~~**Hours are truncated in the worker's period total.**~~ Fixed. The
  claim as originally written was broader than the defect: per-shift and
  monthly figures always showed minutes. Only the "Total hours" card dropped
  them, and only because five copies of the same formatting had drifted apart.
  There is one now, in `client/src/lib/time.ts`, with tests.
- **A worker assigned to several sites sees the wrong one.**
  `WorkerHomePage.tsx` shows the first site in the array rather than the one
  they are currently working.
- **A closed app loses the running timer.** Elapsed time is tracked in the
  client, so reopening the app restarts the count instead of continuing from
  the `startTime` the server already holds.
- **Grouping on the manager shifts page is unverified.** It was flagged as
  probably wrong and never checked. It has no test.

None of these are covered by the suite. A fix should arrive with the test
that would have caught it.
