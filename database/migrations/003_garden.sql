-- Stage 4: Personal space — item shop, garden placement

-- Light transactions now also track spending (item_purchase)
ALTER TYPE light_reason ADD VALUE IF NOT EXISTS 'item_purchase';

-- Where players place their purchased garden items
CREATE TABLE IF NOT EXISTS garden_objects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id    UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  position_x FLOAT NOT NULL DEFAULT 200,
  position_y FLOAT NOT NULL DEFAULT 200,
  placed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_garden_objects_player_id ON garden_objects(player_id);

-- Catalog: five buyable decorations (idempotent — safe to re-run)
INSERT INTO items (item_type, name, metadata)
VALUES
  ('garden_object', 'Soft Stone',    '{"cost": 1, "symbol": "stone"}'),
  ('garden_object', 'Paper Lantern', '{"cost": 2, "symbol": "lantern"}'),
  ('garden_object', 'Pressed Flower','{"cost": 3, "symbol": "flower"}'),
  ('garden_object', 'Silver Fern',   '{"cost": 4, "symbol": "fern"}'),
  ('garden_object', 'Moonbell',      '{"cost": 5, "symbol": "moonbell"}')
ON CONFLICT DO NOTHING;
