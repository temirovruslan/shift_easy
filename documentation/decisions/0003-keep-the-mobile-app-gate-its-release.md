# 3. Keep the mobile app, remove its automatic release

## Context

The mobile app has no tests, hardcoded configuration and no released users.
Every audit dimension it touches scores worse for its presence. Deleting it
would raise those scores immediately.

It also published an over-the-air update to installed apps on every push to
`main` touching `mobile/`, with no test, no typecheck and no person deciding,
while `npm install` resolved dependencies fresh in the same job that holds the
publishing token.

## Decision

The application stays. The automatic pipeline does not.

Releasing is `workflow_dispatch`, behind a verify job and an environment
approval, with `npm ci`, `--ignore-scripts` on the publish step and a pinned
CLI version. CI typechecks the app on every pull request.

## Consequences

- Scores that count the mobile app stay lower than they would if it were
  deleted. Deleting working software to improve a measurement is the wrong
  trade.
- Publishing now requires a person. An OTA update cannot be recalled, only
  replaced, which makes it the strictest of the three release paths.
