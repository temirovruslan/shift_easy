# 5. A multi-site worker gets their first site until selection is built

## Context

The design documentation expects a worker assigned to more than one site to
choose which one they are clocking in to. Both clients take the first entry in
the array instead. The audit found this as a conflict between documentation
and implementation, and it is a real one: a worker on two sites can start a
shift against the wrong one, and the hours land on the wrong site.

Building selection means a UI in two clients, a decision about what happens
when the worker changes their mind mid-shift, and tests for both. That is
product work, not a fix.

## Decision

The current behaviour stands and is written down as a defect rather than
quietly tolerated. The design document is marked "design intent" in the README
index so nobody reads it as a description of what ships, and the defect is
listed in the contributor guide's known defects.

Most workers are assigned to one site, where first-and-only is correct. The
harm is confined to the multi-site case.

## Consequences

- A multi-site worker can log hours against the wrong site, and nothing in the
  product tells them. Managers reading timesheets cannot see it either.
- Whoever builds selection should start from the design document, and should
  write the test for the two-site case first — it is the case that is wrong
  today.
- Until then the documentation and the code disagree on purpose, in one place,
  recorded here.
