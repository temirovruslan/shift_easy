# 1. A record lookup that is not scoped by company is a bug

## Context

Every user belongs to a company. `protect` proves the caller is signed in and
`requireManager` proves they hold the manager role. Neither proves the record
in the URL is theirs. Five worker endpoints loaded a record by id alone, and a
manager of one company could read, rename, archive, restore or re-invite a
worker belonging to another.

`site.controller.ts` already did this correctly. The rule existed; one file
had drifted from it.

## Decision

Any query that loads a record by id also constrains it by
`company: req.user.company`. Where more than one endpoint needs the same
lookup, it goes through a single helper — `findCompanyWorker` — so the rule is
in one place rather than repeated at each call site.

A record that belongs to another company answers **404, not 403**. A 403 says
the record exists and is not yours, which answers the question an attacker is
asking. Missing and out-of-company records are indistinguishable from outside.

## Consequences

- Tests must attack across company lines and pair each attempt with the same
  call against the caller's own record, or the suite passes by answering 404
  to everyone.
- New endpoints that take an id are wrong by default until scoped.
