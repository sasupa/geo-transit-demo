# geo-transit-demo

A Helsinki transit map demo showcasing PostGIS spatial queries, HSL Digitransit API, MapLibre GL JS, and Docker Compose. Built as a portfolio project demonstrating geo/GIS full-stack skills.

## Stack
- Frontend: React + Vite + MapLibre GL JS
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL 16 + PostGIS
- Data source: HSL Digitransit public API
- Infra: Docker Compose

## Dev commands
- `npm run dev` — docker compose up (PostGIS)
- `cd backend && npm run dev` — backend dev server (ts-node-dev, hot reload)
- `cd backend && npm run seed` — fetch all HSL stops from Digitransit and upsert into PostGIS
- `cd frontend && npm run dev` — Vite dev server

## Ports
- Frontend dev: 5173
- Frontend prod (nginx): 5174
- Backend: 3001
- PostgreSQL+PostGIS: 5435 (avoid conflicts with existing 5432/5433/5434)

## Deploy
- Push to main → GitHub Actions triggers automatically
- Build job: TypeScript typecheck + frontend Vite build
- Deploy job: SSH to server → git pull → docker compose up -d --build
- Server path: /var/www/geo.artmin.fi
- Live URL: https://geo.artmin.fi

## GitHub Secrets required
- `SERVER_HOST` — server IP or hostname
- `SERVER_USER` — SSH username
- `SERVER_SSH_KEY` — private key (ed25519)
