-- Development seed data
-- Only run against local development databases

-- Seed a test user and player so manual testing doesn't require signup
INSERT INTO users (id, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO players (id, user_id, zone_id, position_x, position_y)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'default', 100, 100)
ON CONFLICT DO NOTHING;
