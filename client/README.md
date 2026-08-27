# ShiftEasy — Web Client

React app for [ShiftEasy](https://shifteasy.site): managers run construction
sites, invite workers and read timesheets; workers clock in and out and see
their own hours.

Built with React 19, TypeScript, Vite, Tailwind CSS, TanStack Query and
React Router. Talks to the Express API in [`../server`](../server).

## Run it

```bash
npm install
cp .env.example .env    # point VITE_API_URL at the API
npm run dev             # http://localhost:5173
```

## Checks

```bash
npm run lint            # warnings are capped — the count may only fall
npm test                # 27 tests: auth, session, route guards, API client
npm run build           # typechecks first, then bundles
```

The repository root's `npm run verify` runs all of this together with the
server suite. See [`../AGENTS.md`](../AGENTS.md) for the conventions that
apply across the codebase.
