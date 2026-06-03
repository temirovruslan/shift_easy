<!-- FRONTEND -->
- [] Refactoring
- [] Add async loading for buttons when user sends requests (start/stop shift, save, etc.)

- [] WorkerHomePage.tsx - shows data from first assigned site, should use most recent/active site

- [] If selling app — fix hours display: Math.floor → toFixed(1) for real hours

- [] In manager site page when click on details — active workers are not shown correct

- [] Fix the Shifts manager page grouping logic might be wrong

- [] Delete manager account (backend endpoint + button in profile)

<!-- BACKEND -->

- [] User might close app while working — timer should continue from server-side start time on reopen

- [] Worker can start/stop shift from anywhere (no site assignment required) — COMPLEX, do later

<!-- FUTURE FEATURES -->

- [] GPS verification — worker must be at site location to start shift — COMPLEX, do later

- [] SMS verification for managers

- [] Dashboard stat cards delta indicators — "+1 vs yesterday", "+8h vs avg", "On track"

- [] Manager Shifts page — custom date range picker

- [] Data backup — save data daily, ensure company data is never lost if database crashes

- [] Cheating prevention: GPS to verify worker is at site when starting shift
