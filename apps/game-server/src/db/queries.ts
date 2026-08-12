import type { Pool } from 'pg';
import type { MeteorCategory, ResonanceResponseType, CatalogItem, OwnedItem, GardenObject, GardenSymbol } from '@afterlight/shared-types';

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

// ─── Stage 4: Shop & Garden ──────────────────────────────────────────────────

export async function getLightBalance(pool: Pool, playerId: string): Promise<number> {
  const res = await pool.query<{ balance: string }>(
    `SELECT COALESCE(
       SUM(CASE WHEN reason = 'meteor_acknowledgment' THEN amount ELSE 0 END) -
       SUM(CASE WHEN reason = 'item_purchase'         THEN amount ELSE 0 END),
       0
     ) AS balance
     FROM light_transactions
     WHERE player_id = $1`,
    [playerId],
  );
  return parseInt(res.rows[0].balance, 10);
}

export async function getCatalog(pool: Pool): Promise<CatalogItem[]> {
  const res = await pool.query<{
    id: string;
    name: string;
    metadata: { cost: number; symbol: GardenSymbol };
  }>(
    `SELECT id, name, metadata
     FROM items
     WHERE item_type = 'garden_object'
     ORDER BY (metadata->>'cost')::int`,
  );
  return res.rows.map((r) => ({
    itemId: r.id,
    name: r.name,
    symbol: r.metadata.symbol,
    cost: r.metadata.cost,
  }));
}

export async function getOwnedItems(pool: Pool, playerId: string): Promise<OwnedItem[]> {
  const res = await pool.query<{ item_id: string }>(
    `SELECT item_id FROM player_items WHERE player_id = $1 AND quantity > 0`,
    [playerId],
  );
  return res.rows.map((r) => ({ itemId: r.item_id }));
}

export class InsufficientLightError extends Error {
  constructor() { super('Not enough Light'); this.name = 'InsufficientLightError'; }
}
export class AlreadyOwnedError extends Error {
  constructor() { super('Item already owned'); this.name = 'AlreadyOwnedError'; }
}

export async function buyItem(
  pool: Pool,
  playerId: string,
  itemId: string,
  cost: number,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const balRes = await client.query<{ balance: string }>(
      `SELECT COALESCE(
         SUM(CASE WHEN reason = 'meteor_acknowledgment' THEN amount ELSE 0 END) -
         SUM(CASE WHEN reason = 'item_purchase'         THEN amount ELSE 0 END),
         0
       ) AS balance
       FROM light_transactions
       WHERE player_id = $1
       FOR UPDATE`,
      [playerId],
    );
    const balance = parseInt(balRes.rows[0].balance, 10);
    if (balance < cost) throw new InsufficientLightError();

    const ownRes = await client.query<{ id: string }>(
      `INSERT INTO player_items (player_id, item_id, quantity)
       VALUES ($1, $2, 1)
       ON CONFLICT (player_id, item_id) DO NOTHING
       RETURNING id`,
      [playerId, itemId],
    );
    if (ownRes.rowCount === 0) throw new AlreadyOwnedError();

    await client.query(
      `INSERT INTO light_transactions (player_id, amount, reason, reference_type, reference_id)
       VALUES ($1, $2, 'item_purchase', 'item', $3)`,
      [playerId, cost, itemId],
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getGardenObjects(pool: Pool, playerId: string): Promise<GardenObject[]> {
  const res = await pool.query<{
    id: string;
    item_id: string;
    metadata: { symbol: GardenSymbol };
    position_x: number;
    position_y: number;
  }>(
    `SELECT go.id, go.item_id, i.metadata, go.position_x, go.position_y
     FROM garden_objects go
     JOIN items i ON i.id = go.item_id
     WHERE go.player_id = $1`,
    [playerId],
  );
  return res.rows.map((r) => ({
    objectId: r.id,
    itemId: r.item_id,
    symbol: r.metadata.symbol,
    x: r.position_x,
    y: r.position_y,
  }));
}

export async function placeGardenObject(
  pool: Pool,
  playerId: string,
  itemId: string,
  x: number,
  y: number,
): Promise<GardenObject> {
  // Verify the player owns the item
  const ownRes = await pool.query(
    `SELECT 1 FROM player_items WHERE player_id = $1 AND item_id = $2 AND quantity > 0`,
    [playerId, itemId],
  );
  if (ownRes.rowCount === 0) throw new Error('Item not owned');

  const metaRes = await pool.query<{ metadata: { symbol: GardenSymbol } }>(
    `SELECT metadata FROM items WHERE id = $1`,
    [itemId],
  );
  const symbol = metaRes.rows[0].metadata.symbol;

  const res = await pool.query<{ id: string }>(
    `INSERT INTO garden_objects (player_id, item_id, position_x, position_y)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [playerId, itemId, x, y],
  );
  return { objectId: res.rows[0].id, itemId, symbol, x, y };
}

export async function removeGardenObject(
  pool: Pool,
  objectId: string,
  playerId: string,
): Promise<boolean> {
  const res = await pool.query(
    `DELETE FROM garden_objects WHERE id = $1 AND player_id = $2`,
    [objectId, playerId],
  );
  return (res.rowCount ?? 0) > 0;
}
