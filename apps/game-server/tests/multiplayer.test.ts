import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../src/server';
import { PROTOCOL_VERSION } from '@afterlight/protocol';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  WorldSnapshotPayload,
  PlayerJoinedPayload,
  PlayerMovedPayload,
  PlayerLeftPayload,
} from '@afterlight/protocol';

type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

function makeClient(port: number): TestClient {
  return ioc(`http://localhost:${port}`, { autoConnect: false, forceNew: true });
}

function join(client: TestClient): Promise<WorldSnapshotPayload> {
  return new Promise((resolve) => {
    client.once('world:snapshot', resolve);
    client.emit('player:join', {
      sessionToken: `token-${Math.random()}`,
      protocolVersion: PROTOCOL_VERSION,
    });
  });
}

describe('multiplayer socket integration', () => {
  let port: number;
  let clients: TestClient[] = [];

  beforeAll(async () => {
    const { httpServer } = createApp();
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const addr = httpServer.address();
    port = typeof addr === 'object' && addr !== null ? addr.port : 0;
  });

  afterAll(() => {
    clients.forEach((c) => c.disconnect());
  });

  function connect(): Promise<TestClient> {
    const c = makeClient(port);
    clients.push(c);
    return new Promise((resolve, reject) => {
      c.on('connect', () => resolve(c));
      c.on('connect_error', reject);
      c.connect();
    });
  }

  it('joining player receives a world snapshot with their own playerId', async () => {
    const c = await connect();
    const snap = await join(c);
    expect(typeof snap.yourPlayerId).toBe('string');
    expect(snap.yourPlayerId.length).toBeGreaterThan(0);
    expect(Array.isArray(snap.players)).toBe(true);
  });

  it('snapshot includes the joining player themselves', async () => {
    const c = await connect();
    const snap = await join(c);
    const self = snap.players.find((p) => p.playerId === snap.yourPlayerId);
    expect(self).toBeDefined();
    expect(typeof self!.position.x).toBe('number');
    expect(typeof self!.position.y).toBe('number');
  });

  it('second player sees first in their snapshot', async () => {
    const c1 = await connect();
    const snap1 = await join(c1);

    const c2 = await connect();
    const snap2 = await join(c2);

    const c1InSnap = snap2.players.find((p) => p.playerId === snap1.yourPlayerId);
    expect(c1InSnap).toBeDefined();
  });

  it('existing player receives player:joined when a new player connects', async () => {
    const c1 = await connect();
    await join(c1);

    const joinedPromise = new Promise<PlayerJoinedPayload>((resolve) => {
      c1.once('player:joined', resolve);
    });

    const c2 = await connect();
    await join(c2);

    const joined = await joinedPromise;
    expect(joined.playerId).toBeDefined();
    expect(typeof joined.position.x).toBe('number');
  });

  it('player:moved is broadcast to other clients when a player moves', async () => {
    const c1 = await connect();
    await join(c1);

    const c2 = await connect();
    const snap2 = await join(c2);

    const movedPromise = new Promise<PlayerMovedPayload>((resolve) => {
      c2.once('player:moved', resolve);
    });

    c1.emit('player:move', { dx: 1, dy: 0, dt: 0.016, sequence: 1 });

    const moved = await movedPromise;
    expect(moved.playerId).toBeDefined();
    expect(typeof moved.position.x).toBe('number');
  });

  it('player:moved is not sent back to the moving player', async () => {
    const c1 = await connect();
    await join(c1);

    const c2 = await connect();
    await join(c2);

    let selfMoved = false;
    c1.on('player:moved', (payload) => {
      if (payload.playerId === c1.id) selfMoved = true;
    });

    c1.emit('player:move', { dx: 1, dy: 0, dt: 0.016, sequence: 1 });

    await new Promise((r) => setTimeout(r, 100));
    expect(selfMoved).toBe(false);
  });

  it('player:left is broadcast when a player disconnects', async () => {
    const c1 = await connect();
    await join(c1);

    const c2 = await connect();
    const snap2 = await join(c2);

    const leftPromise = new Promise<PlayerLeftPayload>((resolve) => {
      c2.once('player:left', resolve);
    });

    c1.disconnect();

    const left = await leftPromise;
    expect(left.playerId).toBeDefined();
  });

  it('move with invalid magnitude is ignored', async () => {
    const c1 = await connect();
    await join(c1);

    const c2 = await connect();
    await join(c2);

    let badMoveReceived = false;
    c2.on('player:moved', () => { badMoveReceived = true; });

    c1.emit('player:move', { dx: 999, dy: 999, dt: 0.016, sequence: 1 });
    await new Promise((r) => setTimeout(r, 100));
    expect(badMoveReceived).toBe(false);
  });
});
