# Contributing to ShiftEasy

Shift management for construction teams. Managers create sites and invite
workers; workers clock in and out from their phone. Live at
[shifteasy.site](https://shifteasy.site).

## Layout

```
server/     Express REST API, MongoDB via Mongoose      — the source of truth
client/     React web app for managers and workers      — the product people use
mobile/     React Native (Expo) app                     — prototype, unreleased
```

`server/` decides what is allowed. The two clients are separate consumers of
the same API, so an API change is a change to both.

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
| mobile | `npm --prefix mobile run typecheck` | — | none yet |

CI runs exactly these. A change is not done until `npm run verify` passes.

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

## Known state

- `client/` carries 101 linter warnings, capped in `package.json` so the count
  can only fall. Do not raise the cap.
- `mobile/` has no tests and is not released to anyone. OTA publishing is
  manual and gated.
- `assignWorker` and `createWorker` write to two collections without a
  transaction.
- `client/src/pages/ManagerShiftsPage.tsx` is about 1100 lines and mixes
  queries, filters, modal state and rendering. Extract from it when touching
  it; do not rewrite it wholesale as a side errand.
