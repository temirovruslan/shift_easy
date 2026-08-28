# 6. Remove the mobile app from this repository

**Supersedes [decision 3](0003-keep-the-mobile-app-gate-its-release.md).**

## Context

Decision 3 argued for keeping the Expo app and removing only its automatic
release, on the grounds that deleting working software to improve a
measurement is the wrong trade. That reasoning still holds, and it is not the
reason for this change.

The app is not part of the product. It was never released, nobody has it
installed, and no roadmap depends on it. What it did do was impose costs on
everything around it: a third build in CI, a third set of environment
examples, a release path nobody uses, and fourteen advisories in the Expo and
Metro toolchain that cannot be cleared without downgrading Expo from 56 to 46
— ten major versions backwards, which is worse than the advisories.

Both other components report no known vulnerabilities. Every remaining one in
this repository came from an application that ships to nobody.

## Decision

`mobile/` is removed, along with the OTA workflow, the mobile CI job and the
mobile entries in the root commands and setup documentation. The repository
is a web client and an API.

Reversing an earlier decision is recorded rather than quietly done. Decision 3
was right about its own question — whether to delete an application to raise a
score — and this is a different question: whether an application belongs in
this repository at all.

## Consequences

- The React Native work is in git history at tag `v1.0.0` and can be recovered
  or moved to its own repository. Nothing is lost, it is relocated.
- Workers use the web client from their phone. The API is unchanged, so
  nothing server-side depends on this.
- If a mobile app is built again it starts in its own repository, with its own
  release path, rather than sharing a pipeline with the API.
