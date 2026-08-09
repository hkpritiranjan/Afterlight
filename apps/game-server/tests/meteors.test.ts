import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../src/server';
import { PROTOCOL_VERSION } from '@afterlight/protocol';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  MeteorCreatedPayload,
  StarCreatedPayload,
  LightEarnedPayload,
  NotificationHeardPayload,
  ErrorPayload,
  WorldSnapshotPayload,
} from '@afterlight/protocol';

// ── Mock the DB so these tests run without Docker ─────────────────────────────
vi.mock('../src/db/client', () => ({ pool: {} }));

vi.mock('../src/db/queries', () => ({
  getOrCreatePlayer: vi.fn().mockImplementation((_pool, sessionToken) =>
    Promise.resolve({ userId: `user-${sessionToken}`, playerId: `player-${sessionToken}` }),
  ),
  createMeteor: vi.fn().mockImplementation(
    (_pool, _playerId, category, content, x, y) =>
      Promise.resolve({
        meteorId: 'meteor-abc',
        category,
        content,
        x,
        y,
        playerId: _playerId,
      }),
  ),
  getActiveMeteors: vi.fn().mockResolvedValue([
    { meteorId: 'meteor-abc', category: 'burden', content: 'test', x: 1920, y: 1440, playerId: 'player-token-1' },
  ]),
  getActiveStars: vi.fn().mockResolvedValue([]),
  getMeteorOwner: vi.fn().mockImplementation((_pool, meteorId) =>
    meteorId === 'meteor-abc' ? Promise.resolve('player-token-1') : Promise.resolve(null),
  ),
  createResonance: vi.fn().mockResolvedValue(undefined),
  createStar: vi.fn().mockResolvedValue({ starId: 'star-xyz', meteorId: 'meteor-abc', x: 1920, y: 1440 }),
  addLightTransaction: vi.fn().mockResolvedValue(undefined),
}));

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

describe('meteor lifecycle', () => {
  let port: number;
  let clients: TestClient[] = [];

  beforeAll(async () => {
    const { httpServer } = createApp();
    await new Promise<void>((r) => httpServer.listen(0, r));
    const addr = httpServer.address();
    port = typeof addr === 'object' && addr !== null ? addr.port : 0;
  });

  afterAll(() => { clients.forEach((c) => c.disconnect()); });

  function connect(): Promise<TestClient> {
    const c = makeClient(port);
    clients.push(c);
    return new Promise((resolve, reject) => {
      c.on('connect', () => resolve(c));
      c.on('connect_error', reject);
      c.connect();
    });
  }

  it('high_risk content is blocked and never broadcast', async () => {
    const c = await connect();
    await joinClient(c, 'token-1');

    const errorP = new Promise<ErrorPayload>((resolve) => c.once('error', resolve));
    let broadcast = false;
    c.on('meteor:created', () => { broadcast = true; });

    c.emit('meteor:create', { category: 'burden', content: 'I want to kill myself.' });

    const err = await errorP;
    expect(err.code).toBe('CONTENT_BLOCKED');
    await new Promise((r) => setTimeout(r, 80));
    expect(broadcast).toBe(false);
  });

  it('safe content is broadcast to all clients as meteor:created', async () => {
    const c1 = await connect();
    await joinClient(c1, 'token-2');

    const c2 = await connect();
    await joinClient(c2, 'token-3');

    const createdP = new Promise<MeteorCreatedPayload>((resolve) => c2.once('meteor:created', resolve));
    c1.emit('meteor:create', { category: 'hope', content: 'Tomorrow will be lighter.' });

    const created = await createdP;
    expect(created.meteorId).toBeTruthy();
    expect(created.category).toBe('hope');
    expect(created.content).toBe('Tomorrow will be lighter.');
    expect(typeof created.position.x).toBe('number');
  });

  it('player cannot acknowledge their own meteor', async () => {
    const c = await connect();
    await joinClient(c, 'token-1'); // same token as meteor owner

    const errorP = new Promise<ErrorPayload>((resolve) => c.once('error', resolve));
    c.emit('meteor:acknowledge', { meteorId: 'meteor-abc', responseType: 'i_feel_this_too' });

    const err = await errorP;
    expect(err.code).toBe('OWN_METEOR');
  });

  it('valid acknowledgment: star:created broadcast, acknowledger gets light:earned', async () => {
    const c1 = await connect(); // meteor owner (token-1)
    await joinClient(c1, 'token-1');

    const c2 = await connect(); // acknowledger (token-4, different from owner)
    await joinClient(c2, 'token-4');

    const starP = new Promise<StarCreatedPayload>((resolve) => c2.once('star:created', resolve));
    const lightP = new Promise<LightEarnedPayload>((resolve) => c2.once('light:earned', resolve));

    c2.emit('meteor:acknowledge', { meteorId: 'meteor-abc', responseType: 'i_feel_this_too' });

    const [star, light] = await Promise.all([starP, lightP]);
    expect(star.meteorId).toBe('meteor-abc');
    expect(light.amount).toBe(1);
    expect(light.reason).toBe('meteor_acknowledgment');
  });

  it('writer receives notification:heard when another player acknowledges', async () => {
    // Use tokens that are unique to this test so the reverse map points to THIS c1
    const ownerToken = 'owner-notif-unique';
    const { getMeteorOwner } = await import('../src/db/queries');
    vi.mocked(getMeteorOwner).mockResolvedValueOnce(`player-${ownerToken}`);

    const c1 = await connect();
    await joinClient(c1, ownerToken);

    const c2 = await connect();
    await joinClient(c2, 'acker-notif-unique');

    const heardP = new Promise<NotificationHeardPayload>((resolve) => c1.once('notification:heard', resolve));
    c2.emit('meteor:acknowledge', { meteorId: 'meteor-abc', responseType: 'you_are_not_alone' });

    const heard = await heardP;
    expect(heard.meteorId).toBe('meteor-abc');
    expect(heard.message).toBe('Someone heard you.');
  });

  it('duplicate acknowledgment is rejected', async () => {
    // Make createResonance throw a PostgreSQL unique violation on second call
    const { createResonance } = await import('../src/db/queries');
    const pgError = Object.assign(new Error('duplicate'), { code: '23505' });
    vi.mocked(createResonance).mockRejectedValueOnce(pgError);

    const c = await connect();
    await joinClient(c, 'token-6');

    const errorP = new Promise<ErrorPayload>((resolve) => c.once('error', resolve));
    c.emit('meteor:acknowledge', { meteorId: 'meteor-abc', responseType: 'i_feel_this_too' });

    const err = await errorP;
    expect(err.code).toBe('ALREADY_ACKNOWLEDGED');
  });

  it('content longer than 280 chars is rejected', async () => {
    const c = await connect();
    await joinClient(c, 'token-7');

    const errorP = new Promise<ErrorPayload>((resolve) => c.once('error', resolve));
    c.emit('meteor:create', { category: 'moment', content: 'x'.repeat(281) });

    const err = await errorP;
    expect(err.code).toBe('INVALID_CONTENT');
  });
});
