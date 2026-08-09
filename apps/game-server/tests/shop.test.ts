import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../src/server';
import { PROTOCOL_VERSION } from '@afterlight/protocol';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ShopBoughtPayload,
  ErrorPayload,
  WorldSnapshotPayload,
} from '@afterlight/protocol';
import { InsufficientLightError, AlreadyOwnedError } from '../src/db/queries';

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
    getLightBalance:  vi.fn().mockResolvedValue(3),
    getCatalog: vi.fn().mockResolvedValue([
      { itemId: 'item-stone',   name: 'Soft Stone',   symbol: 'stone',   cost: 1 },
      { itemId: 'item-lantern', name: 'Paper Lantern', symbol: 'lantern', cost: 2 },
    ]),
    getOwnedItems:    vi.fn().mockResolvedValue([]),
    getGardenObjects: vi.fn().mockResolvedValue([]),
    buyItem:          vi.fn().mockResolvedValue(undefined),
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

describe('shop lifecycle', () => {
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
    await joinClient(client, 'token-shop-1');
  });

  afterAll(async () => {
    client?.disconnect();
    await closeServer?.();
  });

  it('world:snapshot includes lightBalance, catalog, ownedItems, gardenObjects', async () => {
    const client2 = makeClient(port);
    client2.connect();
    const snap = await joinClient(client2, 'token-shop-snap');
    expect(snap.lightBalance).toBe(3);
    expect(snap.catalog).toHaveLength(2);
    expect(snap.ownedItems).toEqual([]);
    expect(snap.gardenObjects).toEqual([]);
    client2.disconnect();
  });

  it('shop:buy emits shop:bought on success', async () => {
    const { getLightBalance } = await import('../src/db/queries');
    vi.mocked(getLightBalance).mockResolvedValueOnce(2); // balance after purchase

    const bought = await new Promise<ShopBoughtPayload>((resolve, reject) => {
      client.once('shop:bought', resolve);
      client.once('error', reject);
      client.emit('shop:buy', { itemId: 'item-stone' });
    });

    expect(bought.item.name).toBe('Soft Stone');
    expect(bought.lightBalance).toBe(2);
  });

  it('shop:buy emits INSUFFICIENT_LIGHT error when balance too low', async () => {
    const { buyItem } = await import('../src/db/queries');
    vi.mocked(buyItem).mockRejectedValueOnce(new InsufficientLightError());

    const err = await new Promise<ErrorPayload>((resolve) => {
      client.once('error', resolve);
      client.emit('shop:buy', { itemId: 'item-lantern' });
    });
    expect(err.code).toBe('INSUFFICIENT_LIGHT');
  });

  it('shop:buy emits ALREADY_OWNED error on duplicate purchase', async () => {
    const { buyItem } = await import('../src/db/queries');
    vi.mocked(buyItem).mockRejectedValueOnce(new AlreadyOwnedError());

    const err = await new Promise<ErrorPayload>((resolve) => {
      client.once('error', resolve);
      client.emit('shop:buy', { itemId: 'item-stone' });
    });
    expect(err.code).toBe('ALREADY_OWNED');
  });

  it('shop:buy emits ITEM_NOT_FOUND for unknown itemId', async () => {
    const err = await new Promise<ErrorPayload>((resolve) => {
      client.once('error', resolve);
      client.emit('shop:buy', { itemId: 'item-does-not-exist' });
    });
    expect(err.code).toBe('ITEM_NOT_FOUND');
  });
});
