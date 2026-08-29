# 7. Accept SonarQube's browser storage finding rather than contort the code

## Context

SonarQube reports `tssecurity:S8475`, "browser storage should not be
poisoned", against the line in `AuthContext` that persists the signed-in
user. Its taint engine traces the value from the API response — which it
treats as untrusted, as it treats any remote response — to `localStorage`,
and does not recognise the validation in between as a sanitiser.

The validation is real. The role is checked against an allowlist, the name
must be a non-empty string, the stored object is an explicit projection so
nothing else in a response is persisted, and the length is capped. What the
engine wants and does not get is content filtering on the name.

## Decision

The finding is accepted, not fixed further, and marked as such in SonarQube
with a link to this record.

A person's name is arbitrary text. It contains letters from any script,
apostrophes, hyphens, spaces. Any character allowlist tight enough to satisfy
a taint engine will reject somebody's real name, and the failure mode is that
they cannot stay signed in. That is a worse outcome than the finding.

What actually protects the rendered value is React escaping it, which it does
everywhere this name appears. The remaining exposure requires our own API to
return hostile content, and if that has happened there are larger problems
than a string in `localStorage`.

## Consequences

- SonarQube shows one accepted security finding rather than zero. The
  justification is in the tool, next to the issue, not only here.
- If a render path is ever added that bypasses React's escaping —
  `dangerouslySetInnerHTML`, a direct DOM write, a URL built from the name —
  this decision stops being valid and the finding becomes real.
- The rest of the validation stays regardless. It is there because a client
  that persists and re-reads whatever it was handed is fragile, not because a
  scanner asked.
