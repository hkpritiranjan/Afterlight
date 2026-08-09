# Afterlight

> **You are not the only one under this sky.**

Afterlight is a persistent browser-based multiplayer wellbeing game. Players share anonymous emotional messages as *meteors* in a shared night sky. When another player acknowledges a meteor, it transforms permanently into a *star* — and the writer receives a quiet notification: *Someone heard you.*

## Repository structure

```
apps/
  web/             Next.js 14 web client (port 3000)
  game-server/     Node.js + Socket.IO game server (port 3001)

packages/
  shared-types/    Domain types (MeteorCategory, Position, etc.)
  protocol/        Typed Socket.IO event contracts

database/
  migrations/      SQL migration files (applied automatically by Docker on first start)
```

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- **Docker** and **Docker Compose**

## First-time setup

### 1. Clone the repository

```bash
git clone https://github.com/hkpritiranjan/Afterlight.git
cd Afterlight
```

### 2. Create your environment file

```bash
cp .env.example .env
```

Defaults work for local development — no credentials need changing.

### 3. Install dependencies

```bash
npm install
```

### 4. Start PostgreSQL

```bash
npm run db:up
```

Docker creates the database and runs all migrations in `database/migrations/` automatically on first start.

Confirm it is healthy:

```bash
docker compose ps
# postgres should show "healthy"
```

### 5. Start both dev servers

```bash
npm run dev
```

| Server | URL |
|---|---|
| Web app | http://localhost:3000 |
| Game server | http://localhost:3001 |
| Health check | http://localhost:3001/health |

---

## Playing locally

Open **two browser tabs** at http://localhost:3000.

> Each tab gets its own anonymous identity via `sessionStorage`. Two tabs in the same browser window are treated as two separate players — this is how you test the full multiplayer loop locally.

### Full loop walkthrough

1. **Tab 1** — walk with WASD or arrow keys toward a golden glowing circle
2. **Tab 1** — press **E** when the circle brightens → a form appears
3. **Tab 1** — pick a category (Burden / Moment / Hope / Gratitude), type a message, click Release
4. **Tab 2** — walk toward the colored meteor glow that appeared, press **E**
5. **Tab 2** — pick a response → meteor turns into a star (visible in both tabs)
6. **Tab 2** — sees `✦ 1 Light` appear in the bottom-right corner
7. **Tab 1** — sees **"Someone heard you."** notification at the top

---

## Testing

```bash
# All tests (66 total)
npm run test

# Game server only (47 tests)
npm run test -w apps/game-server

# Web app only (19 tests)
npm run test -w apps/web
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

---

## Database

### Reset to a clean state

```bash
npm run db:reset
```

Destroys the data volume and recreates it. All migrations rerun automatically.

### Manual migration (if volume already existed before a new migration was added)

```bash
docker exec afterlight-postgres-1 psql -U afterlight -d afterlight \
  -f /docker-entrypoint-initdb.d/<migration-file>.sql
```

---

## Environment variables

See `.env.example` for the full list. Key variables:

| Variable | Default | Description |
|---|---|---|
| `GAME_SERVER_PORT` | `3001` | Game server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed origin for Socket.IO |
| `DATABASE_URL` | see file | PostgreSQL connection string |
| `NEXT_PUBLIC_GAME_SERVER_URL` | `http://localhost:3001` | Game server URL (baked into browser bundle) |

---

## Architecture

- The browser is a **presentation client only** — no authoritative state.
- The **game server** owns all world state; the client sends intent, not position.
- **Socket.IO** carries typed, versioned protocol messages (`packages/protocol`).
- **PostgreSQL** is the durable source of truth for meteors, stars, resonances, and Light.

See the [documentation site](https://afterlight-doc.vercel.app) for full architecture and stage roadmap.

---

## Current stage

**Stage 3 — Meteor vertical slice** ✓ Complete

The full emotional core loop works end to end:
- Players share anonymous messages as meteors (Burden / Moment / Hope / Gratitude)
- Safety classifier blocks high-risk content before it reaches the DB
- Meteors persist in PostgreSQL and appear in all connected clients on join
- A different player can acknowledge a meteor with a predefined response
- The meteor transforms into a permanent star (real-time, both clients)
- The acknowledger earns +1 Light
- The original writer receives "Someone heard you."
- Duplicate acknowledgments and self-acknowledgments are rejected
- 66 tests passing · zero TypeScript errors

**Next: Stage 4 — Personal space** (Light inventory, cosmetics, personal garden)
