import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../src/server';
import { PROTOCOL_VERSION } from '@afterlight/protocol';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  GardenPlacedPayload,
  GardenRemovedPayload,
  ErrorPayload,
  WorldSnapshotPayload,
} from '@afterlight/protocol';

vi.mock('../src/db/client', () => ({ pool: {} }));

vi.mock('../src/db/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/db/queries')>();
  return {
    ...actual,
    getOrCreatePlayer: vi.fn().mockImplementation((_pool, sessionToken) =>
      Promise.resolve({ userId: `user-${sessionToken}`, playerId: `player-${sessionToken}` }),
    ),
    getActiveMeteors: vi.fn().mockResolvedValue([]),
    getActiveStars:   vi.fn().mockResolvedValue([]),
    getLightBalance:  vi.fn().mockResolvedValue(5),
    getCatalog: vi.fn().mockResolvedValue([
      { itemId: 'item-stone', name: 'Soft Stone', symbol: 'stone', cost: 1 },
    ]),
    getOwnedItems:    vi.fn().mockResolvedValue([{ itemId: 'item-stone' }]),
    getGardenObjects: vi.fn().mockResolvedValue([]),
    placeGardenObject: vi.fn().mockImplementation(
      (_pool, _playerId, itemId, x, y) =>
        Promise.resolve({ objectId: 'obj-1', itemId, symbol: 'stone', x, y }),
    ),
    removeGardenObject: vi.fn().mockResolvedValue(true),
  };
});

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

function makeClient(port: number): TestClient {
  return ioc(`http://localhost:${port}`, { autoConnect: false, forceNew: true });
}

function joinClient(client: TestClient, token: string): Promise<WorldSnapshotPayload> {
  return new Promise((resolve) => {
    client.once('world:snapshot', resolve);
    client.emit('player:join', { sessionToken: token, protocolVersion: PROTOCOL_VERSION });
  });
}

describe('garden placement', () => {
  let port: number;
  let closeServer: () => Promise<void>;
  let client: TestClient;

  beforeAll(async () => {
    const { httpServer } = createApp();
    await new Promise<void>((r) => httpServer.listen(0, r));
    const addr = httpServer.address();
    port = typeof addr === 'object' && addr !== null ? addr.port : 0;
    closeServer = () => new Promise((r) => httpServer.close(() => r()));
    client = makeClient(port);
    client.connect();
    await joinClient(client, 'token-garden-1');
  });

  afterAll(async () => {
    client?.disconnect();
    await closeServer?.();
  });

  it('garden:place emits garden:placed with correct object', async () => {
    const placed = await new Promise<GardenPlacedPayload>((resolve, reject) => {
      client.once('garden:placed', resolve);
      client.once('error', reject);
      client.emit('garden:place', { itemId: 'item-stone', x: 200, y: 150 });
    });

    expect(placed.object.itemId).toBe('item-stone');
    expect(placed.object.symbol).toBe('stone');
    expect(placed.object.x).toBe(200);
    expect(placed.object.y).toBe(150);
  });

  it('garden:place rejects positions outside garden bounds', async () => {
    const err = await new Promise<ErrorPayload>((resolve) => {
      client.once('error', resolve);
      client.emit('garden:place', { itemId: 'item-stone', x: 9999, y: 9999 });
    });
    expect(err.code).toBe('OUT_OF_BOUNDS');
  });

  it('garden:remove emits garden:removed', async () => {
    const removed = await new Promise<GardenRemovedPayload>((resolve, reject) => {
      client.once('garden:removed', resolve);
      client.once('error', reject);
      client.emit('garden:remove', { objectId: 'obj-1' });
    });
    expect(removed.objectId).toBe('obj-1');
  });

  it('garden:place rejects unowned items', async () => {
    const { placeGardenObject } = await import('../src/db/queries');
    vi.mocked(placeGardenObject).mockRejectedValueOnce(new Error('Item not owned'));

    const err = await new Promise<ErrorPayload>((resolve) => {
      client.once('error', resolve);
      client.emit('garden:place', { itemId: 'item-unowned', x: 100, y: 100 });
    });
    expect(err.code).toBe('ITEM_NOT_OWNED');
  });
});
