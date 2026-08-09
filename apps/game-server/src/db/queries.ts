import type { Pool } from 'pg';
import type { MeteorCategory, ResonanceResponseType } from '@afterlight/shared-types';

export interface DbPlayer {
  userId: string;
  playerId: string;
}

export interface DbMeteor {
  meteorId: string;
  category: MeteorCategory;
  content: string;
  x: number;
  y: number;
  playerId: string;
}

export interface DbStar {
  starId: string;
  meteorId: string;
  x: number;
  y: number;
}

export async function getOrCreatePlayer(
  pool: Pool,
  sessionToken: string,
  x: number,
  y: number,
): Promise<DbPlayer> {
  const userRes = await pool.query<{ id: string }>(
    `INSERT INTO users (session_token, last_seen_at)
     VALUES ($1, NOW())
     ON CONFLICT (session_token) DO UPDATE SET last_seen_at = NOW()
     RETURNING id`,
    [sessionToken],
  );
  const userId = userRes.rows[0].id;

  const playerRes = await pool.query<{ id: string }>(
    `INSERT INTO players (user_id, position_x, position_y)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [userId, x, y],
  );
  return { userId, playerId: playerRes.rows[0].id };
}

export async function createMeteor(
  pool: Pool,
  playerId: string,
  category: MeteorCategory,
  content: string,
  x: number,
  y: number,
): Promise<DbMeteor> {
  const res = await pool.query<{ id: string }>(
    `INSERT INTO meteors (player_id, category, content, status, safety_status, position_x, position_y, published_at)
     VALUES ($1, $2, $3, 'published', 'safe', $4, $5, NOW())
     RETURNING id`,
    [playerId, category, content, x, y],
  );
  return { meteorId: res.rows[0].id, category, content, x, y, playerId };
}

export async function getActiveMeteors(pool: Pool): Promise<DbMeteor[]> {
  const res = await pool.query<{
    id: string;
    category: MeteorCategory;
    content: string;
    position_x: number;
    position_y: number;
    player_id: string;
  }>(
    `SELECT id, category, content, position_x, position_y, player_id
     FROM meteors
     WHERE status = 'published'`,
  );
  return res.rows.map((r) => ({
    meteorId: r.id,
    category: r.category,
    content: r.content,
    x: r.position_x,
    y: r.position_y,
    playerId: r.player_id,
  }));
}

export async function getMeteorOwner(
  pool: Pool,
  meteorId: string,
): Promise<string | null> {
  const res = await pool.query<{ player_id: string }>(
    `SELECT player_id FROM meteors WHERE id = $1 AND status = 'published'`,
    [meteorId],
  );
  return res.rows[0]?.player_id ?? null;
}

export async function createResonance(
  pool: Pool,
  meteorId: string,
  playerId: string,
  responseType: ResonanceResponseType,
): Promise<void> {
  await pool.query(
    `INSERT INTO resonances (meteor_id, player_id, response_type)
     VALUES ($1, $2, $3)`,
    [meteorId, playerId, responseType],
  );
}

export async function createStar(
  pool: Pool,
  meteorId: string,
  x: number,
  y: number,
): Promise<DbStar> {
  await pool.query(
    `UPDATE meteors SET status = 'star' WHERE id = $1`,
    [meteorId],
  );
  const res = await pool.query<{ id: string }>(
    `INSERT INTO stars (meteor_id, position_x, position_y)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [meteorId, x, y],
  );
  return { starId: res.rows[0].id, meteorId, x, y };
}

export async function addLightTransaction(
  pool: Pool,
  playerId: string,
  meteorId: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO light_transactions (player_id, amount, reason, reference_type, reference_id)
     VALUES ($1, 1, 'meteor_acknowledgment', 'meteor', $2)`,
    [playerId, meteorId],
  );
}

export async function getActiveStars(pool: Pool): Promise<DbStar[]> {
  const res = await pool.query<{
    id: string;
    meteor_id: string;
    position_x: number;
    position_y: number;
  }>(`SELECT id, meteor_id, position_x, position_y FROM stars`);
  return res.rows.map((r) => ({
    starId: r.id,
    meteorId: r.meteor_id,
    x: r.position_x,
    y: r.position_y,
  }));
}
