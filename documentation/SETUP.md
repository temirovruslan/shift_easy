# ShiftEasy — Setup & Deployment

WARNING: This file contains passwords and API keys. Do NOT commit to a public repo.

---

## Local Development

Prerequisites: Node.js (v18+), npm

### Start the Server

cd server
npm install
npm run dev

Runs on http://localhost:5000

If you get "queryTxt ETIMEOUT" on startup, your network blocks SRV/TXT DNS lookups.
Fix: in server/.env, replace the mongodb+srv:// URI with the direct mongodb:// one
(use the shard hosts: cluster0-shard-00-00, -01, -02 at .syrkhcq.mongodb.net:27017
with ?ssl=true&replicaSet=atlas-14dm6y-shard-0&authSource=admin).

### Start the Client

cd client
npm install
npm run dev

Runs on http://localhost:5173

### Start Mobile (Expo)

cd mobile
npm install
npx expo start

---

## Deployment & Accounts

### Backend
Service:   Render.com
URL:       https://shift-easy-api.onrender.com
Project:   shift-easy-api
Account:   temirov.ruslan1995@gmail.com
Dashboard: https://dashboard.render.com/web/srv-d86ni4og4nts73b4bjcg/events

### Frontend
Service:   TBD (Vercel / Netlify / Render)
URL:       TBD
Account:   TBD

### Database
Service:   MongoDB Atlas
Database:  shift_easy
Account:   ruha.petruha95@gmail.com
Cluster:   https://cloud.mongodb.com/v2/69cf347307acaa54cacb1674#/explorer/69cf34b207acaa54cacbadc3/shift_easy/shifts/find
Users:     https://cloud.mongodb.com/v2/69cf347307acaa54cacb1674#/explorer/69cf34b207acaa54cacbadc3/shift_easy/users/find

### Email Service
Service:   Brevo (transactional emails)
Used for:  Worker invite links
Sends from: noreply@shifteasy.site
Account:   ruslan.temirov1995@gmail.com
Phone:     +372 5530939
Dashboard: https://app.brevo.com/profile/information

### Domain
Domain:    shifteasy.site
Registrar: porkbun.com
Account:   ruslan.temirov1995@gmail.com
Panel:     https://porkbun.com/account/domainsSpeedy

### Customer Messages
Email:     temirov.ruslan1995@gmail.com

### Code
GitHub:    github.com/temirovruslan/shift_easy
Branch:    main

### Mobile Builds
Service:   Expo EAS
Account:   TBD
