<!-- FRONTEND -->

- [x] choose font proper

- [x] In main landing page can be PC version as well since the managers are entering from PC frontend

- [x] Doesnt navigate properly

- [x] Fix password doesnt show option IN INPUT frontend to see password user types

- [x] When the worker gets into the manager login accidentally he should be notified

- [x] Resend invite email - fix it doesnt show proper pop up (replaced alert() with inline success/error message)

- [x] Resend invite email to active worker already is a bug — if active, button is now hidden and replaced with "Worker is already active" message

- [x] Edit worker from manager side gives error — now only sends name/email/occupation with trim + validation

- [x] rewrite data fetch in client - react query

- [x] Profile page for manager

- [x] log out btn for manager

- [x] add pagination for workers and others

- [] Add async loading for buttons frontend when user manipulates data (sends some requests etc)

- [] WorkerHomePage.tsx - fix it, now it shows data from first site but should be from recent

- [] if selling app fix hours i put Math.floor instead of toFixed(3) - so now it gives clean number instead of real

- [] In manager site page when click on details active workers are not shown correct

- [] Fix the Shifts manager page grouping might be wrong (logic)

- [] Check all the inputs and make it user friendly

- [] delete my account from managers

<!-- BACKEND -->

- [] Email invitation better layout

- [] User might close app while working and the time should be saved — when they reopen, timer continues from server-side start time

- [] worker can start/stop shift from anywhere (no site assignment required) — COMPLEX, do later

<!-- FUTURE FEATURES -->

- [] GPS verification — worker must be at site location to start shift — COMPLEX, do later

- [] Push notifications — notify manager when a worker starts or stops a shift — COMPLEX, do later

- [] SMS verification for managers

- [] Dashboard stat cards delta indicators — "+1 vs yesterday" on On shift now card, "+8h vs avg" on Total hours today, "On track" on This week card

- [] Manager Shifts page — Custom date range picker

- [] Worker shift history page — worker should see their own past shifts with date, site, duration, notes

- [] Swagger doc logic is incorrect

- [] rewrite in react native

----- Other questions ---------

- [] Data backup — save data daily, ensure company data is never lost if database crashes

- [] Cheating prevention: implement GPS to verify worker is at site when starting shift
