import { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@afterlight/protocol';
import { PROTOCOL_VERSION } from '@afterlight/protocol';
import { pool } from '../db/client';
import {
  getOrCreatePlayer,
  createMeteor,
  getActiveMeteors,
  getActiveStars,
  getMeteorOwner,
  createResonance,
  createStar,
  addLightTransaction,
  getLightBalance,
  getCatalog,
  getOwnedItems,
  buyItem,
  getGardenObjects,
  placeGardenObject,
  removeGardenObject,
  InsufficientLightError,
  AlreadyOwnedError,
} from '../db/queries';
import { classify } from '../safety/classifier';
import { WorldState } from '../game/worldState';

type GameServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const world = new WorldState();

// socket.id → DB player UUID (populated on player:join)
const dbPlayerMap = new Map<string, string>();
// DB player UUID → socket.id (latest connection wins — used for notifications)
const socketByDbPlayer = new Map<string, string>();

export function registerSocketHandlers(io: GameServer): void {
  io.on('connection', (socket: GameSocket) => {
    console.log(`[socket] connected: ${socket.id}`);

    socket.on('player:join', async (payload) => {
      if (payload.protocolVersion !== PROTOCOL_VERSION) {
        socket.emit('error', {
          code: 'VERSION_MISMATCH',
          message: `Expected protocol v${PROTOCOL_VERSION}`,
          retryable: false,
        });
        return;
      }

      const playerId = socket.id;
      socket.data.playerId = playerId;
      socket.data.sessionToken = payload.sessionToken;

      const alreadyInWorld = world.hasPlayer(playerId);
      const pos = world.addPlayer(playerId);

      // Upsert DB player
      let dbPlayerId: string | undefined;
      try {
        const dbPlayer = await getOrCreatePlayer(pool, payload.sessionToken, pos.x, pos.y);
        dbPlayerId = dbPlayer.playerId;
        dbPlayerMap.set(playerId, dbPlayerId);
        socketByDbPlayer.set(dbPlayerId, socket.id);
      } catch (err) {
        console.error('[db] getOrCreatePlayer failed:', err);
        // Continue in degraded mode — movement still works, meteors won't persist
      }

      // Load world state + personal state for snapshot
      let meteors: Awaited<ReturnType<typeof getActiveMeteors>> = [];
      let stars: Awaited<ReturnType<typeof getActiveStars>> = [];
      let lightBalance = 0;
      let catalog: Awaited<ReturnType<typeof getCatalog>> = [];
      let ownedItems: Awaited<ReturnType<typeof getOwnedItems>> = [];
      let gardenObjects: Awaited<ReturnType<typeof getGardenObjects>> = [];
      try {
        if (dbPlayerId) {
          [meteors, stars, lightBalance, catalog, ownedItems, gardenObjects] = await Promise.all([
            getActiveMeteors(pool),
            getActiveStars(pool),
            getLightBalance(pool, dbPlayerId),
            getCatalog(pool),
            getOwnedItems(pool, dbPlayerId),
            getGardenObjects(pool, dbPlayerId),
          ]);
        } else {
          [meteors, stars] = await Promise.all([getActiveMeteors(pool), getActiveStars(pool)]);
        }
      } catch {
        // DB unavailable — send empty snapshot
      }

      socket.emit('world:snapshot', {
        yourPlayerId: playerId,
        players: world.getSnapshot().map((p) => ({
          playerId: p.playerId,
          position: { x: p.x, y: p.y },
        })),
        meteors: meteors.map((m) => ({
          meteorId: m.meteorId,
          category: m.category,
          content: m.content,
          position: { x: m.x, y: m.y },
        })),
        stars: stars.map((s) => ({
          starId: s.starId,
          meteorId: s.meteorId,
          position: { x: s.x, y: s.y },
        })),
        lightBalance,
        catalog,
        ownedItems,
        gardenObjects,
      });

      if (!alreadyInWorld) {
        socket.broadcast.emit('player:joined', {
          playerId,
          position: { x: pos.x, y: pos.y },
        });
        console.log(`[world] player joined: ${playerId} at (${Math.round(pos.x)}, ${Math.round(pos.y)})`);
      }
    });

    socket.on('player:move', (payload) => {
      const playerId = socket.data.playerId;
      if (!playerId) return;

      const mag = Math.sqrt(payload.dx * payload.dx + payload.dy * payload.dy);
      if (!isFinite(mag) || mag > 1.01 || !isFinite(payload.dt)) return;

      const pos = world.movePlayer(playerId, payload.dx, payload.dy, payload.dt);
      if (!pos) return;

      socket.broadcast.emit('player:moved', {
        playerId,
        position: { x: pos.x, y: pos.y },
        sequence: payload.sequence,
      });
    });

    socket.on('meteor:create', async (payload) => {
      const playerId = socket.data.playerId;
      const dbPlayerId = dbPlayerMap.get(socket.id);
      if (!playerId || !dbPlayerId) {
        socket.emit('error', { code: 'NOT_JOINED', message: 'Send player:join first', retryable: false });
        return;
      }

      const content = payload.content.trim();
      if (content.length === 0 || content.length > 280) {
        socket.emit('error', { code: 'INVALID_CONTENT', message: 'Content must be 1–280 characters', retryable: false });
        return;
      }

      const safetyStatus = classify(content);
      if (safetyStatus === 'high_risk') {
        socket.emit('error', {
          code: 'CONTENT_BLOCKED',
          message: 'This content cannot be shared. If you are in crisis, please reach out to a professional.',
          retryable: false,
        });
        console.log(`[safety] blocked high_risk meteor from ${playerId}`);
        return;
      }

      const pos = world.getPlayer(playerId) ?? { x: 1920, y: 1440 };

      try {
        const meteor = await createMeteor(pool, dbPlayerId, payload.category, content, pos.x, pos.y);

        io.emit('meteor:created', {
          meteorId: meteor.meteorId,
          category: meteor.category,
          content: meteor.content,
          position: { x: meteor.x, y: meteor.y },
        });
        console.log(`[world] meteor created: ${meteor.meteorId} by ${playerId}`);
      } catch (err) {
        console.error('[db] createMeteor failed:', err);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to create meteor', retryable: true });
      }
    });

    socket.on('meteor:acknowledge', async (payload) => {
      const playerId = socket.data.playerId;
      const dbPlayerId = dbPlayerMap.get(socket.id);
      if (!playerId || !dbPlayerId) {
        socket.emit('error', { code: 'NOT_JOINED', message: 'Send player:join first', retryable: false });
        return;
      }

      try {
        const ownerDbPlayerId = await getMeteorOwner(pool, payload.meteorId);
        if (!ownerDbPlayerId) {
          socket.emit('error', { code: 'METEOR_NOT_FOUND', message: 'Meteor not found or already a star', retryable: false });
          return;
        }
        if (ownerDbPlayerId === dbPlayerId) {
          socket.emit('error', { code: 'OWN_METEOR', message: 'You cannot acknowledge your own meteor', retryable: false });
          return;
        }

        await createResonance(pool, payload.meteorId, dbPlayerId, payload.responseType);

        // Get meteor position for star placement
        const meteors = await getActiveMeteors(pool);
        const meteor = meteors.find((m) => m.meteorId === payload.meteorId) ?? { x: 1920, y: 1440 };

        const star = await createStar(pool, payload.meteorId, meteor.x ?? 1920, meteor.y ?? 1440);
        await addLightTransaction(pool, dbPlayerId, payload.meteorId);

        // Broadcast transformation
        io.emit('meteor:acknowledged', {
          meteorId: payload.meteorId,
          responseType: payload.responseType,
          transformedAt: new Date().toISOString(),
        });
        io.emit('star:created', {
          starId: star.starId,
          meteorId: star.meteorId,
          position: { x: star.x, y: star.y },
        });

        // Notify acknowledger
        console.log(`[notify] light:earned → ${socket.id}`);
        socket.emit('light:earned', { amount: 1, reason: 'meteor_acknowledgment' });

        // Notify writer ("Someone heard you.")
        const ownerSocketId = socketByDbPlayer.get(ownerDbPlayerId);
        console.log(`[notify] notification:heard → ownerDbId=${ownerDbPlayerId} socket=${ownerSocketId ?? 'NOT_FOUND'}`);
        if (ownerSocketId) {
          io.to(ownerSocketId).emit('notification:heard', {
            meteorId: payload.meteorId,
            message: 'Someone heard you.',
          });
        }

        console.log(`[world] meteor ${payload.meteorId} → star ${star.starId}`);
      } catch (err: unknown) {
        // PostgreSQL unique violation code 23505 = duplicate resonance
        if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === '23505') {
          socket.emit('error', { code: 'ALREADY_ACKNOWLEDGED', message: 'You have already acknowledged this meteor', retryable: false });
          return;
        }
        console.error('[db] meteor:acknowledge failed:', err);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to acknowledge meteor', retryable: true });
      }
    });

    socket.on('player:interact', (_payload) => {
      // Stage 3+
    });

    socket.on('shop:buy', async (payload) => {
      const dbPlayerId = dbPlayerMap.get(socket.id);
      if (!dbPlayerId) {
        socket.emit('error', { code: 'NOT_JOINED', message: 'Send player:join first', retryable: false });
        return;
      }
      try {
        const catalog = await getCatalog(pool);
        const item = catalog.find((c) => c.itemId === payload.itemId);
        if (!item) {
          socket.emit('error', { code: 'ITEM_NOT_FOUND', message: 'Item not found', retryable: false });
          return;
        }
        await buyItem(pool, dbPlayerId, payload.itemId, item.cost);
        const newBalance = await getLightBalance(pool, dbPlayerId);
        socket.emit('shop:bought', { item, lightBalance: newBalance });
        console.log(`[shop] ${dbPlayerId} bought ${item.name} for ${item.cost} Light`);
      } catch (err) {
        if (err instanceof InsufficientLightError) {
          socket.emit('error', { code: 'INSUFFICIENT_LIGHT', message: 'Not enough Light', retryable: false });
          return;
        }
        if (err instanceof AlreadyOwnedError) {
          socket.emit('error', { code: 'ALREADY_OWNED', message: 'You already own this item', retryable: false });
          return;
        }
        console.error('[db] shop:buy failed:', err);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to purchase item', retryable: true });
      }
    });

    socket.on('garden:place', async (payload) => {
      const dbPlayerId = dbPlayerMap.get(socket.id);
      if (!dbPlayerId) {
        socket.emit('error', { code: 'NOT_JOINED', message: 'Send player:join first', retryable: false });
        return;
      }
      const GARDEN_W = 700, GARDEN_H = 450;
      if (payload.x < 0 || payload.x > GARDEN_W || payload.y < 0 || payload.y > GARDEN_H) {
        socket.emit('error', { code: 'OUT_OF_BOUNDS', message: 'Position outside garden', retryable: false });
        return;
      }
      try {
        const obj = await placeGardenObject(pool, dbPlayerId, payload.itemId, payload.x, payload.y);
        socket.emit('garden:placed', { object: obj });
      } catch (err) {
        if (err instanceof Error && err.message === 'Item not owned') {
          socket.emit('error', { code: 'ITEM_NOT_OWNED', message: 'You do not own this item', retryable: false });
          return;
        }
        console.error('[db] garden:place failed:', err);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to place item', retryable: true });
      }
    });

    socket.on('garden:remove', async (payload) => {
      const dbPlayerId = dbPlayerMap.get(socket.id);
      if (!dbPlayerId) {
        socket.emit('error', { code: 'NOT_JOINED', message: 'Send player:join first', retryable: false });
        return;
      }
      try {
        const removed = await removeGardenObject(pool, payload.objectId, dbPlayerId);
        if (removed) socket.emit('garden:removed', { objectId: payload.objectId });
      } catch (err) {
        console.error('[db] garden:remove failed:', err);
        socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to remove item', retryable: true });
      }
    });

    socket.on('disconnect', (reason) => {
      const playerId = socket.data.playerId;
      if (playerId) {
        world.removePlayer(playerId);
        const dbId = dbPlayerMap.get(playerId);
        if (dbId && socketByDbPlayer.get(dbId) === socket.id) {
          socketByDbPlayer.delete(dbId);
        }
        dbPlayerMap.delete(playerId);
        io.emit('player:left', { playerId });
        console.log(`[world] player left: ${playerId} reason=${reason}`);
      }
    });
  });
}
