# 2. Freeze the existing lint debt instead of clearing or ignoring it

## Context

Turning ESLint on in CI meant deciding what to do about 101 existing
violations in the web client, 80 of them uses of `any`. Clearing them by hand
would have displaced the security and test work this cycle was for. Leaving
the linter out of CI meant new violations would keep arriving unnoticed.

## Decision

The rules behind the existing violations are set to `warn`, and the lint
script caps warnings at the count on the day the pipeline landed. The debt is
visible in every run and can only shrink: one more `any` makes 102 and fails
the build.

The cap comes down whenever a batch is cleared. It belongs at zero.

Rules with no existing violations stay errors. The one genuine error, an
unused parameter, was fixed rather than capped.

## Consequences

- A gate that is red on the day it is introduced gets switched off within a
  week. This one is green and still enforces something.
- Anyone raising the cap has undone the point of it.
