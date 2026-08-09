import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as ioClient, Socket } from 'socket.io-client';
import type { AddressInfo } from 'net';
import type { ServerToClientEvents, ClientToServerEvents } from '@afterlight/protocol';
import { createApp } from '../src/server';

type TestClient = Socket<ServerToClientEvents, ClientToServerEvents>;

describe('Socket.IO gateway', () => {
  let port: number;
  let closeServer: () => Promise<void>;

  beforeAll(async () => {
    const { httpServer } = createApp();
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        port = (httpServer.address() as AddressInfo).port;
        resolve();
      });
    });
    closeServer = () =>
      new Promise((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
  });

  afterAll(async () => {
    await closeServer();
  });

  function makeClient(): TestClient {
    return ioClient(`http://localhost:${port}`, {
      autoConnect: false,
      reconnection: false,
    });
  }

  it('a client can connect to the server', async () => {
    const client = makeClient();
    await new Promise<void>((resolve, reject) => {
      client.on('connect', resolve);
      client.on('connect_error', reject);
      client.connect();
    });
    expect(client.connected).toBe(true);
    client.disconnect();
  });

  it('a connected client receives its socket id', async () => {
    const client = makeClient();
    await new Promise<void>((resolve, reject) => {
      client.on('connect', resolve);
      client.on('connect_error', reject);
      client.connect();
    });
    expect(typeof client.id).toBe('string');
    expect(client.id!.length).toBeGreaterThan(0);
    client.disconnect();
  });

  it('a client can disconnect cleanly', async () => {
    const client = makeClient();
    await new Promise<void>((resolve, reject) => {
      client.on('connect', resolve);
      client.on('connect_error', reject);
      client.connect();
    });
    expect(client.connected).toBe(true);

    await new Promise<void>((resolve) => {
      client.on('disconnect', () => resolve());
      client.disconnect();
    });
    expect(client.connected).toBe(false);
  });

  it('two clients can connect simultaneously', async () => {
    const [clientA, clientB] = [makeClient(), makeClient()];
    const connect = (c: TestClient) =>
      new Promise<void>((resolve, reject) => {
        c.on('connect', resolve);
        c.on('connect_error', reject);
        c.connect();
      });

    await Promise.all([connect(clientA), connect(clientB)]);
    expect(clientA.connected).toBe(true);
    expect(clientB.connected).toBe(true);
    expect(clientA.id).not.toBe(clientB.id);

    clientA.disconnect();
    clientB.disconnect();
  });
});
