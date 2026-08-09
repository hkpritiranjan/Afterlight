-- Stage 3: anonymous session tokens
-- Adds a session_token to users so players can reconnect without auth.
-- Adds a unique constraint on players.user_id (one player row per user for now).

ALTER TABLE users ADD COLUMN IF NOT EXISTS session_token TEXT UNIQUE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'players_user_id_unique'
  ) THEN
    ALTER TABLE players ADD CONSTRAINT players_user_id_unique UNIQUE (user_id);
  END IF;
END $$;
