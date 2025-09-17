# Chat-Savings (Standalone)

This folder contains a portable version of the Savings Chat microservice. It includes:
- Backend (Node/Express) API with no database dependencies
  - Fees calculator with category rates from `backend/cat-rates.csv`
  - Leads stored in `backend/leads.jsonl` flat file
  - Lead export page at `/api/leads/export` and CSV at `/api/leads/export.csv`
- Frontend Angular app exposing the public page at `/savings-chat`

## Requirements
- Node.js 18+ (LTS recommended)
- A server that can serve the Angular build (any static server) and run the Node backend

## Structure
- `backend/` — Express server
- `frontend/` — Angular app

## Setup
1) Backend
```
cd backend
npm install
npm run build
npm start
```
The server will start on port 3001 by default. Endpoints:
- `GET /api/fees/categories` — list categories from CSV
- `POST /api/fees/calc` — quick estimate
- `POST /api/fees/calc-advanced` — advanced estimate
- `POST /api/leads/start` — start a lead
- `PATCH /api/leads/:id` — update a lead
- `GET /api/leads/export` — HTML page to download CSV
- `GET /api/leads/export.csv` — direct CSV export

2) Frontend
```
cd frontend
npm install
npm run build
npm start
```
The frontend starts on port 3000 by default. Public page:
- `/savings-chat`

Configure `frontend/src/environments/environment.prod.ts` and `.ts` to point to your backend URL if different.

## Persistence
- Category rates: edit `backend/cat-rates.csv` and restart backend.
- Leads: saved to `backend/leads.jsonl`. Ensure the process has write permissions.

## Deploying Elsewhere
- Copy the entire `Chat-Savings/` folder to your server.
- Install Node and run both backend and frontend as above (or behind a reverse proxy).
- Optionally serve the Angular `dist/` with Nginx and run backend as a service (PM2/systemd).

## Security Notes
- The leads export endpoints are unauthenticated for simplicity. Restrict access via network rules or proxy auth if needed.
