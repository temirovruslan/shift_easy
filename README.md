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
| Testing | Vitest, React Testing Library |

## Architecture

```
client/     React web app (managers + workers)
server/     Express REST API
mobile/     React Native app (Expo)
```

The API is organised in layers: routes → middleware (auth, role guard, Zod validation) → controllers → Mongoose models. Every request is validated at the schema level before reaching business logic, and errors funnel through a single handler so responses stay consistent.

## Getting Started

**Prerequisites:** Node.js 18+, a MongoDB database

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
cd client
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage
```

Covers authentication and session persistence, route guards, API interceptors, and shared UI components.

## API

Interactive Swagger docs are served at `/api/docs` when the server is running.

| Endpoint | Purpose |
|---|---|
| `/api/auth` | Register, login, activate, password reset |
| `/api/shifts` | Start, stop, and query shifts |
| `/api/site` | Construction site management |
| `/api/worker` | Worker invites and assignment |
| `/api/user` | Current user profile |

## License

ISC
