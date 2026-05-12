# ShiftEasy — Build Plan
> Node.js + TypeScript + Express + MongoDB + React
> Approach: feature by feature — backend → Bruno test → frontend

---

## How we build

For every feature:
1. Build backend
2. Test with Bruno
3. Build frontend
4. Test end to end in browser
5. ✅ Move to next feature

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + TypeScript + Express |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcrypt |
| Validation | Zod |
| API testing | Bruno |
| Frontend | React + TypeScript + Vite + Tailwind |
| HTTP client | Axios |
| Email | Nodemailer + Gmail |
| Deploy backend | Render |
| Deploy frontend | Vercel |

---

## Folder structure

```
shifteasy/
├── bruno/              ← API collection, commit to Git
├── server/
│   └── src/
│       ├── config/     ← DB connection
│       ├── models/     ← Mongoose models
│       ├── routes/     ← Express routes
│       ├── controllers/← Business logic
│       ├── middleware/ ← protect, role, validate
│       ├── schemas/    ← Zod validation schemas
│       ├── utils/      ← jwt, hash, email, asyncHandler
│       ├── errors/     ← AppError class
│       ├── app.ts      ← Express setup
│       └── server.ts   ← Entry point
└── client/
    └── src/
        ├── api/        ← axios instance + API calls
        ├── components/ ← reusable UI
        ├── pages/      ← auth / worker / manager
        ├── context/    ← AuthContext
        ├── hooks/      ← useAuth, useShift
        └── types/      ← shared TypeScript types
```

---

## Data models

### User
- name, email, password (hashed)
- role: worker | manager
- company → ref Company
- sites → ref Site[] (worker can have multiple)
- occupation (set by manager)
- isActivated (false until worker sets password)
- inviteToken + inviteTokenExpires (for invite and reset)

### Company
- name
- managers → ref User[]

### Site
- name, address
- company → ref Company
- managers → ref User[]
- workers → ref User[]
- status: active | archived

### Shift
- worker → ref User
- site → ref Site
- company → ref Company
- startTime — **set by server, never client**
- endTime — set by server on stop
- duration — calculated in minutes on stop
- notes — required to stop
- materials — optional
- status: active | completed

---

## API endpoints

### Auth
```
POST /api/auth/register               Manager registers + company + first site
POST /api/auth/login                  Worker or manager
POST /api/auth/activate/:token        Worker sets password from invite link
POST /api/auth/forgot-password        Sends reset email
POST /api/auth/reset-password/:token  Sets new password
```

### Shifts
```
POST /api/shifts/start    Worker — server sets startTime
POST /api/shifts/stop     Worker — notes required
GET  /api/shifts/my       Worker — own history (week/month/all)
GET  /api/shifts          Manager — all shifts, filterable
GET  /api/shifts/:id      Auth — single shift detail
```

### Workers
```
POST   /api/workers/invite         Manager — sends invite email
GET    /api/workers                Manager — list all
GET    /api/workers/:id            Manager — detail + stats
PATCH  /api/workers/:id/sites      Manager — update site assignments
DELETE /api/workers/:id            Manager — remove from company
```

### Sites
```
POST   /api/sites                        Manager — create
GET    /api/sites                        Manager — list with live stats
GET    /api/sites/:id                    Manager — detail + workers
PATCH  /api/sites/:id                    Manager — update name/address
PATCH  /api/sites/:id/archive            Manager — archive (never delete)
POST   /api/sites/:id/assign             Manager — assign worker
DELETE /api/sites/:id/workers/:workerId  Manager — remove worker from site
```

### Dashboard
```
GET /api/dashboard    Manager — live stats
```

---

## Rules to follow always

1. **Server sets timestamps** — startTime and endTime never come from client
2. **Validate first** — Zod runs before any DB operation
3. **Hash before saving** — passwords and tokens always hashed, never plain text
4. **Role from DB** — never trust role from JWT payload alone, always read from DB
5. **Archive never delete** — sites keep shift history when archived
6. **One active shift** — check before allowing a new shift to start
7. **Consistent responses** — success: `{ success: true, data: {} }` / error: `{ success: false, message: "" }`

---

## Feature 0 — Project setup

**Goal:** Server running, DB connected, React running, Bruno ready.

### Backend
- [x] Create root folder `shifteasy/`, create `server/` inside
- [x] Init npm project inside server/
- [x] Install production dependencies: express, mongoose, dotenv, cors, bcryptjs, jsonwebtoken, nodemailer, zod
- [x] Install dev dependencies: typescript, ts-node, nodemon, and all @types
- [ x] Create tsconfig.json — rootDir src, outDir dist, strict true
- [ x] Create nodemon.json — watch src folder, run ts-node
- [x ] Add scripts to package.json: dev, build, start
- [x ] Create .env file with: PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_URL, EMAIL_USER, EMAIL_PASS
- [ x] Create .env.example — same keys but no values (safe to commit)
- [x ] Create src/app.ts — Express setup, cors, json middleware, one health check route
- [x ] Create src/server.ts — connects DB then starts server
- [x ] Create src/config/db.ts — connects to MongoDB, logs success, exits process on failure
- [ x] Test: npm run dev — see both "MongoDB connected" and "Server on port 5000"
- [ x] Bruno: GET /api/health → 200

### Frontend
- [x ] Create client/ with Vite React TypeScript template
- [x ] Install: axios, react-router-dom
- [ x] Install and configure Tailwind CSS
- [x ] Create src/api/axios.ts — axios instance with baseURL from env, interceptor that attaches JWT token to every request
- [x ] Create client/.env — VITE_API_URL pointing to localhost:5000/api
- [x  ] Test: npm run dev — React running on 5173

### Bruno
- [ x ] Create bruno/ folder in root
- [ x ] Open Bruno → New Collection → point to shifteasy/bruno/
- [ x ] Create two environments: local and production
- [ x ] Add health check request as first test

✅ Feature 0 done

---

## Feature 1 — Auth

### 1A — Backend

**Utilities to create:**
- [ x ] `errors/AppError.ts` — custom error class with statusCode and isOperational flag. Extends Error.
- [ x ] `utils/asyncHandler.ts` — wraps async controllers so you don't need try/catch everywhere. Catches errors and passes to next().
- [ x ] `utils/hash.utils.ts` — two functions: hashPassword and comparePassword using bcrypt
- [ x ] `utils/jwt.utils.ts` — two functions: generateToken and verifyToken

**Validation schemas (Zod):**
- [ x ] `schemas/auth.schema.ts`
  - registerSchema: name, email, password (min 8, must have number), companyName, siteName, siteAddress
  - loginSchema: email, password
  - forgotPasswordSchema: email
  - resetPasswordSchema: password + confirmPassword (must match — use .refine)
  - activateSchema: same as resetPasswordSchema

**Middleware:**
- [ x ] `middleware/validate.middleware.ts` — takes a Zod schema, runs safeParse on req.body, returns 400 with field errors if invalid, calls next() if valid
- [ x ] `middleware/protect.middleware.ts` — reads Bearer token from Authorization header, verifies it, finds user in DB, attaches to req.user, calls next()
- [ x ] `middleware/role.middleware.ts` — checks req.user.role === 'manager', returns 403 if not

**Models:**
- [ x ] `models/Company.model.ts` — name, managers array, timestamps
- [ x ] `models/User.model.ts` — all fields from the data model above, timestamps
- [ x ] `models/Site.model.ts` — all fields, timestamps

**Auth controller — one function per endpoint:**
- [ x ] register — create company + manager user + first site in one flow, return JWT
- [ x ] login — find user, compare password, check isActivated, return JWT
- [ x ] activate — find user by hashed token, check not expired, set password, set isActivated true, return JWT
- [ x ] forgotPassword — find user, generate raw token, hash it, save with expiry, send reset email
- [ x ] resetPassword — find user by hashed token, check expiry, set new password, clear token fields

**Why hash the token before saving?**
If the DB is compromised, attacker cannot use the plain token. Same reason we hash passwords.

**Auth routes:**
- [ x ] `routes/auth.routes.ts` — wire all 5 endpoints with correct middleware chain: validate → controller
- [ x ] Register routes in app.ts

**Global error handler:**
- [ x ] Add as last middleware in app.ts
- [ x ] Handle: AppError, Mongoose CastError (bad ObjectId), duplicate key error (11000), JWT errors, unknown errors

### 1B — Bruno tests (Auth)
- [ x ] POST register — valid body → 201 + token
- [ x ] POST register — duplicate email → 409
- [ x ] POST register — missing fields → 400 with field errors
- [ x ] POST login — correct credentials → 200 + token
- [ x ] POST login — wrong password → 401
- [ x ] POST login — non-existent email → 401
- [ x ] POST forgot-password — valid email → 200
- [ x ] POST reset-password — valid token → 200
- [ x ] POST reset-password — expired token → 400
- [ x ] Save manager JWT as Bruno environment variable for use in next features

### 1C — Frontend (Auth)
- [x] `context/AuthContext.tsx` — stores user + token, persists in localStorage, login and logout functions, check token on app mount
- [x] `App.tsx` — setup React Router with public routes, worker routes (role guard), manager routes (role guard)
- [x] Landing page — 3 options: worker sign in, manager sign in, register as manager
- [x] Worker login page — email + password form
- [x] Manager login page — email + password form
- [x] Manager register page — 3 steps (account details → first site → done screen)
- [x ] Activate page — reads token from URL, password + confirm password form
- [ x] Forgot password page — email input
- [x ] Reset password page — password + confirm password
- [x] `api/auth.ts` — one function per endpoint using axios instance

✅ Feature 1 done

---

## Feature 2 — Shifts

### 2A — Backend

**Model:**
- [x ] `models/Shift.model.ts` — all fields from data model, timestamps, add index on (worker + status) for fast active shift lookup

**Validation schemas:**
- [ x] `schemas/shift.schema.ts`
  - startShiftSchema: siteId (valid ObjectId string)
  - stopShiftSchema: notes (min 10 chars — required), materials (optional)

**Shift controller:**
- [ x] startShift — check no active shift exists for worker, check worker is assigned to that site, create shift with startTime set by server
- [x ] stopShift — find active shift, validate notes, calculate duration in minutes, set endTime by server, update status to completed
- [x ] getMyShifts — worker's own shifts, filter by period (week/month/all), populate site name
- [ x] getAllShifts — manager sees all company shifts, filter by workerId/siteId/date range, populate worker name + site name
- [ x] getShift — single shift, check worker is owner or user is manager

**Why server sets startTime and endTime?**
If client sends the time, a worker could fake when they started or stopped. Server timestamp cannot be manipulated.

**Routes:**
- [ x] `routes/shift.routes.ts` — wire all endpoints with protect + role middleware where needed
- [ x] Register in app.ts

### 2B — Bruno tests (Shifts)
- [x ] POST start — valid → 201 with server-set startTime
- [x ] POST start — already have active shift → 400
- [x ] POST start — site not assigned to worker → 403
- [x ] POST stop — no active shift → 400
- [x ] POST stop — missing notes → 400
- [x ] POST stop — valid → 200 with duration calculated
- [x ] GET /shifts/my?period=week → 200 array
- [ x] GET /shifts (manager) → 200 filtered results
- [ x] GET /shifts/:id → 200 single shift

### 2C — Frontend (Shifts)

**Worker:**
- [x ] Home page (no active shift) — greeting, site info card, Start button, stats (week/month), recent shifts list
- [x] Home page (active shift) — live timer display, progress bar, notes + materials form, Stop button
- [x ] Site picker bottom sheet — appears only when worker has 2+ sites assigned
- [x ] `hooks/useShift.ts` — checks for active shift on mount, runs setInterval every second if active, formats elapsed time as HH:MM:SS, cleans up on unmount
- [x ] History page — 3 tabs (this week / this month / all time), each day row is compact with mini bar, tap to expand details, all time drills down by month
- [ ] `api/shifts.ts` — one function per endpoint

**Manager:**
- [ ] Shifts page mobile — filter dropdowns (worker + site), period pills (today/week/custom), shift cards that expand on tap
- [ ] Shifts page desktop — timesheet grid (workers × days), today highlighted, click cell → detail drawer slides in, List view alternative, Export button

✅ Feature 2 done

---

## Feature 3 — Workers

### 3A — Backend

**Email utility:**
- [ ] `utils/email.utils.ts` — setup Nodemailer with Gmail SMTP, create sendInviteEmail and sendPasswordResetEmail functions

**Worker controller:**
- [ ] inviteWorker — validate input, check email not taken, generate raw token, hash it, create user with isActivated false, add to site, send invite email with raw token in URL
- [ ] getWorkers — all workers in company, populate sites, include last shift date and this week hours
- [ ] getWorker — single worker + stats (total shifts, total hours, this week, last shift)
- [ ] updateWorkerSites — update which sites worker is assigned to, sync both worker.sites and site.workers arrays
- [ ] removeWorker — remove from all sites, delete user

**Routes:**
- [ ] `routes/worker.routes.ts` — all manager-only routes
- [ ] Register in app.ts

### 3B — Bruno tests (Workers)
- [ ] POST invite — valid → 201 isActivated: false
- [ ] POST invite — duplicate email → 409
- [ ] POST invite — site not in company → 403
- [ ] GET all workers → 200 array with stats
- [ ] GET single worker → 200 with stats
- [ ] PATCH update sites → 200
- [ ] DELETE worker → 200

### 3C — Frontend (Workers — manager)
- [ ] Workers list — search bar, filter pills (All/Active/Pending/by site), worker cards showing name, occupation, site, hours this week, status badge
- [ ] Worker detail — tap card → stats mini row, full account info, actions (move to site, resend invite, remove)
- [ ] Add worker — bottom sheet on mobile / modal on desktop — manager fills: first name, last name, email, occupation, site
- [ ] `api/workers.ts` — one function per endpoint

✅ Feature 3 done

---

## Feature 4 — Sites

### 4A — Backend

**Site controller:**
- [ ] createSite — create with manager attached, return site
- [ ] getSites — all company sites with live stats per site (on shift count, today hours)
- [ ] getSite — single site with workers populated, stats
- [ ] updateSite — update name or address only (no other fields)
- [ ] archiveSite — set status to archived, do NOT delete — history must be preserved
- [ ] assignWorker — add worker to site.workers and site to worker.sites (check not already assigned)
- [ ] removeWorkerFromSite — remove from both arrays

**Routes:**
- [ ] `routes/site.routes.ts` — all manager-only
- [ ] Register in app.ts

### 4B — Bruno tests (Sites)
- [ ] POST create → 201
- [ ] GET all → 200 with live stats
- [ ] GET single → 200 with workers + stats
- [ ] PATCH update → 200
- [ ] PATCH archive → 200 status: archived
- [ ] POST assign worker → 200
- [ ] DELETE remove worker → 200

### 4C — Frontend (Sites — manager)
- [ ] Sites list — site cards showing name, address, 3 stats (on shift/today hours/workers), worker initials preview, active/archived badge
- [ ] Site detail — mobile: full page with back button / desktop: drawer slides in from right
- [ ] Detail shows: stats, edit name/address inline, worker list with live dots, assign worker, archive button
- [ ] Add site form — just name and address, workers assigned separately
- [ ] `api/sites.ts` — one function per endpoint

✅ Feature 4 done

---

## Feature 5 — Dashboard

### 5A — Backend
- [ ] Dashboard controller — single endpoint, manager only
- [ ] Returns: workers on shift right now (with name + site), total hours today, total workers count, this week total hours, per-site breakdown
- [ ] Use MongoDB aggregation for efficiency — not multiple separate queries

### 5B — Frontend (Dashboard — manager)
- [ ] Mobile dashboard — greeting + SC avatar (tapping opens profile), 4 stat cards, live crew list, weekly bar chart (scroll down), sites overview
- [ ] Desktop dashboard — sidebar nav, stat cards row, left panel (live crew) + right panel (weekly chart) side by side
- [ ] Profile page — accessed by tapping SC avatar, not a nav item

✅ Feature 5 done

---

## Feature 6 — Deploy

### Backend → Render
- [ ] Push server/ to GitHub
- [ ] Create Render account → New Web Service → connect repo
- [ ] Set all environment variables in Render dashboard
- [ ] Set build command and start command
- [ ] Wait for deploy → test health endpoint on live URL
- [ ] Update Bruno production environment with live URL

### Frontend → Vercel
- [ ] Push client/ to GitHub
- [ ] Vercel → import project → connect repo
- [ ] Set VITE_API_URL to Render backend URL
- [ ] Deploy → test live URL

### Pre-CV checklist
- [ ] Full flow works: register → invite worker → worker activates → starts shift → manager sees it live → worker stops → appears in timesheet
- [ ] Password reset flow works end to end
- [ ] Mobile layout correct on real phone
- [ ] Error states handled — wrong password, expired token, no active shift, etc.
- [ ] README.md complete: what the app does, tech stack, live URL, how to run locally
- [ ] Record showcase video: show the problem, demo the app, briefly explain the code

---

## Future (after CV)
- [ ] Jest + Supertest — write API tests
- [ ] Rate limiting — protect login from brute force
- [ ] Refresh tokens — auto-renew JWT
- [ ] HTML email templates
- [ ] CSV / PDF export for manager reports
- [ ] GPS capture on shift start
- [ ] Multiple managers per company
