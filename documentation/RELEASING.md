# Releasing and rolling back

Two components ship independently. The tag is what ties them together: it
names one commit that all three were built and tested from, so "which version
is in production" has an answer.

## Cutting a release

```bash
git checkout main
git pull
npm run verify          # the same checks CI runs
git tag v1.2.0
git push origin v1.2.0
```

Pushing the tag starts `.github/workflows/release.yml`, which re-runs the full
verification on the tagged commit and only then publishes a GitHub release
with the built server and client bundles attached and notes generated from the
commits since the previous tag.

If verification fails, nothing is published. Delete the tag, fix the problem,
tag again:

```bash
git tag -d v1.2.0 && git push origin :refs/tags/v1.2.0
```

Versions follow semver: patch for fixes, minor for features, major for a
change that breaks an API the clients depend on.

## Promotion

Nothing reaches users straight from a merge. Each component is promoted
separately, and each promotion requires the release to exist.

| Component | Promoted by | Gate |
|---|---|---|
| API (Render) | Deploy the tagged commit from the Render dashboard | Release workflow green |
| Web client (Vercel) | Promote the build for the tagged commit | Release workflow green |

## Confirming a deploy

Every component answers the same question differently, but the API has a
check built for it:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://<api-host>/api/health
```

`200` means the process is up **and** reached the database. `503` means it
started but cannot serve — the failure a port check would miss. Anything else
means the deploy did not land.

Point the host's own health check at the same path so a bad deploy is caught
without anyone watching.

## Rolling back

Roll back first, diagnose afterwards. Both paths below return to a version
that was verified when it was built.

**API.** Render keeps previous deploys. Open the service, find the last
deploy that was live and healthy, and use Rollback. If the bad release changed
environment variables, restore those too — a rolled-back build with new
configuration is a third state that was never tested.

**Web client.** Vercel keeps every deployment. Promote the previous one to
production from the dashboard.

**Database.** Migrations are not automated and no release performs one. If a
release needs a schema change, that change must be written so the previous
version of the code still runs against it — otherwise a rollback of the code
is not a rollback of the system.

## After a rollback

Open an issue with the tag that failed, what broke, and what the check that
should have caught it would have looked like. A rollback that produces no test
is a rollback that will happen again.
