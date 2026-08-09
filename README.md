# Afterlight

> **You are not the only one under this sky.**

Afterlight is a persistent browser-based multiplayer wellbeing game. This repository contains the full monorepo.

## Repository structure

```
apps/
  web/             Next.js web client (port 3000)
  game-server/     Node.js + Socket.IO game server (port 3001)

packages/
  shared-types/    Domain types (MeteorCategory, Position, etc.)
  protocol/        Typed Socket.IO event contracts

database/
  migrations/      SQL migration files (run by Docker Compose on first start)
  seeds/           Development seed data (run manually)

docs/              Product and architecture documentation
```

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- **Docker** and **Docker Compose**

## First-time setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd Afterlight
```

### 2. Create your environment file

```bash
cp .env.example .env
```

The defaults work for local development. No credentials need to change unless you want a different database password.

### 3. Install dependencies

```bash
npm install
```

### 4. Start PostgreSQL

```bash
npm run db:up
```

The database is created automatically and migrations in `database/migrations/` run on first start.

Wait for the healthcheck to pass:

```bash
docker compose ps
```

## Running locally

### Start everything (web + game server)

```bash
npm run dev
```

- Web app: http://localhost:3000
- Game server: http://localhost:3001
- Health check: http://localhost:3001/health

### Start individually

```bash
# Game server only
npm run dev -w apps/game-server

# Web app only
npm run dev -w apps/web
```

## Verification

After startup, confirm the following:

| Check | Expected |
|---|---|
| `curl http://localhost:3001/health` | `{"status":"ok",...}` |
| Open http://localhost:3000 | Page shows "connected" in green |
| PostgreSQL | `docker compose ps` shows healthy |

## Testing

```bash
# Run all tests
npm run test

# Game server tests only
npm run test -w apps/game-server
```

## Type checking

```bash
npm run typecheck
```

## Linting

```bash
npm run lint
```

## Production build

```bash
npm run build
```

## Database

### Reset the database

```bash
npm run db:reset
```

This destroys the volume and recreates it. Migrations run automatically.

### Apply development seeds

```bash
docker compose exec postgres psql -U afterlight -d afterlight -f /dev/stdin < database/seeds/001_development.sql
```

## Environment variables

See `.env.example` for all available variables. The key ones:

| Variable | Default | Description |
|---|---|---|
| `GAME_SERVER_PORT` | `3001` | Port for the game server |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed origin for Socket.IO |
| `DATABASE_URL` | (see file) | PostgreSQL connection string |
| `NEXT_PUBLIC_GAME_SERVER_URL` | `http://localhost:3001` | Game server URL visible to browser |

## Architecture

See `docs/` for full architecture documentation. Summary:

- The browser is a presentation client only.
- The game server owns all authoritative state.
- Socket.IO carries typed, versioned protocol messages.
- PostgreSQL is the durable source of truth.

## Current stage

**Stage 0 — Foundation** (complete)

Next: Stage 1 — Single-player world (player movement, camera, 2D map).
