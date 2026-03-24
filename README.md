# geo-transit-demo

Helsinki public transit map — real-time stop data from the HSL Digitransit API, spatially indexed in PostGIS and rendered on a MapLibre GL JS map.

**Live:** https://geo.artmin.fi

![screenshot placeholder](docs/screenshot.png)

---

## Features

- **Spatial stop query** — PostGIS `ST_Within` + `ST_MakeEnvelope` returns up to 200 stops within the current map bounding box on every pan/zoom
- **Real-time departures** — click any stop to fetch the next 8 departures from HSL Digitransit GraphQL v2, with live delay data and mode-coloured route badges
- **MapLibre GL JS map** — smooth vector tile rendering via OpenFreeMap, no API key required
- **Auto-center on click** — map pans so the departure popup is always fully visible above the navbar
- **Custom navigation controls** — pan (↑↓←→) and zoom (+/−) overlay, design-system styled

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + MapLibre GL JS (react-map-gl) |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 + PostGIS 3.4 |
| Data source | HSL Digitransit GraphQL API v2 |
| Tiles | OpenFreeMap (liberty style) |
| Infra | Docker Compose + nginx |
| CI/CD | GitHub Actions → SSH deploy |

---

## Architecture

```
Browser
  │
  ▼
Apache (reverse proxy, TLS termination)
  │  geo.artmin.fi → localhost:5174
  ▼
nginx (Docker, port 5174)
  ├─ /            → serves React SPA (frontend/dist)
  └─ /api/*       → proxy_pass → Express backend (port 3001)
                        │
                        ├─ GET /api/stops?bbox=      → PostGIS spatial query
                        └─ GET /api/departures/:id   → HSL Digitransit GraphQL
                                                           │
                                                     PostgreSQL + PostGIS
                                                     (Docker, port 5437)
```

---

## Getting started

### Prerequisites

- Docker Desktop
- Node.js 20+
- A free HSL Digitransit API key — register at https://portal-api.digitransit.fi/

### Setup

```bash
git clone https://github.com/sasupa/geo-transit-demo.git
cd geo-transit-demo

# Start PostGIS
docker compose up -d postgis

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — set DIGITRANSIT_API_KEY
cd backend && npm install && npm run dev
# → http://localhost:3001

# Seed stops from HSL Digitransit (~15 000 stops, takes ~30s)
npm run seed

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

---

## API reference

### `GET /api/stops?bbox=minLng,minLat,maxLng,maxLat`

Returns stops within the bounding box as a GeoJSON FeatureCollection (max 200).

```bash
curl "http://localhost:3001/api/stops?bbox=24.90,60.15,24.98,60.20"
```

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [24.9321, 60.1699] },
      "properties": {
        "gtfs_id": "HSL:1040602",
        "name": "Rautatientori",
        "code": "0040",
        "vehicle_type": null
      }
    }
  ]
}
```

### `GET /api/departures/:gtfsId`

Returns the next 8 departures for a stop from HSL Digitransit GraphQL v2.

```bash
curl "http://localhost:3001/api/departures/HSL:1040602"
```

```json
[
  {
    "route": "M1",
    "headsign": "Kivenlahti via Tapiola",
    "scheduledDeparture": "14:07",
    "realtimeDeparture": "14:08",
    "realtime": true,
    "delay": 1,
    "mode": "SUBWAY"
  }
]
```

---

## Deploy

Pushes to `main` trigger a two-job GitHub Actions pipeline:

1. **build** — TypeScript typecheck (`tsc --noEmit`) + Vite production build
2. **deploy** — SSH into the server, `git pull`, `docker compose up -d --build`

The backend is compiled in a multi-stage Docker build (builder stage installs devDependencies for `tsc`, production stage copies only the compiled `dist/` and omits devDependencies).

### Required GitHub Secrets

| Secret | Value |
|---|---|
| `SERVER_HOST` | Server IP or hostname |
| `SERVER_USER` | SSH username |
| `SERVER_SSH_KEY` | Private key (ed25519) |

---

## Data sources

- **HSL Digitransit API** — https://digitransit.fi/en/developers/ — public transit data for the Helsinki region (HSL). Requires a free API key for v2 endpoints.
- **OpenFreeMap** — https://openfreemap.org — vector tiles based on OpenStreetMap data, free and keyless.
- **OpenStreetMap contributors** — map data © OpenStreetMap contributors, ODbL licence.
