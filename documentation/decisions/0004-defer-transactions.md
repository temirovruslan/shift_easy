# 4. Defer transactions on the two-collection writes

## Context

`assignWorker` and `createWorker` write to both the user and the site
document. If the second write fails, the link exists on one side only: a
worker who lists a site the site does not list back.

MongoDB transactions require a replica set. The test suite runs against
`mongodb-memory-server`, which would need reconfiguring as a replica set, and
production runs on Atlas where they are available.

## Decision

Not now. Both operations validate everything before writing anything, so the
common failure — a bad or foreign id — is refused before either write. What
remains is the rarer case of an infrastructure failure between two successful
validations.

## Consequences

- A partial link is possible and undetected. It is recorded in the
  contributor guide rather than left to be rediscovered.
- Closing an access hole came first. This is the honest reason, not an
  argument that transactions do not matter.
