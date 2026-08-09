-- Afterlight initial schema
-- Stage 0: tables created but not yet used by the game server

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE player_status AS ENUM ('active', 'inactive', 'banned');

CREATE TYPE meteor_category AS ENUM ('burden', 'moment', 'hope', 'gratitude');

CREATE TYPE meteor_status AS ENUM (
  'draft',
  'safety_check',
  'published',
  'encountered',
  'acknowledged',
  'star'
);

CREATE TYPE safety_status AS ENUM ('pending', 'safe', 'sensitive', 'high_risk');

CREATE TYPE resonance_response_type AS ENUM (
  'i_feel_this_too',
  'you_are_not_alone',
  'hope_things_get_lighter',
  'one_day_at_a_time',
  'glad_you_shared'
);

CREATE TYPE light_reason AS ENUM ('meteor_acknowledgment');

-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  status      player_status NOT NULL DEFAULT 'active'
);

CREATE TABLE players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  zone_id     TEXT NOT NULL DEFAULT 'default',
  position_x  FLOAT NOT NULL DEFAULT 0,
  position_y  FLOAT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE meteors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  category      meteor_category NOT NULL,
  content       TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 280),
  status        meteor_status NOT NULL DEFAULT 'draft',
  safety_status safety_status NOT NULL DEFAULT 'pending',
  position_x    FLOAT NOT NULL DEFAULT 0,
  position_y    FLOAT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at  TIMESTAMPTZ
);

CREATE TABLE resonances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meteor_id     UUID NOT NULL REFERENCES meteors(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  response_type resonance_response_type NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (meteor_id, player_id)
);

CREATE TABLE stars (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meteor_id   UUID NOT NULL UNIQUE REFERENCES meteors(id) ON DELETE CASCADE,
  position_x  FLOAT NOT NULL DEFAULT 0,
  position_y  FLOAT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE light_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id      UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount         INTEGER NOT NULL CHECK (amount > 0),
  reason         light_reason NOT NULL,
  reference_type TEXT,
  reference_id   UUID,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type   TEXT NOT NULL,
  name        TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE player_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, item_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_meteors_player_id ON meteors(player_id);
CREATE INDEX idx_meteors_status ON meteors(status);
CREATE INDEX idx_resonances_meteor_id ON resonances(meteor_id);
CREATE INDEX idx_light_transactions_player_id ON light_transactions(player_id);
