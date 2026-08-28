# ShiftEasy

Shift management and time tracking for construction teams. Managers create sites, invite workers by email, and track hours; workers clock in and out from their phone and review their own history.

**Live:** [shifteasy.site](https://shifteasy.site)

## Features

**Managers**
- Register a company and create construction sites
- Invite workers by email; each gets a one-time activation link
- Live dashboard of who is currently on shift
- Monthly timesheets and per-worker hour breakdowns
- Archive sites and workers without losing historical data

**Workers**
- Start and stop shifts from a phone
- See assigned sites and hours worked this week and month
- Full personal shift history

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router |
| Backend | Node.js, Express 5, TypeScript, MongoDB (Mongoose), Zod |
| Auth | JWT with bcrypt password hashing, role-based access control |
| Mobile | React Native (Expo) |
| Email | Brevo transactional email for invites and password resets |
| Testing | Vitest, React Testing Library, Supertest, mongodb-memory-server |
| CI | GitHub Actions — typecheck, lint, test and build on every pull request |

## Architecture

```
client/     React web app (managers + workers)
server/     Express REST API
mobile/     React Native app (Expo) — prototype, not released
```

The API is organised in layers: routes → middleware (auth, role guard, Zod validation) → controllers → Mongoose models. Every request is validated at the schema level before reaching business logic, and errors funnel through a single handler so responses stay consistent.

## Getting Started

**Prerequisites:** Node.js (see `.nvmrc`), a MongoDB database

```bash
npm run install:all   # install every application
npm run verify        # typecheck all three, lint, run every test
```

Individual applications:

```bash
# Backend
cd server
npm install
cp .env.example .env    # fill in MONGO_URI, JWT_SECRET, etc.
npm run dev             # http://localhost:5000

# Frontend
cd client
npm install
npm run dev             # http://localhost:5173
```

### Environment Variables

The server needs a `.env` file (see `.env.example`):

| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `90d` |
| `CLIENT_URL` | Frontend origin, used for CORS and email links |
| `BREVO_API_KEY` | API key for sending invite emails |

The client needs `VITE_API_URL` pointing at the API, e.g. `http://localhost:5000/api`.

## Testing

```bash
npm test                          # server and client
npm --prefix server test          # 53 tests
npm --prefix client test          # 27 tests
```

The server suite runs against an in-memory MongoDB, so it needs no running
database and no Docker. It covers company isolation across every manager
endpoint, the shift lifecycle, invite and registration flows, rate limiting
and error handling. The client suite covers authentication, session
persistence, route guards, API interceptors and shared UI components.

Coverage thresholds are enforced: `npm --prefix server run test:coverage`.

## API

Interactive Swagger docs are served at `/api/docs` when the server is running.

| Endpoint | Purpose |
|---|---|
| `/api/auth` | Register, login, activate, password reset |
| `/api/shifts` | Start, stop, and query shifts |
| `/api/site` | Construction site management |
| `/api/worker` | Worker invites and assignment |
| `/api/user` | Current user profile |

## Documentation

Each document is marked with how far it can be trusted: **current** matches
the code, **design intent** describes what was drawn rather than what ships.

| Document | Status | What it covers |
|---|---|---|
| [Contributing](CONTRIBUTING.md) | current | Layout, domain rules, how to verify a change — start here |
| [Handoff](documentation/handoff.md) | current | Where things stand and what is unfinished |
| [Setup and deployment](documentation/SETUP.md) | current | Running locally, environment variables, deployment targets |
| [Releasing and rolling back](documentation/RELEASING.md) | current | Tagging a release, promoting each component, rolling back |
| [Email](documentation/email-setup.md) | current | How invite and reset mail is sent, and what to check when it stops |
| [Decisions](documentation/decisions/) | current | Why particular choices were made, and what they cost |
| [Data model](documentation/data-model.drawio.xml) | current | Entity diagram, opens in [draw.io](https://app.diagrams.net) |
| [Design documentation](documentation/design-documentation.html) | design intent | Screens and visual language. Not everything drawn is built — see the known defects in [CONTRIBUTING.md](CONTRIBUTING.md), particularly site selection for a worker assigned to several sites |
| [Registration flow](documentation/registration-flow.html) | design intent | The sign-up journey as designed |

The API contract is served at `/api/docs` while the server runs and lives in
`server/src/swagger.json`.

## Contributing

`CONTRIBUTING.md` documents the layout, how to verify a change, and the rules that
are easy to break by accident — company scoping, request validation and
configuration.

## License

ISC
