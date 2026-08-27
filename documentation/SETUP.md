# ShiftEasy — Setup & Deployment

Every environment-specific value in this guide is a placeholder. Real values live
in `.env` files (never committed) and in the hosting provider's environment
settings. Account access is kept in a password manager, not in this repository.

---

## Local Development

Prerequisites: Node.js (v18+), npm, a MongoDB database.

### Server

```bash
cd server
npm install
cp .env.example .env    # fill in the values, see the table below
npm run dev             # http://localhost:5000
```

| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `90d` |
| `CLIENT_URL` | Frontend origin, used for CORS and email links |
| `BREVO_API_KEY` | API key for sending invite emails |

### Client

```bash
cd client
npm install
npm run dev             # http://localhost:5173
```

Needs `VITE_API_URL` pointing at the API, e.g. `http://localhost:5000/api`.

### Mobile (Expo)

```bash
cd mobile
npm install
npx expo start
```

---

## Troubleshooting

### `queryTxt ETIMEOUT` on server startup

The network blocks the SRV/TXT DNS lookups that a `mongodb+srv://` URI needs.
Use the non-SRV `mongodb://` connection string from the Atlas UI instead
(Atlas → Connect → Drivers → "Connection string only" → older driver version).
Put it in `MONGO_URI`; no code change is required.

---

## Deployment

| Component | Platform | Configuration lives in |
|---|---|---|
| API | Render | Render → Service → Environment |
| Web client | Vercel | Vercel → Project → Environment Variables |
| Mobile | Expo EAS | `mobile/eas.json` and EAS secrets |
| Database | MongoDB Atlas | Atlas → Database Access / Network Access |
| Transactional email | Brevo | `BREVO_API_KEY` on the API host |
| Domain and DNS | Registrar of record | Registrar control panel |

Service URLs, dashboard links, account owners and credentials are intentionally
not listed here. They belong in the team password manager, together with the
on-call runbook.

### Before going live

- Atlas → Network Access must allowlist only the API host, never `0.0.0.0/0`.
- `JWT_SECRET` must differ between local, staging and production.
- The Brevo sender address must be verified for the production domain.
